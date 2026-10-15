import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const TAG = process.env.TAG ?? 'x';
const W = Number(process.env.W ?? 390);
const H = Number(process.env.H ?? 844);
const WAIT = Number(process.env.WAIT ?? 25000);

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  isMobile: W < 768,
  hasTouch: W < 768,
});
const page = await ctx.newPage();
page.setDefaultTimeout(120000);
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)));

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => !document.body.innerText.includes('正在加载 3D'), null, {
  timeout: 90000,
});
await page.waitForTimeout(WAIT);

const info = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return { canvas: c ? `${c.width}x${c.height}` : 'none' };
});
console.log(`${TAG} ${W}x${H} canvas=${info.canvas} 错误=${errs.length}`);
if (errs.length) console.log('  ', errs.slice(0, 3).join(' | '));

await page.screenshot({ path: `.verification/${TAG}.png` });
await browser.close();
