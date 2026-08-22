# Claude Code briefs - remediation arc kickoff

10-07 '26 22:19 SGT · companion to `v3-workflow-and-step3-remediation-spec.md` · propose-first per `doc/CLAUDE-FULL.md`

## Run order

[§0.1] Tonight, two parallel sessions: **Session A (PR 1)** and **Session B (PR 4)** - disjoint files, no merge conflict risk. **PR 2 and PR 3 are gated** behind your review of PR 1. **§0.2 open questions from #359 are NOT delegated** - they need a Human Lead framing decision into a spec slice before any build.

---

## Session A - PR 1: ReviewStudio file split (mechanical, behaviour-neutral)

Paste into Claude Code from repo root:

```
Read v3/doc/CLAUDE-FULL.md first and operate propose-first: show me the extraction plan before touching any file.

Task: mechanical decomposition of v3/src/ReviewStudio.jsx (currently ~2,013 lines) with ZERO behaviour change. Reference spec: Part B.4 of the remediation spec (I will paste it if you ask).

Extract on these seams:
1. v3/src/review/rs-rules.js - every RS_* constant (RS_RESP_RE, RS_TIME_LINE, RS_COMPLIANCE, RS_HALF_LIFE, the blind-spot rule list at ~:496, and siblings). Add a single exported RS_RULES_VERSION string.
2. v3/src/review/Desk.jsx - the layout engine only: splitter, floats, pinned slide-overs, bottom sheet, dock drag, connLine SVG overlay and LINK_RULES (moved verbatim - PR 3 will extend them, do not improve them now).
3. v3/src/review/windows/*.jsx - one file per window body (winVerdict ... winInspector, 14 files). renderWindow stays as-is, importing them.

Constraints:
- No renaming of ids, data-attributes, or localStorage keys (v3.state.boards etc.).
- No new dependencies. No formatting sweep of untouched lines.
- Acceptance: `npm run build` clean; git diff of the reassembled render output is import-shuffling only; the Step 3 page renders identically on the ad and duties tabs against one golden posting.
- Version bump per house G-gate convention; hyphens not em dashes in all comments and the PR body.

Stop after presenting the plan. Wait for my go before editing.
```

---

## Session B - PR 4: pipeline DAG parallelisation (App.jsx only)

```
Read v3/doc/CLAUDE-FULL.md first and operate propose-first.

Task: restructure the post-results background pipeline in v3/src/App.jsx (~:15880-15990) from a nested .then chain into dependency-true parallel starts. Reference: Part A of the remediation spec (§A.1-A.7).

Changes:
1. buildResponsibilitiesData resolves progressively: expose an early jobs-landed promise and the final responsibilities promise (or split at that seam).
2. jobAnatomy starts on jobs-landed, not on full rd. roleGraph's posting path starts on the posting immediately, racing/merging with the corpus fallback on responsibilities. criticalRead and ssocGraph stay gated on responsibilities (correct today).
3. foundation (~:15852) moves off the critical path - fire in parallel with the core Promise.all, joining before setStep("results") only if its data is needed for first paint; otherwise patch in like the other fronts.
4. Inside buildRoleGraph (~:3456): Promise.all analyseRolePipeline and getRoleMixCandidates (independent inputs); scoreIscoCandidates joins them.
5. claudeCall queue (~:1822): add a two-tier priority - interactive calls jump the FIFO; background enrichment takes leftover slots. Keep CLAUDE_MAX_CONCURRENT = 10.

Do NOT touch: bgLogStep front-narration semantics (AN1, #364), the withhold/fallback logic inside any builder, or any prompt text.

Acceptance (must show me debug-panel evidence): with a picked posting, jobanatomy and rolegraph logStep start-timestamps precede the responsibilities ok completion timestamp. No new fabricated progress states.

Stop after presenting the plan. Wait for my go.
```

---

## Gated - fire only after PR 1 review

[§G.1] **PR 2 (window registry)** - declarative WINDOWS array with id/label/tabs/side/render/anchors per Part B.3; renderWindow, TAB_WINDOWS, dock strips derive from it. Anchor contract is the input PR 3 needs.

[§G.2] **PR 3 (multi-connector lines, LC1)** - brief must open with: "This EXTENDS the connector generalisation landed in #358 (v3.0.275) - read that diff first; do not rewrite the drawer or the existing single-line honesty guards, generalise them per Part C.2 items 1-6." Acceptance tests from §C.3 verbatim.

## Held by Human Lead - not delegated

[§H.1] #359 §0.2 open question 1 (AI-capability currency discipline) and question 2 (interview stickiness): decide the framing, write each as a spec slice in v3/script/ via /goal, then brief. Delegating "resolve these" to Claude Code now reproduces the improvised-landing failure the reconciliation audit documented.

*AI-assisted; human decides.*
