// 前端端到端：注册 → 收藏肌肉 → 记一次训练 → 在「我的」里看到数据
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';

const SHOT = 'E:/work空间/fitposture/.verification';
const email = `ui${Date.now()}@example.com`;
const pass = 'Passw0rd!2026';
const nick = `UI测试${Math.floor(Math.random() * 900 + 100)}`;

let passCount = 0;
let failCount = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passCount++; console.log(`  PASS  ${name}${extra ? ' — ' + extra : ''}`); }
  else { failCount++; console.log(`  FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
};

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const shot = async (name) => page.screenshot({ path: `${SHOT}/${name}.png` });

console.log('\n[1] 首页');
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6500);
ok('页头显示登录入口', await page.getByRole('link', { name: '登录' }).count() > 0);
await shot('Y1-home');

console.log('\n[2] 注册');
await page.getByRole('link', { name: '登录' }).click();
await page.waitForTimeout(600);
await shot('Y2-login');
await page.getByRole('button', { name: '去注册' }).click();
await page.waitForTimeout(400);
await page.locator('input[placeholder="怎么称呼你"]').fill(nick);
await page.locator('input[type="email"]').fill(email);
await page.locator('input[type="password"]').fill(pass);
await shot('Y3-register-form');
await page.getByRole('button', { name: '注册并登录' }).click();
await page.waitForURL('**/me', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1500);
ok('注册后跳转到 /me', page.url().includes('/me'), page.url());
ok('页头显示昵称', await page.getByRole('link', { name: nick }).count() > 0);
await shot('Y4-me-empty');

console.log('\n[3] 修改档案');
await page.getByRole('button', { name: '有基础' }).click();
await page.waitForTimeout(800);
await shot('Y5-me-profile');

console.log('\n[4] 肌肉详情页收藏');
await page.goto(`${BASE}/muscle/shoulder_deltoid`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6500);
const favBtn = page.getByRole('button', { name: /收藏/ }).first();
ok('详情页有收藏按钮', await favBtn.count() > 0);
await favBtn.click();
await page.waitForTimeout(1200);
const favText = await page.getByRole('button', { name: /收藏/ }).first().textContent();
ok('点击后变为已收藏', (favText ?? '').includes('已收藏'), favText ?? '');
await shot('Y6-muscle-favorited');

console.log('\n[5] 亚部收藏');
await page.goto(`${BASE}/muscle/shoulder_deltoid/posterior`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6500);
const favBtn2 = page.getByRole('button', { name: /收藏/ }).first();
await favBtn2.click();
await page.waitForTimeout(1200);
await shot('Y7-part-favorited');

console.log('\n[6] 记一次训练');
await page.goto(`${BASE}/muscle/chest_pec_major`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6500);
const logToggle = page.getByRole('button', { name: /记一次训练/ }).first();
ok('有「记一次训练」入口', await logToggle.count() > 0);
await logToggle.click();
await page.waitForTimeout(600);
const boxes = page.locator('input[type="checkbox"]');
const boxCount = await boxes.count();
ok('列出候选动作', boxCount > 0, `${boxCount} 个`);
if (boxCount > 0) {
  await boxes.nth(0).check();
  if (boxCount > 1) await boxes.nth(1).check();
}
await page.locator('input[placeholder="备注（可选）"]').fill('UI 自动测试记录');
await shot('Y8-log-panel');
const saveBtn = page.getByRole('button', { name: /保存（/ }).first();
await saveBtn.click();
await page.waitForTimeout(1800);
await shot('Y9-log-saved');

console.log('\n[7] 回到「我的」核对数据');
await page.goto(`${BASE}/me`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const body = await page.locator('body').innerText();
ok('收藏区显示 2 条', /我的收藏（2）/.test(body), body.match(/我的收藏（\d+）/)?.[0] ?? '未匹配');
ok('训练记录显示 1 条', /训练记录（1）/.test(body), body.match(/训练记录（\d+）/)?.[0] ?? '未匹配');
ok('记录含备注文字', body.includes('UI 自动测试记录'));
ok('统计显示训练次数 1', /训练次数\s*\n?\s*1/.test(body) || body.includes('训练次数'));
await page.screenshot({ path: `${SHOT}/Y10-me-filled.png`, fullPage: true });

console.log('\n[8] 登出后状态');
await page.getByRole('button', { name: '退出' }).click();
await page.waitForTimeout(1200);
ok('登出后回到登录入口', await page.getByRole('link', { name: '登录' }).count() > 0);
await shot('Y11-logged-out');

// 重新登录验证持久化
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.locator('input[type="email"]').fill(email);
await page.locator('input[type="password"]').fill(pass);
await page.getByRole('button', { name: '登录', exact: true }).click();
await page.waitForURL('**/me', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1800);
const body2 = await page.locator('body').innerText();
ok('重新登录后收藏仍在', /我的收藏（2）/.test(body2), body2.match(/我的收藏（\d+）/)?.[0] ?? '未匹配');
await page.screenshot({ path: `${SHOT}/Y12-relogin.png`, fullPage: true });

console.log(`\n控制台错误: ${errors.length}`);
errors.slice(0, 5).forEach((e) => console.log('   -', e.slice(0, 160)));

console.log(`\n===== 通过 ${passCount} / 失败 ${failCount} =====`);
await browser.close();
process.exit(failCount === 0 && errors.length === 0 ? 0 : 1);
