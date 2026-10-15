// 由 scripts/04-build-group-map.mjs 生成，这里做类型化封装
import raw from './muscleGroupMap.json';
import type { MuscleId, MuscleRegion } from '@/kb/types';

export interface GroupMeta {
  cn: string;
  region: MuscleRegion;
  hidden: boolean;
}

export const GROUP_META = raw.groups as unknown as Record<string, GroupMeta>;
export const NODE_TO_GROUP = raw.nodeToGroup as Record<string, string>;
export const GROUP_NODES = raw.byGroup as Record<
  string,
  { left: string[]; right: string[]; center: string[] }
>;

export interface GroupSummary {
  id: string;
  cn: string;
  region: MuscleRegion;
  hidden: boolean;
  left: number;
  right: number;
  center: number;
  total: number;
}
export const GROUP_SUMMARY = raw.summary as unknown as GroupSummary[];

/** 参与主交互的肌群（排除肌腱与"其他"） */
export const SELECTABLE_GROUPS = GROUP_SUMMARY.filter((s) => !s.hidden && s.total > 0);

export function groupCn(id: string): string {
  return GROUP_META[id]?.cn ?? id;
}

export function nodesOf(groupId: string): string[] {
  const g = GROUP_NODES[groupId];
  if (!g) return [];
  return [...g.left, ...g.right, ...g.center];
}

export function groupIdOf(nodeName: string): MuscleId {
  return (NODE_TO_GROUP[nodeName] ?? 'other') as MuscleId;
}
