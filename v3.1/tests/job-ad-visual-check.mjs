import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4174";
const browser = await chromium.launch({ headless: true });
const errors = [];
const viewports = [
  { name: "iphone-se", width: 375, height: 667, factor: "phone", orientation: "portrait", tab: "overview", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
  { name: "iphone-large", width: 430, height: 932, factor: "phone", orientation: "portrait", tab: "section-2", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
  { name: "samsung-compact", width: 360, height: 780, factor: "phone", orientation: "portrait", tab: "overview", ua: "Mozilla/5.0 (Linux; Android 15; SM-S911B) SamsungBrowser/28.0" },
  { name: "phone-landscape", width: 844, height: 390, factor: "phone", orientation: "landscape", tab: "work-units", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
  { name: "tablet-portrait", width: 820, height: 1180, factor: "tablet", orientation: "portrait", tab: "work-units", ua: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)" },
  { name: "tablet-landscape", width: 1180, height: 820, factor: "tablet", orientation: "landscape", tab: "overview", ua: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)" },
  { name: "desktop", width: 2048, height: 1280, factor: "desktop", orientation: "landscape", tab: "overview", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.ua,
    isMobile: viewport.factor === "phone",
    hasTouch: viewport.factor !== "desktop",
  });
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${viewport.name}: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`${viewport.name}: ${error.message}`));
  await page.goto(`${base}/tests/job-ad-harness.html`, { waitUntil: "networkidle" });
  const universe = page.getByTestId("work-universe");
  await universe.waitFor({ state: "visible" });
  const profile = await universe.evaluate((element) => ({
    factor: element.dataset.wuFormFactor,
    orientation: element.dataset.wuOrientation,
    width: window.innerWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  if (profile.factor !== viewport.factor || profile.orientation !== viewport.orientation) throw new Error(`${viewport.name}: Step 3 profile mismatch ${JSON.stringify(profile)}`);
  if (profile.documentWidth > profile.width + 1) throw new Error(`${viewport.name}: horizontal overflow ${profile.documentWidth} > ${profile.width}`);

  const panels = async () => page.evaluate(() => {
    const visible = (selector) => getComputedStyle(document.querySelector(selector)).display !== "none";
    return { source: visible(".wu-leftRail"), workspace: visible(".wu-centrePane"), contents: visible(".wu-rightRail") };
  });
  const usesPanelNavigator = viewport.factor === "phone" || (viewport.factor === "tablet" && viewport.orientation === "portrait");
  if (usesPanelNavigator) {
    const initialPanels = await panels();
    if (!initialPanels.workspace || initialPanels.source || initialPanels.contents) throw new Error(`${viewport.name}: compact profile must begin with one workspace panel ${JSON.stringify(initialPanels)}`);
    const fabBox = await page.getByTestId("wu-quick-fab").boundingBox();
    if (!fabBox || fabBox.width < 43.5 || fabBox.height < 43.5) throw new Error(`${viewport.name}: FAB falls below the 44px physical touch-target contract`);
    await page.getByTestId("wu-quick-fab").click();
    await page.getByTestId("wu-quick-job-ad").click();
    const sourcePanels = await panels();
    if (!sourcePanels.source || sourcePanels.workspace || sourcePanels.contents) throw new Error(`${viewport.name}: Job Ad shortcut must show only source evidence ${JSON.stringify(sourcePanels)}`);
    await page.getByTestId("wu-quick-fab").click();
    await page.getByTestId("wu-quick-contents").click();
    const contentsPanels = await panels();
    if (!contentsPanels.contents || contentsPanels.source || contentsPanels.workspace) throw new Error(`${viewport.name}: Contents shortcut must show only the contents/detail panel ${JSON.stringify(contentsPanels)}`);
    await page.getByTestId("wu-quick-fab").click();
    await page.getByTestId("wu-quick-job-ad").click();
  } else {
    const persistentPanels = await panels();
    if (!persistentPanels.source || !persistentPanels.workspace || !persistentPanels.contents) throw new Error(`${viewport.name}: landscape tablet/desktop must keep all three logical panels available ${JSON.stringify(persistentPanels)}`);
  }
  const tabs = page.getByTestId("wu-job-ad-tabs");
  await tabs.waitFor({ state: "visible" });
  if (await tabs.getByRole("tab").count() !== 8) throw new Error(`${viewport.name}: expected eight supplied/derived Job Ad views`);
  const labels = await tabs.getByRole("tab").allTextContents();
  for (const label of ["Overview", "Responsibilities", "Work Units", "Core Settlement", "Control and Exception Management", "Process Improvement & Operational Excellence", "Job Requirements", "Skills A-Z"]) {
    if (!labels.includes(label)) throw new Error(`${viewport.name}: missing Job Ad tab ${label}`);
  }
  const overflow = await tabs.evaluate((element) => ({ overflowX: getComputedStyle(element).overflowX, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
  if (!['auto', 'scroll'].includes(overflow.overflowX) || overflow.scrollWidth <= overflow.clientWidth) throw new Error(`${viewport.name}: Job Ad tabs are not independently horizontally scrollable: ${JSON.stringify(overflow)}`);
  if (viewport.name === "desktop") {
    await page.screenshot({ path: "test-results/job-ad-start-desktop.png", fullPage: true });
    await page.getByTestId("wu-job-ad-tab-responsibilities").click();
    const responsibility = page.getByTestId("wu-evidence-row").first();
    await responsibility.click();
    if (!(await responsibility.getAttribute("class")).includes("selected")) throw new Error("Responsibility selection no longer activates the evidence state");
    if (!((await page.locator(".wu-detailBlock").innerText()).includes("D1"))) throw new Error("Responsibility selection no longer reaches source detail");
  }
  await page.getByTestId(`wu-job-ad-tab-${viewport.tab}`).click();
  if (viewport.tab === "work-units") {
    const workUnits = page.getByTestId("wu-work-unit-row");
    if (await workUnits.count() !== 4) throw new Error("Work Units did not preserve four duty-linked units");
    await workUnits.first().click();
    if (!(await workUnits.first().getAttribute("class")).includes("selected")) throw new Error("Work Unit selection no longer activates lineage state");
    if (!((await page.locator(".wu-detailBlock").innerText()).includes("WU1"))) throw new Error("Work Unit selection no longer reaches lineage detail");
  }
  if (viewport.tab === "section-2" && !((await page.getByTestId("wu-job-ad-posting-section").innerText()).includes("Improve controls using observed process evidence."))) throw new Error(`${viewport.name}: posting section did not preserve verbatim content`);
  await page.screenshot({ path: `test-results/job-ad-classification-${viewport.name}.png`, fullPage: true });
  await page.close();
}

await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
console.log("Work Universe Job Ad Chromium visual matrix: PASS");
