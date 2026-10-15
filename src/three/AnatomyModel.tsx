import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { buildModel, buildPartLayers, FRONT_PRIORITY_GROUPS, type BuiltModel } from './buildLayers';
import { buildSkeleton, type BuiltSkeleton } from './buildSkeleton';
import { useSelection } from '@/store/useSelection';
import { muscleCn } from '@/kb/mesh/registry';
import { groupColor } from '@/kb/mesh/palette';
import { partColor } from '@/kb/subparts';

const MUSCLE_URL = '/models/anatomy.glb';
const SKELETON_URL = '/models/skeleton.glb';
const TARGET_HEIGHT = 1.8;

/** 原版 109 万面 / 4.6MB，手机上又慢又烫。低模保留 34% 面数，轮廓基本一致。 */
const VARIANTS = {
  full: { muscle: '/models/anatomy.glb', skeleton: '/models/skeleton.glb', muscleBytes: 4817528 },
  low: { muscle: '/models/anatomy-low.glb', skeleton: '/models/skeleton-low.glb', muscleBytes: 2119680 },
};

/** 排查渲染问题的开关：URL 加 ?only=<groupId> 可只渲染该肌群，便于隔离观察 */
const ONLY_GROUP =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('only')
    : null;

const COLOR = {
  base: '#b4624f',
  tendon: '#d8d2c8',
  other: '#9aa0a6',
  selected: '#2dd4bf',
  hover: '#e0805f',
  tight: '#ff7043',
  weak: '#42a5f5',
  /** 症状反查：把"可能相关的肌肉"整组点亮，用紫色以区别体态的橙/蓝双色 */
  symptom: '#a855f7',
  bone: '#e8e4da',
};

/** 加载肌肉 + 骨骼两个模型，返回构建结果 */
function useAnatomyModels(lowPoly: boolean) {
  const [muscle, setMuscle] = useState<BuiltModel | null>(null);
  const [skeleton, setSkeleton] = useState<BuiltSkeleton | null>(null);
  const setLoadProgress = useSelection((s) => s.setLoadProgress);
  const setLoadError = useSelection((s) => s.setLoadError);

  useEffect(() => {
    const { muscle: MUSCLE_URL, skeleton: SKELETON_URL, muscleBytes: MUSCLE_BYTES } =
      lowPoly ? VARIANTS.low : VARIANTS.full;
    // 两个模型共用同一个 loader 和 draco 解码器。之前各建一份，导致 286KB 的
    // draco_decoder.wasm 被下载并编译两次——手机上 wasm 实例化要好几秒。
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    loader.setDRACOLoader(draco);
    let alive = true;

    const onProgress = (e: ProgressEvent) => {
      const total = e.total || MUSCLE_BYTES;
      if (total > 0) setLoadProgress(e.loaded / total);
    };

    // 肌肉模型（主模型，决定居中/缩放，也是加载遮罩的进度依据）
    loader.load(
      MUSCLE_URL,
      (gltf) => {
        if (!alive) return;
        const built = buildModel(gltf.scene);
        setMuscle(built);
        console.log(
          `[Anatomy] 肌肉加载完成：${built.layers.length} 个肌群层 / 尺寸 ${built.size.toArray().map((v) => v.toFixed(1)).join('×')}`,
        );

        // 主模型就位后再拉骨骼：两个 6MB 文件并行会互相抢带宽，拖慢首屏出现的时间。
        // 此时 draco 解码器已就绪，可直接复用。
        loader.load(
          SKELETON_URL,
          (s) => {
            if (!alive) return;
            const sk = buildSkeleton(s.scene);
            setSkeleton(sk);
            console.log(
              `[Anatomy] 骨骼加载完成：尺寸 ${sk?.size.toArray().map((v) => v.toFixed(1)).join('×') ?? 'n/a'}`,
            );
          },
          undefined,
          (err) => {
            // 骨骼加载失败不阻塞主功能
            console.warn('[Anatomy] 骨骼加载失败（已忽略）', err);
          },
        );
      },
      onProgress,
      (err) => {
        console.error('[Anatomy] 肌肉加载失败', err);
        if (alive) setLoadError('模型下载失败，请检查网络后重试');
      },
    );

    return () => {
      alive = false;
      draco.dispose();
    };
  }, [setLoadProgress, setLoadError, lowPoly]);

  // 肌肉加载完成即标记 ready（骨骼是增强项，可稍后出现）
  useEffect(() => {
    if (muscle) useSelection.getState().setReady(true);
  }, [muscle]);

  return { muscle, skeleton };
}

export default function AnatomyModel({ lowPoly = false }: { lowPoly?: boolean }) {
  const { muscle, skeleton } = useAnatomyModels(lowPoly);

  const selected = useSelection((s) => s.selected);
  const hovered = useSelection((s) => s.hovered);
  const expanded = useSelection((s) => s.expanded);
  const selectedPart = useSelection((s) => s.selectedPart);
  const hoveredPart = useSelection((s) => s.hoveredPart);
  const view = useSelection((s) => s.view);
  const showTendon = useSelection((s) => s.showTendon);
  const showOther = useSelection((s) => s.showOther);
  const showSkeleton = useSelection((s) => s.showSkeleton);
  const modelMode = useSelection((s) => s.modelMode);
  const muscleOpacity = useSelection((s) => s.muscleOpacity);
  const highlightMode = useSelection((s) => s.highlightMode);
  const tight = useSelection((s) => s.tightMuscles);
  const weak = useSelection((s) => s.weakMuscles);
  const symptomMuscles = useSelection((s) => s.symptomMuscles);
  const select = useSelection((s) => s.select);
  const selectPart = useSelection((s) => s.selectPart);
  const setHovered = useSelection((s) => s.setHovered);
  const setHoveredPart = useSelection((s) => s.setHoveredPart);

  // 以肌肉模型为准计算居中 + 缩放（骨骼同坐标系，套用同一变换即可对齐）
  const { scale, offset } = useMemo(() => {
    if (!muscle) return { scale: 1, offset: [0, 0, 0] as [number, number, number] };
    const height = Math.max(muscle.size.x, muscle.size.y, muscle.size.z) || 1;
    const s = TARGET_HEIGHT / height;
    return {
      scale: s,
      offset: [-muscle.center.x * s, -muscle.center.y * s, -muscle.center.z * s] as [
        number,
        number,
        number,
      ],
    };
  }, [muscle]);

  // 展开细分时：把该肌群拆成若干亚部独立渲染
  const partLayers = useMemo(() => {
    if (!muscle || !expanded) return [];
    return buildPartLayers(muscle, expanded);
  }, [muscle, expanded]);

  // 正/背面：绕 Y 轴缓动
  const groupRef = useMemo(() => ({ current: null as THREE.Group | null }), []);
  useEffect(() => {
    const target = view === 'front' ? 0 : Math.PI;
    const g = groupRef.current;
    if (!g) return;
    let raf = 0;
    const tick = () => {
      const diff = target - g.rotation.y;
      if (Math.abs(diff) < 0.005) {
        g.rotation.y = target;
        return;
      }
      g.rotation.y += diff * 0.12;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view, muscle, groupRef]);

  if (!muscle) return null;

  const hasFocus = !!selected || highlightMode !== 'none';

  return (
    <group ref={groupRef as never}>
      {/* 模型为 Z-up（-Y 朝前），绕 X 轴 -90° 转到 three 的 Y-up */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <group scale={scale} position={offset}>
          {/* 骨骼（叠加在最底层） */}
          {showSkeleton && skeleton && (
            <mesh geometry={skeleton.geometry}>
              <meshStandardMaterial
                color={COLOR.bone}
                roughness={0.55}
                metalness={0.02}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* 肌肉层（整块肌群） */}
          {muscle.layers.map((layer) => {
            const gid = layer.groupId;
            const isTendon = gid === 'tendon';
            const isOther = gid === 'other';

            if (ONLY_GROUP && gid !== ONLY_GROUP) return null;

            // 该肌群正在"细分查看"，交给下面的亚部层渲染
            if (gid === expanded) return null;

            const visible = isTendon ? showTendon : isOther ? showOther : true;
            const isSelected = selected === gid;
            const isHovered = hovered === gid;
            const isTight = highlightMode === 'posture' && tight.includes(gid);
            const isWeak = highlightMode === 'posture' && weak.includes(gid);
            const isSymptom = highlightMode === 'symptom' && symptomMuscles.includes(gid);
            const isFocused = isSelected || isTight || isWeak || isSymptom;

            // 颜色：分色模式用调色板，仿真模式用统一肌肉色
            let color = modelMode === 'color' && !isTendon && !isOther ? groupColor(gid) : COLOR.base;
            if (isTendon) color = COLOR.tendon;
            else if (isOther) color = COLOR.other;
            if (isSymptom) color = COLOR.symptom;
            if (isTight) color = COLOR.tight;
            if (isWeak) color = COLOR.weak;
            if (isSelected) color = COLOR.selected;
            if (isHovered && !isSelected) color = COLOR.hover;

            const opacity = !visible ? 0 : hasFocus && !isFocused ? 0.22 : 1;
            const finalOpacity = opacity * muscleOpacity;
            const emissive = isFocused ? color : isHovered ? color : '#000000';
            const emissiveIntensity = isSelected
              ? 0.28
              : isTight || isWeak || isSymptom
                ? 0.3
                : isHovered
                  ? 0.16
                  : 0;
            // 深层次序：把该肌群在深度缓冲里稳定提到邻居前面（不改几何）
            const frontPriority = FRONT_PRIORITY_GROUPS.has(gid);

            return (
              <mesh
                key={layer.key}
                geometry={layer.geometry}
                visible={visible && finalOpacity > 0.001}
                onPointerDown={(e) => {
                  if (isTendon || isOther) return;
                  e.stopPropagation();
                  select(gid);
                }}
                onPointerOver={(e) => {
                  if (isTendon || isOther) return;
                  e.stopPropagation();
                  setHovered(gid);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHovered(null);
                  document.body.style.cursor = 'auto';
                }}
              >
<meshStandardMaterial
                color={color}
                roughness={isTendon ? 0.45 : 0.68}
                metalness={0.04}
                transparent={finalOpacity < 1}
                opacity={finalOpacity}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                side={THREE.DoubleSide}
                depthWrite={finalOpacity === 1}
                polygonOffset={frontPriority}
                polygonOffsetFactor={frontPriority ? -6 : 0}
                polygonOffsetUnits={frontPriority ? -18 : 0}
              />
              </mesh>
            );
          })}

          {/* 亚部层：某肌群处于"细分查看"时逐块渲染 */}
          {partLayers.map((pl) => {
            const isSel = selectedPart === pl.id;
            const isHov = hoveredPart === pl.id;
            const base = partColor(pl.part, isSel ? 82 : 68, isSel ? 58 : 52);
            const dim = selectedPart && !isSel ? 0.5 : 1;
            const finalOpacity = dim * muscleOpacity;

            return (
              <mesh
                key={pl.id}
                geometry={pl.geometry}
                visible={finalOpacity > 0.001}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  selectPart(isSel ? null : pl.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredPart(pl.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredPart(null);
                  document.body.style.cursor = 'auto';
                }}
              >
                <meshStandardMaterial
                  color={base}
                  roughness={0.6}
                  metalness={0.05}
                  transparent={finalOpacity < 1}
                  opacity={finalOpacity}
                  emissive={isSel || isHov ? base : '#000000'}
                  emissiveIntensity={isSel ? 0.5 : isHov ? 0.28 : 0}
                  side={THREE.DoubleSide}
                  depthWrite={finalOpacity === 1}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}

export { muscleCn };
