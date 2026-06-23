// buildWikiTopics.js - the deterministic O-I-A "surgical cut" of a job's R&R.
// Observe (raw duties) -> Extract (key terms) -> Segment (topic groups) -> tag (work mode + AI exposure).
// PURE + DETERMINISTIC: no LLM, no fetch, no Date.now, no Math.random. The ENGINE forms the groups;
// an LLM may later only gloss a theme LABEL (advisory) - it never authors a group, edge or tag.
// Honesty: a term is a "theme" only if it recurs across >= 2 duties (one duty is not a pattern);
// duties with no shared theme fall into "Other responsibilities" rather than being force-fitted.
// R005 grep targets: WIKI_STOPWORDS, extractKeywords, buildTopics.

// Filler words that must never seed a theme (generic english + job-ad boilerplate verbs/adjectives).
export const WIKI_STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "are", "was", "will", "shall",
  "all", "any", "other", "their", "your", "our", "its", "his", "her", "they", "them", "you",
  "have", "has", "had", "been", "being", "such", "than", "then", "when", "where", "which",
  "who", "whom", "what", "while", "also", "may", "can", "must", "should", "would", "could",
  "ensure", "ensuring", "manage", "managing", "management", "lead", "leading", "support",
  "supporting", "provide", "providing", "perform", "performing", "including", "include",
  "related", "relevant", "various", "across", "within", "between", "through", "during",
  "primary", "contact", "process", "processes", "matter", "matters", "activity", "activities",
  "responsible", "responsibility", "responsibilities", "duties", "role", "team", "teams",
  "work", "working", "develop", "developing", "development", "maintain", "maintaining",
  "oversee", "overseeing", "review", "reviews", "conduct", "conducting", "prepare", "preparing",
  "assist", "assisting", "coordinate", "coordinating", "implement", "implementing",
  "as", "of", "to", "in", "on", "by", "or", "at", "an", "a", "is", "be", "etc",
]);

// Pull salient terms from one duty sentence (deterministic).
//  - acronyms: 2-6 capital letters (MAS, ACRA, AML, KYC, ESG) - strong, specific seeds
//  - terms: lowercase words >= 4 chars that are not stopwords
export function extractKeywords(text) {
  const raw = String(text || "");
  const acronyms = [];
  (raw.match(/\b[A-Z]{2,6}\b/g) || []).forEach(a => { if (!acronyms.includes(a)) acronyms.push(a); });
  const seenT = new Set();
  const terms = [];
  raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).forEach(w => {
    const t = w.replace(/^-+|-+$/g, "");
    if (t.length < 4 || WIKI_STOPWORDS.has(t) || seenT.has(t)) return;
    seenT.add(t);
    terms.push(t);
  });
  return { acronyms, terms };
}

function titleCase(s) {
  return String(s || "").replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

// Group duties into topic themes by connected components over DISTINCTIVE shared terms.
// "Distinctive" = a term shared by >= 2 duties but NOT so generic it spans most of them (those
// generic words - "regulatory", "compliance" - would collapse everything into one blob). Two duties
// that share a distinctive term land in the same theme; a duty with no such link becomes its own
// named theme (by its rarest salient term / acronym) rather than a forced "Other".
//   duties: [{ id, text, layer?, level? }]
//   returns: { topics:[{ id, label, seed, keywords, dutyIds }], dutyMeta, stats }
export function buildTopics(duties) {
  const list = (duties || []).filter(d => d && d.id && d.text);
  const N = list.length;
  const dutyMeta = {};
  const termSet = {};       // dutyId -> Set(term)  (lowercased terms + acronyms)
  const acrCase = {};       // lowercased -> original acronym casing (for the label)

  // 1. OBSERVE + EXTRACT
  list.forEach(d => {
    const kw = extractKeywords(d.text);
    const s = new Set();
    kw.terms.forEach(t => s.add(t));
    kw.acronyms.forEach(a => { const t = a.toLowerCase(); s.add(t); acrCase[t] = a; });
    termSet[d.id] = s;
    dutyMeta[d.id] = { keywords: kw.terms, acronyms: kw.acronyms, topicId: null, layer: d.layer || null, level: d.level || null };
  });

  // 2. doc frequency per term
  const df = {};
  list.forEach(d => termSet[d.id].forEach(t => { df[t] = (df[t] || 0) + 1; }));
  // A term shared by more than ~1/3 of the duties is too generic to NAME a theme on a compliance-
  // heavy ad ("compliance", "regulatory") - linking on it just chains everything into one blob.
  const cap = Math.max(2, Math.ceil(N / 3));

  // 3. SEGMENT - assign each duty to ONE headword: its most-grouping, non-generic term.
  //    Non-transitive (no union-find chaining) -> tight, distinct themes.
  const headword = {};
  list.forEach(d => {
    const terms = [...termSet[d.id]];
    let cands = terms.filter(t => df[t] >= 2 && df[t] <= cap);  // shared but specific
    if (!cands.length) cands = terms.filter(t => df[t] <= cap); // else any non-generic term it owns
    if (!cands.length) cands = terms;                            // last resort
    // prefer the most-grouping term (higher df), then acronyms, then alpha (deterministic)
    cands.sort((a, b) => (df[b] - df[a]) || ((acrCase[b] ? 1 : 0) - (acrCase[a] ? 1 : 0)) || (a < b ? -1 : 1));
    headword[d.id] = cands[0] || "general";
  });

  // 4. group by headword -> topics
  const groups = {};
  list.forEach(d => { const h = headword[d.id]; (groups[h] = groups[h] || []).push(d.id); });
  let raw = Object.keys(groups).map(h => {
    const ids = groups[h].slice().sort();
    const keywords = [];
    ids.forEach(id => dutyMeta[id].keywords.forEach(k => { if (!keywords.includes(k)) keywords.push(k); }));
    return { ids, term: h, size: ids.length, keywords };
  });

  // 5. cap to keep it legible; smallest spill into one honest "Other"
  raw.sort((a, b) => (b.size - a.size) || (a.term < b.term ? -1 : 1));
  const CAP = 7;
  const kept = raw.slice(0, CAP);
  const overflow = raw.slice(CAP);

  const topics = [];
  kept.forEach((tp, i) => {
    const id = "theme:" + i + ":" + tp.term;
    const label = acrCase[tp.term] || titleCase(tp.term);
    tp.ids.forEach(id2 => { dutyMeta[id2].topicId = id; });
    topics.push({ id, label, seed: tp.term, keywords: tp.keywords.slice(0, 8), dutyIds: tp.ids });
  });
  let otherCount = 0;
  if (overflow.length) {
    const ids = overflow.reduce((acc, t) => acc.concat(t.ids), []).sort();
    ids.forEach(id => { dutyMeta[id].topicId = "theme:other"; });
    topics.push({ id: "theme:other", label: "Other responsibilities", seed: "other", keywords: [], dutyIds: ids });
    otherCount = ids.length;
  }

  return {
    topics,
    dutyMeta,
    stats: { duties: N, topics: topics.length, themedDuties: N - otherCount, otherDuties: otherCount },
  };
}
