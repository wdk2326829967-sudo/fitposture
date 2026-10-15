import { Router } from 'express';
import { parse } from '../lib/validate.ts';
import { signToken } from '../lib/jwt.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { loginSchema, profileSchema, registerSchema } from '../schemas.ts';
import { verifyToken } from '../lib/jwt.ts';
import { claimsOf, readToken, requireAuth, unauthorized } from '../middleware.ts';
import { clearTokenCookie, setTokenCookie } from '../lib/session.ts';
import {
  createUser, findUserByEmail, findUserById, toPublicUser, updateUser,
} from '../repo.ts';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const input = parse(registerSchema, req.body);
  const passwordHash = await hashPassword(input.password);
  const user = createUser(input.email, passwordHash, input.nickname);
  const token = signToken(user.id, user.email);
  setTokenCookie(res, token);
  res.status(201).json({
    token,
    user: toPublicUser(user),
  });
});

authRouter.post('/login', async (req, res) => {
  const input = parse(loginSchema, req.body);
  const user = findUserByEmail(input.email);
  // 邮箱不存在时也做一次哈希比对，避免时序差异泄露账号是否存在
  const hashValue = user?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await verifyPassword(input.password, hashValue);
  if (!user || !ok) throw unauthorized('邮箱或密码不正确');
  const token = signToken(user.id, user.email);
  setTokenCookie(res, token);
  res.json({
    token,
    user: toPublicUser(user),
  });
});

// 清掉 Cookie，否则只清前端 localStorage 的话刷新后又"复活"
authRouter.post('/logout', (_req, res) => {
  clearTokenCookie(res);
  res.json({ ok: true });
});

/**
 * 探活当前会话。未登录时返回 { user: null } 而不是 401——
 * 前端每次启动都要问一次「我是不是登录着」，用 401 会在每个访客的控制台留下一条红字。
 */
authRouter.get('/session', (req, res) => {
  const token = readToken(req);
  const claims = token ? verifyToken(token) : null;
  const user = claims ? findUserById(claims.userId) : null;
  res.json({ user: user ? toPublicUser(user) : null });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const { userId } = claimsOf(req);
  const user = findUserById(userId);
  if (!user) throw unauthorized('账号不存在，请重新登录');
  res.json({ user: toPublicUser(user) });
});

authRouter.patch('/profile', requireAuth, (req, res) => {
  const { userId } = claimsOf(req);
  const patch = parse(profileSchema, req.body ?? {});
  const user = updateUser(userId, patch);
  res.json({ user: toPublicUser(user) });
});
