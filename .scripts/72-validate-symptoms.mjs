/**
 * 症状库引用完整性校验。
 * 症状里 causes 引用肌肉 id、plan 引用动作 id、postures 引用体态 id，
 * 写错的话页面上会出现空白动作卡、点不动的链接——必须逐个核对。
 */
import { SYMPTOMS, SYMPTOM_REGION_CN } from '../src/kb/symptoms.ts';
import { EXERCISES } from '../src/kb/exercises.ts';
import { MUSCLE_META } from '../src/kb/mesh/registry.ts';
import { POSTURES } from '../src/kb/postures.ts';

let problems = 0;
const muscleIds = new Set(Object.keys(MUSCLE_META));
const postureIds = new Set(Object.keys(POSTURES));

console.log(
  `肌肉库 ${muscleIds.size} / 动作库 ${Object.keys(EXERCISES).length} / 体态 ${postureIds.size} / 症状 ${Object.keys(SYMPTOMS).length}\n`,
);

for (const [key, s] of Object.entries(SYMPTOMS)) {
  const issues = [];

  if (s.id !== key) issues.push(`id(${s.id}) 与键名(${key}) 不一致`);
  if (!s.cn) issues.push('缺少 cn');
  if (!s.summary) issues.push('缺少 summary');
  if (!s.typical) issues.push('缺少 typical');
  if (!SYMPTOM_REGION_CN[s.region]) issues.push(`部位不在枚举内: ${s.region}`);
  if (!s.aliases?.length) issues.push('缺少 aliases（搜索会失效）');

  if (!s.causes || s.causes.length < 2) issues.push('可能肌肉少于 2 个');
  for (const c of s.causes ?? []) {
    if (!muscleIds.has(c.muscle)) issues.push(`肌肉 id 不存在: ${c.muscle}`);
    if (!['primary', 'secondary'].includes(c.role)) issues.push(`role 非法: ${c.role}`);
    if (!['tight', 'weak', 'overworked'].includes(c.state)) issues.push(`state 非法: ${c.state}`);
    if (!c.why) issues.push(`${c.muscle} 缺少 why`);
    if (!c.tell) issues.push(`${c.muscle} 缺少 tell（无法与其它肌肉区分）`);
  }
  // 放射样疼痛这类"肌肉不是根因"的情况允许全部标 secondary，
  // 但必须在 summary 里说清楚（否则用户会以为练肌肉就能解决）
  const hasPrimary = (s.causes ?? []).some((c) => c.role === 'primary');
  if (!hasPrimary && !/神经|就医|排查/.test(s.summary ?? '')) {
    issues.push('没有 primary 肌肉，且 summary 未说明根因不在肌肉');
  }

  for (const p of s.postures ?? []) {
    if (!postureIds.has(p)) issues.push(`体态 id 不存在: ${p}`);
  }

  if (!s.quickChecks?.length) issues.push('缺少自测');
  for (const t of s.quickChecks ?? []) {
    if (!t.steps?.length) issues.push(`自测 ${t.id} 缺少步骤`);
    if (!t.meaning) issues.push(`自测 ${t.id} 缺少结果解读`);
  }

  let actionCount = 0;
  for (const [kind, ids] of Object.entries(s.plan ?? {})) {
    for (const id of ids) {
      actionCount++;
      if (!EXERCISES[id]) issues.push(`动作 id 不存在: plan.${kind} → ${id}`);
    }
  }
  if (actionCount === 0) issues.push('plan 全空');

  if (!s.acute?.length) issues.push('缺少急性期处理');
  if (!s.avoid?.length) issues.push('缺少禁忌');
  if (!s.dailyTips?.length) issues.push('缺少生活建议');
  if (!s.redFlags?.length) issues.push('缺少危险信号');
  if (!s.seeDoctor) issues.push('缺少就医提示');

  if (issues.length) {
    problems++;
    console.log(`FAIL ${s.cn} (${key})`);
    for (const i of issues) console.log(`       - ${i}`);
  } else {
    const actions = Object.values(s.plan ?? {}).reduce((n, a) => n + a.length, 0);
    console.log(
      `ok   ${s.cn.padEnd(16, '　')} ${SYMPTOM_REGION_CN[s.region].padEnd(3)} 肌肉 ${String(s.causes.length).padStart(2)} / 动作 ${String(actions).padStart(2)} / 自测 ${s.quickChecks.length} / 体态 ${s.postures.length}`,
    );
  }
}

// 覆盖度：肌肉库里被症状引用到的数量，以及完全没被任何症状覆盖的肌肉
const used = new Set();
for (const s of Object.values(SYMPTOMS)) for (const c of s.causes) used.add(c.muscle);
const unused = [...muscleIds].filter((m) => !used.has(m));
console.log(`\n症状覆盖肌肉 ${used.size}/${muscleIds.size}`);
if (unused.length) console.log(`未被任何症状引用: ${unused.join(', ')}`);

console.log(problems === 0 ? '\n全部通过' : `\n${problems} 项存在问题`);
process.exit(problems === 0 ? 0 : 1);
