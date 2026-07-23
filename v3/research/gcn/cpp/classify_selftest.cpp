// Parity harness for classify.hpp against v3/api/ssic.js's classifyText(). Run
// with --index <path/to/ssic2020-index.json> and a set of fixed test queries;
// prints one JSON line per query. Compared against scripts/ssic-parity-node.mjs
// running the real ssic.js functions on the same queries - see cpp/README.md.
#include "classify.hpp"
#include <cstdio>
#include <iostream>

static void printResult(const std::string& text, const classify::Result& r) {
  std::printf("{\"query\":\"%s\",\"matched\":\"%s\"", text.c_str(), r.matched.c_str());
  if (r.matched == "none" && !r.reason.empty()) std::printf(",\"reason\":\"%s\"", r.reason.c_str());
  if (r.matched == "ranked") {
    std::printf(",\"code\":\"%s\",\"confidence\":\"%s\",\"matchedTerm\":\"%s\"",
                r.code.c_str(), r.confidence.c_str(), r.matchedTerm.c_str());
  }
  std::printf(",\"candidates\":[");
  for (size_t i = 0; i < r.candidates.size(); ++i) {
    const auto& c = r.candidates[i];
    if (i) std::printf(",");
    std::printf("{\"code\":\"%s\",\"score\":%.4f,\"confidence\":\"%s\"}",
                c.code.c_str(), c.score, c.confidence.c_str());
  }
  std::printf("]}\n");
}

int main(int argc, char** argv) {
  std::string indexPath = "../../engine-data/ssic2020-index.json";
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--index" && i + 1 < argc) indexPath = argv[++i];
  }

  classify::Index idx;
  if (!classify::loadIndex(idx, indexPath)) {
    std::cerr << "failed to load " << indexPath << "\n";
    return 1;
  }
  std::cerr << "[classify_selftest] loaded " << idx.terms.size() << " terms, "
            << idx.codeCount << " codes (declared), version=" << idx.version << "\n";

  // Fixed query set: plain activity text, HTML fragment, parens, ampersand,
  // hyphen/slash punctuation, empty string, gibberish (below floor), and a
  // couple of realistic job-ad snippets.
  std::vector<std::string> queries = {
    "software development and computer programming",
    "restaurant and food & beverage catering services",
    "<p>Retail sale of clothing (non-specialized stores)</p>",
    "import-export / trading of electronic components",
    "",
    "zzz qqq xxx nonsense",
    "nursing and healthcare management in a hospital",
    "construction of residential buildings",
    "management consultancy services for businesses",
    "hairdressing and other beauty treatment",
  };

  for (const auto& q : queries) {
    auto r = classify::classifyText(idx, q, 5);
    printResult(q, r);
  }
  return 0;
}
