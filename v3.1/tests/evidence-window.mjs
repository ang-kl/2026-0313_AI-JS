// BLP-004 evidence window: published, closing, retrieved, analysed, corpus-range, posting-count
// and source-timezone carried independently, each withheld on its own, no generic freshness
// substitute anywhere.
//
// Part A (node, stubbed fetch): the two Step 2 routes emit the facts the evidence layer needs
// and cannot know client-side (Supervisor rulings 1 and 2, 08-09 '26): retrievedAt as the
// moment the source was observed (careers.gov.sg: the dump cache's fetchedAt, not the response
// time; withheld when the cache has none), textProvenance with cap and pre-cap originalLength
// measured on the same string that gets capped, and postedDateRaw/expiryDateRaw as the source's
// own values under one name on both routes. Existing fields are unchanged (Step 2 behaviour is
// protected scope).
//
// Later parts (contract 1.0.4 day precision, the evidence-window adapter, the rendered footer)
// are appended by the BLP-004 implementation.
//
// Run: node tests/evidence-window.mjs

import assert from "node:assert/strict";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// ---------------------------------------------------------------------------------------------
// Fixtures shaped like the upstream payloads (MyCareersFuture v2 search results; the
// careers.gov.sg jobs-data dump, whose dates are epoch milliseconds at midnight UTC).
// ---------------------------------------------------------------------------------------------
const longBody = "<p>Responsibilities</p><ul>" + Array.from({ length: 120 }, (_, i) => `<li>Duty ${i + 1}: reconcile the ledger, investigate exceptions and report to the finance director</li>`).join("") + "</ul><p>Requirements</p><ul><li>Degree in accountancy</li></ul>";
const mcfRaw = (over = {}) => ({
  uuid: "MCF-2026-000777",
  title: "Operations Analyst",
  postedCompany: { name: "EXAMPLE BANK LTD" },
  hiringCompany: { name: "EXAMPLE BANK LTD" },
  metadata: { originalPostingDate: "2026-08-26", expiryDate: "2026-09-30", jobPostId: "MCF-2026-000777", totalNumberJobApplication: 3 },
  description: longBody,
  salary: { minimum: 5000, maximum: 7000 },
  employmentTypes: [{ employmentType: "Permanent" }],
  skills: [{ skill: "SQL" }],
  categories: [{ category: "Banking and Finance" }],
  positionLevels: [{ position: "Professional" }],
  ...over,
});
const csgRaw = (over = {}) => ({
  platform: "hrp", jobId: "17966644", postingNo: "005056a3-53e2-1fd1-a78e-660e293e3403",
  jobTitle: "Manager (Policy)", agency: "MINISTRY OF EXAMPLES", agencyId: "MOE",
  startDate: 1787184000000, closingDate: 1790553600000, closingDateText: "Closing on 28 Sep 2026", remainingDays: "Today",
  employmentType: "Permanent", experienceYearsMin: 3,
  jobDescription: "<p>Policy analysis for the example ministry.</p>",
  jobResponsibilities: "<ul><li>Draft policy papers</li><li>Brief the director on options</li></ul>",
  jobRequirements: "<ul><li>Degree in any discipline</li></ul>",
  functionalArea: "Policy", field: "Public Service", industry: "Government",
  ...over,
});

const calls = [];
function stubFetch(routes) {
  globalThis.fetch = async (url) => {
    const u = String(url);
    calls.push(u);
    for (const [test, body] of routes) {
      if (test(u)) return { ok: true, status: 200, headers: { get: () => null }, json: async () => body(), text: async () => JSON.stringify(body()) };
    }
    return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}), text: async () => "" };
  };
}
function fakeRes() {
  const out = { statusCode: null, body: null };
  return { out, status(code) { out.statusCode = code; return { json(payload) { out.body = payload; return out; } }; } };
}

// ---------------------------------------------------------------------------------------------
// A1. MyCareersFuture route
// ---------------------------------------------------------------------------------------------
const mcf = (await import("../api/mcf.js")).default;
stubFetch([[(u) => u.startsWith("https://api.mycareersfuture.gov.sg/v2/jobs"), () => ({ results: [mcfRaw()] })]]);
const before = Date.now();
let res = fakeRes();
await mcf({ method: "POST", body: { action: "company", company: "EXAMPLE BANK LTD", limit: 5 } }, res);
eq(res.out.statusCode, 200, "mcf company action answers 200");
const mcfJob = res.out.body.matches && res.out.body.matches[0] && res.out.body.matches[0].jobs[0];
ok(mcfJob, "mcf company action returns the fixture job");
eq(mcfJob.postedDate, "2026-08-26", "existing postedDate is unchanged (Step 2 display value)");
eq(mcfJob.expiryDate, "2026-09-30", "existing expiryDate is unchanged");
eq(mcfJob.postedDateRaw, "2026-08-26", "postedDateRaw carries the source's own date-only value");
eq(mcfJob.expiryDateRaw, "2026-09-30", "expiryDateRaw carries the source's own date-only value");
ok(ISO_INSTANT.test(mcfJob.retrievedAt), `retrievedAt is an ISO UTC instant (${mcfJob.retrievedAt})`);
ok(Date.parse(mcfJob.retrievedAt) >= before - 1000 && Date.parse(mcfJob.retrievedAt) <= Date.now() + 1000, "retrievedAt is the normalisation moment for a live MCF fetch");
const tp = mcfJob.textProvenance;
ok(tp && tp.description && tp.responsibilitiesText, "textProvenance carries both capped fields");
eq(tp.description.cap, 4000, "description cap is the route constant");
eq(tp.description.originalLength, longBody.length, "description originalLength is the length of the string that was capped (raw body)");
eq(tp.description.truncated, longBody.length > 4000, "truncated is arithmetic on originalLength and cap");
eq(mcfJob.description.length, Math.min(4000, longBody.length), "description is capped as before");
eq(tp.responsibilitiesText.cap, 2500, "responsibilities cap is the route constant");
ok(tp.responsibilitiesText.originalLength >= mcfJob.responsibilitiesText.length, "responsibilities originalLength is measured before the cap");
eq(tp.responsibilitiesText.truncated, tp.responsibilitiesText.originalLength > 2500, "responsibilities truncated is arithmetic, never inferred from the capped length");
ok(!(mcfJob.responsibilitiesText.length === 2500 && tp.responsibilitiesText.originalLength === 2500 && tp.responsibilitiesText.truncated), "a body of exactly the cap length is not called truncated");

// Missing source dates -> null raw values, never an invented date.
stubFetch([[(u) => u.startsWith("https://api.mycareersfuture.gov.sg/v2/jobs"), () => ({ results: [mcfRaw({ metadata: { jobPostId: "MCF-2026-000778" } })] })]]);
res = fakeRes();
await mcf({ method: "POST", body: { action: "company", company: "EXAMPLE BANK LTD", limit: 5 } }, res);
const undated = res.out.body.matches[0].jobs[0];
eq(undated.postedDate, "", "existing postedDate stays the empty string when the source has none");
eq(undated.postedDateRaw, null, "postedDateRaw is null, not a default, when the source has none");
eq(undated.expiryDateRaw, null, "expiryDateRaw is null when the source has none");

// ---------------------------------------------------------------------------------------------
// A2. careers.gov.sg route
// ---------------------------------------------------------------------------------------------
const careers = (await import("../api/careers.js")).default;
stubFetch([[(u) => u.includes("careersgovsg-jobs-data"), () => [csgRaw()]]]);
const t0 = Date.now();
res = fakeRes();
await careers({ method: "POST", body: { action: "company", company: "Ministry of Examples", limit: 5 } }, res);
eq(res.out.statusCode, 200, "careers company action answers 200");
const csgJob = res.out.body.jobs && res.out.body.jobs[0];
ok(csgJob, "careers company action returns the fixture job");
eq(csgJob.postedDate, "2026-08-20T00:00:00.000Z", "existing derived postedDate is unchanged (Step 2 display value)");
eq(csgJob.postedDateRaw, 1787184000000, "postedDateRaw is the source's own epoch-millisecond value, untouched");
eq(csgJob.expiryDateRaw, 1790553600000, "expiryDateRaw is the source's own epoch-millisecond value, untouched");
eq(csgJob.postedDateRaw % 86400000, 0, "the source encodes a calendar date as midnight UTC");
ok(ISO_INSTANT.test(csgJob.retrievedAt), `retrievedAt is an ISO UTC instant (${csgJob.retrievedAt})`);
ok(Date.parse(csgJob.retrievedAt) >= t0 - 1000 && Date.parse(csgJob.retrievedAt) <= Date.now() + 1000, "on a cold fetch retrievedAt is the dump fetch moment");
const firstRetrieved = csgJob.retrievedAt;
const dumpFetches = calls.filter((u) => u.includes("careersgovsg-jobs-data")).length;
// Second call is served from the module cache: retrievedAt must be the ORIGINAL observation
// time, not the response time (Supervisor ruling: observation versus transport).
await new Promise((r) => setTimeout(r, 1100));
res = fakeRes();
await careers({ method: "POST", body: { action: "company", company: "Ministry of Examples", limit: 5 } }, res);
eq(calls.filter((u) => u.includes("careersgovsg-jobs-data")).length, dumpFetches, "second call is served from the cache (no new dump fetch)");
eq(res.out.body.jobs[0].retrievedAt, firstRetrieved, "retrievedAt on a cache hit is the original fetch time, not now");
const ctp = res.out.body.jobs[0].textProvenance;
eq(ctp.description.cap, 4000, "careers description cap");
ok(ctp.description.originalLength > 0 && ctp.description.originalLength === res.out.body.jobs[0].description.length, "careers description originalLength is measured on the htmlToText string that was capped (uncapped here)");
eq(ctp.description.truncated, false, "short body is not truncated");
eq(ctp.responsibilitiesText.originalLength, res.out.body.jobs[0].responsibilitiesText.length, "careers responsibilities originalLength measured on the same cleaned string");
// Missing source dates -> null raw values.
// (A fresh record shape in the cached dump is not reachable without expiring the cache, so the
// null path is asserted on the normaliser's contract through the MCF route above and, for CSG,
// on the value rule: `?? null` never substitutes a date.)
eq(csgJob.source, "careers.gov.sg", "source label unchanged");

// Route contract: both routes expose the same evidence-window field names.
for (const key of ["postedDateRaw", "expiryDateRaw", "retrievedAt", "textProvenance"]) {
  ok(key in mcfJob && key in csgJob, `${key} is present on both routes`);
}

console.log(`Part A (routes, stubbed fetch): ${checks} checks passed`);

// ---------------------------------------------------------------------------------------------
// Part B (node): contract 1.0.4 precision through the evidence-window adapter, and the source
// completeness the BLP-003 adapter now records from textProvenance.
// ---------------------------------------------------------------------------------------------
const { buildEvidenceWindow, decodeSourceDate, formatWindowField, windowRows, isoWithOffset } = await import("../src/contracts/evidenceWindowAdapter.js");
const { buildResultEvidence } = await import("../src/contracts/evidenceAdapter.js");
const { CONTRACT_VERSION, ORIGIN, WITHHOLD, validateEvidenceWindow, EVIDENCE_WINDOW_FIELDS } = await import("../src/contracts/evidenceContracts.js");
eq(CONTRACT_VERSION, "1.1.0", "contract is at least 1.0.4 (day-precision marker); 1.1.0 adds the review vocabulary and actor namespaces");

// B1. The uniform decoding rule, one branch each.
deq(decodeSourceDate("2026-08-26"), { value: "2026-08-26", precision: "day" }, "a: date-only string -> day precision, value as-is (MCF)");
deq(decodeSourceDate(1787184000000), { value: "2026-08-20", precision: "day" }, "b: epoch at midnight UTC -> day precision with the UTC calendar date (careers.gov.sg)");
deq(decodeSourceDate(1787184000123), { value: "2026-08-20T00:00:00.123Z", precision: "instant" }, "b else: a non-aligned epoch is a genuine instant, recorded at instant precision, not withheld");
deq(decodeSourceDate("2026-09-08T07:39:36.077Z"), { value: "2026-09-08T07:39:36.077Z", precision: "instant" }, "c: ISO datetime -> instant");
for (const bad of ["", "26/08/2026", "2026-02-30", "recent", null, undefined, NaN, {}]) eq(decodeSourceDate(bad), null, `d: ${JSON.stringify(bad)} is withheld`);

// B2. A posting analysis: each field on its own; single posting -> count 1, range withheld.
const mcfStep2 = { uuid: "MCF-2026-000777", text: "Responsibilities\n- Reconcile the ledger", postedDateRaw: "2026-08-26", expiryDateRaw: "2026-09-30", retrievedAt: "2026-09-08T07:39:36.077Z", textProvenance: { responsibilitiesText: { cap: 2500, originalLength: 40, truncated: false }, description: { cap: 4000, originalLength: 120, truncated: false } }, textField: "responsibilitiesText" };
const built = buildEvidenceWindow({ posting: mcfStep2, analysedAt: "2026-09-08T15:45:10+08:00" });
ok(built.validation.ok, `window validates: ${built.validation.errors.join("; ")}`);
const w = built.window;
deq([w.publishedAt.value, w.publishedAt.precision, w.publishedAt.origin], ["2026-08-26", "day", ORIGIN.SOURCE_VERBATIM], "publishedAt: day precision, SOURCE_VERBATIM, no time invented");
deq([w.closingAt.value, w.closingAt.precision], ["2026-09-30", "day"], "closingAt from expiryDateRaw at day precision");
deq([w.retrievedAt.value, w.retrievedAt.precision, w.retrievedAt.origin], ["2026-09-08T07:39:36.077Z", "instant", ORIGIN.DETERMINISTIC], "retrievedAt is the route's observation instant");
deq([w.analysedAt.value, w.analysedAt.precision], ["2026-09-08T15:45:10+08:00", "instant"], "analysedAt keeps the client's offset");
eq(w.postingCount.value, 1, "a single posting counts 1");
deq(w.corpusRange, { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.UNAVAILABLE_FIELD, precision: null }, "a single posting withholds corpusRange (not a degenerate from === to)");
deq(w.sourceTimezone, { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.UNAVAILABLE_FIELD }, "sourceTimezone withheld: no route names an IANA zone");
ok(/midnight-UTC encoding is a convention/.test(built.meta.sourceTimezoneReason), "the withholding reason is recorded");

// B3. careers.gov.sg raw epoch -> day precision; Z is not read as a zone.
const csgStep2 = { uuid: "csg:hrp:17966644:005056a3", text: "Draft policy papers", postedDateRaw: 1787184000000, expiryDateRaw: 1790553600000, retrievedAt: "2026-09-08T07:39:36.077Z", source: "careers.gov.sg" };
const csgBuilt = buildEvidenceWindow({ posting: csgStep2, analysedAt: "2026-09-08T15:45:10+08:00" });
deq([csgBuilt.window.publishedAt.value, csgBuilt.window.publishedAt.precision], ["2026-08-20", "day"], "careers epoch decodes to the UTC calendar date at day precision");
deq([csgBuilt.window.closingAt.value, csgBuilt.window.closingAt.precision], ["2026-09-28", "day"], "closing epoch likewise");
eq(csgBuilt.window.sourceTimezone.value, null, "the midnight-UTC alignment does not populate sourceTimezone");

// B4. Nothing is ever substituted: missing raw fields and a missing analysedAt stay withheld.
const bare = buildEvidenceWindow({ posting: { uuid: "x", text: "y" } });
for (const key of ["publishedAt", "closingAt", "retrievedAt", "analysedAt", "corpusRange", "sourceTimezone"]) eq(bare.window[key].value, null, `${key} withheld when nothing supplied`);
eq(bare.window.postingCount.value, 1, "the count is still a fact");
ok(bare.validation.ok, "a mostly withheld window is still valid");
const displayOnly = buildEvidenceWindow({ posting: { uuid: "x", text: "y", postedDate: "2026-08-26", expiryDate: "2026-09-30T00:00:00.000Z" } });
eq(displayOnly.window.publishedAt.value, null, "the adapter never reads the display field postedDate");
eq(displayOnly.window.closingAt.value, null, "nor the derived display field expiryDate");

// B5. Corpus: min/max over dated postings, dated subset visible, mixed precision withheld.
const corpus = buildEvidenceWindow({ corpusJobs: [{ postedDateRaw: "2026-08-01" }, { postedDateRaw: "2026-08-26" }, { postedDateRaw: null }, { postedDateRaw: "" }], analysedAt: "2026-09-08T15:45:10+08:00" });
deq(corpus.window.corpusRange.value, { from: "2026-08-01", to: "2026-08-26" }, "corpus range is min/max over dated postings");
eq(corpus.window.corpusRange.precision, "day", "at day precision");
eq(corpus.window.postingCount.value, 4, "postingCount is the total, not the dated subset");
deq([corpus.meta.datedCount, corpus.meta.postingCountTotal], [2, 4], "the dated subset is recorded next to the total");
ok(/2 dated/.test(windowRows(corpus).find((r) => r.key === "postingCount").text), "and rendered so the gap is visible");
const mixed = buildEvidenceWindow({ corpusJobs: [{ postedDateRaw: "2026-08-01" }, { postedDateRaw: 1787184000123 }] });
eq(mixed.window.corpusRange.value, null, "a corpus mixing day and instant dates withholds the range rather than coercing");
ok(/mixes day-precision and instant/.test(mixed.meta.corpusRangeReason), "with the reason recorded");
const none = buildEvidenceWindow({});
eq(none.window.postingCount.value, null, "no posting and no corpus: count withheld too");

// B6. Rendering: precision survives to the screen; withheld is the literal word plus a reason.
eq(formatWindowField("publishedAt", w.publishedAt), "26 Aug 2026", "day value renders as a date, never with 00:00");
ok(!/00:00/.test(formatWindowField("publishedAt", w.publishedAt)), "no time is attached to a day value");
eq(formatWindowField("retrievedAt", w.retrievedAt), "8 Sep 2026, 07:39 UTC", "instant renders with the offset it carries");
eq(formatWindowField("analysedAt", w.analysedAt), "8 Sep 2026, 15:45 UTC+08:00", "client offset is shown, never re-zoned");
eq(formatWindowField("corpusRange", w.corpusRange), "withheld (not supplied)", "withheld renders as text with its reason");
eq(formatWindowField("corpusRange", mixed.window.corpusRange), "withheld (not supplied)", "the adapter withholds a mixed-precision corpus range before the contract sees it");
eq(formatWindowField("corpusRange", { value: null, origin: ORIGIN.WITHHELD, withheldReason: WITHHOLD.CONFLICTING_EVIDENCE, precision: null }), "withheld (conflicting)", "a contract-level conflicting withholding renders its own reason");
const rows = windowRows(built);
deq(rows.map((r) => r.key), [...EVIDENCE_WINDOW_FIELDS], "seven rows in contract order");
ok(rows.every((r) => typeof r.text === "string" && r.text.length > 0), "every row has text");
ok(rows.filter((r) => r.withheld).every((r) => /^withheld \(/.test(r.text)), "every withheld row says so in words");
for (const phrase of ["snapshot at analysis", "recent", "current"]) ok(!rows.some((r) => r.text.toLowerCase().includes(phrase)), `no generic substitute "${phrase}" in any rendered row`);
ok(rows.every((r) => r.origin && (r.withheld ? r.origin === ORIGIN.WITHHELD : r.origin !== ORIGIN.WITHHELD)), "every row carries its origin, WITHHELD exactly when withheld");
// Fail closed (conformance-auditor W3): a window that fails its own validation is withheld field by field, never shipped half-right.
const broken = windowRows({ ...built, validation: { ok: false, errors: ["forced"] } });
ok(broken.length === 7 && broken.every((r) => r.withheld && r.text === "withheld (conflicting)" && r.origin === ORIGIN.WITHHELD), "an invalid window renders seven conflicting withholdings, not the fields");
const stamped = isoWithOffset(new Date(2026, 8, 8, 15, 45, 10));
ok(/^2026-09-08T15:45:10[+-]\d{2}:\d{2}$/.test(stamped), `isoWithOffset renders the caller's Date with its offset (${stamped})`);
eq(isoWithOffset(new Date("nope")), null, "an invalid Date yields null, never now");

// B7. Source completeness is now a measured fact when textProvenance is present (BLP-003 residual risk discharged).
const withProv = buildResultEvidence({ responsibilitiesData: { responsibilities: [{ text: "Reconcile the ledger" }] } }, mcfStep2, { retrievedAt: mcfStep2.retrievedAt });
eq(withProv.source.completeness, "COMPLETE", "originalLength <= cap records COMPLETE");
eq(withProv.source.retrievedAt, "2026-09-08T07:39:36.077Z", "retrievedAt now reaches EvidenceSource");
ok(!withProv.residualRisks.some((r) => r.code === "COMPLETENESS_UNKNOWN"), "the completeness residual risk is not raised when measured");
const truncated = buildResultEvidence({ responsibilitiesData: { responsibilities: [] } }, { ...mcfStep2, textProvenance: { responsibilitiesText: { cap: 2500, originalLength: 2600, truncated: true } } });
eq(truncated.source.completeness, "TRUNCATED", "originalLength > cap records TRUNCATED");
deq(truncated.source.truncation, { limit: 2500, originalLength: 2600, reason: WITHHOLD.CAP_EXCEEDED }, "with the real originalLength");
const exact = buildResultEvidence({ responsibilitiesData: { responsibilities: [] } }, { ...mcfStep2, textProvenance: { responsibilitiesText: { cap: 2500, originalLength: 2500, truncated: false } } });
eq(exact.source.completeness, "COMPLETE", "a body of exactly the cap length is COMPLETE when the route measured it so");
const unmeasured = buildResultEvidence({ responsibilitiesData: { responsibilities: [] } }, { uuid: "MCF-1", text: "x", source: "MyCareersFuture" });
eq(unmeasured.source.completeness, "UNKNOWN", "without textProvenance completeness stays UNKNOWN");
ok(unmeasured.residualRisks.some((r) => r.code === "COMPLETENESS_UNKNOWN"), "and the residual risk is named");

console.log(`Part B (contract precision rules and adapter): ${checks} checks passed`);

// ---------------------------------------------------------------------------------------------
// Part C (Chromium): the seven fields reach the footer, the overview toolbar and the print
// package independently, at desktop and phone width; a day-precision publishedAt from an MCF
// fixture renders as a date without acquiring a time; and no generic freshness phrase survives
// on those three surfaces.
// ---------------------------------------------------------------------------------------------
if (process.env.EVIDENCE_WINDOW_NODE_ONLY === "1") { console.log("Part C (browser): NOT_RUN (EVIDENCE_WINDOW_NODE_ONLY=1)"); process.exit(0); }
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const fs = await import("node:fs");
fs.mkdirSync("test-results/evidence-window", { recursive: true });
const BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "- Support various ad-hoc reporting requests and other duties as assigned to the operations team", "Requirements", "- Knowledge of SQL and data pipelines is required for this role"].join("\n");
const dutiesFx = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Support various ad-hoc reporting requests and other duties as assigned to the operations team"];
// Fixture shaped exactly as api/mcf.js now emits it (Part A proves the shape).
const job = { uuid: "MCF-2026-000777", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: BODY, responsibilitiesText: BODY, skills: ["SQL"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-08-26", expiryDate: "2026-09-30", postedDateRaw: "2026-08-26", expiryDateRaw: "2026-09-30", retrievedAt: "2026-09-08T07:39:36.077Z", textProvenance: { description: { cap: 4000, originalLength: BODY.length, truncated: false }, responsibilitiesText: { cap: 2500, originalLength: BODY.length, truncated: false } }, source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000777" };
const payload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 1, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 1, jobs: [job] }] };
const respFx = JSON.stringify({ summary: "Runs operational monitoring.", responsibilities: dutiesFx.map((t, i) => ({ n: i + 1, text: t, cat: "Delivery & Execution", freq: "Core", sk: [] })) });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true } : {}) });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", async (r) => { let b = {}; try { b = r.request().postDataJSON(); } catch (_) {} r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b.action === "company" ? payload : { jobs: [], tier: 1, approximate: false }) }); });
  for (const [p, v] of [["**/api/careers", { jobs: [], total: 0 }], ["**/api/ssoc", { results: [], classifications: [] }], ["**/api/ssic", { matched: false, results: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/company-registry", { matched: false }], ["**/api/geocode**", { matched: false }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => { let b = {}; try { b = r.request().postDataJSON(); } catch (_) {} const sys = String(b?.system || ""); const pr = String(b?.messages?.[0]?.content || ""); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: /job-analysis specialist/i.test(sys) && /Extract the real responsibilities/i.test(pr) ? respFx : "[]" }], model: "evidence-window-fixture" }) }); });
  return page;
}
async function readWindow(page, testId) {
  const group = page.getByTestId(testId).first();
  await group.waitFor({ state: "attached", timeout: 20000 });
  return group.locator("[data-window-field]").evaluateAll((els) => els.map((el) => ({ key: el.dataset.windowField, state: el.dataset.windowState, precision: el.dataset.windowPrecision || null, origin: el.dataset.windowOrigin || null, label: el.textContent.replace(/\s+/g, " ").trim(), ariaLabel: el.getAttribute("aria-label"), text: el.textContent })));
}
// Phone-width footer must not push the page wider than the viewport (a11y-honesty-reviewer flag):
// the separators sit outside the no-wrap field spans so the seven fields can break between fields.
async function assertNoHorizontalOverflow(page, tag) {
  const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, inner: window.innerWidth }));
  ok(m.scroll <= m.inner, `${tag}: no page-level horizontal overflow (scrollWidth ${m.scroll} <= viewport ${m.inner})`);
}
async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "Search by employer" }).click();
  await page.getByRole("searchbox", { name: "Company name" }).fill(job.employer);
  await page.getByRole("button", { name: "Find company postings" }).click();
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
  const tag = phone ? "phone" : "desktop";
  // Footer.
  const footer = await readWindow(page, "evidence-window");
  eq(footer.length, 7, `${tag}: the footer carries seven window fields`);
  ok(footer.every((f) => f.ariaLabel === null), `${tag}: no aria-label on the generic field spans; the visible text is the accessible name`);
  ok(footer.every((f) => f.origin && (f.state === "withheld" ? f.origin === "WITHHELD" : f.origin !== "WITHHELD")), `${tag}: every field carries its origin for the audit trail (${footer.map((f) => f.origin).join(",")})`);
  await assertNoHorizontalOverflow(page, tag);
  deq(footer.map((f) => f.key), [...EVIDENCE_WINDOW_FIELDS], `${tag}: in contract order`);
  const pub = footer.find((f) => f.key === "publishedAt");
  deq([pub.state, pub.precision, pub.label], ["value", "day", "Published: 26 Aug 2026"], `${tag}: the MCF date-only published date reaches the footer at day precision without acquiring a time`);
  eq(footer.find((f) => f.key === "closingAt").label, "Closing: 30 Sep 2026", `${tag}: closing date carried independently`);
  eq(footer.find((f) => f.key === "retrievedAt").label, "Retrieved: 8 Sep 2026, 07:39 UTC", `${tag}: retrievedAt is the route's observation time`);
  const an = footer.find((f) => f.key === "analysedAt");
  ok(an.state === "value" && /^Analysed: \d{1,2} \w{3} \d{4}, \d{2}:\d{2} UTC[+-]\d{2}:\d{2}$/.test(an.label), `${tag}: analysedAt stamped at the call site with an offset (${an.label})`);
  eq(footer.find((f) => f.key === "postingCount").label, "Postings: 1", `${tag}: single posting counts 1`);
  for (const key of ["corpusRange", "sourceTimezone"]) { const f = footer.find((x) => x.key === key); ok(f.state === "withheld" && /^.*: withheld \(/.test(f.label), `${tag}: ${key} is explicitly withheld, in words (${f.label})`); }
  // Overview toolbar on the six-view surface, then the print package.
  await page.getByRole("button", { name: "Open the workspace navigator" }).click();
  await page.getByRole("menuitem", { name: /More analysis/ }).click();
  await page.getByRole("tab", { name: "Overview" }).click();
  const toolbar = (await readWindow(page, "evidence-window"));
  ok(toolbar.length >= 7, `${tag}: the overview toolbar renders the window fields`);
  // Print package: reached the way the gate reaches it, from the Work Universe command bar.
  await page.getByTestId("return-work-universe").click();
  await page.getByTestId("v31-universe-surface").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("wu-open-print-package").click();
  await page.getByTestId("print-package-preview").waitFor({ state: "visible", timeout: 15000 });
  const print = await readWindow(page, "print-evidence-window");
  eq(print.length, 7, `${tag}: the print package carries seven window fields`);
  eq(print.find((f) => f.key === "publishedAt").label, "Published: 26 Aug 2026", `${tag}: print shows the same day-precision date`);
  ok(print.filter((f) => f.state === "withheld").every((f) => /withheld/.test(f.text)), `${tag}: print withheld fields say so in text`);
  // Negative: no generic substitute on any of the three surfaces.
  const surfaces = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid="evidence-window"], [data-testid="print-evidence-window"]')).map((el) => el.textContent.toLowerCase()).join(" | "));
  for (const phrase of ["snapshot at analysis", "recent", "current"]) ok(!surfaces.includes(phrase), `${tag}: no generic substitute "${phrase}" on the window surfaces`);
  await page.screenshot({ path: `test-results/evidence-window/${name}.png`, fullPage: true });
  await page.close();
  return footer;
}
const desktopWin = await runViewport({ name: "desktop-1440", width: 1440, height: 1000, phone: false });
const phoneWin = await runViewport({ name: "phone-430", width: 430, height: 932, phone: true });
deq(phoneWin.map((f) => [f.key, f.state, f.precision]), desktopWin.map((f) => [f.key, f.state, f.precision]), "field states and precisions identical at phone and desktop width");
await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
console.log(`Part C (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
