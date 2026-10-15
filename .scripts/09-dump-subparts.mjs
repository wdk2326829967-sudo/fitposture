// 用 Vite 开发服务器加载 TS 模块，导出全部亚部清单做人工核对
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const data = await page.evaluate(async () => {
  const sp = await import('/src/kb/subparts.ts');
  const plans = await import('/src/kb/partPlans.ts');
  const groups = await import('/src/kb/mesh/groups.ts');
  const out = [];
  for (const g of groups.SELECTABLE_GROUPS) {
    const parts = sp.listParts(g.id);
    if (parts.length < 2) continue;
    out.push({
      group: g.id,
      cn: g.cn,
      parts: parts.map((p) => ({
        key: p.key,
        cn: p.cn,
        short: p.short,
        en: p.en,
        hasPlan: !!plans.PART_PLANS[p.id],
      })),
    });
  }
  return out;
});

let total = 0;
let withPlan = 0;
for (const g of data) {
  console.log(`\n== ${g.group}  ${g.cn}`);
  for (const p of g.parts) {
    total++;
    if (p.hasPlan) withPlan++;
    console.log(`   ${p.hasPlan ? '✓' : '·'} ${p.cn.padEnd(22)} ${p.en}`);
  }
}
// 检查 PART_PLANS 里有没有指向不存在亚部的键
const orphan = await page.evaluate(async () => {
  const sp = await import('/src/kb/subparts.ts');
  const plans = await import('/src/kb/partPlans.ts');
  return Object.keys(plans.PART_PLANS).filter((k) => !sp.getPart(k));
});
console.log('\n可细分肌群数:', data.length, ' 亚部总数:', total, ' 有专属方案:', withPlan);
console.log('孤立方案键（无对应亚部）:', orphan);

await browser.close();
