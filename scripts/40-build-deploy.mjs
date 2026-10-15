// 生成部署目录 deploy/：轻量 Express 单端口服务（API + 已构建的前端产物）。
// 与主项目分开是因为：主项目带全套前端依赖（three/drei 等），云端重装既慢又容易失败；
// 部署目录只保留 5 个后端运行时依赖，且不需要在云端执行构建。
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = resolve(root, 'deploy');
const dist = resolve(root, 'dist');

// ---------- 防呆：dist 必须比源码新 ----------
// 踩过的坑：只跑本脚本而忘记 vite build，dist 里还是上一版产物，
// 于是"改了代码、发了包、线上没变"，而且旧产物带同样的 index.html 结构，肉眼完全看不出来。
// 这里比对 dist/index.html 与 src 下最新文件的修改时间，落后就自动补一次构建。
async function newestMtime(dir) {
  let max = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) max = Math.max(max, await newestMtime(p));
    else max = Math.max(max, (await stat(p)).mtimeMs);
  }
  return max;
}

const distIndex = resolve(dist, 'index.html');
const srcNewest = await newestMtime(resolve(root, 'src'));
const distTime = existsSync(distIndex) ? (await stat(distIndex)).mtimeMs : 0;
if (srcNewest > distTime) {
  console.log('dist 落后于 src，先执行前端构建…');
  const r = spawnSync('npx', ['vite', 'build'], { cwd: root, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('前端构建失败，已中止打包');
    process.exit(1);
  }
}

if (!existsSync(distIndex)) {
  console.error('缺少 dist/index.html，请先执行：npx vite build');
  process.exit(1);
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const pick = (name) => pkg.dependencies[name] ?? null;
const runtimeDeps = ['express', 'cors', 'bcryptjs', 'jsonwebtoken', 'zod'];
const missing = runtimeDeps.filter((d) => !pick(d));
if (missing.length) {
  console.error('主项目缺少后端运行时依赖:', missing.join(', '));
  process.exit(1);
}

// 用覆盖而非删除重建：本机的 safe-delete 会拦下整目录删除。
// 依赖 node_modules 因此得以保留，重复构建不必重装（上传时它本来也会被排除）。
await mkdir(out, { recursive: true });

// 但 www 必须先清空：产物文件名带内容 hash，覆盖复制只会往里叠，
// 旧版本会一直留着（实测叠到 8 份 index.js，白占 10MB 上传体积）。
const www = resolve(out, 'www');
if (existsSync(www)) {
  for (const name of await readdir(www)) {
    await rm(resolve(www, name), { recursive: true, force: true });
  }
}

// 先清掉上一次本地运行遗留的数据库文件。
// 这一步不能省：cp 只决定"复制哪些源文件"，不会删除目标目录里的多余文件，
// 于是本地开发时产生的 app.db 会静默留在包里被一起上传——
// 云端容器启动时发现库非空，就会直接拿这份本地测试数据对外服务，真实数据等于被顶掉。
const staleDataDir = resolve(out, 'server', 'data');
if (existsSync(staleDataDir)) {
  for (const name of await readdir(staleDataDir)) {
    if (name === 'admin-token' || name === 'seed.json') continue;
    await rm(resolve(staleDataDir, name), { recursive: true, force: true });
  }
}

// 后端源码：跳过本地数据库文件（app.db、jwt-secret），
// 但放行 data 下的 seed.json 与 admin-token —— 这两个是要随包发给云端的。
await cp(resolve(root, 'server'), resolve(out, 'server'), {
  recursive: true,
  force: true,
  filter: (src) => {
    const parts = src.split(/[/\\]/);
    if (!parts.includes('data')) return true;
    const base = parts[parts.length - 1];
    return base === 'seed.json' || base === 'admin-token';
  },
});

// ---------- 数据快照：让数据在容器重建后能自动回来 ----------
// 平台重建容器时会丢掉数据库（实测：两次部署，一次还在、一次全没）。
// 对策是每次部署前先向线上要一份全量快照，随包一起发布；
// 服务端启动发现空库就自动恢复，用户不会察觉数据曾经消失。
const cfgPath = resolve(root, '.deploy-config.json');
let cfg = null;
if (existsSync(cfgPath)) {
  try {
    cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
  } catch {
    console.warn('  .deploy-config.json 解析失败，跳过快照');
  }
}

const dataDir = resolve(out, 'server', 'data');
await mkdir(dataDir, { recursive: true });

if (cfg?.adminToken) {
  await writeFile(resolve(dataDir, 'admin-token'), `${cfg.adminToken}\n`);
}

if (cfg?.url && cfg?.adminToken) {
  try {
    const res = await fetch(`${cfg.url}/api/admin/dump`, {
      headers: { 'X-Admin-Token': cfg.adminToken },
      signal: AbortSignal.timeout(45000),
    });
    if (res.ok) {
      const snap = await res.json();
      await writeFile(resolve(dataDir, 'seed.json'), JSON.stringify(snap));
      console.log(
        `  数据快照: ${snap.users?.length ?? 0} 位用户 / ${snap.favorites?.length ?? 0} 收藏 / ${snap.workoutLogs?.length ?? 0} 条训练`,
      );
    } else {
      console.log(`  数据快照: 拉取失败（HTTP ${res.status}），本次发布不带快照`);
    }
  } catch (err) {
    console.log(`  数据快照: 拉取异常（${err?.message ?? err}），本次发布不带快照`);
  }
} else {
  console.log('  数据快照: 未配置 .deploy-config.json，跳过');
}

// 前端产物
await cp(dist, resolve(out, 'www'), { recursive: true, force: true });

const manifest = {
  name: 'fitposture-deploy',
  private: true,
  version: pkg.version,
  type: 'module',
  engines: { node: '>=22.5' },
  scripts: { start: 'node start.mjs' },
  dependencies: Object.fromEntries(runtimeDeps.map((d) => [d, pick(d)])),
};
await writeFile(resolve(out, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');

// 启动器：不同 Node 版本对 node:sqlite 和 TS 原生剥离的开关要求不同，
// 逐个试探 flag 是否被当前版本接受，只带可用的那几个。
const startScript = `// 启动器：探测当前 Node 版本接受哪些实验开关，再拉起真正的服务。
// node:sqlite 与 TypeScript 原生剥离在不同版本上开关要求不同（有的必需、有的已移除），
// 直接写死 flag 会在不需要它的版本上启动失败。
import { spawn, spawnSync } from 'node:child_process';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';

const wanted = ['--experimental-sqlite', '--experimental-strip-types'];
const flags = [];
for (const flag of wanted) {
  const r = spawnSync(process.execPath, [flag, '-e', '1'], { stdio: 'ignore' });
  if (r.status === 0) flags.push(flag);
}

console.log('[start] node', process.version, '| flags:', flags.join(' ') || '(none)');
const child = spawn(process.execPath, [...flags, 'server/index.ts'], { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
`;
await writeFile(resolve(out, 'start.mjs'), startScript);

// 兜底自检：数据库文件绝不能进发布包。上面已清理，这里确认一次，
// 免得日后改动让本地库又悄悄混进去。
const leaked = (await readdir(dataDir)).filter((n) => n.startsWith('app.db'));
if (leaked.length) {
  console.error('发布包里混入了本地数据库文件:', leaked.join(', '));
  process.exit(1);
}

console.log('已生成部署目录:', out);
console.log('  后端源码 server/');
console.log('  前端产物 www/');
console.log('  运行时依赖:', runtimeDeps.join(', '));
