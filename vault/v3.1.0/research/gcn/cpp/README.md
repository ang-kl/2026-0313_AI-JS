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
| `gcn_numpy.py` | `gcn.cpp` + `gcn.hpp` | ✅ | 2-layer Kipf & Welling GCN; dense matmul, the biggest raw win. |
| `harvest_esco.py`, `harvest_mcf.py` | — | ❌ (stays Python) | Pure network + JSON I/O. Network-bound, not compute-bound — C++ buys nothing. |
| `gcn_torch.py` | — | ❌ (reference) | The torch reference; the numpy/C++ port is the runnable one. |
| `../../api/ssic.js`'s `classifyText()` | `classify.hpp` | ✅ | Deterministic SSIC 2020 activity-text classifier — token-overlap scoring over 5.4k terms per request. `ssic.js` keeps ACRA lookup/Postgres (I/O); only the compute loop moved. |
| `../../api/ssoc.js`'s `classifySsocJobs()` | `classify_ssoc.hpp` | ✅ | Deterministic SSOC 2024 job-title classifier — title/context scoring over 1,006 occupations per job, full 5-level hierarchy walk. `ssoc.js` keeps Postgres search/get/correspondence (I/O); only the compute loop moved. Different scoring formula from SSIC's — independently ported, not shared code. |

The pipeline is unchanged: **harvest (Python) → build (C++ or Python) → linkpred / gcn (C++
or Python)**. The C++ build reads the same `../data/*.jsonl` the Python harvest writes.

### GCN encoder (`gcn.cpp` + `gcn.hpp`)

A dependency-free 2-layer GCN — a tiny dense-matrix type, Adam with weight decay, dropout,
and early stopping, all in the standard library. `H^(l+1) = σ(Â H^(l) W^(l))` with
`Â = D^-1/2 (A+I) D^-1/2`. `--mlp` sets `Â = I` (features-only baseline); the gap is the
value the graph adds.

```sh
make gcn
./gcn --self-test    # synthetic homophilous graph; asserts GCN beats the features-only MLP
```

The self-test builds a task where per-node features are a weak class signal buried in heavy
noise, but same-class nodes are densely wired — so neighbour-averaging recovers the class
and the GCN (~100%) sharply beats the MLP (~47%, random 25%).

**Real-data run.** `../export_graph_bin.py` writes the real SSOC graph (from `build_graph.py`)
to `graph.bin`, which the C++ GCN loads directly:

```sh
python ../build_graph.py          # -> graph.npz  (1006 SSOC occupations, TF-IDF features)
python ../export_graph_bin.py     # -> graph.bin
./gcn --graph ../graph.bin --runs 3
```

On the real graph (1006 nodes, 1200 features, 10 major-group classes) the C++ GCN reproduces
the NumPy reference within RNG noise — **GCN ≈ MLP at ~75%** (C++: GCN 75.2±0.6 vs MLP
74.0±0.8; NumPy: GCN 74.5±2.0 vs MLP 76.4±1.4). The sign of the GCN-minus-MLP gap flips
inside the noise band, so the honest read is **no reliable lift**: for major-group
classification the TF-IDF features already separate the classes, and the content-similarity
graph adds nothing dependable. A null, reported straight — the same discipline as `linkpred`.
(The tool prints "graph adds signal" only when the gap clears +1%; treat a sub-2% gap over 3
runs as noise, not a win.)

## Build & run

```sh
make            # builds build_substrate, linkpred, gcn, server (g++/clang++, C++17, stdlib only)
make test       # runs all three self-tests (build_substrate, linkpred, gcn)

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
| GET | `/health` | — | `{status, dataset, synthetic, skills, occupations, ssicTerms, ssocOccupations}` |
| POST | `/suggest` | `{"skills":["python","sql"],"top":10}` | ranked adjacent skills + provenance |
| POST | `/similar-roles` | `{"skills":[...],"top":8}` | ranked adjacent occupations + shared skills (Brick 3) |
| POST | `/classify-ssic` | `{"text":"...","limit":5}` or `{"texts":[...],"limit":5}` | ranked SSIC codes — see below |
| POST | `/classify-ssoc` | `{"jobs":[{"id","title","categories":[],"skills":[],"description"}]}` | classified/withheld SSOC codes + hierarchy — see below |

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

### SSIC classifier (`classify.hpp`)

A direct port of `v3/api/ssic.js`'s `classifyText()` — deterministic token-overlap scoring
of free business-activity text against the compiled SSIC 2020 index (`taxonomy-data/`,
5,426 terms across 999 codes). `ssic.js` still owns everything I/O-bound (ACRA entity
lookup, Postgres seeding, the live data.gov.sg path); this covers only the in-memory scoring
loop the JS comment itself already called out as the compute-bound part.

**Verified byte-for-byte, not hand-translated.** Before this was wired into `server.cpp`, a
Node harness ran the real, unmodified `ssic.js` handler on a fixed query set (plain text,
an HTML fragment, parens, `&amp;`, hyphen/slash punctuation, an empty string, and a
below-floor gibberish string) and the C++ self-test (`classify_selftest.cpp`) ran the same
set against the same `ssic2020-index.json` — every code, score, rank, and edge case matched
exactly. `ssic.js` tries the Railway service first (short timeout) and falls back to its own
identical local computation on any failure, so the service is a pure speed/offload win, never
a correctness dependency.

```sh
make classify_selftest
./classify_selftest --index taxonomy-data/ssic2020-index.json
```

### SSOC classifier (`classify_ssoc.hpp`)

A direct port of `v3/api/ssoc.js`'s `classifySsocJobs()` — deterministic job-title
classification against the SSOC 2024 hierarchy (`taxonomy-data/`, 1,632 nodes / 1,006
occupations across 5 levels). Richer than the SSIC port: title-exact-match bonus, token
overlap tiers with bidirectional substring containment, job-req-ID stripping (`WD-12345`,
`Job123`), context scoring against each occupation's definition/tasks/examples, and a full
major → sub-major → minor → unit-group → occupation hierarchy walk on the winning match. Uses
a **different scoring formula** from the SSIC port (`hits/max(|a|,|b|)`, not SSIC's weighted
coverage/precision blend) — independently ported, not shared code, because the JS originals
are independently authored and diverge on purpose. `ssoc.js` keeps everything I/O-bound
(Postgres search/get/correspondence) untouched.

**Verified byte-for-byte** the same way as the SSIC port: a Node harness ran the real,
unmodified `ssoc.js` handler (`action:"classifyTitles"`) on ten jobs covering exact-title
matches, partial-overlap matches, job-req-ID stripping, ampersands, a withheld
(below-threshold) case, and a missing-title case; the C++ self-test
(`classify_ssoc_selftest.cpp`) ran the same jobs against the same data files — every score,
confidence tier, code, hierarchy field, and candidate list matched exactly. `ssoc.js` tries
the Railway service first (4s timeout, larger payload than SSIC's) and falls back to its own
identical local computation on any failure.

```sh
make classify_ssoc_selftest
./classify_ssoc_selftest --hierarchy taxonomy-data/ssoc2024-hierarchy.json --changes taxonomy-data/ssoc2024-type-of-change.json
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
