// BLP-012 verify the complete candidate-proof workflow.
//
// WHAT THIS SUITE IS FOR, AND WHAT IT DELIBERATELY IS NOT.
//
// BLP-007 through BLP-011 each own a suite that verifies its own slice of the candidate-proof
// chain, and each of those suites mounts its own session. That is exactly why none of them can
// verify CONTINUITY: a property that only exists across stages cannot be observed by a test that
// sees one stage. This suite drives the whole chain in ONE session - paste, excerpt, ledger
// record, link to role evidence, state declaration, destination approval, output - and asserts
// only the three things BLP-012's acceptance criteria name:
//
//   (i)   desktop and phone workflows complete without overlap or lost state
//   (ii)  keyboard operation and focus restoration pass
//   (iii) the evidence round trip returns to the exact originating context
//
// It does not re-assert the per-slice behaviours those five suites already own, with TWO named
// exceptions, because an unqualified claim of no duplication would be false and the conformance
// auditor caught it: the focus return to the exact originating link duplicates proof-links.mjs, and
// the print package's carried count duplicates proof-destinations.mjs. Both are kept deliberately -
// they are the hinges of criteria (ii) and (iii), and a continuity suite that took them on trust
// from another session's run would be asserting continuity it never observed. Everything else is
// left to its owner, because re-asserting it would raise this suite's count without raising
// coverage, which is the count-inflation this programme has already corrected twice.
//
// "NO LOST STATE" IS DEFINED CONCRETELY HERE, because abstractly it is unfalsifiable. Six named
// anchors are captured when the records are minted and re-read after every later stage; each has
// an observation that can fail. They are listed at ANCHORS below with what would break each one.
//
// "WITHOUT OVERLAP" IS A RELATION BETWEEN TWO ELEMENTS, not containment. proof-links.mjs already
// asserts the ledger does not exceed the viewport; that is a different property. Here the suite
// names the PAIRS of elements that must be readable at the same time and asserts that neither
// obscures the other. The pair list is the specification and is what a reader can argue with.
//
// Four widths, via BLP028_VIEWPORTS: 1440x1000, 2048x1280, 390x844, 430x932. The narrowest phone
// is where overlap surfaces, and the ledger suites test only 430x932 today, so the more dangerous
// width is the one currently unverified.
//
// PROVENANCE NOTE. This file imports BLP028_VIEWPORTS - the frozen four-width list and nothing
// else - from tests/support/blp028-matrix.mjs, which entered the repository at 61531dc (PR #508)
// without a scope ruling and which the Supervisor's #508 ruling records as material, not as
// provenance. An earlier draft also imported assertMatrixSurface and never called it, which made
// this note read as though that helper were exercised here; the conformance auditor caught the dead
// import and it is gone. Importing the width list verifies NOTHING about that file: every geometry
// observation below is this suite's own code.
//
// Run: node tests/candidate-proof-workflow.mjs        (BASE_URL defaults to http://127.0.0.1:4173)

import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BLP028_VIEWPORTS } from "./support/blp028-matrix.mjs";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };

const base = process.env.BASE_URL || "http://127.0.0.1:4173";

// ---------------------------------------------------------------------------------------------
// Fixtures. Same shape as the BLP-011 suite's, so the chain this suite drives is the chain the
// slice suites drive; only the assertions differ.
// ---------------------------------------------------------------------------------------------
const MCF_BODY = ["Responsibilities", "- Monitor operational data and investigate service exceptions across the payments platform", "- Prepare the monthly management accounts and variance commentary for the finance director", "- Support various ad-hoc reporting requests and other duties as assigned to the operations team", "- Coordinate quarterly access reviews with the technology risk function and document outcomes", "Requirements", "- Knowledge of SQL and data pipelines is required for this role", "- Degree in accountancy, business or a related discipline", "- At least three years in an operations or finance operations role", "Benefits", "- Hybrid working arrangement with two office days a week"].join("\n");
const job = { uuid: "MCF-2026-000123", title: "Operations Analyst", employer: "EXAMPLE BANK LTD", description: MCF_BODY, responsibilitiesText: MCF_BODY, skills: ["Data Analytics", "SQL", "Operations"], categories: ["Banking and Finance"], employmentType: "Permanent", positionLevels: ["Professional"], salaryMin: 5000, salaryMax: 7000, postedDate: "2026-09-01T00:00:00.000Z", postedDateRaw: "2026-09-01", source: "MyCareersFuture", mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000123" };
const job2 = { ...job, uuid: "MCF-2026-000456", title: "Finance Operations Lead", description: `${MCF_BODY}\n- Lead the quarterly close for the regional entities`, responsibilitiesText: `${MCF_BODY}\n- Lead the quarterly close for the regional entities`, mcfUrl: "https://www.mycareersfuture.gov.sg/job/MCF-2026-000456" };
const companyPayload = { query: job.employer, queryKey: "example bank ltd", ambiguous: false, totalPostings: 2, pagesPolled: 1, matches: [{ key: "example bank ltd", displayName: job.employer, name: job.employer, count: 2, jobs: [job, job2] }] };
const duties = ["Monitor operational data and investigate service exceptions across the payments platform", "Prepare the monthly management accounts and variance commentary for the finance director", "Support various ad-hoc reporting requests and other duties as assigned to the operations team", "Coordinate quarterly access reviews with the technology risk function and document outcomes"];
const respFx = JSON.stringify({ summary: "Runs operational monitoring and finance reporting for the payments platform.", responsibilities: duties.map((text, i) => ({ n: i + 1, text, cat: "Delivery & Execution", freq: "Core", sk: [] })) });

const MARKER = "WORKFLOW-MARKER-DO-NOT-PERSIST";
const CV = `I monitored operational data daily and investigated every payments exception ${MARKER}.\nI closed the monthly accounts.`;
const WANTED = `I monitored operational data daily and investigated every payments exception ${MARKER}.`;
// The claim must pass the overclaim gate, or assemble stays disabled and the round-trip stages
// below would be testing a disabled control rather than the workflow.
const CLAIM = "monitored operational data daily";

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
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "candidate-proof-workflow-fixture" }) });
  });
  return page;
}

// Poll for a focus condition and then RETURN what focus settled on, so the caller asserts it with a
// message that names the outcome. A bare waitForFunction fails with a timeout that names nothing,
// and this programme has already had to correct one assertion of that shape.
async function settleFocus(page, wanted, tries = 40) {
  let seen = null;
  for (let i = 0; i < tries; i += 1) {
    seen = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      return { testid: a.dataset?.testid || null, tag: a.tagName, linkId: a.closest?.('[data-testid="cpl-link"]')?.dataset.linkId || null };
    });
    if (wanted(seen)) return seen;
    await page.waitForTimeout(50);
  }
  return seen || { testid: null, tag: null, linkId: null };
}

const record = (page, i) => page.locator('[data-testid="cpl-record"]').nth(i);
const destRow = (page, i, key) => record(page, i).locator(`[data-testid="cpl-dest"][data-destination="${key}"]`);
const noticeText = (page) => page.getByTestId("cpl-notice").textContent();
const noticeChanged = (page, prev) => page.waitForFunction((before) => { const t = document.querySelector('[data-testid="cpl-notice"]')?.textContent || ""; return t.trim().length > 0 && t !== before; }, prev, { timeout: 5000 });
const waitState = (page, i, state) => page.waitForFunction(([n, s]) => document.querySelectorAll('[data-testid="cpl-record"]')[n]?.dataset.state === s, [i, state], { timeout: 5000 });
const waitDest = (page, i, key, state) => page.waitForFunction(([n, k, s]) => document.querySelectorAll('[data-testid="cpl-record"]')[n]?.querySelector(`[data-testid="cpl-dest"][data-destination="${k}"]`)?.dataset.destState === s, [i, key, state], { timeout: 5000 });
const selectRange = (page, start, end) => page.getByTestId("person-evidence-paste").evaluate((el, [s, e]) => { el.focus(); el.setSelectionRange(s, e); }, [start, end]);

// Press a control BY KEYBOARD, never by click: focus it, assert it really took focus (a control
// that cannot be focused would otherwise send the key to the document and the stage would pass
// for the wrong reason), then send the key.
async function pressByKeyboard(locator, page, key = "Enter", label = "") {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  // IDENTITY, not "some focusable element has focus". locator.focus() does NOT throw on a disabled
  // control - Chromium simply leaves activeElement where it was, and in this suite that is almost
  // always another ledger control carrying a test id. An earlier draft checked only that SOME
  // element with a test id held focus, which would have passed while the key went to the previously
  // focused control; the conformance auditor caught it. This is the check chooseByKeyboard already
  // made correctly, and the asymmetry between the two helpers was the whole defect.
  const focused = await locator.evaluate((el) => ({
    isTarget: document.activeElement === el,
    disabled: el.disabled === true,
    landedOn: document.activeElement?.dataset?.testid || document.activeElement?.tagName || null,
  }));
  ok(focused.isTarget && !focused.disabled, `${label}: THIS control took keyboard focus and is not disabled before the key is sent (focus landed on ${JSON.stringify(focused.landedOn)}, disabled=${focused.disabled}); without identity the key would go to whatever held focus before and the stage would pass without operating this control at all`);
  await page.keyboard.press(key);
  return focused;
}

// A wait whose failure names what was expected. A bare waitForFunction fails with a timeout that
// says only that time ran out, and this suite's own header records that shape being corrected once
// already; the conformance auditor found six more of them here.
async function named(promise, message) {
  try { await promise; } catch (err) {
    throw new assert.AssertionError({ message: `${message} - the wait for this never became true (${String(err.message).split("\n")[0]})`, actual: false, expected: true, operator: "==" });
  }
}

// ---------------------------------------------------------------------------------------------
// Overlap, as a RELATION between two elements.
//
// Two checks, because "overlap" covers two different failures and one assertion cannot catch both
// honestly. A blanket "no two bounding boxes intersect" would be dishonest: a layered interface
// intersects boxes legitimately (a floating control is meant to float), so such an assertion would
// either fail on correct behaviour or be weakened until it meant nothing.
//
//   PAIRS      - named elements that must be readable AT THE SAME TIME. For each pair, neither
//                obscures the other at the other's own sample points. The pair list below is the
//                specification: it is what a reader can argue with.
//   CONTROLS   - every ledger control currently in view answers at its own centre. This is the
//                check that catches a floating control, a sticky header or an overlay sitting on
//                top of something the human must be able to press. When it fails it names the
//                element that is covering the control, so the failure is diagnosable.
// ---------------------------------------------------------------------------------------------

// Pairs are resolved per record, so they exist at every width and in every state reached below.
// `states` names the record states in which the pair exists at all: the declaration controls are
// replaced once a declaration is made, so a single flat list would go missing at stage 2 and the
// check would have to be softened into something that cannot fail. Instead the caller passes the
// state it expects, the state is ASSERTED rather than assumed, and only the applicable pairs run -
// with a guard that at least one did.
// WHAT THESE PAIRS DO AND DO NOT ESTABLISH. The mechanism is elementFromPoint, a pointer hit test.
// It establishes that one element is not painted over another. It establishes NOTHING about reading
// order, about what an assistive technology announces, or about keyboard reachability - those are
// asserted separately below, by focus and by key presses. An earlier draft of this list justified a
// pair by saying a keyboard user would otherwise "hear an outcome they cannot see", which claimed an
// auditory property from a visual check; the accessibility reviewer caught the substitution and the
// wording now says only what the check measures.
const DEST_KEYS = ["resume", "coverLetter", "interview", "portfolio", "workSample"];
const PAIRS = [
  { a: '[data-testid="cpl-declare-demonstrated"]', b: '[data-testid="cpl-declare-certified"]', states: ["CLAIMED_ONLY"], why: "the two state declarations sit side by side at phone width and must both stay visible and hit-testable" },
  { a: '[data-testid="cpl-claim-state"]', b: '[data-testid="cpl-claim-save"]', states: null, why: "the rendered claim outcome and the control that produces it must remain separately visible, so the outcome is not painted over by the control that caused it" },
  ...DEST_KEYS.map((key) => ({ a: `[data-testid="cpl-dest"][data-destination="${key}"] [data-testid="cpl-dest-approve"]`, b: `[data-testid="cpl-dest"][data-destination="${key}"] [data-testid="cpl-dest-revoke"]`, states: null, why: `approve and revoke are adjacent on the ${key} destination row and pressing the wrong one is not recoverable by undo; all five rows are checked, not just the one this suite happens to drive` })),
  { a: '[data-testid="cpl-link-open"]', b: '[data-testid="cpl-unlink"]', states: null, needsLink: true, why: "open and unlink are adjacent on a link row and carry the same mistaken-press cost as approve against revoke" },
  { a: '[data-testid="cpl-record-state"]', b: '[data-testid="cpl-excerpt"]', states: null, why: "the state of a record and the text it was cut from must be visible together, or the state is read against the wrong excerpt" },
];

async function assertPairsReadable(page, scope, tag, expectedState, expectLinked) {
  // Both preconditions are ASSERTED, never assumed. A filter that quietly drops pairs because the
  // elements happen to be absent is a check that reports success for not having looked.
  const actualState = await scope.getAttribute("data-state");
  eq(actualState, expectedState, `${tag}: the record is in the state this pair set was chosen for (the filter below would otherwise skip pairs for a reason nobody stated)`);
  const hasLink = (await scope.locator('[data-testid="cpl-link"]').count()) > 0;
  eq(hasLink, expectLinked, `${tag}: the record's link presence matches what this stage expects (${expectLinked ? "a link was made earlier in this session" : "no link has been made yet"}), so the link-row pair is included or excluded for a stated reason`);
  const applicable = PAIRS.filter((p) => (p.states === null || p.states.includes(expectedState)) && (!p.needsLink || hasLink));
  ok(applicable.length > 0, `${tag}: at least one overlap pair applies in state ${expectedState} (zero applicable pairs would make this whole check vacuous)`);
  let judgedInView = 0;
  for (const pair of applicable) {
    const found = await scope.evaluate((root, p) => {
      const a = root.querySelector(p.a);
      const b = root.querySelector(p.b);
      if (!a || !b) return { missing: true, a: !!a, b: !!b };
      if (a.contains(b) || b.contains(a)) return { nested: true };
      // Scroll BOTH into view. Scrolling only the first leaves a tall pair with the second never
      // sampled, and an unsampled element is judged "not obscured" for the reason that nobody
      // looked - the conformance auditor's finding on the first version of this helper.
      b.scrollIntoView({ block: "center" });
      a.scrollIntoView({ block: "center" });
      const sample = (el) => {
        const r = el.getBoundingClientRect();
        // Clip against the viewport AND every scrolling ancestor, exactly as the control check
        // below does. This helper originally clipped against the viewport alone, which is the same
        // mistake this file records having made once already: the ledger lives inside an overflow
        // panel, so a box inside the viewport can be painted nowhere at all.
        let left = Math.max(0, r.left), right = Math.min(innerWidth, r.right);
        let top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
        for (let p = el.parentElement; p; p = p.parentElement) {
          const st = getComputedStyle(p);
          if (st.overflow === "visible" && st.overflowX === "visible" && st.overflowY === "visible") continue;
          const pr = p.getBoundingClientRect();
          left = Math.max(left, pr.left); right = Math.min(right, pr.right);
          top = Math.max(top, pr.top); bottom = Math.min(bottom, pr.bottom);
        }
        if (right - left < 2 || bottom - top < 2) return { inView: false, points: [] };
        const inset = (v, span) => Math.min(8, Math.max(1, span / 4)) * v;
        return { inView: true, points: [
          [(left + right) / 2, (top + bottom) / 2],
          [left + inset(1, right - left), top + inset(1, bottom - top)],
          [right - inset(1, right - left), bottom - inset(1, bottom - top)],
        ] };
      };
      const judge = (self, other) => {
        const s = sample(self);
        if (!s.inView) return { inView: false, obscuredBy: null };
        for (const [x, y] of s.points) {
          const hit = document.elementFromPoint(x, y);
          if (hit && (hit === other || other.contains(hit))) {
            return { inView: true, obscuredBy: other.dataset.testid || other.tagName, at: [Math.round(x), Math.round(y)] };
          }
        }
        return { inView: true, obscuredBy: null };
      };
      return { missing: false, nested: false, aJudged: judge(a, b), bJudged: judge(b, a) };
    }, pair);
    if (found.missing) { ok(false, `${tag}: the overlap pair names elements that are not on this surface (a=${found.a}, b=${found.b}) - the pair list is wrong, not the layout`); continue; }
    ok(!found.nested, `${tag}: the overlap pair ${pair.a} / ${pair.b} is two separate elements, not one inside the other (a nested pair cannot overlap and the assertion would be vacuous)`);
    if (found.aJudged.inView) judgedInView += 1;
    if (found.bJudged.inView) judgedInView += 1;
    ok(found.aJudged.obscuredBy === null, `${tag}: ${pair.a} is not obscured by ${pair.b} - ${pair.why} (covered at ${JSON.stringify(found.aJudged.at || null)} by ${found.aJudged.obscuredBy})`);
    ok(found.bJudged.obscuredBy === null, `${tag}: ${pair.b} is not obscured by ${pair.a} - ${pair.why} (covered at ${JSON.stringify(found.bJudged.at || null)} by ${found.bJudged.obscuredBy})`);
  }
  // Without this, every "not obscured" above can pass because nothing was ever sampled. The number
  // is the pair members actually brought into view, not the pairs considered.
  // BOTH members of EVERY pair, hence times two. An earlier version of this guard compared against
  // applicable.length while its message claimed both members were sampled, so one missing member
  // per pair passed silently - the message and the comparison had come apart, which is the same
  // defect this guard exists to prevent. A deliberate falsification (collapsing one member to a
  // zero box) passed against that version and fails against this one.
  eq(judgedInView, applicable.length * 2, `${tag}: BOTH members of all ${applicable.length} applicable pairs were sampled in view (${judgedInView} of ${applicable.length * 2} members judged); a member that is never sampled is reported as unobscured for the reason that nobody looked at it`);
}

// Every ledger control in view answers at its own centre. Names the covering element on failure.
const LEDGER_CONTROLS = ["cpl-declare-demonstrated", "cpl-declare-certified", "cpl-withdraw", "cpl-offer-again", "cpl-claim-input", "cpl-claim-save", "cpl-type-select", "cpl-link-select", "cpl-link-button", "cpl-dest-approve", "cpl-dest-revoke", "cpl-link-open", "cpl-unlink"];

async function assertControlsReachable(page, tag, stage, required, anchorTestId = "cpl-record") {
  // The ledger is taller than any viewport, so no single scroll position holds every control. An
  // earlier version scrolled the record to centre once and judged whatever happened to be there,
  // which meant the named-control guard could not be satisfied for controls that live elsewhere in
  // the record. This walks the named controls, bringing EACH into view and judging the sweep from
  // that position, so the guard below is about the controls this suite actually operates rather
  // than about the accident of where the scroll landed.
  const judged = new Set();
  const bad = [];
  const undersized = [];
  let seen = 0;
  let clipped = 0;
  const positions = [anchorTestId, ...required];
  for (const at of positions) {
    await page.evaluate((id) => { document.querySelector(`[data-testid="${id}"]`)?.scrollIntoView({ block: "center" }); }, at);
    await page.waitForTimeout(60);
    const pass = await page.evaluate((ids) => {
      const badHere = [];
      const judgedHere = [];
      const smallHere = [];
      let seenHere = 0;
      let clippedHere = 0;
      for (const id of ids) {
        for (const el of document.querySelectorAll(`[data-testid="${id}"]`)) {
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          // Clip against the VIEWPORT and against every scrolling ancestor. The ledger lives inside
          // an overflow panel, so a control scrolled out of that panel still reports a rect inside
          // the viewport while being painted nowhere - which is why clipping against the viewport
          // alone was not enough and an early run reported an ancestor at the sample point.
          let left = Math.max(0, r.left), right = Math.min(innerWidth, r.right);
          let top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
          for (let p = el.parentElement; p; p = p.parentElement) {
            const st = getComputedStyle(p);
            if (st.overflow === "visible" && st.overflowX === "visible" && st.overflowY === "visible") continue;
            const pr = p.getBoundingClientRect();
            left = Math.max(left, pr.left); right = Math.min(right, pr.right);
            top = Math.max(top, pr.top); bottom = Math.min(bottom, pr.bottom);
          }
          const visible = Math.max(0, right - left) * Math.max(0, bottom - top);
          if (visible < r.width * r.height * 0.5 || right - left < 8 || bottom - top < 8) { clippedHere += 1; continue; }
          seenHere += 1;
          judgedHere.push(id);
          // TOUCH TARGET, criterion (i)'s own subject rather than a loan from another requirement:
          // a control too small to hit reliably at the narrow phone width is a workflow that cannot
          // complete on a phone. The full box is measured, because the target is the control.
          if (r.width < 44 || r.height < 44) smallHere.push({ control: id, w: Math.round(r.width), h: Math.round(r.height) });
          const x = (left + right) / 2, y = (top + bottom) / 2;
          const hit = document.elementFromPoint(x, y);
          if (hit === el || el.contains(hit)) continue;
          // An ancestor at the sample point means the control is not painted there at all; anything
          // else means a sibling or an overlay is on top. Both are reported, told apart by name.
          const kind = hit && hit.contains(el) ? "an ancestor, so the control is not painted at its own visible centre" : "another element on top";
          badHere.push({ control: id, coveredBy: hit ? (hit.dataset?.testid || `${hit.tagName}.${String(hit.className).slice(0, 40)}`) : "nothing", kind });
        }
      }
      return { seenHere, clippedHere, badHere, judgedHere, smallHere };
    }, LEDGER_CONTROLS);
    seen += pass.seenHere;
    clipped += pass.clippedHere;
    for (const id of pass.judgedHere) judged.add(id);
    for (const b of pass.badHere) if (!bad.some((x) => x.control === b.control && x.coveredBy === b.coveredBy)) bad.push(b);
    for (const u of pass.smallHere) if (!undersized.some((x) => x.control === u.control)) undersized.push(u);
  }
  ok(seen > 0, `${tag} ${stage}: at least one ledger control was judged in view across ${positions.length} scroll positions (a zero here would make the assertions below vacuous, which is the shape this programme keeps correcting)`);
  const judgedList = [...judged];
  const missing = required.filter((id) => !judged.has(id));
  ok(missing.length === 0, `${tag} ${stage}: every named control ${JSON.stringify(required)} was brought into view and judged; missing ${JSON.stringify(missing)} (judged: ${JSON.stringify(judgedList)}). Naming them stops this check passing on whichever control happens to be near the scroll centre`);
  ok(bad.length === 0, `${tag} ${stage}: no ledger control judged in view is covered by another element; ${seen} judgements across ${positions.length} positions, ${clipped} skipped as less than half visible, covered: ${JSON.stringify(bad)}`);
  ok(undersized.length === 0, `${tag} ${stage}: every ledger control judged in view is at least 44 by 44 CSS pixels; undersized: ${JSON.stringify(undersized)}. This is criterion (i)'s own subject, not a borrowed accessibility rule: a control too small to hit reliably at the narrow phone width is a workflow that cannot complete on a phone`);
}

// ---------------------------------------------------------------------------------------------
// "No lost state", defined concretely.
//
// Six anchors, captured when the records are minted and re-read after every later stage. Each has
// an observation that can fail, named here so a reader can check the definition rather than take
// it on trust:
//
//   proofId     the id minted when the excerpt was confirmed. FAILS if any later stage re-mints
//               the record instead of amending it - the id that carries the destination approval
//               at the end would then not be the id that was confirmed at the start.
//   sourceId    the pasted document's identity. FAILS if a stage re-reads the paste box and makes
//               a new source, which would silently orphan every record cut from the old one.
//   spanId      the excerpt's identity within that source. FAILS if a stage re-extracts the span.
//   excerpt     the exact text the record was cut from. FAILS if a stage re-renders it from the
//               live paste box rather than from what was confirmed.
//   claim       the human's own words. FAILS if a state declaration, a destination approval, a
//               proof-type change or a round trip clears the field.
//   recordCount FAILS if a stage drops or duplicates a record.
//
// Two further anchors are captured only after the stages that create them, and are asserted from
// that point on: the link's canonical target id, and the resume destination's state.
// ---------------------------------------------------------------------------------------------
async function readAnchors(page) {
  return page.evaluate(() => {
    const rec = document.querySelectorAll('[data-testid="cpl-record"]')[0];
    if (!rec) return null;
    const link = rec.querySelector('[data-testid="cpl-link"]');
    const dest = rec.querySelector('[data-testid="cpl-dest"][data-destination="resume"]');
    return {
      proofId: rec.dataset.proofId || null,
      sourceId: rec.dataset.sourceId || null,
      spanId: rec.dataset.spanId || null,
      proofType: rec.dataset.proofType || null,
      excerpt: rec.querySelector('[data-testid="cpl-excerpt"]')?.textContent ?? null,
      claim: rec.querySelector('[data-testid="cpl-claim-input"]')?.value ?? null,
      // The draft field is one step removed from committed ledger state, so the committed
      // announcement is read alongside it; survival of the claim across a round trip should not
      // rest on the editable field alone.
      claimCommitted: /Claim recorded/.test(rec.querySelector('[data-testid="cpl-claim-state"]')?.textContent || ""),
      recordCount: document.querySelectorAll('[data-testid="cpl-record"]').length,
      linkId: link?.dataset.linkId ?? null,
      linkTargetId: link?.dataset.targetId ?? null,
      destResume: dest?.dataset.destState ?? null,
    };
  });
}

// Compare only the keys the caller names, so a stage that is MEANT to move one anchor (declaring a
// state, approving a destination) is not asserted to have left it alone.
function assertAnchors(before, after, keys, tag, stage) {
  ok(after !== null, `${tag} ${stage}: the ledger still has a first record to read anchors from (a null here means the stage lost the record entirely)`);
  for (const key of keys) {
    eq(after?.[key], before[key], `${tag} ${stage}: ${key} survives unchanged (was ${JSON.stringify(before[key])}, now ${JSON.stringify(after?.[key])}); a change here is lost or re-minted state, which criterion (i) forbids`);
  }
}

// proofType is carried from the mint onwards. It was originally absent, so a regression that
// re-minted it during stage 2's four mutations was invisible until stage 3 - and stage 2 then set
// it explicitly, hiding the evidence. The one stage that legitimately changes it says so by name.
const CARRIED = ["proofId", "sourceId", "spanId", "excerpt", "recordCount", "proofType"];

// ---------------------------------------------------------------------------------------------
// The one session, driven end to end.
// ---------------------------------------------------------------------------------------------
async function setupSession({ width, height, phone }) {
  const page = await newPage({ width, height });
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "Search by employer" }).click();
  await page.getByRole("searchbox", { name: "Company name" }).fill(job.employer);
  await page.getByRole("button", { name: "Find company postings" }).click();
  await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: /Analyse this posting|Analyse role/ }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) {
    await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 });
    await page.getByTestId("wu-quick-fab").click();
    await page.getByTestId("wu-quick-job-ad").click();
  } else {
    const sh = page.getByTestId("wu-start-here");
    if (await sh.count() && await sh.isVisible()) await page.getByTestId("wu-explore-full-map").click();
  }
  await page.getByTestId("wu-individual-person").click();
  await page.getByTestId("wu-add-person-evidence").click();
  await page.getByTestId("candidate-proof-ledger").waitFor({ state: "visible", timeout: 15000 });
  const textarea = page.getByTestId("person-evidence-paste");
  await textarea.fill(CV);
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction((w) => document.querySelector('[data-testid="person-evidence-paste"]').value === w, CV, { timeout: 5000 });
  await selectRange(page, 0, WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  await selectRange(page, WANTED.length + 1, CV.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 2, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]').length === 2, null, { timeout: 5000 });
  return page;
}

// Operate a <select> BY KEYBOARD. Playwright's selectOption sets the value directly and proves
// nothing about keyboard reachability, so this walks the option list with ArrowDown and asserts the
// value actually moved. A select that cannot be driven from the keyboard fails here.
async function chooseByKeyboard(page, locator, wantedValue, label) {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  const plan = await locator.evaluate((el, want) => {
    const values = [...el.options].map((o) => o.value);
    return { from: el.selectedIndex, to: values.indexOf(want), count: values.length, focused: document.activeElement === el };
  }, wantedValue);
  ok(plan.focused, `${label}: the select takes keyboard focus (without focus the arrow keys would scroll the page instead of choosing)`);
  ok(plan.to >= 0, `${label}: the wanted option ${wantedValue} is among the ${plan.count} offered (fails if the option list no longer carries it)`);
  ok(plan.to !== plan.from, `${label}: the wanted option ${wantedValue} is NOT already selected (index ${plan.from}), so the arrow keys below have work to do; if a product default ever makes it pre-selected this helper would assert keyboard operability without pressing a key`);
  const step = plan.to > plan.from ? "ArrowDown" : "ArrowUp";
  for (let i = 0; i < Math.abs(plan.to - plan.from); i += 1) await page.keyboard.press(step);
  let landed = null;
  for (let i = 0; i < 25 && landed !== wantedValue; i += 1) { landed = await locator.evaluate((el) => el.value); if (landed !== wantedValue) await page.waitForTimeout(100); }
  eq(landed, wantedValue, `${label}: the arrow keys moved the select to ${wantedValue} (fails if the control is only settable by mouse or by script)`);
}

async function runViewport({ name, width, height, phone }) {
  const tag = name;
  const page = await setupSession({ width, height, phone });
  const rec0 = record(page, 0);
  const rec1 = record(page, 1);

  // -------------------------------------------------------------------------------------------
  // Stage 1. The anchors are minted. Everything after this is measured against them.
  // -------------------------------------------------------------------------------------------
  const minted = await readAnchors(page);
  ok(minted && minted.proofId && minted.sourceId && minted.spanId, `${tag} stage 1: the confirmed excerpt mints a record carrying a proof id, a source id and a span id (${JSON.stringify({ proofId: minted?.proofId, sourceId: minted?.sourceId, spanId: minted?.spanId })}); with any of them absent the continuity assertions below would compare nothing against nothing`);
  eq(minted.recordCount, 2, `${tag} stage 1: two confirmed excerpts mint two records`);
  eq(minted.claim, "", `${tag} stage 1: the claim field starts empty, never pre-filled, so what is asserted below is the human's own words`);
  await assertControlsReachable(page, tag, "stage 1 (records minted)", ["cpl-claim-input", "cpl-claim-save", "cpl-type-select", "cpl-declare-demonstrated"]);
  await assertPairsReadable(page, rec0, `${tag} stage 1`, "CLAIMED_ONLY", false);

  // -------------------------------------------------------------------------------------------
  // Stage 2. KEYBOARD ONLY, through the ledger's own controls. proof-links.mjs drives the LINK
  // control by keyboard; nothing drives these. Criterion (ii) covers them and they are unverified
  // before this suite. Every control below is focused, checked to have taken focus, and operated
  // by a key - never by click.
  // -------------------------------------------------------------------------------------------
  const linkSelect = rec0.getByTestId("cpl-link-select");
  const dutyOption = await linkSelect.locator("option").evaluateAll((els) => els.map((o) => o.value).find((v) => v.startsWith("duty|")));
  ok(typeof dutyOption === "string" && dutyOption.startsWith("duty|"), `${tag} stage 2: a duty target is offered to link to (${dutyOption}); without one the link stage would be skipped rather than tested`);
  await chooseByKeyboard(page, linkSelect, dutyOption, `${tag} stage 2 link target`);

  let before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-link-button"), page, "Enter", `${tag} stage 2 link`);
  await named(noticeChanged(page, before), `${tag} stage 2: linking by keyboard changed the ledger notice`);
  await named(page.waitForFunction(() => !document.querySelector('[data-testid="cpl-declare-demonstrated"]')?.disabled, null, { timeout: 5000 }), `${tag} stage 2: a standing link enables the demonstrated declaration`);
  // The EIGHTH control. The original probe measured the seven an accessibility review named and
  // this one was never among them, so "seven" was the reviewer's list reported as the complete set.
  // Linking disables its own button (the chooser resets) and dropped focus to the document body at
  // both widths until the fix; the chooser stays live, so that is the successor.
  let f = await settleFocus(page, (a) => a?.testid === "cpl-link-select");
  eq(f.testid, "cpl-link-select", `${tag} stage 2: linking by keyboard moves focus to the link chooser, which stays live when the link button disables itself; focus settled on ${JSON.stringify(f)}`);
  let now = await readAnchors(page);
  assertAnchors(minted, now, CARRIED, tag, "stage 2 after linking by keyboard");
  ok(now.linkId && now.linkTargetId === dutyOption.split("|")[1], `${tag} stage 2: the keyboard-made link carries the canonical target id that was chosen (${now.linkTargetId} against ${dutyOption.split("|")[1]}); a mismatch means the Enter key linked something other than the selected option`);
  const linked = now;

  before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-declare-demonstrated"), page, "Enter", `${tag} stage 2 declare`);
  await named(noticeChanged(page, before), `${tag} stage 2: declaring demonstrated by keyboard changed the ledger notice`);
  await named(waitState(page, 0, "DEMONSTRATED"), `${tag} stage 2: the Enter key on the demonstrated control moved the record to DEMONSTRATED`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-withdraw");
  eq(f.testid, "cpl-withdraw", `${tag} stage 2: declaring demonstrated moves focus to the withdraw control, which now occupies the place of the button that was pressed; focus settled on ${JSON.stringify(f)} (before the BLP-012 fix this was the document body, stranding a keyboard user at the top of a ledger thousands of pixels tall)`);
  now = await readAnchors(page);
  assertAnchors(linked, now, [...CARRIED, "linkId", "linkTargetId"], tag, "stage 2 after declaring demonstrated by keyboard");

  // The claim, typed by keyboard, saved by keyboard, and FOCUS RESTORATION asserted: the component
  // moves focus to the announced outcome so a keyboard user hears what happened. If that focus move
  // regresses, a keyboard user saves a claim and is told nothing.
  const claimInput = rec0.getByTestId("cpl-claim-input");
  await claimInput.scrollIntoViewIfNeeded();
  await claimInput.focus();
  await page.keyboard.type(CLAIM);
  eq(await claimInput.inputValue(), CLAIM, `${tag} stage 2: the claim is typed into the field by keystrokes, not set by script`);
  await pressByKeyboard(rec0.getByTestId("cpl-claim-save"), page, "Enter", `${tag} stage 2 save claim`);
  const claimFocus = await settleFocus(page, (a) => a?.testid === "cpl-claim-state");
  eq(claimFocus.testid, "cpl-claim-state", `${tag} stage 2: saving the claim by keyboard moves focus to the announced claim state, so the outcome is reachable without sight; focus settled on ${JSON.stringify(claimFocus)} instead (fails if focus is left on the save button, dropped to the document body, or moved anywhere that does not announce the outcome)`);
  ok(/Claim recorded/.test(await rec0.getByTestId("cpl-claim-state").innerText()), `${tag} stage 2: the element that took focus carries the text "Claim recorded" (this asserts the rendered text of the focused element; it does not establish what an assistive technology announced, which this suite has no means to observe)`);
  now = await readAnchors(page);
  assertAnchors(linked, now, [...CARRIED, "linkId", "linkTargetId"], tag, "stage 2 after saving the claim by keyboard");
  eq(now.claim, CLAIM, `${tag} stage 2: the claim reads back as the words that were typed`);
  const claimed = now;

  // The claim anchor's documented failure mode includes "a state declaration clears the field".
  // Until this step nothing drove it, because the declaration happened BEFORE the claim was typed;
  // a documented failure mode that is never exercised is a claim the code does not back (the
  // conformance auditor's finding). Withdraw and re-declare with the claim already recorded.
  // Focus is deliberately NOT asserted here: withdraw and declare both drop focus to the document
  // body today, which is the defect this requirement found and does not fix. See NOT COVERED.
  before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-withdraw"), page, "Enter", `${tag} stage 2 withdraw`);
  await named(noticeChanged(page, before), `${tag} stage 2: withdrawing the declaration by keyboard changed the ledger notice`);
  await named(waitState(page, 0, "CLAIMED_ONLY"), `${tag} stage 2: withdrawing returns the record to CLAIMED_ONLY`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-declare-demonstrated");
  eq(f.testid, "cpl-declare-demonstrated", `${tag} stage 2: withdrawing a declaration moves focus to the declare control that replaces the withdraw button; focus settled on ${JSON.stringify(f)}`);
  now = await readAnchors(page);
  eq(now.claim, CLAIM, `${tag} stage 2: withdrawing a declaration does NOT clear the human's claim (this is the anchor's own documented failure mode, driven rather than merely described)`);
  before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-declare-demonstrated"), page, "Enter", `${tag} stage 2 re-declare`);
  await named(noticeChanged(page, before), `${tag} stage 2: re-declaring demonstrated by keyboard changed the ledger notice`);
  await named(waitState(page, 0, "DEMONSTRATED"), `${tag} stage 2: the record can be declared demonstrated again after a withdrawal`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-withdraw");
  eq(f.testid, "cpl-withdraw", `${tag} stage 2: re-declaring after a withdrawal moves focus to the withdraw control again, so the behaviour is not a one-shot of the first declaration; focus settled on ${JSON.stringify(f)}`);
  now = await readAnchors(page);
  assertAnchors(claimed, now, [...CARRIED, "claim", "linkId", "linkTargetId"], tag, "stage 2 after a withdrawal and a re-declaration");

  before = await noticeText(page);
  await pressByKeyboard(destRow(page, 0, "resume").getByTestId("cpl-dest-approve"), page, "Enter", `${tag} stage 2 approve resume`);
  await named(noticeChanged(page, before), `${tag} stage 2: approving the resume destination by keyboard changed the ledger notice`);
  await named(waitDest(page, 0, "resume", "ALLOWED"), `${tag} stage 2: the Enter key on the approve control moved the resume destination to ALLOWED`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-dest-revoke");
  eq(f.testid, "cpl-dest-revoke", `${tag} stage 2: approving a destination moves focus to the revoke control on that row, which the approval has just made the live one; focus settled on ${JSON.stringify(f)}`);
  now = await readAnchors(page);
  assertAnchors(claimed, now, [...CARRIED, "claim", "linkId", "linkTargetId"], tag, "stage 2 after approving a destination by keyboard");
  eq(now.destResume, "ALLOWED", `${tag} stage 2: the destination approval was made by the Enter key on the approve control`);

  await chooseByKeyboard(page, rec0.getByTestId("cpl-type-select"), "CREDENTIAL", `${tag} stage 2 proof type`);
  await named(page.waitForFunction(() => document.querySelectorAll('[data-testid="cpl-record"]')[0]?.dataset.proofType === "CREDENTIAL", null, { timeout: 5000 }), `${tag} stage 2: choosing the proof type by keyboard recorded CREDENTIAL on the record`);
  now = await readAnchors(page);
  // proofType is the ONE anchor this stage is meant to move, so it is excluded here by name rather
  // than left out of the carried set entirely.
  assertAnchors(claimed, now, [...CARRIED.filter((k) => k !== "proofType"), "claim", "linkId", "linkTargetId"], tag, "stage 2 after choosing the proof type by keyboard");
  eq(now.proofType, "CREDENTIAL", `${tag} stage 2: the proof type is the one anchor this stage moves, and it moved to the chosen value`);
  eq(now.destResume, "ALLOWED", `${tag} stage 2: choosing the proof type by keyboard leaves the destination approval standing`);
  const beforeRoundTrip = now;

  await assertControlsReachable(page, tag, "stage 2 (record fully populated)", ["cpl-claim-input", "cpl-claim-save", "cpl-type-select", "cpl-link-open", "cpl-unlink"]);
  await assertPairsReadable(page, rec0, `${tag} stage 2`, "DEMONSTRATED", true);

  // -------------------------------------------------------------------------------------------
  // Stage 3. The evidence round trip, criterion (iii).
  //
  // proof-links.mjs already asserts that the LINKS survive this trip and that focus returns to the
  // originating control. What is new here is the rest of the record: the claim, the destination
  // approval, the proof type and the source and span identities must ALSO come back, because a
  // round trip that restores the links while dropping the claim satisfies BLP-009 and still loses
  // the human's work. That is the continuity no per-slice suite can see.
  // -------------------------------------------------------------------------------------------
  const openControl = rec0.getByTestId("cpl-link-open").first();
  const originLinkId = await openControl.locator("xpath=ancestor::*[@data-testid='cpl-link']").getAttribute("data-link-id");
  // Not a comparison of a value with itself: this reads the id from the DOM ancestor of the control
  // that is about to be pressed, while the anchor was read by a separate query. They agreeing is a
  // wiring check; what it rules out is a control detached from any link row, whose ancestor lookup
  // would return null. Stated for what it is, after the conformance auditor found the earlier
  // wording claimed more.
  ok(originLinkId !== null, `${tag} stage 3: the open control sits inside a link row and that row carries a link id (a null here means the control is detached from the record it claims to open)`);
  eq(originLinkId, beforeRoundTrip.linkId, `${tag} stage 3: the link row containing the control about to be pressed is the same row the anchors were read from`);
  await pressByKeyboard(openControl, page, "Enter", `${tag} stage 3 open target`);
  const workspaceRow = page.locator(`[data-testid="v31-workspace-evidence-${beforeRoundTrip.linkTargetId}"]`);
  await workspaceRow.waitFor({ state: "visible", timeout: 15000 });
  ok(await workspaceRow.isVisible(), `${tag} stage 3: the linked duty opens in the evidence workspace under its canonical id (fails if the jump invents, truncates or loses the id)`);

  await pressByKeyboard(page.getByTestId("return-work-universe"), page, "Enter", `${tag} stage 3 return`);
  await page.getByTestId("candidate-proof-ledger").waitFor({ state: "visible", timeout: 15000 });
  const returnFocus = await settleFocus(page, (a) => a?.testid === "cpl-link-open" && a?.linkId === originLinkId);
  eq(returnFocus.testid, "cpl-link-open", `${tag} stage 3: the return puts focus on a proof-link open control rather than on the ledger, the document body or the return control; focus settled on ${JSON.stringify(returnFocus)}`);
  eq(returnFocus.linkId, originLinkId, `${tag} stage 3: the return restores focus to the EXACT proof-link control that opened the workspace, not merely to the first link on the ledger (wanted ${originLinkId}, settled on ${JSON.stringify(returnFocus)})`);

  now = await readAnchors(page);
  assertAnchors(beforeRoundTrip, now, [...CARRIED, "claim", "proofType", "linkId", "linkTargetId", "destResume"], tag, "stage 3 after the evidence round trip");
  eq(now.claim, CLAIM, `${tag} stage 3: the human's own claim words come back from the workspace round trip (this is the loss BLP-009's own suite cannot see, because it asserts the links and not the record)`);
  eq(now.claimCommitted, true, `${tag} stage 3: the COMMITTED claim announcement survives the round trip too, not only the editable draft field; without this the claim's survival would rest on a textarea value that a remount could repopulate from anywhere`);
  eq(now.destResume, "ALLOWED", `${tag} stage 3: the destination approval comes back from the workspace round trip`);
  const afterEvidenceTrip = now;

  await assertControlsReachable(page, tag, "stage 3 (after the evidence round trip)", ["cpl-claim-input", "cpl-claim-save", "cpl-link-open", "cpl-unlink"]);
  await assertPairsReadable(page, rec0, `${tag} stage 3`, "DEMONSTRATED", true);

  // -------------------------------------------------------------------------------------------
  // Stage 4. The print round trip. The print package is the other way out of the ledger and back.
  // -------------------------------------------------------------------------------------------
  await pressByKeyboard(page.getByTestId("wu-open-print-package"), page, "Enter", `${tag} stage 4 open print package`);
  await page.getByTestId("print-package-preview").waitFor({ state: "visible", timeout: 15000 });
  const printFocus = await settleFocus(page, (a) => a?.testid === "print-package-title");
  eq(printFocus.testid, "print-package-title", `${tag} stage 4: opening the print package moves focus into the overlay, onto the heading that names what opened; focus settled on ${JSON.stringify(printFocus)} (before the fix focus stayed behind the overlay, so a keyboard user opened a package they could not reach)`);
  const printSection = page.getByTestId("print-proof-destinations");
  eq(await printSection.getAttribute("data-carried"), "1", `${tag} stage 4: the print package carries the one approval this session made, read from the ledger rather than re-derived`);
  await page.locator(".v31-print-controls .close").click();
  await page.getByTestId("return-work-universe").click();
  await page.getByTestId("v31-universe-surface").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("candidate-proof-ledger").waitFor({ state: "visible", timeout: 15000 });
  now = await readAnchors(page);
  assertAnchors(afterEvidenceTrip, now, [...CARRIED, "claim", "proofType", "linkId", "linkTargetId", "destResume"], tag, "stage 4 after the print round trip");

  await assertControlsReachable(page, tag, "stage 4 (after the print round trip)", ["cpl-claim-input", "cpl-claim-save"]);

  // -------------------------------------------------------------------------------------------
  // Stage 5. A DECLARED REDUNDANCY, described honestly. An earlier comment here claimed that a
  // drift introduced and reverted stage by stage would pass every step above and fail here. That
  // was false: CARRIED is asserted against its predecessor at every intermediate stage, so equality
  // is transitive across the whole chain and a drift fails at the step that introduces it. The
  // conformance auditor caught the overclaim. The stage is kept because it is cheap and because it
  // catches a future stage that forgets to chain its own comparison - but it is a backstop, not the
  // place the continuity property is established.
  // -------------------------------------------------------------------------------------------
  const ended = await readAnchors(page);
  // proofType is excluded HERE and only here: it was deliberately changed at stage 2, so comparing
  // it against the mint would assert that a change the human made did not happen. It is asserted
  // just below against the value that was chosen, which is the continuity statement that matters.
  assertAnchors(minted, ended, CARRIED.filter((k) => k !== "proofType"), tag, "stage 5 end of session against the moment the records were minted");
  eq(ended.proofType, "CREDENTIAL", `${tag} stage 5: the proof type chosen by keyboard at stage 2 is still the proof type at the end of the session, across two round trips`);
  eq(ended.claim, CLAIM, `${tag} stage 5: the claim typed at stage 2 is still the claim at the end of the session`);
  eq(ended.claimCommitted, true, `${tag} stage 5: the committed claim announcement is still standing at the end of the session`);
  eq(ended.destResume, "ALLOWED", `${tag} stage 5: the destination approved at stage 2 is still approved at the end of the session`);
  eq(ended.proofId, minted.proofId, `${tag} stage 5: the proof id minted when the excerpt was confirmed is the id carrying the destination approval at the end of the session - the single continuity statement this whole suite exists to make`);

  // -------------------------------------------------------------------------------------------
  // Stage 6. The three remaining focus behaviours, DELIBERATELY LAST because each one destroys
  // state the continuity stages above depend on: declaring the second record certified, revoking
  // the approval that stage 5 just asserted still stands, and unlinking the link the round trip
  // returned to. Running them earlier would mean the continuity assertions and these assertions
  // could not both be about the same session.
  //
  // Criterion (ii) is about ALL of the workflow's controls, not the ones that happen to be
  // convenient to drive in the middle of a continuity run.
  // -------------------------------------------------------------------------------------------
  before = await noticeText(page);
  await pressByKeyboard(rec1.getByTestId("cpl-declare-certified"), page, "Enter", `${tag} stage 6 declare certified`);
  await named(noticeChanged(page, before), `${tag} stage 6: declaring the second record certified by keyboard changed the ledger notice`);
  await named(waitState(page, 1, "CERTIFIED"), `${tag} stage 6: the Enter key on the certified control moved the second record to CERTIFIED`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-withdraw");
  eq(f.testid, "cpl-withdraw", `${tag} stage 6: declaring certified moves focus to the withdraw control, the same successor the demonstrated path uses; focus settled on ${JSON.stringify(f)}`);

  before = await noticeText(page);
  await pressByKeyboard(destRow(page, 0, "resume").getByTestId("cpl-dest-revoke"), page, "Enter", `${tag} stage 6 revoke resume`);
  await named(noticeChanged(page, before), `${tag} stage 6: revoking the resume destination by keyboard changed the ledger notice`);
  await named(waitDest(page, 0, "resume", "REVOKED"), `${tag} stage 6: the Enter key on the revoke control moved the resume destination to REVOKED`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-dest-approve");
  eq(f.testid, "cpl-dest-approve", `${tag} stage 6: revoking a destination moves focus to the approve control on that row, which the revocation has just made the live one; focus settled on ${JSON.stringify(f)}`);
  eq(await destRow(page, 0, "resume").getByTestId("cpl-dest-approve").innerText(), "Approve again", `${tag} stage 6: the control that took focus reads "Approve again", so focus landed on the successor rather than on a control that merely shares its test id`);

  // A REFUSED ACT MUST NOT LEAVE A FOCUS INTENT ARMED. Raised by the Blueprint Supervisor from a
  // static read and confirmed by probe before the fix: a refused unlink left the chooser intent
  // armed, and a later link to a second target consumed it, moving focus without the user having
  // caused it - the mirror image of the defect this work fixes. Driven here while the declaration
  // still stands, which is the one refusal this workflow can reach.
  before = await noticeText(page);
  const refusedUnlink = rec0.getByTestId("cpl-unlink").first();
  await refusedUnlink.scrollIntoViewIfNeeded();
  await refusedUnlink.focus();
  await page.keyboard.press("Enter");
  await named(noticeChanged(page, before), `${tag} stage 6: the refused unlink is said in the notice`);
  ok(/Refused/.test(await noticeText(page)), `${tag} stage 6: unlinking under a standing declaration is REFUSED by the product, not performed (BLP-010 ruling Q4); the notice says so: ${JSON.stringify((await noticeText(page)).slice(0, 80))}`);
  eq(await rec0.locator('[data-testid="cpl-link"]').count(), 1, `${tag} stage 6: the refused unlink removed nothing`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-unlink");
  eq(f.testid, "cpl-unlink", `${tag} stage 6: a refused act leaves focus where the human put it, on the control they pressed; focus settled on ${JSON.stringify(f)}`);

  // The declaration must be withdrawn before the link can be removed. This is not a workaround:
  // unlinkProof refuses while a declaration rests on the link ("a human may not pull the object out
  // from under a declaration", BLP-010 ruling Q4, candidateProofLedgerData.js:363-366). The suite
  // hit that refusal on its first run and the product was right - the test was wrong. Withdrawing
  // first is the path a human takes, and it exercises the withdraw focus behaviour a second time
  // from a different starting state.
  before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-withdraw"), page, "Enter", `${tag} stage 6 withdraw before unlinking`);
  await named(noticeChanged(page, before), `${tag} stage 6: withdrawing before the unlink changed the ledger notice`);
  await named(waitState(page, 0, "CLAIMED_ONLY"), `${tag} stage 6: the record is claimed only again, so the link is no longer held by a declaration`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-declare-demonstrated");
  eq(f.testid, "cpl-declare-demonstrated", `${tag} stage 6: withdrawing moves focus to the declare control from this starting state too; focus settled on ${JSON.stringify(f)}`);

  const linksBefore = await rec0.locator('[data-testid="cpl-link"]').count();
  ok(linksBefore > 0, `${tag} stage 6: there is a link to unlink (without one the unlink assertion below would be vacuous)`);
  before = await noticeText(page);
  await pressByKeyboard(rec0.getByTestId("cpl-unlink").first(), page, "Enter", `${tag} stage 6 unlink`);
  await named(noticeChanged(page, before), `${tag} stage 6: unlinking by keyboard changed the ledger notice`);
  await named(page.waitForFunction((n) => (document.querySelectorAll('[data-testid="cpl-record"]')[0]?.querySelectorAll('[data-testid="cpl-link"]').length ?? 0) < n, linksBefore, { timeout: 5000 }), `${tag} stage 6: the Enter key on the unlink control actually removed a link row`);
  f = await settleFocus(page, (a) => a?.testid === "cpl-link-select");
  eq(f.testid, "cpl-link-select", `${tag} stage 6: unlinking moves focus to the link chooser - the control a human who has just unlinked acts on next - rather than to the document body, which is where the removed row would otherwise leave them; focus settled on ${JSON.stringify(f)}`);

  await page.close();
  return { widthTested: width };
}

for (const viewport of BLP028_VIEWPORTS) {
  await runViewport(viewport);
}

if (errors.length) { console.error(`Page errors during the workflow run:\n${errors.join("\n")}`); await browser.close(); process.exit(1); }
await browser.close();

console.log(`BLP-012 candidate-proof workflow: PASS, ${checks} checks across ${BLP028_VIEWPORTS.length} widths (${BLP028_VIEWPORTS.map((v) => v.name).join(", ")})`);
console.log([
  "NOT COVERED by this suite, stated so the file name does not overclaim:",
  "",
  "  1. NOT AN OMISSION ANY MORE, and recorded here because this block previously said it was:",
  "     the controls that dropped keyboard focus to the document body are FIXED and ASSERTED. The",
  "     count was SEVEN and is EIGHT: seven was the list an accessibility review named, reported as",
  "     though it were the complete set. Linking was the eighth - it disables its own button and",
  "     dropped focus at both widths - found only when a later probe measured it.",
  "     Each is driven by key and its successor focus asserted by name: declare demonstrated and",
  "     declare certified move to withdraw; withdraw and offer again move to declare; approve moves",
  "     to revoke on the same destination row and revoke moves to approve; unlink moves to the link",
  "     chooser; opening the print package moves focus onto the overlay's heading. The measurement",
  "     that found them, BODY at both 1440x1000 and 390x844, is on the BLP-012 record.",
  "",
  "  1b. THREE LEDGER CONTROLS ARE NEITHER FIXED NOR ASSERTED, named rather than left to be found:",
  "     re-link (a target re-extracted under a new id), declare conflict and resolve conflict (two",
  "     accepted records sharing a target). This workflow cannot reach the states that render them,",
  "     so none was measured and none was wired. An earlier draft of this very block said they carry",
  "     the same wiring - they do not, and that sentence was written while correcting an overclaim of",
  "     exactly the same shape. Whether they drop focus is UNKNOWN, not known to be fine.",
  "",
  "  1c. WHAT THE PRINT OVERLAY STILL DOES NOT DO. Focus moves into it; it does not declare dialog",
  "     semantics and does not trap focus, so tabbing past its last control reaches the page behind",
  "     it. That is a larger change than the defect this requirement found, and it is named here",
  "     rather than folded in silently.",
  "",
  "  2. KEYBOARD OPERATION OF THE EVIDENCE CAPTURE STAGE. Marking, confirming and applying an",
  "     excerpt are driven by click here, and the text selection is set by script. Criterion (ii) is",
  "     asserted for the LEDGER's own controls only. The print package's return is likewise a click,",
  "     while the evidence round trip's return is a key.",
  "",
  "  3. THE PER-SLICE BEHAVIOURS OF BLP-007 TO BLP-011, each owned and asserted by its own suite,",
  "     with the two deliberate exceptions named in the header. Those suites are all run by the same",
  "     gate as this one; proof-links.mjs and evidence-failure-paths.mjs are spawned by",
  "     blp028-responsive-matrix.mjs rather than listed directly, which is easy to miss.",
  "",
  "  4. A SECOND OPENING OF THE PRINT PACKAGE IN ONE SESSION. The legacy studio applies each intent",
  "     by its JSON key, so a second { kind: \"print\" } is the same key and lands on the workspace",
  "     with no overlay. Pre-existing, not introduced here, and raised rather than fixed.",
  "",
  "  5. PHYSICAL-DEVICE RUNTIME. completionPolicy.requiresPhysicalRuntime is false for BLP-012, so",
  "     four emulated widths are the evidence and no claim is made about real hardware.",
  "",
  "  6. THE POSTING SIDE OF THE ROUND TRIP. This suite returns from the evidence workspace to the",
  "     ledger; it does not assert what the workspace itself renders, which is BLP-005's subject.",
  "",
  "  7. WHAT AN ASSISTIVE TECHNOLOGY ANNOUNCES. The overlap checks use elementFromPoint, a pointer",
  "     hit test. It establishes that one element is not painted over another and nothing about",
  "     reading order or announcement. Keyboard reachability is asserted separately, by focus",
  "     identity and by real key presses.",
].join("\n"));
