import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'https://308d9bd5bfc44df28d80127d98af73e1.app.workbuddy.host';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function probe(label, ctxOpts, throttle) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200));
  });

  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 80,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (1024 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(30000);

  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    let gl = null;
    let ctxOk = false;
    if (c) {
      try {
        gl = c.getContext('webgl2') || c.getContext('webgl');
        ctxOk = !!gl;
      } catch (e) {
        ctxOk = 'throw: ' + e.message;
      }
    }
    const parent = c?.parentElement;
    return {
      canvas: c ? `${c.width}x${c.height}` : 'none',
      cssSize: c ? `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}` : 'none',
      parentSize: parent
        ? `${Math.round(parent.getBoundingClientRect().width)}x${Math.round(parent.getBoundingClientRect().height)}`
        : 'none',
      glContext: String(ctxOk),
      renderer: gl ? gl.getParameter(gl.RENDERER)?.slice(0, 40) : 'n/a',
      loading: document.body.innerText.includes('正在加载 3D'),
    };
  });

  console.log(`\n### ${label}`);
  console.log(JSON.stringify(info, null, 1));
  console.log('错误:', errs.slice(0, 3).join(' | ') || '(无)');
  await ctx.close();
}

await probe('A. 桌面 1440x900 不节流', { viewport: { width: 1440, height: 900 } }, false);
await probe('B. 桌面 1440x900 + 4G/CPU4x', { viewport: { width: 1440, height: 900 } }, true);
await probe(
  'C. 移动 390x844 不节流',
  {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  false,
);
await probe(
  'D. 移动 390x844 + 4G/CPU4x',
  {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  true,
);

await browser.close();
