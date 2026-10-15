import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type AuthClaims } from './lib/jwt.ts';
import { readTokenCookie } from './lib/session.ts';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m = '请求参数有误') => new HttpError(400, m);
export const unauthorized = (m = '请先登录') => new HttpError(401, m);
export const forbidden = (m = '没有权限') => new HttpError(403, m);
export const notFound = (m = '资源不存在') => new HttpError(404, m);
export const conflict = (m = '资源已存在') => new HttpError(409, m);

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // express.json() 解析失败时给出的不是 HttpError，单独识别成 400
  const shaped = err as { type?: string; status?: number };
  if (shaped?.type === 'entity.parse.failed' || shaped?.type === 'entity.too.large') {
    res.status(400).json({ error: shaped.type === 'entity.too.large' ? '请求体过大' : '请求体不是合法 JSON' });
    return;
  }
  const message = err instanceof Error ? err.message : '服务器内部错误';
  console.error('[api] 未处理错误:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : message });
}

export interface AuthedRequest extends Request {
  claims: AuthClaims;
}

/** 取出 requireAuth 挂上的身份信息。路由带路径参数时 Request 泛型不同，
 *  直接 as AuthedRequest 会被判为类型不重叠，统一走这里转换。 */
export function claimsOf(req: Request): AuthClaims {
  return (req as unknown as AuthedRequest).claims;
}

/**
 * 取出请求里的 Bearer token。
 *
 * 优先读 Cookie：托管平台的网关会改写/丢弃鉴权请求头（实测 Authorization 被换成网关自己的
 * JWT，自定义头偶尔也会被剥），只有 Cookie 是浏览器自动携带、中间层不会动的通道。
 * 请求头仍作为回退，方便本地开发和脚本直连。
 */
export function readToken(req: Request): string {
  const fromCookie = readTokenCookie(req.header('cookie'));
  if (fromCookie) return fromCookie;

  const custom = req.header('x-auth-token')?.trim() ?? '';
  if (custom) return custom.replace(/^Bearer\s+/i, '');

  const raw = req.header('authorization') ?? '';
  if (!raw) return '';
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
}

/** 校验身份，成功后把 claims 挂到 req 上 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ error: '请先登录' });
    return;
  }
  const claims = verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: '登录已过期，请重新登录' });
    return;
  }
  (req as AuthedRequest).claims = claims;
  next();
}
