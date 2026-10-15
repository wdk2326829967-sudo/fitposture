import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.ts';
import { restoreFromSnapshot } from './lib/snapshot.ts';
import { errorHandler } from './middleware.ts';
import { adminRouter } from './routes/admin.ts';
import { authRouter } from './routes/auth.ts';
import { favoritesRouter } from './routes/favorites.ts';
import { meRouter } from './routes/me.ts';
import { workoutsRouter } from './routes/workouts.ts';

const app = express();
const here = dirname(fileURLToPath(import.meta.url));

/**
 * 容器重建会清空数据库，所以每次部署都把上一次的全量快照（seed.json）一起发布。
 * 这里在启动时检查：如果库是空的，就用快照恢复——用户只会觉得数据一直都在。
 * 库里已有数据则跳过，绝不能用旧快照覆盖新数据。
 */
const seedFile = resolve(here, 'data/seed.json');
if (existsSync(seedFile)) {
  try {
    const restored = restoreFromSnapshot(seedFile);
    if (restored > 0) console.log(`[snapshot] 空库已从快照恢复 ${restored} 位用户的数据`);
  } catch (err) {
    console.warn('[snapshot] 恢复失败，将按空库启动:', err);
  }
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/me', meRouter);
app.use('/api/workouts', workoutsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

/**
 * 生产模式下由同一个进程托管前端产物，对外只暴露一个端口——
 * 这样部署时不需要额外跑 vite，也没有跨域问题。
 * 产物目录可用 STATIC_DIR 覆盖，缺省为项目根的 www/（构建脚本从 dist 复制而来）。
 */
const staticDir = process.env.STATIC_DIR ?? resolve(here, '../www');
const indexHtml = resolve(staticDir, 'index.html');
const hasStatic = existsSync(indexHtml);

if (hasStatic) {
  // 带 hash 的产物可以长缓存；入口文件不缓存，避免发版后用户还拿到旧 HTML
  app.use(
    express.static(staticDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // 前端是单页应用，刷新 /me 这类路由时要回落到入口 HTML。
  // 这里不用 '/{*splat}' 是因为它依赖 path-to-regexp 版本，无路径的 use 更稳。
  app.use((req, res) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.sendFile(indexHtml);
      return;
    }
    res.status(404).json({ error: '接口不存在' });
  });
  console.log(`[static] 托管前端产物 ${staticDir}`);
}

app.use(errorHandler);

// 绑定 0.0.0.0 是部署的硬性要求，只写端口在部分容器里只监听回环地址
app.listen(env.port, '0.0.0.0', () => {
  console.log(`[api] 已启动 http://0.0.0.0:${env.port}${hasStatic ? '（含前端产物）' : ''}`);
});
