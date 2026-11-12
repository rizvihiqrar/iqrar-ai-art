// Makes the picture of each piece shown on the site: a screenshot of the piece itself, with its intro card closed.
//   npm run screenshots        (run after a piece changes, then commit docs/assets/previews/)
// Needs Playwright's Chromium once: npx playwright install chromium
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');

const pieces = [{ folder: 'lost-tones', out: 'docs/assets/previews/01-lost-tones.png', closeButton: '#infoClose' }];

const browser = await chromium.launch();
for (const p of pieces) {
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
  await page.goto(pathToFileURL(path.join(root, p.folder, 'index.html')).href);
  await page.waitForTimeout(1500);
  const close = page.locator(p.closeButton);
  if (await close.first().isVisible()) await close.first().click({ timeout: 5000 });
  if (await close.first().isVisible()) throw new Error(`${p.folder}: the intro card did not close, so the picture would show it`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(root, p.out) });
  console.log(`wrote ${p.out}`);
}
await browser.close();
