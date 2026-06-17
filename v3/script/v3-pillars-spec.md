(№ 1 - 17-06 '26 (session-local, see note) SGT)

# SG Career View v3 - Pillars arc spec ("five questions, one header; the navigation becomes the question each pillar answers")

> **Target repo path:** `v3/script/v3-pillars-spec.md` (build docs live in `v3/script/`).
> **Status:** READY_FOR_BUILD (PL1 onward). **Proposed version:** flat patch line `v3.0.<N>`, one G1 gate per PR (Rule V-1); never roll minor until `v3.0.999` (result-engine-spec §11 AU-7).
> **Contract alignment:** the locked v3 contract governs every line (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`): deterministic = control; LLM = advisory narration only; non-inventive; faithful fidelity; `[UNVERIFIED]`/withhold over a guess. The frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec. R-FREEZE runs before every PR.
> **Reader priority:** (1) Claude Code, (2) Human Lead.
> **Serial note (Rule S-4):** `doc/.serial-state.yml` is absent in this tree; the serial above is session-local and MUST be reconciled to the live counter before the first PR lands. Flagged to the Human Lead.

---

## PL0. Purpose and the one-line thesis

The result page is navigated today by an abstract journey metaphor: `JourneySpine` (`_JOURNEY_STATIONS`, `App.jsx:6374`, rendered inside the side "Navigation" box at `App.jsx:12162`) walks five O-I-A stations (Understand / Position / Become / Arm / Rehearse). The Human-Lead directive replaces the metaphor with **five top-level pillar buttons in the header**, each of which **leads with its plain-language question and then answers it in sections**. The navigation now *communicates the question each view answers*.

**Thesis:** this arc moves and groups EXISTING surfaces under five questions; it removes three paused/decided-against flows; and it adds exactly ONE net-new advisory narration (Understand §1, "why the organisation wants this role"). No engine number is authored, moved, or re-computed. Every relocated panel keeps its component, its Prov chips, its determinism and its footer verbatim. This is presentation re-architecture, not a result change.

**The five pillars and their lead questions (directive, fixed copy):**

| Pillar | Lead question (rendered first, plain language) |
|---|---|
| Understand | "What is this role and why does it exist?" |
| Position | "Where does this role sit in the market?" |
| Become | "What is the craft to own, and what stays human?" |
| AI Readiness | "Which parts of my job is AI taking, helping, or leaving to me - and what do I do about each?" |
| Arm | "What are the real tasks, and how do I prepare?" |

---

## PL1. FROZEN surfaces (do not touch)

Inherited verbatim from `v3-result-engine-spec.md` §1 and the stewardship-spec SS1. **Radicality: FROZEN.** A change here is a Rule-violation stop (CLAUDE-FULL §11).

- The role search box + first-run help (`searchOccupations`, `detectFunctionKeyword`, `SENIOR_MGMT_LOOKUP`, `FUNCTION_KEYWORDS`/`FUNCTION_SUGGESTIONS`).
- Search -> occupation resolution (`getEscoSkills`, `/api/esco`, `ISCO_COHERENCE_MAP`/`checkIscoCoherence`, the narrowed AU-7 `resolveOccupationByOverlap`).
- Browse SG jobs card + `/api/mcf` browse path; the "< 4 yrs" scout.
- Skill extraction for the searched role (`getSkills`, `getSkillsFromPosting`).
- `/api/claude` proxy (`claude.js`) - narration-only, untouched.
- `engine-data/*.js`, `engine-core.computeEngine`, `api/engine.js`, `api/anatomy.js`, `api/esco.js` - no number moves in this arc.

**Engine and result content are FROZEN this arc.** Pillars only re-route, re-group and remove; they author no number and recompute nothing.

R-FREEZE assertion list is extended (PL-R012, proposed below) to add the moved components' render call-sites to the freeze-diff so a relocation cannot silently mutate a panel's internals.

---

## PL2. What is relocated vs removed vs net-new (the ledger)

Grounded in the live tree (real symbols, line anchors at time of authoring). "Move" = re-parent the existing component under a new pillar with NO internal edit; "Remove" = delete the tab + render branch + dead-code the component per G2; "New" = net-new code.

### Relocate (move, no internal edit)

| Component (symbol) | Today | -> Pillar | Note |
|---|---|---|---|
| Role Graph SVG tree (`RoleGraphPanel` graph half, `App.jsx:8840`; `buildRoleGraph`, `narrateRoleGraph`; `RoleGraph.jsx` `?view=graph`) | tab `rolegraph` "🕸 Role Graph", under Position-era nav | **Understand §2** | the responsibilities -> role -> ISCO -> ESCO tree. CRITICAL: the CV paste-fit flow is embedded INSIDE this component (PL3, must be excised first) |
| `ForensicReversal` (`App.jsx:4589`) | `deepread` cluster | **Understand §1** | "why this role exists" - feeds Understand §1 |
| Role Context (`RoleContextPanel`, `App.jsx:7842`; tab `context`) | tab `context` "🏢 Role Context" | **Position** | directive |
| Career Progression (`ProgressionPanel`, `App.jsx:8280`; tab `progression`) | tab `progression` | **Position** | directive |
| Role Crossover (`CrossoverPanel`, `App.jsx:8385`; tab `crossover`) | tab `crossover` | **Position** | directive |
| Steward's Praxis (`StewardsPraxis`, `App.jsx:4845`) | `deepread` cluster | **Become** | the craft to own |
| `StewardshipShift` (`App.jsx:5120`, "Where you sit") | `deepread` cluster | **Become** | what stays human |
| `StrategyRead` (`App.jsx:4724`), `BdfStewardship` (`App.jsx:5033`) | `deepread` cluster | **Become** | stewardship reads |
| `AgenticShift` (`App.jsx:4936`), `SkillGroupedView` (`App.jsx:6839`) + `SkillSegments` (`App.jsx:4442`) + `ExposureBar` + per-skill Skill Analysis (prompt + 3-step "What to do next") | `skills` tab + hero | **AI Readiness** | the 4 automation bands + segment overview + per-skill analysis |
| `TaskPrep` (`App.jsx`, tab `taskprep`) | tab `taskprep` "🎯 Task Prep" | **Arm** | directive |
| Compare queue (`ComparisonPanel`; tab `compare`; queue state) | tab `compare` | **Position (utility)** - RECOMMENDATION | see PL6 |
| MyCareersFuture Jobs (`McfJobsPanel`; tab `mcf_jobs`) | tab `mcf_jobs` | **Position (utility)** - RECOMMENDATION | see PL6 |

Components that today share the `deepread` cluster but are read-of-employer/market (`DemandProof` `App.jsx:5245`, `AdLanguageScan` `App.jsx:5489`, `EmployerReality` `App.jsx:5700`, `CompanyBackground` `App.jsx:5803`) are NOT named in the directive. **Recommendation (PL6):** these belong under Position ("where the role sits in the market" includes is-the-demand-real and is-the-employer-real). Flagged for Human-Lead confirmation; default placement = Position.

### Remove (delete tab + branch; dead-code component per G2)

| Flow | Symbols | Why |
|---|---|---|
| Rehearse / Interview Rehearsal (journey step 5) | `Rehearsal` (`App.jsx:6179`); tab `rehearse` "🎤 Interview Prep" (`App.jsx:11549`, `:12420`); `SYSTEM_REHEARSE` | directive removal |
| CV analysis = paste-CV "fit" flow | the CV half of `RoleGraphPanel`: `cvText`/`runCv`/`showCvProfile` state (`App.jsx:8847-8891`), `ingestCV` (`App.jsx:2519`), `scoreCVFit` (`:2396`), `scoreTrueFit` (`:2423`), `fairnessAudit` (`:2471`), `CandidateBrief` (`:5567`), `EmployerFairScorecard` (`:5606`), the CV render block (`:9281-9282`) | directive removal |
| Cover Letter Workbench | `CoverLetter` (`App.jsx:6288`); tab `coverletter` "✉️ Cover Letter" (`:11550`, `:12423`) | directive removal |
| Resume Check (paused) | `ResumeCheckPanel` (`App.jsx:9345`); tab `resume` `paused:true` (`:11562`, `:12533`) | directive removal of the paused flow |

### Net-new (must stay non-inventive)

| New surface | Pillar | Honesty tag |
|---|---|---|
| Five header `PillarBar` buttons + `_PILLARS` model + lead-question header per view | header | pure UI, no number, no Prov |
| Understand §1 "why the organisation wants this role" narration | Understand | `~ AI estimate` - see PL5 |

---

## PL3. Radicality / blast-radius map

| Surface / module | Band | Justification |
|---|---|---|
| Frozen door (PL1) | **FROZEN** | nothing changes; R-FREEZE guards |
| Engine, engine-data, anatomy, esco | **FROZEN** | no number authored/moved/recomputed this arc |
| Navigation model: `JourneySpine`/`_JOURNEY_STATIONS` -> header `PillarBar`/`_PILLARS` | **REWIRE** | the nav primitive is replaced; tab keys are re-grouped under pillars, but every leaf component is untouched |
| `RoleGraphPanel` split (excise CV-fit half from graph half) | **REWIRE** | one component carries two concerns; the directive moves one and removes the other, forcing a clean split |
| Relocate Deep-Read / Position / Skills / Task panels under pillars | **ADDITIVE** (re-parent) | components rendered under a new grouping; zero internal edit |
| Remove Rehearse / CV-fit / Cover Letter / Resume Check | **RADICAL-REPLACE (subtractive)** | four user-facing flows deleted; a visible removal, reviewer-diffed |
| Understand §1 narration | **NEW (ADDITIVE)** | one net-new advisory narration, governed |

**Reading:** 2 REWIRE (nav primitive, RoleGraphPanel split), 1 subtractive RADICAL-REPLACE (the four removals), the rest ADDITIVE/NEW. No architecture rewrite, no data-source replacement -> per CLAUDE-FULL §6.2 a **MINOR** arc realised on the flat patch line. The radical is concentrated in nav + removals and contained.

---

## PL4. PR sequence (ordered, each PR-sized)

Build the foundation (split the coupled component, then the nav primitive) before re-parenting, so no PR leaves the page in a half-routed state. Each PR ships as one PR: G1 flat-patch bump + HDR journal entry + R003 three-site bump + live verify on v3.takearoundabout.com.

| PR | Title | Band | Files | Grounded in | Accept |
|---|---|---|---|---|---|
| **PL1** | Excise the CV-fit flow from RoleGraphPanel | REWIRE + subtractive | `App.jsx` | directive removal §3 | `RoleGraphPanel` renders ONLY the graph tree; `cvText`/`runCv`/`ingestCV`/`scoreCVFit`/`scoreTrueFit`/`fairnessAudit`/`CandidateBrief`/`EmployerFairScorecard` removed or dead-coded (G2); graph snapshot byte-identical on NHG/PSD/Metta; no orphan import |
| **PL2** | Remove Rehearse, Cover Letter, Resume Check | subtractive RADICAL-REPLACE | `App.jsx` | directive removal §3 | tabs `rehearse`/`coverletter`/`resume` and their render branches gone; `Rehearsal`/`CoverLetter`/`ResumeCheckPanel` + `SYSTEM_REHEARSE` dead-coded (G2); `buildTabs` no longer emits them; no dangling `setActiveTab("rehearse"...)` |
| **PL3** | `PillarBar` header nav primitive (replaces `JourneySpine`) | REWIRE | `App.jsx` | directive §1; CLAUDE-FULL §7 a11y | five header buttons from `_PILLARS`; `JourneySpine`/`_JOURNEY_STATIONS` removed from the Navigation box; active pillar by shape+number+label+text (`aria-current="page"`), 44px, keyboard-focusable, no colour-only state; clicking a pillar selects its view |
| **PL4** | Pillar VIEW shell + lead-question header | ADDITIVE | `App.jsx` | directive §4 | each pillar view renders its plain question first (fixed copy, PL0 table), then its sections; tab keys re-grouped to pillars via a `_PILLAR_MAP`; default pillar = Understand |
| **PL5** | Understand: §1 "why the org wants this role" + §2 Role-Graph tree | ADDITIVE (move) + NEW (narration) | `App.jsx`, `RoleGraph.jsx` | goal 7 (`ForensicReversal`); Role Context; NEW `SYSTEM_WHY_ROLE` | §1 = "why the organisation wants this role" (Role Context business-need + `ForensicReversal` "why this role exists") + the net-new narration (PL5 detail); §2 = the Role-Graph tree relocated from Position; both render under Understand; D1-D8 on `SYSTEM_WHY_ROLE` 8/8 PASS |
| **PL6** | Position: Progression + Crossover + Role Context (+ market/utility) | ADDITIVE (move) | `App.jsx` | directive §2 | Progression, Crossover, Role Context render under Position; Role-Graph NO LONGER here; market reads (DemandProof/AdLanguageScan/EmployerReality/CompanyBackground) + Compare + MCF Jobs placed per PL6 recommendation (Human-Lead confirm) |
| **PL7** | Become: the stewardship reads | ADDITIVE (move) | `App.jsx` | goal 1/3/5; paper SS3-SS4 | `StrategyRead`, `BdfStewardship`, `StewardsPraxis`, `StewardshipShift` render under Become; lead question shown first |
| **PL8** | AI Readiness: own pillar | ADDITIVE (move) | `App.jsx` | the existing 4-band rubric (RB1) | `AgenticShift` + 4-band `SkillGroupedView`/`SkillSegments` + per-skill Skill Analysis (AI prompt + 3-step) render under AI Readiness with its lead question; bands unchanged (Full Automation / AI-Augmented / AI-Assisted / Human-Led) |
| **PL9** | Arm: Task Prep | ADDITIVE (move) | `App.jsx` | the extracted duties (responsibilitiesData) | `TaskPrep` renders under Arm with its lead question; no internal edit |

> **Sequencing rationale.** PL1 unblocks the Role-Graph relocation by separating the two concerns coupled in `RoleGraphPanel`; PL2 clears the removed flows before the nav is rebuilt so no pillar can route to a deleted tab; PL3-PL4 stand up the new nav + view shell; PL5-PL9 re-parent the leaves pillar by pillar (each independently shippable and verifiable). PL5 carries the only net-new narration and so carries the D1-D8 audit.

---

## PL5. Understand §1 - the only net-new narration (governance detail)

Understand §1 answers "why the organisation wants this role - the business need it fills". Sources, in priority:

1. **Deterministic / existing first.** Surface Role Context's business-need read and `ForensicReversal`'s crux-anomaly line (`◐ derived`, already governed) as the spine of §1. These are existing, reproducible reads - prefer them.
2. **Net-new narration `SYSTEM_WHY_ROLE` (`~ AI estimate`).** A NEW JSON-only prompt that explains, in plain language, the organisational need the role fills - grounded ONLY in the role's own duty statements and Role Context already in `result`. It authors NO number, NO ranking, NO verdict. Output is a short narration array; every claim must reference a real duty/context phrase or be dropped client-side (the `ForensicReversal`/`SYSTEM_FR` guard pattern: drop any sentence whose key noun is not a substring of the supplied context). Digit-strip the output. Withhold under 3 duty statements. Cache key carries a `why1` version tag (bump on prompt change, D8).

This is the arc's only new prompt template, so D1-D8 (static prompt-syntax governance) MUST run and pass 8/8 before PL5 ships. The narration is tagged `~ AI estimate` end to end and carries the "AI-assisted; human decides" footer with Source/Confidence/Time-window.

---

## PL6. Compare queue, MCF Jobs, and the market reads (recommendation, Human-Lead confirm)

The directive says KEEP Compare and MCF Jobs and asks where they live. It also leaves four market/employer reads (`DemandProof`, `AdLanguageScan`, `EmployerReality`, `CompanyBackground`) unassigned by pillar.

**Recommendation:**
- **Compare queue** and **MyCareersFuture Jobs** -> a **Position utility area** (a sub-section within Position, since "where the role sits in the market" is exactly comparison + live demand). Compare is cross-role and queue-driven; render it as a utility strip in Position rather than its own pillar, so the five-pillar header stays clean.
- **Market/employer reads** (`DemandProof`, `AdLanguageScan`, `EmployerReality`, `CompanyBackground`) -> **Position** (is-the-demand-real, is-the-employer-real, is-the-ad-fair are market-placement questions, not craft questions).

**Conflict flag:** if the Human Lead prefers Compare/MCF Jobs as a separate utility area *outside* the five pillars (e.g. a persistent toolbar), that is a sixth surface and changes PL6; ask once. Default proceeds with Position-utility placement.

---

## PL7. Non-inventive conformance (the control layer)

Hard gates (block merge) - inherited from `v3-result-engine-spec.md` §6:
1. No LLM string parsed into a number anywhere on the result page.
2. Every figure renders with a Prov chip (`✓ computed` / `~ AI estimate` / `● from MCF` / `◐ derived`).
3. `[UNVERIFIED]`/withhold where a data link is unverifiable - never a fabricated value.
4. Crosswalk ambiguity shown as a range, never a fake point.
5. Determinism: same posting -> identical engine output (snapshot test).

Per-PR instruments:
- **D1-D8 (static prompt-syntax governance):** REQUIRED on **PL5 only** (the one new prompt, `SYSTEM_WHY_ROLE`). Confirms it cannot author a number, has a JSON-only contract, carries no invention licence, and that every claim must come FROM the supplied duty/context text. PL1-PL4, PL6-PL9 touch no prompt -> D1-D8 not triggered.
- **G1-G8 (live read governance):** REQUIRED on every PR that changes the rendered page (all of PL1-PL9). Confirms `Output = ƒ(Prompt, Context, Control)` holds end to end after the re-route: engine still authors the number, the moved panel still carries its Prov chip, withhold-on-unverifiable still fires, engine-wins on disagreement.
- Removal PRs (PL1, PL2) additionally assert: no orphaned reference to a removed symbol; no `setActiveTab` to a deleted key; R005 globals list intact.

---

## PL8. Accessibility and honesty contract (CLAUDE-FULL §7)

- **No red/green anywhere.** Pillar state encoded by shape + number + label + text, never colour alone (carry the `JourneySpine` "- you are here" + `aria-current` discipline forward to `PillarBar`, now `aria-current="page"`).
- **44px touch targets** on every pillar button and every section toggle; `aria-label` on every SVG (Role-Graph inherits its existing labels); keyboard-focusable buttons.
- Each pillar view leads with its **plain-language question** (PL0 fixed copy) before any section.
- Every panel keeps its existing footer: **"AI-assisted; human decides"** + `Source · Confidence · Time-window`. The relocated panels keep their footers verbatim; the only new footer is on Understand §1's `SYSTEM_WHY_ROLE` narration.
- The Leap footer line is untouched.

---

## PL9. Test fixtures and verification

Use the in-repo golden inputs - do not invent test data:
- `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+ PDF) - NHG Asst Director.
- `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+ PDF) - PSD Senior Mgr / AD.
- Metta Welfare Transformation Manager, uuid `2320493d0e875075d4dbfa6a893b3fdb` (default Leap posting).

Per PR:
- **PL1:** Role-Graph SVG snapshot byte-identical to `main` on all three fixtures after the CV-fit excision (the graph half must not move); assert no `ingestCV`/`scoreCVFit` reference survives.
- **PL2:** `buildTabs` on each fixture emits no `rehearse`/`coverletter`/`resume` key; deep-link `?tab=rehearse` falls back to default safely.
- **PL3-PL4:** all five pillars render on each fixture; `aria-current="page"` on exactly one; each view leads with its question; keyboard tab-order reaches every pillar.
- **PL5-PL9:** every relocated panel renders under its new pillar on all three fixtures with its Prov chips intact; `SYSTEM_WHY_ROLE` (PL5) renders on all three with every claim traceable to a duty/context phrase, withheld under 3 duties.
- **Determinism:** assert no engine output changed across the arc (R-SNAPSHOT on `computeEngine` unchanged).

---

## PL10. Risks and pre-mortem (run R-PREMORTEM before PL1)

| Risk | Likelihood | Guard |
|---|---|---|
| Excising the CV-fit half (PL1) breaks the shared Role-Graph state and silently mutates the SVG tree | Med-High | snapshot the graph half on 3 fixtures BEFORE PL1; reviewer diff; the two concerns share only `result`/`title` props, so the split must keep the graph's `graphState`/`buildRoleGraph` path byte-identical |
| A removed symbol leaves an orphan reference (`setActiveTab("rehearse")`, an import, a `_JOURNEY_STATIONS` reader) -> runtime crash | Med | grep every removed key + symbol after PL1/PL2/PL3; R005 globals check; G2 dead-code rather than half-delete |
| Pillar re-grouping orphans a tab key that some deep-link or `track()` still emits | Med | `_PILLAR_MAP` must cover every surviving tab key; assert no `activeTab` value is unmapped; `?tab=` deep-link maps to a pillar or falls back |
| `SYSTEM_WHY_ROLE` (PL5) drifts into authoring a verdict/number, or invents a business need not in the duties | Med | D1-D8 8/8 before ship; JSON-only contract; client drops any sentence whose key noun is absent from the supplied context; digit-strip; `why1` cache tag; withhold under 3 duties |
| Removing CV-fit also removes the only home of `fairnessAudit`/`CandidateBrief`/STARs - a Human Lead may want them re-homed later | Low-Med | record the removal as a DECISION (not omission) in the HDR + register; the code is dead-coded, not erased, so it can be re-homed under a future pillar |
| Pillar state encoded by colour alone slips in | Low | CLAUDE-FULL §7 + a11y reviewer; shape+number+label+text mandated in PL3 accept |
| Frozen symbol drift during the large App.jsx edits | Low | PL-R012 freeze-guard (extended R-FREEZE) blocks packaging |
| em/en dash or non-ASCII in new JSX strings | Low | R007 + house grammar (hyphens only) |

---

## PL11. Proposed new R-rule (G3 gate)

**PL-R012 (propose):** *relocation_freeze_guard.* When a component is re-parented under a new nav grouping with "no internal edit", R-FREEZE must add that component's render output (or a snapshot of it on the golden fixtures) to the freeze-diff, so a "move" cannot silently mutate the panel. Trigger: any PR labelled "Move (no internal edit)". Action: snapshot-before, snapshot-after, assert identical. Source: this arc, PL2 ledger. Confirmation: Human-Lead G3.

---

## PL12. Version-bump gate

Per PR: surface `Rule V-1 / G1` to the Human Lead. On yes: bump flat patch in all three per R003 (`App.jsx` line 1 header, `index.html` title, `package.json` version), write the HDR journal entry, bump the serial counter (reconcile `.serial-state.yml` first per the PL0 note).

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.N | NNNkb | N,NNN lines
[INTENT] one line - which pillar / removal this PR delivers
[DELTA] one line per change
[RISK] Low/Med/High + reason
[STATUS] ALPHA/BETA/STABLE
[TEST] snapshot on NHG/PSD/Metta + live verify
[NEXT] one action for the Lead
[ADVICE] prompt technique + one-line reason
```

---

## PL13. Conflicts surfaced (for Human-Lead confirmation)

1. **Frozen door:** none. The five pillars, the relocations and the removals all sit DOWNSTREAM of the search/resolve/extract door. `RoleGraph.jsx` (`?view=graph`) and `LeapView.jsx` (`?view=leap`) routing in `main.jsx` is untouched (PL5 reads the existing graph; it does not change the route). No frozen-surface edit is required. If a future ask needs the header buttons to alter search behaviour, STOP - that crosses the door.
2. **Supersession:** this arc **supersedes** the Candidate Journey arc's `JourneySpine` (CJ4) and **removes** its Rehearse station (CJ3). Flagged so the supersession is a decision, not drift; `v3-candidate-journey-spec.md` should gain an AU-7 note pointing here once PL3/PL2 land.
3. **PL6 placement** of Compare / MCF Jobs / market reads - default = Position-utility; confirm or redirect.
4. **CV-fit removal scope** - the directive says remove the paste-CV fit flow; this also dead-codes `fairnessAudit`/`CandidateBrief`/`EmployerFairScorecard`/True-Fit (they live only inside the CV-fit path). Confirm these go with it, or call out any to re-home.

---

**STATUS: READY_FOR_BUILD. Next agent: `result-engine-builder`** (start at PL1; D1-D8 on PL5 via `conformance-auditor`; a11y via `a11y-honesty-reviewer`).

*End of spec. Confirm the PL6 placement and the CV-fit removal scope to proceed; PL1 needs no further input.*
