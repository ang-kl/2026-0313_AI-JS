// Evidence-window adapter (BLP-004): the ONE place where Step 2's posting facts and the engine's
// corpus become the seven independent EvidenceWindow fields for Step 3 (footer, overview toolbar,
// print package): publishedAt, closingAt, retrievedAt, analysedAt, corpusRange, postingCount,
// sourceTimezone. Each is carried on its own and withheld on its own; nothing is derived from a
// neighbour and no generic freshness substitute is produced.
//
// Rules this module keeps (Blueprint Supervisor rulings for BLP-004, 08-09 '26):
//   1. NO CLOCK INSIDE. This module never reads Date.now() or new Date(). analysedAt is passed in
//      by the App.jsx call site as an ISO string carrying the client's actual offset; retrievedAt
//      comes from the route (the moment the source was observed). A missing value is withheld,
//      never replaced with "now" - substituting a proxy for a missing fact is the generic
//      freshness substitute the acceptance criterion forbids, wearing a different hat.
//   2. SOURCE DATES ARE READ FROM THE RAW FIELDS ONLY (postedDateRaw / expiryDateRaw), never from
//      the routes' display values (postedDate / expiryDate). Decoding is format decoding, not
//      derivation, so the origin stays SOURCE_VERBATIM. The uniform decoding rule, all sources:
//        a. a string matching YYYY-MM-DD           -> day precision, value as-is (MyCareersFuture)
//        b. a number (epoch milliseconds)          -> if an exact multiple of 86,400,000, day
//           precision with the UTC calendar date (careers.gov.sg encodes a calendar date as a
//           midnight-UTC epoch); otherwise a genuine instant, recorded at instant precision
//        c. a full ISO datetime string             -> instant precision
//        d. anything else                          -> withheld
//      Branch b's "otherwise" is deliberate: the alignment was sampled, not proven for all time,
//      so a non-aligned epoch is recorded as the instant it is, not withheld.
//   3. A single posting records postingCount 1 and WITHHOLDS corpusRange: one posting is not a
//      corpus, and a degenerate from === to built from the published date would be publishedAt
//      restated under another name. For a corpus, the range is min/max over the postings that
//      carry a decodable date, and the dated subset is reported next to the total so a gap is
//      visible rather than implied away (App.jsx:7376 precedent).
//   4. sourceTimezone is withheld unless a source names an IANA zone. Neither route does today; a
//      midnight-UTC encoding is a convention, not a statement that the source's dates are UTC.
//   5. Precision survives to the screen: formatWindowField renders a day value as "26 Aug 2026",
//      never "26 Aug 2026, 00:00". Every withheld field renders the literal word "withheld" plus
//      its reason, as text, so the state is announced to assistive technology and never carried
//      by styling alone.
//
// Pure module: no React, no DOM, no network, no clock.

import { CONTRACT_VERSION, EVIDENCE_WINDOW_FIELDS, ORIGIN, WITHHOLD, createEvidenceWindow, validateEvidenceWindow, datePrecisionOf } from "./evidenceContracts.js";

export const WINDOW_ADAPTER_VERSION = "1.0.0";
const DAY_MS = 86400000;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Decode a source date value into { value, precision } or null (rule 2). */
export function decodeSourceDate(raw) {
  if (typeof raw === "string") {
    const s = raw.trim();
    if (ISO_DATE_ONLY.test(s)) return datePrecisionOf(s) === "day" ? { value: s, precision: "day" } : null;
    if (datePrecisionOf(s) === "instant") return { value: s, precision: "instant" };
    return null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw % DAY_MS === 0) {
      const d = new Date(raw);
      const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      return { value, precision: "day" };
    }
    return { value: new Date(raw).toISOString(), precision: "instant" };
  }
  return null;
}

/** Render a Date the caller already holds as an ISO string with its local offset (rule 1: the clock read stays at the call site). */
export function isoWithOffset(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function rangeOver(postings) {
  const decoded = postings.map((p) => decodeSourceDate(p && p.postedDateRaw)).filter(Boolean);
  const datedCount = decoded.length;
  if (!datedCount) return { range: null, datedCount, reason: "no posting in the corpus carries a decodable date" };
  const precisions = new Set(decoded.map((d) => d.precision));
  if (precisions.size > 1) return { range: null, datedCount, reason: "the corpus mixes day-precision and instant dates; a range is not compared across precisions" };
  const precision = decoded[0].precision;
  const sorted = decoded.map((d) => d.value).sort((a, b) => (precision === "day" ? (a < b ? -1 : a > b ? 1 : 0) : Date.parse(a) - Date.parse(b)));
  return { range: { from: sorted[0], to: sorted[sorted.length - 1] }, datedCount, reason: null };
}

/**
 * Build the window for a result. `posting` is Step 2's analysed posting (with the route's raw
 * fields carried through); `corpusJobs` is the sampled corpus for a corpus analysis;
 * `analysedAt` is an ISO string the caller stamped. Returns { window, meta, validation }.
 */
export function buildEvidenceWindow({ posting, corpusJobs, analysedAt } = {}) {
  const meta = { basis: null, postingCountTotal: null, datedCount: null, corpusRangeReason: null, sourceTimezoneReason: "no source names an IANA zone; a midnight-UTC encoding is a convention, not a zone" };
  const input = { origins: {} };
  const published = posting ? decodeSourceDate(posting.postedDateRaw) : null;
  const closing = posting ? decodeSourceDate(posting.expiryDateRaw) : null;
  if (published) { input.publishedAt = published.value; input.origins.publishedAt = ORIGIN.SOURCE_VERBATIM; }
  if (closing) { input.closingAt = closing.value; input.origins.closingAt = ORIGIN.SOURCE_VERBATIM; }
  if (posting && datePrecisionOf(posting.retrievedAt)) input.retrievedAt = posting.retrievedAt;
  if (datePrecisionOf(analysedAt)) input.analysedAt = analysedAt;
  const jobs = Array.isArray(corpusJobs) ? corpusJobs.filter(Boolean) : [];
  if (posting && posting.text) {
    meta.basis = "posting";
    input.postingCount = 1;
    meta.postingCountTotal = 1;
    meta.corpusRangeReason = "a single posting is not a corpus; its published date is carried as publishedAt and is not restated as a range";
  } else if (jobs.length) {
    meta.basis = "corpus";
    input.postingCount = jobs.length;
    meta.postingCountTotal = jobs.length;
    const r = rangeOver(jobs);
    meta.datedCount = r.datedCount;
    meta.corpusRangeReason = r.reason;
    if (r.range) input.corpusRange = r.range;
  } else {
    meta.corpusRangeReason = "no posting and no corpus reached Step 3";
  }
  const window = createEvidenceWindow(input);
  return { adapterVersion: WINDOW_ADAPTER_VERSION, contractVersion: CONTRACT_VERSION, window, meta, validation: validateEvidenceWindow(window) };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WINDOW_LABELS = Object.freeze({
  publishedAt: "Published", closingAt: "Closing", retrievedAt: "Retrieved", analysedAt: "Analysed",
  corpusRange: "Corpus range", postingCount: "Postings", sourceTimezone: "Source zone",
});
const REASON_TEXT = Object.freeze({
  [WITHHOLD.UNAVAILABLE_FIELD]: "not supplied",
  [WITHHOLD.CONFLICTING_EVIDENCE]: "conflicting",
});

function fmtDay(value) {
  const [y, m, d] = value.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
function fmtInstant(value) {
  // Render the instant with the offset it carries; never re-zone it into an assumed local time.
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, mi, off] = m;
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}, ${h}:${mi} ${off === "Z" ? "UTC" : `UTC${off}`}`;
}
/** Text for one field: precision survives (rule 5); withheld is the literal word plus the reason. */
export function formatWindowField(key, field) {
  if (!field || field.value === null || field.value === undefined) {
    const reason = field && field.withheldReason ? (REASON_TEXT[field.withheldReason] || field.withheldReason) : "not supplied";
    return `withheld (${reason})`;
  }
  const precision = field.precision ?? "instant";
  switch (key) {
    case "publishedAt": case "closingAt": case "retrievedAt": case "analysedAt":
      return precision === "day" ? fmtDay(field.value) : fmtInstant(field.value);
    case "corpusRange":
      return precision === "day" ? `${fmtDay(field.value.from)} to ${fmtDay(field.value.to)}` : `${fmtInstant(field.value.from)} to ${fmtInstant(field.value.to)}`;
    case "postingCount":
      return String(field.value);
    case "sourceTimezone":
      return String(field.value);
    default:
      return String(field.value);
  }
}

/**
 * The seven fields as display rows, in contract order, for any surface (footer, toolbar, print).
 * Fails closed: a window that does not pass its own validation is withheld field by field as
 * CONFLICTING_EVIDENCE, never shipped half-right (the same rule evidenceAdapter.js keeps).
 */
export function windowRows(built) {
  const valid = !built || !built.validation || built.validation.ok !== false;
  const window = valid && built && built.window;
  const invalidField = Object.freeze({ value: null, precision: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.CONFLICTING_EVIDENCE });
  return EVIDENCE_WINDOW_FIELDS.map((key) => {
    const field = window ? window[key] : (built && built.window && !valid ? invalidField : null);
    const withheld = !field || field.value === null || field.value === undefined;
    let text = formatWindowField(key, field);
    if (key === "postingCount" && !withheld && built.meta && built.meta.basis === "corpus" && Number.isInteger(built.meta.datedCount) && built.meta.datedCount < built.meta.postingCountTotal) {
      text = `${text} (${built.meta.datedCount} dated)`;
    }
    return { key, label: WINDOW_LABELS[key], text, withheld, precision: field ? field.precision ?? null : null, origin: field ? field.origin : null };
  });
}
