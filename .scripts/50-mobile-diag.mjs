import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'https://308d9bd5bfc44df28d80127d98af73e1.app.workbuddy.host';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WAIT = Number(process.env.WAIT ?? 60000);

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const page = await ctx.newPage();
page.setDefaultTimeout(120000);
const t0 = Date.now();
const log = [];
const errs = [];

page.on('request', (r) => {
  const u = r.url();
  if (u.includes('.glb') || u.includes('draco')) log.push(`+${((Date.now() - t0) / 1000).toFixed(1)}s REQ  ${u.split('/').pop()}`);
});
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('.glb') || u.includes('draco')) log.push(`+${((Date.now() - t0) / 1000).toFixed(1)}s RESP ${r.status()} ${u.split('/').pop()}`);
});
page.on('requestfinished', (r) => {
  const u = r.url();
  if (u.includes('.glb') || u.includes('draco')) log.push(`+${((Date.now() - t0) / 1000).toFixed(1)}s DONE ${u.split('/').pop()}`);
});
page.on('requestfailed', (r) => {
  const u = r.url();
  if (u.includes('.glb') || u.includes('draco')) log.push(`+${((Date.now() - t0) / 1000).toFixed(1)}s FAIL ${r.failure()?.errorText} ${u.split('/').pop()}`);
});
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200));
  if (m.text().includes('[Anatomy]')) log.push(`+${((Date.now() - t0) / 1000).toFixed(1)}s ${m.text().slice(0, 120)}`);
});

const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 80,
  downloadThroughput: (4 * 1024 * 1024) / 8,
  uploadThroughput: (1024 * 1024) / 8,
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

console.log('=== 观察', WAIT / 1000, '秒 ===');
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(WAIT);

const res = await page.evaluate(() => {
  const entries = performance.getEntriesByType('resource').map((e) => ({
    n: e.name.split('/').pop().slice(0, 28),
    dur: Math.round(e.duration),
    size: e.transferSize,
    enc: e.encodedBodySize,
  }));
  const big = entries.filter((e) => e.n.includes('.glb') || e.n.includes('draco') || e.size > 100000);
  return {
    big,
    ready: !document.body.innerText.includes('正在加载 3D'),
    canvas: (() => { const c = document.querySelector('canvas'); return c ? `${c.width}x${c.height}` : 'none'; })(),
    heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'n/a',
  };
});

console.log('--- 网络时间线 ---');
console.log(log.join('\n') || '(无)');
console.log('--- 大资源加载 ---');
console.log(JSON.stringify(res.big, null, 1));
console.log('模型就绪:', res.ready, '| canvas:', res.canvas, '| JS 堆:', res.heap);
console.log('--- 错误 ---');
console.log(errs.slice(0, 6).join('\n') || '(无)');

await browser.close();
