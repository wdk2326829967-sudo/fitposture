import { Router } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumpDatabase } from '../lib/snapshot.ts';
import { notFound, unauthorized } from '../middleware.ts';

const here = dirname(fileURLToPath(import.meta.url));
const tokenFile = resolve(here, '../data/admin-token');

/**
 * 管理密钥。优先读随包发布的 data/admin-token，其次环境变量。
 * 拿不到就返回 null——此时 dump 接口视为不存在，避免裸奔暴露全库。
 */
function expectedToken(): string | null {
  try {
    if (existsSync(tokenFile)) {
      const v = readFileSync(tokenFile, 'utf8').trim();
      if (v) return v;
    }
  } catch {
    // 读不到就退到环境变量
  }
  return process.env.ADMIN_TOKEN?.trim() || null;
}

export const adminRouter = Router();

/**
 * GET /api/admin/dump —— 全库快照，供下次部署时随包带回，防止容器重建丢数据。
 *
 * 这是全站权限最大的接口（返回含 password_hash 的完整用户表），因此：
 * 没配置密钥时直接当它不存在（404），而不是 401——不向外界透露这里有东西。
 */
adminRouter.get('/dump', (req, res) => {
  const expected = expectedToken();
  if (!expected) throw notFound('接口不存在');

  const provided = (req.header('x-admin-token') ?? '').trim();
  if (!provided || provided !== expected) throw unauthorized('token 不正确');

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(dumpDatabase()));
});
