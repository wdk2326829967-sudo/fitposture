import { useState } from 'react';
import type { Exercise } from '@/kb/types';
import { DIFFICULTY_CN, EQUIPMENT_CN, KIND_CN } from '@/kb/exercises';

const KIND_COLOR: Record<string, string> = {
  strengthen: 'bg-rose-50 text-rose-700 border-rose-200',
  activate: 'bg-amber-50 text-amber-700 border-amber-200',
  stretch: 'bg-sky-50 text-sky-700 border-sky-200',
  relax: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ExerciseCard({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{ex.name}</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] ${KIND_COLOR[ex.kind] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              {KIND_CN[ex.kind]}
            </span>
          </div>
          {ex.nameEn && <div className="mt-0.5 text-[11px] text-slate-400">{ex.nameEn}</div>}
        </div>
        <div className="shrink-0 text-right text-[11px] leading-tight text-slate-500">
          {ex.sets && ex.reps && (
            <div className="font-medium text-slate-700">
              {ex.sets} 组 × {ex.reps}
            </div>
          )}
          {ex.rest && <div>间歇 {ex.rest}</div>}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {ex.equipment.map((e) => (
          <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
            {EQUIPMENT_CN[e] ?? e}
          </span>
        ))}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
          {DIFFICULTY_CN[ex.difficulty]}
        </span>
        {ex.frequency && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{ex.frequency}</span>
        )}
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-2 text-[11px] font-medium text-teal-600 hover:text-teal-700"
      >
        {open ? '收起要点 ▲' : '查看动作要点 ▼'}
      </button>

      {open && (
        <div className="mt-1.5 space-y-1.5 rounded-lg bg-slate-50 p-2 text-xs leading-relaxed text-slate-600">
          <div>{ex.keyPoints}</div>
          {ex.cautions?.length ? (
            <div className="text-amber-700">注意：{ex.cautions.join('；')}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
