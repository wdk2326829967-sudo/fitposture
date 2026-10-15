/**
 * 04 - 把 467 个英文解剖 mesh 名映射到中文肌群
 * 产物：src/kb/mesh/muscleGroupMap.json  +  scripts/.cache/unmapped.json（人工兜底用）
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = resolve(root, 'src/kb/mesh/meshManifest.json');
const OUTPUT = resolve(root, 'src/kb/mesh/muscleGroupMap.json');
const UNMAPPED = resolve(root, 'scripts/.cache/unmapped.json');

/** 肌群定义：id -> 中文名 / 分区 / 是否默认可见 */
const GROUPS = {
  chest_pec_major: { cn: '胸大肌', region: 'chest' },
  chest_pec_minor: { cn: '胸小肌', region: 'chest' },
  chest_serratus: { cn: '前锯肌', region: 'chest' },

  shoulder_deltoid: { cn: '三角肌', region: 'shoulder' },
  shoulder_rotator_cuff: { cn: '肩袖肌群', region: 'shoulder' },

  back_trapezius_upper: { cn: '斜方肌上束', region: 'back' },
  back_trapezius_lower: { cn: '斜方肌中下束', region: 'back' },
  back_lat: { cn: '背阔肌', region: 'back' },
  back_rhomboid: { cn: '菱形肌', region: 'back' },
  back_erector: { cn: '竖脊肌', region: 'back' },
  back_ql: { cn: '腰方肌', region: 'back' },

  arm_biceps: { cn: '肱二头肌', region: 'arm' },
  arm_triceps: { cn: '肱三头肌', region: 'arm' },
  arm_forearm_flexor: { cn: '前臂屈肌群', region: 'arm' },
  arm_forearm_extensor: { cn: '前臂伸肌群', region: 'arm' },

  core_rectus: { cn: '腹直肌', region: 'core' },
  core_oblique: { cn: '腹斜肌', region: 'core' },
  core_transverse: { cn: '腹横肌', region: 'core' },

  hip_glute_max: { cn: '臀大肌', region: 'hip' },
  hip_glute_med: { cn: '臀中肌', region: 'hip' },
  hip_iliopsoas: { cn: '髂腰肌', region: 'hip' },
  hip_tfl_itb: { cn: '阔筋膜张肌/髂胫束', region: 'hip' },

  thigh_quads: { cn: '股四头肌', region: 'thigh' },
  thigh_hamstrings: { cn: '腘绳肌', region: 'thigh' },
  thigh_adductor: { cn: '内收肌群', region: 'thigh' },

  calf_gastroc: { cn: '腓肠肌', region: 'calf' },
  calf_soleus: { cn: '比目鱼肌', region: 'calf' },
  calf_tibialis_ant: { cn: '胫骨前肌', region: 'calf' },
  calf_peroneal: { cn: '腓骨肌群', region: 'calf' },

  neck_scm: { cn: '胸锁乳突肌', region: 'neck' },
  neck_levator: { cn: '肩胛提肌', region: 'neck' },
  neck_suboccipital: { cn: '枕下肌群', region: 'neck' },
  neck_deep_flexor: { cn: '颈深屈肌', region: 'neck' },

  foot_tibialis_post: { cn: '胫骨后肌', region: 'foot' },
  foot_intrinsic: { cn: '足内在肌', region: 'foot' },

  tendon: { cn: '肌腱/腱膜', region: 'other', hidden: true },
  other: { cn: '其他（手足头面深层小肌）', region: 'other', hidden: true },
};

/** 关键词规则：顺序敏感，先具体后宽泛 */
const RULES = [
  // 颈
  [/obliquus capitis|rectus capitis (posterior|lateral)|suboccipital/i, 'neck_suboccipital'],
  [/longus (colli|capitis)/i, 'neck_deep_flexor'],
  [/sternocleidomastoid/i, 'neck_scm'],
  [/levator scapulae/i, 'neck_levator'],
  [/scalene|splenius|semispinalis (capitis|cervicis)|longissimus capitis/i, 'neck_deep_flexor'],

  // 胸
  [/pectoralis major/i, 'chest_pec_major'],
  [/pectoralis minor/i, 'chest_pec_minor'],
  [/serratus anterior/i, 'chest_serratus'],
  [/subclavius/i, 'chest_pec_minor'],
  [/serratus posterior/i, 'other'],

  // 肩
  [/(supraspinatus|infraspinatus|subscapularis|teres (minor|major))/i, 'shoulder_rotator_cuff'],
  [/deltoid/i, 'shoulder_deltoid'],

  // 背
  [/descending part of.*trapezius|trapezius.*descending|upper trapezius/i, 'back_trapezius_upper'],
  [/(transverse|ascending) part of.*trapezius|trapezius.*(transverse|ascending)|(middle|lower) trapezius/i, 'back_trapezius_lower'],
  [/trapezius/i, 'back_trapezius_upper'],
  [/latissimus dorsi/i, 'back_lat'],
  [/rhomboideus|rhomboid/i, 'back_rhomboid'],
  [/quadratus lumborum/i, 'back_ql'],
  [/(iliocostalis|longissimus thoracis|longissimus cervicis|spinalis|erector spinae|multifidus|rotatores|interspinales|intertransversarii)/i, 'back_erector'],

  // 臂
  [/biceps brachii|brachialis/i, 'arm_biceps'],
  [/triceps brachii/i, 'arm_triceps'],
  [/(flexor carpi|palmaris longus|pronator|flexor digitorum (superficialis|profundus)|flexor pollicis longus)/i, 'arm_forearm_flexor'],
  [/(extensor carpi|extensor digitorum|extensor pollicis|abductor pollicis longus|brachioradialis|supinator|anconeus)/i, 'arm_forearm_extensor'],

  // 核心
  [/rectus abdominis/i, 'core_rectus'],
  [/(external|internal) oblique|obliquus (externus|internus)/i, 'core_oblique'],
  [/transversus abdominis/i, 'core_transverse'],
  [/diaphragm/i, 'other'],

  // 髋臀
  [/gluteus maximus/i, 'hip_glute_max'],
  [/gluteus (medius|minimus)/i, 'hip_glute_med'],
  [/(psoas|iliacus)/i, 'hip_iliopsoas'],
  [/(tensor fasciae latae|iliotibial|gluteus minimus)/i, 'hip_tfl_itb'],
  [/(piriformis|gemellus|obturator|quadratus femoris)/i, 'hip_glute_med'],

  // 大腿
  [/(rectus femoris|vastus)/i, 'thigh_quads'],
  [/(biceps femoris|semitendinosus|semimembranosus)/i, 'thigh_hamstrings'],
  [/adductor (magnus|longus|brevis|minimus)|gracilis|pectineus/i, 'thigh_adductor'],
  [/(intercostal|subcostales|transversus thoracis|levatores costarum)/i, 'other'],
  [/(sartorius|popliteus|plantaris)/i, 'other'],

  // 小腿
  [/gastrocnemius/i, 'calf_gastroc'],
  [/soleus/i, 'calf_soleus'],
  [/tibialis anterior/i, 'calf_tibialis_ant'],
  [/tibialis posterior/i, 'foot_tibialis_post'],
  [/(peroneus|fibularis)/i, 'calf_peroneal'],

  // 足
  [/(abductor hallucis|flexor digitorum brevis|flexor hallucis|quadratus plantae|lumbrical|interossei|extensor digitorum brevis)/i, 'foot_intrinsic'],

  // 肌腱 / 腱膜 / 筋膜
  [/(tendon|aponeurosis|fascia|ligament|bursa|membrane)/i, 'tendon'],
];

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const byGroup = {};
  for (const id of Object.keys(GROUPS)) byGroup[id] = { left: [], right: [], center: [] };
  const nodeToGroup = {};
  const unmapped = [];

  for (const item of manifest.items) {
    const name = item.name;
    let hit = null;
    for (const [re, gid] of RULES) {
      if (re.test(name)) {
        hit = gid;
        break;
      }
    }
    if (!hit) {
      unmapped.push({ name, side: item.side, faces: item.faces });
      hit = 'other';
    }
    nodeToGroup[name] = hit;
    byGroup[hit][item.side]?.push(name);
  }

  const summary = Object.entries(byGroup).map(([id, sides]) => ({
    id,
    cn: GROUPS[id].cn,
    region: GROUPS[id].region,
    hidden: !!GROUPS[id].hidden,
    left: sides.left.length,
    right: sides.right.length,
    center: sides.center.length,
    total: sides.left.length + sides.right.length + sides.center.length,
  }));

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), groups: GROUPS, nodeToGroup, byGroup, summary }, null, 2),
    'utf8',
  );
  await mkdir(dirname(UNMAPPED), { recursive: true });
  await writeFile(UNMAPPED, JSON.stringify(unmapped, null, 2), 'utf8');

  console.log('[04] 肌群命中统计：');
  for (const s of summary) {
    const flag = s.total === 0 ? '  ❌ 未命中' : '';
    console.log(`     ${s.cn.padEnd(10, '　')} ${s.id.padEnd(24)} L=${s.left} R=${s.right} C=${s.center} 共${s.total}${flag}`);
  }
  const empty = summary.filter((s) => s.total === 0 && !s.hidden);
  console.log(`[04] 未命中的目标肌群：${empty.length} 个 ${empty.map((e) => e.id).join(', ')}`);
  console.log(`[04] 落入 unmapped（需人工补规则）：${unmapped.length} 个`);
  console.log(`[04] 输出：${OUTPUT}`);
  if (unmapped.length) {
    console.log('[04] unmapped 前 30 个：');
    unmapped.slice(0, 30).forEach((u) => console.log(`     - ${u.name} [${u.side}]`));
  }
}

main().catch((e) => {
  console.error('[04] 失败：', e);
  process.exit(1);
});
