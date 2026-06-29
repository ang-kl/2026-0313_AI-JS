// api/alert.js - builder outage alert (v3.0.76).
// The client (claudeCall) POSTs here, debounced, when the AI service is persistently
// unavailable. This forwards a short message to an incoming webhook so the BUILDER is
// notified to top up credits / investigate. The visitor-facing app is unaffected: this
// endpoint ALWAYS returns a 2xx, never surfaces a failure, and is a no-op until the
// ALERT_WEBHOOK_URL env var is set in the deploy.
//
// Channel: works with Slack and Discord incoming webhooks out of the box - the body
// carries BOTH `text` (Slack) and `content` (Discord); each ignores the other's key.
// (Telegram has no generic incoming-webhook; it needs a bot sendMessage relay instead.)
//
// api/claude.js stays FROZEN - this is an additive, separate endpoint. No user/CV data is
// accepted or forwarded; only an error string, model tier, path and timestamp.
export const config = {
  api: { bodyParser: true },
  maxDuration: 10,
};

// Best-effort throttle within a warm lambda instance (does NOT persist across cold starts;
// the client's 10-min debounce is the primary guard). Dampens bursts from one outage.
let _lastForward = 0;
const THROTTLE_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return res.status(204).end(); // feature off until configured - silent no-op

  const now = Date.now();
  if (now - _lastForward < THROTTLE_MS) return res.status(202).json({ throttled: true });
  _lastForward = now;

  const b = (req.body && typeof req.body === "object") ? req.body : {};
  const tier   = String(b.tier   || "").replace(/[\r\n]+/g, " ").slice(0, 20);
  const detail = String(b.detail || "").replace(/[\r\n]+/g, " ").slice(0, 400);
  const path   = String(b.path   || "").replace(/[\r\n]+/g, " ").slice(0, 60);
  const when   = new Date().toISOString();

  const text =
    "⚠️ takearoundabout v3 - AI service unavailable\n" +
    `model: ${tier || "?"}\n` +
    `path: ${path || "?"}\n` +
    `when: ${when}\n` +
    `detail: ${detail || "(none)"}`;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, content: text }),
      signal: controller.signal,
    });
    clearTimeout(t);
    return res.status(202).json({ ok: true });
  } catch (_) {
    // Never let an alerting failure look like an app error - the client ignores the response.
    return res.status(202).json({ ok: false });
  }
}
