// 四种状态对照，分离「被斜肌遮挡」与「选中态自发光压平明暗」两个变量
import { chromium } from 'playwright-core';

const states = [
  { name: 'A-unselected', url: 'http://localhost:5173/', pick: false },
  { name: 'B-selected', url: 'http://localhost:5173/', pick: true },
  { name: 'C-only-unselected', url: 'http://localhost:5173/?only=core_rectus', pick: false },
];

for (const st of states) {
  const b = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => console.log('[err]', st.name, e.message));
  await p.goto(st.url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000);

  const skel = p.getByText('显示骨骼');
  if (await skel.count()) {
    await skel.first().click();
    await p.waitForTimeout(600);
  }

  if (st.pick) {
    const rectus = p.getByRole('button', { name: '腹直肌', exact: true });
    if (await rectus.count()) {
      await rectus.first().click();
      await p.waitForTimeout(1200);
    }
  }

  const c = await p.locator('canvas').boundingBox();
  await p.mouse.move(c.x + c.width / 2, c.y + c.height * 0.44);
  for (let i = 0; i < 8; i++) {
    await p.mouse.wheel(0, -120);
    await p.waitForTimeout(110);
  }
  await p.waitForTimeout(1700);
  await p.mouse.move(c.x + 12, c.y + c.height - 12);
  await p.waitForTimeout(800);

  await p.screenshot({
    path: `E:/work空间/fitposture/.verification/W-${st.name}.png`,
    clip: {
      x: c.x + c.width * 0.32,
      y: c.y + c.height * 0.06,
      width: c.width * 0.36,
      height: c.height * 0.58,
    },
  });
  console.log('shot', st.name);
  await b.close();
}
