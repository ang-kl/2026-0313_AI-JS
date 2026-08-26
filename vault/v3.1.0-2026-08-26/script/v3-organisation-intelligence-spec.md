(№ 151 - 10-07 '26 16:20 SGT)
<!-- Serial N assumed = 151 (next free after the ad-intelligence arc's No 135-142 band; employer-pin was No 131). Human Lead to reconcile against the serial-state counter per R011. Time stamped SGT default per the serial-number-timezone convention; no live timeapi fetch available in this session. -->

# SG Career View v3 - Organisation Intelligence (`OI1` arc) - scoping + roadmap

> **Target repo path:** `v3/script/v3-organisation-intelligence-spec.md`.
> **Proposed version:** the READY slices ship on the flat patch line (never roll the minor). Each slice takes its own PATCH bump; OI1.1 provisionally **v3.0.28x** (reconcile against live at build).
> **Status:** **ROADMAP + PARTIAL READY.** OI1.1 and OI1.3 are `READY_FOR_BUILD`. OI1.2 is `READY_FOR_BUILD (small wiring)`. OI1.4-OI1.7 are **NOT READY** with named blockers. Do not build a NOT-READY slice.
> **Contract alignment:** deterministic = control; LLM = advisory only (no LLM authors a number, a ranking, a headcount, a growth verdict, or a demographic read); non-inventive (every rendered claim maps to a real repo data source AND is withheld over guessed); faithful fidelity (ranges stay ranges, confidence carried). Frozen door (`v3-result-engine-spec.md` §1) and house rules (`CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind every line. Blueprint non-negotiable (`v3/goal/v3-blueprint.md:99`): no generic advice, and every AI-capability claim carries a named source + date.
> **Reader priority:** (1) Human Lead (scope-gate the NOT-READY blockers), (2) `result-engine-builder` (OI1.1-OI1.3 only).

---

## OI0. Why this spec exists, and the honest starting inventory

The Human Lead wants CEO-level organisational diagnosis: why does this org need this role, is it understaffed/growing/replacing, are duties duplicated across the org, is this temp or permanent, who is really being targeted, is this a startup or an institution, a deep review of **all** an employer's roles, and eventual tracking of Singapore government/statutory-board roles. Explicitly not another light narration layer.

**Before scoping anything new, this session read the actual code.** The ambition is not a blank slate. A large amount of employer-scoped machinery already ships:

| Capability the Human Lead asked for | What already exists in the repo | Gap |
|---|---|---|
| "Every posting this employer has live" (the TR1.2 blocker) | `api/mcf.js` `resolveCompany()` (`action:"company"`) polls MCF search pages, normalises the employer name (`normaliseCompanyName`), groups by employer key, returns **all** live postings for that employer (cap 50) with optional duty enrichment (`duties:true`, `fetchJobDetail` on top 5). Wired client-side in `CompanyPanel` (App.jsx ~14298). | The fetch path **exists**; it is NOT wired into the **result/ReviewStudio** path where `rsIndicators` runs (that only sees the sampled `result.responsibilitiesData.jobs`). See OI1.2. |
| "Deep review of ALL an employer's roles" | `CompanyPanel` already fetches + renders the full live posting set, ACRA registration (`fetchEmployerRegistration`), geocode, MCF facets, and `buildCompanyAgents()` - a deterministic duty-cluster / recurring-work / AI-exposure model with a SAT artefact (`indicators`, `ach`, `keyAssumptions`, `qoi`). | No **organisation-diagnosis** layer sits on top of that fetched set (posture, function spread, temp/perm mix, seniority mix, reposting pressure). See OI1.1 - buildable now. |
| "Track Singapore government / statutory-board roles" | `api/careers.js` already ingests a careers.gov.sg dump: `action:"company"` (agency match), `action:"jobs"` (title search), `action:"job"` (uuid). `CompanyPanel` **already fetches gov postings in parallel** and groups them by verbatim agency name (`csgGroups`). WikiGraph lenses filter on `source === "careers.gov.sg"`. | Gov postings are fetched + listed but get **no** gov-specific diagnosis and are excluded from `buildCompanyAgents`. Small additive. See OI1.3. |
| "Understaffed / growing / replacing" | Nothing. Requires longitudinal (time-series) posting data or headcount; MCF/careers.gov.sg give a **live snapshot only**. | **No data source.** NOT READY (OI1.4). |
| "Startup vs institution / company size / funding stage" | Nothing. `api/ssic.js action:"lookup"` returns ACRA **industry classification + registered-entity facts only** (SSIC, address, UEN, namesakes) - **no** headcount, revenue, funding, or age-as-size proxy. | **No data source ingested.** NOT READY (OI1.5). |
| "What demographic is really being targeted" | `rsHiringFilter` already reads years-of-experience + degree gates verbatim from the ad. MCF/careers.gov.sg carry **no** age, gender, race, or nationality field. | Anything beyond experience/qualification gates is **fabrication**. NOT READY (OI1.6). |
| "Why does this org need this role" (causal story) | Nothing deterministic can author causation from a job ad. | Needs a **governance-audited, advisory-tagged** LLM prompt spec; never presented as a deterministic finding (this is exactly the WH1 violation walked back this session). NOT READY (OI1.7). |

**One-line honest summary:** the fetch-and-list plumbing for "all an employer's roles" and "gov roles" is already built. What is genuinely buildable now is a **deterministic organisation-diagnosis panel that reads only fields already fetched**. The headcount / growth / size / demographic / causal ambitions each need a data source or a governance artefact that does not exist in the repo today, and are marked NOT READY rather than faked.

---

## OI1.1 - Organisation Diagnosis panel (READY_FOR_BUILD)

### Scope
Add one additive **"Organisation read"** panel inside `CompanyPanel` (App.jsx), rendered for the `activeMatch` (the confirmed single employer) once its postings are fetched. It surfaces deterministic, countable organisational signals derived **only** from fields already present on `activeMatch.jobs` (the merged MCF live set), `empReg` (ACRA), and `csgGroups` (gov). No new fetch, no LLM, no invented number.

### Radicality band
**ADDITIVE.** New pure function `buildOrgRead(activeMatch, empReg, csgGroups)` + one render block inside the existing `CompanyPanel`. Reuses already-fetched state. Touches the frozen door zero times (search box, first-run, occupation resolve, Browse, data tables, `/api/claude` all untouched).

### Signals (each = a countable fact + a withhold rule)

| Signal | Computed from (real field) | Rendered claim | Withhold when |
|---|---|---|---|
| **Hiring breadth** | `activeMatch.jobs[].categories[0]` (MCF function) distinct count vs total postings | "N live postings across M functions" | `jobs.length < 3` |
| **Function concentration** | modal `categories[0]` share | "X% of live postings sit in <function>" - a spread fact, not a growth claim | fewer than 3 postings |
| **Seniority mix** | `positionLevels[0]` histogram (verbatim MCF values) | "P entry / Q mid / R senior of N stated" (only levels the ad states) | no posting states a level |
| **Engagement mix (temp vs permanent)** | `employmentType` / `employmentTypes[0]` via the existing `rsEmpTypeBucket()` logic (reuse, do not re-derive) | "K of N live postings are non-permanent (verbatim: <types>)" | no posting states a type |
| **Reposting pressure** | same title+employer near-duplicate clustering already in `rsIndicators` (`ind-repost` logic) but over the **full** employer set, not the sampled set | "This employer has D near-identical live ads for <title>" | maxDupe < 3 |
| **Salary disclosure posture** | `salaryMin/Max` present-count over the employer set (reuse `rsIndicators` `ind-salary`) | "S of N live postings state a band (X%)" | fewer than 3 postings |
| **Registry facts** | `empReg` (ACRA `matched:"exact"` only): SSIC industry, incorporation, address, namesakes | "Registered as <SSIC activity>; incorporated <date>" - **facts only** | `matched !== "exact"` -> "No exact ACRA match" |
| **Sector (gov vs private)** | presence of `csgGroups` hits for this employer key | "Also lists N roles on careers.gov.sg (public service)" | no gov match |

**Hard non-inventive fence:** every string is a count or a verbatim pass-through. The panel must **never** phrase a count as "growing", "understaffed", "replacing", "expanding", or any trend/causal verb - those are OI1.4/OI1.7 and are not grounded by a snapshot. A count is a count.

### Change map

| File | Symbol | Action |
|---|---|---|
| `v3/src/App.jsx` | new pure fn `buildOrgRead(activeMatch, empReg, csgGroups)`; additive render block in `CompanyPanel` after the ACRA block | **Add** |
| `v3/src/App.jsx` | reuse `rsEmpTypeBucket`, `rsNormTitle`, `rsTokens`, `rsJaccard` logic - if these live in `ReviewStudio.jsx`, lift a shared copy or import; **do not** re-invent the thresholds | **Touch** (import only) |
| frozen door | `mcfSearch`, occupation resolve, Browse `PostingEvidencePicker`, data tables, `/api/claude` | **Freeze** |

### Grounded-in
- Reposting / salary-opacity heuristics: existing `rsIndicators` (`ReviewStudio.jsx:605`), themselves grounded in the blueprint's "recurrence as a proxy" assumption (already disclosed in `_keyAssumptions`).
- Engagement-type bucketing: existing `rsEmpTypeBucket` (verbatim MCF/CSG `employmentType`).
- Registry facts: `api/ssic.js` `action:"lookup"` (ACRA, `matched:"exact"` only) - same authority table as `v3-employer-pin-spec.md` OI... EMP2.
- Function / seniority: MCF `categories` / `positionLevels` verbatim pass-through.

### Acceptance
- Fixture: Metta uuid `2320493d…` employer -> resolve via `CompanyPanel`, assert the panel renders only signals whose withhold rule passes, and that two runs are byte-identical (determinism).
- NHG + PSD `v3/Sample/` employers -> assert temp/perm and seniority counts equal a hand-count of the fetched `jobs[]`.
- Assert **no** trend verb appears in any rendered string (grep the built strings for `grow|understaff|expand|replac|shrink` -> zero).
- Assert ACRA block reads "No exact ACRA match" (not an address) when `matched !== "exact"`.

### Non-inventive gates (spec §6) + audit
- Applies: "every rendered number maps to a fetched field"; "no trend/causal verb without longitudinal data"; "ACRA shown only on exact match".
- Audit: **G1-G8 live-read** audit required (this is a live render). **D1-D8 static-prompt** audit NOT required (no LLM in this slice).

### Pre-mortem
| # | Failure mode | Guard |
|---|---|---|
| 1 | A count silently reads as a growth story ("12 postings" implies expansion) | Panel copy is fixed to neutral count phrasing; acceptance greps for trend verbs |
| 2 | ACRA namesake collision renders the wrong entity's facts as this employer's | Reuse the `matched:"exact"` fence + namesake disclosure already in `fetchEmployerRegistration` |
| 3 | Reposting count double-counts the same posting under posted vs hiring company name | Reuse `resolveCompany`'s dedupe-by-uuid before clustering |
| 4 | Signal shown on 1-2 postings reads as representative of the whole org | Every signal carries a `>= 3 postings` floor and a scope footer: "over this employer's live postings only" |
| 5 | Gov (careers.gov.sg) postings leak into MCF-only counts and inflate them | Keep MCF and CSG counts in separate labelled rows (they are already separate state) |

---

## OI1.2 - Wire the result/ReviewStudio path to the employer-scoped fetch (READY_FOR_BUILD, small wiring)

### Scope
Unblock **TR1.2**. `rsIndicators` today only sees the **sampled** `result.responsibilitiesData.jobs`, so its `ind-repost` / duplicate-detection is over a title re-search, not the employer's actual live set. The employer-scoped fetch (`/api/mcf action:"company"`) already exists. This slice adds, inside `ReviewStudio.jsx`, an **opt-in** deferred fetch (same posture as the existing `fetchEmployerRegistration` module-cached wrapper) that pulls the analysed posting's employer's full live set and re-runs the duplicate/reposting read against **that** set, clearly labelled "across this employer's N live postings" instead of "in the M sampled".

### Radicality band
**ADDITIVE.** One new client wrapper `fetchEmployerPostings(employerName)` mirroring `fetchEmployerRegistration` (module cache, in-flight dedupe, always resolves). One additive indicator variant in `rsIndicators`. No API change (the endpoint + `resolveCompany` already ship). Frozen door untouched.

### Change map
| File | Symbol | Action |
|---|---|---|
| `v3/src/App.jsx` | export `fetchEmployerPostings(name)` - thin `POST /api/mcf {action:"company", company, limit:50}` wrapper, cache + in-flight keyed by `step2EmployerKey` | **Add** |
| `v3/src/ReviewStudio.jsx` | consume it in the indicators panel; add an employer-scoped `ind-repost`/`ind-salary` variant that supersedes the sampled one when the employer fetch resolves | **Touch** (additive) |
| `api/mcf.js` | `resolveCompany` | **Freeze** (already correct) |

### Grounded-in
`api/mcf.js resolveCompany` (verbatim MCF postings, deduped, employer-key grouped). No new source.

### Acceptance
- For an employer with a known repost pattern, assert the indicator switches from "in the M sampled" to "across this employer's N live postings" once the fetch resolves, and that N matches `totalPostings` from the envelope.
- Determinism: identical `activeMatch.displayName` -> served from cache, byte-identical.
- Graceful: on fetch failure the sampled-set indicator remains (never blanks).

### Non-inventive gates + audit
- Applies: "count scoped honestly to live postings only"; "withhold on ambiguous employer resolution" (reuse `ambiguous` -> do not merge across groups).
- Audit: G1-G8 live-read. No LLM -> no D-audit.

### Pre-mortem
| # | Failure mode | Guard |
|---|---|---|
| 1 | Ambiguous employer name merges two firms' postings | Honour `data.ambiguous` -> withhold the employer-scoped variant, keep the sampled one |
| 2 | Extra fetch adds Step-3 latency | Deferred + cached, off the critical render path (same posture as `fetchEmployerRegistration`) |
| 3 | Employer live set is smaller than the sampled title search (fewer, not more) | Label states the actual denominator; never claim "complete history" - MCF serves live only |

---

## OI1.3 - Gov / statutory-board role read (READY_FOR_BUILD, additive)

### Scope
The gov postings are already fetched (`csgGroups`) and listed but get no diagnosis. Add a deterministic **public-service read** row to the OI1.1 panel using only `careers.gov.sg` fields already in `csgState.jobs`: distinct agency count, per-agency posting count, engagement type (many public-service roles are contract/temp - render verbatim), and a **provenance line** naming careers.gov.sg + the dump's retrieval window. No new source, no cross-board unification claim.

### Radicality band
**ADDITIVE.** Extends the OI1.1 render + `buildOrgRead` with a gov branch. `api/careers.js` frozen (already ships `action:"company"`).

### Grounded-in
`api/careers.js` `normaliseCsgJob` fields (agency, employmentType, platform, mcfUrl) - verbatim. Blueprint non-negotiable on named-source provenance (`v3/goal/v3-blueprint.md:99`).

### Acceptance
- Query "Ministry" -> assert `csgGroups` renders **per distinct agency** (not one flat list), each with its own count, matching a hand-count.
- Assert the row never claims a unified "government headcount" or cross-board total (each board runs independent HR; the dump is a snapshot).

### Non-inventive gates + audit
- Applies: "no cross-board unification claim"; "provenance names careers.gov.sg + window". G1-G8 live-read. No LLM.

### Pre-mortem
| # | Failure mode | Guard |
|---|---|---|
| 1 | Distinct agencies collapsed into one "government" bucket | Keep `csgGroups`' verbatim agency grouping |
| 2 | Snapshot read as a live establishment count | Provenance line states "live listings in the careers.gov.sg dump, not headcount" |
| 3 | Gov contract-heavy engagement read as instability | Render engagement type verbatim, no interpretation verb |

---

## NOT READY - do not spec a build (blockers named)

### OI1.4 - "Understaffed / growing / replacing" (NOT READY: no longitudinal data source)
A snapshot of live postings cannot support a trend verb. "Growing" needs posting counts **over time**; "replacing" needs to link a new posting to a departure; "understaffed" needs an establishment/headcount baseline. **None of MCF, careers.gov.sg, or ACRA carries a time series or a headcount in the repo today.** The only honest path is a stored longitudinal snapshot table (persist each `resolveCompany` result with a timestamp, then diff across runs) - that is a **new data-ingestion + storage slice** (Postgres, like the ACRA/SSIC mirror), not a read on existing data. **Blocker:** no persisted posting-history store exists; building one is its own arc (propose `OI2 - posting-history store`). Until then any growth/replacement claim is fabrication.

### OI1.5 - "Startup vs institution / size / funding stage" (NOT READY: no data source)
`api/ssic.js action:"lookup"` returns ACRA industry + registered-entity facts only. There is **no** headcount, revenue, paid-up-capital-as-size, or funding-round field ingested anywhere. Candidate real sources exist externally (ACRA's fuller entity dataset carries incorporation date and entity type; incorporation age is a **weak** proxy only; LinkedIn company size is scrapable but ToS-restricted and not currently ingested). **Do not invent a classifier.** A defensible minimal slice would render **only** ACRA entity-type + incorporation-date facts verbatim, and explicitly **not** label "startup" vs "institution" (that label is a judgement no ingested field supports). If the Human Lead wants the label, it requires either (a) a licensed company-firmographics feed (named, provisioned) or (b) a governance-audited advisory LLM read tagged "AI estimate" per OI1.7 - never a deterministic verdict. **Blocker:** no firmographics source; label unsupported.

### OI1.6 - "What demographic is really being targeted" (NOT READY: fabrication risk)
MCF and careers.gov.sg carry **no** age, gender, race, nationality, or family-status field. `rsHiringFilter` already surfaces the **only** grounded targeting signals: years-of-experience and qualification gates, verbatim. Anything beyond that (inferring "they want someone young", "they want a man") is fabrication and is legally sensitive (Singapore TAFEP fair-consideration norms). **Blocker:** no demographic field exists, and inference from proxies is prohibited by the non-inventive contract and by fair-hiring norms. Ship nothing here beyond the experience/qualification gates already shipped.

### OI1.7 - "Why does this org need this role" (NOT READY: needs governance-audited advisory prompt)
Causation from a single ad is judgement, not deterministic evidence. This session already found + walked back WH1 - a guessed causal story presented as a deterministic finding. Doing it at org scale repeats that at scale. A causal "why" read is **only** shippable as an explicit **LLM-advisory** surface: (a) authored via a governance-audited static prompt (D1-D8 audit), (b) rendered with a persistent "AI estimate - not a deterministic finding" tag, (c) never authoring a number/ranking/verdict, (d) grounded by citing the specific ad spans it reasons from. **Blocker:** no such governance-audited prompt spec exists; write it as a separate slice (`OI3 - advisory organisation-hypothesis prompt`) with the full D-audit before any build. Until that spec lands and passes, this stays dark.

---

## OI9. Roadmap sequence + open questions for the Human Lead

**Build order (READY only):** OI1.1 (org-read panel) -> OI1.3 (gov row, extends OI1.1) -> OI1.2 (result-path wiring, independent).

**Proposed new R-rule (R012, for Human Lead ratification):** *"A snapshot data source may never render a trend/causal verb (grow, shrink, understaff, replace, expand). Trend claims require a persisted time series; absent one, render counts only."* This pattern recurred across OI1.4/OI1.5/OI1.7 and is worth locking.

**Open questions (one ask, per house rule):**
1. Do you want the two new **arc specs** stubbed now - `OI2 posting-history store` (unblocks growth/replacement) and `OI3 advisory organisation-hypothesis prompt` (unblocks the causal "why", advisory-tagged)? They are the only honest routes to the deeper ambitions.
2. For OI1.5, is a **licensed firmographics feed** (headcount/funding) in budget? If not, the startup-vs-institution label stays unsupported and we ship ACRA facts only.

**Assumption stated inline (proceeding):** OI1.1's home is `CompanyPanel` (the existing company-first flow), not the per-posting Browse modal - the Human Lead's ask is explicitly employer-scoped ("ALL of an employer's roles"), and `CompanyPanel` already holds the full fetched set. If a per-posting home was intended, that is a different, smaller slice.

---

STATUS: READY_FOR_BUILD (OI1.1, OI1.2, OI1.3 only). OI1.4-OI1.7 NOT READY - named blockers above; do not build.
Next agent: `result-engine-builder` (OI1.1 first). Human Lead to clear OI9 open questions before OI2/OI3 are drafted.
