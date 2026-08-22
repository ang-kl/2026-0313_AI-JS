// Telegram Login Widget HMAC verifier.
//
// Contract (https://core.telegram.org/widgets/login#checking-authorization):
// 1. Build a data-check-string by joining the received fields (excluding `hash`)
//    sorted alphabetically as "key=value" pairs separated by "\n".
// 2. Secret key = SHA256 of the bot token (raw bytes).
// 3. Expected hash = HMAC-SHA256 of the data-check-string using the secret key,
//    encoded as lowercase hex.
// 4. auth_date must be within `maxAgeSeconds` of now, to reject replays.
//
// Returns { ok: true, user } on success, { ok: false, reason } on failure.
// Never throws for a caller's bad payload - always returns an { ok } object.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TELEGRAM_FIELDS = ["auth_date", "first_name", "id", "last_name", "photo_url", "username"];

export function verifyTelegramLogin(payload, botToken, { maxAgeSeconds = 86400 } = {}) {
  if (!payload || typeof payload !== "object") return { ok: false, reason: "no_payload" };
  if (!botToken || typeof botToken !== "string") return { ok: false, reason: "no_bot_token" };
  const hash = String(payload.hash || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return { ok: false, reason: "bad_hash_shape" };

  // Assemble the data-check-string from the present fields (except `hash`).
  const pairs = [];
  for (const key of TELEGRAM_FIELDS) {
    const value = payload[key];
    if (value === undefined || value === null || value === "") continue;
    pairs.push(`${key}=${String(value)}`);
  }
  if (!pairs.length) return { ok: false, reason: "no_fields" };
  const dataCheckString = pairs.join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest();

  let received;
  try { received = Buffer.from(hash, "hex"); }
  catch (_) { return { ok: false, reason: "bad_hash_hex" }; }
  if (received.length !== computed.length) return { ok: false, reason: "hash_len_mismatch" };
  if (!timingSafeEqual(received, computed)) return { ok: false, reason: "hash_mismatch" };

  const authDate = Number(payload.auth_date);
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, reason: "bad_auth_date" };
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) return { ok: false, reason: "stale_auth" };
  if (ageSeconds < -60) return { ok: false, reason: "future_auth" };

  return {
    ok: true,
    user: {
      id: String(payload.id || ""),
      first_name: String(payload.first_name || ""),
      last_name: String(payload.last_name || ""),
      username: String(payload.username || ""),
      auth_date: authDate,
    },
  };
}
