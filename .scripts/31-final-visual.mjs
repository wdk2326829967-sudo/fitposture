// 收尾验收：全身三种模式 + 腹直肌选中态，确认布光/深度偏移改动没有副作用
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.6 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => {
  if (m.type() === 'error') errs.push('console: ' + m.text());
});
await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);

await p.getByText('显示骨骼').click();
await p.waitForTimeout(800);
await p.screenshot({ path: 'E:/work空间/fitposture/.verification/X1-body-realistic.png' });

await p.getByRole('button', { name: '分色肌群' }).click();
await p.waitForTimeout(1500);
await p.screenshot({ path: 'E:/work空间/fitposture/.verification/X2-body-color.png' });

await p.getByRole('button', { name: '仿真' }).click();
await p.waitForTimeout(1200);
await p.getByRole('button', { name: '腹直肌', exact: true }).click();
await p.waitForTimeout(1600);
await p.screenshot({ path: 'E:/work空间/fitposture/.verification/X3-rectus-selected.png' });

// 体态问题库（背光高亮模式）
await p.goto('http://localhost:5173/posture', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.screenshot({ path: 'E:/work空间/fitposture/.verification/X4-posture.png' });

console.log('报错数:', errs.length, errs.slice(0, 4));
await b.close();
