(№ 133 - 04-07 '26 SGT)
<!-- Serial N assumed = 133 (next after v3-flow-realign-spec's No 132). Human Lead to reconcile against the serial-state counter per R011. -->

# SG Career View v3 - SSOC-grounded second role-graph (`SSOCRG` arc)

> **Target repo path:** `v3/script/v3-ssoc-rolegraph-spec.md`.
> **Proposed versions:** SSOCRG-1 -> **v3.0.<N>**, SSOCRG-2 -> **+1**, SSOCRG-3 -> **+2**, SSOCRG-4 -> **+3**. Flat patch line; one PR per slice, version bump + journal entry each.
> **G1 gate:** this spec is the gate. Build a PR only when its STATUS reads READY_FOR_BUILD and its open questions are cleared.
> **Status:** **READY_FOR_BUILD.** Human Lead decisions (2026-07-04): **SSOCRG-Q1 = ESCO-crosswalk only** (skills via SSOC->ISCO->ESCO, anchored on the correct occupation; no SSOC-native extraction layer). **SSOCRG-Q2 = ESCO stays default; SSOC is an opt-in toggle.** Build consolidated into 2 PRs (see SSOCRG4).
> **Contract alignment:** locked v3 contract - deterministic = control, LLM = advisory only (no LLM authors an occupation, a skill, a code or a score); non-inventive (every node maps to a named source, withheld over guessed); true fidelity (a crosswalked / partial mapping is disclosed as such, never dressed as exact). Frozen door binds. Red/green never load-bearing; 44px targets; ASCII-only JSX; honesty footers.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead.

---

## SSOCRG0. Scope (one paragraph)

Add a **second, SSOC-grounded role-graph** that renders **alongside** the existing ESCO role-graph - not replacing it. The current graph resolves a role by a blind ESCO (EU taxonomy) title top-hit and mis-classifies Singapore roles badly: live evidence (2026-07-04) shows "Sales Assistant Manager" (real MCF sales duties) mapped to ISCO "Communication Scientist" with ESCO skills "Publish Academic Research / Conduct Quantitative Research / Scientific Research Methodology". The second graph anchors on **SSOC 2024** (SingStat, Singapore's own occupational classification) via the **already-correct deterministic SSOC classifier** (`api/ssoc.js`, the one fixed this session that nailed Auxiliary Police Officer -> 54123), then draws skills for the **right** occupation. It appears as a **third toggle** ("SSOC graph") in the existing `RoleGraphPanel`, next to Layered and Knowledge graph. Additive only; the ESCO graph stays byte-identical.

## SSOCRG1. Why a SECOND graph, not a replacement

- The ESCO layered graph + the KGGraph knowledge view are stable, tested, and are the "V2 fast read" the blueprint protects. **Do not touch them** (frozen door - see governance).
- ESCO is genuinely useful *when it resolves right* (skill structure, transferability). The failure is the **resolution step** (blind title top-hit), not the taxonomy. Rather than re-plumb the frozen ESCO path, we add a parallel graph that resolves Singapore-first and can draw skills for the correct occupation - and let the user compare the two side by side.
- **Human Lead directive:** "second role-graph. Remember second role-graph." This arc builds exactly that: an additive, toggle-selected second view.

## SSOCRG2. The pipeline (deterministic-first)

Every step is deterministic unless flagged. No LLM authors an occupation, a skill, a code, or a score.

1. **Resolve the occupation (Singapore-correct).** Feed the role title to `api/ssoc.js` `classifyTitles` (the existing deterministic classifier; `classifySsocJob` -> `scoreSsocCandidate`, exact-title match now wins outright per the v3.0.210 fix). Returns `{ status, node:{code,title,definition,tasks,examples}, hierarchy:{major,sub_major,minor,unit_group}, family, confidence, candidates[] }`. **Withhold** the whole SSOC graph when `status==="withheld"` (low confidence) - never fabricate an occupation. This is the step that fixes the mis-resolution: "Sales Assistant Manager" resolves to a real SG sales-management SSOC code, not a researcher.

2. **Occupation node + hierarchy (SSOC-native).** From the classified node: the SSOC title, its verbatim definition, its tasks/examples (note: many SSOC `tasks` arrays are empty in the source data - handle sparsity), and the occupation-family chain major -> sub-major -> minor -> unit group. Prov: **from SSOC** (SingStat). Source-verbatim.

3. **Skills (the SSOCRG-Q1 fork - see open questions).** Two grounded sources, both anchored on the CORRECT occupation (never a blind title search):
   - **(a) SSOC-native** - deterministic phrase extraction from the occupation's own definition + tasks + examples text (same idiom as the existing token/phrase helpers). Singapore-native, coarser, sparse for thin definitions. Prov: **derived** (from SSOC text).
   - **(b) ESCO via crosswalk** - `SSOC2024_ISCO[code]` (`engine-data/ssoc2024-isco.js`, already imported in App.jsx) -> ISCO-08 code -> ESCO essential skills for **that ISCO occupation** (not the title). This is the crucial difference from the current graph: ESCO skills for the RIGHT occupation. Prov: **from ESCO (crosswalked)**. Disclose the crosswalk's `partial` flag; withhold when the mapping is partial/absent and low-confidence.

4. **Responsibilities (verbatim).** Reuse the real MCF duty lines already gathered by `gatherStatements(result, posting)` - the same verbatim duties the current graph uses. Prov: **from MCF**.

5. **AIOE exposure per skill (engine, honest).** `exposureForIsco(iscoFromCrosswalk)` (frozen `engine-core.js`) gives the deterministic AIOE band for the SSOC-mapped ISCO occupation - the same engine the rest of the app uses. Withhold when no AIOE score exists. No fresh number invented.

6. **Assemble a KGGraph-compatible payload** (reuse the existing `KGGraph` renderer, same as the Knowledge-graph mode). Centre = SSOC occupation; branches = occupation-family chain, skills (each labelled by source a/b), responsibilities. Every node carries a provenance chip + (skills/duties) an AIOE band by shape+label, never colour alone.

## SSOCRG3. Where it renders

- `RoleGraphPanel` (App.jsx:10398) already has `graphMode` state ("layered" | "knowledge", App.jsx:10408) with a toggle group (App.jsx:10637-10641). **Add a third mode `"ssoc"`** and a third button **"SSOC graph"** (with the SG flag glyph). `graphMode === "ssoc"` renders `<KGGraph kg={ssocPayload} />` + an SSOC header/footer.
- Header discloses: *"Grounded in SSOC 2024 (SingStat) - Singapore's own occupational classification. Resolved: <code> <title> (confidence: <high|medium>)."* Footer keeps the standing Source / Confidence / Time-window + "AI-assisted; human decides".
- Data comes from a new `result.ssocGraph` field, populated by a background fetch in `doAnalyse` (mirrors how `result.roleGraphData` / `result.criticalRead` attach) with `.catch(() => null)` so a failure just hides the SSOC toggle, never breaks the panel.

## SSOCRG4. PR sequence (consolidated to 2 per Q1/Q2 decisions)

With ESCO-crosswalk-only skills (no native-extraction layer) and ESCO-stays-default, the arc is
two cohesive PRs so the second graph is visible and verifiable on the first ship:

| PR | Goal | Key files | Engine |
|----|------|-----------|--------|
| **SSOCRG-1** | The working second graph: `fetchSsocOccupation(title)` (reuse `/api/ssoc classifyTitles`) -> `buildSsocGraph` (crosswalk `SSOC2024_ISCO` -> ISCO -> `getEscoSkills(iscoTitle)`, deterministic-gated to the ESCO path only; + verbatim MCF responsibilities; + `exposureForIsco` AIOE) -> `result.ssocGraph` payload; third `"ssoc"` `graphMode` + "SSOC graph" toggle in `RoleGraphPanel` rendering `KGGraph`, with SSOC header + honesty footer. ESCO stays the default view; SSOC is opt-in. | `src/App.jsx` (`doAnalyse` fan-out attach, new `fetchSsocOccupation`/`buildSsocGraph`, `RoleGraphPanel` toggle), reuse `api/ssoc.js`, `engine-data/ssoc2024-isco.js` | deterministic + ESCO crosswalk |
| **SSOCRG-2** | Polish: crosswalk `partial` disclosure, withhold/confidence copy, empty-tasks + no-ISCO edge cases, AIOE-withheld handling, a11y (source by label not colour), a compare-note vs the ESCO graph. | `src/App.jsx` | deterministic |

**Skill anchoring (the fix, restated for the builder):** do NOT call `getEscoSkills(jobTitle)` -
that is the blind top-hit that mis-resolves. Call `getEscoSkills(iscoTitleFromCrosswalk)` where the
ISCO title comes from `SSOC2024_ISCO[ssocCode][0].title` (a clean, ESCO-aligned occupation name).
Accept the result ONLY when it resolved via the real ESCO path (e.g. `escoResult.occupationUri`
present); if ESCO missed and it fell back to the LLM `getSkills`, **withhold** rather than pull an
LLM-authored skill list into the "deterministic" SSOC graph. Each PR: bump `v3.0.<N>` + HDR journal
+ index.html + package.json; ASCII-only JSX; frozen-door check.

## SSOCRG5. Non-inventive gates (spec contract)

- No LLM in the SSOC path at all - classification, crosswalk, extraction, AIOE are all deterministic tables/regex. (Contrast: the ESCO graph uses an LLM `analyseRolePipeline` step; the SSOC graph deliberately does not.)
- Every skill node labelled by source: **from SSOC** (native) vs **from ESCO (crosswalked)**. Never merged into one undifferentiated list.
- Withhold over guess: low-confidence SSOC classify -> no SSOC graph (toggle hidden), not a fabricated occupation. Partial crosswalk -> disclosed. Missing AIOE -> band withheld.
- True fidelity: the SSOC code, title, and confidence are shown; a crosswalked mapping is never presented as a native SSOC skill.

## SSOCRG6. Frozen door & governance (non-negotiable)

- **Never touch:** `buildRoleGraph` (App.jsx:3404), `buildGraphStructure` (3333), `getKnowledgeGraph`/`buildKnowledgeGraph` (3771), `getEscoSkills`, `resolveOccupation`, `resolveOccupationByOverlap`, `scoreIscoCandidates`, and the `api/mcf.js`/`api/esco.js`/`engine-data/engine-core.js` frozen symbols. The existing Layered + Knowledge graphs stay byte-identical.
- All new work is additive: a new `buildSsocGraph` builder, a new `result.ssocGraph` field, a new `graphMode` value + toggle, reuse of the existing `classifyTitles` endpoint and `KGGraph` renderer.
- `api/ssoc.js`'s `classifySsocJob`/`scoreSsocCandidate` are reused read-only (the v3.0.210 exact-match fix stays); no re-scoring.

## SSOCRG-Q. Open questions (Human Lead to clear before build)

- **SSOCRG-Q1 (skills source):** which of the two skill sources drives the second graph?
  - (a) **SSOC-native only** - purest Singapore, but coarse/sparse (many SSOC definitions are 1-2 sentences, tasks often empty).
  - (b) **ESCO-crosswalk only** - richer skills, ESCO-derived but anchored on the CORRECT SSOC->ISCO occupation (this alone fixes the Sales->researcher failure).
  - (c) **Hybrid (recommended)** - both, each clearly source-labelled: SSOC-native first (what SingStat says the occupation does), ESCO-crosswalk second (the skill detail), so the user sees the Singapore ground truth and the richer skill map without them being conflated.
- **SSOCRG-Q2 (default graph):** when a role resolves, which graph shows first?
  - (a) **Keep ESCO Layered as default, SSOC as opt-in toggle** (least disruptive).
  - (b) **Make SSOC the default for SG roles**, ESCO as the alternate (leans into the true-fidelity fix, since ESCO is the one that mis-resolves).
- **SSOCRG-Q3 (flag, not blocking):** the ESCO graph's mis-resolution is a separate, pre-existing bug. This arc does not fix the ESCO graph - it adds a correct alternative next to it. Confirm that's the intended scope (a second graph), not a rip-and-replace of the ESCO resolver.

---

**STATUS: DRAFT** - clear SSOCRG-Q1 + SSOCRG-Q2, then READY_FOR_BUILD for SSOCRG-1..4.
**Next agent:** `result-engine-builder`, once the Human Lead sets the two decisions.
