import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
fs.mkdirSync("test-results/responsive", { recursive: true });

const descriptions = [
  "Build reliable data pipelines and partner with analytics teams to publish governed datasets.",
  "Own data quality checks, investigate failures, and document operational dependencies.",
];
const makeJobs = (source, prefix) => Array.from({ length: 6 }, (_, index) => ({
  uuid: `${prefix}-${index + 1}`,
  title: index === 0 ? "Data Engineer" : `Data Engineer ${index + 1}`,
  employer: `${source === "careers.gov.sg" ? "Public Data Office" : "Example Technology"} ${index + 1}`,
  description: descriptions[index % descriptions.length],
  responsibilitiesText: descriptions[index % descriptions.length],
  skills: ["Data engineering", "Data quality", "Stakeholder management"],
  salaryMin: source === "careers.gov.sg" ? null : 5000 + index * 100,
  salaryMax: source === "careers.gov.sg" ? null : 7000 + index * 100,
  postedDate: new Date(Date.now() - index * 86400000).toISOString(),
  minimumYearsExperience: index % 3,
  employmentTypes: ["Permanent"],
  positionLevels: ["Professional"],
  source,
}));

const matrices = [
  { name: "iphone-se", width: 375, height: 667, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", family: "iphone", factor: "phone", tier: "phone-standard", orientation: "portrait", sourceColumns: 1, bodyColumns: 1, cardColumns: 1 },
  { name: "iphone-large", width: 430, height: 932, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", family: "iphone", factor: "phone", tier: "phone-large", orientation: "portrait", sourceColumns: 1, bodyColumns: 1, cardColumns: 1 },
  { name: "samsung-compact", width: 360, height: 780, ua: "Mozilla/5.0 (Linux; Android 15; SM-S911B) SamsungBrowser/28.0", family: "samsung", factor: "phone", tier: "phone-compact", orientation: "portrait", sourceColumns: 1, bodyColumns: 1, cardColumns: 1 },
  { name: "phone-landscape", width: 844, height: 390, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", family: "iphone", factor: "phone", tier: "phone-standard", orientation: "landscape", sourceColumns: 2, bodyColumns: 1, cardColumns: 1 },
  { name: "tablet-portrait", width: 820, height: 1180, ua: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", family: "ipad", factor: "tablet", tier: "tablet-standard", orientation: "portrait", sourceColumns: 1, bodyColumns: 1, cardColumns: 2 },
  { name: "tablet-landscape", width: 1180, height: 820, ua: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", family: "ipad", factor: "tablet", tier: "tablet-standard", orientation: "landscape", sourceColumns: 1, bodyColumns: 2, cardColumns: 2 },
  { name: "desktop-2048", width: 2048, height: 1280, ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", family: "generic", factor: "desktop", orientation: "landscape", sourceColumns: 2, bodyColumns: 2, cardColumns: 2 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const item of matrices) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, userAgent: item.ua, isMobile: item.factor === "phone", hasTouch: item.factor !== "desktop" });
  const runtimeErrors = [];
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.route("**/api/mcf", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: makeJobs("MyCareersFuture", "mcf"), tier: 1, approximate: false }) }));
  await page.route("**/api/careers", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: makeJobs("careers.gov.sg", "csg") }) }));
  await page.route("**/api/ssoc", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], classifications: [] }) }));

  try {
    await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
    await page.getByRole("button", { name: /^Browse SG jobs/ }).first().click();
    await page.getByRole("searchbox", { name: "Job title or role" }).fill("Data Engineer");
    await page.getByRole("button", { name: "Browse SG jobs", exact: true }).last().click();
    const surface = page.getByTestId("step2-responsive-surface");
    await surface.waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("MyCareersFuture", { exact: true }).last().waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(250);

    const metrics = await page.getByTestId("responsive-preflight").evaluate((root) => {
      const countColumns = (selector) => {
        const element = root.querySelector(selector);
        return element ? getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length : 0;
      };
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      return {
        factor: root.dataset.formFactor,
        tier: root.dataset.sizeTier,
        orientation: root.dataset.orientation,
        aspect: root.dataset.aspectTier,
        family: root.dataset.deviceFamily,
        viewportWidth: window.innerWidth,
        documentWidth,
        sourceColumns: countColumns(".step2-source-grid"),
        bodyColumns: countColumns(".step2-body"),
        cardColumns: countColumns(".step2-source .step2-cards"),
        touchTargets: [...root.querySelectorAll(".step2-filterbar button, .step2-filterbar input")].every((element) => element.getBoundingClientRect().height >= 43.5),
      };
    });

    const expected = { factor: item.factor, orientation: item.orientation, family: item.family, sourceColumns: item.sourceColumns, bodyColumns: item.bodyColumns, cardColumns: item.cardColumns };
    if (item.tier) expected.tier = item.tier;
    for (const [key, value] of Object.entries(expected)) if (metrics[key] !== value) throw new Error(`${key}: expected ${value}, received ${metrics[key]}`);
    if (metrics.documentWidth > metrics.viewportWidth + 1) throw new Error(`horizontal overflow: ${metrics.documentWidth} > ${metrics.viewportWidth}`);
    if (!metrics.touchTargets) throw new Error("Step 2 filter controls fall below the 44px touch-target contract");
    if (runtimeErrors.length) throw new Error(`runtime errors: ${runtimeErrors.join(" | ")}`);
    await page.screenshot({ path: `test-results/responsive/${item.name}.png`, fullPage: true });
    console.log(`${item.name}: PASS ${JSON.stringify(metrics)}`);
  } catch (error) {
    failures.push(`${item.name}: ${error.message}`);
    await page.screenshot({ path: `test-results/responsive/${item.name}-failed.png`, fullPage: true }).catch(() => {});
  } finally {
    await page.close();
  }
}

await browser.close();
if (failures.length) throw new Error(`Responsive preflight browser matrix failed:\n${failures.join("\n")}`);
console.log("Responsive preflight Chromium matrix: PASS");
