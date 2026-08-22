(№ 1 - 18-06 '26 14:40 SGT)

# SG Career View v3 - Knowledge-Graph slice spec ("the role as a wired structure, not a wall of nouns")

> **Target repo path:** `v3/script/v3-knowledge-graph-spec.md` (build docs live in `v3/script/`; the locked-contract docs it depends on remain in `doc/`).
> **Status:** READY_FOR_BUILD. **Proposed version:** flat patch line `v3.0.<N>` per the result-engine-spec SS11 AU-7 (no minor roll); the next free patch at build, confirmed at the G1 gate (Rule V-1). Single PR: **KG1**.
> **Contract alignment:** the locked v3 contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) governs every line. Deterministic = control; LLM = advisory only; non-inventive ("withhold over fabricate"); faithful fidelity (ranges stay ranges, confidence carried).
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR blocks) bind this spec; recipe R-FREEZE runs before packaging.

---

## §0. Scope

This slice delivers one new Placement-Read artefact: a **structured knowledge-graph payload** `{ nodes:[], edges:[] }` for the selected MyCareersFuture role, derived deterministically from data the result page already holds (responsibilities, skills, ESCO-resolved occupation, comparison postings), and a render of that graph in the existing `?view=graph` surface. The graph answers the Human Lead's request - entity extraction, semantic clustering, relational mapping, JSON export - but does so under the non-inventive contract: every node is EXTRACTED from real posting text or existing engine data, never invented; every edge verb is drawn from a fixed closed set; ungroundable clusters are omitted, not faked. The slice introduces a new deterministic builder, `buildKnowledgeGraph(result, title)`, that emits a schema-versioned payload alongside (not replacing) the existing `buildGraphStructure` output.

---

## §1. FROZEN surfaces (do not touch)

Identical to `v3-result-engine-spec.md` §1 and `v3-stewardship-spec.md` SS1. The search box and first-run, occupation resolve (`getEscoSkills`, `resolveOccupation`, `ISCO_COHERENCE_MAP`), browse card, skill extraction (`getSkills`, `getSkillsFromPosting`), the `engine-data/*.js` tables, and `/api/claude` are FROZEN. R-FREEZE blocks packaging on any byte-drift of those symbols. v1/v2 untouched.

Additionally frozen for THIS slice:
- `_fmtJobAd`, `parseJobAd`, `_jdKind`, `_JD_KIND_RE` - the Slice-2 section parser. KG1 CONSUMES its output; it does not edit it.
- `buildGraphStructure(title, source, statements, skills, mapping, iscoCandidates)` and `buildRoleGraph(result, title, onStep)` - the existing graph pipeline. KG1 adds a PARALLEL builder; the existing one stays byte-identical (justification in §3).

---

## §2. Radicality band

**ADDITIVE.** One new deterministic function (`buildKnowledgeGraph`) and one new schema-versioned JSON shape, rendered through the existing `?view=graph` surface. No existing number, occupation, ranking or verdict moves; no frozen symbol is edited; no new external API call (the builder reads data already on `result`). No architecture rewrite and no data-source replacement, so per CLAUDE-FULL §6.2 this is a feature add on the flat patch line.

---

## §3. Approach decision - extend vs new builder (REQUIRED by the Human Lead brief)

**Decision: ADD a new parallel builder `buildKnowledgeGraph(result, title)`. Do NOT extend `buildGraphStructure`.**

Reasoning, named against the real symbols:

1. **Different contract.** `buildGraphStructure` (App.jsx ~2434) emits a FIXED 4-column layered shape - `columns:["responsibility","mcfRole","iscoOccupation","escoSkill"]`, node `type` in that closed set, edge `kind` in `{role-responsibility, role-occupation, role-skill, occupation-skill, skill-responsibility}`, no `cluster`, no `verb`, no `confidence`, no per-node `provenance`. The Human Lead asks for a NEW schema (cluster axis, precise verbs, confidence, provenance tag). Bolting cluster/verb/confidence onto the existing nodes/edges would change the contract that `RoleGraph.jsx` and `graph-data.json` (the baked offline payload) already consume - that is a silent break of a working surface.

2. **Different cluster axis.** The existing builder's "columns" are an ESCO-ISCO layering. The new ask is an organisational-scope clustering (individual / department / organisation / competition). These are orthogonal; one node legitimately carries both (its layer AND its scope cluster). A parallel builder keeps each concern clean.

3. **Reuse, not duplicate.** `buildKnowledgeGraph` REUSES the deterministic primitives already proven: `gatherStatements(result)` for itemised duties, `mapStatementsToEsco` edge logic shape, `_phraseNorm`/`_phraseToks` for token matching, `_rgSlug` for ids, and `result.skills` / `result.escoOccupation` / `result.responsibilitiesData.jobs`. It does not re-fetch and does not re-run the LLM pipeline.

4. **No silent break.** `buildGraphStructure` stays byte-identical (R-FREEZE asserts it). The new payload ships under its own version tag `KG_GRAPH_VERSION` so a consumer reads one or the other explicitly.

---

## §4. Change map (file by file; real symbols; Touch / Add / Freeze)

### `v3/src/App.jsx` - ADDITIVE
- **Add** `const KG_GRAPH_VERSION = "kg1";` (module-level; goes on the R005 grep list).
- **Add** the closed verb set as a frozen module constant:
  `const KG_VERBS = ["depends-on", "invokes", "produces", "informs", "mutates", "accountable-to", "competes-with"];`
  No other verb may appear on an edge. (Set justified in §5.)
- **Add** `buildKnowledgeGraph(result, title)` -> `{ nodes, edges, clusters, version, generatedAt, stats, withheld }`. Pure, deterministic, no LLM, no fetch. Pipeline:
  1. **Entity extraction (deterministic).** Pull nodes from real sources only:
     - duty nodes from `gatherStatements(result).responsibilities` (text/cat/level/sk);
     - skill nodes from `result.skills` (skill/escoUri/level/skillType);
     - occupation node(s) from `result.escoOccupation` and the ISCO candidates already computed (reuse `scoreIscoCandidates` output if present on `result`, else skip - do not recompute);
     - the role node from `title` + `result.source`;
     - qualification / requirement nodes ONLY where present as classified `req`-kind sections in `parseJobAd(jobText)` (verbatim phrase), else omitted.
  2. **Semantic clustering (deterministic, honesty-gated).** Assign each node a `cluster` from the requested axis, but ONLY where the source grounds it (see §6 cluster design). A node whose scope cannot be grounded from a single ad is tagged `cluster:"unscoped"` and the cluster is NOT presented as one of the four; ungroundable clusters (typically `competition`) are OMITTED entirely rather than faked.
  3. **Relational mapping (deterministic).** Emit edges using a verb chosen by a FIXED rule table (§5), never by free choice. Reuse the existing duty<->skill edge logic shape from `mapStatementsToEsco`.
  4. **Output.** Return the `{ nodes, edges }` payload (schema §7).
- **Add** a thin accessor that the render path calls, cached by an evidence hash keyed on `KG_GRAPH_VERSION` + role key + `result.source` (mirror the `_roleGraphCache` idiom; one build per role).
- **Respect** R005 (grep `KG_GRAPH_VERSION`, `KG_VERBS`, `buildKnowledgeGraph` before packaging), R006 (no multi-line async arrow in JSX props), R007 (ASCII only; hyphens, never em/en dash).

### `v3/src/RoleGraph.jsx` - ADDITIVE (render only)
- **Touch** to accept and render the new payload when present (cluster lanes + verb-labelled edges), behind the existing `?view=graph` surface. Keep the foreignObject cards, curved edges, barycenter ordering, tap-to-trace, blue/orange/cyan palette (no red/green), 44px targets, `aria-label`. Provenance chips per node use the existing `PROV` map (mcf / computed / inferred / none). Do NOT remove the existing `DATA`-driven layered render; the new payload is rendered when supplied, the baked one otherwise.

### `v3/api/*.js` - FREEZE
- No API change. The builder reads client-side `result` state; no new endpoint, no CSP change (mirrors the C2/T3/D4/F5 inline AU-7 pattern in the result-engine spec).

### Out of scope this slice (explicit)
- A `?view=` JSON download/export button (the payload is the deliverable; a download UI is a follow-up KG1.2 if the Human Lead wants it).
- Cross-posting / market-wide graphs (needs the market table; out of scope, same as result-engine §4).
- Any neural-network model or learned embedding - "brain-like" / "neural-network visualisation UI" is honoured as the VISUAL metaphor (radiating clustered graph), NOT as a learned model. The builder mints no embedding and no learned weight.

---

## §5. Edge verbs - the fixed closed set and the rule table

The Human Lead asked for "precise verbs - invokes, depends-on, mutates". An LLM must NOT pick the verb freely (that would let advisory prose author structure). The verb is chosen by a DETERMINISTIC rule table keyed on the (source-type, target-type) pair plus the existing edge `kind`. Closed set:

| Verb | Meaning | Deterministic trigger (source -> target) |
|---|---|---|
| `depends-on` | needs the target to be performed | duty -> skill (the duty draws on that skill, from `mapStatementsToEsco` edges) |
| `invokes` | calls on / activates | role -> duty (the role activates the duty) |
| `produces` | yields the target as output | duty -> deliverable/output token where the duty text contains a deterministic output marker (e.g. "report", "plan", "strategy", "framework") |
| `informs` | feeds judgement into | skill -> occupation (the skill is evidence for the ISCO occupation match, from the occupation fingerprint) |
| `mutates` | changes the state of | duty -> organisation node where the duty text contains a deterministic change marker (e.g. "transform", "improve", "redesign", "implement", "lead change") |
| `accountable-to` | reports / answerable to | individual/department node -> organisation node (scope hierarchy edge) |
| `competes-with` | rivals for the same demand | occupation -> mirror-occupation, ONLY if the result already carries computed mirror-roles; else NOT emitted |

**Rule:** the verb is a pure function of node types + the existing edge kind + a fixed keyword marker list. If no rule matches, the edge is NOT emitted (withhold over fabricate). No LLM is in the verb-selection loop.

---

## §6. Cluster design - reconciling "individual / department / organisation / competition" with a single ad

The Human Lead named four cluster axes. Honesty assessment against what ONE MCF posting actually supports:

| Cluster | Groundable from one ad? | Source | KG1 decision |
|---|---|---|---|
| **individual** | YES | the role's own duties + skills + qualifications (what the post-holder personally does) | INCLUDED - the default cluster for duty / skill / qualification nodes |
| **department** | PARTIAL | the role node + duties that name a function/team ("the Transformation team", "Strategic Planning") via a deterministic marker; the ESCO/ISCO occupation that situates the role in a function | INCLUDED where a function marker or the occupation node grounds it; else the node stays `individual` |
| **organisation** | PARTIAL | the hiring org (verbatim from posting metadata only, never inferred) + duties carrying an org-level change/governance marker; mutates/accountable-to edges point here | INCLUDED only if the posting names the org or carries org-level markers; the org node label is verbatim or the node is omitted |
| **competition** | NO (from a single ad) | would require market/sector data the ad does not contain | OMITTED by default. Promoted to INCLUDED ONLY if the result already carries computed mirror-roles (engine `mirrorRoles`); then it holds the `competes-with` occupation edges. With no mirror data, the cluster does not appear at all - it is NOT faked. |

**Honest principle:** clusters are presented only when grounded. A graph for a thin ad may legitimately show two clusters (individual, department) and withhold the other two. The render labels present clusters and silently omits absent ones; it never draws an empty "competition" lane to satisfy the four-axis request. This is the "withhold over fabricate" rule applied to structure.

---

## §7. Node / edge schemas (the exported JSON contract)

```json
{
  "nodes": [
    {
      "id": "duty:r3",                       // stable slug id (reuse _rgSlug)
      "type": "duty",                        // role | duty | skill | occupation | qualification | organisation | mirror-occupation
      "cluster": "individual",               // individual | department | organisation | competition | unscoped
      "label": "Lead the technology strategic planning roadmap",  // verbatim or pass-through; never reworded by an LLM
      "source": "mcf",                       // mcf (verbatim posting) | esco (ESCO/ISCO data) | computed (engine) | derived (deterministic transform)
      "confidence": "high",                  // high | medium | low - carried, never rounded away
      "level": "HUMAN",                      // optional, AI-exposure level where the source node has one
      "ref": { "escoUri": "", "iscoCode": "" } // optional provenance back-pointers
    }
  ],
  "edges": [
    {
      "source": "role:asst-director-...",    // node id
      "target": "duty:r3",                   // node id
      "verb": "invokes",                     // MUST be a member of KG_VERBS (closed set)
      "weight": 0.85,                        // 0.05..1, from the existing deterministic edge strength
      "source_tag": "computed"               // provenance of the EDGE: how it was derived (computed | derived | mcf)
    }
  ],
  "clusters": [
    { "id": "individual",  "label": "Individual",  "present": true },
    { "id": "department",  "label": "Department",   "present": true },
    { "id": "organisation","label": "Organisation", "present": false },
    { "id": "competition", "label": "Competition",  "present": false }
  ],
  "version": "kg1",
  "generatedAt": "<ISO>",
  "stats": { "nodes": 0, "edges": 0, "clustersPresent": 2 },
  "withheld": ["competition: no mirror-role data; organisation: org not named in posting"]
}
```

Notes: `clusters[].present:false` is the honest signal that an axis was requested but ungroundable; the matching nodes/edges are simply absent. `withheld` is a human-readable list of what was deliberately not drawn and why (faithful fidelity).

---

## §8. Where the LLM sits

**Nowhere in the structure.** The builder is fully deterministic: entity extraction reads real fields, clustering applies the §6 rule table, verbs apply the §5 rule table, weights reuse existing deterministic edge strengths. Same `result` -> byte-identical payload.

**Optional advisory narration only (deferred, not part of KG1 acceptance):** if a one-line plain-English caption of the graph is later wanted, it routes through the existing `claudeCall` + `extractJSON` + `narrateRoleGraph` idiom, tagged `~ AI estimate`, and is DISCARDED on disagreement (engine-wins). It authors no node, no edge, no verb, no number, no cluster. KG1 ships without it.

---

## §9. Grounded-in (source per claim)

| Claim / component | Grounded in |
|---|---|
| Duty / responsibility nodes | `result.responsibilitiesData.responsibilities` (verbatim from sampled MCF postings, ● from MCF) via `gatherStatements` |
| Skill nodes + AI-exposure level | `result.skills` (ESCO essential-skill mapping; level from the audited 4-level rubric) |
| Occupation / mirror nodes | `result.escoOccupation` + `scoreIscoCandidates` output (ESCO v1.2.1; ISCO-08); mirror-occupations from engine `mirrorRoles` where present |
| Verbatim org / qualification nodes | `parseJobAd(jobText)` `req`-kind and posting metadata (verbatim) |
| Cluster axis (individual/department/organisation/competition) | Human Lead brief, reconciled to single-ad groundability (§6) |
| Edge verbs as relations | Human Lead brief; closed set fixed deterministically (§5) |
| "brain-like / neural-network UI" as visual metaphor only | honoured as the radiating clustered render in `RoleGraph.jsx`; no learned model (non-inventive) |

---

## §10. Acceptance criteria (use in-repo fixtures; determinism asserted)

Golden inputs (do not invent test data):
- `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+ PDF) - NHG Asst Director, Technology Strategic Planning.
- `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+ PDF) - PSD Senior Manager / Asst Director, Job Redesign.
- Metta Welfare Transformation Manager, uuid `2320493d0e875075d4dbfa6a893b3fdb`.

A. **Non-inventive nodes.** For each fixture, every node `label` traces to a real source: a duty node's text appears verbatim in `result.responsibilitiesData.responsibilities`; a skill node appears in `result.skills`; an occupation node appears in the ISCO candidates. A test asserts zero nodes whose label is not found in its cited source.
B. **Closed verb set.** Every edge `verb` is a member of `KG_VERBS`. A test asserts no edge carries a verb outside the set, and that no edge was emitted where no §5 rule matched.
C. **Honest clustering.** On a fixture with no computed mirror-roles, `clusters` shows `competition: present:false` and NO node carries `cluster:"competition"`; `withheld` names the omission. A test asserts no empty/faked cluster lane is rendered.
D. **Determinism.** `buildKnowledgeGraph(result, title)` returns byte-identical `{nodes, edges, clusters}` across repeated runs on the same `result` (snapshot test per fixture, recipe R-SNAPSHOT). No LLM, no `Date.now()`-dependent ordering (sort keys are deterministic; `generatedAt` is the only time-stamped field and is excluded from the snapshot comparison).
E. **Confidence carried.** Every node carries a `confidence` and every figure-bearing edge a `weight`; none is rounded away to a bare boolean.
F. **Schema valid.** The payload validates against §7 (required keys present; `version === "kg1"`).
G. **Frozen door intact.** R-FREEZE passes: `buildGraphStructure`, `parseJobAd`, `_fmtJobAd`, the resolver and engine-data symbols are byte-identical to `main`.
H. **A11y + honesty.** Render verified desktop + mobile: no red/green; provenance chip on every node; cluster lanes labelled; footer "AI-assisted; human decides" + Source / Confidence / Time-window.

---

## §11. Non-inventive gates (spec §6)

Hard gates that apply (block merge):
1. No LLM string parsed into a number, node, edge, verb or cluster (KG1 has no LLM in the loop; assert by inspection).
2. Every rendered node/figure carries a Prov chip.
3. Withhold over fabricate: ungroundable clusters omitted, unmatched edges dropped, thin ad -> fewer clusters, never faked.
4. Crosswalk / ambiguity carried as confidence + `withheld`, never a fake point.
5. Determinism: same `result` -> identical payload (snapshot).

**D1-D8 (static prompt audit): NOT REQUIRED for KG1** - no new prompt template is added (the optional narration in §8 is deferred; if it ships, D1-D8 applies to it then). State this explicitly in the build PR so the auditor confirms "no new prompt" rather than skips silently.

**G1-G8 (live read audit): REQUIRED** - run on the rendered graph for one deployed posting. Confirm `Output = ƒ(Prompt, Context, Control)` holds with the Prompt term EMPTY: the engine/builder authors the entire structure, provenance chips present, withhold fires on the ungroundable cluster (G7 determinism on the fixture).

---

## §12. Pre-mortem (spec §9 shape; run before build)

| Risk | Likelihood | Guard |
|---|---|---|
| Builder invents a node label not in source (e.g. a paraphrased duty) | Med | nodes are pass-through only; acceptance test A asserts every label is found in its cited source; any miss drops the node |
| "competition" cluster faked to satisfy the four-axis ask on a single ad | Med-High | §6 omits competition unless computed mirror-roles exist; `clusters[].present:false` + `withheld` make the omission explicit; test C asserts no faked lane |
| Edge verb chosen loosely / an LLM creeps into verb selection | Med | KG_VERBS is a closed module constant; §5 rule table is pure; test B asserts membership and no-rule-no-edge |
| Silent break of the existing `?view=graph` baked payload (`graph-data.json`) | Med | new builder is PARALLEL under `KG_GRAPH_VERSION`; `buildGraphStructure` byte-frozen (R-FREEZE); render falls back to the baked payload when the new one is absent |
| Non-determinism from object/array ordering or `Date.now()` in ids | Low | deterministic sort keys; ids from `_rgSlug`/duty index, not time; `generatedAt` excluded from snapshot |
| em/en dash or non-ASCII slips into a JSX string | Low | R007 + house grammar (hyphens only); reviewer check before packaging |
| Module-level const (`KG_VERBS`, `KG_GRAPH_VERSION`) dropped by chat compaction | Med | R005 grep list extended; missing const blocks packaging |

---

## §13. Version gate

On KG1 landing: surface `Rule V-1 / G1` to the Human Lead - `Rule KG1 fired: knowledge-graph builder + render. Prescribed: bump v3.0.<N> -> v3.0.<N+1> (additive feature, flat patch line). Confirm? (yes/no/modify)`. On yes: bump per R003 in all three (`App.jsx` line-1 header, `index.html` title, `package.json` version), write the HDR journal entry, bump `.serial-state.yml`, live verify on v3.takearoundabout.com.

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.N | NNNkb | N,NNN lines
[INTENT] knowledge-graph payload + clustered render for the selected MCF role
[DELTA] one line per change
[RISK] Low/Med/High + reason
[STATUS] ALPHA/BETA/STABLE
[TEST] snapshot on NHG/PSD/Metta + live verify; verb-set + no-fake-cluster assertions
[NEXT] one action for the Lead
[ADVICE] prompt technique + one-line reason
```

*End of spec. STATUS: READY_FOR_BUILD. Next agent: `result-engine-builder` (KG1).*
