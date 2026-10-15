import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scene from '@/three/Scene';
import MusclePanel from './MusclePanel';
import { useSelection } from '@/store/useSelection';
import { getSymptom } from '@/kb/symptoms';

const SYMPTOM_COLOR = '#a855f7';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const symptomId = params.get('symptom');
  const setSymptomHighlight = useSelection((s) => s.setSymptomHighlight);
  const highlightMode = useSelection((s) => s.highlightMode);
  const clearPostureHighlight = useSelection((s) => s.clearPostureHighlight);

  // 从症状详情页跳转过来时（/?symptom=xxx）点亮相关肌肉。
  // 不带参数地进入首页则说明是一次全新浏览，把上一次的高亮清掉，
  // 否则其他肌肉会一直处于半透明状态，用户以为模型坏了。
  useEffect(() => {
    if (!symptomId) {
      if (highlightMode === 'symptom') setSymptomHighlight([]);
      return;
    }
    const s = getSymptom(symptomId);
    setSymptomHighlight(s ? s.causes.map((c) => c.muscle) : []);
  }, [symptomId, highlightMode, setSymptomHighlight]);

  const symptom = symptomId ? getSymptom(symptomId) : undefined;

  const clear = () => {
    setSymptomHighlight([]);
    clearPostureHighlight();
    if (symptomId) {
      const next = new URLSearchParams(params);
      next.delete('symptom');
      setParams(next, { replace: true });
    }
  };

  return (
    <>
      <Header />
      {/* 移动端纵向排列时，侧栏内容比视口高得多。若不限制，它会把上面的 3D 容器压成
          0 高度——canvas 拿不到尺寸，r3f 不启动渲染循环，模型永远不会被请求（表现为
          一直转圈）。所以这里给 3D 区固定高度且不参与压缩，让侧栏在自己的空间内滚动。
          注意别同时写 flex-1 和 shrink-0：flex-1 是 flex 简写，会把 shrink 重置回 1。 */}
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-[52vh] min-h-0 shrink-0 md:h-auto md:flex-1">
          <Scene />
          {symptom && (
            <div className="absolute left-3 top-3 max-w-[70%] rounded-lg bg-white/90 px-2.5 py-2 text-[11px] leading-tight text-slate-600 shadow">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: SYMPTOM_COLOR }} />
                <span className="font-medium text-slate-700">{symptom.cn}</span>
              </div>
              <div className="mt-0.5 text-slate-500">紫色为可能相关的肌肉</div>
              <button
                onClick={clear}
                className="mt-1 text-[10px] text-teal-600 hover:underline"
              >
                清除高亮
              </button>
            </div>
          )}
        </div>
        <aside className="min-h-0 w-full flex-1 overflow-y-auto border-t border-slate-200 md:w-[340px] md:flex-none md:border-l md:border-t-0">
          <MusclePanel />
        </aside>
      </main>
      <Footer />
    </>
  );
}
