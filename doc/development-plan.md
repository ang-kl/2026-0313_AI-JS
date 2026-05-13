# Development direction — "Singapore Career View" + the AI Job Analyser

Consolidated forward plan. Builds on `doc/polymorphic-churning-torvalds.md` (the research & design
deliverable) and the architecture/model/cost decisions taken since. **No code is committed yet** — this is
the agreed direction; phases ship one PR-sized slice at a time.

## Guiding principles
1. **API-first core; surfaces are thin layers.** Build the data/analysis engine once; a webapp page *and*
   an MCP server both sit on top of it.
2. **Reuse the v3 Vercel project** — Postgres, `/api/claude`, `/api/mcf`, `/api/esco`, the CSP, the
   `?debug=logs` standalone-page pattern. No new infra, no new dependency.
3. **Model tiering**: Haiku 4.5 for bulk extraction/classification (per-request), Sonnet 4.6 for
   synthesis/judgment, Opus 4.7 only for the once-a-day gap pass. Lean on prompt caching (`cache_control:
   ephemeral`, auto-injected at ≥16k-char system prompts) for the big framework prompts.
4. **Privacy & resilience**: derived data only, no PII; every step best-effort and degradable (a failed
   run leaves the prior data intact).
5. **Ship in vertical slices** — each phase is independently useful.

## Roadmap

### Phase 0 — verify assumptions (≈½ day, no commitment)
Hit the live MyCareersFuture `POST /v2/search?sortBy=new_posting_date` from a throwaway script; confirm
the real response shape — `total`, the facet/aggregation block, and which of `numberOfVacancies /
salary.type / ssocCode / postedCompany.uen / ssicCode / employeeCount / metadata.isPostedOnBehalf /
hiringCompany` actually exist. De-risks everything else. → append a short "verified schema" note to
`doc/polymorphic-churning-torvalds.md`.

### Phase 1 — the core (data layer, no UI)
New `mcf_postings` + `mcf_market_daily` tables + sanitisers in `v3/api/anatomy.js` (copy the existing
`ensureTables` / `str`/`arr` / swallow-and-return-empty / ~1%-retention-sweep patterns); `v3/api/cron-mcf.js`
(paginate the recent feed → upsert → derive salary-normalised / seniority / employment-kind bands + the
deterministic outsourcing classifier; record `total` verbatim); a `crons` entry in `vercel.json`; a guarded
manual trigger (`?run=…&key=…`); extend `v3/api/mcf.js`'s `normaliseJob` with the new fields. Verify with
SQL queries.

### Phase 2 — surface A: MCP server (the on-theme first surface)
A small MCP-over-HTTP function (e.g. `v3/api/mcp.js`) exposing **read** tools over the Phase 1 DB:
`sg_market_summary`, `recent_jobs(filters)`, `market_aggregates(dimension)`, `top_companies/titles/sectors`,
`demand_themes`, `company_lookup`, and later `gap_analysis`. Pure reads / thin calls to the other `/api`
functions. Lets Claude (and other agents) query the SG labour data directly — on-thesis for the "can agents
help fill the gaps" framing, and no UI to build.

### Phase 3 — surface B: the webapp page
`?view=sg-market`, routed in `v3/src/main.jsx` the way `<PipelineLogsView/>` / `?debug=logs` is. Sections:
headline counters (today / new-in-9-days / 30-day, with an outsourcing-excluded toggle), salary histogram +
p25/p50/p75 (by sector toggle), employment-kind & seniority mixes, top sectors / occupations / titles /
companies, a trend strip (+ optionally the MOM macro vacancy line from `datagov.js`), a methodology/caveats
footer. Deterministic; reads `mcf_market_daily`. "Refresh now" button (throttled) wired to the manual
trigger. Reuses the existing card styles, `C` palette, and the `PipelineLogsView` fetch-on-mount pattern.

### Phase 4 — the intelligence
In the cron: fetch detail for a bounded stratified sample of new non-outsourcing postings →
`responsibilities_text` → cluster into ranked duty/requirement themes (reuse the `buildResponsibilitiesData`
ideas). Then one `/api/claude` pass (Sonnet or Opus — it's daily, so cost is negligible) over the rollups +
themes + a small allow-listed live-context fetch (WEF Future of Jobs / Anthropic Economic Index / Singapore
MOM / WSG Jobs Transformation Maps — added to the CSP `connect-src`, cached daily, truncated, best-effort),
grounded in the §4 research framework (cached system prompt) → `sg_market_reports`
(`marketSummary / gaps[] / agentOpportunities[] / orgRedesignNotes[] / sources[]`). Surface as two panels
on the page and as the `gap_analysis` MCP tool. Clearly labelled "AI-generated interpretation".

### Phase 5 — enrichment & joins (optional)
Company UEN → SSIC industry & size (bounded best-effort); `isco_major` via `esco.js occupationFingerprint`;
resurface the MOM vacancy line in the trend strip; deep-link a sector/title from `SgMarketView` into the
existing per-role analyser; sweep the existing v3 `/api/claude` calls onto the Haiku/Sonnet tiering if not
already done.

## Decisions to lock before Phase 1
(The open questions from §6 of the research doc.) Crawl-depth cap (recent N pages vs. "everything");
company enrichment in v1 or not; "financial news" deferred (needs a news API/ToS) — or a specific source
intended?; qualitative sample size (~80/day, or cumulative over the month?); ship the outsourcing filter
with a visible caveat vs. validate against a hand-labelled sample first; the exact external-context
allow-list domains for the CSP; the refresh/throttle policy for the manual buttons.

## Cost envelope (rough)
- One-off build: ≈ US$15–40 per phase (dominated by context size — the ~8.6k-line `App.jsx` — not model choice).
- Ongoing: ≈ US$2–9/month for the daily LLM gap pass on Haiku (cents/day even on Opus); deterministic
  aggregates cost no LLM.
- Per-role analyses in the existing app: ≈ US$0.20–1.00 each on Haiku 4.5.

## Status / next step
Phase 0 (verify the live MCF response) is the lowest-risk first move and unblocks Phase 1. Awaiting the
go-ahead on the "decisions to lock" list before starting Phase 1 proper.
