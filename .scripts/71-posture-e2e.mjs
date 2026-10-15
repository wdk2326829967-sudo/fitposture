/** 体态库端到端验证：列表页 content、详情页渲染、3D 双色高亮是否真的点亮 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const SHOT = process.env.SHOT ?? 'E:/work空间/fitposture/.verification';
const TAG = process.env.TAG ?? 'p1-posture';

let pass = 0;
let fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  ok   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label} ${extra}`);
  }
};

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);

const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 160));
});

console.log('--- 列表页 ---');
await page.goto(`${BASE}/posture`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(2500);

const bodyText = await page.locator('body').innerText();
ok(!bodyText.includes('正在建设中'), '不再是「正在建设中」占位页');
ok(bodyText.includes('体态问题库'), '标题正确');

const cards = await page.locator('a[href^="/posture/"]').count();
ok(cards === 7, `列表页有 7 个体态问题入口`, `实际 ${cards}`);

for (const name of ['圆肩含胸', '头前伸', '骨盆前倾', '膝超伸', '扁平足']) {
  ok(bodyText.includes(name), `列表含「${name}」`);
}
await page.screenshot({ path: `${SHOT}/${TAG}-list.png` });

console.log('\n--- 详情页 ---');
await page.goto(`${BASE}/posture/rounded_shoulder`, { waitUntil: 'domcontentloaded', timeout: 120000 });
// 3D 要下载模型，给足时间
await page.waitForFunction(() => !document.body.innerText.includes('正在加载 3D'), null, {
  timeout: 120000,
}).catch(() => {});
await page.waitForTimeout(6000);

const detail = await page.locator('body').innerText();
ok(detail.includes('圆肩含胸'), '详情页标题正确');
ok(detail.includes('这是什么'), '有「这是什么」说明');
ok(detail.includes('紧张（缩短）'), '有紧张肌分区');
ok(detail.includes('无力（拉长）'), '有无力肌分区');
ok(detail.includes('怎么自测'), '有自测方法');
ok(detail.includes('靠墙手背贴墙测试'), '自测名称渲染');
ok(detail.includes('正常：'), '自测含正常判定');
ok(detail.includes('异常：'), '自测含异常判定');
ok(detail.includes('矫正方案'), '有矫正方案');
ok(detail.includes('① 放松'), '方案含放松步骤');
ok(detail.includes('④ 强化'), '方案含强化步骤');
ok(detail.includes('注意'), '有注意事项');

// 肌肉名应渲染成中文而非 id
ok(detail.includes('胸大肌'), '肌肉显示为中文名（胸大肌）');
ok(!detail.includes('chest_pec_major'), '未直接暴露肌肉 id');

const exCards = await page.locator('aside').locator('text=/组/').count();
ok(exCards > 0, '方案区渲染出动作卡', `匹配 ${exCards}`);

// 3D 双色高亮：紧张肌橙红 #ff7043、无力肌蓝 #42a5f5
const canvasOk = await page.locator('canvas').count();
ok(canvasOk > 0, '3D canvas 已渲染');

const hasLegend = await page.locator('text=紧张肌 · 需要放松与拉伸').count();
ok(hasLegend > 0, '3D 上有双色图例');

await page.screenshot({ path: `${SHOT}/${TAG}-detail.png` });

// 取 canvas 像素确认高亮真的画上去了。
// 不能用 WebGL 的 readPixels：默认 context 不保留绘制缓冲，读出来是空帧。
// 改成截 canvas 元素、再在页面里用 2D canvas 解码取色。
const countColors = async () => {
  const buf = await page.locator('canvas').first().screenshot();
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;

    let tight = 0;
    let weak = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // 模型基础色是棕红(#b4624f)与米色骨骼，画面里本不该有蓝色——
      // 出现蓝色像素，只可能是「无力肌」高亮。这个判据不受光照明暗影响。
      if (b > 90 && b > r + 30 && b > g + 15) weak++;
      // 紧张肌橙红 #ff7043 比基础棕红更亮更饱和，用红蓝比区分
      if (r > 110 && r > b * 3 && r > g + 45) tight++;
    }
    return { tight, weak };
  }, buf.toString('base64'));
};

const colors = await countColors();
ok(colors.weak > 200, `画面出现无力肌蓝色高亮（${colors.weak} 像素）`);
ok(colors.tight > 200, `画面出现紧张肌橙红高亮（${colors.tight} 像素）`);

console.log('\n--- 离开详情页应清除高亮 ---');
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(9000);
const homeColors = await countColors();
ok(homeColors.weak < 200, '回到首页后无力肌蓝色已清除', `残留 ${homeColors.weak} 像素`);

console.log(`\n控制台错误: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
ok(errors.length === 0, '无控制台错误');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
