import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

/**
 * 生产环境的 JWT 密钥。
 * 以前要求必须注入 JWT_SECRET，否则直接抛错——但部署沙箱未必提供配置环境变量的入口，
 * 一旦缺失整个服务起不来。改为首次启动自动生成并落盘复用：
 * 重启后 token 依然有效（用户不会被强制登出），同时无需任何外部配置。
 */
function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!isProd) return 'dev-only-secret-change-me';

  const file = resolve(here, 'data/jwt-secret');
  try {
    if (existsSync(file)) {
      const saved = readFileSync(file, 'utf8').trim();
      if (saved) return saved;
    }
  } catch {
    // 读不到就当作没有，往下生成
  }

  const secret = randomBytes(48).toString('hex');
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, secret, { mode: 0o600 });
    console.log('[env] 已自动生成 JWT 密钥并保存到 data/jwt-secret');
  } catch (err) {
    console.warn('[env] JWT 密钥无法落盘，重启后登录态会失效:', err);
  }
  return secret;
}

const PORT = Number(process.env.PORT ?? 3000);

export const env = {
  port: Number.isFinite(PORT) && PORT > 0 ? PORT : 3000,
  /** 开发环境下给一个固定值，避免每次重启 token 全部失效 */
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  isProd,
};
