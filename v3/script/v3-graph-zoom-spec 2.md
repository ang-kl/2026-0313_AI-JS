(№ 1 - 18-06 '26 16:40 SGT)

# SG Career View v3 - CO2.2 Graph semantic-zoom + workflow layout spec ("a fluid, explorable map - same nodes, same numbers")

> **Target repo path:** `v3/script/v3-graph-zoom-spec.md` (build `.md` files live in `v3/script/`; locked-contract docs stay in `doc/`).
> **Status:** READY_FOR_BUILD. **Proposed version:** v3.0.91 (G1 confirmation gate, Rule V-1 - do not bump without Human Lead sign-off; flat patch line per the result-engine spec §11 AU-7).
> **Contract alignment:** the v3 locked contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) and the frozen door (`v3-result-engine-spec.md` §1) bind every line. This slice is **presentation-only**: it authors NO number, ranking or verdict, mints NO data, calls NO LLM. Deterministic = control; LLM = advisory only.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R005 grep-globals, R006 no multi-line async arrow in JSX prop, R007 ASCII-only) bind this spec.

---

## §1. Scope

One slice: upgrade `KGGraph` (`v3/src/RoleGraph.jsx`) - the knowledge-graph render reused by both the company "AI moments" view (CO2 `companyAgentsToKgPayload`) and the role KG (KG3) - from a static node dump into a **fluid, explorable map**. Two additions, both opt-in toggles over the SAME payload:

1. **Semantic zoom / level-of-detail (LOD)** on the force ("neural") view: at the overview only the high-level hubs render; as the user zooms/pans in, the recurring-duty tier and then per-node detail fade and scale in. Positions stay fixed (seeded `_forceLayout`); only opacity and scale animate.
2. **A "workflow / streamline" layout** (`layout="workflow"`): a deterministic left-to-right DAG laying the three tiers in columns (functions | recurring duties | agent candidates), edges flowing left -> right. The user toggles `lanes <-> force(neural) <-> workflow`.

The cluster-lane LIST view (`layout="lanes"`) stays the default and the keyboard / screen-reader path, untouched. The frozen door is not opened: no engine, no `buildCompanyAgents`, no `companyAgentsToKgPayload`, no `buildKnowledgeGraph`, no `parseJobAd`, no `_forceLayout` determinism is edited. All change is additive props on `KGGraph` plus new self-contained helpers in the same file, with one minimal `App.jsx` toggle-control widening.

---

## §2. Radicality band

**ADDITIVE (presentation-only).** Justification (spec §3 taxonomy): no data source changes, no number is authored, no architecture is rewritten. `KGGraph`'s `layout` prop widens from `"lanes" | "force"` to `"lanes" | "force" | "workflow"` (back-compatible default `"lanes"`); new LOD + pan/zoom + workflow helpers are added inside `RoleGraph.jsx`; the lanes path and `_forceLayout` are byte-frozen. No graph library is added (no d3-force / cytoscape) - the existing deterministic `_forceLayout` supplies coordinates and a self-contained SVG-group transform supplies pan/zoom. Both CO2 and role-KG callers keep working with zero required prop changes.

---

## §3. Change map (file by file, real symbols)

"Touch" = edit; "Add" = new; "Freeze" = leave byte-identical.

### `v3/src/RoleGraph.jsx`
- **Touch** `export function KGGraph({ kg, onNodeTap, layout })` (~line 294): widen `effectiveLayout` to accept `"workflow"`. Current line `const effectiveLayout = layout === "force" ? "force" : "lanes";` becomes a 3-way resolve (`"force" | "workflow" | "lanes"`, default `"lanes"`). Render `KGWorkflowView` when `effectiveLayout === "workflow"`. No other `KGGraph` body logic moves; `handleNodeClick`, `isHighlighted`, the lanes block, `KGEdgesPanel`, `KGFooter`, `byCluster` all stay.
- **Touch** `function KGForceView({ kg, traced, onNodeClick, isHighlighted, wide })` (~line 419): wrap its existing SVG + absolute-positioned node buttons in a **pan/zoom viewport** (a transformed `<g>`/wrapper) and apply the **LOD visibility rule** (§5) to each node and edge. Positions from `_forceLayout` are unchanged - only a viewport `transform: translate(panX,panY) scale(z)` and per-node `opacity`/`scale` driven by the LOD band are added. Add the zoom/fit controls (§6).
- **Add** `_workflowLayout(nodes, edges, width, height)` - deterministic tier->column, within-column rank-ordered coordinate map (§7). Pure function, no `Math.random`, no `Date`/`performance` read. Mirrors `_forceLayout`'s "presentation only, excluded from R-SNAPSHOT" header.
- **Add** `function KGWorkflowView({ kg, traced, onNodeClick, isHighlighted, wide })` - renders the SAME nodes/edges/side-panel via `_workflowLayout`, sharing the §6 pan/zoom viewport and §5 LOD rule. Left-to-right orthogonal edge paths.
- **Add** `_lodBand(zoom)` - pure `z -> 0|1|2` band selector (§5 thresholds), R005-greppable const table `LOD_BANDS`.
- **Add** `_nodeTier(node)` - maps a node to its tier rank for LOD + workflow column: CO2 `cluster in {functions,agents}` -> hub tier; `cluster === "duties"` -> mid tier; role-KG fallback by `type` (§5, §7). R005-greppable const `KG_TIER_OF_CLUSTER`.
- **Add** R005-greppable consts: `ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_STEP`, `ZOOM_WHEEL_K`, `LOD_BANDS`, `LOD_NODE_CEILING`, `KG_TIER_OF_CLUSTER`, `WORKFLOW_COL_GAP`, `WORKFLOW_ROW_GAP`. Define near `_forceLayout` (~line 213).
- **Freeze** `_forceLayout` (~217-282) - its seeded grid init, force constants and iteration cap are byte-identical; the viewport only reads its output. `readKgPayload`, `BakedGraph`, `KGNodeCard`, `KGEdgesPanel`, `KGFooter`, `KG_CLUSTER_COLOR`, `KG_TYPE_STYLE` unchanged (the workflow/force views reuse `KG_TYPE_STYLE` / `KG_CLUSTER_COLOR` for node colour).

### `v3/src/App.jsx` - minimal wiring (Touch only)
- **Touch** `const [agentLayout, setAgentLayout] = useState("lanes");` (~line 11397): comment widens to `"lanes" | "force" | "workflow"`. State type is already a string - no structural change.
- **Touch** the CO2 toggle button (~line 11611, the `setAgentLayout(l => l === "force" ? "lanes" : "force")` two-state flip): replace the single button with a **3-way segmented control** (Lanes | Neural | Workflow), each a 44px-min control with `aria-pressed`. The control passes the chosen value straight to the existing `<KGGraph ... layout={agentLayout} />` (~line 11652) - no other CO2 wiring moves. `handleAgentNodeTap`, `CompanyAgentSidePanel`, the SAT panel, the Prov footer all stay.
- **Freeze** `buildCompanyAgents`, `companyAgentsToKgPayload`, the payload shape, `COMPANY_AGENT_MAX_AGENTS`, `COMPANY_AGENT_MAX_DUTIES`. The role-KG caller `<KGGraph kg={kg} />` (~line 9573) keeps its default `"lanes"` - zero change.

### Out of scope (explicit)
- No new top-level nav, no `?view=` route, no `main.jsx` change.
- No per-node re-simulation on zoom (positions are fixed by the seeded layout; zoom only moves the viewport + switches LOD band).
- No global-vault / cross-company graph: bounded to the current payload (CO2 capped to <=8 agents / <=15 duties, or one role's KG).

---

## §4. Grounded-in (source per claim)

This slice authors no analytic claim - it re-presents an existing payload. The "grounded-in" is therefore the **provenance of the payload it renders** (unchanged) plus the **interaction-design precedents** for the two new presentations:

| Element | Grounded in |
|---|---|
| Nodes / edges / verbs / clusters / scores | the existing `companyAgentsToKgPayload` (CO2 - `source: "mcf"` company categories, `source: "derived"` cluster+rank) and `buildKnowledgeGraph` (role KG) payloads. No new value minted; every node keeps its `source` + `confidence`. |
| Semantic zoom / level-of-detail | established cartographic + graph-UI pattern (progressive disclosure by zoom; Obsidian / Kepler.gl / Gephi "level-of-detail"). Cited as an **interaction pattern**, not a data source - it changes nothing about what is shown, only when. |
| Left-to-right workflow / streamline DAG | layered-DAG / Sugiyama column assignment (tier -> layer, ordered within layer). Cited as a **layout algorithm**, deterministic given the payload. |
| Tier ranks (functions -> duties -> agents) | the CO2 tier model already emitted by `companyAgentsToKgPayload` (`cluster in {functions,duties,agents}`). The workflow columns ARE those tiers; no re-ranking, no new tier invented. |

No claim here needs a `[UNVERIFIED]` mark because no claim is made: presentation re-arranges provenanced nodes and never asserts a new fact.

---

## §5. Semantic-zoom band rules (LOD)

The force ("neural") and workflow views share one LOD rule keyed on the viewport zoom `z`. Positions are fixed; LOD only sets per-node/edge `visible` + target `opacity`/`scale`. Bands (`LOD_BANDS`, R005-greppable):

| Band | Zoom range | Nodes rendered | Edges rendered |
|---|---|---|---|
| **L0 overview** | `z < 0.9` | hub tier only: CO2 `cluster in {functions, agents}`; role-KG `type in {role, occupation, organisation}` (via `_nodeTier -> 0`) | only hub<->hub edges (both endpoints tier 0) |
| **L1 structure** | `0.9 <= z < 1.6` | L0 hubs + mid tier: CO2 `cluster === "duties"`; role-KG `type in {duty}` (`_nodeTier -> 1`) | edges where both endpoints are tier <= 1 (the function -> duty and duty -> agent backbone) |
| **L2 detail** | `z >= 1.6` | all nodes incl. leaf tier: role-KG `type in {skill, qualification, mirror-occupation}` (`_nodeTier -> 2`); CO2 has no tier-2 node, so L2 == L1 set + full opacity | all edges |

Thresholds: `ZOOM_MIN = 0.5`, `ZOOM_MAX = 3.0`, band cuts at `0.9` and `1.6` (consts in `LOD_BANDS`). `_lodBand(z)` returns `0 | 1 | 2`.

**Fluid transition (deterministic positions, animated appearance only):**
- A node is *eligible* at zoom `z` iff `_nodeTier(node) <= _lodBand(z)`.
- Eligible nodes render at full layout position with `opacity: 1`; near a band edge they ease in via CSS `transition: opacity .18s ease, transform .18s ease` (so a duty node fades+scales in as `z` crosses `0.9`). Ineligible nodes render `opacity: 0` and are removed from the tab order (`tabIndex={-1}` / not rendered as focusable) so they are not a hidden keyboard trap.
- No re-layout, no `requestAnimationFrame` physics on zoom - the transition is pure CSS on opacity/scale; the `x,y` from `_forceLayout`/`_workflowLayout` never change with `z`.

**Node-count ceiling (auto-collapse to hubs):** `LOD_NODE_CEILING = 60`. If `kg.nodes.length > LOD_NODE_CEILING`, the view *opens* clamped at L0 (overview, hubs only) regardless of initial zoom, so a dense graph never paints every node at once. CO2 capped data (<=8 agents + <=15 duties + functions, typically <40 nodes) sits under the ceiling; the ceiling guards a future denser role KG. Below the ceiling the view opens at L1 (so the duty backbone is visible without zooming), matching today's force view density.

**Reduced motion:** under `prefers-reduced-motion: reduce`, all `transition` durations are set to `0s` (consts gate the duration); LOD still switches discretely on zoom, but nodes appear/disappear without the ease. No animation runs.

---

## §6. Pan/zoom interaction model

A single viewport transform on the SVG group + the absolute-positioned node layer; **no per-node re-simulation**. State: `{ zoom, panX, panY }` held in `KGForceView`/`KGWorkflowView` (one `useState`), applied as `transform: translate(${panX}px,${panY}px) scale(${zoom})` on a wrapper around both the `<svg>` edge layer and the node-button layer (they must share one transformed parent so edges and nodes stay registered).

| Input | Action | Detail |
|---|---|---|
| Wheel | zoom toward cursor | `zoom' = clamp(zoom * (1 + sign(-deltaY)*ZOOM_WHEEL_K), ZOOM_MIN, ZOOM_MAX)`; adjust pan so the point under the cursor stays fixed. `preventDefault` only inside the graph box. |
| Pinch | zoom | two-pointer pinch maps to the same `zoom` clamp (pointer events; no library). |
| Drag (pointer down + move on background) | pan | updates `panX/panY`; dragging on a node still fires its tap (drag threshold > 4px to distinguish pan from tap). |
| Keyboard `+` / `-` (or `=`) | zoom in/out by `ZOOM_STEP` about viewport centre | only when a graph element holds focus. |
| Keyboard arrows | pan by a fixed step | only when the graph container holds focus and no node button is focused (so Tab/arrow node traversal in lanes view is unaffected). |
| "Fit / reset view" control | reset to `{ zoom: <fit>, panX, panY }` framing all currently-eligible nodes | 44px control, `aria-label="Reset and fit graph to view"`. |

Consts (R005-greppable): `ZOOM_MIN = 0.5`, `ZOOM_MAX = 3.0`, `ZOOM_STEP = 0.2`, `ZOOM_WHEEL_K = 0.12`. Controls (zoom-in, zoom-out, fit) are 44px-min buttons with `aria-label`s, placed in a corner toolbar; no red/green. The lanes view has no pan/zoom (it is the static a11y path).

---

## §7. Workflow layout algorithm (`_workflowLayout`)

Deterministic left-to-right column DAG. Same node/edge set as force/lanes; only coordinates differ. Pure function of `(nodes, edges, width, height)`; presentation-only; excluded from R-SNAPSHOT.

```
_workflowLayout(nodes, edges, width, height):
  1. column(node) = _nodeTier(node)            # 0 functions, 1 duties, 2 agents (CO2)
                                                # role-KG: 0 hubs, 1 duties, 2 leaves
     colCount = max tier present + 1
  2. colX(c)  = WORKFLOW_COL_GAP * (c + 0.5) capped to width   # evenly spaced columns
  3. within each column, order rows deterministically:
       primary key   = rank desc, where rank =
                         CO2 agents -> ag.score (node.confidence carries "score N", but use
                                       edge.weight of the incoming "could become" edge -> the
                                       deterministic score already in the payload),
                         CO2 duties -> incoming "recurs in" edge.weight (recurrence) desc,
                         CO2 functions / role hubs -> count of outgoing edges desc,
       tie-break     = node.id localeCompare   # total order, no Math.random
  4. rowY(r, n) = WORKFLOW_ROW_GAP * (r + 0.5), vertically centred within height
  5. return pos = { [id]: {x: colX(column), y: rowY(rowIndex, colSize)} }
```

Notes:
- No new number is read or minted: ordering reuses the `edge.weight` / out-degree already in the payload (the same values the lanes/edges panel shows). Sorting is not authoring.
- Edges drawn as orthogonal left->right paths (`M x1 y1 H midX V y2 H x2` style) so the streamline reads as a flow; verb labels kept (`e.verb`) as in `KGForceView`.
- Consts: `WORKFLOW_COL_GAP`, `WORKFLOW_ROW_GAP` (R005-greppable). Column width derives from `width / colCount` if `WORKFLOW_COL_GAP * colCount` would overflow.
- LOD (§5) applies identically: at L0 only the hub columns paint; duty column fades in at L1.

`_nodeTier(node)`:
```
KG_TIER_OF_CLUSTER = { functions:0, agents:0, duties:1,
                       individual:0, department:0, organisation:0, competition:1, unscoped:1 }
_nodeTier(n):
  if n.cluster in KG_TIER_OF_CLUSTER: return KG_TIER_OF_CLUSTER[n.cluster]
  # role-KG type fallback
  if n.type in {role, occupation, organisation}: return 0
  if n.type in {duty}: return 1
  return 2   # skill, qualification, mirror-occupation -> leaf
```
(CO2 `agents` map to tier 0 as a HUB on the LOD axis - they are the headline candidates the overview must show - while remaining the rightmost workflow column. The workflow `column` uses the CO2 tier order functions(0) | duties(1) | agents(2); LOD `_nodeTier` treats functions+agents as hubs. To keep both readings, `_workflowLayout` uses a dedicated `_workflowColumn(node)` = `{functions:0, duties:1, agents:2}` for X placement, and `_nodeTier` for LOD visibility. Both are deterministic const-table lookups.)

---

## §8. Acceptance

Use the in-repo fixtures only - no invented test data.

**Deterministic unit checks (mocked payload, no network, no LLM):**
1. `_workflowLayout(nodes, edges, W, H)` on a mocked CO2 payload (3 functions, 5 duties, 4 agents) returns: every functions node `x` < every duties node `x` < every agents node `x` (strict column separation); within a column, row order is `rank desc, id localeCompare`; two runs return byte-identical `pos`. No `Math.random` / `Date` reachable (grep the function body).
2. `_lodBand(z)` returns `0` for `z in {0.5, 0.89}`, `1` for `z in {0.9, 1.59}`, `2` for `z in {1.6, 3.0}`.
3. LOD visibility: with `_lodBand(z)=0`, only nodes where `_nodeTier(n)===0` are eligible (CO2: functions + agents; duties hidden). At `_lodBand(z)=1`, duty nodes become eligible. Assert eligible-set membership on the mocked payload.
4. Node-count ceiling: a mocked payload with `nodes.length = 61` opens clamped at L0 (`initialBand === 0`); `nodes.length = 40` opens at L1.
5. `_forceLayout` output is byte-identical to `main` for the mocked payload (freeze assertion - the viewport must not have touched it).

**Live verify on preview (desktop + mobile)** - company "AI moments" panel for a sampled employer, and one role KG (`?view=graph` with a payload):
- Default view is **Lanes** (a11y/keyboard path) - unchanged from today.
- Toggle to **Neural**: overview shows function + agent hubs only; wheel/pinch-in fades the recurring-duty tier in, then (role KG) skills; pan by drag; `+`/`-`/arrows work when the graph holds focus; "fit" control reframes; tapping a node still opens `CompanyAgentSidePanel` / trace.
- Toggle to **Workflow**: three columns left->right (functions | recurring duties | agent candidates), edges flow left->right with verbs; same side panel.
- Determinism asserted: re-render the same payload -> identical node positions in both force and workflow (no jitter); no number on screen changed by the view switch (the QoI / score / recurrence chips read identically across Lanes/Neural/Workflow).
- A11y: no red/green; all controls 44px; `aria-label`/`aria-pressed` on the 3-way toggle and zoom controls; under `prefers-reduced-motion` no easing runs (LOD still switches). Lanes stays the screen-reader path.

**Fixtures:** Metta `2320493d0e875075d4dbfa6a893b3fdb` (role KG / Leap default), NHG `2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md`, PSD `2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (`v3/Sample/`), plus any live CO2 employer match for the company tier graph.

---

## §9. Non-inventive gates (spec §6)

Applicable hard gates:
- **Gate 1 (no LLM string -> number):** N/A by construction - this slice makes no LLM call. Assert no `claudeCall` is added in the diff.
- **Gate 2 (Prov chip on every figure):** every node keeps its existing `source`/`confidence` chip (rendered by `KGNodeCard` / the force-node styling / the new workflow node); the view switch never strips a chip.
- **Gate 5 (determinism):** same payload -> identical positions (force + workflow); LOD bands are a pure function of zoom. Asserted in §8.1-§8.5.
- Gates 3, 4 (withhold / range): N/A - no number is computed or rounded here; the existing `kg.withheld` notice still renders.

**Audits:**
- **D1-D8 (static prompt-syntax audit): N/A.** This slice adds no prompt and edits no prompt template - there is nothing for D1-D8 to inspect. State explicitly in the HDR.
- **G1-G8 (live governance diagnostic): applies, lightly.** Run G2 (Prov chip present after each toggle), G5/G7 (determinism: same payload, identical positions and identical on-screen numbers across the three views) on the live read. G1/G3/G4/G6/G8 are inherited-pass (no number authored, nothing withheld differently, engine untouched).

**R-FREEZE:** before packaging, assert byte-identity of the frozen symbols: `buildCompanyAgents`, `companyAgentsToKgPayload`, `buildKnowledgeGraph`, `parseJobAd`, `_forceLayout`, `COMPANY_AGENT_MAX_AGENTS`, `COMPANY_AGENT_MAX_DUTIES`, and the lanes-view block of `KGGraph`. **R005:** grep the new consts (`ZOOM_*`, `LOD_BANDS`, `LOD_NODE_CEILING`, `KG_TIER_OF_CLUSTER`, `WORKFLOW_COL_GAP`, `WORKFLOW_ROW_GAP`) plus the existing globals list before packaging. **R006:** any multi-line wheel/pointer handler used as a JSX prop is extracted to a named function. **R007:** ASCII only in new JSX strings (hyphens, never em/en dash); arrows in copy written as `->`.

---

## §10. Pre-mortem (spec §9 shape)

| Risk | Likelihood | Guard |
|---|---|---|
| Edge layer and node layer drift apart under the viewport transform (edges no longer touch nodes) | Med | both layers share ONE transformed parent `<g>`/wrapper; unit-render check that an edge endpoint equals its node centre at `zoom=1, pan=0`; never transform them separately |
| LOD hides nodes from the keyboard but leaves them tab-focusable (hidden trap) | Med | ineligible nodes are not rendered focusable (`tabIndex={-1}` or unmounted); lanes view (full a11y path) stays the default; live SR check |
| Workflow ordering reads an `ag.score`/recurrence value and is mistaken for authoring a new number | Low | ordering reuses payload `edge.weight` / out-degree only; sort is not authoring; §8.1 asserts no `Math.random`/`Date`; numbers on screen identical across views (§8 live) |
| Wheel-zoom hijacks page scroll on mobile / inside a scroll container | Med | `preventDefault` only when the pointer is inside the graph box and a zoom gesture is active; pinch via pointer events; "fit" control as the escape hatch |
| Dense future role KG paints every node at L2 and janks | Low-Med | `LOD_NODE_CEILING = 60` clamps a large graph to L0 on open; CO2 capped data sits well under it |
| Reduced-motion users get animation anyway | Low | a single `prefers-reduced-motion` check zeroes all transition durations; LOD still switches discretely (no motion) |
| Frozen symbol drift during the `KGGraph` edit (e.g. `_forceLayout` constant nudged) | Low | R-FREEZE byte-identity gate + §8.5 freeze assertion before packaging |

---

## §11. Proposed R-rule (observed pattern, propose - do not assume)

**R012 (propose):** *viewport-transform layers share one parent.* When a pan/zoom transform is applied over an SVG edge layer and an HTML node layer that must stay visually registered, both layers MUST be wrapped in a single transformed parent; never apply the same transform to two sibling layers independently (rounding + reflow desync them). Confirmation: an edge endpoint equals its node centre at identity transform. Surface to the Human Lead at build; do not silently adopt.

---

## §12. Version-bump gate

On landing: surface `Rule V-1 / G1` to the Human Lead - `CO2.2 fired: graph semantic-zoom + workflow layout. Prescribed: bump v3.0.90 -> v3.0.91 (minor feature, presentation-only). Confirm? (yes/no/modify)`. On yes: R003 x3 (`App.jsx` line-1 header, `index.html` title, `package.json`), HDR journal, `.serial-state.yml` bump.

```
[HDR] #NNN | HH:MM:SS SGT 18-6-26 | v3.0.91 | NNNkb | N,NNN lines
[INTENT] CO2.2 - KGGraph semantic-zoom (LOD) + workflow layout; 3-way lanes/neural/workflow toggle
[DELTA] RoleGraph.jsx: +_workflowLayout +KGWorkflowView +LOD/pan-zoom in KGForceView, layout widened; App.jsx: 3-way toggle
[RISK] Low - presentation-only; no number authored; _forceLayout + frozen door byte-frozen
[STATUS] BETA
[TEST] unit: _workflowLayout column/order determinism + _lodBand bands + node-ceiling; live: lanes default, neural LOD, workflow columns on Metta/NHG/PSD + a CO2 employer; D1-D8 N/A (no prompt); G2/G5/G7 pass
[NEXT] confirm v3.0.91 + which CO2 employer to live-verify
[ADVICE] keep edge+node in one transformed parent (R012) - desync is the first failure mode
```

---

**STATUS: READY_FOR_BUILD** - next agent: `result-engine-builder`. Do not author implementation code beyond this spec; build against §3 symbols, gate on §8-§9.

*End of spec.*
