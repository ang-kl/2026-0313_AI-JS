// BLP-007 exact candidate-evidence excerpts: immutable source and span identifiers, offsets over
// the canonical text, unconfirmed raw evidence never a confirmed proof.
//
// Part A (node) lives in tests/person-evidence-contract.mjs. This file is Part B (Chromium
// against BASE_URL) at 1440x1000 and 430x932: the pasted text is canonicalised in the box before
// any selection is read, so the excerpt the user marks is the exact characters they selected;
// every excerpt renders its span id and its source id; removal leaves no orphan; a text change
// makes earlier excerpts STALE in words and blocks use until removed; the confirmed payload is
// summarised with its source id and CLAIMED_ONLY state; nothing reaches browser storage; the
// pre-existing proof-only path still reads "1 unstructured proof".
//
// Run: node tests/person-evidence-excerpts.mjs        (BASE_URL defaults to http://127.0.0.1:4173)

import fs from "node:fs";
import assert from "node:assert/strict";
import { normalisePostingText, sha256Hex } from "../src/contracts/evidenceContracts.js";

let checks = 0;
const ok = (cond, msg) => { checks += 1; assert.ok(cond, msg); };
const eq = (a, b, msg) => { checks += 1; assert.equal(a, b, msg); };

const { chromium } = await import("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/person-evidence-excerpts", { recursive: true });
const MARKER = "EXCERPT-MARKER-DO-NOT-PERSIST";
const MESSY = `First line \r\nSecond​ line\n\n\nLed migration of 40 pipelines to Airflow in 2025 ${MARKER}.\r\nClosing line.`;
const CANONICAL = normalisePostingText(MESSY);
const WANTED = `Led migration of 40 pipelines to Airflow in 2025 ${MARKER}.`;
const roleFixture = [
  { title: "Data Engineer", iscoCode: "2529", iscoGroup: "Database and network professionals not elsewhere classified", industry: "Technology", description: "Designs and maintains data pipelines and platforms.", isAltLabel: false },
  { title: "Database Designer", iscoCode: "2521", iscoGroup: "Database designers and administrators", industry: "Technology", description: "Designs database structures and data models.", isAltLabel: false },
];
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, ...(viewport.width < 600 ? { isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" } : {}) });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource:")) errors.push(`console: ${m.text()}`); });
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  for (const [p, v] of [["**/api/mcf", { jobs: [], tier: 1, approximate: false }], ["**/api/careers", { jobs: [] }], ["**/api/ssoc", { results: [], classifications: [] }], ["**/api/esco", { occupations: [], skills: [] }], ["**/api/anatomy", { ok: true, found: false, data: null }], ["**/api/state**", { ok: false, kv: false }]]) await page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(v) }));
  await page.route("**/api/claude", async (r) => {
    let b = {}; try { b = r.request().postDataJSON(); } catch (_) {}
    const sys = String(b?.system || ""); const pr = String(b?.messages?.[0]?.content || "");
    let text = "[]";
    if (/occupational classification expert/i.test(sys) && /Search term:/i.test(pr)) text = JSON.stringify(roleFixture);
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text }], model: "person-evidence-excerpts-fixture" }) });
  });
  return page;
}
const select = (page, start, end) => page.getByTestId("person-evidence-paste").evaluate((el, [a, b]) => { el.focus(); el.setSelectionRange(a, b); }, [start, end]);
const excerptRows = (page) => page.locator('[data-testid="person-evidence-excerpt"]').evaluateAll((els) => els.map((el) => ({ state: el.dataset.state, spanId: el.dataset.spanId || null, sourceId: el.dataset.sourceId || null, text: el.querySelector("blockquote")?.textContent ?? null, label: el.querySelector("button")?.getAttribute("aria-label") })));

async function runViewport({ name, width, height, phone }) {
  const page = await newPage({ width, height });
  const tag = phone ? "phone" : "desktop";
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  const search = page.locator('input[name="job-title"]');
  await search.waitFor({ state: "visible", timeout: 15000 });
  await search.fill("Data Engineer");
  await page.waitForTimeout(2200);
  await page.getByText("Data Engineer", { exact: true }).first().click();
  await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
  if (phone) { await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone", null, { timeout: 15000 }); await page.getByTestId("wu-quick-fab").click(); await page.getByTestId("wu-quick-job-ad").click(); }
  else { const sh = page.getByTestId("wu-start-here"); if (await sh.count() && await sh.isVisible()) await page.getByTestId("wu-explore-full-map").click(); }
  await page.getByTestId("wu-individual-person").click();
  await page.getByTestId("wu-add-person-evidence").click();
  const ingress = page.getByTestId("person-evidence-ingress");
  await ingress.waitFor({ state: "visible", timeout: 15000 });
  const textarea = page.getByTestId("person-evidence-paste");

  // 1. Selecting on NOT-yet-canonical text and marking says so in words and marks nothing (auditor C-2):
  //    the Mark button keeps focus in the box, so no blur canonicalises the text underneath the click.
  await textarea.fill(MESSY);
  await select(page, 0, 5);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => /normalised/.test(document.querySelector('[data-testid="person-evidence-notice"]')?.textContent || ""), null, { timeout: 5000 });
  ok(/Select the excerpt again/.test(await page.getByTestId("person-evidence-notice").innerText()), `${tag}: marking on non-canonical text asks for the selection again, in words`);
  eq(await page.locator('[data-testid="person-evidence-excerpt"]').count(), 0, `${tag}: nothing is marked against non-canonical text`);
  eq(await textarea.inputValue(), CANONICAL, `${tag}: the box now holds the canonical text`);
  await select(page, 0, 10);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  eq((await excerptRows(page))[0].text, "First line", `${tag}: selecting again on the canonical text marks exactly the selection (mouse path, no blur)`);
  await page.locator('[data-testid="person-evidence-excerpt"]').first().getByTestId("person-evidence-excerpt-remove").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 0, null, { timeout: 5000 });
  eq(await page.evaluate(() => document.activeElement?.dataset.testid || document.activeElement?.tagName), "person-evidence-mark", `${tag}: removing the last excerpt moves focus to the Mark control, not to body (W-4)`);
  // Canonical text in the box before any further selection is read.
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction((want) => document.querySelector('[data-testid="person-evidence-paste"]').value === want, CANONICAL, { timeout: 5000 });
  eq(await textarea.inputValue(), CANONICAL, `${tag}: the textarea holds the canonical text after blur`);
  const sourceId = await page.getByTestId("person-evidence-source-id-value").textContent();
  ok(/^src:manual-paste:[0-9a-f]{24}$/.test(sourceId), `${tag}: the source id renders as src:manual-paste:<24 hex> (${sourceId})`);
  eq(sourceId, `src:manual-paste:${sha256Hex(CANONICAL).slice(0, 24)}`, `${tag}: the rendered source id is the hash of the canonical text`);
  ok(/canonical/.test(await page.getByTestId("person-evidence-source-id").innerText()), `${tag}: the source line says the text is canonical`);

  // 2. No selection (collapsed caret): refused in words, nothing marked.
  await textarea.evaluate((el) => { el.focus(); el.setSelectionRange(0, 0); });
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="person-evidence-notice"]')?.dataset.kind === "refused", null, { timeout: 5000 });
  ok(/Select the exact text/.test(await page.getByTestId("person-evidence-notice").innerText()), `${tag}: an empty selection is refused in words`);
  eq(await page.locator('[data-testid="person-evidence-excerpt"]').count(), 0, `${tag}: nothing was marked`);

  // 3. The Supervisor's fixture: select AFTER the CRLF, trailing space, zero-width and triple newline.
  const start = CANONICAL.indexOf(WANTED);
  ok(start > 0, `${tag}: the wanted excerpt sits after the normalised constructs`);
  await select(page, start, start + WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.locator('[data-testid="person-evidence-excerpt"]').first().waitFor({ state: "visible", timeout: 5000 });
  let rows = await excerptRows(page);
  eq(rows.length, 1, `${tag}: one excerpt marked`);
  eq(rows[0].spanId, `span:${sourceId}:${start}-${start + WANTED.length}`, `${tag}: the span id is span:<sourceId>:<start>-<end>`);
  eq(rows[0].sourceId, sourceId, `${tag}: the excerpt names its source id`);
  eq(rows[0].text, WANTED, `${tag}: the excerpt text is exactly what was selected`);
  eq(rows[0].text, CANONICAL.slice(start, start + WANTED.length), `${tag}: the excerpt text equals the canonical slice`);
  eq(rows[0].state, "marked", `${tag}: the excerpt is marked`);
  ok(/Marked span:/.test(await page.getByTestId("person-evidence-notice").innerText()), `${tag}: the notice names the span id`);

  // 4. Duplicate refused; a second excerpt accepted; removal leaves no orphan.
  await select(page, start, start + WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => /already marked/.test(document.querySelector('[data-testid="person-evidence-notice"]')?.textContent || ""), null, { timeout: 5000 });
  eq(await page.locator('[data-testid="person-evidence-excerpt"]').count(), 1, `${tag}: a duplicate selection is refused`);
  await select(page, 0, 10);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 2, null, { timeout: 5000 });
  rows = await excerptRows(page);
  eq(rows[0].text, "First line", `${tag}: excerpts are listed by offset, exact text`);
  await page.locator('[data-testid="person-evidence-excerpt"]').first().getByTestId("person-evidence-excerpt-remove").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 1, null, { timeout: 5000 });
  rows = await excerptRows(page);
  eq(rows[0].text, WANTED, `${tag}: removing one excerpt leaves the other intact`);

  // 5. Confirm and apply: the summary names the source id, the count and the CLAIMED_ONLY state.
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  const summary = page.getByTestId("person-evidence-summary");
  await summary.waitFor({ state: "visible", timeout: 5000 });
  const summaryText = await summary.innerText();
  ok(summaryText.includes("USER-CONFIRMED · 0 skill claims · 1 exact excerpt"), `${tag}: the summary counts exact excerpts (${summaryText})`);
  eq(await summary.getAttribute("data-source-id"), sourceId, `${tag}: the applied payload carries the same source id`);
  eq(await summary.getAttribute("data-proof-count"), "1", `${tag}: one proof for one excerpt`);
  ok(/CLAIMED_ONLY/.test(summaryText), `${tag}: the proof state is CLAIMED_ONLY, not WITHHELD and not DEMONSTRATED`);
  ok(/identity not recorded/.test(summaryText), `${tag}: the confirmer is named as the local human with identity withheld in words`);
  ok(!/WITHHELD/.test(summaryText), `${tag}: present, confirmed evidence is not summarised as withheld`);
  eq((await ingress.locator(".pe-status").innerText()).trim(), "CONFIRMED", `${tag}: the status pill reads CONFIRMED`);
  const storage = await page.evaluate(() => `${Object.values(localStorage).join(" ")} ${Object.values(sessionStorage).join(" ")}`);
  ok(!storage.includes(MARKER), `${tag}: the pasted text never reaches browser storage`);
  if (!phone) {
    const projection = await page.getByTestId("graph-labour").innerText();
    ok(/Person skills evidenced[\s\S]*WITHHELD/i.test(projection), `${tag}: an excerpt is not promoted into a person skill`);
  }

  // 6. Editing the text makes the earlier excerpt STALE in words and blocks use until removed.
  await textarea.fill(`${CANONICAL}\nAppended line.`);
  await textarea.evaluate((el) => el.blur());
  await page.waitForFunction(() => document.querySelector('[data-testid="person-evidence-excerpt"]')?.dataset.state === "stale", null, { timeout: 5000 });
  rows = await excerptRows(page);
  eq(rows[0].state, "stale", `${tag}: the excerpt marked against the earlier text is stale`);
  ok(/STALE · text changed/.test(await page.locator('[data-testid="person-evidence-excerpt"]').first().innerText()), `${tag}: staleness is said in words, not colour`);
  const newSourceId = await page.getByTestId("person-evidence-source-id-value").textContent();
  ok(newSourceId !== sourceId && /^src:manual-paste:[0-9a-f]{24}$/.test(newSourceId), `${tag}: edited text is a different source (${newSourceId})`);
  await page.getByTestId("person-evidence-confirm").check();
  ok(await page.getByTestId("person-evidence-apply").isDisabled(), `${tag}: a stale excerpt blocks Use confirmed evidence`);
  const block = page.getByTestId("person-evidence-stale-block");
  eq(await block.getAttribute("role"), "status", `${tag}: the stale block is an announced status region (W-3)`);
  eq(await page.getByTestId("person-evidence-apply").getAttribute("aria-describedby"), "person-evidence-stale-block", `${tag}: the disabled Apply control names its reason`);
  eq((await page.getByTestId("person-evidence-status").innerText()).trim(), "CONFIRMED (EARLIER TEXT)", `${tag}: the pill says the confirmation describes earlier text (W-2)`);
  ok(/this describes the evidence you last applied, not the text in the box/.test(await page.getByTestId("person-evidence-earlier-text").innerText()), `${tag}: the summary says in words that the box holds different text`);
  eq(await summary.getAttribute("data-source-id"), sourceId, `${tag}: the summary still names the source it was built from, not the new text`);
  await page.getByTestId("person-evidence-excerpt-remove").first().click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 0, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  ok(!(await page.getByTestId("person-evidence-apply").isDisabled()), `${tag}: removing the stale excerpt unblocks use`);

  // 7. Same text, same ids: re-apply the original text and compare with the first application.
  const firstConfirmedAt = await summary.getAttribute("data-confirmed-at");
  ok(/^\d{4}-\d{2}-\d{2}T/.test(firstConfirmedAt), `${tag}: the first application carries its confirmation time (${firstConfirmedAt})`);
  await page.waitForTimeout(20);
  await textarea.fill(CANONICAL);
  await textarea.evaluate((el) => el.blur());
  await select(page, start, start + WANTED.length);
  await page.getByTestId("person-evidence-mark").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="person-evidence-excerpt"]').length === 1, null, { timeout: 5000 });
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await page.waitForFunction((was) => { const el = document.querySelector('[data-testid="person-evidence-summary"]'); return el && el.dataset.confirmedAt !== was; }, firstConfirmedAt, { timeout: 5000 });
  eq(await summary.getAttribute("data-source-id"), sourceId, `${tag}: the second application (a later confirmation time) carries the same source id`);
  eq(await summary.getAttribute("data-describes-earlier-text"), "false", `${tag}: the applied payload describes the text in the box again`);
  eq((await page.getByTestId("person-evidence-status").innerText()).trim(), "CONFIRMED", `${tag}: the pill returns to CONFIRMED`);
  rows = await excerptRows(page);
  eq(rows[0].spanId, `span:${sourceId}:${start}-${start + WANTED.length}`, `${tag}: the same text and selection give the same span id on a second application`);

  // 8. Touch targets and accessible names on the new controls.
  const boxes = await page.locator('[data-testid="person-evidence-mark"], [data-testid="person-evidence-excerpt-remove"], [data-testid="person-evidence-apply"], [data-testid="person-evidence-clear"], .pe-confirm, .pe-skills label').evaluateAll((els) => els.map((el) => ({ h: el.getBoundingClientRect().height, name: el.getAttribute("aria-label") || el.textContent.trim() })));
  ok(boxes.length >= 5 && boxes.every((b) => b.h >= 44), `${tag}: every control row, checkboxes included, is at least 44px tall (${boxes.map((b) => Math.round(b.h)).join(", ")})`);
  ok(boxes.every((b) => b.name.length > 0), `${tag}: every control has an accessible name`);
  ok(/Remove excerpt characters \d+ to \d+/.test(rows[0].label), `${tag}: the remove control names which excerpt it removes`);
  const geometry = await ingress.evaluate((el) => ({ right: el.getBoundingClientRect().right, viewport: window.innerWidth }));
  ok(geometry.right <= geometry.viewport + 1, `${tag}: the ingress does not overflow the viewport`);

  // 9. The pre-existing proof-only path is unchanged: clear, paste plain text, confirm, apply.
  await page.getByTestId("person-evidence-clear").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="person-evidence-paste"]').value === "", null, { timeout: 5000 });
  await textarea.fill("Data engineering appears in raw text but is not a confirmed skill.");
  await textarea.evaluate((el) => el.blur());
  await page.getByTestId("person-evidence-confirm").check();
  await page.getByTestId("person-evidence-apply").click();
  await summary.waitFor({ state: "visible", timeout: 5000 });
  const plain = await ingress.innerText();
  ok(plain.includes("USER-CONFIRMED · 0 skill claims · 1 unstructured proof"), `${tag}: the proof-only path still reads "1 unstructured proof"`);
  ok(/CLAIMED_ONLY/.test(plain) && /claimed by you, not yet demonstrated/.test(plain), `${tag}: the unstructured proof is CLAIMED_ONLY as well, said in plain words`);
  await page.screenshot({ path: `test-results/person-evidence-excerpts/${name}.png`, fullPage: true });
  await page.close();
}
try {
  await runViewport({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false });
  await runViewport({ name: "phone-430x932", width: 430, height: 932, phone: true });
} finally { await browser.close(); }
ok(errors.length === 0, `no page or console errors: ${errors.join(" | ")}`);
console.log(`BLP-007 excerpts (browser, desktop 1440x1000 and phone 430x932): PASS, ${checks} checks total`);
