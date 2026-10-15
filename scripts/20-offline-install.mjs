// 离线安装器：直接从镜像源下载 tarball 落地到 node_modules，绕开 npm 的依赖图解析。
// 用法：node scripts/20-offline-install.mjs @types/express @types/cors ...
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const exec = promisify(execFile);
const REGISTRY = process.env.NPM_REGISTRY || 'https://registry.npmmirror.com';
const ROOT = process.cwd();
const TMP = path.join(os.tmpdir(), 'offline-install');
const done = new Set();

function enc(name) {
  return name.startsWith('@') ? name.replace('/', '%2F') : name;
}

async function fetchJson(url) {
  const { stdout } = await exec('curl', ['-sL', '--max-time', '40', url], {
    maxBuffer: 64 * 1024 * 1024,
    encoding: 'utf8',
  });
  return JSON.parse(stdout);
}

function resolveVersion(meta, range) {
  if (!range || range === '*' || range === 'latest') return meta['dist-tags'].latest;
  if (range.startsWith('^')) {
    const major = range.slice(1).split('.')[0];
    const candidates = Object.keys(meta.versions)
      .filter((v) => !v.includes('-') && v.split('.')[0] === major)
      .sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
        return 0;
      });
    if (candidates.length) return candidates[candidates.length - 1];
  }
  return meta['dist-tags'].latest;
}

async function install(name, range) {
  if (done.has(name)) return;
  done.add(name);

  const meta = await fetchJson(`${REGISTRY}/${enc(name)}`);
  const version = resolveVersion(meta, range);
  const pkg = meta.versions[version];
  const dest = path.join(ROOT, 'node_modules', name);

  await mkdir(TMP, { recursive: true });
  // 注意：Windows 的 tar 会把以 @ 开头的文件名当成远程归档，临时文件名必须做无害化处理
  const safe = `${name.replace(/[^a-zA-Z0-9]/g, '_')}-${version}`;
  const tgz = path.join(TMP, `pkg_${safe}.tgz`);
  await exec('curl', ['-sL', '--fail', '--max-time', '60', pkg.dist.tarball, '-o', tgz]);

  const extractDir = path.join(TMP, `dir_${safe}`);
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });
  // Windows 的 bsdtar 会把含冒号的绝对路径当成 "主机:路径" 远程归档，
  // 因此统一用相对路径 + cwd 来解包。
  await exec('tar', ['-xzf', path.relative(TMP, tgz), '-C', path.relative(TMP, extractDir)], { cwd: TMP });

  // @types 包的 tarball 内层目录名不统一（有 "package/" 也有 "<短名>/"），取唯一的子目录
  const entries = await (await import('node:fs/promises')).readdir(extractDir);
  const src = path.join(extractDir, entries.length === 1 ? entries[0] : 'package');
  if (!existsSync(path.join(src, 'package.json'))) {
    throw new Error(`无法定位 ${name} 的包根目录`);
  }

  await rm(dest, { recursive: true, force: true });
  await mkdir(path.dirname(dest), { recursive: true });
  await exec('cp', ['-r', src, dest]);
  console.log(`+ ${name}@${version}`);

  for (const [dep, depRange] of Object.entries(pkg.dependencies || {})) {
    await install(dep, depRange);
  }
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('用法: node scripts/20-offline-install.mjs <pkg>[@range] ...');
  process.exit(1);
}
for (const t of targets) {
  const [name, range] = t.includes('@', 1) ? [t.slice(0, t.lastIndexOf('@')), t.slice(t.lastIndexOf('@') + 1)] : [t, '*'];
  await install(name, range);
}
console.log('完成');
