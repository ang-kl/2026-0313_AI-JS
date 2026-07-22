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

## Railway service — useful at Step 2 → Step 3

Vercel serverless runs Node, not native C++, so the substrate runs as its own service on
**Railway** (which runs containers) and the app calls it over HTTP. This is what makes the
substrate *useful in the flow* rather than a run-on-demand probe: at Step 2 → Step 3, given
the skills already identified for a role, the service returns **adjacent skills the posting
did not mention**, grounded in ESCO structure + real MCF co-occurrence, each tagged with its
source. Deterministic and sourced — the engine authors every score, no LLM.

### The server (`server.cpp` + `suggest.hpp`)

POSIX sockets + `std::thread` only — no HTTP framework. Endpoints:

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | — | `{status, dataset, synthetic, skills, occupations}` |
| POST | `/suggest` | `{"skills":["python","sql"],"top":10}` | ranked adjacent skills + provenance |

`/suggest` response shape:

```json
{
  "suggestions": [
    {"skill":"tableau","score":1.6,"esco":0,"mcf":72,"sources":["mcf"]},
    {"skill":"statistics","score":2.0,"esco":2,"mcf":0,"sources":["esco"]}
  ],
  "matched": ["python","sql"],
  "unmatched": [],
  "synthetic": true
}
```

`sources` discloses *why* each skill is suggested — `esco` (shares an occupation), `mcf`
(co-occurs in real postings), or both. `synthetic:true` marks demo data so a placeholder
suggestion is never mistaken for a real one.

### Deploying to Railway

1. New Railway project → **Deploy from GitHub repo** → this repo.
2. Service **Root Directory**: `v3/research/gcn/cpp` (so `Dockerfile` + `railway.json` are found).
3. Railway builds the `Dockerfile` (multi-stage: compile → bake substrate from
   `sample-data/` → slim runtime) and injects `PORT`; the server binds `0.0.0.0:$PORT`.
4. Health check is `/health` (see `railway.json`).
5. Call it from the app at Step 2 → Step 3: `POST https://<service>.up.railway.app/suggest`.

Local equivalent:

```sh
make server
./build_substrate --data ./sample-data      # -> substrate.bin
PORT=8099 ./server --bin substrate.bin
curl -s localhost:8099/health
curl -s -X POST localhost:8099/suggest -d '{"skills":["python","sql"],"top":6}'
```

### Data honesty

The image bakes `sample-data/` — **synthetic** placeholders (see `sample-data/README.md`),
so the service reports `"synthetic": true`. To serve real suggestions: run the Python
harvest (gated on egress, `../data/PHASE0-FINDINGS.md`), point the Docker build at the real
`data/`, and set `SYNTHETIC=0`.

> The container build is **not** validated in the authoring sandbox: pulling base images
> (`gcc:13`) is blocked there by the same egress policy (403 Forbidden), and that is not
> routed around. The C++ compile, the server, and both endpoints are verified natively; the
> Dockerfile is standard multi-stage and builds on Railway, which has normal registry access.

## Status

The batch tools (`build_substrate`, `linkpred`) are offline research; the service
(`server`) is deployable to Railway and callable from the app. All author no number
without provenance, and none of it changes the deployed Vercel app until the app is wired to
call the service. It runs today on synthetic data; it runs on real data the moment the
Phase 0 harvest is unblocked (see `../data/PHASE0-FINDINGS.md`).
