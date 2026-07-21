#!/usr/bin/env python3
"""A 2-layer Kipf & Welling GCN in pure NumPy - runnable with zero heavy deps.

Same architecture as the reference repo (senadkurtisi/pytorch-GCN) and the theory
deck (Zhewei Wei, 2024): a first-order spectral graph convolution
    H^(l+1) = sigma( A_hat @ H^(l) @ W^(l) ),  A_hat = D^-1/2 (A+I) D^-1/2.

Task: node classification - predict each occupation's SSOC MAJOR GROUP from its
definition-text features propagated over the content-similarity graph (build_graph.py).

Run `--mlp` to disable the graph (A_hat = I) as a features-only baseline; the gap is
the value the graph structure adds. This is an OFFLINE research probe - it authors no
number the app shows.
"""
import os, json, argparse
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def normalized_adj(A, mlp=False):
    N = A.shape[0]
    if mlp:
        return np.eye(N, dtype=np.float32)      # baseline: no propagation
    A = A + np.eye(N, dtype=np.float32)         # add self-loops
    deg = A.sum(1)
    dinv = 1.0 / np.sqrt(np.maximum(deg, 1e-12))
    return (A * dinv[:, None]) * dinv[None, :]  # D^-1/2 (A+I) D^-1/2


def relu(x):
    return np.maximum(x, 0.0)


def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


class Adam:
    def __init__(self, params, lr=0.01, wd=5e-4):
        self.p = params; self.lr = lr; self.wd = wd
        self.m = [np.zeros_like(x) for x in params]
        self.v = [np.zeros_like(x) for x in params]; self.t = 0
    def step(self, grads):
        self.t += 1
        for i, (g, p) in enumerate(zip(grads, self.p)):
            g = g + self.wd * p                 # L2 weight decay
            self.m[i] = 0.9 * self.m[i] + 0.1 * g
            self.v[i] = 0.999 * self.v[i] + 0.001 * (g * g)
            mh = self.m[i] / (1 - 0.9 ** self.t)
            vh = self.v[i] / (1 - 0.999 ** self.t)
            p -= self.lr * mh / (np.sqrt(vh) + 1e-8)


def train(hidden=48, epochs=300, lr=0.02, wd=5e-4, dropout=0.5, mlp=False, seed=0, patience=40):
    rng = np.random.default_rng(seed)
    d = np.load(os.path.join(HERE, "graph.npz"))
    X, A, y = d["X"].astype(np.float32), d["A"].astype(np.float32), d["y"]
    tr, va, te = d["train_mask"], d["val_mask"], d["test_mask"]
    N, F = X.shape; C = int(y.max() + 1)
    Ah = normalized_adj(A, mlp=mlp)
    Y = np.eye(C, dtype=np.float32)[y]

    # Glorot init
    def glorot(a, b):
        s = np.sqrt(6.0 / (a + b)); return rng.uniform(-s, s, (a, b)).astype(np.float32)
    W0 = glorot(F, hidden); W1 = glorot(hidden, C)
    opt = Adam([W0, W1], lr=lr, wd=wd)

    AX = Ah @ X                                  # precompute (static graph + features)
    best_va, best_te, best_ep, wait = 0.0, 0.0, 0, 0
    ntr = tr.sum()

    for ep in range(1, epochs + 1):
        # ---- forward (with input + hidden dropout during training) ----
        Xin = X * (rng.random(X.shape) > dropout) / (1 - dropout) if dropout else X
        AXd = Ah @ Xin
        Z1 = AXd @ W0
        H1 = relu(Z1)
        Hd = H1 * (rng.random(H1.shape) > dropout) / (1 - dropout) if dropout else H1
        Z2 = (Ah @ Hd) @ W1
        P = softmax(Z2)

        # ---- loss grad on TRAIN nodes ----
        dZ2 = (P - Y).astype(np.float32)
        dZ2[~tr] = 0.0
        dZ2 /= max(ntr, 1)
        dW1 = (Ah @ Hd).T @ dZ2
        dH1 = (Ah.T @ dZ2) @ W1.T
        dZ1 = dH1 * (Z1 > 0)
        dW0 = AXd.T @ dZ1
        opt.step([dW0, dW1])

        # ---- eval (no dropout) ----
        if ep % 5 == 0 or ep == epochs:
            Zev = (Ah @ relu(AX @ W0)) @ W1
            pred = Zev.argmax(1)
            va_acc = float((pred[va] == y[va]).mean())
            te_acc = float((pred[te] == y[te]).mean())
            if va_acc > best_va:
                best_va, best_te, best_ep, wait = va_acc, te_acc, ep, 0
            else:
                wait += 5
            if wait >= patience:
                break
    return best_va, best_te, best_ep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mlp", action="store_true", help="features-only baseline (A_hat = I)")
    ap.add_argument("--hidden", type=int, default=48)
    ap.add_argument("--epochs", type=int, default=300)
    ap.add_argument("--runs", type=int, default=5)
    args = ap.parse_args()
    meta = json.load(open(os.path.join(HERE, "meta.json"))) if os.path.exists(os.path.join(HERE, "meta.json")) else {}
    vas, tes = [], []
    for s in range(args.runs):
        va, te, ep = train(hidden=args.hidden, epochs=args.epochs, mlp=args.mlp, seed=s)
        vas.append(va); tes.append(te)
    tag = "MLP (no graph)" if args.mlp else "GCN"
    print(f"{tag}: test acc {np.mean(tes)*100:.1f}% +/- {np.std(tes)*100:.1f}  "
          f"(val {np.mean(vas)*100:.1f}%, {args.runs} runs)  "
          f"[nodes={meta.get('nodes','?')}, classes={meta.get('n_classes','?')}, "
          f"majority-class baseline shown in README]")


if __name__ == "__main__":
    main()
