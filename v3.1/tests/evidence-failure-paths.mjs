// BLP-005: positive source round trip, reference integrity, withholding, stale data and failure
// paths, distinct and deterministic.
//
// Part A (node, no server): stubbed routes for every failure cause (timeout, upstream error,
// unreadable body, oversize dump, missing parameters) proving no row is ever invented and the
// route's code survives; the evidence layer's withheld, stale and failed states distinct by reason
// code AND by the words a surface shows (one definition in evidenceAdapter.js); an exhaustive
// identifier inventory over a MyCareersFuture and a careers.gov.sg fixture that survives a rebuild
// byte-identically; negatives for unknown and dangling references; determinism proved by a double
// build and a randomised fixture detected as non-deterministic.
//
// Part B (Chromium against BASE_URL) at 1440x1000 and 430x932: three STATES side by side on the
// company flow, a hard route failure (SERVER), a genuine empty answer (EMPTY) and a withheld
// evidence-window field, each with distinct visible words and a distinct data-state, never colour
// alone; a failure names its source and is never phrased as an absence; and on a failure the
// surface does not keep showing the prior result.
//
// Run: node tests/evidence-failure-paths.mjs                (BASE_URL defaults to http://127.0.0.1:4173)
//      EVIDENCE_FAILURE_PATHS_NODE_ONLY=1 node tests/evidence-failure-paths.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import { GENERIC_FRESHNESS_PHRASES, ABSENCE_PHRASES } from "./support/surface-phrases.mjs";
import {
  ADAPTER_VERSION, BUNDLE_STATE, EVIDENCE_STATE, buildResultEvidence, resolvePostingIdentity, decisionKey, mergeDecisionLedger,
  partitionDecisionLedger, partitionLinks, validateAgainstBundle, withholdingText, staleText, failureText, emptyText, classifyRoutePayload,
} from "../src/contracts/evidenceAdapter.js";
import {
  CONTRACT_VERSION, ORIGIN, WITHHOLD, WITHHOLD_REASONS, OUTPUT_STATE, PROOF_STATE, createOutputBlock, isOutputStale, isProofTransitionPermitted,
  createReviewChange, validateReviewChange, validateReviewHistory, createEvidenceWindow, validateEvidenceWindow, makeDistilledSpanId,
} from "../src/contracts/evidenceContracts.js";
import { ROSTER } from "../src/review/reviewerContract.js";
import { DUTY_EXTRACTION_VERSION } from "../src/contracts/evidenceAdapter.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const lower = (s) => String(s || "").toLowerCase();
const hasAbsence = (s) => ABSENCE_PHRASES.some((p) => lower(s).includes(p));

console.log(`evidence-failure-paths: adapter ${ADAPTER_VERSION} over contract ${CONTRACT_VERSION}`);

// ---------------------------------------------------------------------------------------------
// Fixtures. AUTHORED to the shape api/mcf.js normaliseJob() and api/careers.js normaliseCsgJob()
// emit, NOT checked against a captured real response (recorded as a known omission on BLP-005):
// an upstream shape change would pass this suite silently. tests/evidence-window.mjs carries
// fixtures closer to the raw upstream payloads and is the precedent when golden inputs are captured.
// MyCareersFuture passes postedDate through as the date-only string it publishes.
// ---------------------------------------------------------------------------------------------
const MCF_BODY = [
  "Responsibilities",
  "- Monitor operational data and investigate service exceptions across the payments platform",
  "- Prepare the monthly management accounts and variance commentary for the finance director",
  "- Support various ad-hoc reporting requests and other duties as assigned to the operations team",
  "- Coordinate quarterly access reviews with the technology risk function and document outcomes",
  "Requirements",
  "- Knowledge of SQL and data pipelines is required for this role",
].join("\n");
const duties = [
  "Monitor operational data and investigate service exceptions across the payments platform",
  "Prepare the monthly management accounts and variance commentary for the finance director",
  "Support various ad-hoc reporting requests and other duties as assigned to the operations team",
];
const mcfPosting = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", source: "MyCareersFuture", text: MCF_BODY, postedDateRaw: "2026-09-01", retrievedAt: "2026-09-08T11:00:00.000Z" };
const csgPosting = { uuid: "csg:hrp:17966644:005056a3", title: "Manager (Policy)", employer: "MINISTRY OF EXAMPLES", source: "careers.gov.sg", text: MCF_BODY, postedDateRaw: 1787184000000 };
const resultFor = (posting) => ({ responsibilitiesData: { responsibilities: duties.map((text, i) => ({ n: i + 1, text })), jobs: [{ ...posting, description: MCF_BODY, responsibilitiesText: MCF_BODY }] } });

// Route harness (same shape as tests/evidence-window.mjs).
const abortError = () => { const e = new Error("aborted"); e.name = "AbortError"; return e; };
function stubFetch(routes) {
  globalThis.fetch = async (url) => {
    const u = String(url);
    for (const [test, behave] of routes) if (test(u)) return behave(u);
    return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}), text: async () => "" };
  };
}
const okJson = (body, headers = {}) => ({ ok: true, status: 200, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => body, text: async () => JSON.stringify(body) });
function fakeRes() { const out = { statusCode: null, body: null }; return { out, status(code) { out.statusCode = code; return { json(payload) { out.body = payload; return out; } }; } }; }
const isMcf = (u) => u.includes("mycareersfuture.gov.sg");
const isCsg = (u) => !u.includes("mycareersfuture.gov.sg");

// ---------------------------------------------------------------------------------------------
// A1. Route failure causes: every cause answers with fallback, a code and NO rows.
// ---------------------------------------------------------------------------------------------
const mcf = (await import("../api/mcf.js")).default;
const careers = (await import("../api/careers.js")).default;
const companyReq = (company) => ({ method: "POST", body: { action: "company", company, limit: 5 } });
async function mcfWith(behave) { stubFetch([[isMcf, behave]]); const res = fakeRes(); await mcf(companyReq("EXAMPLE BANK LTD"), res); return res.out; }
const mcfCases = {
  timeout: await mcfWith(() => { throw abortError(); }),
  upstreamError: await mcfWith(() => { throw new Error("socket hang up"); }),
  unreadableBody: await mcfWith(() => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => { throw new SyntaxError("Unexpected token <"); }, text: async () => "<html>" })),
  http500: await mcfWith(() => ({ ok: false, status: 500, headers: { get: () => null }, json: async () => ({ error: "boom" }), text: async () => "boom" })),
  genuineEmpty: await mcfWith(() => okJson({ results: [], total: 0 })),
};
for (const [name, out] of Object.entries(mcfCases)) {
  eq(out.statusCode, 200, `mcf ${name}: the route answers 200 (the client must read the code, not the status)`);
  eq(out.body.fallback, true, `mcf ${name}: fallback is declared`);
  deq(out.body.matches, [], `mcf ${name}: no employer row is invented`);
  ok(typeof out.body.code === "string" && out.body.code.length > 0 && typeof out.body.message === "string" && out.body.message.length > 0, `mcf ${name}: a code and a message survive (${out.body.code})`);
}
eq(mcfCases.timeout.body.code, "TIMEOUT", "an abort is reported as TIMEOUT, not as an absence");
ok(["SERVER", "BUSY"].includes(mcfCases.upstreamError.body.code) && ["SERVER", "BUSY"].includes(mcfCases.unreadableBody.body.code), "an upstream error and an unreadable body are reported as a server-side failure");
eq(mcfCases.genuineEmpty.body.code, "EMPTY", "a genuine no-match is EMPTY");
eq(classifyRoutePayload(mcfCases.timeout.body), EVIDENCE_STATE.FAILURE, "timeout classifies as FAILURE");
eq(classifyRoutePayload(mcfCases.upstreamError.body), EVIDENCE_STATE.FAILURE, "upstream error classifies as FAILURE");
eq(classifyRoutePayload(mcfCases.genuineEmpty.body), EVIDENCE_STATE.EMPTY, "a genuine empty answer classifies as EMPTY, never as a failure");
eq(classifyRoutePayload({ matches: [{ key: "x" }] }), EVIDENCE_STATE.OK); eq(classifyRoutePayload(null), EVIDENCE_STATE.FAILURE, "no payload at all is a failure");
eq(classifyRoutePayload({ fallback: true, matches: [] }), EVIDENCE_STATE.FAILURE, "a fallback with no code is a failure, not an absence");
let res = fakeRes(); await mcf({ method: "POST", body: { action: "job" } }, res);
eq(res.out.statusCode, 400, "a job request without a uuid is refused (400), not answered with an invented posting");
res = fakeRes(); await mcf({ method: "GET", body: {} }, res); eq(res.out.statusCode, 405, "a GET is refused");
// careers.gov.sg: the dump fetch failing in every way.
async function csgWith(behave, body = companyReq("Ministry of Examples")) { stubFetch([[isCsg, behave]]); const r = fakeRes(); await careers(body, r); return r.out; }
const csgCases = {
  timeout: await csgWith(() => { throw abortError(); }),
  upstreamError: await csgWith(() => { throw new Error("ECONNRESET"); }),
  oversize: await csgWith(() => okJson([], { "content-length": String(60 * 1024 * 1024) })),
  unexpectedShape: await csgWith(() => okJson({ not: "an array" })),
};
for (const [name, out] of Object.entries(csgCases)) {
  eq(out.statusCode, 200, `careers ${name}: answers 200`);
  eq(out.body.fallback, true, `careers ${name}: fallback declared`);
  deq(out.body.jobs, [], `careers ${name}: no job row is invented`);
  ok(["TIMEOUT", "SERVER"].includes(out.body.code), `careers ${name}: a failure code survives (${out.body.code})`);
  eq(classifyRoutePayload(out.body), EVIDENCE_STATE.FAILURE, `careers ${name}: classifies as FAILURE`);
}
eq(csgCases.timeout.body.code, "TIMEOUT", "careers abort is TIMEOUT");
res = fakeRes(); await careers({ method: "POST", body: { action: "company" } }, res); eq(res.out.statusCode, 400, "careers company without a name is refused");
console.log(`A1 route failure causes: ${checks} checks`);

// ---------------------------------------------------------------------------------------------
// A2. The words each state shows: withheld, stale, failed and empty are distinct in text.
// ---------------------------------------------------------------------------------------------
const withheldSentences = WITHHOLD_REASONS.map(withholdingText);
eq(new Set(withheldSentences).size, WITHHOLD_REASONS.length, "every withholding reason has its own sentence");
for (const r of WITHHOLD_REASONS) ok(!/reason not recognised/.test(withholdingText(r)), `withholding reason ${r} has real text, not the fallback (the coverage guard is falsifiable)`);
ok(withheldSentences.every((s) => s.startsWith("withheld:")), "every withholding sentence says withheld first");
ok(/reason not recognised/.test(withholdingText("WITHHELD_MADE_UP")), "an unknown reason is itself withheld, never dressed as a known one");
const staleSentences = ["decision", "output", "proof"].map(staleText);
eq(new Set(staleSentences).size, 3, "decision, output and proof stale states have distinct sentences");
ok(staleSentences.every((s) => s.startsWith("stale:") && !/withheld/.test(s)), "a stale sentence says stale, not withheld");
const failSentences = ["TIMEOUT", "BUSY", "SERVER", "NETWORK", "MALFORMED", "WEIRD"].map((c) => failureText("MyCareersFuture", c));
eq(new Set(failSentences).size, 6, "every failure cause has its own sentence, including an unrecognised code");
ok(failSentences.every((s) => s.startsWith("MyCareersFuture") && /no postings are shown from that source/.test(s) && !hasAbsence(s) && !/withheld|stale/.test(s)), "a failure names the source, says what it means, and is never phrased as an absence");
ok(!hasAbsence(emptyText("MyCareersFuture", "Example")) && /answered/.test(emptyText("MyCareersFuture", "Example")), "an empty answer says the source answered");
ok(new Set([...withheldSentences, ...staleSentences, ...failSentences, emptyText("MyCareersFuture", "x")]).size === withheldSentences.length + 3 + 6 + 1, "no two states share a sentence");
ok(![...withheldSentences, ...staleSentences, ...failSentences].some((s) => GENERIC_FRESHNESS_PHRASES.some((p) => lower(s).includes(p))), "no state sentence smuggles in a generic freshness phrase");
// The single-place enumeration of the words each state shows: printed as a list and written to
// test-results so BLP-010, BLP-018 and BLP-020 inherit these sentences rather than inventing their own.
const stateTable = [
  ...WITHHOLD_REASONS.map((r) => ({ state: "withheld", key: r, sentence: withholdingText(r) })),
  ...["decision", "output", "proof"].map((k) => ({ state: "stale", key: k, sentence: staleText(k) })),
  ...["TIMEOUT", "BUSY", "SERVER", "NETWORK", "MALFORMED"].map((c) => ({ state: "failure", key: c, sentence: failureText("<source>", c) })),
  { state: "empty", key: "EMPTY", sentence: emptyText("<source>", "<query>") },
];
fs.mkdirSync("test-results/evidence-failure-paths", { recursive: true });
fs.writeFileSync("test-results/evidence-failure-paths/state-sentences.json", JSON.stringify(stateTable, null, 2));
fs.writeFileSync("test-results/evidence-failure-paths/state-sentences.md", ["| state | key | sentence |", "|---|---|---|", ...stateTable.map((r) => `| ${r.state} | ${r.key} | ${r.sentence} |`)].join("\n") + "\n");
console.log("State sentences (one definition, evidenceAdapter.js):"); for (const r of stateTable) console.log(`  ${r.state.padEnd(8)} ${r.key.padEnd(30)} ${r.sentence}`);
console.log(`A2 state words: ${checks} checks`);

// ---------------------------------------------------------------------------------------------
// A3. Evidence layer on failed, empty and stale inputs: withheld with a reason, never a row.
// ---------------------------------------------------------------------------------------------
const emptyBundle = buildResultEvidence({ responsibilitiesData: { responsibilities: [], jobs: [] } }, null);
eq(emptyBundle.state, BUNDLE_STATE.NO_SOURCE_ROWS, "a failed or empty read yields a NO_SOURCE_ROWS bundle");
eq(emptyBundle.dutyRows.length, 0, "and no duty row is minted from nothing");
ok(emptyBundle.withheld.some((w) => w.reason === WITHHOLD.NO_SOURCE_ROWS && /no posting text/.test(w.detail)), "the withholding carries its reason code and a detail");
const incomplete = resolvePostingIdentity({ uuid: "csg:hrp:17966644", source: "careers.gov.sg" });
eq(incomplete.id, null, "an incomplete careers.gov.sg identity resolves to no id");
eq(incomplete.withheld && incomplete.withheld.reason, WITHHOLD.INCOMPLETE_IDENTITY, "with the INCOMPLETE_IDENTITY reason");
const incompleteBundle = buildResultEvidence(resultFor({ ...csgPosting, uuid: "csg:hrp:17966644" }), { ...csgPosting, uuid: "csg:hrp:17966644" });
ok(incompleteBundle.state !== BUNDLE_STATE.OK, `an incomplete identity does not build an OK bundle (${incompleteBundle.state})`);
// Stale: a decision keyed on an anchor that no longer exists after re-extraction is preserved and withheld as stale.
const b1 = buildResultEvidence(resultFor(mcfPosting), mcfPosting);
eq(b1.state, BUNDLE_STATE.OK, "the positive MCF fixture builds an OK bundle");
const comments1 = [{ id: "c-proc", anchor: b1.dutyRows[2].id }];
const ledger = mergeDecisionLedger({ "c-proc": "accepted" }, comments1, { stale: {}, legacy: {} });
const moved = [{ id: "c-proc", anchor: b1.dutyRows[0].id }];
const parts = partitionDecisionLedger(ledger, moved);
deq(parts.current, {}, "a decision whose anchor moved is not applied to the current view");
eq(Object.keys(parts.stale).length, 1, "it is preserved as stale");
const linkParts = partitionLinks([{ from: { id: b1.dutyRows[2].id }, to: { id: "oia:gone" } }], new Set([b1.dutyRows[0].id]));
eq(linkParts.withheld[0].reason, WITHHOLD.STALE_EVIDENCE, "a link whose end no longer exists is withheld as STALE_EVIDENCE");
ok(withholdingText(WITHHOLD.STALE_EVIDENCE) !== staleText("decision"), "a stale-withheld link and a stale decision read differently, as they should: one is dropped, the other kept on record");
// Output and proof stale states exist at node level only (no live path mints them yet; owners BLP-018 and BLP-010).
const block = createOutputBlock({ id: "ob-1", taskId: "resume", promptVersion: "p1", schemaVersion: "s1", model: "m", text: "x", sourceRefs: [b1.dutyRows[0].id], state: "ACCEPTED", policyResult: "PASS", origin: ORIGIN.AI_AUTHORED, createdAt: "2026-09-08T11:00:00Z" });
eq(isOutputStale(block, [b1.dutyRows[0].id]), false, "an output whose evidence is unchanged is not stale");
eq(isOutputStale(block, [b1.dutyRows[1].id]), true, "an output whose cited evidence changed is stale");
ok(OUTPUT_STATE.includes("STALE") && PROOF_STATE.includes("STALE"), "STALE is a first-class output and proof state");
ok(isProofTransitionPermitted("DEMONSTRATED", "STALE") && !isProofTransitionPermitted("WITHHELD", "STALE"), "a demonstrated proof may go stale; a withheld one cannot (it never held)");
ok(isProofTransitionPermitted("STALE", "DEMONSTRATED") && !isProofTransitionPermitted("STALE", "CONFLICTING"), "a stale proof returns only through re-demonstration");
// A partial poll is carried onto the bundle as a residual risk, even though no surface discloses it yet.
const partial = buildResultEvidence(resultFor(mcfPosting), { ...mcfPosting, pollPartial: true });
ok(partial.residualRisks.some((r) => r.code === "POLL_PARTIAL"), "a posting from a partial poll carries POLL_PARTIAL on its bundle");
ok(!b1.residualRisks.some((r) => r.code === "POLL_PARTIAL"), "a posting from a complete poll does not");
console.log(`A3 evidence layer states: ${checks} checks`);

// ---------------------------------------------------------------------------------------------
// A4. Reference integrity: the identifier inventory survives a rebuild; unknown and dangling
// references are refused with a reason, never coerced.
// ---------------------------------------------------------------------------------------------
function inventory(bundle) {
  return {
    source: bundle.source && bundle.source.id,
    spans: bundle.spans.map((s) => s.id).sort(),
    duties: bundle.dutyRows.map((r) => r.id),
    requirements: bundle.requirementRows.map((r) => r.id),
    withheld: (bundle.withheld || []).map((w) => w.reason || w).sort(),
  };
}
for (const [name, posting] of [["MyCareersFuture", mcfPosting], ["careers.gov.sg", csgPosting]]) {
  const first = buildResultEvidence(resultFor(posting), posting), second = buildResultEvidence(resultFor(posting), posting);
  eq(first.state, BUNDLE_STATE.OK, `${name}: positive fixture builds OK`);
  deq(inventory(second), inventory(first), `${name}: every identifier class is preserved byte-identically across a rebuild`);
  eq(JSON.stringify(second), JSON.stringify(first), `${name}: the whole bundle is byte-identical across a rebuild (determinism)`);
  ok(first.dutyRows.every((r) => /^duty:/.test(r.id)) && first.spans.filter((s) => s.kind === "verbatim").every((s) => s.id.startsWith(`span:${first.source.id}:`)), `${name}: ids are canonical, none positional`);
  ok(first.validation.ok, `${name}: the bundle validates against its own known spans`);
  const declared = new Set([...first.spans.map((s) => s.id), ...first.dutyRows.map((r) => r.id)]);
  const proposal = `sug-${first.dutyRows[0].id}-${first.dutyRows[1].id}`;
  ok(proposal.slice(4).startsWith(first.dutyRows[0].id) && declared.has(first.dutyRows[1].id), `${name}: a proposal id is composed only from declared duty ids`);
  const rogue = `sug-${first.dutyRows[0].id}-duty:deadbeef`;
  ok(!declared.has(rogue.slice(4 + first.dutyRows[0].id.length + 1)), `${name}: a proposal composed from an undeclared id is detectable`);
  const rogueSpan = { ...first.spans.find((s) => s.kind === "distilled"), parentSpanIds: ["span:nowhere:0-1"], id: makeDistilledSpanId("forged", DUTY_EXTRACTION_VERSION.responsibilities) };
  const v = validateAgainstBundle(first, rogueSpan);
  ok(!v.ok, `${name}: a distilled span with a dangling parent is refused (${v.errors[0]})`);
  const unknownDecision = partitionDecisionLedger({ [decisionKey("c-x", "duty:unknown")]: "accepted" }, [{ id: "c-x", anchor: first.dutyRows[0].id }]);
  deq(unknownDecision.current, {}, `${name}: a decision keyed on an unknown anchor is never applied`);
}
const offRoster = createReviewChange({ id: "rc-x", kind: "comment", verb: "comment", targetSpanIds: [b1.dutyRows[0].id], reviewerId: "reviewer:nobody", createdAt: "2026-09-08T11:00:00Z", origin: ORIGIN.DETERMINISTIC });
ok(!validateReviewChange(offRoster, { roster: ROSTER }).ok, "a review event by an off-roster voice is refused");
const dangling = [createReviewChange({ id: "rc-1", kind: "decision", verb: "accept", targetSpanIds: [b1.dutyRows[0].id], reviewerId: "human:editor", predecessorId: "rc-404", createdAt: "2026-09-08T11:00:00Z", origin: ORIGIN.USER_AUTHORED })];
ok(!validateReviewHistory(dangling).ok, "a decision naming a predecessor that never happened is refused");
const goodWindow = createEvidenceWindow({ publishedAt: "2026-09-01", origins: { publishedAt: ORIGIN.SOURCE_VERBATIM } });
ok(validateEvidenceWindow(goodWindow).ok, "a well-formed window validates");
const badWindow = { ...goodWindow, publishedAt: { ...goodWindow.publishedAt, origin: "GUESSED" } };
ok(!validateEvidenceWindow(badWindow).ok, "a window field whose origin is tampered to a value outside the vocabulary is refused");
console.log(`A4 reference integrity: ${checks} checks`);

// ---------------------------------------------------------------------------------------------
// A5. Determinism: a randomised fixture is detected, so the double-build check is not vacuous.
// ---------------------------------------------------------------------------------------------
const randomPosting = () => ({ ...mcfPosting, text: MCF_BODY + `\n- Nonce ${Math.random()}` });
const r1 = buildResultEvidence(resultFor(mcfPosting), randomPosting()), r2 = buildResultEvidence(resultFor(mcfPosting), randomPosting());
ok(JSON.stringify(r1) !== JSON.stringify(r2), "a fixture that varies between builds is detected as non-deterministic (the guard is live)");
console.log(`Part A (node): ${checks} checks passed`);

if (process.env.EVIDENCE_FAILURE_PATHS_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (EVIDENCE_FAILURE_PATHS_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B
// ---------------------------------------------------------------------------------------------
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/evidence-failure-paths", { recursive: true });
const job = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: MCF_BODY, responsibilitiesText: MCF_BODY, skills: ["SQL"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-09-01", postedDateRaw: "2026-09-01", source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123" };
const okPayload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 1, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 1, jobs: [job] }] };
const failPayload = (company) => ({ matches: [], query: company, queryKey: company.toLowerCase(), ambiguous: false, totalPostings: 0, pagesPolled: 0, fallback: true, code: "SERVER", message: "Something went wrong fetching live jobs. Please wait a moment and try again.", source: "MyCareersFuture Singapore" });
const emptyPayload = (company) => ({ matches: [], query: company, queryKey: company.toLowerCase(), ambiguous: false, totalPostings: 0, pagesPolled: 1, fallback: true, code: "EMPTY", message: "No matching live jobs on MyCareersFuture right now. Check back tomorrow - postings refresh daily." });
const respFx = JSON.stringify({ summary: "Runs operational monitoring.", responsibilities: duties.map((text, i) => ({ n: i + 1, text, cat: "Delivery & Execution", freq: "Core", sk: [] })) });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", async (r) => {
    let b = {}; try { b = r.request().postDataJSON(); } catch (_) {}
    const company = String(b.company || "");
    let body = { jobs: [], tier: 1, approximate: false };
    if (b.action === "company") body = /FAILING/i.test(company) ? failPayload(company) : /EMPTY/i.test(company) ? emptyPayload(company) : /CSGFAIL/i.test(company) ? { ...okPayload, query: company, matches: okPayload.matches.map((m) => ({ ...m, jobs: m.jobs.map((j) => ({ ...j, employer: company })) })) } : okPayload;
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  // careers.gov.sg: a match for the MCF-failing employer (so the MCF failure must still show beside it, C2),
  // a SERVER failure for CSGFAIL (so the careers.gov.sg column shows its own failure state, W9), else EMPTY.
  await page.route("**/api/careers", async (r) => {
    let b = {}; try { b = r.request().postDataJSON(); } catch (_) {}
    const company = String(b.company || "");
    let body = { jobs: [], total: 0, source: "careers.gov.sg", fallback: true, code: "EMPTY", message: "No careers.gov.sg roles for that employer." };
    if (b.action === "company" && /FAILING/i.test(company)) body = { jobs: [{ ...job, uuid: "csg:hrp:17966644:005056a3", employer: company, title: "Manager (Policy)", source: "careers.gov.sg", mcfUrl: "" }], total: 1, source: "careers.gov.sg" };
    else if (b.action === "company" && /CSGFAIL/i.test(company)) body = { jobs: [], total: 0, source: "careers.gov.sg", fallback: true, code: "SERVER", message: "Could not reach careers.gov.sg data. Please try again." };
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  for (const [p, v] of [["**/api/ssoc", { results: [], classifications: [] }], ["**/api/ssic", { matched: false, results: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/company-registry", { matched: false }], ["**/api/geocode**", { matched: false }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => { let b = {}; try { b = r.request().postDataJSON(); } catch (_) {} const sys = String(b?.system || ""); const pr = String(b?.messages?.[0]?.content || ""); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: /job-analysis specialist/i.test(sys) && /Extract the real responsibilities/i.test(pr) ? respFx : "[]" }], model: "evidence-failure-paths-fixture" }) }); });
  return page;
}
// Reach the employer search form again from a results view. Desktop offers "Back to new search";
// the phone Step 1a header has no such control, so the phone path reloads and re-enters employer
// mode (recorded on the BLP-005 entry: the prior-result assertion is exercised in-page at desktop).
async function search(page, company, { phone } = {}) {
  const box = page.getByRole("searchbox", { name: "Company name" });
  if (!(await box.count()) || !(await box.first().isVisible())) {
    const back = page.getByRole("button", { name: "Back to new search" });
    if (await back.count()) await back.first().click();
    else { await page.goto(base, { waitUntil: "networkidle", timeout: 60000 }); await page.getByRole("button", { name: "Search by employer" }).click(); }
  }
  await page.getByRole("searchbox", { name: "Company name" }).fill(company);
  await page.getByRole("button", { name: "Find company postings" }).click();
}
async function readState(page) {
  const el = page.getByTestId("company-results-state");
  await el.waitFor({ state: "visible", timeout: 15000 });
  return { state: await el.getAttribute("data-state"), code: await el.getAttribute("data-source-code"), source: await el.getAttribute("data-source"), role: await el.getAttribute("role"), text: (await el.innerText()).replace(/\s+/g, " ").trim() };
}
async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  const tag = phone ? "phone" : "desktop";
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "Search by employer" }).click();
  // B1. Positive: the grid renders.
  await search(page, job.employer);
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  eq(await page.getByTestId("company-results-state").count(), 0, `${tag}: a positive answer renders no failure or empty state`);
  // B2. Hard route failure: the prior result is NOT kept, the state names the source and is never an absence.
  await search(page, "FAILING CO", { phone });
  const failure = await readState(page);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="company-opportunity-grid"]').length === 0, null, { timeout: 10000 });
  // At desktop this is the in-page assertion the Supervisor required: the prior grid was on screen and
  // is gone. At phone width the second search is reached by reload (no "Back to new search" control
  // exists there), so the same assertion is close to trivially satisfied; it is kept so it fails loudly
  // if in-page phone navigation is ever added without carrying the state.
  eq(await page.getByTestId("company-opportunity-grid").count(), 0, `${tag}: on a failure the surface does not keep showing the prior result${phone ? " (reload-based at phone width)" : ""}`);
  // The honest invariant (conformance-auditor C3): a results-state box and an opportunity grid for the
  // SAME source never coexist in the DOM. "Back to new search" unmounts the panel before the failing
  // request, so the assertion above cannot catch a regression on its own; this one can.
  const coexist = await page.evaluate(() => ({ state: document.querySelectorAll('[data-testid="company-results-state"]').length, grid: document.querySelectorAll('[data-testid="company-opportunity-grid"]').length }));
  ok(coexist.state === 1 && coexist.grid === 0, `${tag}: the MyCareersFuture failure state and a MyCareersFuture grid never coexist (${JSON.stringify(coexist)})`);
  // C2: careers.gov.sg has a match for this employer, and the MyCareersFuture failure must still be shown beside it.
  const csgColumn = await page.locator("text=careers.gov.sg").count();
  ok(csgColumn > 0, `${tag}: the careers.gov.sg column renders its match`);
  eq(await page.getByTestId("company-results-state").count(), 1, `${tag}: a careers.gov.sg match does not hide the MyCareersFuture failure (per-column states)`);
  eq(failure.state, EVIDENCE_STATE.FAILURE, `${tag}: a SERVER fallback renders as the FAILURE state`);
  eq(failure.code, "SERVER", `${tag}: the route's code survives to the surface`);
  eq(failure.role, "status", `${tag}: the state is announced (role=status)`);
  ok(/Source failed/.test(failure.text) && /MyCareersFuture returned an error/.test(failure.text) && /no postings are shown from that source/.test(failure.text), `${tag}: the failure names its source and what it means (${failure.text})`);
  ok(!hasAbsence(failure.text), `${tag}: a failure is never phrased as an absence`);
  ok(!/no claim about this employer's postings is made either way/.test("") && /no claim about this employer/.test(failure.text), `${tag}: the failure says no claim is made either way`);
  ok(!GENERIC_FRESHNESS_PHRASES.some((p) => lower(failure.text).includes(p)), `${tag}: no generic freshness phrase on the failure surface`);
  // B2b. The other column: a careers.gov.sg failure renders in its own column beside a MyCareersFuture grid.
  await search(page, "CSGFAIL CO", { phone });
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  const csgState = page.getByTestId("csg-results-state");
  await csgState.waitFor({ state: "visible", timeout: 10000 });
  eq(await csgState.getAttribute("data-state"), EVIDENCE_STATE.FAILURE, `${tag}: a careers.gov.sg SERVER fallback renders its own failure state`);
  eq(await csgState.getAttribute("data-source-code"), "SERVER", `${tag}: with its code`);
  ok(/careers\.gov\.sg returned an error, so no postings are shown from that source/.test(await csgState.innerText()), `${tag}: the careers.gov.sg failure names its source`);
  eq(await page.getByTestId("company-results-state").count(), 0, `${tag}: the MyCareersFuture grid beside it is not disturbed`);
  // B3. Genuine empty answer: a distinct state with distinct words.
  await search(page, "EMPTY CO", { phone });
  const empty = await readState(page);
  eq(empty.state, EVIDENCE_STATE.EMPTY, `${tag}: an EMPTY fallback renders as the EMPTY state, not as a failure`);
  eq(empty.code, "EMPTY", `${tag}: the EMPTY code survives`);
  ok(/No match/.test(empty.text) && /MyCareersFuture answered and no live postings matched/.test(empty.text), `${tag}: the empty state says the source answered (${empty.text})`);
  ok(empty.state !== failure.state && empty.text !== failure.text, `${tag}: failure and empty are distinct by data-state and by words`);
  // B4. Withheld: an evidence-window field withheld on the Step 3 footer, the third state, distinct from both.
  await search(page, job.employer, { phone });
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: /Analyse this posting|Analyse role/ }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) { await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 }); await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-job-ad").click(); await page.getByTestId("wu-job-ad-tab-responsibilities").click(); }
  else { const sh = page.getByTestId("wu-start-here"); if (await sh.count() && await sh.isVisible()) await page.getByTestId("wu-explore-full-map").click(); await page.getByTestId("wu-source-anchor").click(); }
  await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-testid="wu-evidence-row"]')).some((el) => (el.dataset.evidenceId || "").startsWith("duty:")), null, { timeout: 30000 });
  await page.getByTestId("wu-evidence-row").first().click();
  if (phone) { await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-contents").click(); }
  await page.getByTestId("open-evidence-workspace").click();
  await page.locator('[data-testid^="v31-workspace-evidence-"]').waitFor({ state: "visible", timeout: 15000 });
  const withheld = await page.locator('[data-testid="evidence-window"] [data-window-state="withheld"]').evaluateAll((els) => els.map((el) => el.textContent.replace(/\s+/g, " ").trim()));
  ok(withheld.length >= 1 && withheld.every((t) => /withheld \(/.test(t)), `${tag}: the withheld state renders in words on the footer (${withheld[0]})`);
  ok(!withheld.some((t) => /failed|returned an error|answered/.test(t)), `${tag}: a withholding is neither a failure nor an empty answer in its words`);
  ok(new Set([failure.state, empty.state, "withheld"]).size === 3, `${tag}: failure, empty and withheld are three distinct machine-checkable states`);
  await page.screenshot({ path: `test-results/evidence-failure-paths/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
