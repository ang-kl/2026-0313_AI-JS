# v3 LLM Proxy Guardrails — spec

**Status:** live canon. Present-state truth for `v3/api/claude.js`.
**Scope:** the single serverless endpoint that fronts every LLM call the v3 app makes.
**Governance:** `trust-loop-first.instructions.md` §4 P2 + §5 rules 3, 4; `v3-blueprint.md` §4 (Interpretability); `v3-result-engine-spec.md` §6 gates.

## 1. Purpose

`v3/api/claude.js` is the only path any LLM call takes from the v3 frontend to a model provider. This spec pins its **operational contract** — how large a request it will accept, what it will (and will not) log, how it selects and falls back between providers, and where the LLM/engine boundary lives.

The goal is not to lock down the file. The goal is to say plainly, in one place, what the operational risk is and how it is bounded. The next contributor should be able to read this file and know exactly what they can safely change and what they cannot.

## 2. The engine / LLM boundary

**Rule (trust-loop-first §5 rule 3):** *"Engine computes, LLM narrates. No LLM-authored number should enter the result page as a computed value. If LLM and engine conflict, the engine wins."*

`api/claude.js` does not enforce this — it is a **narration transport**. Callers are responsible for shape-locking the response and rejecting any number/band/rank/verdict the LLM authored. What the proxy *does* guarantee:

- **No engine computation happens here.** No SSOC lookup, no AIOE crosswalk, no snapshot compare. All of that lives in `v3/engine-data/*` and `v3/api/{engine,ssoc,anatomy}.js`.
- **No result-page figure is authored here.** The response is a text envelope; every consumer that parses a number out of it must own the audit.
- **The response envelope mimics the Anthropic Messages API** (`{ id, model, stop_reason, content: [{ type: "text", text }], provider }`), independent of which upstream (OpenAI, Gemini) actually served the call. This is intentional — callers work off one shape.

## 3. Provider fallback order

Deterministic order:

1. **Anthropic Messages API** — `POST https://api.anthropic.com/v1/messages`. Selected when `ANTHROPIC_API_KEY` is set. Model resolved by `anthropicModelFor(model)` — the caller's requested model id is preserved verbatim when it matches `claude-*`; otherwise `haiku` → `ANTHROPIC_MODEL_FAST` (default `claude-haiku-4-5-20251001`), `opus` / `sonnet` / `fable` → `ANTHROPIC_MODEL_STRONG` (default `claude-opus-4-8`), everything else → `ANTHROPIC_MODEL_FAST`. Auth via `x-api-key` + `anthropic-version: 2023-06-01` headers.
2. **OpenAI Responses API** — `POST https://api.openai.com/v1/responses`. Selected when the Anthropic path throws or is not configured, AND `OPENAI_API_KEY` is set. Model resolved by `openAiModelFor(model)` — the caller's requested model name is preserved verbatim when it starts with `gpt` / `o0`–`o9`, otherwise mapped through `OPENAI_MODEL_STRONG` (default `gpt-4.1`) for `opus`/`sonnet`/`fable` names or `OPENAI_MODEL_FAST` (default `gpt-4.1-mini`) for everything else.
3. **Google Gemini** — `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. Selected when both prior paths throw or are not configured, AND `GEMINI_API_KEY` + `GEMINI_MODEL` are set. Model comes from `GEMINI_MODEL` env; `models/` prefix stripped.
4. **No further fallback.** If every configured path fails, the client sees a `503` with a warm error message (`WARM_ERRORS.server` or `WARM_ERRORS.timeout` / `overload` as appropriate).

**Response envelope shape** stays constant regardless of which upstream served the call: `{ id, model, stop_reason, content: [{ type: "text", text }], provider, fallback_from? }`. The `provider` field names the upstream that actually served the response; `fallback_from` is present when a preferred provider was skipped or failed.

**Cold-start correctness:** if `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and (`GEMINI_API_KEY` + `GEMINI_MODEL`) are all missing, the endpoint returns `500` immediately with the `No LLM provider configured` debug string. It does not silently accept requests it cannot serve.

## 4. Request limits

Caps enforced in code today:

| Limit | Value | Enforced by |
|---|---|---|
| Vercel body size | ~4.5 MB (JSON: ~1 MB) | Vercel platform, `config.bodyParser: true` |
| Vercel execution time | 300 s | Vercel `config.maxDuration: 300` |
| Serverless timeout | **280 s** | `AbortController` at `claude.js:191` |
| HTTP method | `POST` only | `claude.js:163–165` |
| Body shape | `{ model, max_tokens, messages: [], system? }` (all four required except `system`) | `claude.js:178–180` |
| `max_tokens` | Positive integer, capped in code (see below) | `claude.js` — this PR adds an explicit cap |
| Assembled prompt (system + messages, chars) | Explicit cap (see below) | `claude.js` — this PR adds an explicit cap |

New in this PR (small, safe caps that reject clearly-abusive shapes without touching the fallback logic):

- **`max_tokens` cap: 8192.** A single narration request over 8K output tokens is almost certainly a caller-side bug. Rejected with `400 BAD_TOKENS`.
- **Assembled prompt cap: 200,000 chars.** Roughly 50K tokens of input — well over any real narration payload from the app. Rejected with `413 TOO_LARGE`.
- **`messages` array cap: 32 entries.** More than 32 turns in a single request is a caller-side loop; rejected with `400 BAD_REQUEST` so it fails loud instead of costing a full round-trip.

These are **rejection caps, not truncations.** The proxy will not silently drop content. The caller is told the exact reason and expected to shrink the payload.

## 5. Logging policy

**Invariant (this file must satisfy):** no log line may include the raw content of `messages[*].content` or `system[*].text` or any substring of them. Only structural / numeric facts of a request may be logged.

**Today's logs (audited):**

| Line | Content | PII risk |
|---|---|---|
| `[proxy] status=<n> provider=anthropic content_blocks=<n>` | none — counts only |
| `[proxy] status=<n> provider=openai output_blocks=<n>` | none — counts only |
| `[proxy] status=<n> provider=gemini candidates=<n>` | none — counts only |
| `[proxy] no LLM provider configured: ANTHROPIC_API_KEY / OPENAI_API_KEY / (GEMINI_API_KEY + GEMINI_MODEL) all missing` | none — env state |
| `[proxy] requested_model=<s> anthropic_model=<s> openai_model=<s> gemini_model=<s> max_tokens=<n> system_len=<n> input_len=<n> msg_count=<n>` | none — all lengths / model ids, no content |
| `[proxy] Anthropic failed; ... :<err.debug>`, `[proxy] OpenAI failed; ... :<err.debug>` | risk: provider-side error string may echo request context; the proxy passes it through verbatim. Truncated to 300 chars by `providerError`. Known trade-off — needed for diagnosis. Treat these strings as sensitive. |
| `[proxy] Timeout/Provider failure provider=<s>: <err.debug>` | same as above |

**No log line today echoes raw user text.** The `system_len` line at `:187` is the closest — and it is intentionally a length, not a substring.

**New in this PR:** an inline `// no-PII-in-logs invariant` comment above the log block and a defensive `error.debug` truncation to 300 chars (already there at `providerError:68`) — kept as-is because provider error messages are sometimes the only way to diagnose auth or quota failures.

**Not adopted:** persistent request logging to disk or a third-party sink. If it lands later, this spec must be updated with the sink, the retention, and the PII rules.

## 6. Abuse control

Today: **no rate limiting inside the proxy.** Vercel's platform-level rate limits apply (per-IP burst limits). Downstream provider `429` responses are surfaced to the caller as `WARM_ERRORS.overload`.

**Not adopted here** (would be a broader refactor per trust-loop-first §6 PR 5 acceptance criteria):

- Per-IP token budget.
- Per-session token budget.
- Redis-backed leaky bucket.

**Adopted here** (small, safe):

- The three rejection caps in §4 collectively bound the cost of a single call to a small, predictable amount — an attacker cannot use this endpoint to spend arbitrary tokens per request.
- Structural-shape validation (`messages` cap, `max_tokens` cap) catches loops that would otherwise burn seconds against the 280s timeout before failing.

## 7. Error envelope

Callers should treat the following as the response contract:

- **`200`** — success. Body is `{ id, model, stop_reason, content: [{ type: "text", text }], provider, fallback_from? }`.
- **`400 BAD_REQUEST`** — malformed body. Include a `code` if a specific cap was hit (`BAD_REQUEST`, `BAD_TOKENS`, or a callsite-specific one).
- **`413 TOO_LARGE`** — prompt cap hit. New in this PR.
- **`405`** — method other than `POST`.
- **`500`** — env keys missing. `WARM_ERRORS.server` shape.
- **`503`** — provider unreachable, empty response, timeout, auth failure, or 5xx from upstream. Uses `WARM_ERRORS.{server,overload,timeout}` shapes. The `debug` field is present but should be treated as internal.

**Auth failures (`401`/`403` from upstream)** are converted to `503 AUTH` with a message that names the exact env var to check (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` depending on which provider failed). This is user-facing UX; it is safe because the message names the *variable*, not any *value*.

## 8. Verification

Every PR that touches `v3/api/claude.js` must:

1. **Confirm the invariants** in §2 (no engine computation), §4 (three rejection caps present), §5 (no log line echoes raw content).
2. **Run `npm run verify`** — build + snapshot. The snapshot fixtures do not touch this file directly but the build must still compile.
3. **Report** in the format at `trust-loop-first.instructions.md` §7.

If a change introduces persistent logging, a rate-limit store, or an origin-check middleware, it is out of the "small, safe guardrails" scope this spec defines — update this spec in the same PR.

## 9. Change log

- **2026-07-06 — initial canon.** Written as PR 5 of the trust-loop-first arc. Ships alongside three small guardrail additions to `claude.js`: assembled-prompt char cap (200,000), `max_tokens` cap (8192), `messages` count cap (32).
- **2026-07-06 — Anthropic-first.** `callAnthropic()` added and wired as primary in the fallback chain. New order: **ANTHROPIC → OPENAI → GEMINI.** Env vars added: `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_STRONG` (default `claude-opus-4-8`), `ANTHROPIC_MODEL_FAST` (default `claude-haiku-4-5-20251001`). Response envelope shape and cap set unchanged.
