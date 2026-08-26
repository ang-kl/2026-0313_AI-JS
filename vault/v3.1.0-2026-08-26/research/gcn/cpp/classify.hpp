// Deterministic SSIC 2020 activity-text classifier - C++ port of v3/api/ssic.js's
// classifyText() (the "classify" action, and the fallback path of "lookup"). ACRA
// entity lookup, Postgres seeding, and the live data.gov.sg path stay in ssic.js -
// those are I/O-bound; this covers only the compute-bound in-memory scoring loop
// (5.4k terms), which ssic.js's own comment already calls out as identical in
// shape to ssoc.js's classify path.
//
// Every normalise()/tokenSet()/overlap()/band() step below mirrors the JS
// original line-for-line - verified byte-for-byte against a Node harness running
// the real ssic.js functions before this was wired into server.cpp (see
// classify_selftest.cpp). If you touch the scoring here, re-run that parity
// check - a silent divergence would misclassify SSIC codes with no error.
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

namespace classify {

struct Term {
  std::string code, section, sectionTitle, term;
  std::unordered_set<std::string> tokens;
};

struct Index {
  std::vector<Term> terms;
  std::string version, source;
  int codeCount = 0, termCount = 0;
  bool loaded = false;
};

struct Candidate {
  std::string code, section, sectionTitle, confidence, matchedTerm;
  double score = 0.0;
};

struct Result {
  std::string matched;   // "ranked" | "none"
  std::string reason;    // "empty_query" | "below_floor" (only set when matched=="none")
  std::string code, section, sectionTitle, confidence, matchedTerm;
  std::vector<Candidate> candidates;
};

// Same 27-word stopword list as ssic.js's STOP set.
inline const std::unordered_set<std::string>& stopwords() {
  static const std::unordered_set<std::string> STOP = {
    "and", "the", "for", "with", "from", "into", "onto", "this", "that", "other",
    "services", "service", "activities", "activity", "general", "related", "except",
    "products", "product", "goods", "nec", "etc", "excluding", "including", "such",
  };
  return STOP;
}

// Mirrors JS normalise(): lowercase -> strip <..> -> strip (..) -> &amp;->and ->
// [/+_-]->space -> [^a-z0-9]+->space -> collapse whitespace -> trim. Applied as
// the same sequential passes as the JS regex chain (not fused) so edge cases
// like unterminated "<" or "&amp;" inside parens resolve identically.
inline std::string normalise(const std::string& raw) {
  std::string s;
  s.reserve(raw.size());
  for (unsigned char c : raw) s += (char)std::tolower(c);

  // strip <[^>]+> (needs >=1 char between the brackets, else no match - JS regex)
  std::string s1;
  s1.reserve(s.size());
  for (size_t i = 0; i < s.size();) {
    if (s[i] == '<') {
      size_t close = s.find('>', i + 1);
      if (close != std::string::npos && close > i + 1) { s1 += ' '; i = close + 1; continue; }
    }
    s1 += s[i]; i++;
  }

  // strip \([^)]*\) (zero or more chars allowed, so "()" also matches)
  std::string s2;
  s2.reserve(s1.size());
  for (size_t i = 0; i < s1.size();) {
    if (s1[i] == '(') {
      size_t close = s1.find(')', i + 1);
      if (close != std::string::npos) { s2 += ' '; i = close + 1; continue; }
    }
    s2 += s1[i]; i++;
  }

  // &amp; -> " and "
  std::string s3;
  s3.reserve(s2.size());
  for (size_t i = 0; i < s2.size();) {
    if (s2.compare(i, 5, "&amp;") == 0) { s3 += " and "; i += 5; continue; }
    s3 += s2[i]; i++;
  }

  // [/+_-] -> space, then [^a-z0-9]+ -> space (fused: both collapse to a single
  // space per JS's two sequential replaces, since space-runs get collapsed next)
  std::string s4;
  s4.reserve(s3.size());
  for (char c : s3) {
    if (c == '/' || c == '+' || c == '_' || c == '-') { s4 += ' '; continue; }
    if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) s4 += c;
    else s4 += ' ';
  }

  // collapse \s+ -> single space, trim
  std::istringstream iss(s4);
  std::string word, out;
  bool first = true;
  while (iss >> word) { if (!first) out += ' '; out += word; first = false; }
  return out;
}

inline std::unordered_set<std::string> tokenSet(const std::string& value) {
  std::unordered_set<std::string> out;
  std::istringstream iss(normalise(value));
  std::string tok;
  const auto& stop = stopwords();
  while (iss >> tok) {
    if (tok.size() > 2 && !stop.count(tok)) out.insert(tok);
  }
  return out;
}

// Jaccard-style overlap, weighted so a full phrase containment scores highest -
// mirrors ssic.js's overlap(): 0.7*coverage + 0.3*precision, rounded to 4dp.
inline double overlap(const std::unordered_set<std::string>& queryTokens,
                       const std::unordered_set<std::string>& termTokens) {
  if (queryTokens.empty() || termTokens.empty()) return 0.0;
  int hit = 0;
  for (const auto& t : termTokens) if (queryTokens.count(t)) hit++;
  if (!hit) return 0.0;
  double coverage = (double)hit / (double)termTokens.size();
  double precision = (double)hit / (double)queryTokens.size();
  double score = 0.7 * coverage + 0.3 * precision;
  return std::round(score * 10000.0) / 10000.0;
}

inline std::string band(double score) {
  if (score >= 0.6) return "high";
  if (score >= 0.35) return "moderate";
  if (score >= 0.18) return "thin";
  return "withheld";
}
constexpr double FLOOR = 0.18;

// Loads and flattens engine-data/ssic2020-index.json (or ssoc-shaped equivalents)
// into one row per (code, term) pair, same shape as ssic.js's loadTerms().
inline bool loadIndex(Index& idx, const std::string& path) {
  std::ifstream f(path, std::ios::binary);
  if (!f) return false;
  std::ostringstream ss; ss << f.rdbuf();
  std::string content = ss.str();
  gjson::Value root;
  try { root = gjson::parse(content); } catch (...) { return false; }

  idx.version = root.getStr("version");
  idx.source = root.getStr("source");
  if (const gjson::Value* cc = root.find("codeCount")) idx.codeCount = (int)cc->num;
  if (const gjson::Value* tc = root.find("termCount")) idx.termCount = (int)tc->num;

  const gjson::Array* entries = root.getArr("entries");
  if (!entries) return false;
  for (const auto& e : *entries) {
    std::string code = e.getStr("code");
    std::string section = e.getStr("section");
    std::string sectionTitle = e.getStr("sectionTitle");
    const gjson::Array* terms = e.getArr("terms");
    if (!terms) continue;
    for (const auto& t : *terms) {
      if (t.type != gjson::Type::String) continue;
      Term row;
      row.code = code; row.section = section; row.sectionTitle = sectionTitle;
      row.term = t.str;
      row.tokens = tokenSet(t.str);
      idx.terms.push_back(std::move(row));
    }
  }
  idx.loaded = true;
  return true;
}

// Classify one activity text -> ranked SSIC codes (best term per code kept).
// Mirrors ssic.js's classifyText() exactly, including the withhold-below-floor
// and empty-query short-circuits.
inline Result classifyText(const Index& idx, const std::string& text, size_t limit) {
  Result r;
  auto q = tokenSet(text);
  if (q.empty()) { r.matched = "none"; r.reason = "empty_query"; return r; }

  std::unordered_map<std::string, Candidate> bestByCode;
  for (const auto& row : idx.terms) {
    double s = overlap(q, row.tokens);
    if (s < FLOOR) continue;
    auto it = bestByCode.find(row.code);
    if (it == bestByCode.end() || s > it->second.score) {
      bestByCode[row.code] = Candidate{row.code, row.section, row.sectionTitle, "", row.term, s};
    }
  }

  std::vector<Candidate> ranked;
  ranked.reserve(bestByCode.size());
  for (auto& kv : bestByCode) ranked.push_back(kv.second);
  std::sort(ranked.begin(), ranked.end(), [](const Candidate& a, const Candidate& b) {
    if (a.score != b.score) return a.score > b.score;
    return a.code < b.code;
  });
  if (ranked.size() > limit) ranked.resize(limit);
  for (auto& c : ranked) c.confidence = band(c.score);

  if (ranked.empty()) { r.matched = "none"; r.reason = "below_floor"; return r; }

  const auto& top = ranked.front();
  r.matched = (top.confidence == "withheld") ? "none" : "ranked";
  r.code = top.code; r.section = top.section; r.sectionTitle = top.sectionTitle;
  r.confidence = top.confidence; r.matchedTerm = top.matchedTerm;
  r.candidates = std::move(ranked);
  return r;
}

}  // namespace classify
