import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/company-flow", { recursive: true });

const recurringDuties = [
  "Monitor operational data and investigate service exceptions",
  "Prepare operational data and document service exceptions",
  "Automate operational data reporting and exception triage",
];
const jobs = Array.from({ length: 6 }, (_, index) => ({
  uuid: `dbs-role-${index + 1}`,
  title: `Operations Analyst ${index + 1}`,
  employer: "DBS BANK LTD",
  description: recurringDuties.join("\n"),
  responsibilitiesText: recurringDuties.join("\n"),
  skills: ["Data Analytics", "Automation", "Operations"],
  categories: ["Banking and Finance"],
  employmentType: "Permanent",
  positionLevels: ["Professional"],
  salaryMin: 5000,
  salaryMax: 7000,
  postedDate: new Date(Date.UTC(2026, 7, 30 - index)).toISOString(),
  source: "MyCareersFuture",
  mcfUrl: `https://www.mycareersfuture.gov.sg/job/${index + 1}`,
}));

const companyPayload = (withDuties = false) => ({
  query: "DBS BANK LTD",
  queryKey: "dbs bank ltd",
  ambiguous: false,
  totalPostings: jobs.length,
  pagesPolled: 1,
  matches: [{
    key: "dbs bank ltd",
    displayName: "DBS BANK LTD",
    name: "DBS BANK LTD",
    count: jobs.length,
    jobs: jobs.map((job) => ({ ...job, dutyDetail: withDuties })),
  }],
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2048, height: 1280 }, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" });
const errors = [];
let dutyRequests = 0;
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400 && response.url().includes("/api/")) errors.push(`${response.status()} ${response.url()}`);
});

await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
await page.route("**/api/mcf", async (route) => {
  let body = {};
  try { body = route.request().postDataJSON(); } catch (_) {}
  if (body.action === "company") {
    if (body.duties) dutyRequests += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(companyPayload(!!body.duties)) });
    return;
  }
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [], tier: 1, approximate: false }) });
});
await page.route("**/api/careers", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [], total: 0 }) }));
await page.route("**/api/ssoc", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], classifications: [] }) }));
await page.route("**/api/ssic", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  matched: "exact",
  primarySsicCode: "64120",
  primarySsicDescription: "FULL BANKS",
  registeredSince: "1968-07-16",
  namesakes: 0,
}) }));
await page.route("**/api/esco", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ occupations: [], skills: [] }) }));
await page.route("**/api/anatomy", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, found: false, data: null }) }));
await page.route("**/api/company-registry", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false }) }));
await page.route("**/api/geocode**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false }) }));
await page.route("**/api/claude", async (route) => {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: "[]" }], model: "company-flow-fixture" }) });
});

await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("button", { name: "Search by employer" }).click();
await page.getByRole("searchbox", { name: "Company name" }).fill("DBS BANK LTD");
await page.getByRole("button", { name: "Find company postings" }).click();

const grid = page.getByTestId("company-opportunity-grid");
await grid.waitFor({ state: "visible", timeout: 15000 });
const desktopGrid = await grid.evaluate((element) => ({
  columns: getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
  template: getComputedStyle(element).gridTemplateColumns,
  parentClass: element.parentElement?.parentElement?.parentElement?.className || "",
  factor: document.querySelector("[data-form-factor]")?.dataset.formFactor || "missing",
  width: window.innerWidth,
}));
if (desktopGrid.columns !== 2) throw new Error(`Desktop organisation list expected two columns: ${JSON.stringify(desktopGrid)}`);
const desktopDetails = page.getByRole("button", { name: "More details", exact: true }).first();
await desktopDetails.hover();
await page.getByRole("tooltip").waitFor({ state: "visible" });
await desktopDetails.click();
await page.getByRole("dialog", { name: /Operations Analyst 1/ }).waitFor({ state: "visible" });
await page.getByRole("button", { name: "Close role details" }).click();
await page.screenshot({ path: "test-results/company-flow/step1a-desktop.png", fullPage: true });

await page.setViewportSize({ width: 844, height: 390 });
await page.locator("[data-form-factor]").first().evaluate((element) => { element.dataset.formFactor = "phone"; });
await page.waitForTimeout(150);
const narrowColumns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
if (narrowColumns !== 1) throw new Error(`Physical phone organisation list expected one column, received ${narrowColumns}`);

// Regression for the physical-phone path: FAB -> Contents -> Organisation Work Graph
// -> AI Moments must return the panel navigator to the centre workspace. Merely
// changing mode is insufficient because the phone CSS hides the centre pane while
// mobilePanel remains "contents".
await page.setViewportSize({ width: 430, height: 932 });
await page.waitForFunction(() => document.querySelector("[data-form-factor]")?.dataset.formFactor === "phone");
await page.getByRole("button", { name: "Analyse role", exact: true }).first().click();
const workUniverse = page.getByTestId("work-universe");
await workUniverse.waitFor({ state: "visible", timeout: 60000 });
await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone");
await page.getByTestId("wu-quick-fab").click();
await page.getByTestId("wu-quick-contents").click();
await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.classList.contains("wu-mobilePanel-contents"));
await page.getByTestId("tree-ai-moments").click();
await page.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.classList.contains("wu-mobilePanel-workspace"));
await page.getByTestId("wu-ai-moments").waitFor({ state: "visible", timeout: 15000 });
await page.getByText("Cards | Business cube", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
await page.getByText("AI moments at DBS BANK LTD", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
if (dutyRequests !== 1) throw new Error(`Step 3 AI Moments expected one automatic duty request, received ${dutyRequests}`);
if (await page.getByRole("button", { name: "Find AI moments at DBS BANK LTD" }).count()) throw new Error("Step 3 reset AI Moments to its dormant trigger");
await page.getByRole("button", { name: /Business cube layout/ }).click();
const cube = page.getByTestId("business-rubiks-cube");
await cube.waitFor({ state: "visible", timeout: 15000 });
await cube.getByRole("heading", { name: /FULL BANKS \(64120\)/ }).waitFor({ state: "visible" });
const canvasHost = page.getByTestId("business-cube-canvas");
await page.waitForFunction(() => document.querySelector('[data-testid="business-cube-canvas"]')?.dataset.renderedCells === "27");
const selectedCell = page.getByTestId("business-cube-selection");
await selectedCell.waitFor({ state: "visible" });
const firstMatrixCell = cube.locator(".business-cube__cell-button").first();
const firstCellId = await firstMatrixCell.getAttribute("data-cell-id");
if (!firstCellId || (await canvasHost.getAttribute("data-selected-cell")) !== firstCellId) {
  throw new Error("Business cube did not synchronize its selected matrix cell with the 3D canvas");
}
const phoneCubeGeometry = await cube.evaluate((element) => {
  const head = document.querySelector(".wu-centreHead");
  const title = head?.querySelector(".wu-railTitle");
  const controls = head?.querySelector(".wu-centreControls");
  const selection = element.querySelector(".business-cube__selection-strip");
  const canvas = element.querySelector(".business-cube__canvas");
  const quickFab = document.querySelector(".wu-quickFab");
  const centrePane = document.querySelector(".wu-centrePane");
  const rect = (node) => {
    if (!node) return null;
    const bounds = node.getBoundingClientRect();
    return { top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left, width: bounds.width, height: bounds.height };
  };
  return {
    title: rect(title),
    controls: rect(controls),
    selection: rect(selection),
    canvas: rect(canvas),
    quickFab: rect(quickFab),
    centrePane: rect(centrePane),
    toolbarTargets: Array.from(element.querySelectorAll(".business-cube__toolbar button")).map((button) => button.getBoundingClientRect().height),
  };
});
if (phoneCubeGeometry.title.bottom > phoneCubeGeometry.controls.top + 1) throw new Error(`Phone workspace title overlaps controls: ${JSON.stringify(phoneCubeGeometry)}`);
if (phoneCubeGeometry.selection.bottom > phoneCubeGeometry.canvas.top + 1) throw new Error(`Selected-cell strip does not precede the cube canvas: ${JSON.stringify(phoneCubeGeometry)}`);
if (phoneCubeGeometry.canvas.height > 310) throw new Error(`Phone cube canvas remains too tall: ${JSON.stringify(phoneCubeGeometry.canvas)}`);
if (phoneCubeGeometry.toolbarTargets.some((height) => height < 44)) throw new Error(`Cube toolbar target below 44px: ${JSON.stringify(phoneCubeGeometry.toolbarTargets)}`);
if (phoneCubeGeometry.quickFab.top < phoneCubeGeometry.centrePane.bottom - 1) throw new Error(`Workspace shortcut overlaps centre content: ${JSON.stringify(phoneCubeGeometry)}`);
const canvasPixels = await canvasHost.evaluate((host) => {
  const canvas = host.querySelector("canvas");
  const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
  if (!canvas || !gl) return { coloured: 0, width: 0, height: 0 };
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let coloured = 0;
  for (let i = 0; i < pixels.length; i += 32) {
    if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 35) coloured += 1;
  }
  return { coloured, width, height };
});
if (canvasPixels.coloured < 1000) throw new Error(`Business cube canvas is blank: ${JSON.stringify(canvasPixels)}`);
const beforeDrag = Number(await canvasHost.getAttribute("data-camera-revision"));
await canvasHost.scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
const box = await canvasHost.boundingBox();
if (!box) throw new Error("Business cube canvas has no bounding box");
await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.46);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.64, box.y + box.height * 0.35, { steps: 8 });
await page.mouse.up();
await page.waitForFunction((before) => Number(document.querySelector('[data-testid="business-cube-canvas"]')?.dataset.cameraRevision || 0) > before, beforeDrag);
const beforeKeyboard = Number(await canvasHost.getAttribute("data-camera-revision"));
await canvasHost.focus();
await page.keyboard.press("ArrowRight");
await page.waitForFunction((before) => Number(document.querySelector('[data-testid="business-cube-canvas"]')?.dataset.cameraRevision || 0) > before, beforeKeyboard);
await cube.getByRole("button", { name: "Explode" }).click();
if ((await canvasHost.getAttribute("data-exploded")) !== "true") throw new Error("Business cube did not enter exploded state");
await page.screenshot({ path: "test-results/company-flow/step3-business-cube-phone.png", fullPage: true });

await page.setViewportSize({ width: 1440, height: 1000 });
await page.waitForTimeout(250);
const desktopCubeGeometry = await cube.evaluate((element) => {
  const body = element.querySelector(".business-cube__body");
  const stage = element.querySelector(".business-cube__stage");
  const inspector = element.querySelector(".business-cube__inspect");
  return {
    cubeWidth: element.getBoundingClientRect().width,
    bodyColumns: getComputedStyle(body).gridTemplateColumns.split(" ").filter(Boolean).length,
    stageRight: stage.getBoundingClientRect().right,
    inspectorLeft: inspector.getBoundingClientRect().left,
    overflow: element.scrollWidth - element.clientWidth,
    viewportWidth: window.innerWidth,
    media820: matchMedia("(max-width: 820px)").matches,
  };
});
const expectedColumns = 2;
if (desktopCubeGeometry.bodyColumns !== expectedColumns || desktopCubeGeometry.overflow > 1 || desktopCubeGeometry.inspectorLeft < desktopCubeGeometry.stageRight - 1) {
  throw new Error(`Desktop cube layout failed: ${JSON.stringify(desktopCubeGeometry)}`);
}
await page.screenshot({ path: "test-results/company-flow/step3-business-cube-desktop.png", fullPage: true });

if (errors.length) throw new Error(`Runtime errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Company Step 1a + Step 3 mobile AI Moments browser contract: PASS");
