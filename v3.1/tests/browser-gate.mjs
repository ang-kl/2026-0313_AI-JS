import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync('test-results', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const claudeRequests = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

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
  console.log('=== CLAUDE REQUEST SUMMARY ===');
  console.log(JSON.stringify({ system: system.slice(0, 300), prompt: prompt.slice(0, 1000) }, null, 2));

  let text = '[]';
  if (/occupational classification expert/i.test(system) && /Search term:/i.test(prompt)) {
    text = JSON.stringify(roleFixture);
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }], model: 'browser-gate-fixture' }) });
});

async function dump(label, screenshot) {
  const text = (await page.locator('body').innerText()).trim();
  const controls = await page.locator('button, a, input, textarea, select, [role="option"], [role="listbox"]').evaluateAll((els) =>
    els.map((el, i) => ({
      i,
      tag: el.tagName,
      role: el.getAttribute('role'),
      text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.value || '').trim(),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder'),
      disabled: !!el.disabled,
      ariaSelected: el.getAttribute('aria-selected'),
    }))
  );
  console.log(`=== ${label} BODY (first 18000 chars) ===`);
  console.log(text.slice(0, 18000));
  console.log(`=== ${label} CONTROLS ===`);
  console.log(JSON.stringify(controls, null, 2));
  if (screenshot) await page.screenshot({ path: `test-results/${screenshot}`, fullPage: true });
  return { text, controls };
}

await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
const initial = await dump('INITIAL', '01-initial.png');
if (!initial.text) throw new Error('Initial application rendered no body text');

const search = page.locator('input[name="job-title"]');
await search.fill('Data Engineer');
await page.waitForTimeout(2200);
const suggestions = await dump('STEP 1 SUGGESTIONS', '02-step1-suggestions.png');
if (!suggestions.text.includes('Data Engineer')) throw new Error('Step 1 did not render the deterministic Data Engineer role fixture');

const dataEngineerButton = page.getByRole('button', { name: /Data Engineer/i }).first();
if (!await dataEngineerButton.count()) throw new Error('Step 1 Data Engineer role button not found');
await dataEngineerButton.click();
await page.waitForTimeout(500);
const selected = await dump('STEP 1 SELECTED', '03-step1-selected.png');

const analyseButtons = page.getByRole('button', { name: /Analyse role/i });
let clickedAnalyse = false;
for (let i = await analyseButtons.count() - 1; i >= 0; i -= 1) {
  const button = analyseButtons.nth(i);
  if (await button.isVisible() && await button.isEnabled()) {
    await button.click();
    clickedAnalyse = true;
    break;
  }
}
if (!clickedAnalyse) throw new Error('Enabled Analyse role control not found after selecting Data Engineer');
await page.waitForTimeout(3500);
await dump('AFTER ANALYSE ROLE', '04-after-analyse.png');

fs.writeFileSync('test-results/claude-contract.json', JSON.stringify(claudeRequests, null, 2));
console.log('=== BROWSER ERRORS ===');
console.log(JSON.stringify(errors, null, 2));
if (errors.some((e) => /Rendered more hooks|is not exported|ReferenceError|TypeError/i.test(e))) {
  throw new Error(`Material browser error detected: ${errors.join(' | ')}`);
}

await browser.close();
