import assert from "node:assert/strict";
import {
  createEmptyLedger, applyEvidenceToLedger, linkProof, declareProofState, setClaimText, setDestination,
} from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { buildPostingEvidence } from "../src/contracts/evidenceAdapter.js";
import { validateOutputBlock } from "../src/contracts/evidenceContracts.js";
import { assessResumeClaim, buildResumeClaimWorkbench } from "../src/review/resumeClaimData.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const t = (minute) => `2026-09-16T07:${String(minute).padStart(2, "0")}:00.000Z`;

const BODY = [
  "Responsibilities",
  "- Monitored operational data and investigated service exceptions across the payments platform",
  "Requirements",
  "- Knowledge of SQL and data pipelines is required for this role",
].join("\n");
const posting = { uuid: "MCF-2026-000123", source: "MyCareersFuture", text: BODY, description: BODY, textField: "description", textProvenance: { description: { cap: 30000, originalLength: BODY.length, truncated: false } } };
const bundle = buildPostingEvidence({ posting, duties: ["Monitored operational data and investigated service exceptions across the payments platform"], extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const source = buildManualPersonSource("Monitored operational data and investigated service exceptions across the payments platform.");
const span = markExcerpt(source, 0, source.text.length).span;
const payload = buildManualPersonEvidence({ rawText: source.text, confirmed: true, excerpts: [{ start: 0, end: source.text.length, sourceTextHash: span.sourceTextHash }], confirmedAt: t(1) });
let ledger = applyEvidenceToLedger(createEmptyLedger(), payload, t(1), { bundle });
const proofId = ledger.records[0].id;
const target = bundle.dutyRows[0];
ledger = linkProof(ledger, proofId, { targetKind: "duty", targetId: target.id }, bundle, t(2)).ledger;
ledger = setClaimText(ledger, proofId, "Monitored operational data and investigated service exceptions", t(3)).ledger;
ledger = declareProofState(ledger, proofId, "DEMONSTRATED", t(4), { bundle }).ledger;
ledger = setDestination(ledger, proofId, "resume", "ALLOWED", t(5), { bundle }).ledger;

const view = buildResumeClaimWorkbench(ledger, bundle, { createdAt: t(6) });
eq(view.proposed.length, 1, "accepted, resume-approved proof with a live job link yields one proposal");
eq(view.withheld.length, 0, "the supported claim is not withheld");
const claim = view.proposed[0];
eq(claim.wording, ledger.records[0].claimText, "proposal wording is the user's exact recorded claim");
ok(claim.sourceRefs.includes(span.id) && claim.sourceRefs.includes(target.id), "proposal cites both candidate proof and job evidence");
eq(claim.reviewer.status, "UNASSIGNED", "reviewer identity is not invented");
eq(claim.overclaim.state, "SUPPORTED", "matching wording has no overclaim warning");
ok(validateOutputBlock(claim.output, { allowlist: claim.sourceRefs, knownSpans: [span, ...bundle.knownSpans] }).ok, "the proposed OutputBlock validates against its exact allowlist");

const invented = setClaimText(ledger, proofId, "Increased revenue by 70%", t(7)).ledger;
const inventedView = buildResumeClaimWorkbench(invented, bundle, { createdAt: t(8) });
eq(inventedView.proposed.length, 0, "an invented quantified achievement cannot become a proposal");
ok(inventedView.withheld[0].reasons.some((reason) => /invented number: 70%/.test(reason)), "the invented number is named");
ok(inventedView.withheld[0].reasons.some((reason) => /unsupported achievement verb: increased/.test(reason)), "the unsupported achievement verb is named");
eq(inventedView.withheld[0].output.state, "WITHHELD", "blocked wording produces a withheld output with no generated text");

const assessment = assessResumeClaim("Operated lunar reactors", ["Reviewed payroll records"]);
eq(assessment.state, "BLOCKED", "wholly unrelated wording is blocked");
ok(assessment.blockers.some((reason) => /no material claim word/.test(reason)), "wholly unrelated wording gives an inspectable reason");

const noApproval = { ...ledger, records: ledger.records.map((record) => ({ ...record, record: { ...record.record, destinations: { ...record.record.destinations, resume: "UNSET" } } })) };
ok(buildResumeClaimWorkbench(noApproval, bundle).withheld[0].reasons.includes("resume destination is not approved"), "missing destination approval is withheld");
const noBundle = buildResumeClaimWorkbench(ledger, undefined);
ok(noBundle.withheld[0].reasons.includes("no live job-evidence link stands against the current posting"), "stored VALID state without a live bundle is withheld");
const stale = { ...ledger, records: ledger.records.map((record) => ({ ...record, record: { ...record.record, state: "STALE", destinations: { ...record.record.destinations, resume: "UNSET" } } })) };
ok(buildResumeClaimWorkbench(stale, bundle).withheld[0].reasons.some((reason) => /proof state is STALE/.test(reason)), "stale proof is withheld");

console.log(`resume claim workbench contract passed (${checks} checks)`);
