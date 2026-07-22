// GCN encoder CLI (C++ port of gcn_numpy.py).
//   gcn --self-test     synthetic homophilous graph; asserts GCN beats the features-only MLP
//
// Real-data path (follow-on): gcn_numpy.py trains on graph.npz from build_graph.py. A C++
// run on real data needs a graph.bin exporter (as build_substrate does for the substrate);
// until then this CLI proves the encoder on a synthetic task. The training code is the
// deliverable and is identical in shape to the NumPy reference.
#include "gcn.hpp"
#include <iostream>
#include <vector>
#include <random>
#include <cstdint>

using namespace gcn;

// Build a synthetic node-classification task where the GRAPH carries signal the features
// alone do not: per-node features are a weak class bump buried in heavy noise, but nodes of
// the same class are densely connected, so neighbour-averaging (what the GCN does) recovers
// the class. A features-only MLP cannot exploit the wiring and should lose.
static Graph makeSynthetic(int C, int perClass, int F, int kIntra, uint64_t seed) {
  std::mt19937_64 rng(seed);
  std::normal_distribution<float> noise(0.0f, 1.0f);
  std::uniform_int_distribution<int> pick(0, perClass - 1);
  int N = C * perClass;

  Graph g;
  g.nClasses = C;
  g.X = Mat(N, F, 0.0f);
  g.A = Mat(N, N, 0.0f);
  g.y.resize(N);
  g.tr.assign(N, 0); g.va.assign(N, 0); g.te.assign(N, 0);

  // labels: node i belongs to class i / perClass
  for (int i = 0; i < N; ++i) g.y[i] = i / perClass;

  // features: small class bump (0.6 over a 3-dim block) + N(0,1) noise per feature.
  for (int i = 0; i < N; ++i) {
    int cls = g.y[i];
    for (int j = 0; j < F; ++j) g.X.at(i, j) = noise(rng);
    for (int b = 0; b < 3; ++b) { int j = (cls * 3 + b) % F; g.X.at(i, j) += 0.6f; }
  }

  // homophilous edges: connect each node to kIntra random same-class nodes (symmetric),
  // plus one cross-class noise edge, so the graph is informative but not trivial.
  auto addEdge = [&](int a, int b) { if (a != b) { g.A.at(a, b) = 1.0f; g.A.at(b, a) = 1.0f; } };
  for (int i = 0; i < N; ++i) {
    int cls = g.y[i];
    for (int e = 0; e < kIntra; ++e) addEdge(i, cls * perClass + pick(rng));
    int other = (cls + 1 + (i % (C - 1))) % C;
    addEdge(i, other * perClass + pick(rng));
  }

  // per-class split 60/20/20
  std::uniform_real_distribution<float> u(0.0f, 1.0f);
  for (int i = 0; i < N; ++i) {
    float r = u(rng);
    if (r < 0.6f) g.tr[i] = 1; else if (r < 0.8f) g.va[i] = 1; else g.te[i] = 1;
  }
  // guarantee each split is non-empty
  bool anyTe = false, anyVa = false; for (int i = 0; i < N; ++i) { anyTe |= g.te[i]; anyVa |= g.va[i]; }
  if (!anyTe) g.te[N - 1] = 1;
  if (!anyVa) g.va[0] = 1;
  return g;
}

static int self_test() {
  const int C = 4;
  Graph g = makeSynthetic(/*C*/ C, /*perClass*/ 50, /*F*/ 24, /*kIntra*/ 8, /*seed*/ 42);

  TrainResult gcnR = train(g, /*hidden*/ 16, /*epochs*/ 150, /*lr*/ 0.02f, /*wd*/ 5e-4f,
                           /*dropout*/ 0.5f, /*mlp*/ false, /*seed*/ 0, /*patience*/ 40);
  TrainResult mlpR = train(g, 16, 150, 0.02f, 5e-4f, 0.5f, /*mlp*/ true, 0, 40);

  std::cout << "self-test: GCN test acc " << gcnR.testAcc * 100 << "%  vs  MLP (no graph) "
            << mlpR.testAcc * 100 << "%  (random = " << 100.0 / C << "%)\n";

  if (!(gcnR.testAcc > mlpR.testAcc)) {
    std::cerr << "FAIL: the graph must add value (GCN should beat the features-only MLP)\n";
    return 1;
  }
  if (!(gcnR.testAcc > 1.5f / C)) {
    std::cerr << "FAIL: GCN should be well above the random baseline\n";
    return 1;
  }
  std::cout << "self-test OK - the GCN exploits graph structure the MLP cannot.\n";
  return 0;
}

int main(int argc, char** argv) {
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--self-test") return self_test();
  }
  std::cerr << "usage: gcn --self-test\n"
            << "(real-data training needs a graph.bin exporter from build_graph.py - see header)\n";
  return 2;
}
