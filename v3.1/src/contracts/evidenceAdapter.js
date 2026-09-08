// Evidence adapter (BLP-003): the ONE place where a Step 2 posting and the engine's duty
// extraction become canonical EvidenceSource / EvidenceSpan records for Step 3, the Work
// Universe, the Review Studio, candidate proof, generated outputs and return navigation.
//
// Rules this module keeps (Supervisor entry conditions for BLP-003, 08-09 '26):
//   1. It never mints an identifier of its own. Every id comes from evidenceContracts.js:
//      sources via makeSourceId, verbatim spans via createVerbatimSpan (offsets against the
//      canonical text), distilled duties via createDistilledSpan (content hash plus extraction
//      version), and withheld sets via createWithheldSpanSet. Legacy positional ids (s0..s13,
//      q0..q7) survive ONLY as the explicit fallback for a result that has no single source
//      posting, and every row carrying one says so.
//   2. Completeness is never inferred. The api routes cap posting bodies (DESC_CAP 4000,
//      RESP_CAP 2500) but do not expose the original length, so completeness is recorded as
//      UNKNOWN (withheld) - a body of exactly the cap length is NOT called TRUNCATED. This is
//      carried as a named residual risk until the route change lands.
//   3. Every distilled duty points at verbatim parents. When the normalised duty text occurs
//      inside one canonical line, the parent is that line and the derivation is DETERMINISTIC
//      (VERIFIED). When it occurs only across the whole body, the parent is the body span
//      (still VERIFIED). When it does not occur at all - the engine paraphrased - the parent is
//      the body span, the origin is AI_ASSISTED and the state is UNVERIFIED: shown, not trusted,
//      never cited at a gate. No best-guess line is ever declared as parentage.
//   4. Everything is validated with knownSpans (validateEvidenceBundle) before it is handed on.
//      A bundle that fails its own validation is withheld, not shipped half-right.
//   5. Caps are recorded (applyCap), never silent.
//
// Pure module: no React, no DOM, no network. Importable by the browser bundle and by node
// tests alike.

import {
  CONTRACT_VERSION,
  ORIGIN,
  SOURCE_SYSTEM,
  WITHHOLD,
  applyCap,
  createDistilledSpan,
  createEvidenceSource,
  createVerbatimSpan,
  createWithheldSpanSet,
  makeSourceId,
  normaliseDistilledText,
  parseCsgUuid,
  sha256Hex,
  validateEvidenceBundle,
  validateEvidenceSpan,
  isDistilledSpanTrusted,
} from "./evidenceContracts.js";
import { jobAdText, jobAdSections } from "../review/job-ad-sections.js";

export const ADAPTER_VERSION = "1.0.0";

// Extraction versions are declared here so a prompt or pipeline change bumps the number and
// every duty id changes with it (name-N per the contract; the verbatim parents do not move).
export const DUTY_EXTRACTION_VERSION = Object.freeze({
  jobAnatomy: "ja-1",       // App.jsx JOB_ANATOMY_VERSION "ja1"
  responsibilities: "rd-1", // App.jsx getResponsibilities / buildResponsibilitiesData
});

export const DUTY_ROW_CAP = 14;       // Review Studio manuscript cap (buildDissection .slice(0, 14))
export const REQUIREMENT_ROW_CAP = 8; // Review Studio requirement/benefit line cap
export const REQUIREMENT_MIN_LENGTH = 12;

// Legacy positional identity. Present only so consumers can recognise and withhold it.
export const LEGACY_ID_PATTERN = /^[sq]\d+$/;
export function isLegacyEvidenceId(id) { return LEGACY_ID_PATTERN.test(String(id ?? "")); }

export const BUNDLE_STATE = Object.freeze({
  OK: "OK",
  NO_SOURCE_ROWS: WITHHOLD.NO_SOURCE_ROWS,
  INCOMPLETE_IDENTITY: WITHHOLD.INCOMPLETE_IDENTITY,
  CONFLICTING_EVIDENCE: WITHHOLD.CONFLICTING_EVIDENCE,
});

const RESIDUAL_COMPLETENESS = Object.freeze({
  code: "COMPLETENESS_UNKNOWN",
  detail: "api/mcf.js and api/careers.js cap bodies (DESC_CAP 4000, RESP_CAP 2500) without exposing originalLength; completeness recorded UNKNOWN, never inferred from length.",
});

function text(v) { return typeof v === "string" ? v : (v && typeof v.text === "string" ? v.text : ""); }
function str(v) { return String(v ?? "").trim(); }

/**
 * Resolve the posting's source identity from what Step 2 already carries. MyCareersFuture
 * postings use their native uuid; careers.gov.sg postings arrive with the synthetic
 * `csg:{platform}:{jobId}:{postingNo}` uuid, which is parsed and re-validated by the
 * contract so an incomplete identity is withheld rather than minted degenerate.
 */
export function resolvePostingIdentity(posting) {
  const uuid = str(posting && posting.uuid);
  const sourceLabel = str(posting && (posting.source || posting.postingSource)).toLowerCase();
  const isCsg = uuid.startsWith("csg:") || /careers\.gov\.sg|careers@gov|\bcsg\b/.test(sourceLabel);
  if (isCsg) {
    const parsed = parseCsgUuid(uuid) || { platform: "", jobId: "", postingNo: "" };
    const made = makeSourceId({ sourceSystem: SOURCE_SYSTEM.CSG, ...parsed });
    return { sourceSystem: SOURCE_SYSTEM.CSG, nativeId: uuid || null, id: made.id, withheld: made.withheld, parsed };
  }
  const made = makeSourceId({ sourceSystem: SOURCE_SYSTEM.MCF, nativeId: uuid });
  return { sourceSystem: SOURCE_SYSTEM.MCF, nativeId: uuid || null, id: made.id, withheld: made.withheld, parsed: null };
}

/**
 * The duty list Step 3 displays, in the order the engine produced it: Job Anatomy duties when
 * present (the same fallback order Review Studio and the Work Universe used before this
 * adapter; now decided once, here). Returns the extraction version that names the pipeline.
 */
export function selectDutyRows(result) {
  const ja = result && result.jobAnatomy;
  const rd = result && result.responsibilitiesData;
  const anatomy = ja && Array.isArray(ja.duties) ? ja.duties : [];
  const resp = rd && Array.isArray(rd.responsibilities) ? rd.responsibilities : [];
  if (anatomy.length) return { duties: anatomy, extractionVersion: DUTY_EXTRACTION_VERSION.jobAnatomy, basis: "jobAnatomy" };
  if (resp.length) return { duties: resp, extractionVersion: DUTY_EXTRACTION_VERSION.responsibilities, basis: "responsibilities" };
  return { duties: [], extractionVersion: DUTY_EXTRACTION_VERSION.responsibilities, basis: null };
}

/** Canonical line spans: one verbatim span per non-blank line of the source's canonical text. */
function buildLineSpans(source) {
  const spans = [];
  const body = source.text;
  let cursor = 0;
  while (cursor <= body.length) {
    const nl = body.indexOf("\n", cursor);
    const lineEnd = nl === -1 ? body.length : nl;
    let start = cursor, end = lineEnd;
    while (start < end && /\s/.test(body[start])) start += 1;
    while (end > start && /\s/.test(body[end - 1])) end -= 1;
    if (end > start) spans.push(createVerbatimSpan(source, start, end, { role: "line" }));
    if (nl === -1) break;
    cursor = nl + 1;
  }
  return spans;
}

/**
 * Locate a piece of text verbatim inside the canonical source text. Returns a verbatim span
 * (offset-addressed, so the id is the contract's, not ours) or null when the text is not a
 * substring of the canonical text. Exact match first, then whitespace-tolerant.
 */
export function locateVerbatim(source, needle, { role } = {}) {
  const n = str(needle);
  if (!source || !n) return null;
  const direct = source.text.indexOf(n);
  if (direct >= 0) return createVerbatimSpan(source, direct, direct + n.length, { role });
  // Whitespace-tolerant: the section model collapses runs of spaces; the canonical text keeps them.
  const pattern = n.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  if (!pattern) return null;
  const match = new RegExp(pattern).exec(source.text);
  if (!match) return null;
  return createVerbatimSpan(source, match.index, match.index + match[0].length, { role });
}

/** Find the single canonical line whose normalised text contains the normalised needle. */
function findContainingLine(lineSpans, normalisedNeedle) {
  if (!normalisedNeedle) return null;
  for (const line of lineSpans) {
    if (normaliseDistilledText(line.text).includes(normalisedNeedle)) return line;
  }
  return null;
}

// A withheld row is qualified by a hash of its text, never by its position (contract rule).
function withheldRow(index, textValue, reason, sourceId, extra = {}) {
  const normalised = normaliseDistilledText(textValue);
  const set = createWithheldSpanSet(sourceId ?? null, reason, { qualifier: sha256Hex(normalised || `empty:${index}`).slice(0, 16), text: String(textValue ?? ""), textHash: sha256Hex(normalised) });
  return { index, id: set.id, text: String(textValue ?? ""), kind: "withheld", span: set, derivationState: null, trusted: false, parentSpanIds: [], identity: reason, ...extra };
}

/**
 * Build the canonical evidence bundle for ONE posting plus the duties the engine distilled
 * from it. This is the only constructor consumers should call for a posting.
 */
export function buildPostingEvidence({ posting, duties, extractionVersion, retrievedAt, label } = {}) {
  const rawText = str(posting && posting.text);
  const dutyList = Array.isArray(duties) ? duties : [];
  const withheld = [];
  const residualRisks = [];

  if (!posting || !rawText) {
    return legacyBundle({ state: BUNDLE_STATE.NO_SOURCE_ROWS, posting, duties: dutyList, extractionVersion, reason: "no posting text reached Step 3" });
  }
  const identity = resolvePostingIdentity(posting);
  if (!identity.id) {
    withheld.push({ field: "id", reason: WITHHOLD.INCOMPLETE_IDENTITY, detail: identity.nativeId });
    return legacyBundle({ state: BUNDLE_STATE.INCOMPLETE_IDENTITY, posting, duties: dutyList, extractionVersion, identity, reason: "source identity incomplete; no degenerate id minted", withheld });
  }

  // Completeness: UNKNOWN by design (rule 2). Neither `complete` nor `truncation` is passed.
  const source = createEvidenceSource({
    id: identity.id,
    kind: "posting",
    sourceSystem: identity.sourceSystem,
    nativeId: identity.nativeId,
    rawText,
    retrievedAt: retrievedAt ?? posting.retrievedAt ?? undefined,
    label: label ?? str(posting.title) ?? undefined,
  });
  source.withheld.forEach((w) => withheld.push(w));
  residualRisks.push(RESIDUAL_COMPLETENESS);

  const bodySpan = source.text.length ? createVerbatimSpan(source, 0, source.text.length, { role: "body" }) : null;
  const lineSpans = buildLineSpans(source);
  const spans = [];
  if (bodySpan) spans.push(bodySpan);
  // A line identical to the whole body (single-line posting) shares the body span's id; keep one.
  lineSpans.forEach((s) => { if (!bodySpan || s.id !== bodySpan.id) spans.push(s); });
  const lineSet = bodySpan && lineSpans.length === 1 && lineSpans[0].id === bodySpan.id ? [bodySpan] : lineSpans;

  if (!lineSet.length) {
    const set = createWithheldSpanSet(source.id, WITHHOLD.NO_SOURCE_ROWS);
    return finalise({ state: BUNDLE_STATE.NO_SOURCE_ROWS, identity, source, bodySpan: null, lineSpans: [], spans: [set], dutyRows: [], dutyCap: null, requirementRows: [], requirementCap: null, withheld: withheld.concat([{ field: "spans", reason: WITHHOLD.NO_SOURCE_ROWS }]), residualRisks, extractionVersion, dutyBasis: null });
  }

  // Distilled duties (rule 3). Duplicate texts collapse onto one content-addressed span.
  const seen = new Map();
  const version = extractionVersion || DUTY_EXTRACTION_VERSION.responsibilities;
  const allDutyRows = dutyList.map((d, index) => {
    const t = str(text(d));
    if (!t) return withheldRow(index, "", WITHHOLD.NO_PARENT_SPAN, source.id, { raw: d });
    const normalised = normaliseDistilledText(t);
    const line = findContainingLine(lineSet, normalised);
    const inBody = !line && normaliseDistilledText(source.text).includes(normalised);
    const parent = line || bodySpan;
    const origin = line || inBody ? ORIGIN.DETERMINISTIC : ORIGIN.AI_ASSISTED;
    const span = createDistilledSpan({ text: t, extractionVersion: version, parentSpanIds: [parent.id], sourceId: source.id, origin });
    if (span.kind === "withheld") return { index, id: span.id, text: t, kind: "withheld", span, derivationState: null, trusted: false, parentSpanIds: [], identity: span.reason, raw: d };
    const first = seen.get(span.id);
    if (first === undefined) { seen.set(span.id, index); spans.push(span); }
    return { index, id: span.id, text: t, kind: "distilled", span, derivationState: span.derivationState, trusted: false, parentSpanIds: span.parentSpanIds, identity: "OK", duplicateOf: first === undefined ? null : first, raw: d };
  });
  const cap = applyCap(allDutyRows, DUTY_ROW_CAP, { idOf: (r) => r.id });
  const dutyRows = cap.kept;

  // Requirement / benefit lines: the shared section model picks them; each is then located
  // verbatim in the canonical text so its id is an offset span, or withheld when the section
  // model's derivative text no longer matches the canonical text.
  const adText = jobAdText({ description: rawText });
  const reqCandidates = [];
  jobAdSections(adText).filter((sec) => sec.canon === "Requirements" || sec.canon === "Benefits").forEach((sec) => {
    sec.lines.forEach((ln) => {
      if (str(ln).length < REQUIREMENT_MIN_LENGTH) return;
      reqCandidates.push({ text: str(ln), layer: sec.canon.toLowerCase() });
    });
  });
  const allReqRows = reqCandidates.map((c, index) => {
    const located = locateVerbatim(source, c.text, { role: "requirement" });
    if (!located) return withheldRow(index, c.text, WITHHOLD.NO_PARENT_SPAN, source.id, { layer: c.layer, kind: "withheld" });
    if (!spans.some((s) => s.id === located.id)) spans.push(located);
    return { index, id: located.id, text: located.text, kind: "verbatim", span: located, derivationState: "VERIFIED", trusted: true, parentSpanIds: [], identity: "OK", layer: c.layer };
  });
  const reqCap = applyCap(allReqRows, REQUIREMENT_ROW_CAP, { idOf: (r) => r.id });

  if (cap.withheld) withheld.push({ field: "dutyRows", ...cap.withheld });
  if (reqCap.withheld) withheld.push({ field: "requirementRows", ...reqCap.withheld });

  return finalise({ state: BUNDLE_STATE.OK, identity, source, bodySpan, lineSpans: lineSet, spans, dutyRows, dutyCap: cap.withheld, requirementRows: reqCap.kept, requirementCap: reqCap.withheld, withheld, residualRisks, extractionVersion: version, dutyBasis: null });
}

function finalise(bundle) {
  const validation = validateEvidenceBundle({ source: bundle.source, spans: bundle.spans });
  const knownSpans = bundle.spans;
  const byId = {};
  bundle.spans.forEach((s) => { byId[s.id] = s; });
  const dutyRows = bundle.dutyRows.map((r) => (r.kind === "distilled"
    ? { ...r, trusted: isDistilledSpanTrusted(r.span, { knownSpans }) }
    : r));
  const state = validation.ok ? bundle.state : BUNDLE_STATE.CONFLICTING_EVIDENCE;
  return {
    adapterVersion: ADAPTER_VERSION,
    contractVersion: CONTRACT_VERSION,
    state,
    legacy: false,
    identity: bundle.identity,
    source: bundle.source,
    bodySpan: bundle.bodySpan,
    lineSpans: bundle.lineSpans,
    spans: bundle.spans,
    knownSpans,
    byId,
    extractionVersion: bundle.extractionVersion,
    dutyBasis: bundle.dutyBasis,
    dutyRows,
    dutyCap: bundle.dutyCap,
    requirementRows: bundle.requirementRows,
    requirementCap: bundle.requirementCap,
    withheld: bundle.withheld,
    residualRisks: bundle.residualRisks,
    validation,
  };
}

/**
 * The explicit fallback: no single source posting (corpus or taxonomy analysis) or an
 * identity that cannot be completed. Rows keep the positional ids the UI used before, and
 * every row and the bundle itself carry the withheld reason, so nothing downstream can
 * mistake a positional id for a canonical one.
 */
function legacyBundle({ state, posting, duties, extractionVersion, identity = null, reason, withheld = [] }) {
  const version = extractionVersion || DUTY_EXTRACTION_VERSION.responsibilities;
  const rows = duties.map((d, index) => ({ index, id: `s${index}`, text: str(text(d)), kind: "legacy", span: null, derivationState: null, trusted: false, parentSpanIds: [], identity: state, raw: d })).filter((r) => r.text);
  const cap = applyCap(rows, DUTY_ROW_CAP, { idOf: (r) => r.id });
  const sourceId = identity && identity.id ? identity.id : null;
  const set = createWithheldSpanSet(sourceId, state === BUNDLE_STATE.INCOMPLETE_IDENTITY ? WITHHOLD.INCOMPLETE_IDENTITY : WITHHOLD.NO_SOURCE_ROWS, { text: reason });
  return {
    adapterVersion: ADAPTER_VERSION,
    contractVersion: CONTRACT_VERSION,
    state,
    legacy: true,
    identity,
    source: null,
    bodySpan: null,
    lineSpans: [],
    spans: [set],
    knownSpans: [set],
    byId: { [set.id]: set },
    extractionVersion: version,
    dutyBasis: null,
    dutyRows: cap.kept,
    dutyCap: cap.withheld,
    requirementRows: [],
    requirementCap: null,
    withheld: withheld.concat([{ field: "source", reason: set.reason, detail: reason }], cap.withheld ? [{ field: "dutyRows", ...cap.withheld }] : []),
    residualRisks: [],
    validation: { ok: true, errors: [] },
  };
}

/**
 * Convenience for App.jsx: one call per (result, posting) pair. Duties are selected by the
 * pipeline order the UI already used, the bundle is built, and the basis is recorded.
 */
export function buildResultEvidence(result, posting, { retrievedAt } = {}) {
  const picked = selectDutyRows(result);
  const bundle = buildPostingEvidence({ posting, duties: picked.duties, extractionVersion: picked.extractionVersion, retrievedAt });
  return { ...bundle, dutyBasis: picked.basis };
}

/** Requirement rows for a bundle that is legacy: derived from the fallback text with positional ids. */
export function legacyRequirementRows(adText) {
  const rows = [];
  let rq = 0;
  jobAdSections(adText).filter((sec) => sec.canon === "Requirements" || sec.canon === "Benefits").forEach((sec) => {
    sec.lines.forEach((ln) => {
      if (rq >= REQUIREMENT_ROW_CAP || str(ln).length < REQUIREMENT_MIN_LENGTH) return;
      rows.push({ index: rq, id: `q${rq}`, text: str(ln), kind: "legacy", span: null, derivationState: null, trusted: false, parentSpanIds: [], identity: WITHHOLD.NO_SOURCE_ROWS, layer: sec.canon.toLowerCase() });
      rq += 1;
    });
  });
  return rows;
}

/** Validate one span against the bundle it claims to belong to (always with knownSpans). */
export function validateAgainstBundle(bundle, span) {
  return validateEvidenceSpan(span, { source: bundle && bundle.source, knownSpans: bundle && bundle.knownSpans });
}

// ---------------------------------------------------------------------------------------------
// Review ledger keys. A decision is keyed on the comment id AND the anchor it was made against,
// so a decision made about one duty can never silently apply to another after re-extraction.
// Entries with no anchor part are legacy (pre-BLP-003) and are surfaced as withheld, never
// re-anchored by guesswork (Supervisor ruling 3).
// ---------------------------------------------------------------------------------------------
export const DECISION_KEY_SEPARATOR = "@";
export function decisionKey(commentId, anchorId) { return `${commentId}${DECISION_KEY_SEPARATOR}${anchorId}`; }
export function parseDecisionKey(key) {
  const s = String(key ?? "");
  const at = s.indexOf(DECISION_KEY_SEPARATOR);
  if (at <= 0) return { commentId: s, anchorId: null };
  return { commentId: s.slice(0, at), anchorId: s.slice(at + 1) };
}

/**
 * Split a persisted ledger entry ({ key: status }) against the current comments
 * ([{ id, anchor }]). `current` is keyed by comment id for the UI; `stale` are anchored
 * decisions whose anchor is not the comment's current anchor; `legacy` have no anchor at all.
 * Both stale and legacy are preserved verbatim so they can be written back unchanged.
 */
export function partitionDecisionLedger(entry, comments) {
  const current = {}, stale = {}, legacy = {};
  const anchorOf = new Map((Array.isArray(comments) ? comments : []).map((c) => [c.id, c.anchor]));
  Object.entries(entry && typeof entry === "object" ? entry : {}).forEach(([key, status]) => {
    const { commentId, anchorId } = parseDecisionKey(key);
    if (anchorId === null) { legacy[key] = status; return; }
    if (anchorOf.has(commentId) && anchorOf.get(commentId) === anchorId) current[commentId] = status;
    else stale[key] = status;
  });
  return { current, stale, legacy, withheldCount: Object.keys(stale).length + Object.keys(legacy).length };
}

/** Merge the UI's current decisions back into the persisted shape, preserving stale and legacy rows. */
export function mergeDecisionLedger(current, comments, preserved) {
  const anchorOf = new Map((Array.isArray(comments) ? comments : []).map((c) => [c.id, c.anchor]));
  const out = { ...(preserved && preserved.legacy), ...(preserved && preserved.stale) };
  Object.entries(current || {}).forEach(([commentId, status]) => {
    if (!anchorOf.has(commentId)) return;
    out[decisionKey(commentId, anchorOf.get(commentId))] = status;
  });
  return out;
}

/**
 * Split persisted links against the ids currently on screen. A link is current only when
 * every element anchor it names resolves to a current id (phrase anchors name their block by
 * the same id). Anything else is preserved and surfaced as withheld with a reason.
 */
export function partitionLinks(links, currentIds) {
  const ids = new Set(Array.isArray(currentIds) ? currentIds : []);
  const anchorOk = (a) => {
    if (!a) return false;
    if (a.t === "phrase") return ids.has(String(a.block ?? "").replace(/^oiaobs-/, ""));
    return a.id != null && ids.has(String(a.id));
  };
  const current = [], withheld = [];
  (Array.isArray(links) ? links : []).forEach((l) => {
    if (l && anchorOk(l.from) && anchorOk(l.to)) current.push(l);
    else withheld.push({ link: l, reason: WITHHOLD.STALE_EVIDENCE, legacyIdentity: !!(l && (isLegacyEvidenceId(l.from && l.from.id) || isLegacyEvidenceId(l.to && l.to.id))), detail: "anchor identity is not on the current evidence set; re-affirm by hand" });
  });
  return { current, withheld };
}
