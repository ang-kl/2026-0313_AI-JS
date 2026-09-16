import assert from "node:assert/strict";
import { createEmptyLedger, applyEvidenceToLedger, linkProof, declareProofState, setClaimText, setDestination } from "../src/work-universe/candidateProofLedgerData.js";
import { buildManualPersonSource, buildManualPersonEvidence, markExcerpt } from "../src/work-universe/personEvidenceData.js";
import { buildPostingEvidence } from "../src/contracts/evidenceAdapter.js";
import { validateOutputBlock } from "../src/contracts/evidenceContracts.js";
import { buildCoverLetterWorkbench } from "../src/review/coverLetterData.js";

let checks = 0;
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const t = (minute) => `2026-09-16T08:${String(minute).padStart(2, "0")}:00.000Z`;
const BODY = "Responsibilities\n- Investigate service exceptions and monitor operational data";
const posting = { uuid: "MCF-2026-000124", source: "MyCareersFuture", text: BODY, description: BODY, textField: "description", textProvenance: { description: { cap: 30000, originalLength: BODY.length, truncated: false } } };
const bundle = buildPostingEvidence({ posting, duties: ["Investigate service exceptions and monitor operational data"], extractionVersion: "responsibilities-1", retrievedAt: t(0) });
const source = buildManualPersonSource("Investigated service exceptions and monitored operational data");
const span = markExcerpt(source, 0, source.text.length).span;
const payload = buildManualPersonEvidence({ rawText: source.text, confirmed: true, excerpts: [{ start: 0, end: source.text.length, sourceTextHash: span.sourceTextHash }], confirmedAt: t(1) });
let ledger = applyEvidenceToLedger(createEmptyLedger(), payload, t(1), { bundle });
const id = ledger.records[0].id;
ledger = linkProof(ledger, id, { targetKind: "duty", targetId: bundle.dutyRows[0].id }, bundle, t(2)).ledger;
ledger = setClaimText(ledger, id, "Investigated service exceptions and monitored operational data", t(3)).ledger;
ledger = declareProofState(ledger, id, "DEMONSTRATED", t(4), { bundle }).ledger;
ledger = setDestination(ledger, id, "coverLetter", "ALLOWED", t(5), { bundle }).ledger;

const view = buildCoverLetterWorkbench(ledger, bundle, { createdAt: t(6) });
eq(view.sentences.length, 1, "one eligible proof becomes one cover-letter sentence");
eq(view.sentences[0].text, "Investigated service exceptions and monitored operational data.", "the sentence preserves exact user wording and adds punctuation only");
ok(view.trace[0].sourceRefs.includes(span.id) && view.trace[0].sourceRefs.includes(bundle.dutyRows[0].id), "the sentence trace cites candidate and job evidence");
eq(view.sentences[0].reviewer.status, "UNASSIGNED", "reviewer identity is not invented");
ok(validateOutputBlock(view.output, { allowlist: view.output.sourceRefs, knownSpans: [span, ...bundle.knownSpans] }).ok, "the assembled output validates against its sentence citations");
const noBundle = buildCoverLetterWorkbench(ledger, undefined);
eq(noBundle.sentences.length, 0, "stored link state without live evidence produces no sentence");
ok(noBundle.withheld[0].reasons.some((reason) => /no live job-evidence link/.test(reason)), "the live-evidence refusal is inspectable");
const invented = setClaimText(ledger, id, "Saved $900000", t(7)).ledger;
eq(buildCoverLetterWorkbench(invented, bundle).sentences.length, 0, "an invented quantified claim is withheld");

console.log(`cover-letter workbench contract: PASS, ${checks} checks`);
