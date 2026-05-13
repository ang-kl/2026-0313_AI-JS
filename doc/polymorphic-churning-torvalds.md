# Research & design (v2) — "Singapore Career View": a labour-market intelligence layer on MyCareersFuture

> **Version:** v2 (2026-05-13). Supersedes the v1 of this file. **Status:** the *conceptual foundation* —
> the "why & what". The *execution sequencing* (phase order, surfaces, model tiering, cost) is owned by
> **`doc/development-plan.md`**; this v2 is reconciled to it. Improvement notes that produced this v2 are in
> **`doc/deep-research-report.md`**. **Build-readiness gate:** this document is *not* the authoritative
> build brief until Phase 0 (live-schema verification, §7) is done and §2's "verified schema" table is
> filled in.

## 0. Non-negotiables (the enduring core — keep these through any future revision)

1. **A standalone national labour-market layer**, not a tab in the per-role analyser.
2. **Reuse the existing v3 codebase / Vercel project** (Postgres, `/api/claude`, `/api/mcf`, `/api/esco`,
   the CSP, the `?debug=logs` standalone-page pattern). No new infra; no new dependency.
3. **Deterministic market rollups first; AI-generated interpretation second** — core counts stay
   auditable and cheap to recompute; nothing the LLM says ships without a deterministic evidence trail.
4. **The outsourcing/staffing filter is a separate classifier** layered on top — the raw market count is
   always preserved alongside the filtered one.
5. **Task-level "gap → agent" reasoning** — analyse which *task slices* of a vacancy an agent could take
   and what stays human, not job-level "this whole job is automatable" claims.

## 1. Context — what's being asked, and what it actually is

The ask: a **"Career view of Singapore for the past ~1 month, built on MyCareersFuture (MCF)"** — model
the MCF schema; count jobs (today / "new in the last 9 days" / last 30 days); salary ranges; job types
(full-time / part-time / contract); employer type / size / sector; download jobs + responsibilities +
a company identity code + sector; **strip outsourcing/staffing-agency postings**; then synthesise **what
gaps organisations are trying to fill** and **which of those an AI agent could fill** — grounded in
research on organisation redesign / reorganisation / job redesign / role insights / futurism.

### 1.1 Representativeness — what this view *is* and *isn't* (read this first)
This is a labour-market view **of the MyCareersFuture *channel***, **calibrated against** official
national indicators — **not a census of all hiring in Singapore**. Two facts shape that:
- MOM's Fair Consideration Framework requires most Employment-Pass / S-Pass openings to be **advertised on
  MCF for ≥14 consecutive days** before the employer can submit the pass application — so a slice of "live"
  ads exists for compliance reasons and is skewed toward roles open to foreigners; the *posting-age
  distribution* itself carries signal and **should be its own chart** (don't just count "live" ads naively).
- MCF complements other job portals (LinkedIn, JobStreet, agency sites, internal hiring) rather than
  replacing them — coverage is partial and channel-biased by construction.

⇒ The product copy, the methodology footer, and the LLM prompt must say this plainly, and the deterministic
rollups should be **cross-checked against** MOM's Job Vacancies report and the SkillsFuture/WSG Jobs-Skills
datasets where they overlap (sanity bounds, not ground truth). Overclaiming "the SG job market" is the
single biggest credibility risk.

### 1.2 What the codebase already gives us (so we reuse, not rebuild)
- `v3/api/mcf.js` (~340 lines, `maxDuration: 60`) — working MCF proxy: `GET …/v2/jobs?search=&limit=&offset=`
  + `…/v2/jobs/<uuid>` detail; `normaliseJob()` (~L125-169) extracts `uuid, title, employer, salaryMin/Max,
  employmentType, postedDate, expiryDate, minimumYearsExperience, positionLevels[], schemes[], description
  (≤4000), responsibilitiesText (heuristic section extract, ≤2500), categories[], skills[] (≤12), mcfUrl`;
  has timeouts, an 8-outbound-call budget, dedupe-by-uuid, a 3-tier search cascade; **strips recruiter PII
  deliberately**. De-facto schema source of truth — but **does not** capture `numberOfVacancies`,
  `salary.type`, `ssocCode`, `postedCompany.uen`, company SSIC/size, `metadata.isPostedOnBehalf`, or a
  distinct `hiringCompany` (see §2).
- `v3/api/anatomy.js` (`maxDuration: 15`, `@vercel/postgres`) — persistence layer: `ensureTables()` →
  `anatomy_runs / screening_profiles / screen_keyword_gaps / pipeline_logs`; `str(x,max)` / `arr(x,max,len)`
  sanitisers; swallow-and-return-empty error pattern; ~1%-random retention sweeps. **The pattern to copy.**
- `v3/api/claude.js` (`maxDuration: 300`) — Anthropic proxy: Haiku default, Sonnet on request;
  `cache_control: ephemeral` auto-injected at ≥16k-char system prompts; maps Anthropic 401/403→BUSY,
  429/529→OVERLOAD, ≥500→SERVER. **Reuse for the gap pass; cache the framework prompt.**
- `v3/api/esco.js` — `action:"skills"` (title→ESCO essential skills + ISCO major group) and
  `action:"occupationFingerprint"` (skill phrases → best-matching ESCO occupations). **Fallback enrichment
  only** under the SSOC-first taxonomy (§3).
- `v3/api/datagov.js` (`maxDuration: 30`, in repo, removed from UI) — data.gov.sg MOM job-vacancy-rate
  trend (ISCO major group → MOM occupational-group label → dataset 690, last 12 quarters + YoY). A ready
  macro counterpoint; can be resurfaced inside the new page.
- `v3/vercel.json` — `regions: ["sin1","hnd1"]`, `fluid: true`, per-function `maxDuration` (300/60/60/30/15),
  CSP `connect-src` already allows `api.anthropic.com`, `api.mycareersfuture.gov.sg`,
  `api-production.data.gov.sg` (new external sources must be added there). **No `crons` array today.**
  *(Correction vs v1: Vercel Cron is available on **all plans** now — limits & timing accuracy vary by
  plan — so this isn't a "Pro-plan" gate.)*
- `v3/src/App.jsx` (~8.6k lines, one file) — a standalone page is wired the way `PipelineLogsView` /
  `?debug=logs` is (`main.jsx` renders it instead of `<App/>` when the query string matches). **Constraint:
  no further growth of this monolith** — new code lands in new files / API functions, not `App.jsx`.
- `package.json` — Vite + React 18; `@vercel/postgres ^0.10`, `@vercel/analytics`, `@vercel/speed-insights`;
  Node 22. No new dependency needed.
- **Net-new pieces:** the snapshot/longitudinal store + cron + run ledger, the outsourcing classifier,
  company UEN/SSIC enrichment, the MCP-read surface, the gap/agent LLM pass + its evidence/eval contract.

## 2. The MyCareersFuture schema — **assumed** vs **verified**

> **Phase 0 fills the "verified" column from a live `POST /v2/search?sortBy=new_posting_date` response.**
> Until then, treat the "assumed" table as a hypothesis only.

**Endpoints (assumed):**
- `GET  /v2/jobs?search=<q>&limit=<n>&page=<p>` — keyword search (what the proxy uses today).
- `POST /v2/search` — body `{ search, sortBy:"new_posting_date"|"relevancy", limit, page, salary,
  employmentTypes:[…], categories:[…], postingCompany:[…], … }` → `{ results:[…job…], total:<int>,
  countsBy…:{…} }`. **The national-feed endpoint**: `sortBy:"new_posting_date"` + `page` walks the freshest
  postings; `total` = the headline "how many ads are live" number; the `countsBy…` facets give
  salary-band / employment-type / category breakdowns *without downloading every job*. **(Endpoint name,
  body keys, facet keys, and `total` semantics are all unverified — Phase 0.)**
- `GET  /v2/jobs/<uuid>` — full posting (HTML description, company block).

**A job object — assumed fields and their status:**
| group | assumed fields | status / note |
|---|---|---|
| identity | `uuid`, `metadata.jobPostId`, `metadata.jobDetailsUrl`→`mcfUrl` | proxy captures uuid/url; **verify `jobPostId`**. uuid = stable key for new-vs-seen |
| role | `title`, `description` (HTML), `skills[]`, `categories[]` (MCF job category — coarse), `ssocCode`/`ssecEqaCode` (SG Standard Occupational Classification) | proxy captures title/desc/skills/categories; **`ssocCode` unverified — if absent, derive via SSOC↔ISCO + ESCO fallback (§3)** |
| level / type | `positionLevels[]`, `employmentTypes[]` (Full Time / Part Time / Contract / Temporary / Permanent / Internship / Freelance), `minimumYearsExperience`, `numberOfVacancies` | proxy captures levels/types/years; **`numberOfVacancies` unverified — needed for true demand counts; if absent, count = 1 ad = 1 opening, flagged** |
| pay | `salary.minimum`, `salary.maximum`, `salary.type.salaryType` ("Monthly"\|"Annually") | proxy captures min/max; **`salary.type` unverified — MUST normalise to a monthly basis before any "salary range"; if absent, infer from magnitude with a flag** |
| dates | `metadata.originalPostingDate`, `metadata.newPostingDate`, `metadata.expiryDate` | proxy captures originalPosting/expiry; **prefer our own `first_seen` snapshot date as the "new posting" anchor (it's reliable; MCF's date semantics aren't)** |
| employer | `postedCompany.{name, uen, description, ssicCode?, employeeCount?}`, `hiringCompany.{name, uen}` (often null), `metadata.isPostedOnBehalf` (bool) | proxy captures only `postedCompany.name`/`hiringCompany.name`. **`uen` / `ssicCode` unverified — UEN is the "company identity code"; if absent on the job object, enrich via the ACRA dataset (§3). `employeeCount`: treat as UNSPECIFIED — likely not exposed; don't promise "company size" until verified. `isPostedOnBehalf` + `hiringCompany ≠ postedCompany` = the primary outsourcing signal** |
| engagement | `metadata.totalNumberOfView`, `metadata.totalNumberJobApplication` | optional competitiveness signal; **unverified** |
| govt | `schemes[]` (SkillsFuture / WSQ / mid-career schemes) | proxy captures it |

**Derived fields we'd compute & store** (deterministic): `salary_monthly_min/max` (normalised), `salary_band`
(<3k / 3–5k / 5–8k / 8–12k / 12k+); `seniority_band` from `positionLevels` (Entry/Mid/Senior/Lead/Exec);
`employment_kind` (full / part / contract / temp / intern / other); `is_outsourcing` + `outsourcing_reason`
+ `outsourcing_confidence` (§4.3); `posting_age_days` (snapshot date − `first_seen`); `occupation` via the
SSOC-first stack (§3); `industry_ssic` + `industry_ssic_name` + `entity_status` (ACRA enrichment); `company_key`
(= lowercased UEN if present else normalised name); `first_seen` / `last_seen`. Every derived field that
relied on an *unverified* source carries a `*_source` / `*_confidence` marker.

## 3. Data model — taxonomies (kept separate, local-first)

The v1 muddled "occupation / industry / sector / company / skill" into a few JSON columns. Keep them apart:

- **Occupation** — **SSOC 2024 first** (Singapore's national occupational standard, with official
  SSOC↔ISCO-08 correspondence tables published by SingStat) → if MCF gives `ssocCode`, use it; else map the
  title → SSOC → ISCO; **ESCO `occupationFingerprint` is fallback enrichment only** (skill-overlap guess
  when neither code nor title resolves). Store `ssoc_code`, `ssoc_title`, `isco_major`, `occupation_source`.
- **Industry / sector** — **SSIC** (Singapore Standard Industrial Classification), obtained from the
  **ACRA "Corporate Entities" open datasets on `data.gov.sg`** keyed by UEN (these give SSIC code, SSIC
  description, and entity status) — that's the *default, deterministic* company→sector path, not an open
  question. MCF's `categories[]` is a *coarse channel-level sector tag*, kept as a fallback / cross-tab
  dimension, not the primary industry truth.
- **Company identity & size** — UEN = the identity code; join to the ACRA dataset for SSIC + entity status.
  **Employee count / "company size": UNSPECIFIED** — neither MCF nor the free ACRA datasets reliably give it;
  do not surface "by company size" until a real source is confirmed (revisit in the backlog).
- **Skills** — MCF's displayed skills are **ML-extracted from the job text** (per the MCF FAQ), not an
  authoritative taxonomy. Use them for **recall, trend discovery, and clustering**; for the
  "what gaps are employers filling?" layer, **normalise the important skills against the SkillsFuture
  Skills Frameworks / Jobs-Skills Portal taxonomies** where a mapping exists. Store both `mcf_skills_raw[]`
  and `skills_normalised[]` (with the framework ref).

## 4. Architecture for the build

### 4.0 Surfaces — **API-first; the web page is one client**
The authoritative product core = the **data layer** + an **MCP-read surface** over it. The standalone web
page is *a* client, not the product. No new code in `App.jsx`. If the MCP server is exposed remotely
(Streamable HTTP), follow the MCP spec's transport requirements: **authentication**, **`Origin`-header
validation**, and proper **session handling** — don't ship an unauthenticated remote tool surface. (A
stdio/local MCP server is fine as a first cut and sidesteps the auth question.)

### 4.1 Storage — new tables in `v3/api/anatomy.js`'s `ensureTables()`
- `mcf_postings` — one row per `uuid`: identity / role / level-type / pay / dates / employer columns from
  §2 + all the derived fields from §2/§3 + `responsibilities_text` (only for the sampled subset, §4.4) +
  `mcf_url` + `raw JSONB` (trimmed) + `*_source` / `*_confidence` markers + `updated_at`. Indexes on
  `first_seen`, `posted_date`, `(industry_ssic, first_seen)`, `(occupation_ssoc, first_seen)`, `(is_outsourcing)`.
- `mcf_market_daily` — pre-aggregated rollup, one row per `(snapshot_date, dimension, key)` — counts,
  vacancy sums, p25/p50/p75 monthly salary, posting-age buckets — so the page/MCP reads are ~instant.
  Dimension ∈ {overall, industry_ssic, mcf_category, employment_kind, seniority_band, salary_band,
  occupation_ssoc, isco_major, top_company, top_title, posting_age_bucket}.
- `mcf_demand_themes` — clustered, frequency-ranked duty/requirement statements from the sampled postings,
  per `(snapshot_date, occupation_or_sector, theme)` (feeds the gap pass).
- `mcf_ingest_runs` — the **run ledger / lock table**: `run_id, cron_invoked_at_utc, snapshot_date_sgt,
  status (started/ok/failed), pages_walked, postings_seen, postings_new, mcf_total_reported, sample_fetched,
  error, started_at, finished_at`. Doubles as the advisory-lock holder (one active row at a time).
- `sg_market_reports` — the LLM gap-analysis output, one row per `(report_date, version)`:
  `market_summary JSONB, gaps JSONB, agent_opportunities JSONB, org_redesign_notes JSONB, evidence JSONB,
  external_context JSONB, model TEXT, created_at`.
- Reuse `str/arr`, the `_tableEnsured` guard, the swallow-and-return-empty pattern, and ~1%-random retention
  sweeps (keep `mcf_postings` ~90 days, `mcf_market_daily` ~400 days, `mcf_ingest_runs` ~180 days).

### 4.2 Ingestion — a daily Vercel Cron, **hardened**
- Configure in `vercel.json`: `"crons":[{ "path":"/api/cron-mcf", "schedule":"<UTC cron>" }]`.
  **Vercel crons run on UTC** — so the function must take `cron_invoked_at_utc` from the request and
  **derive `snapshot_date_sgt` (= UTC + 8h, date part)** itself; never assume "SGT-friendly" wall-clock.
- **Auth**: require the `CRON_SECRET` (Vercel injects an `Authorization: Bearer <CRON_SECRET>` header on
  scheduled invocations) — reject anything else; the manual trigger uses the same secret as a query/header.
- **Concurrency & duplicates**: Vercel may run invocations that **overlap** and may **deliver the same
  event more than once**, and it **does not retry** failures. So: take an **advisory lock** via
  `mcf_ingest_runs` (insert a `started` row only if no active row → otherwise exit cleanly), do
  **idempotent upserts** (`ON CONFLICT (uuid) DO UPDATE`, `first_seen` set once), and on failure leave a
  `failed` row so the next run can resume / a manual run can recover. Phase 1 isn't "done" without the lock
  + idempotency + a recoverable ledger.
- Each run: ① walk `POST /v2/search?sortBy=new_posting_date` page-by-page (PAGE_SIZE ≈ 30–100) until it
  hits postings older than the last `first_seen` / a hard page cap (≈ ≤30 pages → the freshest few thousand)
  — respecting per-call timeouts and a total-call budget like `mcf.js` already does; record `mcf_total_reported`
  verbatim. ② upsert into `mcf_postings`, computing the derived fields (§2/§3) incl. salary normalisation,
  bands, the outsourcing classifier, and SSOC mapping. ③ for a **bounded stratified sample of the day's
  genuinely-new, non-outsourcing postings** (≈ ≤80, spread across sectors), fetch `…/v2/jobs/<uuid>` detail
  → `responsibilities_text` (reuse `mcf.js`'s `extractResponsibilities`) → cluster into `mcf_demand_themes`.
  Full-corpus download of all SG ads is infeasible in a serverless run — facets answer the *counts*, the
  sample feeds the *qualitative* layer. ④ recompute `mcf_market_daily` for `snapshot_date_sgt`
  (deterministic SQL/JS — no LLM). ⑤ once a day, after ingestion, run the gap pass (§4.4) → `sg_market_reports`.
- Optional: best-effort enrich a *bounded* number of *new* companies per run from the ACRA `data.gov.sg`
  dataset (UEN → SSIC + status); skip silently on miss.

### 4.3 The outsourcing / staffing-agency classifier (deterministic) + its eval contract
Signals → `is_outsourcing` + `outsourcing_reason` + `outsourcing_confidence`:
- **Strong**: `metadata.isPostedOnBehalf === true`, or `hiringCompany` present and ≠ `postedCompany` →
  `posted_on_behalf` (high confidence).
- **Company-name patterns** (word-boundary, case-insensitive): `recruit*`, `staffing`, `manpower`,
  `headhunt*`, `talent acquisition`, `placement`, `outsourc*`, `BPO`, `payroll`, `RPO`, `executive search`,
  `HR solutions/consulting` + known SG agency brands (Recruit Express, Adecco, ManpowerGroup, RecruitFirst,
  PERSOLKELLY, Randstad, Robert Walters, Michael Page, Hays, Kelly Services, Capita, ScienTec, GMP, Trust
  Recruit, …) → `agency_name` (medium-high). Cross-check name → UEN → ACRA SSIC ("employment activities" /
  "labour recruitment" SSIC ranges) to raise/lower confidence.
- **Posting-text markers** ("on behalf of our client", "our client is", "MNC client", "outsourced
  headcount", "deployed/seconded to client site", "agency contract", "you will be employed by [agency]") →
  `outsourced_language` (medium) — only on the sampled subset's text; otherwise fall back to the name/on-behalf
  signals.
- **Eval (required before the "remove outsourcing" claim is shown without a caveat)**: hand-label a random
  sample of ≥200 postings; report precision/recall/F1 by signal; set a target (e.g. precision ≥0.9 on the
  "is_outsourcing" call, recall reported); re-run the eval whenever the rules change. Until the target is
  met, the page shows the filtered count *with* a visible "heuristic — may misclassify" caveat and always
  shows the unfiltered count beside it.

### 4.4 The "gaps / can agents fill them" analysis — `/api/claude` pass + a little external context
- **Input** (all derived, no PII): the daily rollups (counts; "today / new-9-day / 30-day"; salary bands;
  employment-kind & seniority mixes; top sectors / occupations / titles / hiring companies; posting-age
  distribution; week-over-week deltas; the unfiltered-vs-outsourcing-filtered pair) + the ranked
  `mcf_demand_themes` + a short **live external-context blob** fetched at report time (1–3 items from a
  small CSP-allow-listed set: MOM Job Vacancies report, SkillsFuture/WSG Jobs-Skills datasets/JTMs, WEF
  Future of Jobs, Anthropic Economic Index — cached daily, truncated, best-effort; the pass works without it).
- **System prompt** = the §6 research framework, condensed and **cached** (`cache_control: ephemeral`;
  5-min default TTL, 1-hr option — fine for a once-a-day pass). The prompt forbids invention, requires every
  claim to point at supplied numbers/themes, and requires the representativeness caveat (§1.1) to be honoured.
- **Model**: a normal **Messages API** call (so it's ZDR-eligible) on **Sonnet 4.6 or Opus 4.7** — it's
  daily, so the stronger model is essentially free here. (Message Batches — 50% cheaper but **not
  ZDR-eligible** — only for backfills / large offline evaluations / sector-by-sector historical regeneration,
  where latency is irrelevant and retention is acceptable. Per-user-request calls elsewhere in the app stay
  on Haiku 4.5.) Exact model IDs/prices live in Appendix A so the strategy ages slowly.
- **Output JSON** — and **every item carries an evidence object**:
  - `marketSummary` — 2–3 sentences, channel-caveated.
  - `gaps[]` — `{ gap, type ∈ {capacity, capability, redesign-opportunity, structural}, whichRoles, sectors,
    whyNow, confidence ∈ {high/medium/low}, evidence: { metric_refs:[…rollup keys…], theme_refs:[…],
    sample_n:<int>, source_refs:[…external items…] } }`.
  - `agentOpportunities[]` — per gap: `{ gap, agentFit ∈ {high/partial/low}, whichTasks (task slices an
    agent could take — the Anthropic-Economic-Index "automation vs augmentation" lens), humanResidual (what
    stays human — presence / physical action / accountability / framing under ambiguity, the existing
    Job-Anatomy layers), redesignMove (deconstruct→reallocate→reconstruct; skills-based pooling; new
    "AI-supervisor" roles; …), risks, confidence, evidence:{…} }`.
  - `orgRedesignNotes[]` — 2–4 system-level reads (e.g. "≈X% of new vacancies look like *new* roles →
    reorganisation, not backfill"; "clerical demand down while data/AI up → reskilling lanes"), each with
    `evidence:{…}`.
  - `sources[]` — the external items actually used.
- No `gaps[]` / `agentOpportunities[]` / `orgRedesignNotes[]` item renders without a populated `evidence`
  object. The page labels the whole panel "AI-generated interpretation". Regenerated daily; re-servable via
  a throttled "regenerate" button.

### 4.5 The page — `?view=sg-market` (a client of the API/MCP core)
`main.jsx` renders `<SgMarketView/>` when `?view=sg-market`. Sections: **headline counters** (live ads /
posted today / new-in-9-days / 30-day — *with* the outsourcing-filtered pair and a "MCF channel only"
badge); **posting-age distribution** (new in 1.1); **salary** (monthly-normalised band histogram +
p25/p50/p75, by sector toggle); **employment-kind & seniority** mixes; **top sectors (SSIC) / occupations
(SSOC) / titles / hiring companies** (outsourcing flagged); **trend strip** (counts over the accrued days
+ optionally the MOM macro vacancy-rate line from `datagov.js`, clearly labelled as a *different* national
series); **"What gaps are organisations filling?"** (the LLM `gaps[]`, each with its evidence chips);
**"Where could agents help?"** (`agentOpportunities[]` + the human-residual / redesign notes);
**methodology & caveats** footer (MCF-channel coverage + the FCF ad-window bias, the heuristic outsourcing
filter + its current precision/recall, the qualitative sample size, "AI-generated interpretation", privacy:
derived data only, no PII). Reuse the existing card styles, `C` palette, the small SVG sparklines, and the
`PipelineLogsView` fetch-on-mount + refresh pattern. (Same data is exposed via the MCP `sg_market_summary` /
`market_aggregates` / `demand_themes` / `gap_analysis` / `recent_jobs` / `company_lookup` tools.)

## 5. Measure & governance (the part v1 was missing)

Use the NIST AI RMF lens — **govern · map · measure · manage** — at a lightweight scale:
- **Govern**: this document + `doc/development-plan.md` are the brief; a one-page risk register lives with
  them (channel bias, schema drift, classifier error, LLM factuality, stale external context, PII leakage —
  each with an owner and a mitigation).
- **Map**: the data lineage of every surfaced number — which MCF field / which derived rule / which external
  source — is recorded via the `*_source` markers and the `evidence` objects; "unverified" and "unspecified"
  are first-class states, not glossed over.
- **Measure**: (a) **schema-drift alarm** — the cron compares the live response shape against a recorded
  fingerprint and flags changes; (b) **null-rate tolerances** for critical fields (`salary`, `employmentTypes`,
  `postedCompany.name`, `uuid`, dates) — exceeding them downgrades affected charts to "low confidence";
  (c) **classifier precision/recall** on a refreshed labelled sample (§4.3); (d) **LLM factuality checks** —
  a deterministic post-validator confirms every `metric_refs` actually exists in that day's rollups and
  every quoted number matches (mismatches → the item is dropped and logged); (e) **confidence labels** on
  every gap claim, surfaced in the UI.
- **Manage**: a failed/anomalous run leaves yesterday's data intact and writes a `failed`/`flagged` ledger
  row; the page shows a "data as of <date>; today's refresh incomplete" banner rather than silently serving
  stale numbers as fresh. **No model-generated market claim ships without a deterministic evidence trail.**

## 6. Research synthesis — the framework to ground the analysis

Condensed into the LLM system prompt; shown lightly on the page. (Full source list in §9; the v2-review
research that expanded this is in `doc/deep-research-report.md`.)

**A. Reading job ads as organisational intent.** A burst of vacancies = work the org can't currently get
done: **capacity** (more of the same), **new capability** (skills it lacked), a **redesign opportunity**
(work re-splittable across people / contractors / AI), or **structural change** (re-org — new functions,
layers, operating model). Singapore anchor: MOM's **Job Vacancies 2025** report — ~**49.3% of vacancies
were newly-created positions**, specialist digital & engineering occupations stayed in demand, and ~**79.6%
of vacancies did not treat academic qualifications as the main hiring determinant** — i.e. demand is heavily
about transformation/reorganisation and is skills-leaning, not just headcount-and-credentials.

**B. What's growing / shrinking (WEF Future of Jobs 2025).** Net **+78m jobs by 2030** globally amid a
**"great skills reset"** (~39–40% of core skills change). **Fastest-growing**: AI & big-data specialists,
fintech engineers, software/app developers, data-warehousing, plus green/energy-transition roles; in
absolute terms farmworkers, delivery drivers, software devs, construction, sales. **Fastest-declining**:
clerical/secretarial — cashiers, admin assistants, data-entry clerks, bank tellers, postal clerks.
**Skills up**: AI & big data, networks/cybersecurity, tech literacy, creative thinking, resilience/agility,
curiosity/lifelong learning. **Skills down**: manual dexterity, precision, endurance. **Singapore**:
"finding skilled talent" is the #1 transformation barrier; big-data / AI-ML / data-warehousing among the
fastest-growing locally; data-entry clerks and software testers in decline.

**C. What AI agents can actually take (Anthropic Economic Index).** ~**49% of jobs** see AI used for ≥¼ of
their tasks; only ~**4%** for ≥¾ — AI bites at the **task** level, not the **job** level. Coding/agentic use
skews **automation** (≈79% on Claude Code) vs **augmentation** (≈49% on Claude.ai); front-of-stack web work
(JS/HTML/UI) is disrupted sooner than deep backend; first-order effect is to **deskill** (the higher-education
tasks go first). ⇒ analyse *which task slices* of a vacancy an agent could do, what **human residual**
remains (presence / physical action / accountability / framing under ambiguity — the existing Job-Anatomy
layers Activity / Coordination / Accountability / Relational / Judgment), and how the job should be
*redesigned* around the agent.

**D. Job redesign — "redesign work, not jobs."** (Boudreau & Jesuthasan, *Work Without Jobs*; Deloitte
future-of-workforce-planning; Bersin.) **Deconstruct** jobs into tasks → **reallocate** each task to the
best of {full-time employee, gig/contractor, automation, AI agent} → **reconstruct** roles around the human
residual (Unilever's ~80,000-task exercise is the canonical example). A vacancy isn't necessarily "a job to
hire" — it can be "a task bundle to re-split", which *is* the agent opportunity.

**E. Organisation redesign — the levers (Galbraith Star Model; McKinsey "Organize to Value").**
Org design = aligning **Strategy → Structure → Processes → Rewards → People**; McKinsey's 2025 refresh
(~79% of operating-model redesigns now completing vs ~51% in 2014; "Organize to Value" = 12 tailorable
elements; driven by leader alignment, rewiring core processes, investing in people, sustaining culture).
A spike of vacancies in a *new* function/title across many employers is a reorganisation signal — name it.

**F. Skills-based organisation / talent marketplaces (Deloitte, Mercer).** From fixed jobs → a dynamic
landscape of **skills** deployed via internal **talent marketplaces** + an updated **job architecture /
skills taxonomy**; reported outcomes ~79% more likely positive workforce experience, ~63% more likely to
hit results. Implication: some "gaps" close better by **pooling existing skills internally** (or by agents)
than by net-new headcount — flag that.

**G. Singapore policy scaffolding (WSG / SkillsFuture).** 19 **Jobs Transformation Maps** (incl. the
Oct-2025 *Impact of Gen-AI on Financial Services* JTM by MAS/IBF/WSG — "majority of finance roles to be
*augmented*"); the **Skills Frameworks**; **Job-Redesign reskilling** funding; the **Jobs-Skills Portal /
Job-Skills Profile Dashboard** (industries↔companies↔jobs↔skills↔wages datasets, dashboards, algorithms).
Use to recommend reskilling lanes, to *normalise* MCF's ML-derived skills, and to sanity-check which sectors
are officially flagged for transformation.

**Net stance for the product**: read the MCF-channel demand → cross-check against MOM/WSG → classify gaps
(A+B) → for each, map task-level agent fit (C) and the redesign move (D/E/F) → recommend *hire / pool
internally / deploy an agent / re-org*, with the Singapore scaffolding (G) as local context. Always label
it interpretation, show the underlying numbers + evidence, and keep the privacy posture (derived data only,
no PII).

## 7. Phased build plan (sequencing owned by `doc/development-plan.md`)

- **Phase 0 — verify the live MCF schema (HARD GATE).** From a throwaway script, call
  `POST /v2/search?sortBy=new_posting_date`; fill §2's "verified" column — `total` semantics, the facet
  block, and the status of `numberOfVacancies / salary.type / ssocCode / postedCompany.uen / ssicCode /
  employeeCount / metadata.isPostedOnBehalf / hiringCompany`. **No Phase-1 code until this is done.**
- **Phase 1 — the core (data layer, no UI).** Add `mcf_postings / mcf_market_daily / mcf_demand_themes /
  mcf_ingest_runs / sg_market_reports` + sanitisers to `anatomy.js`; build `api/cron-mcf.js` — hardened per
  §4.2 (UTC handling, `CRON_SECRET`, advisory lock, idempotent upserts, run ledger); add the `crons` entry;
  add a guarded manual trigger; extend `mcf.js`'s `normaliseJob` with the verified new fields; implement the
  outsourcing classifier (§4.3) and the SSOC-first occupation mapping (§3). Verify with SQL. Wire the
  schema-drift alarm + null-rate checks (§5).
- **Phase 2 — surface A: the MCP-read server** (the API-first core's first client; on-thesis for "can
  agents fill the gaps"): `sg_market_summary`, `recent_jobs(filters)`, `market_aggregates(dimension)`,
  `top_companies/titles/sectors`, `demand_themes`, `company_lookup`, later `gap_analysis`. If remote:
  auth + `Origin` validation + session handling per the MCP spec (or stdio-only to start).
- **Phase 3 — surface B: the web page** (`?view=sg-market`, §4.5) — deterministic; reads
  `mcf_market_daily`; "refresh now" (throttled) → the manual trigger.
- **Phase 4 — the intelligence**: the §4.4 LLM pass — add the allow-listed external sources to the CSP;
  Sonnet/Opus via the Messages API + a cached framework prompt; write `sg_market_reports` with evidence
  objects; the deterministic post-validator (§5); surface the two panels + the `gap_analysis` MCP tool;
  throttled "regenerate".
- **Phase 5 — enrichment & joins (optional)**: ACRA UEN→SSIC/status enrichment at scale; skills
  normalisation against the SkillsFuture frameworks; resurface the MOM macro line; deep-link a sector/title
  from `SgMarketView` into the per-role analyser; sweep the existing v3 `/api/claude` calls onto the
  Haiku/Sonnet tiering.

## 8. Open questions / backlog

**To decide before Phase 1:** crawl-depth cap (recent ≈N pages vs. "everything" — recommend the cap; `total`
is still exact); labelled-sample size & precision target for the outsourcing classifier; whether the MCP
server ships remote (with auth) or stdio-only first; the exact external-context allow-list domains for the
CSP; refresh/throttle policy for the manual buttons; qualitative sample size (~80/day fixed vs. cumulative
over the month).

**Backlog (out of core scope unless/until a named, licensed/official source exists):** "financial news,
etc." about employers (needs a news API + ToS/cost decision — not in v1); "by company size" charts (needs a
real employee-count source — ACRA free datasets don't reliably give it); finer industry rollups beyond SSIC
where MCF's `category` is too coarse.

## 9. Sources

Official / primary references behind §1, §3, §4, §5, §6. (Plain URLs where known; the rest are named with
their canonical landing site — `doc/deep-research-report.md` carries the full citation set.)

- **MOM — Job Vacancies 2025 report** (49.3% newly-created vacancies; 79.6% not academic-qualification-led;
  specialist digital/engineering demand): Ministry of Manpower, *Job Vacancies 2025* (mom.gov.sg, Mar 2026).
- **MOM — Fair Consideration Framework / EP & S-Pass job-advertising duration** (mandatory ≥14-day MCF
  advertising for many passes): mom.gov.sg (Fair Consideration Framework; advertising requirements).
- **MyCareersFuture FAQ** (portal complements other channels; displayed skills are ML-derived from job
  text): https://static.mycareersfuture.gov.sg/docs/mycareersfuture_sg_user_faqs.pdf ; portal: https://www.mycareersfuture.gov.sg/
- **SingStat — Singapore Standard Occupational Classification (SSOC) 2024** + SSOC↔ISCO-08 correspondence:
  Department of Statistics Singapore (singstat.gov.sg).
- **ACRA Corporate Entities open datasets (UEN → SSIC, SSIC description, entity status)** on **data.gov.sg**:
  https://data.gov.sg/ (ACRA "Entities" collection).
- **WSG — Jobs Transformation Maps** (19 JTMs; *Impact of Gen-AI on Financial Services* JTM, Oct 2025,
  MAS/IBF/WSG): https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps ; https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps/jobs-transformation-map-generative-ai ; WSG "Realising the Skills-First Advantage": https://www.wsg.gov.sg/docs/default-source/content/sfx-jsi-2025.pdf
- **SkillsFuture — Jobs-Skills Portal / Job-Skills Profile Dashboard / Skills Frameworks**:
  https://jobsandskills.skillsfuture.gov.sg/
- **WEF — Future of Jobs Report 2025**: https://www.weforum.org/publications/the-future-of-jobs-report-2025/ ; press release https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/ ; fastest growing/declining https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/
- **Anthropic — Economic Index** (task-level AI use; automation vs augmentation; deskilling):
  https://www.anthropic.com/economic-index ; https://www.anthropic.com/research/economic-index-march-2026-report
- **Anthropic docs** — models overview, prompt caching (5-min default TTL, 1-hr option, ZDR-eligible),
  Message Batches (50% cheaper, not ZDR-eligible): https://docs.anthropic.com/ (Models; Prompt caching; Message Batches).
- **Deloitte** — *Reinventing workforce planning for an AI-powered world* / *From jobs to skills to outcomes* /
  *The skills-based organization* / *Agentic AI… reshaping how organizations plan*: https://www.deloitte.com/us/en/insights/topics/talent/future-of-workforce-planning/reinventing-workforce-planning.html (and the sibling pages).
- **Bersin** — *Job Redesign Around AI: Work Intelligence Tools Arrive* (2025): https://joshbersin.com/2025/03/job-redesign-around-ai-work-intelligence-tools-arrive/
- **Mercer** — *The evolution of job architecture* / *Skills-powered talent practices*: https://www.mercer.com/insights/talent-and-transformation/skill-based-talent-management/the-evolution-of-job-architecture-in-the-tech-industry/
- **McKinsey** — *The new rules for getting your operating model redesign right* (2025; "Organize to Value"):
  https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-new-rules-for-getting-your-operating-model-redesign-right ; **Galbraith Star Model**: https://strategicmanagementinsight.com/tools/galbraiths-star-model-explained/
- **Boudreau & Jesuthasan — *Work Without Jobs*** (deconstruct→reallocate→reconstruct; Unilever ~80k tasks) — via the Deloitte/Bersin write-ups above.
- **Vercel — Cron Jobs docs** (configured in `vercel.json`; **UTC schedules**; overlapping invocations
  possible; at-least-once delivery; no automatic retries; protect with `CRON_SECRET`; available on all
  plans, limits/accuracy vary): https://vercel.com/docs/cron-jobs
- **Model Context Protocol — specification** (incl. Streamable HTTP transport: auth, `Origin` validation,
  session handling): https://modelcontextprotocol.io/
- **NIST — AI Risk Management Framework (AI RMF 1.0) + Playbook** (govern / map / measure / manage):
  https://www.nist.gov/itl/ai-risk-management-framework
- In-repo: `v3/api/mcf.js` `normaliseJob()` (~L125-169) — the de-facto MCF schema we already consume; and
  `doc/development-plan.md` (execution sequencing) and `doc/deep-research-report.md` (the v2-review research).

## Appendix A — model IDs & rough prices (volatile — keep here, not in the body)

- **Haiku 4.5** (`claude-haiku-4-5-20251001`) — the per-user-request bulk/extraction/classification tier
  (~$0.80/M in, ~$4/M out, with prompt caching for big system prompts).
- **Sonnet 4.6** (`claude-sonnet-4-6`) — synthesis/judgment calls (narratives, coherence, the gap pass if
  not Opus).
- **Opus 4.7** (`claude-opus-4-7`) — reserved for the **once-a-day** SG-view gap/agent-fit pass (cost
  negligible at one call/day) and any genuinely hard offline synthesis.
- **Prompt caching**: 5-min default TTL, 1-hr option; **ZDR-eligible**. **Message Batches**: ~50% cheaper,
  **not ZDR-eligible** → backfills / offline eval only, never the live daily report if privacy posture matters.
- Per-role analysis in the existing app ≈ $0.20–1.00 on Haiku; the SG-view daily LLM pass ≈ a few cents/day
  even on Opus; one-off build ≈ $15–40 per phase (dominated by context size, not model choice).
