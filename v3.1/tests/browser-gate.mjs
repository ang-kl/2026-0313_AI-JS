import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync('test-results', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.screenshot({ path: 'test-results/01-initial.png', fullPage: true });

const bodyText = (await page.locator('body').innerText()).trim();
const controls = await page.locator('button, a, input, textarea, select').evaluateAll((els) =>
  els.map((el, i) => ({
    i,
    tag: el.tagName,
    text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.value || '').trim(),
    type: el.getAttribute('type'),
    name: el.getAttribute('name'),
    placeholder: el.getAttribute('placeholder'),
    disabled: !!el.disabled,
  }))
);

console.log('=== PAGE TITLE ===');
console.log(await page.title());
console.log('=== BODY TEXT (first 12000 chars) ===');
console.log(bodyText.slice(0, 12000));
console.log('=== CONTROLS ===');
console.log(JSON.stringify(controls, null, 2));
console.log('=== BROWSER ERRORS ===');
console.log(JSON.stringify(errors, null, 2));

if (!bodyText) throw new Error('Initial application rendered no body text');
if (errors.some((e) => /Rendered more hooks|is not exported|ReferenceError|TypeError/i.test(e))) {
  throw new Error(`Material browser error detected: ${errors.join(' | ')}`);
}

await browser.close();
