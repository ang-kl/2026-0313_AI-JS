// POST /api/admin/tg-verify - Telegram Login Widget callback.
// Verifies the widget's HMAC payload, checks the caller's Telegram id matches
// TELEGRAM_OWNER_CHAT_ID, and sets a signed 12h session cookie. See
// v3/script/v3-admin-module-spec.md for the full contract.

import { verifyTelegramLogin } from "../../lib/admin/tg-verify.js";
import { signSession, cookieHeader, DEFAULT_TTL_MS } from "../../lib/admin/session.js";

export const config = {
  api: { bodyParser: true },
  maxDuration: 10,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  }
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const ownerId = String(process.env.TELEGRAM_OWNER_CHAT_ID || "");
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!botToken || !ownerId || !secret) {
    console.error("[admin] tg-verify: missing env - need TELEGRAM_BOT_TOKEN + TELEGRAM_OWNER_CHAT_ID + ADMIN_SESSION_SECRET");
    return res.status(500).json({ error: "Admin surface not configured", code: "ADMIN_CONFIG" });
  }

  const payload = req.body || {};
  const check = verifyTelegramLogin(payload, botToken);
  if (!check.ok) {
    // Do not echo which field was wrong to the caller - just say authorised no.
    console.warn(`[admin] tg-verify rejected: ${check.reason}`);
    return res.status(401).json({ error: "Not authorised", code: "AUTH" });
  }
  if (String(check.user.id) !== ownerId) {
    console.warn(`[admin] tg-verify not owner: got=${check.user.id}`);
    return res.status(403).json({ error: "Not the configured owner", code: "NOT_OWNER" });
  }

  const value = signSession({ userId: check.user.id, secret });
  res.setHeader("Set-Cookie", cookieHeader({ value, ttlMs: DEFAULT_TTL_MS, secure: true }));
  console.log(`[admin] tg-verify OK for ${ownerId}; session ${Math.floor(DEFAULT_TTL_MS / 3600000)}h`);
  return res.status(200).json({
    ok: true,
    user: { id: check.user.id, first_name: check.user.first_name, username: check.user.username },
    expires_at: Date.now() + DEFAULT_TTL_MS,
  });
}
