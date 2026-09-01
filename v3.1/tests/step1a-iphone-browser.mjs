import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/step1a-iphone", { recursive: true });

const jobs = Array.from({ length: 8 }, (_, index) => ({
  uuid: `iphone-role-${index + 1}`,
  title: index === 0 ? "Senior Operations Transformation and Artificial Intelligence Programme Manager" : `Operations Analyst ${index + 1}`,
  employer: "ST ENGINEERING ADVANCED NETWORKS & SENSORS PTE. LTD.",
  description: index === 0 ? Array.from({ length: 24 }, (_, line) => `Responsibility ${line + 1}: monitor operational data, investigate exceptions and prepare accountable reports`).join("\n") : "Monitor operational data\nInvestigate exceptions\nPrepare reports",
  responsibilitiesText: index === 0 ? Array.from({ length: 24 }, (_, line) => `Responsibility ${line + 1}: monitor operational data, investigate exceptions and prepare accountable reports`).join("\n") : "Monitor operational data\nInvestigate exceptions\nPrepare reports",
  categories: ["Engineering"],
  employmentType: index % 2 ? "Contract" : "Permanent",
  positionLevels: index % 2 ? ["Professional"] : ["Manager"],
  salaryMin: 5000,
  salaryMax: 8000,
  applicationCount: index === 0 ? 17 : null,
  postedDate: new Date(Date.UTC(2026, 7, 30 - index)).toISOString(),
  source: "MyCareersFuture",
  mcfUrl: `https://www.mycareersfuture.gov.sg/job/${index + 1}`,
}));

const companyPayload = {
  query: "ST ENGINEERING ADVANCED NETWORKS & SENSORS PTE. LTD.",
  queryKey: "st engineering advanced networks sensors pte ltd",
  ambiguous: false,
  totalPostings: jobs.length,
  pagesPolled: 1,
  matches: [{
    key: "st engineering advanced networks sensors pte ltd",
    displayName: "ST ENGINEERING ADVANCED NETWORKS & SENSORS PTE. LTD.",
    name: "ST ENGINEERING ADVANCED NETWORKS & SENSORS PTE. LTD.",
    count: jobs.length,
    jobs,
  }],
};

async function installRoutes(page) {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("**/api/mcf", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(companyPayload) }));
  await page.route("**/api/careers", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [], total: 0 }) }));
  await page.route("**/api/ssoc", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], classifications: [] }) }));
  await page.route("**/api/ssic", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false, results: [] }) }));
  await page.route("**/api/company-registry", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false }) }));
  await page.route("**/api/geocode**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ matched: false }) }));
  await page.route("**/api/claude", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: "[]" }] }) }));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  screen: { width: 430, height: 932 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
await installRoutes(page);

await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("button", { name: "Search by employer" }).click();
await page.getByRole("searchbox", { name: "Company name" }).fill("ST Engineering Advanced Networks & Sensors Pte Ltd");
await page.getByRole("button", { name: "Find company postings" }).click();
await page.getByTestId("company-opportunity-grid").waitFor({ state: "visible", timeout: 15000 });

const portrait = await page.evaluate(() => ({
  factor: document.querySelector("[data-form-factor]")?.dataset.formFactor,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  columns: getComputedStyle(document.querySelector("[data-testid='company-opportunity-grid']")).gridTemplateColumns.split(" ").filter(Boolean).length,
  headerHeight: Math.round(document.querySelector("[data-testid='site-header']").getBoundingClientRect().height),
}));
if (portrait.factor !== "phone" || portrait.columns !== 1 || portrait.overflow > 1 || portrait.headerHeight > 64) throw new Error(`Portrait geometry failed: ${JSON.stringify(portrait)}`);
await page.getByRole("heading", { name: "Organisation search" }).waitFor();
await page.getByRole("button", { name: /Explore organisation work at/ }).waitFor();
if (await page.getByText("What would you like to understand?", { exact: true }).count()) throw new Error("Redundant Step 1a explanation remains visible");
if (await page.getByText("ORGANISATION", { exact: true }).count()) throw new Error("Redundant organisation eyebrow remains visible");
if (await page.getByRole("link", { name: /Switch to V2/ }).count()) throw new Error("Step 1a phone header still exposes the V2 switch");
if (await page.getByRole("button", { name: /Find AI moments/ }).count()) throw new Error("Step 1a phone duplicates the organisation-work action");
if (await page.getByText("Source: MyCareersFuture", { exact: true }).count() !== 1) throw new Error("MyCareersFuture source should appear once in the compact organisation view");

const copyButton = page.getByRole("button", { name: "Copy 8 loaded opportunities as JSON" });
await page.screenshot({ path: "test-results/step1a-iphone/portrait-first-screen.png" });
await page.screenshot({ path: "test-results/step1a-iphone/portrait-full-page.png", fullPage: true });
await copyButton.click();
const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
if (!Array.isArray(copied) || copied.length !== 8) throw new Error("Copy control did not copy all eight loaded opportunities");

await page.getByRole("button", { name: "Analyse an individual role" }).click();
await page.getByRole("searchbox", { name: "Search role titles" }).fill("Senior Operations");
if (await page.locator(".company-job-card").count() !== 1) throw new Error("Role-title search did not reduce the phone list to one card");
await page.getByText("Position level:").waitFor();
await page.getByText("Manager", { exact: true }).waitFor();
await page.getByText("Applicants:").waitFor();
await page.getByText("17", { exact: true }).waitFor();
const primaryHeight = await page.getByRole("button", { name: "Analyse role", exact: true }).first().evaluate((element) => element.getBoundingClientRect().height);
if (primaryHeight < 44) throw new Error(`Primary role action is only ${primaryHeight}px high`);
await page.screenshot({ path: "test-results/step1a-iphone/portrait-role-search.png" });
await page.getByRole("button", { name: "More details", exact: true }).click();
const detailDialog = page.getByRole("dialog", { name: /Senior Operations Transformation/ });
await detailDialog.waitFor({ state: "visible" });
const detailGeometry = await detailDialog.evaluate((element) => {
  const scrollArea = element.querySelector(".wis-scroll");
  return { viewport: element.getBoundingClientRect().height, scrollable: !!scrollArea && scrollArea.scrollHeight > scrollArea.clientHeight };
});
if (detailGeometry.viewport > 932) throw new Error(`Detail dialog exceeds the iPhone viewport: ${JSON.stringify(detailGeometry)}`);
await page.screenshot({ path: "test-results/step1a-iphone/portrait-role-details.png" });
await page.getByRole("button", { name: "Close role details" }).click();

await page.setViewportSize({ width: 932, height: 430 });
await page.getByRole("searchbox", { name: "Search role titles" }).fill("");
await page.waitForTimeout(150);
const landscape = await page.evaluate(() => ({
  factor: document.querySelector("[data-form-factor]")?.dataset.formFactor,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  columns: getComputedStyle(document.querySelector("[data-testid='company-opportunity-grid']")).gridTemplateColumns.split(" ").filter(Boolean).length,
}));
if (landscape.factor !== "phone" || landscape.columns !== 1 || landscape.overflow > 1) throw new Error(`Landscape geometry failed: ${JSON.stringify(landscape)}`);
await page.screenshot({ path: "test-results/step1a-iphone/landscape.png" });

if (errors.length) throw new Error(`Runtime errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Step 1a iPhone 15 Pro Max contract: PASS");
