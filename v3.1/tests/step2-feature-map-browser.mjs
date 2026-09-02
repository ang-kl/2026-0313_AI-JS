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

async function wireApiMocks(page, calls) {
  await page.route("**/api/mcf", async (route) => {
    const body = parseBody(route.request());
    calls.mcf.push(body);
    if (body.action === "jobs") {
      return json(route, {
        jobs: mcfJobs,
        total: mcfJobs.length,
        capped: false,
        approximate: true,
        tier: 3,
        source: "MyCareersFuture",
      });
    }
    return json(route, { results: [] });
  });

  await page.route("**/api/careers", async (route) => {
    const body = parseBody(route.request());
    calls.careers.push(body);
    return json(route, {
      jobs: csgJobs,
      total: csgJobs.length,
      capped: false,
      source: "careers.gov.sg",
    });
  });

  await page.route("**/api/ssoc", async (route) => {
    const body = parseBody(route.request());
    calls.ssoc.push(body);
    if (body.action === "classifyTitles") {
      calls.classify.push(body);
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

  await page.route("**/api/claude", async (route) =>
    json(route, {
      content: JSON.stringify({
        role: "Data Engineer",
        responsibilities: [],
        tasks: [],
        skills: [],
      }),
    }),
  );
}

async function openStep2(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Browse SG jobs/i }).first().click();
  const input = page.getByRole("searchbox", { name: "Job title or role" });
  await input.fill("Data Engineer");
  await page.getByRole("button", { name: "Browse SG jobs", exact: true }).last().click();
  await page.getByTestId("step2-responsive-surface").waitFor({ state: "visible" });
  await page.getByText(/Posting evidence for/i).waitFor();
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

    await screenshot(page, "step2-iphone-portrait.png");

    await page.getByRole("button", { name: "Match", exact: true }).click();
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

    await page.getByRole("button", { name: /Clear all/i }).click();
    await page.waitForTimeout(250);
    assert(
      (await page.getByRole("button", { name: "Analyse", exact: true }).count()) === 5,
      "Clear all did not restore the unfiltered posting set",
    );

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
