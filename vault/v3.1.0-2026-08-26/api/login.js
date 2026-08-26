// POST /api/login - public Telegram Login Widget callback for REGULAR visitors (not
// owner-gated, unlike /api/admin/tg-verify). Any verified Telegram user gets a 30-day
// session cookie, which /api/state's resolveUid() then honours for cross-device KV
// persistence (review decisions, board layouts, prefs). No new secrets: reuses the same
// TELEGRAM_BOT_TOKEN + ADMIN_SESSION_SECRET already configured for the admin panel.

import { verifyTelegramLogin } from "../lib/admin/tg-verify.js";
import { signUserSession, userCookieHeader } from "../lib/user-session.js";

export const config = {
  api: { bodyParser: true },
  maxDuration: 10,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  }
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!botToken || !secret) {
    console.error("[login] missing env - need TELEGRAM_BOT_TOKEN + ADMIN_SESSION_SECRET");
    return res.status(500).json({ error: "Login not configured", code: "LOGIN_CONFIG" });
  }

  const payload = req.body || {};
  const check = verifyTelegramLogin(payload, botToken);
  if (!check.ok) {
    console.warn(`[login] rejected: ${check.reason}`);
    return res.status(401).json({ error: "Not authorised", code: "AUTH" });
  }

  const value = signUserSession(check.user.id, secret);
  res.setHeader("Set-Cookie", userCookieHeader(value));
  console.log(`[login] OK for tg:${check.user.id}`);
  return res.status(200).json({
    ok: true,
    user: { id: check.user.id, first_name: check.user.first_name, username: check.user.username },
  });
}
