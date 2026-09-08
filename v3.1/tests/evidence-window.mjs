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
