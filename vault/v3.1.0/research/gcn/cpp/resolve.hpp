// Skill-name resolver: bridges the vocabulary gap between a caller's skill names (posting /
// LLM-extracted, e.g. "python", "teaching", "welding") and ESCO's formal skill labels
// (e.g. "python (computer programming)", "apply teaching strategies", "operate welding
// equipment"). Exact-string matching missed all of those; token-subset matching finds them.
//
// A query name resolves to every substrate skill whose token set CONTAINS all the query's
// tokens. Token boundaries keep it precise: "sql" matches "sql server" but NOT "nosql".
#pragma once
#include "substrate.hpp"
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>
#include <algorithm>

namespace resolve {

using substrate::Graph;

// Generic English + ESCO boilerplate verbs; dropping them keeps matching on the meaningful
// noun tokens ("apply teaching strategies" -> {teaching, strategies}).
inline const std::unordered_set<std::string>& stop() {
  static const std::unordered_set<std::string> s = {
    "and", "the", "of", "to", "in", "for", "with", "an", "on", "or", "by", "as", "at",
    "from", "a", "apply", "use", "using", "operate", "perform", "provide", "manage",
    "ensure", "carry", "conduct", "work", "types", "type"
  };
  return s;
}

inline std::vector<std::string> tokenize(const std::string& norm) {
  std::vector<std::string> out;
  std::string cur;
  auto flush = [&]() { if (cur.size() >= 2 && !stop().count(cur)) out.push_back(cur); cur.clear(); };
  for (char c : norm) {
    if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) cur += c;
    else flush();
  }
  flush();
  return out;
}

struct Index {
  std::unordered_map<std::string, std::vector<int64_t>> tokenToSkills;  // token -> sorted skill ids
};

inline Index buildIndex(const Graph& g) {
  Index ix;
  for (size_t i = 0; i < g.skill_labels.size(); ++i)
    for (const auto& t : tokenize(g.skill_labels[i]))
      ix.tokenToSkills[t].push_back((int64_t)i);
  for (auto& kv : ix.tokenToSkills) {
    auto& v = kv.second;
    std::sort(v.begin(), v.end());
    v.erase(std::unique(v.begin(), v.end()), v.end());
  }
  return ix;
}

// Resolve one query skill name -> substrate skill ids (exact match, else token-subset).
inline std::vector<int64_t> resolveSkill(const std::string& rawName,
                                         const std::unordered_map<std::string, int64_t>& name2id,
                                         const Index& ix, size_t cap = 40) {
  std::string n = substrate::norm(rawName);
  auto it = name2id.find(n);
  if (it != name2id.end()) return { it->second };   // exact wins
  auto toks = tokenize(n);
  if (toks.empty()) return {};
  // Start from the rarest token's posting list, then keep only skills that contain EVERY
  // query token (token-subset containment).
  const std::vector<int64_t>* smallest = nullptr;
  for (const auto& t : toks) {
    auto jt = ix.tokenToSkills.find(t);
    if (jt == ix.tokenToSkills.end()) return {};    // a query token appears in no skill -> no match
    if (!smallest || jt->second.size() < smallest->size()) smallest = &jt->second;
  }
  std::vector<int64_t> out;
  for (int64_t sid : *smallest) {
    bool all = true;
    for (const auto& t : toks) {
      const auto& lst = ix.tokenToSkills.at(t);
      if (!std::binary_search(lst.begin(), lst.end(), sid)) { all = false; break; }
    }
    if (all) { out.push_back(sid); if (out.size() >= cap) break; }
  }
  return out;
}

}  // namespace resolve
