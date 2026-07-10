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
import { fetchEmployerRegistration, fetchEmployerPostings } from "./App.jsx";
// PR 1 (Part B.4, v3-workflow-and-step3-remediation-spec.md): rules constants, shared
// components/tokens, the desk layout engine, and the 14 window bodies now live under
// ./review/ - moved verbatim, zero behaviour change. State and all rs*() logic stay here.
import { RS_RESP_RE, RS_REQ_RE, RS_HEAD_RE, RS_EXP_BAND, RS_STOP, RS_VERB, RS_ROUTE, RS_HALF_LIFE, RS_DOT, RS_SEC_MAP, RS_TIME_LINE, RS_GATES, RS_NOODLES, RS_ASPIRATION, RS_INFLATED, RS_VAGUE_DUTY, RS_COMPLIANCE, RS_BLIND_CHECKS, RS_DOMAINS, RS_EMPTYPE_MAP } from "./review/rs-rules.js";
import { BANDS, PROV, SPAN_STYLE, SPAN_STYLE_WITHHELD, WhyLine, CritCard, Chip, critH3 } from "./review/shared.jsx";
import Desk from "./review/Desk.jsx";
// PR 2 (Part B.3): the declarative window registry is the single source of truth -
// window render functions, labels, tab placement and the connector anchor contract
// all derive from it. The 14 individual window imports live inside the registry now.
import { WINDOWS, LINK_RULES } from "./review/registry.jsx";

// Doctrine exposure bands (fixed order, S1.2) - colour encodes band only.
// Build-status percentages for the strip above the tabs now come from
// blueprint-status.json - a real tracked record (single source of truth), not a
// hand-edited array in this component. Edit the JSON file when a workstream ships.
const BUILD_STATUS = (BLUEPRINT_STATUS.workstreams || []).map((w) => [w.name, w.pct]);
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
  // No.138 U2: WINDOW RENDERERS - bodies extracted verbatim to ./review/windows/*;
  // winCtx is the component-state closure they used to capture. Built here, AFTER the
  // layout-state block, because openSheet is a const declared above (TDZ) - the win*
  // consts are only consumed by renderWindow below, so later construction is identical.
  const winCtx = { result, title, employer, source, posting, rolePane, onRetryDuties, critical, dissection, cr, adSections, duties, skills, skillObjs, skillTermRe, bandTok, overview, hasVerbatimOverview, showClean, marginComments, commentStatus, setCommentStatus, activeSpan, setActiveSpan, focusSkill, setFocusSkill, setTab, hiddenPanels, setPanelHidden, g2Rank, G2_LABELS, openSheet, secQoI, secSalaryPos, secIndicators, secTrajectory, rsUnderlineSkillTerms, rsEvidencePhrase, rsSkillFocus, rsSpanFocus };
  // PR 2 (Part B.3): windows render straight off the registry - the hand-maintained
  // ternary chain is gone; an unknown id falls back to the inspector, as before.
  const winEls = {};
  WINDOWS.forEach((w) => { winEls[w.id] = w.render(winCtx); });
  const renderWindow = (id) => (winEls[id] !== undefined ? winEls[id] : winEls.inspector);
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

      {/* Body: No.138 U2 - the two-panel study desk, float layer, pinned strip,
          slide-over and bottom sheet - JSX moved verbatim to ./review/Desk.jsx.
          Option 1: all state stays here and passes down as props. */}
      <Desk deskRef={deskRef} connLine={connLine} splitPct={splitPct} setSplitPct={setSplitPct} splitDragRef={splitDragRef} persistFloats={persistFloats} floats={floats} tab={tab} overrides={overrides} pinned={pinned} activeWin={activeWin} setActiveWin={setActiveWin} dockHover={dockHover} renderWindow={renderWindow} tearOff={tearOff} startFloatDrag={startFloatDrag} moveFloatDrag={moveFloatDrag} stopFloatDrag={stopFloatDrag} bringToFront={bringToFront} dockBack={dockBack} setPinned={setPinned} slideOpen={slideOpen} setSlideOpen={setSlideOpen} sheet={sheet} setSheet={setSheet} sheetCloseRef={sheetCloseRef} renderSheet={renderSheet} />


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

