import { useMemo } from 'react';
import ExerciseCard from './ExerciseCard';
import { getPart, partColor } from '@/kb/subparts';
import { PART_PROBLEM_HINT, PART_PROBLEM_KINDS, getPartPlan, resolvePartPlanWithRecovery } from '@/kb/partPlans';
import { KIND_CN } from '@/kb/exercises';
import { PROBLEM_CN, buildSolution } from '@/kb/engine';
import { MUSCLE_META } from '@/kb/mesh/registry';
import type { Exercise, ExerciseKind, ProblemType } from '@/kb/types';

const KIND_COLOR: Record<string, string> = {
  strengthen: 'text-rose-700',
  activate: 'text-amber-700',
  stretch: 'text-sky-700',
  relax: 'text-emerald-700',
};

export default function PartPlanView({
  partId,
  problemType,
}: {
  partId: string;
  problemType: ProblemType;
}) {
  const part = getPart(partId);
  const plan = getPartPlan(partId);

  const exercises = useMemo(
    () => (part ? resolvePartPlanWithRecovery(partId, part.groupId) : []),
    [partId, part],
  );

  const order = PART_PROBLEM_KINDS[problemType];

  // 没有专属方案的亚部：回退到整块肌群在同类问题下的方案
  const fallback = useMemo(() => {
    if (plan || !part) return null;
    return buildSolution(part.groupId, problemType);
  }, [plan, part, problemType]);

  const fallbackExercises = useMemo(() => {
    if (!fallback) return [];
    const shown = new Set(exercises.map((e) => e.id));
    return [...fallback.strengthen, ...fallback.activate, ...fallback.stretch, ...fallback.relax].filter(
      (e) => !shown.has(e.id),
    );
  }, [fallback, exercises]);

  if (!part) return null;

  // 有问题类型时：只展示该问题的动作类型，按主次排序
  const groups: { title: string; list: Exercise[]; kind: ExerciseKind }[] = order
    .map((k) => ({ title: KIND_CN[k], kind: k, list: exercises.filter((e) => e.kind === k) }))
    .filter((g) => g.list.length > 0);

  const otherGroups: { title: string; list: Exercise[]; kind: ExerciseKind }[] = (
    ['relax', 'stretch', 'activate', 'strengthen'] as ExerciseKind[]
  )
    .filter((k) => !order.includes(k))
    .map((k) => ({ title: KIND_CN[k], kind: k, list: exercises.filter((e) => e.kind === k) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
          style={{ background: partColor(part) }}
        />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{part.cn}</div>
          <div className="truncate text-[11px] text-slate-400">{part.en}</div>
        </div>
      </div>

      {part.note && (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{part.note}</p>
      )}

      <div className="mt-2 rounded-lg bg-teal-50 p-2.5 text-[11px] leading-relaxed text-teal-900">
        <span className="font-semibold">{PROBLEM_CN[problemType]}：</span>
        {PART_PROBLEM_HINT[problemType]}
      </div>

      {!plan && (
        <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-500">
          这块亚部暂时没有单独的动作库，下面是针对整块
          {MUSCLE_META[part.groupId]?.cn ?? '肌群'}的动作，同样能覆盖到它。
        </p>
      )}

      {plan?.cue && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">
          <div className="mb-0.5 font-semibold text-slate-800">发力口令</div>
          {plan.cue}
        </div>
      )}

      {plan?.mistakes?.length ? (
        <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800">
          <div className="mb-0.5 font-semibold">常见错误</div>
          {plan.mistakes.map((m) => (
            <div key={m}>· {m}</div>
          ))}
        </div>
      ) : null}

      {plan?.split && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
          <div className="mb-0.5 font-semibold text-slate-700">怎么安排</div>
          {plan.split}
        </div>
      )}

      {groups.length === 0 && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">
          {problemType === 'hypertrophy'
            ? '这块肌肉属于姿势稳定 / 控制型，单纯追求「练大」意义不大。建议改看「体态相关」或「慢性紧张」，把重点放在激活与放松上。'
            : '这一类问题暂时没有针对这块亚部的专属动作，可以先看下面的「其他相关动作」。'}
        </div>
      )}

      {groups.map((g, i) => (
        <div key={g.kind} className="mt-3">
          <div className={`mb-1.5 text-xs font-semibold ${KIND_COLOR[g.kind] ?? 'text-slate-700'}`}>
            {i === 0 ? '先做' : '再做'} · {g.title}（{g.list.length}）
          </div>
          <div className="space-y-2">
            {g.list.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} />
            ))}
          </div>
        </div>
      ))}

      {fallbackExercises.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-semibold text-rose-700">
            针对整块肌群的动作（{fallbackExercises.length}）
          </div>
          <div className="space-y-2">
            {fallbackExercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} />
            ))}
          </div>
        </div>
      )}

      {otherGroups.length > 0 && (
        <details className="mt-3 rounded-lg border border-slate-200 p-2">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">
            其他相关动作（{otherGroups.reduce((n, g) => n + g.list.length, 0)}）
          </summary>
          {otherGroups.map((g) => (
            <div key={g.kind} className="mt-2">
              <div className={`mb-1.5 text-xs font-semibold ${KIND_COLOR[g.kind] ?? 'text-slate-700'}`}>
                {g.title}（{g.list.length}）
              </div>
              <div className="space-y-2">
                {g.list.map((ex) => (
                  <ExerciseCard key={ex.id} ex={ex} />
                ))}
              </div>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
