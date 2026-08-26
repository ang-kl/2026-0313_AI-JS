#!/usr/bin/env python3
"""Build a REAL jobs graph for the GCN node-classification POC.

Nodes      = SSOC 2024 occupations (engine-data/ssoc2024-hierarchy.json).
Features   = TF-IDF over each occupation's OFFICIAL definition + tasks + examples.
Edges      = cosine-similarity kNN graph over those features (a content graph -
             occupations described similarly are linked). No label leakage: edges
             come from free-text, not from the SSOC code we are trying to predict.
Labels     = SSOC MAJOR GROUP (10 classes: 1-9 and X). This is a label you already
             own - the whole point of the POC is that no hand-labelling is needed.

This is deterministic, offline, and uses only real government taxonomy data. It is a
research substrate for experimenting with the GCN - it authors nothing the app shows.

Output: graph.npz (X, A, y, train/val/test masks) + meta.json.

Swap-in for a fuller graph later: replace the cosine-kNN edges with a real
ESCO occupation<->skill bipartite graph (+ MCF skill co-occurrence). The GCN code
does not change - only this builder does.
"""
import json, os, re, argparse
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
HIER = os.path.join(HERE, "..", "..", "engine-data", "ssoc2024-hierarchy.json")

STOP = set("""a an the and or of to in for on at by with from as is are was were be been being
this that these those it its their his her our your they we you he she him them us not no yes
which who whom whose what when where why how all any both each few more most other some such
only own same so than too very can will just should now also may within into out over under
he/she determines formulates directs makes ensures performs carries provides prepares including
duties tasks role responsible responsibilities work works working etc eg ie per via""".split())

TOKEN = re.compile(r"[a-z][a-z\-]{2,}")


def load_occupations():
    d = json.load(open(HIER, encoding="utf-8"))
    occ = []
    for mg in d["major_groups"]:
        g = mg["code"]  # major group code: '1'..'9' or 'X'
        for sm in mg.get("sub_major_groups", []):
            for mn in sm.get("minor_groups", []):
                for u in mn.get("unit_groups", []):
                    for o in u.get("occupations", []):
                        text = " ".join([o.get("title", ""), o.get("definition", "")]
                                        + o.get("tasks", []) + o.get("examples", []))
                        occ.append({"code": o["code"], "title": o.get("title", ""),
                                    "major": g, "text": text.lower()})
    return occ


def tokenize(t):
    return [w for w in TOKEN.findall(t) if w not in STOP and len(w) > 2]


def tfidf(docs_tokens, max_vocab=1200, min_df=3, max_df_ratio=0.5):
    N = len(docs_tokens)
    df = {}
    for toks in docs_tokens:
        for w in set(toks):
            df[w] = df.get(w, 0) + 1
    max_df = int(max_df_ratio * N)
    vocab = [w for w, c in df.items() if c >= min_df and c <= max_df]
    vocab.sort(key=lambda w: -df[w])
    vocab = vocab[:max_vocab]
    idx = {w: i for i, w in enumerate(vocab)}
    idf = np.array([np.log((1.0 + N) / (1.0 + df[w])) + 1.0 for w in vocab], dtype=np.float32)
    X = np.zeros((N, len(vocab)), dtype=np.float32)
    for r, toks in enumerate(docs_tokens):
        if not toks:
            continue
        counts = {}
        for w in toks:
            if w in idx:
                counts[idx[w]] = counts.get(idx[w], 0) + 1
        m = max(counts.values()) if counts else 1
        for j, c in counts.items():
            X[r, j] = (c / m) * idf[j]  # tf (max-normalised) * idf
    # L2 normalise rows (so dot product = cosine).
    nrm = np.linalg.norm(X, axis=1, keepdims=True)
    nrm[nrm == 0] = 1.0
    X = X / nrm
    return X, vocab


def knn_graph(Xn, k=10):
    N = Xn.shape[0]
    S = Xn @ Xn.T          # cosine similarity (rows are L2-normalised)
    np.fill_diagonal(S, -1.0)
    A = np.zeros((N, N), dtype=np.float32)
    for i in range(N):
        nn = np.argpartition(-S[i], k)[:k]
        for j in nn:
            if S[i, j] > 0:
                A[i, j] = 1.0
                A[j, i] = 1.0  # symmetric
    return A


def split_masks(y, n_classes, seed=13, train=0.6, val=0.2):
    rng = np.random.default_rng(seed)
    N = len(y)
    tr = np.zeros(N, bool); va = np.zeros(N, bool); te = np.zeros(N, bool)
    for c in range(n_classes):
        idx = np.where(y == c)[0]
        rng.shuffle(idx)
        n = len(idx)
        nt = max(1, int(train * n))
        nv = max(1, int(val * n)) if n >= 3 else 0
        tr[idx[:nt]] = True
        va[idx[nt:nt + nv]] = True
        te[idx[nt + nv:]] = True
    # guard: every split non-empty overall
    if not te.any():
        te[np.where(tr)[0][0]] = True; tr[np.where(tr)[0][0]] = False
    return tr, va, te


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--k", type=int, default=10, help="neighbours per node in the content graph")
    ap.add_argument("--max_vocab", type=int, default=1200)
    ap.add_argument("--out", default=os.path.join(HERE, "graph.npz"))
    args = ap.parse_args()

    occ = load_occupations()
    docs = [tokenize(o["text"]) for o in occ]
    X, vocab = tfidf(docs, max_vocab=args.max_vocab)

    classes = sorted({o["major"] for o in occ})            # ['1'..'9','X']
    cidx = {c: i for i, c in enumerate(classes)}
    y = np.array([cidx[o["major"]] for o in occ], dtype=np.int64)

    A = knn_graph(X, k=args.k)
    tr, va, te = split_masks(y, len(classes))

    np.savez_compressed(args.out, X=X, A=A, y=y,
                        train_mask=tr, val_mask=va, test_mask=te)
    meta = {
        "nodes": int(X.shape[0]), "features": int(X.shape[1]),
        "classes": classes, "n_classes": len(classes),
        "edges": int(A.sum() / 2), "k": args.k,
        "class_titles": {mg_code: None for mg_code in classes},
        "split": {"train": int(tr.sum()), "val": int(va.sum()), "test": int(te.sum())},
        "source": "engine-data/ssoc2024-hierarchy.json (SSOC 2024, real)",
    }
    json.dump(meta, open(os.path.join(HERE, "meta.json"), "w"), indent=2)
    print(f"nodes={X.shape[0]}  features={X.shape[1]}  classes={len(classes)}  "
          f"edges={int(A.sum()/2)}  avg_deg={A.sum()/X.shape[0]:.1f}")
    print(f"split train/val/test = {tr.sum()}/{va.sum()}/{te.sum()}")
    print(f"saved {args.out}")


if __name__ == "__main__":
    main()
