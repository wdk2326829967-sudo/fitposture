/** 数据导出接口断言：内容完整、结构正确、且绝不泄露密码哈希 */
const BASE = process.env.BASE ?? 'http://localhost:3100/api';

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

const email = `exp${Date.now()}@example.com`;
const password = 'Passw0rd!2026';

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'X-Auth-Token': token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // 非 JSON 保留原文
  }
  return { status: res.status, json, text, headers: res.headers };
}

const reg = await call('/auth/register', {
  method: 'POST',
  body: { email, password, nickname: '导出测试' },
});
const token = reg.json?.token;
ok(reg.status === 201 && !!token, '注册拿到 token');

// 布置数据：一条收藏 + 一条训练记录（含两个动作）
await call('/favorites', {
  method: 'POST',
  token,
  body: {
    targetType: 'muscle',
    targetId: 'shoulder_deltoid',
    title: '三角肌',
    subtitle: '肩部',
  },
});

await call('/workouts', {
  method: 'POST',
  token,
  body: {
    muscleId: 'chest_pec_major',
    note: '导出测试记录',
    entries: [
      { exerciseId: 'bench_press', exerciseName: '卧推', sets: '4', reps: '8', weight: '60kg', feel: 4 },
      { exerciseId: 'push_up', exerciseName: '俯卧撑', sets: '3', reps: '15', weight: '', feel: 3 },
    ],
  },
});

console.log('\n--- 导出断言 ---');

const unauth = await call('/me/export');
ok(unauth.status === 401, '未登录导出返回 401', `实际 ${unauth.status}`);

const exp = await call('/me/export', { token });
ok(exp.status === 200, '登录后导出返回 200', `实际 ${exp.status}`);

const d = exp.json;
ok(!!d, '导出内容是合法 JSON');
ok(d?.format === 'fitposture-user-data', 'format 标记正确', String(d?.format));
ok(d?.version === 1, 'version 为 1');
ok(typeof d?.exportedAt === 'number' && d.exportedAt > 0, 'exportedAt 是时间戳');

ok(d?.profile?.email === email, '包含本人邮箱');
ok(d?.profile?.nickname === '导出测试', '包含昵称');

const raw = exp.text;
ok(!raw.includes('password_hash'), '导出不含 password_hash（关键）');
ok(!raw.includes('$2a$') && !raw.includes('$2b$'), '导出不含 bcrypt 哈希串（关键）');

ok(Array.isArray(d?.favorites) && d.favorites.length === 1, '收藏导出了 1 条', `实际 ${d?.favorites?.length}`);
ok(d?.favorites?.[0]?.id === 'shoulder_deltoid', '收藏 id 正确');
ok(d?.favorites?.[0]?.title === '三角肌', '收藏标题正确');

ok(Array.isArray(d?.workouts) && d.workouts.length === 1, '训练记录导出了 1 条', `实际 ${d?.workouts?.length}`);
ok(d?.workouts?.[0]?.note === '导出测试记录', '训练备注正确');
ok(d?.workouts?.[0]?.entries?.length === 2, '动作明细 2 条', `实际 ${d?.workouts?.[0]?.entries?.length}`);
ok(d?.workouts?.[0]?.entries?.[0]?.exerciseName === '卧推', '动作名称正确');
ok(d?.workouts?.[0]?.entries?.[0]?.weight === '60kg', '重量字段保留');

ok(typeof d?.stats?.totalLogs === 'number' && d.stats.totalLogs === 1, '统计随导出附带');
ok(d?.stats?.totalEntries === 2, '统计的动作条目数为 2', `实际 ${d?.stats?.totalEntries}`);

const disp = exp.headers.get('content-disposition') ?? '';
ok(disp.includes('attachment'), '响应带 attachment  disposition', disp);
ok(/fitposture-\d{4}-\d{2}-\d{2}\.json/.test(disp), '文件名格式正确', disp);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
