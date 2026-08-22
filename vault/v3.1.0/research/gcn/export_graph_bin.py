#!/usr/bin/env python3
"""Export graph.npz -> graph.bin so the C++ GCN (cpp/gcn.cpp) can train on the SAME real
graph the Python does. Additive: does not touch build_graph.py or gcn_numpy.py.

Binary layout (little-endian, matches cpp/gcn.cpp::loadGraphBin):
  magic  "GGRAPH1\n"                 8 bytes
  int32  N, F, C                     node count, feature dim, class count
  float32 X[N*F]                     features, row-major
  float32 A[N*N]                     adjacency, row-major
  int32  y[N]                        labels
  int8   train[N], val[N], test[N]   split masks

Run:  python build_graph.py         # -> graph.npz (real SSOC graph)
      python export_graph_bin.py    # -> graph.bin
      cpp/gcn --graph graph.bin     # C++ GCN on the real graph
"""
import os, sys, struct
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
NPZ = os.path.join(HERE, "graph.npz")
OUT = os.path.join(HERE, "graph.bin")


def main():
    if not os.path.exists(NPZ):
        sys.exit(f"No {NPZ}. Run build_graph.py first.")
    d = np.load(NPZ)
    X = np.ascontiguousarray(d["X"], dtype=np.float32)
    A = np.ascontiguousarray(d["A"], dtype=np.float32)
    y = np.ascontiguousarray(d["y"], dtype=np.int32)
    tr = np.ascontiguousarray(d["train_mask"], dtype=np.int8)
    va = np.ascontiguousarray(d["val_mask"], dtype=np.int8)
    te = np.ascontiguousarray(d["test_mask"], dtype=np.int8)
    N, F = X.shape
    C = int(y.max()) + 1
    with open(OUT, "wb") as f:
        f.write(b"GGRAPH1\n")
        f.write(struct.pack("<iii", N, F, C))
        f.write(X.tobytes())
        f.write(A.tobytes())
        f.write(y.tobytes())
        f.write(tr.tobytes()); f.write(va.tobytes()); f.write(te.tobytes())
    print(f"wrote {OUT}: N={N} F={F} C={C} "
          f"(X {X.nbytes} + A {A.nbytes} bytes) split {int(tr.sum())}/{int(va.sum())}/{int(te.sum())}")


if __name__ == "__main__":
    main()
