import { isOutputStale, validateOutputBlock } from "../contracts/evidenceContracts.js";

export const OUTPUT_ACTIONS = Object.freeze(["copy", "save", "print", "pdf", "export"]);

/**
 * ANY item that does not carry an overclaim assessment of SUPPORTED, INCLUDING one that carries
 * none, and INCLUDING the case where no list of items was supplied at all: an unjudged item has not
 * been found supported, and an absent list has judged nothing (conformance-auditor W-4 and W-1 of
 * the second pass; an empty list, by contrast, is read and carries nothing unsupported).
 */
export function hasUnsupportedClaims(items) {
  if (!Array.isArray(items)) return true;
  return items.some((item) => !item || !item.overclaim || item.overclaim.state !== "SUPPORTED");
}
/**
 * ANY record on the ledger marked CONFLICTING, not only one this output cites: a conflict the human
 * declared and has not resolved blocks release, and the reason says the quantifier out loud (S-3).
 * With no ledger to read the answer is "cannot be ruled out", never "no conflict" (W-6).
 */
export function hasUnresolvedConflict(ledger) {
  if (!Array.isArray(ledger?.records)) return true;
  return ledger.records.some((record) => record?.record?.state === "CONFLICTING");
}
/**
 * The gate a workbench applies: the HELD output (assembled by the human at an instant) is judged
 * against the LIVE workbench (rebuilt from the ledger and the posting evidence on every render).
 * The stale branch therefore has a subject that can fail it: when the evidence moves after
 * assembly, the live citable refs differ from the held output's and every action blocks until
 * the human assembles again. Judging the live output against its own refs, as the first release
 * did, compared a hash with itself and could never block (Blueprint Supervisor finding on #508).
 */
export function releaseGateFor(held, live, ledger) {
  if (!held || !held.output) return { allowed: false, reasons: ["no output has been assembled yet"], actions: Object.fromEntries(OUTPUT_ACTIONS.map((action) => [action, false])), flags: { unassembled: true, unavailable: false, invalid: false, staleRefs: false, staleText: false, unsupported: false, conflict: false }, stale: false };
  const currentSourceRefs = Array.isArray(live?.output?.sourceRefs) ? live.output.sourceRefs : [];
  const currentText = typeof live?.output?.text === "string" ? live.output.text : null;
  const gate = outputReleaseGate(held.output, { currentSourceRefs, currentText, hasUnsupported: hasUnsupportedClaims(live?.items), hasConflict: hasUnresolvedConflict(ledger) });
  // `stale` is read from the gate's own FLAG, never parsed back out of its prose: a reworded reason
  // would silently turn the signal off and every assertion over it would pass on a dead check
  // (conformance-auditor W-1).
  return { ...gate, flags: { unassembled: false, ...gate.flags }, stale: gate.flags.staleRefs || gate.flags.staleText };
}

/**
 * TWO dimensions can go stale and both are checked, because the artefact at risk is the wording the
 * human copies, not only the evidence it cites: a claim edited after assembly leaves the cited ref
 * SET untouched, so a refs-only gate would release the superseded wording under a sentence saying
 * the output is current (conformance-auditor C-1). `currentText` is the live rebuild's text;
 * null means no live text was supplied and the wording dimension is not judged.
 */
export function outputReleaseGate(output, { currentSourceRefs, currentText = null, hasUnsupported = false, hasConflict = false } = {}) {
  const reasons = [];
  const flags = { unavailable: false, invalid: false, staleRefs: false, staleText: false, unsupported: false, conflict: false };
  if (!output || output.state === "WITHHELD" || !String(output?.text || "").trim()) { flags.unavailable = true; reasons.push("no supported output is available"); }
  if (output && !validateOutputBlock(output, { allowlist: currentSourceRefs }).ok) { flags.invalid = true; reasons.push("the output contract or evidence allowlist is invalid"); }
  if (output && Array.isArray(currentSourceRefs) && isOutputStale(output, currentSourceRefs)) { flags.staleRefs = true; reasons.push("the cited evidence changed and the output is stale"); }
  if (output && typeof currentText === "string" && String(output.text) !== currentText) { flags.staleText = true; reasons.push("the wording changed since assembly and the output is stale"); }
  if (hasUnsupported) { flags.unsupported = true; reasons.push("unsupported content is present"); }
  if (hasConflict) { flags.conflict = true; reasons.push("a record on your proof ledger is marked conflicting, or the ledger could not be read; the conflict need not be one this output cites"); }
  return { allowed: reasons.length === 0, reasons, flags, actions: Object.fromEntries(OUTPUT_ACTIONS.map((action) => [action, reasons.length === 0])) };
}
