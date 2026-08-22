(№ 133 - 03-07 '26 12:20 SGT)
<!-- Serial N assumed = 133 (next after the behind-the-scenes spec's No 132). Human Lead to reconcile against the serial-state counter per R011. -->

# SG Career View v3 - Skill-level determinism: engine authors the per-skill AI level (`SLE` arc)

> **Target repo path:** `v3/script/v3-skill-level-engine-spec.md` (build docs live in `v3/script/`).
> **Proposed version:** one PR on the flat patch line - **SLE-A -> v3.0.186** (live line is v3.0.185; never roll the minor). **G1 gate:** this spec is the gate; build starts only when STATUS is READY_FOR_BUILD and the Human Lead clears the open questions in SLE7.
> **Sequencing (load-bearing):** this PR must land **before** the behind-the-scenes `BSW-A` footer copy PR. `BSW-A` rewrites the footer to claim "the engine, not an LLM, authors every number"; that claim is FALSE for the Skill Analysis tab until this PR lands. On merge, renumber BSW-A/BSW-B one patch up (v3.0.187/188) - flag to the Human Lead.
> **Status:** READY_FOR_BUILD with two product calls surfaced as open questions in SLE7 (both have a stated safe default, so build is not blocked).
> **Contract alignment:** locked v3 contract governs every line - deterministic = control; LLM = advisory only (no LLM authors a number, ranking, or **verdict**); non-inventive (every claim maps to a real source or is withheld); faithful fidelity (confidence carried, never rounded away). Frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead.

---

## SLE0. Finding that motivates the arc (read first, verified in source)

`rateSkills(title, skills)` (`v3/src/App.jsx:3707`) sends the skill list to Claude Haiku (`claudeCall`, `SYSTEM_RATE` at :3710-3730) and lets the **model author the per-skill automation LEVEL** - `l` = HIGH / MEDIUM / LOW / HUMAN (App.jsx:3714-3717). That level is a genuine **classification verdict**, not narration: it drives the Skill Analysis grouping, the colour band (`LEVELS`, App.jsx:4057-4062), the ordering ("Human-Led first, Full Automation last", App.jsx:8441), and the automation-breakdown counts (App.jsx:14716-14719). It is rendered as fact - **no `~ AI estimate` chip on the level itself**, unlike `how`/`kickstart` which already carry `<Prov kind="ai" />` (App.jsx:7625-7627).

This **contradicts the locked v3 contract** ("deterministic = control; LLM authors no number, ranking or verdict"). The engine already does the honest thing at occupation level: `engine-core.js` computes AIOE deterministically (SSOC -> ISCO -> SOC -> AIOE, `computeEngine`, engine-core.js:133) and its own header states the honest scope limit: *"Out of scope (honest): per-skill / per-duty exposure (needs a per-skill source)"* (engine-core.js:6-8). So the app today runs **two parallel exposure mechanisms**: one honest and deterministic at occupation level, one LLM-authored-but-presented-as-fact at skill level. This PR removes the second.

**Sibling functions (same defect, parked, not in scope):** `rateSkillsCompact` (App.jsx:4025) and `rateResponsibilities` (App.jsx:4679) author `l` the same way. This spec scopes only `rateSkills` (the Skill Analysis tab, the surface BSW-A's footer claim covers). The classifier below is built as a **shared, exported pure function** so the two siblings can adopt it in a follow-up arc without a second design. See SLE8.

---

## SLE1. Scope (one paragraph)

Make the per-skill automation **level** deterministic and non-inventive: a new pure `classifySkillLevel(skill, occExposure)` in `engine-data/` authors `level` from (1) hard HUMAN/office gates read as rules from the existing `SYSTEM_RATE` rubric, (2) ESCO signals the skill already carries (`reuseLevel`, `type`, `escoDescription`), and (3) the **occupation-level AIOE band** that `computeEngine` already produced, honestly disclosed as *"estimated from occupation-level exposure"* - never claimed as skill-specific AIOE precision the data cannot support. `rateSkills` is rewired: the LLM no longer decides `level`; it receives the engine-decided level and may only write advisory prose (`how`, `kickstart`) for it, each already chip-tagged `~ AI estimate`. The `tool` code (`a`) becomes an advisory hint, never presented as computed fact. No engine number changes; no new data source; no new route; the frozen door is untouched.

---

## SLE2. Radicality band

| Unit | Band | Justification |
|---|---|---|
| **The per-skill `level` verdict** | **RADICAL-REPLACE** | authorship moves from LLM to deterministic engine - same class of move as the headline swap (`v3-result-engine-spec.md` §3, "Result headline ... RADICAL-REPLACE"). It changes a core, widely-consumed function's fundamental behaviour. |
| `classifySkillLevel` module (new `engine-data/skill-level.js`) | **ADDITIVE** | new pure function; no existing symbol renamed. |
| `rateSkills` (App.jsx:3707) | **REWIRE** | keeps its name and call sites; the LLM call is narrowed to narration, level is overwritten by the engine at the merge. |
| `engine-core.computeEngine`, AIOE/SSOC/ISCO/SOC tables | **FROZEN** | read-only consumer; no number moves (R011 freeze-guard). |
| Search, resolve, browse, skill extraction, `/api/claude` | **FROZEN** | frozen door untouched. |

Overall arc band: **RADICAL-REPLACE** (concentrated on one verdict; the plumbing is additive/rewire around it).

---

## SLE3. The deterministic classifier - design (non-inventive)

New file `v3/engine-data/skill-level.js`, exporting a pure, network-free, side-effect-free `classifySkillLevel(skill, occExposure) -> { level, confidence, basis, toolHint }`. Same input => same output (assert R-SNAPSHOT). It mirrors the established ReviewStudio precedent: `rsLens` (ReviewStudio.jsx:72) is a deterministic keyword classifier and `buildDissection` (:80-88) inherits the engine band else falls to a leading-verb rule and **WITHHOLDS (null) when no signal exists** (:78-79, honesty contract). We reuse that exact posture.

**Input `occExposure`** = the `exposure` object from the already-computed `computeEngine` result for the searched role: `{ index (0-100), band ('high'|'moderate'|'low'), zRange, confidence }`. It is the honest anchor and the sole numeric prior. It is **occupation-level**; we never claim it is the skill's own AIOE.

**Rule order (first match wins; every rule cites its ground):**

1. **HUMAN gate (hard).** If the skill name or `escoDescription` matches the human-accountability ruleset - legal accountability / moral liability / physical presence / tactile / empathy / face-to-face / care - return `{ level:'HUMAN', toolHint:'NA', confidence:'high', basis:'human-gate' }`. This is the deterministic reading of the prompt's own HUMAN definition (App.jsx:3717) and its "Patient Empathy must be HUMAN + NA" example (:3728), plus the `rsLens` ORG/human verbs (ReviewStudio.jsx:75). Grounded in Felten/Autor task-based framing (physical/interpersonal tasks are low-exposure). Regex lives in the module, commented per rule; hyphens only (R007).
2. **Office-suite cap (hard).** If the skill matches Office / Excel / Word / PowerPoint / Spreadsheets / "Office Suite", the level is **capped at MEDIUM** (never HIGH). Deterministic reading of the existing "OFFICE SUITE RULE" (App.jsx:3726).
3. **Occupation-band prior (soft, disclosed).** Map the occupation AIOE band to a skill default: `high -> MEDIUM`, `moderate -> LOW`, `low -> LOW`. **Deliberately conservative**: the occupation band never promotes a skill to HIGH on its own (HIGH is a strong per-skill claim we lack per-skill evidence for). `basis:'occupation-band'`, `confidence:` inherits `occExposure.confidence` capped at **'moderate'** (never 'high' - the band is the occupation's, not the skill's).
4. **ESCO modifier (soft, disclosed crosswalk).** Adjust the prior by one step using signals the skill already carries: `reuseLevel === 'Transversal'` or `type === 'knowledge'` -> lean one step **more** automatable (LOW->MEDIUM, MEDIUM->HIGH only if the occupation band is `high`); `reuseLevel === 'Occupation-specific'` -> lean one step **less**. This is a documented **modeling crosswalk**, not a reading of a paper - label it as such in-code (precedent: the PW4 crosswalk comment, App.jsx:4064-4071). Skills with no ESCO fields (AI-generated fallback list) skip this step - no guess.
5. **Withhold fallback.** If no occupation exposure exists (`computeEngine` returned `ok:false`) AND the skill carries no ESCO signal, return `{ level:null, basis:'withheld', confidence:'withheld' }`. The render shows a neutral "not classified" state (mirror `SPAN_STYLE_WITHHELD`, ReviewStudio.jsx:38) - **never a fabricated band**.

**`toolHint` (`a`) - withhold-over-fabricate.** There is no deterministic source to pick a specific tool code (DOCS vs DATA vs VIDEO) per skill. So the engine does **not** author `a` as fact. Two honest options (SLE7 Q1): (default) the LLM proposes `toolHint` as advisory prose reacting to the engine level, rendered with the existing `~ AI estimate` chip; or withhold it entirely. The engine only sets `toolHint:'NA'` when the HUMAN gate fires (a=NA <-> HUMAN, the one place the mapping is deterministic per App.jsx:3727).

**Provenance for `level`:** the level is rule-derived, not a table lookup, so it is **not** `✓ computed`. It carries a new **`◐ estimated`** chip reading *"estimated from occupation-level exposure"* (the `◐ derived` vocabulary already exists, `v3-result-engine-spec.md` §2). `confidence` is carried through to the chip; `withheld` renders the neutral state. Faithful fidelity: we never upgrade a moderate-confidence estimate to a computed fact.

---

## SLE4. Change map (file-by-file, real symbols)

| File | Symbol | Action |
|---|---|---|
| `v3/engine-data/skill-level.js` | `classifySkillLevel`, `SKILL_HUMAN_RULES`, `OFFICE_RULE`, `BAND_TO_LEVEL`, `esco Modifier` | **Add** - new pure module, exported. Header block states scope + non-inventive contract (copy the engine-core.js:1-8 posture). |
| `v3/src/App.jsx` | `rateSkills` (:3707) | **Touch (REWIRE)** - accept `occExposure` as a 3rd arg; call `classifySkillLevel` per skill to author `level` + `toolHint` + `confidence` + `basis`; keep the Haiku call but move `level`/`a` out of its authority (narrow `SYSTEM_RATE` to: given each skill's decided level, write `h` and `k` only). LLM `l`/`a` are ignored if returned. |
| `v3/src/App.jsx` | analyse flow (:14684-14696) | **Touch** - pass the already-computed engine `exposure` into `rateSkills(occ.title, skills, exposure)`; at the merge (:14696) take `level` from the engine result, carry `confidence`/`basis`, and drop the LLM level entirely. Determinism: level no longer varies run-to-run. |
| `v3/src/App.jsx` | skill-row render (level chip near `LEVELS`, :4057-4062 / :8633) | **Touch** - add the `◐ estimated` provenance chip + confidence to the level; render the withheld neutral state when `level === null`. Colour-blind safe (blue/orange + icon + label, never red/green). |
| `engine-core.js`, `aioe.js`, `ssoc-isco.js`, `isco-soc.js`, `/api/engine.js` | all | **Freeze** - read-only; R011 byte-identical assertion. |
| `getSkills`, `getEscoSkills`, `getSkillsFromPosting`, `/api/esco`, search/resolve/browse, `/api/claude` | all | **Freeze** - frozen door. |

---

## SLE5. Grounded-in (source per claim)

| Claim | Ground |
|---|---|
| HUMAN gate rules | existing `SYSTEM_RATE` HUMAN definition + examples (App.jsx:3717, 3728), `rsLens` human/ORG verbs (ReviewStudio.jsx:75), Felten/Autor task-based exposure (physical/interpersonal = low). |
| Office-suite cap | existing "OFFICE SUITE RULE" (App.jsx:3726). |
| Occupation-band prior + numeric anchor | `computeEngine` AIOE band, Felten, Raj & Seamans "Occupational, Industry and Geographic Exposure to AI" (the engine's cited source, engine-core.js:2 / `provenance.js`). |
| a=NA <-> HUMAN determinism | existing prompt invariant (App.jsx:3727), preserved in `rateSkills` mapping (:3758). |
| ESCO `reuseLevel` / `type` values | `/api/esco.js:180-196` (Transversal / Cross-sector / Sector-specific / Occupation-specific; skill/competence vs knowledge). |
| Crosswalk-is-a-modeling-choice disclosure | precedent PW4 crosswalk comment (App.jsx:4064-4071). |
| Withhold-not-fabricate posture | `buildDissection` honesty contract (ReviewStudio.jsx:78-79); `SPAN_STYLE_WITHHELD` (:38). |
| `how`/`kickstart` stay LLM narration | already chip-tagged `<Prov kind="ai" />` in the climb view (App.jsx:7625-7627); narration/decision boundary of `v3-result-engine-spec.md` §2 (engine authors numbers, LLM narrates). |

**Non-inventive check:** every rule maps to a real repo source AND a cited paper/standard. No per-skill AIOE source exists, so no per-skill AIOE number is authored - the level is honestly labelled `◐ estimated`, confidence-capped, withheld when unsupported.

---

## SLE6. Acceptance (testable, in-repo fixtures; determinism asserted)

Fixtures: `v3/Sample/` NHG (Asst Director, Technology Strategic Planning) + PSD (Senior Mgr / AD, Job Redesign); Metta uuid `2320493d...`.

1. **Determinism (R-SNAPSHOT):** `classifySkillLevel(skill, occExposure)` returns byte-identical output across two runs for every skill on all three fixtures. Two full analyses of the NHG fixture produce an **identical** level vector (today it can vary - the LLM authored it).
2. **Engine-wins at the merge:** inject a stub `rateSkills` LLM response with a deliberately wrong `l`; assert the merged `level` equals `classifySkillLevel`'s output, not the LLM's.
3. **HUMAN gate:** a skill containing "patient empathy" / "physical" / "face-to-face care" -> `level:'HUMAN'`, `toolHint:'NA'`, `confidence:'high'`.
4. **Office cap:** a "Microsoft Excel" skill never returns HIGH.
5. **Withhold:** with `computeEngine` `ok:false` and an ESCO-less skill, `level === null` and the row renders the neutral "not classified" state - no colour band, no fabricated level.
6. **Provenance + a11y:** every classified level shows the `◐ estimated` chip + confidence; no `✓ computed` on a level; palette blue/orange + icon + label only (no red/green); 44px touch targets intact.
7. **Frozen (R-FREEZE):** `engine-core.js`, AIOE/SSOC/ISCO/SOC tables, `/api/engine.js`, `getSkills`, `getEscoSkills`, `/api/esco`, `/api/claude` byte-identical to `main`.
8. **Live verify** (desktop + mobile): Skill Analysis tab renders, level ordering intact, automation-breakdown counts populate, no console error, spinner unaffected.

---

## SLE7. Non-inventive gates + open questions

**Hard gates that apply** (`v3-result-engine-spec.md` §6): (a) no LLM string parsed into a level/number; (b) withhold-over-fabricate; (c) confidence carried, never rounded to a false "computed"; (d) R011 freeze-guard before packaging. **Audits:** D1-D8 static-prompt audit is **required** (this PR rewrites `SYSTEM_RATE` - confirm the LLM can no longer author `l`/`a`); G1-G8 live-read audit **required** on the three fixtures.

**Open questions (product calls for the Human Lead - safe default stated, build not blocked):**
- **Q1 - the `tool` code (`a`).** Default: keep it as an LLM advisory hint tagged `~ AI estimate` (never fact). Alternative: withhold it entirely for a cleaner honesty line. *Recommend the default* (it is already chip-tagged in one view; withholding loses a useful nudge). Human Lead decides.
- **Q2 - narrative richness of `how`/`kickstart`.** These stay LLM narration reacting to the engine-decided level. If the Lead judges the loss of the model's free-hand level-reasoning in `how` an unacceptable UX regression, the fallback is to also make `how` template-derived per level (less rich, fully deterministic). *Recommend keeping LLM narration* - it is advisory prose about a decided verdict, the exact boundary the contract permits.

---

## SLE8. Parked follow-ups (not this PR)

- `rateSkillsCompact` (App.jsx:4025) and `rateResponsibilities` (App.jsx:4679) still let the LLM author `l`. They should adopt `classifySkillLevel` in a follow-up SLE-B/SLE-C once this module is proven. Flagged so the honesty claim is not overstated: after SLE-A, the **Skill Analysis** tab is deterministic; the compact and responsibilities paths are not yet.

---

## SLE9. Pre-mortem

| Risk | Likelihood | Guard |
|---|---|---|
| Occupation-band prior flattens genuine per-skill variation (every skill in a "high" role reads MEDIUM) | Med-High | ESCO modifier (SLE3 step 4) + HUMAN gate reintroduce spread; label `◐ estimated` so no false precision is claimed; validate spread on the 3 fixtures before merge. |
| HUMAN-gate regex over-fires and mislabels a technical skill as HUMAN | Med | gate is name+description match with a tight verb set; unit-test the false-positive list; withhold beats mislabel - a missed HUMAN falls through to the conservative prior, never to HIGH. |
| Losing LLM level-reasoning makes `how`/`kickstart` feel generic | Med | Q2 fallback; keep LLM narration reacting to the decided level so prose stays specific. |
| A frozen engine symbol drifts during the rewire | Low | R011 R-FREEZE blocks packaging. |
| Chat compaction drops the new module import during a long build | Med | R005 grep list (`classifySkillLevel` present + imported) before packaging. |
| BSW-A ships first and the footer claim goes live while skill levels are still LLM-authored | Med | sequencing note at the head of this spec; Human Lead holds BSW-A until SLE-A merges. |

---

## SLE10. Version-bump gate

On merge: surface `Rule V-1 / G1` to the Human Lead. On yes, bump in all three per R003 (`App.jsx` line-1 header, `index.html` title, `package.json`), write the HDR journal entry, bump the serial-state counter. Flat patch line: **v3.0.186** (do not roll the minor).

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.186 | NNNkb | N,NNN lines
[INTENT] make the per-skill AI level deterministic (engine authors the verdict; LLM narrates only)
[DELTA] add engine-data/skill-level.js classifySkillLevel; rewire rateSkills + merge; ◐ estimated chip
[RISK] Med - RADICAL-REPLACE of a core verdict; guarded by snapshot + engine-wins test + R-FREEZE
[STATUS] BETA
[TEST] snapshot on NHG/PSD/Metta + live verify desktop+mobile
[NEXT] Human Lead: clear Q1/Q2, then unblock BSW-A footer claim
[ADVICE] rule-order-first-match - cite each rule's source in-code; withhold beats fabricate
```

---

**STATUS: READY_FOR_BUILD** (SLE-A). Next agent: **`result-engine-builder`**. Confirm Q1/Q2 and the v3.0.186 bump to proceed.
