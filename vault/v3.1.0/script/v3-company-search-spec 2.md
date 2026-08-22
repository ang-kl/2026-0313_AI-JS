(№ 1 - 18-06 '26 14:30 SGT)

# SG Career View v3 - Company-Search slice spec (CO1: "search by employer, double-check the name, count the live postings")

> **Target repo path:** `v3/script/v3-company-search-spec.md` (build `.md` files live in `v3/script/`; the locked-contract docs it depends on remain in `doc/`).
> **Status:** READY_FOR_BUILD.
> **Proposed version:** **v3.0.87** (flat patch line per `v3-result-engine-spec.md` SS11 AU-7 amendment; no minor roll before v3.0.999). Version bump is a **G1 confirmation gate** (Rule V-1) - do not bump without Human Lead sign-off.
> **Contract alignment:** the locked v3 contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) and the frozen door in `v3-result-engine-spec.md` SS1 govern every line. Deterministic = control; LLM = advisory only (and CO1 uses NO LLM at all); non-inventive; withhold over fabricate; faithful fidelity.
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR blocks, ship rhythm) bind this spec.
> **Arc position:** CO1 is the foundation of the **company work-surface arc**. Later slices CO2 ("agents to build") and CO3 ("process to re-engineer") build analysis ON TOP of the collated postings this slice produces. CO1 is deliberately scoped to: mode switch + company poll + name confirmation + posting count/list. No new analysis here.

---

## CO1.0. Scope

This slice adds a third search mode to the landing page - **company-name search** - alongside the frozen "Analyse role" (ESCO) and "Browse SG jobs" modes. In company mode the user types a company name; we poll MyCareersFuture (MCF) for that employer's advertised jobs; we **double-check / resolve the name the user meant** by collapsing the fuzzy MCF result set to the DISTINCT matched employer name(s) with a per-employer **live-posting count**; and we render the confirmed company header ("Found: `<verbatim MCF company name>` - N live postings") above a list of those postings, reusing the existing `McfJobsPanel` card style. Each posting still routes to the existing `handleAnalysePosting`. CO1 mints no analysis and no new number; the count is pass-through arithmetic over real MCF results.

---

## CO1.1. Radicality band

**ADDITIVE** (one REWIRE-lite touch in the landing toggle; one ADD in `api/mcf.js`).

- Landing toggle: REWIRE-lite - the existing two-card `searchMode` array gains a third row; no existing card is renamed or removed; the input/button row and focus-on-select behaviour are reused, not forked.
- `api/mcf.js`: ADDITIVE - a new `action: "company"` branch is added; the frozen `action: "jobs"` and `action: "job"` paths are byte-untouched; `mcfSearch`, `normaliseJob` and `MAX_OUTBOUND_CALLS` are reused, not changed.
- `McfJobsPanel`: ADDITIVE - reused as-is via an optional `mode`/`companyResolve` prop path; its existing role/skills polling and card render are untouched.

Justification: no architecture rewrite, no data-source replacement, no engine change, no frozen-door edit (see CO1.4). Per CLAUDE-FULL SS6.2 this is a feature add on the flat patch line - **patch bump v3.0.87**, G1-confirmed.

---

## CO1.2. Mode-switch decision (the toggle)

**Decision: company is a THIRD option (`searchMode === "company"`), augmenting - not replacing - role and jobs.**

Justification:
- "Browse SG jobs" (`searchMode === "jobs"`) is in the frozen-door set (`v3-result-engine-spec.md` SS1, "Browse SG jobs card incl. < 4 yrs scout"). Replacing or repurposing it would touch a frozen surface. Adding a sibling does not.
- The two modes answer different questions: `jobs` = "what roles exist for this title", `company` = "what is THIS employer advertising, and is it the employer I meant". Collapsing them would lose the name-confirmation step that is the point of CO1.
- The fresh-grad scout checkbox is bound to the `jobs` card and stays there; company mode has no such toggle in CO1.

`searchMode` becomes `"role" | "jobs" | "company"`. The three cards may wrap to two rows on narrow viewports - acceptable; each card keeps its 44px target.

---

## CO1.3. Change map (file by file, real symbols)

"Touch" = edit; "Add" = new; "Freeze" = leave byte-identical.

### `v3/api/mcf.js` - ADD `action: "company"`
- **Add** module consts (R005-greppable, ASCII per R007):
  - `COMPANY_SUFFIX_RE` - the deterministic normalisation suffix list (see CO1.5).
  - `COMPANY_MAX_PAGES` - search-page budget for company mode (set to 3; stays within `MAX_OUTBOUND_CALLS = 8`).
- **Add** `normaliseCompanyName(raw)` - pure deterministic function returning the normalised key (CO1.5 rule). No I/O.
- **Add** `resolveCompany(query)` - calls `mcfSearch` up to `COMPANY_MAX_PAGES` times (offset paging by `PAGE_SIZE`; **search pages only, `detail:false` - no per-job detail fetch**, so the list stays cheap), then over the union of normalised jobs:
  1. for each job, take `postedCompanyName` and `hiringCompanyName` (already on the normalised job, `mcf.js` ~159);
  2. **filter** to jobs whose posted OR hiring company `normaliseCompanyName(...)` equals `normaliseCompanyName(query)` OR contains it as a whole-token prefix (CO1.5 match rule);
  3. **group** the surviving jobs by the normalised employer key; for each group emit `{ key, displayName, count, jobs }` where `displayName` is the verbatim MCF name of the FIRST (latest-posted) job in the group (faithful fidelity - never re-cased or re-spelled by us);
  4. sort groups by `count` desc, then `displayName` asc.
- **Add** the handler branch, placed BEFORE the `action !== 'jobs'` guard (mirrors the `action === 'job'` branch at ~281): on `action === "company"` validate `company` (string), call `resolveCompany`, and return the response shape in CO1.6. Always HTTP 200 with a warm empty on failure (matches the rest of the handler).
- **Freeze** `action: "jobs"`, `action: "job"`, `mcfSearch`, `normaliseJob`, `scoreJob`, the tier cascade, `MAX_OUTBOUND_CALLS`, `WARM_ERRORS`.

### `v3/src/App.jsx` - REWIRE-lite (toggle) + ADDITIVE (company render)
- **Touch** `searchMode` state (~10839) comment to document the third value; initial value stays `"role"`.
- **Touch** the toggle array (~12513): add a third card `{ k:"company", label:"...", ... }`. Reuse the existing card `<button>` shape, `aria-pressed`, the focus-on-select handler (`document.getElementById("job-title-search")?.focus()`), and the 44px padding. The fresh-grad checkbox stays gated to `m.k === "jobs"`.
- **Touch** the label + placeholder + button (~12541-12554): when `searchMode === "company"`, the label reads "Company name", the placeholder reads e.g. "e.g. DBS Bank, Singapore Airlines, NHG", and the CTA reads "Find company". The Enter handler and the CTA `onClick` dispatch to a new `startCompanySearch` when `searchMode === "company"` (alongside the existing `startJobsBrowse`/`doSearch` ternary - extend to a three-way).
- **Add** `startCompanySearch` (useCallback, mirroring `startJobsBrowse` at ~11107): validate via the existing `validateJobTitleInput`, clear state, `track("company_search_started", ...)`, `setStep("mcf_company")`.
- **Add** a `step === "mcf_company"` render block (mirroring the `mcf_browse` block at ~12626): a "<- New search" back button, then the company panel (CO1.7). It calls `handleAnalysePosting` on each card and `handleQueuePosting` for compare - both reused unchanged.
- **Add** `CompanyPanel` component (or extend `McfJobsPanel` via an optional `companyQuery` prop - builder's choice; if extending, the company path must POST `action:"company"` and render the confirm header, while the role/skills path stays exactly as today). Recommended: a thin `CompanyPanel` that does its own `action:"company"` fetch and confirmation header, then renders posting rows by REUSING the existing `McfJobsPanel` card sub-render. No new card style.
- **Respect** R006 (extract any multi-line async arrow used as a JSX prop to a named fn), R007 (ASCII only; hyphens, never em/en dash), R005 (new consts greppable; add `startCompanySearch`/`CompanyPanel` to the packaging grep list if the project tracks component-level globals).

### Frozen (leave byte-identical)
- `searchOccupations`, `doSearch` (role path), `doAnalyse`, `getEscoSkills`, `/api/esco`, the engine and `engine-data/*`, `buildKnowledgeGraph`, `parseJobAd`, `handleAnalysePosting` body, `handleAnalyseCorpus`, `/api/claude`.

---

## CO1.4. Frozen-door check

- The **role search box, first-run help, occupation resolve, browse `jobs` path, the data tables, and `/api/claude`** are all untouched. The company mode reuses the SHARED input element (`#job-title-search`) by only changing its label/placeholder/CTA text via `searchMode`; it adds NO new resolver and NO engine call.
- `McfJobsPanel`'s existing `action:"jobs"` fetch is unchanged; CO1 adds a sibling `action:"company"` path, never editing the `jobs`/`job` branches.
- R-FREEZE (R011) runs before packaging: assert the frozen symbols above are byte-identical to `main`; a non-zero diff on any frozen symbol BLOCKS packaging.
- No conflict surfaced. If a builder finds the company path cannot work without editing a frozen symbol, STOP and surface to the Human Lead (CLAUDE-FULL SS11).

---

## CO1.5. Normalisation + match + disambiguation rule (deterministic, stated exactly)

**`normaliseCompanyName(raw)`** - applied identically to the user query and to each MCF `postedCompanyName`/`hiringCompanyName`:
1. Decode HTML entities (reuse `decodeEntities`), then `String(raw)`.
2. Lowercase.
3. Replace all runs of non-alphanumeric characters (punctuation, `.`, `,`, `&`, `/`, `-`, whitespace) with a single space.
4. Trim.
5. Strip a trailing legal-suffix token sequence matched by `COMPANY_SUFFIX_RE` (case-insensitive, anchored at end, applied repeatedly until none remain). Suffix set (exact, ASCII): `pte ltd`, `pte limited`, `private limited`, `ltd`, `limited`, `llp`, `lp`, `llc`, `inc`, `incorporated`, `co`, `company`, `corp`, `corporation`, `sg`, `singapore`, `s pte ltd`, `asia pacific`, `asia`. (Note: "pte. ltd." and "Pte Ltd" both normalise to the same key because step 3 strips the period first.)
6. Collapse repeated spaces; trim again. The result is the **normalised key**.

**Match rule** (query key `q` vs employer key `e`):
- EXACT: `e === q` -> match.
- PREFIX: `e` starts with `q + " "` OR `q` starts with `e + " "` -> match (whole-token prefix only; guards against "dbs" matching "dbsx"). 
- Otherwise no match. (No fuzzy edit-distance in CO1 - deterministic and explainable. Fuzzy widening is deferred to CO1.x if the Human Lead asks.)

**Disambiguation:**
- **1 distinct employer key** survives -> auto-confirm. Header: "Found: `<displayName>` - N live posting(s)". Render that group's postings.
- **>= 2 distinct employer keys** survive -> **no auto-pick**. Render a chooser listing each `{ displayName, count }` (44px rows, `aria-label`, no colour-only state); the user taps one to view its postings. The chosen group's header then reads as the single-match case.
- **0 keys** -> withhold (CO1.6 / "No live MCF postings found for that company").

The count `N` is exactly `group.jobs.length` after filtering - pass-through arithmetic, never minted, never rounded.

---

## CO1.6. `api/mcf.js` `action: "company"` contract (request / response)

**Request** (POST `/api/mcf`):
```
{ "action": "company", "company": "<user-typed name>", "limit": 50 }
```
- `company` required, string. `limit` optional, clamps to the existing 1..50 cap; defaults to the panel's 50.
- No `detail`, no `escoOccupation`, no `skills` - company mode never triggers per-job detail fetch in CO1.

**Response (success, HTTP 200):**
```
{
  "matches": [
    { "key": "<normalised key>", "displayName": "<verbatim MCF name>", "count": <int>, "jobs": [ <normalisedJob>, ... ] }
  ],
  "query": "<echoed user input>",
  "queryKey": "<normaliseCompanyName(query)>",
  "ambiguous": <bool>,        // matches.length >= 2
  "totalPostings": <int>,     // sum of counts across matches
  "pagesPolled": <int>,       // <= COMPANY_MAX_PAGES, for the honesty footer
  "source": "MyCareersFuture Singapore"
}
```
- `jobs` entries are the existing `normaliseJob` shape (so `McfJobsPanel`'s card render and `handleAnalysePosting` work unchanged).

**Response (no match, HTTP 200):**
```
{ "matches": [], "query": "<...>", "queryKey": "<...>", "ambiguous": false, "totalPostings": 0,
  "fallback": true, "code": "EMPTY",
  "message": "No live MyCareersFuture postings found for that company.",
  "source": "MyCareersFuture Singapore" }
```

**Response (MCF unreachable / timeout, HTTP 200):** `matches: []` + the appropriate `WARM_ERRORS` (busy/timeout/server) spread, `fallback: true`. Never throws to the client; never invents a company or a count.

---

## CO1.7. Render (company panel)

- **Header (single match):** "Found: `<displayName>` - N live posting(s) on MyCareersFuture" with the `● from MCF` Prov chip. `displayName` and `N` are verbatim/pass-through.
- **Header (ambiguous):** "Several employers match `<query>`:" then a chooser of `{ displayName · N postings }` rows; no auto-pick; selecting one swaps to the single-match header.
- **Header (zero):** the CO1.6 withhold message; offer "<- New search".
- **List:** the postings for the confirmed group, rendered with the existing `McfJobsPanel` card style (title, employer, salary range verbatim, posted-date "days ago", skills chips). Each card keeps its "Analyse this posting" -> `handleAnalysePosting` and "+ Compare" -> `handleQueuePosting`.
- **Footer honesty line:** "Company names and posting counts are verbatim from MyCareersFuture (polled `pagesPolled` page(s)); a fuzzy poll may miss postings filed under a differently-spelled employer name." No red/green; 44px targets; `aria-label` on the chooser and back button.
- **No new analysis number anywhere.** No LLM call.

---

## CO1.8. Non-inventive gates (which apply)

From `v3-result-engine-spec.md` SS6 hard gates:
- **Gate 1 (no LLM string -> number):** trivially satisfied - CO1 makes NO LLM call. Assert no `claudeCall`/`/api/claude` is wired into the company path.
- **Gate 2 (Prov chip on every figure):** the count and the names carry `● from MCF`. Assert present.
- **Gate 3 (`[UNVERIFIED]`/withhold over fabricate):** 0 matches -> the withhold message, never a fabricated company or a zero-padded count.
- **Gate 5 (determinism):** for a fixed MCF JSON payload, `resolveCompany` returns byte-identical `matches` (keys, displayNames, counts, ordering). Snapshot-assert.

Audits:
- **D1-D8 (static prompt audit):** NOT required - CO1 touches no reusable prompt template (no LLM surface).
- **G1-G8 (live read audit):** required on the deployed preview (CO1.9) - confirm `● from MCF` chip present, withhold fires on a nonsense company, and engine-wins is N/A (no engine number).

---

## CO1.9. Acceptance criteria

**IMPORTANT - sandbox egress caveat (record this):** the dev sandbox CANNOT reach MCF (egress blocked). The BUILD is verified by `npm run build` + deterministic logic/unit checks on mocked MCF JSON only. LIVE data verification happens on the deployed **Vercel preview**, whose `/api/mcf` serverless function reaches MCF.

**A. Build (sandbox, deterministic):**
1. `npm run build` passes (no esbuild parse error - R006/R007 honoured).
2. R-FREEZE: the frozen symbols in CO1.3 are byte-identical to `main`.
3. Unit (mocked MCF JSON, no network):
   - `normaliseCompanyName("DBS Bank (Singapore) Pte. Ltd.")` === `normaliseCompanyName("DBS BANK PTE LTD")` === `"dbs bank"` (suffix + punctuation + sg stripped deterministically).
   - Given a mock payload of 6 jobs - 4 posted by "Singapore Airlines Limited", 2 by "SIA Engineering Company Limited" - `resolveCompany("singapore airlines")` returns **one** match `{ displayName: "Singapore Airlines Limited", count: 4 }` (SIA Engineering does NOT prefix-match "singapore airlines"); `ambiguous === false`.
   - Given a mock payload where 3 jobs are "ABC Pte Ltd" and 2 are "ABC Holdings Pte Ltd", `resolveCompany("abc")` returns **two** matches (`abc` count 3, `abc holdings` count 2), `ambiguous === true`, no auto-pick, sorted count-desc.
   - `resolveCompany("zzqx nonexistent")` over any mock payload returns `matches: []`, `fallback: true`, the withhold message - never a fabricated entry.
   - Determinism: the same mock payload -> byte-identical `matches` across two runs.
   - Budget: `resolveCompany` issues at most `COMPANY_MAX_PAGES` (3) `mcfSearch` calls and ZERO `fetchJobDetail` calls; total outbound <= `MAX_OUTBOUND_CALLS`.
4. Mode switch: toggling to "company" relabels the shared input to "Company name", changes the placeholder + CTA, focuses the input, and dispatches Enter/CTA to `startCompanySearch`; toggling back to "role"/"jobs" restores their behaviour unchanged.

**B. Live (Vercel preview only):**
5. Search a real employer (e.g. "DBS Bank", "Singapore Airlines", "National Healthcare Group") -> header "Found: `<verbatim name>` - N live postings" with `● from MCF`; list renders; a card's "Analyse this posting" opens the existing analysis screen.
6. An ambiguous query that maps to several real employers -> the chooser lists each with its count; selecting one shows its postings; no auto-pick.
7. A nonsense company -> the withhold message; no fabricated company or count.
8. a11y on preview: no red/green; 44px targets on cards, chooser rows, toggle, back button; `aria-label`/`aria-pressed` present; keyboard-focusable.

---

## CO1.10. Pre-mortem (run before build)

| # | Failure mode | Likelihood | Guard |
|---|---|---|---|
| 1 | MCF fuzzy search returns the right company under a spelling our normaliser doesn't collapse -> count undercounts | Med | State the suffix/punctuation rule exactly (CO1.5); footer discloses "a fuzzy poll may miss differently-spelled names"; widen-via-CO1.x deferred, not silently guessed |
| 2 | Prefix match over-merges distinct employers (e.g. "DBS" swallowing "DBS Vickers") | Med | Whole-TOKEN prefix only (`q + " "`), never substring; the SIA Engineering unit test guards this; ambiguous path lists rather than auto-picks |
| 3 | Per-job detail fetch sneaks in and blows the call budget / cost | Low | Contract forbids `detail` in company mode; unit test asserts ZERO `fetchJobDetail` and <= `COMPANY_MAX_PAGES` search calls; G4 cost gate N/A (MCF is free/unauthenticated, same as existing paths) |
| 4 | Editing the shared toggle/input drifts a frozen-door symbol (role path, browse path) | Med | R-FREEZE blocks packaging; company mode only adds a card + relabels via `searchMode`, never edits `doSearch`/`startJobsBrowse`/the `jobs` fetch |
| 5 | A zero-result employer renders an empty card list instead of the honest withhold | Med | CO1.6 mandates the explicit withhold message on `matches: []`; unit + live test 7 assert it |
| 6 | em/en dash or non-ASCII slips into the new header/placeholder strings | Low | R007 + house grammar (hyphens only); build-time esbuild catch |

---

## CO1.11. Version-bump gate

On land: surface `Rule V-1 / G1` to the Human Lead. On yes, bump in all three per R003 (`App.jsx` line 1 header, `index.html` title, `package.json` version) to **v3.0.87**, write the HDR journal entry, bump `.serial-state.yml`.

```
[HDR] #NNN | HH:MM:SS SGT 18-6-26 | v3.0.87 | NNNkb | N,NNN lines
[INTENT] CO1 - landing company-name search: poll MCF, double-check the employer name, count + list its live postings
[DELTA] api/mcf.js action:"company" (normaliseCompanyName, resolveCompany); App.jsx third searchMode + CompanyPanel + startCompanySearch
[RISK] Low - additive; no LLM, no engine change, frozen door intact
[STATUS] BETA
[TEST] build + unit (mocked MCF JSON: normalise/filter/count/disambiguate/determinism/budget); live verify on Vercel preview
[NEXT] Confirm v3.0.87 bump (G1); then queue CO2 (agents to build) on the collated postings
[ADVICE] Deterministic-pass-through - the count is arithmetic over real results, never minted
```

---

**STATUS: READY_FOR_BUILD. Next agent: `result-engine-builder` (implements CO1 against this spec; deterministic-first; no LLM in the company path).**

*End of CO1 spec.*
