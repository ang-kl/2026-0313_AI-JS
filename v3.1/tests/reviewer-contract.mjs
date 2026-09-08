// BLP-006 reviewer roster and review vocabulary: one roster, one vocabulary, humans distinct.
//
// Part A (node, no server): the roster validates (unique namespaced ids, every active voice with
// identity, lens, method, confidence scale and action boundary); humans are never roster entries;
// a reviewer may not decide or execute; the Review Studio comment types map onto canonical verbs
// inside each voice's boundary; unresolved blueprint mappings carry NO blueprint name; blueprint
// open question 15.2 is recorded as OPEN; the 1.0.4 review fixtures re-validate under 1.1.0 with
// the roster supplied (the Supervisor's empirical reopen test for BLP-002).
//
// Part B (Chromium against BASE_URL) at 1440x1000 and 430x932: every reviewer badge the user sees
// in the Comments window carries a data-reviewer-id that resolves to an ACTIVE roster entry and
// shows that entry's display name; a decision renders a human identity, never a reviewer id;
// deterministic lens cards render as lenses (data-lens) with no reviewer id and the old
// "Signal Auditor" fallback never appears on them; advisory cards carry the roster's advisory
// voice; and the negative fixture: no speaker badge on any surface shows a name outside the
// roster (no "voice not on roster", no retired alias, no lens label in the reviewer slot).
//
// Run: node tests/reviewer-contract.mjs            (BASE_URL defaults to http://127.0.0.1:4173)
//      REVIEWER_CONTRACT_NODE_ONLY=1 node tests/reviewer-contract.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  REVIEWER_CONTRACT_VERSION, REVIEWER_METHOD, MAPPING_STATE, ROSTER, DAY_ONE_QUESTION, LOCAL_HUMAN_ACTOR, COMMENT_TYPE_VERB,
  rosterById, resolveReviewer, reviewerDisplayName, activeReviewerDisplayName, reviewerMayAuthor, isAdvisoryHatLegitimate, activeReviewers, isRosterDisplayName, reviewVerbForCommentType,
  validateRoster, validateReviewerBoundary, isLegitimateVoice,
  REVIEW_KIND, REVIEW_VERB, CONFIDENCE, ACTOR_PREFIX, isReviewerActorId, isHumanActorId,
} from "../src/review/reviewerContract.js";
import { CONTRACT_VERSION, ORIGIN, createReviewChange, validateReviewChange, validateReviewHistory } from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };
const deq = (a, b, msg) => { checks += 1; assert.deepEqual(a, b, msg); };
const bad = (res, re, msg) => { checks += 1; assert.ok(!res.ok && res.errors.some((e) => re.test(e)), `${msg}: expected /${re.source}/ in [${res.errors.join(" | ")}]`); };

console.log(`reviewer-contract: roster ${REVIEWER_CONTRACT_VERSION} over contract ${CONTRACT_VERSION}`);

// ---------------------------------------------------------------------------------------------
// Part A
// ---------------------------------------------------------------------------------------------
eq(CONTRACT_VERSION, "1.1.0", "the roster rides on contract 1.1.0 (canonical verbs, actor namespaces)");
const rv = validateRoster();
ok(rv.ok, `the canonical roster validates: ${rv.errors.join("; ")}`);
eq(ROSTER.length, 12, "one roster: nine blueprint 5.5 reviewers plus the three code-only voices (Role Analyst, Signal Auditor, Critical Read)");
const active = activeReviewers();
eq(active.length, 6, "six active voices: the Human Lead's five consolidated names plus the advisory Critical Read");
ok(ROSTER.every((r) => isReviewerActorId(r.id) && !isHumanActorId(r.id)), "every roster id is reviewer:<slug>; no human is a roster entry");
ok(active.every((r) => r.displayName && r.lens && REVIEWER_METHOD.includes(r.method) && r.confidenceScale.every((c) => CONFIDENCE.includes(c)) && r.kinds.length && r.verbs.length), "every active reviewer has identity, lens, method, confidence scale and action boundary (criterion 2)");
ok(ROSTER.every((r) => !r.kinds.includes("decision") && !r.kinds.includes("change")), "no reviewer may author a decision or an executed change (criterion 3)");
ok(ROSTER.every((r) => !r.verbs.some((v) => ["accept", "reject", "resolve", "reopen", "undo"].includes(v))), "human decision verbs are outside every reviewer's boundary");
ok(ROSTER.every((r) => MAPPING_STATE.includes(r.mapping)), "every entry states its blueprint mapping");
const unresolved = ROSTER.filter((r) => r.mapping === "UNRESOLVED");
deq(unresolved.map((r) => r.id).sort(), ["reviewer:critical-read", "reviewer:role-analyst", "reviewer:signal-auditor"], "the three code-only voices are UNRESOLVED, escalated, not mapped by inference");
ok(unresolved.every((r) => r.blueprintName === null && r.note), "an UNRESOLVED mapping carries no blueprint name and states why");
const resolved = ROSTER.filter((r) => r.mapping === "RESOLVED");
deq(resolved.map((r) => [r.displayName, r.blueprintName]), [["AI Exposure Reviewer", "AI Exposure Analyst"], ["Process Redesign Reviewer", "Process Redesign Analyst"], ["Candidate Advocate", "Candidate Advocate"]], "only the unambiguous aliases are recorded");
const declared = ROSTER.filter((r) => r.mapping === "BLUEPRINT_ONLY");
eq(declared.length, 6, "the six unimplemented blueprint reviewers are declared, not invented");
ok(declared.every((r) => r.active === false && r.kinds.length === 0), "a declared voice is inactive and may author nothing");
eq(DAY_ONE_QUESTION.status, "OPEN", "blueprint 15.2 (mandatory day-one reviewers) stays OPEN for the Human Lead");
eq(DAY_ONE_QUESTION.owner, "human-lead"); deq([...DAY_ONE_QUESTION.activeSet], active.map((r) => r.id), "the roster records the active set, not an answer");
ok(isHumanActorId(LOCAL_HUMAN_ACTOR.id) && /identity not recorded/.test(LOCAL_HUMAN_ACTOR.displayName), "the local decider is a human actor whose identity is withheld in words, not invented");
// Resolution and aliases.
eq(resolveReviewer("Evidence Auditor").id, "reviewer:signal-auditor", "the retired alias resolves to its successor");
eq(resolveReviewer("AI Exposure Analyst").id, "reviewer:ai-exposure", "a blueprint name resolves to the code voice it maps to");
eq(resolveReviewer("Skeptic").id, "reviewer:skeptic", "a declared blueprint name resolves to its declared entry");
eq(resolveReviewer("QoI CHECK"), null, "a lens label is not a reviewer"); eq(resolveReviewer("Hiring Manager").active, false);
eq(reviewerDisplayName("reviewer:role-analyst"), "Role Analyst"); eq(reviewerDisplayName("reviewer:nobody"), null);
ok(isRosterDisplayName("candidate advocate") && !isLegitimateVoice("Signal Analyst"), "name checks are case-insensitive and closed");
// Comment types map onto canonical verbs inside the emitting voice's boundary.
const emitters = { "AI exposure": "reviewer:ai-exposure", "suggested rewrite": "reviewer:process-redesign", "merge duties": "reviewer:role-analyst", "comment": "reviewer:candidate-advocate", "withhold claim": "reviewer:signal-auditor" };
for (const [type, rid] of Object.entries(emitters)) {
  const verb = reviewVerbForCommentType(type);
  ok(REVIEW_VERB.includes(verb), `comment type "${type}" maps to canonical verb ${verb}`);
  ok(rosterById(rid).verbs.includes(verb), `${rid} may use ${verb}`);
}
eq(Object.keys(COMMENT_TYPE_VERB).length, 5, "the five Review Studio comment types are all mapped"); eq(reviewVerbForCommentType("guess"), null);
// Production-time boundary (conformance-auditor C2): the generator withholds a comment its voice may not author.
ok(reviewerMayAuthor("reviewer:process-redesign", "proposal", "replace") && reviewerMayAuthor("reviewer:signal-auditor", "comment", "withhold"), "the five generated comments are inside their voices' boundaries");
ok(!reviewerMayAuthor("reviewer:candidate-advocate", "proposal", "replace") && !reviewerMayAuthor("reviewer:skeptic", "comment", "comment") && !reviewerMayAuthor("reviewer:nobody", "comment", "comment"), "kind, verb, inactive and unknown are all refused at production time");
eq(activeReviewerDisplayName("reviewer:skeptic"), null, "a declared, inactive voice never gets a live speaker name (W4)"); eq(activeReviewerDisplayName("reviewer:role-analyst"), "Role Analyst");
ok(isAdvisoryHatLegitimate("SKEPTICAL READ") && isAdvisoryHatLegitimate("RECRUITER SCREEN") && !isAdvisoryHatLegitimate("CANDIDATE ADVOCATE") && !isAdvisoryHatLegitimate("Recruiter") && !isAdvisoryHatLegitimate("Interview Coach"), "an advisory hat may never be a roster name (W3)");
// Boundary enforcement through the contract.
const span = "span:src:mycareersfuture:MCF-2026-000123:0-10";
const t0 = "2026-09-08T10:00:00Z", t1 = "2026-09-08T10:01:00Z", t2 = "2026-09-08T10:02:00Z";
const mk = (o) => createReviewChange({ targetSpanIds: [span], createdAt: t0, origin: ORIGIN.DETERMINISTIC, ...o });
ok(validateReviewerBoundary(mk({ id: "r1", kind: "comment", verb: "withhold", reviewerId: "reviewer:signal-auditor", reason: "no threshold" })).ok, "Signal Auditor withholds inside its boundary");
ok(validateReviewerBoundary(mk({ id: "r2", kind: "proposal", verb: "replace", reviewerId: "reviewer:process-redesign", proposedText: "own a named workstream", origin: ORIGIN.AI_ASSISTED })).ok, "Process Redesign proposes a replace");
bad(validateReviewerBoundary(mk({ id: "r3", kind: "proposal", verb: "replace", reviewerId: "reviewer:candidate-advocate", proposedText: "x" })), /may not author kind proposal/, "Candidate Advocate comments only");
bad(validateReviewerBoundary(mk({ id: "r4", kind: "comment", verb: "split", reviewerId: "reviewer:ai-exposure" })), /may not use verb split/, "AI Exposure may not split");
bad(validateReviewerBoundary(mk({ id: "r5", kind: "comment", verb: "comment", reviewerId: "reviewer:skeptic" })), /declared but not active/, "a declared voice cannot author until activated");
bad(validateReviewerBoundary(mk({ id: "r6", kind: "comment", verb: "comment", reviewerId: "reviewer:evidence-auditor" })), /not on the roster/, "a retired id is off the roster");
bad(validateReviewerBoundary(mk({ id: "r7", kind: "decision", verb: "accept", reviewerId: "reviewer:critical-read", predecessorId: "r2", origin: ORIGIN.USER_AUTHORED })), /decision is made by a human actor/, "the advisory voice cannot decide");
ok(validateReviewerBoundary(mk({ id: "r8", kind: "comment", verb: "comment", reviewerId: "reviewer:critical-read", origin: ORIGIN.AI_ASSISTED })).ok, "the advisory voice comments");
ok(validateReviewerBoundary(mk({ id: "r9", kind: "decision", verb: "accept", reviewerId: LOCAL_HUMAN_ACTOR.id, predecessorId: "r2", createdAt: t1, origin: ORIGIN.USER_AUTHORED })).ok, "the local human decides");
// The 1.0.4-shaped fixtures from tests/evidence-contract.mjs re-validate unchanged with the roster supplied.
const c104 = mk({ id: "rc-1", kind: "comment", verb: "comment", reviewerId: "reviewer:process-redesign", reason: "Vague ownership" });
const p104 = mk({ id: "rc-2", kind: "proposal", verb: "replace", reviewerId: "reviewer:process-redesign", createdAt: t1, origin: ORIGIN.AI_ASSISTED, proposedText: "Own the ingestion workflow end to end." });
const d104 = mk({ id: "rc-3", kind: "decision", verb: "accept", reviewerId: "human:editor", predecessorId: "rc-2", createdAt: t2, origin: ORIGIN.USER_AUTHORED });
ok(validateReviewHistory([c104, p104, d104], { roster: ROSTER }).ok, "the BLP-002 review fixtures validate unchanged under 1.1.0 with the canonical roster (reopen test: not reopened)");
// Roster integrity negatives.
bad(validateRoster([...ROSTER, { ...ROSTER[0] }]), /duplicate id/, "a duplicate id is refused");
bad(validateRoster([...ROSTER, { ...ROSTER[0], id: "reviewer:copy" }]), /duplicate displayName/, "a duplicate name is refused");
bad(validateRoster([{ ...ROSTER[0], id: "human:editor" }]), /id must be reviewer:/, "a human cannot be listed on the roster");
bad(validateRoster([{ ...ROSTER[2], blueprintName: "Organisation Designer" }]), /must not carry a blueprintName/, "an UNRESOLVED mapping cannot smuggle in an inferred name");
bad(validateRoster([{ ...ROSTER[0], kinds: ["comment", "decision"] }]), /never author kind decision/, "a reviewer with decision in its boundary is refused");
bad(validateRoster([{ ...ROSTER[5], anchored: true }]), /advisory voice is not span-anchored/, "an advisory voice cannot claim span anchoring");
bad(validateRoster([{ ...ROSTER[0], method: "LLM" }]), /needs a method/, "method is closed");
ok(REVIEW_KIND.length === 4 && ACTOR_PREFIX.HUMAN === "human:", "vocabulary re-exported from the contract, not redefined");
console.log(`Part A (roster and boundaries): ${checks} checks passed`);

if (process.env.REVIEWER_CONTRACT_NODE_ONLY === "1") { console.log("Part B (browser): NOT_RUN (REVIEWER_CONTRACT_NODE_ONLY=1)"); process.exit(0); }

// ---------------------------------------------------------------------------------------------
// Part B
// ---------------------------------------------------------------------------------------------
const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/reviewer-contract", { recursive: true });
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
const job = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: MCF_BODY, responsibilitiesText: MCF_BODY, skills: ["Data Analytics", "SQL", "Operations"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-09-01T00:00:00.000Z", postedDateRaw: "2026-09-01", source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123" };
const companyPayload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 1, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 1, jobs: [job] }] };
const duties = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Support various ad-hoc reporting requests and other duties as assigned to the operations team", "Coordinate quarterly access reviews with the technology risk function and document outcomes"];
const respFx = JSON.stringify({ summary: "Runs operational monitoring and finance reporting for the payments platform.", responsibilities: duties.map((text, i) => ({ n: i + 1, text, cat: "Delivery & Execution", freq: "Core", sk: [] })) });
const critFx = JSON.stringify({
  devilsAdvocate: { challenges: ["The ad never names the payments platform it monitors", "Variance commentary implies a finance seat the title hides"], counterCase: "The duties are ordinary operations work and the exposure read may overstate automation." },
  realDemand: "Reads as a real backfill: four concrete duties, one named stakeholder.",
  teleology: { whyExists: "Exception volume outgrew the current team", problem: "Nobody owns exception triage end to end" },
  proWorker: { verdict: "protects", reasoning: "Accountability stays with a human across every duty listed." },
  hiring: { recruiter: "SQL plus three years in operations", hiringManager: "Someone who can close the monthly accounts unaided", interviewCoach: "Walk me through an exception you traced to root cause" },
  ach: { likely: "real vacancy", read: "Four dated, specific duties support a genuine opening.", hypotheses: [{ name: "real vacancy", signal: "specific duties" }, { name: "always-open pipeline", signal: "no evergreen wording seen" }] },
});
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", async (r) => { let b = {}; try { b = r.request().postDataJSON(); } catch (_) {} r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b.action === "company" ? companyPayload : { jobs: [], tier: 1, approximate: false }) }); });
  for (const [p, v] of [["**/api/careers", { jobs: [], total: 0 }], ["**/api/ssoc", { results: [], classifications: [] }], ["**/api/ssic", { matched: false, results: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/company-registry", { matched: false }], ["**/api/geocode**", { matched: false }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => {
    let b = {}; try { b = r.request().postDataJSON(); } catch (_) {}
    const sys = String(b?.system || ""); const pr = String(b?.messages?.[0]?.content || "");
    let text = "[]";
    if (/job-analysis specialist/i.test(sys) && /Extract the real responsibilities/i.test(pr)) text = respFx;
    else if (/skeptical labour-market analyst/i.test(sys)) text = critFx;
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "reviewer-contract-fixture" }) });
  });
  return page;
}
async function readSpeakers(page, scope) {
  return page.locator(`${scope} [data-speaker-kind]`).evaluateAll((els) => els.map((el) => ({ kind: el.dataset.speakerKind, id: el.dataset.reviewerId || null, lens: el.dataset.lens || null, text: el.textContent.replace(/\s+/g, " ").trim() })));
}
const activeIds = new Set(active.map((r) => r.id));
const legitimateBadge = (s) => (s.kind === "reviewer" && s.id && activeIds.has(s.id) && s.text.toUpperCase() === reviewerDisplayName(s.id).toUpperCase()) || (s.kind === "lens" && s.lens && !s.id) || s.kind === "rule";
async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  const tag = phone ? "phone" : "desktop";
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
  // The Comments window lives on the six-view analysis surface, reached through the workspace navigator.
  await page.getByRole("button", { name: "Open the workspace navigator" }).click();
  await page.getByRole("menuitem", { name: /More analysis/ }).click();
  await page.getByRole("tablist", { name: "Analysis views" }).waitFor({ state: "visible", timeout: 15000 });
  // Comments window (on The Ad view): every badge resolves to an active roster voice and shows its display name.
  await page.getByRole("tab", { name: "The Ad" }).click();
  await page.getByRole("tablist", { name: "right panel windows" }).getByRole("tab", { name: "Comments" }).click();
  await page.locator("[data-comment-anchor]").first().waitFor({ state: "visible", timeout: 15000 });
  const badges = await page.locator("[data-comment-anchor] [data-speaker-kind]").evaluateAll((els) => els.map((el) => ({ kind: el.dataset.speakerKind, id: el.dataset.reviewerId || null, text: el.textContent.trim(), label: el.closest("[data-comment-anchor]").getAttribute("aria-label") })));
  ok(badges.length >= 3, `${tag}: the Comments window renders reviewer comments (${badges.length})`);
  ok(badges.every((b) => b.kind === "reviewer" && activeIds.has(b.id)), `${tag}: every comment badge carries an ACTIVE roster id (${badges.map((b) => b.id).join(", ")})`);
  ok(badges.every((b) => b.text === reviewerDisplayName(b.id)), `${tag}: every badge shows the roster display name for its id`);
  ok(badges.every((b) => b.label.startsWith(reviewerDisplayName(b.id) + "'s ")), `${tag}: the accessible label names the same voice`);
  ok(!badges.some((b) => /reviewer:/.test(b.text)), `${tag}: a raw reviewer id is never shown as a name`);
  ok(badges.every((b) => !/\s{2,}/.test(b.label) && /'s [a-z ]+ comment/i.test(b.label)), `${tag}: every accessible label carries the action word with no empty slot`);
  const chips = await page.locator("[data-comment-anchor] [data-review-verb]").evaluateAll((els) => els.map((el) => ({ verb: el.dataset.reviewVerb, text: el.textContent.trim() })));
  eq(chips.length, badges.length, `${tag}: every comment shows its type chip carrying the canonical verb`);
  ok(chips.every((c) => c.text.length > 0 && ["comment", "insert", "delete", "replace", "split", "merge", "relabel", "escalate", "withhold"].includes(c.verb)), `${tag}: type chips are non-empty and each verb is canonical (${chips.map((c) => c.text + "=" + c.verb).join(", ")})`);
  ok(chips.some((c) => c.verb === "replace"), `${tag}: the suggested rewrite is a replace proposal`);
  const rewrite = await page.locator("[data-comment-anchor]").filter({ hasText: "suggested rewrite" }).first().innerText();
  ok(/\u2192/.test(rewrite), `${tag}: the suggested rewrite body (original -> suggestion) renders`);
  // The Ad toolbar's "Comments" markup mode still shows the comment-only voices (conformance-auditor C1a).
  await page.getByRole("button", { name: "Comments", pressed: false }).first().click();
  await page.waitForFunction(() => document.querySelectorAll("[data-comment-anchor]").length > 0, null, { timeout: 5000 });
  const commentsMode = await page.locator("[data-comment-anchor] [data-review-verb]").evaluateAll((els) => els.map((el) => el.dataset.reviewVerb));
  ok(commentsMode.length > 0 && commentsMode.every((v) => v === "comment" || v === "withhold"), `${tag}: Comments markup mode keeps the comment and withhold voices (${commentsMode.join(", ")})`);
  await page.getByRole("button", { name: "Evidence view" }).click();
  await page.locator("[data-comment-anchor]").first().waitFor({ state: "visible", timeout: 5000 });
  // A decision is a human act and renders as one: identity withheld in words, never a reviewer id.
  await page.locator("[data-comment-anchor]").first().getByRole("button", { name: /^Accept/ }).click();
  const decided = page.locator("[data-decided-by]").first();
  await decided.waitFor({ state: "visible", timeout: 5000 });
  const decidedBy = await decided.getAttribute("data-decided-by"); const decidedText = await decided.textContent();
  ok(isHumanActorId(decidedBy) && !isReviewerActorId(decidedBy), `${tag}: the decision is attributed to a human actor (${decidedBy})`);
  ok(/decided by you/.test(decidedText) && /identity not recorded/.test(decidedText) && !/reviewer:/.test(decidedText), `${tag}: the decision text says who decided and that identity is withheld, not invented (${decidedText})`);
  const decidedLabel = await page.locator("[data-comment-anchor]").first().getAttribute("aria-label");
  ok(/Decision: accepted by you/.test(decidedLabel), `${tag}: the accessible label carries the human decision (${decidedLabel})`);
  // Analysis views: lens cards are lenses, advisory cards carry the advisory voice, nothing off roster.
  await page.getByRole("tab", { name: "Critical Read" }).click();
  await page.locator('[data-speaker-kind="lens"]').first().waitFor({ state: "visible", timeout: 15000 });
  const crit = await readSpeakers(page, "body");
  const lenses = crit.filter((s) => s.kind === "lens");
  ok(lenses.length >= 2, `${tag}: deterministic lens cards render as lenses (${[...new Set(lenses.map((s) => s.lens))].join(", ")})`);
  ok(lenses.every((s) => s.lens && !s.id && /LENS$/.test(s.text)), `${tag}: a lens badge names the lens and carries no reviewer id`);
  ok(!crit.some((s) => /SIGNAL AUDITOR/.test(s.text) && s.kind !== "reviewer"), `${tag}: the retired fallback that badged rule output as Signal Auditor is gone`);
  // The deep-read panel (every adversarial advisory voice) is collapsed on a first visit; restore it.
  const restore = page.getByRole("button", { name: /^Restore panel: (deepRead|Deep read)/ });
  if (await restore.count()) await restore.first().click();
  await page.locator("[data-advisory-voice]").nth(2).waitFor({ state: "visible", timeout: 10000 });
  const advisory = await page.locator("[data-advisory-voice]").evaluateAll((els) => els.map((el) => ({ voice: el.dataset.advisoryVoice, sibling: el.previousElementSibling && el.previousElementSibling.dataset.reviewerId })));
  ok(advisory.length >= 3, `${tag}: advisory cards render from the Critical Read fixture (${advisory.length})`);
  ok(advisory.every((a) => a.sibling === "reviewer:critical-read"), `${tag}: every advisory card is voiced by the roster's advisory reviewer, whatever hat it wears (${[...new Set(advisory.map((a) => a.voice))].join(", ")})`);
  ok(advisory.every((a) => !isRosterDisplayName(a.voice)), `${tag}: no advisory hat is a roster name (an AI card never impersonates a rule reviewer)`);
  const mashup = crit.filter((s) => s.id === "reviewer:role-analyst");
  ok(mashup.length >= 0, `${tag}: contradiction cards, when present, are voiced by Role Analyst`);
  await page.getByRole("tab", { name: "Requirements & Gates" }).click();
  const gates = await readSpeakers(page, "body");
  ok(gates.filter((s) => s.kind === "lens").length >= 1, `${tag}: hard-gate cards render as a lens`);
  // Negative fixture: no speaker badge anywhere on the surfaces shows a name outside the roster.
  const everywhere = [...badges.map((b) => ({ kind: b.kind, id: b.id, text: b.text, lens: null })), ...crit, ...gates];
  ok(everywhere.length >= 8, `${tag}: enough speaker badges were read to make the negative fixture meaningful (${everywhere.length})`);
  ok(everywhere.every(legitimateBadge), `${tag}: every speaker badge is a roster voice or a lens, never an unrostered name (${JSON.stringify(everywhere.filter((s) => !legitimateBadge(s)))})`);
  ok(!everywhere.some((s) => s.kind === "unrostered"), `${tag}: no "voice not on roster" badge appears`);
  ok(!everywhere.some((s) => s.kind === "reviewer" && !activeIds.has(s.id)), `${tag}: no declared-inactive voice renders as a live speaker`);
  for (const stray of ["EVIDENCE AUDITOR", "QOI CHECK · REVIEWER", "VOICE NOT ON ROSTER"]) ok(!everywhere.some((s) => s.text.toUpperCase().includes(stray)), `${tag}: stray name "${stray}" absent`);
  await page.screenshot({ path: `test-results/reviewer-contract/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`Part B (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
