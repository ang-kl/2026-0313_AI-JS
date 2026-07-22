// Railway service: a minimal HTTP wrapper around the C++ substrate so the Vercel app can
// call it at Step 2 -> Step 3 for deterministic, source-tagged adjacent-skill suggestions.
//
// No third-party HTTP library - POSIX sockets + std::thread only (Linux; that is what the
// Railway container runs). It is a small, single-purpose service, not a general framework.
//
// Endpoints:
//   GET  /health           -> {"status":"ok","dataset":..,"synthetic":..,"skills":N,"occupations":N}
//   GET  /                 -> same as /health plus usage
//   POST /suggest          -> body {"skills":["python","sql",...],"top":10}
//                             -> {"suggestions":[{"skill","score","esco","mcf","sources":[..]}],
//                                 "matched":[..],"unmatched":[..],"synthetic":bool}
#include "suggest.hpp"
#include "similar.hpp"
#include "resolve.hpp"
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
    << ",\"occupations\":" << G.occ_labels.size() << "}";
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

  auto roles = similar::similarRoles(G, OCC, known, topN);

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
  o << "],\"synthetic\":" << (SYNTHETIC ? "true" : "false") << "}";
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
  writeResponse(fd, 404, "Not Found", "{\"error\":\"not found\"}");
  close(fd);
}

int main(int argc, char** argv) {
  std::string binPath = "substrate.bin";
  for (int i = 1; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--bin" && i + 1 < argc) binPath = argv[++i];
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
