// KV-1 client persistence layer (spec: "all in memory isn't helpful", 07-07 '26).
//
// One interface, two backends:
//   - localStorage mirror: written synchronously on every save - the device never loses
//     work even when the network or KV is down.
//   - /api/state (Vercel KV): debounced write-through keyed by the admin session cookie
//     (owner - cross-device) or an anonymous per-device UUID sent as `x-device-key`.
// Load order: KV wins when it answers (cross-device truth); localStorage is the fallback.
// All functions swallow errors - persistence must never break the app.

const LS_PREFIX = "v3.state.";
const DK_KEY = "v3.deviceKey";

export function deviceKey() {
  try {
    let k = localStorage.getItem(DK_KEY);
    if (!k) {
      k = (crypto && crypto.randomUUID) ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
      localStorage.setItem(DK_KEY, k);
    }
    return k;
  } catch (_) { return null; }
}

function lsGet(scope) {
  try { const raw = localStorage.getItem(LS_PREFIX + scope); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}
function lsSet(scope, value) {
  try { localStorage.setItem(LS_PREFIX + scope, JSON.stringify(value)); } catch (_) {}
}

// Load: local mirror first (instant), then KV (authoritative when it answers).
// onValue may be called twice - second call only if KV returned something different.
export async function loadState(scope, onValue) {
  const local = lsGet(scope);
  if (local != null) { try { onValue(local, "local"); } catch (_) {} }
  try {
    const dk = deviceKey();
    const res = await fetch("/api/state?scope=" + encodeURIComponent(scope), { headers: dk ? { "x-device-key": dk } : {} });
    const data = await res.json();
    if (data && data.ok && data.value != null) {
      const v = data.value.v !== undefined ? data.value.v : data.value;
      lsSet(scope, v);
      if (JSON.stringify(v) !== JSON.stringify(local)) { try { onValue(v, "kv"); } catch (_) {} }
    }
  } catch (_) { /* offline / KV absent - local mirror already delivered */ }
}

const _timers = {};
export function saveState(scope, value) {
  lsSet(scope, value); // never lose work locally
  clearTimeout(_timers[scope]);
  _timers[scope] = setTimeout(() => {
    try {
      const dk = deviceKey();
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json", ...(dk ? { "x-device-key": dk } : {}) },
        body: JSON.stringify({ scope, value }),
      }).catch(() => {});
    } catch (_) {}
  }, 800); // debounce - selections change in bursts
}
