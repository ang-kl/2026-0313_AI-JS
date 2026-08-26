#!/usr/bin/env python3
"""Phase 2 — occupation->skill link prediction ("suggest skills for a role").

Holds out a fraction of the ESCO essential occupation->skill edges and predicts them back,
scoring AUC + hits@k. The point is an HONEST ablation: does live MCF skill co-occurrence add
lift over what ESCO structure already gives? Three transparent scorers (no black box, so a
"no lift" result is as legible as a win — the same discipline as the first GCN probe):

  popularity : score(o,s) = how common skill s is overall            (dumb baseline)
  esco       : score(o,s) = sum over o's known skills s' of ESCO co-occupation(s,s')
  mcf        : score(o,s) = sum over o's known skills s' of MCF co-occurrence(s,s')
  esco+mcf   : the two combined (z-normalised)

The MCF-over-ESCO delta IS the thesis of the whole substrate. Report it straight. A GCN
(gcn_torch.py, once torch is available) is the natural next encoder — but if these cheap,
interpretable link predictors show no MCF lift on real data, a GCN won't conjure it either.

Run:  python linkpred.py                 # needs substrate.npz (build_substrate_graph.py)
      python linkpred.py --self-test     # planted MCF-only signal; asserts the harness sees it
"""
import json, os, sys, collections
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
NPZ = os.path.join(HERE, "substrate.npz")


def occ_skill_sets(os_edges, essential_only=True):
    known = collections.defaultdict(set)
    for o, s, ess in os_edges:
        if essential_only and ess != 1:
            continue
        known[int(o)].add(int(s))
    return known


def cooc_from_edges(pairs):
    """symmetric dict-of-Counter from an iterable of (i, j, weight)."""
    aff = collections.defaultdict(collections.Counter)
    for i, j, w in pairs:
        i, j, w = int(i), int(j), float(w)
        aff[i][j] += w; aff[j][i] += w
    return aff


def split(known, holdout_frac=0.3, seed=0):
    """Hold out one essential skill from each occupation that has >=2 (so it keeps context)."""
    rng = np.random.RandomState(seed)
    train, held = {}, []
    for o, skills in known.items():
        sk = sorted(skills)
        if len(sk) < 2:
            train[o] = set(sk); continue
        k = max(1, int(round(len(sk) * holdout_frac)))
        pick = set(rng.choice(sk, size=min(k, len(sk) - 1), replace=False).tolist())
        train[o] = set(sk) - pick
        for s in pick: held.append((o, s))
    return train, held


def score_fns(train, esco_aff, mcf_aff, pop):
    def esco(o, s): return sum(esco_aff[s].get(k, 0.0) for k in train[o])
    def mcf(o, s):  return sum(mcf_aff[s].get(k, 0.0) for k in train[o])
    def popular(o, s): return pop.get(s, 0.0)
    return {"popularity": popular, "esco": esco, "mcf": mcf,
            "esco+mcf": lambda o, s: _z(esco(o, s), _E) + _z(mcf(o, s), _M)}


_E = _M = (0.0, 1.0)
def _z(x, ms): m, sd = ms; return (x - m) / sd if sd else 0.0


def evaluate(train, held, all_skills, esco_aff, mcf_aff, pop, seed=0, negs=50):
    global _E, _M
    # calibrate z-norm for the combined scorer over the held set
    es = [sum(esco_aff[s].get(k, 0.0) for k in train[o]) for o, s in held]
    ms = [sum(mcf_aff[s].get(k, 0.0) for k in train[o]) for o, s in held]
    _E = (float(np.mean(es)), float(np.std(es) or 1.0)) if es else (0.0, 1.0)
    _M = (float(np.mean(ms)), float(np.std(ms) or 1.0)) if ms else (0.0, 1.0)
    fns = score_fns(train, esco_aff, mcf_aff, pop)
    rng = np.random.RandomState(seed)
    truth = collections.defaultdict(set)
    for o, s in held: truth[o].add(s)
    out = {}
    for name, fn in fns.items():
        wins = comps = hits1 = hits5 = 0
        for o, s_pos in held:
            forbidden = truth[o] | train[o]
            cand = [s for s in all_skills if s not in forbidden or s == s_pos]
            negs_pool = [s for s in cand if s != s_pos]
            if not negs_pool: continue
            sample = rng.choice(negs_pool, size=min(negs, len(negs_pool)), replace=False)
            sp = fn(o, s_pos)
            for sn in sample:
                comps += 1
                if sp > fn(o, int(sn)): wins += 1
                elif sp == fn(o, int(sn)): wins += 0.5
            ranked = sorted(cand, key=lambda s: fn(o, s), reverse=True)
            pos_rank = ranked.index(s_pos)
            hits1 += pos_rank < 1; hits5 += pos_rank < 5
        n = len(held)
        out[name] = {"auc": round(wins / comps, 4) if comps else None,
                     "hits@1": round(hits1 / n, 4) if n else None,
                     "hits@5": round(hits5 / n, 4) if n else None}
    return out


def run(g, seed=0):
    known = occ_skill_sets(g["os_edges"], essential_only=True)
    train, held = split(known, seed=seed)
    pop = collections.Counter()
    for o, s, ess in g["os_edges"]:
        if ess == 1: pop[int(s)] += 1
    esco_aff = cooc_from_edges((s1, s2, 1) for o in train for s1 in train[o] for s2 in train[o] if s1 < s2)
    mcf_aff = cooc_from_edges(g["cooc_edges"])
    all_skills = list(range(len(g["skill_labels"])))
    return evaluate(train, held, all_skills, esco_aff, mcf_aff, pop, seed=seed), len(held)


def self_test():
    # Planted MCF-only signal: skill 99 is TRUE for occ 0 (held out) and appears in NO
    # training edge, so ESCO/popularity are blind to it (affinity 0). MCF postings pair 99
    # with skill 0, which IS in occ 0's training set -> only the MCF scorer can rank it.
    os_edges = [(o, 0, 1) for o in range(10)] + [(o, 1, 1) for o in range(10)]
    os_edges += [(o, 2 + o, 1) for o in range(10)]          # a distinct third skill each
    os_edges.append((0, 99, 1))                             # the target, held out below
    cooc = [(99, 0, 25)] + [(0, 1, 5)]                      # MCF: 99 co-occurs with hub skill 0
    g = {"os_edges": np.array(os_edges), "cooc_edges": np.array(cooc),
         "skill_labels": np.array([str(i) for i in range(100)], dtype=object)}
    known = occ_skill_sets(g["os_edges"])
    train = {o: (known[o] - {99}) for o in known}; held = [(0, 99)]
    pop = collections.Counter(int(s) for _, s, e in g["os_edges"] if e == 1 and s != 99)
    esco_aff = cooc_from_edges((s1, s2, 1) for o in train for s1 in train[o] for s2 in train[o] if s1 < s2)
    mcf_aff = cooc_from_edges(g["cooc_edges"])
    res = evaluate(train, held, list(range(100)), esco_aff, mcf_aff, pop, negs=40)
    print("self-test scores:", json.dumps(res))
    assert res["mcf"]["auc"] == 1.0, f"MCF should perfectly rank the planted edge: {res['mcf']}"
    assert (res["esco"]["auc"] or 0) < res["mcf"]["auc"], "ESCO-only must not see the MCF-only signal"
    assert res["mcf"]["hits@1"] == 1.0, res["mcf"]
    print("self-test OK — the harness detects an MCF-only signal and ESCO-only does not.")


def main():
    if "--self-test" in sys.argv:
        self_test(); return
    if not os.path.exists(NPZ):
        sys.exit(f"No {NPZ}. Run build_substrate_graph.py (which needs the Phase 0 harvest).")
    g = dict(np.load(NPZ, allow_pickle=True))
    aucs = collections.defaultdict(list)
    n = 0
    for seed in range(5):                       # 5 splits, report mean — same rigor as the GCN probe
        res, n = run(g, seed=seed)
        for k, v in res.items(): aucs[k].append(v["auc"])
    print(f"link prediction over {n} held-out occupation->skill edges (mean AUC of 5 splits):")
    for k in ["popularity", "esco", "mcf", "esco+mcf"]:
        vals = [a for a in aucs[k] if a is not None]
        print(f"  {k:10s}  AUC {np.mean(vals):.3f} ± {np.std(vals):.3f}" if vals else f"  {k}: n/a")
    lift = np.mean(aucs['mcf']) - np.mean(aucs['esco'])
    print(f"\nMCF-over-ESCO lift: {lift:+.3f}  ({'MCF adds signal' if lift > 0.01 else 'no lift — the honest null'})")


if __name__ == "__main__":
    main()
