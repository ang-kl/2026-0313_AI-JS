// Deterministic SSOC 2024 job-title classifier - C++ port of v3/api/ssoc.js's
// classifySsocJobs() (the "classifyTitles"/"classify_jobs" action). Postgres
// search/get/correspondence/seed stay in ssoc.js - those are I/O-bound; this
// covers only the compute-bound scoring loop (~1000 occupations scored per
// job, up to 80 jobs per batch).
//
// Every normaliseForMatch()/tokens()/tokenOverlapScore()/scoreSsocCandidate()/
// classifySsocJob() step below mirrors the JS original line-for-line -
// verified byte-for-byte against a Node harness running the real ssoc.js
// functions before this was wired into server.cpp (see classify_ssoc_selftest.cpp).
// NOTE: this is a DIFFERENT scoring formula from classify.hpp's SSIC port -
// ssoc.js's tokenOverlapScore is hits/max(|a|,|b|), not the weighted
// coverage/precision blend SSIC uses. Do not share code between the two; they
// were independently authored in the JS and diverge on purpose.
#pragma once
#include "json.hpp"
#include <string>
#include <vector>
#include <unordered_set>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <fstream>
#include <sstream>
#include <cctype>
#include <regex>

namespace ssoc {

struct Node {
  std::string code, kind, title, parent_code, definition, change_type, source_kind;
  int level = 0;
  std::vector<std::string> path;                 // ancestor+self codes, root to leaf
  std::vector<std::string> tasks, examples, exclusions;
  // Precomputed at load time (occupation nodes only need these, but populating
  // for all nodes is cheap and keeps hierarchyFor() uniform).
  std::string titleNorm;
  std::unordered_set<std::string> titleTokens, contextTokens;
};

struct Index {
  std::vector<Node> nodes;                        // insertion order matches ssoc.js's flat build
  std::unordered_map<std::string, size_t> byCode;  // code -> index into nodes
  std::vector<size_t> occupationIdx;               // indices of kind=="occupation"
  std::string version = "2024";
  bool loaded = false;
};

struct Job {
  std::string id, title, description;
  std::vector<std::string> categories, skills;
};

struct ShortNode {
  bool present = false;
  std::string code, title, kind, parent_code;
  int level = 0;
};

struct Hierarchy {
  ShortNode major_group, sub_major_group, minor_group, unit_group, occupation;
  std::vector<ShortNode> path;
};

struct Candidate {
  double score = 0.0;
  std::string confidence;
  ShortNode node;
  std::vector<std::string> reasons;
};

struct ClassifyResult {
  std::string id, title, status;   // status: "withheld" | "classified"
  double score = 0.0;
  std::string confidence, reason, source;
  bool hasNode = false;
  const Node* node = nullptr;      // full node - only meaningful when status=="classified"
  Hierarchy hierarchy;
  ShortNode family;
  std::vector<Candidate> candidates;
  std::vector<std::string> reasons;
};

// ── string helpers (mirror ssoc.js's safe()/arr()) ──────────────────────────
inline std::string collapseWs(const std::string& s) {
  std::istringstream iss(s);
  std::string word, out;
  bool first = true;
  while (iss >> word) { if (!first) out += ' '; out += word; first = false; }
  return out;
}

inline std::string safe(const std::string& raw, size_t max) {
  std::string s = collapseWs(raw);
  if (s.size() > max) s.resize(max);   // byte-length truncation; SSOC text is plain ASCII/English
  return s;
}

inline std::vector<std::string> arrOf(const std::vector<std::string>& raw, size_t max) {
  std::vector<std::string> out;
  for (const auto& x : raw) {
    std::string s = safe(x, 500);
    if (!s.empty()) out.push_back(std::move(s));
    if (out.size() >= max) break;
  }
  return out;
}

const std::unordered_set<std::string>& classifierStop() {
  static const std::unordered_set<std::string> STOP = {
    "and", "the", "for", "with", "from", "into", "onto", "this", "that", "role", "roles",
    "job", "jobs", "senior", "junior", "lead", "principal", "assistant", "associate",
    "executive", "officer", "specialist", "manager", "director", "head", "vice", "president",
    "svp", "avp", "vp", "contract", "permanent", "temporary", "intern", "trainee",
    "singapore", "regional", "global", "apac", "asia", "bank", "group", "team", "business",
  };
  return STOP;
}

// Mirrors ssoc.js normaliseForMatch(): safe(2000) -> lowercase -> strip <..> -> strip (..) ->
// strip job-req-ID tokens (wd12345, jr-4432, req 1234, job123) -> &amp;->and -> [/+_-]->space ->
// [^a-z0-9]+->space -> collapse whitespace -> trim.
inline std::string normaliseForMatch(const std::string& raw) {
  std::string s0 = safe(raw, 2000);
  std::string s;
  s.reserve(s0.size());
  for (unsigned char c : s0) s += (char)std::tolower(c);

  // strip <[^>]+>
  std::string s1; s1.reserve(s.size());
  for (size_t i = 0; i < s.size();) {
    if (s[i] == '<') {
      size_t close = s.find('>', i + 1);
      if (close != std::string::npos && close > i + 1) { s1 += ' '; i = close + 1; continue; }
    }
    s1 += s[i]; i++;
  }

  // strip \([^)]*\)
  std::string s2; s2.reserve(s1.size());
  for (size_t i = 0; i < s1.size();) {
    if (s1[i] == '(') {
      size_t close = s1.find(')', i + 1);
      if (close != std::string::npos) { s2 += ' '; i = close + 1; continue; }
    }
    s2 += s1[i]; i++;
  }

  // strip \b(?:wd|jr|req|job)[-\s]?\d+\b - job/requisition ID tokens
  static const std::regex ID_RX(R"(\b(?:wd|jr|req|job)[-\s]?\d+\b)");
  std::string s3 = std::regex_replace(s2, ID_RX, " ");

  // &amp; -> " and "
  std::string s4; s4.reserve(s3.size());
  for (size_t i = 0; i < s3.size();) {
    if (s3.compare(i, 5, "&amp;") == 0) { s4 += " and "; i += 5; continue; }
    s4 += s3[i]; i++;
  }

  // [/+_-] -> space, then [^a-z0-9]+ -> space (fused)
  std::string s5; s5.reserve(s4.size());
  for (char c : s4) {
    if (c == '/' || c == '+' || c == '_' || c == '-') { s5 += ' '; continue; }
    if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) s5 += c;
    else s5 += ' ';
  }

  return collapseWs(s5);
}

inline std::vector<std::string> tokenList(const std::string& value) {
  std::vector<std::string> out;
  std::istringstream iss(normaliseForMatch(value));
  std::string tok;
  const auto& stop = classifierStop();
  while (iss >> tok) if (tok.size() > 2 && !stop.count(tok)) out.push_back(tok);
  return out;
}

inline std::unordered_set<std::string> tokenSetOf(const std::string& value) {
  std::unordered_set<std::string> out;
  for (auto& t : tokenList(value)) out.insert(std::move(t));
  return out;
}

// ssoc.js's tokenOverlapScore: hits / max(|a|,|b|) - NOT the same formula as SSIC's overlap().
inline double tokenOverlapScoreSets(const std::unordered_set<std::string>& a,
                                     const std::unordered_set<std::string>& b) {
  if (a.empty() || b.empty()) return 0.0;
  size_t hits = 0;
  for (const auto& t : a) if (b.count(t)) hits++;
  return (double)hits / (double)std::max(a.size(), b.size());
}
inline double tokenOverlapScore(const std::string& left, const std::string& right) {
  return tokenOverlapScoreSets(tokenSetOf(left), tokenSetOf(right));
}

inline std::string classifyConfidence(double score) {
  if (score >= 105) return "high";
  if (score >= 72) return "medium";
  if (score >= 48) return "low";
  return "withheld";
}

inline ShortNode shortNode(const Node* n) {
  ShortNode s;
  if (!n) return s;
  s.present = true; s.code = n->code; s.title = n->title; s.level = n->level;
  s.kind = n->kind; s.parent_code = n->parent_code;
  return s;
}

inline Hierarchy hierarchyFor(const Node* node, const Index& idx) {
  Hierarchy h;
  if (!node) return h;
  std::vector<const Node*> nodes;
  for (const auto& code : node->path) {
    auto it = idx.byCode.find(code);
    if (it != idx.byCode.end()) nodes.push_back(&idx.nodes[it->second]);
  }
  auto get = [&](const std::string& kind) -> ShortNode {
    for (const Node* n : nodes) if (n->kind == kind) return shortNode(n);
    return ShortNode{};
  };
  h.major_group = get("major_group");
  h.sub_major_group = get("sub_major_group");
  h.minor_group = get("minor_group");
  ShortNode ug = get("unit_group");
  h.unit_group = ug.present ? ug : (node->kind == "unit_group" ? shortNode(node) : ShortNode{});
  h.occupation = (node->kind == "occupation") ? shortNode(node) : get("occupation");
  for (const Node* n : nodes) h.path.push_back(shortNode(n));
  return h;
}

// Regex used for the residual "n.e.c." tie-break penalty - same as App.jsx's Step 1a
// NEC de-emphasis (PR #269) and this file's ssoc.js original.
inline bool isNecTitle(const std::string& title) {
  static const std::regex NEC_RX(R"(not elsewhere classified|\bn\.?e\.?c\.?\b)", std::regex::icase);
  return std::regex_search(title, NEC_RX);
}

// scoreSsocCandidate: title stays the primary signal, but strong job-context overlap (>=0.5)
// alone can clear the classifyConfidence 'low' floor even with a weak/absent title match - see
// SSOC 2024 report sections 3.3/3.4 (classification by principal tasks/duties, not just title).
struct ScoreResult { double score; std::vector<std::string> reasons; };

inline ScoreResult scoreSsocCandidate(const Job& job, const Node& node) {
  std::string title = safe(job.title, 300);
  std::string categories = collapseWs([&]{ std::string o; for (auto& c : arrOf(job.categories, 12)) { if (!o.empty()) o += ' '; o += c; } return o; }());
  std::string skills = collapseWs([&]{ std::string o; for (auto& s : arrOf(job.skills, 24)) { if (!o.empty()) o += ' '; o += s; } return o; }());
  std::string description = safe(job.description, 1800);
  std::string titleNorm = normaliseForMatch(title);
  const std::string& nodeTitle = node.titleNorm;

  std::string context = title + " " + categories + " " + skills + " " + description;

  double score = 0.0;
  std::vector<std::string> reasons;

  if (!titleNorm.empty() && !nodeTitle.empty() && titleNorm == nodeTitle) {
    score += 200;
    reasons.push_back("exact title");
  } else {
    auto titleTokens = tokenSetOf(title);
    double titleOverlap = tokenOverlapScoreSets(titleTokens, node.titleTokens);
    if (titleOverlap >= 0.99) { score += 96; reasons.push_back("title token match"); }
    else if (titleOverlap >= 0.66) { score += 72; reasons.push_back("strong title overlap"); }
    else if (titleOverlap >= 0.4) { score += 44; reasons.push_back("partial title overlap"); }

    if (!nodeTitle.empty() && titleNorm.find(nodeTitle) != std::string::npos && nodeTitle.size() > 6) {
      score += 50; reasons.push_back("posting contains SSOC title");
    }
    if (!titleNorm.empty() && nodeTitle.find(titleNorm) != std::string::npos && titleNorm.size() > 6) {
      score += 50; reasons.push_back("SSOC title contains posting title");
    }
  }

  double contextOverlap = tokenOverlapScoreSets(tokenSetOf(context), node.contextTokens);
  if (contextOverlap >= 0.5) { score += 48; reasons.push_back("strong responsibility/context match"); }
  else if (contextOverlap >= 0.35) { score += 24; reasons.push_back("responsibility/context match"); }
  else if (contextOverlap >= 0.2) { score += 12; reasons.push_back("light context match"); }

  if (node.kind == "occupation") score += 6;
  if (node.kind == "unit_group") score -= 8;

  if (isNecTitle(node.title)) { score -= 5; reasons.push_back("residual (n.e.c.) tie-break"); }

  return { std::round(score), reasons };
}

inline ClassifyResult classifySsocJob(const Job& job, const Index& idx) {
  ClassifyResult r;
  r.id = safe(job.id, 120);
  std::string sourceTitle = safe(job.title, 300);
  if (sourceTitle.empty()) {
    r.status = "withheld"; r.score = 0; r.confidence = "withheld"; r.reason = "Missing title.";
    return r;
  }
  r.title = sourceTitle;

  struct Ranked { const Node* node; double score; std::vector<std::string> reasons; };
  std::vector<Ranked> ranked;
  ranked.reserve(idx.occupationIdx.size());
  for (size_t oi : idx.occupationIdx) {
    const Node& node = idx.nodes[oi];
    auto s = scoreSsocCandidate(job, node);
    if (s.score > 6 || !s.reasons.empty()) ranked.push_back({ &node, s.score, std::move(s.reasons) });
  }
  std::sort(ranked.begin(), ranked.end(), [](const Ranked& a, const Ranked& b) {
    if (a.score != b.score) return a.score > b.score;
    return a.node->title < b.node->title;
  });
  if (ranked.size() > 5) ranked.resize(5);

  for (auto& c : ranked) {
    Candidate cand;
    cand.score = c.score; cand.confidence = classifyConfidence(c.score);
    cand.node = shortNode(c.node); cand.reasons = c.reasons;
    r.candidates.push_back(std::move(cand));
  }

  double bestScore = ranked.empty() ? 0.0 : ranked.front().score;
  std::string confidence = classifyConfidence(bestScore);

  if (ranked.empty() || confidence == "withheld") {
    r.status = "withheld";
    r.score = bestScore;
    r.confidence = "withheld";
    r.reason = ranked.empty() ? "No SSOC candidate scored." : "Best SSOC score below governance threshold.";
    return r;
  }

  const Node* best = ranked.front().node;
  r.status = "classified";
  r.source = "compiled_ssoc2024";
  r.score = bestScore;
  r.confidence = confidence;
  r.hasNode = true;
  r.node = best;
  r.hierarchy = hierarchyFor(best, idx);
  r.family = r.hierarchy.unit_group.present ? r.hierarchy.unit_group : shortNode(best);
  r.reasons = ranked.front().reasons;
  return r;
}

inline std::vector<ClassifyResult> classifySsocJobs(const std::vector<Job>& jobs, const Index& idx) {
  std::vector<ClassifyResult> out;
  size_t n = std::min<size_t>(jobs.size(), 80);
  out.reserve(n);
  for (size_t i = 0; i < n; ++i) out.push_back(classifySsocJob(jobs[i], idx));
  return out;
}

// ── index loading ────────────────────────────────────────────────────────────
inline void pushNode(Index& idx, const gjson::Value& raw, int level, const std::string& parentCode,
                      std::vector<std::string> path, const std::string& kind,
                      const std::unordered_map<std::string, std::string>& changeByCode) {
  Node n;
  n.code = raw.getStr("code");
  n.level = level;
  n.kind = kind;
  n.title = safe(raw.getStr("title"), 320);
  n.parent_code = parentCode;
  n.path = std::move(path);
  n.definition = safe(raw.getStr("definition"), 6000);
  if (const gjson::Array* a = raw.getArr("tasks")) {
    std::vector<std::string> tmp; for (auto& v : *a) if (v.type == gjson::Type::String) tmp.push_back(v.str);
    n.tasks = arrOf(tmp, 80);
  }
  if (const gjson::Array* a = raw.getArr("examples")) {
    std::vector<std::string> tmp; for (auto& v : *a) if (v.type == gjson::Type::String) tmp.push_back(v.str);
    n.examples = arrOf(tmp, 80);
  }
  if (const gjson::Array* a = raw.getArr("exclusions")) {
    std::vector<std::string> tmp; for (auto& v : *a) if (v.type == gjson::Type::String) tmp.push_back(v.str);
    n.exclusions = arrOf(tmp, 80);
  }
  auto ct = changeByCode.find(n.code);
  n.change_type = (ct != changeByCode.end()) ? ct->second : "";
  n.source_kind = "source";  // X-bridge marking is cosmetic metadata, not read by the scorer

  n.titleNorm = normaliseForMatch(n.title);
  n.titleTokens = tokenSetOf(n.title);
  std::string tasksJoined, examplesJoined;
  for (size_t i = 0; i < n.tasks.size() && i < 12; ++i) { if (i) tasksJoined += ' '; tasksJoined += n.tasks[i]; }
  for (size_t i = 0; i < n.examples.size() && i < 12; ++i) { if (i) examplesJoined += ' '; examplesJoined += n.examples[i]; }
  n.contextTokens = tokenSetOf(n.title + " " + n.definition + " " + tasksJoined + " " + examplesJoined);

  idx.nodes.push_back(std::move(n));
  size_t at = idx.nodes.size() - 1;
  idx.byCode[idx.nodes[at].code] = at;
  if (kind == "occupation") idx.occupationIdx.push_back(at);
}

inline bool loadIndex(Index& idx, const std::string& hierarchyPath, const std::string& changeTypePath) {
  std::ifstream f1(hierarchyPath, std::ios::binary);
  if (!f1) return false;
  std::ostringstream ss1; ss1 << f1.rdbuf();
  gjson::Value hierarchy;
  try { hierarchy = gjson::parse(ss1.str()); } catch (...) { return false; }

  std::unordered_map<std::string, std::string> changeByCode;
  std::ifstream f2(changeTypePath, std::ios::binary);
  if (f2) {
    std::ostringstream ss2; ss2 << f2.rdbuf();
    try {
      gjson::Value change = gjson::parse(ss2.str());
      if (const gjson::Array* changes = change.getArr("changes")) {
        for (const auto& item : *changes) {
          std::string code = item.getStr("code");
          if (!code.empty()) changeByCode[code] = item.getStr("change_type");
        }
      }
    } catch (...) { /* change-type file is optional metadata; proceed without it */ }
  }

  const gjson::Array* majors = hierarchy.getArr("major_groups");
  if (!majors) return false;
  for (const auto& major : *majors) {
    std::string majorCode = major.getStr("code");
    pushNode(idx, major, 1, "", { majorCode }, "major_group", changeByCode);
    const gjson::Array* subs = major.getArr("sub_major_groups");
    if (!subs) continue;
    for (const auto& sub : *subs) {
      std::string subCode = sub.getStr("code");
      pushNode(idx, sub, 2, majorCode, { majorCode, subCode }, "sub_major_group", changeByCode);
      const gjson::Array* minors = sub.getArr("minor_groups");
      if (!minors) continue;
      for (const auto& minor : *minors) {
        std::string minorCode = minor.getStr("code");
        pushNode(idx, minor, 3, subCode, { majorCode, subCode, minorCode }, "minor_group", changeByCode);
        const gjson::Array* units = minor.getArr("unit_groups");
        if (!units) continue;
        for (const auto& unit : *units) {
          std::string unitCode = unit.getStr("code");
          pushNode(idx, unit, 4, minorCode, { majorCode, subCode, minorCode, unitCode }, "unit_group", changeByCode);
          const gjson::Array* occs = unit.getArr("occupations");
          if (!occs) continue;
          for (const auto& occ : *occs) {
            std::string occCode = occ.getStr("code");
            pushNode(idx, occ, 5, unitCode, { majorCode, subCode, minorCode, unitCode, occCode }, "occupation", changeByCode);
          }
        }
      }
    }
  }
  idx.loaded = true;
  return true;
}

}  // namespace ssoc
