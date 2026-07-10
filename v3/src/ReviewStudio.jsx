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
import BLUEPRINT_STATUS from "./blueprint-status.json";
// PB1 (v3-preinterview-brief-spec.md): reuse the shipped, module-cached ACRA lookup
// byte-identically - no new fetch path, no frozen-door touch (fetchEmployerRegistration
// itself is not on the frozen list; only /api/ssic's lookup action + api/ssic.js are).
import { fetchEmployerRegistration } from "./App.jsx";

// Doctrine exposure bands (fixed order, S1.2) - colour encodes band only.
// Build-status percentages for the strip above the tabs now come from
// blueprint-status.json - a real tracked record (single source of truth), not a
// hand-edited array in this component. Edit the JSON file when a workstream ships.
const BUILD_STATUS = (BLUEPRINT_STATUS.workstreams || []).map((w) => [w.name, w.pct]);
const BANDS = {
  human:     { key: "human",     label: "Human-led",       dot: "#1d4ed8", bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  assisted:  { key: "assisted",  label: "AI-assisted",     dot: "#0e7490", bg: "#e3f5fb", ink: "#0b5e74", border: "#bce6f0" },
  augmented: { key: "augmented", label: "AI-augmented",    dot: "#b45309", bg: "#fdf0dd", ink: "#92450a", border: "#f5d8a8" },
  auto:      { key: "auto",      label: "Full automation", dot: "#d97706", bg: "#fef3e0", ink: "#8a4b0a", border: "#f7d4a0" },
};
const PROV = {
  "from posting": { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  "from MCF":     { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  // PB1: employer facts pass through verbatim from ACRA (data.gov.sg) - same
  // "sourced fact" family styling as "from posting"/"from MCF" (no red/green).
  "from ACRA":    { bg: "#eef2f7", ink: "#475569", border: "#dbe2ea" },
  // Audit (07-07 '26): computed was the one green swatch left in the chip vocabulary -
  // moved to the blue family so all five prov chips sit inside blue/violet/amber.
  computed:       { bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
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
  "Role Analyst": "#1d4ed8", "Candidate Advocate": "#0e7490", "Evidence Auditor": "#64748b",
  "Signal Auditor": "#9a6113",
};
// Tracked-span styling by exposure band (S5.2): tint + 2px underline, colour-blind safe.
const SPAN_STYLE = {
  augmented: { bg: "#fdf0dd", under: "#b45309", color: "#7a3c08" },
  auto:      { bg: "#fef3e0", under: "#d97706", color: "#7a4b0a" },
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
// Strip emoji/pictographs (Human Lead: no emoji anywhere; ads use them as heading bullets -
// "[clipboard] Key Responsibilities" must parse AND display as plain "Key Responsibilities").
function rsStripEmoji(x) {
  return String(x || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu, "").replace(/\s{2,}/g, " ").trim();
}
// A working-hours / schedule line must never become a section heading (live bug:
// "Friday: 8:30 AM - 5:30 PM" was promoted while the real Requirements heading was missed).
const RS_TIME_LINE = /\d{1,2}[:.]\d{2}\s*(?:am|pm)?|\b(?:am|pm)\b|\bmon(?:day)?\b|\btue(?:sday)?\b|\bwed(?:nesday)?\b|\bthu(?:rsday)?\b|\bfri(?:day)?\b|\bsat(?:urday)?\b|\bsun(?:day)?\b|working hours/i;
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
const RS_GATES = [
  { rx: /\b\d{1,2}\+?\s*(?:years?|yrs?)\b[^,.;\n]{0,30}/i, why: "gate: experience threshold" },
  { rx: /\b(?:bachelor'?s?|master'?s?|ph\.?d|doctorate|degree|diploma)\b[^,.;\n]{0,40}/i, why: "gate: formal qualification" },
  { rx: /\b(?:certified|certification|licen[sc]ed?|registered|chartered)\b[^,.;\n]{0,40}/i, why: "gate: named credential" },
];
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
// Title normalisation for the dup key: lowercase, strip parenthetical suffixes and
// in-scope seniority prefixes, collapse punctuation/whitespace. Deterministic - no
// fuzzy edit-distance, so it never over-collapses distinct role nouns.
function rsNormTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(junior|senior|assistant|lead|principal)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// Pure count ratio of shared tokens over the union - same sample gives same ratio.
function rsJaccard(aTokens, bTokens) {
  const a = new Set(aTokens), b = new Set(bTokens);
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter++; });
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}
// AI-3 (spec No.135), ET1 (v3-employment-type-signal-spec): fixed regex map, ordered so
// "permanent" matches first (guards compound types like "Permanent, Full Time").
const RS_EMPTYPE_MAP = [
  { bucket: "permanent", re: /perm/i },
  { bucket: "contract", re: /contract|temporary|fixed[- ]term|temp\b/i },
  { bucket: "part-time", re: /part[- ]time/i },
  { bucket: "internship", re: /intern|trainee/i },
  { bucket: "freelance", re: /freelance|casual/i },
];
function rsEmpTypeBucket(str) {
  const s = String(str || "");
  if (!s) return null;
  for (let i = 0; i < RS_EMPTYPE_MAP.length; i++) { if (RS_EMPTYPE_MAP[i].re.test(s)) return RS_EMPTYPE_MAP[i].bucket; }
  return null;
}
function rsIndicators(result, firstJob) {
  const rdd = result && result.responsibilitiesData;
  const jobs = (rdd && Array.isArray(rdd.jobs)) ? rdd.jobs : [];
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
        obs: maxDupe + " near-identical ads (same employer + " + (dutyMatch ? "duty text" : "title") + ") in the " + jobs.length + " sampled",
        why: "This req is being posted repeatedly. A queue this crowded rewards depth over spread - one strong, evidenced application beats several thin ones.",
        move: "Triage: either commit real effort to this one, or deprioritise it and spend the time on a less-contested req. Ask at screen how long the seat has been open." });
    }
    const withSalary = jobs.filter((j) => j.salaryMin || j.salaryMax || (j.salary && (j.salary.minimum || j.salary.maximum))).length;
    const pct = Math.round((withSalary / jobs.length) * 100);
    if (pct <= 40) out.push({ id: "ind-salary", label: "salary opacity", obs: withSalary + " of " + jobs.length + " sampled ads state a salary (" + pct + "%)", why: "Low disclosure in this market segment weakens your negotiating baseline.", move: "Anchor on the ads that DO state a band before naming your number." });
  }
  // ET1: verbatim MCF/CSG employmentType, fact-labelled ("from posting"), non-permanent only.
  const empRaw = firstJob && firstJob.employmentType;
  const bucket = rsEmpTypeBucket(empRaw);
  if (bucket && bucket !== "permanent") {
    let obs = "This posting's engagement type is verbatim: " + String(empRaw);
    if (jobs.length >= 4) {
      const sameBucket = jobs.filter((j) => rsEmpTypeBucket(j && j.employmentType) === bucket).length;
      obs += ". " + sameBucket + " of " + jobs.length + " sampled ads for this role state " + bucket;
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
  return { adText, noodles: rsSignalNoise(adText), forensic: rsForensicReversal(adText), falsification: rsFalsification(effSpans, title, adText), hiringFilter: rsHiringFilter(adText, firstJob), blindSpots: rsBlindSpots(adText, firstJob), contradictions: rsContradictions(effSpans, title), qoi: rsQoI(effSpans), indicators: rsIndicators(result, firstJob), trajectory: rsTrajectory(effSpans), salaryPos: rsSalaryPosition(posting, result) };
}
// No.136 G1 (§7 explainability): every generated section declares WHY it appeared - the
// triggering evidence + the governing spec section. Deterministic string, no LLM.
function WhyLine({ why, sec }) {
  return <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>shown because {why} {RS_DOT} {sec}</p>;
}
// One O-I-A finding card (Observation -> Interpretation -> Application), reused by every
// Critical-Read lens. Verbatim observation, deterministic interpretation, a counter-move to apply.
function CritCard({ tag, obs, interp, appl, persona, accent, obsChip, onExpand }) {
  const ac = accent || "#9a6113";
  const who = persona || "SIGNAL AUDITOR";
  const oc = obsChip || "from posting";
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: ac, borderRadius: 4, padding: "2px 7px" }}>{String(tag).toUpperCase()}</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>{who}</span>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label={"Open " + who + " card in the detail drawer"} title="Open in drawer"
            style={{ marginLeft: "auto", flex: "none", minHeight: 28, minWidth: 44, border: "1px solid #e6e3db", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", padding: "0 8px" }}>expand</button>
        )}
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
          {/* Audit fix: the confidence clause was a fixed "moderate" for every lens - an unearned,
    non-varying claim. "rule (deterministic)" is true and sufficient; per-lens confidence
    returns only if a lens actually computes one. */}
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd" }}>method {RS_DOT} rule (deterministic)</span>
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
function AdvisoryCard({ persona, children, onExpand }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f5dcb0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fff9f0", borderBottom: "1px solid #f5e6cc" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: "#9a6113", borderRadius: 4, padding: "2px 7px" }}>{persona}</span>
        <Chip kind="AI estimate">AI estimate {String.fromCharCode(0x00b7)} advisory</Chip>
        {onExpand && (
          <button type="button" onClick={onExpand} aria-label={"Open " + persona + " card in the detail drawer"} title="Open in drawer"
            style={{ marginLeft: "auto", flex: "none", minHeight: 28, minWidth: 44, border: "1px solid #f5dcb0", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", padding: "0 8px" }}>expand</button>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function Chip({ kind, children }) {
  const p = PROV[kind] || PROV.computed;
  return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: p.ink, background: p.bg, border: "1px solid " + p.border, borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" }}>{children}</span>;
}

// ── PB1 (v3-preinterview-brief-spec.md): the pre-interview brief - assembly only,
// no LLM, no new number. Every row is a sourced pass-through of a value already
// computed elsewhere (engine occExposure/ssocResolution, Critical Read's own
// indicators/salaryPos/blindSpots, and the shipped ACRA lookup). A row that has no
// source in state is simply omitted - it never blocks, errors, or guesses (spec §8).
function PbRow({ label, chip, children }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid #f0eee7" }}>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".08em", color: "#b3ab9c", marginBottom: 4 }}>{String(label).toUpperCase()}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#16202e", lineHeight: 1.5, flex: "1 1 240px" }}>{children}</p>
        <Chip kind={chip}>{chip}</Chip>
      </div>
    </div>
  );
}
// Employer (ACRA) row - the one row with its own async fetch (module-cached,
// always-resolves). Surfaces ONLY matched:"exact" fields; on "none" shows the
// honest not-matched line, never the derived-classifier fallback (same guard the
// shipped fetchEmployerRegistration already applies before this component sees it).
function PbEmployerRow({ employerName }) {
  const [emp, setEmp] = useState({ status: "idle", data: null });
  useEffect(() => {
    const name = String(employerName || "").trim();
    if (!name) { setEmp({ status: "done", data: { matched: "none", reason: "no_employer" } }); return undefined; }
    let cancelled = false;
    setEmp({ status: "loading", data: null });
    fetchEmployerRegistration(name).then((d) => { if (!cancelled) setEmp({ status: "done", data: d }); });
    return () => { cancelled = true; };
  }, [employerName]);
  if (emp.status !== "done") {
    return <PbRow label="Employer (ACRA)" chip="from ACRA">Checking ACRA registration{String.fromCharCode(0x2026)}</PbRow>;
  }
  const d = emp.data;
  if (!d || d.matched !== "exact") {
    return <PbRow label="Employer (ACRA)" chip="from ACRA">Not matched in the ACRA business register (may be a statutory board, agency, or a name variant ACRA does not carry).</PbRow>;
  }
  const parts = [d.entityType, d.status, d.registeredSince ? "registered " + d.registeredSince : null].filter(Boolean);
  const ssic = d.primarySsicCode ? d.primarySsicCode + (d.primarySsicDescription ? " - " + d.primarySsicDescription : "") : null;
  const ssic2 = d.secondarySsicCode ? d.secondarySsicCode + (d.secondarySsicDescription ? " - " + d.secondarySsicDescription : "") : null;
  return (
    <PbRow label="Employer (ACRA)" chip="from ACRA">
      {parts.length ? parts.join(" " + RS_DOT + " ") : "ACRA match found but no entity fields on record."}
      {ssic ? <span style={{ display: "block", marginTop: 3 }}>Primary SSIC: {ssic}</span> : null}
      {ssic2 ? <span style={{ display: "block", marginTop: 2 }}>Secondary SSIC: {ssic2}</span> : null}
      {d.namesakes > 0 ? <span style={{ display: "block", marginTop: 3, color: "#9a6113" }}>ACRA lists +{d.namesakes} other {d.namesakes === 1 ? "entity" : "entities"} with this name - showing the live-status match.</span> : null}
    </PbRow>
  );
}
function PreInterviewBrief({ result, title, employer, posting, critical }) {
  const [open, setOpen] = useState(true);
  const ssoc = result && result.ssocResolution;
  const occ = result && result.occExposure;
  const indicators = (critical && critical.indicators) || [];
  const empType = indicators.find((x) => x.id === "ind-emptype");
  const triage = indicators.filter((x) => x.id !== "ind-emptype");
  const salaryPos = critical && critical.salaryPos;
  const blindSpots = (critical && critical.blindSpots) || [];
  const employerName = (posting && posting.employer) || employer || "";
  return (
    <div style={{ border: "1px solid #e6e3db", borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "#fff" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, padding: "10px 14px", background: open ? "#142a8e" : "#fbfaf8", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.875rem", fontWeight: 700, color: open ? "#fff" : "#16202e" }}>Pre-interview brief</span>
        <span aria-hidden="true" style={{ fontSize: "0.75rem", color: open ? "#c7d6ff" : "#94a0b0", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>&#9660;</span>
      </button>
      {open && (
        <div style={{ padding: "4px 14px 12px" }}>
          <PbRow label="Role as classified" chip="computed">
            {title || "role withheld"}{ssoc && ssoc.code ? " " + RS_DOT + " SSOC " + ssoc.code : ""}
          </PbRow>
          {(occ && (occ.band || occ.index != null)) ? (
            <PbRow label="AI-exposure headline" chip="computed">
              {occ.band || "band withheld"}{occ.index != null ? " " + RS_DOT + " AI-Exposure Index " + occ.index + "/100" : ""}
              {Array.isArray(occ.zRange) ? " " + RS_DOT + " range " + occ.zRange[0] + " to " + occ.zRange[1] : ""}
            </PbRow>
          ) : null}
          {empType ? <PbRow label="Engagement type" chip="from posting">{empType.obs}</PbRow> : null}
          {salaryPos ? <PbRow label="Salary read" chip="computed">{salaryPos.obs}</PbRow> : null}
          {triage.length > 0 ? (
            <PbRow label="Demand / triage" chip="computed">{triage.map((t) => t.obs).join(" " + RS_DOT + " ")}</PbRow>
          ) : null}
          <PbEmployerRow employerName={employerName} />
          {blindSpots.length > 0 ? (
            <PbRow label="Missing facts" chip="computed">The ad is silent on: {blindSpots.map((b) => b.label).join(", ")}.</PbRow>
          ) : null}
          <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#6b6357", lineHeight: 1.5, fontStyle: "italic" }}>AI-assisted; human decides. Structural facts from MyCareersFuture, careers.gov.sg and ACRA; interpretation is the candidate's.</p>
        </div>
      )}
    </div>
  );
}
// ── W4a slice 1 (blueprint §10.3 "AI trace"): the AIOE exposure trace, deterministic.
// Occupation index (engine AIOE chain) -> per-duty engine bands on a labelled 4-stop
// track (position = band, no fabricated numbers) -> skill-level mix. No LLM anywhere in
// this visual; every row withholds when its engine signal is absent.
const AIT_STOPS = ["human", "assisted", "augmented", "auto"];
function AITracePanel({ result }) {
  const occ = result && result.occExposure;
  const duties = (result && result.jobAnatomy && !result.jobAnatomy.fallback && Array.isArray(result.jobAnatomy.duties)) ? result.jobAnatomy.duties : [];
  const skills = Array.isArray(result && result.skills) ? result.skills : [];
  const dutyRows = duties.map((d, i) => ({ id: "t" + i, text: d.text, band: RS_EXP_BAND[d.exposureNow] || null, band2y: RS_EXP_BAND[d.exposure2y] || null, layer: d.layer || "", basis: d.levelBasis || "" })).slice(0, 14);
  const classified = dutyRows.filter((d) => d.band);
  const mix = {}; skills.forEach((sk) => { const k = sk.level || "unclassified"; mix[k] = (mix[k] || 0) + 1; });
  if (!occ && !classified.length && !skills.length) {
    return <p style={{ fontSize: "0.875rem", color: "#94a0b0" }}>The AI trace appears once the engine classifies this role - no exposure signals yet, so nothing is drawn (withhold over guess).</p>;
  }
  const col = (b) => AIT_STOPS.indexOf(b);
  return (
    <div>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".12em", color: "#6b6357", marginBottom: 6 }}>AI TRACE {RS_DOT} OCCUPATION {String.fromCharCode(0x2192)} DUTIES {String.fromCharCode(0x2192)} SKILLS</div>
      {/* Occupation row */}
      <div style={{ background: "#fbfaf8", border: "1px solid #eceae2", borderRadius: 10, padding: "10px 13px", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>OCCUPATION EXPOSURE (AIOE ENGINE)</div>
        {occ && (occ.band || occ.index != null)
          ? <p style={{ margin: 0, fontSize: "0.875rem", color: "#16202e" }}><strong>{occ.band || "band withheld"}</strong>{occ.index != null ? " " + RS_DOT + " index " + occ.index + "/100" : ""} <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>{RS_DOT} occupation{String.fromCharCode(0x2192)}SOC{String.fromCharCode(0x2192)}AIOE {RS_DOT} computed</span></p>
          : <p style={{ margin: 0, fontSize: "0.8125rem", color: "#9a6113" }}>Occupation exposure withheld - the AIOE engine returned no score for this occupation.</p>}
      </div>
      {/* Duty track */}
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>DUTIES ON THE EXPOSURE TRACK (SLE-C ENGINE BANDS {RS_DOT} POSITION = BAND, NOT A SCORE)</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) repeat(4, 74px)", gap: 0, alignItems: "center", border: "1px solid #eceae2", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "6px 10px", background: "#f4f6fa", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>duty</div>
        {AIT_STOPS.map((b) => <div key={b} style={{ padding: "6px 4px", background: "#f4f6fa", textAlign: "center", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: BANDS[b].ink }}>{BANDS[b].label}</div>)}
        {dutyRows.map((d) => (
          <Fragment key={d.id}>
            <div title={d.text} style={{ padding: "7px 10px", borderTop: "1px solid #f0eee7", fontSize: "0.75rem", color: "#3a4456", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.text}</div>
            {AIT_STOPS.map((b, ci) => (
              <div key={b} style={{ borderTop: "1px solid #f0eee7", textAlign: "center", padding: "7px 0", background: d.band && ci === col(d.band) ? BANDS[b].bg : "transparent" }}>
                {d.band && ci === col(d.band)
                  ? <span title={BANDS[b].label + (d.band2y && d.band2y !== d.band ? " - rising to " + (BANDS[d.band2y] ? BANDS[d.band2y].label : d.band2y) + " in ~2y" : "")} style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: BANDS[b].dot }} />
                  : (ci === 0 && !d.band ? <span title="Exposure withheld - no engine signal" style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113" }}>w/h</span> : null)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      {/* Skill mix */}
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c", marginBottom: 4 }}>SKILL-LEVEL MIX ({skills.length} SKILLS {RS_DOT} SLE-A ENGINE)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {[["HIGH", "auto"], ["MEDIUM", "augmented"], ["LOW", "assisted"], ["HUMAN", "human"]].map(([lv, bk]) => (mix[lv] ? <span key={lv} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: BANDS[bk].ink, background: BANDS[bk].bg, border: "1px solid " + BANDS[bk].border, borderRadius: 6, padding: "3px 9px" }}>{BANDS[bk].label}: {mix[lv]}</span> : null))}
        {mix.unclassified ? <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113", background: "#fff4e6", border: "1px solid #f5dcb0", borderRadius: 6, padding: "3px 9px" }}>withheld: {mix.unclassified}</span> : null}
      </div>
      <p style={{ margin: 0, fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357", fontStyle: "italic" }}>All positions and counts from the deterministic engines (AIOE occupation index, SLE-C duty bands, SLE-A skill levels). No LLM in this visual. AI-assisted {RS_DOT} human decides.</p>
    </div>
  );
}
// Generalized connector registry (per Step-3 design spec, No.138 U-conn): the engine's
// activeSpan/focusSkill remain the only truth source. A rule fires only when whenActive
// returns a live id read off real state, so no connector line is ever manufactured for a
// tab with no shared id (overview, gates, critical, market - no rule below, effect no-ops).
const LINK_RULES = {
  ad: { active: (s) => s.activeSpan, left: (id) => "#li-" + id,
        right: (id) => '[data-comment-anchor="' + id + '"]' },
  duties: { active: (s) => s.activeSpan, left: (id) => '[data-oia-anchor="' + id + '"]',
            right: (id) => "#li-" + id }, // reciprocal to the manuscript's scrollIntoView target
};
export default function ReviewStudio({ result, title, employer, source, rolePane, band, onBack, version, posting, onRetryDuties, onOpenOkf, bgRunning, bgStep, bgStatus, bgElapsed }) {
  // No.137 T1: TABS replace the mode ribbon (Report View anatomy). markup/dutyView become
  // per-tab toolbar state; visual stays for the Market graphs.
  const [tab, setTab] = useState("overview");   // overview | ad | duties | gates | critical | market
  const [markup, setMarkup] = useState("suggestions"); // The Ad toolbar: clean | suggestions | comments
  const [dutyView, setDutyView] = useState("oia");     // Duties toolbar: oia | aitrace
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
  // No.136 G2: severity-first ordering + dismiss/restore. Ranks are deterministic reads
  // of evidence the lenses already computed (counts and grades - no new numbers); a
  // dismissed panel is per-posting, persisted (KV-1 "boards" scope), reversible from the
  // hidden-panels chip row (spec 136 section 7: reversible + human-controlled).
  const [hiddenPanels, setHiddenPanels] = useState([]);
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
  const G2_LABELS = { contradictions: "Contradictions", trajectory: "Around the corner", salaryPos: "Competitive read", blindSpots: "Blind spots", qoi: "Quality of information", indicators: "Indicators" };
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

  // ── No.138 U2: WINDOW RENDERERS - every sub-function is a window; panels host them. ──
  const winVerdict = (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>OVERVIEW {RS_DOT} THE 10-SECOND READ</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 14px" }}>Verdict first {String.fromCharCode(0x2014)} every chip is a door</h2>
              <PreInterviewBrief result={result} title={title} employer={employer} posting={posting} critical={critical} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px,100%), 1fr))", gap: 12 }}>
                {[
                  bandTok ? { k: "duties", kick: "AI EXPOSURE (ROLE READ)", val: bandTok.label, sub: duties.length + " duties " + RS_DOT + " " + skills.length + " skills", chipK: "computed" } : null,
                  critical.trajectory ? { k: "duties", kick: "AROUND THE CORNER", val: critical.trajectory.grade, sub: critical.trajectory.obs.slice(0, 64) + String.fromCharCode(0x2026), chipK: "computed" } : null,
                  critical.salaryPos ? { k: "market", kick: "MARKET POSITION", val: critical.salaryPos.pct + "th percentile", sub: "vs salary-stating ads in this result", chipK: "computed" } : null,
                  (critical.qoi.length || critical.hiringFilter.length) ? { k: "gates", kick: "GATES", val: (critical.qoi.length + critical.hiringFilter.length) + " to clear", sub: critical.hiringFilter.map((h) => h.label).slice(0, 3).join(" " + RS_DOT + " ") || "requirement lines graded", chipK: "computed" } : null,
                  (critical.contradictions.length || critical.blindSpots.length) ? { k: "critical", kick: "BIGGEST FLAG", val: critical.contradictions.length ? "role mash-up signals" : "silent on " + critical.blindSpots[0].label, sub: (critical.contradictions.length + critical.blindSpots.length) + " findings in Critical Read", chipK: "derived" } : null,
                ].filter(Boolean).map((c, i) => (
                  <button key={i} type="button" onClick={() => setTab(c.k)} aria-label={c.kick + ": " + c.val + ". Open its tab."}
                    style={{ textAlign: "left", minHeight: 96, background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "14px 16px", cursor: "pointer", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
                    <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".12em", color: "#b3ab9c", marginBottom: 6 }}>{c.kick}</div>
                    <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.125rem", color: "#16202e", marginBottom: 4 }}>{c.val}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.45, marginBottom: 6 }}>{c.sub}</div>
                    <Chip kind={c.chipK}>{c.chipK}</Chip>
                  </button>
                ))}
              </div>
              {!bandTok && !critical.trajectory && !critical.salaryPos && !critical.qoi.length && !critical.hiringFilter.length && !critical.contradictions.length && !critical.blindSpots.length && (
                <p style={manuP}>The verdict chips appear as the engines classify this role - nothing is summarised before it is computed.</p>
              )}
            </div>
  );
  const winShortcuts = (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 8 }}>WORKSPACE SHORTCUTS</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["Sources", "ad", "the verbatim ad and its provenance"], ["Trace", "duties", "duty-by-duty O-I-A dissection"], ["Skilling", "duties", "skills and the AI trace"], ["Advisory", "critical", "the challenged deep read"]].map(([lbl, dest, gloss]) => (
          <button key={lbl} type="button" onClick={() => setTab(dest)} aria-label={lbl + ": opens " + gloss}
            style={{ minHeight: 44, textAlign: "left", background: "#fff", border: "1px solid #e6e3db", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
            <span style={{ display: "block", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e" }}>{lbl}</span>
            <span style={{ display: "block", fontSize: "0.6875rem", color: "#6b6357" }}>{gloss}</span>
          </button>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#6b6357", lineHeight: 1.5 }}>Cover letter, Boards and Saved retired from the rail - they were placeholder drawers; they return as real windows when built (trust-loop: no dead controls).</p>
    </div>
  );
  const winGatesHard = (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>REQUIREMENTS &amp; GATES {RS_DOT} WHAT FILTERS YOU OUT</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 14px" }}>Can each claim be tested {String.fromCharCode(0x2014)} and what auto-rejects?</h2>
              {critical.hiringFilter.length > 0 && <>
                <h3 style={critH3}>Hard gates</h3>
                {critical.hiringFilter.map((h) => <CritCard key={h.id} tag={h.label} obs={h.obs} interp={h.why} appl="Meet it, show the equivalent, or expect an auto-reject before a human reads your CV." persona="HIRING FILTER" accent="#0e7490" obsChip={h.obsChip || "from posting"}
                  onExpand={(e) => openSheet("Hard gates", "critcard", { tag: h.label, obs: h.obs, interp: h.why, appl: "Meet it, show the equivalent, or expect an auto-reject before a human reads your CV.", persona: "HIRING FILTER", accent: "#0e7490", obsChip: h.obsChip || "from posting" }, e)} />)}
              </>}
              {!critical.hiringFilter.length && !critical.qoi.length && <p style={manuP}>No gate lines or gradeable requirement claims were found in this ad{critical.adText ? "" : " (no ad text available)"} - nothing is graded that was not written.</p>}
            </div>
  );
  const winQoI = (<div style={{ maxWidth: 880 }}><div style={{ display: "flex", flexDirection: "column" }}>{secQoI}</div>{!critical.qoi.length && <p style={manuP}>No gradeable requirement claims in this ad - nothing is graded that was not written.</p>}</div>);
  const winGraphs = (<div style={{ maxWidth: 1100 }}><div style={{ background: "#fff", border: "1px solid #eceae2", borderRadius: 12, padding: 16, marginTop: 12 }}>
                {rolePane || <p style={{ fontSize: "0.875rem", color: "#94a0b0" }}>The role graph appears once the role resolves duties and skills.</p>}
              </div></div>);
  const winSalary = (<div style={{ maxWidth: 880 }}><div style={{ display: "flex", flexDirection: "column" }}>{secSalaryPos}</div>{!critical.salaryPos && <p style={manuP}>Withheld - this ad states no salary band, or too few comparable salary-stating ads were sampled.</p>}</div>);
  const winIndicators = (<div style={{ maxWidth: 880 }}><div style={{ display: "flex", flexDirection: "column" }}>{secIndicators}</div>{!(critical.indicators && critical.indicators.length) && <p style={manuP}>Withheld - not enough sampled ads to compute market signals.</p>}</div>);
  const winTrajectory = (<div style={{ maxWidth: 880 }}><div style={{ display: "flex", flexDirection: "column" }}>{secTrajectory}</div>{!critical.trajectory && <p style={manuP}>Withheld - fewer than 4 engine-classified duties so far.</p>}</div>);
  const winAitrace = (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>{secTrajectory}</div>
              <div style={{ background: "#fff", border: "1px solid #eceae2", borderRadius: 12, padding: 16 }}><AITracePanel result={result} /></div>
            </div>
  );
  const winOIA = (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>JOB AD DISSECTION {String.fromCharCode(0x00b7)} O-I-A LENS</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>Observation {String.fromCharCode(0x2192)} Interpretation {String.fromCharCode(0x2192)} Application</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Nothing is interpreted that was not first observed; nothing applied that was not first interpreted. Every read traces back to a verbatim span.</p>
              {dissection.spans.map((s) => { const b = BANDS[s.band]; const lc = LENS[s.lens]; const oiaOn = activeSpan === s.id; return (
                <div key={s.id} data-oia-anchor={s.id} onClick={() => setActiveSpan(oiaOn ? null : s.id)}
                  style={{ background: "#fff", border: "1px solid " + (oiaOn ? "#1a56db" : "#e6e3db"), borderRadius: 12, overflow: "hidden", marginBottom: 8, cursor: "pointer", ...(oiaOn ? { outline: "2px solid #c7d6ff", outlineOffset: 2 } : {}) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#fbfaf8", borderBottom: "1px solid #f0eee7" }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".05em", color: "#fff", background: lc, borderRadius: 4, padding: "2px 7px" }}>{s.lens} LENS</span>
                    {b && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: b.ink, background: b.bg, border: "1px solid " + b.border, borderRadius: 5, padding: "1px 7px" }}>{b.label}</span>}
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
                      <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b4bbd" }}>method {String.fromCharCode(0x00b7)} {s.exposure ? "rule (engine)" : "none"} {String.fromCharCode(0x00b7)} conf {s.exposure ? "high" : "withheld"}</span>
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
  );
  const winCritical = (

            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 6 }}>CRITICAL READ {RS_DOT} PLAIN-LANGUAGE CHECK</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.5rem", color: "#16202e", margin: "0 0 6px" }}>What the ad says {String.fromCharCode(0x2192)} what it leaves empty</h2>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55, margin: "0 0 16px", maxWidth: 640 }}>Deterministic and verbatim-only: every flag is a phrase lifted straight from the posting. Empty or inflated wording gets a plain-language counter - the &quot;question-mark move&quot;.</p>
              {critical.noodles.length > 0 && <>
                <h3 style={critH3}>Word noodles {RS_DOT} shiny but empty</h3>
                {critical.noodles.map((n) => <CritCard key={n.id} tag={n.cat} obs={n.phrase} interp={n.why} appl={n.counter}
                  onExpand={(e) => openSheet("Word noodles", "critcard", { tag: n.cat, obs: n.phrase, interp: n.why, appl: n.counter }, e)} />)}
              </>}
              {critical.forensic.length > 0 && <>
                <h3 style={critH3}>Forensic reversal {RS_DOT} aspiration vs evidence</h3>
                {critical.forensic.map((f) => <CritCard key={f.id} tag="aspiration" obs={f.phrase} interp={f.why} appl={f.counter}
                  onExpand={(e) => openSheet("Forensic reversal", "critcard", { tag: "aspiration", obs: f.phrase, interp: f.why, appl: f.counter }, e)} />)}
              </>}
              {/* No.136 G2: the six deterministic lenses render severity-first (flex order =
                  deterministic rank) and are individually dismissible; hidden panels restore
                  from the chip row below. */}
              <div style={{ display: "flex", flexDirection: "column" }}>
              {hiddenPanels.length > 0 && (
                <div style={{ order: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6875rem", color: "#6b6357" }}>hidden panels:</span>
                  {hiddenPanels.map((k) => (
                    <button key={k} type="button" onClick={() => setPanelHidden(k, false)} aria-label={"Restore panel: " + (G2_LABELS[k] || k)}
                      style={{ minHeight: 44, fontFamily: "monospace", fontSize: "0.6875rem", color: "#1d4ed8", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>{(G2_LABELS[k] || k)} +</button>
                  ))}
                </div>
              )}
              <div style={{ order: g2Rank.blindSpots, display: "flex", flexDirection: "column" }}>
              {critical.blindSpots && critical.blindSpots.length > 0 && !hiddenPanels.includes("blindSpots") && <>
                <h3 style={critH3}>Blind spots {RS_DOT} what the ad does not say</h3>
                <WhyLine why={critical.blindSpots.length + " of 6 standard fields are absent from the ad text"} sec="spec No.135 AI-2" />
                {critical.blindSpots.map((b) => <CritCard key={b.id} tag={b.label} obs={"The ad is silent on " + b.label + "."} interp={"Checked the full ad text for any mention - none found. Silence on " + b.label + " is information: it is either unsettled or unfavourable."} appl={b.ask} persona="BLIND-SPOT SCAN" accent="#5b4bbd" obsChip="computed"
                  onExpand={(e) => openSheet("Blind spots", "critcard", { tag: b.label, obs: "The ad is silent on " + b.label + ".", interp: "Checked the full ad text for any mention - none found. Silence on " + b.label + " is information: it is either unsettled or unfavourable.", appl: b.ask, persona: "BLIND-SPOT SCAN", accent: "#5b4bbd", obsChip: "computed" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("blindSpots", true)} aria-label={"Hide panel: " + G2_LABELS.blindSpots} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
              <div style={{ order: g2Rank.contradictions, display: "flex", flexDirection: "column" }}>
              {critical.contradictions && critical.contradictions.length > 0 && !hiddenPanels.includes("contradictions") && <>
                <h3 style={critH3}>Contradictions {RS_DOT} lines that do not belong</h3>
                <WhyLine why={critical.contradictions.length + " duty line" + (critical.contradictions.length === 1 ? " sits" : "s sit") + " outside the ad's majority domain"} sec="spec No.135 AI-2" />
                {critical.contradictions.map((x) => <CritCard key={x.id} tag="mash-up" obs={x.obs} interp={"This line reads as " + x.foreign + ", but the ad's majority domain is " + x.majority + " - a role mash-up or template splice."} appl="Ask which of the two jobs the hire actually owns - and which one performance is judged on." persona="CONTRADICTION SCAN" accent="#0e7490" obsChip="derived"
                  onExpand={(e) => openSheet("Contradictions", "critcard", { tag: "mash-up", obs: x.obs, interp: "This line reads as " + x.foreign + ", but the ad's majority domain is " + x.majority + " - a role mash-up or template splice.", appl: "Ask which of the two jobs the hire actually owns - and which one performance is judged on.", persona: "CONTRADICTION SCAN", accent: "#0e7490", obsChip: "derived" }, e)} />)}
              <button type="button" onClick={() => setPanelHidden("contradictions", true)} aria-label={"Hide panel: " + G2_LABELS.contradictions} style={{ alignSelf: "flex-end", minHeight: 20, marginTop: -10, border: "none", background: "transparent", color: "#b3ab9c", fontFamily: "monospace", fontSize: "0.6875rem", cursor: "pointer", padding: "0 6px" }}>hide {String.fromCharCode(0x2715)}</button>
              </>}
              </div>
              
              
              
              
              </div>
              {critical.falsification.length > 0 && <>
                <h3 style={critH3}>Falsification {RS_DOT} before you trust this read</h3>
                {critical.falsification.map((f) => <CritCard key={f.id} tag={f.tag} obs={f.obs} interp={f.interp} appl={f.appl} persona="FALSIFICATION LENS" accent="#5b4bbd" obsChip="computed"
                  onExpand={(e) => openSheet("Falsification", "critcard", { tag: f.tag, obs: f.obs, interp: f.interp, appl: f.appl, persona: "FALSIFICATION LENS", accent: "#5b4bbd", obsChip: "computed" }, e)} />)}
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
                {cr.ach && cr.ach.likely && (
                  <AdvisoryCard persona="COMPETING HYPOTHESES (ACH)">
                    <p style={{ margin: "0 0 6px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.75rem", color: "#16202e" }}>most consistent with the evidence {RS_DOT} <strong style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>{cr.ach.likely}</strong></p>
                    {cr.ach.read && <p style={{ margin: "0 0 8px", fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.ach.read}</p>}
                    {cr.ach.hypotheses && cr.ach.hypotheses.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {cr.ach.hypotheses.map((h, i) => <li key={i} style={{ fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.5, marginBottom: 4 }}><strong style={{ color: "#16202e" }}>{h.name}:</strong> {h.signal}</li>)}
                      </ul>
                    )}
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
              {(cr && cr.hiring && (cr.hiring.recruiter || cr.hiring.hiringManager || cr.hiring.interviewCoach)) && <>
                <h3 style={critH3}>The other side of the table</h3>
                {cr && cr.hiring && cr.hiring.recruiter && <AdvisoryCard persona="RECRUITER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.recruiter}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.hiringManager && <AdvisoryCard persona="HIRING MANAGER"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.hiringManager}</p></AdvisoryCard>}
                {cr && cr.hiring && cr.hiring.interviewCoach && <AdvisoryCard persona="INTERVIEW COACH"><p style={{ margin: 0, fontSize: "0.875rem", color: "#3a4456", lineHeight: 1.55 }}>{cr.hiring.interviewCoach}</p></AdvisoryCard>}
              </>}
              {!critical.noodles.length && !critical.forensic.length && !critical.falsification.length && !critical.hiringFilter.length && !(critical.blindSpots && critical.blindSpots.length) && !(critical.contradictions && critical.contradictions.length) && !(critical.qoi && critical.qoi.length) && !(critical.indicators && critical.indicators.length) && !critical.trajectory && !critical.salaryPos && !cr && <p style={manuP}>{critical.adText ? "This posting reads plainly - no empty phrasing, inflated language, or template/mash-up/compliance signals flagged. The challenged deep read (AI-assisted) appears here once it finishes." : "No posting text available to run the plain-language check."}</p>}
            </div>
  );
  const winManuscript = (

            <div style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 12, padding: "18px 22px 24px", boxShadow: "0 1px 3px rgba(20,32,46,.05)" }}>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".16em", color: "#6b6357", marginBottom: 8 }}>MANUSCRIPT {String.fromCharCode(0x00b7)} {(employer || "LIVE POSTING").toUpperCase()}</div>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1.55rem", lineHeight: 1.18, color: "#16202e", margin: "0 0 10px" }}>{title || "this role"}</h1>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {/* Chip scopes to the overview paragraph only. The Responsibilities heading
                    below carries its OWN provenance chip so a page mixing verbatim intro +
                    synthesis bullets never lies about either half. Trust-loop rule 4. */}
                <Chip kind={hasVerbatimOverview ? "from MCF" : "AI estimate"}>{String.fromCharCode(0x25cf)} {source || "from MCF"} {String.fromCharCode(0x00b7)} overview {hasVerbatimOverview ? "verbatim" : "synthesis · AI-authored"}</Chip>
                {bandTok && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: bandTok.ink, background: bandTok.bg, border: "1px solid " + bandTok.border, borderRadius: 5, padding: "2px 7px" }}>{bandTok.label}</span>}
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
                if (escoDesc) return <><h2 style={manuH2}>Role overview <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · ESCO taxonomy</span></h2><p style={manuP}>{rsUnderlineSkillTerms(escoDesc, skillTermRe)}</p></>;
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
                    <p style={{ margin: "0 0 4px", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", color: "#7a5a17" }}>WHY THERE ARE NO DUTY LINES HERE</p>
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
                <h2 style={manuH2}>Responsibilities <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#9a6113", background: "#fff4e6", border: "1px solid #f5dcb0", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>AI-extracted · tap a phrase</span></h2>
                <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                  {dissection.spans.filter((x) => x.sec !== "req").map((s) => {
                    if (showClean) return <li key={s.id} style={{ ...manuP, marginBottom: 7 }}>{s.text}</li>;
                    // RS-EV: highlight only an EVIDENCE-linked phrase (skill match / gate);
                    // no evidence -> the line renders fully plain (Human Lead doctrine).
                    const ev = rsEvidencePhrase(s.text, skillTermRe, skills);
                    const navOn = activeSpan === s.id; // reciprocal jump feedback (nav ring, not decoration)
                    if (!ev) return <li key={s.id} id={"li-" + s.id} style={{ ...manuP, marginBottom: 8, ...(navOn ? { outline: "2px solid #c7d6ff", outlineOffset: 3, borderRadius: 6 } : {}) }}>{s.text}</li>;
                    const withheld = !s.band; const st = s.band ? SPAN_STYLE[s.band] : SPAN_STYLE_WITHHELD; const on = activeSpan === s.id;
                    const mark = (
                      <span role="button" tabIndex={0} aria-pressed={on}
                        aria-label={s.text + ". " + ev.why + ". " + (withheld ? "Exposure withheld." : (BANDS[s.band] ? "Exposure " + BANDS[s.band].label + "." : ""))}
                        title={ev.why + (withheld ? " - exposure withheld" : (BANDS[s.band] ? " - " + BANDS[s.band].label : "")) + " - click to analyse"}
                        onClick={() => setActiveSpan(on ? null : s.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : s.id); } }}
                        style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px " + (withheld ? "dashed " : "solid ") + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{ev.phrase}</span>
                    );
                    return (
                      <li key={s.id} id={"li-" + s.id} style={{ ...manuP, marginBottom: 8, ...(navOn ? { outline: "2px solid #c7d6ff", outlineOffset: 3, borderRadius: 6 } : {}) }}>
                        {ev.pre ? ev.pre + " " : ""}{mark}{ev.post || ""}
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
                  <h2 style={manuH2}>{sec.canon || sec.title} <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>verbatim · from posting</span></h2>
                  <ul style={{ margin: "0 0 18px", paddingLeft: 18 }}>
                    {sec.lines.map((ln, li) => {
                      const sp = dissection.spans.find((x) => x.sec === "req" && x.text === ln);
                      if (!sp || showClean) return <li key={li} style={{ ...manuP, marginBottom: 7 }}>{ln}</li>;
                      // RS-EV: same doctrine as duties - evidence phrase or fully plain.
                      const ev = rsEvidencePhrase(ln, skillTermRe, skills);
                      if (!ev) return <li key={li} style={{ ...manuP, marginBottom: 8 }}>{ln}</li>;
                      const on = activeSpan === sp.id; const st = SPAN_STYLE_WITHHELD;
                      const mark = (
                        <span role="button" tabIndex={0} aria-pressed={on}
                          aria-label={ln + ". " + ev.why + ". In the analysis; exposure withheld (requirements are not duty spans)."}
                          title={ev.why + " - click to analyse"}
                          onClick={() => setActiveSpan(on ? null : sp.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(on ? null : sp.id); } }}
                          style={{ cursor: "pointer", background: st.bg, color: st.color, borderBottom: "2px dashed " + st.under, borderRadius: 3, padding: "0 2px", boxShadow: on ? "0 0 0 3px rgba(26,86,219,.28)" : "none" }}>{ev.phrase}</span>
                      );
                      return <li key={li} style={{ ...manuP, marginBottom: 8 }}>{ev.pre ? ev.pre + " " : ""}{mark}{ev.post || ""}</li>;
                    })}
                  </ul>
                </div>
              ))}
              {skills.length > 0 && <>
                <h2 style={manuH2}>Skills the posting asks for <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#0b5e74", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5, padding: "1px 6px", marginLeft: 8, verticalAlign: "middle" }}>tap a skill to analyse</span>
                  {/* W2: say HOW the skill set was anchored - SG-first when SSOC steered it. */}
                  {result && result.ssocResolution && <span title={"Occupation resolved in SSOC 2024 (" + result.ssocResolution.code + " " + result.ssocResolution.title + ", confidence " + result.ssocResolution.confidence + "), crosswalked to ISCO-08 " + result.ssocResolution.iscoTitle + ", then ESCO skills fetched on that clean occupation name - not a blind title match."} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: "#1d4ed8", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRadius: 5, padding: "1px 6px", marginLeft: 6, verticalAlign: "middle" }}>{String.fromCodePoint(0x1f1f8, 0x1f1ec)} anchored via SSOC {result.ssocResolution.code}</span>}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 24).map((s, i) => { const on = focusSkill === i; return (
                  <button key={i} type="button" aria-pressed={on} aria-label={"Analyse skill: " + s}
                    title={(skillObjs[i] && skillObjs[i].level ? "engine level " + skillObjs[i].level + " - " : "") + "click to analyse (O-I-A)"}
                    onClick={() => { setFocusSkill(on ? null : i); if (!on) setActiveSpan(null); }}
                    style={{ minHeight: 44, fontSize: "0.8125rem", fontFamily: "inherit", color: on ? "#fff" : "#0b5e74", background: on ? "#0e7490" : "#e3f5fb", border: "1px solid " + (on ? "#0e7490" : "#bce6f0"), borderRadius: 14, padding: "6px 12px", cursor: "pointer" }}>{s}</button>
                ); })}</div>
              </>}
              {!overview && !dissection.spans.length && <p style={manuP}>The analysed posting did not yield responsibilities text to render as a manuscript.</p>}
            </div>
  );
  const winInspector = (
    <div>
      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".13em", color: "#6b6357", marginBottom: 10 }}>INSPECTOR {RS_DOT} O-I-A</div>
            {/* AI-1: focused O-I-A card for the tapped span/pill - the "door" every element opens. */}
            {(() => {
              const sp = activeSpan ? dissection.spans.find((x) => x.id === activeSpan) : null;
              const so = (focusSkill != null && skillObjs[focusSkill]) ? skillObjs[focusSkill] : null;
              const f = so ? rsSkillFocus(so, dissection.spans) : (sp ? rsSpanFocus(sp, skillObjs, skillTermRe, skills) : null);
              if (!f) return null;
              const chip = (k, label) => { const c = PROV[k] || PROV.unverified; return <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, color: c.ink, background: c.bg, border: "1px solid " + c.border, borderRadius: 4, padding: "1px 6px" }}>{label || k}</span>; };
              return (
                <div style={{ border: "1.5px solid #1a56db", background: "#f5f8ff", borderRadius: 10, padding: "12px 13px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".1em", color: "#142a8e" }}>{f.title.toUpperCase()} {RS_DOT} O-I-A</span>
                    <button onClick={() => { setActiveSpan(null); setFocusSkill(null); }} aria-label="Close analysis card" style={{ marginLeft: "auto", minHeight: 44, minWidth: 44, border: "1px solid #cdd9ff", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
                  </div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>OBSERVATION</div>
                  <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#3a4456", lineHeight: 1.45, margin: "0 0 4px" }}>{String.fromCharCode(0x201c)}{f.obs}{String.fromCharCode(0x201d)}</p>
                  <div style={{ marginBottom: 9 }}>{chip(f.obsChip, f.obsChipLabel)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>INTERPRETATION</div>
                  {f.interp.map((ln, i) => <p key={i} style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 3px" }}>{ln}</p>)}
                  {/* Reciprocity (Human Lead): the card links BACK into the ad - each invoking
                      duty is a jump link that highlights its line in the manuscript. */}
                  {f.invokedBy && f.invokedBy.length > 0 && (
                    <div style={{ margin: "2px 0 3px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#3a4456" }}>Invoked by: </span>
                      {f.invokedBy.map((iv) => (
                        <button key={iv.id} type="button"
                          aria-label={"Jump to duty in the ad: " + iv.text.slice(0, 70)}
                          onClick={() => { setActiveSpan(iv.id); const el = document.getElementById("li-" + iv.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                          style={{ display: "block", width: "100%", textAlign: "left", minHeight: 44, background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontSize: "0.75rem", color: "#1a56db", textDecoration: "underline", textUnderlineOffset: 2, lineHeight: 1.4 }}>
                          {String.fromCharCode(0x201c)}{iv.text.slice(0, 70)}{iv.text.length > 70 ? String.fromCharCode(0x2026) : ""}{String.fromCharCode(0x201d)}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ margin: "3px 0 9px" }}>{chip(f.interpChip)}</div>
                  <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#6b6357", marginBottom: 3 }}>APPLICATION</div>
                  <p style={{ fontSize: "0.75rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 4px" }}>{f.appl}</p>
                  {chip(f.applChip)}
                </div>
              );
            })()}
      {!activeSpan && focusSkill == null && <p style={{ fontSize: "0.8125rem", color: "#94a0b0", lineHeight: 1.5 }}>Tap any skill pill, evidence phrase or duty line - its Observation {RS_DOT} Interpretation {RS_DOT} Application card opens here.</p>}
    </div>
  );
  const winComments = (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".13em", color: "#6b6357" }}>REVIEWER COMMENTS</span>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#a8a193" }}>{marginComments.length}</span>
      </div>
      {marginComments.length === 0 && <p style={{ fontSize: "0.8125rem", color: "#94a0b0" }}>No comments for this analysis yet.</p>}
            
            
            {marginComments.map((c) => {
              const pcol = PERSONA[c.persona] || "#64748b"; const st = commentStatus[c.id]; const active = activeSpan === c.anchor;
              const cb = c.band && BANDS[c.band] ? BANDS[c.band] : null; const anchorText = (dissection.spans.find((s) => s.id === c.anchor) || {}).text || "";
              return (
                <div key={c.id} data-comment-anchor={c.anchor} role="button" tabIndex={0}
                  aria-label={"Highlight the anchor for " + c.persona + "'s " + c.type + " comment"}
                  onClick={() => setActiveSpan(c.anchor)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSpan(c.anchor); } }}
                  style={{ cursor: "pointer", border: "1.5px solid " + (active ? "#1a56db" : st === "accepted" ? "#cce6d4" : st === "rejected" ? "#ecdada" : "#eceae2"), background: active ? "#f5f8ff" : "#fff", borderRadius: 10, padding: "12px 13px", marginBottom: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: "50%", background: pcol, color: "#fff", fontSize: 10, lineHeight: "18px", textAlign: "center", flex: "none" }}>{String.fromCharCode(0x2726)}</span>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, color: pcol }}>{c.persona}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#64748b", background: "#f1f4f8", border: "1px solid #e3e8ef", borderRadius: 5, padding: "1px 6px" }}>{c.type}</span>
                  </div>
                  {cb && <div style={{ marginBottom: 7 }}><span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: cb.ink, background: cb.bg, border: "1px solid " + cb.border, borderRadius: 5, padding: "1px 6px" }}>{cb.label}</span></div>}
                  {anchorText && <p style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: "0.8125rem", color: "#52607a", borderLeft: "2px solid #d9d6cd", paddingLeft: 9, margin: "0 0 8px", lineHeight: 1.4 }}>{String.fromCharCode(0x201c)}{anchorText}{String.fromCharCode(0x201d)}</p>}
                  <p style={{ fontSize: "0.8rem", color: "#3a4456", lineHeight: 1.5, margin: "0 0 8px" }}>{c.reason}</p>
                  {c.type === "suggested rewrite" && (
                    <div style={{ background: "#f6fbf7", border: "1px solid #d8ecdd", borderRadius: 8, padding: "8px 9px", marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#9a6113", textDecoration: "line-through", lineHeight: 1.4, marginBottom: 3 }}>{c.original}</div>
                      <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#0e7490", lineHeight: 1.4 }}>{String.fromCharCode(0x2192)} {c.suggested}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: st ? 0 : 9 }}>
                    <Chip kind={c.prov}>{c.prov}</Chip>
                    <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#a8a193" }}>conf {String.fromCharCode(0x00b7)} {c.conf}</span>
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
    </div>
  );
  // No.138 U2: the desk - window registry + per-tab panel assignment.
  const WIN_LABELS = { verdict: "Verdict", shortcuts: "Shortcuts", manuscript: "Manuscript", comments: "Comments", oia: "O-I-A cards", aitrace: "AI trace", trajectory: "Trajectory", gates: "Hard gates", qoi: "Quality of information", critical: "Critical Read", graphs: "Graphs", salary: "Salary", indicators: "Indicators", inspector: "Inspector" };
  const TAB_WINDOWS = {
    overview: { left: ["verdict"], right: ["shortcuts", "inspector"] },
    ad: { left: ["manuscript"], right: ["inspector", "comments"] },
    duties: { left: ["oia", "aitrace"], right: ["inspector", "trajectory"] },
    gates: { left: ["gates", "qoi"], right: ["inspector"] },
    critical: { left: ["critical"], right: ["inspector"] },
    market: { left: ["graphs"], right: ["salary", "indicators", "inspector"] },
  };
  const [activeWin, setActiveWin] = useState({});
  const [showBuildStatus, setShowBuildStatus] = useState(true); // TEMPORARY - remove with the strip above
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
  const zTopRef = useRef(1400);
  const floatDragRef = useRef(null);
  // MVP connector line: a real SVG line from the active duty span (manuscript) to its
  // matching reviewer comment card - both are read live off the DOM (getBoundingClientRect),
  // never invented coordinates. Draws only when both endpoints are actually docked and
  // visible side by side; if either is floated away, off the active tab, or scrolled out
  // of the desk's viewport slice, no line is drawn rather than pointing at nothing.
  const [connLine, setConnLine] = useState(null);
  useLayoutEffect(() => {
    const desk = deskRef.current;
    const rule = LINK_RULES[tab];
    const id = rule ? rule.active({ activeSpan, focusSkill }) : null;
    if (!desk || !rule || !id) { setConnLine(null); return; }
    const recompute = () => {
      const deskRect = desk.getBoundingClientRect();
      const srcEl = desk.querySelector(rule.left(id));
      const dstEl = desk.querySelector(rule.right(id));
      if (!srcEl || !dstEl) { setConnLine(null); return; }
      const sr = srcEl.getBoundingClientRect();
      const dr = dstEl.getBoundingClientRect();
      if (sr.bottom < deskRect.top || sr.top > deskRect.bottom || dr.bottom < deskRect.top || dr.top > deskRect.bottom) { setConnLine(null); return; }
      setConnLine({
        x1: sr.right - deskRect.left, y1: sr.top + sr.height / 2 - deskRect.top,
        x2: dr.left - deskRect.left, y2: dr.top + dr.height / 2 - deskRect.top,
      });
    };
    recompute();
    const raf = requestAnimationFrame(recompute); // re-measure once layout has settled
    window.addEventListener("resize", recompute);
    desk.addEventListener("scroll", recompute, true); // capture: fires for the scrolling panel too
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", recompute); desk.removeEventListener("scroll", recompute, true); };
  }, [activeSpan, focusSkill, tab, floats, pinned, overrides, activeWin]);
  useEffect(() => {
    if (!postingKey) return;
    loadState("boards", (all) => {
      if (all && all.floats && Array.isArray(all.floats[postingKey])) { setFloats(all.floats[postingKey]); zTopRef.current = 1400 + all.floats[postingKey].length; }
      const d = all && all.desk && all.desk[postingKey];
      if (d) { if (typeof d.splitPct === "number") setSplitPct(Math.max(30, Math.min(75, d.splitPct))); if (d.overrides) setOverrides(d.overrides); if (Array.isArray(d.pinned)) setPinned(d.pinned); }
    });
  }, [postingKey]);
  const persistFloats = (next) => {
    if (!postingKey) return;
    try {
      const raw = localStorage.getItem("v3.state.boards");
      const all = raw ? JSON.parse(raw) : {};
      all.floats = all.floats || {};
      all.floats[postingKey] = next.map(({ id, x, y, w, h, z }) => ({ id, x, y, w, h, z }));
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
  const renderWindow = (id) => (
    id === "verdict" ? winVerdict : id === "shortcuts" ? winShortcuts : id === "manuscript" ? winManuscript :
    id === "comments" ? winComments : id === "oia" ? winOIA : id === "aitrace" ? winAitrace :
    id === "trajectory" ? winTrajectory : id === "gates" ? winGatesHard : id === "qoi" ? winQoI :
    id === "critical" ? winCritical : id === "graphs" ? winGraphs : id === "salary" ? winSalary :
    id === "indicators" ? winIndicators : winInspector
  );
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
      <div style={{ position: "sticky", top: 0, zIndex: 30, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "5px 14px", background: "#fbfaf8", borderBottom: "1px solid #e2e0d8" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#1a56db", fontFamily: "'Spline Sans',sans-serif", fontWeight: 500, fontSize: "0.8125rem", flex: "none" }}><span aria-hidden="true">&#8592;</span> Postings</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".14em", color: "#6b6357" }}>REVIEWING</span>
            <Chip kind="from MCF">{String.fromCharCode(0x25cf)} {source || "from MCF"}</Chip>
          </div>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: "1rem", color: "#16202e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title || "this role"}</div>
          {/* Step 1's picker discloses when a typed prefix/alt title ("Deputy CEO") was
              mapped to a canonical ESCO title for the skills fetch - that disclosure must
              not silently vanish by Step 3. */}
          {result && result.escoCanonicalTitle && (
            <div style={{ fontSize: "0.6875rem", color: "#6b6357", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Skills resolved via the closest ESCO term: <strong style={{ color: "#5a5548" }}>{result.escoCanonicalTitle}</strong></div>
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
          so a denominator here would be invented. This is NOT the same thing as the
          BUILD_STATUS strip below, which reports ENGINEERING feature-completion, not
          this analysis's live progress - the two must never be conflated again. */}
      {bgRunning && (
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "6px 16px", background: "#eef4ff", borderBottom: "1px solid #d7e3fb" }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#2554d6", flex: "none" }} />
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: ".04em", color: "#1f3fae", flex: "none" }}>STILL LOADING</span>
          <span style={{ fontSize: "0.75rem", color: "#2a3f70", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bgStatus}</span>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#5b6d9a", flex: "none" }}>Step {bgStep} {String.fromCharCode(0x00b7)} {Math.floor((bgElapsed || 0) / 60)}:{String((bgElapsed || 0) % 60).padStart(2, "0")}</span>
        </div>
      )}

      {/* TEMPORARY (Human Lead, 08-07 '26): this page is still being built - say so
          honestly instead of letting an unfinished page look finished. Cup-fill per
          workstream, engineering-reported (not a fabricated user-facing metric).
          Remove this strip once every cup reads 100%. */}
      {/* GATED (Human Lead, 08-07 '26): only workstreams below 100% show here - a
          "finished" item has nothing left to report, so it is filtered out rather than
          cluttering the strip. Bars are animated (moving stripe) so it reads as live
          in-progress work, not a static screenshot. */}
      {showBuildStatus && BUILD_STATUS.some(([, pct]) => pct < 100) && (
        <div style={{ flex: "none", padding: "10px 16px 12px", background: "#fef3e0", borderBottom: "2px solid #f5d8a8" }}>
          <style>{`
            @keyframes bs-stripe { to { background-position: 28px 0; } }
            .bs-fill { background-image: linear-gradient(45deg, rgba(255,255,255,.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.35) 50%, rgba(255,255,255,.35) 75%, transparent 75%, transparent); background-size: 14px 14px; animation: bs-stripe 0.7s linear infinite; }
            @media (prefers-reduced-motion: reduce) { .bs-fill { animation: none !important; } }
          `}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".06em", color: "#8a4b0a" }}>BUILDING THE BLUEPRINT</span>
            <span style={{ fontSize: "0.75rem", color: "#8a4b0a" }}>Still in progress - finished workstreams are not listed here.</span>
            <button type="button" onClick={() => setShowBuildStatus(false)} aria-label="Dismiss build-status strip" style={{ marginLeft: "auto", flex: "none", minHeight: 30, minWidth: 30, border: "1px solid #f5d8a8", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#8a4b0a", fontSize: "0.8125rem" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 18px" }}>
            {BUILD_STATUS.filter(([, pct]) => pct < 100).map(([label, pct]) => (
              <div key={label} title={label + ": " + pct + "% built"}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#7a4008", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "#f5d8a8", overflow: "hidden" }}>
                  <div className="bs-fill" style={{ height: "100%", width: pct + "%", borderRadius: 5, background: "#d97706" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No.137 T1: TABS row (Report View anatomy) - folder-style, active tab attaches to
          its toolbar; each tab owns row 3's controls so nothing exists out of context. */}
      <div className="wis-scroll" role="tablist" aria-label="Analysis views" style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 4, padding: "3px 10px 0", background: "#fff", borderBottom: "1px solid #d9dee6", overflowX: "auto" }}>
        {[["overview", "Overview"], ["ad", "The Ad"], ["duties", "Duties & Exposure"], ["gates", "Requirements & Gates"], ["critical", "Critical Read"], ["market", "Market"]].map(([k, lbl]) => {
          const on = tab === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setTab(k)}
              style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: on ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 40, padding: "6px 13px", background: on ? "#fbfaf7" : "#f1f4f8", color: on ? "#142a8e" : "#5b6878", border: "1px solid " + (on ? "#d9dee6" : "#e3e8ef"), borderBottom: on ? "1px solid #fbfaf7" : "1px solid #d9dee6", borderRadius: "10px 10px 0 0", marginBottom: -1, position: "relative", zIndex: on ? 2 : 1 }}>{lbl}</button>
          );
        })}
      </div>
      {/* Row 3: the active tab's toolbar */}
      <div className="wis-scroll" style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", background: "#fbfaf7", borderBottom: "1px solid #eceae2", overflowX: "auto", minHeight: 44 }}>
        {tab === "overview" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>verdict first {String.fromCharCode(0x00b7)} every chip is a door {String.fromCharCode(0x00b7)} time-window: snapshot at analysis</span>}
        {tab === "ad" && [["clean", "Read clean"], ["suggestions", "Evidence view"], ["comments", "Comments"]].map(([k, lbl]) => (
          <button key={k} type="button" aria-pressed={markup === k} onClick={() => setMarkup(k)} style={pillStyle(markup === k)}>{lbl}</button>
        ))}
        {tab === "duties" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>O-I-A cards {String.fromCharCode(0x00b7)} AI trace {String.fromCharCode(0x00b7)} trajectory - as windows in the panels</span>}
        {tab === "gates" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>each requirement graded: verifiable {String.fromCharCode(0x00b7)} vague {String.fromCharCode(0x00b7)} unfalsifiable (QoI, deterministic)</span>}
        {tab === "critical" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>severity-first {String.fromCharCode(0x00b7)} {hiddenPanels.length ? hiddenPanels.length + " hidden panel" + (hiddenPanels.length === 1 ? "" : "s") + " (restore below)" : "panels dismissible"}</span>}
        {tab === "market" && <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357" }}>graph picker inside the pane (Layered {String.fromCharCode(0x00b7)} Knowledge {String.fromCharCode(0x00b7)} SSOC) {String.fromCharCode(0x00b7)} salary position + indicators below</span>}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: ".1em", color: "#b3ab9c" }}>CHIP KEY</span>
          {[["from posting", "verbatim ad text"], ["computed", "engine, deterministic"], ["derived", "rule-based inference"], ["AI estimate", "LLM advisory, not fact"], ["unverified", "no source confirmed"]].map(([k, gloss]) => (
            <span key={k} title={k + " = " + gloss} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", fontWeight: 700, color: PROV[k].ink, background: PROV[k].bg, border: "1px solid " + PROV[k].border, borderRadius: 4, padding: "1px 6px" }}>{k}</span>
          ))}
        </span>
      </div>

      {/* Body: No.138 U2 - the two-panel study desk. Each panel hosts tabbed windows;
          the top tab selects the view-set (window assignment per TAB_WINDOWS). */}
      <div ref={deskRef} className="wis-desk" style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        {/* MVP connector line: real DOM-measured line, active duty -> its comment card. */}
        {connLine && (
          <svg aria-hidden="true" width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", overflow: "visible" }}>
            <path d={"M " + connLine.x1 + " " + connLine.y1 + " C " + ((connLine.x1 + connLine.x2) / 2) + " " + connLine.y1 + ", " + ((connLine.x1 + connLine.x2) / 2) + " " + connLine.y2 + ", " + connLine.x2 + " " + connLine.y2}
              fill="none" stroke="#1a56db" strokeWidth={2} strokeDasharray="none" opacity={0.85} />
            <circle cx={connLine.x1} cy={connLine.y1} r={4} fill="#1a56db" />
            <circle cx={connLine.x2} cy={connLine.y2} r={4} fill="#1a56db" />
          </svg>
        )}
        {/* U4-C: draggable splitter sits between the mapped panels (absolute at splitPct). */}
        <div role="separator" aria-orientation="vertical" aria-label="Resize panels" tabIndex={0}
          onPointerDown={(e) => { splitDragRef.current = { sx: e.clientX, s0: splitPct }; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { const d = splitDragRef.current; if (!d || !deskRef.current) return; const w = deskRef.current.getBoundingClientRect().width; setSplitPct(Math.max(30, Math.min(75, d.s0 + ((e.clientX - d.sx) / w) * 100))); }}
          onPointerUp={() => { if (splitDragRef.current) { splitDragRef.current = null; persistFloats(floats); } }}
          onKeyDown={(e) => { if (e.key === "ArrowLeft") setSplitPct((v) => Math.max(30, v - 2)); if (e.key === "ArrowRight") setSplitPct((v) => Math.min(75, v + 2)); }}
          style={{ position: "absolute", top: 0, bottom: 0, left: "calc(" + splitPct + "% - 4px)", width: 8, cursor: "col-resize", zIndex: 6, background: "transparent", touchAction: "none" }} />
        {["left", "right"].map((side) => {
          const base = (TAB_WINDOWS[tab] || TAB_WINDOWS.overview)[side];
          const ov = overrides[tab] || {};
          const winsAll = base.filter((w) => !ov[w] || ov[w] === side)
            .concat(Object.keys(ov).filter((w) => ov[w] === side && !base.includes(w)));
          const wins = winsAll.filter((w) => !floats.some((f) => f.id === w) && !pinned.includes(w));
          const actPref = (activeWin[tab] && activeWin[tab][side]) || winsAll[0];
          const act = wins.includes(actPref) ? actPref : wins[0];
          return (
            <div key={side} className="wis-panel" style={{ flex: side === "left" ? "0 0 " + splitPct + "%" : "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: side === "right" ? "1px solid #e2e0d8" : "none", background: side === "right" ? "#f4f6fa" : "#e9edf3", outline: dockHover === side ? "3px solid #1a56db" : "none", outlineOffset: -3, transition: "outline-color .1s" }}>
              <div className="wis-scroll" role="tablist" aria-label={side + " panel windows"} style={{ flex: "none", display: "flex", gap: 4, padding: "4px 8px 0", overflowX: "auto", borderBottom: "1px solid #e2e0d8", background: "#fbfaf7" }}>
                {wins.map((w) => { const on = act === w; return (
                  <button key={w} type="button" role="tab" aria-selected={on}
                    onClick={() => setActiveWin((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [side]: w } }))}
                    style={{ fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: on ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", minHeight: 40, padding: "6px 12px", background: on ? (side === "right" ? "#f4f6fa" : "#e9edf3") : "#fff", color: on ? "#142a8e" : "#5b6878", border: "1px solid " + (on ? "#d9dee6" : "#e3e8ef"), borderBottom: on ? "1px solid transparent" : "1px solid #d9dee6", borderRadius: "9px 9px 0 0", marginBottom: -1, position: "relative", zIndex: on ? 2 : 1 }}>{WIN_LABELS[w]}</button>
                ); })}
                {/* U3: tear off the ACTIVE window into the float layer. Subtle by design
                    (Human Lead, 08-07 '26): icon-only, muted, small footprint - the panel
                    strip should not read as one more big tab. Meaning still carried via
                    aria-label + title, not lost, just not shouting visually. */}
                {act && (
                  <button type="button" onClick={() => tearOff(act)} aria-label={"Float this window: " + WIN_LABELS[act]}
                    title={"Tear off " + WIN_LABELS[act] + " into a floating window"}
                    style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 30, padding: "6px 6px", marginBottom: -1, border: "none", borderBottom: "1px solid transparent", background: "transparent", color: "#a8a193", cursor: "pointer", fontSize: "0.8125rem", opacity: 0.7 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#5b6878"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.color = "#a8a193"; }}>
                    <span aria-hidden="true">{String.fromCharCode(0x29c9)}</span>
                  </button>
                )}
              </div>
              <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px 48px", position: "relative" }}>
                {dockHover === side && <div aria-hidden="true" style={{ position: "sticky", top: 0, zIndex: 5, textAlign: "center", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#1a56db", background: "#eaf0ff", border: "1px dashed #1a56db", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>drop to dock here as a tab</div>}
                {act ? renderWindow(act) : <p style={{ fontSize: "0.8125rem", color: "#94a0b0", lineHeight: 1.5 }}>All of this panel's windows are floating or pinned - close or unpin one to dock it back here.</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* No.138 U3: the float layer - torn-off windows live here, above the desk. */}
      {floats.map((f) => (
        <div key={f.id} role="dialog" aria-label={WIN_LABELS[f.id] + " (floating window)"}
          onPointerDown={() => bringToFront(f.id)}
          style={{ position: "fixed", left: f.x, top: f.y, width: f.w, height: f.h, zIndex: f.z, background: "#fbfaf8", border: "1px solid #d9dee6", borderRadius: 12, boxShadow: "0 18px 50px rgba(15,23,42,0.28)", display: "flex", flexDirection: "column", resize: "both", overflow: "hidden", minWidth: 300, minHeight: 200 }}>
          <div onPointerDown={(e) => startFloatDrag(e, f.id)} onPointerMove={moveFloatDrag} onPointerUp={stopFloatDrag} onPointerCancel={stopFloatDrag}
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8", cursor: "move", touchAction: "none" }}>
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{WIN_LABELS[f.id]}</span>
            <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#6b6357", flex: "none" }}>drag {String.fromCharCode(0x00b7)} resize corner</span>
            <button type="button" onClick={() => { setPinned((prev) => prev.includes(f.id) ? prev : prev.concat(f.id)); dockBack(f.id); }} aria-label={"Pin " + WIN_LABELS[f.id] + " to the right edge (auto-hide)"}
              title="Pin to edge (auto-hide)"
              style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>pin</button>
            <button type="button" onClick={() => dockBack(f.id)} aria-label={"Close and dock " + WIN_LABELS[f.id] + " back to its panel"}
              style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>{renderWindow(f.id)}</div>
        </div>
      ))}

      {/* U4-B: pinned edge strip (auto-hide) + the slide-over panel. */}
      {pinned.length > 0 && (
        <div style={{ position: "fixed", right: 0, top: "30%", zIndex: 1395, display: "flex", flexDirection: "column", gap: 4 }}>
          {pinned.map((id) => (
            <button key={id} type="button" onClick={() => setSlideOpen(slideOpen === id ? null : id)} aria-expanded={slideOpen === id}
              aria-label={"Slide out pinned window: " + WIN_LABELS[id]}
              style={{ writingMode: "vertical-rl", minWidth: 44, minHeight: 88, padding: "10px 6px", fontFamily: "'Spline Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#142a8e", background: "#eaf0ff", border: "1px solid #c7d6ff", borderRight: "none", borderRadius: "9px 0 0 9px", cursor: "pointer" }}>{WIN_LABELS[id]}</button>
          ))}
        </div>
      )}
      {slideOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 92vw)", zIndex: 1396, background: "#fbfaf8", borderLeft: "1px solid #d9dee6", boxShadow: "-14px 0 40px rgba(15,23,42,.22)", display: "flex", flexDirection: "column", animation: "wisSlideIn .3s ease" }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8" }}>
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e" }}>{WIN_LABELS[slideOpen]}</span>
            <button type="button" onClick={() => { setPinned((prev) => prev.filter((x) => x !== slideOpen)); setSlideOpen(null); }} aria-label="Unpin - dock this window back to its panel" style={{ flex: "none", minHeight: 32, padding: "0 10px", border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b", fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem" }}>unpin</button>
            <button type="button" onClick={() => setSlideOpen(null)} aria-label="Slide the pinned window away (Esc)" style={{ flex: "none", minHeight: 32, minWidth: 40, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div className="wis-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>{renderWindow(slideOpen)}</div>
        </div>
      )}

      {/* Bottom drawer: cramped/overflow content (tables, long explain cards) with no
          connector partner - mounted outside deskRef so it never perturbs connector
          geometry. Sits below the pinned slide-over (1394 < 1395/1396) so both can be
          open together; floats (high z) stay draggable above everything. Non-blocking
          (aria-modal false) - the desk stays interactive underneath. */}
      {sheet && (
        <div role="dialog" aria-modal="false" aria-label={sheet.title}
          style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1394,
            maxHeight: "min(60vh, 560px)", background: "#fbfaf8",
            borderTop: "1px solid #d9dee6", borderRadius: "14px 14px 0 0",
            boxShadow: "0 -14px 40px rgba(15,23,42,.22)",
            display: "flex", flexDirection: "column", animation: "wisSlideUp .3s ease" }}>
          <div style={{ position: "relative", flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f4f6fa", borderBottom: "1px solid #e2e0d8" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: 6, transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "#d9dee6" }} />
            <span style={{ flex: 1, fontFamily: "'Spline Sans',sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#142a8e", marginLeft: 6 }}>{sheet.title}</span>
            <button type="button" ref={sheetCloseRef} onClick={() => setSheet(null)} aria-label="Close the detail drawer (Esc)"
              style={{ flex: "none", minHeight: 44, minWidth: 44, border: "1px solid #e2e0d8", background: "#fff", borderRadius: 7, cursor: "pointer", color: "#64748b" }}>{String.fromCharCode(0x2715)}</button>
          </div>
          <div style={{ overflowY: "auto", padding: "4px 16px 20px" }}>{renderSheet(sheet)}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 18px", background: "#142a8e" }}>
        <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#dbe2ff" }}>Source: {source || "MyCareersFuture"} {String.fromCharCode(0x00b7)} Confidence: {footerConf} {String.fromCharCode(0x00b7)} Time-window: snapshot at analysis</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#fff", fontWeight: 500 }}>AI-assisted {String.fromCharCode(0x00b7)} human decides</span>
          {version && <span title={"SG Career View " + version} style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.6875rem", color: "#8595d6" }}>v{version}</span>}
        </div>
      </div>
    </div>
    </>
  );
}

const manuH2 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#16202e", margin: "0 0 9px" };
const manuP = { fontSize: "0.9375rem", color: "#3a4456", lineHeight: 1.6, margin: "0 0 12px" };
const oiaKick = { fontFamily: "'Spline Sans Mono',monospace", fontSize: "0.5rem", fontWeight: 600, letterSpacing: ".12em", color: "#b3ab9c", marginBottom: 6 };
const critH3 = { fontFamily: "'Spline Sans',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#16202e", margin: "8px 0 5px" };
