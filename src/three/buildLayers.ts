import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NODE_TO_GROUP } from '@/kb/mesh/groups';
import { isSubdividable, partOfMesh, type PartInfo } from '@/kb/subparts';

export type Side = 'left' | 'right' | 'center';

export interface RawMuscle {
  name: string;
  groupId: string;
  side: Side;
  geometry: THREE.BufferGeometry;
}

export interface MergedLayer {
  key: string; // `${groupId}::${side}`
  groupId: string;
  side: Side;
  meshNames: string[];
  geometry: THREE.BufferGeometry;
}

export interface BuiltModel {
  layers: MergedLayer[];
  /** 展开单块时用：每个肌群包含哪些原始 mesh */
  rawByGroup: Map<string, RawMuscle[]>;
  bounds: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
}

export interface PartLayer {
  /** 亚部 id，形如 shoulder_deltoid:middle */
  id: string;
  groupId: string;
  key: string;
  part: PartInfo;
  meshNames: string[];
  geometry: THREE.BufferGeometry;
}

/**
 * GLTFLoader 会用 PropertyBinding.sanitizeNodeName 把节点名里的空格替换成下划线，
 * 所以查询前要先还原成空格再匹配。
 */
export function lookupGroup(name: string): string {
  if (NODE_TO_GROUP[name]) return NODE_TO_GROUP[name];
  const spaced = name.replace(/_/g, ' ').trim();
  if (NODE_TO_GROUP[spaced]) return NODE_TO_GROUP[spaced];
  // 再退一步：去掉所有非字母数字后比较
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(spaced);
  for (const key of Object.keys(NODE_TO_GROUP)) {
    if (norm(key) === target) return NODE_TO_GROUP[key];
  }
  return 'other';
}

export function inferSide(name: string): Side {
  const n = name.toLowerCase();
  if (/\bleft\b|\bl\./.test(n)) return 'left';
  if (/\bright\b|\br\./.test(n)) return 'right';
  return 'center';
}

/** 只保留 position + normal，并保证有索引，避免 mergeGeometries 因属性不一致失败 */
function normalizeGeometry(src: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry | null {
  const geo = src.clone();
  geo.applyMatrix4(matrix);

  const pos = geo.getAttribute('position');
  if (!pos) {
    geo.dispose();
    return null;
  }
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  const nrm = geo.getAttribute('normal');

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', pos.clone());
  out.setAttribute('normal', nrm.clone());

  const idx = geo.getIndex();
  if (idx) {
    out.setIndex(idx.clone());
  } else {
    const count = pos.count;
    const arr = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
    for (let i = 0; i < count; i++) arr[i] = i;
    out.setIndex(new THREE.BufferAttribute(arr, 1));
  }

  // 统一面片朝向：源模型里有 46 块网格是外翻的（有符号体积为负）
  fixMeshOrientation(out);

  geo.dispose();
  return out;
}

/**
 * 解剖层次微调（单位：毫米，模型原始坐标系）
 *
 * 问题：BodyParts3D 的建模方式是把大肌肉做成「包裹式外壳」，导致相邻肌群几乎处于同一深度。
 * 例如腹外斜肌（前缘 Y=-219）比腹直肌（前缘 Y=-216）只靠前 3mm，X 范围还把腹直肌整个罩住，
 * 深度测试无法稳定判定谁在前，结果腹直肌被斜肌吃掉（Z-fighting）。
 *
 * 解法：给应当「浮」在外层的肌群一个明确的前移量，让它在深度上实打实地压过包裹它的邻居。
 * 模型原始坐标系里 -Y 朝前，所以正值 = 朝前推。
 */
const DEPTH_NUDGE_MM: Record<string, number> = {
  // 腹直肌：腹外斜肌是包裹它的外壳，两者前缘只差 3mm，外侧还互相穿插。
  // 小幅前移（约等于练出来的腹肌凸起，视觉合理）让它在外侧也稳定胜出；
  // 残留的贴面穿插由 FRONT_PRIORITY_GROUPS 的 polygonOffset 兜住。
  core_rectus: 9,
};

/**
 * 深度优先级：这些肌群用 polygonOffset 在深度缓冲里稳定「压过」与它贴着/穿插的邻居。
 *
 * 与上面的几何前移相比，polygonOffset 只改深度比较、不动顶点：
 *   - 不会把肌肉整体推出体表，破坏轮廓（14mm 前移其实会让腹部侧面多出一层台阶）
 *   - 面与面「相互穿插」时也能全区域生效，而平移只能解决平移方向上的遮挡
 *
 * 腹直肌：腹外斜肌在模型里是包裹它的外壳，两者前缘只差 3mm，外侧还互相穿插。
 * 不处理的话，斜肌表面会在局部盖住腹直肌的腱划，把起伏的明暗洗成一片平坦。
 */
export const FRONT_PRIORITY_GROUPS = new Set<string>(['core_rectus']);

/** 需要前移的肌群是否在 skimThrough 名单里 */
function nudgeFor(groupId: string): number {
  return DEPTH_NUDGE_MM[groupId] ?? 0;
}

/**
 * 统一面片朝向。
 *
 * 源模型（BodyParts3D）里有相当一部分网格是「外翻」的：三角形绕序与法线一致，
 * 但整块朝内 —— 有符号体积为负。用散度定理算体积即可稳定判定：
 *   封闭网格 V = (1/6)·Σ a·(b×c)，按外法线绕序时 V > 0；V < 0 即为外翻。
 *
 * 外翻网格在 DoubleSide 材质下会走进「背面」分支，three 会按 gl_FrontFacing 折返法线，
 * 结果与正常网格的着色不一致：同一块肌肉左右两半一块能看出肌腱划、一块糊成一片。
 * 这里直接把外翻网格的绕序反过来、法线取反，让全模型朝向统一。
 *
 * @returns 是否做了修正
 */
function fixMeshOrientation(geo: THREE.BufferGeometry): boolean {
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  if (!pos || !idx) return false;

  const p = pos.array as ArrayLike<number>;
  const ia = idx.array as unknown as number[];

  let vol = 0;
  for (let t = 0; t < ia.length; t += 3) {
    const i0 = ia[t] * 3;
    const i1 = ia[t + 1] * 3;
    const i2 = ia[t + 2] * 3;
    const ax = p[i0];
    const ay = p[i0 + 1];
    const az = p[i0 + 2];
    const bx = p[i1];
    const by = p[i1 + 1];
    const bz = p[i1 + 2];
    const cx = p[i2];
    const cy = p[i2 + 1];
    const cz = p[i2 + 2];
    vol += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  if (vol >= 0) return false;

  // 反转三角形绕序
  for (let t = 0; t < ia.length; t += 3) {
    const tmp = ia[t + 1];
    ia[t + 1] = ia[t + 2];
    ia[t + 2] = tmp;
  }
  idx.needsUpdate = true;

  // 法线同步取反
  const nrm = geo.getAttribute('normal');
  if (nrm) {
    const n = nrm.array as unknown as number[];
    for (let i = 0; i < n.length; i++) n[i] = -n[i];
    nrm.needsUpdate = true;
  }
  return true;
}

export function buildModel(root: THREE.Object3D): BuiltModel {
  root.updateWorldMatrix(true, true);

  const nudgeMatrix = new THREE.Matrix4();
  const raws: RawMuscle[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    const groupId = lookupGroup(mesh.name);
    const nudge = nudgeFor(groupId);
    const matrix =
      nudge !== 0
        ? new THREE.Matrix4().makeTranslation(0, -nudge, 0).multiply(mesh.matrixWorld)
        : mesh.matrixWorld;

    const geo = normalizeGeometry(mesh.geometry, matrix);
    if (!geo) return;
    raws.push({
      name: mesh.name,
      groupId,
      side: inferSide(mesh.name),
      geometry: geo,
    });
  });

  // 按肌群分组（左右两侧合并进同一层：点任意一侧两侧一起高亮，draw call 也更少）
  const rawByGroup = new Map<string, RawMuscle[]>();
  for (const r of raws) {
    let g = rawByGroup.get(r.groupId);
    if (!g) {
      g = [];
      rawByGroup.set(r.groupId, g);
    }
    g.push(r);
  }

  const layers: MergedLayer[] = [];
  for (const [groupId, list] of rawByGroup) {
    const geos = list.map((r) => r.geometry);
    let merged: THREE.BufferGeometry | null = null;
    try {
      merged = mergeGeometries(geos, false);
    } catch (e) {
      console.warn('[buildModel] 合并失败：', groupId, e);
    }
    if (merged) {
      merged.computeBoundingBox();
      layers.push({
        key: groupId,
        groupId,
        side: 'center',
        meshNames: list.map((r) => r.name),
        geometry: merged,
      });
    }
    // 可细分的肌群要保留原始子网格，展开成亚部时还要用；其余的直接释放省内存
    if (!isSubdividable(groupId)) {
      for (const g of geos) g.dispose();
    }
  }

  // 整体包围盒
  const bounds = new THREE.Box3();
  for (const l of layers) {
    if (l.geometry.boundingBox) bounds.union(l.geometry.boundingBox);
  }
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  return { layers, rawByGroup, bounds, center, size };
}

/** 亚部几何缓存：肌群 id → 亚部层级 */
const partCache = new Map<string, PartLayer[]>();

/**
 * 把一个肌群拆成若干亚部层（如三角肌 → 前束/中束/后束）。
 * 左右两侧合并进同一个亚部，点了左边全身一起高亮。
 */
export function buildPartLayers(model: BuiltModel, groupId: string): PartLayer[] {
  const cached = partCache.get(groupId);
  if (cached) return cached;

  const raws = model.rawByGroup.get(groupId) ?? [];
  const buckets = new Map<
    string,
    { part: PartInfo; names: string[]; geos: THREE.BufferGeometry[] }
  >();

  for (const r of raws) {
    const part = partOfMesh(groupId, r.name);
    if (!part) continue;
    let b = buckets.get(part.id);
    if (!b) {
      b = { part, names: [], geos: [] };
      buckets.set(part.id, b);
    }
    b.names.push(r.name);
    b.geos.push(r.geometry);
  }

  const out: PartLayer[] = [];
  for (const [id, b] of buckets) {
    let geo: THREE.BufferGeometry | null = null;
    if (b.geos.length === 1) {
      geo = b.geos[0];
    } else {
      try {
        geo = mergeGeometries(b.geos, false);
      } catch (e) {
        console.warn('[buildPartLayers] 合并失败：', id, e);
      }
    }
    if (!geo) continue;
    geo.computeBoundingBox();
    out.push({
      id,
      groupId,
      key: b.part.key,
      part: b.part,
      meshNames: b.names,
      geometry: geo,
    });
  }

  out.sort((a, b) => a.part.rank - b.part.rank);
  partCache.set(groupId, out);
  return out;
}
