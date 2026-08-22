#!/usr/bin/env python3
"""PyTorch version of the same 2-layer Kipf GCN - the extension point.

Mirrors the reference repo (senadkurtisi/pytorch-GCN) and the theory deck: a
first-order spectral graph convolution GCNLayer(X) = A_hat @ (X @ W). Reads the same
graph.npz that build_graph.py produced, so the data pipeline is shared with the NumPy
probe. Use this (not the NumPy file) when you want autograd, GPU, dropout schedules,
or to graduate to the heterogeneous / self-supervised variants:

  * PSHGCN  (spectral HETEROGENEOUS graph convolutions) - for a true Occupation/Skill
            bipartite graph with typed edges. See the theory deck.
  * PolyGCL (contrastive / self-supervised) - learns node embeddings with NO labels.
  * link prediction - drop the classifier head, train on held-out edges, score AUC;
                      this is the actually-useful output ("suggest skills for a role").

Run:  pip install torch numpy   &&   python build_graph.py   &&   python gcn_torch.py
Outputs are OFFLINE research suggestions only - they never author a band/verdict the
app displays.
"""
import os
import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
except ImportError:  # keep the file importable without torch installed
    torch = None

HERE = os.path.dirname(os.path.abspath(__file__))


def normalized_adj(A):
    A = A + np.eye(A.shape[0], dtype=np.float32)
    d = A.sum(1); dinv = 1.0 / np.sqrt(np.maximum(d, 1e-12))
    return (A * dinv[:, None]) * dinv[None, :]


if torch is not None:
    class GCNLayer(nn.Module):
        def __init__(self, fin, fout):
            super().__init__()
            self.lin = nn.Linear(fin, fout, bias=False)
            nn.init.xavier_uniform_(self.lin.weight)

        def forward(self, x, a_hat):
            return a_hat @ self.lin(x)          # A_hat @ (X @ W)

    class GCN(nn.Module):
        def __init__(self, fin, hidden, nclass, dropout=0.5):
            super().__init__()
            self.g1 = GCNLayer(fin, hidden)
            self.g2 = GCNLayer(hidden, nclass)
            self.dropout = dropout

        def forward(self, x, a_hat):
            x = F.relu(self.g1(x, a_hat))
            x = F.dropout(x, self.dropout, training=self.training)
            return self.g2(x, a_hat)            # logits


def main():
    if torch is None:
        raise SystemExit("PyTorch not installed. `pip install torch` (or run gcn_numpy.py).")
    d = np.load(os.path.join(HERE, "graph.npz"))
    X = torch.tensor(d["X"], dtype=torch.float32)
    Ah = torch.tensor(normalized_adj(d["A"].astype(np.float32)))
    y = torch.tensor(d["y"], dtype=torch.long)
    tr = torch.tensor(d["train_mask"]); va = torch.tensor(d["val_mask"]); te = torch.tensor(d["test_mask"])
    model = GCN(X.shape[1], 48, int(y.max()) + 1, dropout=0.5)
    opt = torch.optim.Adam(model.parameters(), lr=0.02, weight_decay=5e-4)
    best_va, best_te = 0.0, 0.0
    for ep in range(300):
        model.train(); opt.zero_grad()
        out = model(X, Ah)
        loss = F.cross_entropy(out[tr], y[tr])
        loss.backward(); opt.step()
        model.eval()
        with torch.no_grad():
            pred = model(X, Ah).argmax(1)
            vacc = (pred[va] == y[va]).float().mean().item()
            if vacc > best_va:
                best_va = vacc; best_te = (pred[te] == y[te]).float().mean().item()
    print(f"GCN (torch): val {best_va*100:.1f}%  test {best_te*100:.1f}%")


if __name__ == "__main__":
    main()
