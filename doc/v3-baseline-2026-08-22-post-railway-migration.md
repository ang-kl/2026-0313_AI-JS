# v3 Baseline — post Vercel→Railway migration (2026-08-22)

Authoritative snapshot and restore reference, taken immediately after v3 moved
off Vercel onto Railway and before the next round of change. Companion to tag
`vault-2026-08-22-post-railway-migration`.

Every figure below was measured, not remembered — live HTTP probes, Railway
API reads, and DNS queries, all on 2026-08-22. Where something could not be
verified it says so rather than guessing.

---

## 1. Current state

- **App version:** `ai-job-analyser-v3@3.1.0` (unchanged by the migration — no
  bump was made; see §7).
- **Hosting:** Railway, project **Job-Analysis**, service **v3-web**.
- **Previously:** Vercel project `v3_2026-0511-ai-js`, still running and
  untouched as of this baseline. It is the rollback target.
- **Live domains (both on Railway, valid certificates):**
  - `v3.takearoundabout.com`
  - `v98197694700.takearoundabout.com`
- **Runtime shape changed fundamentally:** 18 per-file Vercel serverless
  functions became ONE long-lived Express process. That single fact is behind
  most of the migration's real bugs — see §5.

### Cost caveat (unverified by choice)

The migration's purpose was to cut Vercel spend. No billing figure has been
checked on either platform — nobody involved had billing access. Treat the
direction as sound (per-invocation billing for a proxy with 300s LLM calls vs
a fixed container) and the magnitude as unmeasured. Compare a Railway usage
week against a Vercel invoice before declaring a saving.

---

## 2. Restore anchors (the reference)

| Anchor | SHA | What it is |
|---|---|---|
| **This baseline** | `dd01f34` | main @ 2026-08-22, everything below verified against it |
| KV → Postgres | `d8ce20a` | PR #453 — final KV backend |
| KV → Redis | `66a3e40` | PR #452 — superseded by #453, kept for history |
| Express migration | `a37b2c1` | PR #446 — the Vercel→Railway code change |
| **Last pre-migration commit** | `5df8d82` | main @ 2026-08-19, last commit still Vercel-shaped |

Prior vaults: `vault-2026-06-29-pre-step23`, `anchor-pre-codex-v3.0.150`.

---

## 3. Infrastructure map

### Railway

| Thing | Value |
|---|---|
| Project | `Job-Analysis` — `608a79c5-02f5-45b8-b69e-c7c3cb42ac24` |
| Environment | `production` — `435c28e8-fcd2-4745-b604-0fbbc57ceb47` |
| Web service | `v3-web` — `c5ef0eed-256a-45eb-98fe-191a6b7ffefb` |
| Substrate service | `2026-0313_AI-JS` — `9e88aab6-b32b-456c-9aab-4bedfb9b14af` |
| Build config | Railpack; root `/v3`; build `npm run build`; start `npm start` |
| Healthcheck | `/health`, 30s timeout; restart ON_FAILURE, max 3 |
| Region | `asia-southeast1-eqsg3a` |
| Railway domain | `v3-web-production.up.railway.app` |

The substrate is a **pre-existing C++ service**, not part of this migration. It
predates it and was already called from production.

### DNS — read this before touching anything

Nameservers for `takearoundabout.com` are `ns1.vercel-dns.com` /
`ns2.vercel-dns.com`. **Vercel hosts the DNS zone even though Railway now hosts
the app.**

> When decommissioning, delete the Vercel **project**, never the **domain**.
> Deleting the domain tears down the zone both Railway CNAMEs live in and takes
> both sites offline.

| Name | Type | Value |
|---|---|---|
| `v3` | CNAME | `z9bocefl.up.railway.app` |
| `_railway-verify.v3` | TXT | `railway-verify=828b345…` |
| `v98197694700` | CNAME | `v7i27i2a.up.railway.app` |
| `_railway-verify.v98197694700` | TXT | `railway-verify=8b0ba1c…` |
| `*` | ALIAS | `cname.vercel-dns-016.com` — **still Vercel** |
| apex | ALIAS | `3e08ad8a49d94e27.vercel-dns-016.com` — **still Vercel** |

The wildcard and apex still point at Vercel. Anything relying on either will
break when the Vercel project is deleted. Zone also carries improvmx MX/SPF
(email) and CAA records limiting issuance to pki.goog / sectigo.com /
letsencrypt.org — Railway uses Let's Encrypt, which is why issuance worked.

**Add the TXT record BEFORE the CNAME.** Doing it the other way round on
`v98197694700` took the live site down for ~5 minutes with a hard TLS failure:
DNS pointed at Railway while Railway had no certificate yet.

---

## 4. Architecture map

### `v3/server.js` — the new entry point

Replaces `vercel.json`'s per-file functions, rewrites and headers with one
Express server:

- `express.static` on `dist/`, cache split preserved — `/assets/*` immutable
  one year, `*.html` no-store.
- All 19 handlers mounted under `/api`, unchanged. Every one already used the
  portable `(req, res)` Node signature, so none needed rewriting.
- `express.json({ limit: "2mb" })` — the default 100kb would reject valid
  requests, since `api/claude.js` allows 200,000-char prompts.
- `/demo → demo.html` rewrite and SPA fallback, matching `vercel.json`.
- Same security headers, minus the Vercel-analytics CSP allowances.
- Listens on `process.env.PORT`; exposes `/health`.

### Data layer

- **Postgres** via plain `pg` (was `@vercel/postgres`, which existed only as a
  bundler workaround). Used by `api/ssoc.js`, `api/ssic.js`, `api/anatomy.js`.
- **KV** — `v3/lib/admin/kv.js`, backed by the SAME Postgres, table `kv_store`
  (`key` PK, `value` jsonb, `expires_at`, `updated_at`), created on first use.
  Module-level `pg.Pool` (max 4). Exports unchanged: `kvAvailable()`,
  `kvGet()`, `kvSetJson()`. Eleven call sites untouched.
  - No native TTL, so expiry is **lazy**: an expired row reads as absent and is
    deleted on the way past. Only `api/esco.js` sets a TTL (30-day cache).
- **Substrate** — `SUBSTRATE_URL` set to the private address
  `http://2026-0313ai-js.railway.internal:8080`. Note all four callers default
  to the PUBLIC URL if unset, so an unset variable degrades silently rather
  than failing.

### Environment variables on `v3-web`

`ANTHROPIC_MODEL`, `CLAUDE_API_KEY`, `DATABASE_URL`, `DATA_GOV_SG_API_KEY`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL_KEY`,
`POSTGRES_URL`, `PRISMA_DATABASE_URL`, `SUBSTRATE_URL`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_GATE_ENABLED`, `TELEGRAM_OWNER_CHAT_ID`, `ADMIN_SESSION_SECRET`,
plus Railway's own `RAILWAY_*`.

`ADMIN_SESSION_SECRET` is app-owned, not issued by anyone — an HMAC key for the
session cookie. It gates admin login, visitor sessions AND `/api/state`
identity. An empty value behaves exactly like a missing one (`if (!secret)`).

Dangling and safe to remove: `REDIS_PRIVATE_URL` (references a Redis service
that was never provisioned) and the unused `v3-web-volume` mount. **Remove the
variable before deleting any Redis service** — a reference to a non-existent
service resolves to empty.

---

## 5. What the shared process changed (keep this in mind)

Under Vercel each handler ran in its own process. Under Express they share one.
Three real consequences, all already fixed:

1. **`process.env` mutation became cross-handler corruption.** `ssoc.js`,
   `ssic.js` and `anatomy.js` each wrote back to `process.env.POSTGRES_URL`;
   harmless when isolated, a data-corruption risk when shared. All three now
   resolve into a local `const`. **Do not reintroduce this pattern.**
2. **Body limits are global.** `express.json()`'s 100kb default silently capped
   a 200,000-char contract.
3. **Connections should be pooled, not per-request.** `kv.js` uses a pool. The
   other `api/*.js` files still open per-request clients — a legacy of the
   Vercel model, and a reasonable future cleanup.

---

## 6. Verified state (2026-08-22)

All live HTTP, both custom domains plus the Railway domain:

| Check | Result |
|---|---|
| `/health` × 3 hosts | `{"ok":true}`, `ssl_verify=0` |
| `/api/ssoc` — Postgres | `db:true`, 1,632 nodes, 1,006 occupations |
| `/api/ssic` — classify + ACRA | real classification; ACRA queried |
| `/api/state` — KV | write and read back; per-device isolation confirmed |
| `/api/claude` — LLM | real OpenAI response |
| `/api/suggest` — substrate | real data, `synthetic:false` |
| `/api/whoami`, `/api/login`, `/api/admin/*` | configured; 401 not 500 |
| `/demo`, SPA fallback | 200 |

`kv.js` also passed 10/10 against a real PostgreSQL 16 including 40 concurrent
writes and reads against a pool of 4, and a 60KB payload.

### Known gaps — genuinely open

- **No browser walkthrough has been done.** Every endpoint responds correctly;
  nobody has confirmed the app *works* — Step 1 → 2 → 3, or a real Telegram
  login. This is the largest unverified surface in this baseline.
- **`api/anatomy.js`'s DB path is Not Verifiable** from outside: its read
  actions return `{"hit":null}` / `{"logs":[]}`, byte-identical to its degraded
  responses. Only a write test would discriminate, and none was run against
  production.
- Three features were found **already broken on Vercel**, not by this work: the
  ACRA lookup, `anatomy.js`'s store, and all KV-backed features (the Vercel KV
  credentials no longer exist, so that store was already gone).

---

## 7. Version note

No version bump was made. `CLAUDE.md` Rule V-1 requires Human Lead confirmation
for every bump, and R003 requires `App.jsx` line 1, `index.html` title and
`README.md` to move together. The migration would plausibly qualify as
`architecture_rewrite` (major) under `bump_decision`. Left for the owner to
decide deliberately rather than assumed here.

---

## 8. How to restore / roll back

```bash
# code, back to the last pre-migration commit
git checkout 5df8d82

# or to this baseline
git checkout vault-2026-08-22-post-railway-migration
```

**To roll DNS back to Vercel** — Vercel project still live and unchanged. In
the Vercel DNS panel, delete the Railway CNAME for the affected name and
restore its A records:

| Name | A records |
|---|---|
| `v3` | `216.150.1.65`, `216.150.16.193` |
| `v98197694700` | `216.150.16.129`, `216.150.1.129` |

Leave the `_railway-verify.*` TXT records; they are inert when unused.

**Deferred cleanup, in this order:** remove `REDIS_PRIVATE_URL` from `v3-web` →
delete any Redis service → detach `v3-web-volume` → deploy once → then delete
the Vercel **project** (never the domain, per §3).
