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
await page.route("**/api/ssic", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false, results: [] }) }));
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
await page.screenshot({ path: "test-results/company-flow/step1a-desktop.png", fullPage: true });

await page.setViewportSize({ width: 844, height: 390 });
await page.locator("[data-form-factor]").first().evaluate((element) => { element.dataset.formFactor = "phone"; });
await page.waitForTimeout(150);
const narrowColumns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
if (narrowColumns !== 1) throw new Error(`Physical phone organisation list expected one column, received ${narrowColumns}`);

await page.setViewportSize({ width: 1440, height: 1000 });
await page.locator("[data-form-factor]").first().evaluate((element) => { element.dataset.formFactor = "desktop"; });
await page.getByRole("button", { name: /Analyse this posting/ }).first().click();
await page.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60000 });
await page.getByTestId("tree-ai-moments").click();
await page.getByTestId("wu-ai-moments").waitFor({ state: "visible", timeout: 15000 });
await page.getByText("AI moments at DBS BANK LTD", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
if (dutyRequests !== 1) throw new Error(`Step 3 AI Moments expected one automatic duty request, received ${dutyRequests}`);
if (await page.getByRole("button", { name: "Find AI moments at DBS BANK LTD" }).count()) throw new Error("Step 3 reset AI Moments to its dormant trigger");
await page.screenshot({ path: "test-results/company-flow/step3-ai-moments.png", fullPage: true });

if (errors.length) throw new Error(`Runtime errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Company Step 1a + Step 3 AI Moments browser contract: PASS");
