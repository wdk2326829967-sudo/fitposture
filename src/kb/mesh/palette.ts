// 分色模式下：给每个可选肌群分配一个可区分的颜色（HSL 色相环均匀分布）
import { SELECTABLE_GROUPS } from './groups';

/**
 * 把肌群按分区顺序排列，用金色角（HSL 色相）均匀铺开，
 * 相邻肌群颜色尽量拉开。返回 groupId -> hex 的映射。
 */
const palette: Record<string, string> = {};

// 用固定顺序（分区内稳定），色相均匀分布
const ordered = SELECTABLE_GROUPS.map((g) => g.id);
const n = ordered.length;

ordered.forEach((id, i) => {
  // 黄金比例步进，让相邻色相差异大、整体均匀
  const hue = Math.round((i * 137.508) % 360);
  // 饱和度、明度固定，保证观感统一（偏低饱和、偏亮，符合现代配色）
  palette[id] = `hsl(${hue}, 62%, 58%)`;
});

export function groupColor(id: string): string {
  return palette[id] ?? '#9aa0a6';
}

export const COLOR_PALETTE = palette;
