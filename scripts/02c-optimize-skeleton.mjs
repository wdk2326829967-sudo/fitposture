/**
 * 02c - 压缩骨骼 GLB：Draco（与 anatomy.glb 同一管线、同一坐标系）
 * 输入 scripts/.cache/skeleton.glb (9.4MB, 201 块骨骼) -> public/models/skeleton.glb
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { dedup, prune, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(root, 'scripts/.cache/skeleton.glb');
const OUTPUT = resolve(root, 'public/models/skeleton.glb');

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

async function main() {
  await mkdir(dirname(OUTPUT), { recursive: true });

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  console.log('[02c] 读取原始骨骼 GLB ...');
  const doc = await io.read(INPUT);
  const before = (await stat(INPUT)).size;
  const meshCount = doc.getRoot().listMeshes().length;
  console.log(`[02c] 原始：${mb(before)} / meshes=${meshCount}`);

  console.log('[02c] 执行 dedup -> prune -> draco ...');
  await doc.transform(
    dedup(),
    prune({ keepAttributes: false, keepIndices: false, keepLeaves: false }),
    draco({ method: 'edgebreaker', encodeSpeed: 5, decodeSpeed: 5 }),
  );

  doc.createExtension(KHRDracoMeshCompression).setRequired(false);

  await io.write(OUTPUT, doc);
  const after = (await stat(OUTPUT)).size;
  console.log(`[02c] 完成：${mb(before)} -> ${mb(after)}  (${((after / before) * 100).toFixed(1)}%)`);
  console.log(`[02c] 输出：${OUTPUT}`);
}

main().catch((e) => {
  console.error('[02c] 失败：', e);
  process.exit(1);
});
