// BLP-003 evidence round trip: identity that survives every transition.
//
// Part A (node, no server): the evidence adapter over recorded posting fixtures - offsets
// against the canonical text, re-extraction, incomplete synthetic identity, completeness
// never inferred, caps recorded, legacy ledgers withheld rather than re-anchored, and the
// negative paths (dangling parents, forged trust).
//
// Part B (Chromium against BASE_URL), run at a desktop viewport (1440x1000) AND a phone
// viewport (430x932, panel navigator) as instructions section 9 item 8 requires for user-facing
// work: the same identity carried Step 2 -> Step 3 -> Work Universe source row -> Review Studio
// workspace -> return, and again across a FULL remount
// (page reload and re-analysis): the row id is byte-identical, a decision made in the first
// mount is restored in the second under its comment@anchor key, and pre-BLP-003 ledger rows
// are preserved and reported as withheld, never remapped.
//
// Run: node tests/evidence-round-trip.mjs           (BASE_URL defaults to http://127.0.0.1:4173)
//      EVIDENCE_ROUND_TRIP_NODE_ONLY=1 node tests/evidence-round-trip.mjs   (Part A only, local)

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ADAPTER_VERSION,
  DUTY_EXTRACTION_VERSION,
  DUTY_ROW_CAP,
  BUNDLE_STATE,
  buildPostingEvidence,
  buildResultEvidence,
  decisionKey,
  isLegacyEvidenceId,
  locateVerbatim,
  mergeDecisionLedger,
  partitionDecisionLedger,
  partitionLinks,
  resolvePostingIdentity,
  selectDutyRows,
  validateAgainstBundle,
} from "../src/contracts/evidenceAdapter.js";
import {
  CONTRACT_VERSION,
  ORIGIN,
  WITHHOLD,
  createDistilledSpan,
  isDistilledSpanTrusted,
  makeDistilledSpanId,
  sha256Hex,
  validateEvidenceBundle,
} from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };

// ---------------------------------------------------------------------------------------------
// Recorded fixtures. Shapes follow api/mcf.js normaliseJob() and api/careers.js
// normaliseCsgJob(): responsibilitiesText is the HTML-cleaned responsibilities section (what
// Step 2 hands to Step 3 as posting.text), description is the raw body.
// ---------------------------------------------------------------------------------------------
const MCF_BODY = [
  "Responsibilities",
  "- Monitor operational data and investigate service exceptions across the payments platform",
  "- Prepare the monthly management accounts and variance commentary for the finance director",
  "- Support various ad-hoc reporting requests and other duties as assigned to the operations team",
  "- Coordinate quarterly access reviews with the technology risk function and document outcomes",
  "Requirements",
  "- Knowledge of SQL and data pipelines is required for this role",
  "- Degree in accountancy, business or a related discipline",
  "- At least three years in an operations or finance operations role",
  "Benefits",
  "- Hybrid working arrangement with two office days a week",
].join("\n");

const mcfPosting = {
  uuid: "MCF-2026-000123",
  title: "Operations Analyst",
  employer: "EXAMPLE BANK LTD",
  source: "MyCareersFuture",
  mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123",
  text: MCF_BODY,
};

const csgPosting = {
  uuid: "csg:careers:JOB-7781:1",
  title: "Manager (Policy)",
  employer: "MINISTRY OF EXAMPLES",
  source: "careers.gov.sg",
  text: MCF_BODY,
};

const duties = [
  { n: 1, text: "Monitor operational data and investigate service exceptions across the payments platform" },
  { n: 2, text: "Prepare the monthly management accounts and variance commentary for the finance director" },
  { n: 3, text: "Support various ad-hoc reporting requests and other duties as assigned to the operations team" },
  { n: 4, text: "Automate exception triage so the team can focus on root causes" }, // paraphrase: not in the ad
];
const result = { responsibilitiesData: { responsibilities: duties, jobs: [{ ...mcfPosting, description: MCF_BODY, responsibilitiesText: MCF_BODY }] } };

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
console.log(`evidence-round-trip: adapter ${ADAPTER_VERSION} over contract ${CONTRACT_VERSION}`);

// A1. Positive round trip: canonical text, offsets, hashes, validation, stability.
const b1 = buildResultEvidence(result, mcfPosting);
eq(b1.state, BUNDLE_STATE.OK, "MCF posting with duties builds an OK bundle");
eq(b1.source.id, "src:mycareersfuture:MCF-2026-000123", "source id derives from the native uuid");
ok(b1.validation.ok, `bundle validates with knownSpans: ${b1.validation.errors.join("; ")}`);
eq(sha256Hex(b1.source.text), b1.source.textHash, "source text hash matches canonical text");
const verbatim = b1.spans.filter((s) => s.kind === "verbatim");
ok(verbatim.length >= 12, "one verbatim span per line plus the body span");
verbatim.forEach((s) => {
  eq(s.text, b1.source.text.slice(s.start, s.end), `verbatim ${s.id} equals its canonical slice`);
  eq(s.sourceTextHash, b1.source.textHash, `verbatim ${s.id} carries the source text hash`);
  eq(s.id, `span:${b1.source.id}:${s.start}-${s.end}`, "verbatim id is offset-addressed");
});
const b1again = buildResultEvidence(result, mcfPosting);
deq(b1again.dutyRows.map((r) => r.id), b1.dutyRows.map((r) => r.id), "duty ids are byte-identical across two builds of the same fixture");
deq(b1again.spans.map((s) => s.id), b1.spans.map((s) => s.id), "span ids are byte-identical across two builds");
eq(b1.dutyBasis, "responsibilities", "duty basis recorded");
eq(b1.extractionVersion, DUTY_EXTRACTION_VERSION.responsibilities, "extraction version recorded");

// A2. Parentage: verbatim duties are DETERMINISTIC/VERIFIED and point at their line; the
// paraphrase is AI_ASSISTED/UNVERIFIED, points at the body, and is never trusted.
const [d1, d2, d3, d4] = b1.dutyRows;
[d1, d2, d3].forEach((r) => {
  eq(r.kind, "distilled", `${r.text.slice(0, 30)} is a distilled span`);
  eq(r.derivationState, "VERIFIED", "verbatim duty is VERIFIED");
  eq(r.span.origin, ORIGIN.DETERMINISTIC, "verbatim duty is DETERMINISTIC");
  ok(r.trusted, "verbatim duty is trusted with knownSpans");
  const parent = b1.byId[r.parentSpanIds[0]];
  ok(parent && parent.kind === "verbatim" && parent.role === "line", "parent is a canonical line span");
  ok(parent.text.includes(r.text), "parent line contains the duty text");
});
eq(d4.derivationState, "UNVERIFIED", "paraphrased duty is UNVERIFIED");
eq(d4.span.origin, ORIGIN.AI_ASSISTED, "paraphrased duty is AI_ASSISTED");
eq(d4.parentSpanIds[0], b1.bodySpan.id, "paraphrased duty names the body span as its parent, never a guessed line");
ok(!d4.trusted, "paraphrased duty is not trusted");
ok(!isDistilledSpanTrusted(d4.span, { knownSpans: b1.knownSpans }), "contract agrees: UNVERIFIED is not citable");
ok(b1.dutyRows.every((r) => !isLegacyEvidenceId(r.id)), "no positional ids on an OK bundle");

// A3. Requirement lines: located verbatim (offset ids), Requirements + Benefits, layer kept.
ok(b1.requirementRows.length === 4, `four requirement/benefit rows located (${b1.requirementRows.length})`);
b1.requirementRows.forEach((r) => {
  eq(r.kind, "verbatim", "requirement row is a verbatim span");
  eq(r.text, b1.source.text.slice(r.span.start, r.span.end), "requirement row text is its canonical slice");
});
deq(b1.requirementRows.map((r) => r.layer), ["requirements", "requirements", "requirements", "benefits"], "section layers retained");
eq(locateVerbatim(b1.source, "This sentence is not in the advertisement"), null, "text absent from the source is not located (no span invented)");

// A4. Re-extraction: bump the version on the same fixture. New duty ids, identical parents,
// and a decision keyed on an old id goes stale (preserved, not carried).
const b2 = buildPostingEvidence({ posting: mcfPosting, duties, extractionVersion: "rd-2" });
ok(b2.validation.ok, "re-extracted bundle validates");
b2.dutyRows.forEach((r, i) => {
  ok(r.id !== b1.dutyRows[i].id, `duty ${i} id changes with the extraction version`);
  deq(r.parentSpanIds, b1.dutyRows[i].parentSpanIds, `duty ${i} parents are byte-identical`);
});
deq(b2.spans.filter((s) => s.kind === "verbatim").map((s) => s.id), b1.spans.filter((s) => s.kind === "verbatim").map((s) => s.id), "verbatim spans do not move on re-extraction");
const comments1 = [{ id: "c-proc", anchor: d3.id }];
const comments2 = [{ id: "c-proc", anchor: b2.dutyRows[2].id }];
const ledger1 = mergeDecisionLedger({ "c-proc": "accepted" }, comments1, { stale: {}, legacy: {} });
deq(Object.keys(ledger1), [decisionKey("c-proc", d3.id)], "decision is persisted under comment@anchor");
const parts2 = partitionDecisionLedger(ledger1, comments2);
deq(parts2.current, {}, "old-anchored decision does not carry forward to the re-extracted duty");
eq(parts2.withheldCount, 1, "it is counted as withheld");
deq(parts2.stale, ledger1, "and preserved verbatim");
const ledger2 = mergeDecisionLedger({ "c-proc": "rejected" }, comments2, parts2);
eq(Object.keys(ledger2).length, 2, "re-affirmed decision is appended; the stale row stays");
eq(ledger2[decisionKey("c-proc", d3.id)], "accepted", "stale row unchanged");
eq(ledger2[decisionKey("c-proc", b2.dutyRows[2].id)], "rejected", "new row under the new anchor");

// A5. Legacy (pre-BLP-003) ledgers: no anchor part -> withheld, preserved; positional links withheld.
const legacyParts = partitionDecisionLedger({ "c-proc": "accepted", "c-ai": "rejected" }, comments1);
deq(legacyParts.current, {}, "legacy decisions are never applied to canonical anchors");
eq(legacyParts.withheldCount, 2, "both legacy decisions are reported as withheld");
const legacyMerge = mergeDecisionLedger({}, comments1, legacyParts);
deq(legacyMerge, { "c-proc": "accepted", "c-ai": "rejected" }, "legacy rows are written back unchanged");
const links = [
  { id: "lnk-1", from: { t: "duty", id: "s0", quote: "x" }, to: { t: "oia", id: "s0", quote: "x" }, locked: true },
  { id: "lnk-2", from: { t: "duty", id: d1.id, quote: d1.text }, to: { t: "oia", id: d2.id, quote: d2.text }, locked: true },
  { id: "lnk-3", from: { t: "phrase", block: d1.id, quote: "operational data" }, to: { t: "oia", id: d1.id, quote: d1.text }, locked: true },
];
const linkParts = partitionLinks(links, b1.dutyRows.map((r) => r.id));
deq(linkParts.current.map((l) => l.id), ["lnk-2", "lnk-3"], "links on current ids stay current (element and phrase anchors)");
eq(linkParts.withheld.length, 1, "the positional link is withheld");
eq(linkParts.withheld[0].reason, WITHHOLD.STALE_EVIDENCE, "with a reason code");
ok(linkParts.withheld[0].legacyIdentity, "and flagged as legacy positional identity");
eq(linkParts.withheld[0].link, links[0], "the withheld link object is preserved by reference");

// A6. Incomplete synthetic identity through the adapter: no degenerate csg id anywhere.
const csgOk = buildPostingEvidence({ posting: csgPosting, duties });
eq(csgOk.state, BUNDLE_STATE.OK, "complete csg identity builds");
eq(csgOk.source.id, "src:csg:careers:JOB-7781:1", "csg source id has every component");
for (const bad of ["csg:careers::1", "csg:careers:JOB-7781:", "csg:::", "csg:careers:JOB-7781"]) {
  const b = buildPostingEvidence({ posting: { ...csgPosting, uuid: bad }, duties });
  eq(b.state, BUNDLE_STATE.INCOMPLETE_IDENTITY, `${bad} is withheld as WITHHELD_INCOMPLETE_IDENTITY`);
  eq(b.source, null, "no source is minted");
  ok(!JSON.stringify(b).includes("src:csg:"), "no csg source id appears anywhere in the bundle");
  ok(b.dutyRows.every((r) => r.identity === WITHHOLD.INCOMPLETE_IDENTITY), "every row says why it carries a positional id");
  eq(b.spans[0].reason, WITHHOLD.INCOMPLETE_IDENTITY, "the withheld set names the reason");
}
eq(resolvePostingIdentity({ uuid: "", source: "MyCareersFuture" }).id, null, "empty MCF uuid is withheld too");

// A7. Completeness is UNKNOWN, never inferred - even at exactly the route cap length.
const exactCap = "Responsibilities\n" + "- Reconcile ledgers daily. ".repeat(200);
const capped = exactCap.slice(0, 4000);
eq(capped.length, 4000, "fixture is exactly DESC_CAP long");
const bCap = buildPostingEvidence({ posting: { ...mcfPosting, text: capped }, duties: [] });
eq(bCap.source.completeness, "UNKNOWN", "completeness stays UNKNOWN at cap length");
eq(bCap.source.truncation, null, "TRUNCATED is not inferred");
ok(bCap.withheld.some((w) => w.field === "completeness" && w.reason === WITHHOLD.UNAVAILABLE_FIELD), "completeness is recorded as withheld");
ok(bCap.residualRisks.some((r) => r.code === "COMPLETENESS_UNKNOWN"), "the omission is a named residual risk on the bundle");
ok(bCap.withheld.some((w) => w.field === "retrievedAt"), "retrievedAt is withheld when Step 2 did not supply it");

// A8. No source: the explicit WITHHELD_NO_SOURCE_ROWS state, positional ids flagged.
for (const noSource of [null, {}, { ...mcfPosting, text: "" }, { ...mcfPosting, text: "   \n  " }]) {
  const b = buildResultEvidence(result, noSource);
  eq(b.state, BUNDLE_STATE.NO_SOURCE_ROWS, "no posting text -> WITHHELD_NO_SOURCE_ROWS");
  ok(b.legacy, "bundle is marked legacy");
  eq(b.spans[0].reason, WITHHOLD.NO_SOURCE_ROWS, "the withheld set is addressable");
  ok(b.dutyRows.every((r) => isLegacyEvidenceId(r.id) && r.identity === WITHHOLD.NO_SOURCE_ROWS), "positional ids carry the withheld reason");
}
const noDuties = buildResultEvidence({}, mcfPosting);
eq(noDuties.state, BUNDLE_STATE.OK, "a posting with no duties yet is still an OK source");
eq(noDuties.dutyRows.length, 0, "with zero duty rows");
eq(selectDutyRows({}).basis, null, "and a null duty basis");

// A9. Caps are recorded, by content id and never by position; duplicates collapse.
const many = Array.from({ length: 20 }, (_, i) => ({ text: `Duty number ${i + 1} for the cap fixture` }));
const bMany = buildPostingEvidence({ posting: mcfPosting, duties: many });
eq(bMany.dutyRows.length, DUTY_ROW_CAP, "duty rows are capped");
ok(bMany.dutyCap && bMany.dutyCap.reason === WITHHOLD.CAP_EXCEEDED && bMany.dutyCap.droppedCount === 20 - DUTY_ROW_CAP, "the cap is recorded with a count");
ok(bMany.dutyCap.droppedIds.every((id) => id.startsWith("duty:")), "dropped rows are named by content id");
ok(bMany.withheld.some((w) => w.field === "dutyRows" && w.reason === WITHHOLD.CAP_EXCEEDED), "and listed under withheld");
const bDup = buildPostingEvidence({ posting: mcfPosting, duties: [duties[0], duties[0], duties[1]] });
eq(bDup.dutyRows[1].id, bDup.dutyRows[0].id, "duplicate duty text collapses onto one content-addressed id");
eq(bDup.dutyRows[1].duplicateOf, 0, "and records which row it duplicates");
ok(bDup.validation.ok, "no duplicate span id enters the bundle");
const bEmptyDuty = buildPostingEvidence({ posting: mcfPosting, duties: [{ text: "" }, "  "] });
ok(bEmptyDuty.dutyRows.every((r) => r.kind === "withheld" && r.identity === WITHHOLD.NO_PARENT_SPAN), "empty duty text is withheld, not given an id");

// A10. Negative: dangling parents and forged trust are refused against the bundle.
const dangling = createDistilledSpan({ text: "Reconcile the suspense account weekly", extractionVersion: "rd-1", parentSpanIds: ["span:src:mycareersfuture:MCF-2026-000123:9999-10000"], sourceId: b1.source.id, origin: ORIGIN.DETERMINISTIC });
const dv = validateAgainstBundle(b1, dangling);
ok(!dv.ok && dv.errors.some((e) => /dangling/.test(e)), "a distilled span with an unknown parent is rejected");
const forged = { ...d4.span, derivationState: "VERIFIED" };
ok(!isDistilledSpanTrusted(forged, { knownSpans: b1.knownSpans }), "a forged VERIFIED state is not trusted");
ok(!validateAgainstBundle(b1, forged).ok, "and fails validation");
const fabricated = createDistilledSpan({ text: "Approve all vendor payments personally", extractionVersion: "rd-1", parentSpanIds: [b1.bodySpan.id], sourceId: b1.source.id, origin: ORIGIN.DETERMINISTIC });
ok(!validateAgainstBundle(b1, fabricated).ok, "a DETERMINISTIC claim whose text is not in its parent is rejected");
const foreignSource = { ...b1.source, text: b1.source.text + " tampered", textHash: sha256Hex(b1.source.text + " tampered") };
ok(!validateEvidenceBundle({ source: foreignSource, spans: b1.spans }).ok, "spans do not validate against altered source text (hash and slice checks fail)");
eq(makeDistilledSpanId(d1.text, "rd-1"), d1.id, "duty id is reproducible from text and extraction version alone");

// A11. Job Anatomy takes precedence when present, under its own extraction version.
const jaResult = { ...result, jobAnatomy: { duties: [{ text: duties[1].text, exposureNow: "augmented" }] } };
const bJa = buildResultEvidence(jaResult, mcfPosting);
eq(bJa.dutyBasis, "jobAnatomy", "job anatomy wins the duty basis");
eq(bJa.extractionVersion, DUTY_EXTRACTION_VERSION.jobAnatomy, "under the ja extraction version");
ok(bJa.dutyRows[0].id !== d2.id, "the same text under a different pipeline is a different id");
eq(bJa.dutyRows[0].parentSpanIds[0], d2.parentSpanIds[0], "but the verbatim parent is the same span");

console.log(`Part A (node): ${checks} checks passed`);

// ---------------------------------------------------------------------------------------------
// Part B (browser)
// ---------------------------------------------------------------------------------------------
if (process.env.EVIDENCE_ROUND_TRIP_NODE_ONLY === "1") {
  console.log("Part B (browser): NOT_RUN (EVIDENCE_ROUND_TRIP_NODE_ONLY=1)");
  process.exit(0);
}

const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/evidence-round-trip", { recursive: true });

const browserJobs = [{
  uuid: mcfPosting.uuid,
  title: mcfPosting.title,
  employer: mcfPosting.employer,
  description: MCF_BODY,
  responsibilitiesText: MCF_BODY,
  skills: ["Data Analytics", "SQL", "Operations"],
  categories: ["Banking and Finance"],
  employmentType: "Permanent",
  positionLevels: ["Professional"],
  salaryMin: 5000,
  salaryMax: 7000,
  postedDate: new Date(Date.UTC(2026, 8, 1)).toISOString(),
  source: "MyCareersFuture",
  mcfUrl: mcfPosting.mcfUrl,
}];
const companyPayload = {
  query: mcfPosting.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 1, pagesPolled: 1,
  matches: [{ key: "example bank ltd", displayName: mcfPosting.employer, name: mcfPosting.employer, count: 1, jobs: browserJobs }],
};
const responsibilitiesFixture = JSON.stringify({
  summary: "Runs operational monitoring and finance reporting for the payments platform.",
  responsibilities: duties.map((d) => ({ n: d.n, text: d.text, cat: "Delivery & Execution", freq: "Core", sk: [] })),
});

const expectedDuty = makeDistilledSpanId(duties[2].text, DUTY_EXTRACTION_VERSION.responsibilities); // the vague-ownership duty c-proc anchors on
const expectedFirst = makeDistilledSpanId(duties[0].text, DUTY_EXTRACTION_VERSION.responsibilities);

// CI installs the pinned Chromium; a local runner may point at its own binary instead.
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", async (route) => {
    let body = {}; try { body = route.request().postDataJSON(); } catch (_) {}
    if (body.action === "company") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(companyPayload) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [], tier: 1, approximate: false }) });
  });
  for (const [path, payload] of [
    ["**/api/careers", { jobs: [], total: 0 }],
    ["**/api/ssoc", { results: [], classifications: [] }],
    ["**/api/ssic", { matched: false, results: [] }],
    ["**/api/esco", { occupations: [], skills: [] }],
    ["**/api/anatomy", { ok: true, found: false, data: null }],
    ["**/api/company-registry", { matched: false }],
    ["**/api/geocode**", { matched: false }],
    ["**/api/state**", { ok: false, kv: false }],
  ]) await page.route(path, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.route("**/api/claude", async (route) => {
    let body = null; try { body = route.request().postDataJSON(); } catch (_) { body = {}; }
    const system = String(body?.system || "");
    const prompt = String(body?.messages?.[0]?.content || "");
    let text = "[]";
    if (/job-analysis specialist/i.test(system) && /Extract the real responsibilities/i.test(prompt)) text = responsibilitiesFixture;
    // Layer-3 proposal judge: echo the engine's own candidate pairs back as related, so the
    // product composes proposal ids ("sug-" + fromId + "-" + toId) from canonical ids.
    else if (/two short work phrases refer to related work/i.test(system) && /Candidate pairs:/.test(prompt)) {
      try { const pairs = JSON.parse(prompt.slice(prompt.indexOf("[")));
        text = JSON.stringify(pairs.slice(0, 3).map((p) => ({ fromId: p.fromId, toId: p.toId, related: true, strength: "strong" }))); } catch (_) { text = "[]"; }
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "evidence-round-trip-fixture" }) });
  });
  return page;
}

async function analyseFixturePosting(page, phone) {
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "Search by employer" }).click();
  await page.getByRole("searchbox", { name: "Company name" }).fill(mcfPosting.employer);
  await page.getByRole("button", { name: "Find company postings" }).click();
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: /Analyse this posting|Analyse role/ }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) {
    // Phone: the panel navigator (quick FAB) reaches the source panel; the job-ad tabs pick the duties.
    await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 });
    await page.getByTestId("wu-quick-fab").click();
    await page.getByTestId("wu-quick-job-ad").click();
    await page.getByTestId("wu-job-ad-tab-responsibilities").click();
  } else {
    // The start-here guidance overlays the map until the full map is requested (as the gate does).
    const startHere = page.getByTestId("wu-start-here");
    if (await startHere.count() && await startHere.isVisible()) await page.getByTestId("wu-explore-full-map").click();
    await page.getByTestId("wu-source-anchor").click();
  }
  const rows = page.getByTestId("wu-evidence-row");
  await rows.first().waitFor({ state: "visible", timeout: 30000 });
  // Duty rows arrive when the responsibilities fixture lands; wait for canonical ids.
  await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-testid="wu-evidence-row"]')).some((el) => (el.dataset.evidenceId || "").startsWith("duty:")), null, { timeout: 30000 });
  return rows;
}

// The walk below runs once per viewport. Every assertion is the same at both widths.
async function openEvidenceWorkspace(page, phone) {
  if (phone) { await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-contents").click(); }
  await page.getByTestId("open-evidence-workspace").click();
}
// Comment cards, the locked-links strip and the AI-suggested proposals live on the six-view
// analysis surface, reached through the workspace navigator ("More analysis").
async function openAnalysisSurface(page) {
  await page.getByRole("button", { name: "Open the workspace navigator" }).click();
  await page.getByRole("menuitem", { name: /More analysis/ }).click();
  await page.getByRole("tablist", { name: "Analysis views" }).waitFor({ state: "visible", timeout: 15000 });
}
async function openCommentsWindow(page) {
  await page.getByRole("tablist", { name: "right panel windows" }).getByRole("tab", { name: "Comments" }).click();
}
async function readCommentAnchors(page) {
  return page.locator("[data-comment-anchor]").evaluateAll((els) => els.map((el) => el.getAttribute("data-comment-anchor")).sort());
}
async function readProposalIds(page) {
  await page.getByRole("tab", { name: "Duties & Exposure" }).click();
  const toggle = page.getByRole("button", { name: /AI-suggested links|Suggestions on/ });
  if (!/Suggestions on/.test(await toggle.innerText())) await toggle.click();
  await page.locator("[data-suggest-id]").first().waitFor({ state: "visible", timeout: 20000 });
  const ids = await page.locator("[data-suggest-id]").evaluateAll((els) => els.map((el) => el.getAttribute("data-suggest-id")));
  const anchors = await page.locator("[data-oia-anchor]").evaluateAll((els) => els.map((el) => el.getAttribute("data-oia-anchor")));
  return { ids, anchors };
}

async function runViewport({ name, width, height, phone }) {
  const tag = phone ? "phone" : "desktop";
  // B1. Seed a pre-BLP-003 ledger for this posting: a legacy decision and a positional link.
  const page = await newPage({ width, height });
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(({ uuid }) => {
    localStorage.clear();
    localStorage.setItem("v3.state.review", JSON.stringify({ [uuid]: { "c-proc": "rejected" } }));
    localStorage.setItem("v3.state.links", JSON.stringify({ [uuid]: [{ id: "lnk-legacy", from: { t: "duty", id: "s2", quote: "legacy" }, to: { t: "oia", id: "s2", quote: "legacy" }, locked: true }] }));
  }, { uuid: mcfPosting.uuid });

  // B2. First mount: Step 2 -> Step 3, row id canonical, round trip into the workspace and back.
  const rows1 = await analyseFixturePosting(page, phone);
  const rowIds1 = await rows1.evaluateAll((els) => els.map((el) => [el.dataset.evidenceId, el.dataset.evidenceIdentity]));
  ok(rowIds1.length >= 4, `${tag}: four duty rows rendered (${rowIds1.length})`);
  eq(rowIds1[0][0], expectedFirst, `${tag}: first row carries the content-addressed duty id computed offline from the fixture`);
  ok(rowIds1.every(([id, identity]) => id.startsWith("duty:") && identity === "OK"), `${tag}: every duty row is canonical with identity OK`);
  ok(!rowIds1.some(([id]) => /^[sq]\d+$/.test(id)), `${tag}: no positional ids reach the Work Universe`);
  await rows1.first().click();
  await openEvidenceWorkspace(page, phone);
  await page.getByTestId(`v31-workspace-evidence-${expectedFirst}`).waitFor({ state: "visible", timeout: 15000 });
  ok(await page.locator(`[data-oia-anchor="${expectedFirst}"]`).count() > 0, `${tag}: the O-I-A card for the same id exists in the workspace`);
  await page.locator('[aria-label="Evidence / Explanation"]').first().waitFor({ state: "visible", timeout: 15000 });
  await page.screenshot({ path: `test-results/evidence-round-trip/${name}-01-workspace-first-mount.png`, fullPage: true });

  // B3. The legacy ledger is withheld, not remapped; a fresh decision is keyed comment@anchor;
  // proposal ids are composed from canonical ids.
  await openAnalysisSurface(page);
  await page.getByRole("tab", { name: "Duties & Exposure" }).click();
  const withheldStrip = page.getByTestId("evidence-withheld-ledger");
  await withheldStrip.waitFor({ state: "visible", timeout: 15000 });
  const stripText = await withheldStrip.innerText();
  ok(/1 earlier link/.test(stripText) && /1 earlier decision/.test(stripText), `${tag}: withheld strip names both legacy rows: ${stripText}`);
  const proposals1 = await readProposalIds(page);
  ok(proposals1.ids.length > 0, `${tag}: proposal ids rendered (${proposals1.ids.length})`);
  ok(proposals1.ids.every((id) => id.startsWith("sug-duty:")), `${tag}: every proposal id is composed from canonical duty ids`);
  ok(proposals1.ids.every((id) => proposals1.anchors.some((a) => proposals1.anchors.some((b) => a !== b && id === `sug-${a}-${b}`))), `${tag}: every proposal id is exactly sug-<fromId>-<toId> over ids rendered as O-I-A cards`);
  await page.getByRole("tab", { name: "The Ad" }).click();
  await openCommentsWindow(page);
  const anchors1 = await readCommentAnchors(page);
  ok(anchors1.length > 0 && anchors1.every((a) => /^(duty|span):/.test(a)), `${tag}: every comment anchors on a canonical id (${anchors1.length})`);
  const procCard = page.locator(`[data-comment-anchor="${expectedDuty}"]`);
  await procCard.waitFor({ state: "visible", timeout: 15000 });
  ok(/Pending decision/.test(await procCard.getAttribute("aria-label")), `${tag}: legacy 'rejected' was NOT applied to the canonical anchor`);
  await procCard.getByRole("button", { name: "Accept" }).click();
  await page.waitForFunction(({ uuid, key }) => {
    try { const all = JSON.parse(localStorage.getItem("v3.state.review") || "{}"); return all[uuid] && all[uuid][key] === "accepted"; } catch (_) { return false; }
  }, { uuid: mcfPosting.uuid, key: decisionKey("c-proc", expectedDuty) }, { timeout: 15000 });
  const ledgerAfter = await page.evaluate(({ uuid }) => ({ review: JSON.parse(localStorage.getItem("v3.state.review"))[uuid], links: JSON.parse(localStorage.getItem("v3.state.links"))[uuid] }), { uuid: mcfPosting.uuid });
  eq(ledgerAfter.review["c-proc"], "rejected", `${tag}: legacy decision preserved verbatim alongside the new one`);
  eq(ledgerAfter.review[decisionKey("c-proc", expectedDuty)], "accepted", `${tag}: new decision persisted under comment@anchor`);
  eq(ledgerAfter.links.length, 1, `${tag}: legacy positional link preserved`);
  eq(ledgerAfter.links[0].from.id, "s2", `${tag}: and not re-pointed`);
  await page.getByTestId("return-work-universe").click();
  await page.getByTestId("v31-universe-surface").waitFor({ state: "visible", timeout: 15000 });
  ok(await page.locator('[data-testid="wu-evidence-row"].selected').count() === 1, `${tag}: return navigation restores the originating evidence selection`);
  eq(await page.locator('[data-testid="wu-evidence-row"].selected').getAttribute("data-evidence-id"), expectedFirst, `${tag}: and it is the same id`);

  // B4. Full remount: reload the page and analyse again. Same ids for rows, proposals and
  // comment anchors; the decision is restored.
  await page.reload({ waitUntil: "networkidle", timeout: 60000 });
  const rows2 = await analyseFixturePosting(page, phone);
  const rowIds2 = await rows2.evaluateAll((els) => els.map((el) => el.dataset.evidenceId));
  deq(rowIds2, rowIds1.map(([id]) => id), `${tag}: duty ids are byte-identical across a full remount`);
  await rows2.first().click();
  await openEvidenceWorkspace(page, phone);
  await page.getByTestId(`v31-workspace-evidence-${expectedFirst}`).waitFor({ state: "visible", timeout: 15000 });
  await openAnalysisSurface(page);
  const proposals2 = await readProposalIds(page);
  deq(proposals2.ids, proposals1.ids, `${tag}: proposal ids are byte-identical across a full remount`);
  await page.getByRole("tab", { name: "The Ad" }).click();
  await openCommentsWindow(page);
  deq(await readCommentAnchors(page), anchors1, `${tag}: comment anchors are byte-identical across a full remount`);
  await page.waitForFunction((sel) => /Decision: accepted/.test(document.querySelector(sel)?.getAttribute("aria-label") || ""), `[data-comment-anchor="${expectedDuty}"]`, { timeout: 15000 });
  ok(true, `${tag}: the decision made in the first mount is restored in the second under the same anchor`);
  await page.screenshot({ path: `test-results/evidence-round-trip/${name}-02-workspace-remount.png`, fullPage: true });
  await page.close();
  return { rowIds: rowIds1.map(([id]) => id), proposalIds: proposals1.ids, anchors: anchors1 };
}

const desktop = await runViewport({ name: "desktop-1440", width: 1440, height: 1000, phone: false });
const phone = await runViewport({ name: "phone-430", width: 430, height: 932, phone: true });
deq(phone.rowIds, desktop.rowIds, "duty ids are identical at phone and desktop width");
deq(phone.proposalIds, desktop.proposalIds, "proposal ids are identical at phone and desktop width");
deq(phone.anchors, desktop.anchors, "comment anchors are identical at phone and desktop width");

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
fs.writeFileSync("test-results/evidence-round-trip/summary.json", JSON.stringify({ adapterVersion: ADAPTER_VERSION, contractVersion: CONTRACT_VERSION, checks, viewports: ["1440x1000", "430x932"], firstDutyId: expectedFirst, anchoredDutyId: expectedDuty, proposalIds: desktop.proposalIds, base }, null, 2));
