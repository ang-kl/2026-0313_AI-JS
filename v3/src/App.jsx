import React, { useEffect, useMemo, useState } from 'react';
import { KGGraph } from './RoleGraph.jsx';
import { getSkillsFromPosting, getResponsibilities, getKnowledgeGraph } from './analysis/rolePipeline.js';

const CANON = {
  product: 'v3/goal/v3-blueprint.md',
  ui: 'v3/goal/v3-ui-blueprint.md',
  ledger: 'v3/goal/v3-rebuild-ledger.md',
};

const BLUEPRINT_SECTIONS = [
  { id: 'RBL-001', title: 'Canon boundary', blueprint: '0 Purpose / 16 Working Principle', ui: '0 Change Note / 1 UI Doctrine Foundation', status: 'wired' },
  { id: 'RBL-002', title: 'Step 1 search SG Careers sources', blueprint: '3 Ingress Framework', ui: '4 Workspace Shell', status: 'wired' },
  { id: 'RBL-003', title: 'Step 2 choose the right role/posting', blueprint: '3 Ingress Framework / V2 continuity', ui: '4 Workspace Shell', status: 'wired' },
  { id: 'RBL-004', title: 'Review manuscript', blueprint: '5 Review And Track Changes Layer', ui: '4.4 Centre Evidence Canvas / 5 Review System', status: 'wired' },
  { id: 'RBL-006', title: 'O-I-A trace', blueprint: '7 O-I-A Posting Lens', ui: '8 Blueprint Trace', status: 'wired' },
  { id: 'RBL-008', title: 'Provenance', blueprint: '4 Interpretability / 8.2 AIOE Trace', ui: '1.4 Components', status: 'wired' },
  { id: 'RBL-011', title: 'Visual choice', blueprint: '8.6 Occupation-Sensitive Visual Grammar', ui: '1.5 Visualisation Doctrine / 6 Graph And Visual Rules', status: 'wired' },
  { id: 'RBL-013', title: 'Candidate edge', blueprint: '9 AI Recruitment Intelligence Layer', ui: '9 Candidate Edge Standard', status: 'wired' },
  { id: 'RBL-015', title: 'Governance ledger', blueprint: '11 Agentic Governance', ui: '12 Phase 5: Governance', status: 'partial' },
  { id: 'RBL-020', title: 'Final verification', blueprint: '13 Implementation Principles', ui: '13 Change Protocol / 14 Current Decision', status: 'partial' },
];

const LENSES = [
  { id: 'role', label: 'Browse SG jobs', caption: 'live MyCareersFuture postings' },
  { id: 'org', label: 'Organisation view', caption: 'MCF + careers.gov.sg' },
  { id: 'edge', label: 'Plan my edge', caption: 'Proof, interview, output' },
];

const VISUALS = [
  { id: 'graph', label: 'Graph', question: 'What shape is this role?' },
  { id: 'org', label: 'Org', question: 'What reports up to what?' },
  { id: 'workflow', label: 'Workflow', question: 'Who acts when?' },
  { id: 'stream', label: 'Value stream', question: 'Where does time go?' },
];

const DRAWERS = [
  { id: 'source', label: 'Source' },
  { id: 'taxonomy', label: 'SSOC' },
  { id: 'orgread', label: 'Org' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'advisory', label: 'Advisory' },
  { id: 'letter', label: 'Letter' },
];

const SOURCE_LABELS = {
  'MyCareersFuture Singapore': 'from MCF',
  'careers.gov.sg': 'from careers.gov.sg',
};

function safeText(value, fallback = '') {
  return String(value || fallback || '').trim();
}

function stripMarkup(value) {
  const raw = safeText(value);
  if (!raw) return '';
  if (typeof DOMParser !== 'undefined' && /<[^>]+>/.test(raw)) {
    const parsed = new DOMParser().parseFromString(raw, 'text/html');
    return safeText(parsed.body?.textContent || raw).replace(/\s+/g, ' ');
  }
  return raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function normaliseJob(job, source) {
  if (!job) return null;
  const actualSource = job.source || source || 'unknown source';
  const description = stripMarkup(job.description || job.responsibilitiesText);
  const responsibilitiesText = stripMarkup(job.responsibilitiesText || job.description);
  const fallbackId = `${actualSource}:${job.uuid || job.id || job.title || 'job'}:${job.employer || job.hiringCompanyName || job.postedCompanyName || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    ...job,
    uuid: job.uuid || job.id || fallbackId,
    source: actualSource,
    title: safeText(job.title, 'Untitled role'),
    employer: safeText(job.employer || job.hiringCompanyName || job.postedCompanyName, 'Unknown employer'),
    description,
    responsibilitiesText,
    skills: Array.isArray(job.skills) ? job.skills.filter(Boolean).slice(0, 16) : [],
    categories: Array.isArray(job.categories) ? job.categories.filter(Boolean).slice(0, 8) : [],
  };
}

function engineEvidence(job, ssocCandidate) {
  const ssoc = job?.ssoc || job?.ssocCode || job?.meta?.ssoc || job?.metadata?.ssoc;
  const derivedSsoc = ssocCandidate?.kind === 'occupation' && String(ssocCandidate.code || '').length === 5 ? ssocCandidate.code : '';
  const fingerprintIscos = job?.fingerprintIscos || job?.meta?.fingerprintIscos || job?.engine?.fingerprintIscos;
  const usableFingerprint = Array.isArray(fingerprintIscos) && fingerprintIscos.length ? fingerprintIscos : null;
  return {
    hasEvidence: Boolean(ssoc || derivedSsoc || usableFingerprint),
    body: {
      ssoc: ssoc || derivedSsoc,
      title: job?.title,
      skills: job?.skills || [],
      fingerprintIscos: usableFingerprint,
    },
    source: ssoc ? 'source posting' : derivedSsoc ? 'derived from SSOC title search' : usableFingerprint ? 'ESCO fingerprint' : '',
  };
}

function rankJob(job, query, lens = 'role') {
  const q = safeText(query).toLowerCase();
  const title = safeText(job.title).toLowerCase();
  const employer = safeText(job.employer).toLowerCase();
  const description = safeText(job.description || job.responsibilitiesText).toLowerCase();
  const skills = safeText(job.skills?.join(' ')).toLowerCase();
  const categories = safeText(job.categories?.join(' ')).toLowerCase();
  if (!q) return { score: 0, reason: 'unranked' };
  if (lens === 'org') {
    if (employer.includes(q)) return { score: 110, reason: 'employer match' };
    if (title.includes(q)) return { score: 80, reason: 'role title signal' };
    if (description.includes(q)) return { score: 58, reason: 'duty signal' };
    if (`${skills} ${categories}`.includes(q)) return { score: 42, reason: 'capability signal' };
    return { score: 10, reason: 'adjacent posting' };
  }
  if (title === q) return { score: 120, reason: 'exact title' };
  if (title.includes(q)) return { score: 105, reason: 'title contains signal' };
  if (description.includes(q)) return { score: 72, reason: 'responsibility contains signal' };
  if (categories.includes(q)) return { score: 56, reason: 'segment contains signal' };
  if (skills.includes(q)) return { score: 48, reason: 'skill contains signal' };
  return { score: 10, reason: 'adjacent role' };
}

function splitLines(text) {
  return safeText(text)
    .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 16)
    .slice(0, 12);
}

function tokenise(text) {
  return safeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

const STOP = new Set([
  'and', 'the', 'for', 'with', 'from', 'this', 'that', 'role', 'roles', 'job', 'jobs',
  'will', 'are', 'you', 'our', 'your', 'into', 'across', 'while', 'within', 'using',
]);

const ROLE_FAMILIES = [
  { id: 'transformation', label: 'Transformation / programme change', match: /transform|change|programme|program|pmo|innovation|strategy|operating model/i },
  { id: 'data', label: 'Data, analytics and AI', match: /data|analytics|insight|ai|machine learning|pipeline|dashboard|business intelligence/i },
  { id: 'engineering', label: 'Engineering and platform delivery', match: /engineer|developer|architect|cloud|platform|software|systems|technical/i },
  { id: 'risk', label: 'Risk, compliance and governance', match: /risk|compliance|governance|audit|control|policy|regulatory|assurance/i },
  { id: 'operations', label: 'Operations and service delivery', match: /operation|service|delivery|process|support|customer|fulfil|supply|logistics/i },
  { id: 'product', label: 'Product, customer and market', match: /product|market|customer|growth|brand|campaign|commercial|sales/i },
  { id: 'people', label: 'People, learning and enablement', match: /people|hr|talent|learning|training|enablement|culture|workforce/i },
  { id: 'finance', label: 'Finance and performance', match: /finance|financial|budget|procurement|performance|portfolio|investment/i },
];

const CAPABILITY_RULES = [
  { id: 'data', label: 'Data and evidence', match: /data|analytics|dashboard|insight|reporting|metric|intelligence|lineage/i },
  { id: 'ai', label: 'AI and automation', match: /ai|automation|automate|machine learning|model|agent|workflow tool|genai/i },
  { id: 'governance', label: 'Governance and control', match: /governance|risk|compliance|audit|control|policy|regulatory|accountable|approval/i },
  { id: 'process', label: 'Process redesign', match: /process|transformation|change|redesign|operating model|workflow|continuous improvement|lean/i },
  { id: 'stakeholder', label: 'Stakeholder coordination', match: /stakeholder|senior|cross-functional|partner|business units|collaboration|alignment/i },
  { id: 'customer', label: 'Customer and service value', match: /customer|citizen|client|service|experience|journey|frontline/i },
  { id: 'platform', label: 'Platform and reliability', match: /platform|cloud|pipeline|system|architecture|reliability|production|support/i },
  { id: 'delivery', label: 'Delivery and execution', match: /delivery|project|programme|program|roadmap|implementation|milestone|execution/i },
];

const HANDOFF_RULES = [
  { id: 'product', label: 'Product' },
  { id: 'operations', label: 'Operations' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'finance', label: 'Finance' },
  { id: 'risk', label: 'Risk' },
  { id: 'customer', label: 'Customer' },
  { id: 'business', label: 'Business units' },
  { id: 'stakeholder', label: 'Stakeholders' },
  { id: 'technology', label: 'Technology' },
];

function sourceChip(source) {
  if (/mcf|mycareersfuture/i.test(source)) return { kind: 'posting', text: 'from MCF' };
  if (/careers\.gov/i.test(source)) return { kind: 'posting', text: 'from careers.gov.sg' };
  if (/sample/i.test(source)) return { kind: 'unverified', text: 'sample' };
  return { kind: 'unverified', text: 'unverified' };
}

function formatSalary(lo, hi) {
  if (lo == null && hi == null) return '';
  const s = (n) => `S$${Number(n).toLocaleString()}`;
  if (lo != null && hi != null) return `${s(lo)} - ${s(hi)} / month`;
  return `${s(lo ?? hi)} / month`;
}

function daysAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
}

function classifyRoleFamily(job) {
  const text = `${job.title || ''} ${job.categories?.join(' ') || ''} ${job.description || ''}`;
  const family = ROLE_FAMILIES.find((item) => item.match.test(text));
  return family || { id: 'other', label: 'Other / mixed role family' };
}

function jobKey(job) {
  return safeText(job?.uuid || job?.id || `${job?.title || ''}-${job?.employer || ''}`).toLowerCase();
}

function ssocFamilyFor(job, ssocMap) {
  const match = ssocMap.get(jobKey(job));
  if (!match || match.status !== 'classified' || !match.family || match.confidence === 'withheld') {
    const fallback = classifyRoleFamily(job);
    return { ...fallback, basis: 'heuristic', ssoc: match || null };
  }
  return {
    id: `ssoc-${match.family.code}`,
    label: `${match.family.code} ${match.family.title}`,
    basis: 'ssoc',
    code: match.family.code,
    confidence: match.confidence,
    occupation: match.node ? `${match.node.code} ${match.node.title}` : '',
    hierarchy: match.hierarchy,
    ssoc: match,
  };
}

function detectCapabilities(job) {
  const text = `${job.title || ''} ${job.skills?.join(' ') || ''} ${job.categories?.join(' ') || ''} ${job.description || ''}`;
  return CAPABILITY_RULES
    .filter((rule) => rule.match.test(text))
    .map((rule) => ({ id: rule.id, label: rule.label }));
}

function detectHandoffs(job) {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  return HANDOFF_RULES.filter((rule) => text.includes(rule.id)).map((rule) => rule.label);
}

function detectBprSignals(job) {
  const text = `${job.title || ''} ${job.description || ''}`;
  const capabilities = detectCapabilities(job);
  const handoffs = detectHandoffs(job);
  const signals = [];
  const capIds = new Set(capabilities.map((item) => item.id));

  if (capIds.has('data') && capIds.has('process')) {
    signals.push({
      type: 'role mash-up',
      severity: 'medium',
      evidence: job.title,
      read: 'Data delivery and transformation/change language appear together.',
      bpr: 'Separate platform delivery from process ownership before treating this as one role.',
    });
  }
  if (capIds.has('governance') && capIds.has('delivery')) {
    signals.push({
      type: 'governance load',
      severity: 'medium',
      evidence: job.title,
      read: 'The posting combines execution with control or assurance language.',
      bpr: 'Clarify who owns decisions, approval, and audit before adding automation.',
    });
  }
  if (handoffs.length >= 3) {
    signals.push({
      type: 'handoff density',
      severity: 'high',
      evidence: handoffs.slice(0, 4).join(', '),
      read: 'Multiple functions appear in the same role evidence.',
      bpr: 'Map upstream inputs and downstream decisions; the friction may sit between teams, not inside the role.',
    });
  }
  if (/own|accountable|lead|drive/i.test(text) && /support|assist|partner/i.test(text)) {
    signals.push({
      type: 'unclear ownership',
      severity: 'medium',
      evidence: job.title,
      read: 'The ad mixes owner language with support/partner language.',
      bpr: 'Ask what the role can decide, what it only influences, and what must be escalated.',
    });
  }
  return signals;
}

function exposureForText(text) {
  const lower = safeText(text).toLowerCase();
  if (/final|own|accountable|stakeholder|judg|decision|senior|relationship/.test(lower)) {
    return { band: 'human', label: 'Human-led', reason: 'Judgment, ownership, and accountability remain with the person.' };
  }
  if (/ai-assisted|automation|automate|monitor|validation|quality|pipeline/.test(lower)) {
    return { band: 'assist', label: 'AI-assisted', reason: 'AI can assist sub-tasks while the person verifies outcomes.' };
  }
  if (/analytics|reporting|model|dashboard|orchestration|sql|python/.test(lower)) {
    return { band: 'augment', label: 'AI-augmented', reason: 'AI can accelerate analysis and production work with human framing.' };
  }
  return { band: 'human', label: 'Human-led', reason: 'No safe automation claim; keep the human owner visible.' };
}

function makeReviewNotes(job) {
  const lines = splitLines(job.responsibilitiesText || job.description);
  const notes = [
    {
      id: 'note-process',
      persona: 'Process Redesign Reviewer',
      action: 'split',
      status: 'open',
      target: lines.find((line) => /transformation|business units|process|operations/i.test(line)) || lines[0] || job.title,
      comment: 'This may be two jobs: pipeline engineering plus transformation/change ownership.',
      suggestion: 'Split into delivery system work and organisation-change work before applying.',
      blueprint: 'v3-blueprint.md 6.4 Business Process Re-engineering',
      ui: 'v3-ui-blueprint.md 5.2 Suggested Rewrites',
      provenance: 'derived',
    },
    {
      id: 'note-hiring',
      persona: 'Hiring Manager',
      action: 'replace',
      status: 'open',
      target: lines.find((line) => /stakeholder|senior|business users/i.test(line)) || lines[1] || job.title,
      comment: 'The hiring signal is not only data skill. It asks whether the candidate can reduce reporting friction across teams.',
      suggestion: 'Prepare one story where a data improvement changed a business decision.',
      blueprint: 'v3-blueprint.md 9.4 Interview Intelligence',
      ui: 'v3-ui-blueprint.md 9 Candidate Edge Standard',
      provenance: 'derived',
    },
    {
      id: 'note-ai',
      persona: 'AI Exposure Reviewer',
      action: 'trace',
      status: 'open',
      target: lines.find((line) => /AI|automation|monitoring|validation/i.test(line)) || lines[2] || job.title,
      comment: 'AI exposure is an occupational signal, not a verdict. Automation may assist quality checks, not own data decisions.',
      suggestion: 'Keep the phrase "final decisions remain human-owned" visible in the evidence chain.',
      blueprint: 'v3-blueprint.md 8 Deterministic Evidence Framework',
      ui: 'v3-ui-blueprint.md 1.2 Exposure Spectrum',
      provenance: 'AI estimate',
    },
    {
      id: 'note-proof',
      persona: 'Candidate Advocate',
      action: 'proof',
      status: 'open',
      target: lines.find((line) => /governance|lineage|data trust/i.test(line)) || lines[3] || job.title,
      comment: 'The strongest candidate edge is proof of reliability, governance, and recovery, not a longer tools list.',
      suggestion: 'Bring one incident/recovery example, one lineage/governance example, and one stakeholder decision path.',
      blueprint: 'v3-blueprint.md 9.2 Candidate Edge',
      ui: 'v3-ui-blueprint.md 4.6 Advisory Panel',
      provenance: 'computed',
    },
  ];
  return notes;
}

function buildTrace(job) {
  const source = sourceChip(job.source);
  const lines = splitLines(job.responsibilitiesText || job.description);
  return lines.slice(0, 6).map((line, index) => {
    const exposure = exposureForText(line);
    return {
      id: `trace-${index + 1}`,
      observation: line,
      interpretation: interpretLine(line),
      application: applyLine(line),
      exposure,
      provenance: index < 2 ? source.kind : index === 2 ? 'computed' : 'derived',
    };
  });
}

function interpretLine(line) {
  if (/stakeholder|senior|business/i.test(line)) return 'Cross-functional influence matters as much as technical delivery.';
  if (/governance|lineage|trust|validation/i.test(line)) return 'The organisation has data reliability and accountability pressure.';
  if (/automation|AI/i.test(line)) return 'AI can assist quality and monitoring, but ownership must remain explicit.';
  if (/pipeline|cloud|on-premise|sql|python/i.test(line)) return 'Core platform engineering capability is required.';
  return 'This is source evidence that needs human review before advice.';
}

function applyLine(line) {
  if (/stakeholder|senior|business/i.test(line)) return 'Prepare an interview story about aligning teams around a data decision.';
  if (/governance|lineage|trust|validation/i.test(line)) return 'Show proof of controls, monitoring, and recovery practices.';
  if (/automation|AI/i.test(line)) return 'Ask what the employer lets AI execute and who signs off.';
  if (/pipeline|cloud|on-premise|sql|python/i.test(line)) return 'Map your portfolio to architecture, operation, and reliability evidence.';
  return 'Hold as observed evidence until a reviewer accepts an interpretation.';
}

function buildVisualData(job, trace) {
  const tokens = tokenise([job.title, job.employer, job.description, job.skills?.join(' ')].join(' '));
  const counts = new Map();
  tokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const skills = job.skills?.length ? job.skills.slice(0, 6) : top.slice(0, 6).map(([token]) => token);
  return {
    concepts: top.map(([name, count], index) => ({ name, count, x: 50 + (index % 4) * 28, y: 35 + Math.floor(index / 4) * 44 })),
    org: [
      { name: 'Candidate', role: 'human owner' },
      { name: job.title, role: 'role' },
      { name: 'Product / operations', role: 'dependency' },
      { name: 'Compliance', role: 'governance boundary' },
      { name: job.employer, role: 'organisation' },
    ],
    workflow: [
      'Observe source posting',
      'Separate duties from requirements',
      'Map owner and dependency',
      'Withhold weak claims',
      'Prepare proof and questions',
    ],
    stream: trace.slice(0, 5).map((item, index) => ({
      name: index === 0 ? 'Read' : index === 1 ? 'Interpret' : index === 2 ? 'Validate' : index === 3 ? 'Decide' : 'Output',
      value: index % 2 === 0 ? 'value' : 'wait',
      text: item.application,
    })),
    skills,
  };
}

// Build a deterministic kg1 payload from ONE posting so the embedded KGGraph
// (RoleGraph.jsx) renders the real job knowledge graph: role -> duties / skills /
// organisation. No LLM, no invention - every node is the posting's own text.
// Skills fall back to top concept tokens only when the posting lists none (flagged derived).
function buildKgPayload(job, trace, concepts) {
  if (!job) return null;
  const postingSrc = /mcf|careers\.gov/i.test(job.source || '') ? 'mcf' : 'derived';
  const nodes = [];
  const edges = [];
  const roleId = 'role:self';
  nodes.push({ id: roleId, type: 'role', cluster: 'individual', label: safeText(job.title, 'Role'), source: postingSrc, confidence: 'source posting' });

  (trace || []).slice(0, 6).forEach((item, index) => {
    const id = `duty:${index}`;
    nodes.push({ id, type: 'duty', cluster: 'individual', label: short(item.observation, 90), source: postingSrc, confidence: 'source posting' });
    edges.push({ source: roleId, target: id, verb: 'performs', weight: 0.9, source_tag: postingSrc });
  });

  const usePostingSkills = Array.isArray(job.skills) && job.skills.length > 0;
  const skills = usePostingSkills ? job.skills.slice(0, 8) : (concepts || []).slice(0, 6).map((concept) => concept.name);
  const skillSrc = usePostingSkills ? postingSrc : 'derived';
  skills.forEach((skill, index) => {
    const id = `skill:${index}`;
    nodes.push({ id, type: 'skill', cluster: 'department', label: short(skill, 40), source: skillSrc, confidence: usePostingSkills ? 'source posting' : 'text frequency' });
    edges.push({ source: roleId, target: id, verb: 'requires', weight: 0.6, source_tag: skillSrc });
  });

  if (job.employer && job.employer !== 'Unknown employer') {
    const orgId = 'org:self';
    nodes.push({ id: orgId, type: 'organisation', cluster: 'organisation', label: safeText(job.employer), source: postingSrc, confidence: 'source posting' });
    edges.push({ source: orgId, target: roleId, verb: 'hires', weight: 0.8, source_tag: postingSrc });
  }

  const present = new Set(nodes.map((node) => node.cluster));
  const clusters = ['individual', 'department', 'organisation', 'competition'].map((id) => ({ id, present: present.has(id) }));
  return {
    version: 'kg1',
    nodes,
    edges,
    clusters,
    stats: { nodes: nodes.length, edges: edges.length, clustersPresent: clusters.filter((cluster) => cluster.present).length },
  };
}

// Deep analysis "as origin": resolve ESCO skills + extract responsibilities for the
// posting, then build the full role -> duty -> skill -> qualification knowledge graph
// via the ported origin pipeline. LLM-backed (skills + duties); the graph itself is
// deterministic from that evidence. Skills fall back to a taxonomy lookup; duties are
// withheld (graph still renders role + skills) if extraction fails.
async function analysePostingToKg(job) {
  const title = safeText(job.title, 'Role');
  const postingText = safeText(job.responsibilitiesText || job.description);
  const skills = await getSkillsFromPosting(title, job.skills || [], postingText);
  let responsibilitiesData = null;
  try {
    responsibilitiesData = await getResponsibilities(title, postingText, 1, skills);
  } catch (_) {
    responsibilitiesData = null;
  }
  const result = { source: job.source, skills, responsibilitiesData };
  return getKnowledgeGraph(result, title);
}

// Hand the selected step-2 posting to the full-page deterministic RoleGraph (?view=graph).
// RoleGraph reads this key, runs the ESCO -> SSOC -> engine pipeline, and renders the graph.
function openRoleGraph(job) {
  try {
    const payload = {
      title: job.title,
      employer: job.employer,
      skills: Array.isArray(job.skills) ? job.skills : [],
      categories: Array.isArray(job.categories) ? job.categories : [],
      responsibilitiesText: job.responsibilitiesText || job.description || '',
      description: job.description || '',
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      seniority: job.seniority || job.positionLevels || null,
      employmentType: job.employmentType || null,
      numberOfVacancies: job.numberOfVacancies ?? null,
      ssoc: job.ssoc || job.ssocCode || null,
      mcfUrl: job.mcfUrl || null,
      source_url: job.sourceUrl || job.source_url || null,
    };
    sessionStorage.setItem('tara_graph_role', JSON.stringify(payload));
  } catch (_) { /* sessionStorage may be unavailable; navigate anyway */ }
  window.location.href = '/?view=graph';
}

function buildOrgSummary(jobs, query, ssocClassifications = []) {
  const postings = Array.isArray(jobs) ? jobs : [];
  const ssocMap = new Map((Array.isArray(ssocClassifications) ? ssocClassifications : []).map((item) => [safeText(item.id).toLowerCase(), item]));
  const ssocMatched = [...ssocMap.values()].filter((item) => item.status === 'classified').length;
  const ssocMediumPlus = [...ssocMap.values()].filter((item) => item.status === 'classified' && item.confidence !== 'low').length;
  const employers = new Map();
  const capabilities = new Map();
  const capabilityEvidence = new Map();
  const families = new Map();
  const handoffs = new Map();
  const bprSignals = [];
  postings.forEach((job) => {
    employers.set(job.employer, (employers.get(job.employer) || 0) + 1);
    const family = ssocFamilyFor(job, ssocMap);
    if (!families.has(family.id)) families.set(family.id, { ...family, count: 0, jobs: [], ssocExamples: [] });
    families.get(family.id).count += 1;
    families.get(family.id).jobs.push(job);
    if (family.basis === 'ssoc' && family.occupation) families.get(family.id).ssocExamples.push(family.occupation);

    detectCapabilities(job).forEach((item) => {
      capabilities.set(item.label, (capabilities.get(item.label) || 0) + 1);
      if (!capabilityEvidence.has(item.label)) capabilityEvidence.set(item.label, []);
      capabilityEvidence.get(item.label).push(job.title);
    });
    detectHandoffs(job).forEach((handoff) => {
      handoffs.set(handoff, (handoffs.get(handoff) || 0) + 1);
    });
    detectBprSignals(job).forEach((signal) => {
      bprSignals.push({ ...signal, jobTitle: job.title, employer: job.employer, source: job.source });
    });
  });
  const top = (map, n = 5) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
  const roleFamilies = [...families.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: item.label,
      count: item.count,
      basis: item.basis || 'heuristic',
      code: item.code || '',
      confidence: item.confidence || '',
      occupations: [...new Set(item.ssocExamples || [])].slice(0, 3),
      examples: item.jobs.slice(0, 3).map((job) => job.title),
    }));
  const capabilityRows = top(capabilities, 8).map(([name, count]) => ({
    name,
    count,
    evidence: [...new Set(capabilityEvidence.get(name) || [])].slice(0, 3),
  }));
  const bprGrouped = new Map();
  bprSignals.forEach((signal) => {
    const key = `${signal.type}:${signal.severity}:${signal.bpr}`;
    if (!bprGrouped.has(key)) bprGrouped.set(key, { ...signal, count: 0, examples: [] });
    const item = bprGrouped.get(key);
    item.count += 1;
    if (item.examples.length < 3) item.examples.push(signal.jobTitle);
  });
  const bprRank = [...bprGrouped.values()].sort((a, b) => {
    const score = (value) => value === 'high' ? 3 : value === 'medium' ? 2 : 1;
    return score(b.severity) - score(a.severity) || b.count - a.count || a.type.localeCompare(b.type);
  }).slice(0, 8);
  return {
    query: safeText(query),
    employerCount: employers.size,
    postingCount: postings.length,
    employers: top(employers, 4),
    capabilities: top(capabilities, 6),
    capabilityRows,
    handoffs: top(handoffs, 5),
    roleFamilies,
    ssocCoverage: {
      total: postings.length,
      classified: ssocMatched,
      mediumPlus: ssocMediumPlus,
      withheld: Math.max(0, postings.length - ssocMatched),
      status: ssocMatched ? 'computed' : 'withheld',
    },
    ssocRows: [...ssocMap.values()]
      .filter((item) => item.status === 'classified')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6),
    bprSignals: bprRank,
    confidence: postings.length >= 8 ? 'strong' : postings.length >= 3 ? 'moderate' : 'thin',
    withheld: postings.length < 3 ? 'Organisation-level claims need at least 3 postings; treat this as a weak signal.' : '',
  };
}

function makeCoverLetter(job, trace) {
  const topProof = trace.find((item) => /stakeholder|business|decision/i.test(item.observation)) || trace[0];
  const trustProof = trace.find((item) => /governance|trust|lineage|validation/i.test(item.observation)) || trace[1] || trace[0];
  return [
    `Dear Hiring Manager,`,
    ``,
    `I am applying for the ${job.title} role at ${job.employer} because the posting points to work that is larger than pipeline delivery alone: reliable data movement, accountable governance, and business-facing decisions.`,
    ``,
    topProof ? `The role asks for evidence of cross-functional delivery. I would bring examples of how I worked with stakeholders to turn data work into a clearer operating decision.` : `I would bring examples that connect technical delivery to business outcomes.`,
    ``,
    trustProof ? `The posting also signals data trust: governance, validation, monitoring, and lineage. My strongest preparation would be to show concrete proof of reliability practices, incident recovery, and human sign-off around data decisions.` : `I would prepare proof of reliability, recovery, and human sign-off around data decisions.`,
    ``,
    `I would welcome the chance to discuss how the team defines data ownership, where automation can safely assist, and which decisions must remain human-owned.`,
    ``,
    `Yours sincerely,`,
    `Candidate`,
  ].join('\n');
}

function statusRank(status) {
  return ['not-started', 'designed', 'wired', 'tested', 'withheld', 'simulated', 'deprecated'].indexOf(status);
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function PipelineLogsView() {
  return (
    <main className="v3r-plain">
      <section className="v3r-card">
        <p className="v3r-kicker">Debug route</p>
        <h1>Pipeline logs are withheld in the rebuilt shell</h1>
        <p>The old debug log viewer was part of the previous app surface. The rebuild keeps this export so the route does not crash, but the ledger marks final verification as not started.</p>
      </section>
    </main>
  );
}

export default function App({ initialSearchMode } = {}) {
  const [lens, setLens] = useState(initialSearchMode === 'wiki' ? 'org' : 'role');
  const [searchMode, setSearchMode] = useState(initialSearchMode === 'wiki' ? 'company' : 'jobs');
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [activeDrawer, setActiveDrawer] = useState('');
  const [visual, setVisual] = useState('graph');
  const [view, setView] = useState('markup');
  const [theme, setTheme] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [searchState, setSearchState] = useState({ status: 'idle', message: 'Choose Analyse a role, Browse SG jobs, or Search by employer to begin with live evidence.' });
  const [reviewStates, setReviewStates] = useState({});
  const [freshGrad, setFreshGrad] = useState(false);
  const [persona, setPersona] = useState('');
  const [printMode, setPrintMode] = useState(false);
  const [visualExpanded, setVisualExpanded] = useState(false);
  const [aioeState, setAioeState] = useState({ status: 'withheld', message: 'AIOE withheld until SSOC or ESCO fingerprint evidence is present.' });
  const [ssocState, setSsocState] = useState({ status: 'loading', message: 'SSOC lookup has not run yet.', node: null });
  const [orgSsocState, setOrgSsocState] = useState({ status: 'withheld', message: 'Organisation SSOC classification has not run yet.', classifications: [] });
  const [correspondenceState, setCorrespondenceState] = useState({ status: 'withheld', message: 'No SSOC correspondence loaded yet.', rows: [] });

  const selectedJob = useMemo(() => jobs.find((job) => job.uuid === selectedId) || jobs[0] || null, [jobs, selectedId]);
  const reviewJob = useMemo(() => jobs.find((job) => job.uuid === reviewId) || null, [jobs, reviewId]);
  const activeJob = reviewJob || selectedJob || null;
  const selectedSource = sourceChip(activeJob?.source || '');
  const selectedIsLive = Boolean(reviewJob) && selectedSource.kind === 'posting';
  const searchIsLoading = searchState.status === 'loading';
  const showStepTwo = jobs.length > 0 && !reviewJob;
  const showReviewWorkspace = jobs.length > 0 && Boolean(reviewJob);
  const notes = useMemo(() => activeJob ? makeReviewNotes(activeJob) : [], [activeJob]);
  const trace = useMemo(() => activeJob ? buildTrace(activeJob) : [], [activeJob]);
  const visualData = useMemo(() => activeJob ? buildVisualData(activeJob, trace) : { concepts: [], org: [], workflow: [], stream: [] }, [activeJob, trace]);
  const thinKg = useMemo(() => activeJob ? buildKgPayload(activeJob, trace, visualData.concepts) : null, [activeJob, trace, visualData.concepts]);
  const [kgState, setKgState] = useState({ status: 'idle', payload: null, message: '' });
  useEffect(() => {
    if (!activeJob) { setKgState({ status: 'idle', payload: null, message: '' }); return; }
    let cancelled = false;
    setKgState({ status: 'loading', payload: null, message: 'Analysing posting: resolving skills and responsibilities...' });
    analysePostingToKg(activeJob)
      .then((payload) => {
        if (cancelled) return;
        if (payload && Array.isArray(payload.nodes) && payload.nodes.length > 1) {
          setKgState({ status: 'ready', payload, message: `${payload.stats.nodes} nodes, ${payload.stats.edges} edges wired from the posting.` });
        } else {
          setKgState({ status: 'withheld', payload: null, message: 'Deep analysis returned no wired structure; showing the grounded outline.' });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setKgState({ status: err?.status === 401 ? 'locked' : 'withheld', payload: null, message: err?.status === 401 ? 'Telegram login required before deep analysis.' : (err?.message || 'Deep analysis unavailable; showing the grounded outline.') });
      });
    return () => { cancelled = true; };
  }, [activeJob]);
  const kgPayload = kgState.payload || thinKg;
  const coverLetter = useMemo(() => activeJob ? makeCoverLetter(activeJob, trace) : '', [activeJob, trace]);
  const orgSummary = useMemo(() => buildOrgSummary(jobs, query, orgSsocState.classifications), [jobs, query, orgSsocState.classifications]);
  const visibleJobs = useMemo(() => {
    if (!freshGrad || lens !== 'role') return jobs;
    return jobs.filter((job) => job.minimumYearsExperience != null && Number(job.minimumYearsExperience) < 4);
  }, [freshGrad, jobs, lens]);

  useEffect(() => {
    document.documentElement.dataset.v3Theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    if (!activeJob || !showReviewWorkspace) {
      setSsocState({ status: 'withheld', message: 'SSOC waits for a selected live posting.', node: null });
      return () => { cancelled = true; };
    }
    const title = activeJob?.title || '';
    setSsocState({ status: 'loading', message: `Looking up SSOC 2024 for "${title}"...`, node: null });
    postJson('/api/ssoc', { action: 'search', query: title, limit: 8 })
      .then((data) => {
        if (cancelled) return;
        const results = Array.isArray(data.results) ? data.results : [];
        const lower = title.toLowerCase();
        const occupation = results.find((item) => item.kind === 'occupation' && item.title.toLowerCase() === lower)
          || results.find((item) => item.kind === 'occupation' && (item.title.toLowerCase().includes(lower) || lower.includes(item.title.toLowerCase())))
          || results.find((item) => item.kind === 'occupation')
          || null;
        if (occupation) {
          setSsocState({ status: data.db ? 'db' : 'fallback', message: `${occupation.code} ${occupation.title}`, node: occupation, db: data.db });
        } else {
          setSsocState({ status: 'withheld', message: 'No 5-digit SSOC occupation matched this title.', node: null, db: data.db });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSsocState({ status: 'withheld', message: err.message || 'SSOC lookup unavailable.', node: null });
      });
    return () => { cancelled = true; };
  }, [activeJob, showReviewWorkspace]);

  useEffect(() => {
    if (lens !== 'org') {
      setOrgSsocState({ status: 'withheld', message: 'Organisation SSOC classification runs when Organisation View is active.', classifications: [] });
      return;
    }
    const payloadJobs = jobs.slice(0, 40).map((job) => ({
      id: jobKey(job),
      title: job.title,
      employer: job.employer,
      categories: job.categories || [],
      skills: job.skills || [],
      description: job.description || job.responsibilitiesText || '',
    }));
    if (!payloadJobs.length) {
      setOrgSsocState({ status: 'withheld', message: 'No postings available for organisation SSOC classification.', classifications: [] });
      return;
    }
    let cancelled = false;
    setOrgSsocState({ status: 'loading', message: `Classifying ${payloadJobs.length} posting${payloadJobs.length === 1 ? '' : 's'} against SSOC 2024...`, classifications: [] });
    postJson('/api/ssoc', { action: 'classifyTitles', jobs: payloadJobs })
      .then((data) => {
        if (cancelled) return;
        const classifications = Array.isArray(data.classifications) ? data.classifications : [];
        const matched = classifications.filter((item) => item.status === 'classified').length;
        setOrgSsocState({
          status: matched ? 'computed' : 'withheld',
          message: matched
            ? `${matched}/${payloadJobs.length} postings classified to SSOC unit groups.`
            : 'No organisation postings crossed the SSOC confidence threshold.',
          classifications,
          source: data.source || 'compiled_ssoc2024',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setOrgSsocState({ status: 'withheld', message: err.message || 'Organisation SSOC classification unavailable.', classifications: [] });
      });
    return () => { cancelled = true; };
  }, [jobs, lens]);

  useEffect(() => {
    if (!activeJob || !showReviewWorkspace) {
      setAioeState({ status: 'withheld', message: 'AIOE waits for a selected live posting and verified SSOC or ESCO evidence.' });
      return;
    }
    if (ssocState.status === 'loading') {
      setAioeState({ status: 'loading', message: 'Waiting for SSOC lookup before AIOE computation...' });
      return;
    }
    const evidence = engineEvidence(activeJob, ssocState.node);
    if (!evidence.hasEvidence) {
      setAioeState({ status: 'withheld', message: 'AIOE withheld: this posting does not expose SSOC, and SSOC title lookup did not find a usable 5-digit occupation.' });
      return;
    }
    let cancelled = false;
    setAioeState({ status: 'loading', message: `Computing deterministic SSOC/ISCO/SOC/AIOE chain (${evidence.source})...` });
    postJson('/api/engine', evidence.body)
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          setAioeState({
            status: 'computed',
            message: `${data.occupation?.label || 'Occupation'}: AIOE ${data.exposure?.index ?? '-'} / 100, ${data.exposure?.band || 'unknown'} exposure.`,
            data,
          });
        } else {
          setAioeState({ status: 'withheld', message: data?.reason || 'AIOE withheld because the occupation chain could not be verified.', data });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setAioeState({ status: err.status === 401 ? 'locked' : 'withheld', message: err.status === 401 ? 'Telegram login required before computing AIOE.' : (err.message || 'AIOE engine unavailable.'), error: err });
      });
    return () => { cancelled = true; };
  }, [activeJob, showReviewWorkspace, ssocState]);

  useEffect(() => {
    const code = ssocState.node?.code;
    if (!code) {
      setCorrespondenceState({ status: ssocState.status === 'loading' ? 'loading' : 'withheld', message: ssocState.status === 'loading' ? 'Waiting for SSOC lookup...' : 'No SSOC code available for correspondence.', rows: [] });
      return;
    }
    let cancelled = false;
    setCorrespondenceState({ status: 'loading', message: `Loading correspondence for SSOC ${code}...`, rows: [] });
    postJson('/api/ssoc', { action: 'correspondence', code })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data.rows) ? data.rows : [];
        setCorrespondenceState({
          status: data.db ? 'db' : 'fallback',
          message: rows.length ? `${rows.length} correspondence row${rows.length === 1 ? '' : 's'} loaded.` : 'No correspondence rows returned.',
          rows,
          db: data.db,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setCorrespondenceState({ status: 'withheld', message: err.message || 'SSOC correspondence unavailable.', rows: [] });
      });
    return () => { cancelled = true; };
  }, [ssocState.node?.code, ssocState.status]);

  const sourceStats = useMemo(() => {
    const stats = new Map();
    jobs.forEach((job) => stats.set(job.source, (stats.get(job.source) || 0) + 1));
    return [...stats.entries()];
  }, [jobs]);

  async function runSearch(event) {
    event?.preventDefault();
    const q = query.trim();
    if (!q) {
      setSearchState({ status: 'withheld', message: 'Enter a role or organisation before searching.' });
      return;
    }
    setJobs([]);
    setSelectedId('');
    setReviewId('');
    setReviewStates({});
    setSearchState({ status: 'loading', message: `Searching live Singapore job sources for "${q}"...` });
    const companyMode = lens === 'org' || searchMode === 'company';
    const body = companyMode ? { action: 'company', company: q, limit: 30, duties: true } : { action: 'jobs', title: q, limit: 18, detail: true, detailLimit: 4 };

    const calls = [
      postJson('/api/mcf', body).then((data) => ({ ok: true, source: data.source || 'MyCareersFuture Singapore', data })).catch((err) => ({ ok: false, source: 'MyCareersFuture Singapore', err })),
      postJson('/api/careers', body).then((data) => ({ ok: true, source: data.source || 'careers.gov.sg', data })).catch((err) => ({ ok: false, source: 'careers.gov.sg', err })),
    ];
    const results = await Promise.all(calls);
    const found = [];
    const messages = [];
    results.forEach((result) => {
      if (!result.ok) {
        if (result.err?.status === 401) messages.push(`${result.source}: Telegram login required`);
        else if (result.err?.status === 404) messages.push(`${result.source}: API route unavailable in this local preview`);
        else messages.push(`${result.source}: ${result.err?.message || 'source unavailable'}`);
        return;
      }
      const matches = Array.isArray(result.data.matches)
        ? result.data.matches.flatMap((match) => match.jobs || [])
        : [];
      const list = Array.isArray(result.data.jobs) ? result.data.jobs : matches;
      list.forEach((job) => {
        const normalised = normaliseJob(job, result.source);
        if (normalised) {
          const ranking = rankJob(normalised, q, lens);
          found.push({ ...normalised, matchScore: ranking.score, matchReason: ranking.reason });
        }
      });
      if (result.data.message) messages.push(`${result.source}: ${result.data.message}`);
    });

    const deduped = [];
    const seen = new Set();
    found.forEach((job) => {
      const key = `${job.source}:${job.uuid || job.title}:${job.employer}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(job);
    });
    deduped.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title));

    if (deduped.length) {
      setJobs(deduped);
      setSelectedId(deduped[0].uuid);
      setReviewId('');
      setReviewStates({});
      setSearchState({ status: 'wired', message: `Loaded ${deduped.length} live posting${deduped.length === 1 ? '' : 's'}. ${messages.join('. ')}`.trim() });
    } else {
      setJobs([]);
      setSelectedId('');
      setReviewId('');
      setSearchState({
        status: messages.some((msg) => /Telegram/.test(msg)) ? 'locked' : 'withheld',
        message: messages.length ? messages.join('. ') : 'No live jobs returned. Analysis is withheld until live posting evidence is selected.',
      });
    }
  }

  function setNoteStatus(id, status) {
    setReviewStates((prev) => ({ ...prev, [id]: status }));
  }

function resetToStart() {
    setJobs([]);
    setSelectedId('');
    setReviewId('');
    setReviewStates({});
    setActiveDrawer('');
    setSearchState({ status: 'idle', message: 'Choose Analyse a role, Browse SG jobs, or Search by employer to begin with live evidence.' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const acceptedCount = Object.values(reviewStates).filter((status) => status === 'accepted').length;
  const rejectedCount = Object.values(reviewStates).filter((status) => status === 'rejected').length;

  return (
    <main id="main-content" className={`v3r ${!showReviewWorkspace ? 'v2-flow' : ''} ${theme === 'dark' ? 'dark' : 'light'} ${printMode ? 'print-mode' : ''}`}>
      <style>{styles}</style>
      {!showReviewWorkspace && (
        <V2TopBar
          status={searchState.status}
          theme={theme}
          setTheme={setTheme}
          onReset={resetToStart}
          canReset={jobs.length > 0 || searchState.status !== 'idle'}
        />
      )}
      {!showReviewWorkspace && !showStepTwo && (
        <V2StepOne
          query={query}
          setQuery={setQuery}
          lens={lens}
          setLens={setLens}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          freshGrad={freshGrad}
          setFreshGrad={setFreshGrad}
          persona={persona}
          setPersona={setPersona}
          searchState={searchState}
          searchIsLoading={searchIsLoading}
          runSearch={runSearch}
        />
      )}
      {!showReviewWorkspace && showStepTwo && (
        <V2StepTwo
          query={query}
          lens={lens}
          visibleJobs={visibleJobs}
          jobs={jobs}
          freshGrad={freshGrad}
          setFreshGrad={setFreshGrad}
          selectedJob={selectedJob}
          setSelectedId={setSelectedId}
          setReviewId={setReviewId}
          setReviewStates={setReviewStates}
          onReset={resetToStart}
        />
      )}
      {showReviewWorkspace && (
      <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">V3</span>
          <div>
            <strong>Reviewable Work Intelligence</strong>
            <span>AI-assisted; human decides.</span>
          </div>
        </div>
        <div className="top-meta">
          <span className={`status-pill ${searchState.status}`}>{searchState.status}</span>
          <span>{CANON.product}</span>
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
      </header>

      <nav className="ribbon" aria-label="V3 command ribbon">
        <RibbonGroup title="Start">
          {LENSES.map((item) => (
            <button key={item.id} type="button" className={lens === item.id ? 'active' : ''} onClick={() => setLens(item.id)}>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </button>
          ))}
        </RibbonGroup>
        <RibbonGroup title="Review">
          {['markup', 'clean', 'trace'].map((item) => (
            <button key={item} type="button" className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item}</button>
          ))}
        </RibbonGroup>
        <RibbonGroup title="Visuals">
          {VISUALS.map((item) => (
            <button key={item.id} type="button" className={visual === item.id ? 'active' : ''} onClick={() => setVisual(item.id)}>
              <span>{item.label}</span>
              <small>{item.question}</small>
            </button>
          ))}
        </RibbonGroup>
        <RibbonGroup title="Output">
          <button type="button" onClick={() => setActiveDrawer('letter')}>Cover letter</button>
          <button type="button" onClick={() => setPrintMode(!printMode)}>{printMode ? 'Workspace' : 'Print view'}</button>
        </RibbonGroup>
      </nav>

      <section className="search-band">
        <div className="ingress-note">
          <span>Step 1</span>
          <strong>{lens === 'org' ? 'Organisation View' : 'Browse SG jobs'}</strong>
          <em>live sources: MCF + careers.gov.sg</em>
        </div>
        <div className="entry-modes" aria-label="Step 1 source mode">
          <button type="button" className={lens === 'role' && searchMode === 'role' ? 'active' : ''} onClick={() => { setLens('role'); setSearchMode('role'); }}>
            <strong>Analyse a role</strong>
            <span>ESCO essential skills</span>
          </button>
          <button type="button" className={lens === 'role' && searchMode === 'jobs' ? 'active' : ''} onClick={() => { setLens('role'); setSearchMode('jobs'); }}>
            <strong>Browse SG jobs</strong>
            <span>MCF + careers.gov.sg postings</span>
          </button>
          <button type="button" className={searchMode === 'company' ? 'active' : ''} onClick={() => { setLens('org'); setSearchMode('company'); }}>
            <strong>Search by employer</strong>
            <span>MCF + careers.gov.sg agencies</span>
          </button>
          <label className={`fresh-grad-toggle ${freshGrad ? 'active' : ''}`}>
            <input type="checkbox" checked={freshGrad} onChange={(event) => { setFreshGrad(event.target.checked); if (lens !== 'role') setLens('role'); }} />
            <span>Fresh grads · &lt; 4 yrs experience</span>
          </label>
        </div>
        <form onSubmit={runSearch} className="search-box">
          <label htmlFor="v3-query">{searchMode === 'company' || lens === 'org' ? 'Company name' : 'Role / keyword'}</label>
          <input id="v3-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchMode === 'company' || lens === 'org' ? 'DBS, LTA, Ministry of Health, HTX' : searchMode === 'jobs' ? 'Job title to browse live SG postings...' : 'Enter a job title to begin...'} />
          <button type="submit">{searchMode === 'company' || lens === 'org' ? 'Search employer' : searchMode === 'jobs' ? 'Browse' : 'Search'}</button>
        </form>
        <p>{searchState.message}</p>
      </section>
      </>
      )}

      {showReviewWorkspace ? (
      <section className="workspace">
        <aside className="rail" aria-label="Working drawers">
          {DRAWERS.map((drawer) => (
            <button
              key={drawer.id}
              type="button"
              className={`folder-tab ${activeDrawer === drawer.id ? 'active' : ''}`}
              aria-pressed={activeDrawer === drawer.id}
              onClick={() => setActiveDrawer(activeDrawer === drawer.id ? '' : drawer.id)}
            >
              {drawer.label}
            </button>
          ))}
          <div className="rail-divider" />
          {BLUEPRINT_SECTIONS.slice(0, 5).map((item) => (
            <button key={item.id} type="button" className="rail-ref" title={`${item.id}: ${item.title}`}>
              {item.id.replace('RBL-', '')}
            </button>
          ))}
        </aside>

        {activeDrawer && (
          <aside className="drawer">
            <DrawerContent
              id={activeDrawer}
              job={activeJob}
              jobs={jobs}
              stats={sourceStats}
              trace={trace}
              notes={notes}
              coverLetter={coverLetter}
              acceptedCount={acceptedCount}
              rejectedCount={rejectedCount}
              lens={lens}
              orgSummary={orgSummary}
              ssocState={ssocState}
              orgSsocState={orgSsocState}
              correspondenceState={correspondenceState}
              aioeState={aioeState}
              setActiveDrawer={setActiveDrawer}
            />
          </aside>
        )}

        <section className="centre" aria-label="Review manuscript canvas">
          <div className="job-list">
            <div className="list-head">
              <strong>{lens === 'org' ? 'Step 2: select posting evidence' : 'Step 2: select the right role'}</strong>
              <span>{visibleJobs.length} item{visibleJobs.length === 1 ? '' : 's'}</span>
            </div>
            {freshGrad && lens === 'role' && jobs.length > 0 && visibleJobs.length === 0 && (
              <p className="quiet">No roles under 4 years' experience among these live postings. Untick Fresh grads to see all.</p>
            )}
            {visibleJobs.map((job, index) => {
              const chip = sourceChip(job.source);
              const isLivePosting = chip.kind === 'posting';
              return (
                <article key={`${job.uuid}-${index}`} className={job.uuid === selectedJob?.uuid ? 'job-row active' : 'job-row'}>
                  <button type="button" className="job-row-main" onClick={() => setSelectedId(job.uuid)}>
                    <span className="job-card-head">
                      <strong>{job.title}</strong>
                      {daysAgo(job.postedDate) && <em>{daysAgo(job.postedDate)}</em>}
                    </span>
                    <span>{job.employer}</span>
                    <span className="job-meta-strip">
                      {formatSalary(job.salaryMin, job.salaryMax) && <b>{formatSalary(job.salaryMin, job.salaryMax)}</b>}
                      {job.employmentType && <b>{job.employmentType}</b>}
                      {job.minimumYearsExperience != null && Number(job.minimumYearsExperience) > 0 && <b>{job.minimumYearsExperience}+ yrs exp</b>}
                    </span>
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <span className="job-skill-strip">{job.skills.slice(0, 5).map((skill) => <b key={skill}>{skill}</b>)}</span>
                    )}
                    <em className={`chip ${chip.kind}`}>{SOURCE_LABELS[job.source] || chip.text}</em>
                    {job.matchReason && <em className="match-reason">{job.matchReason}</em>}
                  </button>
                  {isLivePosting && (
                    <div className="job-actions">
                      <button
                        type="button"
                        className="analyse-posting"
                        onClick={() => { setSelectedId(job.uuid); setReviewId(job.uuid); setReviewStates({}); }}
                      >
                        Analyse this posting
                      </button>
                      <button type="button" className="view-role-graph" onClick={() => openRoleGraph(job)}>
                        View role graph
                      </button>
                      {job.mcfUrl && <a href={job.mcfUrl} target="_blank" rel="noreferrer">Open posting</a>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <article className="manuscript">
            <header className="paper-head">
              <div>
                <p className="kicker">{selectedIsLive ? 'Step 3: analyse selected live posting' : 'Step 3: waiting for posting action'}</p>
                <h1>{reviewJob ? activeJob.title : 'Choose a live posting to analyse'}</h1>
                <p>{reviewJob ? activeJob.employer : 'Use Step 2, then tap Analyse this posting.'}</p>
                <div className="source-line">
                  <span className={`chip ${selectedSource.kind}`}>{reviewJob ? (SOURCE_LABELS[activeJob.source] || selectedSource.text) : 'no posting selected'}</span>
                  <span>{searchIsLoading ? 'waiting for live source results' : reviewJob ? activeJob.source : 'vault v3.0.71 pattern: Step 3 opens only after Analyse this posting'}</span>
                </div>
              </div>
              <div className="paper-actions">
                <span className="chip computed">{trace.length} O-I-A claims</span>
                <span className="chip derived">{notes.length} reviewer notes</span>
              </div>
            </header>

            {searchIsLoading ? (
              <section className="live-pending">
                <p className="section-label">Live review pending</p>
                <p>Step 2 will show the live postings after MCF and careers.gov.sg finish returning evidence for "{query}".</p>
              </section>
            ) : !reviewJob ? (
              <section className="live-pending">
                <p className="section-label">Step 2 first</p>
                <p>Select the right live posting, then tap <strong>Analyse this posting</strong>. This restores the v3.0.71 contract: browse results first, analysis second.</p>
              </section>
            ) : view === 'trace' ? (
              <TraceView trace={trace} />
            ) : (
              <ManuscriptView job={activeJob} notes={notes} reviewStates={reviewStates} clean={view === 'clean'} />
            )}
          </article>
        </section>

        <aside className={`right-stack ${visualExpanded ? 'expanded' : ''}`} aria-label="Visual intelligence">
          <div className="panel-head">
            <div>
              <p className="kicker">Visual intelligence</p>
              <h2>{VISUALS.find((item) => item.id === visual)?.label}</h2>
            </div>
            <button type="button" className="small-button" onClick={() => setVisualExpanded(!visualExpanded)}>{visualExpanded ? 'Dock' : 'Expand'}</button>
          </div>
          <VisualPanel visual={visual} data={visualData} job={activeJob} orgSummary={orgSummary} kgPayload={kgPayload} kgState={kgState} />
          <AioePanel state={aioeState} ssocState={ssocState} correspondenceState={correspondenceState} />

          <section className="review-notes">
            <div className="panel-head compact">
              <div>
                <p className="kicker">Reviewer notes</p>
                <h2>Accept, reject, ask why</h2>
              </div>
            </div>
            {notes.map((note) => (
              <article key={note.id} className={`note ${reviewStates[note.id] || 'open'}`}>
                <header>
                  <strong>{note.persona}</strong>
                  <span>{note.action}</span>
                </header>
                <p>{note.comment}</p>
                <blockquote>{note.suggestion}</blockquote>
                <div className="note-trace">
                  <span className={`chip ${note.provenance === 'AI estimate' ? 'ai' : note.provenance}`}>{note.provenance}</span>
                  <span>{note.blueprint}</span>
                  <span>{note.ui}</span>
                </div>
                <div className="note-actions">
                  <button type="button" onClick={() => setNoteStatus(note.id, 'accepted')}>Accept</button>
                  <button type="button" onClick={() => setNoteStatus(note.id, 'rejected')}>Reject</button>
                  <button type="button" onClick={() => setNoteStatus(note.id, 'open')}>Ask why</button>
                </div>
              </article>
            ))}
          </section>
        </aside>
      </section>
      ) : null}

      {showReviewWorkspace && <footer className="footer">
        <span>Canon: {CANON.product} + {CANON.ui}</span>
        <span>Ledger: {CANON.ledger}</span>
        <span>Accepted {acceptedCount} / rejected {rejectedCount}</span>
        <span>v3 rebuild pass 2026-06-27 22:08 SGT</span>
      </footer>}
    </main>
  );
}

function V2TopBar({ status, theme, setTheme, onReset, canReset }) {
  return (
    <header className="v2-topbar">
      <div className="v2-brandline">
        <span aria-hidden="true">★</span>
        <strong>AI Readiness across Skills and Competences</strong>
      </div>
      <div className="v2-top-actions">
        {status !== 'idle' && <span className={`status-pill ${status}`}>{status}</span>}
        {canReset && <button type="button" onClick={onReset}>New Search</button>}
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
      </div>
    </header>
  );
}

function V2StepOne({ query, setQuery, lens, setLens, searchMode, setSearchMode, freshGrad, setFreshGrad, persona, setPersona, searchState, searchIsLoading, runSearch }) {
  const companyMode = searchMode === 'company' || lens === 'org';
  const modeCards = [
    { id: 'role', title: 'Analyse a role', sub: 'ESCO essential skills', lens: 'role' },
    { id: 'jobs', title: 'Browse SG jobs', sub: 'MyCareersFuture + careers.gov.sg postings', lens: 'role' },
    { id: 'company', title: 'Search by employer', sub: 'MCF companies + careers.gov.sg agencies', lens: 'org' },
  ];
  const personaCards = [
    { id: 'leaders', icon: '▦', title: 'Leaders', text: 'Map AI exposure across roles. Compare live role evidence side by side.' },
    { id: 'employees', icon: '●', title: 'Employees', text: 'See which skills AI is reshaping in a role, with prompts for each skill.' },
    { id: 'fresh', icon: '◆', title: 'Fresh Graduates', text: 'Find out which skills in a field remain human, with a foundation plan.' },
    { id: 'crossover', icon: '↻', title: 'Industry Crossover', text: 'See which skills carry across to a new field, with a foundation plan.' },
  ];
  const fieldLabel = companyMode ? 'Organisation / employer' : searchMode === 'jobs' ? 'Role / keyword' : 'Role';

  return (
    <main className="v2-landing" aria-label="V2-style Step 1 search">
      <h1>Explore how AI fits into role skills - and where humans still lead.</h1>

      <section className="v2-card">
        <p className="v2-kicker">Start mode</p>
        <div className="v2-mode-grid">
          {modeCards.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={searchMode === mode.id ? 'active' : ''}
              aria-pressed={searchMode === mode.id}
              onClick={() => { setSearchMode(mode.id); setLens(mode.lens); }}
            >
              <strong>{mode.title}</strong>
              <span>{mode.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="v2-search-card">
        <form onSubmit={runSearch} className="v2-search-row">
          <label className="v2-field-label" htmlFor="v2-live-query">{fieldLabel}</label>
          <input
            id="v2-live-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={companyMode ? 'Enter an organisation, ministry, agency, or employer...' : searchMode === 'jobs' ? 'Job title to browse live SG postings...' : 'Enter a job title to begin...'}
            aria-label={companyMode ? 'Enter company or agency name' : 'Enter a job title'}
            autoFocus
          />
          <button type="submit" disabled={searchIsLoading}>{companyMode ? 'Search employer' : searchMode === 'jobs' ? 'Browse' : 'Search'}</button>
        </form>
        <p>Use 1 to 3 words for best results - e.g. HR Manager, Physician, Chief Executive Officer, Software Developer.</p>
        <p>Results are indicative - a starting point, not a final assessment.</p>
        {searchIsLoading && <div className="v2-loading"><span />Searching live Singapore job sources for "{query.trim()}".</div>}
        {searchState.status !== 'idle' && !searchIsLoading && <p className="v2-status-line">{searchState.message}</p>}
      </section>

      <section className="v2-card">
        <p className="v2-kicker">Who is this most useful for?</p>
        <div className="v2-persona-list">
          {personaCards.map((item) => (
            <button
              key={item.id}
              type="button"
              className={persona === item.id ? 'active' : ''}
              aria-pressed={persona === item.id}
              onClick={() => setPersona(persona === item.id ? '' : item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
              <em>{item.text}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="v2-card v2-foundation">
        <div>
          <strong>Adds a foundation skills plan to the analysis</strong>
          <em>optional</em>
        </div>
        <label className={freshGrad ? 'active' : ''}>
          <input
            type="checkbox"
            checked={freshGrad}
            onChange={(event) => { setFreshGrad(event.target.checked); if (event.target.checked) { setSearchMode('jobs'); setLens('role'); } }}
          />
          <span>Fresh Graduate</span>
          <small>Scout entry and junior postings under 4 years experience.</small>
        </label>
      </section>

      <p className="v2-note">Best explored on a wider screen - results span multiple tabs and detailed breakdowns.</p>
    </main>
  );
}

function V2StepTwo({ query, lens, visibleJobs, jobs, freshGrad, setFreshGrad, selectedJob, setSelectedId, setReviewId, setReviewStates, onReset }) {
  return (
    <main className="v2-step2" aria-label="V2-style Step 2 role selection">
      <button type="button" className="v2-back" onClick={onReset}>← New search</button>
      <section className="v2-step2-head">
        <p className="v2-kicker">Step 2</p>
        <h1>{lens === 'org' ? 'Select the right posting evidence' : 'Select the right role'}</h1>
        <p>Choose one live result for "{query}". The V3 review workspace opens only after you tap Analyse this posting.</p>
        <div>
          <span className="chip posting">MyCareersFuture + careers.gov.sg</span>
          <span className="chip computed">{jobs.length} live result{jobs.length === 1 ? '' : 's'}</span>
          {freshGrad && <button type="button" onClick={() => setFreshGrad(false)}>Show all experience levels</button>}
        </div>
      </section>

      {freshGrad && jobs.length > 0 && visibleJobs.length === 0 && (
        <section className="v2-card">
          <p>No roles under 4 years' experience were found in these live postings. Show all experience levels to continue.</p>
        </section>
      )}

      <section className="v2-results-list">
        {visibleJobs.map((job, index) => {
          const chip = sourceChip(job.source);
          const salary = formatSalary(job.salaryMin, job.salaryMax);
          return (
            <article key={`${job.uuid}-${index}`} className={job.uuid === selectedJob?.uuid ? 'active' : ''}>
              <button type="button" className="v2-result-main" onClick={() => setSelectedId(job.uuid)}>
                <span className="v2-result-top">
                  <strong>{job.title}</strong>
                  {daysAgo(job.postedDate) && <em>{daysAgo(job.postedDate)}</em>}
                </span>
                <span>{job.employer}</span>
                <span className="v2-result-meta">
                  {salary && <b>{salary}</b>}
                  {job.employmentType && <b>{job.employmentType}</b>}
                  {job.minimumYearsExperience != null && Number(job.minimumYearsExperience) > 0 && <b>{job.minimumYearsExperience}+ yrs exp</b>}
                  <b>{SOURCE_LABELS[job.source] || chip.text}</b>
                </span>
                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <span className="v2-skill-row">{job.skills.slice(0, 6).map((skill) => <b key={skill}>{skill}</b>)}</span>
                )}
                {job.matchReason && <em className="v2-match">{job.matchReason}</em>}
              </button>
              <div className="v2-result-actions">
                <button type="button" onClick={() => { setSelectedId(job.uuid); setReviewId(job.uuid); setReviewStates({}); }}>
                  Analyse this posting
                </button>
                <button type="button" onClick={() => openRoleGraph(job)}>
                  View role graph
                </button>
                {job.mcfUrl && <a href={job.mcfUrl} target="_blank" rel="noreferrer">Open posting</a>}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function RibbonGroup({ title, children }) {
  return (
    <section className="ribbon-group">
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  );
}

function DrawerContent({ id, job, jobs, stats, trace, notes, coverLetter, acceptedCount, rejectedCount, lens, orgSummary, ssocState, orgSsocState, correspondenceState, aioeState, setActiveDrawer }) {
  if (id === 'source') {
    return (
      <Drawer title="Source Evidence" onClose={() => setActiveDrawer('')}>
        <p className="drawer-lead">Live sources are labelled separately. Source facts stay separate from interpretation.</p>
        {stats.map(([source, count]) => (
          <div key={source} className="trace-row">
            <span>{source}</span>
            <strong>{count}</strong>
          </div>
        ))}
        <div className="trace-row">
          <span>Selected posting</span>
          <strong>{job.title}</strong>
        </div>
        <div className="trace-row">
          <span>Employer</span>
          <strong>{job.employer}</strong>
        </div>
        {job.mcfUrl && <a className="text-link" href={job.mcfUrl} target="_blank" rel="noreferrer">Open source posting</a>}
      </Drawer>
    );
  }

  if (id === 'taxonomy') {
    return (
      <Drawer title="SSOC Evidence" onClose={() => setActiveDrawer('')}>
        <p className="drawer-lead">SingStat SSOC 2024 is used as a deterministic occupation spine. This drawer shows the exact taxonomy and crosswalk evidence before AIOE is computed.</p>
        <section className="taxonomy-summary">
          <div>
            <span>Selected title</span>
            <strong>{job.title}</strong>
          </div>
          <div>
            <span>SSOC 2024 match</span>
            <strong>{ssocState?.node ? `${ssocState.node.code} ${ssocState.node.title}` : ssocState?.message || 'No match'}</strong>
            <em>{ssocState?.status === 'db' ? 'database' : ssocState?.status || 'withheld'}</em>
          </div>
          <div>
            <span>AIOE result</span>
            <strong>{aioeState?.status === 'computed' ? `${aioeState.data?.exposure?.index ?? '-'} / 100 (${aioeState.data?.exposure?.band || 'unknown'})` : aioeState?.message || 'Withheld'}</strong>
            <em>{aioeState?.status || 'withheld'}</em>
          </div>
        </section>
        {ssocState?.node && (
          <section className="advice-block">
            <h3>Definition</h3>
            <p>{ssocState.node.definition || 'No detailed definition returned for this SSOC node.'}</p>
            {ssocState.node.change_type && <p className="quiet">Type of change from SSOC 2020: {ssocState.node.change_type}</p>}
          </section>
        )}
        <section className="crosswalk-list">
          <header>
            <strong>Correspondence rows</strong>
            <span className={`status-pill ${correspondenceState?.status || 'withheld'}`}>{correspondenceState?.status || 'withheld'}</span>
          </header>
          <p>{correspondenceState?.message}</p>
          {(correspondenceState?.rows || []).map((row, index) => (
            <article key={`${row.type}-${row.target_code}-${index}`} className="crosswalk-row">
              <span>{row.type === 'ssoc2024_isco08' ? 'SSOC 2024 -> ISCO-08' : 'SSOC 2024 -> SSOC 2020'}</span>
                <strong>{row.source_code} {'->'} {row.target_code}</strong>
              <p>{row.target_title || 'No target title'}</p>
              {row.part && <em>partial mapping</em>}
            </article>
          ))}
        </section>
      </Drawer>
    );
  }

  if (id === 'blueprint') {
    return (
      <Drawer title="Blueprint Trace" onClose={() => setActiveDrawer('')}>
        <p className="drawer-lead">This drawer shows what is wired against the rebuild ledger. It is not another doctrine file.</p>
        {BLUEPRINT_SECTIONS.map((item) => (
          <article key={item.id} className="ledger-card">
            <header>
              <strong>{item.id}</strong>
              <span className={`status-pill ${item.status}`}>{item.status}</span>
            </header>
            <p>{item.title}</p>
            <small>{item.blueprint}</small>
            <small>{item.ui}</small>
          </article>
        ))}
      </Drawer>
    );
  }

  if (id === 'orgread') {
    return (
      <Drawer title="Organisation Read" onClose={() => setActiveDrawer('')}>
        <p className="drawer-lead">Organisation perspective commonises repeated roles into role families, capability signals, handoffs, and BPR hypotheses. Thin evidence stays labelled thin.</p>
        <section className="org-read-summary">
          <div>
            <span>Postings read</span>
            <strong>{orgSummary.postingCount}</strong>
            <em>{orgSummary.confidence} confidence</em>
          </div>
          <div>
            <span>Employer names</span>
            <strong>{orgSummary.employerCount}</strong>
            <em>{orgSummary.query || 'current search'}</em>
          </div>
          <div>
            <span>SSOC coverage</span>
            <strong>{orgSummary.ssocCoverage.classified}/{orgSummary.ssocCoverage.total}</strong>
            <em>{orgSsocState?.status || orgSummary.ssocCoverage.status}</em>
          </div>
        </section>
        <p className="quiet">{orgSsocState?.message || 'Organisation SSOC classification runs after Step 2 selection evidence is loaded.'}</p>
        {orgSummary.withheld && (
          <section className="advice-block">
            <h3>Withheld</h3>
            <p>{orgSummary.withheld}</p>
          </section>
        )}
        <section className="org-read-block">
          <header>
            <h3>Commonised role families</h3>
            <span className="status-pill computed">computed</span>
          </header>
          {orgSummary.roleFamilies.length ? orgSummary.roleFamilies.map((family) => (
            <article key={family.id} className="family-row">
              <strong>{family.label}</strong>
              <span>{family.count} posting{family.count === 1 ? '' : 's'} · {family.basis === 'ssoc' ? `SSOC ${family.confidence}` : 'heuristic fallback'}</span>
              <p>{family.examples.join(' / ')}</p>
              {family.occupations?.length ? <small>{family.occupations.join(' / ')}</small> : null}
            </article>
          )) : <p className="quiet">No repeated role family yet.</p>}
        </section>
        <section className="org-read-block">
          <header>
            <h3>SSOC occupation spine</h3>
            <span className={`status-pill ${orgSummary.ssocCoverage.status}`}>{orgSummary.ssocCoverage.status}</span>
          </header>
          {orgSummary.ssocRows.length ? orgSummary.ssocRows.map((item) => (
            <article key={`${item.id}-${item.node?.code}`} className="ssoc-row">
              <strong>{item.node?.code} {item.node?.title}</strong>
              <span>{item.family?.code} {item.family?.title}</span>
              <p>{item.title} · {item.confidence} · score {item.score}</p>
            </article>
          )) : <p className="quiet">No SSOC occupation spine yet. Ambiguous organisation phrases stay withheld.</p>}
        </section>
        <section className="org-read-block">
          <header>
            <h3>Capability signals</h3>
            <span className="status-pill derived">derived</span>
          </header>
          {orgSummary.capabilityRows.length ? orgSummary.capabilityRows.map((capability) => (
            <article key={capability.name} className="capability-row">
              <strong>{capability.name}</strong>
              <span>{capability.count} signal{capability.count === 1 ? '' : 's'}</span>
              <p>{capability.evidence.join(' / ')}</p>
            </article>
          )) : <p className="quiet">No capability pattern yet.</p>}
        </section>
        <section className="org-read-block">
          <header>
            <h3>BPR hypotheses</h3>
            <span className="status-pill partial">hypothesis</span>
          </header>
          {orgSummary.bprSignals.length ? orgSummary.bprSignals.slice(0, 5).map((signal, index) => (
            <article key={`${signal.type}-${index}`} className={`bpr-row ${signal.severity}`}>
              <strong>{signal.type}</strong>
              <span>{signal.severity} · {signal.count} signal{signal.count === 1 ? '' : 's'}</span>
              <p>{signal.read}</p>
              {signal.examples?.length ? <p>{signal.examples.join(' / ')}</p> : null}
              <small>{signal.bpr}</small>
            </article>
          )) : <p className="quiet">No BPR trigger yet. Continue reading repeated postings before recommending redesign.</p>}
        </section>
      </Drawer>
    );
  }

  if (id === 'advisory') {
    return (
      <Drawer title="Advisory Panel" onClose={() => setActiveDrawer('')}>
        <p className="drawer-lead">Evidence-bound advice only. No verdict on your career.</p>
        {lens === 'org' && (
          <section className="advice-block">
            <h3>Organisation capability read</h3>
            <p>{orgSummary.postingCount} posting{orgSummary.postingCount === 1 ? '' : 's'} across {orgSummary.employerCount} employer name{orgSummary.employerCount === 1 ? '' : 's'} for "{orgSummary.query}". Confidence is {orgSummary.confidence}.</p>
            <div className="mini-pills">
              {orgSummary.roleFamilies.slice(0, 4).map((family) => (
                <span key={family.id}>{family.label} <b>{family.count}</b></span>
              ))}
            </div>
            <p className="quiet">{orgSummary.withheld || 'Use this as a BPR signal only when repeated capabilities and handoffs appear across multiple postings.'}</p>
          </section>
        )}
        <section className="advice-block">
          <h3>What this role is really asking</h3>
          <p>{trace[0]?.interpretation || 'Hold interpretation until source evidence is available.'}</p>
        </section>
        <section className="advice-block">
          <h3>Proof to prepare</h3>
          <ul>
            <li>One reliability or recovery example.</li>
            <li>One stakeholder decision path.</li>
            <li>One governance, lineage, or validation example.</li>
          </ul>
        </section>
        <section className="advice-block">
          <h3>Interview questions</h3>
          <ul>
            <li>Which data decisions must remain human-owned?</li>
            <li>Where is the current process friction?</li>
            <li>What would success change for customers or teams?</li>
          </ul>
        </section>
        <div className="trace-row">
          <span>Accepted notes</span>
          <strong>{acceptedCount}</strong>
        </div>
        <div className="trace-row">
          <span>Rejected notes</span>
          <strong>{rejectedCount}</strong>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer title="Cover Letter Trace" onClose={() => setActiveDrawer('')}>
      <p className="drawer-lead">This draft is derived from visible source phrases and reviewer notes. It must be reviewed by the human user.</p>
      <pre className="letter">{coverLetter}</pre>
      <section className="advice-block">
        <h3>Why it says this</h3>
        <ul>
          {notes.slice(0, 3).map((note) => (
            <li key={note.id}>{note.persona}: {note.suggestion}</li>
          ))}
        </ul>
      </section>
      <div className="drawer-actions">
        <button type="button" onClick={() => navigator.clipboard?.writeText(coverLetter)}>Copy</button>
        <button type="button" onClick={() => window.print()}>Print / PDF</button>
      </div>
    </Drawer>
  );
}

function Drawer({ title, onClose, children }) {
  return (
    <div className="drawer-inner">
      <header>
        <div>
          <p className="kicker">Working drawer</p>
          <h2>{title}</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      {children}
    </div>
  );
}

function ManuscriptView({ job, notes, reviewStates, clean }) {
  const lines = splitLines(job.description || job.responsibilitiesText);
  const requirement = lines.find((line) => /degree|experience|sql|python|cloud|require/i.test(line));
  return (
    <div className="paper-body">
      <section>
        <p className="section-label">Role summary</p>
        {lines.slice(0, 2).map((line, index) => (
          <ReviewLine key={index} line={line} notes={notes} reviewStates={reviewStates} clean={clean} />
        ))}
      </section>
      <section>
        <p className="section-label">Responsibilities</p>
        <ul>
          {lines.slice(2, 7).map((line, index) => (
            <li key={index}><ReviewLine line={line} notes={notes} reviewStates={reviewStates} clean={clean} /></li>
          ))}
        </ul>
      </section>
      <section>
        <p className="section-label">Requirements</p>
        <p>{requirement || 'Requirements are not clearly separated in the source. V3 should withhold over-specific advice until the source is clearer.'}</p>
      </section>
      <section>
        <p className="section-label">Evidence chain</p>
        <p>Observation identifies the title, duties, AI terms, organisation handoffs, and governance language. Interpretation turns those signals into reviewable claims. Application routes claims to proof, interview questions, cover letter rationale, or withholding.</p>
      </section>
    </div>
  );
}

function ReviewLine({ line, notes, reviewStates, clean }) {
  if (clean) return <span>{line}</span>;
  const note = notes.find((item) => line.includes(item.target) || item.target.includes(line.slice(0, 32)));
  const exposure = exposureForText(line);
  return (
    <span className="review-line">
      <span className={`highlight ${exposure.band}`}>{line}</span>
      {note && <span className={`margin-mark ${reviewStates[note.id] || 'open'}`}>{note.action}</span>}
    </span>
  );
}

function TraceView({ trace }) {
  return (
    <div className="trace-list">
      {trace.map((item) => (
        <article key={item.id} className="trace-card">
          <header>
            <strong>{item.id}</strong>
            <span className={`band ${item.exposure.band}`}>{item.exposure.label}</span>
          </header>
          <div>
            <p><b>Observation</b>{item.observation}</p>
            <p><b>Interpretation</b>{item.interpretation}</p>
            <p><b>Application</b>{item.application}</p>
          </div>
          <small>{item.exposure.reason}</small>
        </article>
      ))}
    </div>
  );
}

function VisualPanel({ visual, data, job, orgSummary, kgPayload, kgState }) {
  if (visual === 'org') return <OrgVisual data={data.org} orgSummary={orgSummary} />;
  if (visual === 'workflow') return <WorkflowVisual data={data.workflow} />;
  if (visual === 'stream') return <StreamVisual data={data.stream} />;
  return <GraphVisual data={data.concepts} job={job} kgPayload={kgPayload} kgState={kgState} />;
}

function AioePanel({ state, ssocState, correspondenceState }) {
  const exposure = state.data?.exposure;
  const occupation = state.data?.occupation;
  const rows = correspondenceState?.rows || [];
  const iscoRow = rows.find((row) => row.type === 'ssoc2024_isco08');
  const ssoc2020Row = rows.find((row) => row.type === 'ssoc2024_ssoc2020');
  return (
    <section className="aioe-card">
      <header>
        <div>
          <p className="kicker">AIOE determinism</p>
          <h3>{state.status === 'computed' ? 'Computed exposure' : state.status === 'loading' ? 'Computing exposure' : 'Exposure withheld'}</h3>
        </div>
        <span className={`status-pill ${state.status}`}>{state.status}</span>
      </header>
      <div className="ssoc-lookup">
        <span>SSOC 2024</span>
        <strong>{ssocState.node ? `${ssocState.node.code} ${ssocState.node.title}` : ssocState.message}</strong>
        <em>{ssocState.status === 'db' ? 'database' : ssocState.status === 'fallback' ? 'compiled fallback' : ssocState.status}</em>
      </div>
      <p>{state.message}</p>
      {state.status === 'computed' && (
        <div className="aioe-grid">
          <span>Occupation <b>{occupation?.label || '-'}</b></span>
          <span>SSOC <b>{occupation?.ssoc || '-'}</b></span>
          <span>ISCO <b>{Array.isArray(occupation?.isco) ? occupation.isco.join(' / ') : '-'}</b></span>
          <span>Index <b>{exposure?.index ?? '-'}</b></span>
        </div>
      )}
      <div className="trace-ladder" aria-label="SSOC to AIOE evidence route">
        <div className={`ladder-step ${ssocState.node ? 'active' : 'withheld'}`}>
          <span>1</span>
          <div>
            <strong>SSOC 2024 spine</strong>
            <p>{ssocState.node ? `${ssocState.node.code} ${ssocState.node.title}` : ssocState.message}</p>
          </div>
        </div>
        <div className={`ladder-step ${iscoRow ? 'active' : 'withheld'}`}>
          <span>2</span>
          <div>
            <strong>International crosswalk</strong>
            <p>{iscoRow ? `${iscoRow.target_code} ${iscoRow.target_title || ''}` : 'ISCO-08 mapping not loaded.'}</p>
          </div>
        </div>
        <div className={`ladder-step ${state.status === 'computed' ? 'active' : 'withheld'}`}>
          <span>3</span>
          <div>
            <strong>AIOE calculation</strong>
            <p>{state.status === 'computed' ? `${exposure?.index ?? '-'} / 100, ${exposure?.band || 'unknown'} exposure` : 'Withheld until taxonomy evidence is present.'}</p>
          </div>
        </div>
        <div className={`ladder-step ${ssoc2020Row ? 'active' : 'withheld'}`}>
          <span>4</span>
          <div>
            <strong>SSOC 2020 migration</strong>
            <p>{ssoc2020Row ? `${ssoc2020Row.target_code} ${ssoc2020Row.target_title || ''}` : 'Historical mapping not loaded.'}</p>
          </div>
        </div>
      </div>
      <small>Rule: no SSOC / ESCO fingerprint means no computed-looking AI exposure number.</small>
    </section>
  );
}

function GraphVisual({ data, job, kgPayload, kgState }) {
  const [layout, setLayout] = useState('lanes');
  if (job && kgPayload && kgPayload.nodes.length > 1) {
    const status = kgState?.status;
    const deep = status === 'ready';
    return (
      <section className="visual-card job-graph">
        <div className="graph-layout-toggle" role="group" aria-label="Job graph layout">
          <button type="button" className={layout === 'lanes' ? 'active' : ''} aria-pressed={layout === 'lanes'} onClick={() => setLayout('lanes')}>Map</button>
          <button type="button" className={layout === 'force' ? 'active' : ''} aria-pressed={layout === 'force'} onClick={() => setLayout('force')}>Neural</button>
        </div>
        {status === 'loading' && <p className="graph-status" role="status">{kgState.message}</p>}
        {(status === 'withheld' || status === 'locked') && <p className="graph-status" role="status">{kgState.message}</p>}
        <KGGraph kg={kgPayload} layout={layout} embedded />
        <p>{deep
          ? 'Deep analysis: ESCO skills and extracted responsibilities wired into role, duty, skill, and qualification nodes. Map view is keyboard-navigable; Neural view is the same nodes as a force layout. No relationship is invented.'
          : 'Grounded outline from the posting text while deep analysis runs (or when it is withheld). Map view is keyboard-navigable; Neural view shows the same nodes as a force layout.'}</p>
      </section>
    );
  }
  const nodes = data.slice(0, 8).map((node, index) => {
    const angle = (-110 + index * (220 / Math.max(1, data.slice(0, 8).length - 1))) * (Math.PI / 180);
    const radius = index % 2 === 0 ? 55 : 43;
    return {
      ...node,
      id: index + 1,
      x: 90 + Math.cos(angle) * radius,
      y: 78 + Math.sin(angle) * radius,
      size: 8 + Math.min(8, node.count * 2),
      className: index % 3 === 0 ? 'human' : index % 3 === 1 ? 'assist' : 'augment',
    };
  });
  return (
    <section className="visual-card">
      <div className="concept-map">
        <svg viewBox="0 0 180 156" role="img" aria-label="Concept graph">
          <defs>
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>
          <circle cx="90" cy="78" r="64" className="orbit" />
          <circle cx="90" cy="78" r="42" className="orbit inner" />
          {nodes.map((node) => (
            <path key={`${node.name}-edge`} d={`M90 78 C ${90 + (node.x - 90) * 0.35} ${78 + (node.y - 78) * 0.2}, ${90 + (node.x - 90) * 0.72} ${78 + (node.y - 78) * 0.85}, ${node.x} ${node.y}`} className={`graph-link ${node.className}`} />
          ))}
          <circle cx="90" cy="78" r="20" className="node centre-node" filter="url(#nodeShadow)" />
          <text x="90" y="75" textAnchor="middle" className="hub-label">role</text>
          <text x="90" y="85" textAnchor="middle" className="hub-title">{short(job.title, 11)}</text>
          {nodes.map((node) => (
            <g key={node.name} className="concept-node">
              <circle cx={node.x} cy={node.y} r={node.size} className={`node ${node.className}`} filter="url(#nodeShadow)" />
              <text x={node.x} y={node.y + 3} textAnchor="middle" className="node-number">{node.id}</text>
            </g>
          ))}
        </svg>
        <div className="concept-list" aria-label="Graph concept labels">
          {nodes.map((node) => (
            <div key={node.name} className={`concept-item ${node.className}`}>
              <span>{node.id}</span>
              <strong>{node.name}</strong>
              <em>{node.count} signal{node.count === 1 ? '' : 's'}</em>
            </div>
          ))}
        </div>
      </div>
      <p>Concept graph is used for text clusters, gaps, and bridge concepts. Structure, organisation, workflow, and value-stream visuals use their own forms.</p>
    </section>
  );
}

function OrgVisual({ data, orgSummary }) {
  const families = orgSummary?.roleFamilies?.length ? orgSummary.roleFamilies.slice(0, 4) : data.map((node) => ({ label: node.name, count: 1, examples: [node.role] }));
  const capabilities = orgSummary?.capabilityRows?.length ? orgSummary.capabilityRows.slice(0, 5) : [];
  const bprSignals = orgSummary?.bprSignals?.slice(0, 3) || [];
  return (
    <section className="visual-card org-map">
      <div className="org-map-stage">
        <div className="org-hub">
          <span>organisation</span>
          <strong>{orgSummary?.query || 'current evidence'}</strong>
          <em>{orgSummary?.confidence || 'thin'} confidence · SSOC {orgSummary?.ssocCoverage?.classified || 0}/{orgSummary?.ssocCoverage?.total || 0}</em>
        </div>
        <div className="org-column families">
          <span>SSOC role families</span>
          {families.map((family) => (
            <article key={family.id || family.label}>
              <strong>{family.label}</strong>
              <em>{family.count} posting{family.count === 1 ? '' : 's'} · {family.basis === 'ssoc' ? family.confidence : 'fallback'}</em>
            </article>
          ))}
        </div>
        <div className="org-column capabilities">
          <span>capabilities</span>
          {capabilities.length ? capabilities.map((capability) => (
            <article key={capability.name}>
              <strong>{capability.name}</strong>
              <em>{capability.count} signal{capability.count === 1 ? '' : 's'}</em>
            </article>
          )) : (
            <article>
              <strong>More postings needed</strong>
              <em>withheld</em>
            </article>
          )}
        </div>
        <div className="org-column bpr">
          <span>BPR triggers</span>
          {bprSignals.length ? bprSignals.map((signal, index) => (
            <article key={`${signal.type}-${index}`}>
              <strong>{signal.type}</strong>
              <em>{signal.severity} · {signal.count} signal{signal.count === 1 ? '' : 's'}</em>
            </article>
          )) : (
            <article>
              <strong>No trigger yet</strong>
              <em>withheld</em>
            </article>
          )}
        </div>
      </div>
      <p>Organisation view commonises roles into families, maps repeated capabilities, and shows BPR hypotheses only when the postings support them.</p>
    </section>
  );
}

function WorkflowVisual({ data }) {
  return (
    <section className="visual-card flow">
      {data.map((step, index) => (
        <div key={step} className="flow-step">
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </div>
      ))}
      <p>Workflow view answers order and decision questions. It is not a concept graph.</p>
    </section>
  );
}

function StreamVisual({ data }) {
  return (
    <section className="visual-card stream">
      {data.map((step, index) => (
        <div key={`${step.name}-${index}`} className={step.value}>
          <header>
            <strong>{step.name}</strong>
            <span>{step.value === 'value' ? 'value add' : 'wait / handoff'}</span>
          </header>
          <p>{step.text}</p>
        </div>
      ))}
      <p>Value stream view makes BPR visible: time, waste, handoff, and AI leverage.</p>
    </section>
  );
}

function short(text, len) {
  const value = safeText(text);
  return value.length > len ? `${value.slice(0, len - 1)}.` : value;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Spline+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@500;600;700&display=swap');

:root {
  color-scheme: light;
  --ground: #e9edf3;
  --surface: #fbfaf8;
  --paper: #ffffff;
  --ink: #16202e;
  --body: #3a4456;
  --sub: #64748b;
  --label: #8a8274;
  --line: #dce4ef;
  --accent: #1a56db;
  --human: #1d4ed8;
  --assist: #0e7490;
  --augment: #b45309;
  --auto: #c2410c;
  --shadow: 0 14px 36px rgba(22, 32, 46, 0.12);
}

:root[data-v3-theme="dark"] {
  color-scheme: dark;
  --ground: #0b0e14;
  --surface: rgba(255,255,255,0.06);
  --paper: #101722;
  --ink: #f7f2ea;
  --body: #d4dbe8;
  --sub: #aab5c4;
  --label: #b9aa92;
  --line: rgba(255,255,255,0.16);
  --accent: #7ea2ff;
  --human: #7ea2ff;
  --assist: #5fdcf5;
  --augment: #fbbf24;
  --auto: #f59e5b;
  --shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--ground); color: var(--body); font-family: "Spline Sans", system-ui, sans-serif; }
button, input { font: inherit; }
button { min-height: 44px; border: 1px solid var(--line); border-radius: 7px; background: var(--paper); color: var(--ink); cursor: pointer; }
button:hover, button:focus-visible { border-color: var(--accent); outline: 2px solid color-mix(in srgb, var(--accent) 35%, transparent); outline-offset: 2px; }

.v3r { min-height: 100vh; display: grid; grid-template-rows: auto auto auto minmax(0, 1fr) auto; background: var(--ground); }
.v3r.v2-flow { display: block; min-height: 100vh; background: #f1f5fb; color: var(--ink); overflow-x: hidden; }
.v3r-plain { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--ground); }
.v3r-card { max-width: 720px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); padding: 24px; box-shadow: var(--shadow); }

.v2-topbar { min-height: 50px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 18px; background: #073b9d; color: #fff; }
.v2-brandline { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.v2-brandline span { color: #ffd23f; font-size: 19px; }
.v2-brandline strong { font-size: 0.9rem; line-height: 1.25; }
.v2-top-actions { display: inline-flex; align-items: center; gap: 8px; }
.v2-top-actions button { min-height: 34px; padding: 0 12px; border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.14); color: #fff; font-size: .74rem; }

.v2-landing, .v2-step2 { width: min(1248px, calc(100vw - 32px)); margin: 0 auto; padding: 36px 0 52px; }
.v2-search-card { border: 2px solid #1d5bff; border-radius: 10px; background: #fff; padding: 14px; box-shadow: 0 14px 34px rgba(36,55,90,.08); }
.v2-search-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.v2-field-label { color: #817b70; font: 800 .78rem "Spline Sans Mono", monospace; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.v2-search-row input { width: 100%; min-height: 46px; border: 1px solid #cfd9e8; border-radius: 7px; padding: 0 14px; background: #f8fafc; color: #182235; font-size: 1rem; }
.v2-search-row button { min-width: 98px; min-height: 46px; background: #063b9d; color: #fff; border-color: #063b9d; font-weight: 800; }
.v2-search-card p { margin: 8px 0 0; color: #51627a; font-size: .78rem; line-height: 1.45; }
.v2-status-line { color: #063b9d !important; font-weight: 700; }
.v2-loading { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; color: #063b9d; font-size: .82rem; font-weight: 700; }
.v2-loading span { width: 14px; height: 14px; border: 2px solid #c7d7ff; border-top-color: #063b9d; border-radius: 50%; animation: spin .8s linear infinite; }
.v2-landing h1, .v2-step2 h1 { margin: 22px 4px 10px; color: #172033; font-size: clamp(1.45rem, 2vw, 1.75rem); line-height: 1.15; letter-spacing: 0; }
.v2-card { margin-top: 12px; border: 1px solid #d7e0ef; border-radius: 10px; background: #fff; padding: 14px 16px; box-shadow: 0 10px 28px rgba(36,55,90,.05); }
.v2-kicker { margin: 0 0 12px !important; color: #66758a; font: 800 .74rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: .08em; }
.v2-mode-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.v2-mode-grid button, .v2-persona-list button { min-height: 54px; display: grid; gap: 3px; align-content: center; text-align: left; background: #f8fafc; border-color: #d7e0ef; }
.v2-mode-grid button { padding: 9px 12px; }
.v2-mode-grid button.active, .v2-persona-list button.active, .v2-foundation label.active { border-color: #1d5bff; background: #eef4ff; box-shadow: inset 0 0 0 1px rgba(29,91,255,.35); }
.v2-mode-grid strong, .v2-persona-list strong { color: #172033; font-size: .86rem; line-height: 1.2; }
.v2-mode-grid span, .v2-persona-list em, .v2-foundation small { color: #52627a; font-size: .74rem; line-height: 1.25; font-style: normal; }
.v2-persona-list { display: grid; gap: 8px; }
.v2-persona-list button { grid-template-columns: 28px auto minmax(0, 1fr); align-items: center; padding: 10px 12px; }
.v2-persona-list button > span { color: #51627a; font: 800 1rem "Spline Sans Mono", monospace; }
.v2-foundation { display: grid; gap: 12px; }
.v2-foundation > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.v2-foundation > div strong { color: #172033; font-size: .86rem; }
.v2-foundation > div em { color: #8793a6; font-size: .76rem; font-style: italic; }
.v2-foundation label { min-height: 54px; display: grid; grid-template-columns: 22px auto minmax(0, 1fr); gap: 10px; align-items: center; border: 1px solid #d7e0ef; border-radius: 8px; background: #f8fafc; padding: 10px 12px; cursor: pointer; }
.v2-foundation input { width: 18px; height: 18px; accent-color: #1d5bff; }
.v2-foundation span { color: #172033; font-weight: 800; font-size: .84rem; }
.v2-note { text-align: center; color: #68768d; font-size: .78rem; font-style: italic; }
.v2-back { min-height: 36px; padding: 0; border: 0; background: transparent; color: #063b9d; font-weight: 800; }
.v2-step2-head { border: 1px solid #d7e0ef; border-radius: 10px; background: #fff; padding: 18px; box-shadow: 0 14px 34px rgba(36,55,90,.08); }
.v2-step2-head h1 { margin: 0 0 8px; }
.v2-step2-head p:not(.v2-kicker) { margin: 0 0 12px; color: #52627a; line-height: 1.45; }
.v2-step2-head div { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.v2-step2-head button { min-height: 28px; padding: 0 10px; font-size: .72rem; }
.v2-results-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 12px; margin-top: 14px; }
.v2-results-list article { border: 1px solid #d7e0ef; border-radius: 10px; background: #fff; padding: 12px; box-shadow: 0 12px 28px rgba(36,55,90,.06); }
.v2-results-list article.active { border-color: #1d5bff; box-shadow: inset 3px 0 0 #1d5bff, 0 12px 28px rgba(36,55,90,.06); }
.v2-result-main { width: 100%; min-height: 0; display: grid; gap: 8px; padding: 0; border: 0; background: transparent; text-align: left; box-shadow: none; }
.v2-result-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.v2-result-top strong { color: #172033; font-size: .94rem; line-height: 1.22; }
.v2-result-top em, .v2-match { color: #65758b; font-size: .72rem; font-style: normal; }
.v2-result-main > span:nth-child(2) { color: #52627a; font-size: .78rem; line-height: 1.25; text-transform: uppercase; }
.v2-result-meta, .v2-skill-row { display: flex; flex-wrap: wrap; gap: 6px; }
.v2-result-meta b, .v2-skill-row b { border: 1px solid #d7e0ef; border-radius: 999px; padding: 2px 8px; background: #f8fafc; color: #52627a; font-size: .68rem; line-height: 1.4; }
.v2-result-actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.v2-result-actions button { min-height: 36px; padding: 0 12px; background: #063b9d; border-color: #063b9d; color: #fff; font-size: .78rem; font-weight: 800; }
.v2-result-actions a { color: #063b9d; font-size: .76rem; font-weight: 800; }
@keyframes spin { to { transform: rotate(360deg); } }

.topbar { min-height: 48px; display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--line); background: var(--paper); position: sticky; top: 0; z-index: 20; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.brand-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: var(--ink); color: var(--paper); font-family: "Spline Sans Mono", monospace; font-weight: 800; }
.brand strong { display: block; color: var(--ink); font-size: 0.9rem; }
.brand span:not(.brand-mark) { display: block; color: var(--sub); font-size: 0.76rem; }
.top-meta { display: flex; align-items: center; justify-content: flex-end; gap: 8px; color: var(--sub); font-family: "Spline Sans Mono", monospace; font-size: 0.68rem; white-space: nowrap; }
.top-meta button { padding: 0 10px; min-height: 44px; font-size: 0.72rem; }

.ribbon { display: grid; grid-template-columns: repeat(4, minmax(170px, 1fr)); gap: 8px; padding: 8px 14px; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--paper) 86%, var(--ground)); overflow-x: auto; }
.ribbon-group { border: 1px solid var(--line); border-radius: 8px; padding: 7px; background: var(--surface); min-width: 0; }
.ribbon-group > strong { display: block; margin: 0 0 6px; color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.14em; }
.ribbon-group > div { display: flex; gap: 6px; flex-wrap: wrap; }
.ribbon button { min-height: 44px; padding: 5px 9px; font-size: 0.76rem; text-align: left; }
.ribbon button small { display: block; color: var(--sub); font-size: 0.62rem; line-height: 1.2; }
.ribbon button.active { border-color: var(--accent); color: var(--accent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent); }

.search-band { display: flex; align-items: center; gap: 14px; padding: 9px 14px; border-bottom: 1px solid var(--line); background: var(--surface); }
.ingress-note { display: grid; gap: 1px; min-width: 168px; border: 1px solid var(--line); border-radius: 8px; padding: 7px 9px; background: var(--paper); }
.ingress-note span, .ingress-note em { color: var(--label); font: 700 0.6rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.09em; font-style: normal; }
.ingress-note strong { color: var(--ink); font-size: 0.78rem; line-height: 1.2; }
.ingress-note em { color: var(--sub); letter-spacing: 0.04em; }
.entry-modes { display: grid; grid-template-columns: repeat(2, minmax(112px, 1fr)); gap: 6px; min-width: 250px; }
.entry-modes button { display: grid; gap: 2px; min-height: 44px; padding: 7px 9px; text-align: left; background: var(--paper); }
.entry-modes button.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--paper)); color: var(--accent); }
.entry-modes strong { font-size: 0.76rem; line-height: 1.15; }
.entry-modes span { color: var(--sub); font-size: 0.64rem; line-height: 1.15; }
.fresh-grad-toggle { grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; color: var(--sub); font-size: 0.68rem; font-weight: 700; cursor: pointer; }
.fresh-grad-toggle input { width: 15px; height: 15px; accent-color: var(--accent); }
.fresh-grad-toggle.active { color: var(--accent); }
.search-box { display: grid; grid-template-columns: auto minmax(180px, 380px) auto; gap: 8px; align-items: center; }
.search-box label { color: var(--label); font: 700 0.68rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.1em; }
.search-box input { min-height: 44px; border: 1px solid var(--line); border-radius: 7px; background: var(--paper); color: var(--ink); padding: 0 12px; }
.search-box button { padding: 0 14px; background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700; }
.search-band p { margin: 0; color: var(--sub); font-size: 0.8rem; line-height: 1.4; }

.workspace { min-height: 0; display: grid; grid-template-columns: 58px minmax(0, 280px) minmax(420px, 1fr) minmax(300px, 390px); gap: 10px; padding: 10px 14px; overflow: hidden; }
.start-empty { min-height: 0; display: grid; align-items: start; padding: 16px 14px; overflow: auto; }
.start-empty article { max-width: 780px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); box-shadow: var(--shadow); padding: 18px; }
.start-empty h2 { margin: 4px 0 8px; color: var(--ink); font: 600 1.45rem "Newsreader", Georgia, serif; }
.start-empty p { margin: 0 0 12px; color: var(--body); line-height: 1.55; }
.start-empty div { display: flex; flex-wrap: wrap; gap: 8px; }
.rail { position: relative; display: flex; flex-direction: column; gap: 7px; align-items: stretch; padding: 7px 0 7px 4px; border-right: 1px solid var(--line); }
.rail::after { content: ""; position: absolute; top: 8px; bottom: 8px; right: -1px; width: 1px; background: var(--line); }
.rail button { position: relative; z-index: 1; padding: 0 6px; font-size: 0.68rem; font-weight: 700; font-family: "Spline Sans Mono", monospace; }
.folder-tab { min-height: 52px; border-radius: 9px 0 0 9px; border-right: 0; background: color-mix(in srgb, var(--paper) 92%, var(--ground)); box-shadow: inset -7px 0 0 color-mix(in srgb, var(--line) 55%, transparent); color: var(--body); }
.folder-tab::before,
.folder-tab::after { content: ""; position: absolute; right: -1px; width: 12px; height: 8px; border-right: 1px solid var(--line); background: var(--ground); pointer-events: none; }
.folder-tab::before { top: -8px; border-bottom: 1px solid var(--line); border-bottom-right-radius: 8px; }
.folder-tab::after { bottom: -8px; border-top: 1px solid var(--line); border-top-right-radius: 8px; }
.folder-tab.active { z-index: 3; color: var(--accent); background: var(--paper); border-color: var(--accent); box-shadow: inset 4px 0 0 var(--accent), 8px 0 0 var(--paper), 0 10px 18px rgba(22,32,46,0.08); }
.folder-tab.active::before,
.folder-tab.active::after { border-color: var(--accent); background: var(--ground); }
.rail-ref { min-height: 44px; border-radius: 7px 0 0 7px; color: var(--sub); background: transparent; box-shadow: none; }
.rail-ref:hover { background: var(--surface); }
.rail-divider { height: 1px; background: var(--line); margin: 4px 8px 5px 0; }

.drawer, .centre, .right-stack { min-height: 0; overflow: auto; }
.drawer { margin-left: -11px; padding-left: 10px; }
.drawer-inner, .job-list, .manuscript, .right-stack > .visual-card, .aioe-card, .review-notes, .drawer .ledger-card, .advice-block { border: 1px solid var(--line); border-radius: 8px; background: var(--paper); box-shadow: var(--shadow); }
.drawer-inner { position: relative; min-height: 100%; border-top-left-radius: 0; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.drawer-inner::before { content: ""; position: absolute; left: -10px; top: -1px; bottom: -1px; width: 10px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--paper); }
.drawer-inner > header, .paper-head, .panel-head, .note header, .ledger-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.drawer-inner h2, .panel-head h2 { margin: 0; font: 600 1.2rem "Newsreader", Georgia, serif; color: var(--ink); }
.drawer-inner > header button { min-height: 44px; padding: 0 10px; }
.drawer-lead { margin: 0; color: var(--sub); line-height: 1.5; }

.centre { display: grid; grid-template-columns: minmax(190px, 260px) minmax(0, 1fr); gap: 10px; }
.job-list { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.list-head { display: flex; justify-content: space-between; gap: 8px; color: var(--sub); font-size: 0.75rem; }
.list-head strong { color: var(--ink); }
.job-row { min-height: 92px; text-align: left; display: flex; flex-direction: column; gap: 7px; padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }
.job-row-main { display: grid; gap: 5px; min-height: 0; padding: 0; border: 0; background: transparent; text-align: left; box-shadow: none; }
.job-row strong { color: var(--ink); line-height: 1.2; }
.job-row span { color: var(--sub); font-size: 0.75rem; line-height: 1.25; }
.job-row.active { border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
.job-card-head { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.job-card-head em { flex: 0 0 auto; color: var(--sub); font-style: normal; font-size: 0.68rem; }
.job-meta-strip, .job-skill-strip { display: flex; flex-wrap: wrap; gap: 4px; }
.job-meta-strip b, .job-skill-strip b { border: 1px solid var(--line); border-radius: 999px; padding: 2px 7px; background: var(--paper); color: var(--sub); font-size: 0.65rem; font-weight: 700; }
.job-meta-strip b:first-child { color: var(--assist); border-color: color-mix(in srgb, var(--assist) 42%, var(--line)); background: color-mix(in srgb, var(--assist) 8%, var(--paper)); }
.job-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.job-actions a { color: var(--accent); font-size: 0.7rem; font-weight: 800; text-decoration: none; }
.analyse-posting { align-self: flex-start; min-height: 32px; padding: 0 9px; border-color: color-mix(in srgb, var(--assist) 45%, var(--line)); color: var(--assist); background: color-mix(in srgb, var(--assist) 8%, transparent); font-size: 0.68rem; font-weight: 800; }
.view-role-graph { align-self: flex-start; min-height: 32px; padding: 0 9px; border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); font-size: 0.68rem; font-weight: 800; }
.match-reason { color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.08em; }

.manuscript { padding: clamp(16px, 3vw, 32px); }
.paper-head { margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.paper-head h1 { margin: 4px 0 4px; color: var(--ink); font: 600 clamp(2.1rem, 5vw, 3.2rem) "Newsreader", Georgia, serif; letter-spacing: 0; }
.paper-head p { margin: 0; color: var(--sub); }
.paper-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.source-line { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; color: var(--sub); font-size: 0.76rem; }
.live-pending { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: var(--surface); }
.live-pending p:last-child { margin: 8px 0 0; color: var(--body); line-height: 1.55; }
.kicker, .section-label { color: var(--label); font: 700 0.66rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.14em; }
.paper-body { display: grid; gap: 24px; color: var(--ink); font-size: 1rem; line-height: 1.75; }
.paper-body p { margin: 0 0 10px; }
.paper-body ul { margin: 0; padding-left: 1.2rem; }
.review-line { position: relative; }
.highlight { border-radius: 5px; padding: 1px 4px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.highlight.human { background: color-mix(in srgb, var(--human) 15%, transparent); color: var(--ink); }
.highlight.assist { background: color-mix(in srgb, var(--assist) 17%, transparent); color: var(--ink); }
.highlight.augment { background: color-mix(in srgb, var(--augment) 17%, transparent); color: var(--ink); }
.margin-mark { display: inline-flex; margin-left: 6px; transform: translateY(-1px); border: 1px solid var(--line); border-radius: 999px; padding: 1px 7px; color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; }
.margin-mark.accepted { color: var(--assist); border-color: var(--assist); }
.margin-mark.rejected { color: var(--auto); border-color: var(--auto); }

.right-stack { display: flex; flex-direction: column; gap: 10px; }
.right-stack.expanded { position: fixed; top: 138px; right: 14px; bottom: 36px; width: min(760px, calc(100vw - 104px)); z-index: 18; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--ground); box-shadow: var(--shadow); }
.panel-head { padding: 12px 12px 0; }
.panel-head.compact { padding: 12px; }
.small-button { min-height: 44px; padding: 0 10px; font-size: 0.72rem; }
.visual-card { padding: 12px; }
.graph-layout-toggle { display: inline-flex; gap: 6px; margin-bottom: 10px; }
.graph-layout-toggle button { min-height: 44px; padding: 0 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--body); font: 600 0.8rem "Spline Sans", sans-serif; cursor: pointer; }
.graph-layout-toggle button.active { background: var(--accent); color: var(--paper); border-color: var(--accent); }
.graph-layout-toggle button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.graph-status { margin: 0 0 10px !important; padding: 6px 10px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 6px; background: var(--paper); color: var(--sub); font-size: 0.8rem !important; }
.visual-card svg { width: 100%; display: block; }
.visual-card line { stroke: var(--line); stroke-width: 1; }
.visual-card text { fill: var(--body); font: 600 7px "Spline Sans Mono", monospace; }
.concept-map { display: grid; grid-template-columns: minmax(180px, 1.2fr) minmax(130px, 0.8fr); gap: 10px; align-items: stretch; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 10px; }
.concept-map svg { min-height: 240px; border: 0; background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 58%); }
.orbit { fill: none; stroke: color-mix(in srgb, var(--line) 78%, transparent); stroke-width: 1; stroke-dasharray: 3 5; }
.orbit.inner { stroke-dasharray: 1 5; opacity: 0.8; }
.graph-link { fill: none; stroke: var(--line); stroke-width: 1.4; opacity: 0.72; }
.graph-link.human { stroke: var(--human); }
.graph-link.assist { stroke: var(--assist); }
.graph-link.augment { stroke: var(--augment); }
.node { fill: var(--accent); opacity: 0.9; }
.node.human { fill: var(--human); }
.node.assist { fill: var(--assist); }
.node.augment { fill: var(--augment); }
.centre-node { fill: var(--ink); }
.hub-label { fill: var(--paper) !important; font-size: 5px !important; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.78; }
.hub-title { fill: var(--paper) !important; font-size: 6px !important; font-weight: 800 !important; }
.node-number { fill: var(--paper) !important; font-size: 7px !important; font-weight: 900 !important; }
.concept-list { display: grid; align-content: center; gap: 6px; min-width: 0; }
.concept-item { display: grid; grid-template-columns: 24px minmax(0, 1fr); column-gap: 8px; align-items: center; border: 1px solid var(--line); border-radius: 7px; padding: 7px; background: var(--paper); }
.concept-item span { grid-row: span 2; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--line); color: var(--ink); font: 800 0.68rem "Spline Sans Mono", monospace; }
.concept-item strong { color: var(--ink); font-size: 0.78rem; line-height: 1.15; overflow-wrap: anywhere; }
.concept-item em { color: var(--sub); font: 700 0.58rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.08em; font-style: normal; }
.concept-item.human { border-color: color-mix(in srgb, var(--human) 38%, var(--line)); }
.concept-item.assist { border-color: color-mix(in srgb, var(--assist) 38%, var(--line)); }
.concept-item.augment { border-color: color-mix(in srgb, var(--augment) 45%, var(--line)); }
.concept-item.human span { background: var(--human); color: var(--paper); }
.concept-item.assist span { background: var(--assist); color: var(--paper); }
.concept-item.augment span { background: var(--augment); color: var(--ink); }
.visual-card p { margin: 10px 0 0; color: var(--sub); font-size: 0.82rem; line-height: 1.5; }
.org-map-stage { display: grid; grid-template-columns: 1fr; gap: 9px; border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--surface); }
.org-hub { border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--line)); border-radius: 8px; padding: 12px; background: color-mix(in srgb, var(--accent) 7%, var(--paper)); }
.org-hub span, .org-hub em, .org-column > span { display: block; color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.1em; font-style: normal; }
.org-hub strong { display: block; margin: 4px 0; color: var(--ink); font: 600 1.25rem "Newsreader", Georgia, serif; }
.org-column { display: grid; gap: 6px; }
.org-column article { border: 1px solid var(--line); border-radius: 7px; padding: 8px; background: var(--paper); }
.org-column.families article { border-left: 4px solid var(--human); }
.org-column.capabilities article { border-left: 4px solid var(--assist); }
.org-column.bpr article { border-left: 4px solid var(--augment); }
.org-column strong, .flow-step strong { display: block; color: var(--ink); }
.org-column em, .flow-step span { color: var(--sub); font-size: 0.75rem; font-style: normal; }
.family-row small, .ssoc-row span, .ssoc-row p { display: block; margin-top: 4px; color: var(--sub); font-size: 0.72rem; line-height: 1.35; }
.ssoc-row { border: 1px solid var(--line); border-left: 4px solid var(--human); border-radius: 7px; padding: 8px; background: var(--surface); }
.ssoc-row strong { color: var(--ink); font-size: 0.82rem; line-height: 1.25; }
.flow { display: grid; gap: 8px; }
.flow-step { display: grid; grid-template-columns: 34px 1fr; gap: 8px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: var(--surface); }
.flow-step span { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--ink); color: var(--paper); font: 700 0.72rem "Spline Sans Mono", monospace; }
.stream { display: grid; gap: 8px; }
.stream > div { border: 1px solid var(--line); border-left: 4px solid var(--assist); border-radius: 8px; padding: 10px; background: var(--surface); }
.stream > div.wait { border-left-color: var(--augment); }
.stream header { display: flex; justify-content: space-between; gap: 8px; }
.stream header strong { color: var(--ink); }
.stream header span { color: var(--label); font: 700 0.64rem "Spline Sans Mono", monospace; text-transform: uppercase; }

.aioe-card { padding: 12px; display: grid; gap: 10px; box-shadow: none; }
.aioe-card header { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.aioe-card h3 { margin: 0; color: var(--ink); font-size: 0.94rem; }
.aioe-card p { margin: 0; color: var(--body); font-size: 0.84rem; line-height: 1.5; }
.aioe-card small { color: var(--sub); font-size: 0.72rem; line-height: 1.4; }
.ssoc-lookup { display: grid; gap: 3px; border: 1px solid var(--line); border-radius: 7px; padding: 8px; background: var(--surface); }
.ssoc-lookup span, .ssoc-lookup em { color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.1em; }
.ssoc-lookup strong { color: var(--ink); font-size: 0.82rem; line-height: 1.35; }
.ssoc-lookup em { font-style: normal; color: var(--sub); }
.aioe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.aioe-grid span { border: 1px solid var(--line); border-radius: 7px; padding: 7px; color: var(--sub); font-size: 0.72rem; }
.aioe-grid b { display: block; color: var(--ink); margin-top: 2px; }
.trace-ladder { display: grid; gap: 6px; }
.ladder-step { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; align-items: start; border: 1px solid var(--line); border-radius: 7px; padding: 8px; background: var(--surface); }
.ladder-step > span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--line); color: var(--ink); font: 800 0.66rem "Spline Sans Mono", monospace; }
.ladder-step strong { display: block; color: var(--ink); font-size: 0.76rem; }
.ladder-step p { margin: 2px 0 0; color: var(--sub); font-size: 0.72rem; line-height: 1.35; }
.ladder-step.active { border-color: color-mix(in srgb, var(--human) 32%, var(--line)); background: color-mix(in srgb, var(--human) 7%, var(--surface)); }
.ladder-step.active > span { background: var(--human); color: var(--paper); }
.ladder-step.withheld { opacity: 0.72; }

.review-notes { padding: 0 12px 12px; display: grid; gap: 10px; box-shadow: none; }
.note { border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--surface); }
.note.accepted { border-color: var(--assist); }
.note.rejected { border-color: var(--auto); opacity: 0.78; }
.note header strong { color: var(--ink); font-size: 0.85rem; }
.note header span { color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; }
.note p { margin: 8px 0; font-size: 0.82rem; line-height: 1.5; }
.note blockquote { margin: 0; border-left: 3px solid var(--accent); padding: 8px 10px; background: var(--paper); color: var(--ink); font-size: 0.8rem; line-height: 1.45; }
.note-trace { display: grid; gap: 5px; margin-top: 8px; color: var(--sub); font-size: 0.68rem; line-height: 1.35; }
.note-trace .chip { justify-self: start; }
.note-actions { display: flex; gap: 6px; margin-top: 9px; }
.note-actions button { min-height: 44px; padding: 0 9px; font-size: 0.72rem; }

.chip, .status-pill, .band { display: inline-flex; align-items: center; min-height: 22px; border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; font: 700 0.62rem "Spline Sans Mono", monospace; color: var(--sub); background: var(--surface); white-space: nowrap; }
.chip.posting { color: #0f766e; border-color: #99e6d8; background: #f0fdfa; }
.chip.computed, .status-pill.wired, .status-pill.tested, .status-pill.computed, .status-pill.db { color: var(--human); border-color: color-mix(in srgb, var(--human) 45%, var(--line)); background: color-mix(in srgb, var(--human) 10%, transparent); }
.chip.derived, .status-pill.partial, .status-pill.designed, .status-pill.fallback { color: var(--assist); border-color: color-mix(in srgb, var(--assist) 45%, var(--line)); background: color-mix(in srgb, var(--assist) 10%, transparent); }
.chip.unverified, .status-pill.withheld, .status-pill.locked, .status-pill.error { color: var(--augment); border-color: color-mix(in srgb, var(--augment) 45%, var(--line)); background: color-mix(in srgb, var(--augment) 10%, transparent); }
.chip.ai { color: var(--augment); border-color: color-mix(in srgb, var(--augment) 55%, var(--line)); background: color-mix(in srgb, var(--augment) 12%, transparent); }
.status-pill.loading, .status-pill.sample, .status-pill.idle, .status-pill.not-started { color: var(--sub); }
.band.human { color: var(--human); border-color: var(--human); }
.band.assist { color: var(--assist); border-color: var(--assist); }
.band.augment { color: var(--augment); border-color: var(--augment); }

.trace-list { display: grid; gap: 10px; }
.trace-card, .ledger-card, .advice-block { padding: 12px; }
.trace-card { border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.trace-card header { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.trace-card header strong { color: var(--ink); }
.trace-card p { margin: 8px 0; display: grid; gap: 3px; }
.trace-card b { color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.12em; }
.trace-card small { color: var(--sub); line-height: 1.4; }

.trace-row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line); padding: 8px 0; }
.trace-row span { color: var(--sub); }
.trace-row strong { color: var(--ink); text-align: right; }
.ledger-card { box-shadow: none; display: grid; gap: 4px; }
.ledger-card p { margin: 0; color: var(--ink); font-weight: 700; }
.ledger-card small { display: block; color: var(--sub); font-size: 0.72rem; line-height: 1.35; }
.advice-block { box-shadow: none; }
.advice-block h3 { margin: 0 0 8px; color: var(--ink); font-size: 0.92rem; }
.advice-block p, .advice-block li { color: var(--body); font-size: 0.84rem; line-height: 1.5; }
.taxonomy-summary, .crosswalk-list { display: grid; gap: 8px; }
.taxonomy-summary > div { border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--surface); }
.taxonomy-summary span, .taxonomy-summary em, .crosswalk-row span, .crosswalk-row em { display: block; color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.1em; font-style: normal; }
.taxonomy-summary strong { display: block; margin: 4px 0; color: var(--ink); font-size: 0.86rem; line-height: 1.35; }
.taxonomy-summary em { color: var(--sub); }
.crosswalk-list { border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--surface); }
.crosswalk-list > header { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.crosswalk-list > header strong { color: var(--ink); }
.crosswalk-list > p { margin: 0; color: var(--sub); font-size: 0.78rem; line-height: 1.45; }
.crosswalk-row { border: 1px solid var(--line); border-radius: 7px; padding: 9px; background: var(--paper); }
.crosswalk-row strong { display: block; margin: 4px 0; color: var(--ink); font-size: 0.82rem; }
.crosswalk-row p { margin: 0; color: var(--body); font-size: 0.78rem; line-height: 1.4; }
.crosswalk-row em { margin-top: 5px; color: var(--auto); }
.org-read-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.org-read-summary > div, .org-read-block { border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--surface); }
.org-read-summary span, .org-read-summary em { display: block; color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.1em; font-style: normal; }
.org-read-summary strong { display: block; margin: 4px 0; color: var(--ink); font-size: 1.05rem; }
.org-read-block { display: grid; gap: 8px; box-shadow: none; }
.org-read-block header { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.org-read-block h3 { margin: 0; color: var(--ink); font-size: 0.92rem; }
.family-row, .capability-row, .bpr-row { border: 1px solid var(--line); border-radius: 7px; padding: 9px; background: var(--paper); }
.family-row strong, .capability-row strong, .bpr-row strong { display: block; color: var(--ink); font-size: 0.82rem; }
.family-row span, .capability-row span, .bpr-row span { color: var(--label); font: 700 0.62rem "Spline Sans Mono", monospace; text-transform: uppercase; letter-spacing: 0.08em; }
.family-row p, .capability-row p, .bpr-row p { margin: 5px 0 0; color: var(--body); font-size: 0.78rem; line-height: 1.4; }
.bpr-row small { display: block; margin-top: 6px; color: var(--sub); font-size: 0.72rem; line-height: 1.35; }
.bpr-row.high { border-left: 4px solid var(--auto); }
.bpr-row.medium { border-left: 4px solid var(--augment); }
.quiet { color: var(--sub) !important; font-size: 0.76rem !important; }
.mini-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.mini-pills span { display: inline-flex; gap: 5px; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px; color: var(--body); background: var(--surface); font-size: 0.72rem; }
.mini-pills b { color: var(--accent); }
.letter { white-space: pre-wrap; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); padding: 12px; font: 0.82rem/1.55 "Spline Sans", system-ui, sans-serif; }
.drawer-actions { display: flex; gap: 8px; }
.text-link { color: var(--accent); font-weight: 700; text-decoration: none; }

.footer { min-height: 30px; display: flex; align-items: center; gap: 12px; justify-content: space-between; padding: 5px 14px; border-top: 1px solid var(--line); background: var(--paper); color: var(--sub); font: 0.62rem "Spline Sans Mono", monospace; }

@media (max-width: 1180px) {
  .workspace { grid-template-columns: 52px minmax(0, 1fr); grid-template-rows: auto auto; overflow: auto; }
  .drawer { grid-column: 2; }
  .centre { grid-column: 2; grid-template-columns: minmax(0, 1fr); }
  .right-stack { grid-column: 2; }
  .job-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .ribbon { grid-template-columns: repeat(4, minmax(220px, max-content)); }
  .concept-map { grid-template-columns: minmax(220px, 1fr) minmax(180px, 0.8fr); }
}

@media (max-width: 720px) {
  .v2-landing, .v2-step2 { width: min(100vw - 20px, 1248px); padding: 24px 0 42px; }
  .v2-search-row, .v2-mode-grid { grid-template-columns: 1fr; }
  .v2-field-label { white-space: normal; }
  .topbar, .search-band { align-items: stretch; flex-direction: column; }
  .top-meta { justify-content: flex-start; flex-wrap: wrap; white-space: normal; }
  .search-box { grid-template-columns: 1fr; }
  .workspace { grid-template-columns: 46px minmax(0, 1fr); padding: 8px; gap: 8px; }
  .rail { padding-left: 2px; gap: 6px; }
  .folder-tab { min-height: 58px; padding: 0 4px; writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: 0.02em; }
  .rail .rail-ref { writing-mode: initial; min-height: 44px; }
  .manuscript { padding: 16px; }
  .paper-head { display: block; }
  .paper-head h1 { font-size: 2.15rem; }
  .concept-map { grid-template-columns: 1fr; }
  .concept-map svg { min-height: 210px; }
  .concept-list { grid-template-columns: 1fr; align-content: start; }
  .concept-item { grid-template-columns: 22px minmax(0, 1fr); padding: 6px; }
  .org-read-summary { grid-template-columns: 1fr; }
  .footer { flex-wrap: wrap; justify-content: flex-start; }
}

@media print {
  .topbar, .ribbon, .search-band, .rail, .drawer, .right-stack, .job-list, .footer { display: none !important; }
  .workspace, .centre { display: block; padding: 0; overflow: visible; }
  .manuscript { box-shadow: none; border: none; }
}
`;
