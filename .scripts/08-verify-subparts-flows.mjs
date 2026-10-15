import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = 'E:/work空间/fitposture/.verification';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('404')) console.log('[console.error]', m.text());
});

async function shot(name, canvasOnly = false) {
  await page.waitForTimeout(1400);
  if (canvasOnly) {
    const c = await page.locator('canvas').boundingBox();
    await page.screenshot({
      path: `${OUT}/${name}.png`,
      clip: { x: c.x, y: c.y, width: c.width, height: c.height },
    });
  } else {
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
  console.log('📸', name);
}

// A. 首页：选中三角肌应自动细分
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.getByRole('button', { name: '三角肌', exact: true }).click();
await shot('A1-delt-auto');

// B. 切到胸大肌
await page.getByRole('button', { name: '胸大肌', exact: true }).click();
await shot('B1-pec-auto');

// C. 详情页：股四头
await page.goto('http://localhost:5173/muscle/thigh_quads/vastus_lateralis', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
await shot('C1-quads-lateral');
await shot('C1-quads-canvas', true);

// D. 详情页：竖脊肌（深层，17 个亚部）→ 检查多亚部表现
await page.goto('http://localhost:5173/muscle/back_erector', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
await shot('D1-erector');

// E. 无专属方案的亚部 → 回退到整块方案
await page.goto('http://localhost:5173/muscle/back_erector/rotatores', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
await shot('E1-rotatores-fallback');

// F. 前臂屈肌群（10 个亚部、全部走回退方案）
await page.goto('http://localhost:5173/muscle/arm_forearm_flexor', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await shot('F1-forearm');

await browser.close();
