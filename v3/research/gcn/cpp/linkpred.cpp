// Phase 2 CLI (C++ port of linkpred.py).
//   linkpred                 reads substrate.bin -> ablation over 5 splits (mean AUC + lift)
//   linkpred --self-test     planted MCF-only signal; asserts the harness sees it
//   linkpred --npz FILE      override the substrate binary path
#include "linkpred.hpp"
#include <iostream>
#include <iomanip>
#include <vector>
#include <array>
#include <cmath>

using namespace linkpred;
using substrate::Graph;

static int self_test() {
  // Planted MCF-only signal: skill 99 is TRUE for occ 0 (held out) and in NO training edge,
  // so ESCO/popularity are blind (affinity 0). MCF pairs 99 with hub skill 0, which IS in
  // occ 0's training set -> only the MCF scorer can rank it. (Mirrors linkpred.py::self_test.)
  std::vector<std::array<int64_t,3>> os_edges;
  for (int o = 0; o < 10; ++o) os_edges.push_back({o, 0, 1});
  for (int o = 0; o < 10; ++o) os_edges.push_back({o, 1, 1});
  for (int o = 0; o < 10; ++o) os_edges.push_back({o, 2 + o, 1});
  os_edges.push_back({0, 99, 1});                              // the held-out target
  std::vector<std::array<int64_t,3>> cooc = {{99, 0, 25}, {0, 1, 5}};

  KnownSets known = occ_skill_sets(os_edges, true);
  KnownSets train;
  for (auto& kv : known) { std::set<int64_t> t = kv.second; t.erase(99); train[kv.first] = t; }
  std::vector<std::pair<int64_t,int64_t>> held = {{0, 99}};

  std::unordered_map<int64_t,double> pop;
  for (auto& e : os_edges) if (e[2] == 1 && e[1] != 99) pop[e[1]] += 1.0;

  std::vector<std::array<int64_t,3>> esco_pairs;
  for (auto& kv : train) {
    std::vector<int64_t> v(kv.second.begin(), kv.second.end());
    for (size_t a = 0; a < v.size(); ++a)
      for (size_t b = a + 1; b < v.size(); ++b)
        esco_pairs.push_back({v[a], v[b], 1});
  }
  Aff esco_aff = cooc_from_edges(esco_pairs);
  Aff mcf_aff = cooc_from_edges(cooc);

  std::vector<int64_t> all_skills(100);
  for (int i = 0; i < 100; ++i) all_skills[i] = i;

  Result r = evaluate(train, held, all_skills, esco_aff, mcf_aff, pop, 0, 40);
  std::cout << "self-test scores: mcf.auc=" << r.mcf.auc
            << " esco.auc=" << r.esco.auc
            << " mcf.hits@1=" << r.mcf.hits1 << "\n";

  if (r.mcf.auc != 1.0) { std::cerr << "FAIL: MCF should perfectly rank the planted edge: " << r.mcf.auc << "\n"; return 1; }
  double escoAuc = r.esco.auc < 0 ? 0.0 : r.esco.auc;
  if (!(escoAuc < r.mcf.auc)) { std::cerr << "FAIL: ESCO-only must not see the MCF-only signal\n"; return 1; }
  if (r.mcf.hits1 != 1.0) { std::cerr << "FAIL: mcf hits@1 should be 1.0: " << r.mcf.hits1 << "\n"; return 1; }

  std::cout << "self-test OK - the harness detects an MCF-only signal and ESCO-only does not.\n";
  return 0;
}

static void meanStd(const std::vector<double>& v, double& m, double& sd) {
  if (v.empty()) { m = 0; sd = 0; return; }
  double s = 0; for (double x : v) s += x; m = s / v.size();
  double q = 0; for (double x : v) q += (x - m) * (x - m); sd = std::sqrt(q / v.size());
}

int main(int argc, char** argv) {
  std::string npz = "substrate.bin";
  bool selfTest = false;
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--self-test") selfTest = true;
    else if (a == "--npz" && i + 1 < argc) npz = argv[++i];
  }
  if (selfTest) return self_test();

  Graph g;
  if (!substrate::load(g, npz)) {
    std::cerr << "No " << npz << ". Run build_substrate (which needs the Phase 0 harvest).\n";
    return 1;
  }

  std::vector<double> aucPop, aucEsco, aucMcf, aucBoth;
  size_t n = 0;
  for (uint64_t seed = 0; seed < 5; ++seed) {
    size_t held = 0;
    Result r = run(g, seed, held);
    n = held;
    if (r.popularity.auc >= 0) aucPop.push_back(r.popularity.auc);
    if (r.esco.auc >= 0) aucEsco.push_back(r.esco.auc);
    if (r.mcf.auc >= 0) aucMcf.push_back(r.mcf.auc);
    if (r.esco_mcf.auc >= 0) aucBoth.push_back(r.esco_mcf.auc);
  }

  std::cout << "link prediction over " << n << " held-out occupation->skill edges (mean AUC of 5 splits):\n";
  std::cout << std::fixed << std::setprecision(3);
  auto line = [](const char* name, const std::vector<double>& v) {
    double m, sd; meanStd(v, m, sd);
    if (v.empty()) std::cout << "  " << name << ": n/a\n";
    else std::cout << "  " << std::left << std::setw(10) << name << "  AUC " << m << " +/- " << sd << "\n";
  };
  line("popularity", aucPop);
  line("esco", aucEsco);
  line("mcf", aucMcf);
  line("esco+mcf", aucBoth);

  double mMcf, sMcf, mEsco, sEsco; meanStd(aucMcf, mMcf, sMcf); meanStd(aucEsco, mEsco, sEsco);
  double lift = mMcf - mEsco;
  std::cout << "\nMCF-over-ESCO lift: " << std::showpos << lift << std::noshowpos
            << "  (" << (lift > 0.01 ? "MCF adds signal" : "no lift - the honest null") << ")\n";
  return 0;
}
