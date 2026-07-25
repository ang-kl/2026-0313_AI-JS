// v3 Step 3 - Review Studio (v3-ui-blueprint.md S4; v3-blueprint.md S5/S7/S10).
// A reviewable workspace: fixed header + sub-header, ribbon, a docked collapsible
// icon rail/drawer, a manuscript canvas (the job ad as an editorial page) and a right
// Visual Intelligence stack. Only the Job graph ships today - the other four visual
// types named in blueprint S10.3 (AI trace, Workflow, Value stream, Org map) were
// removed rather than left as placeholder tabs; add them back only once each is
// actually wired to real deterministic engine output. Doctrine tokens only;
// "AI-assisted; human decides".
import { useState, useMemo, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { loadState, saveState } from "./persist.js";
// PB1 (v3-preinterview-brief-spec.md): reuse the shipped, module-cached ACRA lookup
// byte-identically - no new fetch path, no frozen-door touch (fetchEmployerRegistration
// itself is not on the frozen list; only /api/ssic's lookup action + api/ssic.js are).
import { fetchEmployerRegistration, fetchEmployerPostings, claudeCall, extractJSON } from "./App.jsx";
// PR 1 (Part B.4, v3-workflow-and-step3-remediation-spec.md): rules constants, shared
// components/tokens, the desk layout engine, and the 14 window bodies now live under
// ./review/ - moved verbatim, zero behaviour change. State and all rs*() logic stay here.
import { RS_RESP_RE, RS_REQ_RE, RS_HEAD_RE, RS_EXP_BAND, RS_STOP, RS_VERB, RS_ROUTE, RS_HALF_LIFE, RS_DOT, RS_SEC_MAP, RS_TIME_LINE, RS_GATES, RS_NOODLES, RS_ASPIRATION, RS_INFLATED, RS_VAGUE_DUTY, RS_COMPLIANCE, RS_BLIND_CHECKS, RS_DOMAINS, RS_EMPTYPE_MAP , RS_LAYERS} from "./review/rs-rules.js";
import { BANDS, PROV, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, Chip, critH3 } from "./review/shared.jsx";
import Desk from "./review/Desk.jsx";
// PR 2 (Part B.3): the declarative window registry is the single source of truth -
// window render functions, labels, tab placement and the connector anchor contract
// all derive from it. The 14 individual window imports live inside the registry now.
import { WINDOWS, TAB_WINDOWS } from "./review/registry.jsx";

// Doctrine exposure bands (fixed order, S1.2) - colour encodes band only.
// Build-status percentages for the strip above the tabs now come from
// blueprint-status.json - a real tracked record (single source of truth), not a
// hand-edited array in this component. Edit the JSON file when a workstream ships.
// Ribbon items are only rendered when their handler actually does something. The
// prior version listed Evidence (observed/interpreted/applied/withheld/provenance)
// plus Output (cover/resume/interview/print) as tappable pills - but their handlers
// all opened the same rail placeholder ("This drawer fills in the next build phase"),
// which is exactly the "tap without working" pattern the trust-loop canon forbids.
// Reintroduce those groups when a real cover-letter / resume / evidence-filter
// renderer exists, not before.
const RIBBON = [
  { group: "Review", key: "markup", items: [["clean", "Read clean"], ["suggestions", "Suggestions"], ["comments", "Comments"], ["dissect", "Dissect"], ["critical", "Critical read"]] },
  { group: "Visuals", key: "visual", items: [["jobgraph", "Job graph"], ["aitrace", "AI trace"]] },
];
const RAIL = [
  { key: "sources", icon: String.fromCharCode(0x25a4), label: "Sources" },
  { key: "trace", icon: String.fromCharCode(0x22d4), label: "Trace" },
  { key: "skilling", icon: String.fromCharCode(0x25c7), label: "Skilling" },
  { key: "advisory", icon: String.fromCharCode(0x2726), label: "Advisory" },
  { key: "cover", icon: String.fromCharCode(0x270e), label: "Cover letter" },
  { key: "boards", icon: String.fromCharCode(0x25a6), label: "Boards" },
  { key: "saved", icon: String.fromCharCode(0x2913), label: "Saved" },
];

function rsStrip(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
function rsFirstSentence(s) {
  const t = String(s || "").trim(); if (!t) return "";
  const m = t.match(/^.{40,220}?[.!?](\s|$)/);
  let out = m ? m[0].trim() : t.slice(0, 200);
  if (out.length < t.length && !/[.!?]$/.test(out)) out = out.replace(/\s+\S*$/, "") + String.fromCharCode(0x2026);
  return out;
}

// Deterministic verbatim extractor. Strips HTML from the posting text, splits by
// blank lines and heading regexes, returns { overview, responsibilities, requirements }
// with the posting's OWN words - no LLM in this path. Trust-loop rule 4: what the panel
// labels "verbatim" must genuinely be verbatim. See v3-persona-output-contract.md and
// v3/api/claude.js SYSTEM_RESP (which authors the corpus synthesis - a different source).
function rsHtmlStrip(s) {
  return String(s || "")
    .replace(/<\s*(br|\/p|\/li|\/div|\/tr|\/h[1-6]|\/section)\s*\/?\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;|&rsquo;/gi, "'").replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function rsIsBullet(l) { return /^([-•*▪◦]|\d+[.)])\s+/.test(l); }
function rsExtractVerbatim(text) {
  const stripped = rsHtmlStrip(text);
  if (!stripped) return { overview: "", responsibilities: [], requirements: [] };
  const lines = stripped.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const sections = { intro: [], responsibilities: [], requirements: [] };
  let cur = "intro";
  for (const raw of lines) {
    const clean = raw.replace(/^([-•*▪◦]|\d+[.)])\s+/, "").trim();
    // Heading: short line, no ending sentence punctuation, matches known JD section words.
    const isHead = raw.length < 70 && !/[.!?]$/.test(raw) && RS_HEAD_RE.test(clean);
    if (isHead) {
      cur = RS_RESP_RE.test(clean) ? "responsibilities" : RS_REQ_RE.test(clean) ? "requirements" : "intro";
      continue;
    }
    if (rsIsBullet(raw)) {
      if (cur === "intro") cur = "responsibilities";
      sections[cur].push(clean);
    } else {
      sections[cur].push(clean);
    }
  }
  const overviewChunks = sections.intro.slice(0, 4);
  return {
    overview: overviewChunks.join(" ").replace(/\s+/g, " ").trim(),
    responsibilities: sections.responsibilities.filter((l) => l.length > 6),
    requirements: sections.requirements.filter((l) => l.length > 6),
  };
}
// Build a regex over the role's own multi-word skill phrases so we can underline them in
// the verbatim ad without rewording - the same "underline key words" the Job Ad Drawer uses.
function rsSkillTermRe(result) {
  const skills = (result && Array.isArray(result.skills)) ? result.skills : [];
  const terms = Array.from(new Set(skills.map((s) => String(s.skill || s || "").trim()).filter((t) => t.split(/\s+/).length >= 2 && t.length >= 6)));
  if (!terms.length) return null;
  terms.sort((a, b) => b.length - a.length);
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return new RegExp("(\\b(?:" + terms.slice(0, 40).map(esc).join("|") + ")\\b)", "gi"); } catch (_) { return null; }
}
// Underline the role's own multi-word skill phrases where they appear verbatim in the
// ad text - a non-arbitrary bridge from posting to analysis (no reword; the text stays
// verbatim, only the emphasis is layered on).
function rsUnderlineSkillTerms(text, re) {
  const s = String(text || "");
  if (!re) return s;
  const parts = s.split(re);
  if (parts.length < 2) return s;
  return parts.map((p, i) => (i % 2 === 1)
    ? <u key={"u" + i} style={{ textDecorationColor: "#1e40af", textUnderlineOffset: 2, fontWeight: 600 }}>{p}</u>
    : p);
}
// Layer 2 (same-term cross-panel highlight): wrap every KNOWN skill/tool term (the same
// engine term index `skillTermRe` used for the overview underline) in an interactive span
// carrying its normalised term. Click one and every occurrence of that term across BOTH
// panels glows - the deterministic "concept lights up everywhere" (Visio) read. No new
// data, no LLM: purely a highlight over terms the engine already recognises. Respects the
// plain-line doctrine - a term is invisible until focused (only cursor + title hint it).
function rsTermSpans(text, re, focusTerm, onTerm) {
  const s = String(text || "");
  if (!re) return s;
  const parts = s.split(re); // odd indices = the captured term (same contract as rsUnderlineSkillTerms)
  if (parts.length < 2) return s;
  return parts.map((p, i) => {
    if (i % 2 === 0) return p;
    const norm = String(p).toLowerCase().trim();
    const on = focusTerm && norm === focusTerm;
    return (
      <span key={"tm" + i} role="button" tabIndex={0} data-term={norm} aria-pressed={!!on}
        onClick={(e) => { e.stopPropagation(); onTerm && onTerm(on ? null : norm); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onTerm && onTerm(on ? null : norm); } }}
        title={on ? "Traced across both panels - click to clear" : "Click to trace “" + p + "” across both panels"}
        style={on ? { cursor: "pointer", background: "#fde68a", boxShadow: "0 0 0 2px #fde68a", borderRadius: 3, fontWeight: 600 } : { cursor: "pointer" }}>{p}</span>
    );
  });
}
function rsDominantBand(duties) {
  const c = {}; (duties || []).forEach((d) => { const b = RS_EXP_BAND[d && d.exposureNow]; if (b) c[b] = (c[b] || 0) + 1; });
  const keys = Object.keys(c); return keys.length ? keys.sort((a, b) => c[b] - c[a])[0] : null;
}
// ── O-I-A dissection (deterministic, non-inventive; S7) ──────────────────────
// Observation = the posting's own duty spans (verbatim). Interpretation = work-mode +
// exposure band (engine, else a leading-verb rule), with confidence. Application = the
// AIOE read + routing. Reviewer personas fire from RULES, each citing a span. No LLM.
function rsLens(text) {
  const t = String(text || "").toLowerCase();
  if (/\b(ai|automat|machine learning|gen ?ai|chatbot|model|algorithm|data analy|analytic|digital transformation)\b/.test(t)) return "AI";
  if (/\b(stakeholder|cross-functional|business unit|department|govern|complian|accountab|relationship|liais|partner)\b/.test(t)) return "ORG";
  return "ROLE";
}
// ── Layer 3 (AI-suggested cross-panel links, advisory only) ──────────────────
// The ONLY inference layer in the connector subsystem. The engine enumerates candidate
// cross-panel pairs that the deterministic layers cannot join (no shared span id); the
// LLM only JUDGES relatedness of a given pair - it never authors an id, quote or number.
// Every returned pair is filtered back against the enumerated set by exact id (mis-point
// guard), gated by an engine-owned rule, and drawn dashed + labelled "AI-suggested". On
// any malformed/empty/unknown output the layer draws NOTHING (withhold over fabricate).
const L3_VERSION = "l3-2"; // cache-version tag (D8); bump on prompt change
const L3_MAX_CANDIDATES = 40; // cap so the prompt stays small; longest-phrase-first
const L3_MODEL = "claude-haiku-4-5-20251001"; // cheapest-model precedent (company-summary posture)
const SYSTEM_L3 = [
  "You judge whether two short work phrases refer to related work. You do not rank, score, or invent.",
  "You are given a JSON array of candidate pairs, each { fromId, fromText, toId, toText }. The ids are opaque tokens.",
  "For each pair, decide if the two phrases describe related work (same task, skill, or responsibility area).",
  "Output ONLY a JSON array: [{ \"fromId\": <echoed>, \"toId\": <echoed>, \"related\": true|false, \"strength\": \"strong\"|\"weak\" }].",
  "Use ONLY the ids given to you, echoed verbatim. Do not add pairs, do not invent ids, do not output prose.",
  "If you are unsure, set related to false. Never guess. Output the JSON array and nothing else.",
  "Example - input [{\"fromId\":\"a\",\"fromText\":\"Prepare monthly budget reports\",\"toId\":\"b\",\"toText\":\"Organise the annual staff retreat\"}] is unrelated, so output [{\"fromId\":\"a\",\"toId\":\"b\",\"related\":false,\"strength\":\"weak\"}].",
].join(" ");
// Deterministic candidate enumeration: every left span (duty/req) against every O-I-A card
// of a DIFFERENT span (a same-id pair is already the grey provenance link). Scoped to
// duty<->oia because both anchors resolve in the DOM (Desk rectOfAnchor) - a skill anchor
// has no on-screen element, so it would never draw. Capped, longest-phrase-first, id-real.
// Only distinct unordered pairs (dedupe A->B / B->A) so the candidate budget isn't wasted.
function buildSuggestCandidates(dissection) {
  const spans = (dissection && Array.isArray(dissection.spans)) ? dissection.spans : [];
  const lefts = spans.slice().sort((a, b) => (b.text || "").length - (a.text || "").length);
  const pairs = [], seen = new Set();
  lefts.forEach((L) => {
    spans.forEach((R) => {
      if (R.id === L.id) return;
      const key = [L.id, R.id].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push({ fromId: L.id, fromText: L.text, toId: R.id, toText: R.text,
        from: { t: "duty", id: L.id, quote: L.text }, to: { t: "oia", id: R.id, quote: R.text } });
    });
  });
  return pairs.slice(0, L3_MAX_CANDIDATES);
}
// Honesty contract (v3-blueprint.md:1042 "never silently convert missing exposure"): when the
// engine does not classify a duty's exposure, the band is WITHHELD (null) - we do not guess one.
function buildDissection(result, posting) {
  const ja = result && result.jobAnatomy, rd = result && result.responsibilitiesData;
  const raw = (ja && Array.isArray(ja.duties) && ja.duties.length ? ja.duties : (rd && Array.isArray(rd.responsibilities) ? rd.responsibilities : []));
  const spans = raw.slice(0, 14).map((d, i) => {
    const text = typeof d === "string" ? d : d.text; if (!text) return null;
    const expo = (d && d.exposureNow) || null;
    return { id: "s" + i, text, band: RS_EXP_BAND[expo] || null, lens: rsLens(text), layer: (d && d.layer) || null, exposure: expo, sec: "duty" };
  }).filter(Boolean);
  // RS-SEC: Requirements/Benefits lines join the analysis as first-class spans. Exposure is
  // WITHHELD (the engine classifies duties only - honesty contract), but the personas,
  // Evidence Auditor weak-phrase check and the O-I-A dissect all read them now.
  // Posting-first (PR #306 trust-loop): when a specific ad was picked in Step 2, ITS text
  // is the subject - the sampled corpus jobs are only a fallback. (The reverse order made
  // the manuscript/FAB show a different employer's ad once the corpus loaded.)
  const jobs = (rd && Array.isArray(rd.jobs)) ? rd.jobs : [];
  const srcJob = jobs.find((j) => j && (j.description || j.responsibilitiesText));
  let adText = (posting && posting.text) ? rsAdText({ description: posting.text }) : "";
  if (!adText || adText.trim().length < 40) adText = rsAdText(srcJob || {});
  let rq = 0;
  rsAdSections(adText).filter((sec) => sec.canon === "Requirements" || sec.canon === "Benefits").forEach((sec) => {
    sec.lines.forEach((ln) => {
      if (rq >= 8 || ln.length < 12) return;
      spans.push({ id: "q" + rq++, text: ln, band: null, lens: rsLens(ln), layer: sec.canon.toLowerCase(), exposure: null, sec: "req" });
    });
  });
  return { spans, comments: rsComments(spans) };
}
// Extract a salient noun-ish term from a duty so a suggested rewrite is genuinely derived from it.
function rsKeyword(text) {
  const words = String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !RS_STOP.has(w) && !RS_VERB.test(w));
  return words[0] || null;
}
function rsComments(spans) {
  const out = [], used = new Set();
  const ai = spans.find((s) => (s.band === "augmented" || s.band === "auto") && s.lens === "AI") || spans.find((s) => s.band === "augmented" || s.band === "auto");
  if (ai) { used.add(ai.id); out.push({ id: "c-ai", persona: "AI Exposure Reviewer", type: "AI exposure", band: ai.band, anchor: ai.id, prov: "AI estimate", conf: "moderate", reason: ai.band === "auto" ? "End-to-end machine work is plausible here, but a human must own the governance handoff. Reads " + BANDS[ai.band].label + "." : "Generative tooling does the heavy lifting; the person frames the problem, curates prompts and validates output. Reads " + BANDS[ai.band].label + ", not full automation." }); }
  const vague = spans.find((s) => !used.has(s.id) && /\b(ad-?hoc|various|support various|other duties|as (assigned|required|needed)|miscellaneous)\b/i.test(s.text));
  if (vague) {
    used.add(vague.id);
    // Derive a salient term from THIS duty so the rewrite is genuinely about it (honest "derived").
    const key = rsKeyword(vague.text);
    const suggested = key ? "own a named " + key + " workstream with measurable cycle-time targets" : "name the specific workflow this owns and set measurable cycle-time targets";
    out.push({ id: "c-proc", persona: "Process Redesign Reviewer", type: "suggested rewrite", band: vague.band, anchor: vague.id, prov: key ? "derived" : "unverified", conf: key ? "moderate" : "thin", reason: "Vague ownership. The phrasing signals an unredesigned process - ask which workflow is actually being fixed before hiring.", original: vague.text, suggested });
  }
  const bundled = spans.find((s) => !used.has(s.id) && / and /i.test(s.text) && s.text.length > 70);
  if (bundled) { used.add(bundled.id); out.push({ id: "c-role", persona: "Role Analyst", type: "merge duties", band: null, anchor: bundled.id, prov: "computed", conf: "high", reason: "Two duty clusters are bundled here - likely a role mash-up that could split across two people. Worth checking which one the hire really owns." }); }
  const human = spans.find((s) => !used.has(s.id) && s.band === "human");
  // The reason line is a rule-authored coaching prompt, not a quote from the posting,
  // so the chip is "computed" (rule output) not "from posting" (verbatim).
  if (human) { used.add(human.id); out.push({ id: "c-cand", persona: "Candidate Advocate", type: "comment", band: "human", anchor: human.id, prov: "computed", conf: "high", reason: "This stays human-led - relationships and accountability. Strongest proof to bring: one example where you personally drove this to an outcome." }); }
  const weak = spans.find((s) => !used.has(s.id) && /\b(familiar|knowledge of|exposure to|awareness of|understanding of)\b/i.test(s.text));
  if (weak) { used.add(weak.id); out.push({ id: "c-aud", persona: "Signal Auditor", type: "withhold claim", band: null, anchor: weak.id, prov: "unverified", conf: "withheld", reason: "No measurable threshold in the posting. Withhold from any readiness score until it is evidenced in interview or a work sample." }); }
  return out.slice(0, 6);
}

// ── AI-1 click-to-analyse (spec No.135): every span/pill resolves to ONE focused O-I-A
// card in the margin. All deterministic - keywords are nucleus tokens + matched skill
// terms; routes map from the engine band; skill "how/kickstart" lines are the existing
// LLM narration and stay chipped "AI estimate". Withhold over guess throughout. ──────────
export function rsTokens(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !RS_STOP.has(w));
}
function rsSpanFocus(sp, skillObjs, skillTermRe, skillNames) {
  const toks = new Set(rsTokens(sp.text));
  const invoked = skillObjs.map((o) => String(o.skill || o)).filter((n) => rsTokens(n).some((t) => toks.has(t))).slice(0, 3);
  const ev = rsEvidencePhrase(sp.text, skillTermRe, skillNames);
  return {
    kind: "span", title: sp.sec === "req" ? "Requirement line" : "Duty span",
    obs: sp.text, obsChip: sp.sec === "req" ? "from posting" : "derived",
    obsChipLabel: sp.sec === "req" ? "from posting" : "derived · AI-extracted",
    interp: [
      sp.layer ? "Layer: " + sp.layer : null,
      sp.band ? "Exposure: " + (BANDS[sp.band] ? BANDS[sp.band].label : sp.band) + " (engine rule)" : "Exposure: withheld - the engine did not classify this line",
      ev ? "Evidence: " + String.fromCharCode(0x201c) + ev.phrase + String.fromCharCode(0x201d) + " (" + ev.why + ")" : null,
      invoked.length ? "Linked skills: " + invoked.join(", ") : null,
    ].filter(Boolean),
    interpChip: sp.band ? "computed" : "unverified",
    appl: sp.sec === "req"
      ? "Gate line - meet it, show the equivalent, or expect an auto-reject before a human reads your CV."
      : (sp.band ? RS_ROUTE[sp.band] : "No route emitted - withheld."),
    applChip: "computed",
  };
}
function rsSkillFocus(o, spans) {
  const name = String(o.skill || o);
  const toks = new Set(rsTokens(name));
  const invokedBy = (spans || []).filter((sp) => sp.sec !== "req" && rsTokens(sp.text).some((t) => toks.has(t))).slice(0, 3).map((sp) => ({ id: sp.id, text: sp.text }));
  const lvl = o.level || null;
  const hasNarration = !!(o.h || o.k);
  return {
    kind: "skill", title: "Skill",
    obs: name, obsChip: o.escoUri ? "computed" : "derived",
    obsChipLabel: o.escoUri ? "ESCO-mapped" : "derived",
    interp: [
      lvl ? "AI-exposure level: " + lvl + " (engine)" : "AI-exposure level: withheld",
      lvl ? "Half-life read: " + (RS_HALF_LIFE[lvl] || "withheld") : null,
      invokedBy.length ? null : "Invoked by: no duty line matches this skill's terms in this ad",
    ].filter(Boolean),
    interpChip: lvl ? "computed" : "unverified",
    appl: hasNarration ? [o.h, o.k].filter(Boolean).join(" · ") : (lvl ? RS_HALF_LIFE[lvl] : "Withheld - no engine signal for this skill."),
    applChip: hasNarration ? "AI estimate" : "computed",
    invokedBy,
  };
}
// ── Critical Read: plain-language / hype audit (deterministic, verbatim-only). §6.3 Forensic
// Reversal + "word noodles". Scans the FULL ad copy - empty phrasing lives in the intro/benefits/
// salary lines, not the duty spans. Every finding is a verbatim substring of the posting; when
// there is no text, we render nothing (withhold over guess). No LLM. ─────────────────────────
function rsAdText(job) {
  let h = String((job && (job.description || job.responsibilitiesText)) || "");
  return h
    .replace(/<\s*(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ");
}
// RS-SEC: deterministic ad sectioniser (design ref: Work Intelligence Studio, 07-07 '26).
// Splits the verbatim ad into its own sections via the same heading heuristic as the Step 2
// modal (short line, few words, no terminal punctuation); canonical labels map common
// phrasings so Requirements/Qualifications/Benefits surface in the manuscript AND the
// analysis. Verbatim text is never rewritten - grouping only.
// Strip emoji/pictographs (Human Lead: no emoji anywhere; ads use them as heading bullets -
// "[clipboard] Key Responsibilities" must parse AND display as plain "Key Responsibilities").
function rsStripEmoji(x) {
  return String(x || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu, "").replace(/\s{2,}/g, " ").trim();
}
// A working-hours / schedule line must never become a section heading (live bug:
// "Friday: 8:30 AM - 5:30 PM" was promoted while the real Requirements heading was missed).
function rsAdSections(adText) {
  const lines = String(adText || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const isHeading = (raw) => {
    const ln = rsStripEmoji(raw); // emoji-prefixed headings must still qualify
    if (!ln || RS_TIME_LINE.test(ln)) return false;
    return ln.length <= 60 && ln.split(/\s+/).length <= 7 && !/[.,;:!?]$/.test(ln) && /^[A-Za-z]/.test(ln) && !/^[-*\u2022]/.test(ln);
  };
  const secs = []; let cur = { title: null, lines: [] };
  lines.forEach((ln) => {
    if (isHeading(ln)) { if (cur.title || cur.lines.length) secs.push(cur); cur = { title: rsStripEmoji(ln), lines: [] }; }
    else cur.lines.push(ln);
  });
  if (cur.title || cur.lines.length) secs.push(cur);
  return secs.map((sec) => {
    const hit = sec.title ? RS_SEC_MAP.find(([rx]) => rx.test(sec.title)) : null;
    return { title: sec.title, lines: sec.lines, canon: hit ? hit[1] : (sec.title ? null : "Role overview") };
  });
}
// RS-EV (Human Lead, 07-07 '26): a phrase earns a highlight ONLY when it is EVIDENCE for
// a conclusion the engine drew - a skill match (why this skill is in the list), or a gate
// (experience / qualification / credential line). Lines with no evidence-linked phrase
// render fully plain - honest, quieter page; decoration is withheld like any other guess.
function rsEvidencePhrase(text, skillTermRe, skillNames) {
  const t = String(text || "");
  for (const g of RS_GATES) {
    const m = t.match(g.rx);
    if (m) { const i = m.index; return { pre: t.slice(0, i).trimEnd(), phrase: m[0].trim(), post: t.slice(i + m[0].length), why: g.why }; }
  }
  if (skillTermRe) {
    skillTermRe.lastIndex = 0;
    const m = skillTermRe.exec(t);
    if (m) {
      const hit = (skillNames || []).find((n) => n.toLowerCase() === m[0].toLowerCase()) || m[0];
      const i = m.index;
      return { pre: t.slice(0, i).trimEnd(), phrase: m[0], post: t.slice(i + m[0].length), why: "matches skill: " + hit };
    }
  }
  return null;
}
// RS-NUC: phrase nucleus - the salient 3-5 word core of a line, so highlights are
// phrase-level (design standard), not a wall of underlined whole lines. Deterministic:
// first content word (>=4 chars, not a stock verb/stop word) starts the window.
function rsNucleus(text) {
  const words = String(text || "").split(/\s+/);
  const start = words.findIndex((w) => { const c = w.toLowerCase().replace(/[^a-z0-9-]/g, ""); return c.length >= 4 && !RS_STOP.has(c) && !RS_VERB.test(c); });
  if (start < 0 || words.length < 3) return null;
  let end = Math.min(words.length, start + 5);
  for (let k = start; k < end; k++) { if (/[.;:]$/.test(words[k])) { end = k + 1; break; } }
  return { pre: words.slice(0, start).join(" "), phrase: words.slice(start, end).join(" "), post: words.slice(end).join(" ") };
}
// Each: a regex that captures the empty phrase + a little trailing context, a category, a plain
// interpretation, and a "question-mark move" counter built from the verbatim phrase.
function rsSignalNoise(adText) {
  const t = String(adText || "");
  if (t.length < 40) return [];
  const out = [], seen = new Set();
  RS_NOODLES.forEach((n, ni) => {
    const rx = new RegExp(n.rx.source, n.rx.flags);
    let m;
    while ((m = rx.exec(t)) !== null && out.length < 8) {
      const phrase = m[0].replace(/\s+/g, " ").trim();
      const key = phrase.toLowerCase().slice(0, 40);
      if (phrase.length < 3 || seen.has(key)) continue;
      seen.add(key);
      out.push({ id: "noodle-" + ni + "-" + out.length, cat: n.cat, phrase, why: n.why, counter: n.counter(phrase) });
    }
  });
  return out.slice(0, 6);
}
// §6.3 Forensic Reversal: separate evidence from aspiration. Flag sentences that describe intent
// ("will help drive", "play a key role", "responsible for") or inflated abstractions with no
// concrete, measurable object.
function rsForensicReversal(adText) {
  const t = String(adText || "");
  if (t.length < 40) return [];
  const sentences = t.split(/(?:[.?!]\s+)|\n+/).map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 30 && s.length <= 220 && /[a-z]/i.test(s));
  const out = [], seen = new Set();
  for (const s of sentences) {
    if (out.length >= 5) break;
    const inf = RS_INFLATED.test(s), asp = RS_ASPIRATION.test(s);
    if (!inf && !asp) continue;
    const key = s.toLowerCase().slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: "forensic-" + out.length, phrase: s,
      why: inf ? "Inflated abstraction with no concrete object - aspiration dressed as a duty."
               : "Describes intent, not a measurable action - the evidence and the aspiration are tangled.",
      counter: "Strip it to the real verb: what specific output, produced how, measured by what?" });
  }
  return out;
}
// §6.8 Falsification (deterministic): before trusting the read, ask if the posting is a
// template, a role mash-up, or compliance-only. Computed from the posting's own duty spans +
// title - counts, not opinions. The "is demand real?" / "is the advice self-serving?" questions
// need judgement and belong to the batched LLM pass (PR3), not here.
function rsClip(s) { const t = String(s || "").trim(); return t.length > 52 ? t.slice(0, 50) + String.fromCharCode(0x2026) : t; }
function rsFalsification(spans, title, adText) {
  const out = [];
  const n = (spans || []).length;
  if (!n) return out;
  const DQ = String.fromCharCode(0x201c), DQE = String.fromCharCode(0x201d);
  const vague = spans.filter((s) => RS_VAGUE_DUTY.test(s.text));
  if (vague.length >= 2 && vague.length / n >= 0.25) {
    out.push({ id: "fal-template", tag: "template?",
      obs: vague.length + " of " + n + " duties are generic filler (e.g. " + DQ + rsClip(vague[0].text) + DQE + ")",
      interp: "A high share of boilerplate duties - the ad reads template-y, not written for one specific role.",
      appl: "Ask: is this an always-open req? Which 3 duties actually define this job?" });
  }
  const bundled = spans.filter((s) => / and /i.test(s.text) && s.text.length > 70);
  const titleMash = /[/&]|\band\b/i.test(String(title || "")) && String(title || "").length > 12;
  if (bundled.length >= 2 || titleMash) {
    out.push({ id: "fal-mashup", tag: "role mash-up?",
      obs: titleMash ? "The title joins distinct functions: " + DQ + String(title) + DQE : bundled.length + " duties bundle two work clusters with " + DQ + " and " + DQE,
      interp: "This ad bundles duties from two distinct work clusters - the posting text itself, not a claim about why.",
      appl: "Ask: which of these is the real priority, and would a larger org split it into two?" });
  }
  const comp = spans.filter((s) => RS_COMPLIANCE.test(s.text));
  if (comp.length >= 2 && comp.length / n >= 0.3) {
    out.push({ id: "fal-compliance", tag: "compliance-only?",
      obs: comp.length + " of " + n + " duties are compliance / governance framed",
      interp: "Heavily compliance-shaped - may be a box-ticking or audit-driven seat rather than a build role.",
      appl: "Ask: is there real scope to change things, or only to keep the process running?" });
  }
  return out;
}
// Hiring Filter Analyst (deterministic, §5.5): the hard gates that auto-reject a candidate
// before a human reads the CV - years of experience, formal qualification, named credential.
// Verbatim from the posting + the job's own minimumYearsExperience field. The other side of
// the table, stated plainly so the reader can self-assess honestly.
function rsHiringFilter(adText, job) {
  const out = [], t = String(adText || "");
  const yrs = (job && Number(job.minimumYearsExperience)) || (() => {
    const m = t.match(/\b(?:minimum(?:\s+of)?\s+)?(\d{1,2})\+?\s*(?:years?|yrs?)\b[^.?!\n]{0,24}\bexperience\b/i);
    return m ? Number(m[1]) : null;
  })();
  // hf-yrs `obs` is rule-authored ("N+ years of experience") - built from the numeric
  // minimumYearsExperience field or a regex-captured digit; the exact phrase is not a
  // verbatim substring of the ad, so the chip is "derived", not "from posting".
  if (yrs && yrs > 0) out.push({ id: "hf-yrs", label: "experience gate", obs: yrs + "+ years of experience", obsChip: "derived",
    why: "Below this, most ATS filters and recruiters screen the CV out before a human reads it." });
  // hf-deg `obs` is a verbatim substring of the ad text - regex captured `deg[0]`, then
  // whitespace-normalised (whitespace normalisation preserves the words themselves).
  const deg = t.match(/\b(?:bachelor'?s?|master'?s?|ph\.?d|doctorate|degree|diploma)\b[^.?!\n]{0,44}/i);
  if (deg && /\b(?:degree|diploma|bachelor|master|ph\.?d|doctorate)\b/i.test(deg[0])) out.push({ id: "hf-deg", label: "qualification gate", obs: deg[0].replace(/\s+/g, " ").trim(), obsChip: "from posting",
    why: "A formal-qualification bar - check whether it says 'or equivalent experience' before ruling yourself out." });
  // hf-cert `obs` is likewise a verbatim substring, whitespace-normalised.
  const cert = t.match(/\b(?:certified|certification|licen[sc]ed|registered|chartered|\bcpa\b|\bcfa\b|\bpmp\b|\bacca\b)\b[^.?!\n]{0,44}/i);
  if (cert) out.push({ id: "hf-cert", label: "credential gate", obs: cert[0].replace(/\s+/g, " ").trim(), obsChip: "from posting",
    why: "A named credential - often non-negotiable for regulated or professional roles." });
  return out;
}
// ── AI-2 (spec No.135): Blind spots + contradictions. Deterministic; absence is the
// finding ("the ad is silent on X"), so each check names what it looked for. Withhold
// when there is no ad text at all - an absence claim needs a text to be absent FROM. ──
function rsBlindSpots(adText, job) {
  const t = String(adText || "");
  if (t.trim().length < 80) return [];
  const out = [];
  RS_BLIND_CHECKS.forEach((c) => {
    if (c.id === "bs-salary" && job && (job.salaryMin || job.salaryMax || (job.salary && job.salary.minimum))) return; // structured salary exists
    if (!c.rx.test(t)) out.push({ id: c.id, label: c.label, ask: c.ask });
  });
  return out;
}
// Domain lexicons for the mash-up/contradiction scan - a duty line whose tokens belong to
// a DIFFERENT domain than the ad's majority is flagged and the foreign domain is NAMED
// (live example: ISO/cGMP facility-QA lines inside a Data Engineer ad).
function rsDomainOf(text) {
  const toks = new Set(rsTokens(text));
  let best = null, bestN = 0;
  for (const [dom, stems] of Object.entries(RS_DOMAINS)) {
    const n = stems.reduce((a, st) => a + (toks.has(st) ? 1 : 0), 0);
    if (n > bestN) { best = dom; bestN = n; }
  }
  return bestN >= 1 ? { dom: best, n: bestN } : null;
}
function rsContradictions(spans, title) {
  const duty = (spans || []).filter((x) => x.sec !== "req");
  if (duty.length < 4) return [];
  const votes = {};
  const perSpan = duty.map((sp) => { const d = rsDomainOf(sp.text); if (d) votes[d.dom] = (votes[d.dom] || 0) + 1; return { sp, d }; });
  const major = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (!major || major[1] < 2) return [];
  const out = [];
  perSpan.forEach(({ sp, d }) => {
    if (out.length >= 3 || !d || d.dom === major[0] || d.n < 2) return;
    out.push({ id: "cx-" + sp.id, obs: sp.text, foreign: d.dom, majority: major[0] });
  });
  // seniority-of-duties vs junior framing
  const senDuty = duty.find((sp) => /\b(approve|approves|own|owns|architect|define standards|sign[- ]off|accountable)\b/i.test(sp.text));
  if (senDuty && /\b(junior|executive|assistant|intern|entry)\b/i.test(String(title || ""))) {
    out.push({ id: "cx-seniority", obs: senDuty.text, foreign: "senior-ownership duty", majority: "a junior-framed title" });
  }
  return out;
}
// ── AI-3 (spec No.135): Structured Analytic Techniques, deterministic slice.
// Quality-of-Information check: every requirement-ish claim graded verifiable /
// vague / unfalsifiable by testable features of the text itself. Indicators &
// signposts: in-result-set signals (repost multiplicity, salary disclosure rate)
// computed from the sampled jobs - no external calls, no LLM. ─────────────────────
function rsQoI(spans) {
  const reqs = (spans || []).filter((x) => x.sec === "req");
  if (!reqs.length) return [];
  return reqs.map((r) => {
    const t = r.text;
    const hasNumber = /\d/.test(t);
    const named = /\b(?:degree|diploma|bachelor|master|ph\.?d|certified|certification|licen[sc]e|python|sql|java|aws|azure|gcp|iso \d+)\b/i.test(t);
    const weak = /\b(?:familiar|exposure to|awareness of|knowledge of|understanding of|good|strong|excellent|proven)\b/i.test(t);
    const grade = (hasNumber || named) && !weak ? "verifiable" : weak && !(hasNumber || named) ? "unfalsifiable" : "vague";
    return { id: "qoi-" + r.id, grade, text: t,
      why: grade === "verifiable" ? "Carries a number or a named, checkable credential - it can be tested in screening." : grade === "vague" ? "Mixes a checkable element with subjective wording - pin the threshold before relying on it." : "No number, no named credential - this cannot be verified or failed, only asserted.",
      move: grade === "verifiable" ? "Meet it or show the named equivalent." : "Ask: what threshold, measured how, by whom?" };
  }).slice(0, 8);
}
// Title normalisation for the dup key: lowercase, strip parenthetical suffixes and
// in-scope seniority prefixes, collapse punctuation/whitespace. Deterministic - no
// fuzzy edit-distance, so it never over-collapses distinct role nouns.
export function rsNormTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(junior|senior|assistant|lead|principal)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// Pure count ratio of shared tokens over the union - same sample gives same ratio.
export function rsJaccard(aTokens, bTokens) {
  const a = new Set(aTokens), b = new Set(bTokens);
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter++; });
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}
// AI-3 (spec No.135), ET1 (v3-employment-type-signal-spec): fixed regex map, ordered so
// "permanent" matches first (guards compound types like "Permanent, Full Time").
export function rsEmpTypeBucket(str) {
  const s = String(str || "");
  if (!s) return null;
  for (let i = 0; i < RS_EMPTYPE_MAP.length; i++) { if (RS_EMPTYPE_MAP[i].re.test(s)) return RS_EMPTYPE_MAP[i].bucket; }
  return null;
}
// OI1.2 (v3-organisation-intelligence-spec.md): when the employer-scoped MCF
// fetch (fetchEmployerPostings) resolves to exactly one, unambiguous match,
// the repost/salary read below re-scopes to that employer's actual live
// posting set (frozen resolveCompany, api/mcf.js) instead of the analysis's
// sampled job list - "across this employer's N live postings" supersedes
// "in the M sampled". Ambiguous employer resolution withholds the swap and
// keeps the sampled variant (never merge across firms).
function rsIndicators(result, firstJob, employerData) {
  const rdd = result && result.responsibilitiesData;
  const sampledJobs = (rdd && Array.isArray(rdd.jobs)) ? rdd.jobs : [];
  const empMatch = (employerData && !employerData.ambiguous && Array.isArray(employerData.matches) && employerData.matches.length === 1) ? employerData.matches[0] : null;
  const useEmp = !!(empMatch && Array.isArray(empMatch.jobs) && empMatch.jobs.length >= 3);
  const jobs = useEmp ? empMatch.jobs : sampledJobs;
  const scopeTotal = useEmp ? (employerData.totalPostings || jobs.length) : jobs.length;
  const scopeSuffix = useEmp ? "across this employer's " + scopeTotal + " live postings" : "in the " + jobs.length + " sampled";
  const out = [];
  if (jobs.length >= 3) {
    const emp = (j) => String(j.hiringCompanyName || j.postedCompanyName || (j.postedCompany && j.postedCompany.name) || j.companyName || "").toLowerCase().trim();
    const key = (j) => (rsNormTitle(j.title) + "|" + emp(j));
    const clusters = {};
    jobs.forEach((j) => { const k = key(j); (clusters[k] = clusters[k] || []).push(j); });
    let maxDupe = 0, maxKey = null;
    Object.keys(clusters).forEach((k) => { if (clusters[k].length > maxDupe) { maxDupe = clusters[k].length; maxKey = k; } });
    if (maxDupe >= 3) {
      const cluster = clusters[maxKey];
      const dutyToks = cluster.map((j) => rsTokens(rsAdText(j)));
      let maxOverlap = 0;
      for (let i = 0; i < dutyToks.length; i++) {
        for (let jx = i + 1; jx < dutyToks.length; jx++) {
          const ov = rsJaccard(dutyToks[i], dutyToks[jx]);
          if (ov > maxOverlap) maxOverlap = ov;
        }
      }
      const dutyMatch = maxOverlap >= 0.6;
      out.push({ id: "ind-repost", label: "repost pattern",
        obs: maxDupe + " near-identical ads (same employer + " + (dutyMatch ? "duty text" : "title") + ") " + scopeSuffix,
        why: "This req is being posted repeatedly. A queue this crowded rewards depth over spread - one strong, evidenced application beats several thin ones.",
        move: "Triage: either commit real effort to this one, or deprioritise it and spend the time on a less-contested req. Ask at screen how long the seat has been open." });
    }
    const withSalary = jobs.filter((j) => j.salaryMin || j.salaryMax || (j.salary && (j.salary.minimum || j.salary.maximum))).length;
    const pct = Math.round((withSalary / jobs.length) * 100);
    if (pct <= 40) out.push({ id: "ind-salary", label: "salary opacity", obs: withSalary + " of " + jobs.length + " ads (" + scopeSuffix + ") state a salary (" + pct + "%)", why: "Low disclosure in this market segment weakens your negotiating baseline.", move: "Anchor on the ads that DO state a band before naming your number." });
  }
  // ET1: verbatim MCF/CSG employmentType, fact-labelled ("from posting"), non-permanent only.
  const empRaw = firstJob && firstJob.employmentType;
  const bucket = rsEmpTypeBucket(empRaw);
  if (bucket && bucket !== "permanent") {
    let obs = "This posting's engagement type is verbatim: " + String(empRaw);
    if (jobs.length >= 4) {
      const sameBucket = jobs.filter((j) => rsEmpTypeBucket(j && j.employmentType) === bucket).length;
      obs += ". " + sameBucket + " of " + jobs.length + " ads " + scopeSuffix + " state " + bucket;
    }
    out.push({ id: "ind-emptype", label: "engagement type", obsChip: "from posting",
      obs,
      why: "A " + bucket + " engagement changes what to weigh: tenure, conversion-to-permanent terms, notice, and how the role's duties map to a fixed horizon.",
      move: "Ask at screen: is there a conversion path, what is the renewal basis, and is the scope realistic for the stated term?" });
  }
  return out;
}
// ── AI-4/5 (spec No.135): second-order + competitive reads, deterministic. ──────────
// Around the corner: the duty-exposure mix -> where this role is headed. Uses ONLY the
// engine's own per-duty bands; withheld when fewer than 4 duties carry a band.
function rsTrajectory(spans) {
  const duty = (spans || []).filter((x) => x.sec !== "req" && x.band);
  if (duty.length < 4) return null;
  const auto = duty.filter((x) => x.band === "auto").length;
  const aug = duty.filter((x) => x.band === "augmented" || x.band === "assisted").length;
  const human = duty.filter((x) => x.band === "human").length;
  const n = duty.length;
  const share = (auto + aug) / n;
  const grade = share >= 0.7 ? "reshaping" : share >= 0.4 ? "splitting" : "durable";
  return {
    id: "traj", grade,
    obs: auto + " of " + n + " classified duties read full-automation, " + aug + " AI-augmented/assisted, " + human + " human-led (engine bands)",
    why: grade === "reshaping" ? "Most of the classified work is automatable or heavily augmentable - the role as advertised is being reshaped around the corner; the human core is thinner than the ad implies." : grade === "splitting" ? "The role splits: a machine-leaning half and a human-led half. Expect the job to be redefined around the human half within a review cycle or two." : "The classified core stays human-led - AI assists but the accountability and judgment stay with the person.",
    move: grade === "reshaping" ? "Ask which duties will still need a person in 2 years - and negotiate for those." : grade === "splitting" ? "Position yourself on the human-led half; automate your own machine-leaning half first." : "Lead with the human-led duties as your durable value.",
  };
}
// Competitive read: this ad's salary vs the sampled market (same result set) - a rank,
// not a benchmark claim. Withheld without the ad's own band or <4 comparable ads.
function rsSalaryPosition(posting, result) {
  const mid = posting && posting.salaryMid;
  if (!mid) return null;
  const jobs = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : [];
  const mids = jobs.map((j) => { const lo = j.salaryMin || (j.salary && j.salary.minimum) || null; const hi = j.salaryMax || (j.salary && j.salary.maximum) || null; return lo && hi ? (lo + hi) / 2 : lo || hi || null; }).filter((x) => x && x > 100);
  if (mids.length < 4) return null;
  const below = mids.filter((x) => x < mid).length;
  const pct = Math.round((below / mids.length) * 100);
  const fmtK = (v) => "S$" + (Math.round(v / 100) / 10) + "k";
  return {
    id: "salpos", pct,
    obs: "This ad's midpoint " + fmtK(mid) + " sits above " + pct + "% of the " + mids.length + " salary-stating ads sampled for this role",
    why: pct >= 70 ? "Pays in the upper band of the sampled market - expect the bar (or the bundle of duties) to be correspondingly higher." : pct >= 35 ? "Mid-market for the sampled set - room to negotiate on evidence." : "Below most of the sampled market - either the scope is lighter than advertised, or the band has headroom.",
    move: "Quote the sampled range in negotiation - it is this search's own evidence, not a generic benchmark.",
  };
}
function buildCriticalRead(result, spans, title, posting, employerData) {
  const firstJob = (() => { const js = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : (Array.isArray(result && result.jobs) ? result.jobs : []); return js.find((j) => j && (j.description || j.responsibilitiesText)) || null; })();
  let adText = rsAdText(firstJob);
  // Fallback to the analysed posting's own verbatim text when the aggregate result.jobs is thin -
  // single-posting analyses often have an empty result.jobs even though the clicked ad has full
  // text, which used to leave Critical Read showing "no posting text". Same posture as the Job
  // Graph posting-text fallback (PR #282).
  if ((!adText || adText.trim().length < 40) && posting && posting.text) adText = rsAdText({ description: posting.text });
  // Falsification needs duty-like spans; when the engine's dissection is thin (0 job-anatomy
  // duties), derive lightweight verbatim spans from the ad copy so the lens still runs.
  let effSpans = spans;
  if ((!effSpans || effSpans.length < 3) && adText) {
    effSpans = adText.split(/(?:[.?!]\s+)|\n+/).map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 25 && s.length <= 200 && /[a-z]/i.test(s))
      .slice(0, 14).map((t, i) => ({ id: "cr" + i, text: t, band: null, lens: rsLens(t) }));
  }
  return { adText, noodles: rsSignalNoise(adText), forensic: rsForensicReversal(adText), falsification: rsFalsification(effSpans, title, adText), hiringFilter: rsHiringFilter(adText, firstJob), blindSpots: rsBlindSpots(adText, firstJob), contradictions: rsContradictions(effSpans, title), qoi: rsQoI(effSpans), indicators: rsIndicators(result, firstJob, employerData), trajectory: rsTrajectory(effSpans), salaryPos: rsSalaryPosition(posting, result) };
}
export default function ReviewStudio({ result, title, employer, source, rolePane, band, onBack, version, posting, onRetryDuties, onOpenOkf, bgRunning, bgStep, bgStatus, bgElapsed, bgError }) {
  // No.137 T1: TABS replace the mode ribbon (Report View anatomy). markup/dutyView become
  // per-tab toolbar state; visual stays for the Market graphs.
  const [tab, setTab] = useState("overview");   // overview | ad | duties | gates | critical | market
  // Modal spec (11-07 '26): the build-progress modal starts open (centred, blocking);
  // "Read the page while it builds" minimises it to the inline strip. The error state
  // is dismissable separately and re-arms if a new error arrives.
  const [bgModalMin, setBgModalMin] = useState(false);
  const [bgErrDismissed, setBgErrDismissed] = useState(false);
  useEffect(() => { setBgErrDismissed(false); }, [bgError]);
  // Goal §5: focus restoration - when the build modal closes (auto-settle, minimise
  // or error dismissal), move focus to the first tab so keyboard users land on a
  // stable, meaningful control instead of nowhere.
  const tabsRef = useRef(null);
  const bgModalOpen = (bgRunning && !bgModalMin) || (!!bgError && !bgErrDismissed);
  const bgModalWasOpen = useRef(false);
  useEffect(() => {
    if (bgModalWasOpen.current && !bgModalOpen && tabsRef.current) {
      const b = tabsRef.current.querySelector("button");
      if (b) b.focus();
    }
    bgModalWasOpen.current = bgModalOpen;
  }, [bgModalOpen]);
  const [markup, setMarkup] = useState("suggestions"); // The Ad toolbar: clean | suggestions | comments
  const [dutyView, setDutyView] = useState("oia");     // Duties toolbar: oia | aitrace
  // Rail starts collapsed on narrow viewports (phones) - open by default on
  // desktop is fine there, but on an iPhone the 150px expanded rail alone eats
  // over a third of the screen before the manuscript/margin panes are even
  // considered. Lazy-init so this reads the real viewport once, not on every render.
  const [railOpen, setRailOpen] = useState(() => (typeof window === "undefined" || window.innerWidth >= 860));
  const [activeSpan, setActiveSpan] = useState(null);
  // Hover-to-trace (goal §9 / design handoff): hovering a comment card PREVIEWS its
  // connector without touching the pinned activeSpan; mouse-leave clears it. Click
  // still pins (activeSpan). The connector reads activeSpan || previewSpan.
  const [previewSpan, setPreviewSpan] = useState(null);
  const [focusSkill, setFocusSkill] = useState(null); // AI-1 click-to-analyse: focused skill-pill index
  // AI-1 fix: a span tap must take the focus card over from an open skill card - the card
  // resolver prefers the skill, so clear it whenever a span becomes active (found live).
  useEffect(() => { if (activeSpan) setFocusSkill(null); }, [activeSpan]);
  const [commentStatus, setCommentStatus] = useState({}); // id -> 'accepted' | 'rejected'
  // KV-1: review decisions persist per posting (cross-device via /api/state, localStorage
  // fallback). Keyed by the posting uuid so two ads never share decisions.
  const postingKey = (posting && posting.uuid) || (posting && posting.text ? "t" + String(posting.text.length) + String(title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40) : null);
  useEffect(() => {
    if (!postingKey) return;
    loadState("review", (all) => { if (all && all[postingKey]) setCommentStatus(all[postingKey]); });
  }, [postingKey]);
  useEffect(() => {
    if (!postingKey || !Object.keys(commentStatus).length) return;
    try {
      const raw = localStorage.getItem("v3.state.review");
      const all = raw ? JSON.parse(raw) : {};
      all[postingKey] = commentStatus;
      const keys = Object.keys(all);
      if (keys.length > 40) delete all[keys[0]]; // cap the ledger; oldest key drops
      saveState("review", all);
    } catch (_) {}
  }, [commentStatus, postingKey]);

  // LOCKED LINKS (P1 + P2): user-authored, persistent N:N links between ANCHORS - a whole
  // duty line, a whole O-I-A card, OR (P2) an arbitrary selected PHRASE in the manuscript /
  // O-I-A text. Word/PPT-style annotations - NOT engine output, so they author no band or
  // verdict and never touch the deterministic contract. Persisted per posting on the
  // review-decisions rail. An anchor is either an ELEMENT { t:'duty'|'oia', id, quote } or
  // a TEXT-QUOTE { t:'phrase', block, quote, pre, suf } (re-resolved to a Range at draw
  // time, so it survives re-render without mutating the manuscript DOM).
  const [links, setLinks] = useState([]); // [{ id, from:<anchor>, to:<anchor>, locked }]
  const [linkMode, setLinkMode] = useState(false);
  const [linkDraft, setLinkDraft] = useState(null); // first-picked anchor, or null
  const [phraseSel, setPhraseSel] = useState(null); // { block, quote, pre, suf, x, y } - floating "link this phrase"
  const linkSeq = useRef(0);
  useEffect(() => {
    setLinks([]); setLinkDraft(null); setPhraseSel(null);
    if (!postingKey) return;
    loadState("links", (all) => { if (all && Array.isArray(all[postingKey])) setLinks(all[postingKey]); });
  }, [postingKey]);
  useEffect(() => {
    if (!postingKey) return;
    try {
      const raw = localStorage.getItem("v3.state.links");
      const all = raw ? JSON.parse(raw) : {};
      if (links.length) all[postingKey] = links; else delete all[postingKey];
      const keys = Object.keys(all);
      if (keys.length > 40) delete all[keys[0]]; // cap the ledger; oldest key drops
      saveState("links", all);
    } catch (_) {}
  }, [links, postingKey]);
  // Anchor identity, for dedupe + self-link guard. Legacy P1 links (stored with no `t`)
  // are read as duty(from)->oia(to) by the resolver and never re-picked, so this only
  // needs to key anchors created here.
  const anchorKey = (a) => (a ? a.t + "|" + (a.id != null ? a.id : ((a.block || "") + "¦" + (a.quote || ""))) : "");
  // Create a locked link between two anchors, deduped and self-link-guarded. Shared by
  // the two-click pick flow (onLinkPick) and the P3 drag-to-connect gesture (onLinkDrop).
  const addLink = (from, to) => {
    if (!from || !to) return;
    const fk = anchorKey(from), tk = anchorKey(to);
    if (fk === tk) return; // no self-link
    setLinks((ls) => (ls.some((l) => { const lf = anchorKey(l.from), lt = anchorKey(l.to); return (lf === fk && lt === tk) || (lf === tk && lt === fk); }) ? ls
      : ls.concat({ id: "lnk-" + (++linkSeq.current), from, to, locked: true })));
  };
  const onLinkPick = (a) => {
    if (!a) return;
    if (!linkDraft || anchorKey(linkDraft) === anchorKey(a)) { setLinkDraft(a); return; } // arm / re-arm
    addLink(linkDraft, a);
    setLinkDraft(null); setPhraseSel(null); // pair locked
  };
  const removeLink = (lid) => setLinks((ls) => ls.filter((l) => l.id !== lid));
  // P3 - drag-to-connect: the Word/PPT gesture. Press a 🔗 handle on a responsibility or
  // an O-I-A card and drag to the other; drop resolves the anchor under the cursor and
  // locks the pair. A tap (no drag past a small threshold) falls back to the two-click
  // pick. State lives here (Option 1); Desk renders the live rubber-band from linkDrag.
  const [linkDrag, setLinkDrag] = useState(null); // { from, sx, sy, x, y, moved } | null
  const dragRef = useRef(null);
  // AUTO-CONNECTIONS (Visio-style, deterministic): the engine already OWNS the map between
  // a responsibility and its O-I-A card - card `s3` IS duty `s3` (same dissection span id),
  // and every margin comment carries its anchor span. So these are provenance FACTS, not
  // inference - safe to auto-draw and they can never mis-point. ON by default (Human Lead,
  // 21-07 '26: "still cannot link the left to the right" - the mapping the engine already
  // knows should be VISIBLE without hunting for a toggle; the earlier opt-in default meant
  // the Duties tab opened with no lines and clicking a duty only fired the ephemeral amber
  // trace, which reads as "nothing is linked"). A faint GREY layer, distinct from the amber
  // hover-trace and the user's blue locks; still toggleable off if it reads as busy.
  const [showAuto, setShowAuto] = useState(true);
  // Layer 2 - the term currently traced across both panels (normalised skill/tool term),
  // or null. Set by clicking any known term in the manuscript or an O-I-A card.
  const [focusTerm, setFocusTerm] = useState(null);
  // Layer 3 - AI-suggested cross-panel links (advisory, opt-in, off by default). The only
  // inference layer: the engine enumerates candidate pairs, the LLM only judges relatedness,
  // and every survivor is drawn DASHED + labelled "AI-suggested", inert until the user
  // Accepts (promotes to a blue locked link) or Dismisses. Never persisted until accepted.
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestState, setSuggestState] = useState({ status: "idle", items: [] }); // status: idle|loading|ready|empty|error
  const suggestSeq = useRef(0);
  const suggestCacheRef = useRef({}); // postingKey -> items, so re-toggling never re-calls the LLM
  const suggestCacheKey = postingKey ? postingKey + "::" + L3_VERSION : ""; // D8: version-tagged cache
  const requestSuggestions = async () => {
    const cached = suggestCacheRef.current[suggestCacheKey];
    if (cached) { setSuggestState({ status: cached.length ? "ready" : "empty", items: cached }); return; }
    const candidates = buildSuggestCandidates(dissection);
    if (!candidates.length) { setSuggestState({ status: "empty", items: [] }); return; }
    const seq = ++suggestSeq.current;
    setSuggestState({ status: "loading", items: [] });
    try {
      const payload = candidates.map((c) => ({ fromId: c.fromId, fromText: String(c.fromText || "").slice(0, 160), toId: c.toId, toText: String(c.toText || "").slice(0, 160) }));
      const reply = await claudeCall("Candidate pairs:\n" + JSON.stringify(payload), 900, 1, SYSTEM_L3, L3_MODEL);
      if (seq !== suggestSeq.current) return; // a newer request superseded this one
      const parsed = extractJSON(reply, L3_VERSION + "-suggest");
      if (!Array.isArray(parsed)) { setSuggestState({ status: "empty", items: [] }); return; }
      const byKey = {}; candidates.forEach((c) => { byKey[c.fromId + "¦" + c.toId] = c; });
      const items = [];
      parsed.forEach((p) => {
        if (!p || p.related !== true || p.strength !== "strong") return; // engine-owned gate; model value never displayed
        const cand = byKey[p.fromId + "¦" + p.toId]; // id-membership filter: unknown ids drop (no mis-point)
        if (!cand) return;
        const id = "sug-" + cand.fromId + "-" + cand.toId;
        if (items.some((it) => it.id === id)) return;
        items.push({ id, from: cand.from, to: cand.to, fromText: cand.fromText, toText: cand.toText });
      });
      suggestCacheRef.current[suggestCacheKey] = items;
      setSuggestState({ status: items.length ? "ready" : "empty", items });
    } catch (_) {
      if (seq === suggestSeq.current) setSuggestState({ status: "error", items: [] }); // withhold: draw nothing
    }
  };
  useEffect(() => {
    if (showSuggest) requestSuggestions();
    else setSuggestState({ status: "idle", items: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuggest, postingKey]);
  const acceptSuggestion = (item) => {
    if (!item) return;
    addLink(item.from, item.to); // promote to a persistent blue locked link (deduped by anchorKey)
    setSuggestState((s) => ({ ...s, items: s.items.filter((it) => it.id !== item.id) }));
    if (suggestCacheRef.current[suggestCacheKey]) suggestCacheRef.current[suggestCacheKey] = suggestCacheRef.current[suggestCacheKey].filter((it) => it.id !== item.id);
  };
  const dismissSuggestion = (id) => {
    setSuggestState((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));
    if (suggestCacheRef.current[suggestCacheKey]) suggestCacheRef.current[suggestCacheKey] = suggestCacheRef.current[suggestCacheKey].filter((it) => it.id !== id);
  };
  const onLinkDragStart = (anchor, e) => {
    if (!anchor || !e) return;
    const r = e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : { left: e.clientX, top: e.clientY, width: 0, height: 0 };
    const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
    dragRef.current = { from: anchor, sx, sy, x0: e.clientX, y0: e.clientY, moved: false };
    setLinkDrag({ from: anchor, sx, sy, x: e.clientX, y: e.clientY, moved: false });
  };
  useEffect(() => {
    if (!linkDrag) return undefined;
    // Resolve the element under the cursor to a link anchor (duty line / O-I-A card).
    // Phrases are not drag targets (they have no persistent handle) - use select+confirm.
    const anchorAtPoint = (x, y) => {
      const el = typeof document !== "undefined" && document.elementFromPoint ? document.elementFromPoint(x, y) : null;
      if (!el || !el.closest) return null;
      const oia = el.closest("[data-oia-anchor]");
      if (oia) return { t: "oia", id: oia.getAttribute("data-oia-anchor"), quote: (oia.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120) };
      const li = el.closest('li[id^="li-"]');
      if (li) return { t: "duty", id: li.id.slice(3), quote: (li.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120) };
      return null;
    };
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return;
      if (!d.moved && (Math.abs(e.clientX - d.x0) > 5 || Math.abs(e.clientY - d.y0) > 5)) d.moved = true;
      const tgt = d.moved ? anchorAtPoint(e.clientX, e.clientY) : null;
      setLinkDrag({ from: d.from, sx: d.sx, sy: d.sy, x: e.clientX, y: e.clientY, moved: d.moved, overKey: tgt ? anchorKey(tgt) : null });
    };
    const onUp = (e) => {
      const d = dragRef.current; dragRef.current = null; setLinkDrag(null);
      if (!d || !d.moved) return; // a tap (no drag) is left to the handle's native onClick = the two-click pick
      const tgt = anchorAtPoint(e.clientX, e.clientY);
      if (tgt) { addLink(d.from, tgt); setLinkDraft(null); setPhraseSel(null); } // drop onto nothing = cancel
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const prevSel = typeof document !== "undefined" ? document.body.style.userSelect : "";
    if (typeof document !== "undefined") document.body.style.userSelect = "none"; // no text-select while dragging
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); if (typeof document !== "undefined") document.body.style.userSelect = prevSel; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkDrag ? "on" : "off"]);
  // P2: while link mode is on, capture a text selection inside a linkable block
  // ([data-anchor-block]) into a floating "link this phrase" affordance. Stores a
  // TextQuote anchor (block + verbatim quote + short prefix/suffix to disambiguate).
  useEffect(() => {
    if (!linkMode) { setPhraseSel(null); return undefined; }
    const onUp = () => {
      const sel = typeof window !== "undefined" ? window.getSelection() : null;
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setPhraseSel(null); return; }
      const quote = sel.toString().replace(/\s+/g, " ").trim();
      if (quote.length < 2 || quote.length > 140) { setPhraseSel(null); return; }
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node && node.nodeType === 3 ? node.parentElement : node;
      const block = el && el.closest ? el.closest("[data-anchor-block]") : null;
      if (!block) { setPhraseSel(null); return; }
      const blockId = block.getAttribute("data-anchor-block");
      const text = (block.textContent || "").replace(/\s+/g, " ");
      const i = text.indexOf(quote);
      const pre = i > 0 ? text.slice(Math.max(0, i - 14), i) : "";
      const suf = i >= 0 ? text.slice(i + quote.length, i + quote.length + 14) : "";
      const r = range.getBoundingClientRect();
      setPhraseSel({ block: blockId, quote, pre, suf, x: r.left + r.width / 2, y: r.top });
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [linkMode]);
  useEffect(() => {
    if (!linkMode) return;
    const onKey = (e) => { if (e.key === "Escape") { setLinkDraft(null); setPhraseSel(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [linkMode]);
  // Drives whether the drawer/comment-margin panes portal to document.body (mobile
  // overlay) or stay as normal flex siblings (desktop, pushes the manuscript aside).
  // Needed because <main className="main-content"> (App.jsx) sets position:relative
  // + z-index:1, which traps any position:fixed descendant's stacking order inside
  // it - no z-index value on the fixed panel can ever rise above the app's own
  // header as a result. A portal to document.body is the standard fix; it must be
  // conditional so the desktop flex layout (no portal) is untouched.
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 860);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const dissection = useMemo(() => buildDissection(result, posting), [result, posting]);
  // RS-SEC: the parsed ad sections for the manuscript (same adText fallback as Critical Read).
  const adSections = useMemo(() => {
    // Posting-first (PR #306 trust-loop): the picked ad's own text leads; corpus fallback.
    const jobs = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : [];
    const srcJob = jobs.find((j) => j && (j.description || j.responsibilitiesText));
    let t = (posting && posting.text) ? rsAdText({ description: posting.text }) : "";
    if (!t || t.trim().length < 40) t = rsAdText(srcJob || {});
    return rsAdSections(t);
  }, [result, posting]);
  // OI1.2: deferred, module-cached fetch of this employer's full live MCF posting set
  // (same posture as fetchEmployerRegistration/PbEmployerRow) - re-scopes rsIndicators'
  // repost/salary read off the critical render path. Never blocks; on failure or an
  // ambiguous employer match rsIndicators silently keeps the sampled-set variant.
  const [employerPostings, setEmployerPostings] = useState(null);
  useEffect(() => {
    const name = String(employer || "").trim();
    if (!name) { setEmployerPostings(null); return undefined; }
    let cancelled = false;
    fetchEmployerPostings(name).then((d) => { if (!cancelled) setEmployerPostings(d); });
    return () => { cancelled = true; };
  }, [employer]);
  const critical = useMemo(() => buildCriticalRead(result, dissection.spans, title, posting, employerPostings), [result, dissection.spans, title, posting, employerPostings]);
  // No.136 G2: severity-first ordering + dismiss/restore. Ranks are deterministic reads
  // of evidence the lenses already computed (counts and grades - no new numbers); a
  // dismissed panel is per-posting, persisted (KV-1 "boards" scope), reversible from the
  // hidden-panels chip row (spec 136 section 7: reversible + human-controlled).
  // PR 2 of the Step 3 simplification plan (24-07'26): a posting with no prior visit
  // starts with the deepest, most speculative Critical Read section already collapsed -
  // the loadState effect below only overwrites this when a posting HAS persisted
  // hiddenPanels state, so a previously-restored choice is still honoured either way.
  const [hiddenPanels, setHiddenPanels] = useState(["deepRead"]);
  useEffect(() => {
    if (!postingKey) return;
    loadState("boards", (all) => { if (all && all.hiddenPanels && Array.isArray(all.hiddenPanels[postingKey])) setHiddenPanels(all.hiddenPanels[postingKey]); });
  }, [postingKey]);
  const setPanelHidden = (key, hide) => {
    setHiddenPanels((prev) => {
      const next = hide ? Array.from(new Set(prev.concat(key))) : prev.filter((k) => k !== key);
      if (postingKey) {
        try {
          const raw = localStorage.getItem("v3.state.boards");
          const all = raw ? JSON.parse(raw) : {};
          all.hiddenPanels = all.hiddenPanels || {};
          all.hiddenPanels[postingKey] = next;
          saveState("boards", all);
        } catch (_) {}
      }
      return next;
    });
  };
  const g2Rank = {
    contradictions: (critical.contradictions && critical.contradictions.length) ? 1 : 9,
    trajectory: critical.trajectory ? (critical.trajectory.grade === "reshaping" ? 2 : critical.trajectory.grade === "splitting" ? 3 : 6) : 9,
    salaryPos: critical.salaryPos ? (critical.salaryPos.pct <= 35 ? 4 : 7) : 9,
    blindSpots: (critical.blindSpots && critical.blindSpots.length) ? 5 : 9,
    qoi: (critical.qoi && critical.qoi.some((q) => q.grade === "unfalsifiable")) ? 5 : 8,
    indicators: (critical.indicators && critical.indicators.length) ? 6 : 9,
  };
  const G2_LABELS = { contradictions: "Contradictions", trajectory: "Around the corner", salaryPos: "Competitive read", blindSpots: "Blind spots", qoi: "Quality of information", indicators: "Indicators", noodles: "Word noodles", forensic: "Forensic reversal", falsification: "Falsification lens", candidatePrep: "Prep for the room", deepRead: "Deep read (adversarial)" };
  // No.137 T1 section moves: these render blocks live on their OWN tabs now (qoi ->
  // Gates; salaryPos + indicators -> Market; trajectory -> Duties). Same data, same
  // dismiss machinery - just placed where their reader-question lives.
  const secQoI = (
    <>
<div style={{ order: g2Rank.qoi, display: "flex", flexDirection: "column" }}>
              {critical.qoi && critical.qoi.length > 0 && !hiddenPanels.includes("qoi") && <>
                <h3 style={critH3}>Quality of information {RS_DOT} can each claim be tested?</h3>
                <WhyLine why={critical.qoi.length + " requirement line" + (critical.qoi.length === 1 ? "" : "s") + " found to grade"} sec="spec No.135 AI-3" />
                {critical.qoi.map((q) => <CritCard key={q.id} tag={q.grade} obs={q.text} interp={q.why} appl={q.move} persona="QoI CHECK" accent={q.grade === "verifiable" ? "#1d4ed8" : "#9a6113"} obsChip="from posting"
                  onExpand={(e) => openSheet("Quality of information", "critcard", { tag: q.grade, obs: q.text, interp: q.why, appl: q.move, persona: "QoI CHECK", accent: q.grade === "verifiable" ? "#1d4ed8" : "#9a6113", obsChip: "from posting" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("qoi", true)} aria-label={"Hide panel: " + G2_LABELS.qoi} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
    </>
  );
  const secSalaryPos = (
    <>
<div style={{ order: g2Rank.salaryPos, display: "flex", flexDirection: "column" }}>
              {critical.salaryPos && !hiddenPanels.includes("salaryPos") && <>
                <h3 style={critH3}>Competitive read {RS_DOT} this ad vs the sampled market</h3>
                <WhyLine why={"this ad states a salary band and enough sampled ads do too"} sec="spec No.135 AI-5" />
                <CritCard tag={critical.salaryPos.pct + "th pct"} obs={critical.salaryPos.obs} interp={critical.salaryPos.why} appl={critical.salaryPos.move} persona="MARKET POSITION" accent="#0e7490" obsChip="computed"
                  onExpand={(e) => openSheet("Competitive read", "critcard", { tag: critical.salaryPos.pct + "th pct", obs: critical.salaryPos.obs, interp: critical.salaryPos.why, appl: critical.salaryPos.move, persona: "MARKET POSITION", accent: "#0e7490", obsChip: "computed" }, e)} />
              <button type="button" onClick={() => setPanelHidden("salaryPos", true)} aria-label={"Hide panel: " + G2_LABELS.salaryPos} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
    </>
  );
  const secIndicators = (
    <>
<div style={{ order: g2Rank.indicators, display: "flex", flexDirection: "column" }}>
              {critical.indicators && critical.indicators.length > 0 && !hiddenPanels.includes("indicators") && <>
                <h3 style={critH3}>Indicators {RS_DOT} signals in the sampled market</h3>
                <WhyLine why={"enough live ads were sampled to compute market signals"} sec="spec No.135 AI-3" />
                {critical.indicators.map((x) => <CritCard key={x.id} tag={x.label} obs={x.obs} interp={x.why} appl={x.move} persona="INDICATORS" accent="#0e7490" obsChip={x.obsChip || "computed"}
                  onExpand={(e) => openSheet("Indicators", "critcard", { tag: x.label, obs: x.obs, interp: x.why, appl: x.move, persona: "INDICATORS", accent: "#0e7490", obsChip: x.obsChip || "computed" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("indicators", true)} aria-label={"Hide panel: " + G2_LABELS.indicators} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
    </>
  );
  const secTrajectory = (
    <>
<div style={{ order: g2Rank.trajectory, display: "flex", flexDirection: "column" }}>
              {critical.trajectory && !hiddenPanels.includes("trajectory") && <>
                <h3 style={critH3}>Around the corner {RS_DOT} where this role is headed</h3>
                <WhyLine why={"the engine classified enough duties to aggregate a trajectory"} sec="spec No.135 AI-4" />
                <CritCard tag={critical.trajectory.grade} obs={critical.trajectory.obs} interp={critical.trajectory.why} appl={critical.trajectory.move} persona="TRAJECTORY" accent="#1d4ed8" obsChip="computed" />
              <button type="button" onClick={() => setPanelHidden("trajectory", true)} aria-label={"Hide panel: " + G2_LABELS.trajectory} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
    </>
  );
  const cr = result && result.criticalRead; // batched advisory LLM pass (may still be loading -> null)
  const spanBand = {}; dissection.spans.forEach((s) => { spanBand[s.id] = s.band; });
  // Honest overall confidence: high when every duty was engine-classified, withheld when none,
  // else "N of M classified" - never a flat confident number over unclassified spans.
  const _classified = dissection.spans.filter((s) => s.band).length;
  const footerConf = dissection.spans.length === 0 ? "withheld" : _classified === dissection.spans.length ? "high (engine-classified)" : _classified === 0 ? "withheld" : _classified + " of " + dissection.spans.length + " duties classified";
  const showClean = tab === "ad" && markup === "clean";
  const showDissect = tab === "duties" && dutyView === "oia";
  const showCritical = tab === "critical";
  // Inspector (right) is persistent on every tab; the comments LIST joins it on The Ad tab.
  const showMargin = true;
  const marginComments = markup === "comments" ? dissection.comments.filter((c) => c.type === "comment" || c.type === "withhold claim") : dissection.comments;

  const ja = result && result.jobAnatomy;
  const rd = result && result.responsibilitiesData;
  // Verbatim duties from the engine's Job Anatomy first (each carries layer + exposure),
  // else the responsibilities extract. Non-inventive: the posting's own duty text.
  const dutyObjs = (ja && Array.isArray(ja.duties) && ja.duties.length ? ja.duties
    : (rd && Array.isArray(rd.responsibilities) ? rd.responsibilities : []));
  const duties = dutyObjs.map((d) => (typeof d === "string" ? d : d.text)).filter(Boolean);
  const firstJob = (() => { const js = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : (Array.isArray(result && result.jobs) ? result.jobs : []); return js.find((j) => j && (j.description || j.responsibilitiesText)) || null; })();
  // Trust-loop rule 4: the manuscript's "verbatim" chip must not label LLM-authored
  // prose as verbatim. Prefer the posting's OWN text (parsed deterministically) when a
  // specific job was picked in Step 2; fall back to the corpus summary but relabel the
  // chip so nothing lies about its origin.
  const verbatimSourceText = (posting && posting.text) || (firstJob && (firstJob.description || firstJob.responsibilitiesText)) || "";
  const verbatim = useMemo(() => rsExtractVerbatim(verbatimSourceText), [verbatimSourceText]);
  // Two independent provenance decisions - one for the overview paragraph, one for the
  // duty bullets - so a partial ad (verbatim intro but no explicit Responsibilities
  // heading) never ships an LLM-authored bullet list under a "verbatim" chip.
  const hasVerbatimOverview = !!verbatim.overview;
  const hasVerbatimBullets = verbatim.responsibilities.length > 0;
  const overview = hasVerbatimOverview ? verbatim.overview : (rd && rd.summary) || (firstJob ? rsFirstSentence(rsStrip(firstJob.description || firstJob.responsibilitiesText)) : "");
  const overviewSource = hasVerbatimOverview ? "verbatim" : "synthesis";
  const skillObjs = (Array.isArray(result && result.skills) ? result.skills : []).filter((s) => s && (s.skill || typeof s === "string"));
  const skills = skillObjs.map((s) => s.skill || s).filter(Boolean);
  const skillTermRe = useMemo(() => rsSkillTermRe(result), [result]);
  const derivedBand = rsDominantBand(dutyObjs);
  const bandKey = (band && BANDS[band]) ? band : derivedBand;
  const bandTok = bandKey && BANDS[bandKey] ? BANDS[bandKey] : null;


  const pillStyle = (active) => ({ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 36, borderRadius: 6, padding: "5px 10px", background: active ? "#142a8e" : "#fff", color: active ? "#fff" : "#3a4456", border: "1px solid " + (active ? "#142a8e" : "#e2e0d8") });

  const [activeWin, setActiveWin] = useState({});
  // No.138 U3: LAYERS. A torn-off window leaves its panel strip and floats above the desk
  // in its own layer - drag by header, resize by corner, click brings to front, close
  // returns it to its home strip. Arrangement persists per posting (KV "boards").
  const [floats, setFloats] = useState([]); // [{id,x,y,w,h,z}]
  // U4-C: panel splitter (left panel % of the desk). U4-A: per-tab dock overrides (a
  // window dragged onto a panel joins THAT side's strip). U4-B: windows pinned to the
  // right edge (auto-hide; click slides them over the desk, ESC dismisses).
  const [splitPct, setSplitPct] = useState(58);
  const [overrides, setOverrides] = useState({}); // {tab: {winId: "left"|"right"}}
  const [pinned, setPinned] = useState([]);       // [winId]
  const [slideOpen, setSlideOpen] = useState(null); // pinned winId currently slid out
  // U-drawer: a bottom sheet for cramped/overflow content (tables, long OIA/advisory
  // cards) that has no connector partner - {title, kind, payload} straight off the same
  // data already rendered inline; never a new fetch, never fabricated content.
  const [sheet, setSheet] = useState(null); // { title, kind, payload } | null
  const sheetTriggerRef = useRef(null);
  const sheetCloseRef = useRef(null);
  const openSheet = (title, kind, payload, e) => { sheetTriggerRef.current = (e && e.currentTarget) || null; setSheet({ title, kind, payload }); };
  const [dockHover, setDockHover] = useState(null); // "left"|"right" while dragging a float
  const splitDragRef = useRef(null);
  const deskRef = useRef(null);
  const zTopRef = useRef(RS_LAYERS.float);
  const floatDragRef = useRef(null);
  // PR 3 (Part C.2, LC1): the single connLine grew into a link SET, measured inside
  // Desk.jsx (ephemeral DOM geometry). This component supplies only the DATA the links
  // join on - ids that already exist in the engine's output - plus the stub activation
  // handler. No LLM authors a link; a tab with no real shared id derives zero links.
  const traceIds = (result && result.jobAnatomy && !result.jobAnatomy.fallback && Array.isArray(result.jobAnatomy.duties))
    ? result.jobAnatomy.duties.slice(0, 14).map((_, i) => ({ oiaId: "s" + i, traceId: "t" + i }))
    : [];
  const linkData = { comments: dissection.comments, activeSpan: activeSpan || previewSpan, focusSkill, traceIds };
  // Stub click "opens/activates the target window" (Part C.2 item 4): floated windows
  // come to front, pinned ones slide out, in-strip ones become the active tab of their
  // panel; a window that lives on another top tab switches to that tab.
  const onStubActivate = (winId) => {
    if (floats.some((f) => f.id === winId)) { bringToFront(winId); return; }
    if (pinned.includes(winId)) { setSlideOpen(winId); return; }
    const tw = TAB_WINDOWS[tab] || {};
    const side = (tw.left || []).includes(winId) ? "left" : (tw.right || []).includes(winId) ? "right" : null;
    if (side) { setActiveWin((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [side]: winId } })); return; }
    const home = Object.entries(TAB_WINDOWS).find(([, t]) => (t.left || []).includes(winId) || (t.right || []).includes(winId));
    if (home) setTab(home[0]);
  };
  useEffect(() => {
    if (!postingKey) return;
    loadState("boards", (all) => {
      // Goal §7: a floated window's position is preserved only within the current
      // session - NOT restored across reloads. Only the desk layout (split ratio,
      // docked-panel overrides, pins) persists; torn-off floats start empty each visit.
      const d = all && all.desk && all.desk[postingKey];
      if (d) { if (typeof d.splitPct === "number") setSplitPct(Math.max(30, Math.min(75, d.splitPct))); if (d.overrides) setOverrides(d.overrides); if (Array.isArray(d.pinned)) setPinned(d.pinned); }
    });
  }, [postingKey]);
  const persistFloats = (/* next */) => {
    if (!postingKey) return;
    try {
      const raw = localStorage.getItem("v3.state.boards");
      const all = raw ? JSON.parse(raw) : {};
      // Float positions are session-only (goal §7): persist ONLY the desk layout, and
      // clear any float snapshot a previous build may have written for this posting.
      if (all.floats) delete all.floats[postingKey];
      all.desk = all.desk || {};
      all.desk[postingKey] = { splitPct, overrides, pinned };
      saveState("boards", all);
    } catch (_) {}
  };
  const tearOff = (id) => setFloats((prev) => {
    if (prev.some((f) => f.id === id)) return prev;
    const n = prev.length;
    const next = prev.concat({ id, x: 90 + n * 32, y: 110 + n * 28, w: Math.min(640, window.innerWidth - 120), h: Math.min(520, window.innerHeight - 180), z: ++zTopRef.current });
    persistFloats(next); return next;
  });
  const dockBack = (id) => setFloats((prev) => { const next = prev.filter((f) => f.id !== id); persistFloats(next); return next; });
  const bringToFront = (id) => setFloats((prev) => { const next = prev.map((f) => f.id === id ? { ...f, z: ++zTopRef.current } : f); persistFloats(next); return next; });
  // Goal §7: an explicit Reset-position action for a floated window - returns it to a
  // sensible cascaded default (and clamps size to the viewport) so a window dragged or
  // resized off-screen is always recoverable without requiring drag.
  const resetFloat = (id) => setFloats((prev) => {
    const k = prev.findIndex((f) => f.id === id); if (k < 0) return prev;
    const next = prev.map((f) => f.id === id
      ? { ...f, x: 90 + k * 32, y: 110 + k * 28, w: Math.min(640, window.innerWidth - 120), h: Math.min(520, window.innerHeight - 180), z: ++zTopRef.current }
      : f);
    persistFloats(next); return next;
  });
  // Goal §7: keep floats reachable when the viewport shrinks - clamp each window's
  // size and position back inside the viewport on resize (drag already clamps live).
  useEffect(() => {
    const onResize = () => setFloats((prev) => {
      let changed = false;
      const next = prev.map((f) => {
        const w = Math.min(f.w, Math.max(260, window.innerWidth - 24));
        const h = Math.min(f.h, Math.max(180, window.innerHeight - 96));
        const x = Math.max(4, Math.min(window.innerWidth - 160, f.x));
        const y = Math.max(56, Math.min(window.innerHeight - 80, f.y));
        if (w !== f.w || h !== f.h || x !== f.x || y !== f.y) { changed = true; return { ...f, w, h, x, y }; }
        return f;
      });
      return changed ? next : prev;
    });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (!slideOpen && !sheet) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (sheet) { setSheet(null); return; } // sheet closes first, then the pinned slide-over
      setSlideOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slideOpen, sheet]);
  // Focus the sheet's close button on open; return focus to whatever opened it on close.
  useEffect(() => {
    if (sheet && sheetCloseRef.current) sheetCloseRef.current.focus();
    if (!sheet && sheetTriggerRef.current) { sheetTriggerRef.current.focus(); sheetTriggerRef.current = null; }
  }, [sheet]);
  useEffect(() => { persistFloats(floats); /* also captures splitPct/overrides/pinned via desk blob */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitPct, overrides, pinned]);
  const startFloatDrag = (e, id) => {
    if (e.target && e.target.closest && e.target.closest("button")) return;
    const f = floats.find((x) => x.id === id); if (!f) return;
    bringToFront(id);
    floatDragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: f.x, oy: f.y };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const dockSideAt = (clientX, clientY) => {
    const desk = deskRef.current; if (!desk) return null;
    const r = desk.getBoundingClientRect();
    if (clientY < r.top || clientY > r.bottom || clientX < r.left || clientX > r.right) return null;
    return clientX < r.left + (r.width * splitPct) / 100 ? "left" : "right";
  };
  const moveFloatDrag = (e) => {
    const d = floatDragRef.current; if (!d) return;
    setDockHover(dockSideAt(e.clientX, e.clientY));
    setFloats((prev) => prev.map((f) => f.id === d.id ? { ...f, x: Math.max(4, Math.min(window.innerWidth - 160, d.ox + e.clientX - d.sx)), y: Math.max(56, Math.min(window.innerHeight - 80, d.oy + e.clientY - d.sy)) } : f));
  };
  const stopFloatDrag = (e) => {
    const d = floatDragRef.current; if (!d) return;
    const side = e && e.clientX != null ? dockSideAt(e.clientX, e.clientY) : null;
    if (side) {
      // U4-A: drop over a panel docks the window into THAT side's strip (as a tab).
      setOverrides((prev) => { const next = { ...prev, [tab]: { ...(prev[tab] || {}), [d.id]: side } }; return next; });
      setActiveWin((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [side]: d.id } }));
      dockBack(d.id);
    } else { persistFloats(floats); }
    setDockHover(null); floatDragRef.current = null;
  };
  // Bottom-sheet body: every kind re-presents data already rendered inline elsewhere on
  // the page (same CritCard/AdvisoryCard fields, same JSX children) - just at drawer size
  // for content that is cramped in the 3-column card grid. Nothing new is fabricated here.
  const renderSheet = (sh) => {
    if (!sh) return null;
    if (sh.kind === "critcard") {
      const p = sh.payload;
      return (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <CritCard tag={p.tag} obs={p.obs} interp={p.interp} appl={p.appl} persona={p.persona} accent={p.accent} obsChip={p.obsChip} />
        </div>
      );
    }
    if (sh.kind === "node") return <div style={{ maxWidth: 880, margin: "0 auto" }}>{sh.payload.node}</div>;
    return null;
  };
  // No.138 U2: WINDOW RENDERERS - bodies extracted verbatim to ./review/windows/*;
  // winCtx is the component-state closure they used to capture. Built here, AFTER the
  // layout-state block, because openSheet is a const declared above (TDZ) - the win*
  // consts are only consumed by renderWindow below, so later construction is identical.
  const winCtx = { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus, rsTokens, setPreviewSpan, linkMode, linkDraft, onLinkPick, onLinkDragStart, linkDrag, rsTermSpans, focusTerm, setFocusTerm };
  // PR 2 (Part B.3): windows render straight off the registry - the hand-maintained
  // ternary chain is gone; an unknown id falls back to the inspector, as before.
  const winEls = {};
  WINDOWS.forEach((w) => { winEls[w.id] = w.render(winCtx); });
  const renderWindow = (id) => (winEls[id] !== undefined ? winEls[id] : winEls.inspector);
  // P1: resolve the persisted links to DOM selectors for the connector overlay. Duty
  // line -> "#li-<id>" (Manuscript), O-I-A card -> [data-oia-anchor]. Drawn blue, always
  // (not gated on the active span), so a locked link stays visible without hover.
  const userLinks = links.map((l) => ({ id: l.id, from: l.from, to: l.to }));
  // Layer 1 - auto-drawn provenance links (deterministic). One per dissection span: its
  // manuscript responsibility (#li-<id>) to its O-I-A card ([data-oia-anchor=<id>]). Desk
  // only paints a link whose BOTH endpoints resolve in the live DOM, so spans without a
  // duty line on-screen (e.g. requirement lines) silently don't draw - never mis-points.
  const autoLinks = useMemo(() => (showAuto && dissection && Array.isArray(dissection.spans)
    ? dissection.spans.map((s) => ({ id: "auto-" + s.id, from: { t: "duty", id: s.id }, to: { t: "oia", id: s.id } }))
    : []), [showAuto, dissection]);
  // Layer 3: only READY, non-dismissed suggestions become drawable dashed links.
  const suggestLinks = (showSuggest && suggestState.status === "ready")
    ? suggestState.items.map((it) => ({ id: it.id, from: it.from, to: it.to })) : [];
  return (
    <>
    {/* Mobile responsive fix: the desktop 3-pane layout (rail + manuscript + comment
        margin) has no shrink floor - manuscript alone won't go below clamp(340px,...)
        and the margin/drawer panes are flex:none at 300-312px, so on a phone the row
        summed to 700px+ and silently overflowed (mobile browsers hide the scrollbar,
        so that content was effectively unreachable, not just visually clipped). Below
        860px: the manuscript takes full width, and the drawer/margin panes become
        fixed-position slide-over panels instead of flex siblings that push it aside. */}
    <style>{`
      @keyframes wisSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes wisSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      @media (max-width: 860px) {
        /* No.138: the desk stacks on phones - left panel above, right below, each
           keeping its own window tabs. */
        .wis-desk { flex-direction: column !important; }
        .wis-panel { flex: 1 1 auto !important; min-height: 40vh; border-left: none !important; border-top: 1px solid #e2e0d8; }
      }
    `}</style>
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 50px)", background: "#e9edf3" }}>
      {/* Sub-header (fixed, does not scroll) */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, flex: "none", display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "#14204f", borderBottom: "1px solid #0d1636" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#dbe2ff", fontFamily: "'Spline Sans',sans-serif", fontWeight: 500, fontSize: "0.8125rem", flex: "none" }}><span aria-hidden="true">&#8592;</span> Postings</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".14em", color: "rgba(255,255,255,0.72)" }}>REVIEWING</span>
            <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"}</Chip>
            {/* Decision counts (goal §10 / handoff sub-header): live accepted/pending
                tally over the reviewer comments - counts, not colour, carry the state. */}
            {marginComments.length > 0 && (() => {
              const acc = marginComments.filter((c) => commentStatus[c.id] === "accepted").length;
              const rej = marginComments.filter((c) => commentStatus[c.id] === "rejected").length;
              const pen = marginComments.length - acc - rej;
              return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#c9d2ee", whiteSpace: "nowrap" }}>{marginComments.length} comment{marginComments.length === 1 ? "" : "s"} {RS_DOT} {acc} accepted {RS_DOT} {rej} rejected {RS_DOT} {pen} pending</span>;
            })()}
          </div>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.1875rem", lineHeight: 1.2, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title || "this role"}</div>
          {/* Step 1's picker discloses when a typed prefix/alt title ("Deputy CEO") was
              mapped to a canonical ESCO title for the skills fetch - that disclosure must
              not silently vanish by Step 3. */}
          {result && result.escoCanonicalTitle && (
            <div style={{ fontSize: "0.6875rem", color: "#c9d2ee", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Skills resolved via the closest ESCO term: <strong style={{ color: "#ffffff" }}>{result.escoCanonicalTitle}</strong></div>
          )}
        </div>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
          {bandTok && <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 6, padding: "4px 9px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: bandTok.dot }} />{bandTok.label}</span>}
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#64748b", background: "#fff", border: "1px solid #e6e3db", borderRadius: 6, padding: "4px 9px" }}>{duties.length} duties {String.fromCharCode(0x00b7)} {skills.length} skills</span>
          {onOpenOkf && (
            <button type="button" onClick={onOpenOkf} title="View this analysis as an OKF concept document" style={{ minHeight: 44, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd", background: "#f7f5fd", border: "1px solid #ddd5f6", borderRadius: 6, padding: "0 9px", cursor: "pointer" }}>{"{ } OKF"}</button>
          )}
        </div>
      </div>

      {/* AN1: this page renders as soon as core skills resolve, but Responsibilities/
          Role Graph/Critical Read/SSOC Graph/Role Mix/prompt-enrichment keep loading in
          the background for tens of seconds after that. This strip narrates the REAL
          stages still in flight (bgStep/bgStatus set from doAnalyse's own pipeline calls,
          same pattern as the compare-queue's compareStep/compareStatus) - a step counter,
          an honest message, and an elapsed timer. No fabricated percentage and no
          "step N of total": later stages are conditional (posting-only, >=3 jobs, etc.),
          so a denominator here would be invented. This is the ONLY progress strip on
          this page - the static engineering-completion strip was removed (11-07 '26)
          because a bar that never moves reads as broken, whatever its label says. */}
      {bgRunning && bgModalMin && (
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "6px 16px", background: "#eef4ff", borderBottom: "1px solid #d7e3fb" }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#2554d6", flex: "none" }} />
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".04em", color: "#1f3fae", flex: "none" }}>STILL LOADING</span>
          <span style={{ fontSize: "0.75rem", color: "#2a3f70", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bgStatus}</span>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#42538a", flex: "none" }}>Step {bgStep} {String.fromCharCode(0x00b7)} {Math.floor((bgElapsed || 0) / 60)}:{String((bgElapsed || 0) % 60).padStart(2, "0")}</span>
        </div>
      )}

      {/* Modal spec (Human Lead 11-07 '26): the Step 3 build progress shows in a CENTRED
          MODAL, not only inline. Blocks accidental interaction with the page underneath;
          a deliberate "Read the page while it builds" button minimises it back to the
          inline strip above (the page is genuinely usable mid-build - AN1 design). The
          bar is an indeterminate sweep, NOT a percentage: later stages are conditional,
          so a denominator would be invented (non-inventive contract). Auto-closes when
          the fan-out settles; a failure shows an error state + recovery instruction. */}
      {bgModalOpen && (
        <div role="dialog" aria-modal="true" aria-busy={bgError ? undefined : "true"} aria-label={bgError ? "Analysis build problem" : "Building the full analysis"}
          onKeyDown={(e) => {
            if (e.key === "Escape") { bgError ? setBgErrDismissed(true) : setBgModalMin(true); }
            // Focus trap (WAI-ARIA dialog): Tab/Shift+Tab cycle among the dialog's
            // own buttons - keyboard focus never lands on the covered page behind.
            if (e.key === "Tab") {
              e.preventDefault();
              const btns = Array.from(e.currentTarget.querySelectorAll("button"));
              if (!btns.length) return;
              const i = btns.indexOf(document.activeElement);
              const next = e.shiftKey ? (i <= 0 ? btns.length - 1 : i - 1) : (i < 0 || i === btns.length - 1 ? 0 : i + 1);
              btns[next].focus();
            }
          }}
          style={{ position: "fixed", inset: 0, zIndex: RS_LAYERS.modal, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.48)", padding: 16 }}>
          <style>{"@keyframes rsSweep{0%{transform:translateX(-110%)}100%{transform:translateX(380%)}} @keyframes rsPulse{0%,100%{opacity:.45}50%{opacity:1}} @media (prefers-reduced-motion: reduce){.rs-anim{animation:none !important}}"}</style>
          <div style={{ width: "min(440px, 94vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", border: "1px solid #d9dee6", borderRadius: 14, boxShadow: "0 24px 70px rgba(15,23,42,0.35)", padding: "20px 22px 18px" }}>
            {!bgError ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <span aria-hidden="true" className="rs-anim" style={{ width: 9, height: 9, borderRadius: "50%", background: "#2554d6", flex: "none", animation: "rsPulse 1.3s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", fontWeight: 700, letterSpacing: ".06em", color: "#1f3fae" }}>BUILDING THE FULL ANALYSIS</span>
                </div>
                <p aria-live="polite" style={{ margin: "0 0 12px", fontSize: "0.875rem", color: "#1e293b", lineHeight: 1.55, minHeight: 40 }}>{bgStatus || "Fetching live SG postings and building the deeper reads..."}</p>
                {/* Indeterminate progressbar: role + label so AT conveys "in
                    progress"; aria-valuenow is deliberately omitted (no honest %
                    exists - later stages are conditional), which is the ARIA
                    signal for an indeterminate bar. */}
                <div role="progressbar" aria-label="Building the full analysis - in progress" aria-valuemin={0} aria-valuemax={100} style={{ position: "relative", height: 6, borderRadius: 3, background: "#e3e9f1", overflow: "hidden", marginBottom: 8 }}>
                  <div aria-hidden="true" className="rs-anim" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "32%", borderRadius: 3, background: "linear-gradient(90deg, #2554d6, #0e7490)", animation: "rsSweep 1.4s ease-in-out infinite" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#42538a" }}>Step {bgStep} {String.fromCharCode(0x00b7)} {Math.floor((bgElapsed || 0) / 60)}:{String((bgElapsed || 0) % 60).padStart(2, "0")} elapsed</span>
                  <span style={{ fontSize: "0.75rem", color: "#42538a" }}>closes by itself when done</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "0.8125rem", color: "#3d4a5c", lineHeight: 1.55 }}>The page behind is already live - sections appear as they finish.</p>
                <button type="button" autoFocus onClick={() => setBgModalMin(true)}
                  style={{ width: "100%", minHeight: 44, borderRadius: 9, border: "1px solid #c3d3f5", background: "#e8f0fe", color: "#142a8e", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                  Read the page while it builds
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <span aria-hidden="true" style={{ fontSize: "1rem", lineHeight: 1 }}>{String.fromCharCode(0x26a0)}</span>
                  <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", fontWeight: 700, letterSpacing: ".06em", color: "#92450a" }}>SOME SECTIONS DID NOT FINISH</span>
                </div>
                <p role="alert" style={{ margin: "0 0 10px", fontSize: "0.875rem", color: "#1e293b", lineHeight: 1.6 }}>{bgError} Everything that completed is already on the page below - nothing shown is affected.</p>
                <p style={{ margin: "0 0 14px", fontSize: "0.8125rem", color: "#3d4a5c", lineHeight: 1.6 }}>If it keeps failing, wait a minute and retry - the source may be briefly busy.</p>
                {/* Goal §5: real Retry + Return actions on failure - Retry re-runs the
                    live-postings rebuild (the recoverable stage); Return goes back to
                    the postings list. Close keeps the completed page. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {onRetryDuties && (
                    <button type="button" autoFocus onClick={() => { setBgErrDismissed(true); onRetryDuties(); setTab("ad"); }}
                      style={{ width: "100%", minHeight: 44, borderRadius: 9, border: "none", background: "#142a8e", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                      Retry live postings
                    </button>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" autoFocus={!onRetryDuties} onClick={() => setBgErrDismissed(true)}
                      style={{ flex: 1, minHeight: 44, borderRadius: 9, border: "1px solid #f5d8a8", background: "#fdf0dd", color: "#92450a", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                      Close and keep reading
                    </button>
                    {onBack && (
                      <button type="button" onClick={onBack}
                        style={{ flex: 1, minHeight: 44, borderRadius: 9, border: "1px solid #d9dee6", background: "#fff", color: "#1a202c", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
                        Return to postings
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* REMOVED (Human Lead, 11-07 '26): the "BUILDING THE BLUEPRINT" strip. Its bars
          were static engineering-completion percentages from blueprint-status.json -
          they never moved during an analysis and repeatedly read as a frozen progress
          bar. The Human Lead's standing rule: a progress bar must progress or it must
          go. The AN1 "STILL LOADING" strip above is the real, live analysis progress;
          engineering build status stays in blueprint-status.json, not in the UI. */}

      {/* No.137 T1: TABS row (Report View anatomy) - folder-style, active tab attaches to
          its toolbar; each tab owns row 3's controls so nothing exists out of context. */}
      <div ref={tabsRef} className="wis-scroll" role="tablist" aria-label="Analysis views" style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 4, padding: "3px 10px 0", background: "#f3f1ea", borderBottom: "1px solid #d9dee6", overflowX: "auto" }}>
        {[["overview", "Overview"], ["ad", "The Ad"], ["duties", "Duties & Exposure"], ["gates", "Requirements & Gates"], ["critical", "Critical Read"], ["market", "Market"]].map(([k, lbl]) => {
          const on = tab === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setTab(k)}
              style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: on ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 40, padding: "6px 13px", background: on ? "#fbfaf7" : "#e7e4da", color: on ? "#14204f" : "#3d4a5c", border: "1px solid " + (on ? "#d9dee6" : "#dcd8cc"), borderBottom: on ? "1px solid #fbfaf7" : "1px solid #d9dee6", borderRadius: "10px 10px 0 0", marginBottom: -1, position: "relative", zIndex: on ? 2 : 1 }}>{lbl}</button>
          );
        })}
      </div>
      {/* Row 3: the active tab's toolbar */}
      <div className="wis-scroll" style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", background: "#f3f1ea", borderBottom: "1px solid #e0dcd0", overflowX: "auto", minHeight: 44 }}>
        {tab === "overview" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>verdict first {String.fromCharCode(0x00b7)} every chip is a door {String.fromCharCode(0x00b7)} time-window: snapshot at analysis</span>}
        {tab === "ad" && [["clean", "Read clean"], ["suggestions", "Evidence view"], ["comments", "Comments"]].map(([k, lbl]) => (
          <button key={k} type="button" aria-pressed={markup === k} onClick={() => setMarkup(k)} style={pillStyle(markup === k)}>{lbl}</button>
        ))}
        {tab === "duties" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>O-I-A cards {String.fromCharCode(0x00b7)} AI trace {String.fromCharCode(0x00b7)} trajectory - as windows in the panels</span>}
        {tab === "duties" && (
          <button type="button" aria-pressed={linkMode} onClick={() => { setLinkMode((v) => !v); setLinkDraft(null); }} title="Draw your own locked link from a responsibility to an O-I-A card (persistent, blue)"
            style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", minHeight: 44, borderRadius: 6, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, background: linkMode ? "#1d4ed8" : "#eef2ff", color: linkMode ? "#fff" : "#1e3fae", border: "1px solid " + (linkMode ? "#1d4ed8" : "#9cb4ff"), boxShadow: linkMode ? "0 1px 6px rgba(29,78,216,0.4)" : "none" }}>
            <span aria-hidden="true">{String.fromCharCode(0x1f517)}</span> {linkMode ? "Linking on" : "Draw a link"}{links.length ? " · " + links.length : ""}
          </button>
        )}
        {tab === "duties" && (
          <button type="button" aria-pressed={showAuto} onClick={() => setShowAuto((v) => !v)} title="Auto-draw the links the engine already knows: every responsibility to its O-I-A card (deterministic - not AI-guessed)"
            style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", minHeight: 44, borderRadius: 6, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, background: showAuto ? "#475569" : "#eef1f5", color: showAuto ? "#fff" : "#475569", border: "1px solid " + (showAuto ? "#475569" : "#c3ccd8"), boxShadow: showAuto ? "0 1px 6px rgba(71,85,105,0.35)" : "none" }}>
            <span aria-hidden="true">{String.fromCharCode(0x21c4)}</span> {showAuto ? "Connections on" : "Show connections"}
          </button>
        )}
        {tab === "duties" && (
          <button type="button" aria-pressed={showSuggest} onClick={() => setShowSuggest((v) => !v)} title="Ask the AI to suggest cross-panel links the engine can't know. Advisory only - each suggestion is a guess you review, never an engine fact."
            style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", minHeight: 44, borderRadius: 6, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, background: showSuggest ? "#6d28d9" : "#f3effc", color: showSuggest ? "#fff" : "#6d28d9", border: "1px solid " + (showSuggest ? "#6d28d9" : "#c9b8f0"), boxShadow: showSuggest ? "0 1px 6px rgba(109,40,217,0.35)" : "none" }}>
            <span aria-hidden="true">{String.fromCharCode(0x2728)}</span> {showSuggest ? "Suggestions on" : "AI-suggested links"}
          </button>
        )}
        {tab === "gates" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>each requirement graded: verifiable {String.fromCharCode(0x00b7)} vague {String.fromCharCode(0x00b7)} unfalsifiable (QoI, deterministic)</span>}
        {tab === "critical" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>severity-first {String.fromCharCode(0x00b7)} {hiddenPanels.length ? hiddenPanels.length + " hidden panel" + (hiddenPanels.length === 1 ? "" : "s") + " (restore below)" : "panels dismissible"}</span>}
        {tab === "market" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>graph picker inside the pane (Layered {String.fromCharCode(0x00b7)} Knowledge {String.fromCharCode(0x00b7)} SSOC) {String.fromCharCode(0x00b7)} salary position + indicators below</span>}
        {/* PR 3 of the Step 3 simplification plan (24-07'26): this legend used to sit
            permanently open, taking fixed toolbar space on every tab. Each chip already
            carries a native title= tooltip with the same gloss, so the always-visible row
            was mostly redundant with content it already had - a native <details> disclosure
            keeps that content one tap away instead, with zero new state/handlers and
            correct expanded/collapsed a11y semantics for free. */}
        <details style={{ marginLeft: "auto", flexShrink: 0 }}>
          <summary aria-label="Chip key legend" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, minWidth: 44, padding: "0 8px", cursor: "pointer", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c" }}>
            CHIP KEY
          </summary>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }}>
            {[["from posting", "verbatim ad text"], ["computed", "engine, deterministic"], ["derived", "rule-based inference"], ["AI estimate", "LLM advisory, not fact"], ["unverified", "no source confirmed"]].map(([k, gloss]) => (
              <span key={k} title={k + " = " + gloss} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, color: PROV[k].ink, background: PROV[k].bg, border: "1px solid " + PROV[k].border, borderRadius: 4, padding: "1px 6px" }}>{k}</span>
            ))}
          </div>
        </details>
      </div>

      {/* P1 locked-links manager: lists every user-drawn duty->card link with a delete,
          and narrates the pick step while link mode is armed. Duties tab only (where both
          endpoints live). Kept visually distinct (blue) from the engine's amber connector.
          Always shown on the duties tab so the feature is discoverable: when link mode is
          off and no link exists yet, it explains what a locked link is and how to draw one
          (the earlier bug report was "cannot see the link" - the 🔗 handles only appear
          once link mode is armed, so before that there was no on-screen hint at all). */}
      {tab === "duties" && (
        <div className="wis-scroll" style={{ flex: "none", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "7px 14px", background: "#eef2ff", borderBottom: "1px solid #d7e0fb", overflowX: "auto" }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", color: "#1e3fae", flex: "none" }}>LOCKED LINKS {String.fromCharCode(0x00b7)} {links.length}</span>
          {linkMode ? (
            <span style={{ fontSize: "0.75rem", color: "#1e3fae", flex: "none" }}>
              {linkDraft ? "Picked “" + String(linkDraft.quote || "").slice(0, 30) + "” - now pick another responsibility, card, or selected phrase to lock (Esc cancels)" : "Drag a 🔗 handle from a responsibility (left) onto an O-I-A card (right) to draw a blue link - or click one 🔗 then another, or select any phrase and confirm."}
            </span>
          ) : links.length === 0 ? (
            <span style={{ fontSize: "0.75rem", color: "#3a4a86", flex: "none" }}>
              Draw your own persistent <span style={{ color: "#1d4ed8" }}>blue</span> links: press <b>Draw a link</b> above, then drag a 🔗 handle from a responsibility onto an O-I-A card (or click one then the other). (The <span style={{ color: "#b45309" }}>amber</span> line that appears when you click a line is the engine's automatic trace, not a saved link.)
            </span>
          ) : null}
          {/* Layer 2: the term currently traced across both panels, with a clear control.
              When idle, a quiet hint that skill terms are clickable (respects the plain-line
              doctrine - terms are not decorated until focused). */}
          {focusTerm ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: "none", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 14, padding: "2px 4px 2px 10px", fontSize: "0.75rem", color: "#7c5e10" }}>
              <span aria-hidden="true">{String.fromCharCode(0x1f50e)}</span> tracing “{focusTerm}” across both panels
              <button type="button" onClick={() => setFocusTerm(null)} aria-label={"Clear term trace"} style={{ flex: "none", minWidth: 44, minHeight: 44, border: "none", background: "transparent", color: "#7c5e10", cursor: "pointer", borderRadius: 13, fontSize: "0.9375rem", lineHeight: 1 }}>{String.fromCharCode(0x00d7)}</button>
            </span>
          ) : (
            <span style={{ fontSize: "0.6875rem", color: "#8a7f66", flex: "none" }}>Tip: click any skill term in a responsibility or card to trace it across both panels.</span>
          )}
          {links.map((l) => (
            <span key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, maxWidth: 340, background: "#fff", border: "1px solid #c7d6ff", borderRadius: 14, padding: "2px 3px 2px 10px", fontSize: "0.75rem", color: "#1e293b", flex: "none" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(l.from.quote || l.from.id).slice(0, 40)} {String.fromCharCode(0x2192)} {(l.to.quote || l.to.id).slice(0, 26)}</span>
              <button type="button" onClick={() => removeLink(l.id)} aria-label={"Remove locked link"} style={{ flex: "none", minWidth: 44, minHeight: 44, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", borderRadius: 13, fontSize: "0.9375rem", lineHeight: 1 }}>{String.fromCharCode(0x00d7)}</button>
            </span>
          ))}
          {/* Line legend - three distinct kinds now share the desk; name each so no colour
              alone carries meaning (a11y): grey = engine-known, amber = live trace, blue = yours. */}
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#5b6478" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span aria-hidden="true" style={{ width: 16, height: 0, borderTop: "2px dotted #8792a3" }} />engine-known (dotted)</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span aria-hidden="true" style={{ width: 16, height: 0, borderTop: "2px solid #b45309" }} />live trace (solid)</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span aria-hidden="true" style={{ width: 16, height: 0, borderTop: "4px solid #1d4ed8" }} />your links (thick)</span>
            {showSuggest && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span aria-hidden="true" style={{ width: 16, height: 0, borderTop: "2px dashed #6d28d9" }} />AI-suggested (dashed)</span>}
          </span>
        </div>
      )}

      {/* Layer 3 review bar: every AI suggestion is inert here until the human Accepts
          (promotes to a blue locked link) or Dismisses. These are guesses, not engine
          facts - carries the AI-estimate chip + a Source/Confidence/Time-window footprint. */}
      {tab === "duties" && showSuggest && (
        <div className="wis-scroll" style={{ flex: "none", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "7px 14px", background: "#f5f1fc", borderBottom: "1px solid #ddd0f5", overflowX: "auto" }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", color: "#6d28d9", flex: "none" }}>AI-SUGGESTED {String.fromCharCode(0x00b7)} REVIEW EACH</span>
          <span title="AI estimate = LLM advisory, not fact" style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, color: PROV["AI estimate"].ink, background: PROV["AI estimate"].bg, border: "1px solid " + PROV["AI estimate"].border, borderRadius: 4, padding: "1px 6px", flex: "none" }}>AI estimate</span>
          <span aria-live="polite" style={{ display: "inline-flex", alignItems: "center", flex: "none" }}>
            {suggestState.status === "loading" && <span style={{ fontSize: "0.75rem", color: "#6d28d9" }}>Asking the model to suggest links{String.fromCharCode(0x2026)}</span>}
            {suggestState.status === "error" && <span style={{ fontSize: "0.75rem", color: "#8a5a1a" }}>Couldn{String.fromCharCode(0x2019)}t get suggestions this time {String.fromCharCode(0x2014)} nothing drawn (withheld, not guessed).</span>}
            {(suggestState.status === "empty") && <span style={{ fontSize: "0.75rem", color: "#6b6357" }}>No confident cross-panel suggestions for this posting {String.fromCharCode(0x2014)} nothing drawn.</span>}
            {suggestState.status === "ready" && <span style={{ fontSize: "0.6875rem", color: "#6b5a8a" }}>Guesses, not engine facts. Source: AI suggestion (LLM) {String.fromCharCode(0x00b7)} Confidence: advisory {String.fromCharCode(0x00b7)} Time-window: this session.</span>}
          </span>
          {suggestState.items.map((it) => (
            <span key={it.id} title={"AI-suggested link. Source: AI suggestion (LLM) - Confidence: advisory, not a fact - Time-window: this session. Review before you keep it."} style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 440, background: "#fff", border: "1px dashed #b79ae8", borderRadius: 12, padding: "3px 5px 3px 10px", fontSize: "0.75rem", color: "#1e293b", flex: "none" }}>
              <span aria-hidden="true" title="AI estimate = LLM advisory, not fact" style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, color: PROV["AI estimate"].ink, background: PROV["AI estimate"].bg, border: "1px solid " + PROV["AI estimate"].border, borderRadius: 3, padding: "0 4px", flex: "none" }}>AI</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>{String(it.fromText || "").slice(0, 34)} {String.fromCharCode(0x21e2)} {String(it.toText || "").slice(0, 26)}</span>
              <button type="button" onClick={() => acceptSuggestion(it)} aria-label={"Accept AI-suggested link and lock it"} style={{ flex: "none", minHeight: 44, minWidth: 44, padding: "0 10px", border: "1px solid #6d28d9", background: "#6d28d9", color: "#fff", cursor: "pointer", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700 }}>Accept</button>
              <button type="button" onClick={() => dismissSuggestion(it.id)} aria-label={"Dismiss AI-suggested link"} style={{ flex: "none", minHeight: 44, minWidth: 44, border: "1px solid #ddd0f5", background: "#fff", color: "#64748b", cursor: "pointer", borderRadius: 8, fontSize: "0.9375rem", lineHeight: 1 }}>{String.fromCharCode(0x00d7)}</button>
            </span>
          ))}
        </div>
      )}

      {/* Body: No.138 U2 - the two-panel study desk, float layer, pinned strip,
          slide-over and bottom sheet - JSX moved verbatim to ./review/Desk.jsx.
          Option 1: all state stays here and passes down as props. */}
      <Desk deskRef={deskRef} linkData={linkData} onStubActivate={onStubActivate} splitPct={splitPct} setSplitPct={setSplitPct} splitDragRef={splitDragRef} persistFloats={persistFloats} floats={floats} tab={tab} overrides={overrides} setOverrides={setOverrides} pinned={pinned} activeWin={activeWin} setActiveWin={setActiveWin} dockHover={dockHover} renderWindow={renderWindow} tearOff={tearOff} startFloatDrag={startFloatDrag} moveFloatDrag={moveFloatDrag} stopFloatDrag={stopFloatDrag} bringToFront={bringToFront} dockBack={dockBack} resetFloat={resetFloat} setPinned={setPinned} slideOpen={slideOpen} setSlideOpen={setSlideOpen} sheet={sheet} setSheet={setSheet} sheetCloseRef={sheetCloseRef} renderSheet={renderSheet} isNarrow={isNarrow} userLinks={userLinks} linkDrag={linkDrag} autoLinks={autoLinks} suggestLinks={suggestLinks} />

      {/* P2: floating confirm for a selected phrase. onMouseDown preventDefault keeps the
          selection alive through the click; clicking arms the phrase (or completes the
          link if one end is already picked). */}
      {linkMode && phraseSel && (
        <button type="button" onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onLinkPick({ t: "phrase", block: phraseSel.block, quote: phraseSel.quote, pre: phraseSel.pre, suf: phraseSel.suf }); const s = (typeof window !== "undefined" && window.getSelection) ? window.getSelection() : null; if (s) s.removeAllRanges(); setPhraseSel(null); }}
          style={{ position: "fixed", left: Math.max(8, Math.min((typeof window !== "undefined" ? window.innerWidth : 1200) - 170, phraseSel.x - 78)), top: Math.max(8, phraseSel.y - 42), zIndex: RS_LAYERS.menu, display: "inline-flex", alignItems: "center", gap: 6, minHeight: 34, padding: "0 12px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, boxShadow: "0 6px 18px rgba(29,78,216,0.35)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 700 }}>
          <span aria-hidden="true">{String.fromCharCode(0x1f517)}</span> {linkDraft ? "Link to this phrase" : "Link this phrase"}
        </button>
      )}


      {/* Footer - +10% type (0.6875 -> 0.75625rem) + roomier padding, and the version
          tag lifted from #8595d6 (~3.3:1 on navy) to #c3cdf5 (WCAG AA). 11-07 '26. */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "9px 18px", background: "#142a8e", lineHeight: 1.5 }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75625rem", color: "#dbe2ff" }}>Source: {source || "MyCareersFuture"} {String.fromCharCode(0x00b7)} Confidence: {footerConf} {String.fromCharCode(0x00b7)} Time-window: snapshot at analysis</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75625rem", color: "#fff", fontWeight: 500 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</span>
          {version && <span title={"SG Career View " + version} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75625rem", color: "#c3cdf5" }}>v{version}</span>}
        </div>
      </div>
    </div>
    </>
  );
}

