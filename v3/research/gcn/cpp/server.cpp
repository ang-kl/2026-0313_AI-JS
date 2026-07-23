// Railway service: a minimal HTTP wrapper around the C++ substrate so the Vercel app can
// call it at Step 2 -> Step 3 for deterministic, source-tagged adjacent-skill suggestions.
//
// No third-party HTTP library - POSIX sockets + std::thread only (Linux; that is what the
// Railway container runs). It is a small, single-purpose service, not a general framework.
//
// Endpoints:
//   GET  /health           -> {"status":"ok","dataset":..,"synthetic":..,"skills":N,"occupations":N,"ssicTerms":N}
//   GET  /                 -> same as /health plus usage
//   POST /suggest          -> body {"skills":["python","sql",...],"top":10}
//                             -> {"suggestions":[{"skill","score","esco","mcf","sources":[..]}],
//                                 "matched":[..],"unmatched":[..],"synthetic":bool}
//   POST /similar-roles    -> body {"skills":[...],"top":8}
//                             -> {"roles":[{"title","score","shared","sharedSkills":[..]}],
//                                 "matched":[..],"unmatched":[..],"bridged":bool,"synthetic":bool}
//   POST /classify-ssic    -> body {"text":"...","limit":5} or {"texts":["...",...],"limit":5}
//                             -> C++ port of v3/api/ssic.js's classifyText() - deterministic
//                                SSIC 2020 activity-text classification, no LLM. See classify.hpp.
//   POST /classify-ssoc    -> body {"jobs":[{"id","title","categories":[],"skills":[],"description"}]}
//                             -> C++ port of v3/api/ssoc.js's classifySsocJobs() - deterministic
//                                SSOC 2024 job-title classification, no LLM. See classify_ssoc.hpp.
#include "suggest.hpp"
#include "similar.hpp"
#include "resolve.hpp"
#include "classify.hpp"
#include "classify_ssoc.hpp"
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include <thread>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

using substrate::Graph;

// ---- loaded once at startup ----
static Graph G;
static suggest::Affinities AFF;
static similar::OccIndex OCC;
static resolve::Index RIX;
static std::unordered_map<std::string, int64_t> NAME2ID;
static std::string DATASET = "none";
static bool SYNTHETIC = true;
static classify::Index SSIC;
static ssoc::Index SSOC;

static std::string jesc(const std::string& s) {
  std::string o; o.reserve(s.size() + 8);
  for (unsigned char c : s) {
    switch (c) {
      case '"': o += "\\\""; break;
      case '\\': o += "\\\\"; break;
      case '\n': o += "\\n"; break;
      case '\r': o += "\\r"; break;
      case '\t': o += "\\t"; break;
      default:
        if (c < 0x20) { char b[8]; std::snprintf(b, sizeof(b), "\\u%04x", c); o += b; }
        else o += (char)c;
    }
  }
  return o;
}

static std::string healthJson() {
  std::ostringstream o;
  o << "{\"status\":\"ok\",\"dataset\":\"" << jesc(DATASET) << "\",\"synthetic\":"
    << (SYNTHETIC ? "true" : "false")
    << ",\"skills\":" << G.skill_labels.size()
    << ",\"occupations\":" << G.occ_labels.size()
    << ",\"ssicTerms\":" << SSIC.terms.size()
    << ",\"ssocOccupations\":" << SSOC.occupationIdx.size() << "}";
  return o.str();
}

// Build the /suggest response from a parsed request body.
static std::string handleSuggest(const std::string& body) {
  size_t topN = 10;
  std::vector<int64_t> known;
  std::vector<std::string> matched, unmatched;
  try {
    gjson::Value v = gjson::parse(body);
    const gjson::Value* topv = v.find("top");
    if (topv && topv->type == gjson::Type::Number && topv->num > 0) topN = (size_t)topv->num;
    const gjson::Array* skills = v.getArr("skills");
    if (skills) {
      for (const auto& s : *skills) {
        if (s.type != gjson::Type::String) continue;
        std::string norm = substrate::norm(s.str);
        auto it = NAME2ID.find(norm);
        if (it != NAME2ID.end()) { known.push_back(it->second); matched.push_back(s.str); }
        else unmatched.push_back(s.str);
      }
    }
  } catch (...) {
    return "{\"error\":\"invalid JSON body\"}";
  }

  auto sugg = suggest::suggest(G, AFF, known, topN);

  std::ostringstream o;
  o << "{\"suggestions\":[";
  for (size_t i = 0; i < sugg.size(); ++i) {
    const auto& s = sugg[i];
    if (i) o << ",";
    o << "{\"skill\":\"" << jesc(s.skill) << "\",\"score\":" << s.score
      << ",\"esco\":" << s.escoScore << ",\"mcf\":" << s.mcfScore << ",\"sources\":[";
    bool first = true;
    if (s.fromEsco) { o << "\"esco\""; first = false; }
    if (s.fromMcf) { if (!first) o << ","; o << "\"mcf\""; }
    o << "]}";
  }
  o << "],\"matched\":[";
  for (size_t i = 0; i < matched.size(); ++i) { if (i) o << ","; o << "\"" << jesc(matched[i]) << "\""; }
  o << "],\"unmatched\":[";
  for (size_t i = 0; i < unmatched.size(); ++i) { if (i) o << ","; o << "\"" << jesc(unmatched[i]) << "\""; }
  o << "],\"synthetic\":" << (SYNTHETIC ? "true" : "false") << "}";
  return o.str();
}

// Build the /similar-roles response: given the role's skills, rank adjacent occupations.
static std::string handleSimilar(const std::string& body) {
  size_t topN = 8;
  std::vector<int64_t> known;
  std::vector<std::string> matched, unmatched;
  try {
    gjson::Value v = gjson::parse(body);
    const gjson::Value* topv = v.find("top");
    if (topv && topv->type == gjson::Type::Number && topv->num > 0) topN = (size_t)topv->num;
    const gjson::Array* skills = v.getArr("skills");
    if (skills) {
      for (const auto& s : *skills) {
        if (s.type != gjson::Type::String) continue;
        // Fuzzy resolve (exact, else token-subset) so posting/LLM skill names like "python"
        // or "teaching" reach ESCO's formal labels ("python (computer programming)", ...).
        auto ids = resolve::resolveSkill(s.str, NAME2ID, RIX);
        if (!ids.empty()) { for (int64_t id : ids) known.push_back(id); matched.push_back(s.str); }
        else unmatched.push_back(s.str);
      }
    }
  } catch (...) {
    return "{\"error\":\"invalid JSON body\"}";
  }

  // Primary: rank by direct ESCO occupation->skill overlap (precise for well-covered roles).
  auto roles = similar::similarRoles(G, OCC, known, topN);
  bool bridged = false;
  // Fallback for thin cases (notably tech, which ESCO barely maps to occupations): expand the
  // query through MCF posting co-occurrence - each skill's top real-posting neighbours - so the
  // role can be matched via posting-adjacent skills ESCO *does* map. Only used when the direct
  // overlap found little, so precise domains keep their exact result.
  if (roles.size() < 3) {
    std::set<int64_t> expanded(known.begin(), known.end());
    for (int64_t k : known) {
      auto it = AFF.mcf.find(k);
      if (it == AFF.mcf.end()) continue;
      std::vector<std::pair<double, int64_t>> nb;
      for (const auto& kv : it->second) nb.push_back({kv.second, kv.first});
      size_t take = std::min<size_t>(5, nb.size());
      std::partial_sort(nb.begin(), nb.begin() + take, nb.end(), std::greater<std::pair<double,int64_t>>());
      for (size_t i = 0; i < take; ++i) expanded.insert(nb[i].second);
    }
    std::vector<int64_t> ev(expanded.begin(), expanded.end());
    auto viaMcf = similar::similarRoles(G, OCC, ev, topN);
    if (viaMcf.size() > roles.size()) { roles = std::move(viaMcf); bridged = true; }
  }

  std::ostringstream o;
  o << "{\"roles\":[";
  for (size_t i = 0; i < roles.size(); ++i) {
    const auto& r = roles[i];
    if (i) o << ",";
    o << "{\"title\":\"" << jesc(r.title) << "\",\"score\":" << r.score
      << ",\"shared\":" << r.shared << ",\"sharedSkills\":[";
    for (size_t k = 0; k < r.sharedSkills.size(); ++k) { if (k) o << ","; o << "\"" << jesc(r.sharedSkills[k]) << "\""; }
    o << "]}";
  }
  o << "],\"matched\":[";
  for (size_t i = 0; i < matched.size(); ++i) { if (i) o << ","; o << "\"" << jesc(matched[i]) << "\""; }
  o << "],\"unmatched\":[";
  for (size_t i = 0; i < unmatched.size(); ++i) { if (i) o << ","; o << "\"" << jesc(unmatched[i]) << "\""; }
  // `bridged` = these matches came via MCF posting co-occurrence, not direct ESCO overlap;
  // the UI can label them "via related postings" so the weaker basis is disclosed.
  o << "],\"bridged\":" << (bridged ? "true" : "false")
    << ",\"synthetic\":" << (SYNTHETIC ? "true" : "false") << "}";
  return o.str();
}

// Serialize one classify::Result in the same shape as ssic.js's classifyText() return value.
static void writeClassifyResult(std::ostringstream& o, const classify::Result& r) {
  o << "{\"matched\":\"" << jesc(r.matched) << "\"";
  if (r.matched == "none") {
    if (!r.reason.empty()) o << ",\"reason\":\"" << jesc(r.reason) << "\"";
  } else {
    o << ",\"code\":\"" << jesc(r.code) << "\",\"section\":\"" << jesc(r.section)
      << "\",\"sectionTitle\":\"" << jesc(r.sectionTitle) << "\",\"confidence\":\""
      << jesc(r.confidence) << "\",\"matchedTerm\":\"" << jesc(r.matchedTerm) << "\"";
  }
  o << ",\"candidates\":[";
  for (size_t i = 0; i < r.candidates.size(); ++i) {
    const auto& c = r.candidates[i];
    if (i) o << ",";
    o << "{\"code\":\"" << jesc(c.code) << "\",\"section\":\"" << jesc(c.section)
      << "\",\"sectionTitle\":\"" << jesc(c.sectionTitle) << "\",\"score\":" << c.score
      << ",\"matchedTerm\":\"" << jesc(c.matchedTerm) << "\",\"confidence\":\"" << jesc(c.confidence) << "\"}";
  }
  o << "]}";
}

// Build the /classify-ssic response: one text -> one classification, or a batch via
// {"texts":[...]}. Deterministic port of ssic.js's classifyText() - see classify.hpp for the
// parity note. Withholds nothing beyond what the JS original withholds (below-floor matches
// already come back as matched:"none" from classifyText itself).
static std::string handleClassifySsic(const std::string& body) {
  size_t limit = 5;
  gjson::Value v;
  try { v = gjson::parse(body); } catch (...) { return "{\"error\":\"invalid JSON body\"}"; }
  const gjson::Value* limv = v.find("limit");
  if (limv && limv->type == gjson::Type::Number && limv->num > 0) limit = (size_t)limv->num;

  std::ostringstream o;
  const gjson::Array* texts = v.getArr("texts");
  if (texts) {
    o << "{\"version\":\"" << jesc(SSIC.version) << "\",\"results\":[";
    for (size_t i = 0; i < texts->size(); ++i) {
      const auto& t = (*texts)[i];
      std::string text = (t.type == gjson::Type::String) ? t.str : "";
      auto r = classify::classifyText(SSIC, text, limit);
      if (i) o << ",";
      writeClassifyResult(o, r);
    }
    o << "]}";
    return o.str();
  }

  std::string text = v.getStr("text");
  if (text.empty()) return "{\"error\":\"Required: text=string (or texts=array)\"}";
  auto r = classify::classifyText(SSIC, text, limit);
  o << "{\"version\":\"" << jesc(SSIC.version) << "\",";
  // Flatten the result's top-level fields alongside version, matching ssic.js's
  // `{ version, ...classifyText(...) }` spread shape (not nested under "result").
  std::ostringstream inner; writeClassifyResult(inner, r);
  std::string innerStr = inner.str();
  o << innerStr.substr(1);  // drop inner's leading '{' so fields join the outer object
  return o.str();
}

static void writeShortNode(std::ostringstream& o, const ssoc::ShortNode& n) {
  if (!n.present) { o << "null"; return; }
  o << "{\"code\":\"" << jesc(n.code) << "\",\"title\":\"" << jesc(n.title)
    << "\",\"level\":" << n.level << ",\"kind\":\"" << jesc(n.kind)
    << "\",\"parent_code\":\"" << jesc(n.parent_code) << "\"}";
}

static void writeStrArray(std::ostringstream& o, const std::vector<std::string>& v) {
  o << "[";
  for (size_t i = 0; i < v.size(); ++i) { if (i) o << ","; o << "\"" << jesc(v[i]) << "\""; }
  o << "]";
}

// Serialize one ssoc::ClassifyResult in the same shape as ssoc.js's classifySsocJob().
static void writeSsocResult(std::ostringstream& o, const ssoc::ClassifyResult& r) {
  o << "{\"id\":\"" << jesc(r.id) << "\",\"title\":\"" << jesc(r.title)
    << "\",\"status\":\"" << jesc(r.status) << "\",\"score\":" << r.score
    << ",\"confidence\":\"" << jesc(r.confidence) << "\"";
  if (!r.reason.empty()) o << ",\"reason\":\"" << jesc(r.reason) << "\"";
  if (r.status == "classified" && r.hasNode && r.node) {
    const auto& n = *r.node;
    o << ",\"source\":\"" << jesc(r.source) << "\",\"node\":{\"version\":\"" << jesc(SSOC.version)
      << "\",\"code\":\"" << jesc(n.code) << "\",\"level\":" << n.level << ",\"kind\":\"" << jesc(n.kind)
      << "\",\"title\":\"" << jesc(n.title) << "\",\"parent_code\":\"" << jesc(n.parent_code)
      << "\",\"path\":"; writeStrArray(o, n.path);
    o << ",\"definition\":\"" << jesc(n.definition) << "\",\"tasks\":"; writeStrArray(o, n.tasks);
    o << ",\"examples\":"; writeStrArray(o, n.examples);
    o << ",\"exclusions\":"; writeStrArray(o, n.exclusions);
    o << ",\"change_type\":\"" << jesc(n.change_type) << "\",\"source_kind\":\"" << jesc(n.source_kind) << "\"}";
    o << ",\"hierarchy\":{\"major_group\":"; writeShortNode(o, r.hierarchy.major_group);
    o << ",\"sub_major_group\":"; writeShortNode(o, r.hierarchy.sub_major_group);
    o << ",\"minor_group\":"; writeShortNode(o, r.hierarchy.minor_group);
    o << ",\"unit_group\":"; writeShortNode(o, r.hierarchy.unit_group);
    o << ",\"occupation\":"; writeShortNode(o, r.hierarchy.occupation);
    o << ",\"path\":[";
    for (size_t i = 0; i < r.hierarchy.path.size(); ++i) { if (i) o << ","; writeShortNode(o, r.hierarchy.path[i]); }
    o << "]}";
    o << ",\"family\":"; writeShortNode(o, r.family);
    o << ",\"reasons\":"; writeStrArray(o, r.reasons);
  }
  o << ",\"candidates\":[";
  for (size_t i = 0; i < r.candidates.size(); ++i) {
    const auto& c = r.candidates[i];
    if (i) o << ",";
    o << "{\"score\":" << c.score << ",\"confidence\":\"" << jesc(c.confidence) << "\",\"node\":";
    writeShortNode(o, c.node);
    o << ",\"reasons\":"; writeStrArray(o, c.reasons);
    o << "}";
  }
  o << "]}";
}

// Build the /classify-ssoc response: body {"jobs":[{"id","title","categories":[],"skills":[],
// "description"}]} -> ssoc.js's classifyTitles envelope. Deterministic port of
// classifySsocJobs() - see classify_ssoc.hpp for the parity note.
static std::string handleClassifySsoc(const std::string& body) {
  std::vector<ssoc::Job> jobs;
  try {
    gjson::Value v = gjson::parse(body);
    const gjson::Array* jarr = v.getArr("jobs");
    if (jarr) {
      for (const auto& jv : *jarr) {
        ssoc::Job job;
        job.id = jv.getStr("id");
        if (job.id.empty()) job.id = jv.getStr("uuid");
        job.title = jv.getStr("title");
        job.description = jv.getStr("description");
        if (job.description.empty()) job.description = jv.getStr("responsibilitiesText");
        if (const gjson::Array* cats = jv.getArr("categories"))
          for (const auto& c : *cats) if (c.type == gjson::Type::String) job.categories.push_back(c.str);
        if (const gjson::Array* sk = jv.getArr("skills"))
          for (const auto& s : *sk) if (s.type == gjson::Type::String) job.skills.push_back(s.str);
        jobs.push_back(std::move(job));
      }
    }
  } catch (...) {
    return "{\"ok\":false,\"error\":\"invalid JSON body\"}";
  }

  if (jobs.empty()) return "{\"ok\":true,\"db\":false,\"classifications\":[]}";

  auto results = ssoc::classifySsocJobs(jobs, SSOC);
  size_t matched = 0;
  for (auto& r : results) if (r.status == "classified") matched++;

  std::ostringstream o;
  o << "{\"ok\":true,\"db\":false,\"source\":\"compiled_ssoc2024\",\"matched\":" << matched
    << ",\"withheld\":" << (results.size() - matched) << ",\"classifications\":[";
  for (size_t i = 0; i < results.size(); ++i) { if (i) o << ","; writeSsocResult(o, results[i]); }
  o << "]}";
  return o.str();
}

static void writeResponse(int fd, int code, const char* status, const std::string& body,
                          const char* ctype = "application/json") {
  std::ostringstream o;
  o << "HTTP/1.1 " << code << " " << status << "\r\n"
    << "Content-Type: " << ctype << "\r\n"
    << "Content-Length: " << body.size() << "\r\n"
    << "Access-Control-Allow-Origin: *\r\n"
    << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
    << "Access-Control-Allow-Headers: Content-Type\r\n"
    << "Connection: close\r\n\r\n"
    << body;
  std::string s = o.str();
  size_t sent = 0;
  while (sent < s.size()) {
    ssize_t n = write(fd, s.data() + sent, s.size() - sent);
    if (n <= 0) break;
    sent += (size_t)n;
  }
}

static void handleConn(int fd) {
  std::string req;
  char buf[4096];
  size_t headerEnd = std::string::npos;
  // Read until end of headers.
  while (headerEnd == std::string::npos) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n <= 0) { close(fd); return; }
    req.append(buf, (size_t)n);
    headerEnd = req.find("\r\n\r\n");
    if (req.size() > 1 << 20) { writeResponse(fd, 413, "Payload Too Large", "{\"error\":\"too large\"}"); close(fd); return; }
  }
  // Parse request line.
  std::string method, path;
  { std::istringstream ls(req.substr(0, req.find("\r\n"))); ls >> method >> path; }
  // Content-Length (case-insensitive scan).
  size_t contentLen = 0;
  {
    std::string lower = req.substr(0, headerEnd);
    for (auto& c : lower) c = (char)tolower((unsigned char)c);
    size_t p = lower.find("content-length:");
    if (p != std::string::npos) contentLen = (size_t)std::strtoul(lower.c_str() + p + 15, nullptr, 10);
  }
  // Read the rest of the body.
  std::string body = req.substr(headerEnd + 4);
  while (body.size() < contentLen) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n <= 0) break;
    body.append(buf, (size_t)n);
  }

  if (method == "OPTIONS") { writeResponse(fd, 204, "No Content", ""); close(fd); return; }
  if (path == "/health") { writeResponse(fd, 200, "OK", healthJson()); close(fd); return; }
  if (path == "/" && method == "GET") {
    writeResponse(fd, 200, "OK",
      "{\"service\":\"gcn-substrate\",\"usage\":\"POST /suggest {\\\"skills\\\":[...],\\\"top\\\":10}\","
      "\"health\":\"GET /health\"," + healthJson().substr(1));
    close(fd); return;
  }
  if (path == "/suggest" && method == "POST") { writeResponse(fd, 200, "OK", handleSuggest(body)); close(fd); return; }
  if (path == "/similar-roles" && method == "POST") { writeResponse(fd, 200, "OK", handleSimilar(body)); close(fd); return; }
  if (path == "/classify-ssic" && method == "POST") { writeResponse(fd, 200, "OK", handleClassifySsic(body)); close(fd); return; }
  if (path == "/classify-ssoc" && method == "POST") { writeResponse(fd, 200, "OK", handleClassifySsoc(body)); close(fd); return; }
  writeResponse(fd, 404, "Not Found", "{\"error\":\"not found\"}");
  close(fd);
}

int main(int argc, char** argv) {
  std::string binPath = "substrate.bin";
  std::string ssicPath = "taxonomy-data/ssic2020-index.json";
  std::string ssocHierarchyPath = "taxonomy-data/ssoc2024-hierarchy.json";
  std::string ssocChangesPath = "taxonomy-data/ssoc2024-type-of-change.json";
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--bin" && i + 1 < argc) binPath = argv[++i];
    else if (a == "--ssic" && i + 1 < argc) ssicPath = argv[++i];
    else if (a == "--ssoc-hierarchy" && i + 1 < argc) ssocHierarchyPath = argv[++i];
    else if (a == "--ssoc-changes" && i + 1 < argc) ssocChangesPath = argv[++i];
  }
  if (const char* d = std::getenv("DATASET_LABEL")) DATASET = d;
  if (const char* s = std::getenv("SYNTHETIC")) SYNTHETIC = !(std::string(s) == "0" || std::string(s) == "false");

  if (substrate::load(G, binPath)) {
    for (size_t i = 0; i < G.skill_labels.size(); ++i) NAME2ID[G.skill_labels[i]] = (int64_t)i;
    AFF = suggest::buildAffinities(G);
    OCC = similar::buildOccIndex(G);
    RIX = resolve::buildIndex(G);
    std::cerr << "[server] loaded " << binPath << ": " << G.occ_labels.size()
              << " occupations, " << G.skill_labels.size() << " skills (dataset=" << DATASET
              << ", synthetic=" << (SYNTHETIC ? "true" : "false") << ")\n";
  } else {
    std::cerr << "[server] WARNING: no " << binPath << " loaded; /suggest will return empty.\n";
  }

  if (classify::loadIndex(SSIC, ssicPath)) {
    std::cerr << "[server] loaded " << ssicPath << ": " << SSIC.terms.size()
              << " terms, " << SSIC.codeCount << " codes (version=" << SSIC.version << ")\n";
  } else {
    std::cerr << "[server] WARNING: no " << ssicPath << " loaded; /classify-ssic will 404-shape empty results.\n";
  }

  if (ssoc::loadIndex(SSOC, ssocHierarchyPath, ssocChangesPath)) {
    std::cerr << "[server] loaded " << ssocHierarchyPath << ": " << SSOC.nodes.size()
              << " nodes, " << SSOC.occupationIdx.size() << " occupations (version=" << SSOC.version << ")\n";
  } else {
    std::cerr << "[server] WARNING: no " << ssocHierarchyPath << " loaded; /classify-ssoc will 404-shape empty results.\n";
  }

  int port = 8080;
  if (const char* p = std::getenv("PORT")) { int v = atoi(p); if (v > 0) port = v; }

  int srv = socket(AF_INET, SOCK_STREAM, 0);
  if (srv < 0) { perror("socket"); return 1; }
  int one = 1; setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one));
  sockaddr_in addr{}; addr.sin_family = AF_INET; addr.sin_addr.s_addr = INADDR_ANY; addr.sin_port = htons((uint16_t)port);
  if (bind(srv, (sockaddr*)&addr, sizeof(addr)) < 0) { perror("bind"); return 1; }
  if (listen(srv, 64) < 0) { perror("listen"); return 1; }
  std::cerr << "[server] listening on 0.0.0.0:" << port << "\n";

  while (true) {
    int fd = accept(srv, nullptr, nullptr);
    if (fd < 0) continue;
    std::thread(handleConn, fd).detach();
  }
  return 0;
}
