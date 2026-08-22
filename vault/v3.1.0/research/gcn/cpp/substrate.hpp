// Phase 1 (C++ port) - assemble the occupation<->skill substrate from the Phase 0
// harvests. Faithful port of build_substrate_graph.py: deterministic assembly, no LLM,
// no invented edge; every edge typed by source so Phase 2 can ablate ESCO-only vs +MCF.
//
// Parity note: the skill vocabulary is index-encoded in FIRST-SEEN order, exactly like
// the Python `skill_idx[k] = len(skill_idx)`. std::map is sorted, so we use an
// unordered_map for the id lookup and a parallel vector for labels to preserve that order
// - otherwise the integer ids (and thus the .bin) would differ from the reference build.
#pragma once
#include "json.hpp"
#include <string>
#include <vector>
#include <array>
#include <unordered_map>
#include <map>
#include <set>
#include <fstream>
#include <sstream>
#include <cstdint>
#include <algorithm>

namespace substrate {

struct Graph {
  std::vector<std::string> occ_labels;
  std::vector<std::string> skill_labels;
  std::vector<std::array<int64_t, 3>> os_edges;    // (occ, skill, essential)
  std::vector<std::array<int64_t, 3>> cooc_edges;   // (skill_i, skill_j, count)
};

// _norm: lowercase + collapse all runs of ASCII whitespace to a single space, trimmed.
// (UTF-8 bytes >= 0x80 pass through untouched; casing only affects ASCII, matching
// Python str.lower() for the ASCII skill labels the harvest emits.)
inline std::string norm(const std::string& in) {
  std::string out;
  out.reserve(in.size());
  bool inWord = false, wrotePending = false;
  for (unsigned char c : in) {
    bool ws = (c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f' || c == '\v');
    if (ws) {
      if (inWord) wrotePending = true;  // remember we owe a single space before next word
      inWord = false;
    } else {
      if (wrotePending) { out += ' '; wrotePending = false; }
      char lc = (c >= 'A' && c <= 'Z') ? (char)(c - 'A' + 'a') : (char)c;
      out += lc;
      inWord = true;
    }
  }
  return out;
}

// Vocabulary with first-seen ordering. sid("") -> -1 (Python None).
struct Vocab {
  std::unordered_map<std::string, int64_t> idx;
  std::vector<std::string> labels;  // labels[i] == normalised name at index i
  int64_t sid(const std::string& name) {
    std::string k = norm(name);
    if (k.empty()) return -1;
    auto it = idx.find(k);
    if (it != idx.end()) return it->second;
    int64_t id = (int64_t)labels.size();
    idx.emplace(k, id);
    labels.push_back(k);
    return id;
  }
};

// Pure build: esco rows + mcf rows -> Graph. Mirrors build_substrate_graph.py::build.
inline Graph build(const std::vector<gjson::Value>& esco_rows,
                   const std::vector<gjson::Value>& mcf_rows) {
  Graph g;
  Vocab vocab;

  for (const auto& r : esco_rows) {
    const gjson::Array* skills = r.getArr("skills");
    if (!skills || skills->empty()) continue;  // no resolved skills -> no edge
    int64_t oi = (int64_t)g.occ_labels.size();
    std::string label = r.getStr("ssoc_title");
    if (label.empty()) label = r.getStr("ssoc");
    if (label.empty()) label = "occ" + std::to_string(oi);
    g.occ_labels.push_back(label);
    for (const auto& s : *skills) {
      std::string sname = s.getStr("skill");
      int64_t j = vocab.sid(sname);
      if (j >= 0) g.os_edges.push_back({oi, j, s.getBool("isEssential") ? 1 : 0});
    }
  }

  // MCF skill co-occurrence: unordered pairs within each posting's DISTINCT skill set.
  std::map<std::pair<int64_t, int64_t>, int64_t> pair;
  for (const auto& r : mcf_rows) {
    const gjson::Array* skills = r.getArr("skills");
    if (!skills) continue;
    std::set<int64_t> ids;
    for (const auto& s : *skills) {
      if (s.type != gjson::Type::String) continue;
      int64_t id = vocab.sid(s.str);
      if (id >= 0) ids.insert(id);  // std::set -> sorted + deduped, like Python sorted(set)
    }
    std::vector<int64_t> v(ids.begin(), ids.end());
    for (size_t a = 0; a < v.size(); ++a)
      for (size_t b = a + 1; b < v.size(); ++b)
        pair[{v[a], v[b]}] += 1;
  }

  g.skill_labels = vocab.labels;
  g.cooc_edges.reserve(pair.size());
  for (const auto& kv : pair)
    g.cooc_edges.push_back({kv.first.first, kv.first.second, kv.second});
  return g;
}

struct Summary {
  int64_t occupations = 0, skills = 0, occupation_skill_edges = 0;
  int64_t essential_edges = 0, mcf_cooccurrence_edges = 0;
};

inline Summary summarize(const Graph& g) {
  Summary s;
  s.occupations = (int64_t)g.occ_labels.size();
  s.skills = (int64_t)g.skill_labels.size();
  s.occupation_skill_edges = (int64_t)g.os_edges.size();
  for (const auto& e : g.os_edges) if (e[2] == 1) s.essential_edges++;
  s.mcf_cooccurrence_edges = (int64_t)g.cooc_edges.size();
  return s;
}

inline std::string summaryJson(const Summary& s) {
  std::ostringstream o;
  o << "{\"occupations\": " << s.occupations
    << ", \"skills\": " << s.skills
    << ", \"occupation_skill_edges\": " << s.occupation_skill_edges
    << ", \"essential_edges\": " << s.essential_edges
    << ", \"mcf_cooccurrence_edges\": " << s.mcf_cooccurrence_edges
    << ", \"sources\": {\"occupation_skill\": \"ESCO v1.2 (crosswalked from SSOC 2024)\","
    << " \"skill_cooccurrence\": \"MyCareersFuture live postings\"}}";
  return o.str();
}

// --- JSONL reader (skips malformed lines, like the Python try/except) ---
inline std::vector<gjson::Value> read_jsonl(const std::string& path) {
  std::vector<gjson::Value> rows;
  std::ifstream f(path);
  if (!f) return rows;
  std::string line;
  while (std::getline(f, line)) {
    // trim trailing CR/whitespace
    while (!line.empty() && (line.back() == '\r' || line.back() == ' ' || line.back() == '\t')) line.pop_back();
    if (line.empty()) continue;
    try { rows.push_back(gjson::parse(line)); } catch (...) { /* skip */ }
  }
  return rows;
}

// --- Binary interchange (build_substrate writes, linkpred reads) ---
// Layout: magic "GSUB1\n" | u64 nOcc, [u32 len,bytes]* | u64 nSkill, [..]*
//         | u64 nOs, [i64 i64 i64]* | u64 nCooc, [i64 i64 i64]*
static const char* kMagic = "GSUB1\n";

inline void wU64(std::ostream& o, uint64_t v) { o.write(reinterpret_cast<const char*>(&v), 8); }
inline void wI64(std::ostream& o, int64_t v) { o.write(reinterpret_cast<const char*>(&v), 8); }
inline void wStr(std::ostream& o, const std::string& s) {
  uint32_t n = (uint32_t)s.size();
  o.write(reinterpret_cast<const char*>(&n), 4);
  o.write(s.data(), n);
}
inline uint64_t rU64(std::istream& i) { uint64_t v = 0; i.read(reinterpret_cast<char*>(&v), 8); return v; }
inline int64_t rI64(std::istream& i) { int64_t v = 0; i.read(reinterpret_cast<char*>(&v), 8); return v; }
inline std::string rStr(std::istream& i) {
  uint32_t n = 0; i.read(reinterpret_cast<char*>(&n), 4);
  std::string s(n, '\0'); i.read(&s[0], n); return s;
}

inline bool save(const Graph& g, const std::string& path) {
  std::ofstream o(path, std::ios::binary);
  if (!o) return false;
  o.write(kMagic, 6);
  wU64(o, g.occ_labels.size());
  for (const auto& s : g.occ_labels) wStr(o, s);
  wU64(o, g.skill_labels.size());
  for (const auto& s : g.skill_labels) wStr(o, s);
  wU64(o, g.os_edges.size());
  for (const auto& e : g.os_edges) { wI64(o, e[0]); wI64(o, e[1]); wI64(o, e[2]); }
  wU64(o, g.cooc_edges.size());
  for (const auto& e : g.cooc_edges) { wI64(o, e[0]); wI64(o, e[1]); wI64(o, e[2]); }
  return (bool)o;
}

inline bool load(Graph& g, const std::string& path) {
  std::ifstream i(path, std::ios::binary);
  if (!i) return false;
  char magic[6]; i.read(magic, 6);
  if (std::string(magic, 6) != kMagic) return false;
  uint64_t n;
  n = rU64(i); g.occ_labels.resize(n); for (auto& s : g.occ_labels) s = rStr(i);
  n = rU64(i); g.skill_labels.resize(n); for (auto& s : g.skill_labels) s = rStr(i);
  n = rU64(i); g.os_edges.resize(n); for (auto& e : g.os_edges) { e[0] = rI64(i); e[1] = rI64(i); e[2] = rI64(i); }
  n = rU64(i); g.cooc_edges.resize(n); for (auto& e : g.cooc_edges) { e[0] = rI64(i); e[1] = rI64(i); e[2] = rI64(i); }
  return (bool)i;
}

}  // namespace substrate
