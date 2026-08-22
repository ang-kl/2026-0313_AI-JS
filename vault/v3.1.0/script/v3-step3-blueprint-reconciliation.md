# v3 Step 3 — Blueprint × Code Reconciliation

> **⚠ HISTORICAL AUDIT — not the current spec.**
>
> Written at v3.0.179 (2026-06-30) as Phase 0 of the trust-loop-first arc. Present-state canon lives at [`v3-step3-spec.md`](./v3-step3-spec.md); read *that* for what Step 3 does today.
>
> This file is preserved because the gap analysis it produced was the input to `v3-step3-spec.md` and to several later PRs that repaired the findings named below. Do not treat any verdict here as current. See §Post-audit repairs at the tail for what has since changed.

**Status:** Phase 0, read-only audit. No code change. No spec change.
**Date:** 2026-06-30.
**Scope:** the Review Studio surface that renders after a user clicks **Analyse** on a Step 2 posting card. Implemented in `v3/src/ReviewStudio.jsx`.

## Why this document exists

Four PRs (#237, #238, #240, #241) have landed Step 3 features in quick succession without converging. The earlier today's audit found ~50% of Step 3's runtime logic is **deterministic but implementer‑improvised** — magic regex tokens, hardcoded persona reason text, a leading‑verb verb list standing in for per‑duty exposure — with no pinned spec file to audit against. The other ~40% is genuinely blueprint‑grounded, ~10% is theatrical narration tagged as `derived`.

The four files in `v3/agents/` are build‑time review agents; **none fire at runtime**. PR #241's "No LLM" claim was verified.

This document does one thing: for each Step 3 feature, line up **what the blueprints say** next to **what the code does** and **call the gap**. The next PR can then either spec the silence, fix the mismatch, or formally adopt the improvisation as canon — but it cannot pretend the gap isn't there.

## Inventory

**Code (only file):**
- `v3/src/ReviewStudio.jsx` (359 lines)

**Blueprints (`v3/goal/`):**
- `v3-blueprint.md` — code header cites §5 / §7 / §10
- `v3-ui-blueprint.md` — code header cites §S4

**Specs (`v3/script/`, 15 files):**
- `v3-result-engine-spec.md`, `v3-stewardship-spec.md`, `v3-agentic-ladder-spec.md`, `v3-reinvention-implementation-spec.md`, `v3-pillars-spec.md`, `v3-result-engine.recipes.md`, and 9 others
- **No `v3-step3-spec.md`** — Step 3 has no dedicated slice spec

**Agents (`v3/agents/`, 4 files, all build/review time):**
- `result-engine-builder.md`, `spec-author.md`, `conformance-auditor.md`, `a11y-honesty-reviewer.md`

## How to read each row

For each feature: **Blueprint says** (file + line, or *silent*) → **Code does** (file:line) → **Verdict** ∈ {`MATCH`, `PARTIAL`, `IMPROVISED`, `UNBUILT`, `MISMATCH`, `SILENCE`}.

- `MATCH` — code follows pinned guidance.
- `PARTIAL` — code implements some of what's pinned, omits the rest.
- `IMPROVISED` — code makes a concrete choice the blueprint left open (often as a regex or magic list).
- `UNBUILT` — feature is pinned but not yet in code.
- `MISMATCH` — code does something contrary to pinned guidance.
- `SILENCE` — neither side specifies; nothing to reconcile yet.

---

## 1. Layout

| | Source |
|---|---|
| **Blueprint says** | Left rail → centre manuscript → right Visual Intelligence stack. Centre stays "primary" on all breakpoints. Right stack should be **collapsible / expandable / floatable**. Left rail **can collapse to icons**. iPad mini: centre + collapsible right + left rail as floating drawer. (v3-blueprint.md §10.1 lines 1365–1377, §10.9 lines 1689–1708; v3-ui-blueprint.md §4.2–4.7 lines 201–376) |
| **Code does** | Sub-header (sticky) + ribbon + body row of: icon rail (collapsible 150⇄54px, `ReviewStudio.jsx:186–194`) → optional drawer (300px, `:197–206`) → manuscript pane (`flex: "0 0 clamp(340px, 36%, 640px)"`, `:209`) → comment margin (312px when in suggestions/comments mode, `:281–323`) → right pane (`flex: 1`, ~66%, `:326–344`) → navy footer. |
| **Verdict** | **MATCH** on logical layout. **PARTIAL** on responsive behaviour — no iPad/mobile breakpoint logic in `ReviewStudio.jsx`; the panes use raw `clamp()`/percentages, not the tabbed Ask/Map/Decide mobile mode the blueprint pins (v3-blueprint.md:1691–1695). Right pane is **not** floatable today. |

## 2. Manuscript

| | Source |
|---|---|
| **Blueprint says** | "Centre is the job advertisement as a working manuscript" with title, source badge, sections, highlighted phrases, **tracked insertions, tracked deletions, comments, claims, evidence chain** (v3-blueprint.md §5 lines 547–716, §10.2 lines 1395–1413; v3-ui-blueprint.md §4.4 lines 263–273). Track‑change verbs: insert / delete / replace / split / merge / relabel / escalate / withhold (v3-blueprint.md:570–580). Each suggestion carries `original_text, suggested_text, reason, evidence, confidence, risk, status, accepted_by` (v3-blueprint.md:586–601). |
| **Code does** | Sources duties from `result.jobAnatomy.duties` (engine path) → falls back to `result.responsibilitiesData.responsibilities` → falls back to `firstJob.description/responsibilitiesText` (`ReviewStudio.jsx:128–135`). `rsStrip()` strips tags + entities (`:53`). `rsFirstSentence()` extracts an overview by regex (`:54–60`). Renders title + source chip + overview + responsibilities list + skills chips. **Span highlight + comment margin** are in. **Insert / delete / split / merge / replace** are not — `commentStatus` only tracks `accepted | rejected` (`:119`). |
| **Verdict** | **PARTIAL**. Manuscript surface is built; the track‑changes verb set (split / merge / replace / escalate / withhold) and the suggestion record shape are **UNBUILT**. Boilerplate stripping for Step 3 specifically is **SILENCE** at the blueprint side. |

## 3. O-I-A dissection

| | Source |
|---|---|
| **Blueprint says** | O‑I‑A is the **evidence discipline**, not a regex. Observation = verbatim spans, no inference. Interpretation = claims that **cite span ids**, with method (rule vs judgement) and confidence. Application = engine output (SSOC / ISCO / AIOE / routing). Span lenses: `ROLE`, `ORG`, `AI`. (v3-blueprint.md §7 lines 899–964) Lens regex tokens are **explicitly not pinned**. |
| **Code does** | `rsLens()` (`ReviewStudio.jsx:70–75`) — 3‑way regex dispatch on **14 keywords** (`ai|automat|machine learning|gen ?ai|chatbot|model|algorithm|data analy|analytic|digital transformation` → `AI`; `stakeholder|cross-functional|business unit|department|govern|complian|accountab|relationship|liais|partner` → `ORG`; else `ROLE`). `buildDissection()` (`:83–92`) wraps each duty as a span with `{id, text, band, lens, layer, exposure}` and **cites the span id** in every comment (`:96–104`). Dissect mode renders the three‑column O / I / A card per span (`:210–241`). |
| **Verdict** | **MATCH** on discipline (every claim cites a span id, Observation is verbatim). **IMPROVISED** on the lens regex tokens — blueprint says the discipline is what matters; the 14 keywords are an implementer choice with no source. Phase 1 should canonise (or replace) the token set. |

## 4. Per-duty exposure bands

| | Source |
|---|---|
| **Blueprint says** | Fixed band order Human-led → AI-assisted → AI-augmented → Full automation (v3-ui-blueprint.md §1.2 lines 51–63). Bands assigned per duty **deterministically by the engine** from duty‑layer cues (Activity / Coordination / Accountability / Relational / Judgment) per the agentic rubric RB1 in `v3-stewardship-spec.md`. "Never silently convert missing exposure to zero" (v3-blueprint.md:1042). Confidence: high / moderate / thin / withheld. |
| **Code does** | `RS_EXP_BAND` (`ReviewStudio.jsx:61`) maps engine output `{HIGH, MEDIUM, LOW, HUMAN}` → band keys. When the engine **does not** supply `exposureNow` for a duty, `rsGuessBand()` (`:76–82`) fires a **leading‑verb regex** fallback: human ← `liais|advis|engage|represent|negoti|lead|own|ensure|govern|approve|accountab|mentor|coach`; augmented ← `develop|build|design|automat|generat|implement|deploy|create|configur|program|code`; assisted ← `analy|assess|evaluat|review|investigat|interpret|monitor|prepar|coordinat|process|compil`; default `assisted`. The Dissect view labels both paths with `method · rule` and shows `conf · high` when engine‑sourced and `conf · medium` when guessed (`:230`). |
| **Verdict** | **MATCH** on the engine path. **IMPROVISED** on the fallback — the 36 verb list has no source citation, and the visible "conf · medium" implies more than a leading‑verb match warrants. **MISMATCH** with "never silently convert missing exposure": the fallback never returns null / withheld, it always returns a band. |

## 5. Modes

| | Source |
|---|---|
| **Blueprint says** | **7 markup views**: Clean / Simple Markup / All Markup / Persona / Evidence / Risk / Visual (v3-blueprint.md §5.3 lines 607–613). Default is Clean. User can switch markup mode, visible personas, accepted/rejected/resolved state, comment density, graph visibility, evidence overlays, track-change navigation from the guided review header (v3-blueprint.md:656–664). Exact state-machine transitions are not pinned. |
| **Code does** | **4 ribbon pills** in the Review group (`ReviewStudio.jsx:38`): `clean | suggestions | comments | dissect`. Default = `suggestions` (`:114`). `showClean` shows text without span highlights. `showDissect` shows the 3-column O/I/A view. `showMargin` (suggestions OR comments) shows the right comment margin. `comments` mode filters to comment + withhold‑claim types (`:126`). |
| **Verdict** | **PARTIAL**. Clean, an aggregate "Suggestions" mode (closest to All Markup), a Comments filter, and a Dissect mode are present. **UNBUILT**: explicit Simple Markup, Persona filter, Evidence-only, Risk-only, Visual mode. Default differs from blueprint (Suggestions vs Clean). |

## 6. Persona reviewer comments

| | Source |
|---|---|
| **Blueprint says** | Day‑one reviewer set is **9 personas** (v3-blueprint.md §5.5 lines 677–689): Candidate Advocate, Hiring Filter Analyst, Recruiter, Hiring Manager, Process Redesign Analyst, AI Exposure Analyst, Organisation Designer, Skeptic, Interview Coach. Each comment must cite **source evidence, lens used, deterministic vs judgement, confidence, action allowed, action forbidden** (v3-blueprint.md:428–435). Voice rule: "rewrite verdicts as information for choice" (v3-ui-blueprint.md:149). Trigger logic and reason copy are **not** pinned. |
| **Code does** | `rsComments()` (`ReviewStudio.jsx:93–106`) — **5 personas** (AI Exposure Reviewer, Process Redesign Reviewer, Role Analyst, Candidate Advocate, Evidence Auditor), each fired by an inline rule: ① first span with band=auto/augmented + lens=AI; ② first unused span matching `/\b(ad-?hoc\|various\|support various\|other duties\|as (assigned\|required\|needed)\|miscellaneous)\b/i`; ③ first unused span with `" and "` and `length > 70`; ④ first unused human-band span; ⑤ first unused span matching `/\b(familiar\|knowledge of\|exposure to\|awareness of\|understanding of)\b/i`. Hardcoded reason copy per rule. Capped at 6 comments. Suggested rewrite uses a single template: `"own a named " + (lens==="ORG" ? "transformation" : "delivery") + " backlog with measurable cycle-time targets"`. |
| **Verdict** | **PARTIAL** persona count (5 of 9 — missing Hiring Filter Analyst, Recruiter, Hiring Manager, Organisation Designer, Skeptic, Interview Coach). **IMPROVISED** trigger regex and reason text — no source for the four regex token sets or the "duty bundling = length > 70 + ' and '" heuristic. **IMPROVISED** suggested-rewrite template — tagged `derived` in the UI but the text is hardcoded, not derived from the duty. |

## 7. Provenance + confidence chips

| | Source |
|---|---|
| **Blueprint says** | Chip vocabulary: `from posting`, `from MCF` (verbatim), `computed` (deterministic calculation), `derived` (deterministic interpretation from source + rules), `AI estimate` (model‑assisted judgement), `unverified` (only when explicitly uncertain) (v3-ui-blueprint.md §1.4 lines 106–112; v3-result-engine-spec.md §2). Confidence levels: high / moderate / thin / withheld (v3-reinvention-implementation-spec.md §4.1). Placement: every figure, claim, score, generated statement, graph node, reviewer note carries its evidence origin (v3-ui-blueprint.md:102). |
| **Code does** | `PROV` map (`ReviewStudio.jsx:16–23`) defines **all six** chip kinds with bg/ink/border tokens. Chips render on Observation (`from posting`), Application (`computed`), each reviewer comment (`AI estimate` / `derived` / `from posting` / `unverified` per rule, `:96–104`). Sub-header has a `from MCF` chip (`:159`). Confidence shown as `medium / high / none` strings (`:308–309`), not the four-level blueprint set. |
| **Verdict** | **MATCH** on chip vocabulary and placement. **PARTIAL** on confidence levels — `medium / high / none` is a 3‑level subset of the blueprint's 4‑level `high / moderate / thin / withheld`. **MISMATCH** on one specific tag: the suggested-rewrite chip is `derived`, but the rewrite text is a **hardcoded template** (see Feature 6), not derived from the input — the chip overpromises. |

## 8. Visual Intelligence stack

| | Source |
|---|---|
| **Blueprint says** | **10 visual types** specified (v3-blueprint.md §10.3 lines 1448–1457): role evidence map, organisation chart, InfraNodus-style concept graph, Obsidian-style linked graph, AIOE trace graph, workflow map, hiring funnel, portfolio board, site/service map, control map. Selection logic: "ESCO determines work family. Work family determines visual grammar." (v3-blueprint.md:1079–1081). Occupation-sensitive — different work needs different visual explanation (v3-ui-blueprint.md:505–520). Default visual should come from occupation visual profile §8.6. "Do not use InfraNodus force graph for every surface." |
| **Code does** | Five pills in the Visual ribbon group (`ReviewStudio.jsx:39`): `jobgraph | aioe | workflow | value | org`. **Only `jobgraph` renders** — `rolePane` is passed in as a prop (the live Role Graph from `RoleGraphPanel`, restored by PR #240, `:336`). The other four show a placeholder: *"renders in the next build phase, wired to the deterministic engine output (per blueprint S10.3)"* (`:337–341`). No occupation-sensitive selection. |
| **Verdict** | **UNBUILT** for 4/5 of the named pills and **PARTIAL** for the ribbon set vs. the blueprint's 10 types. Phase 1 should either delete the placeholder pills, ship the next one (likely AIOE trace given Step 2's classifier already produces the data), or rename the group to match what actually exists. |

## 9. Honesty contract

| | Source |
|---|---|
| **Blueprint says** | No red/green anywhere (v3-ui-blueprint.md:166, 390; v3-result-engine-spec.md §7). State doubled with shape + number + label, never colour alone. Every interactive element ≥ 44×44 px (v3-ui-blueprint.md:137). `aria-label` on every SVG; visible 2px focus ring; transitions <250ms; `prefers-reduced-motion` honoured. Every artifact footer: **"AI-assisted; human decides"** + **`Source · Confidence · Time-window`** (v3-result-engine-spec.md §7). Voice: information for choice, not verdict (v3-ui-blueprint.md:149). |
| **Code does** | Bands are blue/teal/amber/orange (`ReviewStudio.jsx:11–14`) — **no red/green, ✓ MATCH**. Footer at `:347–351` shows "AI-assisted · human decides" — **✓ MATCH**. Drawer placeholder repeats the line at `:204`. Reviewer comments lead with information ("This stays human‑led — relationships and accountability. Strongest proof to bring…") — **✓ MATCH voice**. ❌ **Buttons are `minHeight: 32`** (Accept / Reject at `:314–316`) and `minHeight: 28` (drawer close `:201`) — **MISMATCH on 44px touch target**. ❌ **Footer is missing `Source · Confidence · Time-window`** — only carries the standing line. |
| **Verdict** | **PARTIAL**. Colour / voice / "AI-assisted; human decides" line all comply. 44px touch target is violated on the comment Accept/Reject/Ask‑why row. Footer is missing the Source/Confidence/Time-window triple. `a11y-honesty-reviewer` agent should be run against Step 3 as a follow-up. |

## 10. Agent contracts

| | Source |
|---|---|
| **Blueprint says** | Four agents in `v3/agents/`, all build/review/spec time (not runtime). `result-engine-builder` implements a single PR from an active spec, deterministic-first. `spec-author` writes spec slices before implementation. `conformance-auditor` runs D1‑D8 (static) + G1‑G8 (dynamic) audits **before version bump**. `a11y-honesty-reviewer` audits the honesty + a11y contract **before shipping**. (v3/agents/*.md; v3-result-engine-spec.md §10) |
| **Code does** | Zero runtime agent invocations. `ReviewStudio.jsx` has **no `fetch`, no LLM call, no agent dispatch**. The cited build-time agents have **not been run against Step 3 itself** as of v3.0.179 — none of the prior four Step 3 PRs (#237, #238, #240, #241) carry a `conformance-auditor` PASS / `a11y-honesty-reviewer` PASS attestation. |
| **Verdict** | **MATCH** on contract — agents are correctly absent at runtime. **GAP** on process — the build-time agents that exist are not being run against Step 3 PRs. Both `conformance-auditor` and `a11y-honesty-reviewer` would have caught the 32px touch-target mismatch and the misleading `derived` chip on the suggested rewrite. |

---

## Cross-cutting findings

1. **No `v3-step3-spec.md`.** Step 3 is referenced only by the code header citing `v3-ui-blueprint.md S4; v3-blueprint.md S5/S7/S10`. The four spec-time agents in `v3/agents/` expect a slice spec to point at; Step 3 has none. **This is the single biggest leverage point for Phase 1.**

2. **Blueprint silence on the regex tokens.** The blueprint deliberately pins the *discipline* (O‑I‑A, evidence-bound, no LLM-authored numbers) and leaves the *tokens* unstated. The code has to choose tokens to ship; today's choices have no source. Phase 1 should either canonise them or replace them with engine-derived signals (e.g. ESCO skill match), not leave them as undocumented magic.

3. **"Improvised but tagged `derived`."** Three places where the chip overstates what the code does:
   - Suggested-rewrite text (hardcoded template, `derived` chip — Feature 6 / 7).
   - `rsGuessBand` fallback (leading-verb regex, dissect view shows `conf · medium` — Feature 4).
   - `rsLens` decision (14-keyword regex, no chip at all — Feature 3).

4. **Mode set drift.** Blueprint's 7 markup views vs code's 4 ribbon pills. Two missing modes (Persona filter, Evidence-only) are operationally important and cheap to add given the comment data already carries `persona` and `prov`.

5. **Visual stack is a promise.** 4 of 5 ribbon pills render a "next build phase" placeholder. This breaks the honesty contract more than any of the other gaps: a user clicking *Workflow* expects something to happen.

6. **Build-time agents exist; they aren't being run on Step 3.** `conformance-auditor` and `a11y-honesty-reviewer` would have caught the 32px touch-target mismatch and the misleading `derived` chip on the suggested rewrite. Wiring those into the Step 3 PR template is one line of process.

---

## Phase 1 input — priority list for the next PR

In rough order of leverage per line of code:

1. **Write `v3/script/v3-step3-spec.md`** that pins:
   - The 5 personas in use + their trigger rules + their reason text + their suggested-rewrite copy — as canon, with sources or a stated heuristic tag
   - The lens regex tokens (or the engine-derived signal that replaces them)
   - The fallback band rule (or the decision to withhold instead of guessing)
   - The 4 ribbon mode set vs blueprint's 7 — pick a target
   - The visual stack: which pills ship, which are removed
   
   *Doc only. Unblocks `conformance-auditor` and `a11y-honesty-reviewer` against Step 3.*

2. **Fix the dishonest chips.** Either compute the suggested rewrite from the duty or relabel its chip from `derived` to `template`. Either mark `rsGuessBand` output as `~ AI estimate` / `unverified` or withhold the band entirely. Cheap, isolated to `ReviewStudio.jsx:96–104`.

3. **44px touch targets.** Accept / Reject / Ask‑why buttons (`:314–316`) and drawer close (`:201`). `a11y-honesty-reviewer` agent check.

4. **Footer triple.** Add `Source · Confidence · Time-window` next to the standing "AI-assisted; human decides" line at `:350`.

5. **Visual stack honesty.** Either ship the AIOE trace (Step 2's classifier already provides the data) or delete the four placeholder pills.

6. **Per-duty exposure from the real engine.** Replace `rsGuessBand` with `computeEngine(ssoc, title)` per duty — same chain Step 2 uses. The Step 2 donut and the Step 3 manuscript colours then agree.

7. **Comments visible by default.** Default the markup mode from `suggestions` to `comments` (or render the margin always), and change the four ribbon pills from *visibility* to *intensity*.

---

## What this document is not

- It is not a spec. It does not pin any rule. It only puts blueprint and code next to each other.
- It is not exhaustive on the blueprints — only the sections cited by the Step 3 code header (`S4 / S5 / S7 / S10`) and the cross-cutting honesty + agent contracts. Other v3 spec slices may be relevant later.
- It does not prescribe the Phase 1 spec content. Phase 1 will be a separate PR that turns this priority list into pinned canon.

---

## Post-audit repairs (added 2026-07-06 as part of trust-loop-first PR 3)

The rows below re-verdict each feature against the **current** code (`v3/src/ReviewStudio.jsx` at v3.0.224). The original verdicts above are historical.

| # | Feature | Original verdict (v3.0.179) | Present verdict (v3.0.224) | Repair PR |
|---|---|---|---|---|
| 1 | Layout | MATCH (logical), PARTIAL (responsive) | **MATCH** — 860 px mobile breakpoint added; drawer/margin portalled; rail defaults collapsed narrow. Floatable right pane still parked. | #263 #264 #265 |
| 2 | Manuscript | PARTIAL | **PARTIAL** — unchanged; track-change verb set still unbuilt. | — |
| 3 | O-I-A dissection | MATCH (discipline), IMPROVISED (regex) | **MATCH** discipline; **canonised** — the 14 tokens are now pinned in `v3-step3-spec.md` §5, not undocumented. | this PR |
| 4 | Per-duty bands | IMPROVISED + MISMATCH (`rsGuessBand` never withholds) | **FIXED** — `rsGuessBand` removed; withheld bands render as saffron dashed `SPAN_STYLE_WITHHELD`. `never silently convert missing exposure` now honoured. | #250 #284 |
| 5 | Modes | PARTIAL (4 of 7) | **PARTIAL** — 5 of 7 now (added `critical`). Persona / Evidence / Risk still parked. | #287 |
| 6 | Personas | PARTIAL (5 of 9), IMPROVISED (triggers + reason copy) | **PARTIAL improved** — 6 of 9 (added Signal Auditor via Critical Read); Process-Redesign suggested rewrite now genuinely derived from a keyword extracted from *that* duty via `rsKeyword`. | #250 #287 #290 |
| 7 | Prov + confidence chips | MATCH vocab, MISMATCH on `derived` chip on hardcoded template | **FIXED** — `derived` chip now honest (drops to `unverified` when no keyword). Confidence set now matches blueprint 4-level. | #250 #284 |
| 8 | Visual Intelligence stack | UNBUILT — 4 of 5 placeholder | **FIXED via deletion** — placeholder pills removed, only `jobgraph` ships. AIOE trace planned. | #282 |
| 9 | Honesty contract | PARTIAL — 32px targets, footer missing S·C·TW | **FIXED** — 44 px on Accept/Reject/Ask-why; `Source · Confidence · Time-window` footer triple wired. Honest `withheld` overall confidence via `footerConf`. | #250 #257 |
| 10 | Agent contracts | MATCH runtime; process gap | **MATCH runtime** unchanged; process gap being addressed by trust-loop-first PR 2 (verification.md wired agents to a single-source path). | PR #301 |

**Also added since audit** — a whole new **Critical Read** arc that was not in the audit's scope: deterministic Word-Noodle finder, Forensic Reversal, Falsification (template? / role mash-up? / compliance-only?), Hiring Filter, and a batched LLM advisory pass tagged `AI estimate · advisory`. Documented in `v3-step3-spec.md` §6. (PRs #287 #288 #289 #290 #293)

— end —
