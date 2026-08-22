# v3 - Workflow Parallelisation and Step 3 Hardening Spec

10-07 '26 22:01 SGT · audited against `main` as of clone (v3.0.179+ era, `ReviewStudio.jsx` at 2,013 lines, `App.jsx` at 17,478 lines)

**Status:** proposed spec slice. Read-only audit findings in Part A/B/C, each followed by a pinned remediation. Nothing here authors a number; all changes are orchestration, decomposition, and rendering.

---

## Part A - The workflow: what is actually sequential, and what needn't be

[§A.1] **Finding: the "background fan-out" is not a fan-out - it is a nested chain.** The post-results pipeline (`App.jsx:15913` onward) gates *everything* behind `buildResponsibilitiesData(...).then(...)`. Job Anatomy, Role Graph, Critical Read and SSOCRG all live *inside* that single `.then`, so the wall-clock shape is:

```
core_llm (Promise.all x4, :15801)  →  foundation (lone await, :15852)  →  results shown
  →  buildResponsibilitiesData ──.then──▶ { jobAnatomy ∥ roleGraph ∥ criticalRead ∥ ssocGraph }
```

The four inner tasks do run concurrently *with each other*, but none can start until responsibilities has fully resolved - even the parts of them that do not need it.

[§A.2] **Finding: dependency analysis shows three of the five gated tasks have a weaker true dependency than the code enforces.**

| Task | Enforced dependency | True dependency | Verdict |
|---|---|---|---|
| Job Anatomy (`buildJobAnatomy`, :2781) | full `rd` | only `rd.jobs` (the fetched ads) | over-gated - could start as soon as ads land, before duty analysis completes |
| Role Graph (`buildRoleGraph`, :3456) | full `rd` | `rd.responsibilities` preferred, but falls back to the posting's own verbatim duty lines | over-gated when a posting is present - the posting path needs nothing from `rd` |
| Critical Read (:15960) | full `rd` | `rd.responsibilities` | correctly gated |
| SSOCRG (`buildSsocGraph`, :15975) | full `rd` | `rd` + posting | correctly gated |
| Role-Mix (:15992) | fires outside the chain | title/posting only | already correct - use as the pattern |

[§A.3] **Finding: `foundation` is a lone sequential await on the critical path.** `App.jsx:15852` awaits `getFoundationSkills` *after* the core `Promise.all` resolves, delaying `setStep("results")` by one full LLM round-trip. It consumes `merged` (skills), which exists the moment the core batch resolves - it does not consume progression/crossover/context, so it need not wait for the slowest of those four either. Restructure: fire it as a fifth member of a staged fan-out, or at minimum start it the moment `ratings` resolves rather than after the whole `Promise.all`.

[§A.4] **Finding: internal chains inside the builders are also stricter than their data flow.**

- `buildRoleGraph` (:3456-3492) runs `analyseRolePipeline → getRoleMixCandidates → narrateRoleGraph` strictly in sequence. But `getRoleMixCandidates(title, skills, extraPhrases)` reads nothing from `analysed` - steps 3 and 5 are independent and should be `Promise.all`-ed, with only step 6 (`scoreIscoCandidates`) joining them.
- `buildJobAnatomy` (:2781-2817) runs `extract (parallel, good) → classifyDuties → narrateJobAnatomy`. `narrateJobAnatomy` genuinely needs the classified scores, so this chain is legitimate - leave it.

[§A.5] **Finding: the concurrency limiter is generous but the queue is FIFO-blind.** `CLAUDE_MAX_CONCURRENT = 10` (:1822) with a plain FIFO queue means a burst of 12 anatomy-extract calls can occupy all slots while the single user-facing call (e.g. the Critical Read the open tab is waiting on) queues behind them. Add a two-tier priority: interactive/foreground calls jump the queue; background enrichment takes leftover slots.

[§A.6] **Remediation - target DAG.** Replace the nested `.then` with a keyed task map where each task declares its true input and starts on that input's promise, not on the whole `rd`:

```
adsFetched ──▶ jobAnatomy
posting ─────▶ roleGraph (posting path)          ┐
respReady ───▶ roleGraph (corpus path fallback)  ┤ race/merge
respReady ───▶ criticalRead, ssocGraph
title ───────▶ roleMix (already correct)
merged ──────▶ foundation (parallel to progression/crossover/context)
```

Practically: have `buildResponsibilitiesData` resolve *progressively* - expose an early `{ jobs }` promise (ads landed) and a final `{ responsibilities }` promise - or split the function at that seam. `bgLogStep` already narrates "fronts" not steps (AN1), so the progress banner survives unchanged.

[§A.7] **Acceptance test:** with a picked posting, `jobanatomy` and `rolegraph` `logStep` start-timestamps must precede the `responsibilities … ok` completion timestamp in the debug panel. Today they cannot.

---

## Part B - Step 3 building blocks: why they feel weak

[§B.1] **Finding: the audit's own verdict still stands structurally.** `script/v3-step3-blueprint-reconciliation.md` found ~50% of Step 3's runtime logic "deterministic but implementer-improvised" - magic regexes (`RS_RESP_RE:106`, `RS_TIME_LINE:318`, `RS_COMPLIANCE:435`), a hardcoded blind-spot rule list (:496), a leading-verb list standing in for per-duty exposure, hardcoded half-life copy (`RS_HALF_LIFE:242`). These have since been *adopted* but not *externalised*: they remain inline constants inside a 2,013-line component, unversioned and untestable in isolation.

[§B.2] **Finding: the window system is registry-less.** Fourteen windows (`winVerdict … winInspector`) are wired through a hand-maintained ternary chain in `renderWindow` (:1749-1755) plus a parallel `TAB_WINDOWS` map plus per-tab `overrides`/`pinned`/`floats` state. Adding a window today touches four places; there is no single source of truth declaring a window's id, label, tab membership, default side, or - critically for Part C - its **anchor contract** (which DOM ids/data-attributes it exposes for linking). This is the root weakness: windows are render closures, not described building blocks.

[§B.3] **Remediation - a window registry.** One declarative array:

```js
const WINDOWS = [
  { id: "manuscript", label: "Manuscript", tabs: ["ad","duties"], side: "left",
    render: (ctx) => <Manuscript {...ctx}/>,
    anchors: { out: (id) => `#li-${id}` } },
  { id: "comments", label: "Reviewer comments", tabs: ["ad"], side: "right",
    render: (ctx) => <Comments {...ctx}/>,
    anchors: { in: (id) => `[data-comment-anchor="${id}"]` } },
  // …
];
```

`renderWindow`, `TAB_WINDOWS`, the dock strips and the connector engine (Part C) all derive from this. The improvised regex/rule constants move to a single `rs-rules.js` module with the version string the reconciliation audit asked for, so `conformance-auditor` can diff them against a pinned spec instead of grepping a monolith.

[§B.4] **Remediation - split the file.** `ReviewStudio.jsx` at 2,013 lines mixes layout engine (splitter, floats, pins, sheet), rules, and fourteen window bodies. Extract on the seams that already exist in the comments: `Desk.jsx` (panels/floats/pins/splitter/connectors), `rs-rules.js` (all `RS_*` constants), `windows/*.jsx` (one file per window). No behaviour change; this is what makes B.3 and Part C reviewable PRs rather than another improvised landing.

---

## Part C - Interlink lines: why you keep asking and it keeps not shipping

[§C.1] **Finding: the current implementation is deliberately a single-line MVP, and its own guard conditions are why you rarely see it.** `LINK_RULES` (:937) defines exactly **two** tabs (`ad`, `duties`), each with exactly **one** left selector and **one** right selector, keyed off `activeSpan`/`focusSkill`. The `useLayoutEffect` (:1626-1651) then draws **one** `<svg>` line (:1881) and bails to `null` whenever: no span is active, either endpoint is missing from the DOM, either endpoint is scrolled outside the desk viewport, or either window is floated/off-tab. So the observed behaviour - "asked for interlink lines between left and right panels (multiple panels) but not done" - is accurate: multiple simultaneous lines were never in scope, multi-panel (floats, pinned slide-overs) was explicitly excluded, and the single line self-erases under common conditions. The honesty principle (never point at nothing) was applied so conservatively it reads as absence.

[§C.2] **Remediation - connector spec (LC1).** Generalise from *one active line* to *a set of live links*:

1. **Link model.** `links = deriveLinks(tab, result, state)` returns `[{ id, fromWin, fromSel, toWin, toSel, kind, weight }]`. Sources stay deterministic - duty↔comment pairs, duty↔OIA card, skill-pill↔graph node, PB1 row↔provenance source. No LLM authors a link; every link is a join on ids that already exist in the data.
2. **Anchor contract.** Each window declares its anchors in the B.3 registry; `deriveLinks` composes only declared anchors, so a missing selector is a build-time lint failure, not a silent runtime `null`.
3. **Rendering.** One SVG overlay per desk, `pointer-events: none`, drawing **all** links whose two endpoints are currently measurable - not just the active one. Active link: full opacity, 2px; sibling links: 30% opacity, 1px. Cubic bezier, not straight lines, so multiple links stay legible.
4. **Multi-panel endpoints.** Floated windows and the pinned slide-over are valid endpoints: measure against `window` coordinates when either end is a float, against the desk rect otherwise. A link to an off-tab window degrades to an **edge stub** - a short tick at the panel border with a count badge - instead of vanishing. Clicking the stub opens/activates the target window. This keeps the never-point-at-nothing rule while ending the disappearing-line behaviour.
5. **Recompute policy.** Keep the existing `getBoundingClientRect` + resize/scroll-capture approach, add a `ResizeObserver` on the two panel scrollers, and throttle with rAF. The current single-shot `requestAnimationFrame(recompute)` misses late layout (fonts, images) - observe instead of guessing once.
6. **Tabs covered.** `ad` (span↔comment), `duties` (duty↔OIA, duty↔AI-trace row), `overview` (PB1 row↔provenance chip source), `market` (skill pill↔graph node via `RoleGraph` exposing `data-node-anchor`). Four tabs, all deterministic joins.

[§C.3] **Acceptance tests:**
- On the `ad` tab with three accepted comments visible, three dimmed lines plus one active line render simultaneously.
- Float the comments window: the line follows the float in real time while dragging.
- Scroll a comment out of view: its line degrades to an edge stub with badge, never disappears entirely while its partner is visible.
- `prefers-reduced-motion` suppresses line transition animation but not the lines.

---

## Sequencing

PR 1 - Part B.4 file split (mechanical, no behaviour change). PR 2 - Part B.3 registry + rules module. PR 3 - Part C connectors (depends on the registry's anchor contract). PR 4 - Part A pipeline DAG (independent of B/C; can run in parallel with PR 2-3 as it touches `App.jsx` orchestration only). Each PR carries its acceptance test in the header per house convention.

*AI-assisted; human decides.*
