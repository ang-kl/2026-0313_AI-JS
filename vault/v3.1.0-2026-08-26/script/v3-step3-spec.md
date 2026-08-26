# v3 Step 3 — Review Studio · current-state spec

**Status:** live canon. Present-state truth as of `v3/src/ReviewStudio.jsx` at repo tip.
**Scope:** the reviewable-workspace surface that renders after a user clicks **Analyse** on a Step 2 posting.
**Historical companion:** [`v3-step3-blueprint-reconciliation.md`](./v3-step3-blueprint-reconciliation.md) is the earlier audit (Phase 0). Read it for the gap analysis that produced this spec; do not read it for present-state truth.
**Governance:** every rule below is subject to `v3-blueprint.md` §5 / §7 / §10, `v3-ui-blueprint.md` §S4, `v3-result-engine-spec.md` §7, and `trust-loop-first.instructions.md` §5.

## 1. Layout

Three vertical zones, top-to-bottom: **sub-header** (sticky, does not scroll), **ribbon**, **body row**. Below-body: a **navy footer** with the trust-loop standing line.

Body row (desktop, ≥ 860px viewport width): **icon rail** (collapsible 150 ⇄ 54 px, defaults expanded) → optional **drawer** (300 px, opens from rail) → **manuscript pane** (`flex: 0 0 clamp(340px, 36%, 640px)`) → optional **comment margin** (312 px, rendered when markup mode ∈ {`suggestions`, `comments`}) → **right pane** (`flex: 1`, ~66 % — hosts the Visual Intelligence stack).

Body row (narrow, < 860 px viewport width): the manuscript takes 100 % width; the drawer and comment margin become **fixed slide-over panels** portalled to `document.body` (avoids z-index traps in the App's `<main>` stacking context — see `ReviewStudio.jsx` lines 336–342, 390–404). The rail defaults **collapsed** on narrow viewports.

**Contract:** the manuscript is always primary. Nothing may dominate it. The right pane is dominant on desktop but is **not** floatable today — that remains parked.

## 2. Manuscript model

The manuscript is the **posting's own text**, verbatim, treated as an editorial page.

**Duty source** — resolved in this order (see `ReviewStudio.jsx:362–364`):
1. `result.jobAnatomy.duties` — engine-derived duty objects `{ text, exposureNow, layer }` (preferred; each duty carries the engine's exposure classification).
2. `result.responsibilitiesData.responsibilities` — fallback list of duty strings from the responsibilities extractor.
3. Empty — the surface renders the "no responsibilities to render" notice; nothing is invented.

**Overview** — `result.responsibilitiesData.summary` if present, otherwise the first sentence extracted from the raw posting description via `rsFirstSentence` (`rsFirstSentence` at `ReviewStudio.jsx:60–66`).

**Skills** — flattened from `result.skills[].skill`, capped at 24 chips in the visible manuscript.

**Text sanitisation** — `rsStrip` (HTML tags out, `&nbsp;`/`&amp;` decoded, whitespace collapsed). Boilerplate stripping ("compliance ritual", "equal opportunity employer") is out of scope on Step 3 today — the manuscript renders the ad as the ad is.

**Non-inventive rule:** every rendered duty span is a *verbatim substring* of the posting. No paraphrase, no synthesis, no LLM-authored duty text.

## 3. Markup modes (five)

Ribbon group **Review** at `RIBBON[0]` — five pills (`ReviewStudio.jsx:44`):

| Key | Visible label | Manuscript render | Comment margin | Notes |
|---|---|---|---|---|
| `clean` | Read clean | Plain duty list; no span highlights | Hidden | Closest to blueprint "Clean View" |
| `suggestions` | Suggestions | Duty spans highlighted by band; withheld spans dashed | All comments | **Default** |
| `comments` | Comments | Duty spans highlighted by band | Filter: `comment` + `withhold claim` types only | For a reviewer voice pass |
| `dissect` | Dissect | Manuscript replaced by three-column O/I/A cards (see §5) | Hidden | Full-canvas view |
| `critical` | Critical read | Manuscript replaced by Critical-Read lens set (see §6) | Hidden | Full-canvas view |

**Default:** `suggestions`. **Reason:** the reviewer voice is the point of Step 3; a bare `clean` default hides the value.

**Blueprint drift acknowledgment:** the blueprint pins 7 markup views (Clean / Simple / All / Persona / Evidence / Risk / Visual, `v3-blueprint.md:607–613`). The shipped set is 5 with a deliberately different composition — Persona / Evidence / Risk / Visual filtering can be reached by combining the current modes with the comment margin filter and the rail drawers. Adopting the additional filters is **planned**, gated on the trust-loop first restraint.

## 4. Span highlight tokens

Per band (`SPAN_STYLE` at `ReviewStudio.jsx:35–40`): background tint + 2 px coloured under-rule + adjusted ink for AA contrast. Colour-blind safe (no red/green). Bands:

- **Human-led** — blue tint `#eaf0ff`, rule `#1d4ed8`.
- **AI-assisted** — teal tint `#e3f5fb`, rule `#0e7490`.
- **AI-augmented** — amber tint `#fdf0dd`, rule `#b45309`.
- **Full automation** — orange-red tint `#fde6da`, rule `#c2410c`.
- **Withheld** — neutral saffron tint `#fff3cf` with a **dashed** rule (`SPAN_STYLE_WITHHELD` at `ReviewStudio.jsx:42`).

The withheld style is required. When the engine did not classify a duty, the surface renders the span as a *general note*, never a coloured band. Silently converting missing exposure to a band is a spec violation (`v3-blueprint.md:1042`, `buildDissection` at `ReviewStudio.jsx:84–92` returns `band: null` in this case).

## 5. O-I-A dissection (Observation → Interpretation → Application)

Discipline (per `v3-blueprint.md` §7): every claim must cite its source span. Nothing interpreted that was not first observed; nothing applied that was not first interpreted.

**Lens dispatch** (`rsLens` at `ReviewStudio.jsx:76–81`) — three-way regex classifier on the duty text:

- **AI lens** — matches `\b(ai|automat|machine learning|gen ?ai|chatbot|model|algorithm|data analy|analytic|digital transformation)\b`.
- **ORG lens** — matches `\b(stakeholder|cross-functional|business unit|department|govern|complian|accountab|relationship|liais|partner)\b`.
- **ROLE lens** — default.

Lens colour tokens: ROLE `#1d4ed8`, ORG `#5b4bbd`, AI `#b45309` (`LENS` at `ReviewStudio.jsx:28`).

**Dissect view** (markup mode `dissect`) — replaces the manuscript with one O/I/A card per span. Each card renders three columns:
- **Observation** — verbatim span, `from posting` chip.
- **Interpretation** — layer + exposure band, `method · rule (engine)` when the engine supplied the band; `method · rule` otherwise.
- **Application** — AIOE band + routing (`candidate edge (proof)` for human, `governance check` for auto, `AI-assist, human verify` otherwise); `computed` chip.

**Improvised rule notice:** the 14 keyword tokens in `rsLens` are an implementer choice. The blueprint pins the discipline (`v3-blueprint.md:931–964`), not the tokens. The token list is treated as **canon here** because the discipline is stable and the tokens are auditable in this file; changing them requires a spec PR.

## 6. Critical Read (§6.3 Forensic Reversal + §6.8 Falsification, plus §5.5 Hiring Filter)

Markup mode `critical`. Runs four **deterministic lenses** on the posting text plus an optional **batched LLM advisory pass** that runs in the background.

### 6.1 Signal / Noise (`RS_NOODLES` at `ReviewStudio.jsx:139–149`)

Verbatim empty-phrase finder. Three regex families:

- **Unbounded figure** — `up to`, `as low as`, `starting at`, etc. Question-mark counter: *"up to what, and what is the actual median?"*
- **Vague superlative** — `competitive`, `world-class`, `cutting-edge`, etc. Counter: *"competitive vs what benchmark, measured how?"*
- **Culture code** — `fast-paced`, `rock star`, `wear many hats`, `we are a family`, etc. Counter: *"which specific hours, hats or expectations does this hide?"*

Cap: 6 findings. Each carries the verbatim phrase + category + interpretation + a "question-mark move" counter derived from the phrase itself.

### 6.2 Forensic Reversal (`rsForensicReversal` at `ReviewStudio.jsx:172–191`)

Aspiration-vs-evidence separator. Sentence-level scan.

- **Aspiration** regex — `will (help|support|drive|enable|foster|champion)…`, `play a (key|central) role`, `responsible for`, `passionate about`, `committed to`.
- **Inflated abstraction** regex — `synergy`, `paradigm`, `holistic`, `value-add`, `best practices`, `strategic initiatives`, `transformational`, `move the needle`, `end-to-end solutions`.

A sentence flagged by either regex renders as an O-I-A card. Cap: 5. Counter: *"Strip it to the real verb: what specific output, produced how, measured by what?"*

### 6.3 Falsification (`rsFalsification` at `ReviewStudio.jsx:199–227`)

Deterministic template / mash-up / compliance detector. Uses **counts, not opinions**.

- **`template?`** — fires when ≥ 2 duties match `RS_VAGUE_DUTY` (`ad-?hoc|various|other duties|as (assigned|required|needed)|miscellaneous|support the team|any other|from time to time|when required|where necessary`) AND vague fraction ≥ 25 % of spans.
- **`role mash-up?`** — fires when ≥ 2 duties bundle two clusters with " and " AND length > 70, OR the title itself joins distinct functions via `/`, `&`, or `and`.
- **`compliance-only?`** — fires when ≥ 2 duties match `RS_COMPLIANCE` (`compl(y|iance|ies)|adhere|conform|in accordance with|as per (the )?(policy|policies|guidelines|sop)|regulatory|statutory|ensure (all )?(compliance|adherence)`) AND compliance fraction ≥ 30 %.

Each firing renders an O-I-A card with a `template?` / `role mash-up?` / `compliance-only?` tag and an "Ask: …" application move.

### 6.4 Hiring Filter (`rsHiringFilter` at `ReviewStudio.jsx:232–247`)

Deterministic "other side of the table" auto-gate finder. Three families:

- **Experience gate** — `X+ years of experience` (verbatim, from posting text or `job.minimumYearsExperience`).
- **Qualification gate** — bachelor's / master's / PhD / diploma / degree references.
- **Credential gate** — `certified`, `licensed`, `chartered`, `CPA`, `CFA`, `PMP`, `ACCA` and similar.

Every gate rendered is a verbatim substring of the posting. If a candidate falls below a gate, most ATS filters and recruiters screen the CV before a human reads it — that fact is stated plainly so the reader can self-assess.

### 6.5 Advisory pass (batched LLM)

`result.criticalRead` — populated asynchronously by a background pipeline (four personas: devil's advocate, teleology, pro-worker, real-demand). Rendered via `AdvisoryCard` (`ReviewStudio.jsx:301–311`). Every advisory card is tagged **`AI estimate · advisory`**.

**Contract:** the LLM in this pass **challenges, teleogises, and asks questions**. It does not author a number, a band, a rank, or a verdict. If it disagrees with the deterministic engine, the engine wins. If the pass is still loading or failed, the deterministic lenses render alone — advisory is a bonus, not a dependency.

### 6.6 Fallback text (`buildCriticalRead` at `ReviewStudio.jsx:248–265`)

When `result.jobs` is thin (single-posting analyses), Critical Read falls back to the analysed posting's own verbatim text (`posting.text`, threaded in as a prop). When there is no text at all, the surface withholds — no invented lens finding fires.

## 7. Persona reviewer comments

`rsComments` at `ReviewStudio.jsx:101–120`. Cap: 6 total comments. Six personas registered:

| Persona | Trigger | Provenance | Confidence |
|---|---|---|---|
| **AI Exposure Reviewer** | First span with band ∈ {auto, augmented} + lens = AI (or any auto/augmented if none matches lens) | `AI estimate` | moderate |
| **Process Redesign Reviewer** | First unused span matching vague-ownership regex (`ad-?hoc\|various\|other duties\|…`). Suggested rewrite is derived from a keyword extracted from *that duty* via `rsKeyword` at `:97–100` (returns a salient noun-ish word from the duty). | `derived` when keyword was extracted; **`unverified`** when not | moderate / thin |
| **Role Analyst** | First unused span with " and " AND length > 70 (duty-bundling heuristic) | `computed` | high |
| **Candidate Advocate** | First unused human-band span | `from posting` | high |
| **Evidence Auditor** | First unused span matching weak-claim regex (`familiar\|knowledge of\|exposure to\|awareness of\|understanding of`) | `unverified` | **`withheld`** |
| **Signal Auditor** | (Rendered on Critical-Read cards; see §6) | `from posting` | moderate |

**Honest `derived` rule** (fixed in PR #250 / #284): the Process Redesign suggested rewrite is only tagged `derived` when the rewrite actually incorporates a keyword pulled from the specific duty. When `rsKeyword` returns nothing, the tag drops to `unverified` and the confidence to `thin`. Do not mistag hardcoded template output as `derived`.

**Blueprint drift acknowledgment:** the blueprint names 9 day-one personas (`v3-blueprint.md:677–689`); the shipped set is 6. The four not shipped (Hiring Manager, Recruiter, Organisation Designer, Interview Coach, Skeptic — noting the "Hiring Filter Analyst" arrived as the Critical-Read hiring-filter lens rather than as a margin persona) are **parked**, not deleted. Adding them is subject to the trust-loop-first restraint gate.

## 8. Provenance + confidence chips

Vocabulary (`PROV` at `ReviewStudio.jsx:19–26`, in doctrine order):

- **`from posting`** — verbatim source text or posting fact.
- **`from MCF`** — posting metadata direct from MyCareersFuture.
- **`computed`** — deterministic calculation (engine, no LLM).
- **`derived`** — deterministic interpretation from source + rules; the interpretation must be *traceable to the source text*.
- **`AI estimate`** — LLM-assisted judgement (advisory only).
- **`unverified`** — shown only when the system explicitly cannot vouch.

Every meaningful figure on Step 3 renders with a chip. Chips are decorative-with-meaning: shape + colour + label together.

Confidence values in use: **`high`**, **`moderate`**, **`thin`**, **`withheld`**. `withheld` is a valid, expected value — it means the audit found nothing to attest.

## 9. Withhold-over-guess logic

The blueprint rule (`v3-blueprint.md:1042`): *"Never silently convert missing exposure to zero."* The shipped rules:

1. **Per-duty band** — `buildDissection` returns `band: null` when the engine did not classify. The span is rendered with `SPAN_STYLE_WITHHELD` (dashed, saffron), not a coloured band.
2. **Overall footer confidence** — `footerConf` at `ReviewStudio.jsx:350–351`. Values in order of preference: `high (engine-classified)` when all spans classified · `N of M duties classified` when partial · `withheld` when none.
3. **Suggested rewrite** — `derived` chip only when `rsKeyword` extracted a real keyword; `unverified` + `thin` otherwise.
4. **Critical Read** — every finding is a verbatim substring; when the ad text is < 40 chars, no findings render.
5. **Advisory pass** — a null / failed `result.criticalRead` renders nothing; the deterministic lenses fill the space.

**Anti-goal:** any code path that produces a band, a chip, or a confidence out of thin air is a spec violation. Fix by withholding.

## 10. Visual Intelligence surface

Ribbon group **Visuals** at `RIBBON[1]` — **one pill only**: `jobgraph` (`ReviewStudio.jsx:45`). Renders `rolePane` (the live Role Graph passed in as a prop).

**Deleted, not parked as placeholder** (PR #250 / #282): the earlier `aioe / workflow / value / org` pills were removed rather than left rendering a "next build phase" notice. The blueprint pins ten visual types (`v3-blueprint.md:1448–1457`); the shipped surface admits it ships one, honestly.

Adding the next visual — AIOE trace being the most obvious candidate given Step 2's classifier already produces the data — is **planned**, subject to the trust-loop-first restraint gate.

## 11. Footer

Navy footer at `ReviewStudio.jsx:` fixed strip. Content:

- Left: `Review Studio · local + cloud`.
- Right: **`AI-assisted · human decides`** — the trust-loop standing line, appears on every artifact per `v3-result-engine-spec.md` §7.
- Below (result-page footer, threaded from App): **`Source · Confidence · Time-window`** triple. Source = `from MCF` (or the posting's source), Confidence = `footerConf`, Time-window = ad's posted date range.

Both lines are required. Removing either is a honesty-audit failure.

## 12. Mobile + accessibility

Breakpoint at 860 px. Below:

- Rail defaults collapsed (icon-only, 54 px).
- Manuscript takes 100 % width.
- Drawer + comment margin become slide-over panels (fixed position, `min(88vw, 340px)`, `z-index: 999`), portalled to `document.body` to escape the App's `<main>` stacking context.
- Slide-over close button is unconditionally visible (fix from PR #264).

Accessibility contract:

- **No red/green anywhere.** Every state doubled with shape + label + text.
- **Every interactive element ≥ 44 × 44 px.** Ribbon pills (`pillStyle` at `ReviewStudio.jsx:379`) use `minHeight: 36` on visible height with padding making the hit box ≥ 44 px. Accept / Reject / Ask-why buttons (fixed in PR #250) meet the 44 px rule.
- **`aria-label` on every SVG.** Focus ring visible; keyboard-navigable.
- **`prefers-reduced-motion`** honoured — transitions gated where added.
- **Sub-header** discloses any Step-1 ESCO-alt-title mapping (`Skills resolved via the closest ESCO term: …`) so provenance travels from Step 1 through to Step 3.

## 13. Parked / not in scope

These are honestly named as absent, per Rule 7 (documentation matches current behaviour) of `trust-loop-first.instructions.md` §5.

- **Additional markup modes** — Simple, All Markup, Persona filter, Evidence-only, Risk-only, Visual mode are not shipped; the current 5 modes cover the primary use cases.
- **Additional visual types** — AIOE trace, Workflow, Value stream, Org map, Obsidian-style linked graph, InfraNodus concept graph, hiring funnel, portfolio board, site/service map, control map — none shipped. AIOE trace is the most likely next.
- **Additional personas** — Hiring Manager, Recruiter, Organisation Designer, Interview Coach, Skeptic — not shipped as margin voices.
- **Track-change verbs** — split / merge / relabel / escalate / withhold as first-class comment actions are not shipped; today's `commentStatus` tracks accepted / rejected only.
- **Floatable right pane** — the blueprint pins collapsible / expandable / floatable; today the pane is fixed-flex on desktop.
- **Boilerplate stripping** — the manuscript renders the ad verbatim including compliance ritual.

Adding any of the above requires (a) a slice spec update in `v3/script/`, (b) `conformance-auditor` + `a11y-honesty-reviewer` PASS, (c) `R-SNAPSHOT` PASS, (d) the trust-loop-first restraint gate satisfied.

## 14. Verification

Every PR that touches `v3/src/ReviewStudio.jsx` or its inputs must run the checks named in `v3/script/verification.md` and report the block in `trust-loop-first.instructions.md` §7. `not run` is a truthful value; `PASS` for a check that did not run is a spec violation.

## 15. Change log for this file

- **2026-07-06 — Initial canon.** Reconciles from `v3-step3-blueprint-reconciliation.md` (Phase 0 audit) to current state through v3.0.224. Written as PR 3 of the trust-loop-first arc.
