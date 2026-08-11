import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:4035/candidate-profile/edit', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Basics', { timeout: 15000 });
await page.locator('.sec-toggle', { hasText: 'Basics' }).click();
await page.waitForSelector('.flagselect-trigger[aria-label="Country code"]', { timeout: 5000 });

// Check 1: dropdown list width fits content, no wrapping.
const phoneTrigger = page.locator('.flagselect-trigger[aria-label="Country code"]');
await phoneTrigger.click();
await page.waitForSelector('.flagselect-list', { timeout: 5000 });

// Find an option with a long code like "+1 242" (Bahamas) and check it stays on one line.
const bahamasOpt = page.locator('.flagselect-opt[title="Bahamas"]');
await bahamasOpt.scrollIntoViewIfNeeded();
const bahamasLabelBox = await bahamasOpt.locator('.flagselect-opt-label').boundingBox();
const bahamasOptBox = await bahamasOpt.boundingBox();
console.log('BAHAMAS_LABEL_HEIGHT:', bahamasLabelBox.height); // should be ~1 line height, not double
console.log('BAHAMAS_OPT_HEIGHT:', bahamasOptBox.height);
const listBox = await page.locator('.flagselect-list').boundingBox();
console.log('LIST_WIDTH:', listBox.width);

await page.screenshot({ path: 'C:/Users/nedel/AppData/Local/Temp/claude/g--Next-hr-talent-platform/5ae2c4f5-0ff7-4be1-ae3a-e4789c7db195/scratchpad/phone-list-width-fix.png' });

await page.keyboard.press('Escape');

// Check 2: CV preview phone contact line includes phone code prefix.
const contactPhoneText = await page.locator('.cv-c').filter({ hasText: /\d{2,}/ }).allTextContents();
console.log('CV_CONTACT_TEXTS:', JSON.stringify(contactPhoneText));

console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
await browser.close();
