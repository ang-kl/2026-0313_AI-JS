(№ 1 - 22-06 '26 14:30 SGT)

# SG Career View v3 - WikiGraph W1: Employer persona, wired live ("the prototype, productionized; additive at the door")

> **Target repo path:** `v3/script/v3-wikigraph-w1-employer-spec.md` (build `.md` files live in `v3/script/`; locked-contract docs remain in `doc/`).
> **Status:** READY_FOR_BUILD. **Proposed version:** `v3.0.<N+1>` (flat patch line per the §11 AU-7 directive; a single PATCH bump, G1 gate, Rule V-1 - do not bump without Human Lead sign-off). At time of writing the live build is on the flat `v3.0.<N>` patch line; the builder reads the current head from `App.jsx` line 1 and proposes the next integer.
> **Contract alignment:** the v3 locked contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) governs every line. Deterministic = control; LLM = advisory narration only; non-inventive; faithful fidelity; `[UNVERIFIED]` over a guess. House rules in `CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR, serial protocol) bind this spec; the frozen door in `v3-result-engine-spec.md` §1 binds it; R-FREEZE runs before packaging.
> **Reader priority:** (1) Claude Code (`result-engine-builder`), (2) Human Lead.

This is the first slice of the **JobAds WikiGraph** productionization arc. The static prototype at `v3/public/demo.html` (route `/demo`) proves the look: note-cards with clickable `[[wikilink]]` traversal, provenance chips, a "your next best move is..." line, and a radial graph. W1 turns the **Employer persona** from static sample data into a **wired live** experience over the EXISTING employer engines (`buildCompanyAgents` -> `companyAgentsToKgPayload` -> `KGGraph` + `CompanyAgentSidePanel`), adding only a deterministic note/wikilink layer and a render shell. It is the cheapest possible static->live proof because it reuses the live employer pipeline almost in full and authors no new number or fetch.

---

## W1.0. Scope (one paragraph)

Deliver one additive surface - **"WikiGraph - Employer"** - reachable via a new `?view=wiki` route, that presents the live CO1+CO2 employer model (matched employer + postings + recurring-duty clusters + agent candidates) as a wiki: an **Employer note**, one **Job-Ad note** per sampled posting, and **Skill/Duty note**s, all connected by clickable `[[wikilinks]]` with note-to-note traversal and backlinks, a deterministic **"your next best move is..."** line, a provenance chip per note, and the existing `KGGraph` as the embedded graph view (a wikilink click navigates note-to-note AND highlights the corresponding node in the graph). The existing `CompanyPanel` (the current employer UI) stays exactly as it is. W1 is **Employer only**; the other three demo personas (Standards/Skills, SG Jobs, Fresh Grad) and the Candidate/Org journeys are out of scope (W2-W4, named below).

---

## W1.1. Radicality band

**ADDITIVE.** Justification: W1 adds a new builder (`buildEmployerWiki`), a new render tree (the WikiGraph shell + three note renderers), and ONE new route branch in `main.jsx`. It edits zero existing live functions: `buildCompanyAgents`, `companyAgentsToKgPayload`, `KGGraph`, `CompanyAgentSidePanel`, `CompanyPanel`, `parseJobAd`, `resolveCompany`, `mcfSearch`, `api/careers`, and the `api/mcf` frozen branches are all read-only here. No new data source, no architecture rewrite (per CLAUDE-FULL §6.2 this is a MINOR feature -> stays on the flat patch line). The "radical" surface of the result-engine epic is untouched; this is purely a new presentation of an existing live model.

---

## W1.2. Entry-point decision (and why)

**Decision: a new query-param route `?view=wiki`, branched in `v3/src/main.jsx` alongside the existing `?view=leap`, `?view=graph`, `?view=spherical` pattern.**

Rationale, weighed against the alternatives:

| Option | Verdict | Why |
|---|---|---|
| **`?view=wiki` route (chosen)** | ADOPT | Mirrors the exact, already-blessed routing idiom in `main.jsx` (lines 27-29, 37: `params.get('view') === 'leap'` etc.). Adds one ternary branch; the bare `<App />` path is byte-untouched, so no existing route or in-app UI moves. A wiki is a distinct full-screen reading mode (like Leap/Graph), not a panel - a separate route is the honest shape. |
| Home toggle inside `<App />` | REJECT for W1 | Would touch the main App render tree and the home grid - higher blast radius, risks the "do not alter existing routes/UI" guard. May return as a later additive entry-point slice once the wiki is proven. |
| New path `/wiki` (pathname route) | REJECT | `main.jsx` only pathname-routes `/spherical`; adding a second pathname route is a larger change than reusing the `?view=` query convention. Keep one convention. |

The wiki view fetches the SAME live employer data the `CompanyPanel` fetches: `?view=wiki&company=<name>` triggers the existing CO1 (`action:"company"`) + CO2 (`action:"company", duties:true`) calls (reused verbatim, not re-authored), then `buildCompanyAgents` -> `buildEmployerWiki`. With no `company` param the view renders a thin employer-search entry that reuses the same query mechanism. **No new endpoint, no new fetch contract.**

---

## W1.3. The wiki node/link schema (`buildEmployerWiki(model)`)

`buildEmployerWiki(model)` is a NEW pure deterministic function in `App.jsx`. Input: the object returned by `buildCompanyAgents(matchGroup)` (the SAME model already built for `CompanyPanel` - never re-fetched). Output: `{ notes: [...], withheld: [...], nextMove: {...}|null, stats }`. It authors no number and issues no fetch; every field is a pass-through or a deterministic re-shape of `model`.

**Node (note) schema** - one object per note:

```
{
  id:         "<type>:<stableId>"     // e.g. "org:metta", "jobad:<uuid>", "duty:cluster-3", "skill:sql", "agent:agent-cluster-3"
  title:      string                  // verbatim from model (company / job title / duty repDuty / skill / agent label)
  type:       "employer"|"jobad"|"duty"|"skill"|"agent"
  wikilink:   "[[<type>:<stableId>|<label>]]"   // canonical clickable token, demo idiom
  source:     "from MCF" | "derived"  // employer/jobad title + counts = from MCF; duty/agent clusters = derived
  confidence: string                  // carried from model, never rounded away (e.g. "score 6", "promoted", recurrence)
  fields:     [[label, value]...]     // value MAY itself contain [[wikilinks]] (demo `fields` idiom)
  body:       string                  // composed ONLY from model strings; any [[wikilink]] target MUST exist in notes[]
  links:      ["<targetId>", ...]     // outbound edges, each target id MUST exist in notes[]
  backlinks:  ["<sourceId>", ...]     // computed: every note whose links[] contains this id (closure pass)
  kgNodeId:   string|null             // the id of the matching node in companyAgentsToKgPayload(model).nodes, for graph highlight
}
```

**Mapping from `model` (every node cites real postings; nothing invented):**

| Note type | One per | id | title (verbatim source) | source | links derived from |
|---|---|---|---|---|---|
| `employer` | the matched employer (1) | `org:<slug(model.company)>` | `model.company` | from MCF | every `jobad` (its postings), every `agent` (its candidates) |
| `jobad` | each distinct posting uuid in `model.clusters[].provenance` / `roleUuids` | `jobad:<uuid>` | posting `title` (from provenance `.title`) | from MCF | each `duty` whose cluster spans this uuid; each `skill` listed on the posting |
| `duty` | each cluster in `model.clusters` (capped to `COMPANY_AGENT_MAX_DUTIES`, keeping agent-backing clusters) | `duty:<cluster.id>` | `cluster.repDuty` | derived | the `jobad`s in `cluster.roleUuids`; the `skill`s in `cluster.skills`; the `agent` it backs (if promoted) |
| `skill` | each distinct skill string across `model.clusters[].skills` | `skill:<slug(skill)>` | the skill string | from MCF (verbatim posting field) | the `duty`/`jobad` notes it appears in |
| `agent` | each `model.agents[]` (already capped to `COMPANY_AGENT_MAX_AGENTS`) | `agent:<agent.id>` | `agent.label` (the existing "an agent that ..." phrase) | derived | the `duty` cluster (`agent.clusterId`) and the `jobad`s that cluster spans |

**Hard schema invariants (asserted in unit tests, W1.6):**
1. Every `id` in any `links[]` or `[[wikilink]]` in any `body`/`fields` value resolves to an `id` present in `notes[]` (no dangling links).
2. Every `jobad` / `skill` `source` is `from MCF`; every `duty` / `agent` `source` is `derived` - matching `companyAgentsToKgPayload`'s existing `source`/`source_tag` tagging (functions/skills `mcf`, clusters/agents `derived`).
3. The provenance set on any note is a SUBSET of the uuids present in the input `model` (`cluster.provenance[].uuid` / `cluster.roleUuids`). No note references a posting not in `model`.
4. `kgNodeId`, when non-null, equals an `id` in `companyAgentsToKgPayload(model).nodes` (so the graph-highlight target always exists).
5. No node is created for a cluster/agent/skill absent from `model`. The wiki is a strict re-shape; it never adds a noun the engine did not surface.

**Wikilink derivation rule (deterministic).** A `[[wikilink]]` is emitted in a note's `body`/`fields` ONLY when both the source and the target note already exist in `notes[]` (built in two passes: pass 1 creates all notes; pass 2 composes bodies + resolves links/backlinks). The label inside `[[type:id|label]]` is the target note's verbatim `title` (or a verbatim duty/skill substring), never an LLM rewrite. Backlinks are the transitive closure: `note.backlinks = [every n in notes where n.links includes note.id]`. This makes traversal symmetric and deterministic - same `model` yields byte-identical `notes[]`, link sets, and backlink sets.

---

## W1.4. "Your next best move is..." derivation rule (deterministic)

`nextMove` is computed by `buildEmployerWiki` from the CO2 ranking already present in `model` - **no LLM authors it, no new number is computed.** It is `null` (withheld) when the model is thin (W1.5).

**Rule (in order; first that resolves wins):**
1. **Top agent candidate.** If `model.agents.length > 0`, take `model.agents[0]` (the list is already rank-sorted by the frozen `buildCompanyAgents` sort: `score` desc, `aiAdjacency` desc, `recurrence` desc, `repDuty` asc). `nextMove = { kind:"agent", targetId:"agent:"+agents[0].id, line:"your next best move is to review " + agents[0].label + " - it recurs across " + agents[0].recurrence + " of this employer's sampled roles", source:"derived", prov:"derived" }`.
2. **Else, highest-recurrence human-anchored duty.** If no agent promoted but `model.clusters` is non-empty, pick the cluster with the highest `recurrence` whose `level === "HUMAN"` (ties broken by `repDuty.localeCompare` for determinism); `nextMove` points at that `duty:` note with line "...the work most likely to stay human-led here is [[duty:...]], recurring across N roles", `prov:"derived"`.
3. **Else** `nextMove = null` and the wiki shows the honest withhold line (no fabricated guidance).

All numbers in the line (`recurrence`, role count) are carried verbatim from `model`; the move never invents a ranking or a verdict. The displayed chip is `◐ derived` (the move is a deterministic re-statement of the CO2 rank, not a verbatim MCF field and not an LLM estimate). If any explanatory prose around the move were ever sourced from the LLM, it carries `~ AI estimate`, the engine value wins on any disagreement, and the LLM authors NO note, link, number, or the move target itself (engine-wins rule, spec §2).

---

## W1.5. Withhold rule (reuse CO2 thresholds; never fabricate)

W1 inherits the CO2 withhold contract WITHOUT redefining a threshold - it reads `model.withheld` and the same constants:

- If `buildCompanyAgents` returned a non-empty `model.withheld` and `model.agents.length === 0` (too few postings `< COMPANY_AGENT_MIN_POSTINGS (4)`, too few duties `< COMPANY_AGENT_MIN_DUTIES (6)`, or no cluster reaching `recurrence >= COMPANY_AGENT_MIN_RECURRENCE (2)` AND exposure `>= MEDIUM`), then `buildEmployerWiki` still emits the `employer` + `jobad` notes (those are verbatim from MCF and safe), emits NO `agent` notes, emits `duty`/`skill` notes ONLY for clusters that actually exist in `model.clusters`, sets `nextMove = null`, and surfaces `model.withheld` verbatim as the wiki's honest line ("Too few of `<employer>`'s postings carry detailed duties to read recurring AI-exposable work reliably - showing the postings only.").
- If `model` itself is the thin early-return (no clusters at all), the wiki shows the employer + postings notes and the withhold line, nothing more.
- No note, link, agent, or next-move is ever fabricated to fill a thin model. Withhold over invent (hard gate 3).

---

## W1.6. Change map (file by file; real symbols)

### `v3/src/App.jsx` - ADDITIVE
- **Add** `function buildEmployerWiki(model)` - pure, deterministic, the schema + wikilink + nextMove + withhold logic above. No fetch, no LLM, no new number. Placed near `companyAgentsToKgPayload` (~line 11579) for locality.
- **Add** `function EmployerWikiView({ companyQuery })` - the WikiGraph shell: runs the SAME CO1+CO2 fetch sequence already in `CompanyPanel.loadCompanyBoth` / `loadDuties` (reused logic, NOT a new contract), calls `buildCompanyAgents` -> `buildEmployerWiki` + `companyAgentsToKgPayload`, holds `activeNoteId` + `tapNodeId` state, renders the note column + embedded `<KGGraph kg={kgPayload} onNodeTap={...} layout="lanes" />` + `<CompanyAgentSidePanel .../>` (all reused as-is), and the `nextMove` banner. A wikilink click sets `activeNoteId` (note-to-note nav) AND sets the graph highlight to `note.kgNodeId`.
- **Add** `function EmployerNote({ note, onNav })`, `function JobAdNote({ note, onNav })`, `function SkillNote({ note, onNav })` - the three W1 note renderers. Each renders `title`, the `source`/`confidence` Prov chip (reuse the existing `Prov` chip component / `● from MCF` + `◐ derived` vocabulary), `fields`, a `body` whose `[[wikilinks]]` render as keyboard-focusable buttons calling `onNav(targetId)`, and a "Linked from" backlinks row. `DutyNote`/`AgentNote` may reuse `JobAdNote`'s frame or be thin variants - builder's choice, but only Employer/JobAd/Skill are REQUIRED renderers for W1.
- **Export** `EmployerWikiView` (named export, like `PipelineLogsView`) for `main.jsx`.
- **Freeze (read-only):** `buildCompanyAgents`, `companyAgentsToKgPayload`, `CompanyAgentSidePanel`, `CompanyPanel`, the `COMPANY_AGENT_*` constants, `Prov`, `LEVELS`, `parseJobAd`, `getSkills`, `resolveCompany` (in `api/mcf.js`). R005 globals list respected; R006 (no multi-line async arrow in JSX props - extract named fns); R007 (ASCII, hyphens only).

### `v3/src/main.jsx` - ADDITIVE (one branch)
- **Add** `const wiki = params.get('view') === 'wiki'` (beside `leap`/`graph`, line 27-29) and `const wikiCompany = params.get('company') || ''`.
- **Add** one ternary branch in the render: `... : wiki ? <EmployerWikiView companyQuery={wikiCompany} /> : ...`, importing `EmployerWikiView` from `./App.jsx`. The bare `<App />` fallback and every existing branch (`spherical`/`graph`/`leap`/`debugPanel`/`debugLogs`) stay byte-identical.
- **Freeze:** the existing route branches, `params` parsing, `initDebug`, `inject`.

### `v3/src/RoleGraph.jsx` - FREEZE
- `KGGraph` is consumed via its existing `{ kg, onNodeTap, layout }` props only. **No edit.** Node-highlight on wikilink click is achieved by the caller passing the chosen node id through the existing `onNodeTap` path (or the side-panel `tapNodeId` state already wired in `CompanyPanel`), not by changing `KGGraph`. If a new "externally-set highlight" prop is genuinely required, that is a separate frozen-door conflict to surface to the Human Lead BEFORE building - do not edit `KGGraph` silently.

### `v3/api/*` - FREEZE
- `api/mcf.js` (`action:"company"`, `duties:true`, `resolveCompany`, `mcfSearch`, `normaliseJob`, `extractResponsibilities`, the `jobs`/`job` branches), `api/careers.js`, `api/claude.js`, `api/esco.js`, `api/engine.js`, `api/anatomy.js` - all read-only. W1 issues no new request body; it reuses CO1+CO2 verbatim.

### Out of scope this slice (explicit follow-ups)
- **W2** - Standards/Skills persona (ESCO notes via `/api/esco`; `[[esco:...]]` / `[[skill:...]]` standards graph).
- **W3** - SG Jobs + Fresh Grad personas (role-side + entry-path notes; reuses the result-page engine + browse).
- **W4** - Candidate/Org journeys (the demo's journey arcs; subsumes the retired CO3 journey concept).
- Home-toggle entry-point and a shareable `/wiki/<employer>` permalink - later additive slices, not W1.

---

## W1.7. Grounded-in (source per claim)

| Claim / surface | Grounded in (named) |
|---|---|
| Employer model (employer + postings + clusters + agents) | live `buildCompanyAgents` over `api/mcf` `action:"company"` + `duties:true` (CO1/CO2; `v3-company-search-spec.md`, `v3-company-agents-spec.md`) - real MCF postings |
| Graph payload + side panel | live `companyAgentsToKgPayload` + `KGGraph` + `CompanyAgentSidePanel` (CO2.8) |
| Note + wikilink + "next best move" UX idiom | `v3/public/demo.html` (route `/demo`) - the visual/UX reference (`[[type:id|label]]` tokens, `fields`, `body`, `nextMove`) |
| Recurring-duty -> agent reading | the result-engine + stewardship grounding already cited by CO2 (recurrence as work-proxy; AIOE exposure bands) - W1 carries these verbatim, adds no new claim |
| Wiki/backlink note model | Obsidian/Roam-style bidirectional `[[wikilink]]` convention (UX pattern, not a number source) |

Every NODE and LINK cites a real posting via `model` provenance; nothing is invented (hard gate 3). No new paper is needed because W1 authors no new claim - it re-presents CO1/CO2 outputs that are already grounded.

---

## W1.8. Acceptance criteria

**Deterministic unit checks on a mocked CO2 `model`** (build a fixture `model` from the NHG + PSD samples / a 5-posting mock; assert against `buildEmployerWiki(model)`):
1. **No dangling wikilinks.** Every target id in every `note.links` and every `[[type:id|...]]` token in every `body`/`fields` value resolves to a note in `notes[]`. (Invariant 1.)
2. **Provenance is a subset.** Every uuid referenced by any note is present in the input `model` (`cluster.provenance`/`roleUuids`). No note cites a posting absent from `model`. (Invariant 3.)
3. **Withhold on thin.** A mock `model` with `agents:[]` and non-empty `withheld` yields `nextMove === null`, zero `agent` notes, the verbatim `model.withheld` line, and still emits employer + jobad notes. No fabricated cluster/agent. (W1.5.)
4. **No invented node.** Every `duty`/`skill`/`agent` note maps 1:1 to an entry in `model.clusters`/`model.agents`; `notes.filter(n => n.type==='agent').length === model.agents.length`; no note exists without a model source. (Invariant 5.)
5. **Next best move is the rank-0 agent.** For a model with promoted agents, `nextMove.targetId === "agent:"+model.agents[0].id` and the displayed recurrence equals `model.agents[0].recurrence` (no recomputed number). (W1.4.)
6. **Backlink symmetry.** For every note A with B in `A.links`, A is in `B.backlinks`. (Closure correctness.)
7. **kgNodeId validity.** Every non-null `note.kgNodeId` exists in `companyAgentsToKgPayload(model).nodes`. (Invariant 4.)
8. **Byte-identical re-run (determinism).** `JSON.stringify(buildEmployerWiki(model))` is byte-identical across two runs on the same `model` (hard gate 5; recipe R-SNAPSHOT).

**Integration / regression:**
9. **Existing routes still work.** With `?view=wiki` absent, `<App />`, `?view=leap`, `?view=graph`, `?view=spherical`, `?dmm=` render byte-identically to `main` (R-FREEZE on `main.jsx` branches + the frozen App symbols).
10. **No frozen drift.** R-FREEZE asserts `buildCompanyAgents`, `companyAgentsToKgPayload`, `KGGraph`, `CompanyAgentSidePanel`, `CompanyPanel`, `resolveCompany`, `mcfSearch` are byte-identical to `main`.

**Live verify on preview** (desktop + mobile):
11. `?view=wiki&company=Metta` (uuid `2320493d0e875075d4dbfa6a893b3fdb` employer) renders the Employer note + Job-Ad notes + Skill notes; a wikilink click navigates note-to-note AND highlights the matching node in the embedded `KGGraph`; backlinks render; the "your next best move is..." banner shows the rank-0 agent with a `◐ derived` chip; every note carries a Prov chip; a thin employer withholds honestly. No red/green; 44px targets; `aria-label` on graph + nav buttons; keyboard note-to-note nav works; "AI-assisted; human decides" footer present.

---

## W1.9. Non-inventive conformance (which gates apply)

- **Hard gates (§6) that apply:** Gate 2 (every figure/note has a Prov chip), Gate 3 (`[UNVERIFIED]`/withhold over fabrication - the W1.5 withhold), Gate 5 (determinism - acceptance 8). Gate 1 (no LLM string -> number) and Gate 4 (range not fake point) hold trivially because W1 computes NO number - it re-shapes `model`.
- **D1-D8 (static Prompt Syntax Governance):** **NOT required for W1** - `buildEmployerWiki` introduces NO new prompt template; it touches no LLM call. (If a later slice adds LLM note narration, D1-D8 applies then.) State this explicitly in the PR so the auditor confirms there is no new prompt to audit.
- **G1-G8 (dynamic Governance Diagnostic):** **required** on the live `?view=wiki` read. Confirm: the engine (CO2 model) authors the move and every node; the LLM authors nothing on this surface; a Prov chip is present per note (G2); withhold-on-thin fires (G3); same employer -> same wiki (G7 determinism); no fabricated posting reference (G3).
- **A11y-honesty review (§7):** no red/green; encode state by shape/label/text; 44px; `aria-label` on the embedded graph and every wikilink button; keyboard-focusable note-to-note nav; "AI-assisted; human decides" + `Source · Confidence · Time-window` footer; withhold honestly.

---

## W1.10. Pre-mortem (§9 shape; run R-PREMORTEM before build)

| Risk | Likelihood | Guard |
|---|---|---|
| A `[[wikilink]]` in a note body points at a note that was capped out by `COMPANY_AGENT_MAX_DUTIES` -> dangling link | Med | Two-pass build: bodies/links composed in pass 2 over the FINAL `notes[]`; acceptance 1 asserts zero dangling; agent-backing duty clusters are always kept (mirrors `companyAgentsToKgPayload`'s keep-rule) |
| Wiki invents a "next best move" on a thin/boilerplate employer | Med | W1.5 withhold reads `model.withheld`/`agents.length`; `nextMove=null` when no promoted agent or human-duty exists; acceptance 3 + 5 assert it |
| Editing `main.jsx` drifts an existing route branch | Low | R-FREEZE on the existing branches; the new branch is a single appended ternary; acceptance 9 re-renders every existing route |
| Someone edits `KGGraph`/`CompanyAgentSidePanel` to force a graph highlight | Med | Frozen door: highlight rides the EXISTING `onNodeTap`/`tapNodeId` path; any new prop is a STOP-and-surface conflict (W1.6 RoleGraph row), not a silent edit |
| Chat compaction drops a new module-level symbol (`buildEmployerWiki`, `EmployerWikiView`) during the big App.jsx edit | Med | R005 grep list extended with the new symbols before packaging; named-export check in `main.jsx` import |
| em/en dash or non-ASCII slips into a note `body`/`fields` string | Low | R007 + house grammar (hyphens only); the note text is composed from `model` strings (already ASCII-safe from MCF) plus fixed templates |

---

## W1.11. Version gate and next HDR

On W1 landing, surface to the Human Lead:

> `Rule V-1 / G1: WikiGraph W1 (Employer, wired live) ready. Prescribed: bump v3.0.<N> -> v3.0.<N+1> (MINOR feature, flat patch line per §11 AU-7). Confirm? (yes/no/modify)`

On yes: R003 x3 (`App.jsx` line 1, `index.html` title, `package.json`), HDR journal entry, `.serial-state.yml` bump, squash, live verify on the preview URL.

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.<N+1> | NNNkb | N,NNN lines
[INTENT] WikiGraph W1 - Employer persona wired live (static demo.html -> live CO1/CO2 wiki)
[DELTA] App.jsx: + buildEmployerWiki(model) (notes/wikilinks/backlinks/nextMove/withhold, pure deterministic)
[DELTA] App.jsx: + EmployerWikiView + EmployerNote/JobAdNote/SkillNote renderers; reuse KGGraph + CompanyAgentSidePanel
[DELTA] main.jsx: + ?view=wiki route branch (one ternary; existing routes byte-identical)
[RISK] Low - additive; no engine/number authored; frozen door honoured (R-FREEZE clean)
[STATUS] BETA
[TEST] unit on mocked CO2 model (no dangling links / provenance subset / withhold-on-thin / nextMove=agents[0] / byte-identical re-run); R-FREEZE; live verify ?view=wiki&company=Metta on desktop + mobile
[NEXT] Lead to confirm bump + name W2 (Standards/Skills via ESCO) as the next slice
[ADVICE] Two-pass note build (create all, then link) - guarantees zero dangling wikilinks deterministically
```

---

**STATUS: READY_FOR_BUILD.** Next agent: `result-engine-builder` (implements W1 against this spec, deterministic-first; the LLM authors no note, link, number, or the next-best-move target).

*End of spec. Confirm the version bump and proceed with W1.*
