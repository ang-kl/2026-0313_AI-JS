// Minimal, dependency-free JSON reader for the harvest JSONL schema.
// Standard library only (matches the numpy-only ethos of the Python substrate:
// no third-party parser). It is deliberately small - it parses the fixed shapes
// emitted by harvest_esco.py / harvest_mcf.py:
//   { "ssoc":"..", "ssoc_title":"..", "skills":[{"skill":"..","isEssential":true}, ..] }
//   { "uuid":"..", "skills":["name", ..] }
// It is a tolerant recursive-descent parser over one line at a time. Unknown or
// malformed lines are the caller's problem (read_jsonl skips them), mirroring the
// Python `try: json.loads(line) except: pass`.
#pragma once
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <stdexcept>
#include <cstdint>

namespace gjson {

struct Value;
using Array = std::vector<Value>;
using Object = std::map<std::string, Value>;

enum class Type { Null, Bool, Number, String, Array, Object };

struct Value {
  Type type = Type::Null;
  bool b = false;
  double num = 0.0;
  std::string str;
  std::shared_ptr<Array> arr;
  std::shared_ptr<Object> obj;

  bool isObject() const { return type == Type::Object; }
  bool isArray()  const { return type == Type::Array; }

  // Convenience accessors used by the substrate builder. All are null-safe:
  // a missing key or wrong type returns the supplied default, never throws.
  const Value* find(const std::string& key) const {
    if (type != Type::Object || !obj) return nullptr;
    auto it = obj->find(key);
    return it == obj->end() ? nullptr : &it->second;
  }
  std::string getStr(const std::string& key, const std::string& dflt = "") const {
    const Value* v = find(key);
    return (v && v->type == Type::String) ? v->str : dflt;
  }
  bool getBool(const std::string& key, bool dflt = false) const {
    const Value* v = find(key);
    if (!v) return dflt;
    if (v->type == Type::Bool) return v->b;
    if (v->type == Type::Number) return v->num != 0.0;
    return dflt;
  }
  const Array* getArr(const std::string& key) const {
    const Value* v = find(key);
    return (v && v->type == Type::Array && v->arr) ? v->arr.get() : nullptr;
  }
};

class Parser {
 public:
  explicit Parser(const std::string& s) : s_(s), i_(0) {}

  // Parse a single JSON document. Throws std::runtime_error on malformed input.
  Value parse() {
    skipWs();
    Value v = parseValue();
    skipWs();
    return v;
  }

 private:
  const std::string& s_;
  size_t i_;

  [[noreturn]] void fail(const std::string& why) {
    throw std::runtime_error("json parse error at " + std::to_string(i_) + ": " + why);
  }
  char peek() { return i_ < s_.size() ? s_[i_] : '\0'; }
  char get()  { return i_ < s_.size() ? s_[i_++] : '\0'; }
  void skipWs() {
    while (i_ < s_.size()) {
      char c = s_[i_];
      if (c == ' ' || c == '\t' || c == '\n' || c == '\r') i_++;
      else break;
    }
  }

  Value parseValue() {
    skipWs();
    char c = peek();
    switch (c) {
      case '{': return parseObject();
      case '[': return parseArray();
      case '"': { Value v; v.type = Type::String; v.str = parseString(); return v; }
      case 't': case 'f': return parseBool();
      case 'n': return parseNull();
      default:
        if (c == '-' || (c >= '0' && c <= '9')) return parseNumber();
        fail(std::string("unexpected char '") + c + "'");
    }
  }

  Value parseObject() {
    Value v; v.type = Type::Object; v.obj = std::make_shared<Object>();
    get(); // '{'
    skipWs();
    if (peek() == '}') { get(); return v; }
    while (true) {
      skipWs();
      if (peek() != '"') fail("expected string key");
      std::string key = parseString();
      skipWs();
      if (get() != ':') fail("expected ':'");
      Value val = parseValue();
      (*v.obj)[key] = std::move(val);
      skipWs();
      char c = get();
      if (c == ',') continue;
      if (c == '}') break;
      fail("expected ',' or '}'");
    }
    return v;
  }

  Value parseArray() {
    Value v; v.type = Type::Array; v.arr = std::make_shared<Array>();
    get(); // '['
    skipWs();
    if (peek() == ']') { get(); return v; }
    while (true) {
      Value val = parseValue();
      v.arr->push_back(std::move(val));
      skipWs();
      char c = get();
      if (c == ',') continue;
      if (c == ']') break;
      fail("expected ',' or ']'");
    }
    return v;
  }

  // Reads a JSON string (assumes current char is the opening quote). Handles the
  // standard escapes plus \uXXXX (encoded to UTF-8). Surrogate pairs are handled.
  std::string parseString() {
    if (get() != '"') fail("expected '\"'");
    std::string out;
    while (true) {
      char c = get();
      if (c == '\0') fail("unterminated string");
      if (c == '"') break;
      if (c == '\\') {
        char e = get();
        switch (e) {
          case '"':  out += '"'; break;
          case '\\': out += '\\'; break;
          case '/':  out += '/'; break;
          case 'b':  out += '\b'; break;
          case 'f':  out += '\f'; break;
          case 'n':  out += '\n'; break;
          case 'r':  out += '\r'; break;
          case 't':  out += '\t'; break;
          case 'u': {
            unsigned cp = parseHex4();
            if (cp >= 0xD800 && cp <= 0xDBFF) {  // high surrogate
              if (get() == '\\' && get() == 'u') {
                unsigned lo = parseHex4();
                cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
              }
            }
            encodeUtf8(cp, out);
            break;
          }
          default: fail("bad escape");
        }
      } else {
        out += c;
      }
    }
    return out;
  }

  unsigned parseHex4() {
    unsigned v = 0;
    for (int k = 0; k < 4; k++) {
      char c = get();
      v <<= 4;
      if (c >= '0' && c <= '9') v |= (c - '0');
      else if (c >= 'a' && c <= 'f') v |= (c - 'a' + 10);
      else if (c >= 'A' && c <= 'F') v |= (c - 'A' + 10);
      else fail("bad \\u hex");
    }
    return v;
  }

  static void encodeUtf8(unsigned cp, std::string& out) {
    if (cp <= 0x7F) out += (char)cp;
    else if (cp <= 0x7FF) {
      out += (char)(0xC0 | (cp >> 6));
      out += (char)(0x80 | (cp & 0x3F));
    } else if (cp <= 0xFFFF) {
      out += (char)(0xE0 | (cp >> 12));
      out += (char)(0x80 | ((cp >> 6) & 0x3F));
      out += (char)(0x80 | (cp & 0x3F));
    } else {
      out += (char)(0xF0 | (cp >> 18));
      out += (char)(0x80 | ((cp >> 12) & 0x3F));
      out += (char)(0x80 | ((cp >> 6) & 0x3F));
      out += (char)(0x80 | (cp & 0x3F));
    }
  }

  Value parseNumber() {
    size_t start = i_;
    if (peek() == '-') get();
    while (true) {
      char c = peek();
      if ((c >= '0' && c <= '9') || c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-') get();
      else break;
    }
    Value v; v.type = Type::Number;
    v.num = std::stod(s_.substr(start, i_ - start));
    return v;
  }

  Value parseBool() {
    Value v; v.type = Type::Bool;
    if (s_.compare(i_, 4, "true") == 0) { i_ += 4; v.b = true; }
    else if (s_.compare(i_, 5, "false") == 0) { i_ += 5; v.b = false; }
    else fail("bad literal");
    return v;
  }

  Value parseNull() {
    if (s_.compare(i_, 4, "null") == 0) { i_ += 4; Value v; v.type = Type::Null; return v; }
    fail("bad literal");
  }
};

// Parse one JSON document from a string; throws on malformed input.
inline Value parse(const std::string& s) { return Parser(s).parse(); }

}  // namespace gjson
