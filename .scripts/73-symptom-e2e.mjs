/** 症状反查端到端验证：列表搜索筛选、详情页分诊、3D 紫色高亮是否真的点亮 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOT = process.env.SHOT ?? 'E:/work空间/fitposture/.verification';
const TAG = process.env.TAG ?? 's1-symptom';

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
await page.goto(`${BASE}/symptoms`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(1500);

let text = await page.locator('body').innerText();
ok(text.includes('症状反查'), '标题正确');
ok(text.includes('先说清楚'), '顶部有非诊断声明');
const cards = await page.locator('a[href^="/symptoms/"]').count();
ok(cards === 26, `列表页有 26 个症状入口`, `实际 ${cards}`);
for (const r of ['头颈', '肩部', '腰背', '髋臀', '膝部', '足踝']) {
  ok(text.includes(r), `部位分组含「${r}」`);
}
await page.screenshot({ path: `${SHOT}/${TAG}-list.png`, fullPage: false });

console.log('\n--- 搜索与筛选 ---');
await page.fill('input[placeholder^="描述你的感觉"]', '膝盖');
await page.waitForTimeout(600);
const searched = await page.locator('a[href^="/symptoms/"]').count();
ok(searched > 0 && searched < 26, `搜索「膝盖」收敛到 ${searched} 条`);
text = await page.locator('body').innerText();
ok(text.includes('膝盖'), '搜索结果含膝盖相关症状');

await page.fill('input[placeholder^="描述你的感觉"]', '鼠标手');
await page.waitForTimeout(600);
text = await page.locator('body').innerText();
ok(text.includes('手腕酸痛发麻'), '口语别名「鼠标手」能搜到对应症状');

await page.fill('input[placeholder^="描述你的感觉"]', '不存在的词xyz');
await page.waitForTimeout(600);
text = await page.locator('body').innerText();
ok(text.includes('没有匹配的描述'), '无结果时有空状态提示');

await page.click('text=看全部症状');
await page.waitForTimeout(400);
await page.click('button:has-text("腰背")');
await page.waitForTimeout(400);
const filtered = await page.locator('a[href^="/symptoms/"]').count();
ok(filtered === 5, `按「腰背」筛选后 5 条`, `实际 ${filtered}`);

console.log('\n--- 详情页 ---');
await page.goto(`${BASE}/symptoms/neck_ache`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(1500);
text = await page.locator('body').innerText();
ok(text.includes('低头久了颈后酸'), '详情页标题正确');
ok(text.includes('这是什么'), '有「这是什么」');
ok(text.includes('常见人群'), '有典型人群');
ok(text.includes('先分诊'), '有分诊器');
ok(text.includes('可能相关的肌肉'), '有可能相关肌肉区');
ok(text.includes('为什么是它'), '每条肌肉给了原因');
ok(text.includes('怎么判断'), '每条肌肉给了判断依据');
ok(text.includes('30 秒自测'), '有自测区');
ok(text.includes('结果怎么读'), '自测有结果解读');
ok(text.includes('相关的体态问题'), '有关联体态');
ok(text.includes('头前伸'), '关联体态为头前伸');
ok(text.includes('这段时间别做'), '有禁忌区');
ok(text.includes('改善方案'), '有改善方案');
ok(text.includes('① 放松'), '方案含放松');
ok(text.includes('生活与工位调整'), '有生活调整');
ok(text.includes('请就医而不是先练'), '有危险信号区');

// 肌肉名渲染为中文，不暴露 id
ok(text.includes('枕下肌群') && text.includes('肩胛提肌'), '肌肉显示中文名');
ok(!text.includes('neck_suboccipital'), '未直接暴露肌肉 id');
await page.screenshot({ path: `${SHOT}/${TAG}-detail.png`, fullPage: false });

console.log('\n--- 分诊器行为 ---');
ok(text.includes('没有危险信号'), '默认（两周内/中度痛）给出可练提示');
await page.click('button:has-text("今天刚出现")');
await page.waitForTimeout(400);
text = await page.locator('body').innerText();
ok(text.includes('现在处于急性期'), '选「今天刚出现」切到急性期提示');
ok(text.includes('现在就该做的事'), '急性期改称"现在就该做的事"');
ok(text.includes('急性期过后的方案'), '方案区标注为急性期过后');

await page.click('button:has-text("两周内")');
await page.waitForTimeout(300);
await page.check('input[type="checkbox"]');
await page.waitForTimeout(400);
text = await page.locator('body').innerText();
ok(text.includes('建议先就医'), '勾选外伤后提示先就医');
await page.uncheck('input[type="checkbox"]');
await page.waitForTimeout(300);

console.log('\n--- 3D 紫色高亮 ---');
await page.click('button:has-text("在 3D 人体上点亮")');
await page.waitForURL(/\/\?symptom=neck_ache/, { timeout: 120000 });
await page.waitForFunction(() => !document.body.innerText.includes('正在加载 3D'), null, {
  timeout: 120000,
}).catch(() => {});
await page.waitForTimeout(7000);

text = await page.locator('body').innerText();
ok(text.includes('紫色为可能相关的肌肉'), '首页出现症状高亮图例');

const countPurple = async () => {
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
    let purple = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // 模型基础色是棕红/米色，体态高亮是橙与蓝；
      // 只有症状高亮 #a855f7 是"红高、绿低、蓝最高"的紫色
      if (b > 140 && r > 110 && r < b && g < 130 && g < b - 50) purple++;
    }
    return purple;
  }, buf.toString('base64'));
};

const purple = await countPurple();
ok(purple > 300, `画面出现症状紫色高亮（${purple} 像素）`);
await page.screenshot({ path: `${SHOT}/${TAG}-highlight.png` });

await page.click('button:has-text("清除高亮")');
await page.waitForTimeout(1200);
const afterClear = await countPurple();
ok(afterClear < 200, '清除后紫色消失', `残留 ${afterClear} 像素`);

console.log('\n--- 反向入口 ---');
await page.goto(`${BASE}/posture/forward_head`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(6000);
text = await page.locator('body').innerText();
ok(text.includes('它可能表现为这些不适'), '体态详情页有症状反查入口');
ok(text.includes('低头久了颈后酸'), '反查到了对应症状');

await page.goto(`${BASE}/muscle/neck_levator`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(6000);
text = await page.locator('body').innerText();
ok(text.includes('这块肌肉出问题时，常见是这样'), '肌肉详情页有症状反查入口');

console.log(`\n控制台错误: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
ok(errors.length === 0, '无控制台错误');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
