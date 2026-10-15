import { Router } from 'express';
import { parse } from '../lib/validate.ts';
import { badRequest, claimsOf, notFound, requireAuth } from '../middleware.ts';
import { workoutCreateSchema } from '../schemas.ts';
import { createWorkout, deleteWorkout, listWorkouts, workoutStats } from '../repo.ts';

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);

workoutsRouter.get('/', (req, res) => {
  const { userId } = claimsOf(req);
  const raw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 200) : 50;
  res.json({ items: listWorkouts(userId, limit) });
});

workoutsRouter.get('/stats', (req, res) => {
  const { userId } = claimsOf(req);
  res.json({ stats: workoutStats(userId) });
});

workoutsRouter.post('/', (req, res) => {
  const { userId } = claimsOf(req);
  const input = parse(workoutCreateSchema, req.body);
  res.status(201).json({ item: createWorkout(userId, input) });
});

workoutsRouter.delete('/:id', (req, res) => {
  const { userId } = claimsOf(req);
  const id = req.params.id;
  if (!id) throw badRequest('缺少记录 id');
  const ok = deleteWorkout(userId, id);
  if (!ok) throw notFound('训练记录不存在');
  res.json({ ok: true });
});
