# Research & design — "Singapore Career View": a labour-market intelligence layer on MyCareersFuture

> **Status: RESEARCH / DESIGN ONLY — do not build yet.** This document is the deliverable for this round
> (user: "Research first, don't build"). It records (1) what MyCareersFuture exposes, (2) the architecture
> we'd use, (3) the research grounding for the "gaps / can agents fill them" analysis, and (4) a phased
> build plan + open decisions for when the user says go.

## 1. Context — what's being asked and why

The user wants a **"Career view of Singapore for the past ~1 month, built on MyCareersFuture (MCF)"** —
a national labour-market picture, not the existing per-role analyser. Concretely: model the MCF data
schema; scan MCF for how many jobs are listed (today / "new in the last 9 days" / last 30 days);
salary ranges; job types (full-time / part-time / contract); employer type / size / sector (+ "financial
news, etc."); download jobs + responsibilities + a company identity code + sector; **strip
outsourcing/staffing-agency postings**; then synthesise **what gaps organisations are trying to fill** and
**which of those an AI agent could fill** — grounded in research on organisation redesign / reorganisation /
job redesign / role insights / futurism ("think 95%, research the world for … research papers …").

Decisions already taken with the user (for the eventual build): **daily Vercel Cron → Postgres** snapshots
(so the "past month" accrues over time and genuinely-new postings are detectable); a **standalone page**
(like the existing `?debug=logs` viewer, e.g. `?view=sg-market`), not a tab in the per-role app; and the
gap/agent analysis runs as an **`/api/claude` pass that also pulls a little live external context**.

### What the codebase already gives us (so we reuse, not rebuild)
- `v3/api/mcf.js` (~340 lines, `maxDuration: 60`) — a working MCF proxy: hits
  `https://api.mycareersfuture.gov.sg/v2/jobs?search=<q>&limit=<n>&offset=0` and `…/v2/jobs/<uuid>` for
  detail; `normaliseJob()` (~L125-169) already extracts `uuid, title, employer (postedCompany.name ||
  hiringCompany.name || metadata.companyName), salaryMin/Max, employmentType, postedDate
  (metadata.originalPostingDate||newPostingDate), expiryDate, minimumYearsExperience, positionLevels[],
  schemes[], description (≤4000 chars), responsibilitiesText (heuristic section extraction, ≤2500),
  categories[], skills[] (≤12), mcfUrl`. Has timeouts, an 8-outbound-call budget, dedupe-by-uuid, a
  3-tier search cascade. **Strips recruiter PII deliberately.** This is the de-facto MCF schema source of truth.
- `v3/api/anatomy.js` (`maxDuration: 15`, `@vercel/postgres`) — the persistence layer: `ensureTables()`
  creates `anatomy_runs / screening_profiles / screen_keyword_gaps / pipeline_logs` (all with `created_at`,
  versioned by `(role_key, version, created_at DESC)` indexes); actions `get/put/getProfile/putProfile/
  recordGap/log/recentLogs`; sanitiser helpers `str(x,max)`, `arr(x,max,len)`, the swallow-and-return-empty
  error pattern, ~1%-random retention sweeps. **The pattern to copy** for new tables/actions.
- `v3/api/claude.js` (`maxDuration: 300`) — Anthropic proxy: Haiku (`claude-haiku-4-5-20251001`) by
  default, Sonnet on request; prompt-cache `cache_control: ephemeral` auto-injected when the system prompt
  ≥16k chars; maps Anthropic 401/403→BUSY ("daily cap"), 429/529→OVERLOAD, ≥500→SERVER (the UI's
  "busy day / reached our limit" wording). **Reuse for the gap-analysis LLM pass + cache the big framework
  prompt.**
- `v3/api/esco.js` — `action:"skills"` (title→ESCO essential skills + ISCO major group) and
  `action:"occupationFingerprint"` (skill phrases → best-matching ESCO occupations). Lets us tie an MCF
  posting to an ISCO-08 occupation family — useful for sector/occupation rollups and for joining to the
  per-role analyser (`buildRoleGraph` already does this).
- `v3/api/datagov.js` (`maxDuration: 30`, in repo but **removed from the UI**) — data.gov.sg MOM job-vacancy
  trend (ISCO major group → MOM occupational-group label → dataset 690, last 12 quarters + YoY). A ready
  macro counterpoint to the MCF micro-data; could be resurfaced inside the new page.
- `v3/vercel.json` — `regions: ["sin1","hnd1"]`, `fluid: true`, per-function `maxDuration` (300/60/60/30/15
  ⇒ **Pro plan** — so a `crons` array is available), CSP `connect-src` already allows
  `api.anthropic.com`, `api.mycareersfuture.gov.sg`, `api-production.data.gov.sg` (a new external
  research/news source would need adding here). **No `crons` array today.**
- `v3/src/App.jsx` (~8.6k lines, one file): a standalone page is wired the way `PipelineLogsView` /
  `?debug=logs` is — `main.jsx` renders `<PipelineLogsView/>` instead of `<App/>` when the query string
  matches. We'd add `<SgMarketView/>` the same way (`?view=sg-market`). No new build config needed.
- `package.json` — Vite + React 18, deps: `@vercel/postgres ^0.10`, `@vercel/analytics`,
  `@vercel/speed-insights`. Node 22. No new dependency needed for any of this.
- **No existing notion of "outsourcing / staffing-agency / recruiter" classification, no company-UEN
  capture, no `numberOfVacancies`, no longitudinal/snapshot store, no cron.** Those are the net-new pieces.

## 2. The MyCareersFuture schema (as we'd model it)

> Field names below come from `v3/api/mcf.js`'s `normaliseJob()` (verified, in-repo) plus the public MCF
> v2 API as used by community scrapers — **exact raw key names must be re-confirmed against a live
> response before coding** (see Open Questions). MCF's API is unauthenticated and undocumented but stable.

**Endpoints**
- `GET  /v2/jobs?search=<q>&limit=<n>&page=<p>` — keyword search (what the proxy uses today).
- `POST /v2/search` — body `{ search, sortBy: "new_posting_date" | "relevancy", limit, page, salary,
  employmentTypes:[…ids], categories:[…ids], postingCompany:[…], … }` → `{ results:[…job…], total:<int>,
  countsBy…:{…} }`. **This is the one for a national feed**: `sortBy:"new_posting_date"` + `page` walks
  the most-recent postings; `total` is the headline "how many jobs are live" number; the `countsBy…`
  facets give salary-band / employment-type / category breakdowns *without downloading every job*.
- `GET  /v2/jobs/<uuid>` — full posting (HTML description, company block, etc.).

**A job object (the fields we'd persist / derive)**
| group | fields | notes |
|---|---|---|
| identity | `uuid`, `metadata.jobPostId`, `metadata.jobDetailsUrl` → `mcfUrl` | uuid = stable key for new-vs-seen detection |
| role | `title`, `description` (HTML), `skills[]`, `categories[]` (job category ≈ sector bucket), `ssocCode` / `ssecEqaCode` (Singapore Standard Occupational Classification — *if present*; lets us roll up by occupation) | the proxy already pulls `skills`/`categories`; **`ssocCode` is not captured yet** |
| level / type | `positionLevels[]` (Fresh/Entry/Junior/Senior/Manager/…), `employmentTypes[]` (Full Time / Part Time / Contract / Temporary / Permanent / Internship / Freelance), `minimumYearsExperience`, `numberOfVacancies` | **`numberOfVacancies` not captured yet** — needed for true demand counts |
| pay | `salary.minimum`, `salary.maximum`, `salary.type.salaryType` ("Monthly" \| "Annually") | proxy captures min/max but **not the Monthly/Annual flag** — must normalise to a common basis before computing ranges |
| dates | `metadata.originalPostingDate`, `metadata.newPostingDate`, `metadata.expiryDate` | "new in last 9 days" = `newPostingDate` (or first-seen date in our snapshot) within the window |
| employer | `postedCompany.{name, uen, description, employeeCount?, ssicCode?}`, `hiringCompany.{name, uen, …}` (often null), `metadata.isPostedOnBehalf` (bool) | **company UEN / SSIC industry code / employee-count not captured yet** — the "company identity code, sector, size" the user wants. UEN is the government company registration number = the "identity code". `isPostedOnBehalf` + `hiringCompany ≠ postedCompany` = the primary **outsourcing/agency** signal |
| engagement | `metadata.totalNumberOfView`, `metadata.totalNumberJobApplication` | optional — competitiveness signal |
| govt | `schemes[]` (e.g. SkillsFuture / WSQ / mid-career schemes) | already captured |

**Derived fields we'd compute & store**
- `salary_monthly_min/max` (normalised from Monthly/Annual), `salary_band` (e.g. <3k / 3–5k / 5–8k / 8–12k / 12k+).
- `seniority_band` from `positionLevels` (Entry / Mid / Senior / Lead / Exec).
- `is_outsourcing` (heuristic — see §3.3) and `outsourcing_reason`.
- `isco_major` / occupation family (via `esco.js occupationFingerprint` on the skill phrases, or `ssocCode` if MCF supplies it) — lets us roll up demand by occupation, not just MCF's coarse `category`.
- `company_key` = lowercased UEN if present else lowercased name; `company_sector` = SSIC name if present.
- `first_seen_date` (the snapshot date we first saw the uuid) — the reliable "new posting" anchor.

## 3. Architecture for the build (when approved)

### 3.1 Storage — new tables in `v3/api/anatomy.js`'s `ensureTables()`
- `mcf_postings` — one row per (uuid): `uuid PK, first_seen DATE, last_seen DATE, title, company_key, company_name, company_uen, company_sector, sector_category, isco_major INT, position_levels JSONB, seniority_band, employment_types JSONB, employment_kind (full/part/contract/other), salary_min_monthly INT, salary_max_monthly INT, salary_band, num_vacancies INT, posted_date DATE, expiry_date DATE, is_outsourcing BOOL, outsourcing_reason TEXT, skills JSONB, responsibilities_text TEXT (only for the sampled subset — see §3.2), mcf_url TEXT, raw JSONB (trimmed), updated_at TIMESTAMPTZ`. Indexes on `first_seen`, `posted_date`, `(sector_category, first_seen)`, `(is_outsourcing)`.
- `mcf_market_daily` — pre-aggregated rollup, one row per `(snapshot_date, dimension, key)`: counts, sums, p25/p50/p75 salary, etc., so the page reads ~instantly. (Dimension ∈ {overall, sector, employment_kind, seniority_band, salary_band, isco_major, top_company, top_title}.)
- `sg_market_reports` — the LLM "gap analysis" output, one row per `(report_date, version)`: `summary JSONB, gaps JSONB, agent_opportunities JSONB, external_context JSONB, model TEXT, created_at`. Cheap to re-serve; regenerated daily (or on demand, throttled).
- Reuse the existing `str/arr` sanitisers, the `_tableEnsured` guard, the swallow-and-return-empty error
  pattern, and ~1%-random retention sweeps (e.g. keep `mcf_postings` ~90 days, `mcf_market_daily` ~400 days).

### 3.2 Ingestion — a daily Vercel Cron
- Add `"crons": [{ "path": "/api/cron-mcf", "schedule": "0 18 * * *" }]` to `vercel.json` (SGT-friendly time)
  and a new `v3/api/cron-mcf.js` (`maxDuration: 60–300`; protected by checking the Vercel-supplied cron
  header / a secret). Each run:
  1. Walk `POST /v2/search?sortBy=new_posting_date` page by page (PAGE_SIZE ≈ 30–100) until it reaches
     postings older than the last run / a hard page cap (e.g. ≤ ~30 pages → a few thousand of the freshest
     postings) — respecting per-call timeouts and a total-call budget like `mcf.js` already does. Record
     `total` (the headline live-jobs count) verbatim.
  2. Upsert each into `mcf_postings` (`first_seen` set once; `last_seen`/`updated_at` refreshed); compute
     the derived fields (§2). For company UEN/SSIC/size: read from the job object if present, else best-effort
     enrich a *bounded* number of *new* companies per run via the MCF company endpoint or skip (Open Q).
  3. For a **bounded sample of the day's genuinely-new, non-outsourcing postings** (e.g. ≤ ~80, stratified
     across sectors), fetch `…/v2/jobs/<uuid>` detail and store `responsibilities_text` (reuse `mcf.js`'s
     `extractResponsibilities`). Full-corpus download of all SG jobs is infeasible in a serverless run —
     facets answer the *counts*, the sample feeds the *qualitative* gap analysis.
  4. Recompute `mcf_market_daily` rollups for the snapshot date (deterministic SQL/JS — no LLM).
  5. Once a day, after ingestion, call the gap-analysis pass (§3.4) and write `sg_market_reports`.
- A manual `?run=cron-mcf&key=…` trigger (or a "refresh now" button on the page, throttled) so it's testable
  without waiting for the schedule. Everything best-effort: a failed run leaves yesterday's data intact.

### 3.3 The outsourcing / staffing-agency filter
A deterministic classifier (no LLM) on each posting, producing `is_outsourcing` + a reason string:
- **Strong**: `metadata.isPostedOnBehalf === true`, or `hiringCompany` present and ≠ `postedCompany` (a
  recruiter posting for a client) → `posted_on_behalf`.
- **Company-name patterns** (case-insensitive, word-boundary): `recruit*`, `staffing`, `manpower`,
  `headhunt*`, `talent acquisition`, `placement`, `outsourc*`, `BPO`, `payroll`, `RPO`, `executive search`,
  `HR solutions/consulting` + the known SG agency brands (Recruit Express, Adecco, ManpowerGroup,
  RecruitFirst, PERSOLKELLY, Randstad, Robert Walters, Michael Page, Hays, Kelly Services, Capita,
  ScienTec, GMP, Trust Recruit, …) → `agency_name`.
- **Posting-text markers**: "on behalf of our client", "our client is", "MNC client", "outsourced
  headcount", "deployed/seconded to client site", "agency contract", "you will be employed by [agency]" →
  `outsourced_language` (run on `responsibilitiesText`/`description` only for the sampled subset; for the
  rest fall back to name + on-behalf signals).
- The page shows totals **both** including and excluding outsourcing (toggle), since "remove those that
  seem like outsourcing work" is the user's intent but the raw count is still informative. A small
  precision/recall caveat is surfaced in the UI ("heuristic — may misclassify").

### 3.4 The "gaps / can agents fill them" analysis — `/api/claude` pass + a little external context
- **Input** (all derived, no PII): the daily rollups (counts, "today / new-9-day / 30-day", salary
  bands, employment-kind mix, top sectors / occupations / titles / hiring companies, growth deltas vs the
  prior week from `mcf_market_daily`), the **deduped top responsibilities/requirements** clustered from the
  sampled non-outsourcing postings (reuse the `buildResponsibilitiesData` clustering ideas — frequency-
  ranked duty statements), and a short **live external-context blob** fetched at report time (1–3 items:
  WEF Future-of-Jobs / Anthropic Economic Index / Singapore MOM labour-market report / WSG Jobs
  Transformation Maps — a small allow-listed set added to the CSP `connect-src`; cached daily; truncated;
  best-effort — the pass works without it).
- **System prompt** carries a **baked-in research framework** (cached via `cache_control: ephemeral`,
  ~the §4 synthesis condensed) so the model reasons with real concepts rather than vibes. It must label,
  not invent, and stay grounded in the supplied numbers/quotes.
- **Output JSON**:
  - `marketSummary` — 2–3 sentences on what the month's SG demand looks like.
  - `gaps[]` — each: `{ gap, evidence (which numbers/duties), whichRoles, sectors, whyNow, type ∈
    {capacity, capability, redesign-opportunity, structural} }` — i.e. *what organisations are actually
    trying to fill*, read off the demand signal.
  - `agentOpportunities[]` — each gap mapped to: `{ gap, agentFit ∈ {high/partial/low}, whichTasks (the
    task slices an agent could take, per the Anthropic-Economic-Index "automation vs augmentation" lens),
    humanResidual (what stays human — presence/judgment/accountability, per the existing Job-Anatomy
    layers), redesignMove (the job/org-redesign play: deconstruct→reallocate tasks, skills-based pooling,
    new "AI-supervisor" roles, etc.), risks }`.
  - `orgRedesignNotes[]` — 2–4 system-level observations (e.g. "X% of new vacancies are 'new roles' →
    reorganisation, not just backfill"; "clerical demand falling while data/AI rising → reskilling lanes").
  - `sources[]` — the external items actually used.
- Regenerated daily by the cron; also re-servable via a throttled "regenerate" button. Surfaced on the page
  alongside the deterministic charts, clearly marked "AI-generated interpretation".

### 3.5 The page — `?view=sg-market`, standalone (like `?debug=logs`)
`main.jsx` renders `<SgMarketView/>` when `new URLSearchParams(location.search).get("view") === "sg-market"`.
Sections, top to bottom: **headline counters** (live jobs / posted today / new in last 9 days / last 30
days, with the outsourcing-excluded variant); **salary** (band histogram + p25/p50/p75, by sector toggle);
**employment kind** (full/part/contract/temp/intern) and **seniority** mixes; **top sectors / occupations
/ titles / hiring companies** (with outsourcing flagged); a **trend strip** (counts over the accrued days
+ optionally the MOM macro vacancy line from `datagov.js`); the **"What gaps are organisations filling?"**
panel (the LLM `gaps[]`); the **"Where could agents help?"** panel (`agentOpportunities[]` + the
human-residual / redesign notes); a **methodology / caveats** footer (heuristic outsourcing filter, sample
size for the qualitative bits, MCF-only coverage, "AI-generated interpretation", privacy: derived data
only, no PII). Reuse the existing card styles, `C` palette, the small SVG sparkline approach, and the
`PipelineLogsView` "fetch-on-mount + refresh button" pattern.

## 4. Research synthesis — the framework to ground the analysis ("research the world…")

Distilled from the sources in §6. This is what gets condensed into the LLM system prompt and shown (lightly)
on the page so the "gaps / agents" reasoning is anchored to real thinking, not improvised.

**A. Demand signal → "gaps" — how to read job ads as organisational intent.** A burst of vacancies is an
organisation declaring *work it can't currently get done*: either **capacity** (more of the same), **new
capability** (skills it didn't have), **a redesign opportunity** (work that *could* be re-split between
people, contractors, and AI), or **structural change** (re-org — new functions, new layers, new operating
model). Singapore-specific anchor: MOM's 2025 labour-market report — *~1 in 2 job vacancies in 2025 were
"new roles"* — i.e. demand is substantially about reorganisation/transformation, not just backfill.

**B. What's growing / shrinking (WEF Future of Jobs 2025).** Net **+78m jobs by 2030** globally but a
**"great skills reset"** (~39–40% of core skills change). **Fastest-growing**: AI & big-data specialists,
fintech engineers, software/app developers, data-warehousing, plus green/energy-transition roles; in
**absolute** terms farmworkers, delivery drivers, software devs, construction, sales. **Fastest-declining**:
clerical/secretarial — cashiers, admin assistants, data-entry clerks, bank tellers, postal clerks.
**Skills**: AI & big data, networks/cybersecurity, tech literacy rising fastest; creative thinking,
resilience/agility, curiosity/lifelong learning also up; manual dexterity/precision/endurance down.
**Singapore**: "finding skilled talent" is the #1 transformation barrier; big-data / AI-ML / data-warehousing
among fastest-growing locally; data-entry clerks and software testers declining.

**C. What AI agents can actually take (Anthropic Economic Index, 2026).** ~**49% of jobs** see AI used for
≥¼ of their tasks; only ~**4%** for ≥¾ — AI bites at the **task** level, not the **job** level. Coding/agentic
use skews **automation** (≈79% on Claude Code) vs **augmentation** (≈49% on Claude.ai). Front-of-stack web
work (JS/HTML/UI) is disrupted sooner than deep backend. First-order effect is to **deskill** — AI removes
the higher-education tasks first. ⇒ The right unit of analysis is *which task slices of a vacancy* an agent
could do, what **human residual** remains (presence, physical action, accountability, framing under
ambiguity — the existing **Job-Anatomy layers**: Activity / Coordination / Accountability / Relational /
Judgment), and therefore how the job should be *redesigned* around the agent.

**D. Job redesign — "redesign work, not jobs."** (Boudreau & Jesuthasan *Work Without Jobs*; Deloitte
future-of-workforce-planning; Bersin.) **Deconstruct** jobs into tasks → **reallocate** each task to the
best of {full-time employee, gig/contractor, automation, AI agent} → **reconstruct** new roles around the
human residual (Unilever's 80,000-task exercise is the canonical example). Implications for the gap
analysis: a vacancy isn't necessarily "a job to hire" — it can be "a task bundle to re-split", which is
precisely the *agent opportunity*.

**E. Organisation redesign — the levers (Galbraith Star Model; McKinsey "Organize to Value", 2025).**
Org design = aligning **Strategy → Structure → Processes → Rewards → People** (Galbraith's 5 points);
McKinsey's 2025 refresh: ~79% of operating-model redesigns now complete (vs 51% in 2014), driven by leader
alignment, rewiring core processes, investing in people, sustaining culture; their "Organize to Value" =
12 tailorable elements. A spike of vacancies in a *new* function/title across many employers is a
reorganisation signal, not just hiring — name it as such.

**F. Skills-based organisation / talent marketplaces (Deloitte, Mercer).** Shift from fixed jobs to a
dynamic landscape of **skills** deployed via internal **talent marketplaces** and an updated **job
architecture / skills taxonomy**; skills-based orgs reportedly ~79% more likely to deliver a positive
workforce experience, ~63% more likely to hit results. Implication: some "gaps" are better closed by
**pooling existing skills internally** (or by agents) than by net-new headcount — flag that.

**G. Singapore policy scaffolding (WSG / SkillsFuture).** 19 **Jobs Transformation Maps** (incl. an
Oct-2025 *Impact of Gen-AI on Financial Services* JTM by MAS/IBF/WSG — "majority of finance roles to be
*augmented*"), the **Skills Framework**, **Job-Redesign reskilling** funding, the **Jobs-Skills Portal /
Job Requirements Dashboard**, "skills-first" advantage. Useful to cite when recommending reskilling lanes
and to sanity-check which sectors are officially flagged for transformation.

**Net stance for the product**: read MCF demand → classify gaps (B+A) → for each gap, map the task-level
agent fit (C) and the redesign move (D/E/F) → recommend whether to *hire / pool internally / deploy an
agent / re-org*, with the Singapore scaffolding (G) as the local context. Always label it as
interpretation, show the underlying numbers, and keep the privacy posture (derived data only, no PII).

## 5. Phased build plan (for when the user approves)

1. **Phase 1 — schema & ingestion (no UI yet).** Confirm the live MCF `/v2/search` response shape; add the
   `mcf_postings` / `mcf_market_daily` tables + sanitisers to `anatomy.js`; build `api/cron-mcf.js`
   (paginate recent feed, upsert, derive fields incl. salary normalisation + seniority/employment-kind
   bands + outsourcing classifier; record `total`); add the `crons` entry; add a guarded manual-trigger.
   Add `numberOfVacancies`, `ssocCode`, `salary.type`, `postedCompany.uen/ssicCode`, `metadata.isPostedOnBehalf`,
   `hiringCompany` to the proxy mapping (and to `mcf.js` for consistency). **Verify with SQL queries.**
2. **Phase 2 — the page.** `SgMarketView` at `?view=sg-market` (routed in `main.jsx`): headline counters,
   salary, employment-kind, seniority, top sectors/occupations/companies, trend strip, methodology footer.
   All deterministic, reading `mcf_market_daily` + `mcf_postings`. "Refresh now" (throttled) wired to the
   manual trigger.
3. **Phase 3 — sampled detail + responsibilities corpus.** In the cron, fetch detail for a bounded
   stratified sample of new non-outsourcing postings, store `responsibilities_text`; cluster into ranked
   duty/requirement statements (reuse `buildResponsibilitiesData` ideas) into `mcf_market_daily` (or a
   small `mcf_demand_themes` table).
4. **Phase 4 — gap/agent analysis.** Add the allow-listed external sources to the CSP; `api/cron-mcf.js`
   (or a new `api/sg-market-report.js`) calls `/api/claude` with the §4 framework prompt (cached) + the
   rollups + duty themes + external blob; write `sg_market_reports`; surface the two panels on the page;
   add a throttled "regenerate" button. Clear "AI-generated interpretation" labelling.
5. **Phase 5 (optional) — enrichment & joins.** Company UEN→SSIC industry & size enrichment (bounded);
   `isco_major` via `esco.js occupationFingerprint`; resurface the MOM macro vacancy line (`datagov.js`)
   in the trend strip; deep-link from a sector/title in `SgMarketView` into the existing per-role analyser.

## 6. Open questions / decisions still needed before building

- **Coverage vs. cost**: cap the daily crawl at ~N pages (a few thousand freshest postings) — accept that
  it's "recent SG postings", not "every SG posting"? (Recommended yes; the headline `total` is still exact.)
- **Company enrichment**: skip UEN→SSIC-industry/employee-count for v1 (use `category` as "sector"), or do
  a bounded best-effort enrichment per run? Is there a free/government company-registry endpoint we may use,
  and does the MCF job object already carry `postedCompany.uen` / `ssicCode` / `employeeCount`? (Needs a
  live-response check.)
- **"Financial news, etc."**: out of scope for v1 (needs a news API, ToS/cost questions) — confirm OK to
  defer, or is a specific source intended?
- **Sample size for the qualitative pass**: ~80 detail fetches/day enough, or should it grow over the
  month (cumulative themes)?
- **Outsourcing filter**: ship the heuristic with a visible caveat, or hold the "remove outsourcing" claim
  until it's validated against a hand-labelled sample?
- **External-context allow-list for the LLM pass**: which exact domains/URLs (WEF / Anthropic / MOM / WSG)
  go into the CSP, and is daily caching + truncation acceptable?
- **Refresh/throttle policy** for the manual buttons (to avoid hammering MCF / burning Claude budget).

## 7. Sources (research grounding for §4)

- WEF — *Future of Jobs Report 2025* (fastest-growing/declining jobs & skills; Singapore section; "78M new jobs by 2030"; "great skills reset"): https://www.weforum.org/publications/the-future-of-jobs-report-2025/ ; press release https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/ ; fastest growing/declining https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/ ; skills outlook https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/ ; region/economy/industry https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/5-region-economy-and-industry-insights/
- Anthropic — *Economic Index* (task-level AI use; ~49% of jobs ≥¼ tasks, ~4% ≥¾; automation vs augmentation; deskilling): https://www.anthropic.com/economic-index ; https://www.anthropic.com/news/the-anthropic-economic-index ; https://www.anthropic.com/research/economic-index-march-2026-report ; https://www.anthropic.com/research/economic-index-primitives ; built-in summary https://builtin.com/articles/anthropic-economic-index-2026-ai-jobs-report
- McKinsey — *The new rules for getting your operating model redesign right* (2025; "Organize to Value", 79% vs 51% success): https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-new-rules-for-getting-your-operating-model-redesign-right
- Galbraith Star Model (Strategy/Structure/Processes/Rewards/People): https://strategicmanagementinsight.com/tools/galbraiths-star-model-explained/ ; org-design model overviews https://www.aihr.com/blog/organizational-design-models/
- Deloitte — *Reinventing workforce planning for an AI-powered world* / *From jobs to skills to outcomes* / *The skills-based organization* / *Agentic AI… reshaping how organizations plan*: https://www.deloitte.com/us/en/insights/topics/talent/future-of-workforce-planning/reinventing-workforce-planning.html ; https://www.deloitte.com/us/en/insights/topics/talent/future-of-workforce-planning/planning-work-outcomes.html ; https://www.deloitte.com/us/en/insights/topics/talent/organizational-skill-based-hiring.html ; https://www.deloitte.com/us/en/insights/topics/talent/future-of-workforce-planning/autonomous-workforce-planning.html
- Josh Bersin — *Job Redesign Around AI: Work Intelligence Tools Arrive* (2025): https://joshbersin.com/2025/03/job-redesign-around-ai-work-intelligence-tools-arrive/
- Mercer — *The evolution of job architecture* / *Skills-powered talent practices*: https://www.mercer.com/insights/talent-and-transformation/skill-based-talent-management/the-evolution-of-job-architecture-in-the-tech-industry/ ; https://www.mercer.com/en-us/solutions/talent-and-rewards/skills-based-talent-practices/
- Boudreau & Jesuthasan — *Work Without Jobs* (deconstruct→reallocate→reconstruct; Unilever 80k tasks) — via Deloitte/Bersin summaries above.
- Singapore — WSG **Jobs Transformation Maps** (19 JTMs; *Impact of Gen-AI on Financial Services* JTM, Oct 2025, MAS/IBF/WSG): https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps ; https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps/jobs-transformation-map-generative-ai ; SkillsFuture Jobs-Skills Portal https://jobsandskills.skillsfuture.gov.sg/sdfe-2025 ; WSG "Realising the Skills-First Advantage" https://www.wsg.gov.sg/docs/default-source/content/sfx-jsi-2025.pdf ; MOM 2025 labour-market report — "~1 in 2 job vacancies in 2025 are new roles" (via Mothership): https://mothership.sg/2026/03/labour-market-job-vacancies-report-2025/
- MyCareersFuture — portal & community wrappers (API shape reference; **re-verify against a live response**): https://www.mycareersfuture.gov.sg/ ; https://github.com/gabrielchua/mcf-jobs ; https://github.com/pwaaron/jobscrapers ; MCF user FAQ https://static.mycareersfuture.gov.sg/docs/mycareersfuture_sg_user_faqs.pdf — plus the in-repo `v3/api/mcf.js` `normaliseJob()` (~L125-169) as the de-facto schema we already consume.
