import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import AnatomyModel from './AnatomyModel';
import { useSelection } from '@/store/useSelection';
import { muscleCn } from '@/kb/mesh/registry';
import { getPart } from '@/kb/subparts';
import { useIsSmallScreen } from '@/lib/useIsSmallScreen';

/** three.js 的新版本要求 WebGL2。老机型或部分内置浏览器只给 WebGL1，
 *  此时 r3f 会静默失败、页面上只留一片空白，不如直接讲清楚原因。 */
function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

export default function Scene() {
  const small = useIsSmallScreen();
  const webgl2 = useMemo(hasWebGL2, []);
  const ready = useSelection((s) => s.ready);
  const loadProgress = useSelection((s) => s.loadProgress);
  const loadError = useSelection((s) => s.loadError);
  const select = useSelection((s) => s.select);
  const selectPart = useSelection((s) => s.selectPart);
  const hovered = useSelection((s) => s.hovered);
  const hoveredPart = useSelection((s) => s.hoveredPart);

  const hoverLabel = hoveredPart
    ? (getPart(hoveredPart)?.cn ?? null)
    : hovered
      ? muscleCn(hovered)
      : null;

  return (
    <div className="relative h-full w-full">
      {!webgl2 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-sm font-medium text-slate-600">当前浏览器无法显示 3D 模型</p>
          <p className="text-xs text-slate-400">
            需要支持 WebGL2 的浏览器。可尝试用系统自带浏览器（如 Safari、Chrome）打开。
          </p>
        </div>
      ) : (
      <Canvas
        dpr={small ? [1, 1.5] : [1, 1.8]}
        gl={{ antialias: !small, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.1, 3.1], fov: 34 }}
        onPointerMissed={() => {
          selectPart(null);
          select(null);
        }}
      >
        <color attach="background" args={['#eceff3']} />

        {/* 三点光
            主光强度曾高达补光的 2.5 倍，导致浅浮雕（如腹直肌的腱划）只在受光那一侧
            显出明暗、背光侧糊成一片。这里把主/补光比值压到 1.4:1，并加一盏正面柔光，
            让左右两侧的浅层起伏都能读出来，同时保留塑形感。 */}
        <ambientLight intensity={0.38} />
        <directionalLight position={[2.3, 2.8, 2.6]} intensity={0.72} color="#ffffff" />
        <directionalLight position={[-2.3, 2.8, 2.6]} intensity={0.72} color="#e8f0ff" />
        <directionalLight position={[2.6, 0.9, 3.0]} intensity={0.42} color="#ffe9df" />
        <directionalLight position={[-2.6, 0.9, 3.0]} intensity={0.42} color="#ffe9df" />
        <directionalLight position={[0, 1.6, -3.2]} intensity={0.34} color="#ffdccf" />

        <AnatomyModel lowPoly={small} />

        {!small && (
          <ContactShadows position={[0, -0.92, 0]} opacity={0.32} scale={3.2} blur={2.6} far={1.4} />
        )}

        <OrbitControls
          makeDefault
          enablePan
          minDistance={1.1}
          maxDistance={6}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI - 0.15}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          zoomSpeed={0.8}
        />
      </Canvas>
      )}

      {/* 悬停提示 */}
      {hoverLabel && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-slate-700 shadow">
          {hoverLabel}
        </div>
      )}

      {/* 加载遮罩。模型有 6MB+，手机上要等十几秒，必须给出百分比，否则会被当成卡死 */}
      {webgl2 && !ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#eceff3] px-6 text-center">
          {loadError ? (
            <>
              <p className="text-sm text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white"
              >
                重新加载
              </button>
            </>
          ) : (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500" />
              <p className="text-sm text-slate-500">
                {loadProgress >= 1 ? '正在解析模型…' : '正在加载 3D 人体模型…'}
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
                  style={{ width: `${Math.round(loadProgress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{Math.round(loadProgress * 100)}%</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
