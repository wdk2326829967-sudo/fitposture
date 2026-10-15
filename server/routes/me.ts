import { Router } from 'express';
import { claimsOf, requireAuth } from '../middleware.ts';
import { exportUserData } from '../repo.ts';

export const meRouter = Router();

meRouter.use(requireAuth);

/**
 * GET /api/me/export —— 导出当前用户全部数据。
 *
 * 带上 Content-Disposition，直接在浏览器打开这个地址也会触发下载；
 * 前端则用 fetch 取回文本后自行生成文件，两者都走同一份逻辑。
 */
meRouter.get('/export', (req, res) => {
  const { userId } = claimsOf(req);
  const data = exportUserData(userId);
  const day = new Date(data.exportedAt).toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="fitposture-${day}.json"`);
  res.send(JSON.stringify(data, null, 2));
});
