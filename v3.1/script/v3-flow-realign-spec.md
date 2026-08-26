(№ 132 - 03-07 '26 09:40 SGT)
<!-- Serial N assumed = 132 (next after employer-pin spec's No 131). Human Lead to reconcile against the serial-state counter per R011. -->

# SG Career View v3 - Step 1->3 flow realignment (`FLOW` arc)

> **Target repo path:** `v3/script/v3-flow-realign-spec.md` (build docs live in `v3/script/`).
> **Proposed versions:** FLOW-1a -> **v3.0.205**, FLOW-1b -> **v3.0.206**, FLOW-2 -> **v3.0.207**, FLOW-polish -> **v3.0.208**. Flat patch line; never roll the minor (per `v3-version-scheme`). One PR per slice, version bump + journal entry each.
> **Actually shipped (reconciled 2026-07-04, per audit finding #7):** FLOW-1a landed as v3.0.205, FLOW-1b as v3.0.206, FLOW-polish as v3.0.207 (took FLOW-2's slot, not v3.0.208 as originally proposed). **FLOW-2 was never built - Tier A (SVG scatter) included, not just Tier B.** There is no map-toggle state, no `Step2MapView`, and no FLOW-2 commit anywhere in history. Treat FLOW-2 as still fully open, not "in progress" or "staged."
> **G1 gate:** this spec is the gate. Build starts per-PR only when that PR's STATUS reads READY_FOR_BUILD and its open questions are cleared.
> **Status:** FLOW-1a **SHIPPED**; FLOW-1b **SHIPPED**; FLOW-polish **SHIPPED**; FLOW-2 **NOT BUILT** - Tier A (SVG scatter, no token needed) remains READY_FOR_BUILD whenever picked back up; Tier B (real OneMap tiles) stays **ADDITIVE-BLOCKED** on `ONEMAP_TOKEN` (FLOW-Q3).
> **Contract alignment:** locked v3 contract governs every line - deterministic = control, LLM = advisory only (no LLM authors a suggestion rank, a match tier, a count, or a coordinate); non-inventive (every rendered token maps to a real source and is withheld over guessed); faithful fidelity (a fuzzy/widened match is disclosed as such, never dressed as exact). Frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec. Red/green never load-bearing; 44px targets; ASCII-only JSX; honesty footers.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead.

---

## FLOW0. Scope (one paragraph)

Realign the **Step 1 -> Step 2** search flow to the Human Lead's stated north star without touching Step 3 (role analysis, stabilised at v3.0.204) and without rebuilding the removed PR #271 SSOC hard gate. Four slices: **(1a)** SSOC-2024 **query suggestions** that help the user refine the *typed text* in the `jobs` and `company` search modes - picking a suggestion **replaces the query string only**; it never gates submission and never filters Step 2 results. **(1b)** a **progressive scope-expansion ladder** (exact title -> title variant -> nuance -> R&R contextual) that auto-widens until the set is non-empty, with **per-card tier disclosure on each card's top strip** and a **searchable/filterable Match facet**. **(2)** a **listing <-> map toggle** in Step 2, staged: an inline SVG scatter of geocoded employers now (via `api/geocode.js locate`), real OneMap tiles gated on `ONEMAP_TOKEN`. **(polish)** Copy, a11y, honesty footers, and cleanup of the orphaned `ssocFilter` state left behind by PR #271.

---

## FLOW1. The PR #271 lesson, stated so it is not rebuilt

PR #271 (v3.0.198) removed the old Step 1a SSOC picker because it was a **hard gate + pre-filter** whose query-text SSOC code was **structurally independent** from Step 2's real per-posting SSOC classification (`classifyPostings` -> `/api/ssoc classifyTitles`, App.jsx L1536). A code chosen from the typed text could match zero of the postings the *classifier* actually assigned, producing dead-end "0 of 80" screens (visible still in the orphaned filter-empty copy at App.jsx L14167).

**The new 1a is categorically different and must stay different:**

| Dimension | Removed PR #271 picker (do NOT rebuild) | FLOW-1a suggestions (build) |
|---|---|---|
| What a pick does | Sets `ssocFilter` -> **filters** Step 2 postings by classifier code | **Replaces the typed query string**; Step 2 re-runs on the new text |
| Gating | **Hard gate** - had to pick before submit | **Never gates** - suggestions are optional; Enter/Find always works |
| Coupling to Step 2 | Query-text code vs per-posting classifier code = **two independent axes** | **Zero coupling** - suggestions touch only the input box |
| Failure mode | "0 of 80" dead end | Worst case: user ignores the list (same as today) |

**Hard rule (propose R012):** *A Step 1 suggestion may write only to the search input string. It must never set `ssocFilter`, never pre-filter Step 2, and never block submission.* The builder must not re-thread `ssocFilter` into the 1a path. `ssocFilter` is scheduled for removal in FLOW-polish.

**Note on FLOW-1b's Match facet vs #271:** the FLOW-1b tier facet (below) is **also not** a #271-style gate. It is a **view filter over the already-fetched set** (like the existing sector/company facets), never a pre-query pre-filter, and clearing it always restores the full set.

---

## FLOW-1a. SSOC query suggestions (refine the text, never gate)

**Radicality: ADDITIVE.** Reuses the already-live `/api/ssoc action:"search"` (ILIKE over the seeded taxonomy, with `fallbackSearch` over bundled `ssoc2024-hierarchy.json`) and the already-declared-but-orphaned `ssocOccs` / `ssocQuery` state. No new endpoint, no new file.

**Trigger.** In `jobs` and `company` modes only (role mode keeps its ESCO picker at App.jsx L16099; wiki unchanged). When `query.trim()` is 1-2 words (Human Lead's "one word or two words" rule - split on whitespace, length 1 or 2) and >= 3 chars, and `step` is `idle`/`error`, debounce ~280ms (mirror the role effect at L14473) and call `/api/ssoc {action:"search", query, limit:8}`.

**Change map.**

| File | Symbol | Action |
|---|---|---|
| `v3/src/App.jsx` | new effect sibling to L14473 (guarded `searchMode==="jobs" \|\| searchMode==="company"`) | Add |
| `v3/src/App.jsx` | `ssocOccs`, `setSsocOccs`, `ssocQuery`, `setSsocQuery` (already declared, orphaned) | Touch (re-purpose) |
| `v3/src/App.jsx` | suggestion render block under the input (after L16097, before the role-only picker at L16099) | Add |
| `v3/api/ssoc.js` | `action:"search"` handler (L531) | Freeze (read-only) |
| `v3/engine-data/ssoc2024-hierarchy.json` | bundled taxonomy | Freeze |

**Behaviour.**
- Render up to ~6 rows: `title` primary, `code` + `kind` (occupation / unit group / ...) as a mono sub-label. Rank verbatim from the endpoint's `ORDER BY level ASC, title ASC` - **the client re-sorts nothing and mints no score.**
- Clicking a row does exactly: `setQuery(node.title)`, `setSsocOccs([])`, then the mode's existing submit (`startJobsBrowse()` / `startCompanySearch()`). It sets **no filter**.
- **n.e.c./residual de-emphasis (PRs #269/#273 idiom).** Rows whose title matches `NEC_RX = /not elsewhere classified|\bn\.?e\.?c\.?\b/i` (the exact regex at ssoc.js L412) render greyed with a small "residual" tag and sink to the bottom of the *display* list (stable sort, penalty applied to presentation order only - the endpoint order is preserved for all non-residual rows). Mirrors the deterministic tie-break in `scoreSsocCandidate`.
- **Honesty footer:** "Suggestions from SSOC 2024 (SingStat) to refine your search words. Picking one only changes the text you typed - it does not filter results."

**Grounded-in.** SSOC 2024 Classification Structure + Alphabetical Index (SingStat), via `ssoc2024-hierarchy.json` / seeded `ssoc_taxonomy_nodes`. Residual-bucket de-emphasis: SSOC 2024 report §2.16.

**Acceptance (deterministic).**
1. `jobs` mode, type "data" -> suggestion list includes canonical titles (e.g. "Data Engineer", "Data Scientist") from the taxonomy; identical input -> identical order across two runs.
2. Clicking "Data Scientist" sets the input to exactly "Data Scientist" and runs the normal `jobs` browse; `ssocFilter` stays `null` (assert via absence of the Step 2 "Filtered by SSOC" banner, App.jsx L14161).
3. Three words (e.g. "senior data engineer") show **no** suggestion list (outside the 1-2 word rule); Enter/Find still submits.
4. A residual "... n.e.c." row renders greyed with a "residual" tag, below all non-residual rows.
5. Endpoint down (500) -> list silently empties; Find still works. No dead end.

---

## FLOW-1b. Progressive scope-expansion ladder + per-card tier disclosure

**Human Lead intent (governing).** Step 1b is a **progressive scope expansion**, not a pick-one-tier match. The search starts at the **narrowest** scope (exact title) and **automatically widens tier by tier** - exact title -> title variant/wildcard -> nuance -> R&R (role & responsibility) contextual - **until the result set is non-empty**. Zero listings is acceptable **only** when even the widest (R&R contextual) scope genuinely finds nothing: *"it cannot be zero listing unless there is completely no such role."* Every result must disclose the scope that produced it - a widened match must never present as exact - **and** the disclosure is **per posting, on the card's top strip**, plus **searchable/filterable** by tier.

**Radicality: ADDITIVE.** Two grounded pieces: (a) the **auto-widening** is already done server-side by the frozen `api/mcf.js` cascade - we surface it; (b) the **per-card tier** is a new **client-side deterministic** classification of each posting against the query, reusing the repo's existing token-overlap idiom (no LLM, no new endpoint).

**FLOW-Q1 resolved - the auto-widen is already server-side; reuse, do not reinvent.** `api/mcf.js action:"jobs"` already runs the ladder and **only falls through to the next tier when the current one is empty/thin**, then returns whatever the widest reached tier produced (Tier 1 title+altLabels L561-585 -> Tier 2 ESCO skills L587-602 -> Tier 3 weighted keyword `approximate:true` L604-628 -> scraps L632-639 -> warm empty `tier:0` only when *all* tiers are empty L640-647). This **is** the "cannot be zero unless no such role" guarantee, already deterministic. FLOW-1b does **not** re-implement widening; it (1) reads the set-level `tier`/`approximate` for a "widened search to X" note, and (2) derives each card's own tier for the badge + facet.

**Set-level "widened search to X" note** (top of Step 2, above the cards). Text switches purely on the server `tier`/`approximate`:

| mcf return | Note |
|---|---|
| `tier:1`, not approximate | (no widen note - exact scope satisfied) |
| `tier:1` via altLabels / `tier:2` | "Widened search to title variants and related skills" |
| `tier:3` / `approximate:true` | "Widened search to role & responsibility keywords (approximate) - no exact-title postings found" |
| `tier:0` | "No matching postings at any scope - there may be no such role live right now." |

**Per-card tier badge (top strip).** Each Step 2 card carries a **tier badge on its top/first-layer strip** (the same row that currently shows the company strip), stating how *that specific posting* was matched. Because `api/mcf.js` returns a flat `jobs` array with only a **set-level** tier (it does not tag each posting, and the set also merges careers.gov.sg postings that never carry an mcf tier), the per-card tier is computed **client-side, deterministically**, by a new `step2MatchTier(job, query)` helper:

| Badge | Rule (deterministic, normalised) |
|---|---|
| `exact title` | normalised posting title === normalised query |
| `title variant` | title token-overlap >= 0.66, or query is a whole-word prefix/wildcard of the title (or vice versa) |
| `nuance` | title token-overlap 0.4-0.66 |
| `R&R match` | title overlap < 0.4 but all/most query tokens appear in `description`/`responsibilitiesText` |
| `related` | none of the above (surfaced only because the server widened scope) |

`step2MatchTier` **reuses the exact token idiom already in the repo** - `normaliseForMatch` + `tokenOverlapScore` from `api/ssoc.js` L288-314 (mirror it client-side; ASCII only). It mints no score shown to the user; the badge is a label only. Thresholds are the same family already sanctioned in `scoreSsocCandidate` (0.66 / 0.4). This is deterministic and non-inventive: a token-overlap label, not an LLM verdict.

**Tier is searchable + filterable.** Add a **"Match" facet** to the existing `STEP2_FACETS` dropdown pattern (the `facets` state + `openFacet` UI in `PostingEvidencePicker`, L11993-L11994), whose options are the five badge labels present in the current set. The free-text `findText` filter (L11995) must **also** match on the badge label (fold each card's tier label into its searchable haystack at L12134). Filtering by tier is a **view filter over the already-fetched set** - it never re-queries and never gates (distinct from the removed #271 SSOC pre-filter).

**Org search (`company` mode).** `resolveCompany` (mcf.js L337) already returns `ambiguous` + `matches` sorted by posting count; `CompanyPanel` already renders the ambiguous picker. **FLOW-Q2 resolved:** `companyKeyMatches` (exact + whole-token-prefix, L324) already covers exact and "recommend/suggest" (prefix); FLOW-1b adds only a **disclosure chip** - "Exact employer match" when `queryKey === matchKey`, else "Closest employer matches - pick one" when `ambiguous`. No new fuzzy matching (out of scope; would re-introduce an independent-axis mismatch).

**Change map.**

| File | Symbol | Action |
|---|---|---|
| `v3/api/mcf.js` | cascade + `tier`/`approximate` returns (the auto-widen engine) | Freeze (read-only) |
| `v3/api/ssoc.js` | `normaliseForMatch`, `tokenOverlapScore` (idiom mirrored client-side) | Freeze (read-only) |
| `v3/src/App.jsx` | new `step2MatchTier(job, query)` helper (client, deterministic) | Add |
| `v3/src/App.jsx` | `PostingEvidencePicker` - read `data.tier`/`data.approximate` (L2010-L2012, currently discarded) -> set-level "widened search to X" note | Touch |
| `v3/src/App.jsx` | Step 2 card top strip - add per-card tier badge (icon + label, not colour-only) | Touch |
| `v3/src/App.jsx` | `facets`/`openFacet` (L11993) - add a "Match" facet; `findText` haystack (L12134) - include tier label | Touch |
| `v3/src/App.jsx` | `CompanyPanel` - exact/closest disclosure chip from `queryKey`/`ambiguous` | Touch |

**Grounded-in.** mcf.js cascade docstring (L8) + tier returns (the widening); ssoc.js token-overlap idiom (the per-card tier); non-inventive contract "a fuzzy match must never present as exact" (`doc/v3-research-grounded-model.md`); SSOC 2024 §3.3/§3.4 (duties/context can carry a match) for the R&R tier rationale.

**Acceptance (deterministic).**
1. **Auto-widen, non-empty guarantee.** A query that returns **0 at exact-title scope** but has looser matches in the fetched corpus MUST render a non-empty set from a wider tier, with the set-level note "Widened search to ...". Only a query with genuinely no match at *any* scope yields the empty state (server `tier:0`). Assert: for a fixture query where MCF returns Tier 3, Step 2 is non-empty and the note reads the Tier 3 copy.
2. **Per-card badge on top strip.** Every card shows a tier badge on its first-layer strip; the badge equals `step2MatchTier(job, query)`; an exact-title posting reads "exact title", a description-only match reads "R&R match". Two runs -> identical badges (determinism).
3. **Widened never reads as exact.** A posting matched only via R&R never shows "exact title"; badge and set note both disclose the widening.
4. **Tier is filterable + searchable.** Selecting "R&R match" in the Match facet shows only R&R-badged cards; clearing restores all. Typing a tier label into the find field filters to matching cards. Neither re-queries MCF (assert: no new `/api/mcf` call fired).
5. **No gate.** The Match facet is a view filter over the already-fetched set; it can reach empty by user choice but the underlying set is unchanged and clearing restores it (distinct from #271's dead end).
6. **Org chip.** `company` "DBS" (one dominant employer) -> "Exact employer match"; ambiguous query -> "Closest employer matches - pick one" + existing picker. Same query -> same chip twice.

---

## FLOW-2. Step 2 listing <-> map toggle (staged on ONEMAP_TOKEN)

**Radicality: ADDITIVE (SVG-scatter tier) / ADDITIVE-BLOCKED (real-tile tier).**

**Honest buildability finding.** `api/mcf.js normaliseJob` (L141-190) exposes **no** address or postal field - so Step 2 postings cannot be geocoded per-posting. The only postal available is the **employer's ACRA-registered postal** via `api/ssic.js action:"lookup"` (already used by the EMP arc) and any careers.gov.sg address. Therefore the map plots **employers, not postings** (an employer with N postings is one pin with a count). `api/geocode.js action:"locate"` returns `{matched:"single", lat, lng}` **today** (the SEARCH call needs no token, geocode.js L60-62 - token only decorates the request); only the **static-tile render** (`action=render`) needs `ONEMAP_TOKEN` and returns 204 without it (L121).

**Staging.**
- **Tier A (build now):** a toggle between the existing listing and an **inline SVG scatter** of geocoded employers on a schematic SG outline. Coordinates come from `geocode.js locate` (lat/lng), normalised to the SVG viewbox by a fixed SG bounding box (constant, not minted). Each pin is a 44px touch target labelled with the employer + posting count (reuse the EMP `step2EmployerKey` grouping). Employers with no exact ACRA postal are **listed as "not mapped"** below the plot - withheld, never guessed onto a centroid. Same-origin only (SVG inline; no external tiles) - **no CSP edit** (EMP6).
- **Tier B (blocked on FLOW-Q3):** swap the SVG backdrop for real OneMap static tiles via the already-built same-origin `GET /api/geocode?action=render` proxy the moment `ONEMAP_TOKEN` is provisioned. **Zero client change** beyond an `<img>` backdrop; the file already reads the env var (geocode.js L30) so it lights up with no code change.

**Change map.**

| File | Symbol | Action |
|---|---|---|
| `v3/src/App.jsx` | `PostingEvidencePicker` - add `view` state (`"list"\|"map"`), a toggle control (aria-pressed, 44px), and a `Step2MapView` sub-component (inline SVG scatter) | Add/Touch |
| `v3/src/App.jsx` | reuse `step2EmployerKey` grouping (EMP arc) for one-pin-per-employer + count | Touch |
| `v3/api/geocode.js` | `action:"locate"` (lat/lng) and `action=render` (tiles) | Freeze (read-only) |
| `v3/api/ssic.js` | `action:"lookup"` (employer postal) | Freeze (read-only) |
| `v3/vercel.json` | CSP | Freeze (no edit - same-origin only) |

**Grounded-in.** OneMap (SLA, data.gov.sg family) via `geocode.js`; ACRA registered address via `ssic.js`; posting grouping from the merged live list (EMP3 idiom). SG bounding box: SLA published extent (constant).

**Acceptance.**
1. Toggle flips listing <-> map; both render the same employer set (map = one pin per `step2EmployerKey`, count on the pin).
2. Each employer with `geocode.locate matched:"single"` plots; employers with no exact ACRA postal appear in a "not mapped (N)" list, never on a fabricated point.
3. Pins are >= 44px, keyboard-focusable, labelled (employer + count); colour is not the only signal (icon + label).
4. `ONEMAP_TOKEN` absent -> SVG backdrop renders (no dark box, no broken `<img>`); no CSP violation in console.
5. Determinism: same result set -> same pin positions (fixed bbox projection).

---

## FLOW-polish. Copy, a11y, and PR #271 residue cleanup

**Radicality: ADDITIVE / cleanup.**
- Remove the orphaned `ssocFilter` prop-threading from `PostingEvidencePicker` (L11978) and `CompanyPanel` (L13763) and the dead "Filtered by SSOC" render blocks (L14161-L14167, L12257-L12259), **only after** confirming nothing else sets it (grep: no setter survives outside the mode-switch reset at L16069). Keep `ssocOccs`/`ssocQuery` (now used by FLOW-1a).
- Copy pass: search-box helper text (L16044/L16051) to mention the SSOC suggestions and the map toggle; honesty footers consistent across 1a/1b/2.
- A11y sweep: suggestion list as a `listbox`/`option` pattern with keyboard nav; per-card tier badge, Match facet, tier chip and map toggle all announced.

**Acceptance.** No `ssocFilter` reference remains except its removal; Vitest + build green; keyboard-only user can pick a suggestion, read a per-card tier badge, filter by the Match facet, read the tier chip, and flip the map toggle.

---

## FLOW6. Non-inventive gates (spec §6)

| Gate | Applies | How honoured |
|---|---|---|
| No LLM authors a number/rank/verdict/tier | 1a, 1b, 2 | Suggestion order = endpoint order; set tier = mcf return; per-card tier = deterministic token overlap; count = grouping; coords = geocode. No LLM in any path. |
| Named source per claim | all | SSOC 2024, mcf tier + token idiom, ACRA, OneMap - tabled per slice. |
| Withhold over invent | 1b, 2 | Widened match disclosed, never dressed as exact; un-geocodable employers "not mapped", never centroided. |
| Frozen door untouched | all | `api/mcf.js`, `api/claude.js`, `engine-core.js`, `src/main.jsx`, data tables, occupation resolve, Browse pipeline all read-only. |
| D1-D8 static-prompt audit | none | No prompt authored. |
| G1-G8 live-read audit | 1b, 2 | Verify set note == server tier; verify per-card badge == `step2MatchTier`; verify pins == geocode `matched:"single"` only. |

---

## FLOW9. Pre-mortem

| # | Failure mode | Guard |
|---|---|---|
| 1 | 1a rebuilt as a filter (the #271 mistake) - a pick sets `ssocFilter` | R012 hard rule; acceptance 1a#2 asserts `ssocFilter` stays null; FLOW-polish deletes the setter path. |
| 2 | Client re-ranks suggestions and mints an order the source did not sanction | Render verbatim endpoint order; only presentation-order sink for n.e.c. (disclosed); no score minted. |
| 3 | Per-card tier badge presents a widened/R&R match as "exact title" | `step2MatchTier` gates "exact title" on strict normalised equality only; acceptance 1b#2/#3 assert. |
| 4 | Match facet becomes a #271-style dead-end pre-filter | It is a view filter over the already-fetched set; acceptance 1b#4/#5 assert no re-query and full restore on clear. |
| 5 | "Widened search" note contradicts the per-card badges (set says exact, card says R&R) | Set note reads server tier; badges read client tier; both disclose widening - a Tier 3 set can hold mixed badges, which is honest, not contradictory (note states the widest scope reached). |
| 6 | Auto-widen guarantee silently broken - a real role returns empty | The widen is the frozen mcf cascade (untouched); empty only on server `tier:0`; acceptance 1b#1 asserts non-empty when any wider-tier match exists. |
| 7 | Map plots a guessed point for an employer with no ACRA match | Only `geocode.locate matched:"single"` plots; others -> "not mapped" list. |
| 8 | Map ships dark because `ONEMAP_TOKEN` was assumed | Tier A uses inline SVG (no token); Tier B explicitly BLOCKED, lights up when the env var lands. |
| 9 | CSP violation from external tiles | Tier A same-origin SVG; Tier B proxies through `/api/geocode` (server-side fetch) - no `vercel.json` edit. |

---

## FLOW-Q. Open questions

- **FLOW-Q1 (resolved):** reuse mcf.js cascade for the auto-widen and its `tier`/`approximate` return; per-card tier is deterministic client-side token overlap (ssoc.js idiom). Do not reinvent the ladder.
- **FLOW-Q2 (resolved):** org "recommend/suggest" is already covered by `companyKeyMatches` + the ambiguous picker; FLOW-1b adds disclosure only, no new fuzzy match.
- **FLOW-Q3 (OPEN - blocks FLOW-2 Tier B only):** `ONEMAP_TOKEN` is not provisioned (geocode.js L27-30, EMP9). Tier A (SVG scatter) ships without it. **Human Lead decision:** provision the token to unlock real tiles, or accept SVG-only for now?
- **FLOW-Q4 (flag):** propose **R012** (Step 1 suggestions may write only to the query string). Human Lead to ratify before it binds.

---

**STATUS (reconciled 2026-07-04):** FLOW-1a, FLOW-1b, and FLOW-polish **SHIPPED** (v3.0.205-207). **FLOW-2 NOT BUILT** - Tier A (SVG scatter) is still READY_FOR_BUILD, no code or commit exists for it yet. Tier B (real OneMap tiles) stays **BLOCKED** pending FLOW-Q3 (`ONEMAP_TOKEN` provisioning).
**Next agent:** `result-engine-builder`, to pick up FLOW-2 Tier A when directed.
