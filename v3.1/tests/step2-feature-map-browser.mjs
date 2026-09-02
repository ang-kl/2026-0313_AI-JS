import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173";
const UPDATE_ASSETS = process.env.UPDATE_FEATURE_MAP_ASSETS === "1";
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  UPDATE_ASSETS ? "doc/feature-map-assets" : "test-results/step2-feature-map",
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const writtenScreenshots = [];

const mcfJobs = [
  {
    uuid: "mcf-data-engineer-1",
    title: "Data Engineer",
    employer: "Example Technology",
    postedCompanyName: "Example Technology",
    source: "MyCareersFuture",
    postedDate: "2026-08-26",
    expiryDate: "2026-10-01",
    salaryMin: 6200,
    salaryMax: 8200,
    employmentType: "Full Time",
    positionLevels: ["Professional"],
    minimumYearsExperience: 2,
    skills: ["SQL", "Python", "ETL"],
    categories: ["Information Technology"],
    responsibilities: [
      "Build production data pipelines for customer analytics.",
      "Maintain warehouse quality checks and batch monitoring.",
    ],
    description:
      "Build production data pipelines for customer analytics. Maintain warehouse quality checks and batch monitoring.",
    mcfUrl: "https://www.mycareersfuture.gov.sg/job/mcf-data-engineer-1",
  },
  {
    uuid: "mcf-platform-engineer-2",
    title: "Analytics Platform Engineer",
    employer: "Example Technology",
    postedCompanyName: "Example Technology",
    source: "MyCareersFuture",
    postedDate: "2026-08-21",
    expiryDate: "2026-10-05",
    salaryMin: 7200,
    salaryMax: 9600,
    employmentType: "Full Time",
    positionLevels: ["Senior Executive"],
    minimumYearsExperience: 4,
    skills: ["Spark", "Python", "Data platforms"],
    categories: ["Information Technology"],
    responsibilities: [
      "Operate the shared data platform used by engineers and analysts.",
      "Improve orchestration, observability and platform reliability.",
    ],
    description:
      "Operate the shared data platform used by engineers and analysts. Improve orchestration and reliability.",
    mcfUrl: "https://www.mycareersfuture.gov.sg/job/mcf-platform-engineer-2",
  },
  {
    uuid: "mcf-support-unclassified-3",
    title: "Operations Analyst",
    employer: "Example Operations",
    postedCompanyName: "Example Operations",
    source: "MyCareersFuture",
    postedDate: "2026-08-17",
    expiryDate: "2026-09-30",
    salaryMin: 3800,
    salaryMax: 5200,
    employmentType: "Contract",
    positionLevels: ["Executive"],
    minimumYearsExperience: 1,
    skills: ["Reporting", "Excel", "Workflow"],
    categories: ["Operations"],
    responsibilities: [
      "Prepare weekly data engineer hiring reports for the operations lead.",
      "Track intake volumes and hand off exceptions to business owners.",
    ],
    description:
      "Prepare weekly data engineer hiring reports for the operations lead and track intake exceptions.",
    mcfUrl: "https://www.mycareersfuture.gov.sg/job/mcf-support-unclassified-3",
  },
];

const csgJobs = [
  {
    uuid: "csg-hrp-data-1-001",
    title: "Data Engineer",
    employer: "Public Data Office",
    postedCompanyName: "Public Data Office",
    source: "careers.gov.sg",
    postedDate: "2026-08-24",
    expiryDate: "2026-09-22",
    salaryMin: null,
    salaryMax: null,
    employmentType: "Permanent",
    positionLevels: ["Manager"],
    minimumYearsExperience: 3,
    skills: ["Data engineering", "Governance"],
    categories: ["Digital / Information Technology"],
    responsibilities: [
      "Develop trusted datasets for policy teams and operational reporting.",
      "Coordinate data quality remediation across agencies.",
    ],
    description:
      "Develop trusted datasets for policy teams and operational reporting. Coordinate quality remediation.",
    mcfUrl: "https://careers.gov.sg/job/csg-hrp-data-1-001",
  },
  {
    uuid: "csg-hrp-policy-2-002",
    title: "Public Service Analyst",
    employer: "Public Data Office",
    postedCompanyName: "Public Data Office",
    source: "careers.gov.sg",
    postedDate: "2026-08-16",
    expiryDate: "2026-09-17",
    salaryMin: null,
    salaryMax: null,
    employmentType: "Contract",
    positionLevels: ["Executive"],
    minimumYearsExperience: 1,
    skills: ["Policy", "Analysis"],
    categories: ["Policy / Corporate Planning"],
    responsibilities: [
      "Use data engineering outputs to prepare evidence packs for service owners.",
      "Maintain policy dashboards and intake logs.",
    ],
    description:
      "Use data engineering outputs to prepare evidence packs for service owners and maintain dashboards.",
    mcfUrl: "https://careers.gov.sg/job/csg-hrp-policy-2-002",
  },
];

const hierarchy = {
  major_group: { code: "2", title: "Professionals" },
  sub_major_group: {
    code: "25",
    title: "Information And Communications Technology Professionals",
  },
  minor_group: {
    code: "251",
    title: "Software And Applications Developers And Analysts",
  },
  unit_group: {
    code: "2511",
    title: "Systems Analysts And Software Developers",
  },
};

const classificationById = {
  "mcf-data-engineer-1": {
    status: "classified",
    confidence: 0.93,
    node: { code: "25112", title: "Software Developer" },
    hierarchy,
  },
  "mcf-platform-engineer-2": {
    status: "classified",
    confidence: 0.88,
    node: { code: "25112", title: "Software Developer" },
    hierarchy,
  },
  "csg-hrp-data-1-001": {
    status: "classified",
    confidence: 0.91,
    node: { code: "25112", title: "Software Developer" },
    hierarchy,
  },
  "csg-hrp-policy-2-002": {
    status: "classified",
    confidence: 0.79,
    node: { code: "24222", title: "Policy Administration Professional" },
    hierarchy: {
      major_group: { code: "2", title: "Professionals" },
      sub_major_group: { code: "24", title: "Business And Administration Professionals" },
      minor_group: { code: "242", title: "Administration Professionals" },
      unit_group: { code: "2422", title: "Policy Administration Professionals" },
    },
  },
};

function parseBody(request) {
  try {
    return JSON.parse(request.postData() || "{}");
  } catch {
    return {};
  }
}

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function wireApiMocks(page, calls, options = {}) {
  const mcfFixture = options.mcfFixture ?? mcfJobs;
  const csgFixture = options.csgFixture ?? csgJobs;
  const mcfFailure = options.mcfFailure || null;
  const csgFailure = options.csgFailure || null;
  const delayMs = Number(options.delayMs || 0);
  const delay = () => delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();
  await page.route("**/api/mcf", async (route) => {
    const body = parseBody(route.request());
    calls.mcf.push(body);
    if (body.action === "jobs") {
      await delay();
      if (mcfFailure) return json(route, { jobs: [], total: 0, tier: 0, fallback: true, code: mcfFailure, message: "MyCareersFuture unavailable in fixture" });
      return json(route, {
        jobs: mcfFixture,
        total: mcfFixture.length,
        capped: false,
        approximate: true,
        tier: 3,
        source: "MyCareersFuture",
      });
    }
    if (body.action === "company") {
      return json(route, {
        matches: [],
        query: body.company || "",
        queryKey: String(body.company || "").toLowerCase(),
        ambiguous: false,
        totalPostings: 0,
        pagesPolled: 1,
        fallback: true,
        code: "EMPTY",
        message: "No matching MyCareersFuture employer postings in fixture",
      });
    }
    return json(route, { results: [] });
  });

  await page.route("**/api/careers", async (route) => {
    const body = parseBody(route.request());
    calls.careers.push(body);
    await delay();
    if (csgFailure) return json(route, { jobs: [], total: 0, fallback: true, code: csgFailure, source: "careers.gov.sg", message: "careers.gov.sg unavailable in fixture" });
    return json(route, {
      jobs: csgFixture,
      total: csgFixture.length,
      capped: false,
      source: "careers.gov.sg",
    });
  });

  await page.route("**/api/ssoc", async (route) => {
    const body = parseBody(route.request());
    calls.ssoc.push(body);
    if (body.action === "classifyTitles") {
      calls.classify.push(body);
      await delay();
      return json(route, {
        classifications: (body.jobs || []).map((job) => {
          const classified = classificationById[job.id];
          if (!classified) {
            return { id: job.id, status: "withheld", reason: "no_fixture_classification" };
          }
          return { id: job.id, ...classified };
        }),
      });
    }
    return json(route, {
      results: [
        {
          code: "25112",
          title: "Software Developer",
          hierarchy,
        },
      ],
    });
  });

  await page.route("**/api/ssic", async (route) =>
    json(route, {
      matched: "exact",
      source: "acra",
      postal: "018956",
      building: "One Marina",
      street: "Marina Boulevard",
      namesakes: 0,
    }),
  );

  await page.route("**/api/geocode", async (route) =>
    json(route, { matched: "single", lat: 1.282, lng: 103.852 }),
  );

  await page.route("**/api/esco", async (route) =>
    json(route, {
      occupations: [],
      skills: [],
      terms: [],
    }),
  );

  await page.route("**/api/state**", async (route) =>
    json(route, route.request().method() === "GET" ? { data: null } : { ok: true }),
  );

  await page.route("**/api/claude", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return json(route, {
      content: [{ type: "text", text: "[]" }],
      model: "step2-feature-map-fixture",
    });
  });
}

async function beginStep2(page, query = "Data Engineer") {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Browse SG jobs/i }).first().click();
  const input = page.getByRole("searchbox", { name: "Job title or role" });
  await input.fill(query);
  await page.getByRole("button", { name: "Browse SG jobs", exact: true }).last().click();
  await page.getByTestId("step2-responsive-surface").waitFor({ state: "visible" });
  await page.getByText(/Posting evidence for/i).waitFor();
}

async function openStep2(page) {
  await beginStep2(page);
  await page.getByText(/SSOC 25112/).first().waitFor({ timeout: 15_000 });
  await page.getByText(/withheld/i).first().waitFor({ timeout: 15_000 });
}

function outputPath(file) {
  return path.join(OUTPUT_DIR, file);
}

async function screenshot(page, file) {
  await page.screenshot({ path: outputPath(file), fullPage: true });
  writtenScreenshots.push(file);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function analyseButtonCount(locator) {
  return locator.getByRole("button", { name: "Analyse", exact: true }).count();
}

async function checkNoHorizontalOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(
    geometry.scrollWidth <= geometry.width + 2,
    `${label}: document overflowed horizontally (${geometry.scrollWidth} > ${geometry.width})`,
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const failedResponses = [];
  const calls = { mcf: [], careers: [], ssoc: [], classify: [] };

  try {
    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });
    await wireApiMocks(page, calls);

    await openStep2(page);
    await checkNoHorizontalOverflow(page, "iphone portrait");

    const jobsRequest = calls.mcf.find((body) => body.action === "jobs");
    assert(jobsRequest, "Step 2 did not request MyCareersFuture jobs");
    assert(
      Object.keys(jobsRequest).sort().join(",") === "action,limit,title",
      `MCF jobs request added a pre-filtering field: ${JSON.stringify(jobsRequest)}`,
    );

    const classification = calls.classify[0];
    assert(classification, "Step 2 did not request SSOC classification");
    assert(
      (classification.jobs || []).length === mcfJobs.length + csgJobs.length,
      `SSOC classification did not include all source postings: ${JSON.stringify(classification.jobs)}`,
    );
    assert(
      (classification.jobs || []).some((job) => job.id === "csg-hrp-data-1-001"),
      "SSOC classification omitted careers.gov.sg postings",
    );

    const mcfSection = page.locator(".step2-source").filter({ hasText: "MyCareersFuture" });
    const csgSection = page.locator(".step2-source").filter({ hasText: "careers.gov.sg" });
    assert((await analyseButtonCount(mcfSection)) === 3, "MCF source panel did not retain three cards");
    assert((await analyseButtonCount(csgSection)) === 2, "CSG source panel did not retain two cards");
    assert(
      (await page.getByRole("button", { name: "Analyse", exact: true }).count()) === 5,
      "Initial Step 2 card count did not match merged source postings",
    );

    const mobileFilterToggle = page.getByTestId("step2-mobile-filter-toggle");
    const mobileOverviewToggle = page.getByTestId("step2-mobile-overview-toggle");
    const mobileIndexToggle = page.getByTestId("step2-mobile-index-toggle");
    const mobileBadgeKey = page.getByTestId("step2-mobile-badge-key");
    assert((await mobileFilterToggle.getAttribute("aria-expanded")) === "false", "Phone filters should be collapsed initially");
    assert((await mobileOverviewToggle.getAttribute("aria-expanded")) === "false", "Phone overview should be collapsed initially");
    assert((await mobileIndexToggle.getAttribute("aria-expanded")) === "false", "Phone index should be collapsed initially");
    assert((await mobileBadgeKey.getAttribute("open")) === null, "Phone badge key should be collapsed initially");
    const firstCardGeometry = await page.getByTestId("step2-posting-card").first().evaluate((card) => ({
      top: card.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
    }));
    assert(firstCardGeometry.top < firstCardGeometry.viewportHeight, `Phone compression did not bring evidence into the first viewport: ${JSON.stringify(firstCardGeometry)}`);

    await mobileOverviewToggle.click();
    await page.getByTestId("step2-curation-overview").waitFor({ state: "visible" });
    await mobileOverviewToggle.click();
    await mobileIndexToggle.click();
    await page.locator("#step2-index-content").waitFor({ state: "visible" });
    await mobileIndexToggle.click();
    await mobileBadgeKey.locator("summary").click();
    assert((await mobileBadgeKey.getAttribute("open")) !== null, "Phone badge key did not expand");
    await mobileBadgeKey.locator("summary").click();

    await screenshot(page, "step2-iphone-portrait.png");

    await mobileFilterToggle.click();
    const filterTargetHeights = await page.locator("#step2-filter-controls button").evaluateAll((buttons) => buttons
      .filter((button) => button.getBoundingClientRect().height > 0)
      .map((button) => button.getBoundingClientRect().height));
    assert(filterTargetHeights.every((height) => height >= 44), `Expanded phone filter target below 44px: ${JSON.stringify(filterTargetHeights)}`);
    await page.getByRole("button", { name: "Match", exact: true }).click();
    const facetOptionHeights = await page.locator(".step2-facet-menu button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    assert(facetOptionHeights.every((height) => height >= 44), `Phone facet option below 44px: ${JSON.stringify(facetOptionHeights)}`);
    await page.locator(".step2-facet-menu").getByRole("button", { name: /^exact title\b/i }).click();
    await page.waitForTimeout(250);
    assert(
      (await page.getByRole("button", { name: "Analyse", exact: true }).count()) === 2,
      "Match filter did not narrow to exact-title cards",
    );
    assert(
      (await analyseButtonCount(mcfSection)) === 1 && (await analyseButtonCount(csgSection)) === 1,
      "Exact-title filtering did not preserve source parity",
    );
    await screenshot(page, "step2-iphone-filter.png");

    await page.locator(".step2-facet").filter({ hasText: "Match" }).locator(".step2-facet-button").click();
    await page.getByRole("button", { name: /Clear all/i }).click();
    await page.waitForTimeout(250);
    assert(
      (await page.getByRole("button", { name: "Analyse", exact: true }).count()) === 5,
      "Clear all did not restore the unfiltered posting set",
    );
    const postingSearch = page.getByRole("textbox", { name: "Search postings" });
    await postingSearch.fill("Example Technology");
    await page.waitForTimeout(150);
    const filteredCsg = page.getByTestId("step2-empty-source-csg");
    await filteredCsg.waitFor({ state: "visible" });
    await filteredCsg.locator("summary").click();
    await filteredCsg.getByText(/current filters/i).waitFor();
    await postingSearch.fill("");
    await page.waitForTimeout(150);

    await mcfSection.getByRole("heading", { name: "Data Engineer", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: /Full job posting/i });
    await dialog.waitFor({ state: "visible" });
    await dialog.getByText(/Registered employer/i).waitFor();
    await dialog.getByText(/Source: ACRA/i).waitFor();
    await dialog.getByText(/JOB AD.*VERBATIM/i).waitFor();
    await screenshot(page, "step2-iphone-full-ad.png");

    await dialog.getByRole("button", { name: /Analyse this posting/i }).click();
    await page
      .getByText(/Analysing the MyCareersFuture posting for Data Engineer at Example Technology/i)
      .waitFor({ timeout: 5_000 });
    const phoneProgressGeometry = await page.getByTestId("analysis-progress-panel").evaluate((panel) => {
      const header = document.querySelector('[data-testid="site-header"]');
      const panelRect = panel.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      return { panelTop: panelRect.top, headerBottom: headerRect.bottom };
    });
    assert(phoneProgressGeometry.panelTop >= phoneProgressGeometry.headerBottom, `Phone analysis progress overlaps header: ${JSON.stringify(phoneProgressGeometry)}`);

    assert(failedResponses.length === 0, `Unexpected failed API responses: ${failedResponses.join("; ")}`);
    assert(errors.length === 0, `Unexpected browser errors: ${errors.join("; ")}`);

    await context.close();

    const desktopCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktop.newPage();
    await wireApiMocks(desktopPage, desktopCalls);
    await openStep2(desktopPage);
    await checkNoHorizontalOverflow(desktopPage, "desktop");
    await screenshot(desktopPage, "step2-desktop.png");
    await desktopPage.getByRole("button", { name: "Analyse", exact: true }).first().click();
    const desktopProgress = desktopPage.getByTestId("analysis-progress-panel");
    await desktopProgress.waitFor({ state: "visible", timeout: 5_000 });
    const desktopProgressGeometry = await desktopProgress.evaluate((panel) => {
      const header = document.querySelector('[data-testid="site-header"]');
      const panelRect = panel.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      return { panelTop: panelRect.top, headerBottom: headerRect.bottom, gap: panelRect.top - headerRect.bottom };
    });
    assert(desktopProgressGeometry.gap >= 12, `Desktop analysis progress overlaps header: ${JSON.stringify(desktopProgressGeometry)}`);
    await screenshot(desktopPage, "step2-desktop-analysis-progress.png");
    await desktop.close();

    const zeroMcfCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const zeroMcf = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
    const zeroMcfPage = await zeroMcf.newPage();
    await wireApiMocks(zeroMcfPage, zeroMcfCalls, { mcfFixture: [], csgFixture: csgJobs, delayMs: 450 });
    await beginStep2(zeroMcfPage, "Data");
    const curationProgress = zeroMcfPage.getByTestId("step2-curation-progress");
    await curationProgress.waitFor({ state: "visible" });
    const motion = await curationProgress.evaluate((panel) => {
      const sweep = panel.querySelector(".step2-curation-sweep > span");
      const dot = panel.querySelector(".step2-curation-dot.is-loading");
      return {
        sweepAnimation: sweep ? getComputedStyle(sweep).animationName : "",
        dotAnimation: dot ? getComputedStyle(dot).animationName : "",
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });
    assert(motion.sweepAnimation === "step2CurationSweep", `Step 2 sweep animation is missing: ${JSON.stringify(motion)}`);
    assert(motion.dotAnimation === "step2CurationPulse", `Step 2 pulse animation is missing: ${JSON.stringify(motion)}`);
    const loadingFilterGeometry = await zeroMcfPage.locator(".step2-filterbar").evaluate((bar) => {
      const controls = bar.querySelector(".step2-filter-controls");
      const controlRows = new Set(Array.from(controls.children).map((control) => Math.round(control.getBoundingClientRect().top)));
      const controlsStyle = getComputedStyle(controls);
      return {
        barWidth: bar.getBoundingClientRect().width,
        barHeight: bar.getBoundingClientRect().height,
        controlsWidth: controls.getBoundingClientRect().width,
        controlsScrollWidth: controls.scrollWidth,
        controlRows: controlRows.size,
        flex: controlsStyle.flex,
        maxWidth: controlsStyle.maxWidth,
      };
    });
    assert(loadingFilterGeometry.barHeight <= 120 && loadingFilterGeometry.controlRows <= 2, `Desktop Step 2 filters collapsed into a tall control column: ${JSON.stringify(loadingFilterGeometry)}`);
    await screenshot(zeroMcfPage, "step2-desktop-curation-loading.png");
    await zeroMcfPage.getByText(/SSOC 25112/).first().waitFor({ timeout: 15_000 });

    const emptyMcf = zeroMcfPage.getByTestId("step2-empty-source-mcf");
    await emptyMcf.waitFor({ state: "visible" });
    assert((await emptyMcf.getAttribute("open")) === null, "Zero-result MyCareersFuture source should be collapsed by default");
    await zeroMcfPage.getByText(/MyCareersFuture \(0 postings\); careers\.gov\.sg \(2 postings\)/).waitFor();
    const zeroMcfGeometry = await zeroMcfPage.locator(".step2-source-grid").evaluate((grid) => {
      const careers = Array.from(grid.querySelectorAll(".step2-source")).find((source) => source.textContent.includes("careers.gov.sg"));
      const gridRect = grid.getBoundingClientRect();
      const careersRect = careers.getBoundingClientRect();
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length,
        gridWidth: gridRect.width,
        careersWidth: careersRect.width,
      };
    });
    assert(zeroMcfGeometry.columns === 1 && zeroMcfGeometry.careersWidth >= zeroMcfGeometry.gridWidth - 2, `Available source did not expand after empty MCF collapse: ${JSON.stringify(zeroMcfGeometry)}`);
    const overviewHeight = await zeroMcfPage.getByTestId("step2-curation-overview").evaluate((overview) => overview.getBoundingClientRect().height);
    assert(overviewHeight <= 210, `Desktop Curation Overview remains too tall: ${overviewHeight}px`);
    await checkNoHorizontalOverflow(zeroMcfPage, "desktop zero MCF");
    await screenshot(zeroMcfPage, "step2-desktop-zero-mcf.png");
    await zeroMcf.close();

    const partialCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const partial = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const partialPage = await partial.newPage();
    await wireApiMocks(partialPage, partialCalls, { mcfFailure: "SERVER", csgFixture: csgJobs });
    await beginStep2(partialPage);
    await partialPage.getByText(/SSOC 25112/).first().waitFor({ timeout: 15_000 });
    const unavailableMcf = partialPage.getByTestId("step2-empty-source-mcf");
    await unavailableMcf.waitFor({ state: "visible" });
    await unavailableMcf.locator("summary").click();
    await unavailableMcf.getByText(/could not be reached.*No zero-result count is claimed/i).waitFor();
    await partialPage.getByText(/MyCareersFuture \(unavailable; no count claimed\)/i).waitFor();
    assert(!(await partialPage.locator("body").innerText()).includes("MyCareersFuture (0 postings)"), "Unavailable MCF source was presented as a valid zero count");
    await partial.close();

    const failedCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const failed = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const failedPage = await failed.newPage();
    await wireApiMocks(failedPage, failedCalls, { mcfFailure: "SERVER", csgFailure: "TIMEOUT" });
    await beginStep2(failedPage);
    await failedPage.getByText(/Both posting sources are unavailable.*No zero-result claim has been made/i).waitFor();
    assert(!(await failedPage.locator("body").innerText()).includes("No live postings matched"), "Dual source failure was presented as a valid empty result");
    await failed.close();

    const csgHandoffCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const csgHandoff = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const csgHandoffPage = await csgHandoff.newPage();
    await wireApiMocks(csgHandoffPage, csgHandoffCalls);
    await openStep2(csgHandoffPage);
    const csgHandoffSection = csgHandoffPage.locator(".step2-source").filter({ hasText: "careers.gov.sg" });
    await csgHandoffSection.getByRole("button", { name: "Analyse", exact: true }).first().click();
    await csgHandoffPage.getByText(/Analysing the careers\.gov\.sg posting for Data Engineer at Public Data Office/i).waitFor({ timeout: 5_000 });
    await csgHandoffPage.getByTestId("work-universe").waitFor({ state: "visible", timeout: 60_000 });
    await csgHandoffPage.waitForFunction(() => document.querySelector('[data-testid="work-universe"]')?.dataset.wuFormFactor === "phone");
    await csgHandoffPage.getByTestId("wu-quick-fab").click();
    await csgHandoffPage.getByTestId("wu-quick-contents").click();
    await csgHandoffPage.getByTestId("tree-ai-moments").click();
    await csgHandoffPage.getByTestId("wu-ai-moments").waitFor({ state: "visible", timeout: 15_000 });
    await csgHandoffPage.waitForTimeout(1_000);
    const csgPanelState = await csgHandoffPage.locator(".company-panel").evaluate((panel) => ({
      agentsView: panel.dataset.agentsView,
      autoOpen: panel.dataset.autoOpenAiMoments,
      seedSource: panel.dataset.seedSource,
      activeSource: panel.dataset.activeSource,
    }));
    assert(csgPanelState.agentsView === "withheld" && csgPanelState.seedSource === "careers.gov.sg" && csgPanelState.activeSource === "careers.gov.sg", `careers.gov.sg handoff did not resolve the selected source: ${JSON.stringify(csgPanelState)}`);
    const csgWithheld = csgHandoffPage.getByText("AI moments - withheld (not faked)", { exact: true });
    await csgWithheld.waitFor({ state: "attached" });
    await csgWithheld.scrollIntoViewIfNeeded();
    await csgWithheld.waitFor({ state: "visible" });
    await csgHandoffPage.getByText(/Too few postings found for "Public Data Office"/i).waitFor({ state: "visible" });
    await screenshot(csgHandoffPage, "step2-csg-step3-ai-moments.png");
    const csgCompanyRequest = csgHandoffCalls.careers.find((body) => body.action === "company" && body.company === "Public Data Office");
    assert(csgCompanyRequest, "Selected careers.gov.sg employer was not used to seed the Step 3 AI Moments request");
    await csgHandoff.close();

    const manyMcf = Array.from({ length: 50 }, (_, index) => ({
      ...mcfJobs[index % mcfJobs.length],
      uuid: index === 0 ? mcfJobs[0].uuid : `mcf-batch-${index}`,
      description: "classification context ".repeat(160),
    }));
    const manyCsg = Array.from({ length: 50 }, (_, index) => ({
      ...csgJobs[index % csgJobs.length],
      uuid: index === 0 ? csgJobs[0].uuid : `csg-batch-${index}`,
      description: "public classification context ".repeat(150),
    }));
    const batchCalls = { mcf: [], careers: [], ssoc: [], classify: [] };
    const batch = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    const batchPage = await batch.newPage();
    await wireApiMocks(batchPage, batchCalls, { mcfFixture: manyMcf, csgFixture: manyCsg });
    await openStep2(batchPage);
    assert(batchCalls.classify.length === 2, `Expected two SSOC batches for 100 postings, received ${batchCalls.classify.length}`);
    assert(batchCalls.classify.every((call) => call.jobs.length <= 80), `SSOC batch exceeded endpoint limit: ${JSON.stringify(batchCalls.classify.map((call) => call.jobs.length))}`);
    assert(batchCalls.classify.reduce((sum, call) => sum + call.jobs.length, 0) === 100, "SSOC batching did not classify the complete 100-posting result set");
    assert(batchCalls.classify.every((call) => call.jobs.every((job) => String(job.description || "").length <= 1800)), "SSOC request sent description text beyond the classifier limit");
    await batch.close();
  } finally {
    await browser.close();
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        mapId: "MAP-V3-STEP2-001",
        screenshots: writtenScreenshots,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
