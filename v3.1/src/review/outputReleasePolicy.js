import { isOutputStale, validateOutputBlock } from "../contracts/evidenceContracts.js";

export const OUTPUT_ACTIONS = Object.freeze(["copy", "save", "print", "pdf", "export"]);

export function outputReleaseGate(output, { currentSourceRefs, hasUnsupported = false, hasConflict = false } = {}) {
  const reasons = [];
  if (!output || output.state === "WITHHELD" || !String(output?.text || "").trim()) reasons.push("no supported output is available");
  if (output && !validateOutputBlock(output, { allowlist: currentSourceRefs }).ok) reasons.push("the output contract or evidence allowlist is invalid");
  if (output && Array.isArray(currentSourceRefs) && isOutputStale(output, currentSourceRefs)) reasons.push("the cited evidence changed and the output is stale");
  if (hasUnsupported) reasons.push("unsupported content is present");
  if (hasConflict) reasons.push("conflicting evidence is unresolved");
  return { allowed: reasons.length === 0, reasons, actions: Object.fromEntries(OUTPUT_ACTIONS.map((action) => [action, reasons.length === 0])) };
}
