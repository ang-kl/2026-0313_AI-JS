// Admin panel for the v3 LLM proxy. Owner-only, gated by Telegram Login Widget.
// Contract: v3/script/v3-admin-module-spec.md.
//
// Two states:
//   1. Unauthenticated - render the Telegram Login Widget. Telegram POSTs the signed
//      payload back to /api/admin/tg-verify (or drops it into a `?tgAuthResult=...` query
//      string with the "data-onauth" JS callback pattern). We use the JS callback pattern
//      so the flow feels one-page - no top-level redirect.
//   2. Authenticated - render the provider-chain reorder + per-provider model overrides.
//      PUT to /api/admin/config on save.

import { useEffect, useMemo, useRef, useState } from "react";

const PROVIDER_LABELS = { anthropic: "Anthropic", openai: "OpenAI", gemini: "Google Gemini" };
const OVERRIDE_KEYS = {
  anthropic: [
    { key: "strong", label: "Strong tier", placeholder: "claude-opus-4-8" },
    { key: "fast",   label: "Fast tier",   placeholder: "claude-haiku-4-5-20251001" },
    { key: "model",  label: "Single override (both tiers)", placeholder: "" },
  ],
  openai: [
    { key: "strong", label: "Strong tier", placeholder: "gpt-4.1" },
    { key: "fast",   label: "Fast tier",   placeholder: "gpt-4.1-mini" },
    { key: "model",  label: "Single override (both tiers)", placeholder: "" },
  ],
  gemini: [
    { key: "model", label: "Model", placeholder: "gemini-2.5-pro" },
  ],
};

function TelegramLoginWidget({ botUsername, onAuth }) {
  const holderRef = useRef(null);
  useEffect(() => {
    if (!holderRef.current || !botUsername) return;
    window._v3AdminOnAuth = (user) => onAuth(user);
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "_v3AdminOnAuth(user)");
    holderRef.current.innerHTML = "";
    holderRef.current.appendChild(script);
    return () => { try { delete window._v3AdminOnAuth; } catch (_) {} };
  }, [botUsername, onAuth]);
  return <div ref={holderRef} />;
}

function ProviderRow({ name, index, canUp, canDown, onUp, onDown }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto auto", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", border: "1px solid #e2e0d8", borderRadius: 8, marginBottom: 6 }}>
      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#8a8274", fontWeight: 700, letterSpacing: ".06em", textAlign: "center" }}>#{index + 1}</span>
      <span style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "#16202e" }}>{PROVIDER_LABELS[name] || name}</span>
      <button onClick={onUp} disabled={!canUp} aria-label={`Move ${name} up`} style={btnStyle(!canUp)}>{String.fromCharCode(0x25B2)}</button>
      <button onClick={onDown} disabled={!canDown} aria-label={`Move ${name} down`} style={btnStyle(!canDown)}>{String.fromCharCode(0x25BC)}</button>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    minWidth: 44, minHeight: 44,
    borderRadius: 8,
    background: disabled ? "#f4f6fa" : "#fff",
    border: `1px solid ${disabled ? "#eceae2" : "#cdd9ff"}`,
    color: disabled ? "#c4c0b3" : "#1a56db",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.8125rem",
    fontFamily: "'Spline Sans',sans-serif",
    fontWeight: 700,
  };
}

export default function AdminPanel() {
  const [status, setStatus] = useState({ kind: "loading" }); // loading | need-login | ready | error
  const [chain, setChain] = useState(["anthropic", "openai", "gemini"]);
  const [overrides, setOverrides] = useState({ anthropic: {}, openai: {}, gemini: {} });
  const [source, setSource] = useState("default");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [botUsername, setBotUsername] = useState("");

  // Bootstrap: try to fetch config. 401 -> need-login. 200 -> ready.
  const refresh = useMemo(() => async () => {
    setStatus({ kind: "loading" });
    setSaveMsg("");
    try {
      const res = await fetch("/api/admin/config", { credentials: "include" });
      if (res.status === 401) {
        setStatus({ kind: "need-login" });
        // The Telegram bot username lives in a Vite env var so the widget can be
        // rendered. Falls back to a placeholder input if not baked in.
        setBotUsername(import.meta.env?.VITE_TELEGRAM_BOT_USERNAME || "");
        return;
      }
      if (!res.ok) {
        setStatus({ kind: "error", message: `HTTP ${res.status}` });
        return;
      }
      const data = await res.json();
      setChain(Array.isArray(data?.config?.chain) ? data.config.chain : ["anthropic", "openai", "gemini"]);
      setOverrides(data?.config?.overrides || { anthropic: {}, openai: {}, gemini: {} });
      setSource(data?.source || "default");
      setStatus({ kind: "ready", kv: Boolean(data?.kv) });
    } catch (err) {
      setStatus({ kind: "error", message: err?.message || String(err) });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onAuth = async (user) => {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/admin/tg-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: detail?.error || `HTTP ${res.status}` });
        return;
      }
      await refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err?.message || String(err) });
    }
  };

  const move = (i, dir) => {
    setChain((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSaveMsg("");
  };

  const setOverride = (provider, key, value) => {
    setOverrides((prev) => ({ ...prev, [provider]: { ...(prev[provider] || {}), [key]: value } }));
    setSaveMsg("");
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chain, overrides }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg(`Save failed: ${data?.error || `HTTP ${res.status}`}`);
      } else {
        setSaveMsg(`Saved at ${new Date().toLocaleTimeString()}. Effective on next /api/claude request (~30 s cache).`);
        setSource("kv");
      }
    } catch (err) {
      setSaveMsg(`Save failed: ${err?.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Spline Sans',sans-serif", color: "#16202e", background: "#e9edf3", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'Newsreader',serif", fontSize: "1.75rem", fontWeight: 600, margin: 0, color: "#16202e" }}>Admin {String.fromCharCode(0x00b7)} LLM Provider Chain</h1>
          <a href="/" style={{ fontSize: "0.8125rem", color: "#1a56db", textDecoration: "none" }}>{String.fromCharCode(0x2190)} back to app</a>
        </div>

        {status.kind === "loading" && <p style={{ color: "#5b6878" }}>Loading current configuration...</p>}

        {status.kind === "error" && (
          <div style={{ background: "#fbeaea", border: "1px solid #f1cdcd", borderRadius: 10, padding: "14px 16px", color: "#a13a3a" }}>
            {status.message}
          </div>
        )}

        {status.kind === "need-login" && (
          <div style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 12, padding: "26px 24px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontFamily: "'Newsreader',serif", fontSize: "1.125rem", fontWeight: 600 }}>Owner sign-in required</p>
            <p style={{ margin: "0 0 18px", fontSize: "0.8125rem", color: "#5b6878", lineHeight: 1.5 }}>
              This page is gated to the single Telegram user whose id matches the <code>TELEGRAM_OWNER_CHAT_ID</code> env var. Anyone else who signs in is politely rejected.
            </p>
            {botUsername ? (
              <TelegramLoginWidget botUsername={botUsername} onAuth={onAuth} />
            ) : (
              <p style={{ fontSize: "0.75rem", color: "#a13a3a" }}>
                Set <code>VITE_TELEGRAM_BOT_USERNAME</code> in the project's build env so the widget can render.
              </p>
            )}
            <p style={{ marginTop: 18, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#8a8274" }}>
              Telegram signs the payload with the bot token; the server verifies HMAC before minting a 12 h cookie.
            </p>
          </div>
        )}

        {status.kind === "ready" && (
          <>
            <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#8a8274", marginBottom: 14, letterSpacing: ".04em" }}>
              LOADED {String.fromCharCode(0x00b7)} source: {source} {String.fromCharCode(0x00b7)} KV: {status.kv ? "attached" : "not configured (defaults only)"}
            </p>

            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: 10 }}>Priority order</h2>
            <p style={{ fontSize: "0.8125rem", color: "#5b6878", marginBottom: 12, lineHeight: 1.5 }}>
              Each request tries providers in this order, falling through on failure. Only providers with a configured API key are actually reachable; a missing key silently skips that slot.
            </p>
            {chain.map((name, i) => (
              <ProviderRow key={name} name={name} index={i}
                canUp={i > 0} canDown={i < chain.length - 1}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
            ))}

            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "22px 0 6px" }}>Model overrides</h2>
            <p style={{ fontSize: "0.8125rem", color: "#5b6878", marginBottom: 12, lineHeight: 1.5 }}>
              Override the default model ids the resolver falls back to. Leave blank to use the env var (or the baked-in default when the env var is unset). A caller who passes a known-shape model id (<code>claude-*</code>, <code>gpt-*</code>) still gets it verbatim.
            </p>
            {chain.map((provider) => (
              <div key={provider} style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                <p style={{ margin: "0 0 8px", fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "0.9375rem" }}>{PROVIDER_LABELS[provider]}</p>
                {(OVERRIDE_KEYS[provider] || []).map(({ key, label, placeholder }) => (
                  <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", color: "#5b6878", fontWeight: 600 }}>{label}</span>
                    <input type="text" value={(overrides[provider] && overrides[provider][key]) || ""}
                      onChange={(e) => setOverride(provider, key, e.target.value)}
                      placeholder={placeholder}
                      style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.8125rem", padding: "10px 12px", border: "1px solid #d9d6cd", borderRadius: 8, minHeight: 44 }} />
                  </label>
                ))}
              </div>
            ))}

            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={save} disabled={saving} style={{ background: "#142a8e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 22px", fontSize: "0.9375rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", minHeight: 44 }}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={refresh} disabled={saving} style={{ background: "#fff", color: "#3a4456", border: "1px solid #d9d6cd", borderRadius: 8, padding: "12px 18px", fontSize: "0.875rem", fontWeight: 600, cursor: saving ? "wait" : "pointer", minHeight: 44 }}>Reload</button>
              {saveMsg && <span style={{ fontSize: "0.8125rem", color: saveMsg.startsWith("Save failed") ? "#a13a3a" : "#2f7d4f" }}>{saveMsg}</span>}
            </div>

            <div style={{ marginTop: 30, padding: "12px 14px", background: "#fbfaf8", border: "1px dashed #e4e2da", borderRadius: 10, fontSize: "0.75rem", color: "#5b6878", lineHeight: 1.55 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#16202e" }}>May</p>
              <p style={{ margin: "0 0 12px" }}>Reorder or override the model resolver defaults; the change persists in Vercel KV and applies to every /api/claude call within ~30 seconds (in-memory cache).</p>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#16202e" }}>May not</p>
              <p style={{ margin: 0 }}>Bypass the LLM proxy's rejection caps, alter the engine's deterministic outputs, or hide any log line - the trust-loop invariants in <code>v3-llm-proxy-guardrails-spec.md</code> are not user-configurable.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
