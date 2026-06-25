// v3/api/login-config.js - returns the bot's @username so login.html can render
// the Telegram Login Widget without needing the username baked in as a build-
// time constant or an extra env var. We discover it from Telegram's getMe and
// cache it for the warm lifetime of the lambda.
//
// Public endpoint (allow-listed in middleware.js) - the bot username is already
// public information, so leaking it here is intentional.

export const config = { api: { bodyParser: false }, maxDuration: 8 };

let _cachedBot = null;

export default async function handler(_req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "auth not configured" });
  }
  if (!_cachedBot) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const j = await r.json();
      if (j && j.ok && j.result && typeof j.result.username === "string") {
        _cachedBot = j.result.username;
      }
    } catch { /* fall through */ }
  }
  if (!_cachedBot) {
    return res.status(503).json({ error: "bot lookup failed" });
  }
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ bot: _cachedBot });
}
