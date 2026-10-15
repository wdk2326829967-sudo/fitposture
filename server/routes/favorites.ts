import { Router } from 'express';
import { parse } from '../lib/validate.ts';
import { badRequest, claimsOf, notFound, requireAuth } from '../middleware.ts';
import { favoriteCreateSchema, TARGET_TYPES } from '../schemas.ts';
import { addFavorite, listFavorites, removeFavorite } from '../repo.ts';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', (req, res) => {
  const { userId } = claimsOf(req);
  res.json({ items: listFavorites(userId) });
});

favoritesRouter.post('/', (req, res) => {
  const { userId } = claimsOf(req);
  const input = parse(favoriteCreateSchema, req.body);
  const row = addFavorite(userId, input);
  res.status(201).json({ item: row });
});

/** 用 query 传参，避免 targetId 里的冒号在路径中引起歧义 */
favoritesRouter.delete('/', (req, res) => {
  const { userId } = claimsOf(req);
  const { targetType, targetId } = req.query;
  if (typeof targetType !== 'string' || typeof targetId !== 'string') {
    throw badRequest('缺少 targetType 或 targetId');
  }
  if (!(TARGET_TYPES as readonly string[]).includes(targetType)) {
    throw badRequest('targetType 不合法');
  }
  const ok = removeFavorite(userId, targetType, targetId);
  if (!ok) throw notFound('这条收藏不存在');
  res.json({ ok: true });
});
