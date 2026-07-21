# GCN research probe — occupation node classification (offline)

A small, **offline** Graph Convolutional Network experiment on real Singapore
occupation data. It exists to *evaluate* whether a GCN adds value to SG Career View's
jobs-skills problem — **not** to run in the app. Anything a GCN produces here is an
advisory research suggestion for human review; it never authors a band, rank, or
verdict that the product displays (that stays with the deterministic engine).

Not in the browser, not in C++, not on the request path — a Python probe you run by
hand, exactly the shape recommended after reading the two research PDFs in
`v3/doc/research/` and the reference repo
[`senadkurtisi/pytorch-GCN`](https://github.com/senadkurtisi/pytorch-GCN).

## What it is

- **Architecture:** the 2-layer Kipf & Welling GCN — `H⁺ = σ(Â · H · W)`,
  `Â = D^-½ (A+I) D^-½` — the same first-order spectral convolution as the reference
  repo and the theory deck (`GCN_theory_short v6.pdf`).
- **Task:** node classification — predict each occupation's **SSOC major group**
  (10 classes) from its text features propagated over an occupation graph.
- **Data (all real, no synthetic):**
  - **Nodes:** 1,006 SSOC 2024 occupations (`engine-data/ssoc2024-hierarchy.json`).
  - **Features:** TF-IDF over each occupation's *official* definition + tasks + examples.
  - **Edges:** a cosine-similarity **kNN content graph** (occupations described
    similarly are linked). No label leakage — edges come from free text, not the SSOC
    code being predicted.
  - **Labels:** SSOC major group — a label you already own (no hand-labelling).

## Run

```bash
pip install -r requirements.txt      # just NumPy for the runnable probe
python build_graph.py                # -> graph.npz (+ meta.json)
python gcn_numpy.py                  # GCN
python gcn_numpy.py --mlp            # features-only baseline (Â = I)
# optional, needs torch:  python gcn_torch.py
```

## Results (5 runs, this data)

| Model | Test accuracy |
|---|---|
| Majority-class baseline | 30.3% |
| **GCN** | **74.5% ± 1.3** |
| MLP (features only, no graph) | 75.1% ± 1.5 |

## The honest finding (why this matters)

**The GCN ties the plain MLP here — the graph adds no lift.** That is not a bug; it is
the lesson. The edges in this probe were *derived from the same TF-IDF features*, so the
graph carries no information the features don't already have. A GCN only beats a
feature-only classifier when the **graph structure is an independent signal**.

So the empirical takeaway, from your own data, is the same as the recommendation:

> Build the **real** occupation↔skill graph first (the substrate from
> *A Dynamic Jobs-Skills Knowledge Graph*, `v3/doc/research/RecSysHR2024-paper_1.pdf`):
> ESCO `requires-skill` edges + MyCareersFuture skill co-occurrence + SkillsFuture SFw
> weights. *That* graph carries signal the text features don't (who shares scarce skills,
> what co-occurs in live postings) — and it's where a GCN can actually earn its keep.

The GCN code does **not** change when you do that — only `build_graph.py` does (swap the
cosine-kNN edges for the real bipartite skill graph). The pipeline is proven; the graph
is the missing ingredient.

## Roadmap

1. **Substrate (do first):** real ESCO/MCF occupation–skill graph as an edge list +
   node features (a Neo4j-style property graph per the RecSys paper). Independently
   useful — it also feeds the app's RoleGraph / Mirror Roles / the P1–P2 linking UI.
2. **Link prediction** (`gcn_torch.py`, drop the classifier head): hold out
   occupation–skill edges, predict them → *suggested skills for a role* with an AUC.
   This is the actually-useful output, and needs no hand labels.
3. **Heterogeneous / label-free variants** from the theory deck once the substrate
   exists: **PSHGCN** (typed Occupation/Skill nodes) and **PolyGCL** (self-supervised
   embeddings, no labels).
4. **Integration — advisory only:** surface predicted edges as *suggestions* in the
   linking UI / Mirror Roles, flagged "AI-suggested — review", never as engine facts.

## Files

| File | Purpose |
|---|---|
| `build_graph.py` | Build the real graph from SSOC 2024 → `graph.npz`. Swap point for the real skill graph. |
| `gcn_numpy.py` | Runnable 2-layer GCN (NumPy, manual backprop) + `--mlp` baseline. |
| `gcn_torch.py` | PyTorch mirror of the same architecture — the extension point (autograd/GPU, link prediction, PSHGCN/PolyGCL). |
| `graph.npz`, `meta.json` | Generated artifacts (gitignored). |

## Credits / sources

- Kipf & Welling, *Semi-Supervised Classification with GCNs* (2017); reference impl
  [`senadkurtisi/pytorch-GCN`](https://github.com/senadkurtisi/pytorch-GCN).
- `v3/doc/research/GCN_theory_short v6.pdf` (Zhewei Wei, 2024) — spectral GCN theory,
  OptBasisGNN / PolyGCL / PSHGCN.
- `v3/doc/research/RecSysHR2024-paper_1.pdf` — *A Dynamic Jobs-Skills Knowledge Graph*
  (GovTech SG / SkillsFuture / A*STAR).
