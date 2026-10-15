import type { Exercise, ProblemType, Solution, UserContext } from './types';
import { getMuscle } from './muscles';
import { getExercise } from './exercises';

export const PROBLEM_CN: Record<ProblemType, string> = {
  soreness: '酸痛 / 练后恢复',
  strain: '急性拉伤',
  chronic_tension: '慢性紧张 / 僵硬',
  hypertrophy: '想练大',
  posture: '体态相关',
  limited_mobility: '活动度受限',
};

export const PROBLEM_ORDER: ProblemType[] = [
  'hypertrophy', 'soreness', 'chronic_tension', 'limited_mobility', 'posture', 'strain',
];

export interface BuiltSolution {
  solution: Solution;
  relax: Exercise[];
  stretch: Exercise[];
  activate: Exercise[];
  strengthen: Exercise[];
}

function pick(ids: string[] | undefined, ctx?: UserContext): Exercise[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => getExercise(id))
    .filter((e): e is Exercise => !!e)
    .filter((e) => {
      // 按可用器械过滤：用户没选器械时不过滤
      if (!ctx?.equipment?.length) return true;
      return e.equipment.some((eq) => eq === 'none' || ctx.equipment!.includes(eq));
    })
    .filter((e) => {
      // 新手过滤掉高阶动作
      if (ctx?.experience === 'beginner' && e.difficulty === 'advanced') return false;
      return true;
    });
}

/** 肌肉 + 问题类型 + 用户上下文 → 结构化方案 */
export function buildSolution(muscleId: string, problemType: ProblemType, ctx?: UserContext): BuiltSolution | null {
  const muscle = getMuscle(muscleId);
  if (!muscle) return null;

  const override = muscle.problems[problemType];
  if (!override) return null;

  // M5 会把 6 类问题的通用模板也合并进来，目前每块肌肉自带专属方案
  const solution: Solution = {
    ...override,
    redFlags: override.redFlags?.length ? override.redFlags : [],
    disclaimer: override.disclaimer,
  };

  return {
    solution,
    relax: pick(solution.relax, ctx),
    stretch: pick(solution.stretch, ctx),
    activate: pick(solution.activate, ctx),
    strengthen: pick(solution.strengthen, ctx),
  };
}

/** 某块肌肉当前已录入了哪些问题类型 */
export function availableProblems(muscleId: string): ProblemType[] {
  const m = getMuscle(muscleId);
  if (!m) return [];
  return PROBLEM_ORDER.filter((p) => !!m.problems[p]);
}
