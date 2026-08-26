import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync('test-results', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const claudeRequests = [];
const apiTraffic = [];

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

// R3F is progressive enhancement. Record whether the headless Chromium runner
// exposes WebGL; the DOM projection remains the authoritative accessible path.
const r3fCount = await page.getByTestId('work-universe-r3f').count();
console.log(`R3F canvas present: ${r3fCount > 0}`);

// Select a real Labour signal, keep that selection across the round trip, and
// use the production drill-down action rather than calling wrapper state.
await page.getByTestId('graph-labour').locator('.wu-signal').nth(1).click();
const detail = page.getByTestId('wu-detail');
await requireVisible(detail, 'Labour first-order signal did not open its evidence detail');
if (!((await detail.innerText()).includes('Canonical skills'))) throw new Error('Labour detail did not retain selected Canonical skills signal');
const openRoleGraph = page.getByTestId('open-role-graph');
await requireVisible(openRoleGraph, 'Labour graph did not expose the preserved Role Graph action');
await screenshot('04-labour-detail.png');
await openRoleGraph.click();

const workspace = page.getByTestId('v31-workspace-roleGraph');
await requireVisible(workspace, 'Existing Step 3 workspace did not open from Labour graph');
const fabOpen = page.getByRole('button', { name: 'Open the workspace navigator' });
await requireVisible(fabOpen, 'Existing FAB/workspace navigator is missing');
await screenshot('05-role-graph-workspace.png');
await fabOpen.click();
const fabClose = page.getByRole('button', { name: 'Close the workspace navigator' });
await requireVisible(fabClose, 'FAB did not open the existing workspace navigator');
await screenshot('06-fab-open.png');

const backUniverse = page.getByTestId('return-work-universe');
await requireVisible(backUniverse, 'Workspace has no return path to Work Universe');
await backUniverse.click();
await requireVisible(universe, 'Work Universe did not restore after workspace round trip');
await requireVisible(detail, 'Selected Work Universe signal was lost on return');
if (!((await detail.innerText()).includes('Canonical skills'))) throw new Error('Selected Work Universe detail changed during workspace round trip');
await screenshot('07-work-universe-return.png');

// Re-enter. Because the legacy workspace remains mounted rather than recreated,
// the FAB open state must still be present. This verifies the requested
// round-trip preservation rather than merely proving two independent renders.
await page.getByTestId('open-role-graph').click();
await requireVisible(workspace, 'Role Graph workspace did not reopen');
await requireVisible(fabClose, 'FAB state reset across Work Universe round trip');
await screenshot('08-role-graph-return.png');

// Preserve the existing back-to-Step-2 control and inspect where this role mode
// returns. This does not alter that legacy navigation; it asserts it remains a
// working visible control after the new Step 3 wrapper is introduced.
await page.getByTestId('return-work-universe').click();
const step2Back = page.getByRole('button', { name: '← Step 2' });
await requireVisible(step2Back, 'Existing Step 2 return control is missing from Work Universe');

fs.writeFileSync('test-results/claude-contract.json', JSON.stringify(claudeRequests, null, 2));
fs.writeFileSync('test-results/api-traffic.json', JSON.stringify(apiTraffic, null, 2));
fs.writeFileSync('test-results/gate-summary.json', JSON.stringify({
  step1: 'PASS', workUniverse: 'PASS', canonicalGraphs: 'PASS', firstOrderSignals: 'PASS',
  roleGraph: 'PASS', fabRoundTrip: 'PASS', r3fCanvasPresent: r3fCount > 0,
  materialBrowserErrors: errors,
}, null, 2));

console.log('=== BROWSER ERRORS ===');
console.log(JSON.stringify(errors, null, 2));
if (errors.some((e) => /Rendered more hooks|is not exported|ReferenceError|TypeError|Minified React error/i.test(e))) {
  throw new Error(`Material browser error detected: ${errors.join(' | ')}`);
}

await browser.close();
