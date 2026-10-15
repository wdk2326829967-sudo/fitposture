/**
 * 02 - 压缩 GLB：Draco + 量化 + prune + dedup
 * 目标：25MB -> ~5MB，同时保留所有节点名（后续映射依赖节点名）
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { dedup, prune, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(root, 'scripts/.cache/anatomy.glb');
const OUTPUT = resolve(root, 'public/models/anatomy.glb');

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

async function main() {
  await mkdir(dirname(OUTPUT), { recursive: true });

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  console.log('[02] 读取原始 GLB ...');
  const doc = await io.read(INPUT);
  const before = (await stat(INPUT)).size;

  const meshCount = doc.getRoot().listMeshes().length;
  const nodeCount = doc.getRoot().listNodes().length;
  console.log(`[02] 原始：${mb(before)} / meshes=${meshCount} / nodes=${nodeCount}`);

  console.log('[02] 执行 dedup -> prune -> quantize -> draco ...');
  await doc.transform(
    dedup(),
    prune({ keepAttributes: false, keepIndices: false, keepLeaves: false }),
    // 注意：不要加 quantize()。它会把顶点存成归一化 Int16，
    // 而 three 的 applyMatrix4 是就地写回的，世界坐标会被截断成整数再当归一化值读取，
    // 导致前端合并且居中的时候变换完全失效。压缩交给 Draco 即可。
    draco({ method: 'edgebreaker', encodeSpeed: 5, decodeSpeed: 5 }),
  );

  // 量化后需要显式声明扩展，否则 three 不会启用 KHR_mesh_quantization
  doc.createExtension(KHRDracoMeshCompression).setRequired(false);

  await io.write(OUTPUT, doc);
  const after = (await stat(OUTPUT)).size;
  const afterMesh = doc.getRoot().listMeshes().length;
  const afterNode = doc.getRoot().listNodes().length;

  console.log(`[02] 完成：${mb(before)} -> ${mb(after)}  (压缩到 ${((after / before) * 100).toFixed(1)}%)`);
  console.log(`[02] meshes=${afterMesh} nodes=${afterNode}`);
  console.log(`[02] 输出：${OUTPUT}`);
}

main().catch((e) => {
  console.error('[02] 失败：', e);
  process.exit(1);
});
