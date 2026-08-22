# SG Career View v3 - Agentic Capability Ladder spec ("from do-the-task to orchestrate")

> **Serial:** (№ 1 - 18-06 '26 14:20 SGT)
> **Target repo path:** `v3/script/v3-agentic-ladder-spec.md`
> **Proposed version:** **v3.0.83** (flat-patch line per the §11 AU-7; live is v3.0.82). Bump is a **G1 / Rule V-1 gate** - do not bump without Human Lead sign-off.
> **Status:** see foot of file.
> **Contract alignment:** governed by the v3 locked contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`), `v3-result-engine-spec.md` (§1 frozen door, §6 gates, §7 a11y), and `doc/CLAUDE-FULL.md` (R001-R010, gates G1-G4). Deterministic = control; LLM = advisory only; non-inventive; faithful fidelity.
> **Reader priority:** (1) Claude Code (`result-engine-builder`), (2) Human Lead.

---

## §A. Scope

One slice. **Extend the existing TaskPrep "Arm"-pillar panel so each extracted duty carries an Agentic Ladder rung and one concrete climb step.** For every responsibility in `result.responsibilitiesData.responsibilities`, place it on a four-rung capability ladder (Skill -> Recipe -> Agent -> Orchestrator) derived deterministically from the duty's existing audited AI `level`, and surface the single move that climbs the user one rung, reusing the duty's existing `kickstart` / `how` prose. No new panel, no new engine field, no new number. This reframes the EXISTING analysis for the agentic era; it makes no new claim.

The four rungs (Human-Lead framing, locked as `LADDER` const):

| Rung | Meaning |
|---|---|
| **Skill** | an atomic capability you personally do |
| **Recipe** | a repeatable workflow chaining skills + tools that you author |
| **Agent** | an autonomous executor of a recipe that you specify and supervise |
| **Orchestrator** | coordinates multiple agents toward an outcome |

The arc the user reads: *do the task -> author the recipe -> supervise the agent -> orchestrate.*

---

## §B. Radicality band

**ADDITIVE (presentation).** One new const table + one extended render inside `TaskCard`. No engine call, no new LLM call (see §E), no number authored, no frozen surface touched. The rung is a pure relabelling of the existing per-duty `level`; the climb step is existing `kickstart`/`how` prose re-pointed. Sits squarely in the `v3-result-engine-spec.md` §3 ADDITIVE band and `v3-stewardship-spec.md` SS2 ("ADDITIVE ... no reflow of existing panels"). Records as a new row in `v3-stewardship-spec.md` SS3 (`AL1`), aligned to goal protocol 3 (Stewardship shift) and RB1's agentic-frontier rubric, which already added the AGENT handover concept to all three raters.

---

## §C. Change map (file by file - real symbols only)

### `v3/src/App.jsx` - ADDITIVE

- **Add** `const LADDER` (module-level, greppable per R005) - the four rungs in climb order, each `{ key, label, blurb, step }`, ASCII only (R007). `key` in `["skill","recipe","agent","orchestrator"]`; `step` is the rung-generic verb ("Do it", "Author the recipe", "Supervise the agent", "Orchestrate") used only when no duty prose exists (see §E withhold).
- **Add** `const LEVEL_TO_RUNG` - the fixed mapping table (§D) from the existing `LEVELS` keys to a `{ today, climbTo }` rung pair. Pure data, no function logic minted here.
- **Add** `function rungForDuty(r)` - pure function: reads `r.level`; returns `{ today, climbTo }` from `LEVEL_TO_RUNG`, or `null` when `r.level` is absent / not a known `LEVELS` key (withhold, never guess). No `freq`/`cat` input in v1 (kept simple; the table is `level`-only - see §D note).
- **Add** `function LadderRow({ r })` - renders the rung chip + the one climb step inside the `TaskCard` detail panel. Reuses `Prov` and the `LEVELS`/shape vocabulary; no new colour ramp (§F).
- **Touch** `function TaskCard({ r, skillByN })` (App.jsx ~6492) - inside the existing `open` detail `<div>` (after the "Skills it draws on" line, ~6541), render `<LadderRow r={r} />` when `rungForDuty(r)` is non-null. The summary row, the `<Tag level=...>` chip, the `how`/`kickstart`/`sk` lines are all **untouched**.
- **Touch** `function TaskPrep({ result })` header copy (~6604) - add one sentence introducing the ladder ("Each duty also shows where it sits on the agentic ladder today and the one move to climb a rung") and keep the existing `~ AI estimate` / `◐ derived` chips. No new chip kind.
- **Bump** version in all three loci per R003 (`App.jsx` line 1 header, `index.html` title, `package.json`) - G1 gate only.

**Freeze (do not touch):** `_TASKPREP_FREQ_ORDER`, `_TASKPREP_FREQ_NOTE`, `BandSection`, `TaskPrep`'s grouping/withhold logic, `LEVELS`, `Tag`, `PWAI_LENS`, `_PILLAR_MAP`, all engine/api files, all §1 frozen-door symbols.

### Extend-vs-new decision (justified)

**EXTEND `TaskCard`; do NOT add a sibling panel.** The ladder is a per-duty reframing of the same `level` the `<Tag>` already shows on the same card; a parallel panel would re-render the same duty list, duplicate the withhold logic, and split the "Arm" pillar's narrative. The Human-Lead direction asks each responsibility to "show where it sits TODAY and the next move" - that is one extra detail line per existing card, not a new surface. This mirrors the locked AU-7 pattern (C2/T3/D4/F5 all chose inline reuse over new modules for ephemeral, display-only reads).

---

## §D. The rung rule table (deterministic, fixed, no number minted)

The current rung is a **pure function of the duty's existing audited `level`** (one of the four `LEVELS` keys, set by the SYSTEM_RATE / RB1-rebaselined rubric). Mapping rationale: the higher the AI-exposure of a duty, the more of it an agent can already execute, so the human's centre of gravity (and thus the *climb* target) moves up the ladder; a human-anchored duty stays a Skill the human personally owns.

| `r.level` (existing) | `LEVELS.label` | Rung TODAY (`today`) | Climb-to (`climbTo`) | Why |
|---|---|---|---|---|
| `HUMAN` | Human-Led | **Skill** | **Recipe** | Duty is yours to do; first agentic move is to make the workflow repeatable and authored. |
| `LOW` | AI-Assisted | **Recipe** | **Agent** | AI already assists steps; codify them into a recipe you can hand to an agent. |
| `MEDIUM` | AI-Augmented | **Agent** | **Orchestrator** | An agent can execute the recipe under supervision; your move is to supervise then coordinate several. |
| `HIGH` | Full Automation | **Orchestrator** | **Orchestrator** (top) | Already agent-automatable end to end; the only human rung left is orchestration / outcome governance. Top of ladder -> `climbTo === today` and the step is "Govern the outcome". |
| absent / unknown key | - | **(withheld)** | **(withheld)** | No rung shown - "unscoped" micro-label, never a guessed rung (§E withhold). |

Notes:
- The mapping is one-to-one on `level`; `freq`/`cat` are **not** inputs in v1 (kept deterministic and trivially auditable). If a later slice wants freq to nudge the climb step, that is a new spec row, not this one.
- This is a CROSSWALK (a modelling choice from existing levels to ladder positions), exactly the idiom of `PWAI_LENS` and the w34854 crosswalk. It is documented here and in an in-file comment. It mints **no new number**: the rung is a label, traceable to `r.level`.
- The `HIGH -> Orchestrator (top)` self-edge is deliberate: faithful fidelity forbids inventing a fifth rung; when a duty is already fully automatable the honest message is "govern the outcome", not "climb higher".

---

## §E. Where (if anywhere) the LLM sits

**No new LLM call. Prefer NO new prompt.** The climb step reuses existing fields by precedence:

1. If `r.kickstart` exists -> use it as the climb step ("This week: <kickstart>"), tagged `~ AI estimate` (it already is LLM-authored advisory prose; the existing TaskCard already tags it so).
2. Else if `r.how` exists -> use it to frame the move, tagged `~ AI estimate`.
3. Else -> fall back to the rung-generic `LADDER[climbTo].step` (deterministic verb: "Author the recipe" / "Supervise the agent" / "Orchestrate" / "Govern the outcome"), which carries NO prov chip because it is a fixed UI string, not a claim.

The LLM authors **no rung, no number, no ranking** - the rung is `LEVEL_TO_RUNG[r.level]`, fully deterministic. Any reused `kickstart`/`how` prose stays advisory, engine-wins on any disagreement (there is no number to disagree on). Because **no new prompt template is introduced**, the **D1-D8 static audit is N/A for this slice** (state this explicitly in the HDR). If a future slice adds a `SYSTEM_LADDER` prompt to author bespoke climb steps, D1-D8 becomes mandatory then.

---

## §F. Render plan (how rung + climb attach to TaskCard)

Inside the `TaskCard` detail region (only when `open`), append a `<LadderRow>` after the "Skills it draws on" line:

```
[ Agentic ladder ]
  Skill -> Recipe -> Agent -> Orchestrator        (4-step rail; current rung marked)
  Today: <RUNG>            <rung blurb>
  Climb: -> <CLIMB-TO>     <climb step>  [~ AI estimate if from kickstart/how]
```

Render rules (a11y + honesty, `v3-result-engine-spec.md` §7):
- **Four rungs encoded by shape + label + POSITION on the rail, never a colour scale.** A position index (1..4) and the rung label carry the meaning; the current rung is marked by a filled marker + bold label + `aria-current`, the others outlined. No red/green, no good->bad gradient (a higher rung is not "better", just "further along the agentic shift"). Reuse the existing blue/cyan family already in `LEVELS`/`C` if any hue is used at all; hue is decorative, not semantic.
- The rail uses ASCII arrows `->` in text (R007); any glyph marker is `aria-hidden`.
- Each interactive element (none new are strictly required; the row is display-only inside an already-expanded card) honours **44px** if made tappable. Default: non-interactive text row, so no new target.
- Climb step carries `<Prov kind="ai" small />` only when sourced from `kickstart`/`how`; the generic verb carries no chip.
- The existing TaskPrep footer **"AI-assisted; human decides ..."** (~6616) already satisfies the mandated footer; extend its wording to name the ladder framing once, no second footer.
- **Withhold:** when `rungForDuty(r)` is `null`, render a single muted "ladder: unscoped" micro-line (or nothing) - never a default rung. When `resps` is empty the whole panel already withholds (unchanged).

Provenance line for the rung itself: a one-time note in the LadderRow or panel header - "rung derived from this duty's AI level" - so the rung's provenance traces to `r.level` (honesty: the ladder is a framing of existing analysis). The rung label may carry `<Prov kind="computed" small />` once at panel level since `LEVEL_TO_RUNG` is deterministic; do NOT chip every row (visual noise).

---

## §G. Grounded-in (source per claim)

| Claim | Source |
|---|---|
| Four-rung capability ladder (Skill/Recipe/Agent/Orchestrator) and the do->author->supervise->orchestrate arc | Human-Lead direction (18-06 '26); consistent with `v3/goal/readme.md` protocol 3 (Stewardship shift: procedural execution commoditised; human = governance node) and RB1's agentic-rubric AGENT handover (`v3-stewardship-spec.md` SS3 RB1). |
| The four AI-exposure `level`s the rung derives from | `LEVELS` (App.jsx ~3278), set by the audited SYSTEM_RATE / RB1-rebaselined rubric. |
| Level -> ladder crosswalk as a modelling choice (not a paper claim) | Same idiom as `PWAI_LENS` / w34854 crosswalk: Acemoglu, Autor & Johnson 2026 (NBER w34854) task categories (automating / labor-augmenting / expertise-leveling / new-task-creating) - the rung climb tracks the move from "AI replaces" toward "human governs/orchestrates". |
| Climb-step prose | Existing `r.kickstart` / `r.how` on `result.responsibilitiesData.responsibilities` (already `~ AI estimate`). |

No claim lacks a source. The crosswalk is declared as a modelling choice, not read from any paper.

---

## §H. Acceptance (testable, in-repo fixtures, determinism asserted)

Fixtures: NHG (`v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md`), PSD (`v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md`), Metta uuid `2320493d0e875075d4dbfa6a893b3fdb`.

1. **Determinism:** `rungForDuty(r)` returns byte-identical `{today, climbTo}` across runs for each fixture duty; a duty with `level:"HIGH"` always reads `today:"orchestrator", climbTo:"orchestrator"`, `HUMAN` always `Skill->Recipe`, etc. (full table §D). Snapshot via `recipe R-SNAPSHOT`.
2. **Mapping fidelity:** spot-check on each fixture that every rendered rung equals `LEVEL_TO_RUNG[<that duty's printed Tag level>]` - the rung and the existing `<Tag>` never disagree.
3. **Withhold:** a duty with `level` absent/unknown shows "unscoped" (or nothing), never a default rung. Construct/confirm at least one such case from the fixtures or a thin duty.
4. **No new number / no new LLM:** grep confirms no new `claudeCall` / prompt const; the only added consts are `LADDER`, `LEVEL_TO_RUNG`, the only added fns `rungForDuty`, `LadderRow`. R005 global list unaffected.
5. **a11y/honesty:** no red/green; current rung marked by shape+label+position with `aria-current`; ASCII-only (R007); the "AI-assisted; human decides" footer present; climb step from `kickstart`/`how` carries `~ AI estimate`, the generic verb carries none.
6. **Frozen door:** `recipe R-FREEZE` passes (no frozen symbol drift); TaskPrep grouping/withhold and `BandSection` byte-stable except the documented header sentence + the appended `LadderRow` call.
7. **Live verify** on desktop + mobile for all three fixtures: rung rail renders inside expanded cards, withholds where `level` missing, no layout reflow of the summary row.

---

## §I. Non-inventive gates (which §6 gates apply)

- **Hard gate 1 (no LLM string parsed into a number):** trivially met - no number anywhere in this slice.
- **Hard gate 2 (Prov chip on every figure):** no figure added; the rung label is a deterministic label (one panel-level `✓ computed` note); reused prose keeps its `~ AI estimate` chip.
- **Hard gate 3 (`[UNVERIFIED]` / withhold over fabrication):** met - missing `level` -> "unscoped", never a guessed rung.
- **Hard gate 5 (determinism):** met - `rungForDuty` is pure over `LEVEL_TO_RUNG`; snapshot-asserted (§H1).
- **D1-D8 (static prompt audit):** **N/A** - no new or touched prompt template (§E). State N/A-with-reason in the HDR.
- **G1-G8 (live read audit):** **applies** - run the dynamic governance diagnostic on one deployed fixture (Metta) to confirm the rung traces to `level`, withhold fires, and no LLM authors the rung. `agent conformance-auditor` + `agent a11y-honesty-reviewer` (read-only) before packaging.

---

## §J. Pre-mortem (run `recipe R-PREMORTEM` before build)

| Risk | Likelihood | Guard |
|---|---|---|
| Rung reads as a quality score ("Orchestrator = good, Skill = bad"), implying a value judgement | Med-High | Copy + a11y: rung is "where the work sits on the agentic shift", not better/worse; no good->bad colour ramp; HIGH self-edge messaged as "govern the outcome", not "you failed to climb". |
| A duty with missing/garbled `level` silently defaults to Skill (fabricated rung) | Med | `rungForDuty` returns `null` on any non-`LEVELS` key; render path shows "unscoped"; §H3 test asserts it. |
| Crosswalk mistaken for a measured claim read from w34854 | Med | In-file comment + §G + panel note declare it a modelling crosswalk (PWAI_LENS idiom), traceable to `level`, not to the paper. |
| Scope creep: a `SYSTEM_LADDER` prompt sneaks in to author bespoke climb steps | Low-Med | §E forbids it this slice; if added later it is a new row and D1-D8 becomes mandatory. |
| Frozen TaskPrep grouping/withhold drifts during the edit | Low | R-FREEZE + the explicit Freeze list in §C; only `TaskCard` detail region and one header sentence change. |
| em/en dash or non-ASCII glyph in the new rail/labels | Low | R007: ASCII arrows `->`, glyph markers `aria-hidden`; grep before packaging. |

---

## §K. Proposed R-rule (observed pattern worth locking)

**Propose R011 (crosswalk-provenance):** *When a slice maps an existing engine value to a new presentation vocabulary (a CROSSWALK: e.g. level -> ladder rung, level -> PWAI category), the mapping MUST be a fixed, greppable const table with an in-file comment declaring it a modelling choice, and the rendered label MUST trace to the source value's provenance - it may never acquire a stronger chip than its source.* Rationale: three slices now do this (PWAI_LENS, the BF2 word-balance, this ladder); locking the pattern prevents a crosswalk silently inflating `~ AI estimate` source data into a `✓ computed` claim. (R-numbering note: `v3-result-engine-spec.md` §1 already proposes an R011 freeze-guard; if that lands first, this becomes R012. Surface the collision to the Human Lead at G1.)

---

## §L. Version + HDR

Propose **v3.0.83** (flat-patch line, §11 AU-7). The direction's `v3.0.83` matches; the RB1 "v3.3.0" tag in `v3-stewardship-spec.md` SS3 is a historical PR-title artefact, not the live counter (live package.json = v3.0.82). Surface Rule V-1 / G1 to the Human Lead before bumping.

HDR template (`v3-result-engine-spec.md` §11 shape):
```
[HDR] #NNN | HH:MM:SS SGT 18-6-26 | v3.0.83 | NNNkb | N,NNN lines
[INTENT] Agentic Ladder: per-duty Skill->Recipe->Agent->Orchestrator rung + one climb step in TaskPrep
[DELTA] +LADDER +LEVEL_TO_RUNG +rungForDuty +LadderRow; TaskCard detail extended; TaskPrep header +1 line
[RISK] Low - additive, deterministic, no new LLM/number; D1-D8 N/A (no new prompt)
[STATUS] STABLE
[TEST] R-SNAPSHOT rung table on NHG/PSD/Metta + R-FREEZE + G1-G8 on Metta + live verify desktop/mobile
[NEXT] Human Lead: confirm v3.0.83 + R011 numbering vs the freeze-guard R011
[ADVICE] crosswalk-not-claim: a relabelling never earns a stronger prov chip than its source
```

Record as new row **AL1** in `v3-stewardship-spec.md` SS3 (goal protocol 3; ADDITIVE; `App.jsx`; grounded in goal 3 + w34854 + RB1) on build close, with an AU-7 if the build deviates from this spec.

---

**STATUS: READY_FOR_BUILD** - next agent: `result-engine-builder` (implement v3.0.83 against this spec; deterministic-first; LLM authors no rung).
