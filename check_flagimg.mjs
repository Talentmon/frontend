import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:4035/candidate-profile/edit', { waitUntil: 'networkidle' });
await page.locator('.sec-toggle', { hasText: 'Basics' }).click();
await page.waitForSelector('.flagselect-trigger[aria-label="Country code"]');
await page.locator('.flagselect-trigger[aria-label="Country code"]').click();
await page.waitForSelector('.flagselect-list');

const opt = page.locator('.flagselect-list .flagselect-opt').first();
const flag = opt.locator('.fi');
const bg = await flag.evaluate((el) => getComputedStyle(el).backgroundImage);
const size = await flag.evaluate((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
const bgSize = await flag.evaluate((el) => getComputedStyle(el).backgroundSize);
const classes = await flag.getAttribute('class');
console.log('CLASSES:', classes);
console.log('BG:', bg);
console.log('SIZE:', JSON.stringify(size));
console.log('BG_SIZE:', bgSize);

await page.screenshot({ path: 'C:/Users/nedel/AppData/Local/Temp/claude/g--Next-hr-talent-platform/5ae2c4f5-0ff7-4be1-ae3a-e4789c7db195/scratchpad/flag-zoom.png', clip: { x: 250, y: 570, width: 200, height: 300 } });

await browser.close();
