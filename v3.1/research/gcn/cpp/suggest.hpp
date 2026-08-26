// Serving logic for the Railway C++ service: given the skills already identified for a
// role (Step 2 output), rank ADJACENT skills the posting did not mention, grounded in
// ESCO structure + real MCF co-occurrence, each tagged with its source. This is the
// substrate being *useful* at Step 2 -> Step 3, not just a batch probe.
//
// Deterministic and sourced: the engine authors every score; no LLM, no invented edge -
// same non-inventive discipline as the rest of the substrate.
#pragma once
#include "substrate.hpp"
#include "linkpred.hpp"   // reuses Aff, cooc_from_edges, affGet
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>

namespace suggest {

using substrate::Graph;
using linkpred::Aff;
using linkpred::cooc_from_edges;
using linkpred::affGet;

struct Affinities {
  Aff esco;   // skill<->skill co-occurrence WITHIN an occupation (ESCO structural signal)
  Aff mcf;    // skill<->skill co-occurrence in real MCF postings (independent signal)
  double escoMax = 1.0, mcfMax = 1.0;  // per-source normalisers so the two scales combine fairly
};

// Build both affinity tables once, at service startup, from the loaded graph.
inline Affinities buildAffinities(const Graph& g) {
  Affinities a;
  // ESCO: pairs of skills that share an occupation. Group os_edges by occupation.
  std::unordered_map<int64_t, std::vector<int64_t>> byOcc;
  for (const auto& e : g.os_edges) byOcc[e[0]].push_back(e[1]);
  std::vector<std::array<int64_t,3>> escoPairs;
  for (auto& kv : byOcc) {
    auto& v = kv.second;
    std::sort(v.begin(), v.end());
    v.erase(std::unique(v.begin(), v.end()), v.end());
    for (size_t i = 0; i < v.size(); ++i)
      for (size_t j = i + 1; j < v.size(); ++j)
        escoPairs.push_back({v[i], v[j], 1});
  }
  a.esco = cooc_from_edges(escoPairs);
  a.mcf = cooc_from_edges(g.cooc_edges);
  // Normalisers: the largest single-neighbour weight in each table (>=1 to avoid div0).
  for (const auto& row : a.esco) for (const auto& kv : row.second) a.escoMax = std::max(a.escoMax, kv.second);
  for (const auto& row : a.mcf)  for (const auto& kv : row.second) a.mcfMax = std::max(a.mcfMax, kv.second);
  return a;
}

struct Suggestion {
  int64_t id;
  std::string skill;
  double score;        // combined, normalised (0..2)
  double escoScore;    // raw ESCO affinity to the known set
  double mcfScore;     // raw MCF affinity to the known set
  bool fromEsco;
  bool fromMcf;
};

// Score every candidate skill against the known set; return the top N by combined score.
inline std::vector<Suggestion> suggest(const Graph& g, const Affinities& aff,
                                       const std::vector<int64_t>& known, size_t topN) {
  std::vector<char> isKnown(g.skill_labels.size(), 0);
  for (int64_t k : known) if (k >= 0 && (size_t)k < isKnown.size()) isKnown[k] = 1;

  std::vector<Suggestion> out;
  for (size_t s = 0; s < g.skill_labels.size(); ++s) {
    if (isKnown[s]) continue;  // don't suggest what the role already has
    double e = 0, m = 0;
    for (int64_t k : known) {
      e += affGet(aff.esco, (int64_t)s, k);
      m += affGet(aff.mcf, (int64_t)s, k);
    }
    if (e == 0 && m == 0) continue;  // no evidence -> not a suggestion
    double combined = (e / aff.escoMax) + (m / aff.mcfMax);
    out.push_back({(int64_t)s, g.skill_labels[s], combined, e, m, e > 0, m > 0});
  }
  std::stable_sort(out.begin(), out.end(),
                   [](const Suggestion& a, const Suggestion& b) { return a.score > b.score; });
  if (out.size() > topN) out.resize(topN);
  return out;
}

}  // namespace suggest
