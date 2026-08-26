(№ 132 - 03-07 '26 10:40 SGT)
<!-- Serial N assumed = 132 (next after the employer-pin spec's No 131). Human Lead to reconcile against the serial-state counter per R011. -->

# SG Career View v3 - Behind-the-scenes work: footer truth-up + honest staged narration (`BSW` arc)

> **Target repo path:** `v3/script/v3-behind-the-scenes-spec.md` (build docs live in `v3/script/`).
> **Proposed version:** two PRs on the flat patch line - **BSW-A -> v3.0.186**, **BSW-B -> v3.0.187** (never roll the minor; live line is v3.0.185). **G1 gate:** this spec is the gate; build starts only when STATUS is READY_FOR_BUILD and the Human Lead clears the open questions in BSW7.
> **Status:** READY_FOR_BUILD for **BSW-A** (footer copy is a pure contract-correctness fix). **BSW-B** (staged narration) is READY_FOR_BUILD with two non-blocking assumptions stated inline.
> **Contract alignment:** locked v3 contract governs every line - deterministic = control; LLM = advisory only (no LLM authors a number, ranking, or verdict); non-inventive (every claim maps to a real source or is withheld); faithful fidelity (ranges stay ranges; confidence carried). Frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead.

---

## BSW0. Finding that reframes the ask (read first)

The request was framed as "bring back two v2 UX pieces missing from v3." **Source contradicts that framing.** All three named v2 surfaces already exist and render in v3 (`v3/src/App.jsx`, verified on the current tree):

| v2 surface | v3 status | Evidence |
|---|---|---|
| `ResultFooter()` with feedback / Methodology / Legal / Terms | **Present and rendered** on the result screen | `ResultFooter` at App.jsx:9660; rendered at App.jsx:16704; `/terms.html` exists at `v3/public/terms.html` |
| Staged loading narration + skill rows fading in | **Present** - `Spinner` receives real `step`/`subStep`/`skills`/`posting` and shows a live skill list + step rail | `Spinner` at App.jsx:5123; driven by `setSub`/`setSubStep`/`setLoadingSkills` at App.jsx:14626-14728; rendered at App.jsx:16167 |
| Home-screen "Note by builder" | **Present** | App.jsx:5641-5660 |

Per the house rule "code wins over docs wins over memory" (global CLAUDE.md, R001), the Explore agent's "no footer exists in v3" note is **stale and is hereby corrected**. This spec therefore does **not** rebuild missing components. It fixes the **two ways these surfaces have drifted from v3's contract**, which is the honest reading of "I miss the behind-the-scenes work": the behind-the-scenes copy no longer tells the truth about how v3 works, and the live progress feed was replaced by decorative theatre.

**Two drifts, one per PR:**
- **BSW-A** - the footer's **Methodology + Legal** panels still describe **v2's LLM-authored-ratings pipeline** ("Each skill is assessed by an OpenAI model ... will vary between searches", App.jsx:9724). That is factually wrong for v3 and **actively violates the deterministic-control / non-inventive contract**. Rewrite the copy to describe v3's real deterministic pipeline.
- **BSW-B** - the live milestone feed is honest but thin: v3 passes one `label` string + a decorative `SceneRotator` that **cycles on a 4200ms `setInterval` untethered to async state** (App.jsx:5102-5121). Restore v2's **honest multi-stage checklist** (per-stage tick tied to real `subStep`), and correct the milestone wording that still says "rating each against current AI capability" (App.jsx:14672) - the same LLM-authored framing BSW-A removes.

---

## BSW1. Scope (one paragraph)

Deliver the "behind-the-scenes" honesty the user misses, on surfaces that already exist, without touching the frozen door. **BSW-A** rewrites the `ResultFooter` Methodology and Legal panel copy so it names v3's actual sources and states plainly that the engine - not an LLM - authors every number. **BSW-B** replaces the untethered decorative rotator inside `Spinner` with a real staged checklist whose ticks are driven by the existing `subStep` milestones and re-words those milestones to drop the LLM-rating language. No engine number, ranking, or verdict changes; no new data source; no new route.

---

## BSW2. Radicality band

| PR | Band | Justification |
|---|---|---|
| BSW-A | **ADDITIVE** | Copy-only rewrite of the two existing panels inside `ResultFooter`. No new component, prop, state, or surface. It is a non-inventive **correctness** fix: it removes a claim the code no longer supports. |
| BSW-B | **REWIRE** | Re-wires the existing `Spinner` presentation layer: the decorative `SceneRotator` cycle is replaced by a checklist bound to already-present `subStep`/`skills`/`posting` state. No new async, no new engine call, no new number. The theatre scenes may be **retained as a secondary panel** (see BSW5) but must never drive perceived progress. |

Neither PR touches spec §1 frozen surfaces: the search box, first-run, occupation resolve, Browse, the data tables, or `/api/claude`. If build finds it cannot re-word a milestone without moving where `setSub` is called, **STOP** and surface to the Human Lead - the milestone strings live in the analysis flow, not in a frozen file, so this should not arise.

---

## BSW3. Change map (file-by-file, real symbols)

| File | Symbol | Touch / Add / Freeze | Change |
|---|---|---|---|
| `v3/src/App.jsx` | `ResultFooter` `open === "method"` block (9711-9733) | **Touch (BSW-A)** | Replace the four `<p>` bodies ("Data source", "Occupation codes", "How ratings are generated", "Known limitations") with the BSW4 copy. Keep the panel shell, toggle, and `esco.ec.europa.eu` link. |
| `v3/src/App.jsx` | `ResultFooter` `open === "legal"` block (9687-9710) | **Touch (BSW-A)** | Correct the "Powered by AI" attribution + the "AI-generated and indicative only" line to match advisory-only reality (BSW4). Keep IMDA / EU AI Act / ISCO-08 licensing paragraphs. |
| `v3/src/App.jsx` | `ResultFooter` static attribution `<p>` (9665-9667) | **Touch (BSW-A)** | Amend "Powered by AI (OpenAI primary; Gemini fallback)" -> advisory-narration wording (BSW4); confirm provider names with Human Lead (BSW7-Q3). |
| `v3/src/App.jsx` | `Spinner` (5123-5221) | **Touch (BSW-B)** | Add a `StageChecklist` render block (BSW5) between the progress-ring card (ends 5193) and the skill list (5194). Feed it `step`, `total`, `list.length`, `posting`. |
| `v3/src/App.jsx` | new `StageChecklist({ step, total, skillCount, hasPosting })` | **Add (BSW-B)** | Pure-presentational; derives per-stage done/current/pending from `step` only. No state, no timer, no fetch. |
| `v3/src/App.jsx` | `SceneRotator` (5102-5121) + call site (5217) | **Touch (BSW-B)** | Demote: keep the scenes but relabel the block heading to "Preview - what the analysis is assembling" so it reads as illustration, not live progress. Remove nothing; do not let its `setInterval` gate any tick. |
| `v3/src/App.jsx` | milestone strings at 14672, 14677, 14725, 14728 | **Touch (BSW-B)** | Re-word "rating each against current AI capability" -> deterministic framing (BSW6). Counts/structure unchanged. |
| `v3/api/*.js`, `v3/engine-data/*`, `v3/src/main.jsx` | - | **Freeze** | Never touched. No number, crosswalk, or provenance record is edited. |
| `v3/public/terms.html` | - | **Freeze** | Out of scope; already exists and is linked. |

---

## BSW4. BSW-A copy (grounded, non-inventive)

Rewrite each panel body to describe v3's **actual** pipeline. Every clause below maps to a named repo source (BSW-Grounded table). ASCII-only; hyphens only, never em/en dashes (R007).

**Methodology panel:**

1. **Data source** - "Roles and skills are drawn from live Singapore labour-market sources: job postings from MyCareersFuture (`api/mcf.js`) and the public sector via careers.gov.sg (`api/careers.js`), classified to SSOC 2024 (`api/ssoc.js`) and SSIC 2020 (`api/ssic.js`), with employer records from ACRA. Skill labels are canonical ESCO v1.2 taxonomy entries, citable by URI. The engine reads these sources; it does not invent role or skill names."
2. **How exposure is scored** (rename of "How ratings are generated") - "AI-exposure figures are computed deterministically, not written by a language model. Each occupation is crosswalked SSOC -> ISCO-08 -> SOC 2010 -> the AI Occupational Exposure (AIOE) index of Felten, Raj and Seamans (2021, Strategic Management Journal 42(12):2195-2217), and expressed as a 0-100 percentile among 774 occupations. The raw z-mean and z-range are carried for fidelity (`engine-data/aioe.js`, `engine-data/provenance.js`). The same input always yields the same score."
3. **Where AI is used** (new) - "AI is advisory only. A language model may narrate or phrase guidance, but it never authors a number, a ranking, or a verdict. Where a source is missing, the tool withholds the claim rather than guessing."
4. **Known limitations** - keep v2's anchoring-bias caveat, but drop "will vary between searches" (false for a deterministic engine). Add: "Exposure reflects occupational-group research, not your specific employer, sector, or seniority."

**Legal panel:** keep the Singapore (IMDA Model AI Governance Framework), EU (EU AI Act minimal-risk), and ISCO-08 licensing paragraphs verbatim. Change only:
- "Results are AI-generated and indicative only" -> "Results are computed from public labour-market data and research indices, and are indicative only."
- Static attribution "Powered by AI (OpenAI primary; Gemini fallback)" -> "Skills taxonomy: ESCO v1.2 (CC BY 4.0). Exposure index: AIOE (Felten et al. 2021). AI is used for narration only." (Provider names pending BSW7-Q3.)

---

## BSW5. BSW-B staged checklist (honest, state-tied)

`StageChecklist` renders one row per pipeline stage. Row state is derived **only** from `step` (the live `subStep`), so it can never show a tick before the work is done:

| Row | Label (done / active) | done when | Source of truth |
|---|---|---|---|
| 1 | "Role resolved in ESCO v1.2" / "Resolving role in ESCO v1.2..." | `step >= 2` | `subStep` set at App.jsx:14626 (=1) then 14672/14677 (=2) |
| 2 | "N essential skills mapped from the ESCO taxonomy" / "Mapping skills from the ESCO taxonomy..." | `skillCount > 0` | `loadingSkills` (App.jsx:14672) |
| 3 | "AI-exposure computed and career paths mapped" / "Computing AI-exposure and mapping career paths..." | `step >= 3` | `subStep` set at App.jsx:14725 (=3) |

Rules:
- Ticks use **shape, not colour** - a check glyph for done, an outlined pulsing ring for active, muted dot for pending (reuse the existing `ldxBreathe` keyframe and the step-rail treatment at 5176-5192). No red/green (colour-blind user; global CLAUDE.md accessibility rule).
- `aria-live="polite"` already wraps `Spinner` (5129); the checklist inherits it. Each row is a list item with a text label a screen reader can read - no icon-only state.
- The skill list at 5194-5211 stays; it already fades rows in via `animationDelay` (the v2 "one-by-one" behaviour). Do not duplicate it inside the checklist.
- `SceneRotator` stays but is retitled illustrative (BSW3). Its cycle must not feed any row's done/active state.
- 44px minimum touch target only applies if a row becomes interactive; keep rows non-interactive (pure status), so no target rule triggers.

---

## BSW6. BSW-B milestone re-wording (drop LLM-rating language)

The `setSub` strings in the analysis flow still carry the v2 LLM framing. Re-word, preserving counts and structure:

| Line | Current | New |
|---|---|---|
| App.jsx:14672 | "...skills found (${escoSource}) - rating each against current AI capability..." | "...skills found (${escoSource}) - crosswalking each to the AIOE exposure index..." |
| App.jsx:14677 | "...skills confirmed - analysing automation exposure and mapping career paths..." | keep (already deterministic-neutral) |
| App.jsx:14626 | "Resolving ... in ESCO v1.2 - ISCO-08: ..." | keep |

No count, order, or `subStep` value changes.

---

## BSW-Grounded. Source per claim

| Rendered claim | Named source | Authority |
|---|---|---|
| MCF postings | `v3/api/mcf.js` (frozen) | Live MyCareersFuture |
| careers.gov.sg postings | `v3/api/careers.js` | Live public-sector board |
| SSOC 2024 / SSIC 2020 classification | `v3/api/ssoc.js`, `v3/api/ssic.js`, `engine-data/ssoc2024-*.json`, `ssic2020-index.json` | SingStat classifications |
| Employer records | ACRA via `api/ssic.js` `action:"lookup"` | Authoritative |
| Skill labels | ESCO v1.2 REST API; URIs | EC DG EMPL, CC BY 4.0 |
| AI-exposure 0-100 + z-mean/z-range | `engine-data/aioe.js`, `engine-data/provenance.js` | Felten, Raj & Seamans (2021), SMJ 42(12):2195-2217; https://github.com/AIOE-Data/AIOE |
| Crosswalk chain SSOC -> ISCO-08 -> SOC 2010 -> AIOE | `engine-data/provenance.js` `chain` + `engine-data/ssoc-isco.js` | SingStat + BLS + AIOE, shared 2010 SOC vintage |
| ISCO-08 licensing / IMDA / EU AI Act paragraphs | existing `ResultFooter` legal copy (9697-9704) | Retained verbatim, already sourced |

No claim above is authored by an LLM. Any clause build cannot map to one of these is cut or marked `[UNVERIFIED]`.

---

## BSW7. Open questions for the Human Lead (non-blocking except Q1)

1. **[BLOCKS BSW-A wording only]** The footer today says the pipeline uses **OpenAI/Gemini to rate skills**. The engine files show a **deterministic AIOE** score. Confirm: does v3 still call any LLM for a per-skill *number*, or is the LLM strictly narration? BSW4 assumes **narration only**; if a live LLM still authors a rating, that is itself a contract breach to raise separately. **State the true advisory role before BSW-A merges.**
2. **Home-screen "Note by builder"** already exists (App.jsx:5641). The user asked to "bring back" home-screen content that is not actually gone. Confirm you want it **left as-is** (assumption) versus reworded.
3. **Feedback channel:** `feedback@takearoundabout.com` is live in three places (5225, 9669). Keep the mailto, or switch to the LinkedIn DM channel used on the home note (App.jsx:5657)? Assumption: **keep the mailto**.
4. **Provider names in the static attribution** (BSW4): name the actual narration provider(s), or keep it generic ("AI is used for narration only")? Assumption: **generic**, to avoid stating a provider the code may not currently use.

---

## BSW8. Acceptance (testable, deterministic, in-repo fixtures)

Fixtures: `v3/Sample/` NHG + PSD postings; Metta uuid `2320493d...`.

**BSW-A:**
- A1. Open the result screen for the Metta uuid fixture, toggle **Methodology**: the panel names MCF, careers.gov.sg, SSOC/SSIC, ACRA, ESCO, and AIOE (Felten et al. 2021); it contains **no** string "assessed by an OpenAI model", "Claude", or "will vary between searches". (grep the rendered DOM.)
- A2. The "Where AI is used" clause states AI authors no number/ranking/verdict.
- A3. Legal panel retains the IMDA, EU AI Act, and ISCO-08 licensing paragraphs unchanged (diff shows only the two amended lines).
- A4. Determinism: rendering the same fixture twice yields byte-identical panel copy (no interpolated live values in the panels).

**BSW-B:**
- B1. Drive the loading flow for an NHG-fixture role. Assert: at `subStep=1` row 1 is active, rows 2-3 pending; at `subStep=2` with `loadingSkills.length>0` rows 1-2 done and row 3 active; at `subStep=3` all rows done. No row shows done ahead of its `step` gate.
- B2. Ticks are distinguishable without colour (glyph/ring/dot present in DOM); no red/green pairing carries meaning.
- B3. `SceneRotator`'s 4200ms interval does not alter any checklist row's state across a full 12s render (freeze `Date.now`, assert row state depends on `step` only).
- B4. Milestone string at 14672 no longer contains "rating each against current AI capability"; counts and `subStep` values are unchanged from baseline.
- B5. `aria-live="polite"` region announces each stage label as text (screen-reader assertion / role snapshot).

---

## BSW9. Non-inventive gates + audits

- **§6 hard gates that apply:** "no LLM authors a number/ranking/verdict" (BSW-A is precisely the enforcement of this on the copy layer); "withhold over fabricate" (BSW4 "Where a source is missing, the tool withholds"); "every claim mapped to a named source" (BSW-Grounded table).
- **D1-D8 static-prompt audit:** **required for BSW-A** - the Methodology/Legal copy is static text asserting how the system works; run the static-claim audit to confirm each sentence maps to a repo source before merge.
- **G1-G8 live-read audit:** **required for BSW-B** - the checklist reads live `subStep`/`skills`; confirm no live read surfaces an LLM-authored value and that ticks cannot outrun the deterministic milestones.

---

## BSW10. Pre-mortem (spec §9 shape)

| # | Failure mode | Likelihood | Guard |
|---|---|---|---|
| 1 | BSW-A copy re-imports v2's LLM-rating claim by habit, re-introducing the breach | Med | A1 greps for "OpenAI model"/"Claude"/"will vary between searches"; D1-D8 audit blocks merge |
| 2 | BSW-B checklist ticks a stage before the work is done (races `setInterval` or optimistic step) | Med | Rows derive from `step` only (BSW5); B1/B3 assert no early tick with frozen clock |
| 3 | Q1 unresolved - if a live LLM still authors a rating, BSW4 copy becomes the false statement instead of fixing one | Low-Med | Q1 is marked BLOCKING for BSW-A wording; do not merge BSW-A until the true advisory role is stated |
| 4 | Colour-only tick states slip in (red done / green pending) | Low | BSW5 mandates glyph+ring+dot; B2 asserts shape-not-hue |
| 5 | Demoting `SceneRotator` removes the entertaining wait the user also enjoys, over-correcting | Low | Scenes are retained, only retitled illustrative (BSW3); no scene deleted |
| 6 | Milestone re-word at 14672 accidentally changes the `escoSource`/count interpolation | Low | B4 asserts counts + subStep unchanged; change is string-literal only |

---

**STATUS: READY_FOR_BUILD** (BSW-A gated on BSW7-Q1 wording confirmation; BSW-B ready on stated assumptions).
**Next agent:** `result-engine-builder`.
