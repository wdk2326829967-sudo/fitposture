// 收尾截图：注册 → 收藏肌肉 → 记一次训练 → 「我的」页定格
// 用法：BASE=https://xxx.app.workbuddy.host node .scripts/34-final-shot.mjs
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOT = 'E:/work空间/fitposture/.verification';
const email = `final${Date.now()}@example.com`;
const pass = 'Passw0rd!2026';
const nick = `收尾${Math.floor(Math.random() * 900 + 100)}`;

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

// 云端首屏要拉 1.4MB JS + 3D 模型，等待时间给足，否则按钮还没渲染就开始点
const go = async (path, wait = 15000) => {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(wait);
};

// 1. 注册
await go('/');
await page.getByRole('link', { name: '登录' }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: '去注册' }).click();
await page.waitForTimeout(500);
await page.locator('input[placeholder="怎么称呼你"]').fill(nick);
await page.locator('input[type="email"]').fill(email);
await page.locator('input[type="password"]').first().fill(pass);
await page.getByRole('button', { name: '注册' }).click();
await page.waitForTimeout(3000);

// 2. 收藏肌肉
// 肌肉详情页要先加载完 3D 场景才会渲染出收藏按钮，固定等待不可靠，显式等元素出现
await go('/muscle/shoulder_deltoid', 20000);
const favBtn = page.getByRole('button', { name: /收藏/ }).first();
try {
  await favBtn.waitFor({ state: 'visible', timeout: 60000 });
  await favBtn.click();
  await page.waitForTimeout(2500);
  console.log('已收藏肌肉');
} catch {
  console.log('收藏按钮未出现（详情页未就绪）');
}

// 3. 记一次训练
await go('/muscle/chest_pec_major', 20000);
try {
  const logToggle = page.getByRole('button', { name: /记一次训练/ }).first();
  await logToggle.waitFor({ state: 'visible', timeout: 60000 });
  await logToggle.click();
  await page.waitForTimeout(1500);
  const boxes = page.locator('input[type="checkbox"]');
  await boxes.first().waitFor({ state: 'visible', timeout: 30000 });
  const n = await boxes.count();
  if (n > 0) {
    await boxes.nth(0).check();
    if (n > 1) await boxes.nth(1).check();
  }
  const noteBox = page.locator('input[placeholder="备注（可选）"]');
  if (await noteBox.count()) await noteBox.fill('胸推日：状态不错，左侧略紧');
  await page.waitForTimeout(600);
  const saveBtn = page.getByRole('button', { name: /保存（/ }).first();
  await saveBtn.waitFor({ state: 'visible', timeout: 30000 });
  await saveBtn.click();
  await page.waitForTimeout(3000);
  console.log('已保存训练记录');
} catch (e) {
  console.log('训练记录未保存:', String(e.message).slice(0, 100));
}

// 4. 「我的」页定格
await go('/me', 3000);
await page.screenshot({ path: `${SHOT}/Z20-live-final.png`, fullPage: true });

const body = await page.locator('body').innerText();
console.log('收藏区:', body.match(/我的收藏（\d+）/)?.[0] ?? '未找到');
console.log('训练记录:', body.match(/训练记录（\d+）/)?.[0] ?? '未找到');
console.log('控制台错误:', errors.length, errors.slice(0, 3).join(' | '));

await browser.close();
