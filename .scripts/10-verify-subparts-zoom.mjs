import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = 'E:/work空间/fitposture/.verification';
mkdirSync(OUT, { recursive: true });
const EXEC = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || m.text().includes('buildPartLayers') || m.text().includes('partPlans'))
    console.log(`[${m.type()}]`, m.text());
});

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// 3D 画布区域
const canvas = page.locator('canvas');
const box = await canvas.boundingBox();
console.log('canvas', box);

// 放大到肩部
await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3);
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, -260);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/z1-shoulder-normal.png`, clip: { x: box.x + box.width * 0.25, y: box.y, width: box.width * 0.5, height: box.height * 0.6 } });
console.log('📸 z1 未细分');

await page.getByRole('button', { name: '三角肌', exact: true }).click();
await page.getByRole('button', { name: '在 3D 上展开' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/z2-shoulder-expanded.png`, clip: { x: box.x + box.width * 0.25, y: box.y, width: box.width * 0.5, height: box.height * 0.6 } });
console.log('📸 z2 细分展开');

await page.getByRole('button', { name: '前束' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/z3-shoulder-anterior.png`, clip: { x: box.x + box.width * 0.25, y: box.y, width: box.width * 0.5, height: box.height * 0.6 } });
console.log('📸 z3 选中前束');

await page.getByRole('button', { name: '中束' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/z4-shoulder-middle.png`, clip: { x: box.x + box.width * 0.25, y: box.y, width: box.width * 0.5, height: box.height * 0.6 } });
console.log('📸 z4 选中中束');

await browser.close();
