# GCN substrate — C++ compute core

A dependency-free C++17 port of the substrate's **deterministic compute core**. Same
algorithms as the Python reference in the parent directory, same honesty discipline (the
engine authors every number; no LLM, no invented edge), but native speed for the parts
that actually benefit from it.

## What is ported (and what is deliberately not)

| Python | C++ | Ported? | Why |
| --- | --- | --- | --- |
| `build_substrate_graph.py` | `build_substrate.cpp` + `substrate.hpp` | ✅ | Deterministic graph assembly — scales with postings. |
| `linkpred.py` | `linkpred.cpp` + `linkpred.hpp` | ✅ | The ESCO-vs-MCF ablation that **is** the thesis; the clearest scale win. |
| `harvest_esco.py`, `harvest_mcf.py` | — | ❌ (stays Python) | Pure network + JSON I/O. Network-bound, not compute-bound — C++ buys nothing. |
| `gcn_numpy.py`, `gcn_torch.py` | — | *follow-on* | Dense matmul GCN; biggest raw win, but depends on `build_graph.py` features. Next. |

The pipeline is unchanged: **harvest (Python) → build (C++ or Python) → linkpred (C++ or
Python)**. The C++ build reads the same `../data/*.jsonl` the Python harvest writes.

## Build & run

```sh
make            # builds build_substrate and linkpred (g++/clang++, C++17, stdlib only)
make test       # runs both self-tests

./build_substrate               # ../data/*.jsonl -> substrate.bin + substrate_meta.json
./build_substrate --data DIR    # override data directory
./linkpred                      # substrate.bin -> ablation over 5 splits (mean AUC + lift)
./linkpred --npz FILE           # override substrate binary path
```

`substrate.bin` is a small self-describing binary (magic `GSUB1`, length-prefixed labels,
int64 edge triples) — the C++ analogue of the Python `substrate.npz`. It is git-ignored.

## Parity with the Python reference

- **Graph assembly is byte-identical.** On the same input the C++ build produces the same
  vocabulary (first-seen index order, matching Python's `skill_idx[k] = len(skill_idx)`),
  the same edge counts, and the same co-occurrence counts. Verified on both the planted
  self-test fixture and a 40-occupation / 300-posting synthetic set
  (40 occ · 60 skills · 240 edges · 160 essential · 1451 co-occurrence, identical both ways).
- **Link-prediction structure is identical.** Both self-tests assert the same thing: a
  planted MCF-only signal yields `mcf AUC = 1.0`, `hits@1 = 1.0`, and `esco AUC < mcf AUC`.

### RNG honesty (the one non-identity)

NumPy's `RandomState` cannot be reproduced bit-for-bit in C++ (different PRNG, different
sampling algorithm). So on **real data**, the seeded baseline AUC numbers are *statistically
comparable*, not identical — e.g. the ESCO baseline in the self-test reads 0.4625 (C++) vs
0.4375 (Python), because the negative sample differs. Every **thesis-bearing** assertion is
structural and RNG-independent, so those match exactly. This is stated plainly rather than
papered over — the same discipline as the rest of the substrate: a null must stay legible.

## Status

Offline research tooling. It authors no number the app shows, and touches nothing in the
deployed site. It runs today on self-test fixtures and any synthetic data; it runs on real
data the moment the Phase 0 harvest is unblocked (see `../data/PHASE0-FINDINGS.md`).
