// 通过 Vite dev server 直接 import KB 模块，审计「亚部 × 6 类问题」的动作覆盖
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);

const report = await p.evaluate(async () => {
  const pp = await import('/src/kb/partPlans.ts');
  const sp = await import('/src/kb/subparts.ts');
  const ex = await import('/src/kb/exercises.ts');
  const groups = Object.keys(pp.PART_PLANS);
  const problems = ['hypertrophy', 'soreness', 'chronic_tension', 'limited_mobility', 'posture', 'strain'];
  const rows = [];
  let emptyCells = 0;
  let noRelaxRow = 0;
  for (const pid of groups) {
    const part = sp.getPart(pid);
    if (!part) continue;
    const list = pp.resolvePartPlanWithRecovery(pid, part.groupId);
    const cell = {};
    for (const pr of problems) {
      const order = pp.PART_PROBLEM_KINDS[pr];
      const n = list.filter((e) => order.includes(e.kind)).length;
      cell[pr] = n;
      if (n === 0) emptyCells++;
    }
    const kinds = [...new Set(list.map((e) => e.kind))];
    if (!kinds.includes('relax') && !kinds.includes('stretch')) noRelaxRow++;
    rows.push({ pid, total: list.length, kinds: kinds.join('+'), ...cell });
  }
  return {
    count: rows.length,
    emptyCells,
    noRelaxRow,
    problems,
    rows,
    exerciseTotal: Object.keys(ex.EXERCISES).length,
  };
});

console.log('亚部方案数：', report.count, '| 动作库总数：', report.exerciseTotal);
console.log('「亚部 × 问题」空结果数：', report.emptyCells, '/', report.count * 6);
console.log('完全没有放松/拉伸的亚部数：', report.noRelaxRow);
console.log('');
console.log(['亚部', '合计', '动作类型', ...report.problems].join('\t'));
for (const r of report.rows) {
  console.log(
    [r.pid, r.total, r.kinds, ...report.problems.map((p) => r[p])].join('\t'),
  );
}
await b.close();
