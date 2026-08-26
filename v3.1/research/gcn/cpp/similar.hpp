// "Similar roles" serving logic: given the skills identified for a role, rank the
// occupations whose own skill sets overlap most with it - i.e. adjacent roles / career
// pivots. Deterministic and sourced (ESCO occupation->skill sets); the engine authors the
// score, no LLM. Same discipline as suggest.hpp.
#pragma once
#include "substrate.hpp"
#include <vector>
#include <set>
#include <string>
#include <algorithm>

namespace similar {

using substrate::Graph;

// occupation -> its skill set (from os_edges), built once at startup.
struct OccIndex {
  std::vector<std::set<int64_t>> occSkills;  // indexed by occupation id
};

// Uses ALL occupation->skill edges (essential + optional). Essential-only was too sparse -
// skills that are OPTIONAL in ESCO (e.g. python, machine learning for many roles) then
// contributed no overlap, so tech/health queries returned nothing. The share>=minShared gate
// in similarRoles (plus fuzzy query expansion) is what controls quality instead.
inline OccIndex buildOccIndex(const Graph& g) {
  OccIndex ix;
  ix.occSkills.resize(g.occ_labels.size());
  for (const auto& e : g.os_edges)
    if (e[0] >= 0 && (size_t)e[0] < ix.occSkills.size()) ix.occSkills[e[0]].insert(e[1]);
  return ix;
}

struct RoleMatch {
  int64_t occId;
  std::string title;
  double score;                          // Jaccard similarity of skill sets (0..1)
  int shared;                            // |occ_skills ∩ query|
  std::vector<std::string> sharedSkills; // a few shared skill names (evidence)
};

// Rank occupations by Jaccard similarity between their skill set and the query skills.
// minShared gates OUT low-confidence, single-incidental-skill matches: a role must share at
// least `minShared` of the query's skills to count as "similar". This makes the endpoint
// withhold (return few/none) rather than surface a tenuous adjacency - the honesty discipline.
inline std::vector<RoleMatch> similarRoles(const Graph& g, const OccIndex& ix,
                                           const std::vector<int64_t>& querySkills, size_t topN,
                                           int minShared = 2) {
  std::set<int64_t> Q(querySkills.begin(), querySkills.end());
  if (Q.empty()) return {};
  std::vector<RoleMatch> out;
  for (size_t o = 0; o < ix.occSkills.size(); ++o) {
    const auto& S = ix.occSkills[o];
    if (S.empty()) continue;
    std::vector<int64_t> sharedIds;
    for (int64_t q : Q) if (S.count(q)) sharedIds.push_back(q);
    int shared = (int)sharedIds.size();
    if (shared < minShared) continue;
    double uni = (double)(S.size() + Q.size() - shared);  // |S ∪ Q|
    RoleMatch m;
    m.occId = (int64_t)o;
    m.title = g.occ_labels[o];
    m.score = uni > 0 ? shared / uni : 0.0;
    m.shared = shared;
    for (size_t i = 0; i < sharedIds.size() && i < 5; ++i)
      if (sharedIds[i] >= 0 && (size_t)sharedIds[i] < g.skill_labels.size())
        m.sharedSkills.push_back(g.skill_labels[sharedIds[i]]);
    out.push_back(std::move(m));
  }
  std::stable_sort(out.begin(), out.end(), [](const RoleMatch& a, const RoleMatch& b) {
    if (a.score != b.score) return a.score > b.score;
    return a.shared > b.shared;
  });
  if (out.size() > topN) out.resize(topN);
  return out;
}

}  // namespace similar
