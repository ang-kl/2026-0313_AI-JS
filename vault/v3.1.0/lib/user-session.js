// General (non-owner) user session - reuses the admin session's HMAC primitives with a
// SEPARATE cookie name so a regular visitor's session can never be confused with the
// owner's admin session (requireAdmin() still checks TELEGRAM_OWNER_CHAT_ID separately -
// this file only proves "this browser is the same verified Telegram user each time").
//
// Fundamentals (Human Lead, 08-07 '26): "go back to fundamental what you need for
// memory to be persistent" - this is the login half. It reuses the SAME bot token,
// SAME session secret, and SAME Telegram verification already configured for the admin
// panel - no new secrets. The only new requirement is that the site's domain is
// registered with @BotFather (/setdomain) for the Telegram widget to render there -
// if the admin panel's widget already works on this domain, this one will too.

import { signSession, verifySession, readCookie } from "./admin/session.js";

export const USER_COOKIE_NAME = "v3_user";
export const USER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days - a real "stay signed in", not 12h

export function signUserSession(userId, secret) {
  return signSession({ userId, secret, ttlMs: USER_TTL_MS });
}

export function verifyUserSession(req, secret) {
  return verifySession(readCookie(req, USER_COOKIE_NAME), secret);
}

export function userCookieHeader(value) {
  const maxAge = Math.floor(USER_TTL_MS / 1000);
  const parts = [
    `${USER_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`, "Secure",
  ];
  return parts.join("; ");
}
export function clearUserCookieHeader() {
  return `${USER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
