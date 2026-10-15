// 后端 API 端到端测试：注册 → 登录 → 档案 → 收藏 → 训练记录 → 统计
const BASE = process.env.BASE ?? 'http://localhost:3000/api';
const email = `t${Date.now()}@example.com`;
const pass = 'Passw0rd!2026';

let passCount = 0;
let failCount = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passCount++; console.log(`  PASS  ${name}${extra ? ' — ' + extra : ''}`); }
  else { failCount++; console.log(`  FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const rnd = Math.floor(Math.random() * 1e6);

console.log('\n[1] 健康检查');
{
  const r = await call('GET', '/health');
  ok('GET /health 返回 200', r.status === 200 && r.json?.ok === true);
}

console.log('\n[2] 注册与登录');
const reg = await call('POST', '/auth/register', {
  body: { email, password: pass, nickname: `测试用户${rnd}` },
});
ok('注册成功 201', reg.status === 201, `status=${reg.status}`);
ok('返回 token', typeof reg.json?.token === 'string');
ok('返回用户信息', reg.json?.user?.email === email);
ok('不泄露密码哈希', reg.json?.user && !('password_hash' in reg.json.user));

const token = reg.json?.token;

const dup = await call('POST', '/auth/register', {
  body: { email, password: pass, nickname: '重复' },
});
ok('重复邮箱注册被拒 409', dup.status === 409, `status=${dup.status}`);

const weak = await call('POST', '/auth/register', {
  body: { email: `weak${rnd}@example.com`, password: '123', nickname: 'x' },
});
ok('弱密码被拒 400', weak.status === 400, `status=${weak.status}`);

const badMail = await call('POST', '/auth/register', {
  body: { email: 'not-an-email', password: pass, nickname: 'x' },
});
ok('非法邮箱被拒 400', badMail.status === 400, `status=${badMail.status}`);

const login = await call('POST', '/auth/login', { body: { email, password: pass } });
ok('登录成功 200', login.status === 200, `status=${login.status}`);
ok('登录返回 token', typeof login.json?.token === 'string');

const badLogin = await call('POST', '/auth/login', { body: { email, password: 'wrongpass123' } });
ok('错误密码被拒 401', badLogin.status === 401, `status=${badLogin.status}`);

const noSuch = await call('POST', '/auth/login', {
  body: { email: `nobody${rnd}@example.com`, password: pass },
});
ok('不存在的邮箱被拒 401', noSuch.status === 401, `status=${noSuch.status}`);

console.log('\n[3] 鉴权');
const noToken = await call('GET', '/favorites');
ok('无 token 访问收藏 401', noToken.status === 401, `status=${noToken.status}`);
const badToken = await call('GET', '/favorites', { token: 'garbage.token.here' });
ok('无效 token 401', badToken.status === 401, `status=${badToken.status}`);

const me = await call('GET', '/auth/me', { token });
ok('GET /auth/me 200', me.status === 200 && me.json?.user?.email === email);

console.log('\n[4] 档案更新');
const prof = await call('PATCH', '/auth/profile', {
  token, body: { experience: 'intermediate', equipment: ['dumbbell', 'band'] },
});
ok('更新经验与器械', prof.status === 200 && prof.json?.user?.experience === 'intermediate');
ok('器械数组正确', JSON.stringify(prof.json?.user?.equipment) === '["dumbbell","band"]',
  JSON.stringify(prof.json?.user?.equipment));

const badExp = await call('PATCH', '/auth/profile', { token, body: { experience: 'wizard' } });
ok('非法经验值被拒 400', badExp.status === 400, `status=${badExp.status}`);

console.log('\n[5] 收藏');
const f1 = await call('POST', '/favorites', {
  token, body: { targetType: 'muscle', targetId: 'shoulder_deltoid', title: '三角肌', subtitle: '肩部' },
});
ok('收藏肌肉 201', f1.status === 201, `status=${f1.status}`);
const f2 = await call('POST', '/favorites', {
  token, body: { targetType: 'part', targetId: 'shoulder_deltoid:posterior', title: '三角肌后束' },
});
ok('收藏亚部（ID 含冒号）201', f2.status === 201, `status=${f2.status}`);
const f3 = await call('POST', '/favorites', {
  token, body: { targetType: 'muscle', targetId: 'shoulder_deltoid', title: '重复' },
});
ok('重复收藏幂等', f3.status === 201 && f3.json?.item?.id === f1.json?.item?.id);

const list = await call('GET', '/favorites', { token });
ok('收藏列表 2 条', list.json?.items?.length === 2, `len=${list.json?.items?.length}`);

const badType = await call('POST', '/favorites', {
  token, body: { targetType: 'planet', targetId: 'mars' },
});
ok('非法 targetType 被拒 400', badType.status === 400, `status=${badType.status}`);

const del = await call('DELETE', '/favorites?targetType=part&targetId=shoulder_deltoid%3Aposterior', { token });
ok('删除亚部收藏 200', del.status === 200, `status=${del.status}`);
const delAgain = await call('DELETE', '/favorites?targetType=part&targetId=shoulder_deltoid%3Aposterior', { token });
ok('重复删除 404', delAgain.status === 404, `status=${delAgain.status}`);
const list2 = await call('GET', '/favorites', { token });
ok('删除后剩 1 条', list2.json?.items?.length === 1, `len=${list2.json?.items?.length}`);

console.log('\n[6] 训练记录');
const w1 = await call('POST', '/workouts', {
  token,
  body: {
    muscleId: 'chest_pec_major',
    problemType: 'hypertrophy',
    note: '第一次测试',
    entries: [
      { exerciseId: 'ex_bench_press', exerciseName: '杠铃卧推', kind: 'strengthen', sets: '4', reps: '8-10', feel: 4 },
      { exerciseId: 'ex_cable_fly', exerciseName: '龙门架夹胸', kind: 'strengthen', sets: '3', reps: '12' },
    ],
  },
});
ok('创建训练记录 201', w1.status === 201, `status=${w1.status}`);
ok('条目数 2', w1.json?.item?.entries?.length === 2, `len=${w1.json?.item?.entries?.length}`);
ok('条目按序排列', w1.json?.item?.entries?.[0]?.exercise_id === 'ex_bench_press');

const badDate = await call('POST', '/workouts', {
  token, body: { doneAt: 'not-a-date', entries: [] },
});
ok('非法日期被拒 400', badDate.status === 400, `status=${badDate.status}`);

const wlist = await call('GET', '/workouts', { token });
ok('记录列表 1 条', wlist.json?.items?.length === 1, `len=${wlist.json?.items?.length}`);
ok('列表含条目', wlist.json?.items?.[0]?.entries?.length === 2);

const stats = await call('GET', '/workouts/stats', { token });
ok('统计 totalLogs=1', stats.json?.stats?.totalLogs === 1, JSON.stringify(stats.json?.stats));
ok('统计 totalEntries=2', stats.json?.stats?.totalEntries === 2);
ok('统计 streak>=1', (stats.json?.stats?.streak ?? 0) >= 1, `streak=${stats.json?.stats?.streak}`);

const id = w1.json?.item?.id;
const wdel = await call('DELETE', `/workouts/${id}`, { token });
ok('删除记录 200', wdel.status === 200, `status=${wdel.status}`);
const wdel2 = await call('DELETE', `/workouts/${id}`, { token });
ok('重复删除 404', wdel2.status === 404, `status=${wdel2.status}`);

console.log('\n[7] 隔离性（换一个用户看不到别人的数据）');
const other = await call('POST', '/auth/register', {
  body: { email: `other${rnd}@example.com`, password: pass, nickname: '另一个人' },
});
const otherFav = await call('GET', '/favorites', { token: other.json?.token });
ok('新用户收藏为空', otherFav.json?.items?.length === 0, `len=${otherFav.json?.items?.length}`);
const crossDel = await call('DELETE', '/favorites?targetType=muscle&targetId=shoulder_deltoid', {
  token: other.json?.token,
});
ok('删他人收藏 404', crossDel.status === 404, `status=${crossDel.status}`);

console.log('\n[8] 未知接口');
const unknown = await call('GET', '/nope');
ok('未知接口 404', unknown.status === 404, `status=${unknown.status}`);

console.log(`\n===== 通过 ${passCount} / 失败 ${failCount} =====`);
process.exit(failCount === 0 ? 0 : 1);
