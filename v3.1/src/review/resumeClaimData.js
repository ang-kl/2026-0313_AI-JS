import { ORIGIN, createOutputBlock } from "../contracts/evidenceContracts.js";
import { bundleTargets, linkStanding } from "../work-universe/candidateProofLedgerData.js";

export const RESUME_CLAIM_VERSION = "1.0.0";

const ACCEPTED = new Set(["DEMONSTRATED", "CERTIFIED"]);
const HIGH_RISK = new Set([
  "achieved", "built", "created", "delivered", "grew", "improved", "increased", "launched",
  "led", "managed", "owned", "reduced", "saved", "scaled", "transformed",
]);
const STOP = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "i", "in", "into", "of", "on", "or",
  "the", "to", "with", "my", "our", "was", "were", "is", "are",
]);

const words = (value) => String(value || "").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+'-]*/gu) || [];
const numbers = (value) => String(value || "").match(/(?:\d[\d,.]*%?)/g) || [];
const unique = (values) => [...new Set(values)];

function targetText(targets, target) {
  return targets.find((item) => item.targetKind === target.targetKind && item.targetId === target.targetId)?.text || null;
}

export function assessResumeClaim(claimText, evidenceTexts) {
  const claim = String(claimText || "").trim();
  const corpus = evidenceTexts.filter(Boolean).join("\n");
  const corpusWords = new Set(words(corpus));
  const claimWords = unique(words(claim).filter((word) => !STOP.has(word)));
  const inventedNumbers = unique(numbers(claim).filter((number) => !numbers(corpus).includes(number)));
  const unsupportedHighRiskVerbs = claimWords.filter((word) => HIGH_RISK.has(word) && !corpusWords.has(word));
  const supportedWords = claimWords.filter((word) => corpusWords.has(word));
  const unsupportedWords = claimWords.filter((word) => !corpusWords.has(word));
  const whollyUnsupported = claimWords.length > 0 && supportedWords.length === 0;
  const blockers = [
    inventedNumbers.length ? `invented number${inventedNumbers.length === 1 ? "" : "s"}: ${inventedNumbers.join(", ")}` : null,
    unsupportedHighRiskVerbs.length ? `unsupported achievement verb${unsupportedHighRiskVerbs.length === 1 ? "" : "s"}: ${unsupportedHighRiskVerbs.join(", ")}` : null,
    whollyUnsupported ? "no material claim word occurs in the supplied evidence" : null,
  ].filter(Boolean);
  return {
    state: blockers.length ? "BLOCKED" : unsupportedWords.length ? "REVIEW" : "SUPPORTED",
    blockers,
    unsupportedWords,
    supportedWords,
    rationale: blockers.length
      ? `Withheld because ${blockers.join("; ")}.`
      : unsupportedWords.length
        ? `The wording is grounded in the supplied evidence but ${unsupportedWords.length} material word${unsupportedWords.length === 1 ? "" : "s"} need human overclaim review.`
        : "Every material word and number in the wording occurs in the supplied candidate proof or linked job evidence.",
  };
}

export function buildResumeClaimWorkbench(ledger, bundle, { createdAt = null } = {}) {
  const targets = bundleTargets(bundle);
  const proposed = [];
  const withheld = [];
  for (const record of Array.isArray(ledger?.records) ? ledger.records : []) {
    const reasons = [];
    if (!ACCEPTED.has(record.record?.state)) reasons.push(`proof state is ${record.record?.state || "unknown"}, not DEMONSTRATED or CERTIFIED`);
    if (record.record?.destinations?.resume !== "ALLOWED") reasons.push("resume destination is not approved");
    if (record.record?.confirmation !== "USER-CONFIRMED" || record.confirmation?.confirmedBy !== "human:local-user") reasons.push("candidate proof is not confirmed by the local human");
    if (!record.claimText || record.claimOrigin !== "USER_AUTHORED") reasons.push("no user-authored claim wording is recorded");
    const standing = linkStanding(record, bundle);
    if (!standing.judged || standing.unreadable || !standing.standing.length) reasons.push("no live job-evidence link stands against the current posting");
    const linkedEvidence = standing.standing.map((target) => ({ ...target, text: targetText(targets.targets, target) })).filter((target) => target.text);
    const assessment = assessResumeClaim(record.claimText, [record.excerptText, ...linkedEvidence.map((target) => target.text)]);
    reasons.push(...assessment.blockers);
    const sourceRefs = [record.spanId, ...linkedEvidence.map((target) => target.targetId)];
    const claim = {
      id: `resume-claim:${record.id}`,
      proofId: record.id,
      wording: record.claimText || "",
      candidateEvidence: { sourceId: record.sourceId, spanId: record.spanId, excerptText: record.excerptText },
      jobEvidence: linkedEvidence,
      sourceRefs,
      rationale: assessment.rationale,
      authorship: { origin: ORIGIN.USER_AUTHORED, actorId: record.confirmation?.confirmedBy || null, confirmedAt: record.confirmation?.confirmedAt || null },
      reviewer: { status: "UNASSIGNED", reviewerId: null, decision: "PENDING" },
      overclaim: assessment,
      output: createOutputBlock({
        id: `resume-output:${record.id}`,
        taskId: "resume-claim",
        promptVersion: "resume-claim-user-wording-1",
        schemaVersion: "resume-claim-1",
        model: null,
        text: reasons.length ? "" : record.claimText,
        sourceRefs: reasons.length ? [] : sourceRefs,
        state: reasons.length ? "WITHHELD" : "PROPOSED",
        policyResult: reasons.length ? "FAIL" : "PASS",
        origin: reasons.length ? ORIGIN.WITHHELD : ORIGIN.USER_AUTHORED,
        createdAt,
      }),
      reasons,
    };
    (reasons.length ? withheld : proposed).push(claim);
  }
  const refs = [...new Set(proposed.flatMap((claim) => claim.sourceRefs))];
  const text = proposed.map((claim) => claim.wording).join("\n");
  const output = createOutputBlock({
    id: "resume-output:session",
    taskId: "resume-claim",
    promptVersion: "resume-claim-user-wording-1",
    schemaVersion: "resume-claim-1",
    model: null,
    text,
    sourceRefs: refs,
    state: proposed.length ? "PROPOSED" : "WITHHELD",
    policyResult: proposed.length ? "PASS" : "FAIL",
    origin: proposed.length ? ORIGIN.USER_AUTHORED : ORIGIN.WITHHELD,
    createdAt,
  });
  return { version: RESUME_CLAIM_VERSION, proposed, withheld, output, trace: proposed.map((claim, index) => ({ sentence: index + 1, text: claim.wording, sourceRefs: claim.sourceRefs })) };
}
