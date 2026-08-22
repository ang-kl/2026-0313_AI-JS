(№ 1 - 22-06 '26 16:20 SGT)

# SG Career View v3 - Career WikiGraph arc spec ("a role as a living ecosystem, every line sourced or withheld")

> **Target repo path:** `v3/script/v3-wikigraph-spec.md` (build docs live in `v3/script/`; the locked-contract docs it depends on remain in `doc/`).
> **Status:** READY_FOR_BUILD. **Proposed version:** flat patch line `v3.0.<N>` per the result-engine-spec §11 AU-7 (no minor roll until v3.0.999); next free patch at each PR, confirmed at the G1 gate (Rule V-1). Six-PR arc **PR0 -> PR5**.
> **Contract alignment:** the locked v3 contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) governs every line. Deterministic = control; LLM = advisory narration only; non-inventive ("withhold over fabricate"); faithful fidelity (ranges stay ranges, confidence carried).
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR blocks, ship rhythm) bind this spec; recipe R-FREEZE runs before packaging.
> **Authoritative scope:** the build plan `doc/v3-wikigraph-plan-2026-06-22.html` and the live prototype `v3/public/demo.html` (the `/demo` surface, PRs #159-#178, v3.0.96->v3.0.115). This spec is the PR0 deliverable named in that plan's §5.

---

## §0. Scope and thesis

The `/demo` prototype has proven a shape end-to-end: a clickable [[wikilink]] note graph, a radial focus-browser ecosystem with word-wrapped bubbles, an ecotone overlay (internal / edge / external + edge-species glow), a Candidate / Organisation **lens** toggle, two seven-step journeys, and a printable Candidate Brief. This arc turns that prototype into a **real, additive feature inside the v3 app** without disturbing the result engine or the landing page.

**Thesis.** The WikiGraph is a new *reading surface* over data the v3 app already computes - it authors no new number. It REUSES the existing deterministic builder `buildKnowledgeGraph(result, title)` / `getKnowledgeGraph(result, title)` (App.jsx ~2923 / ~3216), the result panels (Job Anatomy, Skill Analysis, Demand Proof, Foundation, Progression, Crossover, Positioning, AI-exposure), the `Prov` chip component (App.jsx ~3612, kinds `mcf` / `computed` / `derived` / `ai` / `unverified`), the `KGGraph` render (RoleGraph.jsx ~404), the `C` palette and the `NEO` neumorphic shadows. The radical-sounding parts - ecosystem, ecotone, value stream - are presentation metaphors and **deterministic derivation rules**, never an LLM-authored structure. The honesty contract (§2) is the heart of this spec: every figure and every journey line carries a provenance tier, and thin evidence is **withheld, never invented**.

---

## §1. FROZEN surfaces (do not touch) - R-FREEZE

Inherited verbatim from `v3-result-engine-spec.md` §1 and `v3-knowledge-graph-spec.md` §1. The search box and first-run, occupation resolve, the browse card, skill extraction, the `engine-data/*.js` tables and `/api/claude` are FROZEN. R-FREEZE blocks packaging on any byte-drift. v1/v2 untouched.

**The six frozen symbols (byte-identical assertion, R-FREEZE):**
`searchOccupations`, `getSkills`, `getSkillsFromPosting`, `checkIscoCoherence`, `detectFunctionKeyword`, `lookupSeniorMgmt`.

**Frozen API files (byte-identical):** `api/mcf.js`, `api/claude.js`, and all of `engine-data/*`. The careers.gov.sg proxy `api/careers.js` (`action:"company"` / `action:"jobs"`) and the SGDI hierarchy path are CONSUMED read-only by this arc; no edit.

Additionally frozen for THIS arc (consumed, not edited):
- `buildKnowledgeGraph(result, title)` and `getKnowledgeGraph(result, title)` - the KG payload builder + cache. The WikiGraph READS this payload; it does not change the node/edge contract. (KG3 already supersedes the KG1 freeze of `buildKnowledgeGraph` itself; this arc adds NO further edit to it - see §3 AU-7 note.)
- `buildGraphStructure`, `parseJobAd`, `_fmtJobAd` - the layered graph + section parser.
- The existing v3 **landing page is NOT replaced** (Human Lead directive): the WikiGraph is an additive fourth way in (§7.1).

**The LLM never authors structure.** `api/claude.js` (Haiku, narration-only, already frozen) may produce prose for the `ai`-tier lines ONLY. It may never author a number, a verdict, a link, an edge, a realm or a value-stream tag. Digits are stripped from narration output (the established `claude-fable-5` + digit-strip pattern, per CJ1/CJ3).

---

## §2. The honesty contract - the four-tier provenance mapping (the heart of this spec)

Every figure and **every journey line** in the feature MUST carry a chip matching its tier. The chip kinds already exist in `Prov` / `PROV` / `ProvLegend`; this arc adds no new chip kind.

| Tier | Chip (`Prov kind`) | What it covers in the WikiGraph | Reproducible? |
|---|---|---|---|
| **VERBATIM** | `mcf` (● from posting) | Job-ad facts (title, employer, salary, experience, qualifications); SGDI org structure; live careers.gov.sg roles - copied, never reworded | Yes - copied |
| **COMPUTED** | `computed` (✓ computed) | AI-exposure index + resilience (engine: SSOC->ISCO->SOC->AIOE); ESCO/ISCO mappings; the headline numbers; the engine `mirrorRoles` pick | Yes - same input -> same output |
| **DERIVED** | `derived` (◐ derived) | Cross-ad pattern counts ("seen in 2 of 2 ads"), demand recency, salary percentiles - deterministic counts over the corpus | Yes - for this sample |
| **ADVISORY** | `ai` (~ AI estimate) | Narration; the journey prose; value-stream value-creating/eroding tags; the ecotone realm classification; positioning; the 7/14/30 plan. For "next best move" the engine PICK is computed (`✓`), the SENTENCE is advisory (`~`) | No - varies; withheld if unsupported |

**Per-line source tier is MANDATORY (R-WIKI-TIER, propose as new rule).** No journey line, graph node, edge label, or panel figure renders without a tier. The deterministic-vs-advisory ratio must therefore be *provable*: a test enumerates every rendered line and asserts each carries exactly one tier from the table. A line that would be advisory but is *unsupported* by any deterministic fact is **withheld**, not narrated.

**Candid flag (carried from the plan §2).** The candidate / organisation **journeys lean on the advisory tier** more than today's result page. The discipline: every journey line traces to a deterministic fact OR carries `~`; the edge / value-stream reads use a **real derivation rule** (§4, §5), not LLM prose.

### §2.1 Derivation rules (NOT LLM prose) - the load-bearing honesty mechanism

The two "advisory-looking" classifications are made by **deterministic rules** in code, then optionally NARRATED by the LLM. The rule is the control; the prose is advisory and discarded on disagreement.

- **`realmOf(node)` -> `internal | edge | external`** (mirrors the demo `realmOf`, App.jsx-side helper `wikiRealmOf`):
  - `external` IF the node is an external stakeholder / regulator / customer / vendor - detected by a FIXED marker set (e.g. node `type` in `{regulator, customer, vendor, external-stakeholder}` OR the verbatim node label / `typeLabel` contains a closed marker `["external", "regulator", "customer", "vendor", "client", "MAS", "SGDI parent ministry"]`). Markers are matched against VERBATIM posting / SGDI text only.
  - `edge` IF the node is **boundary-spanning**: an internal node that carries an edge to at least one `external` node (a skill or role linking inside to outside, e.g. Stakeholder Management linking the role to a regulator). Edge = the ecotone.
  - `internal` otherwise (the default).
  - Tier: `derived` for the boolean classification (it is a deterministic transform over verbatim markers + the existing edge set); the *narration* of why a node is "where work is human-led" is `ai`.
- **Value-stream tag -> `value-creating | value-capturing | value-eroding`** (`valueTagOf(step)`):
  - `value-creating` IF the step produces a deliverable the role node `produces` (reuse the `produces` verb already in `KG_VERBS`).
  - `value-capturing` IF the step is `accountable-to` an organisation node (governance / reporting that secures value).
  - `value-eroding` IF the step has NO value-add and exists ONLY to bridge a handoff - detected deterministically as a step that is a pure connector (in-degree >= 1 and out-degree >= 1, no `produces` edge, label carries a fixed handoff marker `["hand off", "route to", "forward", "escalate", "consolidate inputs", "reconcile between"]`).
  - No rule matches -> the step is `untagged` and shown with NO value verdict (withhold over fabricate).
  - Tier: `derived` for the tag; `ai` for the sentence that explains it.

**Engine-wins:** if the LLM narration contradicts a rule output (e.g. narrates a node as "external" that `realmOf` calls `internal`), the rule value renders and the narration line is discarded for that figure. No LLM string is parsed into a realm, tag, or number.

### §2.2 Withhold floors

| Surface | Withhold floor (below this -> withheld, not invented) |
|---|---|
| Cross-ad pattern count | < 2 ads in the corpus for that role key -> no "seen in N of M" count; show "single ad" caveat |
| Demand-Proof | < 4 live postings -> demand read withheld (inherits the D4 floor) |
| Ecotone realm | no external-marker match and no boundary edge -> node stays `internal`; no `edge`/`external` lane faked |
| Value stream | no rule match for a step -> `untagged`, no verdict drawn |
| Competition cluster | no computed `mirrorRoles` -> cluster `present:false`, omitted (inherits KG1 §6) |
| Journey line | no deterministic fact AND no defensible advisory ground -> line omitted from the journey |
| Candidate Brief | a row whose source is withheld renders "not enough evidence" - never a fabricated value |

---

## §3. Radicality band

**ADDITIVE.** New `src/wiki/*` modules + a new `?view=wiki` surface (or a fourth home card - §7.1), reusing the existing KG builder, result panels, `Prov`, `KGGraph`, `C` palette and `NEO` shadows. No existing number, occupation, ranking or verdict moves; no frozen symbol is edited; no new external API call beyond the already-wired `api/mcf.js` / `api/careers.js` read paths. No architecture rewrite and no data-source replacement -> per CLAUDE-FULL §6.2 a feature add on the flat patch line.

> **AU-7 note (frozen-door adjacency, no unfreeze).** The WikiGraph CONSUMES `buildKnowledgeGraph` / `getKnowledgeGraph` and `realmOf`-style classification. KG3 (v3.0.86) already amended the KG1 freeze of `buildKnowledgeGraph` (the "0 edges" fix). This arc adds NO further edit to that symbol: the realm and value-stream classifiers live in NEW `src/wiki/*` helpers (`wikiRealmOf`, `valueTagOf`, `buildWikiGraph`) that READ the KG payload, exactly as the KG payload reads `result`. If a future slice needs a field added to the KG payload itself, that is a SEPARATE KG-arc AU-7, quoted verbatim and justified there - not folded silently into this arc. Prior KG1/KG3 wording stands.

---

## §4. Data model - the wiki node / edge shape

The WikiGraph payload EXTENDS the KG payload (§7 of `v3-knowledge-graph-spec.md`) with two fields; it does not redefine the KG contract. `buildWikiGraph(result, title)` reads `getKnowledgeGraph(result, title)` and decorates.

```json
{
  "nodes": [
    {
      "id": "skill:stakeholder",          // reuse KG ids (_rgSlug)
      "type": "skill",                     // role | duty | skill | occupation | qualification | organisation | mirror-occupation | stakeholder
      "cluster": "individual",             // KG cluster axis (individual | department | organisation | competition | unscoped)
      "realm": "edge",                     // NEW - internal | edge | external, from wikiRealmOf() (derived)
      "source_tier": "derived",            // NEW - mandatory per-node tier: mcf | computed | derived | ai
      "label": "Stakeholder Management",   // verbatim / pass-through; never reworded by an LLM
      "source": "mcf",                     // KG node provenance (unchanged)
      "confidence": "high",                // carried, never rounded away
      "count": 3,                          // cross-ad repeat count where >= 2 ads (derived); absent below the floor
      "level": "HUMAN"                     // AI-exposure level where present
    }
  ],
  "edges": [
    {
      "source": "role:da", "target": "skill:stakeholder",
      "verb": "depends-on",                // MUST be a member of KG_VERBS (closed set, unchanged)
      "weight": 0.85,
      "crossesRealm": true,                // NEW - derived: realmOf(source) !== realmOf(target); the ecotone link
      "source_tag": "computed"
    }
  ],
  "realms": [
    { "id": "internal", "label": "Internal",       "present": true },
    { "id": "edge",     "label": "Edge (ecotone)", "present": true },
    { "id": "external", "label": "External",        "present": false }
  ],
  "valueStream": [
    { "step": 1, "label": "...", "tag": "value-creating", "source_tier": "derived" }
  ],
  "version": "wiki1",
  "generatedAt": "<ISO>",
  "stats": { "nodes": 0, "edges": 0, "realmsPresent": 2, "advisoryLines": 0, "deterministicLines": 0 },
  "withheld": ["external: no external-stakeholder marker in this ad; competition: no mirror-role data"]
}
```

Notes:
- `realms[].present:false` is the honest signal that a realm was sought but ungroundable; the matching nodes/lane are absent (mirrors KG `clusters[].present`).
- `stats.advisoryLines` / `stats.deterministicLines` make the deterministic-vs-advisory ratio inspectable (R-WIKI-TIER), surfaced in the build journal and the conformance audit.
- `withheld` is the faithful-fidelity record of what was deliberately not drawn and why.

### §4.1 Cross-ad aggregation rule

Reuse the KG corpus already on `result.responsibilitiesData.jobs` (the postings the result page fetched; same source D4 uses - no re-fetch). For a node label present in >= 2 ads, emit `count = N` and the chip `◐ derived` ("seen in N of M ads"). Below the floor (< 2 ads): no count, a "single ad" caveat. The aggregation is a pure deterministic tally; no LLM, no `Date.now()` in the key (key is `wiki1 | roleKey | result.source`, mirroring the KG cache idiom).

---

## §5. The two lenses and the journeys - each step mapped to (a) reused panel and (b) tier

The lens toggle changes panel CONTENT, not the graph (demo §4.2). Both journeys are reorderings of EXISTING v3 reads; the WikiGraph adds no new engine computation.

### §5.1 Candidate lens (on a role) - the seven-step journey

| # | Step | Reused v3 panel / symbol | Tier(s) |
|---|---|---|---|
| 1 | Job Anatomy | `scoreJobAnatomy` / Job Anatomy panel (work-layer mix + AI-resilience) | `computed` |
| 2 | Skill Analysis | `result.skills` + the 4-level AI rubric (Skill Analysis panel) | `computed` figure; `ai` narration |
| 3 | Demand Proof | `demandProof(jobs, nowMs)` (D4) - recency / salary / verdict | `derived`; withheld < 4 ads |
| 4 | Foundation | Foundation panel gaps + the 7/14/30 plan | `~` advisory; gaps `derived` |
| 5 | The edge | `wikiRealmOf` (§2.1) - "stand where work is human-led" | `derived` rule; `~` sentence |
| 6 | Progression + Crossover | Progression / Crossover panels + engine `mirrorRoles` | `computed` |
| 7 | Positioning + Next move | Positioning panel; next-move PICK from engine, SENTENCE narrated | `computed` pick / `~` words |

**Candidate Brief** (printable one-pager, demo §4.3): consolidates AI-readiness (`computed`), Your edge (`derived`), Build next (`~`), Position (`~`), Next move (`computed` pick / `~` words). Every row carries its chip; a withheld source renders "not enough evidence". The footer: **"AI-assisted; human decides · Source · Confidence · Time-window"**. CV text is never exported (inherits B6).

### §5.2 Organisation lens (on a department / org) - the seven-step value stream

| # | Step | Reused source / derivation | Tier(s) |
|---|---|---|---|
| 1 | Outcome Map | duties carrying an org-level outcome marker (verbatim) | `mcf` / `derived` |
| 2 | Value Stream | `valueTagOf` (§2.1) per step + lead-time counts | `derived` tag; `~` narration |
| 3 | Capability Map | the constraint = the lowest-resilience layer (Job Anatomy) + root cause | `computed`; `~` cause |
| 4 | Dependency Map | internal vs external deps from `wikiRealmOf` (externals at the ecotone) | `derived` |
| 5 | Edge of core | Edge Strategy classification (Product / Journey / Enterprise edge) over the boundary nodes | `derived` rule; `~` narration |
| 6 | Future State | which steps AI absorbs vs stay human-led, from the per-step AI-exposure level | `computed`; `~` narration |
| 7 | So who to hire | links back to the live job ad / careers.gov.sg role | `mcf` (verbatim link) |

**No org-journey line invents a number.** Lead-time, value tags and dependency counts are deterministic tallies; the prose connecting them is `~` and discarded on disagreement.

---

## §6. Change map (file by file; real symbols; Touch / Add / Freeze)

### `v3/src/wiki/` - NEW MODULES (ADDITIVE; all pure / deterministic, no LLM, no fetch)
- **Add** `v3/src/wiki/buildWikiGraph.js` - `buildWikiGraph(result, title)` reads `getKnowledgeGraph(result, title)` and decorates each node with `realm` + `source_tier`, each edge with `crossesRealm`, emits `realms[]`, `valueStream[]`, `stats`, `withheld`. Schema-versioned `WIKI_GRAPH_VERSION = "wiki1"`. Cache keyed `wiki1 | roleKey | result.source` (mirrors `getKnowledgeGraph`).
- **Add** `v3/src/wiki/wikiRealmOf.js` - `wikiRealmOf(node, edges)` (§2.1 rule) + the closed `WIKI_EXTERNAL_MARKERS` constant.
- **Add** `v3/src/wiki/valueTagOf.js` - `valueTagOf(step, edges)` (§2.1 rule) + `WIKI_HANDOFF_MARKERS` + `WIKI_OUTPUT_MARKERS` closed constants.
- **Add** `v3/src/wiki/journeys.js` - the fixed `CANDIDATE_STEPS` / `ORG_STEPS` step tables (§5), each row naming its reused panel symbol and its tier. Framework is FIXED in code (the demo's structure); the LLM fills only the `~` sentences.
- R005 grep targets: `WIKI_GRAPH_VERSION`, `WIKI_EXTERNAL_MARKERS`, `WIKI_HANDOFF_MARKERS`, `WIKI_OUTPUT_MARKERS`, `buildWikiGraph`, `wikiRealmOf`, `valueTagOf`.

### `v3/src/wiki/WikiView.jsx` - NEW (render; ADDITIVE)
- **Add** the WikiGraph surface: the radial focus-browser (reuse `KGGraph` from RoleGraph.jsx for the graph render; word-wrapped bubbles, tap-to-recentre, depth trail), the **Ecotone overlay** toggle (internal blue / edge amber-glow / external teal; boundary links emphasised; `REALMC`-equivalent palette), the **Candidate / Organisation lens** toggle, the journey panels (§5), the Candidate Brief print view. No red/green; state by shape + label + text. 44px targets; `aria-label` on every SVG; keyboard-operable nodes (carry forward from `KGGraph` / LeapView). Footer "AI-assisted; human decides · Source · Confidence · Time-window".
- **Reuse** `Prov` for every chip; `ProvLegend` at the top of the surface.

### `v3/src/App.jsx` - ADDITIVE (entry only; no panel edit, no engine edit)
- **Add** the fourth entry: a "Career WikiGraph" home card AND/OR a `?view=wiki` route (Human Lead decision, §7.1). The existing landing cards, modes and result panels are byte-unchanged.
- **Freeze** `buildKnowledgeGraph`, `getKnowledgeGraph`, `Prov`, `PROV`, `ProvLegend`, `scoreJobAnatomy`, `demandProof`, all result panels - CONSUMED, not edited.

### `v3/src/RoleGraph.jsx` - FREEZE (consume `KGGraph` only)
- `KGGraph` is imported and rendered by `WikiView.jsx`. No edit to `RoleGraph.jsx`.

### `v3/src/main.jsx` - ADD one route (PR1)
- **Add** `?view=wiki`; keep `?view=leap`, `?view=graph`, `?view=spherical` exactly as they are.

### `v3/api/*.js` + `engine-data/*` - FREEZE
- No API change. `api/mcf.js`, `api/claude.js`, `api/careers.js`, `engine-data/*` byte-identical. The WikiGraph reads client-side `result` state already in memory (mirrors the C2/T3/D4/F5/KG1 inline-reuse AU-7 pattern).

### Out of scope this arc (explicit)
- A `?view=` JSON download/export button for the wiki payload (follow-up).
- Cross-posting / market-wide ecosystems (needs the market table; same out-of-scope as result-engine §4).
- Any learned model / embedding - "living ecosystem" / "neural" is the VISUAL metaphor only (radiating clustered graph), never a learned weight. The builder mints no embedding.
- Compare + re-assess loop -> PR5 or deferred (§7 open decision).

---

## §7. UI changes (additive; reference the plan §4 mockups)

### §7.1 Entry point (Human Lead open decision)
A fourth way in alongside the existing modes. Option 1: a "Career WikiGraph" home card ("See a role as a living ecosystem"). Option 2: a dedicated `?view=wiki` route (like leap / graph / spherical). **Nothing on the existing landing is removed.** Default assumption: additive card + route, not a landing replacement.

### §7.2 The WikiGraph view (radial ecosystem) - plan §4.2
Radial focus-browser (one centre, tap to re-centre, depth trail, **labels word-wrap never truncate**); Ecotone overlay toggle; Lens toggle (content, not graph); v3 neumorphic soft-UI, navy header, `#e6ebf2` bg, `NEO` shadows; **no red/green** (colour = layer, size = repeats, amber glow = edge species).

### §7.3 Journey panels - plan §4.3 / §4.4
Candidate journey (seven steps, §5.1) and Organisation value-stream journey (seven steps, §5.2), each line carrying its chip.

### §7.4 Provenance everywhere - plan §4.5
Every figure and journey line shows its chip (`● ✓ ◐ ~`); each artifact carries the footer "AI-assisted; human decides · Source · Confidence · Time-window". 44px touch targets; SVG `aria-label`; keyboard-operable nodes.

---

## §8. Build plan (phased PRs; matches plan §5)

Each PR ships as one PR: flat-patch bump `v3.0.<N>` (G1) + HDR journal entry + `index.html` + `package.json`/lock + `.serial-state.yml` bump + live verify on v3.takearoundabout.com. R-FREEZE exit 0; ASCII-only JSX (R007); no red/green.

| PR | Goal | Band | Files | Grounded in | Gate |
|---|---|---|---|---|---|
| **PR0** | This spec - node model, realm + value-stream derivation rules, the determinism mapping (each journey line -> tier), withhold floors, AU-7 for the frozen-door adjacency | spec | `v3-wikigraph-spec.md` | the plan + the demo | spec self-review (this document) |
| **PR1** | New entry + WikiGraph shell: `?view=wiki` route, radial graph reusing `KGGraph`; no journey yet | ADDITIVE | `main.jsx`, `App.jsx` (entry), `WikiView.jsx` | demo §4.2; brainsci-13-01462 (radial dendrogram, visual metaphor only) | a11y + regression (landing + leap/graph/spherical intact) |
| **PR2** | `buildWikiGraph` cross-ad engine + ecotone overlay (`wikiRealmOf`, `crossesRealm`) | ADDITIVE | `wiki/buildWikiGraph.js`, `wiki/wikiRealmOf.js` | edge-effect / ecotone PDF; the two Obsidian papers (job-ad ecosystem + flipbook) | conformance D1-D8 (no LLM -> number/realm) |
| **PR3** | Candidate lens journey wired to the LIVE engine panels + Candidate Brief | ADDITIVE | `wiki/journeys.js`, `WikiView.jsx` | v3 result engine (Job Anatomy / Skill Analysis / Demand Proof / Foundation / Progression / Crossover / Positioning); Lewis & McKone *Edge Strategy* (the edge step) | conformance G2/G3 + a11y footer |
| **PR4** | Organisation lens + value stream (`valueTagOf` derivation rule, not prose) | ADDITIVE | `wiki/valueTagOf.js`, `wiki/journeys.js`, `WikiView.jsx` | Teixeira *Customer Value Chain*; Steve Pereira *Flow Engineering*; Lewis & McKone *Edge Strategy* | conformance (derived vs advisory tags asserted) |
| **PR5** | Polish: Compare, re-assess loop; full a11y + honesty sweep; vault | ADDITIVE | `WikiView.jsx` | - | both review agents PASS |

**Lowest-risk order:** PR1 (shell, regression-only) -> PR2 (the deterministic engine, no LLM) -> PR3 (candidate journey) -> PR4 (org value stream) -> PR5 (polish).

---

## §9. Grounded-in (source per claim)

| Claim / component | Grounded in |
|---|---|
| Node / edge structure, closed verb set, honesty-gated clusters | the existing `buildKnowledgeGraph` / `getKnowledgeGraph` payload (`v3-knowledge-graph-spec.md` §5-§7); KG nodes are pass-through from real posting / ESCO / ISCO data |
| Job-ad facts, salary, experience, qualifications (VERBATIM) | `result.responsibilitiesData` (verbatim sampled MCF postings, ● from MCF); careers.gov.sg via `api/careers.js`; SGDI org structure |
| AI-exposure index + resilience (COMPUTED) | the deterministic engine SSOC->ISCO->SOC->AIOE (`engine-data/*`, `api/engine.js`); `scoreJobAnatomy` |
| Cross-ad pattern counts, demand recency, salary percentiles (DERIVED) | deterministic tallies over `result.responsibilitiesData.jobs`; `demandProof` (D4) |
| Radial ecosystem render (visual metaphor) | brainsci-13-01462 radial dendrogram (GNN figure) - VISUAL metaphor only, no learned model; the demo `/demo` radial focus-browser |
| Ecotone / edge realm classification | edge-effect / ecotone PDF; `realmOf` rule in `v3/public/demo.html` (REALMC internal/edge/external); deterministic `wikiRealmOf` (§2.1) |
| "Edge of core" (org step 5) | Lewis & McKone, *Edge Strategy* (Product / Journey / Enterprise edge) |
| Value-stream value-creating / capturing / eroding tags + lead time | Teixeira, *Customer Value Chain*; Steve Pereira, *Flow Engineering*; deterministic `valueTagOf` (§2.1) |
| Job-ad ecosystem + role/dept/role flipbook framing | the two Obsidian papers (job-ad ecosystem; flipbook) - framing only; every figure still traces to repo data |
| Candidate Brief one-pager | reuses B6 `CandidateBrief` pattern; Fuller "Hidden Workers" + STARs (inherited) |

Each row maps to a REAL repo data source AND a cited paper/standard. Any component with no source is cut or marked `[UNVERIFIED]` (non-inventive contract).

---

## §10. Acceptance criteria (in-repo fixtures; determinism asserted)

Golden inputs (do not invent test data):
- `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+ PDF) - NHG Asst Director, Technology Strategic Planning.
- `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+ PDF) - PSD Senior Manager / Asst Director, Job Redesign.
- Metta Welfare Transformation Manager, uuid `2320493d0e875075d4dbfa6a893b3fdb`.

A. **Non-inventive nodes.** Every wiki node `label` traces to a real source (the KG payload it decorates already guarantees this; the wiki layer reworders nothing). A test asserts `buildWikiGraph` adds no node absent from `getKnowledgeGraph`.
B. **Per-line tier (R-WIKI-TIER).** Every rendered node, edge label, journey line and Brief row carries exactly one tier (`mcf`/`computed`/`derived`/`ai`). A test enumerates rendered lines and asserts a tier on each; `stats.deterministicLines`/`advisoryLines` sum to the total.
C. **Realm rule, not LLM.** `wikiRealmOf` returns `internal`/`edge`/`external` purely from the marker set + edge boundary; a test asserts a node with no external marker and no boundary edge stays `internal`, and `realms[].present:false` for an absent realm with `withheld` naming it. No LLM in the realm loop.
D. **Value-stream rule, not LLM.** `valueTagOf` tags a step only when a §2.1 rule fires; an unmatched step is `untagged` with no verdict. A test asserts no tag is authored by narration.
E. **Honesty / withhold.** On a thin ad (single posting): smaller graph, no cross-ad counts, demand withheld (< 4), `external`/`competition` lanes absent, journey lines without ground omitted - **never invented**. A test asserts the thin-ad payload withholds rather than fabricates (the plan's honesty test).
F. **Determinism.** `buildWikiGraph(result, title)` returns byte-identical `{nodes, edges, realms, valueStream}` across repeated runs on the same `result` (snapshot per fixture, R-SNAPSHOT); `generatedAt` excluded; no `Date.now()` in ids/ordering.
G. **Engine-wins.** A constructed case where narration contradicts a rule output asserts the rule value renders and the narration line is discarded.
H. **Frozen door intact.** R-FREEZE passes: the six frozen symbols, `buildKnowledgeGraph`, `getKnowledgeGraph`, `buildGraphStructure`, `parseJobAd`, `api/mcf.js`, `api/claude.js`, `api/careers.js`, `engine-data/*` byte-identical to `main`; landing page + leap/graph/spherical routes unchanged.
I. **A11y + honesty.** Render verified desktop + mobile: no red/green; `Prov` chip on every figure and journey line; realm lanes labelled; 44px targets; SVG `aria-label`; keyboard nodes; footer "AI-assisted; human decides · Source · Confidence · Time-window".

---

## §11. Non-inventive gates (result-engine-spec §6)

**Hard gates (block merge):**
1. No LLM string parsed into a number, node, edge, verb, realm, value-tag or cluster anywhere in the WikiGraph.
2. Every rendered figure and journey line carries a `Prov` chip (R-WIKI-TIER).
3. `[UNVERIFIED]` or a withheld value where a data link is thin - never fabricated (§2.2 floors).
4. Crosswalk / ambiguity carried as confidence + `withheld`, never a fake point.
5. Determinism: same `result` -> identical payload (snapshot).
6. Engine/rule-wins on any LLM disagreement.

**D1-D8 (static prompt audit): REQUIRED for the journey-narration prompts** added in PR3/PR4 (the `~` sentence generators in `wiki/journeys.js`). Confirm each prompt cannot author a number / realm / tag / link, has a JSON-or-prose-only contract, carries no invention licence, and is digit-stripped (the `claude-fable-5` pattern). PR1/PR2 add NO prompt -> the auditor confirms "no new prompt" explicitly, not skips.

**G1-G8 (live read audit): REQUIRED** - run on the rendered WikiGraph for one deployed posting. Confirm `Output = ƒ(Prompt, Context, Control)` holds: the engine/builder authors every number, realm and tag; the LLM narrates only; provenance chips present; withhold fires on the thin ad (G7 determinism on the fixture).

**AU-7 (frozen-door adjacency):** §3 records the no-unfreeze note. If a build PR finds it genuinely needs a field added to the KG payload, STOP and surface the conflict to the Human Lead; do not fold it into this arc silently.

---

## §12. Pre-mortem (result-engine-spec §9 shape; run before PR1)

| Risk | Likelihood | Guard |
|---|---|---|
| The journeys lean advisory and an `~` line reads as fact | Med-High | R-WIKI-TIER: every line carries a tier; `stats.advisoryLines`/`deterministicLines` make the ratio provable; a journey line with no ground is OMITTED, not narrated (§2.2) |
| Realm / value-stream tag authored by LLM prose instead of a rule | Med | `wikiRealmOf` / `valueTagOf` are pure rule functions (§2.1); tests C/D assert no narration authors a realm or tag; engine-wins on disagreement |
| "external" / "competition" lane faked to fill the ecotone on a thin ad | Med-High | §2.2 floors: no marker + no boundary edge -> stays internal; `realms[].present:false` + `withheld`; test E asserts no faked lane |
| The WikiGraph silently edits `buildKnowledgeGraph` and breaks `?view=graph` | Med | wiki helpers are NEW `src/wiki/*` modules that READ the KG payload; `buildKnowledgeGraph`/`getKnowledgeGraph` byte-frozen (R-FREEZE); §3 AU-7 note |
| Landing page or an existing `?view=` route regresses | Med | PR1 gate is regression-only (landing + leap/graph/spherical intact); additive route, additive card |
| Non-determinism from object/array ordering or `Date.now()` | Low | deterministic sort keys; ids from the KG payload; `generatedAt` excluded from snapshot |
| Red/green creeps into the ecotone palette (internal/edge/external) | Low | blue / amber / teal only (REALMC equivalent); a11y-honesty-reviewer asserts no red/green; state by shape + label |
| em/en dash or non-ASCII slips into a JSX string | Low | R007 + house grammar (hyphens only); reviewer check before packaging |
| Module-level const (`WIKI_*`) dropped by chat compaction in a long build | Med | R005 grep list extended; missing const blocks packaging |

---

## §13. Verification (run before each version bump)

- `npm run build` green; R-FREEZE byte-identical (the six frozen symbols + `buildKnowledgeGraph` + `api/*` + `engine-data/*`); conformance-auditor (D1-D8 where prompts exist + G1-G8) + a11y-honesty-reviewer PASS.
- Determinism snapshot: same posting -> identical `buildWikiGraph` payload (the headline numbers and realm/tag classifications), R-SNAPSHOT on NHG / PSD / Metta.
- Live check on v3.takearoundabout.com after merge: a role shows the candidate journey grounded in real engine output; a department shows the value stream; provenance chips present on every line; the landing page and existing routes unchanged.
- **Honesty test (the load-bearing gate):** a thin job ad -> smaller graph, withheld cross-ad counts, withheld demand, absent external/competition lanes, lower confidence - **never invented**.

---

## §14. Version gate

On each PR landing: surface `Rule V-1 / G1` to the Human Lead - `Rule WIKI-PRn fired: <one-line>. Prescribed: bump v3.0.<N> -> v3.0.<N+1> (additive feature, flat patch line). Confirm? (yes/no/modify)`. On yes: bump per R003 in all three (`App.jsx` line-1 header, `index.html` title, `package.json` version), write the HDR journal entry, bump `.serial-state.yml`, live verify.

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.N | NNNkb | N,NNN lines
[INTENT] which WikiGraph slice this PR delivers (entry / engine / candidate / org / polish)
[DELTA] one line per change
[RISK] Low/Med/High + reason
[STATUS] ALPHA/BETA/STABLE
[TEST] snapshot on NHG/PSD/Metta + live verify; tier + realm + no-fake-lane assertions
[NEXT] one action for the Lead
[ADVICE] prompt technique + one-line reason
```

---

*End of spec. STATUS: READY_FOR_BUILD. Next agent: `result-engine-builder` (start at PR1: entry + WikiGraph shell).*
