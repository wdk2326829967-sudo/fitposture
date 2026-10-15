// 线上 401 诊断：注册拿 token，再让服务端自己校验并回报真实异常
const BASE = process.env.BASE ?? 'https://308d9bd5bfc44df28d80127d98af73e1.app.workbuddy.host/api';

const email = `diag${Date.now()}@example.com`;
const pass = 'Passw0rd!2026';

const reg = await fetch(`${BASE}/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password: pass, nickname: '诊断' }),
});
const regJson = await reg.json();
const token = regJson.token;
console.log('注册:', reg.status, 'token?', Boolean(token));

const part = token.split('.');
const payload = JSON.parse(Buffer.from(part[1], 'base64url').toString('utf8'));
console.log('payload:', JSON.stringify(payload));

const health = await (await fetch(`${BASE}/health`)).json();
console.log('health:', JSON.stringify(health));
console.log('剩余有效期(s):', payload.exp - Math.floor(health.ts / 1000));

const diag1 = await fetch(`${BASE}/_diag/verify`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token }),
});
console.log('diag(第1次):', JSON.stringify(await diag1.json()));

const diag2 = await fetch(`${BASE}/_diag/verify`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token }),
});
console.log('diag(第2次):', JSON.stringify(await diag2.json()));

const me = await fetch(`${BASE}/auth/me`, { headers: { authorization: `Bearer ${token}` } });
console.log('me:', me.status, JSON.stringify(await me.json()).slice(0, 200));
