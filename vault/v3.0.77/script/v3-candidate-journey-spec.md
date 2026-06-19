# SG Career View v3 - Candidate Journey arc spec ("from job-read to job-won")

> **Target repo path:** `v3/script/v3-candidate-journey-spec.md`.
> **Status:** active arc. **Version:** flat patch line `v3.0.<N>` (G1 gate each PR; never roll minor until v3.0.999 - see result-engine-spec §11 AU-7).
> **Contract alignment:** the locked v3 contract governs every line (deterministic = control; LLM = advisory narration only; non-inventive; `[UNVERIFIED]`/withhold over a guess). Frozen door inherited from `v3-result-engine-spec.md` §1; R-FREEZE runs before every PR here too.
> **Reader priority:** (1) Claude Code, (2) Human Lead.

## CJ0. Purpose and thesis
v3 reads a vacancy as a stewardship artefact and reads the candidate's fit - but it is a 14-tab
dashboard, not a journey. This arc turns it into a **candidate operating system**: a storyboard
walking O-I-A (Observe -> Interpret -> Act) from "I see this job" to "armed, rehearsed, applying",
self-directed. It closes the two confirmed gaps (concrete tasks with how/why; an onboarding spine)
and the last buildable goal protocol (paper §3 Steward's Praxis). Sentinel (§8-9) stays parked.

## CJ-map (5 stations)
| Station | O-I-A | Surface | Slice |
|---|---|---|---|
| 1 Understand | Observe | Deep Read + engine headline | exists |
| 2 Position | Interpret | CV result (True-Fit, blend, anatomy, fairness, Brief) | exists |
| 3 Become | Interpret | Steward's Praxis panel | **CJ1** |
| 4 Arm | Act | Task Prep panel (tasks + how/why + prep) | CJ2 |
| 5 Rehearse | Act | Interview Rehearsal (Resume/ATS greyed off) | CJ3 |
| spine | - | Journey storyboard | CJ4 |

## CJ-sequence
| PR | Slice | Band | Files | Grounded in | Accept |
|---|---|---|---|---|---|
| **CJ1** | Steward's Praxis + grey off Resume | ADDITIVE | `App.jsx` | goal paper §3 (the 4 phases) | SHIPPED v3.0.53: StewardsPraxis in the Deep Read cluster - 4 phases (redefine baseline / control surface / untrusted actor / change leadership) tailored to the role's duties; framework fixed in `_PRAXIS_LABELS` (paper's words), LLM fills role-specific meaning + move; `~ AI estimate`, authors no number, digits stripped, withheld <3 duties, `praxis1` cache, claude-fable-5. Resume tab greyed off (`paused:true`; disabled + "(paused)" label + aria-disabled, code kept). Conformance D1-D8 PASS + a11y 7/7 PASS. |
| CJ2 | Task Prep ("Arm") | ADDITIVE | `App.jsx` | the extracted duties (responsibilitiesData) | SHIPPED v3.0.54: `TaskPrep` - PURE deterministic render of the already-extracted+rated duties (text/freq/level/tool/how/kickstart/sk), grouped Core/Common/Occasional; per task = what you'd do (◐ derived) + how AI engages (~) + prepare-this-week (~) + skills it draws on (from result.skills). NO new LLM, NO invented task, NO number. New `🎯 Task Prep` tab; withholds when no duties. a11y 7/7 PASS (no red/green; reuses Tag/Prov). |
| CJ3 | Interview Rehearsal | ADDITIVE | `App.jsx` | STARs; Schmidt-Hunter 1998 | SHIPPED v3.0.55: `Rehearsal` panel + `🎤 Interview Prep` tab (gated >=3 duties). SYSTEM_REHEARSE -> per real duty: the competency question + a STAR scaffold of PROMPTS the candidate fills; the model authors the question + empty prompts ONLY, never the answer (HARD RULE + digit-strip + duty-exists filter, triple-locked). `~ AI estimate`; loads on tab open; rehearse1 cache; claude-fable-5; withheld under thin duties; no Resume dependency. Conformance D1-D8 PASS + a11y 7/7 PASS. |
| CJ4 | Journey storyboard spine | ADDITIVE | `App.jsx` | - | SHIPPED v3.0.56: `JourneySpine` pure-UI strip in the Navigation box - 5 numbered stations (Understand/Position/Become/Arm/Rehearse) over O-I-A; deterministic readiness from which tabs exist (rolegraph/CV always present); state by shape+number+label+text not colour ("- you are here" + aria-current; "- locked" + aria-disabled + descriptive aria-label, focusable for keyboard/SR; click-guarded); tap -> setActiveTab; no LLM/number/Prov/footer; Resume not a station; 44px. Conformance + a11y 7/7 PASS. Arc CJ1-CJ4 complete. |

## Gates (every slice)
Frozen door untouched (R-FREEZE hardened); engine untouched (level-free); no LLM-authored number;
Prov chip on every figure; withhold over fabricate; no red/green; 44px + aria + "AI-assisted; human
decides" footer; R007 ASCII. Per PR: this row -> builder -> conformance (D1-D8 + G-tests) -> a11y ->
3-site flat bump (v3.0.53++) + HDR + live-verify.
