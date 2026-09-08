// Canonical evidence contracts for the V3.1 blueprint completion programme (BLP-002).
//
// Seven versioned records: EvidenceSource, EvidenceSpan, ProofRecord, ReviewChange,
// OutputBlock, VisualProfile, EvidenceWindow. Every record carries a contractVersion,
// every material value names one of five origins, and every validator is deterministic:
// same input, same result, no clock, no network, no model. Nothing here infers a value.
// Unknown evidence, dates, owners and provenance are withheld with a reason code.
//
// Identity rules settled here (Supervisor conditions on BLP-003, recorded 2026-09-08):
//   1. Offsets are meaningful only against ONE named, normalised, hashed posting text.
//      EvidenceSource.text is that artefact; EvidenceSource.textHash is its SHA-256;
//      EvidenceSource.normalisation names the pinned pipeline version.
//   2. A verbatim span is addressed by source id plus character offsets into that text and
//      carries the source text hash, so a span whose hash does not match its source is a hard
//      validation failure, never a warning.
//   3. A distilled span (an extracted duty) has its own content-addressed id derived from its
//      normalised text and a declared extraction version, and MUST name at least one verbatim
//      parent span. Re-extraction yields new distilled ids but the same parents.
//   4. Synthetic posting ids (careers.gov.sg) require every component; an incomplete identity is
//      withheld with WITHHELD_INCOMPLETE_IDENTITY rather than assigned a degenerate id.
//   5. Rows dropped by a cap are recorded as withheld with the cap value and a reason code.
//   6. A source with no usable rows has an addressable withheld span set:
//      withheld:<sourceId>:WITHHELD_NO_SOURCE_ROWS.
//
// Protected scope: this module is additive. It changes no Step 1, Step 2, graph, review, print,
// v3/ or Railway behaviour. Consumers adopt it under later requirements (BLP-003 onward).

export const CONTRACT_VERSION = "1.0.0";
export const TEXT_NORMALISATION_VERSION = "ptn-1";

export const ORIGIN = Object.freeze({
  SOURCE_VERBATIM: "SOURCE_VERBATIM",
  DETERMINISTIC: "DETERMINISTIC",
  AI_ASSISTED: "AI_ASSISTED",
  USER_AUTHORED: "USER_AUTHORED",
  WITHHELD: "WITHHELD",
});
export const ORIGINS = Object.freeze(Object.values(ORIGIN));

export const WITHHOLD = Object.freeze({
  NO_SOURCE_ROWS: "WITHHELD_NO_SOURCE_ROWS",
  NO_CANDIDATE_PROOF: "WITHHELD_NO_CANDIDATE_PROOF",
  CONFLICTING_EVIDENCE: "WITHHELD_CONFLICTING_EVIDENCE",
  STALE_EVIDENCE: "WITHHELD_STALE_EVIDENCE",
  UNAVAILABLE_FIELD: "WITHHELD_UNAVAILABLE_FIELD",
  INCOMPLETE_IDENTITY: "WITHHELD_INCOMPLETE_IDENTITY",
  CAP_EXCEEDED: "WITHHELD_CAP_EXCEEDED",
  UNSUPPORTED_VISUAL: "WITHHELD_UNSUPPORTED_VISUAL",
  NO_PARENT_SPAN: "WITHHELD_NO_PARENT_SPAN",
});
export const WITHHOLD_REASONS = Object.freeze(Object.values(WITHHOLD));

export const SOURCE_KIND = Object.freeze(["posting", "candidate-document", "taxonomy-record", "organisation-record", "other"]);
export const SOURCE_SYSTEM = Object.freeze({
  MCF: "MyCareersFuture",
  CSG: "careers.gov.sg",
  MANUAL_PASTE: "manual-paste",
  ESCO: "ESCO",
  SSOC: "SSOC",
  ACRA: "ACRA",
  OTHER: "other",
});
export const SOURCE_SYSTEMS = Object.freeze(Object.values(SOURCE_SYSTEM));

export const SPAN_KIND = Object.freeze(["verbatim", "distilled", "withheld"]);
export const PROOF_STATE = Object.freeze(["DEMONSTRATED", "CERTIFIED", "CLAIMED_ONLY", "WITHHELD", "CONFLICTING", "STALE"]);
export const PROOF_TARGET_KIND = Object.freeze(["duty", "requirement", "skill", "competency", "review-observation"]);
export const PROOF_DESTINATION = Object.freeze(["resume", "coverLetter", "interview", "portfolio", "workSample"]);
export const DESTINATION_STATE = Object.freeze(["UNSET", "ALLOWED", "REVOKED"]);
export const REVIEW_KIND = Object.freeze(["comment", "proposal", "decision", "change"]);
// Provisional vocabulary. BLP-006 reconciles the canonical roster and verbs; a change there is a
// contract version bump, not a silent edit.
export const REVIEW_VERB = Object.freeze([
  "comment", "insert", "delete", "replace", "split", "merge", "relabel", "escalate", "withhold",
  "accept", "reject", "resolve", "reopen", "undo",
]);
export const OUTPUT_STATE = Object.freeze(["PROPOSED", "ACCEPTED", "REJECTED", "STALE", "WITHHELD"]);
export const POLICY_RESULT = Object.freeze(["PASS", "FAIL", "NOT_RUN"]);
export const VISUAL_ID = Object.freeze(["graph", "org", "workflow", "stream"]);
export const EVIDENCE_WINDOW_FIELDS = Object.freeze([
  "publishedAt", "closingAt", "retrievedAt", "analysedAt", "corpusRange", "postingCount", "sourceTimezone",
]);

// ---------------------------------------------------------------------------------------------
// Deterministic SHA-256 (synchronous, dependency-free, identical in Node and the browser).
// FIPS 180-4. Kept here so content-addressed ids are reproducible everywhere without an async
// boundary. Input is UTF-8 encoded before hashing.
// ---------------------------------------------------------------------------------------------
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function utf8Bytes(text) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d < 0xe000) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i += 1; }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function sha256Hex(text) {
  const bytes = utf8Bytes(String(text));
  const bitLength = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("");
}

// ---------------------------------------------------------------------------------------------
// Small deterministic helpers.
// ---------------------------------------------------------------------------------------------
const HEX64 = /^[0-9a-f]{64}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const IANA_ZONE = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/;
const SLUG = /^[a-z0-9][a-z0-9._-]*$/;

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonemptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function isIsoDateTime(value) { return nonemptyString(value) && ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value)); }
function isInteger(value) { return Number.isInteger(value); }

/** Pinned posting-text normalisation (TEXT_NORMALISATION_VERSION). Idempotent. */
export function normalisePostingText(raw) {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Normalisation used for content-addressed distilled ids: case-folded, whitespace-collapsed. */
export function normaliseDistilledText(raw) {
  return String(raw ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value ?? "").normalize("NFC").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Results are plain objects so callers can render every failure. `ok` is true only when there
 * are no errors. Withheld values are not errors; they are recorded on the record itself.
 */
function result(errors) { return { ok: errors.length === 0, errors }; }
export function assertValid(validation, label) {
  if (!validation.ok) throw new Error(`${label || "contract"} invalid:\n${validation.errors.join("\n")}`);
  return true;
}

function checkOrigin(errors, value, path) {
  if (!ORIGINS.includes(value)) errors.push(`${path}: origin must be one of ${ORIGINS.join(", ")}`);
}
function checkContractVersion(errors, record, path) {
  if (record.contractVersion !== CONTRACT_VERSION) errors.push(`${path}.contractVersion must be ${CONTRACT_VERSION}`);
}
function checkWithheldList(errors, list, path) {
  if (!Array.isArray(list)) { errors.push(`${path} must be an array`); return; }
  list.forEach((entry, index) => {
    if (!isObject(entry) || !nonemptyString(entry.field) || !WITHHOLD_REASONS.includes(entry.reason)) {
      errors.push(`${path}[${index}] must be { field, reason } with a known reason code`);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// 1. EvidenceSource
// ---------------------------------------------------------------------------------------------
/**
 * Build a stable source id. Native ids from MyCareersFuture are used as supplied. careers.gov.sg
 * postings only have a synthetic identity, `csg:{platform}:{jobId}:{postingNo}`; every component
 * is required, otherwise the identity is withheld rather than made degenerate.
 */
export function makeSourceId({ sourceSystem, nativeId, platform, jobId, postingNo } = {}) {
  if (sourceSystem === SOURCE_SYSTEM.CSG) {
    const parts = [platform, jobId, postingNo].map((v) => String(v ?? "").trim());
    if (parts.some((p) => !p || p.includes(":"))) {
      return { id: null, withheld: { field: "id", reason: WITHHOLD.INCOMPLETE_IDENTITY } };
    }
    return { id: `src:csg:${parts.join(":")}`, withheld: null };
  }
  const native = String(nativeId ?? "").trim();
  if (!SOURCE_SYSTEMS.includes(sourceSystem) || !native) {
    return { id: null, withheld: { field: "id", reason: WITHHOLD.INCOMPLETE_IDENTITY } };
  }
  return { id: `src:${slugify(sourceSystem)}:${native}`, withheld: null };
}

/** Parse a legacy synthetic careers.gov.sg uuid ("csg:platform:jobId:postingNo"). */
export function parseCsgUuid(uuid) {
  const parts = String(uuid ?? "").split(":");
  if (parts.length !== 4 || parts[0] !== "csg") return null;
  return { platform: parts[1], jobId: parts[2], postingNo: parts[3] };
}

/**
 * Create an EvidenceSource. `text` is the canonical normalised artefact that every verbatim span
 * offset refers to; it is derived from `rawText` by the pinned pipeline and hashed. Missing
 * retrieval time is withheld, never defaulted.
 */
export function createEvidenceSource({ id, kind, sourceSystem, nativeId, rawText, retrievedAt, label } = {}) {
  const withheld = [];
  const text = normalisePostingText(rawText);
  let retrieved = null;
  if (isIsoDateTime(retrievedAt)) retrieved = retrievedAt;
  else withheld.push({ field: "retrievedAt", reason: WITHHOLD.UNAVAILABLE_FIELD });
  return {
    contractVersion: CONTRACT_VERSION,
    id: id ?? null,
    kind,
    sourceSystem,
    nativeId: nonemptyString(nativeId) ? nativeId : null,
    label: nonemptyString(label) ? label : null,
    text,
    textHash: sha256Hex(text),
    normalisation: TEXT_NORMALISATION_VERSION,
    retrievedAt: retrieved,
    origin: ORIGIN.SOURCE_VERBATIM,
    withheld,
  };
}

export function validateEvidenceSource(source) {
  const errors = [];
  if (!isObject(source)) return result(["EvidenceSource must be an object"]);
  checkContractVersion(errors, source, "EvidenceSource");
  if (!(nonemptyString(source.id) && /^src:[a-z0-9._-]+:[^\s]+$/.test(source.id))) errors.push("EvidenceSource.id must be src:<system>:<native id>");
  if (!SOURCE_KIND.includes(source.kind)) errors.push(`EvidenceSource.kind must be one of ${SOURCE_KIND.join(", ")}`);
  if (!SOURCE_SYSTEMS.includes(source.sourceSystem)) errors.push("EvidenceSource.sourceSystem is not a known system");
  if (typeof source.text !== "string") errors.push("EvidenceSource.text must be a string");
  else {
    if (source.text !== normalisePostingText(source.text)) errors.push("EvidenceSource.text is not in canonical normalised form");
    if (source.textHash !== sha256Hex(source.text)) errors.push("EvidenceSource.textHash does not match text");
  }
  if (source.normalisation !== TEXT_NORMALISATION_VERSION) errors.push(`EvidenceSource.normalisation must be ${TEXT_NORMALISATION_VERSION}`);
  if (source.retrievedAt !== null && !isIsoDateTime(source.retrievedAt)) errors.push("EvidenceSource.retrievedAt must be ISO 8601 or null (withheld)");
  if (source.retrievedAt === null && !(source.withheld || []).some((w) => w.field === "retrievedAt")) errors.push("EvidenceSource.retrievedAt null must be recorded as withheld");
  if (source.origin !== ORIGIN.SOURCE_VERBATIM) errors.push("EvidenceSource.origin must be SOURCE_VERBATIM");
  checkWithheldList(errors, source.withheld, "EvidenceSource.withheld");
  return result(errors);
}

// ---------------------------------------------------------------------------------------------
// 2. EvidenceSpan (verbatim, distilled, withheld)
// ---------------------------------------------------------------------------------------------
export function makeVerbatimSpanId(sourceId, start, end) { return `span:${sourceId}:${start}-${end}`; }

/** A verbatim span: an exact character range of the source's canonical text. */
export function createVerbatimSpan(source, start, end, { role } = {}) {
  const text = typeof source?.text === "string" ? source.text.slice(start, end) : "";
  return {
    contractVersion: CONTRACT_VERSION,
    id: makeVerbatimSpanId(source?.id, start, end),
    kind: "verbatim",
    sourceId: source?.id ?? null,
    sourceTextHash: source?.textHash ?? null,
    start,
    end,
    text,
    role: nonemptyString(role) ? role : null,
    origin: ORIGIN.SOURCE_VERBATIM,
  };
}

/** Extraction versions are declared, recorded strings of the form name-N with N monotonic. */
export const EXTRACTION_VERSION_PATTERN = /^[a-z][a-z0-9-]*-(\d+)$/;
export function parseExtractionVersion(value) {
  const match = EXTRACTION_VERSION_PATTERN.exec(String(value ?? ""));
  return match ? { name: String(value).slice(0, -(match[1].length + 1)), number: Number(match[1]) } : null;
}
export function isLaterExtractionVersion(next, previous) {
  const a = parseExtractionVersion(next), b = parseExtractionVersion(previous);
  return !!(a && b && a.name === b.name && a.number > b.number);
}

export function makeDistilledSpanId(text, extractionVersion) {
  return `duty:${sha256Hex(`${normaliseDistilledText(text)}|${extractionVersion}`).slice(0, 24)}`;
}

/**
 * A distilled span (for example an extracted duty). Content-addressed on normalised text plus the
 * extraction version, and it MUST point at one or more verbatim parent spans of the same source.
 * When no parent can be named the span is withheld: it is not a distilled span at all.
 */
export function createDistilledSpan({ text, extractionVersion, parentSpanIds, sourceId, origin } = {}) {
  const parents = Array.isArray(parentSpanIds) ? parentSpanIds.filter(nonemptyString) : [];
  if (!parents.length) {
    return { contractVersion: CONTRACT_VERSION, id: `withheld:${sourceId ?? "unknown"}:${WITHHOLD.NO_PARENT_SPAN}`, kind: "withheld", sourceId: sourceId ?? null, reason: WITHHOLD.NO_PARENT_SPAN, origin: ORIGIN.WITHHELD };
  }
  return {
    contractVersion: CONTRACT_VERSION,
    id: makeDistilledSpanId(text, extractionVersion),
    kind: "distilled",
    sourceId: sourceId ?? null,
    text: String(text ?? ""),
    normalisedText: normaliseDistilledText(text),
    extractionVersion,
    parentSpanIds: parents,
    origin: origin ?? ORIGIN.AI_ASSISTED,
  };
}

/** Addressable withheld form for a source with no usable rows (or another span-level reason). */
export function createWithheldSpanSet(sourceId, reason = WITHHOLD.NO_SOURCE_ROWS, detail = null) {
  return {
    contractVersion: CONTRACT_VERSION,
    id: `withheld:${sourceId ?? "unknown"}:${reason}`,
    kind: "withheld",
    sourceId: sourceId ?? null,
    reason,
    detail: isObject(detail) ? detail : null,
    origin: ORIGIN.WITHHELD,
  };
}

/**
 * Validate a span. For a verbatim span the `source` is required so offsets and the text hash can
 * be checked against the artefact they claim to address. For a distilled span, `knownSpanIds`
 * (when supplied) must contain every parent, and every parent must be verbatim.
 */
export function validateEvidenceSpan(span, { source, knownSpans } = {}) {
  const errors = [];
  if (!isObject(span)) return result(["EvidenceSpan must be an object"]);
  checkContractVersion(errors, span, "EvidenceSpan");
  if (!SPAN_KIND.includes(span.kind)) { errors.push(`EvidenceSpan.kind must be one of ${SPAN_KIND.join(", ")}`); return result(errors); }
  checkOrigin(errors, span.origin, "EvidenceSpan");
  if (span.kind === "verbatim") {
    if (span.origin !== ORIGIN.SOURCE_VERBATIM) errors.push("verbatim span origin must be SOURCE_VERBATIM");
    if (!isInteger(span.start) || !isInteger(span.end) || span.start < 0 || span.end <= span.start) errors.push("verbatim span needs integer offsets with 0 <= start < end");
    if (!nonemptyString(span.sourceId)) errors.push("verbatim span must name its sourceId");
    if (span.id !== makeVerbatimSpanId(span.sourceId, span.start, span.end)) errors.push("verbatim span id must be span:<sourceId>:<start>-<end>");
    if (!source) errors.push("verbatim span cannot be validated without its EvidenceSource");
    else {
      if (source.id !== span.sourceId) errors.push("verbatim span sourceId does not match the supplied source");
      if (span.sourceTextHash !== source.textHash || source.textHash !== sha256Hex(source.text)) errors.push("verbatim span text hash does not match its source text (hard failure)");
      if (isInteger(span.end) && span.end > source.text.length) errors.push("verbatim span end exceeds source text length");
      if (isInteger(span.start) && isInteger(span.end) && span.text !== source.text.slice(span.start, span.end)) errors.push("verbatim span text does not equal the source slice");
    }
  } else if (span.kind === "distilled") {
    if (![ORIGIN.AI_ASSISTED, ORIGIN.DETERMINISTIC].includes(span.origin)) errors.push("distilled span origin must be AI_ASSISTED or DETERMINISTIC");
    if (!nonemptyString(span.text)) errors.push("distilled span text must be nonempty");
    if (!parseExtractionVersion(span.extractionVersion)) errors.push("distilled span extractionVersion must match name-N");
    if (!Array.isArray(span.parentSpanIds) || !span.parentSpanIds.length || !span.parentSpanIds.every(nonemptyString)) errors.push("distilled span must name at least one parent span id");
    if (span.normalisedText !== normaliseDistilledText(span.text)) errors.push("distilled span normalisedText drifted from text");
    if (span.id !== makeDistilledSpanId(span.text, span.extractionVersion)) errors.push("distilled span id must be content-addressed on normalised text and extraction version");
    if (knownSpans && Array.isArray(span.parentSpanIds)) {
      const byId = new Map(knownSpans.map((s) => [s.id, s]));
      for (const parentId of span.parentSpanIds) {
        const parent = byId.get(parentId);
        if (!parent) errors.push(`distilled span parent ${parentId} is unknown (dangling reference)`);
        else if (parent.kind !== "verbatim") errors.push(`distilled span parent ${parentId} is not a verbatim span`);
        else if (span.sourceId && parent.sourceId !== span.sourceId) errors.push(`distilled span parent ${parentId} belongs to a different source`);
      }
    }
  } else {
    if (span.origin !== ORIGIN.WITHHELD) errors.push("withheld span origin must be WITHHELD");
    if (!WITHHOLD_REASONS.includes(span.reason)) errors.push("withheld span reason must be a known reason code");
    if (span.id !== `withheld:${span.sourceId ?? "unknown"}:${span.reason}`) errors.push("withheld span id must be withheld:<sourceId>:<reason>");
  }
  return result(errors);
}

/** Apply a cap and record what was dropped, so a cap never removes rows silently. */
export function applyCap(items, cap, { idOf } = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!isInteger(cap) || cap < 0) throw new Error("applyCap: cap must be a non-negative integer");
  const kept = list.slice(0, cap);
  const dropped = list.slice(cap);
  const pick = typeof idOf === "function" ? idOf : (item, index) => (isObject(item) && nonemptyString(item.id) ? item.id : `index:${cap + index}`);
  return {
    kept,
    withheld: dropped.length
      ? { reason: WITHHOLD.CAP_EXCEEDED, cap, droppedCount: dropped.length, droppedIds: dropped.map(pick), origin: ORIGIN.WITHHELD }
      : null,
  };
}

// ---------------------------------------------------------------------------------------------
// 3. ProofRecord
// ---------------------------------------------------------------------------------------------
export function createProofRecord({ id, candidateSourceId, excerptSpanId, state, confirmation, targets, destinations, note } = {}) {
  const dest = {};
  for (const key of PROOF_DESTINATION) dest[key] = isObject(destinations) && DESTINATION_STATE.includes(destinations[key]) ? destinations[key] : "UNSET";
  return {
    contractVersion: CONTRACT_VERSION,
    id: id ?? (excerptSpanId ? `proof:${sha256Hex(`${candidateSourceId}|${excerptSpanId}`).slice(0, 24)}` : null),
    candidateSourceId: candidateSourceId ?? null,
    excerptSpanId: excerptSpanId ?? null,
    state: state ?? "WITHHELD",
    confirmation: confirmation === "USER-CONFIRMED" ? "USER-CONFIRMED" : null,
    targets: Array.isArray(targets) ? targets : [],
    destinations: dest,
    note: nonemptyString(note) ? note : null,
    origin: ORIGIN.USER_AUTHORED,
  };
}

export function validateProofRecord(proof) {
  const errors = [];
  if (!isObject(proof)) return result(["ProofRecord must be an object"]);
  checkContractVersion(errors, proof, "ProofRecord");
  if (!nonemptyString(proof.id)) errors.push("ProofRecord.id must be nonempty");
  if (!nonemptyString(proof.candidateSourceId)) errors.push("ProofRecord.candidateSourceId must name the candidate EvidenceSource");
  if (!nonemptyString(proof.excerptSpanId) || !proof.excerptSpanId.startsWith("span:")) errors.push("ProofRecord.excerptSpanId must be a verbatim span id (exact excerpt, never a paraphrase)");
  if (!PROOF_STATE.includes(proof.state)) errors.push(`ProofRecord.state must be one of ${PROOF_STATE.join(", ")}`);
  if (proof.confirmation !== null && proof.confirmation !== "USER-CONFIRMED") errors.push("ProofRecord.confirmation must be USER-CONFIRMED or null");
  if (["DEMONSTRATED", "CERTIFIED"].includes(proof.state) && proof.confirmation !== "USER-CONFIRMED") errors.push(`ProofRecord in state ${proof.state} requires USER-CONFIRMED confirmation`);
  if (!Array.isArray(proof.targets)) errors.push("ProofRecord.targets must be an array");
  else proof.targets.forEach((t, i) => {
    if (!isObject(t) || !PROOF_TARGET_KIND.includes(t.targetKind) || !nonemptyString(t.targetId)) errors.push(`ProofRecord.targets[${i}] must be { targetKind, targetId }`);
  });
  if (!isObject(proof.destinations)) errors.push("ProofRecord.destinations must be an object");
  else {
    for (const key of PROOF_DESTINATION) if (!DESTINATION_STATE.includes(proof.destinations[key])) errors.push(`ProofRecord.destinations.${key} must be one of ${DESTINATION_STATE.join(", ")}`);
    const anyAllowed = PROOF_DESTINATION.some((key) => proof.destinations[key] === "ALLOWED");
    if (anyAllowed && !["DEMONSTRATED", "CERTIFIED"].includes(proof.state)) errors.push("ProofRecord may allow a destination only in state DEMONSTRATED or CERTIFIED");
  }
  if (proof.origin !== ORIGIN.USER_AUTHORED) errors.push("ProofRecord.origin must be USER_AUTHORED");
  return result(errors);
}

/** Deterministic proof-state transition table. Returns the next state or null when prohibited. */
const PROOF_TRANSITIONS = Object.freeze({
  CLAIMED_ONLY: ["DEMONSTRATED", "CERTIFIED", "WITHHELD", "STALE"],
  DEMONSTRATED: ["CONFLICTING", "STALE", "WITHHELD"],
  CERTIFIED: ["CONFLICTING", "STALE", "WITHHELD"],
  CONFLICTING: ["DEMONSTRATED", "CERTIFIED", "WITHHELD", "STALE"],
  STALE: ["CLAIMED_ONLY", "DEMONSTRATED", "CERTIFIED", "WITHHELD"],
  WITHHELD: ["CLAIMED_ONLY"],
});
export function isProofTransitionPermitted(from, to) {
  return Array.isArray(PROOF_TRANSITIONS[from]) && PROOF_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------------------------
// 4. ReviewChange (append-only, over immutable source text)
// ---------------------------------------------------------------------------------------------
export function createReviewChange({ id, kind, verb, targetSpanIds, reviewerId, predecessorId, reason, createdAt, evidenceSpanIds, origin, proposedText } = {}) {
  return {
    contractVersion: CONTRACT_VERSION,
    id: id ?? null,
    kind,
    verb,
    targetSpanIds: Array.isArray(targetSpanIds) ? targetSpanIds : [],
    reviewerId: reviewerId ?? null,
    predecessorId: predecessorId ?? null,
    reason: nonemptyString(reason) ? reason : null,
    createdAt: isIsoDateTime(createdAt) ? createdAt : null,
    evidenceSpanIds: Array.isArray(evidenceSpanIds) ? evidenceSpanIds : [],
    proposedText: nonemptyString(proposedText) ? proposedText : null,
    origin,
  };
}

export function validateReviewChange(change) {
  const errors = [];
  if (!isObject(change)) return result(["ReviewChange must be an object"]);
  checkContractVersion(errors, change, "ReviewChange");
  if (!nonemptyString(change.id)) errors.push("ReviewChange.id must be nonempty");
  if (!REVIEW_KIND.includes(change.kind)) errors.push(`ReviewChange.kind must be one of ${REVIEW_KIND.join(", ")}`);
  if (!REVIEW_VERB.includes(change.verb)) errors.push(`ReviewChange.verb must be one of ${REVIEW_VERB.join(", ")}`);
  if (!Array.isArray(change.targetSpanIds) || !change.targetSpanIds.length || !change.targetSpanIds.every(nonemptyString)) errors.push("ReviewChange.targetSpanIds must name at least one span");
  if (!nonemptyString(change.reviewerId)) errors.push("ReviewChange.reviewerId must identify a stable reviewer");
  if (change.createdAt !== null && !isIsoDateTime(change.createdAt)) errors.push("ReviewChange.createdAt must be ISO 8601 or null");
  if (change.createdAt === null) errors.push("ReviewChange.createdAt is required (an event without a time is not auditable)");
  checkOrigin(errors, change.origin, "ReviewChange");
  if (change.kind === "decision" && change.origin !== ORIGIN.USER_AUTHORED) errors.push("a human decision must be USER_AUTHORED; a model may not execute review decisions");
  if (change.kind === "change" && !nonemptyString(change.predecessorId)) errors.push("an executed change must name its predecessor (proposal or decision)");
  if (["escalate", "withhold"].includes(change.verb) && !nonemptyString(change.reason)) errors.push(`verb ${change.verb} requires an explicit reason`);
  if (["undo", "reopen"].includes(change.verb) && !nonemptyString(change.predecessorId)) errors.push(`verb ${change.verb} must name the event it reverses`);
  if (["insert", "replace"].includes(change.verb) && change.kind !== "comment" && !nonemptyString(change.proposedText)) errors.push(`verb ${change.verb} requires proposedText (source text itself is never mutated)`);
  return result(errors);
}

/**
 * Validate an append-only history: ids unique, predecessors resolve to earlier events, times
 * never go backwards. Nothing is removed; a reversal is a new event.
 */
export function validateReviewHistory(events) {
  const errors = [];
  if (!Array.isArray(events)) return result(["review history must be an array"]);
  const seen = new Set();
  let previousTime = -Infinity;
  events.forEach((event, index) => {
    const own = validateReviewChange(event);
    own.errors.forEach((e) => errors.push(`[${index}] ${e}`));
    if (isObject(event)) {
      if (seen.has(event.id)) errors.push(`[${index}] duplicate event id ${event.id}`);
      if (nonemptyString(event.predecessorId) && !seen.has(event.predecessorId)) errors.push(`[${index}] predecessor ${event.predecessorId} is not an earlier event`);
      seen.add(event.id);
      const t = Date.parse(event.createdAt);
      if (!Number.isNaN(t)) { if (t < previousTime) errors.push(`[${index}] createdAt goes backwards`); previousTime = t; }
    }
  });
  return result(errors);
}

// ---------------------------------------------------------------------------------------------
// 5. OutputBlock
// ---------------------------------------------------------------------------------------------
export function computeEvidenceHash(sourceRefs) {
  const refs = Array.isArray(sourceRefs) ? [...new Set(sourceRefs.map(String))].sort() : [];
  return sha256Hex(refs.join("\n"));
}

export function createOutputBlock({ id, taskId, promptVersion, schemaVersion, model, text, sourceRefs, state, policyResult, origin, createdAt } = {}) {
  const refs = Array.isArray(sourceRefs) ? sourceRefs : [];
  return {
    contractVersion: CONTRACT_VERSION,
    id: id ?? null,
    taskId: taskId ?? null,
    promptVersion: promptVersion ?? null,
    schemaVersion: schemaVersion ?? null,
    model: model ?? null,
    text: typeof text === "string" ? text : "",
    sourceRefs: refs,
    evidenceHash: computeEvidenceHash(refs),
    state: state ?? "PROPOSED",
    policyResult: policyResult ?? "NOT_RUN",
    origin: origin ?? ORIGIN.AI_ASSISTED,
    createdAt: isIsoDateTime(createdAt) ? createdAt : null,
  };
}

/** `allowlist` is the set of ids the generating task was permitted to cite. */
export function validateOutputBlock(block, { allowlist } = {}) {
  const errors = [];
  if (!isObject(block)) return result(["OutputBlock must be an object"]);
  checkContractVersion(errors, block, "OutputBlock");
  if (!nonemptyString(block.id)) errors.push("OutputBlock.id must be nonempty");
  if (!nonemptyString(block.taskId)) errors.push("OutputBlock.taskId must name the server-owned task");
  if (!nonemptyString(block.promptVersion)) errors.push("OutputBlock.promptVersion must be recorded");
  if (!nonemptyString(block.schemaVersion)) errors.push("OutputBlock.schemaVersion must be recorded");
  if (block.origin === ORIGIN.AI_ASSISTED && !nonemptyString(block.model)) errors.push("an AI_ASSISTED OutputBlock must record the model");
  if (![ORIGIN.AI_ASSISTED, ORIGIN.USER_AUTHORED, ORIGIN.WITHHELD].includes(block.origin)) errors.push("OutputBlock.origin must be AI_ASSISTED, USER_AUTHORED or WITHHELD");
  if (!OUTPUT_STATE.includes(block.state)) errors.push(`OutputBlock.state must be one of ${OUTPUT_STATE.join(", ")}`);
  if (!POLICY_RESULT.includes(block.policyResult)) errors.push(`OutputBlock.policyResult must be one of ${POLICY_RESULT.join(", ")}`);
  if (!Array.isArray(block.sourceRefs)) errors.push("OutputBlock.sourceRefs must be an array");
  else {
    if (block.evidenceHash !== computeEvidenceHash(block.sourceRefs)) errors.push("OutputBlock.evidenceHash does not match sourceRefs");
    if (block.state !== "WITHHELD" && block.text.trim() && !block.sourceRefs.length) errors.push("a factual OutputBlock with text must reference at least one evidence id");
    if (Array.isArray(allowlist)) {
      const allowed = new Set(allowlist);
      for (const ref of block.sourceRefs) if (!allowed.has(ref)) errors.push(`OutputBlock cites ${ref}, which is outside the supplied allowlist`);
    }
  }
  if (block.state === "ACCEPTED" && block.policyResult !== "PASS") errors.push("an ACCEPTED OutputBlock requires policyResult PASS");
  return result(errors);
}

/** A block is stale when the evidence it cited no longer hashes to what it recorded. */
export function isOutputStale(block, currentSourceRefs) {
  return isObject(block) && block.evidenceHash !== computeEvidenceHash(currentSourceRefs);
}

// ---------------------------------------------------------------------------------------------
// 6. VisualProfile
// ---------------------------------------------------------------------------------------------
export function createVisualProfile({ primaryVisual, secondaryVisuals, reasons, requiredFields, escoOccupation, workNature } = {}) {
  const withheld = [];
  const supported = VISUAL_ID.includes(primaryVisual);
  const reasonList = Array.isArray(reasons) ? reasons.filter(isObject) : [];
  const linked = reasonList.filter((r) => nonemptyString(r.sourceSpanId) && nonemptyString(r.reason));
  if (!nonemptyString(primaryVisual)) withheld.push({ field: "primaryVisual", reason: WITHHOLD.UNAVAILABLE_FIELD });
  else if (!supported) withheld.push({ field: "primaryVisual", reason: WITHHOLD.UNSUPPORTED_VISUAL });
  if (!linked.length) withheld.push({ field: "recommendation", reason: WITHHOLD.NO_SOURCE_ROWS });
  return {
    contractVersion: CONTRACT_VERSION,
    primaryVisual: nonemptyString(primaryVisual) ? primaryVisual : null,
    supported,
    secondaryVisuals: Array.isArray(secondaryVisuals) ? secondaryVisuals.filter(nonemptyString) : [],
    reasons: reasonList,
    requiredFields: Array.isArray(requiredFields) ? requiredFields.filter(nonemptyString) : [],
    escoOccupation: isObject(escoOccupation) ? escoOccupation : null,
    workNature: nonemptyString(workNature) ? workNature : null,
    recommendation: supported && linked.length ? primaryVisual : null,
    origin: ORIGIN.DETERMINISTIC,
    withheld,
  };
}

export function validateVisualProfile(profile) {
  const errors = [];
  if (!isObject(profile)) return result(["VisualProfile must be an object"]);
  checkContractVersion(errors, profile, "VisualProfile");
  if (profile.primaryVisual !== null && !nonemptyString(profile.primaryVisual)) errors.push("VisualProfile.primaryVisual must be a string or null");
  if (profile.supported !== VISUAL_ID.includes(profile.primaryVisual)) errors.push("VisualProfile.supported must equal whether primaryVisual is a shipped visual");
  if (!Array.isArray(profile.reasons)) errors.push("VisualProfile.reasons must be an array");
  const linked = Array.isArray(profile.reasons) ? profile.reasons.filter((r) => isObject(r) && nonemptyString(r.sourceSpanId) && nonemptyString(r.reason)) : [];
  const expected = profile.supported && linked.length ? profile.primaryVisual : null;
  if (profile.recommendation !== expected) errors.push("VisualProfile.recommendation may exist only with a supported primary and a source-linked reason");
  if (profile.origin !== ORIGIN.DETERMINISTIC) errors.push("VisualProfile.origin must be DETERMINISTIC (the selector never classifies from a title)");
  checkWithheldList(errors, profile.withheld, "VisualProfile.withheld");
  return result(errors);
}

// ---------------------------------------------------------------------------------------------
// 7. EvidenceWindow
// ---------------------------------------------------------------------------------------------
function windowField(value, origin, validator) {
  if (value === undefined || value === null || value === "" || !validator(value)) {
    return { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.UNAVAILABLE_FIELD };
  }
  return { value, origin: origin ?? ORIGIN.SOURCE_VERBATIM, withheldReason: null };
}

/**
 * Seven independent fields. Each is carried on its own and withheld on its own; no field is
 * derived from another and no generic freshness substitute is produced.
 */
export function createEvidenceWindow(input = {}) {
  const originOf = (key) => (isObject(input.origins) && ORIGINS.includes(input.origins[key]) ? input.origins[key] : undefined);
  return {
    contractVersion: CONTRACT_VERSION,
    publishedAt: windowField(input.publishedAt, originOf("publishedAt"), isIsoDateTime),
    closingAt: windowField(input.closingAt, originOf("closingAt"), isIsoDateTime),
    retrievedAt: windowField(input.retrievedAt, originOf("retrievedAt") ?? ORIGIN.DETERMINISTIC, isIsoDateTime),
    analysedAt: windowField(input.analysedAt, originOf("analysedAt") ?? ORIGIN.DETERMINISTIC, isIsoDateTime),
    corpusRange: windowField(input.corpusRange, originOf("corpusRange") ?? ORIGIN.DETERMINISTIC, (v) => isObject(v) && isIsoDateTime(v.from) && isIsoDateTime(v.to) && Date.parse(v.from) <= Date.parse(v.to)),
    postingCount: windowField(input.postingCount, originOf("postingCount") ?? ORIGIN.DETERMINISTIC, (v) => isInteger(v) && v >= 0),
    sourceTimezone: windowField(input.sourceTimezone, originOf("sourceTimezone"), (v) => nonemptyString(v) && IANA_ZONE.test(v)),
  };
}

export function validateEvidenceWindow(window) {
  const errors = [];
  if (!isObject(window)) return result(["EvidenceWindow must be an object"]);
  checkContractVersion(errors, window, "EvidenceWindow");
  for (const key of EVIDENCE_WINDOW_FIELDS) {
    const field = window[key];
    if (!isObject(field)) { errors.push(`EvidenceWindow.${key} must be an independent field object`); continue; }
    checkOrigin(errors, field.origin, `EvidenceWindow.${key}`);
    if (field.value === null) {
      if (field.origin !== ORIGIN.WITHHELD || !WITHHOLD_REASONS.includes(field.withheldReason)) errors.push(`EvidenceWindow.${key} null value must be origin WITHHELD with a reason code`);
    } else {
      if (field.origin === ORIGIN.WITHHELD) errors.push(`EvidenceWindow.${key} carries a value but claims origin WITHHELD`);
      if (field.withheldReason !== null) errors.push(`EvidenceWindow.${key} carries a value and a withheld reason`);
      if (field.origin === ORIGIN.AI_ASSISTED) errors.push(`EvidenceWindow.${key} may not be AI-assisted; dates are never inferred`);
    }
  }
  const keys = Object.keys(window).filter((k) => k !== "contractVersion");
  const extra = keys.filter((k) => !EVIDENCE_WINDOW_FIELDS.includes(k));
  if (extra.length) errors.push(`EvidenceWindow has unknown fields: ${extra.join(", ")}`);
  return result(errors);
}

// ---------------------------------------------------------------------------------------------
// Convenience: validate a whole source with its spans as one bundle.
// ---------------------------------------------------------------------------------------------
export function validateEvidenceBundle({ source, spans }) {
  const errors = [];
  const sourceResult = validateEvidenceSource(source);
  sourceResult.errors.forEach((e) => errors.push(e));
  const list = Array.isArray(spans) ? spans : [];
  const ids = new Set();
  for (const span of list) {
    if (isObject(span) && ids.has(span.id)) errors.push(`duplicate span id ${span.id}`);
    if (isObject(span)) ids.add(span.id);
    validateEvidenceSpan(span, { source, knownSpans: list }).errors.forEach((e) => errors.push(`${span?.id ?? "?"}: ${e}`));
  }
  if (!list.length) errors.push(`source ${source?.id ?? "?"} has no spans; supply createWithheldSpanSet(sourceId) so the absence is addressable`);
  return result(errors);
}

export const CONTRACTS = Object.freeze({
  EvidenceSource: { create: createEvidenceSource, validate: validateEvidenceSource },
  EvidenceSpan: { create: createVerbatimSpan, createDistilled: createDistilledSpan, createWithheld: createWithheldSpanSet, validate: validateEvidenceSpan },
  ProofRecord: { create: createProofRecord, validate: validateProofRecord },
  ReviewChange: { create: createReviewChange, validate: validateReviewChange, validateHistory: validateReviewHistory },
  OutputBlock: { create: createOutputBlock, validate: validateOutputBlock },
  VisualProfile: { create: createVisualProfile, validate: validateVisualProfile },
  EvidenceWindow: { create: createEvidenceWindow, validate: validateEvidenceWindow },
});
