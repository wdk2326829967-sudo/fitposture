/**
 * 体态库引用完整性校验。
 * 体态问题里 tight/weak 引用肌肉 id、plan 引用动作 id，
 * 一旦写错，页面上对应的肌肉不会高亮、动作卡片会空白——必须逐个核对。
 */
import { POSTURES } from '../src/kb/postures.ts';
import { EXERCISES } from '../src/kb/exercises.ts';
import { MUSCLE_META } from '../src/kb/mesh/registry.ts';

let problems = 0;
const muscleIds = new Set(Object.keys(MUSCLE_META));

console.log(`肌肉库 ${muscleIds.size} 项 / 动作库 ${Object.keys(EXERCISES).length} 项 / 体态问题 ${Object.keys(POSTURES).length} 项\n`);

for (const [key, p] of Object.entries(POSTURES)) {
  const issues = [];

  if (p.id !== key) issues.push(`id(${p.id}) 与键名(${key}) 不一致`);
  if (!p.cn || !p.en) issues.push('缺少中英文名');
  if (!p.description) issues.push('缺少 description');
  if (!p.howToSelfCheck) issues.push('缺少 howToSelfCheck');

  for (const m of [...p.tight, ...p.weak]) {
    if (!muscleIds.has(m)) issues.push(`肌肉 id 不存在: ${m}`);
  }
  if (p.tight.length === 0) issues.push('tight 为空（3D 无法高亮）');
  if (p.weak.length === 0) issues.push('weak 为空（3D 无法高亮）');

  // 紧张肌与无力肌不应重复
  const dup = p.tight.filter((m) => p.weak.includes(m));
  if (dup.length) issues.push(`同时被标为紧张和无力: ${dup.join(', ')}`);

  let actionCount = 0;
  for (const [kind, ids] of Object.entries(p.plan)) {
    if (!Array.isArray(ids)) {
      issues.push(`plan.${kind} 不是数组`);
      continue;
    }
    for (const id of ids) {
      actionCount++;
      if (!EXERCISES[id]) issues.push(`动作 id 不存在: plan.${kind} → ${id}`);
    }
  }
  if (actionCount === 0) issues.push('plan 全空');

  if (!p.selfTest || p.selfTest.length === 0) issues.push('缺少 selfTest');
  for (const t of p.selfTest ?? []) {
    if (!t.steps?.length) issues.push(`自测 ${t.id} 缺少步骤`);
    if (!t.normal || !t.abnormal) issues.push(`自测 ${t.id} 缺少正常/异常判定`);
  }

  if (issues.length) {
    problems++;
    console.log(`FAIL ${p.cn} (${key})`);
    for (const i of issues) console.log(`       - ${i}`);
  } else {
    const actions = Object.values(p.plan).reduce((n, a) => n + a.length, 0);
    console.log(
      `ok   ${p.cn.padEnd(12, '　')} 紧张 ${String(p.tight.length).padStart(2)} / 无力 ${String(p.weak.length).padStart(2)} / 动作 ${String(actions).padStart(2)} / 自测 ${p.selfTest.length}`,
    );
  }
}

console.log(problems === 0 ? '\n全部通过' : `\n${problems} 项存在问题`);
process.exit(problems === 0 ? 0 : 1);
