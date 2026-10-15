import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { favoritesApi, workoutsApi, type Favorite, type WorkoutLog, type WorkoutStats } from './api';

export const favoritesKey = ['favorites'] as const;
export const workoutsKey = ['workouts'] as const;
export const statsKey = ['workouts', 'stats'] as const;

/** 收藏：登录后才查询 */
export function useFavorites(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: favoritesKey,
    queryFn: () => favoritesApi.list(),
    enabled,
    staleTime: 30_000,
  });

  const add: UseMutationResult<Favorite, Error, { targetType: Favorite['target_type']; targetId: string; title?: string; subtitle?: string }> =
    useMutation({
      mutationFn: (input) => favoritesApi.add(input).then((r) => r.item),
      onSuccess: () => qc.invalidateQueries({ queryKey: favoritesKey }),
    });

  const remove: UseMutationResult<unknown, Error, { targetType: string; targetId: string }> = useMutation({
    mutationFn: (v) => favoritesApi.remove(v.targetType, v.targetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: favoritesKey }),
  });

  const items = query.data?.items ?? [];
  const isFav = (targetType: string, targetId: string) =>
    items.some((f) => f.target_type === targetType && f.target_id === targetId);

  return { items, isFav, isLoading: query.isLoading, add, remove };
}

export function useWorkouts(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: workoutsKey,
    queryFn: () => workoutsApi.list(),
    enabled,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (input: Parameters<typeof workoutsApi.create>[0]) =>
      workoutsApi.create(input).then((r) => r.item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutsKey });
      qc.invalidateQueries({ queryKey: statsKey });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => workoutsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutsKey });
      qc.invalidateQueries({ queryKey: statsKey });
    },
  });

  return {
    items: (query.data?.items ?? []) as WorkoutLog[],
    isLoading: query.isLoading,
    create,
    remove,
  };
}

export function useWorkoutStats(enabled: boolean) {
  const query = useQuery({
    queryKey: statsKey,
    queryFn: () => workoutsApi.stats(),
    enabled,
    staleTime: 30_000,
  });
  return { stats: query.data?.stats as WorkoutStats | undefined, isLoading: query.isLoading };
}
