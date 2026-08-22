# Plan — the real occupation↔skill graph substrate (offline research)

Goal: build the graph the GCN probe said was missing — a **corpus-wide bipartite
occupation↔skill graph** carrying signal the text features don't have — then run link
prediction on it ("suggest skills for a role") and, only if it earns its keep, surface it
in the app as **advisory** suggestions (Mirror Roles, Layer 3). Offline first, in
`v3/research/gcn/`, on the request path never.

Why this and not more GCN tuning: the probe's honest finding was that cosine-kNN edges
derived from the same TF-IDF features add nothing. A GCN only beats a feature-only
classifier when the **graph is an independent signal**. Occupation→skill (ESCO) and
skill↔skill co-occurrence (live MCF) are exactly that — who shares scarce skills, what
co-occurs in real postings — none of it recoverable from an occupation's definition text.

## What the repo already gives us (build on, don't rebuild)

- 1,006 SSOC 2024 occupations + definitions/tasks/examples (`engine-data/ssoc2024-hierarchy.json`).
- SSOC→ISCO-08 crosswalk (`engine-data/ssoc2024-isco.js`) — the bridge to ESCO.
- The deterministic SSOC classifier + AIOE exposure engine (`engine-core.js`).
- A per-role graph builder with token-overlap skill↔duty edges (`build-graph-data.mjs`) —
  the same "inferred, never asserted" idiom to reuse.
- The RoleGraph panel (ESCO / Knowledge / SSOC toggles) — the eventual advisory surface.

## What's missing (the substrate itself)

1. **ESCO occupation→skill relations, corpus-wide** — not one role at a time. Every
   ISCO occupation's essential + optional skills, joined to SSOC via the crosswalk.
2. **MCF skill co-occurrence** — from a sample of live SG postings: which skills actually
   appear together. This is the independent signal ESCO alone doesn't have.
3. (optional) **SkillsFuture SFw proficiency weights** — edge weights if obtainable.

## Phases

### Phase 0 — data acquisition + license check (gate)
- **ESCO bulk download** (v1.1/1.2 classification CSVs: `occupations_en.csv`,
  `skills_en.csv`, `occupationSkillRelations_en.csv`). CC-BY; record the attribution.
  Verify it's reachable through the agent proxy; if not, fall back to the ESCO API per
  occupation (slower) or to the skills the app already crosswalks.
- **MCF sample harvest** — reuse the app's existing MCF fetch to pull N≈2–5k recent SG
  postings' skill tags (public data). Store raw, offline, gitignored.
- **Deliverable:** `data/` with the three ESCO tables + an MCF postings dump, and a
  one-paragraph provenance/license note. **Gate:** if ESCO isn't retrievable offline,
  stop and re-scope to MCF-only edges before building further.

### Phase 1 — assemble the graph (`build_graph.py` swap)
- Nodes: SSOC occupations (crosswalked to ISCO) + the union of their ESCO skills.
- Edges: (a) ESCO occupation→skill (typed essential/optional), (b) MCF skill↔skill
  co-occurrence (PMI-weighted, thresholded), (c) SSOC major-group occupation↔occupation
  (cheap structural prior). Every edge tagged with its source — no edge without provenance.
- Features: keep the TF-IDF occupation-text features (so we can prove the *graph* adds
  lift over features alone).
- **Deliverable:** `graph.npz` (bipartite, typed edges) + `meta.json`. This is the swap
  point the current README already anticipates; `gcn_numpy.py`/`gcn_torch.py` are unchanged.

### Phase 2 — link prediction (the actually-useful output)
- Task: hold out a fraction of occupation→skill edges, train the GCN (drop the classifier
  head, `gcn_torch.py`), predict the held-out edges → **ranked suggested skills per role**,
  scored by **AUC / hits@k**. No hand labels needed.
- **Honest baselines to beat:** (i) the MLP (features only), (ii) popularity (suggest the
  globally most-common skills), (iii) ESCO-only (no MCF edges). The MCF-co-occurrence lift
  over ESCO-only is the whole thesis — report it plainly, spun or not.
- **Deliverable:** a results table + `SUBSTRATE-RESULTS.md` with the honest finding
  (including "no lift" if that's the truth, same as the first probe).

### Phase 3 — advisory integration (only if Phase 2 earns it)
- Surface predicted occupation→skill edges as **"AI-suggested — review"** in the RoleGraph
  / Mirror Roles, and as a stronger candidate source for **Layer 3** (the model would judge
  relatedness against real skill adjacency, not just phrase text).
- Same governance as Layer 3: opt-in, dashed/flagged, engine-gated, withhold over
  fabricate, no engine number authored. Goes through spec-author → conformance-auditor.

## Decisions for the Human Lead (before Phase 1)

- **D1 — MCF sample size / recency window** (bigger = better co-occurrence signal, slower
  harvest). Proposed: ~3k postings, last 90 days.
- **D2 — skill vocabulary** when ESCO and MCF tags disagree: map MCF tags onto ESCO skills
  (cleaner graph) vs keep both as separate node types (richer, messier). Proposed: map to ESCO.
- **D3 — edge weighting**: unweighted first (simplest, provable) vs PMI/SFw-weighted.
  Proposed: unweighted for Phase 2, add weights only if the plain graph shows lift.

## Guardrails (unchanged from the contract)

Offline research only; nothing on the request path. Anything a GCN produces is an advisory
suggestion for human review — it never authors a band, rank, code, or verdict the product
displays. Every node and edge maps to a named source; a crosswalked/partial mapping is
disclosed as such, never dressed as exact.
