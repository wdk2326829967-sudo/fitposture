import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PartPlanView from '@/components/PartPlanView';
import { useSelection } from '@/store/useSelection';
import { SELECTABLE_GROUPS } from '@/kb/mesh/groups';
import { MUSCLE_META, REGION_CN } from '@/kb/mesh/registry';
import { listParts, partColor } from '@/kb/subparts';
import { PROBLEM_CN, PROBLEM_ORDER } from '@/kb/engine';
import type { MuscleRegion, ProblemType } from '@/kb/types';

const REGION_ORDER: MuscleRegion[] = [
  'chest', 'back', 'shoulder', 'arm', 'core', 'hip', 'thigh', 'calf', 'neck', 'foot',
];

export default function MusclePanel() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [partProblem, setPartProblem] = useState<ProblemType>('hypertrophy');
  const selected = useSelection((s) => s.selected);
  const select = useSelection((s) => s.select);
  const view = useSelection((s) => s.view);
  const toggleView = useSelection((s) => s.toggleView);
  const showTendon = useSelection((s) => s.showTendon);
  const setShowTendon = useSelection((s) => s.setShowTendon);
  const showOther = useSelection((s) => s.showOther);
  const setShowOther = useSelection((s) => s.setShowOther);
  const showSkeleton = useSelection((s) => s.showSkeleton);
  const setShowSkeleton = useSelection((s) => s.setShowSkeleton);
  const modelMode = useSelection((s) => s.modelMode);
  const setModelMode = useSelection((s) => s.setModelMode);
  const muscleOpacity = useSelection((s) => s.muscleOpacity);
  const setMuscleOpacity = useSelection((s) => s.setMuscleOpacity);
  const expanded = useSelection((s) => s.expanded);
  const setExpanded = useSelection((s) => s.setExpanded);
  const selectedPart = useSelection((s) => s.selectedPart);
  const selectPart = useSelection((s) => s.selectPart);

  const groups = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return SELECTABLE_GROUPS.filter((g) => {
      if (!keyword) return true;
      const meta = MUSCLE_META[g.id];
      return (
        g.cn.toLowerCase().includes(keyword) ||
        g.id.includes(keyword) ||
        (meta?.en ?? '').toLowerCase().includes(keyword) ||
        (meta?.latin ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [q]);

  const byRegion = useMemo(() => {
    const map = new Map<MuscleRegion, typeof groups>();
    for (const r of REGION_ORDER) map.set(r, []);
    for (const g of groups) {
      const arr = map.get(g.region) ?? [];
      arr.push(g);
      map.set(g.region, arr);
    }
    return [...map.entries()].filter(([, v]) => v.length > 0);
  }, [groups]);

  const meta = selected ? MUSCLE_META[selected] : null;
  const parts = useMemo(() => (selected ? listParts(selected) : []), [selected]);
  const canSplit = parts.length > 1;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-white p-4">
      {/* 视图控制 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleView}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {view === 'front' ? '转到背面' : '转到正面'}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} />
          显示骨骼
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" checked={showTendon} onChange={(e) => setShowTendon(e.target.checked)} />
          显示肌腱
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" checked={showOther} onChange={(e) => setShowOther(e.target.checked)} />
          显示深层小肌
        </label>
      </div>

      {/* 模型显示模式切换 */}
      <div className="flex rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setModelMode('realistic')}
          className={[
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
            modelMode === 'realistic' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          仿真
        </button>
        <button
          onClick={() => setModelMode('color')}
          className={[
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition',
            modelMode === 'color' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          分色肌群
        </button>
      </div>

      {/* 肌群透明度：调低可看到被外层遮挡的内层（腹直肌在腹斜肌下面） */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <label htmlFor="opacity-slider">肌群透明度</label>
          <span className="font-mono text-slate-500">{Math.round(muscleOpacity * 100)}%</span>
        </div>
        <input
          id="opacity-slider"
          type="range"
          min="0"
          max="100"
          value={Math.round(muscleOpacity * 100)}
          onChange={(e) => setMuscleOpacity(Number(e.target.value) / 100)}
          className="mt-1 w-full accent-teal-500"
        />
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索肌肉：胸大肌 / pec / latissimus"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
      />

      {/* 选中详情 */}
      {meta && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-lg font-semibold text-slate-900">{meta.cn}</div>
          <div className="mt-0.5 text-xs text-slate-500">{meta.en}</div>
          <div className="text-xs italic text-slate-400">{meta.latin}</div>
          <div className="mt-2 inline-block rounded-md bg-teal-600 px-2 py-1 text-xs text-white">
            {REGION_CN[meta.region]}
          </div>
          <Link
            to={`/muscle/${meta.id}`}
            className="mt-3 block rounded-lg bg-teal-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-teal-700"
          >
            查看训练动作与方案 →
          </Link>
        </div>
      )}

      {/* 细分：把整块肌群拆成亚部（如三角肌 → 前束 / 中束 / 后束） */}
      {selected && canSplit && (
        <div className="rounded-xl border border-teal-200 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">
              细分这块肌肉（{parts.length} 个亚部）
            </div>
            <button
              onClick={() => (expanded === selected ? setExpanded(null) : setExpanded(selected))}
              className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:border-teal-300 hover:bg-teal-50"
            >
              {expanded === selected ? '收起细分' : '在 3D 上展开'}
            </button>
          </div>
          <div className="mb-1.5 text-[11px] leading-relaxed text-slate-400">
            点下面的标签或模型上的色块，看这一束/这一头的针对性动作
          </div>
          <div className="flex flex-wrap gap-1.5">
            {parts.map((p) => {
              const active = selectedPart === p.id;
              return (
                <button
                  key={p.id}
                  title={p.note}
                  onClick={() => {
                    if (expanded !== selected) setExpanded(selected);
                    selectPart(active ? null : p.id);
                  }}
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition',
                    active
                      ? 'border-teal-500 bg-teal-50 font-medium text-teal-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                  ].join(' ')}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: partColor(p) }}
                  />
                  {p.short}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedPart && (
        <>
          <div className="rounded-xl border border-teal-200 p-3">
            <div className="mb-1.5 text-xs font-semibold text-slate-600">
              这块亚部你想解决什么？
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROBLEM_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => setPartProblem(p)}
                  className={[
                    'rounded-lg border px-2 py-0.5 text-[11px] transition',
                    partProblem === p
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                  ].join(' ')}
                >
                  {PROBLEM_CN[p]}
                </button>
              ))}
            </div>
          </div>
          <PartPlanView partId={selectedPart} problemType={partProblem} />
        </>
      )}

      {/* 肌群列表 */}
      <div className="space-y-4">
        {byRegion.map(([region, list]) => (
          <div key={region}>
            <div className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400">
              {REGION_CN[region]}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((g) => {
                const active = selected === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => select(active ? null : g.id)}
                    className={[
                      'rounded-lg border px-2.5 py-1 text-xs transition',
                      active
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                    ].join(' ')}
                  >
                    {g.cn}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
