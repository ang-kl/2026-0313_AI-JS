// v3/src/review/rs-rules.js - PR 1 (Part B.4, v3-workflow-and-step3-remediation-spec.md):
// every RS_* rules constant, moved verbatim out of ReviewStudio.jsx so the
// improvised rules data is one importable, versionable module (Part B.1's ask).
// Constants only - the rs*() functions that consume them stay in ReviewStudio.jsx.
export const RS_RULES_VERSION = "1.0.0";

export const RS_RESP_RE = /^(key\s+)?(responsibilit|duties|the\s+role|role\s+(overview|description|scope)|what\s+you|day\s+to\s+day|accountabilit|your\s+role|job\s+(scope|summary|description))/i;
export const RS_REQ_RE = /^(requirement|qualification|pre-?requisite|requisite|who\s+(you|we)|skills?\b|competenc|experience|education|the\s+ideal|ideal\s+candidate|minimum|preferred|nice\s+to\s+have|what\s+we\s+(look|need))/i;
export const RS_HEAD_RE = /^(about|the role|role overview|role description|role scope|what you|who you|responsibilit|key responsibilit|requirement|qualification|pre-?requisite|requisite|capabilit|skills|leadership|soft skills|what we|why|benefits|your role|the opportunity|duties|experience|preferred|nice to have|we offer|job scope|job summary|job description)/i;
export const RS_EXP_BAND = { HIGH: "auto", MEDIUM: "augmented", LOW: "assisted", HUMAN: "human" };
export const RS_STOP = new Set(["the", "and", "for", "with", "into", "across", "various", "adhoc", "other", "duties", "support", "manage", "ensure", "provide", "drive", "deliver", "implement", "coordinate", "handle", "perform", "assist", "their", "this", "that", "from", "your", "our", "initiatives", "tasks", "work"]);
export const RS_VERB = /^(develop|build|design|support|manage|ensure|provide|drive|lead|own|deliver|implement|coordinat|handle|perform|assist|analy|prepar|maintain|monitor|review|conduct|execut|create|generat|configur|process|compil|liais|advis|engage)/;
export const RS_ROUTE = { human: "candidate edge - bring proof you drove this to an outcome", auto: "governance check - who signs off the machine's output?", augmented: "AI-assist - human frames, verifies, owns", assisted: "AI-assist - human judgment leads" };
export const RS_HALF_LIFE = { HIGH: "eroding fast - end-to-end automation is plausible", MEDIUM: "eroding - heavy augmentation pressure", LOW: "durable near-term - AI informs, human leads", HUMAN: "durable - human-led (accountability, presence, empathy)" };
export const RS_DOT = String.fromCharCode(0x00b7);
export const RS_SEC_MAP = [
  [/^(about|overview|role overview|the role|about the role|purpose|summary|who we are|about us|company)/i, "Role overview"],
  [/^(responsibilit|duties|what you.{0,3}ll do|what you will do|key accountabilit|the job|your role|job description|roles?\s*&?\s*responsibilit)/i, "Responsibilities"],
  [/^(requirement|qualif|who you are|what (?:we.{0,3}re|we are) looking|skills?\s*(?:and|&)\s*experience|ideal candidate|must have|you (?:have|bring))/i, "Requirements"],
  [/^(benefit|we offer|perks|what.{0,3}s in it|remuneration|package|why join)/i, "Benefits"],
];
export const RS_TIME_LINE = /\d{1,2}[:.]\d{2}\s*(?:am|pm)?|\b(?:am|pm)\b|\bmon(?:day)?\b|\btue(?:sday)?\b|\bwed(?:nesday)?\b|\bthu(?:rsday)?\b|\bfri(?:day)?\b|\bsat(?:urday)?\b|\bsun(?:day)?\b|working hours/i;
export const RS_GATES = [
  { rx: /\b\d{1,2}\+?\s*(?:years?|yrs?)\b[^,.;\n]{0,30}/i, why: "gate: experience threshold" },
  { rx: /\b(?:bachelor'?s?|master'?s?|ph\.?d|doctorate|degree|diploma)\b[^,.;\n]{0,40}/i, why: "gate: formal qualification" },
  { rx: /\b(?:certified|certification|licen[sc]ed?|registered|chartered)\b[^,.;\n]{0,40}/i, why: "gate: named credential" },
];
export const RS_NOODLES = [
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
export const RS_ASPIRATION = /\b(?:will (?:help|support|contribute|assist|drive|enable|facilitate|foster|champion|spearhead|leverage|empower)|to (?:help|support|contribute|drive|enable|foster)|play (?:a|an) (?:key|central|pivotal|critical|vital|integral) role|responsible for|passion(?:ate)? (?:for|about)|committed to)\b/i;
export const RS_INFLATED = /\b(?:synerg(?:y|ies|istic)|paradigm|holistic|thought leadership|value[-\s]?add|best practices|stakeholder alignment|strategic initiatives|transformational|impactful|robust solutions|end[-\s]?to[-\s]?end solutions|move the needle)\b/i;
export const RS_VAGUE_DUTY = /\b(?:ad-?hoc|various|other duties|as (?:assigned|required|needed)|miscellaneous|support the team|any other|from time to time|when required|where necessary)\b/i;
export const RS_COMPLIANCE = /\b(?:compl(?:y|iance|ies)|adhere|conform|in accordance with|as per (?:the )?(?:policy|policies|guidelines|sop)|regulatory|statutory|ensure (?:all )?(?:compliance|adherence))\b/i;
export const RS_BLIND_CHECKS = [
  { id: "bs-salary", label: "salary", rx: /\b(?:s?\$\s?\d|salary|remuneration|per (?:month|annum)|\d+k\b)/i, ask: "What is the actual pay band? 'Competitive' is not a number." },
  { id: "bs-report", label: "reporting line", rx: /\breport(?:s|ing)?\s+(?:directly\s+)?to\b/i, ask: "Who does this role report to - a named function or a vacuum?" },
  { id: "bs-team", label: "team size", rx: /\bteam of\s+\d|\bteam size\b|\bjoin(?:ing)? (?:a|our) \d+/i, ask: "How many people share this work today?" },
  { id: "bs-metrics", label: "success metrics", rx: /\b(?:kpi|okr|success (?:will be )?measured|measurable|targets?\b|quota)\b/i, ask: "How is success measured in the first year?" },
  { id: "bs-growth", label: "growth path", rx: /\b(?:career (?:path|progression|development)|promotion|progression|advancement|learning budget|training)\b/i, ask: "Where does this role lead in 2-3 years?" },
  { id: "bs-workmode", label: "work arrangement", rx: /\b(?:hybrid|remote|on-?site|work from home|wfh|office-based)\b/i, ask: "Hybrid, remote or on-site - why is it not stated?" },
];
export const RS_DOMAINS = {
  "data engineering": ["data", "pipeline", "pipelines", "warehouse", "lake", "etl", "elt", "analytics", "database", "databases", "model", "models", "python", "streaming"],
  "quality & compliance": ["iso", "cgmp", "gmp", "audit", "audits", "compliance", "sop", "sops", "quality", "regulatory", "validation", "documentation"],
  "facilities & operations": ["facility", "facilities", "vendor", "vendors", "sla", "slas", "maintenance", "premises", "contractor", "fm"],
  "sales & marketing": ["sales", "revenue", "clients", "accounts", "marketing", "campaign", "b2b", "quota", "leads"],
  "people & hr": ["recruitment", "onboarding", "payroll", "talent", "employee", "employees", "hr"],
};
export const RS_EMPTYPE_MAP = [
  { bucket: "permanent", re: /perm/i },
  { bucket: "contract", re: /contract|temporary|fixed[- ]term|temp\b/i },
  { bucket: "part-time", re: /part[- ]time/i },
  { bucket: "internship", re: /intern|trainee/i },
  { bucket: "freelance", re: /freelance|casual/i },
];
