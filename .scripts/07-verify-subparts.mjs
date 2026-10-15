// 人工冒烟：验证「细分肌肉」交互链路
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

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

async function shot(name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('📸', name);
}

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// 1. 选中三角肌
await page.getByRole('button', { name: '三角肌', exact: true }).click();
await shot('01-deltoid-selected');

// 2. 细分已自动展开（选中带动亚部的肌群即展开），按钮此时为「收起细分」
const collapseBtn = page.getByRole('button', { name: '收起细分' });
console.log('已自动展开:', await collapseBtn.isVisible());
await shot('02-expanded');

// 3. 点前束
await page.getByRole('button', { name: '前束' }).click();
await shot('03-anterior');

// 4. 点后束 + 转到背面
await page.getByRole('button', { name: '后束' }).click();
await page.getByRole('button', { name: '转到背面' }).click();
await shot('04-posterior-back');

// 5. 详情页
await page.goto('http://localhost:5173/muscle/thigh_quads', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await shot('05-detail-quads');

await page.goto('http://localhost:5173/muscle/thigh_quads/vastus_medialis', {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(4000);
await shot('06-detail-vmo');

console.log('\n--- console logs ---');
console.log(logs.slice(-40).join('\n'));

await browser.close();
