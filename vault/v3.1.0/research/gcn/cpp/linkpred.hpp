// Phase 2 (C++ port) - occupation->skill link prediction ("suggest skills for a role").
// Faithful port of linkpred.py: hold out essential ESCO edges, predict them back, score
// AUC + hits@k under four transparent scorers, and report the MCF-over-ESCO lift that IS
// the thesis of the whole substrate. No black box - a "no lift" null is as legible as a win.
//
// RNG honesty: NumPy's RandomState cannot be reproduced bit-for-bit in C++, so on REAL data
// the seeded AUC numbers are statistically comparable, not identical, to linkpred.py. The
// self-test asserts STRUCTURAL facts (planted MCF-only signal -> mcf AUC=1.0, esco<mcf,
// hits@1=1.0) that hold regardless of the sampler, so parity there is exact.
#pragma once
#include "substrate.hpp"
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <set>
#include <map>
#include <cmath>
#include <random>
#include <algorithm>
#include <string>

namespace linkpred {

using substrate::Graph;
using Aff = std::unordered_map<int64_t, std::unordered_map<int64_t, double>>;
using KnownSets = std::map<int64_t, std::set<int64_t>>;   // ordered for deterministic iteration

struct Scores { double auc = -1; double hits1 = -1; double hits5 = -1; bool has = false; };
struct Result { Scores popularity, esco, mcf, esco_mcf; };

// occ -> set of essential skills (essential_only mirrors the Python default True).
inline KnownSets occ_skill_sets(const std::vector<std::array<int64_t,3>>& os_edges, bool essential_only = true) {
  KnownSets known;
  for (const auto& e : os_edges) {
    if (essential_only && e[2] != 1) continue;
    known[e[0]].insert(e[1]);
  }
  return known;
}

// symmetric affinity from (i,j,w) edges: aff[i][j]+=w, aff[j][i]+=w.
inline Aff cooc_from_edges(const std::vector<std::array<int64_t,3>>& pairs) {
  Aff aff;
  for (const auto& e : pairs) {
    double w = (double)e[2];
    aff[e[0]][e[1]] += w;
    aff[e[1]][e[0]] += w;
  }
  return aff;
}

inline double affGet(const Aff& aff, int64_t s, int64_t k) {
  auto it = aff.find(s);
  if (it == aff.end()) return 0.0;
  auto jt = it->second.find(k);
  return jt == it->second.end() ? 0.0 : jt->second;
}

// Distinct sample without replacement of size min(n, pool.size()) via partial Fisher-Yates.
inline std::vector<int64_t> sampleNoReplace(std::vector<int64_t> pool, size_t n, std::mt19937_64& rng) {
  size_t k = std::min(n, pool.size());
  for (size_t i = 0; i < k; ++i) {
    std::uniform_int_distribution<size_t> d(i, pool.size() - 1);
    std::swap(pool[i], pool[d(rng)]);
  }
  pool.resize(k);
  return pool;
}

struct RawScorers {
  const KnownSets& train;
  const Aff& esco_aff;
  const Aff& mcf_aff;
  const std::unordered_map<int64_t,double>& pop;
  double esco(int64_t o, int64_t s) const {
    double sum = 0; auto it = train.find(o);
    if (it != train.end()) for (int64_t k : it->second) sum += affGet(esco_aff, s, k);
    return sum;
  }
  double mcf(int64_t o, int64_t s) const {
    double sum = 0; auto it = train.find(o);
    if (it != train.end()) for (int64_t k : it->second) sum += affGet(mcf_aff, s, k);
    return sum;
  }
  double popular(int64_t s) const {
    auto it = pop.find(s); return it == pop.end() ? 0.0 : it->second;
  }
};

inline double zof(double x, double m, double sd) { return sd ? (x - m) / sd : 0.0; }

inline Result evaluate(const KnownSets& train,
                       const std::vector<std::pair<int64_t,int64_t>>& held,
                       const std::vector<int64_t>& all_skills,
                       const Aff& esco_aff, const Aff& mcf_aff,
                       const std::unordered_map<int64_t,double>& pop,
                       uint64_t seed = 0, size_t negs = 50) {
  RawScorers R{train, esco_aff, mcf_aff, pop};

  // z-norm calibration for the combined scorer, over the held set (matches Python).
  double eM = 0, eS = 1, mM = 0, mS = 1;
  if (!held.empty()) {
    std::vector<double> es, ms;
    es.reserve(held.size()); ms.reserve(held.size());
    for (auto& h : held) { es.push_back(R.esco(h.first, h.second)); ms.push_back(R.mcf(h.first, h.second)); }
    auto meanStd = [](const std::vector<double>& v, double& m, double& sd) {
      double s = 0; for (double x : v) s += x; m = s / v.size();
      double q = 0; for (double x : v) q += (x - m) * (x - m); sd = std::sqrt(q / v.size());
      if (sd == 0) sd = 1.0;
    };
    meanStd(es, eM, eS); meanStd(ms, mM, mS);
  }

  auto scoreOf = [&](int which, int64_t o, int64_t s) -> double {
    switch (which) {
      case 0: return R.popular(s);
      case 1: return R.esco(o, s);
      case 2: return R.mcf(o, s);
      default: return zof(R.esco(o, s), eM, eS) + zof(R.mcf(o, s), mM, mS);
    }
  };

  std::map<int64_t, std::set<int64_t>> truth;
  for (auto& h : held) truth[h.first].insert(h.second);

  Result out;
  Scores* slots[4] = {&out.popularity, &out.esco, &out.mcf, &out.esco_mcf};
  std::mt19937_64 rng(seed);

  for (int which = 0; which < 4; ++which) {
    double wins = 0; long comps = 0, hits1 = 0, hits5 = 0;
    for (auto& h : held) {
      int64_t o = h.first, s_pos = h.second;
      std::unordered_set<int64_t> forbidden;
      { auto it = truth.find(o); if (it != truth.end()) forbidden.insert(it->second.begin(), it->second.end()); }
      { auto it = train.find(o); if (it != train.end()) forbidden.insert(it->second.begin(), it->second.end()); }
      std::vector<int64_t> cand, negs_pool;
      cand.reserve(all_skills.size());
      for (int64_t s : all_skills) {
        bool blocked = forbidden.count(s) && s != s_pos;
        if (!blocked) { cand.push_back(s); if (s != s_pos) negs_pool.push_back(s); }
      }
      if (negs_pool.empty()) continue;
      auto sample = sampleNoReplace(negs_pool, negs, rng);
      double sp = scoreOf(which, o, s_pos);
      for (int64_t sn : sample) {
        comps++;
        double v = scoreOf(which, o, sn);
        if (sp > v) wins += 1.0; else if (sp == v) wins += 0.5;
      }
      // stable sort by score desc; original cand order breaks ties (matches Python stable sort)
      std::vector<int64_t> ranked = cand;
      std::stable_sort(ranked.begin(), ranked.end(),
                       [&](int64_t a, int64_t b) { return scoreOf(which, o, a) > scoreOf(which, o, b); });
      size_t pos_rank = std::find(ranked.begin(), ranked.end(), s_pos) - ranked.begin();
      if (pos_rank < 1) hits1++;
      if (pos_rank < 5) hits5++;
    }
    long n = (long)held.size();
    Scores sc;
    sc.has = true;
    sc.auc = comps ? wins / comps : -1;
    sc.hits1 = n ? (double)hits1 / n : -1;
    sc.hits5 = n ? (double)hits5 / n : -1;
    *slots[which] = sc;
  }
  return out;
}

// Deterministic-ish split: hold out ~holdout_frac of each occupation's essential skills
// (keeping >=1 for context). Uses the C++ RNG; see the RNG-honesty note at the top.
inline void split(const KnownSets& known, KnownSets& train,
                  std::vector<std::pair<int64_t,int64_t>>& held,
                  double holdout_frac = 0.3, uint64_t seed = 0) {
  std::mt19937_64 rng(seed);
  train.clear(); held.clear();
  for (const auto& kv : known) {
    int64_t o = kv.first;
    std::vector<int64_t> sk(kv.second.begin(), kv.second.end());  // sorted
    if (sk.size() < 2) { train[o] = kv.second; continue; }
    size_t k = std::max<size_t>(1, (size_t)std::llround(sk.size() * holdout_frac));
    k = std::min(k, sk.size() - 1);
    auto pick = sampleNoReplace(sk, k, rng);
    std::set<int64_t> pickSet(pick.begin(), pick.end());
    std::set<int64_t> tr;
    for (int64_t s : sk) if (!pickSet.count(s)) tr.insert(s);
    train[o] = tr;
    for (int64_t s : pick) held.push_back({o, s});
  }
}

// One split+evaluate over the real graph.
inline Result run(const Graph& g, uint64_t seed, size_t& heldCount) {
  KnownSets known = occ_skill_sets(g.os_edges, true);
  KnownSets train;
  std::vector<std::pair<int64_t,int64_t>> held;
  split(known, train, held, 0.3, seed);
  heldCount = held.size();

  std::unordered_map<int64_t,double> pop;
  for (const auto& e : g.os_edges) if (e[2] == 1) pop[e[1]] += 1.0;

  // ESCO affinity from TRAIN co-occurrence: unordered pairs s1<s2 within each train[o].
  std::vector<std::array<int64_t,3>> esco_pairs;
  for (const auto& kv : train) {
    std::vector<int64_t> v(kv.second.begin(), kv.second.end());
    for (size_t a = 0; a < v.size(); ++a)
      for (size_t b = a + 1; b < v.size(); ++b)
        esco_pairs.push_back({v[a], v[b], 1});
  }
  Aff esco_aff = cooc_from_edges(esco_pairs);
  Aff mcf_aff = cooc_from_edges(g.cooc_edges);

  std::vector<int64_t> all_skills(g.skill_labels.size());
  for (size_t i = 0; i < all_skills.size(); ++i) all_skills[i] = (int64_t)i;

  return evaluate(train, held, all_skills, esco_aff, mcf_aff, pop, seed, 50);
}

}  // namespace linkpred
