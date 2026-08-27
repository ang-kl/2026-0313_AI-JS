import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync('test-results', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const claudeRequests = [];
const apiTraffic = [];
let evidenceRoundTrip = 'WITHHELD_NO_SOURCE_ROWS';

page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/')) apiTraffic.push({ url: url.replace(base, ''), status: response.status(), method: response.request().method() });
});

const roleFixture = [
  { title: 'Data Engineer', iscoCode: '2529', iscoGroup: 'Database and network professionals not elsewhere classified', industry: 'Technology', description: 'Designs and maintains data pipelines and platforms that make reliable data available for analysis and operations.', isAltLabel: false },
  { title: 'Database Designer', iscoCode: '2521', iscoGroup: 'Database designers and administrators', industry: 'Technology', description: 'Designs database structures and data models for information systems.', isAltLabel: false },
  { title: 'Database Administrator', iscoCode: '2521', iscoGroup: 'Database designers and administrators', industry: 'Technology Services', description: 'Administers databases to keep information available, secure and reliable.', isAltLabel: false },
  { title: 'Data Scientist', iscoCode: '2511', iscoGroup: 'Systems analysts', industry: 'Professional Services', description: 'Uses data, statistics and computing methods to develop analytical findings and models.', isAltLabel: false },
  { title: 'ICT System Architect', iscoCode: '2511', iscoGroup: 'Systems analysts', industry: 'Information and Communications', description: 'Designs information technology system structures and how their components work together.', isAltLabel: false },
];

await page.route('**/api/claude', async (route) => {
  let body = null;
  try { body = route.request().postDataJSON(); } catch (_) { body = route.request().postData(); }
  claudeRequests.push(body);
  const system = String(body?.system || '');
  const prompt = String(body?.messages?.[0]?.content || '');
  let text = '[]';
  if (/occupational classification expert/i.test(system) && /Search term:/i.test(prompt)) text = JSON.stringify(roleFixture);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }], model: 'browser-gate-fixture' }) });
});

async function screenshot(name) {
  await page.screenshot({ path: `test-results/${name}`, fullPage: true });
}

async function requireVisible(locator, message, timeout = 15000) {
  await locator.waitFor({ state: 'visible', timeout });
  if (!await locator.isVisible()) throw new Error(message);
}

await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
const search = page.locator('input[name="job-title"]');
await requireVisible(search, 'Step 1 search field not visible');
await screenshot('01-step1.png');

await search.fill('Data Engineer');
await page.waitForTimeout(2200);
const dataEngineerChoice = page.getByText('Data Engineer', { exact: true }).first();
await requireVisible(dataEngineerChoice, 'Step 1 Data Engineer role choice not found');
await screenshot('02-step1-role-options.png');
await dataEngineerChoice.click();

const universe = page.getByTestId('work-universe');
await requireVisible(universe, 'Step 3 Work Universe did not open after the preserved role-analysis pipeline', 30000);
await screenshot('03-work-universe.png');

// The desktop workbench is one available viewport, not a document three screens tall.
// The source rail, Contents tree and detail inspector each own their overflow.
await page.setViewportSize({ width: 2048, height: 1280 });
await page.waitForTimeout(300);
const workbenchMetrics = await universe.evaluate((root) => {
  const read = (selector) => {
    const element = root.querySelector(selector);
    const style = element ? getComputedStyle(element) : null;
    return element && style ? { overflowY: style.overflowY, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight } : null;
  };
  const rect = root.getBoundingClientRect();
  return {
    viewportWidth: window.innerWidth,
    top: rect.top,
    bottom: rect.bottom,
    viewportHeight: window.innerHeight,
    rootHeight: getComputedStyle(root).height,
    rootMinHeight: getComputedStyle(root).minHeight,
    availableHeight: getComputedStyle(root).getPropertyValue('--wu-available-height'),
    source: read('.wu-sourceBody'),
    contents: read('.wu-outlineList'),
    detail: read('.wu-drillBody'),
  };
});
if (workbenchMetrics.bottom > workbenchMetrics.viewportHeight + 2) throw new Error(`Work Universe exceeds the available desktop viewport: ${JSON.stringify(workbenchMetrics)}`);
for (const panel of ['source', 'contents', 'detail']) {
  if (!['auto', 'scroll'].includes(workbenchMetrics[panel]?.overflowY)) throw new Error(`${panel} panel does not own vertical scrolling`);
}
await requireVisible(page.getByTestId('wu-contents-tree'), 'Website-style Contents tree is missing');
if (await page.locator('[aria-label="Work Universe site tree"][role="tree"]').count()) throw new Error('Tree role must be on the tree list, not the nav wrapper');
await requireVisible(page.locator('[aria-label="Work Universe site tree"] [role="tree"]'), 'Contents does not expose accessible tree semantics');
await requireVisible(page.getByTestId('tree-ai-moments'), 'Organisation tree does not expose AI Moments / Cards / Neural');
if (await page.getByRole('button', { name: 'O-I-A Trace', exact: true }).count()) throw new Error('Visible O-I-A navigation remains on the Work Universe landing');
await screenshot('03-work-universe-2048x1280.png');
await page.setViewportSize({ width: 1440, height: 1000 });

const graphIds = ['labour', 'organisation', 'intelligence', 'human-agent', 'transition'];
for (const id of graphIds) {
  const graph = page.getByTestId(`graph-${id}`);
  await requireVisible(graph, `Canonical graph ${id} is not visible`);
  const signals = graph.locator('.wu-signal');
  if (await signals.count() !== 3) throw new Error(`Canonical graph ${id} must expose exactly three first-order signals`);
}

const r3fCount = await page.getByTestId('work-universe-r3f').count();
console.log(`R3F canvas present: ${r3fCount > 0}`);

// The Organisation Work Graph owns a dedicated, evidence-gated Organisation Map.
// Its six dimensions remain visible even when the current posting supplies none of
// them; absence must render as WITHHELD rather than an inferred org chart.
await page.getByTestId('graph-organisation').locator('.wu-graphTitle').click();
await page.getByTestId('open-organisation-map').click();
const organisationMap = page.getByTestId('organisation-map');
await requireVisible(organisationMap, 'Organisation Work Graph did not open the dedicated Organisation Map');
for (const dimension of ['functions', 'reportingBoundaries', 'dependencies', 'capabilities', 'authority', 'processOwnership']) {
  await requireVisible(page.getByTestId(`organisation-map-${dimension}`), `Organisation Map is missing ${dimension}`);
}
const organisationMapText = await organisationMap.innerText();
if (!organisationMapText.includes('WITHHELD')) throw new Error('Organisation Map guessed missing organisation evidence instead of withholding');
if (!/does not infer organisation maturity/i.test(organisationMapText)) throw new Error('Organisation Map maturity boundary is not visible');

// The approved route reuses the existing AI Moments surface and keeps the
// organisation-maturity boundary explicit. With no employer in this role-only
// fixture, the destination must be a truthful withheld state rather than a mock.
await page.getByTestId('organisation-map-ai-moments').click();
const aiMomentsSurface = page.getByTestId('v31-ai-moments-surface');
await requireVisible(aiMomentsSurface, 'Organisation Map did not route to AI Moments');
const aiMomentsText = await aiMomentsSurface.innerText();
if (!aiMomentsText.includes('Cards | Neural')) throw new Error('AI Moments destination does not identify the preserved Cards / Neural views');
if (!/do not grade organisation maturity/i.test(aiMomentsText)) throw new Error('AI Moments route omits the organisation-maturity boundary');
if (!/withheld/i.test(aiMomentsText)) throw new Error('Role-only AI Moments route invented employer evidence instead of withholding');
await screenshot('03-ai-moments-withheld.png');
await page.getByTestId('return-organisation-map').click();
await requireVisible(organisationMap, 'Organisation Map did not restore after AI Moments');

for (const visual of [
  { name: 'desktop', width: 1440, height: 1000, columns: 3 },
  { name: 'tablet', width: 820, height: 1180, columns: 2 },
  { name: 'mobile', width: 390, height: 844, columns: 1 },
]) {
  await page.setViewportSize({ width: visual.width, height: visual.height });
  await page.waitForTimeout(250);
  await requireVisible(organisationMap, `Organisation Map is not visible at ${visual.name} width`);
  const gridColumns = await organisationMap.locator('.om-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  if (gridColumns !== visual.columns) throw new Error(`Organisation Map expected ${visual.columns} columns at ${visual.name}, received ${gridColumns}`);
  await screenshot(`03-organisation-map-${visual.name}.png`);
  if (visual.name === 'mobile') {
    const scrollState = await organisationMap.locator('.om-map').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return { scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
    });
    await page.waitForTimeout(150);
    if (scrollState.scrollHeight > scrollState.clientHeight && scrollState.scrollTop <= 0) throw new Error('Organisation Map mobile detail cannot scroll to explicit relationships');
    const relationshipVisible = await organisationMap.evaluate((root) => {
      const scroller = root.querySelector('.om-map');
      const relationship = root.querySelector('[data-testid="organisation-map-relationships"]');
      if (!scroller || !relationship) return false;
      const outer = scroller.getBoundingClientRect();
      const inner = relationship.getBoundingClientRect();
      return inner.bottom > outer.top && inner.top < outer.bottom;
    });
    if (!relationshipVisible) throw new Error('Organisation Map explicit relationships are not reachable on mobile');
    await screenshot('03-organisation-map-mobile-relationships.png');
    await organisationMap.locator('.om-map').evaluate((element) => { element.scrollTop = 0; });
  }
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByTestId('organisation-map-back').click();
await requireVisible(page.getByTestId('graph-organisation'), 'Five-graph universe did not restore from Organisation Map');
await page.getByTestId('wu-anchor-role').click();

// The Work Universe utility route must open a real editorial package, not print the dashboard.
await page.getByTestId('wu-open-print-package').click();
await requireVisible(page.getByTestId('v31-workspace-print'), 'Print intent did not reach the existing Step 3 workspace');
const printPreview = page.getByTestId('print-package-preview');
await requireVisible(printPreview, 'Printable editorial package did not open');
const cleanPrintText = await printPreview.innerText();
for (const heading of ['Clean role read', 'Candidate action brief', 'Interview question sheet', 'Resume alignment rationale']) {
  if (!cleanPrintText.includes(heading)) throw new Error(`Clean print package is missing ${heading}`);
}
if (!cleanPrintText.includes('WITHHELD')) throw new Error('Print package guessed absent candidate/source evidence instead of withholding');
await page.getByRole('button', { name: 'Full review' }).click();
const reviewPrintText = await printPreview.innerText();
for (const heading of ['All-markup review', 'Reviewer summary and decision ledger']) {
  if (!reviewPrintText.includes(heading)) throw new Error(`Full review print package is missing ${heading}`);
}
await screenshot('08-print-package.png');
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: 'test-results/step3-review-package.pdf', format: 'A4', printBackground: true });
await page.emulateMedia({ media: 'screen' });
if (fs.statSync('test-results/step3-review-package.pdf').size < 10000) throw new Error('Generated Step 3 PDF is unexpectedly small');
await page.locator('.v31-print-controls .close').click();
await page.getByTestId('return-work-universe').click();
await requireVisible(universe, 'Work Universe did not restore after print-package review');

await page.getByTestId('graph-labour').locator('.wu-signal').filter({ hasText: 'Canonical skills' }).click();
const detail = page.getByTestId('wu-detail');
await requireVisible(detail, 'Labour first-order signal did not open its evidence detail');
if (!((await detail.innerText()).includes('Canonical skills'))) throw new Error('Labour detail did not retain selected Canonical skills signal');
const openRoleGraph = page.getByTestId('open-role-graph');
await requireVisible(openRoleGraph, 'Labour graph did not expose the preserved Role Graph action');
await screenshot('04-labour-detail.png');
await openRoleGraph.click();

const workspace = page.getByTestId('v31-workspace-roleGraph');
await requireVisible(workspace, 'Existing Step 3 workspace did not open from Labour graph');
const fab = page.locator('button[title="Workspace navigator"]');
await requireVisible(fab, 'Existing FAB/workspace navigator is missing');
if ((await fab.getAttribute('aria-expanded')) !== 'false') throw new Error('FAB should begin closed on first workspace entry');
await screenshot('05-role-graph-workspace.png');
await fab.click();
await page.waitForTimeout(350);
const fabMenu = page.locator('[role="menu"][aria-label="Workspace navigator"]');
const fabState = await fab.evaluate((el) => ({
  expanded: el.getAttribute('aria-expanded'),
  label: el.getAttribute('aria-label'),
  disabled: el.disabled,
  rect: el.getBoundingClientRect().toJSON(),
}));
const menuState = await page.locator('[role="menu"]').evaluateAll((els) => els.map((el) => ({
  label: el.getAttribute('aria-label'),
  display: getComputedStyle(el).display,
  visibility: getComputedStyle(el).visibility,
  opacity: getComputedStyle(el).opacity,
  rect: el.getBoundingClientRect().toJSON(),
  text: (el.innerText || '').slice(0, 500),
})));
console.log('=== FAB STATE AFTER CLICK ===');
console.log(JSON.stringify({ fabState, menuState }, null, 2));
fs.writeFileSync('test-results/fab-state.json', JSON.stringify({ fabState, menuState }, null, 2));
await screenshot('06-fab-after-click.png');
if (fabState.expanded !== 'true') throw new Error(`FAB click did not persist open state: ${JSON.stringify(fabState)}`);
if (!menuState.some((m) => m.label === 'Workspace navigator' && m.display !== 'none' && m.visibility !== 'hidden' && Number(m.rect?.width || 0) > 0 && Number(m.rect?.height || 0) > 0)) {
  throw new Error(`FAB open state did not produce a visible workspace navigator menu: ${JSON.stringify(menuState)}`);
}

const backUniverse = page.getByTestId('return-work-universe');
await requireVisible(backUniverse, 'Workspace has no return path to Work Universe');
await backUniverse.click();
await requireVisible(universe, 'Work Universe did not restore after workspace round trip');
await requireVisible(detail, 'Selected Work Universe signal was lost on return');
if (!((await detail.innerText()).includes('Canonical skills'))) throw new Error('Selected Work Universe detail changed during workspace round trip');
await screenshot('07-work-universe-return.png');

// Anchor reprojection must change the claims, not only the centre label.
await page.getByTestId('wu-anchor-org').click();
const orgGraph = page.getByTestId('graph-organisation');
if (!((await orgGraph.innerText()).includes('Operating-model coverage'))) throw new Error('Organisation projection did not reframe organisation claims');
await orgGraph.locator('.wu-signal').first().click();
await page.getByTestId('open-graph-workspace').click();
await requireVisible(page.getByTestId('v31-workspace-graph-2'), 'Organisation graph intent did not reach the existing workspace');
await requireVisible(page.locator('[aria-label="Company Information"]'), 'Organisation graph did not open Company Information');
await page.getByTestId('return-work-universe').click();

await page.getByTestId('wu-anchor-person').click();
const personLabour = page.getByTestId('graph-labour');
if (!((await personLabour.innerText()).includes('Person skills evidenced'))) throw new Error('Person projection did not expose person-specific skill evidence');
if (!((await personLabour.innerText()).includes('WITHHELD'))) throw new Error('Person projection guessed a personal claim without person evidence');
await screenshot('08-person-projection.png');

// Source evidence carries the same span id used by the Review Studio O-I-A engine.
await page.getByTestId('wu-source-anchor').click();
const firstEvidence = page.getByTestId('wu-evidence-row').first();
if (await firstEvidence.count()) {
  await requireVisible(firstEvidence, 'Source evidence row exists but is not visible');
  await firstEvidence.click();
  await page.getByTestId('open-evidence-workspace').click();
  await requireVisible(page.getByTestId('v31-workspace-evidence-s0'), 'Evidence span intent did not reach the existing workspace');
  await requireVisible(page.locator('[aria-label="Evidence / Explanation"]'), 'Evidence intent did not open the evidence drawer');
  await page.getByTestId('return-work-universe').click();
  evidenceRoundTrip = 'PASS';
} else if (!((await page.locator('.wu-sourceBody').innerText()).includes('No source rows are available yet'))) {
  throw new Error('Missing source evidence did not render the required withheld empty state');
}

await page.getByTestId('wu-anchor-role').click();
await page.getByTestId('graph-labour').locator('.wu-signal').filter({ hasText: 'Canonical skills' }).click();

// The existing Canvas contract closes an open navigator when the user clicks
// outside it. Returning to Work Universe is such an outside click. What must
// persist is the workspace itself and the FAB functionality, not an open popover.
await page.getByTestId('open-role-graph').click();
await requireVisible(workspace, 'Role Graph workspace did not reopen');
await page.waitForTimeout(200);
if ((await fab.getAttribute('aria-expanded')) !== 'false') throw new Error('FAB did not honour its existing click-outside close contract');
await fab.click();
await page.waitForTimeout(200);
if ((await fab.getAttribute('aria-expanded')) !== 'true') throw new Error('FAB did not reopen after Work Universe round trip');
if (!await fabMenu.isVisible()) throw new Error('Workspace navigator menu did not reopen after Work Universe round trip');
await screenshot('09-role-graph-return.png');

await page.getByTestId('return-work-universe').click();
const step2Back = page.getByRole('button', { name: '← Step 2' });
await requireVisible(step2Back, 'Existing Step 2 return control is missing from Work Universe');
await step2Back.click();
await page.waitForTimeout(800);
if (await universe.isVisible()) throw new Error('Step 2 return control did not leave Work Universe');
const step2Body = (await page.locator('body').innerText()).trim();
if (!step2Body || step2Body.length < 100) throw new Error('Step 2 return produced an empty application surface');
fs.writeFileSync('test-results/step2-return.txt', step2Body.slice(0, 20000));
await screenshot('10-step2-return.png');

fs.writeFileSync('test-results/claude-contract.json', JSON.stringify(claudeRequests, null, 2));
fs.writeFileSync('test-results/api-traffic.json', JSON.stringify(apiTraffic, null, 2));
fs.writeFileSync('test-results/gate-summary.json', JSON.stringify({
  step1: 'PASS', step2Return: 'PASS', workUniverse: 'PASS', canonicalGraphs: 'PASS', firstOrderSignals: 'PASS',
  organisationMap: 'PASS', organisationMapResponsive: 'PASS', organisationMapWithholding: 'PASS', roleGraph: 'PASS', fabRoundTrip: 'PASS', projectionAlgorithms: 'PASS', workspaceIntentRouting: 'PASS', printPackage: 'PASS', printPdf: 'PASS', evidenceRoundTrip, r3fCanvasPresent: r3fCount > 0,
  materialBrowserErrors: errors,
}, null, 2));

console.log('=== STEP 2 RETURN (first 4000 chars) ===');
console.log(step2Body.slice(0, 4000));
console.log('=== BROWSER ERRORS ===');
console.log(JSON.stringify(errors, null, 2));
if (errors.some((e) => /Rendered more hooks|is not exported|ReferenceError|TypeError|Minified React error/i.test(e))) {
  throw new Error(`Material browser error detected: ${errors.join(' | ')}`);
}

await browser.close();
