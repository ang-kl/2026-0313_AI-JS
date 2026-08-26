// Phase 1 CLI (C++ port of build_substrate_graph.py).
//   build_substrate                 reads ../data/*.jsonl -> substrate.bin + substrate_meta.json
//   build_substrate --self-test     planted MCF-only signal; asserts the assembler preserves it
//   build_substrate --data DIR      override the data directory
#include "substrate.hpp"
#include <iostream>
#include <string>
#include <vector>
#include <map>

using namespace substrate;

static int self_test() {
  // Plant a signal only MCF sees: skillA & skillB always co-occur in MCF postings but
  // ESCO never links them (mirrors build_substrate_graph.py::self_test).
  std::vector<gjson::Value> esco, mcf;
  for (int o = 0; o < 20; ++o) {
    std::string line = "{\"ssoc_title\":\"occ" + std::to_string(o) + "\",\"skills\":["
      "{\"skill\":\"skill" + std::to_string(o % 5) + "\",\"isEssential\":true},"
      "{\"skill\":\"skill" + std::to_string((o % 5) + 5) + "\",\"isEssential\":false}]}";
    esco.push_back(gjson::parse(line));
  }
  for (int i = 0; i < 40; ++i) {
    std::string line = "{\"skills\":[\"skillA\",\"skillB\",\"skill" + std::to_string(i % 5) + "\"]}";
    mcf.push_back(gjson::parse(line));
  }

  Graph g = build(esco, mcf);
  Summary s = summarize(g);

  if (s.occupations != 20) { std::cerr << "FAIL occupations=" << s.occupations << "\n"; return 1; }
  if (s.occupation_skill_edges != 40) { std::cerr << "FAIL os_edges=" << s.occupation_skill_edges << "\n"; return 1; }

  std::map<std::string, int64_t> idx;
  for (size_t i = 0; i < g.skill_labels.size(); ++i) idx[g.skill_labels[i]] = (int64_t)i;
  if (!idx.count("skilla") || !idx.count("skillb")) { std::cerr << "FAIL: MCF-only skills must become nodes\n"; return 1; }

  int64_t a = idx["skilla"], b = idx["skillb"];
  int64_t lo = std::min(a, b), hi = std::max(a, b);
  int64_t got = 0;
  for (const auto& e : g.cooc_edges) if (e[0] == lo && e[1] == hi) { got = e[2]; break; }
  if (got != 40) { std::cerr << "FAIL: MCF co-occurrence signal lost: " << got << "\n"; return 1; }

  std::cout << "self-test OK: " << summaryJson(s) << "\n";
  return 0;
}

int main(int argc, char** argv) {
  std::string dataDir = "../data";
  bool selfTest = false;
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--self-test") selfTest = true;
    else if (a == "--data" && i + 1 < argc) dataDir = argv[++i];
  }
  if (selfTest) return self_test();

  std::string escoIn = dataDir + "/esco_occupation_skills.jsonl";
  std::string mcfIn = dataDir + "/mcf_postings.jsonl";
  auto esco = read_jsonl(escoIn);
  auto mcf = read_jsonl(mcfIn);
  if (esco.empty()) {
    std::cerr << "No ESCO data at " << escoIn << ". Run harvest_esco.py first (see PHASE0-FINDINGS.md).\n";
    return 1;
  }
  Graph g = build(esco, mcf);
  if (!save(g, "substrate.bin")) { std::cerr << "failed to write substrate.bin\n"; return 1; }
  Summary s = summarize(g);
  std::string meta = summaryJson(s);
  std::ofstream mo("substrate_meta.json");
  mo << meta << "\n";
  std::cout << "wrote substrate.bin\n" << meta << "\n";
  return 0;
}
