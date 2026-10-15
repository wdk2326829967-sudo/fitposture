import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface BuiltSkeleton {
  geometry: THREE.BufferGeometry;
  bounds: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
}

/**
 * 构建骨骼模型：把 GLB 里所有骨骼 mesh 合并成一个整体（骨骼不需要单独拾取）。
 * 骨骼与肌肉在同一坐标系（BodyParts3D + Z-Anatomy 已对齐），
 * 所以这里只做世界变换烘焙 + 合并，居中和缩放交给外层统一处理。
 */
export function buildSkeleton(root: THREE.Object3D): BuiltSkeleton | null {
  root.updateWorldMatrix(true, true);

  const geos: THREE.BufferGeometry[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);

    const pos = geo.getAttribute('position');
    if (!pos) {
      geo.dispose();
      return;
    }
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();

    const out = new THREE.BufferGeometry();
    out.setAttribute('position', pos.clone());
    out.setAttribute('normal', (geo.getAttribute('normal') as THREE.BufferAttribute).clone());
    const idx = geo.getIndex();
    if (idx) out.setIndex(idx.clone());
    geos.push(out);
    geo.dispose();
  });

  if (geos.length === 0) return null;

  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!merged) return null;

  merged.computeBoundingBox();
  const bounds = merged.boundingBox!.clone();
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  return { geometry: merged, bounds, center, size };
}
