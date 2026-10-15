// 一条命令同时起前端（vite）和后端（api），避免额外依赖 concurrently
import { spawn } from 'node:child_process';
import process from 'node:process';

const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const RESET = '\x1b[0m';
const GRAY = '\x1b[90m';

const procs = [
  { name: 'web', color: CYAN, cmd: 'npx', args: ['vite'] },
  { name: 'api', color: MAGENTA, cmd: process.execPath, args: ['--experimental-sqlite', 'server/index.ts'] },
];

const children = [];

function pipe(stream, name, color) {
  let buf = '';
  stream.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) console.log(`${color}[${name}]${RESET} ${line}`);
    }
  });
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {}
  }
  setTimeout(() => process.exit(code), 400);
}

for (const p of procs) {
  const child = spawn(p.cmd, p.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  children.push(child);
  pipe(child.stdout, p.name, p.color);
  pipe(child.stderr, p.name, GRAY);
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`${GRAY}[${p.name}] 进程退出，code=${code}${RESET}`);
    shutdown(code ?? 1);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`${GRAY}前端 http://localhost:5173  后端 http://localhost:3000/api${RESET}`);
