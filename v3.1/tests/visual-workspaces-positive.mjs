import { chromium } from "playwright";
import fs from "node:fs";
import { spawn } from "node:child_process";

const externalBase = process.env.VISUAL_FIXTURE_BASE_URL;
const fixture = externalBase ? null : spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4174"], { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe"] });
let fixtureError = "";
fixture?.stderr.on("data", (chunk) => { fixtureError += String(chunk); });
const base = externalBase || "http://127.0.0.1:4174";
if (fixture) {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { const response = await fetch(`${base}/tests/job-ad-harness.html`); if (response.ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) { fixture.kill("SIGTERM"); throw new Error(`visual fixture server did not start: ${fixtureError}`); }
}
fs.mkdirSync("test-results/visual-workspaces-positive", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
await page.goto(`${base}/tests/job-ad-harness.html`, { waitUntil: "networkidle" });
const universe = page.getByTestId("work-universe");
await universe.waitFor({ state: "visible" });
await page.getByTestId("wu-explore-full-map").click();

const selector = page.getByTestId("occupation-visual-selector");
await selector.waitFor({ state: "visible" });
if (!/SUPPLIED RECOMMENDATION/.test(await selector.innerText())) throw new Error("positive visual profile did not expose its supplied recommendation");
if ((await selector.locator(".ovs-rec").innerText()) !== "RECOMMENDED") throw new Error("recommended visual feedback is missing");
await selector.getByRole("button", { name: /Open source D1/ }).click();
await page.getByText("D1", { exact: true }).first().waitFor({ state: "visible" });

await page.getByTestId("visual-choice-org").click();
const org = page.getByTestId("organisation-map");
await org.waitFor({ state: "visible" });
if ((await org.locator(".om-node").count()) !== 2) throw new Error("positive organisation map did not render supplied nodes");
const synthesis = page.getByTestId("organisation-synthesis");
if ((await synthesis.getAttribute("data-status")) !== "available" || (await synthesis.getByTestId("organisation-synthesis-group").count()) !== 1) throw new Error("cross-posting organisation synthesis did not render the supported repeated capability");
if (!/posting:one[\s\S]*posting:two/.test(await synthesis.innerText())) throw new Error("organisation synthesis lost supporting posting identifiers");
for (const field of ["HIERARCHY", "MATURITY", "HEADCOUNT", "PERFORMANCE", "OWNERSHIP"]) if (!(await synthesis.innerText()).includes(`${field} WITHHELD`)) throw new Error(`organisation synthesis inferred ${field.toLowerCase()}`);
await org.locator(".om-nodeSelect").first().focus();
await page.keyboard.press("Enter");
await org.getByText("Operations control", { exact: true }).first().waitFor({ state: "visible" });
const orgWorkspace = page.getByTestId("visual-workspace-organisation");
await page.getByTestId("visual-workspace-organisation-float").click();
if ((await orgWorkspace.getAttribute("data-layout")) !== "floating") throw new Error("organisation workspace did not float");
if ((await org.locator(".om-nodeSelect").first().getAttribute("aria-expanded")) !== "true") throw new Error("floating lost the selected organisation node");
await page.getByTestId("visual-workspace-organisation-dock").click();
if ((await orgWorkspace.getAttribute("data-layout")) !== "docked") throw new Error("organisation workspace did not dock");
await page.getByTestId("visual-workspace-organisation-restore").click();
if ((await org.locator(".om-nodeSelect").first().getAttribute("aria-expanded")) !== "true") throw new Error("restore lost the selected organisation node");
await org.getByTestId("organisation-map-capabilities").click();
await org.getByTestId("organisation-map-detail").waitFor({ state: "visible" });
await org.getByRole("button", { name: "D3", exact: true }).first().click();
await page.getByText("D3", { exact: true }).first().waitFor({ state: "visible" });
await page.getByTestId("visual-choice-org").click();
await org.waitFor({ state: "visible" });
await page.getByTestId("organisation-map-back").click();
await page.getByTestId("graph-organisation").waitFor({ state: "visible" });

await page.getByTestId("visual-choice-workflow").click();
const workflow = page.getByTestId("workflow-map");
await workflow.waitFor({ state: "visible" });
if ((await workflow.locator(".wm-step").count()) !== 3) throw new Error("positive workflow map did not render supplied stages");
await page.keyboard.press("Alt+Shift+f");
if ((await page.getByTestId("visual-workspace-workflow").getAttribute("data-layout")) !== "floating") throw new Error("keyboard shortcut did not float the workflow workspace");
await page.keyboard.press("Alt+Shift+d");
if ((await page.getByTestId("visual-workspace-workflow").getAttribute("data-layout")) !== "docked") throw new Error("keyboard shortcut did not dock the workflow workspace");
await page.getByTestId("workflow-step-investigate").focus();
await page.keyboard.press("Enter");
await page.getByTestId("workflow-map-detail").waitFor({ state: "visible" });
if (!/D3/.test(await page.getByTestId("workflow-map-detail").innerText())) throw new Error("workflow inspector lost its source link");
await page.getByTestId("workflow-map-back").click();
await page.getByTestId("graph-organisation").waitFor({ state: "visible" });

await page.getByTestId("visual-choice-stream").click();
const stream = page.getByTestId("value-stream-map");
await stream.waitFor({ state: "visible" });
if ((await stream.locator(".vsm-stage").count()) !== 3) throw new Error("positive value-stream map did not render supplied stages");
await page.getByTestId("value-stream-stage-wait").focus();
await page.keyboard.press("Enter");
const streamDetail = page.getByTestId("value-stream-map-detail");
await streamDetail.waitFor({ state: "visible" });
if (!/Do not automate[\s\S]*Explicitly supplied/.test(await streamDetail.innerText())) throw new Error("value-stream inspector lost the supplied automation boundary");
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone");
const streamWorkspace = page.getByTestId("visual-workspace-stream");
if ((await streamWorkspace.getAttribute("data-layout")) !== "linear") throw new Error("phone did not switch the visual workspace to its linear equivalent");
if (!(await page.getByTestId("visual-workspace-stream-float").isDisabled())) throw new Error("phone linear view exposed a floating action");
const mobileGeometry = await streamWorkspace.evaluate((root) => {
  const detail = root.querySelector('[data-testid="value-stream-map-detail"]')?.getBoundingClientRect();
  const actions = root.querySelector('.vwf-actions')?.getBoundingClientRect();
  return { detailTop: detail?.top, actionsBottom: actions?.bottom, overflow: root.scrollWidth - root.clientWidth };
});
if (mobileGeometry.overflow > 1 || mobileGeometry.detailTop < mobileGeometry.actionsBottom) throw new Error(`mobile linear inspector overlaps or clips: ${JSON.stringify(mobileGeometry)}`);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor !== "phone");
await page.getByTestId("value-stream-map-back").click();
await page.getByTestId("graph-organisation").waitFor({ state: "visible" });

await page.getByTestId("visual-choice-architecture").click();
const architecture = page.getByTestId("role-sensitive-visual");
await architecture.waitFor({ state: "visible" });
if ((await architecture.getAttribute("data-family")) !== "architecture" || (await architecture.getAttribute("data-status")) !== "available") throw new Error("supplied architecture family did not select its governed visual");
await page.getByTestId("role-visual-item-architecture:source").focus();
await page.keyboard.press("Enter");
const architectureDetail = page.getByTestId("role-sensitive-visual-detail");
await architectureDetail.waitFor({ state: "visible" });
if (!/D2/.test(await architectureDetail.innerText())) throw new Error("architecture inspector lost its source link");
const blueprintTrace = architecture.getByTestId("blueprint-trace");
await blueprintTrace.waitFor({ state: "visible" });
const traceEntry = blueprintTrace.getByTestId("blueprint-trace-entry");
if ((await traceEntry.getAttribute("data-requirement")) !== "BLP-025" || !/1.0.0/.test(await traceEntry.innerText())) throw new Error("architecture trace omits requirement, source, status or render rule");
await blueprintTrace.getByTestId("blueprint-trace-dismiss").click();
await architecture.getByTestId("blueprint-trace-restore").click();
await architecture.getByTestId("blueprint-trace").waitFor({ state: "visible" });
if (!(await architectureDetail.isVisible()) || (await page.getByTestId("role-visual-item-architecture:source").getAttribute("aria-expanded")) !== "true") throw new Error("dismissing and restoring the explanation lost the selected visual item");
await page.getByTestId("role-sensitive-visual-back").click();
await page.getByTestId("graph-organisation").waitFor({ state: "visible" });

await page.screenshot({ path: "test-results/visual-workspaces-positive/desktop.png", fullPage: true });
if (errors.length) throw new Error(`runtime errors: ${errors.join(" | ")}`);
console.log("positive visual workspace suite: PASS");
} finally {
  await browser.close();
  fixture?.kill("SIGTERM");
}
