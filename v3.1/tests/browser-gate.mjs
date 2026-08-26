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

// Test-only boundary: capture the app's real LLM contract without sending any
// production credential or changing app code. An empty JSON array is a safe
// schema probe; the request body tells the next gate exactly what fixture the
// existing Step 1 code expects.
await page.route('**/api/claude', async (route) => {
  let body = null;
  try { body = route.request().postDataJSON(); } catch (_) { body = route.request().postData(); }
  claudeRequests.push(body);
  console.log('=== CLAUDE CONTRACT REQUEST ===');
  console.log(JSON.stringify(body, null, 2).slice(0, 30000));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [{ type: 'text', text: '[]' }], model: 'browser-gate-fixture' }),
  });
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
  console.log(`=== ${label} BODY (first 16000 chars) ===`);
  console.log(text.slice(0, 16000));
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
await page.waitForTimeout(2800);
const afterSearch = await dump('AFTER DATA ENGINEER SEARCH', '02-data-engineer-search.png');
if (!afterSearch.text.toLowerCase().includes('data engineer')) throw new Error('Data Engineer search did not produce visible matching text');
if (!claudeRequests.length) throw new Error('Expected Step 1 to issue at least one /api/claude request');

fs.writeFileSync('test-results/claude-contract.json', JSON.stringify(claudeRequests, null, 2));
console.log('=== BROWSER ERRORS ===');
console.log(JSON.stringify(errors, null, 2));
if (errors.some((e) => /Rendered more hooks|is not exported|ReferenceError|TypeError/i.test(e))) {
  throw new Error(`Material browser error detected: ${errors.join(' | ')}`);
}

await browser.close();
