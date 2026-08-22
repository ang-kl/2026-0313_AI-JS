// Signed session cookie for the admin surface.
//
// Encoding: `<user_id>.<expiry_ms>.<hex hmac-sha256 of "<user_id>.<expiry_ms>" using ADMIN_SESSION_SECRET>`
// - HttpOnly, Secure, SameSite=Lax.
// - Default TTL: 12 hours.
// - No user data beyond the id lives in the cookie; the cookie proves the id.
// - No server-side session store; the HMAC IS the proof of authorisation.
//
// Never throws for a caller's bad input - always returns an { ok } object.

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "v3_admin";
export const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

export function signSession({ userId, secret, ttlMs = DEFAULT_TTL_MS }) {
  if (!userId || !secret) throw new Error("signSession: userId + secret required");
  const expiry = Date.now() + ttlMs;
  const body = `${userId}.${expiry}`;
  const sig = createHmac("sha256", secret).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifySession(cookieValue, secret) {
  if (!cookieValue || !secret) return { ok: false, reason: "missing" };
  const parts = String(cookieValue).split(".");
  if (parts.length !== 3) return { ok: false, reason: "bad_shape" };
  const [userId, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry <= 0) return { ok: false, reason: "bad_expiry" };
  if (Date.now() > expiry) return { ok: false, reason: "expired" };
  const expected = createHmac("sha256", secret).update(`${userId}.${expiry}`).digest("hex");
  if (expected.length !== sig.length) return { ok: false, reason: "sig_len_mismatch" };
  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))) {
      return { ok: false, reason: "sig_mismatch" };
    }
  } catch (_) { return { ok: false, reason: "bad_sig_hex" }; }
  return { ok: true, userId, expiry };
}

// Node/Vercel serverless cookie header helpers - no framework dependency.
export function cookieHeader({ value, ttlMs = DEFAULT_TTL_MS, secure = true }) {
  const maxAge = Math.floor(ttlMs / 1000);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
export function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
export function readCookie(req, name = COOKIE_NAME) {
  const raw = String(req?.headers?.cookie || "");
  if (!raw) return null;
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const k = p.slice(0, eq);
    if (k === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return null;
}

// Convenience: guard used by admin API endpoints. Returns { ok, userId } or writes 401 to res.
export function requireAdmin(req, res) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const ownerId = String(process.env.TELEGRAM_OWNER_CHAT_ID || "");
  if (!secret || !ownerId) {
    res.status(500).json({ error: "Admin surface not configured", code: "ADMIN_CONFIG" });
    return { ok: false };
  }
  const raw = readCookie(req);
  const sess = verifySession(raw, secret);
  if (!sess.ok) {
    res.status(401).json({ error: "Not signed in", code: "NO_SESSION", reason: sess.reason });
    return { ok: false };
  }
  if (sess.userId !== ownerId) {
    res.status(403).json({ error: "Not authorised", code: "NOT_OWNER" });
    return { ok: false };
  }
  return { ok: true, userId: sess.userId };
}
