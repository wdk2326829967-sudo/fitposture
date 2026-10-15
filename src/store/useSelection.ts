import { create } from 'zustand';
import { isSubdividable } from '@/kb/subparts';

export type ViewMode = 'front' | 'back';
export type HighlightMode = 'none' | 'posture' | 'symptom';
export type ModelMode = 'realistic' | 'color';

interface SelectionState {
  hovered: string | null;
  selected: string | null;
  /** 已展开成亚部查看的肌群（此时该肌群不再以整块渲染） */
  expanded: string | null;
  /** 当前选中的亚部 id，形如 shoulder_deltoid:middle */
  selectedPart: string | null;
  /** 鼠标悬停的亚部 id */
  hoveredPart: string | null;
  view: ViewMode;
  showTendon: boolean;
  showOther: boolean;
  /** 显示骨骼（叠加在肌肉下方） */
  showSkeleton: boolean;
  /** 模型显示模式：仿真（写实肌肉色） / 分色（每个肌群一种颜色） */
  modelMode: ModelMode;
  /** 肌群整体透明度 0~1。调低可看到被外层遮挡的内层（如腹直肌被腹斜肌盖住） */
  muscleOpacity: number;
  highlightMode: HighlightMode;
  /** 体态模式：紧张肌 / 无力肌 */
  tightMuscles: string[];
  weakMuscles: string[];
  /** 症状模式：与该症状相关的肌肉（整组一种颜色） */
  symptomMuscles: string[];
  /** 模型是否已加载完成（加载遮罩用） */
  ready: boolean;
  setReady: (v: boolean) => void;
  /** 模型下载进度 0~1。模型有 6MB+，手机上要等十几秒，不显示进度会被当成卡死 */
  loadProgress: number;
  setLoadProgress: (v: number) => void;
  /** 加载失败原因（网络中断等），用于遮罩上给出可重试的提示 */
  loadError: string | null;
  setLoadError: (v: string | null) => void;

  setHovered: (id: string | null) => void;
  setHoveredPart: (id: string | null) => void;
  select: (id: string | null) => void;
  selectPart: (id: string | null) => void;
  setExpanded: (id: string | null) => void;
  toggleView: () => void;
  setShowTendon: (v: boolean) => void;
  setShowOther: (v: boolean) => void;
  setShowSkeleton: (v: boolean) => void;
  setModelMode: (m: ModelMode) => void;
  setMuscleOpacity: (v: number) => void;
  setPostureHighlight: (tight: string[], weak: string[]) => void;
  clearPostureHighlight: () => void;
  /** 症状反查：点亮一组"可能相关的肌肉"，配色区别于体态双色 */
  setSymptomHighlight: (ids: string[]) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  hovered: null,
  selected: null,
  expanded: null,
  selectedPart: null,
  hoveredPart: null,
  view: 'front',
  showTendon: false,
  showOther: false,
  showSkeleton: true,
  modelMode: 'realistic',
  muscleOpacity: 1,
  highlightMode: 'none',
  tightMuscles: [],
  weakMuscles: [],
  symptomMuscles: [],
  ready: false,

  setReady: (v) => set({ ready: v }),
  loadProgress: 0,
  setLoadProgress: (v) => set({ loadProgress: Math.max(0, Math.min(1, v)) }),
  loadError: null,
  setLoadError: (v) => set({ loadError: v }),
  setHovered: (id) => set({ hovered: id }),
  setHoveredPart: (id) => set({ hoveredPart: id }),
  /** 选中肌群：如果这块肌肉本身有亚部（如三角肌含前后中束），直接展开成亚部视图 */
  select: (id) =>
    set({
      selected: id,
      expanded: id && isSubdividable(id) ? id : null,
      selectedPart: null,
      hoveredPart: null,
    }),
  /** 选中某一亚部（父肌群保持选中状态，便于在亚部之间来回切换） */
  selectPart: (id) => set({ selectedPart: id, hoveredPart: null }),
  /** 展开 / 收起某肌群的亚部视图 */
  setExpanded: (id) => set({ expanded: id, selectedPart: null }),
  toggleView: () => set((s) => ({ view: s.view === 'front' ? 'back' : 'front' })),
  setShowTendon: (v) => set({ showTendon: v }),
  setShowOther: (v) => set({ showOther: v }),
  setShowSkeleton: (v) => set({ showSkeleton: v }),
  setModelMode: (m) => set({ modelMode: m }),
  setMuscleOpacity: (v) => set({ muscleOpacity: Math.max(0, Math.min(1, v)) }),
  setPostureHighlight: (tight, weak) =>
    set({
      tightMuscles: tight,
      weakMuscles: weak,
      symptomMuscles: [],
      highlightMode: 'posture',
      selected: null,
      expanded: null,
      selectedPart: null,
    }),
  clearPostureHighlight: () =>
    set({ tightMuscles: [], weakMuscles: [], highlightMode: 'none' }),
  setSymptomHighlight: (ids) =>
    set({
      symptomMuscles: ids,
      tightMuscles: [],
      weakMuscles: [],
      highlightMode: ids.length ? 'symptom' : 'none',
      selected: null,
      expanded: null,
      selectedPart: null,
    }),
}));
