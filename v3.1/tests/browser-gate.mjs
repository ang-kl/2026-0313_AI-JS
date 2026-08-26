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

const graphIds = ['labour', 'organisation', 'intelligence', 'human-agent', 'transition'];
for (const id of graphIds) {
  const graph = page.getByTestId(`graph-${id}`);
  await requireVisible(graph, `Canonical graph ${id} is not visible`);
  const signals = graph.locator('.wu-signal');
  if (await signals.count() !== 3) throw new Error(`Canonical graph ${id} must expose exactly three first-order signals`);
}

const r3fCount = await page.getByTestId('work-universe-r3f').count();
console.log(`R3F canvas present: ${r3fCount > 0}`);

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
  roleGraph: 'PASS', fabRoundTrip: 'PASS', projectionAlgorithms: 'PASS', workspaceIntentRouting: 'PASS', evidenceRoundTrip, r3fCanvasPresent: r3fCount > 0,
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
