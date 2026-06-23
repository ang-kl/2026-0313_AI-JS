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
  const genericMax = Math.max(2, Math.floor(N * 0.6)); // a term in > 60% of duties is too generic to link on

  // 3. SEGMENT - union-find duties that share a distinctive term
  const parent = {};
  list.forEach(d => { parent[d.id] = d.id; });
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  Object.keys(df).filter(t => df[t] >= 2 && df[t] <= genericMax).forEach(t => {
    const members = list.filter(d => termSet[d.id].has(t)).map(d => d.id);
    for (let i = 1; i < members.length; i++) union(members[0], members[i]);
  });

  // 4. components -> topics, each labelled by its strongest distinctive term
  const comps = {};
  list.forEach(d => { const r = find(d.id); (comps[r] = comps[r] || []).push(d.id); });
  let raw = Object.keys(comps).map(r => {
    const ids = comps[r].slice().sort();
    const inCount = {};
    ids.forEach(id => termSet[id].forEach(t => { inCount[t] = (inCount[t] || 0) + 1; }));
    const cand = Object.keys(inCount);
    const shared = cand.filter(t => inCount[t] >= 2 && df[t] <= genericMax);
    let label;
    if (shared.length) {
      shared.sort((a, b) => (inCount[b] - inCount[a]) || (df[a] - df[b]) || ((acrCase[b] ? 1 : 0) - (acrCase[a] ? 1 : 0)) || (a < b ? -1 : 1));
      label = shared[0];
    } else {
      cand.sort((a, b) => (df[a] - df[b]) || ((acrCase[b] ? 1 : 0) - (acrCase[a] ? 1 : 0)) || (a < b ? -1 : 1));
      label = cand[0] || "general";
    }
    const keywords = [];
    ids.forEach(id => dutyMeta[id].keywords.forEach(k => { if (!keywords.includes(k)) keywords.push(k); }));
    return { ids, term: label, size: ids.length, keywords };
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
