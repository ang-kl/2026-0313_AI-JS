// v3 Step 3 - Review Studio (v3-ui-blueprint.md S4; v3-blueprint.md S5/S7/S10).
// A reviewable workspace: fixed header + sub-header, ribbon, a docked collapsible
// icon rail/drawer, a manuscript canvas (the job ad as an editorial page) and a right
// Visual Intelligence stack. Only the Job graph ships today - the other four visual
// types named in blueprint S10.3 (AI trace, Workflow, Value stream, Org map) were
// removed rather than left as placeholder tabs; add them back only once each is
// actually wired to real deterministic engine output. Doctrine tokens only;
// "AI-assisted; human decides".
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { loadState, saveState } from "./persist.js";

// Doctrine exposure bands (fixed order, S1.2) - colour encodes band only.
const BANDS = {
  human:     { key: "human",     label: "Human-led",       dot: "#1d4ed8", bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  assisted:  { key: "assisted",  label: "AI-assisted",     dot: "#0e7490", bg: "#e3f5fb", ink: "#0b5e74", border: "#bce6f0" },
  augmented: { key: "augmented", label: "AI-augmented",    dot: "#b45309", bg: "#fdf0dd", ink: "#92450a", border: "#f5d8a8" },
  auto:      { key: "auto",      label: "Full automation", dot: "#c2410c", bg: "#fde6da", ink: "#9a3412", border: "#f6c6ac" },
};
const PROV = {
  "from posting": { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  "from MCF":     { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  computed:       { bg: "#eef7f0", ink: "#2f7d4f", border: "#cce6d4" },
  derived:        { bg: "#f1eefc", ink: "#5b4bbd", border: "#ddd5f6" },
  "AI estimate":  { bg: "#fff4e6", ink: "#9a6113", border: "#f5dcb0" },
  // A11y (governance audit): unverified was brick-red (#a13a3a) - the one warm "danger" hue
  // outside the blue/orange ramp, and a red-vs-green tension against the computed chip. Moved
  // to the amber family (shared with "AI estimate"); the label text carries the meaning.
  unverified:     { bg: "#fff4e6", ink: "#9a6113", border: "#f5dcb0" },
};
// O-I-A lens colours (S7) and reviewer persona colours (S5.5).
const LENS = { ROLE: "#1d4ed8", ORG: "#5b4bbd", AI: "#b45309" };
const PERSONA = {
  "AI Exposure Reviewer": "#b45309", "Process Redesign Reviewer": "#5b4bbd",
  "Role Analyst": "#1d4ed8", "Candidate Advocate": "#2f7d4f", "Evidence Auditor": "#64748b",
  "Signal Auditor": "#9a6113",
};
// Tracked-span styling by exposure band (S5.2): tint + 2px underline, colour-blind safe.
const SPAN_STYLE = {
  augmented: { bg: "#fdf0dd", under: "#b45309", color: "#7a3c08" },
  auto:      { bg: "#fde6da", under: "#c2410c", color: "#7a2c08" },
  human:     { bg: "#eaf0ff", under: "#1d4ed8", color: "#1b3aa0" },
  assisted:  { bg: "#e3f5fb", under: "#0e7490", color: "#0b4f60" },
};
// Withheld span (engine did not classify): a neutral dashed "general note", no band claim.
const SPAN_STYLE_WITHHELD = { bg: "#fff3cf", under: "#d4a72c", color: "#7a5712" };
// Ribbon items are only rendered when their handler actually does something. The
// prior version listed Evidence (observed/interpreted/applied/withheld/provenance)
// plus Output (cover/resume/interview/print) as tappable pills - but their handlers
// all opened the same rail placeholder ("This drawer fills in the next build phase"),
// which is exactly the "tap without working" pattern the trust-loop canon forbids.
// Reintroduce those groups when a real cover-letter / resume / evidence-filter
// renderer exists, not before.
const RIBBON = [
  { group: "Review", key: "markup", items: [["clean", "Read clean"], ["suggestions", "Suggestions"], ["comments", "Comments"], ["dissect", "Dissect"], ["critical", "Critical read"]] },
  { group: "Visuals", key: "visual", items: [["jobgraph", "Job graph"]] },
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
const RS_RESP_RE = /^(key\s+)?(responsibilit|duties|the\s+role|role\s+(overview|description|scope)|what\s+you|day\s+to\s+day|accountabilit|your\s+role|job\s+(scope|summary|description))/i;
const RS_REQ_RE = /^(requirement|qualification|pre-?requisite|requisite|who\s+(you|we)|skills?\b|competenc|experience|education|the\s+ideal|ideal\s+candidate|minimum|preferred|nice\s+to\s+have|what\s+we\s+(look|need))/i;
const RS_HEAD_RE = /^(about|the role|role overview|role description|role scope|what you|who you|responsibilit|key responsibilit|requirement|qualification|pre-?requisite|requisite|capabilit|skills|leadership|soft skills|what we|why|benefits|your role|the opportunity|duties|experience|preferred|nice to have|we offer|job scope|job summary|job description)/i;
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
const RS_EXP_BAND = { HIGH: "auto", MEDIUM: "augmented", LOW: "assisted", HUMAN: "human" };
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
const RS_STOP = new Set(["the", "and", "for", "with", "into", "across", "various", "adhoc", "other", "duties", "support", "manage", "ensure", "provide", "drive", "deliver", "implement", "coordinate", "handle", "perform", "assist", "their", "this", "that", "from", "your", "our", "initiatives", "tasks", "work"]);
const RS_VERB = /^(develop|build|design|support|manage|ensure|provide|drive|lead|own|deliver|implement|coordinat|handle|perform|assist|analy|prepar|maintain|monitor|review|conduct|execut|create|generat|configur|process|compil|liais|advis|engage)/;
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
  if (weak) { used.add(weak.id); out.push({ id: "c-aud", persona: "Evidence Auditor", type: "withhold claim", band: null, anchor: weak.id, prov: "unverified", conf: "withheld", reason: "No measurable threshold in the posting. Withhold from any readiness score until it is evidenced in interview or a work sample." }); }
  return out.slice(0, 6);
}

// ── AI-1 click-to-analyse (spec No.135): every span/pill resolves to ONE focused O-I-A
// card in the margin. All deterministic - keywords are nucleus tokens + matched skill
// terms; routes map from the engine band; skill "how/kickstart" lines are the existing
// LLM narration and stay chipped "AI estimate". Withhold over guess throughout. ──────────
function rsTokens(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !RS_STOP.has(w));
}
const RS_ROUTE = { human: "candidate edge - bring proof you drove this to an outcome", auto: "governance check - who signs off the machine's output?", augmented: "AI-assist - human frames, verifies, owns", assisted: "AI-assist - human judgment leads" };
const RS_HALF_LIFE = { HIGH: "eroding fast - end-to-end automation is plausible", MEDIUM: "eroding - heavy augmentation pressure", LOW: "durable near-term - AI informs, human leads", HUMAN: "durable - human-led (accountability, presence, empathy)" };
function rsSpanFocus(sp, skillObjs) {
  const toks = new Set(rsTokens(sp.text));
  const invoked = skillObjs.map((o) => String(o.skill || o)).filter((n) => rsTokens(n).some((t) => toks.has(t))).slice(0, 3);
  const nuc = rsNucleus(sp.text);
  return {
    kind: "span", title: sp.sec === "req" ? "Requirement line" : "Duty span",
    obs: sp.text, obsChip: sp.sec === "req" ? "from posting" : "derived",
    obsChipLabel: sp.sec === "req" ? "from posting" : "derived · AI-extracted",
    interp: [
      sp.layer ? "Layer: " + sp.layer : null,
      sp.band ? "Exposure: " + (BANDS[sp.band] ? BANDS[sp.band].label : sp.band) + " (engine rule)" : "Exposure: withheld - the engine did not classify this line",
      nuc ? "Keywords: " + nuc.phrase : null,
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
  const invokedBy = (spans || []).filter((sp) => sp.sec !== "req" && rsTokens(sp.text).some((t) => toks.has(t))).slice(0, 2);
  const lvl = o.level || null;
  const hasNarration = !!(o.h || o.k);
  return {
    kind: "skill", title: "Skill",
    obs: name, obsChip: o.escoUri ? "computed" : "derived",
    obsChipLabel: o.escoUri ? "ESCO-mapped" : "derived",
    interp: [
      lvl ? "AI-exposure level: " + lvl + " (engine)" : "AI-exposure level: withheld",
      lvl ? "Half-life read: " + (RS_HALF_LIFE[lvl] || "withheld") : null,
      invokedBy.length ? "Invoked by: " + invokedBy.map((sp) => String.fromCharCode(0x201c) + sp.text.slice(0, 60) + (sp.text.length > 60 ? String.fromCharCode(0x2026) : "") + String.fromCharCode(0x201d)).join(" · ") : "Invoked by: no duty line matches this skill's terms in this ad",
    ].filter(Boolean),
    interpChip: lvl ? "computed" : "unverified",
    appl: hasNarration ? [o.h, o.k].filter(Boolean).join(" · ") : (lvl ? RS_HALF_LIFE[lvl] : "Withheld - no engine signal for this skill."),
    applChip: hasNarration ? "AI estimate" : "computed",
  };
}
// ── Critical Read: plain-language / hype audit (deterministic, verbatim-only). §6.3 Forensic
// Reversal + "word noodles". Scans the FULL ad copy - empty phrasing lives in the intro/benefits/
// salary lines, not the duty spans. Every finding is a verbatim substring of the posting; when
// there is no text, we render nothing (withhold over guess). No LLM. ─────────────────────────
const RS_DOT = String.fromCharCode(0x00b7);
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
const RS_SEC_MAP = [
  [/^(about|overview|role overview|the role|about the role|purpose|summary|who we are|about us|company)/i, "Role overview"],
  [/^(responsibilit|duties|what you.{0,3}ll do|what you will do|key accountabilit|the job|your role|job description|roles?\s*&?\s*responsibilit)/i, "Responsibilities"],
  [/^(requirement|qualif|who you are|what (?:we.{0,3}re|we are) looking|skills?\s*(?:and|&)\s*experience|ideal candidate|must have|you (?:have|bring))/i, "Requirements"],
  [/^(benefit|we offer|perks|what.{0,3}s in it|remuneration|package|why join)/i, "Benefits"],
];
function rsAdSections(adText) {
  const lines = String(adText || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const isHeading = (ln) => ln.length <= 60 && ln.split(/\s+/).length <= 7 && !/[.,;:!?]$/.test(ln) && /^[A-Za-z]/.test(ln) && !/^[-*\u2022]/.test(ln);
  const secs = []; let cur = { title: null, lines: [] };
  lines.forEach((ln) => {
    if (isHeading(ln)) { if (cur.title || cur.lines.length) secs.push(cur); cur = { title: ln, lines: [] }; }
    else cur.lines.push(ln);
  });
  if (cur.title || cur.lines.length) secs.push(cur);
  return secs.map((sec) => {
    const hit = sec.title ? RS_SEC_MAP.find(([rx]) => rx.test(sec.title)) : null;
    return { title: sec.title, lines: sec.lines, canon: hit ? hit[1] : (sec.title ? null : "Role overview") };
  });
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
const RS_NOODLES = [
  { rx: /\b(?:up to|as low as|as much as|as little as|starting (?:at|from)|from only)\b[^.?!\n]{0,44}/gi,
    cat: "unbounded figure", why: "A ceiling or floor, not the typical - technically true even if almost no one reaches it.",
    counter: (p) => String.fromCharCode(0x201c) + p + String.fromCharCode(0x201d, 0x003f) + " - up to what, and what is the actual median?" },
  { rx: /\b(?:competitive|market[-\s]?leading|world[-\s]?class|best[-\s]?in[-\s]?class|industry[-\s]?leading|cutting[-\s]?edge|second to none|unparalleled|unrivalled|unlike anything)\b[^.?!\n]{0,44}/gi,
    cat: "vague superlative", why: "A shiny word with no benchmark - the reader fills the gap with an assumption.",
    counter: (p) => String.fromCharCode(0x201c) + p + String.fromCharCode(0x201d, 0x003f) + " - competitive vs what benchmark, measured how?" },
  { rx: /\b(?:fast[-\s]?paced|dynamic environment|rock ?star|ninja|guru|wizard|wear(?:s|ing)? many hats|work hard,? play hard|hit the ground running|self[-\s]?starter|go[-\s]?getter|(?:like (?:a|one)|we are) (?:a )?(?:big )?family|passionate)\b[^.?!\n]{0,44}/gi,
    cat: "culture code", why: "Culture shorthand that often stands in for real expectations - hours, scope, or churn.",
    counter: (p) => String.fromCharCode(0x201c) + p + String.fromCharCode(0x201d, 0x003f) + " - which specific hours, hats or expectations does this hide?" },
];
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
const RS_ASPIRATION = /\b(?:will (?:help|support|contribute|assist|drive|enable|facilitate|foster|champion|spearhead|leverage|empower)|to (?:help|support|contribute|drive|enable|foster)|play (?:a|an) (?:key|central|pivotal|critical|vital|integral) role|responsible for|passion(?:ate)? (?:for|about)|committed to)\b/i;
const RS_INFLATED = /\b(?:synerg(?:y|ies|istic)|paradigm|holistic|thought leadership|value[-\s]?add|best practices|stakeholder alignment|strategic initiatives|transformational|impactful|robust solutions|end[-\s]?to[-\s]?end solutions|move the needle)\b/i;
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
const RS_VAGUE_DUTY = /\b(?:ad-?hoc|various|other duties|as (?:assigned|required|needed)|miscellaneous|support the team|any other|from time to time|when required|where necessary)\b/i;
const RS_COMPLIANCE = /\b(?:compl(?:y|iance|ies)|adhere|conform|in accordance with|as per (?:the )?(?:policy|policies|guidelines|sop)|regulatory|statutory|ensure (?:all )?(?:compliance|adherence))\b/i;
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
      interp: "Two roles may be packed into one hire - common when a team is understaffed.",
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
const RS_BLIND_CHECKS = [
  { id: "bs-salary", label: "salary", rx: /\b(?:s?\$\s?\d|salary|remuneration|per (?:month|annum)|\d+k\b)/i, ask: "What is the actual pay band? 'Competitive' is not a number." },
  { id: "bs-report", label: "reporting line", rx: /\breport(?:s|ing)?\s+(?:directly\s+)?to\b/i, ask: "Who does this role report to - a named function or a vacuum?" },
  { id: "bs-team", label: "team size", rx: /\bteam of\s+\d|\bteam size\b|\bjoin(?:ing)? (?:a|our) \d+/i, ask: "How many people share this work today?" },
  { id: "bs-metrics", label: "success metrics", rx: /\b(?:kpi|okr|success (?:will be )?measured|measurable|targets?\b|quota)\b/i, ask: "How is success measured in the first year?" },
  { id: "bs-growth", label: "growth path", rx: /\b(?:career (?:path|progression|development)|promotion|progression|advancement|learning budget|training)\b/i, ask: "Where does this role lead in 2-3 years?" },
  { id: "bs-workmode", label: "work arrangement", rx: /\b(?:hybrid|remote|on-?site|work from home|wfh|office-based)\b/i, ask: "Hybrid, remote or on-site - why is it not stated?" },
];
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
const RS_DOMAINS = {
  "data engineering": ["data", "pipeline", "pipelines", "warehouse", "lake", "etl", "elt", "analytics", "database", "databases", "model", "models", "python", "streaming"],
  "quality & compliance": ["iso", "cgmp", "gmp", "audit", "audits", "compliance", "sop", "sops", "quality", "regulatory", "validation", "documentation"],
  "facilities & operations": ["facility", "facilities", "vendor", "vendors", "sla", "slas", "maintenance", "premises", "contractor", "fm"],
  "sales & marketing": ["sales", "revenue", "clients", "accounts", "marketing", "campaign", "b2b", "quota", "leads"],
  "people & hr": ["recruitment", "onboarding", "payroll", "talent", "employee", "employees", "hr"],
};
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
function rsIndicators(result) {
  const rdd = result && result.responsibilitiesData;
  const jobs = (rdd && Array.isArray(rdd.jobs)) ? rdd.jobs : [];
  if (jobs.length < 3) return [];
  const out = [];
  const key = (j) => (String(j.title || "").toLowerCase().trim() + "|" + String(j.postedCompany && j.postedCompany.name || j.companyName || "").toLowerCase().trim());
  const dupes = {};
  jobs.forEach((j) => { const k = key(j); dupes[k] = (dupes[k] || 0) + 1; });
  const maxDupe = Math.max(...Object.values(dupes));
  if (maxDupe >= 3) out.push({ id: "ind-repost", label: "repost pattern", obs: maxDupe + " near-identical ads (same title + employer) in the " + jobs.length + " sampled", why: "Repeated posting of the same role often signals churn, an always-open req, or pipeline building rather than one vacancy.", move: "Ask how long the position has been open and why." });
  const withSalary = jobs.filter((j) => j.salaryMin || j.salaryMax || (j.salary && (j.salary.minimum || j.salary.maximum))).length;
  const pct = Math.round((withSalary / jobs.length) * 100);
  if (pct <= 40) out.push({ id: "ind-salary", label: "salary opacity", obs: withSalary + " of " + jobs.length + " sampled ads state a salary (" + pct + "%)", why: "Low disclosure in this market segment weakens your negotiating baseline.", move: "Anchor on the ads that DO state a band before naming your number." });
  return out;
}
function buildCriticalRead(result, spans, title, posting) {
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
  return { adText, noodles: rsSignalNoise(adText), forensic: rsForensicReversal(adText), falsification: rsFalsification(effSpans, title, adText), hiringFilter: rsHiringFilter(adText, firstJob), blindSpots: rsBlindSpots(adText, firstJob), contradictions: rsContradictions(effSpans, title), qoi: rsQoI(effSpans), indicators: rsIndicators(result) };
}
// One O-I-A finding card (Observation -> Interpretation -> Application), reused by every
// Critical-Read lens. Verbatim observation, deterministic interpretation, a counter-move to apply.
function CritCard({ tag, obs, interp, appl, persona, accent, obsChip }) {
  const ac = accent || "#9a6113";
  const who = persona || "SIGNAL AUDITOR";
  const oc = obsChip || "from posting";
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: ac, borderRadius: 4, padding: "2px 7px" }}>{String(tag).toUpperCase()}</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#8a8274" }}>{who}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
          <div style={oiaKick}>OBSERVATION</div>
          <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 8px" }}>{String.fromCharCode(0x201c)}{obs}{String.fromCharCode(0x201d)}</p>
          <Chip kind={oc}>{oc}</Chip>
        </div>
        <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
          <div style={oiaKick}>INTERPRETATION</div>
          <p style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{interp}</p>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#5b4bbd" }}>method {RS_DOT} rule (deterministic) {RS_DOT} conf moderate</span>
        </div>
        <div style={{ padding: "12px 13px" }}>
          <div style={oiaKick}>APPLICATION</div>
          <p style={{ fontSize: "0.8125rem", color: "#16202e", fontWeight: 600, lineHeight: 1.5, margin: "0 0 8px" }}>{appl}</p>
          <Chip kind="derived">derived</Chip>
        </div>
      </div>
    </div>
  );
}
// Advisory (LLM) card for the batched Critical Read pass - devil's advocate, teleology,
// pro-worker, real-demand. Clearly tagged "AI estimate - advisory": it challenges, it never
// authors a number or overrides the engine's read.
function AdvisoryCard({ persona, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f5dcb0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fff9f0", borderBottom: "1px solid #f5e6cc" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: "#9a6113", borderRadius: 4, padding: "2px 7px" }}>{persona}</span>
        <Chip kind="AI estimate">AI estimate {String.fromCharCode(0x00b7)} advisory</Chip>
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function Chip({ kind, children }) {
  const p = PROV[kind] || PROV.computed;
  return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: p.ink, background: p.bg, border: "1px solid " + p.border, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{children}</span>;
}

export default function ReviewStudio({ result, title, employer, source, rolePane, band, onBack, version, posting, onRetryDuties }) {
  const [markup, setMarkup] = useState("suggestions");
  const [visual, setVisual] = useState("jobgraph");
  const [rail, setRail] = useState(null);      // open drawer key or null
  // Rail starts collapsed on narrow viewports (phones) - open by default on
  // desktop is fine there, but on an iPhone the 150px expanded rail alone eats
  // over a third of the screen before the manuscript/margin panes are even
  // considered. Lazy-init so this reads the real viewport once, not on every render.
  const [railOpen, setRailOpen] = useState(() => (typeof window === "undefined" || window.innerWidth >= 860));
  const [activeSpan, setActiveSpan] = useState(null);
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
  const critical = useMemo(() => buildCriticalRead(result, dissection.spans, title, posting), [result, dissection.spans, title, posting]);
  const cr = result && result.criticalRead; // batched advisory LLM pass (may still be loading -> null)
  const spanBand = {}; dissection.spans.forEach((s) => { spanBand[s.id] = s.band; });
  // Honest overall confidence: high when every duty was engine-classified, withheld when none,
  // else "N of M classified" - never a flat confident number over unclassified spans.
  const _classified = dissection.spans.filter((s) => s.band).length;
  const footerConf = dissection.spans.length === 0 ? "withheld" : _classified === dissection.spans.length ? "high (engine-classified)" : _classified === 0 ? "withheld" : _classified + " of " + dissection.spans.length + " duties classified";
  const showClean = markup === "clean";
  const showDissect = markup === "dissect";
  const showCritical = markup === "critical";
  const showMargin = markup === "suggestions" || markup === "comments";
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

  const ribbonActive = (groupKey, k) => (groupKey === "markup" && markup === k) || (groupKey === "visual" && visual === k);
  function ribbonClick(groupKey, k) {
    if (groupKey === "markup") setMarkup(k);
    else if (groupKey === "visual") setVisual(k);
  }

  const pillStyle = (active) => ({ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 36, borderRadius: 6, padding: "5px 10px", background: active ? "#142a8e" : "#fff", color: active ? "#fff" : "#3a4456", border: "1px solid " + (active ? "#142a8e" : "#e2e0d8") });

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
      @media (max-width: 860px) {
        .wis-manuscript { flex: 1 1 100% !important; min-width: 0 !important; }
        /* top:0/bottom:0/z-index:999 matches the drawer pattern already established
           elsewhere in the app (App.jsx's CV-fit drawer) - covers the sticky headers
           entirely rather than guessing their combined height, which is how an
           earlier version of this fix hid its own close button behind them. */
        .wis-drawer, .wis-margin {
          position: fixed !important; top: 0; right: 0; bottom: 0; z-index: 999;
          width: min(88vw, 340px) !important;
          box-shadow: -8px 0 24px rgba(20,32,46,.18);
        }
        .wis-margin-close { display: inline-flex !important; align-items: center; justify-content: center; }
      }
    `}</style>
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 50px)", background: "#e9edf3" }}>
      {/* Sub-header (fixed, does not scroll) */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, flex: "none", display: "flex", alignItems: "center", gap: 18, padding: "11px 18px", background: "#fbfaf8", borderBottom: "1px solid #e2e0d8" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans',sans-serif", fontWeight: 500, fontSize: "0.8125rem", flex: "none" }}><span aria-hidden="true">&#8592;</span> Postings</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".14em", color: "#8a8274" }}>REVIEWING</span>
            <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"}</Chip>
          </div>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.0625rem", color: "#16202e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{title || "this role"}</div>
          {/* Step 1's picker discloses when a typed prefix/alt title ("Deputy CEO") was
              mapped to a canonical ESCO title for the skills fetch - that disclosure must
              not silently vanish by Step 3. */}
          {result && result.escoCanonicalTitle && (
            <div style={{ fontSize: "0.6875rem", color: "#8a8274", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Skills resolved via the closest ESCO term: <strong style={{ color: "#5a5548" }}>{result.escoCanonicalTitle}</strong></div>
          )}
        </div>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
          {bandTok && <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 6, padding: "4px 9px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: bandTok.dot }} />{bandTok.label}</span>}
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#64748b", background: "#fff", border: "1px solid #e6e3db", borderRadius: 6, padding: "4px 9px" }}>{duties.length} duties {String.fromCharCode(0x00b7)} {skills.length} skills</span>
        </div>
      </div>

      {/* Ribbon */}
      <div className="wis-scroll" style={{ flex: "none", display: "flex", alignItems: "stretch", padding: "8px 14px", background: "#fff", borderBottom: "1px solid #eceae2", overflowX: "auto" }}>
        {RIBBON.map((g) => (
          <div key={g.group} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 16px", borderRight: "1px solid #f0eee7" }}>
            <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".14em", color: "#b3ab9c" }}>{g.group.toUpperCase()}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {g.items.map(([k, lbl]) => (
                <button key={k} type="button" aria-pressed={ribbonActive(g.key, k)} onClick={() => ribbonClick(g.key, k)} style={pillStyle(ribbonActive(g.key, k))}>{lbl}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Provenance legend (governance audit): the chip vocabulary used across Suggestions /
          Dissect / Critical read, explained once. Colour assists; the label carries the meaning. */}
      <div className="wis-scroll" style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#fbfaf7", borderBottom: "1px solid #eceae2", overflowX: "auto" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".13em", color: "#b3ab9c", flexShrink: 0 }}>CHIP KEY</span>
        {[["from posting", "verbatim ad text"], ["computed", "engine, deterministic"], ["derived", "rule-based inference"], ["AI estimate", "LLM advisory, not fact"], ["unverified", "no source confirmed"]].map(([k, gloss]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, color: PROV[k].ink, background: PROV[k].bg, border: `1px solid ${PROV[k].border}`, borderRadius: 4, padding: "1px 6px" }}>{k}</span>
            <span style={{ fontSize: "0.625rem", color: "#8a8274" }}>= {gloss}</span>
          </span>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left icon rail (docked, collapsible; does not move) */}
        <nav style={{ flex: "none", width: railOpen ? 150 : 54, background: "#f4f6fa", borderRight: "1px solid #e2e0d8", padding: "12px 9px", display: "flex", flexDirection: "column", gap: 3, transition: "width .15s" }}>
          <button onClick={() => setRailOpen((o) => !o)} aria-label={railOpen ? "Collapse rail" : "Expand rail"} style={{ alignSelf: railOpen ? "flex-end" : "center", minHeight: 44, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 8, cursor: "pointer", color: "#64748b", marginBottom: 4 }}>{railOpen ? String.fromCharCode(0x00ab) : String.fromCharCode(0x00bb)}</button>
          {RAIL.map((r) => { const on = rail === r.key; return (
            <button key={r.key} onClick={() => setRail(on ? null : r.key)} title={r.label} aria-pressed={on} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: railOpen ? "flex-start" : "center", cursor: "pointer", textAlign: "left", background: on ? "#eef2ff" : "transparent", color: on ? "#142a8e" : "#5b6b7f", border: "1px solid " + (on ? "#cdd9ff" : "transparent"), borderRadius: 8, padding: "8px 10px", minHeight: 44, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 500 }}>
              <span aria-hidden="true" style={{ fontSize: 15, width: 16, textAlign: "center", flex: "none" }}>{r.icon}</span>{railOpen && r.label}
            </button>
          ); })}
          {railOpen && <div style={{ marginTop: "auto", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#a8b0bd", lineHeight: 1.5, padding: "8px 6px 2px" }}>local + cloud</div>}
        </nav>

        {/* Drawer (floats over the canvas; collapses to the rail). Portals to
            document.body on mobile - see the isNarrow comment above for why. */}
        {rail && (() => {
          const drawer = (
            <aside className="wis-scroll wis-drawer" style={{ flex: "none", width: 300, background: "#fbfaf8", borderRight: "1px solid #e2e0d8", padding: "16px 15px", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".13em", color: "#8a8274" }}>{(RAIL.find((r) => r.key === rail) || {}).label?.toUpperCase()}</div>
                <button onClick={() => setRail(null)} aria-label="Close drawer" style={{ minHeight: 44, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55 }}>This drawer fills in the next build phase. Each note will cite the manuscript line that triggered it - it helps you decide, it never decides for you.</p>
              <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#2f7d4f", marginTop: 12 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</p>
            </aside>
          );
          return isNarrow ? createPortal(drawer, document.body) : drawer;
        })()}

        {/* Left: manuscript (spans), O-I-A dissection, or Critical Read */}
        <div className="wis-scroll wis-manuscript" style={{ flex: (showDissect || showCritical) ? "1 1 0" : "0 0 clamp(340px, 36%, 640px)", minWidth: 0, overflowY: "auto", padding: "22px 22px 60px", background: "#e9edf3" }}>
          {showCritical ? (
            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".16em", color: "#8a8274", marginBottom: 6 }}>CRITICAL READ {RS_DOT} PLAIN-LANGUAGE CHECK</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>What the ad says {String.fromCharCode(0x2192)} what it leaves empty</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Deterministic and verbatim-only: every flag is a phrase lifted straight from the posting. Empty or inflated wording gets a plain-language counter - the &quot;question-mark move&quot;.</p>
              {critical.noodles.length > 0 && <>
                <h3 style={critH3}>Word noodles {RS_DOT} shiny but empty</h3>
                {critical.noodles.map((n) => <CritCard key={n.id} tag={n.cat} obs={n.phrase} interp={n.why} appl={n.counter} />)}
              </>}
              {critical.forensic.length > 0 && <>
                <h3 style={critH3}>Forensic reversal {RS_DOT} aspiration vs evidence</h3>
                {critical.forensic.map((f) => <CritCard key={f.id} tag="aspiration" obs={f.phrase} interp={f.why} appl={f.counter} />)}
              </>}
              {critical.blindSpots && critical.blindSpots.length > 0 && <>
                <h3 style={critH3}>Blind spots {RS_DOT} what the ad does not say</h3>
                {critical.blindSpots.map((b) => <CritCard key={b.id} tag={b.label} obs={"The ad is silent on " + b.label + "."} interp={"Checked the full ad text for any mention - none found. Silence on " + b.label + " is information: it is either unsettled or unfavourable."} appl={b.ask} persona="BLIND-SPOT SCAN" accent="#5b4bbd" obsChip="computed" />)}
              </>}
              {critical.contradictions && critical.contradictions.length > 0 && <>
                <h3 style={critH3}>Contradictions {RS_DOT} lines that do not belong</h3>
                {critical.contradictions.map((x) => <CritCard key={x.id} tag="mash-up" obs={x.obs} interp={"This line reads as " + x.foreign + ", but the ad's majority domain is " + x.majority + " - a role mash-up or template splice."} appl="Ask which of the two jobs the hire actually owns - and which one performance is judged on." persona="CONTRADICTION SCAN" accent="#0e7490" obsChip="derived" />)}
              </>}
              {critical.qoi && critical.qoi.length > 0 && <>
                <h3 style={critH3}>Quality of information {RS_DOT} can each claim be tested?</h3>
                {critical.qoi.map((q) => <CritCard key={q.id} tag={q.grade} obs={q.text} interp={q.why} appl={q.move} persona="QoI CHECK" accent={q.grade === "verifiable" ? "#1d4ed8" : "#9a6113"} obsChip="from posting" />)}
              </>}
              {critical.indicators && critical.indicators.length > 0 && <>
                <h3 style={critH3}>Indicators {RS_DOT} signals in the sampled market</h3>
                {critical.indicators.map((x) => <CritCard key={x.id} tag={x.label} obs={x.obs} interp={x.why} appl={x.move} persona="INDICATORS" accent="#0e7490" obsChip="computed" />)}
              </>}
              {critical.falsification.length > 0 && <>
                <h3 style={critH3}>Falsification {RS_DOT} before you trust this read</h3>
                {critical.falsification.map((f) => <CritCard key={f.id} tag={f.tag} obs={f.obs} interp={f.interp} appl={f.appl} persona="FALSIFICATION LENS" accent="#5b4bbd" obsChip="computed" />)}
              </>}
              {cr && (
                (cr.devilsAdvocate && (cr.devilsAdvocate.counterCase || (cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length))) ||
                cr.realDemand || (cr.teleology && (cr.teleology.whyExists || cr.teleology.problem)) ||
                (cr.proWorker && (cr.proWorker.verdict || cr.proWorker.reasoning))
              ) && <>
                <h3 style={critH3}>Deep read {RS_DOT} challenged</h3>
                {cr.devilsAdvocate && (cr.devilsAdvocate.counterCase || (cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length > 0)) && (
                  <AdvisoryCard persona="SKEPTIC / DEVIL'S ADVOCATE">
                    {cr.devilsAdvocate.counterCase && <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.devilsAdvocate.counterCase}</p>}
                    {cr.devilsAdvocate.challenges && cr.devilsAdvocate.challenges.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{cr.devilsAdvocate.challenges.map((c, i) => <li key={i} style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, marginBottom: 4 }}>{c}</li>)}</ul>}
                  </AdvisoryCard>
                )}
                {cr.realDemand && (
                  <AdvisoryCard persona="FALSIFICATION / REAL DEMAND">
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.realDemand}</p>
                  </AdvisoryCard>
                )}
                {cr.teleology && (cr.teleology.whyExists || cr.teleology.problem) && (
                  <AdvisoryCard persona="VACANCY TELEOLOGY">
                    {cr.teleology.whyExists && <p style={{ margin: "0 0 6px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}><strong style={{ color: "#16202e" }}>Why this job exists:</strong> {cr.teleology.whyExists}</p>}
                    {cr.teleology.problem && <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}><strong style={{ color: "#16202e" }}>Problem it solves:</strong> {cr.teleology.problem}</p>}
                  </AdvisoryCard>
                )}
                {cr.proWorker && (cr.proWorker.verdict || cr.proWorker.reasoning) && (
                  <AdvisoryCard persona="PRO-WORKER TEST">
                    {cr.proWorker.verdict && <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#16202e" }}>verdict {RS_DOT} <strong style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>{cr.proWorker.verdict}</strong></p>}
                    {cr.proWorker.reasoning && <p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.proWorker.reasoning}</p>}
                  </AdvisoryCard>
                )}
              </>}
              {(critical.hiringFilter.length > 0 || (cr && cr.hiring && (cr.hiring.recruiter || cr.hiring.hiringManager || cr.hiring.interviewCoach))) && <>
                <h3 style={critH3}>The other side of the table</h3>
                {critical.hiringFilter.map((h) => <CritCard key={h.id} tag={h.label} obs={h.obs} interp={h.why} appl="Meet it, show the equivalent, or expect an auto-reject before a human reads your CV." persona="HIRING FILTER" accent="#0e7490" obsChip={h.obsChip || "from posting"} />)}
                {cr && cr.hiring && cr.hiring.recruiter && <AdvisoryCard persona="RECRUITER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.recruiter}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.hiringManager && <AdvisoryCard persona="HIRING MANAGER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.hiringManager}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.interviewCoach && <AdvisoryCard persona="INTERVIEW COACH"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.interviewCoach}</p></AdvisoryCard>}
              </>}
              {!critical.noodles.length && !critical.forensic.length && !critical.falsification.length && !critical.hiringFilter.length && !(critical.blindSpots && critical.blindSpots.length) && !(critical.contradictions && critical.contradictions.length) && !(critical.qoi && critical.qoi.length) && !(critical.indicators && critical.indicators.length) && !cr && <p style={manuP}>{critical.adText ? "This posting reads plainly - no empty phrasing, inflated language, or template/mash-up/compliance signals flagged. The challenged deep read (AI-assisted) appears here once it finishes." : "No posting text available to run the plain-language check."}</p>}
            </div>
          ) : showDissect ? (
            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".16em", color: "#8a8274", marginBottom: 6 }}>JOB AD DISSECTION {String.fromCharCode(0x00b7)} O-I-A LENS</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>Observation {String.fromCharCode(0x2192)} Interpretation {String.fromCharCode(0x2192)} Application</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Nothing is interpreted that was not first observed; nothing applied that was not first interpreted. Every read traces back to a verbatim span.</p>
              {dissection.spans.map((s) => { const b = BANDS[s.band]; const lc = LENS[s.lens]; return (
                <div key={s.id} style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: lc, borderRadius: 4, padding: "2px 7px" }}>{s.lens} LENS</span>
                    {b && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: b.ink, background: b.bg, border: "1px solid " + b.border, borderRadius: 5, padding: "1px 7px" }}>{b.label}</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>OBSERVATION</div>
                      <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 8px" }}>{String.fromCharCode(0x201c)}{s.text}{String.fromCharCode(0x201d)}</p>
                      {/* s.text is an AI-extracted duty (jobAnatomy / responsibilitiesData
                          from the LLM's normalise-and-dedupe pass, App.jsx SYSTEM_RESP), not
                          verbatim posting text - so the chip must not say "from posting".
                          Trust-loop rule 4. */}
                      <Chip kind="derived">derived · AI-extracted</Chip>
                    </div>
                    <div style={{ padding: "12px 13px", borderRight: "1px solid #f0eee7" }}>
                      <div style={oiaKick}>INTERPRETATION</div>
                      <p style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{s.layer ? s.layer + " work; " : ""}{b ? <>exposure reads <strong style={{ color: b.ink }}>{b.label}</strong>.</> : <>exposure <strong style={{ color: "#9a6113" }}>withheld</strong> - the engine did not classify this duty.</>}</p>
                      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#5b4bbd" }}>method {String.fromCharCode(0x00b7)} {s.exposure ? "rule (engine)" : "none"} {String.fromCharCode(0x00b7)} conf {s.exposure ? "high" : "withheld"}</span>
                    </div>
                    <div style={{ padding: "12px 13px" }}>
                      <div style={oiaKick}>APPLICATION</div>
                      <p style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{b ? <>AIOE: {b.label} {String.fromCharCode(0x00b7)} route {String.fromCharCode(0x2192)} {s.band === "human" ? "candidate edge (proof)" : s.band === "auto" ? "governance check" : "AI-assist, human verify"}</> : <>AIOE withheld {String.fromCharCode(0x00b7)} no route emitted</>}</p>
                      <Chip kind={b ? "computed" : "unverified"}>{b ? "computed" : "unverified"}</Chip>
                    </div>
                  </div>
                </div>
              ); })}
              {!dissection.spans.length && <p style={manuP}>No duty spans to dissect yet.</p>}
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "28px 30px 34px", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".16em", color: "#8a8274", marginBottom: 8 }}>MANUSCRIPT {String.fromCharCode(0x00b7)} {(employer || "LIVE POSTING").toUpperCase()}</div>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.55rem", lineHeight: 1.18, color: "#16202e", margin: "0 0 10px" }}>{title || "this role"}</h1>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {/* Chip scopes to the overview paragraph only. The Responsibilities heading
                    below carries its OWN provenance chip so a page mixing verbatim intro +
                    synthesis bullets never lies about either half. Trust-loop rule 4. */}
                <Chip kind={hasVerbatimOverview ? "from MCF" : "AI estimate"}>{String.fromCharCode(0x25cf)} {source || "from MCF"} {String.fromCharCode(0x00b7)} overview {hasVerbatimOverview ? "verbatim" : "synthesis · AI-authored"}</Chip>
                {bandTok && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 5, padding: "2px 7px" }}>{bandTok.label}</span>}
              </div>
              {/* Composite (PR #306 x v3.0.228): verbatim-first overview (trust-loop rule 4 -
                  posting's own words when present, skill terms underlined for emphasis only),
                  falling back to the sectioniser, then the ESCO taxonomy description (verbatim,
                  deterministic - the role path's real data when no live ads exist), then the
                  corpus summary. */}
              {(() => {
                if (hasVerbatimOverview) return <><h2 style={manuH2}>Role overview</h2><p style={manuP}>{rsUnderlineSkillTerms(overview, skillTermRe)}</p></>;
                const ov = adSections.find((sec) => sec.canon === "Role overview" && sec.lines.length > 0);
                if (ov) return <><h2 style={manuH2}>Role overview</h2>{ov.lines.map((ln, i) => <p key={i} style={manuP}>{rsUnderlineSkillTerms(ln, skillTermRe)}</p>)}</>;
                if (overview) return <><h2 style={manuH2}>Role overview</h2><p style={manuP}>{overview}</p></>;
                const escoDesc = String((result && result.description) || "").trim();
                if (escoDesc) return <><h2 style={manuH2}>Role overview <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · ESCO taxonomy</span></h2><p style={manuP}>{rsUnderlineSkillTerms(escoDesc, skillTermRe)}</p></>;
                return null;
              })()}
              {/* LOOP-1 diagnosis (Human Lead: "step 3 keeps having issues to show ads and
                  diagnosis"): when the live-postings pipeline fell back, SAY WHY - the reason
                  was previously swallowed and the page just went quiet. Deterministic reason
                  map + retry, never a silent dead end. */}
              {(() => {
                const rdd = result && result.responsibilitiesData;
                if (!rdd || !rdd.fallback) return null;
                const REASONS = {
                  no_jobs: "No live SG postings found for this title right now (MyCareersFuture + careers.gov.sg were searched).",
                  mcf_error: "The live-postings fetch failed (network or source error).",
                  thin_corpus: "Live ads were found, but their text was too thin to analyse" + (rdd.jobCount ? " (" + rdd.jobCount + " ad" + (rdd.jobCount === 1 ? "" : "s") + " sampled)" : "") + ".",
                  analysis_error: "The duty-analysis step failed on the sampled ads.",
                  empty_analysis: "The analysis returned no usable duty lines from the sampled ads.",
                };
                return (
                  <div style={{ background: "#fdf3dc", border: "1px solid #f0e1b3", borderRadius: 10, padding: "12px 14px", margin: "0 0 18px" }}>
                    <p style={{ margin: "0 0 4px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", color: "#7a5a17" }}>WHY THERE ARE NO DUTY LINES HERE</p>
                    <p style={{ margin: "0 0 8px", fontSize: "0.8125rem", color: "#7a5a17", lineHeight: 1.55 }}>{REASONS[rdd.reason] || "The live-postings pipeline returned no duties (reason: " + (rdd.reason || "unknown") + ")."} The skills below and the taxonomy overview above are still real, named-source data.</p>
                    {onRetryDuties && (
                      <button type="button" onClick={onRetryDuties} style={{ minHeight: 44, padding: "8px 14px", borderRadius: 8, border: "1px solid #d9b96a", background: "#fff", color: "#7a5a17", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>Retry live postings</button>
                    )}
                  </div>
                );
              })()}
              {dissection.spans.filter((x) => x.sec !== "req").length > 0 && <>
                {/* Interactive duty spans (nucleus highlights, band-styled, tappable) - the
                    text is AI-extracted (jobAnatomy normalise pass), so the heading chip says
                    so rather than claiming verbatim. Trust-loop rule 4. */}
                <h2 style={manuH2}>Responsibilities <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, color: "#9a6113", background: "#fff4e6", border: "1px solid #f5dcb0", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>AI-extracted · tap a phrase</span></h2>
                <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                  {dissection.spans.filter((x) => x.sec !== "req").map((s) => {
                    if (showClean) return <li key={s.id} style={{ ...manuP, marginBottom: 7 }}>{s.text}</li>;
                    const withheld = !s.band; const st = s.band ? SPAN_STYLE[s.band] : SPAN_STYLE_WITHHELD; const on = activeSpan === s.id;
                    // RS-NUC (design standard): highlight the salient PHRASE, not the whole
                    // line - a page of full-line underlines reads as noise and fake links.
                    const nuc = rsNucleus(s.text);
                    const mark = (
                      <span role="button" tabIndex={0} aria-pressed={on}
                        aria-label={s.text + ". " + (withheld ? "Exposure withheld." : (BANDS[s.band] ? "Exposure " + BANDS[s.band].label + "." : ""))}
                        title={withheld ? "Exposure withheld - the engine did not classify this duty" : (BANDS[s.band] ? BANDS[s.band].label : "")}
                        onClick={() => setActiveSpan(on ? null : s.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : s.id); } }}
                        style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px " + (withheld ? "dashed " : "solid ") + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{nuc ? nuc.phrase : s.text}</span>
                    );
                    return (
                      <li key={s.id} style={{ ...manuP, marginBottom: 8 }}>
                        {nuc ? <>{nuc.pre ? nuc.pre + " " : ""}{mark}{nuc.post ? " " + nuc.post : ""}</> : mark}
                      </li>
                    );
                  })}
                </ul>
              </>}
              {/* RS-SEC: the ad's OTHER sections (Requirements, Qualifications, Benefits, and any
                  section the ad names itself) - verbatim, with the ad's own heading + a chip that
                  says so; skill terms underlined for emphasis (words untouched). Requirement
                  lines that joined the analysis are tappable like duties (exposure withheld). */}
              {adSections.filter((sec) => sec.canon !== "Role overview" && sec.canon !== "Responsibilities" && sec.lines.length > 0).map((sec, si) => (
                <div key={"sec" + si}>
                  <h2 style={manuH2}>{sec.canon || sec.title} <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · from posting</span></h2>
                  <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                    {sec.lines.map((ln, li) => {
                      const sp = dissection.spans.find((x) => x.sec === "req" && x.text === ln);
                      if (!sp || showClean) return <li key={li} style={{ ...manuP, marginBottom: 7 }}>{rsUnderlineSkillTerms(ln, skillTermRe)}</li>;
                      const on = activeSpan === sp.id; const nuc = rsNucleus(ln); const st = SPAN_STYLE_WITHHELD;
                      const mark = (
                        <span role="button" tabIndex={0} aria-pressed={on}
                          aria-label={ln + ". In the analysis; exposure withheld (requirements are not duty spans)."}
                          title="In the analysis - exposure withheld (the engine classifies duties only)"
                          onClick={() => setActiveSpan(on ? null : sp.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : sp.id); } }}
                          style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px dashed " + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{nuc ? nuc.phrase : ln}</span>
                      );
                      return <li key={li} style={{ ...manuP, marginBottom: 8 }}>{nuc ? <>{nuc.pre ? nuc.pre + " " : ""}{mark}{nuc.post ? " " + nuc.post : ""}</> : mark}</li>;
                    })}
                  </ul>
                </div>
              ))}
              {skills.length > 0 && <>
                <h2 style={manuH2}>Skills the posting asks for <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>tap a skill to analyse</span>
                  {/* W2: say HOW the skill set was anchored - SG-first when SSOC steered it. */}
                  {result && result.ssocResolution && <span title={"Occupation resolved in SSOC 2024 (" + result.ssocResolution.code + " " + result.ssocResolution.title + ", confidence " + result.ssocResolution.confidence + "), crosswalked to ISCO-08 " + result.ssocResolution.iscoTitle + ", then ESCO skills fetched on that clean occupation name - not a blind title match."} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, color: "#2f7d4f", background: "#eef7f0", border: "1px solid #cce6d4", borderRadius: 5, padding: "1px 6px", marginLeft: 6, verticalAlign: "middle" }}>{String.fromCodePoint(0x1f1f8, 0x1f1ec)} anchored via SSOC {result.ssocResolution.code}</span>}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 24).map((s, i) => { const on = focusSkill === i; return (
                  <button key={i} type="button" aria-pressed={on} aria-label={"Analyse skill: " + s}
                    onClick={() => { setFocusSkill(on ? null : i); if (!on) setActiveSpan(null); }}
                    style={{ minHeight: 44, fontSize: "0.8125rem", fontFamily: "inherit", color: on ? "#fff" : "#0b5e74", background: on ? "#0e7490" : "#e3f5fb", border: "1px solid " + (on ? "#0e7490" : "#bce6f0"), borderRadius: 14, padding: "6px 12px", cursor: "pointer" }}>{s}</button>
                ); })}</div>
              </>}
              {!overview && !dissection.spans.length && <p style={manuP}>The analysed posting did not yield responsibilities text to render as a manuscript.</p>}
            </div>
          )}
        </div>

        {/* Comment margin (Suggestions / Comments modes). On narrow screens this pane is a
            fixed overlay covering the manuscript - render it there ONLY when it has content
            (comments or a focus card); an empty grey sheet over the page is worse than
            nothing (live mobile report, 07-07 '26). */}
        {showMargin && (!isNarrow || marginComments.length > 0 || activeSpan || focusSkill != null) && (() => {
          const margin = (
          <aside className="wis-scroll wis-margin" style={{ flex: "none", width: 312, background: "#f4f6fa", borderLeft: "1px solid #e2e0d8", overflowY: "auto", padding: "16px 14px 40px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".13em", color: "#8a8274" }}>REVIEWER COMMENTS</span>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#a8a193" }}>{marginComments.length}</span>
              {/* Mobile-only: this panel becomes a fixed overlay below 860px (see the
                  .wis-margin media query above) - it needs its own close affordance
                  there since the desktop dismissal (switch ribbon tabs) sits under it. */}
              <button onClick={() => setMarkup("clean")} aria-label="Close reviewer comments" title="Close" className="wis-margin-close" style={{ display: "none", marginLeft: "auto", minHeight: 44, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
            </div>
            {/* AI-1: focused O-I-A card for the tapped span/pill - the "door" every element opens. */}
            {(() => {
              const sp = activeSpan ? dissection.spans.find((x) => x.id === activeSpan) : null;
              const so = (focusSkill != null && skillObjs[focusSkill]) ? skillObjs[focusSkill] : null;
              const f = so ? rsSkillFocus(so, dissection.spans) : (sp ? rsSpanFocus(sp, skillObjs) : null);
              if (!f) return null;
              const chip = (k, label) => { const c = PROV[k] || PROV.unverified; return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 700, color: c.ink, background: c.bg, border: "1px solid " + c.border, borderRadius: 4, padding: "1px 6px" }}>{label || k}</span>; };
              return (
                <div style={{ border: "1.5px solid #1a56db", background: "#f5f8ff", borderRadius: 10, padding: "12px 13px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", color: "#142a8e" }}>{f.title.toUpperCase()} {RS_DOT} O-I-A</span>
                    <button onClick={() => { setActiveSpan(null); setFocusSkill(null); }} aria-label="Close analysis card" style={{ marginLeft: "auto", minHeight: 44, minWidth: 44, border: "1px solid #cdd9ff", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
                  </div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".1em", color: "#8a8274", marginBottom: 3 }}>OBSERVATION</div>
                  <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 4px" }}>{String.fromCharCode(0x201c)}{f.obs}{String.fromCharCode(0x201d)}</p>
                  <div style={{ marginBottom: 9 }}>{chip(f.obsChip, f.obsChipLabel)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".1em", color: "#8a8274", marginBottom: 3 }}>INTERPRETATION</div>
                  {f.interp.map((ln, i) => <p key={i} style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 3px" }}>{ln}</p>)}
                  <div style={{ margin: "3px 0 9px" }}>{chip(f.interpChip)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: ".1em", color: "#8a8274", marginBottom: 3 }}>APPLICATION</div>
                  <p style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 4px" }}>{f.appl}</p>
                  {chip(f.applChip)}
                </div>
              );
            })()}
            {marginComments.length === 0 && <p style={{ fontSize: "0.8125rem", color: "#94a0b0" }}>No comments for this view.</p>}
            {marginComments.map((c) => {
              const pcol = PERSONA[c.persona] || "#64748b"; const st = commentStatus[c.id]; const active = activeSpan === c.anchor;
              const cb = c.band && BANDS[c.band] ? BANDS[c.band] : null; const anchorText = (dissection.spans.find((s) => s.id === c.anchor) || {}).text || "";
              return (
                <div key={c.id} onClick={() => setActiveSpan(c.anchor)} style={{ cursor: "pointer", border: "1.5px solid " + (active ? "#1a56db" : st === "accepted" ? "#cce6d4" : st === "rejected" ? "#ecdada" : "#eceae2"), background: active ? "#f5f8ff" : "#fff", borderRadius: 10, padding: "12px 13px", marginBottom: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: "50%", background: pcol, color: "#fff", fontSize: 10, lineHeight: "18px", textAlign: "center", flex: "none" }}>{String.fromCharCode(0x2726)}</span>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, color: pcol }}>{c.persona}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#64748b", background: "#f1f4f8", border: "1px solid #e3e8ef", borderRadius: 5, padding: "1px 6px" }}>{c.type}</span>
                  </div>
                  {cb && <div style={{ marginBottom: 7 }}><span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: cb.ink, background: cb.bg, border: "1px solid " + cb.border, borderRadius: 5, padding: "1px 6px" }}>{cb.label}</span></div>}
                  {anchorText && <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#52607a", borderLeft: "2px solid #d9d6cd", paddingLeft: 9, margin: "0 0 8px", lineHeight: 1.4 }}>{String.fromCharCode(0x201c)}{anchorText}{String.fromCharCode(0x201d)}</p>}
                  <p style={{ fontSize: "0.8rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{c.reason}</p>
                  {c.type === "suggested rewrite" && (
                    <div style={{ background: "#f6fbf7", border: "1px solid #d8ecdd", borderRadius: 8, padding: "8px 9px", marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#9a6113", textDecoration: "line-through", lineHeight: 1.4, marginBottom: 3 }}>{c.original}</div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#2f7d4f", lineHeight: 1.4 }}>{String.fromCharCode(0x2192)} {c.suggested}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: st ? 0 : 9 }}>
                    <Chip kind={c.prov}>{c.prov}</Chip>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5625rem", color: "#a8a193" }}>conf {String.fromCharCode(0x00b7)} {c.conf}</span>
                  </div>
                  {st ? <div style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, color: st === "accepted" ? "#1d4ed8" : "#9a6113" }}>{st === "accepted" ? "Accepted " + String.fromCharCode(0x2713) : "Rejected " + String.fromCharCode(0x2717)}</div>
                  : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setCommentStatus((m) => ({ ...m, [c.id]: "accepted" })); }} style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.6875rem", fontWeight: 700, color: "#fff", background: "#142a8e", border: "none", borderRadius: 7, padding: "6px 11px", cursor: "pointer", minHeight: 44 }}>Accept</button>
                      <button onClick={(e) => { e.stopPropagation(); setCommentStatus((m) => ({ ...m, [c.id]: "rejected" })); }} style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.6875rem", fontWeight: 600, color: "#3a4456", background: "#fff", border: "1px solid #d9d6cd", borderRadius: 7, padding: "6px 11px", cursor: "pointer", minHeight: 44 }}>Reject</button>
                      {/* "Ask why" removed - the button used to open the advisory rail
                          which showed only a "next build phase" placeholder. The reason
                          is already displayed on this card, and clicking the card body
                          already highlights the anchor span. */}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>
          );
          return isNarrow ? createPortal(margin, document.body) : margin;
        })()}

        {/* Right: Role Graph + analysis (~66%, the dominant pane) */}
        <div className="wis-scroll" style={{ flex: 1, minWidth: 0, background: "#fbfaf8", borderLeft: "1px solid #e2e0d8", overflowY: "auto", padding: "16px 18px 50px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".14em", color: "#8a8274" }}>VISUAL INTELLIGENCE</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {RIBBON[1].items.map(([k, lbl]) => (
                <button key={k} type="button" aria-pressed={visual === k} onClick={() => setVisual(k)} style={pillStyle(visual === k)}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #eceae2", borderRadius: 12, padding: 16, minHeight: "64vh" }}>
            {rolePane || <p style={{ fontSize: "0.875rem", color: "#94a0b0" }}>The role graph appears once the role resolves duties and skills.</p>}
          </div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#a8a193", marginTop: 8 }}>every node {String.fromCharCode(0x2190)} source span</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 18px", background: "#142a8e" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#dbe2ff" }}>Source: {source || "MyCareersFuture"} {String.fromCharCode(0x00b7)} Confidence: {footerConf} {String.fromCharCode(0x00b7)} Time-window: snapshot at analysis</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#fff", fontWeight: 500 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</span>
          {version && <span title={"SG Career View " + version} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#8595d6" }}>v{version}</span>}
        </div>
      </div>
    </div>
    </>
  );
}

const manuH2 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#16202e", margin: "0 0 9px" };
const manuP = { fontSize: "0.9375rem", color: "#3a4456", lineHeight: 1.6, margin: "0 0 18px" };
const oiaKick = { fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5rem", fontWeight: 600, letterSpacing: ".12em", color: "#b3ab9c", marginBottom: 6 };
const critH3 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#16202e", margin: "18px 0 10px" };
