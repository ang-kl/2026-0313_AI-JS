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
const RIBBON = [
  { group: "Review", key: "markup", items: [["clean", "Read clean"], ["suggestions", "Suggestions"], ["comments", "Comments"], ["dissect", "Dissect"], ["critical", "Critical read"]] },
  { group: "Visuals", key: "visual", items: [["jobgraph", "Job graph"]] },
  { group: "Evidence", key: null, items: [["observed", "Observed"], ["interpreted", "Interpreted"], ["applied", "Applied"], ["withheld", "Withheld"], ["provenance", "Provenance"]] },
  { group: "Output", key: null, items: [["cover", "Cover letter"], ["resume", "Resume notes"], ["interview", "Interview pack"], ["print", "Print / PDF"]] },
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
  const jobs = (rd && Array.isArray(rd.jobs)) ? rd.jobs : [];
  const srcJob = jobs.find((j) => j && (j.description || j.responsibilitiesText));
  let adText = rsAdText(srcJob || {});
  if ((!adText || adText.trim().length < 40) && posting && posting.text) adText = rsAdText({ description: posting.text });
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
  if (human) { used.add(human.id); out.push({ id: "c-cand", persona: "Candidate Advocate", type: "comment", band: "human", anchor: human.id, prov: "from posting", conf: "high", reason: "This stays human-led - relationships and accountability. Strongest proof to bring: one example where you personally drove this to an outcome." }); }
  const weak = spans.find((s) => !used.has(s.id) && /\b(familiar|knowledge of|exposure to|awareness of|understanding of)\b/i.test(s.text));
  if (weak) { used.add(weak.id); out.push({ id: "c-aud", persona: "Evidence Auditor", type: "withhold claim", band: null, anchor: weak.id, prov: "unverified", conf: "withheld", reason: "No measurable threshold in the posting. Withhold from any readiness score until it is evidenced in interview or a work sample." }); }
  return out.slice(0, 6);
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
  if (yrs && yrs > 0) out.push({ id: "hf-yrs", label: "experience gate", obs: yrs + "+ years of experience",
    why: "Below this, most ATS filters and recruiters screen the CV out before a human reads it." });
  const deg = t.match(/\b(?:bachelor'?s?|master'?s?|ph\.?d|doctorate|degree|diploma)\b[^.?!\n]{0,44}/i);
  if (deg && /\b(?:degree|diploma|bachelor|master|ph\.?d|doctorate)\b/i.test(deg[0])) out.push({ id: "hf-deg", label: "qualification gate", obs: deg[0].replace(/\s+/g, " ").trim(),
    why: "A formal-qualification bar - check whether it says 'or equivalent experience' before ruling yourself out." });
  const cert = t.match(/\b(?:certified|certification|licen[sc]ed|registered|chartered|\bcpa\b|\bcfa\b|\bpmp\b|\bacca\b)\b[^.?!\n]{0,44}/i);
  if (cert) out.push({ id: "hf-cert", label: "credential gate", obs: cert[0].replace(/\s+/g, " ").trim(),
    why: "A named credential - often non-negotiable for regulated or professional roles." });
  return out;
}
function buildCriticalRead(result, spans, title, posting) {
  const firstJob = Array.isArray(result && result.jobs) ? result.jobs.find((j) => j && (j.description || j.responsibilitiesText)) : null;
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
  return { adText, noodles: rsSignalNoise(adText), forensic: rsForensicReversal(adText), falsification: rsFalsification(effSpans, title, adText), hiringFilter: rsHiringFilter(adText, firstJob) };
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

export default function ReviewStudio({ result, title, employer, source, rolePane, band, onBack, version, posting }) {
  const [markup, setMarkup] = useState("suggestions");
  const [visual, setVisual] = useState("jobgraph");
  const [rail, setRail] = useState(null);      // open drawer key or null
  // Rail starts collapsed on narrow viewports (phones) - open by default on
  // desktop is fine there, but on an iPhone the 150px expanded rail alone eats
  // over a third of the screen before the manuscript/margin panes are even
  // considered. Lazy-init so this reads the real viewport once, not on every render.
  const [railOpen, setRailOpen] = useState(() => (typeof window === "undefined" || window.innerWidth >= 860));
  const [activeSpan, setActiveSpan] = useState(null);
  const [adOpen, setAdOpen] = useState(false);   // ads FAB: verbatim source-ad overlay
  const [commentStatus, setCommentStatus] = useState({}); // id -> 'accepted' | 'rejected'
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
    const jobs = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : [];
    const srcJob = jobs.find((j) => j && (j.description || j.responsibilitiesText));
    let t = rsAdText(srcJob || {});
    if ((!t || t.trim().length < 40) && posting && posting.text) t = rsAdText({ description: posting.text });
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
  const firstJob = Array.isArray(result && result.jobs) ? result.jobs.find((j) => j && (j.description || j.responsibilitiesText)) : null;
  const overview = (rd && rd.summary) || (firstJob ? rsFirstSentence(rsStrip(firstJob.description || firstJob.responsibilitiesText)) : "");
  const skills = (Array.isArray(result && result.skills) ? result.skills : []).map((s) => s.skill || s).filter(Boolean);
  const derivedBand = rsDominantBand(dutyObjs);
  const bandKey = (band && BANDS[band]) ? band : derivedBand;
  const bandTok = bandKey && BANDS[bandKey] ? BANDS[bandKey] : null;

  const ribbonActive = (groupKey, k) => (groupKey === "markup" && markup === k) || (groupKey === "visual" && visual === k);
  function ribbonClick(groupKey, k) {
    if (groupKey === "markup") setMarkup(k);
    else if (groupKey === "visual") setVisual(k);
    else if (k === "cover") { setRail("cover"); }
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
                {critical.hiringFilter.map((h) => <CritCard key={h.id} tag={h.label} obs={h.obs} interp={h.why} appl="Meet it, show the equivalent, or expect an auto-reject before a human reads your CV." persona="HIRING FILTER" accent="#0e7490" obsChip="from posting" />)}
                {cr && cr.hiring && cr.hiring.recruiter && <AdvisoryCard persona="RECRUITER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.recruiter}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.hiringManager && <AdvisoryCard persona="HIRING MANAGER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.hiringManager}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.interviewCoach && <AdvisoryCard persona="INTERVIEW COACH"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.interviewCoach}</p></AdvisoryCard>}
              </>}
              {!critical.noodles.length && !critical.forensic.length && !critical.falsification.length && !critical.hiringFilter.length && !cr && <p style={manuP}>{critical.adText ? "This posting reads plainly - no empty phrasing, inflated language, or template/mash-up/compliance signals flagged. The challenged deep read (AI-assisted) appears here once it finishes." : "No posting text available to run the plain-language check."}</p>}
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
                      <Chip kind="from posting">from posting</Chip>
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
                <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"} {String.fromCharCode(0x00b7)} verbatim</Chip>
                {bandTok && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 5, padding: "2px 7px" }}>{bandTok.label}</span>}
              </div>
              {(() => {
                const ov = adSections.find((sec) => sec.canon === "Role overview" && sec.lines.length > 0);
                if (ov) return <><h2 style={manuH2}>Role overview</h2>{ov.lines.map((ln, i) => <p key={i} style={manuP}>{ln}</p>)}</>;
                return overview ? <><h2 style={manuH2}>Role overview</h2><p style={manuP}>{overview}</p></> : null;
              })()}
              {dissection.spans.filter((x) => x.sec !== "req").length > 0 && <>
                <h2 style={manuH2}>Responsibilities</h2>
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
                  section the ad names itself) - verbatim, with the ad's own heading. Requirement
                  lines that joined the analysis are tappable like duties (exposure withheld). */}
              {adSections.filter((sec) => sec.canon !== "Role overview" && sec.canon !== "Responsibilities" && sec.lines.length > 0).map((sec, si) => (
                <div key={"sec" + si}>
                  <h2 style={manuH2}>{sec.canon || sec.title}</h2>
                  <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                    {sec.lines.map((ln, li) => {
                      const sp = dissection.spans.find((x) => x.sec === "req" && x.text === ln);
                      if (!sp || showClean) return <li key={li} style={{ ...manuP, marginBottom: 7 }}>{ln}</li>;
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
                <h2 style={manuH2}>Skills the posting asks for</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 24).map((s, i) => <span key={i} style={{ fontSize: "0.8125rem", color: "#0b5e74", background: "#e3f5fb", border: "1px solid #bce6f0", borderRadius: 14, padding: "3px 11px" }}>{s}</span>)}</div>
              </>}
              {!overview && !dissection.spans.length && <p style={manuP}>The analysed posting did not yield responsibilities text to render as a manuscript.</p>}
            </div>
          )}
        </div>

        {/* Comment margin (Suggestions / Comments modes) */}
        {showMargin && (() => {
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
                      <button onClick={(e) => { e.stopPropagation(); setActiveSpan(c.anchor); setRail("advisory"); }} style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.6875rem", fontWeight: 600, color: "#1a56db", background: "#eef2ff", border: "1px solid #cdd9ff", borderRadius: 7, padding: "6px 11px", cursor: "pointer", minHeight: 44 }}>Ask why</button>
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
      {/* Ads FAB (design ref: Work Intelligence Studio): the source ad is one tap away from
          anywhere in Step 3 - verbatim, sectioned, read-only. */}
      {createPortal(
        <>
          <button type="button" onClick={() => setAdOpen(true)} aria-label="Open the source job ad" title="Open the source job ad"
            style={{ position: "fixed", right: 22, bottom: 74, zIndex: 1290, minWidth: 56, minHeight: 56, borderRadius: 28, border: "1px solid #c7d6ff", background: "#142a8e", color: "#fff", cursor: "pointer", boxShadow: "0 8px 24px rgba(20,42,142,.35)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 18px", fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "0.8125rem" }}>
            <span aria-hidden="true" style={{ fontSize: "1rem" }}>{String.fromCodePoint(0x1f4c4)}</span> Ad
          </button>
          {adOpen && (
            <div role="dialog" aria-modal="true" aria-label="Source job ad, verbatim" onClick={() => setAdOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1310, background: "rgba(13,18,28,.36)", display: "flex", alignItems: "center", justifyContent: "center", padding: 26 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: "100%", maxHeight: "86vh", overflow: "hidden", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px rgba(13,18,28,.4)", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: "none", display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", borderBottom: "1px solid #eceae2" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: ".13em", color: "#8a8274" }}>SOURCE AD {RS_DOT} VERBATIM</div>
                    <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.25rem", color: "#16202e", margin: "3px 0 0", lineHeight: 1.25 }}>{title || "this role"}</h3>
                  </div>
                  <button onClick={() => setAdOpen(false)} aria-label="Close" style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid #e2e0d8", background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 15, flex: "none" }}>{String.fromCharCode(0x2715)}</button>
                </div>
                <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                  {adSections.length ? adSections.map((sec, i) => (
                    <div key={i}>
                      {sec.title && <p style={{ margin: i === 0 ? "0 0 6px" : "14px 0 6px", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "#16202e" }}>{sec.title}</p>}
                      {sec.lines.map((ln, k) => <p key={k} style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "#3a4456", lineHeight: 1.6 }}>{ln}</p>)}
                    </div>
                  )) : <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a0b0" }}>No ad text available for this analysis.</p>}
                  <p style={{ margin: "12px 0 0", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", color: "#8a8274", fontStyle: "italic" }}>Verbatim from {source || "MyCareersFuture"}; grouping only, no rewriting. AI-assisted {RS_DOT} human decides.</p>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
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
