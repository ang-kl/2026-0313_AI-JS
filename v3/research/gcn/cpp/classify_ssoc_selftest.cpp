// Parity harness for classify_ssoc.hpp against v3/api/ssoc.js's classifySsocJobs().
// Run with --hierarchy <path> --changes <path> and a fixed job set; prints one JSON
// line per job. Compared against a Node harness running the real ssoc.js handler on
// the same jobs - see cpp/README.md.
#include "classify_ssoc.hpp"
#include <cstdio>
#include <iostream>

static void printStr(const std::string& s) {
  std::printf("\"");
  for (unsigned char c : s) {
    if (c == '"' || c == '\\') std::printf("\\%c", c);
    else if (c == '\n') std::printf("\\n");
    else std::printf("%c", c);
  }
  std::printf("\"");
}

static void printResult(const ssoc::ClassifyResult& r) {
  std::printf("{\"id\":"); printStr(r.id);
  std::printf(",\"title\":"); printStr(r.title);
  std::printf(",\"status\":"); printStr(r.status);
  std::printf(",\"score\":%.0f,\"confidence\":", r.score); printStr(r.confidence);
  if (!r.reason.empty()) { std::printf(",\"reason\":"); printStr(r.reason); }
  if (r.hasNode && r.node) {
    std::printf(",\"code\":"); printStr(r.node->code);
    std::printf(",\"nodeTitle\":"); printStr(r.node->title);
    std::printf(",\"family\":"); printStr(r.family.code);
    std::printf(",\"unit_group\":"); printStr(r.hierarchy.unit_group.present ? r.hierarchy.unit_group.code : "");
    std::printf(",\"major_group\":"); printStr(r.hierarchy.major_group.present ? r.hierarchy.major_group.code : "");
    std::printf(",\"reasons\":[");
    for (size_t i = 0; i < r.reasons.size(); ++i) { if (i) std::printf(","); printStr(r.reasons[i]); }
    std::printf("]");
  }
  std::printf(",\"candidates\":[");
  for (size_t i = 0; i < r.candidates.size(); ++i) {
    const auto& c = r.candidates[i];
    if (i) std::printf(",");
    std::printf("{\"code\":"); printStr(c.node.code);
    std::printf(",\"score\":%.0f,\"confidence\":", c.score); printStr(c.confidence);
    std::printf("}");
  }
  std::printf("]}\n");
}

int main(int argc, char** argv) {
  std::string hierarchyPath = "../../engine-data/ssoc2024-hierarchy.json";
  std::string changesPath = "../../engine-data/ssoc2024-type-of-change.json";
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--hierarchy" && i + 1 < argc) hierarchyPath = argv[++i];
    else if (a == "--changes" && i + 1 < argc) changesPath = argv[++i];
  }

  ssoc::Index idx;
  if (!ssoc::loadIndex(idx, hierarchyPath, changesPath)) {
    std::cerr << "failed to load " << hierarchyPath << "\n";
    return 1;
  }
  std::cerr << "[classify_ssoc_selftest] loaded " << idx.nodes.size() << " nodes, "
            << idx.occupationIdx.size() << " occupations, version=" << idx.version << "\n";

  std::vector<ssoc::Job> jobs = {
    { "1", "Software Engineer", "", {"Engineering"}, {"Java", "Python", "System Design"} },
    { "2", "Auxiliary Police Officer", "", {}, {} },
    { "3", "Registered Nurse (ICU)", "Provide critical care nursing to patients in the intensive care unit, monitor vital signs, administer medications.", {"Healthcare"}, {"Patient Care", "Clinical Nursing"} },
    { "4", "zzz qqq xxx nonsense role", "", {}, {} },
    { "5", "", "", {}, {} },
    { "6", "Senior Software Engineer (WD-12345)", "", {}, {} },
    { "7", "Accountant & Bookkeeper (Job123)", "", {}, {} },
    { "8", "Legislator", "Determines, formulates and directs government policies.", {}, {} },
    { "9", "Bus Captain", "Drives public buses on scheduled routes, ensures passenger safety.", {"Transport"}, {} },
    { "10", "Data Scientist", "Build machine learning models and analyze large datasets to support business decisions.", {"Technology", "Analytics"}, {"Machine Learning", "Python", "Statistics"} },
  };

  auto results = ssoc::classifySsocJobs(jobs, idx);
  for (auto& r : results) printResult(r);
  return 0;
}
