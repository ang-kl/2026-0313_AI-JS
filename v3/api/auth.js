// v3/api/auth.js - Telegram Login Widget callback. Validates the HMAC that
// Telegram appends to its redirect, checks the user's Telegram id against
// TELEGRAM_OWNER_CHAT_ID (single-user gate), and mints the session cookie that
// middleware.js looks for on every subsequent request.
//
// Flow:
//   1. login.html embeds telegram-widget.js with data-auth-url="/api/auth".
//   2. After the user approves, Telegram redirects to
//        /api/auth?id=..&first_name=..&auth_date=..&hash=..   (sometimes &next=..)
//   3. We rebuild the data-check-string per Telegram's spec, compute
//        HMAC_SHA256(data_check_string, SHA256(bot_token))
//      and compare it to the supplied hash.
//   4. If the hash matches AND the id equals TELEGRAM_OWNER_CHAT_ID AND auth_date
//      is fresh (<= 1 day), we set the `tara_sess` cookie and 302 back to /.
//
// The cookie is signed with TELEGRAM_BOT_TOKEN directly (HMAC-SHA256 over the
// payload). Rotating the bot token in Vercel invalidates every live session.

import crypto from "node:crypto";

export const config = { api: { bodyParser: false }, maxDuration: 10 };

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const AUTH_FRESHNESS_SECONDS = 24 * 60 * 60;  // 1 day - Telegram's own recommendation

function b64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/";
  // Only allow internal, single-leading-slash paths. Reject protocol-relative
  // and scheme URLs to avoid an open redirect via ?next=//evil.example.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ownerId = process.env.TELEGRAM_OWNER_CHAT_ID;
  if (!token || !ownerId) {
    return res.status(503).send("auth not configured");
  }

  const q = req.query || {};
  const hash = typeof q.hash === "string" ? q.hash : null;
  if (!hash || !q.id || !q.auth_date) {
    return res.status(400).send("missing telegram fields");
  }

  const authDate = Number(q.auth_date);
  if (!Number.isFinite(authDate)) {
    return res.status(400).send("bad auth_date");
  }
  const skew = Math.floor(Date.now() / 1000) - authDate;
  if (skew > AUTH_FRESHNESS_SECONDS || skew < -300) {
    return res.status(400).send("stale auth");
  }

  // Build the data-check-string from EVERY field except `hash` and our own
  // `next` shim. Telegram is explicit that the check covers all supplied fields.
  const fields = {};
  for (const k of Object.keys(q)) {
    if (k === "hash" || k === "next") continue;
    const v = q[k];
    if (typeof v !== "string") continue;
    fields[k] = v;
  }
  const dataCheckString = Object.keys(fields).sort()
    .map((k) => `${k}=${fields[k]}`).join("\n");

  const secretKey = crypto.createHash("sha256").update(token).digest();
  const computed = crypto.createHmac("sha256", secretKey)
    .update(dataCheckString).digest("hex");

  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).send("bad hash");
  }

  if (String(q.id) !== String(ownerId).trim()) {
    return res.status(403).send("not authorized");
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payloadB64 = b64url(JSON.stringify({ uid: String(q.id), exp }));
  const sigB64 = b64url(
    crypto.createHmac("sha256", token).update(payloadB64).digest(),
  );
  const cookieVal = `${payloadB64}.${sigB64}`;

  res.setHeader("Set-Cookie",
    `tara_sess=${cookieVal}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`,
  );
  res.statusCode = 302;
  res.setHeader("Location", safeNextPath(q.next));
  res.end();
}
