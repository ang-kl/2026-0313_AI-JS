import { ORIGIN, createOutputBlock } from "../contracts/evidenceContracts.js";
import { bundleTargets, linkStanding } from "../work-universe/candidateProofLedgerData.js";
import { assessResumeClaim } from "./resumeClaimData.js";

export const COVER_LETTER_WORKBENCH_VERSION = "1.0.0";
const ACCEPTED = new Set(["DEMONSTRATED", "CERTIFIED"]);

const finishSentence = (text) => /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

export function buildCoverLetterWorkbench(ledger, bundle, { createdAt = null } = {}) {
  const catalogue = bundleTargets(bundle);
  const sentences = [];
  const withheld = [];
  for (const record of Array.isArray(ledger?.records) ? ledger.records : []) {
    const reasons = [];
    if (!ACCEPTED.has(record.record?.state)) reasons.push(`proof state is ${record.record?.state || "unknown"}, not DEMONSTRATED or CERTIFIED`);
    if (record.record?.destinations?.coverLetter !== "ALLOWED") reasons.push("cover-letter destination is not approved");
    if (record.record?.confirmation !== "USER-CONFIRMED" || record.confirmation?.confirmedBy !== "human:local-user") reasons.push("candidate proof is not confirmed by the local human");
    if (!record.claimText || record.claimOrigin !== "USER_AUTHORED") reasons.push("no user-authored claim wording is recorded");
    const standing = linkStanding(record, bundle);
    if (!standing.judged || standing.unreadable || !standing.standing.length) reasons.push("no live job-evidence link stands against the current posting");
    const jobEvidence = standing.standing.map((target) => ({ ...target, text: catalogue.targets.find((item) => item.targetKind === target.targetKind && item.targetId === target.targetId)?.text || null })).filter((target) => target.text);
    const assessment = assessResumeClaim(record.claimText, [record.excerptText, ...jobEvidence.map((target) => target.text)]);
    reasons.push(...assessment.blockers);
    const sourceRefs = [record.spanId, ...jobEvidence.map((target) => target.targetId)];
    const item = {
      id: `cover-letter-sentence:${record.id}`,
      proofId: record.id,
      text: record.claimText ? finishSentence(record.claimText) : "",
      sourceRefs,
      candidateEvidence: { sourceId: record.sourceId, spanId: record.spanId, excerptText: record.excerptText },
      jobEvidence,
      rationale: reasons.length ? `Withheld because ${reasons.join("; ")}.` : "This sentence is the candidate's approved wording and cites both the candidate excerpt and live job evidence.",
      authorship: { origin: ORIGIN.USER_AUTHORED, actorId: record.confirmation?.confirmedBy || null },
      reviewer: { status: "UNASSIGNED", reviewerId: null, decision: "PENDING" },
      overclaim: assessment,
      reasons,
    };
    (reasons.length ? withheld : sentences).push(item);
  }
  const refs = [...new Set(sentences.flatMap((sentence) => sentence.sourceRefs))];
  const text = sentences.map((sentence) => sentence.text).join(" ");
  const output = createOutputBlock({
    id: "cover-letter-output:session",
    taskId: "cover-letter",
    promptVersion: "cover-letter-user-wording-1",
    schemaVersion: "cover-letter-sentences-1",
    model: null,
    text,
    sourceRefs: refs,
    state: sentences.length ? "PROPOSED" : "WITHHELD",
    policyResult: sentences.length ? "PASS" : "FAIL",
    origin: sentences.length ? ORIGIN.USER_AUTHORED : ORIGIN.WITHHELD,
    createdAt,
  });
  return { version: COVER_LETTER_WORKBENCH_VERSION, sentences, withheld, output, trace: sentences.map((sentence, index) => ({ sentence: index + 1, sentenceId: sentence.id, text: sentence.text, sourceRefs: sentence.sourceRefs })) };
}
