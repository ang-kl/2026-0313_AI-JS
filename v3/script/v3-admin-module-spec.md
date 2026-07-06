# v3 Admin Module — spec

**Status:** live canon.
**Scope:** the owner-gated web surface for changing the LLM proxy's provider chain + model overrides at runtime. Mounted at `/admin` (or `?view=admin`).
**Governance:** `v3-llm-proxy-guardrails-spec.md` §3 (proxy is narration transport); `trust-loop-first.instructions.md` §5 rules 3, 4 (engine computes, LLM narrates; provenance always visible).

## 1. Purpose

`v3/api/claude.js` accepts a KV-persisted provider chain + per-provider model overrides. This module lets the site owner change those two things without a redeploy. It is deliberately narrow: it does **not** allow overriding the engine, the honesty contract, the rejection caps, or any user-facing copy.

The whole surface is gated to **one Telegram user id** (`TELEGRAM_OWNER_CHAT_ID`). There is no user-management UI, no invite flow, no multi-tenant role model. If you need a second admin later, you add their id to the env var — a git operation, not a runtime one.

## 2. Auth flow (Telegram Login Widget)

1. User visits `/admin`. The React `AdminPanel` calls `GET /api/admin/config` with `credentials: "include"`.
2. If the request returns `401 NO_SESSION`, the panel renders Telegram's Login Widget (loaded from `https://telegram.org/js/telegram-widget.js?22`, bot username baked in via `VITE_TELEGRAM_BOT_USERNAME`).
3. The user clicks the widget, authenticates with Telegram, and Telegram invokes the JS callback with a payload: `{ id, first_name, last_name, username, photo_url, auth_date, hash }`.
4. The panel POSTs the payload to `/api/admin/tg-verify` (same origin, `credentials: "include"`).
5. `tg-verify` verifies (`v3/lib/admin/tg-verify.js:verifyTelegramLogin`):
   - `hash` is 64 lowercase hex chars.
   - Data-check-string = `auth_date=...\nfirst_name=...\nid=...\nlast_name=...\nphoto_url=...\nusername=...` (sorted alphabetically, empty fields skipped).
   - Secret key = `SHA256(TELEGRAM_BOT_TOKEN)` raw bytes.
   - Expected hash = `HMAC-SHA256(dataCheckString, secretKey)`.
   - Compared with `crypto.timingSafeEqual` — constant-time.
   - `auth_date` within the last 24 hours (rejects replays) and not > 60 seconds in the future.
6. If verification passes AND `String(user.id) === TELEGRAM_OWNER_CHAT_ID`, mint a signed cookie via `v3/lib/admin/session.js:signSession` and return `200 { ok, user }`. Otherwise return `401` / `403` with a code but no diagnostic that helps a probe.
7. `AdminPanel` re-fetches `GET /api/admin/config` — this time the cookie carries authorisation and the panel loads.

## 3. Session cookie

Name: `v3_admin`. Format: `<user_id>.<expiry_ms>.<hex hmac-sha256 of "<user_id>.<expiry_ms>" using ADMIN_SESSION_SECRET>`.

- `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=43200` (12 h).
- No server-side session store. The HMAC is the proof.
- `verifySession` uses `timingSafeEqual` for the signature compare.
- `readCookie` parses the request `Cookie` header without a framework dep.
- `requireAdmin(req, res)` — the guard used by admin API endpoints. Writes 401 / 403 to `res` and returns `{ ok: false }` if the cookie is missing / malformed / expired, if the signed user id doesn't match `TELEGRAM_OWNER_CHAT_ID`, or if `ADMIN_SESSION_SECRET` is unset.

## 4. Environment variables

| Var | Purpose | Required |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from `@BotFather`. Used to derive the HMAC secret key. **Never** rendered to the client. | Yes |
| `TELEGRAM_OWNER_CHAT_ID` | The single Telegram user id allowed to sign in. String, numeric. | Yes |
| `ADMIN_SESSION_SECRET` | Random string used to sign the session cookie. Rotate to invalidate every session. | Yes |
| `VITE_TELEGRAM_BOT_USERNAME` | Bot username (no `@`), baked into the client bundle so the Login Widget can render. | Yes |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV connection (auto-populated when the KV store is attached). If absent, GET returns defaults; PUT returns `503 NO_KV`. | Recommended |

## 5. KV schema

Key: `v3:admin:llm-config`.

```jsonc
{
  "chain": ["anthropic", "openai", "gemini"],  // ordered array of unique known providers
  "overrides": {
    "anthropic": { "strong": "claude-opus-4-8", "fast": "claude-haiku-4-5-20251001", "model": "" },
    "openai":    { "strong": "gpt-4.1",        "fast": "gpt-4.1-mini",             "model": "" },
    "gemini":    { "model": "gemini-2.5-pro" }
  },
  "updated_at": 1720207000000,
  "updated_by": "<TELEGRAM_OWNER_CHAT_ID as string>"
}
```

Any override string is trimmed and capped at 120 chars; keys are capped at 40. Unknown provider keys are dropped. `chain` entries not in `{anthropic, openai, gemini}` are dropped. Duplicate providers in `chain` are deduped keeping the first occurrence. If the normalised `chain` is empty, the built-in default (`anthropic > openai > gemini`) is used.

## 6. LLM proxy integration

`v3/api/claude.js` reads the admin config at request time via `loadAdminConfig()`:

- **30-second in-memory cache** — the same serverless instance won't re-read KV on every call.
- **KV failure = defaults.** A read error is logged and the built-in chain is used; the caller is never blocked.
- **Effective order** = admin chain filtered to providers with a configured API key, followed by any remaining configured providers not in the chain (safety: a typo in the KV chain never leaves a working key unused).
- **Model overrides** are applied inside each `*ModelFor()` resolver as the fallback default; a caller who passes a known-shape model id (`claude-*`, `gpt-*`) still gets it verbatim.
- **Log line** now includes `chain=<a>-><b>-><c>` so the effective order is visible in any prod trace.

## 7. Endpoint contract

### `POST /api/admin/tg-verify`

Request body: raw Telegram Login Widget payload.
Response: `200 { ok, user: { id, first_name, username }, expires_at }` on success. Sets `Set-Cookie: v3_admin=...; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`.
Errors: `401 AUTH` (HMAC mismatch, stale, malformed), `403 NOT_OWNER`, `500 ADMIN_CONFIG` (env missing).

### `GET /api/admin/config`

Requires session cookie. Returns `200 { ok, kv, config: { chain, overrides }, source }` — `source` is `"kv"` when the stored blob was used and `"default"` when it fell back.
Errors: `401 NO_SESSION`, `403 NOT_OWNER`, `500 ADMIN_CONFIG`.

### `PUT /api/admin/config`

Requires session cookie. Body: `{ chain, overrides }`. Normalises, adds `updated_at` + `updated_by`, writes to KV, returns `200 { ok, config }`.
Errors: `401 NO_SESSION`, `403 NOT_OWNER`, `503 NO_KV` (KV not configured), `503 KV_WRITE` (KV write error), `500 ADMIN_CONFIG`.

## 8. Security posture

- **HMAC secret sources are file-local.** `TELEGRAM_BOT_TOKEN` never leaves `tg-verify`; `ADMIN_SESSION_SECRET` never leaves the session helpers. The client bundle carries **only** `VITE_TELEGRAM_BOT_USERNAME` (public info).
- **Timing-safe comparisons** on both the Telegram HMAC verify and the session cookie verify.
- **No fields from the payload are echoed on error.** Auth failures return `code` only; the reason (e.g. `stale_auth`, `hash_mismatch`) is logged server-side.
- **No log line carries content.** Same NO-PII invariant as the LLM proxy: only ids, counts, and env-var names.
- **Session TTL 12 h.** Rotating `ADMIN_SESSION_SECRET` invalidates every issued cookie immediately.
- **Owner is single.** A malicious signer whose Telegram id != `TELEGRAM_OWNER_CHAT_ID` is stopped in `tg-verify` before a cookie is set.

## 9. Honesty contract

Same voice rules as everywhere else. The panel:

- Discloses what it **may** do (reorder + override resolver defaults) and what it **may not** do (bypass caps, alter engine outputs, hide log lines) — see the `May / May not` panel at the tail of `AdminPanel.jsx`.
- Names the current source (`source: kv | default`) and whether KV is attached (`kv: attached | not configured (defaults only)`).
- Reports the ~30 s cache after a save so the admin knows exactly when the change lands.

## 10. Verification

Every PR that touches this module must:

1. Confirm the seven auth invariants (§2 + §3 + §8).
2. Confirm no HMAC secret or session secret appears in a log line.
3. `npm run verify` — build + snapshot.
4. Report per `trust-loop-first.instructions.md` §7.

## 11. What this module is not

- **Not a general admin console.** It only reshapes the LLM proxy's provider order + model resolver defaults.
- **Not multi-tenant.** One owner id, one cookie.
- **Not a bypass for the trust loop.** Rejection caps, provenance chips, deterministic engine, and honesty voice remain non-negotiable.
- **Not a place to store secrets.** The KV blob carries a `chain` and non-secret model ids. API keys stay in Vercel env vars.

## 12. Change log

- **2026-07-06 — initial canon.** Ships alongside `api/admin/tg-verify.js`, `api/admin/config.js`, `lib/admin/{tg-verify,session,kv}.js`, `src/AdminPanel.jsx`, and the runtime chain reader in `api/claude.js`.
