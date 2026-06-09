// v3/src/debug.js — DEBUG MODE capture engine (v3 only; OFF by default).
// Enable with ?debug=1 (sticky for the tab via sessionStorage). When enabled it:
//   • patches window.fetch to capture every same-origin /api/* call (full req+resp bodies),
//   • receives logic steps teed from App.jsx logStep(),
//   • buffers entries per session (keyed by the shared v3_pipe_session id),
//   • stops after 1 min idle (meta:idle_stop) and resumes on next activity (same session),
//   • LOCAL dev: batches to a Vite middleware (/__debug/log) → v3/debug/<session>-<date>.jsonl,
//   • LIVE: keeps everything in-browser; the panel's Download button saves the .jsonl.
// Hard rule: a debug error must NEVER break a real API call. Default OFF = native fetch
// untouched, nothing installed, zero overhead, and no effect on v1/v2.

const SINK = '/__debug/log';
const SS_ENABLED = 'v3_debug_enabled';
const SS_SESSION = 'v3_pipe_session'; // shared with App.jsx so debug rows cross-ref pipeline_logs
const SS_BUFFER = 'v3_debug_buffer';
const BODY_CAP = 256 * 1024;          // per-body char cap (holds full LLM prompts)
const IDLE_MS = 60 * 1000;            // 1 minute (locked)
const FLUSH_MS = 1000;
const MAX_BUFFER = 1000;              // in-memory entries kept for Download
const MIRROR_KEEP = 300;             // sessionStorage mirror cap (resilience)
const TEXTUAL = /json|text|xml|csv|javascript|html|x-ndjson/i;

let enabled = false;
let session = '';
let seq = 0;
let buffer = [];
let outQueue = [];
let flushTimer = null;
let idleTimer = null;
let state = 'active';   // 'active' | 'idle'
let origFetch = null;
const listeners = new Set();

const hasWin = () => typeof window !== 'undefined';
const isDev = () => { try { return !!(import.meta.env && import.meta.env.DEV); } catch (_) { return false; } };
const mono = () => { try { return Math.round(performance.now() * 10) / 10; } catch (_) { return 0; } };
const iso = () => { try { return new Date().toISOString(); } catch (_) { return ''; } };
const rid = () => Math.random().toString(36).slice(2, 10);

function getSession() {
  try {
    let v = sessionStorage.getItem(SS_SESSION);
    if (!v) { v = rid(); sessionStorage.setItem(SS_SESSION, v); }
    return v;
  } catch (_) { return rid(); }
}
function mirror() { try { sessionStorage.setItem(SS_BUFFER, JSON.stringify(buffer.slice(-MIRROR_KEEP))); } catch (_) {} }
function notify() { listeners.forEach((fn) => { try { fn(); } catch (_) {} }); }

// ---- recording ----------------------------------------------------------------
function emit(entry) {
  entry.v = 1; entry.ts = iso(); entry.tMono = mono(); entry.session = session; entry.seq = seq++;
  buffer.push(entry); if (buffer.length > MAX_BUFFER) buffer.shift();
  mirror(); notify();
  if (isDev()) { outQueue.push(entry); scheduleFlush(); }
}
function record(entry) {
  if (!enabled) return;
  try {
    if (state === 'idle' && entry.kind !== 'meta') { state = 'active'; emit({ kind: 'meta', event: 'resume' }); }
    emit(entry);
    if (entry.kind !== 'meta') armIdle();
  } catch (_) {}
}

// ---- idle ---------------------------------------------------------------------
function armIdle() { try { if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(onIdle, IDLE_MS); } catch (_) {} }
function onIdle() {
  idleTimer = null;
  if (state === 'idle') return;
  state = 'idle';
  emit({ kind: 'meta', event: 'idle_stop', idleMs: IDLE_MS });
  flushNow();
}

// ---- local sink (dev only) ----------------------------------------------------
function scheduleFlush() { if (!flushTimer) flushTimer = setTimeout(flushNow, FLUSH_MS); }
function flushNow() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!isDev() || !outQueue.length || !origFetch) return;
  const entries = outQueue.splice(0, outQueue.length);
  try { origFetch(SINK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session, entries }) }).catch(() => {}); } catch (_) {}
}

// ---- fetch capture ------------------------------------------------------------
function readReqBody(input, init) {
  const info = { reqBody: null, reqBodyRaw: null, reqBytes: 0, reqTruncated: false };
  try {
    let str = null;
    if (init && init.body != null) {
      const b = init.body;
      if (typeof b === 'string') str = b;
      else if (typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams) str = b.toString();
      else info.reqBodyRaw = '[binary ' + (b && b.constructor ? b.constructor.name : typeof b) + ']';
    } else if (input && typeof input === 'object' && 'body' in input) {
      info.reqBodyRaw = '[request-stream]';
    }
    if (str != null) {
      info.reqBytes = str.length;
      let s = str;
      if (s.length > BODY_CAP) { s = s.slice(0, BODY_CAP); info.reqTruncated = true; }
      try { info.reqBody = JSON.parse(s); } catch (_) { info.reqBodyRaw = s; }
    }
  } catch (_) {}
  return info;
}
function captureResponse(endpoint, method, start, reqInfo, response) {
  const ms = Math.round(mono() - start);
  const ct = (response.headers && response.headers.get) ? (response.headers.get('content-type') || '') : '';
  const clen = (response.headers && response.headers.get) ? Number(response.headers.get('content-length') || 0) : 0;
  const base = { kind: 'api', endpoint, method, status: response.status, ok: response.ok, ms, ...reqInfo, respBody: null, respBodyRaw: null, respBytes: 0, respTruncated: false, contentType: ct, aborted: false, error: null };
  if ((ct && !TEXTUAL.test(ct)) || (clen && clen > BODY_CAP)) { base.respBodyRaw = '[non-text ' + (ct || '?') + ' ' + (clen || '?') + 'b]'; record(base); return; }
  let clone;
  try { clone = response.clone(); } catch (_) { base.respBodyRaw = '[clone failed]'; record(base); return; }
  clone.text().then((text) => {
    try { base.respBytes = text.length; let s = text; if (s.length > BODY_CAP) { s = s.slice(0, BODY_CAP); base.respTruncated = true; } try { base.respBody = JSON.parse(s); } catch (_) { base.respBodyRaw = s; } } catch (_) {}
    record(base);
  }, () => { base.respBodyRaw = '[read failed]'; record(base); });
}
function recordApiError(endpoint, method, start, reqInfo, err) {
  record({ kind: 'api', endpoint, method, status: 0, ok: false, ms: Math.round(mono() - start), ...reqInfo, respBody: null, respBodyRaw: null, respBytes: 0, respTruncated: false, contentType: '', aborted: !!(err && err.name === 'AbortError'), error: ((err && (err.name + ': ' + err.message)) || 'error').slice(0, 500) });
}
function installFetchPatch() {
  if (!hasWin()) return;
  const native = window.fetch;
  if (native && native.__v3patched) { origFetch = native.__v3orig || native; return; }
  origFetch = native.bind(window);
  const patched = function (input, init) {
    let url, method, pathname;
    try {
      if (input && typeof input === 'object' && 'url' in input) { url = input.url; method = (init && init.method) || input.method || 'GET'; }
      else { url = String(input); method = (init && init.method) || 'GET'; }
      pathname = new URL(url, location.origin).pathname;
    } catch (_) { return origFetch(input, init); }
    if (!enabled || !pathname || pathname.indexOf('/api/') !== 0 || pathname === SINK) return origFetch(input, init);
    const start = mono();
    const reqInfo = readReqBody(input, init);
    let p;
    try { p = origFetch(input, init); } catch (err) { try { recordApiError(pathname, method, start, reqInfo, err); } catch (_) {} throw err; }
    return p.then((response) => { try { captureResponse(pathname, method, start, reqInfo, response); } catch (_) {} return response; },
                  (err) => { try { recordApiError(pathname, method, start, reqInfo, err); } catch (_) {} throw err; });
  };
  patched.__v3patched = true;
  patched.__v3orig = origFetch;
  window.fetch = patched;
}

// ---- public api ---------------------------------------------------------------
export function recordLogic(e) {
  if (!enabled || !e) return;
  record({ kind: 'logic', step: e.step, status: e.status, ms: e.ms, detail: e.detail, role: e.role || '', source: e.source || '' });
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function downloadJsonl() {
  try {
    const text = buffer.map((e) => JSON.stringify(e)).join('\n') + (buffer.length ? '\n' : '');
    const blob = new Blob([text], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `v3-debug-${session}-${iso().replace(/[:.]/g, '-').slice(0, 19)}.jsonl`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 1000);
  } catch (_) {}
}

export function initDebug() {
  if (!hasWin()) return;
  try {
    const p = new URLSearchParams(location.search).get('debug');
    if (p === '1' || p === 'panel') sessionStorage.setItem(SS_ENABLED, '1');
    else if (p === '0') sessionStorage.removeItem(SS_ENABLED);
    enabled = sessionStorage.getItem(SS_ENABLED) === '1';
  } catch (_) { enabled = false; }
  if (!enabled) return; // OFF by default: native fetch untouched, nothing exposed.

  session = getSession();
  try { const m = sessionStorage.getItem(SS_BUFFER); if (m) { buffer = JSON.parse(m) || []; seq = buffer.reduce((mx, e) => Math.max(mx, (e.seq || 0) + 1), 0); } } catch (_) {}
  installFetchPatch();
  emit({ kind: 'meta', event: 'session_start', url: location.href.slice(0, 300), userAgent: (navigator && navigator.userAgent || '').slice(0, 200) });
  armIdle();
  try { window.addEventListener('pagehide', () => { try { if (isDev() && outQueue.length && navigator.sendBeacon) navigator.sendBeacon(SINK, new Blob([JSON.stringify({ session, entries: outQueue.splice(0) })], { type: 'application/json' })); } catch (_) {} }); } catch (_) {}

  window.__v3debug = {
    get enabled() { return enabled; },
    get session() { return session; },
    recordLogic,
    subscribe,
    getBuffer: () => buffer.slice(),
    status: () => ({ enabled, session, state, count: buffer.length }),
    downloadJsonl,
  };
}
