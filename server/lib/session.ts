import type { Response } from 'express';

/**
 * 登录态用 Cookie 承载，而不是依赖前端往请求头里塞 token。
 *
 * 原因：部署平台的网关会改写或丢弃自定义/标准鉴权请求头（实测 Authorization 被整个替换成
 * 网关自己的 JWT），导致「登录成功、刷新后却被登出」。Cookie 是浏览器自动携带的标准机制，
 * 中间层不会去改写它。HttpOnly 还顺带挡掉了 XSS 窃取 token。
 *
 * 请求头里的 token 仍然兼容（见 middleware.readToken），本地开发和脚本调用不受影响。
 */
export const TOKEN_COOKIE = 'fp_token';
const MAX_AGE = 30 * 24 * 60 * 60;

function base(parts: string[]): string {
  // 线上是 https 才加 Secure，本地 http 加了浏览器反而不发送
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function setTokenCookie(res: Response, token: string) {
  res.appendHeader('Set-Cookie', base([`${TOKEN_COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${MAX_AGE}`]));
}

export function clearTokenCookie(res: Response) {
  res.appendHeader('Set-Cookie', base([`${TOKEN_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']));
}

/** 手动解析 Cookie 头，避免为了一个字段引入 cookie-parser 依赖 */
export function readTokenCookie(header: string | undefined): string {
  if (!header) return '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== TOKEN_COOKIE) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return part.slice(eq + 1).trim();
    }
  }
  return '';
}
