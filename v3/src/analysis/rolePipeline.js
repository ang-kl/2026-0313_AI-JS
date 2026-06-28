// rolePipeline.js - the deep role-analysis + knowledge-graph pipeline, ported verbatim
// from the origin v3/src/App.jsx so the slim app analyses postings 'as origin'.
// Self-contained: only external calls are /api/claude and /api/alert. No imports.
// Entry points exported at the foot. Do NOT edit the analysis bodies - byte-faithful port.
/* eslint-disable */

// --- Block A: Claude + JSON plumbing (origin 1647-1809) ---
async function claudeCall(prompt, maxTokens, attempt = 1, systemPrompt = null, model = "claude-haiku-4-5-20251001") {
  try {
    const body = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    };
    if (systemPrompt) body.system = systemPrompt;

    // Per-call fetch timeout: heavy models (Opus/Sonnet) get a long window;
    // Opus reasons the most, so it gets the full headroom. Haiku scales by size.
    const fetchTimeout =
      model.includes("opus")   ? 180000 :
      model.includes("sonnet") ? 150000 :
      maxTokens > 2500         ? 90000  : 55000;
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), fetchTimeout);

    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(fetchTimer);
    if (!res.ok) {
      let msg = `API error ${res.status}`;
      try {
        const e = await res.json();
        msg = e?.message || e?.error?.message || e?.error || msg;
        if (e?.debug) msg = `${msg} [${e.debug}]`;
        if (e?.code)  msg = `${msg} (${e.code})`;
      } catch(_) {}
      const apiErr = new Error(msg);
      apiErr.status = res.status;
      throw apiErr;
    }
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) throw new Error("Empty response");
    return text;
  } catch(err) {
    // Retry only transient failures. The proxy maps overload/5xx/auth to 503 and
    // network/timeout errors carry no status; a 4xx (e.g. 404 unknown model, 400
    // bad request) is deterministic, so retrying it just wastes time and floods
    // logs/alerts - fail fast instead.
    const retriable = err.status == null || err.status >= 500 || err.status === 429;
    if (attempt < 3 && retriable) {
      const delay = attempt === 1 ? 1500 : 3000;
      await new Promise(r => setTimeout(r, delay));
      return claudeCall(prompt, maxTokens, attempt + 1, systemPrompt, model);
    }
    const tier = model.includes("fable") ? "fable" : model.includes("opus") ? "opus" : model.includes("sonnet") ? "sonnet" : "haiku";
    track("api_error", { model: tier, maxTokens, attempt });
    _alertOutage(err, tier); // builder-side webhook ping (debounced, best-effort, never throws)
    throw err;
  }
}

// ALERT (v3.0.76): fire a debounced, best-effort beacon to /api/alert so the BUILDER is told
// when the AI service is unavailable (credit/capacity, overload, 5xx, timeout, auth). Only
// reached after claudeCall has exhausted its retries, so it signals a genuine, persistent
// outage - not a transient blip. Client-side 10-min debounce caps one ping per outage window
// even when many calls fail at once. No user/CV data is sent - error text + model tier + path
// only. /api/alert no-ops unless ALERT_WEBHOOK_URL is configured in the deploy env.
let _lastOutageAlert = 0;
function _alertOutage(err, tier) {
  try {
    const now = Date.now();
    if (now - _lastOutageAlert < 10 * 60 * 1000) return;
    _lastOutageAlert = now;
    const detail = String((err && err.message) || "").slice(0, 300);
    const payload = JSON.stringify({ tier: tier || "", detail, ts: new Date().toISOString(), path: (typeof location !== "undefined" ? location.pathname : "") });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/alert", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/alert", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch (_) { /* alerting must never affect the app */ }
}





function escapeJsonStringControlChars(jsonText) {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < jsonText.length; i++) {
    const c = jsonText[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      out += c;
      escape = true;
      continue;
    }
    if (c === "\"") {
      inString = !inString;
      out += c;
      continue;
    }
    if (inString && c === "\n") { out += "\\n"; continue; }
    if (inString && c === "\r") { out += "\\r"; continue; }
    if (inString && c === "\t") { out += "\\t"; continue; }
    out += c;
  }
  return out;
}

function parseJSONLenient(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (firstErr) {
    try {
      return JSON.parse(escapeJsonStringControlChars(jsonText));
    } catch (_) {
      throw firstErr;
    }
  }
}

function extractJSON(raw, label) {
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const ai = s.indexOf("[");
  const oi = s.indexOf("{");
  const start = (ai < 0) ? oi : (oi < 0) ? ai : Math.min(ai, oi);
  if (start < 0) throw new Error(`No JSON found for ${label}`);
  const isArr = s[start] === "[";
  const OPEN = isArr ? "[" : "{";
  const CLOSE = isArr ? "]" : "}";
  let depth = 0, lastCompleteClose = -1;
  let inString = false, escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === "\"") { inString = !inString; continue; }
    if (inString) continue;
    if (c === OPEN) depth++;
    else if (c === CLOSE) {
      depth--;
      if (depth === 0) {
        try { return parseJSONLenient(s.slice(start, i + 1)); } catch(_) { lastCompleteClose = i; }
      }
      if (isArr && depth === 1) lastCompleteClose = i;
    }
  }
  // Truncation recovery: close array at last complete inner object
  if (isArr && lastCompleteClose > start) {
    const attempt1 = s.slice(start, lastCompleteClose + 1) + "]";
    try { const r = parseJSONLenient(attempt1); if (Array.isArray(r) && r.length > 0) return r; } catch(_) {}
  }
  const end = s.lastIndexOf(CLOSE);
  if (end > start) {
    try { return parseJSONLenient(s.slice(start, end + 1)); } catch(_) {}
  }
  throw new Error(`Could not parse JSON for ${label}`);
}

// --- track (origin 4104-4106) ---
function track(event, props) {
  try { window._vtrack && window._vtrack(event, props); } catch(_) {}
}

// --- toTitleCase (origin 4038-4088) ---
function toTitleCase(str) {
  if (!str) return "";
  const mixedCase = new Set(["MLOps","DevOps","DataOps","GitOps","SecOps","FinOps","AIOps","CloudOps","NetOps",
    "ChatGPT","GitHub","LinkedIn","WordPress","JavaScript","TypeScript","PowerPoint","HubSpot",
    "iPhone","iPad","macOS","iOS","OpenAI","MongoDB","PostgreSQL","MySQL","LaTeX",
    "PyTorch","TensorFlow","AutoCAD","QuickBooks","Salesforce","ServiceNow",
    "eCommerce","eLearning","eHealth","mHealth","fintech","RegTech","InsurTech","PropTech"]);
  const acronyms = new Set([
    // C-suite and leadership
    "CEO","CFO","COO","CTO","CMO","CHRO","CPO","CDO","CIO","CCO","CLO","CSO","CRO","CISO",
    "VP","SVP","EVP","AVP","MD","GM","GP","DGM",
    // HR and people
    "HR","HRM","HRD","HRBP","L&D","OD","TA",
    // Technology
    "IT","ICT","AI","ML","NLP","LLM","RPA","API","SQL","ETL","BI","ERP","CRM","SaaS","PaaS","IaaS",
    "ERP","MRP","SCM","WMS","TMS","LMS","HRIS","HRMS","ATS","CMS","DAM","CDP","DMP","MDM",
    "IoT","AR","VR","XR","UI","UX","UCD","SEO","SEM","PPC","CRO","A/B",
    "TV","POS","ATM","GPS","SMS","MMS","URL","USB","PDF","XML","JSON","HTML","CSS",
    // Finance and business
    "P&L","ROI","ROE","ROA","EBITDA","EBIT","NPV","IRR","DCF","WACC","KPI","OKR","SLA","NPS",
    "B2B","B2C","D2C","SME","SMB","MNC","IPO","M&A","PE","VC","LBO","MBO",
    "IFRS","GAAP","FASB","IASB","FRS","SSAP","IPSAS","XBRL","GST","VAT","WHT","MAS","SGX",
    // Operations and supply chain
    "FMCG","SKU","PO","SO","GRN","3PL","4PL","DC","WH","MOQ","EOQ","COGS","BOM","MPS","MRP",
    "SOP","SOW","RFP","RFQ","RFI","NDA","MSA","SLA","OLA","KPI","OTIF","DIFOT",
    // Professional and regulatory
    "NGO","NPO","IGO","UN","EU","ASEAN","MOU","MOA","AGM","EGM","AGM",
    "ISO","GDPR","PDPA","SOX","HIPAA","PCI","AML","KYC","ESG","CSR","GRI","SDG",
    // Healthcare
    "GP","A&E","ICU","CCU","ED","OT","OPD","IPD","GP","PHC","IHC",
    // Education
    "K12","STEM","STEAM","MBA","MBA","PhD","BSc","MSc","BA","MA","BEng","MEng",
    // Marketing and comms
    "PR","IR","GR","CSR","ATL","BTL","TTL","OOH","CTA","CTR","CPM","CPC","CPL","CAC","LTV","CLV",
    // Media, broadcast, entertainment
    "VFX","CGI","CG","3D","2D","HD","4K","8K","UHD","FPS","DJ","MC","FM","AM","EP","PR",
    // Project and quality
    "PM","PMO","PMP","PRINCE2","SCRUM","AGILE","LEAN","SIX","TQM","QA","QC","ISO",
  ]);
  const lowercase = new Set(["of","and","the","in","at","for","to","with","a","an","by","or","nor","but","from","on","into","as","via","per","vs"]);
  return str.trim().replace(/\b\w+/g, (w, offset, full) => {
    if (mixedCase.has(w)) return w;
    const up = w.toUpperCase();
    if (acronyms.has(up)) return up;
    // Keep connectors lowercase unless they are the first word
    if (lowercase.has(w.toLowerCase()) && offset > 0) return w.toLowerCase();
    // Do not capitalise if word is preceded by an apostrophe (e.g. company's not company'S)
    if (offset > 0 && full[offset - 1] === "'") return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

// --- Skill helpers (origin 2103-2143, 2149-2182) ---
async function getSkills(title, group, iscoCode) {
  // 4A: ISCO-based skill target
  const firstDigit = parseInt((iscoCode || "0")[0], 10);
  let skillTarget = 25;
  if (firstDigit >= 4 && firstDigit <= 5) skillTarget = 18;
  if (firstDigit >= 6 && firstDigit <= 9) skillTarget = 14;

  const SYSTEM_SKILLS =
`You are a senior ESCO v1.2 skills taxonomy specialist. Your expertise is identifying the essential skills - technical and human - that define an occupation. You apply Singapore and ASEAN workforce context where relevant.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"skill":"Skill name under 7 words","type":"technical"}]
Field rules:
- n: sequential integer starting at 1
- skill: concise, specific to this occupation - not generic filler
- type: exactly "technical" or "soft-skill"
Thinking approach: Before listing skills, ask three questions for each candidate skill - (1) What specific task or decision does a practitioner in this role perform that requires this skill? (2) Could an AI tool be given a clear enough brief to perform this task? (3) Would a recruiter testing this person in an interview assess this specific capability? A skill name must be specific enough that a sophisticated AI prompt could be written around it. If a skill name is too broad to anchor a real prompt, it is too generic.
Quality rules:
- Include at least 4 skills that require human presence, judgment, or empathy
- Skill names must be specific enough to support a sophisticated AI prompt or a meaningful human development action. "Communication Skills" fails this test. "Client Objection Handling in Complex Sales" passes it.
- For technical skills: name the actual task or output, not the tool. "Excel" is not a skill. "Sales Pipeline Data Reconciliation" is.
- No duplicate skills or near-duplicates
- Only genuine ESCO v1.2 essential skills - never invent or pad
Bad example: "Communication Skills" for a Supply Chain Analyst - too generic, no prompt can be written around it
Bad example: "Microsoft Excel" for a Financial Analyst - names the tool, not the skill
Bad example: "Teamwork" for any role - not a discrete assessable capability
Good example: "Supplier Lead Time Variance Analysis" for a Supply Chain Analyst - specific, AI-promptable, interview-testable
Good example: "Financial Variance Reporting" for a Financial Analyst - names the task, not the tool
Good example: "Intraoperative Clinical Decision-Making" for a Surgeon - specific and genuinely human-led`;

  const raw = await claudeCall(
`Occupation: ${title}
ISCO group: ${group}
Return exactly ${skillTarget} essential ESCO v1.2 skills for this role. Cover both technical and soft-skill types. Ensure the list reflects what a practitioner in Singapore or ASEAN actually does in this role.`, 1320, 1, SYSTEM_SKILLS);
  const arr = extractJSON(raw, "skills");
  if (!Array.isArray(arr)) throw new Error("skills: expected array");
  return arr.map(x => ({
    n:    x.n || 0,
    skill:toTitleCase(x.skill || ""),
    type: x.type || "technical",
  })).filter(x => x.skill);
}

async function getSkillsFromPosting(title, postingSkills, postingText) {
  const SYSTEM_PS =
`You are a senior ESCO v1.2 skills taxonomy specialist. You are given ONE real job posting (a job title, the skills the employer listed, and the responsibilities text). Produce the essential skills - technical and human - this specific posting actually demands. You apply Singapore and ASEAN workforce context.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"skill":"Skill name under 7 words","type":"technical"}]
Field rules:
- n: sequential integer starting at 1
- skill: concise, specific to what THIS posting describes - not generic filler. Name the task or output, not a tool ("Excel" is not a skill; "Financial Variance Reporting" is).
- type: exactly "technical" or "soft-skill"
Method: start from the skills the employer listed and the duties in the responsibilities text; normalise and de-duplicate them into proper ESCO-style skill names; then fill out any obvious essential skills the posting implies but did not spell out. Stay grounded in the posting - do not pad with skills it does not support.
Quality rules:
- Return 18 to 25 skills covering both technical and soft-skill types
- Include at least 4 skills that require human presence, judgment, or empathy
- No duplicate or near-duplicate skills
Bad example: "Communication Skills" - too generic
Good example: "Stakeholder Requirements Workshops" - specific, AI-promptable, interview-testable`;
  const seeds = (postingSkills || []).filter(Boolean).slice(0, 15).join(" | ") || "(none listed)";
  const text = String(postingText || "").slice(0, 4000) || "(no responsibilities text available)";
  try {
    const raw = await claudeCall(
`Job title (as posted): ${title}
Skills the employer listed: ${seeds}

Responsibilities text from the posting:
${text}

Return the essential skills this posting demands, grounded in the above.`, 1320, 1, SYSTEM_PS);
    const arr = extractJSON(raw, "posting-skills");
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("posting-skills: empty");
    return arr.map((x, i) => ({ n: x.n || i + 1, skill: toTitleCase(x.skill || ""), type: x.type === "soft-skill" ? "soft-skill" : "technical" })).filter(x => x.skill);
  } catch (e) {
    return getSkills(title, "", "");
  }
}

// --- Phrase helpers (origin 2358-2360) ---
const _PHRASE_STOP = new Set(["with","from","that","this","your","their","they","them","into","onto","upon","will","shall","must","have","been","were","does","done","using","within","across","along","other","others","more","most","some","such","each","both","when","where","which","while","also","over","than","being","make","made","take","taken","take","ensure","provide","support","manage","handle","perform","carry","drive"]);
function _phraseNorm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function _phraseToks(s) { return _phraseNorm(s).split(" ").filter(t => t.length > 3 && !_PHRASE_STOP.has(t)); }

// --- KG constants (origin 3023-3027) ---
const KG_GRAPH_VERSION = "kg1";
// Closed verb set - every edge verb MUST be a member of this array (§5).
// No verb may be added without extending this constant and updating the rule table.
const KG_VERBS = ["depends-on", "invokes", "produces", "informs", "mutates", "accountable-to", "competes-with"];
const _kgGraphCache = new Map();

// --- _rgSlug (origin 3044) ---
function _rgSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "x"; }

// --- gatherStatements / analyseRolePipeline / mapStatementsToEsco (origin 3047-3111) ---
function gatherStatements(result) {
  const rd = result && result.responsibilitiesData;
  const ja = result && result.jobAnatomy;
  let resp = [];
  if (rd && Array.isArray(rd.responsibilities) && rd.responsibilities.length) {
    resp = rd.responsibilities.map((r, i) => ({ id: "r" + (r.n != null ? r.n : i), text: String(r.text || "").trim(), cat: r.cat || "", level: r.level || "HUMAN", sk: Array.isArray(r.sk) ? r.sk : [] })).filter(r => r.text);
  } else if (ja && !ja.fallback && Array.isArray(ja.duties) && ja.duties.length) {
    resp = ja.duties.map((d, i) => ({ id: "d" + (d.n != null ? d.n : i), text: String(d.text || "").trim(), cat: d.layer || "", level: d.exposureNow || "HUMAN", sk: [] })).filter(r => r.text);
  }
  return { responsibilities: resp.slice(0, 22) };
}

async function analyseRolePipeline(title, statements, skills) {
  if (!statements.length) return null;
  const list = statements.map((s, i) => `${i + 1}. ${s.text}`).join("\n").slice(0, 4600);
  const skillHint = (skills || []).map(s => s.skill).filter(Boolean).slice(0, 30).join(", ");
  const SYS_RP =
`ACT AS a job-analysis engine. Given a job title and its itemised responsibility statements, infer (a) the role's likely hard REQUIREMENTS, formal QUALIFICATIONS (degree/licence/certification) and PREFERRED competencies, and (b) for EACH numbered responsibility, the underlying work activities, the skills it implies, and the competency signals it sends to an employer. Singapore context. Output labels only - no prose, no advice, no rewriting.
Return ONLY a JSON object. No text/fences.
Format:
{
 "requirements": ["short hard-requirement phrase", ...],            // 2 to 6
 "qualifications": ["short formal-qualification phrase", ...],       // 0 to 5
 "preferredCompetencies": ["short preferred-competency phrase", ...],// 0 to 6
 "statements": [{"i":1,"activities":["short work-activity phrase", ...],"skills":["short skill phrase", ...],"signals":["short competency-signal phrase", ...]}]   // one object per numbered statement; activities 1-4, skills 1-4, signals 0-3
}
No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Job title: ${title}\nKnown ESCO skills (hints, not exhaustive): ${skillHint || "none"}\nResponsibility statements:\n${list}\n\nAnalyse.`, 2800, 1, SYS_RP);
    const o = extractJSON(raw, "role-pipeline");
    if (!o) return null;
    const ss = x => String(x || "").replace(/"/g, "").trim();
    const arrS = (x, n, len) => Array.isArray(x) ? x.map(v => ss(v).slice(0, len || 80)).filter(Boolean).slice(0, n) : [];
    const stmtMap = {};
    (Array.isArray(o.statements) ? o.statements : []).forEach(st => { const idx = Number(st && st.i); if (!Number.isFinite(idx)) return; stmtMap[idx] = { activities: arrS(st.activities, 4, 90), skills: arrS(st.skills, 4, 70), signals: arrS(st.signals, 3, 80) }; });
    return { requirements: arrS(o.requirements, 6, 80), qualifications: arrS(o.qualifications, 5, 80), preferredCompetencies: arrS(o.preferredCompetencies, 6, 80), statements: stmtMap };
  } catch (_) { return null; }
}

function mapStatementsToEsco(statements, analysed, skills) {
  const sk = skills || [];
  const byN = {}; sk.forEach((s, idx) => { if (s && s.n != null) byN[s.n] = idx; });
  const skNorm = sk.map(s => _phraseNorm(s.skill));
  const skToks = sk.map(s => _phraseToks(s.skill));
  const edges = []; const seen = new Set();
  const pushEdge = (respId, idx, strength) => { if (idx == null || idx < 0) return; const k = respId + "|" + idx; if (seen.has(k)) return; seen.add(k); edges.push({ respId, skillIdx: idx, strength }); };
  statements.forEach((st, i) => {
    (st.sk || []).forEach(n => { if (byN[n] != null) pushEdge(st.id, byN[n], 1); });
    const inf = (analysed && analysed.statements && analysed.statements[i + 1]) || null;
    (inf ? inf.skills : []).forEach(p => {
      const pn = _phraseNorm(p), pt = _phraseToks(p);
      if (!pn) return;
      let bi = -1, bs = 0;
      for (let j = 0; j < sk.length; j++) {
        if (skNorm[j] && (skNorm[j] === pn || (pn.length > 4 && skNorm[j].includes(pn)) || (skNorm[j].length > 4 && pn.includes(skNorm[j])))) { bi = j; bs = 1; break; }
        const sh = pt.length ? pt.filter(t => skToks[j].includes(t)).length : 0;
        if (sh >= 2 && bs < 1) { bi = j; bs = 0.6; }
      }
      if (bi >= 0) pushEdge(st.id, bi, bs);
    });
  });
  return { edges, usedSkillIdxs: Array.from(new Set(edges.map(e => e.skillIdx))) };
}

// --- KG stems + buildKnowledgeGraph (origin 3279-3578) ---
const _KG_OUTPUT_STEMS = ["report", "plan", "strategy", "framework", "roadmap", "policy", "brief", "proposal", "dashboard", "model", "assessment", "review"];
// Org-change marker stems: a duty containing one of these mutates an org node.
const _KG_ORG_CHANGE_STEMS = ["transform", "improve", "redesign", "implement", "lead", "change", "reform", "drive", "build", "establish", "develop", "create", "deploy", "rollout", "execute"];
// Department/function marker stems: a duty or occupation containing one of these grounds a dept node.
const _KG_DEPT_STEMS = ["team", "function", "division", "department", "group", "unit", "centre", "center", "office", "bureau", "branch", "section", "platform", "practice", "programme", "program"];

function _kgContainsAny(text, stems) {
  const t = _phraseNorm(text);
  return stems.some(s => t.includes(s));
}

function buildKnowledgeGraph(result, title) {
  const generatedAt = new Date().toISOString();

  // ── 1. Entity extraction ──────────────────────────────────────────────────

  // 1a. Role node (verbatim title; source always "mcf" because the role comes from MCF)
  const roleId = "role:" + _rgSlug(String(title || ""));
  const roleNode = {
    id: roleId,
    type: "role",
    cluster: "department",
    label: String(title || ""),
    source: "mcf",
    confidence: "high",
  };

  // 1b. Duty nodes from gatherStatements (verbatim text from MCF/analysis)
  const { responsibilities: duties } = gatherStatements(result || {});
  const dutyNodes = duties.map((d) => ({
    id: "duty:" + d.id,
    type: "duty",
    cluster: "individual",
    label: d.text,
    source: "mcf",
    confidence: "high",
    level: d.level || "HUMAN",
    ref: {},
  }));

  // 1c. Skill nodes from result.skills (verbatim ESCO skill names)
  const skills = (result && result.skills) || [];
  const skillNodes = skills.map((s, idx) => ({
    id: "skill:" + (s.escoUri ? _rgSlug(String(s.escoUri).split("/").pop()) : "n" + (s.n != null ? s.n : idx)),
    type: "skill",
    cluster: "individual",
    label: String(s.skill || ""),
    source: "esco",
    confidence: s.level === "HIGH" ? "high" : s.level === "MEDIUM" ? "medium" : "low",
    level: s.level || "HUMAN",
    ref: { escoUri: s.escoUri || "" },
  })).filter((n) => n.label);

  // 1d. Occupation node(s) from result.escoOccupation (verbatim ESCO label)
  const escoOcc = result && result.escoOccupation;
  const occNodes = [];
  if (escoOcc && (escoOcc.preferredLabel || escoOcc.label)) {
    occNodes.push({
      id: "occupation:" + _rgSlug(escoOcc.preferredLabel || escoOcc.label || ""),
      type: "occupation",
      cluster: "department",
      label: String(escoOcc.preferredLabel || escoOcc.label || ""),
      source: "esco",
      confidence: "medium",
      ref: { iscoCode: escoOcc.isco || escoOcc.iscoCode || "" },
    });
  }

  // 1e. Qualification nodes from parseJobAd req-kind sections (verbatim phrases only)
  const qualNodes = [];
  const rd = result && result.responsibilitiesData;
  const adJobs = (rd && Array.isArray(rd.jobs)) ? rd.jobs : [];
  const adJob = adJobs.find((j) => j && (j.description || j.responsibilitiesText)) || adJobs[0] || null;
  if (adJob) {
    const adText = String(adJob.description || adJob.responsibilitiesText || "");
    const stripped = adText.replace(/<[^>]+>/g, " ").replace(/\r/g, "").trim();
    try {
      const sections = parseJobAd(stripped);
      const reqSections = sections.filter((s) => s.kind === "req");
      const seenQ = new Set();
      reqSections.forEach((sec) => {
        sec.blocks.forEach((b) => {
          if (b.t !== "li" && b.t !== "p") return;
          const phrase = String(b.text || "").trim().slice(0, 120);
          if (!phrase || phrase.length < 8) return;
          const key = _phraseNorm(phrase).slice(0, 60);
          if (seenQ.has(key)) return;
          seenQ.add(key);
          qualNodes.push({
            id: "qual:" + _rgSlug(phrase),
            type: "qualification",
            cluster: "individual",
            label: phrase,
            source: "mcf",
            confidence: "high",
            ref: {},
          });
        });
      });
    } catch (_) { /* parseJobAd failure - omit qual nodes */ }
  }
  // Cap qualifications to 8 to keep the graph legible
  const cappedQualNodes = qualNodes.slice(0, 8);

  // 1f. Organisation node - ONLY if the posting names the org (verbatim from metadata)
  const orgNodes = [];
  let orgNodeId = null;
  const employer = (adJob && (adJob.hiringCompanyName || adJob.postedCompanyName || adJob.employer)) || null;
  if (employer) {
    orgNodeId = "org:" + _rgSlug(employer);
    orgNodes.push({
      id: orgNodeId,
      type: "organisation",
      cluster: "organisation",
      label: employer,
      source: "mcf",
      confidence: "high",
      ref: {},
    });
  }

  // 1g. Mirror-occupation nodes - ONLY if result already carries computed mirrorRoles
  // (engine mirrorRoles: [{ isco, title, sharePct, index, band, zRange }])
  const mirrorNodes = [];
  const mirrorRoles = result && result.mirrorRoles;
  if (Array.isArray(mirrorRoles) && mirrorRoles.length) {
    mirrorRoles.slice(0, 4).forEach((m) => {
      if (!m || !m.title) return;
      mirrorNodes.push({
        id: "mirror:" + _rgSlug(String(m.title || "") + (m.isco || "")),
        type: "mirror-occupation",
        cluster: "competition",
        label: String(m.title || ""),
        source: "computed",
        confidence: m.sharePct >= 30 ? "high" : m.sharePct >= 15 ? "medium" : "low",
        ref: { iscoCode: String(m.isco || "") },
      });
    });
  }

  // ── 2. Semantic clustering (honesty-gated) ────────────────────────────────

  // Department cluster grounding: check if any duty or occupation mentions a team/function
  const hasDeptMarker =
    duties.some((d) => _kgContainsAny(d.text, _KG_DEPT_STEMS)) ||
    occNodes.some((n) => _kgContainsAny(n.label, _KG_DEPT_STEMS));

  // Organisation cluster: grounded only if org node was created
  const hasOrgCluster = orgNodes.length > 0;

  // Competition cluster: grounded only if mirrorRoles present
  const hasCompetitionCluster = mirrorNodes.length > 0;

  // Mutates-target: check if any duty carries an org-change marker AND we have an org node
  const orgChangeDuties = orgNodeId
    ? duties.filter((d) => _kgContainsAny(d.text, _KG_ORG_CHANGE_STEMS))
    : [];

  // Re-cluster duty nodes: those with org-change markers that point to an org node
  // keep cluster "individual" (the individual performs the action) but also get a
  // "mutates" edge to the org node. No cluster change needed (an individual act
  // can have org-level impact).

  // Department cluster: assign role node and occupation nodes to "department"
  // (already set above). If no dept marker at all, downgrade occ nodes to "unscoped".
  const adjustedOccNodes = occNodes.map((n) => ({
    ...n,
    cluster: hasDeptMarker ? "department" : "unscoped",
  }));

  // ── 3. Relational mapping (verb rule table §5) ────────────────────────────

  const edges = [];

  // Build duty-to-skill edges using mapStatementsToEsco (reuse existing logic)
  // mapStatementsToEsco returns { edges: [{respId, skillIdx, strength}], usedSkillIdxs }
  // respId matches d.id from gatherStatements (e.g. "r3"), skillIdx is the index in skills[]
  const mapping = mapStatementsToEsco(duties, null, skills);
  // Map skills[] index to KG node id (parallel to skillNodes array)
  const skillIdxToNodeId = {};
  skills.forEach((_s, i) => { skillIdxToNodeId[i] = skillNodes[i] ? skillNodes[i].id : null; });

  // 3a. role -> duty: invokes
  dutyNodes.forEach((dn) => {
    const weight = dn.level === "HIGH" ? 1.0 : dn.level === "MEDIUM" ? 0.8 : 0.65;
    edges.push({ source: roleId, target: dn.id, verb: "invokes", weight, source_tag: "computed" });
  });

  // 3b. duty -> skill: depends-on (from mapStatementsToEsco edges)
  mapping.edges.forEach((e) => {
    const dutyId = "duty:" + e.respId;
    const skillId = skillIdxToNodeId[e.skillIdx];
    if (!skillId) return;
    // Verify the duty node exists
    if (!dutyNodes.find((d) => d.id === dutyId)) return;
    edges.push({
      source: dutyId,
      target: skillId,
      verb: "depends-on",
      weight: Math.round(Math.max(0.05, Math.min(1, e.strength)) * 100) / 100,
      source_tag: "computed",
    });
  });

  // 3c. skill -> occupation: informs. Every resolved ESCO skill is evidence for the
  // occupation match (the skills come from the role's ESCO resolution), so each skill
  // node informs the occupation DIRECTLY - not gated on the duty mapping (which is empty
  // when a role resolves skills but no duties). This keeps the graph wired for skills-only
  // roles; the dedup + verb-closure passes below still apply. (KG3 fix)
  if (adjustedOccNodes.length) {
    const occId = adjustedOccNodes[0].id;
    skillNodes.forEach((sn) => {
      edges.push({ source: sn.id, target: occId, verb: "informs", weight: 0.7, source_tag: "derived" });
    });
  }

  // 3d. duty -> organisation: mutates (for duties with org-change markers)
  if (orgNodeId) {
    orgChangeDuties.forEach((d) => {
      edges.push({ source: "duty:" + d.id, target: orgNodeId, verb: "mutates", weight: 0.8, source_tag: "derived" });
    });
  }

  // 3e. duty -> qualification: produces (for duties whose text contains an output marker)
  // We match duty text to qual nodes by output-stem presence in the duty text.
  // Only emit when the duty text and qual phrase share a token overlap.
  const qualToks = cappedQualNodes.map((q) => _phraseToks(q.label));
  dutyNodes.forEach((dn) => {
    if (!_kgContainsAny(dn.label, _KG_OUTPUT_STEMS)) return;
    const dToks = new Set(_phraseToks(dn.label));
    cappedQualNodes.forEach((qn, qi) => {
      const shared = qualToks[qi].filter((t) => dToks.has(t)).length;
      if (shared >= 1) {
        edges.push({ source: dn.id, target: qn.id, verb: "produces", weight: 0.6, source_tag: "derived" });
      }
    });
  });

  // 3f. role/department -> organisation: accountable-to (scope hierarchy)
  if (orgNodeId && hasDeptMarker) {
    edges.push({ source: roleId, target: orgNodeId, verb: "accountable-to", weight: 0.9, source_tag: "derived" });
  }

  // 3g. occupation -> mirror-occupation: competes-with (ONLY if mirrorRoles present)
  if (adjustedOccNodes.length && mirrorNodes.length) {
    const occId = adjustedOccNodes[0].id;
    mirrorNodes.forEach((mn) => {
      edges.push({ source: occId, target: mn.id, verb: "competes-with", weight: 0.5, source_tag: "computed" });
    });
  }

  // ── 4. Verify verb closure: every edge verb must be in KG_VERBS ───────────
  // (defensive - the rule table above is closed; this is a runtime guard)
  const verbSet = new Set(KG_VERBS);
  const filteredEdges = edges.filter((e) => verbSet.has(e.verb));

  // ── 5. De-duplicate edges (same source+target+verb) ──────────────────────
  const edgeSeen = new Set();
  const dedupEdges = filteredEdges.filter((e) => {
    const k = e.source + "|" + e.target + "|" + e.verb;
    if (edgeSeen.has(k)) return false;
    edgeSeen.add(k);
    return true;
  });

  // ── 6. Assemble nodes (deterministic sort: type then id) ─────────────────
  const allNodes = [
    roleNode,
    ...dutyNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...skillNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...adjustedOccNodes,
    ...cappedQualNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...orgNodes,
    ...mirrorNodes,
  ];

  // ── 7. Cluster manifest (honesty-gated §6) ────────────────────────────────
  const withheld = [];
  const clusters = [
    { id: "individual",   label: "Individual",   present: true },
    { id: "department",   label: "Department",   present: !!(hasDeptMarker || roleNode) },
    { id: "organisation", label: "Organisation", present: hasOrgCluster },
    { id: "competition",  label: "Competition",  present: hasCompetitionCluster },
  ];
  if (!hasOrgCluster) withheld.push("organisation: hiring organisation not named in posting metadata");
  if (!hasCompetitionCluster) withheld.push("competition: no computed mirror-role data in result");
  if (!hasDeptMarker) withheld.push("department: no function/team marker found - role node kept in department cluster by position");

  const presentCount = clusters.filter((c) => c.present).length;

  return {
    nodes: allNodes,
    edges: dedupEdges,
    clusters,
    version: KG_GRAPH_VERSION,
    generatedAt,
    stats: { nodes: allNodes.length, edges: dedupEdges.length, clustersPresent: presentCount },
    withheld,
  };
}

// --- getKnowledgeGraph (origin 3583-3590) ---
function getKnowledgeGraph(result, title) {
  const roleKey = String(title || "").trim().toLowerCase();
  const cacheKey = KG_GRAPH_VERSION + "|" + roleKey + "|" + ((result && result.source) || "esco");
  if (_kgGraphCache.has(cacheKey)) return _kgGraphCache.get(cacheKey);
  const payload = buildKnowledgeGraph(result, title);
  _kgGraphCache.set(cacheKey, payload);
  return payload;
}

// --- RESP tables (origin 4393-4402) ---
const RESP_CATEGORIES = [
  "Delivery & Execution","Planning & Coordination","Stakeholder & Client",
  "Analysis & Reporting","People & Leadership","Compliance & Governance",
  "Improvement & Innovation","Technical & Systems",
];
const RESP_FREQ = {
  Core:       { label:"Core duty",  color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe" },
  Common:     { label:"Common",     color:"#1a56db", bg:"#e8f0fe", border:"#c3d3f5" },
  Occasional: { label:"Occasional", color:"#5b6878", bg:"#f5f7fa", border:"#dde3ec" },
};

// --- getResponsibilities (origin 4520-4567) ---
async function getResponsibilities(title, corpus, jobCount, skills) {
  const skillList = (skills || []).slice(0, 25).map(s => `${s.n}:${s.skill}`).join(" | ");
  const SYSTEM_RESP =
`You are a job-analysis specialist. From a corpus of live job postings for one occupation, you extract the real responsibilities and duties employers expect - normalised, de-duplicated, and specific. You apply Singapore and ASEAN workforce context.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "summary": "One sentence on what this role is mainly responsible for, under 22 words",
  "responsibilities": [
    {"n":1,"text":"A concrete duty, action-led, under 16 words","cat":"category","freq":"Core","sk":[1,3]}
  ]
}
Field rules:
- n: sequential integer from 1
- text: start with a verb (Manage, Prepare, Coordinate, Resolve...). Specific to this occupation, not generic filler. No quote characters.
- cat: exactly one of: ${RESP_CATEGORIES.join(" | ")}
- freq: exactly one of: Core (appears in nearly every posting) | Common (appears in most) | Occasional (appears in a few)
- sk: array of skill numbers from the provided list that this duty draws on - 0 to 3 items, [] if none clearly apply
Quality rules:
- Return 12 to 18 distinct responsibilities - merge near-duplicates, drop boilerplate ("other duties as assigned", "ad hoc tasks")
- Cover the full breadth of the role, not just one cluster
- Ground every item in the corpus - do not invent duties the postings do not mention
Bad example: "Strong communication skills" - that is a requirement, not a responsibility
Good example: "Prepare monthly management accounts and variance commentary for the finance director"`;
  const raw = await claudeCall(
`Occupation: ${title}
Number of live postings in this corpus: ${jobCount}
Role's analysed skills (reference by number): ${skillList || "none provided"}

Corpus of live job postings (responsibilities sections):
${corpus}

Extract the real responsibilities for this occupation from the corpus above.`, 2600, 1, SYSTEM_RESP);
  const obj = extractJSON(raw, "responsibilities");
  if (!obj || !Array.isArray(obj.responsibilities)) throw new Error("responsibilities: invalid response");
  const valid = obj.responsibilities
    .map((x, i) => ({
      n: x.n || i + 1,
      text: String(x.text || x.t || "").replace(/"/g, "").trim(),
      cat: RESP_CATEGORIES.includes(x.cat) ? x.cat : (RESP_CATEGORIES.includes(x.category) ? x.category : "Delivery & Execution"),
      freq: RESP_FREQ[x.freq] ? x.freq : (RESP_FREQ[x.frequency] ? x.frequency : "Common"),
      sk: Array.isArray(x.sk) ? x.sk.filter(n => Number.isFinite(n)) : (Array.isArray(x.skills) ? x.skills.filter(n => Number.isFinite(n)) : []),
    }))
    .filter(x => x.text && x.text.length > 4);
  // renumber to be safe
  valid.forEach((x, i) => { x._origN = x.n; x.n = i + 1; });
  return { summary: String(obj.summary || "").replace(/"/g, "").trim(), responsibilities: valid };
}

// --- Job-ad parser (origin 7036-7098) ---
const _JD_HEAD_RE = /^(about|the role|role overview|what you|who you|responsibilities|key responsibilities|requirements|qualifications|pre-?requisites?|requisites?|capabilities|skills|leadership|soft skills|what we|why|benefits|your role|the opportunity|duties|experience|preferred|nice to have|we offer)\b/i;
// top-level JD sections render as h2; any other detected heading (Capabilities, Leadership & Soft
// Skills, ...) renders as the smaller h3 - giving the two-level hierarchy.
const _JD_MAJOR_RE = /^(about|the role|role overview|what you|who you|responsibilities|key responsibilities|requirements|qualifications|pre-?requisites?|requisites?|your role|the opportunity|duties|overview|the opportunity)\b/i;
function _fmtJobAd(text) {
  const raw = String(text || "").replace(/\r/g, "").split("\n").map(l => l.trim());
  // Rejoin orphaned bullet glyphs: a line that is ONLY a bullet marker attaches to
  // the following line (some ads put "•" on its own line, the item text on the next).
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    if (/^[•·▪‣]$/.test(raw[i]) && raw[i + 1]) { lines.push(`${raw[i]} ${raw[++i]}`); continue; }
    lines.push(raw[i]);
  }
  const blocks = []; let para = [];
  const flush = () => { if (para.length) { blocks.push({ t: "p", text: para.join(" ") }); para = []; } };
  for (const ln of lines) {
    if (!ln) { flush(); continue; }
    if (/^[•·▪‣o\-\*]\s+/.test(ln) || /^[•·▪]/.test(ln)) {
      flush(); blocks.push({ t: "li", text: ln.replace(/^[•·▪‣o\-\*]\s*/, "").trim() }); continue;
    }
    // Strip a trailing ":" before heading detection so section labels like
    // "Responsibilities:" / "Pre-requisite:" are recognised as headings, not paragraphs.
    const lnh = ln.replace(/\s*:$/, "");
    const isHead = lnh.length <= 64 && !/[.!?,;]$/.test(lnh) && (_JD_HEAD_RE.test(lnh) || (lnh.split(/\s+/).length <= 6 && /^[A-Z]/.test(lnh)));
    if (isHead) { flush(); blocks.push({ t: _JD_MAJOR_RE.test(lnh) ? "h2" : "h3", text: ln }); continue; }
    para.push(ln);
  }
  flush();
  return blocks;
}
// ── Slice 2: structured sections. parseJobAd folds the flat _fmtJobAd blocks into
// classified sections (one per h2 heading; blocks before the first heading become a
// headless "intro"). Deterministic - nothing reworded; verbatim text and order are
// preserved. _jdKind tags each section so the drawer can default the less-critical
// sections (Benefits / About / other) to collapsed in the small floating window.
const _JD_KIND_RE = [
  ["resp",    /^(key\s+)?(responsibilit|duties|the\s+role|role\s+(overview|description)|what\s+you|job\s+(scope|summary|description)|day\s+to\s+day|accountabilit|your\s+role)/i],
  ["req",     /^(requirement|qualification|pre-?requisite|requisite|who\s+(you|we)|skills?\b|competenc|experience|education|the\s+ideal|ideal\s+candidate|minimum|preferred|nice\s+to\s+have|what\s+we\s+(look|need))/i],
  ["benefit", /^(benefit|perks?|what\s+we\s+offer|we\s+offer|why\s+(join|work|us)|compensation|remuneration|salary)/i],
  ["about",   /^(about|who\s+we\s+are|company|our\s+(company|team|mission)|overview)/i],
];
function _jdKind(heading) {
  const h = String(heading || "").replace(/\s*:$/, "");
  for (const [k, re] of _JD_KIND_RE) if (re.test(h)) return k;
  return "other";
}
function parseJobAd(text) {
  const blocks = _fmtJobAd(text);
  const sections = []; let cur = null, n = 0;
  const push = () => { if (cur && cur.blocks.length) sections.push(cur); };
  for (const b of blocks) {
    if (b.t === "h2") {
      push();
      const kind = _jdKind(b.text);
      cur = { id: `jdsec-${n++}`, heading: b.text, kind, blocks: [], defaultCollapsed: kind === "benefit" || kind === "about" || kind === "other" };
    } else {
      if (!cur) cur = { id: `jdsec-${n++}`, heading: "", kind: "intro", blocks: [], defaultCollapsed: false };
      cur.blocks.push(b);
    }
  }
  push();
  return sections;
}

// --- Exported entry points ---
export { analyseRolePipeline, gatherStatements, mapStatementsToEsco, getKnowledgeGraph, buildKnowledgeGraph, getResponsibilities, getSkillsFromPosting, getSkills, parseJobAd };
