(№ 1 - 18-06 '26 15:10 SGT)

# SG Career View v3 - Company-Agents slice spec (CO2: "agents to build" - the employer's recurring high-exposure duty-clusters as candidate agents)

> **Target repo path:** `v3/script/v3-company-agents-spec.md` (build `.md` files live in `v3/script/`; the locked-contract docs it depends on remain in `doc/`).
> **Status:** READY_FOR_BUILD.
> **Proposed version:** **v3.0.88** (flat patch line per `v3-result-engine-spec.md` SS11 AU-7 amendment; no minor roll before v3.0.999). Version bump is a **G1 confirmation gate** (Rule V-1) - do not bump without Human Lead sign-off.
> **Contract alignment:** the locked v3 contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) and the frozen door in `v3-result-engine-spec.md` SS1 govern every line. Deterministic = control; the engine authors every cluster, count, ranking and grouping; LLM is advisory ONLY (one optional narration line, engine-wins, authoring no cluster/number/ranking); non-inventive; withhold over fabricate; faithful fidelity.
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR blocks, ship rhythm) bind this spec.
> **Arc position:** CO2 is the **analytic layer** of the company work-surface arc. It builds ON TOP of CO1 (`v3-company-search-spec.md`, SHIPPED v3.0.87) - which collated an employer's live MCF postings and confirmed the name - and ON TOP of the stewardship rubric (RB1, `v3-stewardship-spec.md`: HIGH = agent completes end-to-end / human reviews the outcome). CO3 ("process to re-engineer") will build on CO2's clusters later. A corresponding row is added to `v3-stewardship-spec.md` SS3 (see CO2.13).

---

## CO2.0. Scope

This slice adds, on top of CO1's confirmed company posting set, a single new analytic panel: **"AI moments at `<company>` - agents you could build."** The engine clusters the employer's DUTIES (extracted across multiple of its roles) into recurring, high-AI-exposure **duty-clusters**, and frames each surviving cluster as a candidate agent: *"an agent that does X - currently spread across roles A / B / C."* The render borrows the Human Lead's reference pattern: a tiered explorable graph **FUNCTIONS -> RECURRING DUTIES -> AGENT CANDIDATES** with a node-detail **side panel** showing, on tap, "Connected to" (the roles the node spans + the skills it draws on) and "From these postings" (the exact MCF ads it is grounded in, with counts). The provenance side panel IS the non-fabrication contract made visible. The render REUSES the existing `KGGraph` machinery in `v3/src/RoleGraph.jsx` (cluster lanes, node cards, Prov chips, tap-to-trace, blue/orange/cyan palette, 44px, aria). The analysis applies the Structured-Analytic-Techniques (SAT) discipline: indicators, Analysis-of-Competing-Hypotheses (ACH) per function, Key-Assumptions surfaced, Quality-of-Information confidence tags, and **withhold when the sample is thin**. It NEVER produces a layoff prediction or a single company score.

---

## CO2.1. Radicality band

**ADDITIVE** (one REWIRE-lite touch to the CO1 `action: "company"` branch in `api/mcf.js`; one ADD-heavy block in `App.jsx`; one ADD-lite reuse of the exported `KGGraph`).

- `api/mcf.js`: REWIRE-lite - the CO1 `action: "company"` branch is EXTENDED so the panel can request duty text for the top N postings of the confirmed group (a new optional `duties: true` flag). The frozen `action: "jobs"` and `action: "job"` paths stay byte-untouched; `mcfSearch`, `mcfSearchPage`, `normaliseJob`, `extractResponsibilities`, `fetchJobDetail`, `MAX_OUTBOUND_CALLS` are reused, never changed. (See CO2.4 for why this is the chosen data-fetch decision.)
- `App.jsx`: ADDITIVE - a new deterministic `buildCompanyAgents(...)` analytic module, a new `companyAgentsToKgPayload(...)` adapter, and a new render block in the CO1 `step === "mcf_company"` company panel. No existing function is renamed; the engine, ESCO path, `buildKnowledgeGraph`, `parseJobAd`, `rateSkills`, `classifyDuties` are untouched.
- `RoleGraph.jsx`: ADDITIVE - the already-exported `KGGraph` is reused as-is via the `{ version:"kg1", nodes, edges, clusters, stats, withheld }` payload shape. NO new graph engine. A node-detail **side panel** is the only new render piece; see CO2.8 for whether it lands inside `KGGraph` (tiny additive prop) or as a sibling in `App.jsx`.

Justification: no architecture rewrite, no data-source replacement, no engine change, no frozen-door edit (CO2.5). Per CLAUDE-FULL SS6.2 this is a feature add on the flat patch line - **patch bump v3.0.88**, G1-confirmed.

---

## CO2.2. What is explicitly EXCLUDED (and why)

The Human Lead's reference carries two ideas that are deliberately NOT built in CO2. Stating the exclusion is part of the spec.

1. **"The model is the engine, the system is yours" model-swap philosophy - EXCLUDED: already the architecture.** v3 is already a deterministic engine (`engine-core`, `scoreJobAnatomy`, the SAT clustering below) with an advisory-only LLM behind `claudeCall`/`/api/claude`. The model is swappable (Haiku default; Fable-5 advisory leap recorded in stewardship SS3) and authors no number that reaches the page. There is nothing to ADD: CO2 simply continues the contract. Recorded as an exclusion so it is a decision, not an omission.

2. **The "compounding loop / corrections written back to files" learning loop - EXCLUDED: conflicts with the deterministic + non-fabrication + R-SNAPSHOT contract.** A loop that writes user corrections back into the analysis would make the same postings yield a DIFFERENT graph over time, breaking determinism (`v3-result-engine-spec.md` SS6 hard gate 5: same input -> identical output) and the R-SNAPSHOT acceptance. It is recorded here as a **possible FUTURE audited "feedback log"** - an append-only, provenanced, opt-in store that NEVER mutates the deterministic clustering, only annotates it - explicitly **out of scope for CO2** and not built. If pursued, it is a separate spec with its own D1-D8/G1-G8 and a fresh R-rule on log immutability.

---

## CO2.3. The thesis (SAT framing, one line)

CO1 confirmed *who the employer is and what it is advertising*. CO2 answers *where, across its open roles, the same AI-exposable work keeps recurring* - and surfaces each recurrence as a thing-you-could-automate, framed as an agent, **never as a person you could remove**. The unit of analysis is the **duty-cluster** (a recurring kind of work), not the role and never the headcount.

---

## CO2.4. Data-dependency decision (resolved): how CO2 gets duties

**Problem.** CO1's `action: "company"` deliberately polls SEARCH PAGES ONLY (`detail:false`, zero `fetchJobDetail`) - so its `normaliseJob` outputs carry `responsibilitiesText` derived from the search-result `description`, which on MCF is frequently TRUNCATED. CO2 needs reliable duty text per posting to cluster across roles.

**Decision: EXTEND the CO1 `action: "company"` branch with an opt-in `duties: true` flag that detail-fetches the top N postings of the CONFIRMED group, within the existing outbound budget, and reuses the EXISTING `extractResponsibilities`.** No new action, no new extractor, no new number.

Specifics (all reuse, all budget-bounded):

- The panel issues a SECOND `action:"company"` call once the user has confirmed a single employer group (or auto-confirmed on a single match), this time with `{ action:"company", company, duties:true, detailLimit:N }`.
- On `duties:true`, after `resolveCompany` has grouped, the handler takes the SINGLE confirmed group's postings (or, when still ambiguous, withholds duties until the user picks - CO2 never duty-fetches across multiple employers), and detail-fetches the **top N = `COMPANY_DUTY_DETAIL_LIMIT` (set to 5)** by latest `postedDate`, reusing the existing `fetchJobDetail` + `mergeDetail` pair (which already re-runs `extractResponsibilities` on the fuller description). Postings beyond N keep their search-page `responsibilitiesText` (still usable, just thinner) and are tagged lower QoI (CO2.10).
- **Outbound-call budget (hard).** CO1 already spends up to `COMPANY_MAX_PAGES = 3` search calls. CO2's `duties:true` re-uses the same `resolveCompany` poll (3 search) PLUS at most `COMPANY_DUTY_DETAIL_LIMIT = 5` detail calls. Total `3 + 5 = 8 = MAX_OUTBOUND_CALLS`. The handler MUST decrement a shared counter so detail fetches never exceed `MAX_OUTBOUND_CALLS - pagesPolled`. If fewer than N postings remain in budget, fetch what the budget allows and tag the rest lower QoI - never exceed 8, never throw.
- **No LLM in the duty fetch.** Duties come from `extractResponsibilities` (deterministic regex section-slicer, already in `mcf.js`), NOT from `extractPostingFeatures` (which is an LLM call). This keeps CO2's grounding fully deterministic and reproducible (R-SNAPSHOT-able on a fixed payload). The clustering then runs on those duty lines.

Rationale for choosing detail-fetch over reusing the truncated search text: clustering on truncated duty text would systematically under-count recurrence and mis-rank, and the provenance side panel ("from these postings") would point at incomplete evidence - violating faithful fidelity. Capping N at 5 keeps cost identical to the existing `action:"jobs"` detail path (which already detail-fetches up to 5). The detail fetch is the same call the app already makes elsewhere, so no new cost class (G4 N/A; MCF is free/unauthenticated).

---

## CO2.5. Frozen-door check

- The **role search box, first-run help, occupation resolve, browse `jobs` path, the engine + engine-data tables, `buildKnowledgeGraph` (KG1/KG3), `parseJobAd`, `rateSkills`, `classifyDuties`, `mcfSearch`, `normaliseJob`, and `/api/claude`** are all untouched.
- CO2 extends ONLY the CO1-owned `action: "company"` branch (already additive over the frozen `jobs`/`job` branches) with an opt-in flag; the `jobs`/`job` branches stay byte-identical.
- `KGGraph` is consumed via its existing exported contract; `RoleGraph` `BakedGraph`/KG payload reader stays byte-identical.
- R-FREEZE (R011) runs before packaging: assert the frozen symbols are byte-identical to `main`; a non-zero diff on any frozen symbol BLOCKS packaging.
- No conflict surfaced. If a builder finds CO2 cannot work without editing a frozen symbol, STOP and surface to the Human Lead (CLAUDE-FULL SS11).

---

## CO2.6. Change map (file by file, real symbols)

"Touch" = edit; "Add" = new; "Freeze" = leave byte-identical.

### `v3/api/mcf.js` - REWIRE-lite (extend `action: "company"`)
- **Add** module const (R005-greppable, ASCII per R007): `COMPANY_DUTY_DETAIL_LIMIT = 5`.
- **Touch** the `action === 'company'` branch (~436): accept optional `duties` (bool) and `detailLimit` (clamped 1..`COMPANY_DUTY_DETAIL_LIMIT`). When `duties === true` AND `resolveCompany` returns exactly ONE match (or the caller passes a chosen `companyKey` selecting one group), detail-fetch that group's top-N postings by `postedDate` desc using the EXISTING `fetchJobDetail` + `mergeDetail`, decrementing a shared outbound counter seeded at `pagesPolled` so total stays `<= MAX_OUTBOUND_CALLS`. Re-emit the group with enriched `responsibilitiesText` and a per-job `dutyDetail: true|false` flag (true = detail-fetched, false = search-text only). When ambiguous, return as CO1 does and set `dutiesWithheld: "ambiguous"` (the panel asks the user to pick first).
- **Freeze** `resolveCompany`'s grouping/normalisation/match logic, `normaliseCompanyName`, `companyKeyMatches`, `mcfSearchPage`, `extractResponsibilities`, `fetchJobDetail`, `mergeDetail`, `mcfSearch`, `normaliseJob`, the `jobs`/`job` branches, `MAX_OUTBOUND_CALLS`, `WARM_ERRORS`.

### `v3/src/App.jsx` - ADDITIVE (analysis + adapter + render)
- **Add** `buildCompanyAgents(matchGroup)` (pure deterministic; CO2.7 algorithm). Input: one confirmed match group `{ displayName, count, jobs }` whose jobs carry `responsibilitiesText`, `skills`, `title`, `categories`, `uuid`, `mcfUrl`, `dutyDetail`. Output: `{ functions, clusters, agents, sat, withheld, stats }` (CO2.9 schema). NO LLM. Reuses `_phraseNorm`, `_phraseToks`, `_phraseMatch`, `_PHRASE_STOP`, the duty-exposure rubric values from `scoreJobAnatomy` (CO2.7 step 4), the `LEVELS` map and `Prov`.
- **Add** `companyAgentsToKgPayload(agentsModel)` - adapter mapping the three tiers onto the `KGGraph` payload (`version:"kg1"`, `nodes`, `edges`, `clusters`, `stats`, `withheld`) so `KGGraph` renders it unchanged (CO2.8).
- **Add** an optional `narrateAgentCandidate(cluster)` (one short advisory line, "an agent that could ...", tagged `~ AI estimate`) - OPTIONAL; prefer NOT shipping a new LLM call in CO2 (CO2.11). If shipped, D1-D8 applies (CO2.12).
- **Touch** the CO1 `step === "mcf_company"` render block: after a single employer is confirmed, issue the `duties:true` fetch, run `buildCompanyAgents`, and render the new "AI moments" panel (graph + side panel) below the existing posting list. The chooser/back/posting-list behaviour from CO1 is untouched.
- **Add** the node-detail **side panel** component `CompanyAgentSidePanel` (CO2.8): "Connected to" (roles + skills) and "From these postings" (provenance: MCF ad titles + counts + links). 44px, aria, no red/green.
- **Respect** R006 (extract multi-line async arrows used as JSX props to named fns), R007 (ASCII only; hyphens, never em/en dash), R005 (add `buildCompanyAgents`, `companyAgentsToKgPayload`, `CompanyAgentSidePanel` to the packaging grep list if component-level globals are tracked).

### `v3/src/RoleGraph.jsx` - ADDITIVE (reuse only; at most a tiny optional prop)
- **Reuse** the exported `KGGraph` with the CO2 payload. Cluster lanes carry the three tiers (CO2.8). If the side panel is implemented inside `KGGraph`, add ONE optional prop `onNodeTap` (default noop) so the existing tap-to-trace still fires AND the host can open the side panel; the `traced` highlight logic is untouched. Preferred: keep the side panel in `App.jsx` and pass `onNodeTap` - so `RoleGraph.jsx` change is one optional prop, fully back-compatible with the role-graph caller.
- **Freeze** `BakedGraph`, `readKgPayload`, `RoleGraph` default export, `KGNodeCard`, `KGEdgesPanel`, the palettes (`KG_TYPE_STYLE`, `KG_CLUSTER_COLOR`, `PROV`, `BAND`).

### Frozen (leave byte-identical)
- `engine-core.js`, `engine-data/*`, `api/engine.js`, `api/esco.js`, `api/anatomy.js`, `buildKnowledgeGraph`, `getKnowledgeGraph`, `parseJobAd`, `rateSkills`, `classifyDuties`, `scoreJobAnatomy` (read its rubric values, do NOT edit), `doSearch`, `getEscoSkills`, `handleAnalysePosting`, `/api/claude`, CO1's `resolveCompany`/`normaliseCompanyName`/`companyKeyMatches`.

---

## CO2.7. The duty-cluster algorithm + recurrence x exposure ranking (deterministic, stated exactly)

`buildCompanyAgents(matchGroup)` runs in five deterministic steps. Same postings -> same model (R-SNAPSHOT).

**Step 0 - duty harvest.** For each posting in the group, split `responsibilitiesText` into duty lines: split on `\n`, trim, drop lines `< 5` tokens or matching a boilerplate set (reuse the spirit of `RESP_STOP_RE`; keep a small ASCII `_AGENT_BOILER_RE` for "equal opportunity employer", "we offer", "apply now", etc.). Tag each surviving line with its source `{ uuid, title }` and its `dutyDetail` flag. Each line is a `dutyInstance { text, toks: _phraseToks(text), roleUuid, roleTitle, fromDetail }`.

**Step 1 - cluster duties across postings (token-overlap, deterministic).** Greedy single-pass clustering reusing the EXISTING phrase primitives - no new extractor, no new similarity number invented:
- Iterate duty instances in a STABLE order (posting `postedDate` desc, then line index) so clustering is deterministic.
- For each instance, find an existing cluster whose representative duty `_phraseMatch(rep.text, instance.text)` is true (i.e. `>= 2` shared `_phraseToks`, the same threshold `mergeAdFeatures` already uses). If found, add the instance and union its tokens; else open a new cluster with this instance as representative.
- A cluster accumulates: `instances[]`, `roleUuids = Set`, `roleTitles = Set`, `skills = Set` (union of the `skills` arrays of the postings it spans, via `_phraseNorm` keys), and a `tokens` bag.
- **Recurrence** of a cluster = `roleUuids.size` (the number of DISTINCT postings/roles it spans) - pass-through count, never minted. (Instances within one posting do not inflate recurrence; spanning roles is the signal.)

**Step 2 - per-cluster AI-exposure band (reuse the existing rubric, author no new number).** Each cluster gets a `level in {HUMAN, LOW, MEDIUM, HIGH}` deterministically, WITHOUT an LLM and WITHOUT inventing a scale:
- Map the cluster's representative duty to a layer using the SAME keyword cues `classifyDuties`/`JOB_LAYERS` encode (Activity / Coordination / Accountability / Relational / Judgment) via a small deterministic `_dutyLayerHint(toks)` lookup of the documented cue verbs already named in the `classifyDuties` prompt (analyse/draft/build/reconcile/test/process -> Activity, etc.). This is a documented crosswalk of EXISTING cues, not a new model.
- Read the exposure band from `scoreJobAnatomy`'s already-cited `layRes`/`expoRes` ordering: Activity-dominant clusters -> MEDIUM (rising), Coordination -> LOW/MEDIUM, Accountability/Relational/Judgment -> LOW/HUMAN. The band is the rubric's, not a fresh decimal. Display uses the existing `LEVELS` map.
- A cluster qualifies as **AI-adjacent** when its level is MEDIUM or HIGH AND its skill union contains at least one AI-adjacent skill token (a small ASCII `_AI_ADJ_RE`: "data", "analytics", "automation", "report", "dashboard", "process", "document", "schedul", "reconcil", "forecast", "model", "pipeline", "workflow", "rpa", "etl" - documented, conservative, extendable). The skill match is provenance-bearing (which posting's skill list supplied it).

**Step 3 - indicators (the SAT indicator vector).** Each cluster carries three named indicators, all pass-through:
- `recurrence` = distinct roles spanned (Step 1).
- `exposure` = the band ordinal from Step 2 (`HUMAN 0 < LOW 1 < MEDIUM 2 < HIGH 3`).
- `aiAdjacency` = count of distinct AI-adjacent skill tokens in the cluster's skill union (Step 2).

**Step 4 - rank (recurrence x exposure, deterministic, transparent).** `score = recurrence * exposureWeight[level]` where `exposureWeight = { HUMAN:0, LOW:1, MEDIUM:2, HIGH:3 }` (the rubric ordinal, shown to the user; not a hidden coefficient). Ties break by `aiAdjacency` desc, then `recurrence` desc, then representative-duty `localeCompare` asc. Clusters with `exposureWeight === 0` (HUMAN) or `recurrence < COMPANY_AGENT_MIN_RECURRENCE` are NOT promoted to agent candidates (they may still appear in the RECURRING DUTIES tier as context, tagged "stays human"). The product, the two factors and the tie-breaks are all displayed so the ranking is auditable - never a black-box score.

**Step 5 - functions tier + agent framing.** Group the surviving clusters by FUNCTION using the postings' existing `categories` field (MCF-supplied; e.g. "Information Technology", "Human Resources", "Finance"); a cluster's function = the modal `categories[0]` across its spanning roles (deterministic mode, ties -> `localeCompare`). Each promoted cluster becomes an **agent candidate**: title = "an agent that " + the representative duty's verb-led phrase (copied/lightly-normalised FROM the duty text, never invented), with the spanned role titles listed ("currently spread across `<role A>` / `<role B>` / `<role C>`"). The agent candidate authors NO number; its recurrence/exposure/score are the cluster's pass-through indicators.

**Output ordering** is fully determined by the above, so the same posting set yields a byte-identical model.

---

## CO2.8. Reuse of the borrowed graph + side panel (how `KGGraph` is reused)

The three tiers map onto `KGGraph`'s cluster-lane payload (`{ version:"kg1", nodes, edges, clusters, stats, withheld }`) so the existing renderer draws them unchanged:

- **Cluster lanes (`clusters`)** become the three TIERS, reusing the existing lane machinery: `{ id:"functions", label:"Functions", present:true }`, `{ id:"duties", label:"Recurring duties", present:true }`, `{ id:"agents", label:"Agent candidates", present:true }`. (CO2 maps its tiers onto the generic `clusters` array; it does not need the Individual/Department/Organisation lane semantics - the lane label is just a tier title. The `KG_CLUSTER_COLOR` palette falls back to `unscoped` for unknown ids, which is acceptable; OPTIONAL: add three keys to `KG_CLUSTER_COLOR` in `RoleGraph.jsx` for tier colours - additive, blue/orange/cyan, no red/green.)
- **Nodes** carry the existing `{ id, type, label, cluster, source, confidence, level }` shape so `KGNodeCard` renders them as-is, with its Prov chip and the `level` -> "AI level" line:
  - function node: `type:"organisation"`, `cluster:"functions"`, `source:"mcf"` (function name is an MCF category).
  - duty-cluster node: `type:"duty"`, `cluster:"duties"`, `source:"derived"` (the cluster is computed from the sampled ads), `level` = the cluster's band, `confidence` = the QoI tag (CO2.10).
  - agent-candidate node: `type:"skill"` (reuses the cyan style) or a new additive `KG_TYPE_STYLE.agent` key (OPTIONAL, additive only), `cluster:"agents"`, `source:"derived"`, `level` = band.
- **Edges** use the existing `{ source, target, verb, weight, source_tag }` shape: function -> duty (`verb:"recurs in"`, `weight` = recurrence), duty -> agent (`verb:"could become"`, `weight` = score). `KGEdgesPanel` lists them verbatim with its Prov chip; `weight` shows the recurrence/score so the ranking is visible.
- **`stats`** = `{ nodes, edges, clustersPresent: 3 }`; **`withheld`** = the CO2.10 withhold reasons (rendered by the existing withheld notice).

**Side panel (the only NEW render piece).** Tapping a node opens `CompanyAgentSidePanel`. `KGGraph` already tracks `traced` (the tapped node id) and dims the rest; CO2 adds ONE optional `onNodeTap(id)` prop (default noop, back-compatible) that the host wires to open the panel for the tapped node. The panel shows, ALL pass-through:
- **Connected to:** the roles the node spans (role titles, from `roleTitles`) + the skills it draws on (from the cluster's skill union), each chip tagged `● from MCF` (verbatim) or `◐ derived` (the cluster grouping).
- **From these postings (provenance / the non-fabrication contract made visible):** the exact MCF ads the node is grounded in - posting title, posted-date, `dutyDetail` flag (detail-fetched vs search-text), and a link to `mcfUrl`, with the count `N postings`. Every agent candidate and every duty node thus shows the real ads it came from; a node with no postings is impossible by construction (it is built FROM instances).
- Footer: "AI-assisted; human decides. Clusters and rankings are computed from the sampled postings; the agent framing is a suggestion of automatable work, not a headcount judgement."

**OPTIONAL secondary view (stretch, NOT core):** a recurrence-sized packed-bubble of duty/skill clusters (bubble size = recurrence). Marked optional; if not built, the tiered graph alone satisfies CO2. If built, it reads the SAME `buildCompanyAgents` model (no second analysis) and carries the same Prov chips.

**OPTIONAL "knowledge map" view - force-directed layout toggle (Human Lead request).** A layout TOGGLE over the SAME `companyAgentsToKgPayload` model (no second analysis, no new data): a force-directed / spring layout that lets related nodes pull together so cross-links emerge - job requirements <-> org needs <-> skills <-> AI-exposure - as a personalised map of the employer's work surface. Rules that keep it on-contract:
- **Layout is presentation only.** The deterministic data (nodes, edges, recurrence counts, bands, ranking) is unchanged and remains R-SNAPSHOT-able; only pixel positions differ. The simulation is run with a FIXED SEED (deterministic initial positions + capped iterations) so the same model lays out the same way run-to-run - no `Math.random()`, no time-seeded jitter. Layout coords are explicitly EXCLUDED from the snapshot comparison.
- **Default + a11y path stays the structured tier/lane view.** The force map is an opt-in toggle; the cluster-lane render and the side panel (keyboard-reachable, aria) remain the accessible default, exposing the SAME nodes/edges. No red/green; the force view must not become the only path to any datum.
- **Dimensions that are grounded:** job requirements (req-kind nodes), org needs (function/role nodes), skills, AI-exposure level - all already in the model. **Candidate-suitability is WITHHELD** (the CV-fit input was removed at PL1): it is not a node dimension and must not be faked; if a candidate input is ever reintroduced it can join as a new node type, not before.
- **Bounded scope:** the map renders only the CURRENT confirmed employer's graph (one `buildCompanyAgents` result) - NOT a global cross-analysis vault. This caps node count, keeps the layout legible, and avoids the thousand-node perf/noise trap. Withhold thresholds (CO2.10.5) still gate it.
- Reuse: the toggle renders the same `KGGraph` payload; implement the spring layout as an alternate positioning pass inside `KGGraph` behind a `layout="force"` prop (default `"lanes"`), back-compatible with the role-graph caller. No new analysis function.

---

## CO2.9. Output schema (`buildCompanyAgents` -> model)

```
{
  company: "<displayName verbatim>",
  functions: [ { id, name, roleUuids:[...], clusterIds:[...] } ],
  clusters: [ {
    id, repDuty:"<verbatim/normalised representative duty>",
    roleTitles:[...], roleUuids:[...],
    skills:[ { skill:"<verbatim>", fromUuid } ],
    recurrence:<int>, level:"HUMAN|LOW|MEDIUM|HIGH", exposureWeight:<0-3>,
    aiAdjacency:<int>, score:<int = recurrence*exposureWeight>,
    promoted:<bool>, functionId,
    provenance:[ { uuid, title, postedDate, mcfUrl, dutyDetail:<bool> } ]
  } ],
  agents: [ {            // promoted clusters, reframed
    id, label:"an agent that <verb-led phrase>",
    spansRoles:[ "<role A>", "<role B>", ... ],
    recurrence, level, score, clusterId, functionId,
    narration:null,      // OPTIONAL "~ AI estimate" line, engine-wins; default null
  } ],
  sat: {                 // the SAT artefacts (CO2.10)
    indicators:[ { clusterId, recurrence, exposure, aiAdjacency } ],
    ach:[ { functionId, function, top:"automate|augment|keep", runnerUp:"...", evidence:[clusterIds] } ],
    keyAssumptions:[ "<string>", ... ],
    qoi:{ postingsAnalysed:<int>, dutiesClustered:<int>, detailFetched:<int>, tag:"high|moderate|thin" }
  },
  withheld:[ "<reason strings>" ],
  stats:{ postings:<int>, duties:<int>, clusters:<int>, agents:<int> }
}
```

---

## CO2.10. SAT artefacts (the analytic discipline, all deterministic)

1. **Indicators table** - per cluster: recurrence x exposure x AI-adjacency (CO2.7 steps 3-4). Displayed so the score is the visible product of named factors, never a black box.
2. **Analysis of Competing Hypotheses (ACH) per FUNCTION** - for each function the engine picks among three hypotheses for its dominant cluster: **automate-via-agent | augment-human | keep-human**, chosen deterministically from the cluster bands in that function (HIGH/MEDIUM-dominant + AI-adjacent -> automate-via-agent; mixed -> augment-human; Accountability/Relational/Judgment-dominant -> keep-human). **The runner-up is shown** alongside the top hypothesis with its evidence (the clusters that support it) - so the read is never a single verdict.
3. **Key-Assumptions Check (KAC)** - a fixed, surfaced list, e.g.: "duty text reflects real work, not boilerplate"; "MCF categories map cleanly to functions"; "the sampled N postings represent the employer's current hiring"; "recurrence across ADS is a proxy for recurrence of WORK, not a guarantee". Shown to the user so the analytic frame is honest.
4. **Quality-of-Information (QoI) confidence tags** - `qoi.tag`: **high** (`detailFetched >= 4` and `dutiesClustered >= 12`), **moderate** (`detailFetched >= 2` and `dutiesClustered >= 6`), **thin** (below moderate -> WITHHELD per CO2.10.5). Carried onto every duty/agent node as `confidence`.
5. **Withhold-when-thin (over-fabricate).** If `postings < COMPANY_AGENT_MIN_POSTINGS (4)` OR `dutiesClustered < COMPANY_AGENT_MIN_DUTIES (6)` OR no cluster reaches `recurrence >= COMPANY_AGENT_MIN_RECURRENCE (2)` AND `exposureWeight >= 2`, the panel WITHHOLDS the agents view with an honest line ("Too few of `<company>`'s postings carry detailed duties to read recurring AI-exposable work reliably - showing the postings only.") and falls back to CO1's posting list. No fabricated cluster, ever.

---

## CO2.11. Determinism + LLM boundary (the control layer)

- The **engine authors everything**: the clusters (`_phraseMatch` token overlap), the recurrence counts (distinct-role pass-through), the bands (the cited `scoreJobAnatomy` rubric ordinals), the ranking (`recurrence * exposureWeight`), the agent grouping, the ACH/KAC/QoI. All deterministic - same postings -> byte-identical model.
- **Preferred: NO new LLM call in CO2.** The agent label is the verb-led duty phrase copied from the duty text. This keeps the whole panel reproducible and avoids a new D1-D8 surface.
- **If a one-line narration is added** (`narrateAgentCandidate`), it is advisory ONLY: at most one short sentence per agent ("an agent that could draft and reconcile the recurring X work"), tagged `~ AI estimate`, **engine-wins** (the recurrence/score/spanned roles shown are always the engine's; the LLM string is discarded if it contradicts a count or names a role not in `spansRoles`). The narration authors NO cluster, NO number, NO ranking. Adding it triggers the D1-D8 static audit on the new prompt (CO2.12) and a cache key bump.

---

## CO2.12. Non-inventive gates + audits (which apply)

From `v3-result-engine-spec.md` SS6 hard gates:
- **Gate 1 (no LLM string -> number):** satisfied - the engine authors every cluster/count/band/rank. If `narrateAgentCandidate` is added, assert its output is never parsed into a number and is dropped on contradiction.
- **Gate 2 (Prov chip on every figure):** every node and figure carries `● from MCF` (verbatim names/skills/posting facts) or `◐ derived` (clusters, recurrence, score) or `~ AI estimate` (the optional narration). Assert present.
- **Gate 3 (`[UNVERIFIED]`/withhold over fabricate):** thin sample -> the CO2.10.5 withhold, never a fabricated cluster or count.
- **Gate 4 (ambiguity as a range, not a fake point):** N/A to ranking here, but QoI carries the sample-size honesty; the score is shown as its factors, not a false-precision percentage.
- **Gate 5 (determinism):** fixed posting payload -> byte-identical `buildCompanyAgents` model. Snapshot-assert (R-SNAPSHOT).

Audits:
- **D1-D8 (static prompt audit):** required ONLY IF the optional `narrateAgentCandidate` prompt is shipped (it must not be able to author a number/cluster/rank; JSON-or-single-line contract; no invention licence - the verb must come FROM the cluster's duty text). If CO2 ships without the narration (preferred), D1-D8 is N/A (no new prompt).
- **G1-G8 (live read audit):** required on the deployed Vercel preview (CO2.14) - confirm `● from MCF` / `◐ derived` chips present on every node, the side-panel provenance lists real postings, withhold fires on a thin employer, engine-wins holds (if narration shipped), and same-employer re-run gives the same graph.

---

## CO2.13. Stewardship arc cross-reference (SS3 row)

CO2 is goal-grounded (it operationalises the agentic-frontier rubric RB1 and the w34854 "automating vs augmenting vs new-task" lens). Add this row to `v3-stewardship-spec.md` SS3 on land:

| PR | Protocol | Band | Files | Grounded in | Accept |
|---|---|---|---|---|---|
| **CO2** | company work-surface (agents to build) | ADDITIVE | `api/mcf.js`, `App.jsx`, reuse `RoleGraph.jsx` `KGGraph` | RB1 agentic rubric; w34854 (automating vs labor-augmenting vs new-task); Heuer & Pherson, *Structured Analytic Techniques* (ACH, KAC, indicators, QoI) | recurring high-exposure duty-clusters across an employer's roles rendered as agent candidates in the tiered graph + provenance side panel; engine authors every cluster/count/rank; thin sample withholds; never a layoff prediction or single score |

---

## CO2.14. Acceptance criteria

**IMPORTANT - sandbox egress caveat (record this):** the dev sandbox CANNOT reach MCF (egress blocked, same as CO1). The BUILD is verified by `npm run build` + deterministic unit checks on MOCKED MCF JSON only. LIVE data verification happens on the deployed **Vercel preview**, whose `/api/mcf` serverless function reaches MCF.

**A. Build (sandbox, deterministic):**
1. `npm run build` passes (no esbuild parse error - R006/R007 honoured).
2. R-FREEZE: the frozen symbols in CO2.6 are byte-identical to `main` (engine, `buildKnowledgeGraph`, `classifyDuties`, `rateSkills`, `scoreJobAnatomy`, `mcfSearch`, `normaliseJob`, CO1's `resolveCompany`, `KGGraph` core, `BakedGraph`).
3. Unit (mocked match group, no network):
   - **Clustering determinism:** a mock group of 4 postings where 3 share a "prepare monthly financial reports" duty and 2 share "reconcile ledger accounts" yields a cluster with `recurrence === 3` for the reports cluster and `recurrence === 2` for the reconcile cluster, via `_phraseMatch` token overlap; same payload -> byte-identical model across two runs.
   - **Ranking:** with `exposureWeight = { HUMAN:0, LOW:1, MEDIUM:2, HIGH:3 }`, a MEDIUM cluster spanning 3 roles (`score 6`) outranks a LOW cluster spanning 4 roles (`score 4`); the displayed score equals `recurrence * exposureWeight` with no hidden term.
   - **Human stays human:** an Accountability/Relational-cued cluster ("sign off on", "negotiate with stakeholders") gets `level` HUMAN/LOW, `promoted === false`, and appears in the duties tier tagged "stays human" - never an agent candidate.
   - **Provenance:** every cluster's `provenance[]` lists only `uuid`s present in the input group; an agent candidate with zero provenance is unconstructable. Assert each node's `provenance` is a subset of the group's `uuid`s.
   - **Withhold:** a group of 2 postings (or 6 postings whose duties cluster to fewer than `COMPANY_AGENT_MIN_DUTIES`) returns `withheld` non-empty and `agents: []`; the panel shows the honest fallback, never a fabricated cluster.
   - **Budget:** the `duties:true` path issues at most `COMPANY_MAX_PAGES (3)` search + `COMPANY_DUTY_DETAIL_LIMIT (5)` detail calls = `8 = MAX_OUTBOUND_CALLS`; assert the shared counter never exceeds 8 and detail count `<= MAX_OUTBOUND_CALLS - pagesPolled`.
   - **KGGraph payload validity:** `companyAgentsToKgPayload(model)` returns `version:"kg1"`, three present clusters, nodes with valid `type`/`cluster`/`source`, edges with `verb`/`weight`; `KGGraph` renders it without throwing (smoke-render in test).
   - **No LLM in the deterministic path:** assert `buildCompanyAgents` references no `claudeCall`/`/api/claude` (the optional narration, if present, is the only LLM touch and is gated + dropped on contradiction).
4. ACH/KAC/QoI present: the model's `sat.ach` shows a top AND a runner-up per function; `sat.keyAssumptions` is non-empty; `sat.qoi.tag` is one of high/moderate/thin and matches the thresholds.

**B. Live (Vercel preview only):**
5. Search a real multi-role employer (e.g. "National Healthcare Group", "DBS Bank") with several live postings -> CO1 confirms the name; the "AI moments" panel renders the tiered graph FUNCTIONS -> RECURRING DUTIES -> AGENT CANDIDATES with `◐ derived` / `● from MCF` chips.
6. Tapping a duty or agent node opens the side panel showing "Connected to" (real role titles + skills) and "From these postings" (real MCF ad titles + counts + working links); the listed postings are ones actually in the confirmed group.
7. A small/thin employer (1-3 postings, or postings with no duty text) -> the honest withhold line; no fabricated cluster, no single score, no layoff language anywhere on the panel.
8. Determinism: re-running the same employer produces the same clusters, counts and ranking (no learning-loop drift - CO2.2 exclusion verified live).
9. a11y on preview: no red/green; 44px targets on nodes, side-panel close, back button; `aria-label`/`aria-pressed` present; keyboard-focusable; the "AI-assisted; human decides" footer present.

---

## CO2.15. Pre-mortem (run before build)

| # | Failure mode | Likelihood | Guard |
|---|---|---|---|
| 1 | Detail fetch blows the outbound budget / cost on a large employer | Med | Hard cap `COMPANY_DUTY_DETAIL_LIMIT = 5`; shared counter seeded at `pagesPolled`; unit asserts total `<= MAX_OUTBOUND_CALLS (8)`; G4 N/A (MCF free) |
| 2 | Token-overlap clustering merges unrelated duties (e.g. "manage team" + "manage budget") or splits one duty into two | Med | Reuse the SAME `_phraseMatch` `>= 2`-shared-token threshold `mergeAdFeatures` already ships; representative-duty shown on every node so a bad merge is visible; provenance side panel lets the user check the source ads |
| 3 | The panel reads as a layoff / headcount tool | Med-High | Unit + copy guards: NO headcount, NO "remove", NO single company score; framing fixed to "an agent that does X - spread across roles"; footer "not a headcount judgement"; ACH keeps a runner-up (never a lone verdict) |
| 4 | Thin/boilerplate employer fabricates spurious clusters | Med | `COMPANY_AGENT_MIN_POSTINGS/DUTIES/RECURRENCE` thresholds + QoI thin-withhold (CO2.10.5); boilerplate stripped by `_AGENT_BOILER_RE`; live test 7 asserts the withhold |
| 5 | Editing the CO1 `action:"company"` branch drifts a frozen `jobs`/`job` path or CO1's `resolveCompany` | Med | R-FREEZE blocks packaging; CO2 only ADDS the `duties:true` opt-in; the grouping/normalisation stays byte-identical; unit re-runs CO1's acceptance cases |
| 6 | A learning-loop / write-back creeps in and breaks determinism | Low | CO2.2 exclusion is explicit; live test 8 asserts same-employer re-run is identical; no store is written by `buildCompanyAgents` |
| 7 | Optional LLM narration authors a count or names a role not in the cluster | Low | If shipped: engine-wins, drop on contradiction, D1-D8 audit, cache-key bump; preferred to ship WITHOUT narration |
| 8 | em/en dash or non-ASCII slips into new strings | Low | R007 + house grammar (hyphens only); esbuild catch at build |

---

## CO2.16. Version-bump gate

On land: surface `Rule V-1 / G1` to the Human Lead. On yes, bump in all three per R003 (`App.jsx` line 1 header, `index.html` title, `package.json` version) to **v3.0.88**, write the HDR journal entry, bump `.serial-state.yml`, add the CO2.13 row to `v3-stewardship-spec.md` SS3.

```
[HDR] #NNN | HH:MM:SS SGT 18-6-26 | v3.0.88 | NNNkb | N,NNN lines
[INTENT] CO2 - company "AI moments": recurring high-exposure duty-clusters across an employer's roles, framed as agent candidates, in a tiered graph + provenance side panel
[DELTA] api/mcf.js action:"company" duties:true detail-fetch (reuses extractResponsibilities, COMPANY_DUTY_DETAIL_LIMIT, budget 8); App.jsx buildCompanyAgents + companyAgentsToKgPayload + CompanyAgentSidePanel; reuse RoleGraph KGGraph (one optional onNodeTap prop); SAT artefacts (indicators/ACH/KAC/QoI); thin-sample withhold
[RISK] Med - additive but reads on automatable work; guarded by no-headcount framing, withhold thresholds, determinism, R-FREEZE
[STATUS] BETA
[TEST] build + unit (mocked MCF JSON: cluster/recurrence/rank/human-stays/provenance/withhold/budget/payload/determinism); live verify on Vercel preview (graph, side-panel provenance, thin-withhold, re-run identical, a11y)
[NEXT] Confirm v3.0.88 bump (G1); decide narration in/out (D1-D8 if in); then queue CO3 (process to re-engineer) on CO2's clusters
[ADVICE] SAT discipline - the engine authors every cluster/count/rank; the provenance side panel is the non-fabrication contract made visible; withhold over fabricate
```

---

**STATUS: READY_FOR_BUILD. Next agent: `result-engine-builder` (implements CO2 against this spec; deterministic-first; the engine authors every cluster, count and ranking; LLM advisory only and preferably absent; thin sample withholds; never a layoff prediction or a single score).**

*End of CO2 spec.*
