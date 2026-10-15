import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth.tsx';
import { useWorkouts } from '@/lib/hooks.ts';
import type { Exercise } from '@/kb/types';

interface Props {
  muscleId: string;
  partId?: string | null;
  problemType?: string | null;
  /** 候选动作：当前方案里出现的动作 */
  exercises: Exercise[];
}

export default function LogWorkoutPanel({ muscleId, partId, problemType, exercises }: Props) {
  const { user, ready } = useAuth();
  const logged = !!user;
  const { create } = useWorkouts(logged);

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [weight, setWeight] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const list = useMemo(() => exercises.slice(0, 20), [exercises]);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
        登录后可以把这次训练记下来，之后在「我的」里查看与统计。
      </div>
    );
  }

  if (list.length === 0) return null;

  const selected = list.filter((e) => picked[e.id]);

  const submit = async () => {
    if (selected.length === 0) return;
    await create.mutateAsync({
      muscleId,
      partId: partId ?? null,
      problemType: problemType ?? null,
      note,
      doneAt: new Date().toISOString(),
      entries: selected.map((e) => ({
        exerciseId: e.id,
        exerciseName: e.name,
        kind: e.kind,
        sets: e.sets ?? '',
        reps: e.reps ?? '',
        weight: weight[e.id] ?? '',
        feel: null,
      })),
    });
    setPicked({});
    setWeight({});
    setNote('');
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold text-slate-700">记一次训练</span>
        <span className="text-xs text-slate-400">{open ? '收起' : `选动作（${list.length}）`}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-3">
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {list.map((e) => {
              const on = !!picked[e.id];
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(ev) => setPicked((p) => ({ ...p, [e.id]: ev.target.checked }))}
                    className="h-3.5 w-3.5 accent-teal-600"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{e.name}</span>
                  {on && (
                    <input
                      value={weight[e.id] ?? ''}
                      onChange={(ev) => setWeight((w) => ({ ...w, [e.id]: ev.target.value }))}
                      placeholder="重量/组次"
                      className="w-24 rounded border border-slate-200 px-1.5 py-0.5 text-[11px] outline-none focus:border-teal-400"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            maxLength={200}
            className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-teal-400"
          />

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={submit}
              disabled={selected.length === 0 || create.isPending}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-40"
            >
              {create.isPending ? '保存中…' : `保存（${selected.length} 个动作）`}
            </button>
            {done && <span className="text-xs text-emerald-600">已记录 ✓</span>}
            {create.isError && (
              <span className="text-xs text-rose-600">
                {create.error instanceof Error ? create.error.message : '保存失败'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
