// 腹部左右两半分别特写，便于逐侧比对「腱划」
import { chromium } from 'playwright-core';

const tag = process.argv[2] ?? 'shot';
const b = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 });
p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(process.env.URL || 'http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);

await p.getByText('显示骨骼').click();
await p.waitForTimeout(600);

if (!process.env.SKIP_PICK) {
  const rectus = p.getByRole('button', { name: '腹直肌', exact: true });
  if (await rectus.count()) {
    await rectus.first().click();
    await p.waitForTimeout(1200);
  }
}

const c = await p.locator('canvas').boundingBox();
await p.mouse.move(c.x + c.width / 2, c.y + c.height * 0.44);
for (let i = 0; i < 9; i++) {
  await p.mouse.wheel(0, -120);
  await p.waitForTimeout(110);
}
await p.waitForTimeout(1600);
// 截图时把鼠标移开，避免 hover 高亮干扰
await p.mouse.move(c.x + 20, c.y + c.height - 20);
await p.waitForTimeout(900);

const box = { x: c.x + c.width * 0.3, y: c.y + c.height * 0.05, w: c.width * 0.4, h: c.height * 0.68 };
// 左右两半（按画面中线切）
await p.screenshot({
  path: `E:/work空间/fitposture/.verification/R-${tag}-L.png`,
  clip: { x: box.x, y: box.y, width: box.w * 0.5, height: box.h },
});
await p.screenshot({
  path: `E:/work空间/fitposture/.verification/R-${tag}-R.png`,
  clip: { x: box.x + box.w * 0.5, y: box.y, width: box.w * 0.5, height: box.h },
});
console.log('shot', tag, 'L/R');
await b.close();
