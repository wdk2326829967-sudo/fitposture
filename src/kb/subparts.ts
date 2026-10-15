/**
 * 肌肉亚部（细分）层
 *
 * 来源：BodyParts3D / Z-Anatomy 的 anatomy.glb 本身就带解剖学亚部网格，
 * 例如三角肌被拆成 clavicular(锁骨部/前束) / acromial(肩峰部/中束) / spinal(脊柱部/后束)，
 * 胸大肌拆成 clavicular / sternocostal / abdominal 三部。
 * 所以"细分肌肉"不是数据编造，而是把模型里已经存在的子网格单独渲染、单独点击。
 *
 * 节点名规则：
 *  - GLTFLoader 会把空格替换成下划线（PropertyBinding.sanitizeNodeName）
 *  - 左右侧以 left / right 前缀区分
 *  - 同名 + " (2)" 表示同一块肌肉被切成多个网格片段
 */
import { GROUP_NODES } from './mesh/groups';
import { MUSCLE_META } from './mesh/registry';

export interface PartInfo {
  /** `${groupId}:${key}`，全局唯一 */
  id: string;
  /** 所属肌群 */
  groupId: string;
  /** 亚部短键，用于 URL */
  key: string;
  /** 完整中文名，如「三角肌前束」 */
  cn: string;
  /** 短名，如「前束」 */
  short: string;
  /** 英文名 */
  en: string;
  /** 功能 / 训练定位一句话 */
  note?: string;
  /** 在同一肌群内的排序 */
  rank: number;
  /** 该亚部在 HSL 色环上的色相偏移，用于 3D 分色 */
  hue: number;
}

interface PartDef {
  /** 归一化后的网格基础名（已去掉左右前缀与 (2) 后缀） */
  match: string;
  key: string;
  cn: string;
  note?: string;
  rank?: number;
  /** cn 只是"前束/上部"这类修饰词，需要拼上父肌群名，如 三角肌前束 */
  prefix?: boolean;
}

const DUP_RE = /[_\s]+\(\d+\)$/;

/**
 * 去掉左右标识（节点名形如 "left vastus lateralis"，也有 "set of dorsal interossei of left hand"
 * 这种把 left 放在中间的情况）以及重复片段后缀 " (2)"。
 */
export function baseMeshName(name: string): string {
  let s = name.trim().replace(/_/g, ' ');
  s = s.replace(DUP_RE, '');
  s = s.replace(/\b(left|right)\b\s*/gi, '');
  return s.replace(/\s+/g, ' ').trim();
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'part'
  );
}

// ───────────────────────── 亚部字典 ─────────────────────────
// match 必须是上面 baseMeshName() 的输出（全小写拼写参照 GLB 节点名）

const GROUP_PART_DEF: Record<string, PartDef[]> = {
  shoulder_deltoid: [
    { match: 'clavicular part of deltoid', key: 'anterior', cn: '前束', rank: 1, prefix: true, note: '肩关节前屈、水平内收；推类动作贡献大，最容易被练到也最容易代偿紧张' },
    { match: 'acromial part of deltoid', key: 'middle', cn: '中束', rank: 2, prefix: true, note: '肩关节外展的主力，决定肩膀宽度；需要单独用侧平举类动作刺激' },
    { match: 'spinal part of deltoid', key: 'posterior', cn: '后束', rank: 3, prefix: true, note: '肩关节后伸、水平外展；改善圆肩最该补的一块，日常几乎用不到' },
  ],

  chest_pec_major: [
    { match: 'clavicular part of pectoralis major', key: 'clavicular', cn: '上部（上胸）', rank: 1, prefix: true, note: '肩关节屈曲 + 水平内收（由下往上推），决定上胸饱满度' },
    { match: 'sternocostal part of pectoralis major', key: 'sternocostal', cn: '中部（中胸）', rank: 2, prefix: true, note: '水平内收主力，平板推类动作的主力军' },
    { match: 'abdominal part of pectoralis major', key: 'abdominal', cn: '下部（下胸）', rank: 3, prefix: true, note: '肩内收下压（由上往下），决定胸腹过渡的下缘轮廓' },
  ],

  shoulder_rotator_cuff: [
    { match: 'supraspinatus', key: 'supraspinatus', cn: '冈上肌', rank: 1, note: '启动肩关节外展的头 15°，也是最常损伤的一块；用小重量、精准角度练' },
    { match: 'infraspinatus muscle', key: 'infraspinatus', cn: '冈下肌', rank: 2, note: '肩外旋主力，和中下斜方一起把肩关节往后拉，改善圆肩' },
    { match: 'teres minor', key: 'teres_minor', cn: '小圆肌', rank: 3, note: '外旋协同，和冈下肌一起训练' },
    { match: 'subscapularis', key: 'subscapularis', cn: '肩胛下肌', rank: 4, note: '唯一的内旋肌，负责把肱骨头压回关节窝；太紧会限制外旋、导致抬手受限' },
    { match: 'teres major', key: 'teres_major', cn: '大圆肌', rank: 5, note: '内收 + 后伸，和背阔肌协作（引体／划船的协同肌）' },
  ],

  back_trapezius_lower: [
    { match: 'transverse part of trapezius', key: 'middle', cn: '斜方肌中束', rank: 1, note: '肩胛骨后缩的主力，把所有"拉"的动作落到实处' },
    { match: 'ascending part of trapezius', key: 'lower', cn: '斜方肌下束', rank: 2, note: '肩胛骨下沉 + 上回旋，抬手时压住耸肩，圆肩和上斜方紧张的关键解药' },
  ],

  back_rhomboid: [
    { match: 'rhomboid minor', key: 'minor', cn: '小菱形肌', rank: 1, note: '肩胛骨后缩 + 轻微上提' },
    { match: 'rhomboid major', key: 'major', cn: '大菱形肌', rank: 2, note: '肩胛骨后缩主力，和上束斜方互为拮抗' },
  ],

  back_erector: [
    { match: 'iliocostalis lumborum', key: 'iliocostalis_lum', cn: '腰髂肋肌（最外侧柱）', rank: 1, note: '竖脊肌最外侧，控制侧屈与抗侧倾' },
    { match: 'longissimus thoracis', key: 'longissimus_thor', cn: '胸最长肌（中间柱）', rank: 2, note: '贯穿胸段，伸脊柱抗屈的主力' },
    { match: 'spinalis thoracis', key: 'spinalis_thor', cn: '胸棘肌（最内侧柱）', rank: 3, note: '贴着棘突，负责精细的节段伸展控制' },
    { match: 'iliocostalis thoracis', key: 'iliocostalis_thor', cn: '胸髂肋肌', rank: 4 },
    { match: 'iliocostalis cervicis', key: 'iliocostalis_cerv', cn: '颈髂肋肌', rank: 5 },
    { match: 'longissimus cervicis', key: 'longissimus_cerv', cn: '颈最长肌', rank: 6 },
    { match: 'semispinalis thoracis', key: 'semispinalis_thor', cn: '胸半棘肌', rank: 7 },
    { match: 'multifidus lumborum', key: 'multifidus_lum', cn: '腰多裂肌', rank: 8, note: '最深层的节段稳定肌，腰痛康复的核心目标' },
    { match: 'multifidus thoracis', key: 'multifidus_thor', cn: '胸多裂肌', rank: 9 },
    { match: 'multifidus cervicis', key: 'multifidus_cerv', cn: '颈多裂肌', rank: 10 },
    { match: 'rotatores', key: 'rotatores', cn: '回旋肌', rank: 11 },
    { match: 'interspinalis thoracis', key: 'interspinalis', cn: '胸棘间肌', rank: 12 },
    { match: 'set of interspinales lumborum', key: 'interspinales_lum', cn: '腰棘间肌', rank: 13 },
    { match: 'set of interspinales cervicis', key: 'interspinales_cerv', cn: '颈棘间肌', rank: 14 },
    { match: 'set of anterior cervical intertransversarii', key: 'intertransv_ant', cn: '颈横突间肌（前组）', rank: 15 },
    { match: 'set of posterior cervical intertransversarii', key: 'intertransv_post', cn: '颈横突间肌（后组）', rank: 16 },
    { match: 'spinalis', key: 'spinalis', cn: '棘肌', rank: 17 },
  ],

  arm_biceps: [
    { match: 'long head of biceps brachii', key: 'long_head', cn: '长头', rank: 1, prefix: true, note: '跨过肩关节，肩膀后伸（手臂在身后）时发力最强，练出肱二头肌外侧峰的高度' },
    { match: 'short head of biceps brachii', key: 'short_head', cn: '短头', rank: 2, prefix: true, note: '只跨肘关节，屈臂位置在身前时发力最强，决定内侧的"肉峰"' },
    { match: 'brachialis', key: 'brachialis', cn: '肱肌', rank: 3, note: '藏在二头下面，练厚了会把二头整个顶高；锤式弯举主要刺激它' },
    { match: 'coracobrachialis', key: 'coracobrachialis', cn: '喙肱肌', rank: 4, note: '细小，负责肩屈与稳定，无需单独练' },
  ],

  arm_triceps: [
    { match: 'long head of triceps brachii', key: 'long_head', cn: '长头', rank: 1, prefix: true, note: '唯一跨肩的两个头里的大头，手臂举过头时才会充分拉长；决定手臂后侧的体积' },
    { match: 'lateral head of triceps brachii', key: 'lateral_head', cn: '外侧头', rank: 2, prefix: true, note: '从背面看手臂外侧那条线，主要靠下压类动作' },
    { match: 'medial head of triceps brachii', key: 'medial_head', cn: '内侧头', rank: 3, prefix: true, note: '深层小块，负责肘最后的锁死；所有动作都会带到，靠全程张力刺激' },
  ],

  core_oblique: [
    { match: 'external oblique', key: 'external', cn: '腹外斜肌', rank: 1, note: '对侧旋转 + 侧屈；练太厚会让腰显粗，负重旋转要克制' },
    { match: 'internal oblique', key: 'internal', cn: '腹内斜肌', rank: 2, note: '同侧旋转 + 抗旋转，和腹横肌一起做"天然护腰"的稳定工作' },
  ],

  hip_glute_med: [
    { match: 'gluteus medius', key: 'medius', cn: '臀中肌', rank: 1, note: '单腿站立时防止骨盆掉下去；决定臀外侧线条，走路晃、膝盖内扣都和它有关' },
    { match: 'gluteus minimus', key: 'minimus', cn: '臀小肌', rank: 2, note: '最深层的髋外展肌，负责股骨头在髋臼里的稳定' },
    { match: 'tensor fasciae latae', key: 'tfl', cn: '阔筋膜张肌', rank: 3, note: '容易代偿抢活；放松它才能让臀中肌真正发力' },
    { match: 'piriformis', key: 'piriformis', cn: '梨状肌', rank: 4, note: '久坐容易紧张卡压坐骨神经，以放松/拉伸为主' },
    { match: 'gemellus superior', key: 'gemellus_sup', cn: '上孖肌', rank: 5 },
    { match: 'gemellus inferior', key: 'gemellus_inf', cn: '下孖肌', rank: 6 },
    { match: 'obturator internus', key: 'obturator_int', cn: '内闭孔肌', rank: 7 },
    { match: 'obturator externus', key: 'obturator_ext', cn: '外闭孔肌', rank: 8 },
    { match: 'quadratus femoris', key: 'quadratus_fem', cn: '股方肌', rank: 9 },
  ],

  hip_iliopsoas: [
    { match: 'psoas major', key: 'psoas', cn: '腰大肌', rank: 1, note: '唯一连接腰椎和大腿的肌肉，久坐会缩短，让骨盆前倾' },
    { match: 'iliacus', key: 'iliacus', cn: '髂肌', rank: 2, note: '从髂骨到股骨，和腰大肌合成髂腰肌' },
  ],

  hip_tfl_itb: [
    { match: 'tensor fasciae latae', key: 'tfl', cn: '阔筋膜张肌', rank: 1, note: '髋屈 + 外展，容易紧张，先放松再练臀' },
    { match: 'iliotibial tract', key: 'it_band', cn: '髂胫束', rank: 2, note: '筋膜带而非肌肉，不能拉伸到变长，靠泡沫轴放松 + 练臀中肌缓解' },
  ],

  thigh_quads: [
    { match: 'rectus femoris', key: 'rectus_femoris', cn: '股直肌', rank: 1, note: '股四头里唯一跨髋的，同时屈髋伸膝；髋伸展位（如箭步蹲后腿）刺激最大' },
    { match: 'vastus lateralis', key: 'vastus_lateralis', cn: '股外侧肌', rank: 2, note: '膝盖外侧最大的一块，决定大腿外侧轮廓' },
    { match: 'vastus medialis', key: 'vastus_medialis', cn: '股内侧肌', rank: 3, note: '髌骨内侧的"水滴形"，负责髌骨轨迹，膝痛康复必练' },
    { match: 'vastus intermedius', key: 'vastus_intermedius', cn: '股中间肌', rank: 4, note: '深层被盖住，所有伸膝动作都会带到' },
  ],

  thigh_hamstrings: [
    { match: 'semitendinosus', key: 'semitendinosus', cn: '半腱肌', rank: 1, note: '内侧腘绳，和小腿深筋膜一起做旋转控制；脚尖朝外旋外部位屈膝刺激更强' },
    { match: 'semimembranosus', key: 'semimembranosus', cn: '半膜肌', rank: 2, note: '内侧最深的一块，负责关节囊稳定' },
    { match: 'long head of biceps femoris', key: 'biceps_long', cn: '股二头肌长头', rank: 3, note: '跨髋，所有硬拉类（伸髋）动作主要刺激它' },
    { match: 'short head of biceps femoris', key: 'biceps_short', cn: '股二头肌短头', rank: 4, note: '只跨膝，坐姿腿弯举（屈髋位）对它刺激最大' },
  ],

  thigh_adductor: [
    { match: 'adductor magnus', key: 'magnus', cn: '大收肌', rank: 1, note: '内收肌里最大，同时参与伸髋（接近腘绳功能）' },
    { match: 'adductor longus', key: 'longus', cn: '长收肌', rank: 2, note: '最容易拉伤的一块，腹股沟痛的常见来源' },
    { match: 'adductor brevis', key: 'brevis', cn: '短收肌', rank: 3 },
    { match: 'adductor minimus', key: 'minimus', cn: '小收肌', rank: 4 },
    { match: 'gracilis', key: 'gracilis', cn: '股薄肌', rank: 5, note: '跨越膝髋，也参与屈膝内旋' },
    { match: 'pectineus', key: 'pectineus', cn: '耻骨肌', rank: 6 },
  ],

  calf_gastroc: [
    { match: 'medial head of gastrocnemius', key: 'medial_head', cn: '内侧头', rank: 1, prefix: true, note: '更大更靠下，直腿提踵的主角；脚尖朝外向(toes out)负重更多落在它身上' },
    { match: 'lateral head of gastrocnemius', key: 'lateral_head', cn: '外侧头', rank: 2, prefix: true, note: '偏外侧上部；脚尖朝内(toes in)时受力更多' },
  ],

  calf_peroneal: [
    { match: 'fibularis longus', key: 'longus', cn: '腓骨长肌', rank: 1, note: '足外翻 + 跖屈，和胫骨后肌一起维持足弓' },
    { match: 'fibularis brevis', key: 'brevis', cn: '腓骨短肌', rank: 2 },
    { match: 'fibularis tertius', key: 'tertius', cn: '第三腓骨肌', rank: 3 },
  ],

  chest_pec_minor: [
    { match: 'pectoralis minor', key: 'minor', cn: '胸小肌', rank: 1, note: '把肩胛往前往下拉，紧张会造成含胸；以放松为主' },
    { match: 'subclavius', key: 'subclavius', cn: '锁骨下肌', rank: 2 },
  ],

  neck_suboccipital: [
    { match: 'rectus capitis posterior major', key: 'major', cn: '头后大直肌', rank: 1, note: '头痛、头晕、颈后根发紧的常见来源，放松为主' },
    { match: 'rectus capitis posterior minor', key: 'minor', cn: '头后小直肌', rank: 2 },
    { match: 'rectus capitis lateralis', key: 'lateralis', cn: '头外侧直肌', rank: 3 },
  ],

  neck_deep_flexor: [
    { match: 'longus capitis', key: 'longus_capitis', cn: '头长肌', rank: 1, note: '屈颈 + 稳定上颈段，头前倾者通常无力' },
    { match: 'longissimus capitis', key: 'longissimus_capitis', cn: '头最长肌', rank: 2 },
    { match: 'vertical intermediate part of longus colli', key: 'longus_colli_vert', cn: '颈长肌垂直部', rank: 3, note: '深层颈屈肌核心，"收下巴"练的就是这一组' },
    { match: 'superior oblique part of longus colli', key: 'longus_colli_sup', cn: '颈长肌上斜部', rank: 4 },
    { match: 'inferior oblique part of longus colli', key: 'longus_colli_inf', cn: '颈长肌下斜部', rank: 5 },
    { match: 'semispinalis capitis', key: 'semispinalis_capitis', cn: '头半棘肌', rank: 6 },
    { match: 'semispinalis cervicis', key: 'semispinalis_cervicis', cn: '颈半棘肌', rank: 7 },
    { match: 'splenius capitis', key: 'splenius_capitis', cn: '头夹肌', rank: 8 },
    { match: 'splenius cervicis', key: 'splenius_cervicis', cn: '颈夹肌', rank: 9 },
  ],

  foot_intrinsic: [
    { match: 'abductor hallucis', key: 'abductor_hallucis', cn: '拇展肌', rank: 1, note: '维持内侧纵弓，扁平足最该练的一块' },
    { match: 'flexor digitorum brevis', key: 'flexor_dig_brevis', cn: '趾短屈肌', rank: 2 },
    { match: 'flexor hallucis longus', key: 'flexor_hallucis_longus', cn: '拇长屈肌', rank: 3 },
    { match: 'medial head of flexor hallucis brevis', key: 'fhb_medial', cn: '拇短屈肌内侧头', rank: 4 },
    { match: 'lateral head of flexor hallucis brevis', key: 'fhb_lateral', cn: '拇短屈肌外侧头', rank: 5 },
    { match: 'flexor accessorius', key: 'quadratus_pl', cn: '足底方肌', rank: 6 },
    { match: 'first lumbrical of foot', key: 'lumbrical_1', cn: '第一蚓状肌', rank: 7 },
    { match: 'second lumbrical of foot', key: 'lumbrical_2', cn: '第二蚓状肌', rank: 8 },
    { match: 'third lumbrical of foot', key: 'lumbrical_3', cn: '第三蚓状肌', rank: 9 },
    { match: 'fourth lumbrical of foot', key: 'lumbrical_4', cn: '第四蚓状肌', rank: 10 },
    { match: 'set of dorsal interossei of hand', key: 'interossei_dorsal', cn: '骨间背侧肌', rank: 11 },
    { match: 'set of palmar interossei of hand', key: 'interossei_palmar', cn: '骨间掌侧肌', rank: 12 },
    { match: 'set of lumbricals of hand', key: 'lumbricals_hand', cn: '手部蚓状肌', rank: 13 },
  ],
};

// ───────────────────────── 前臂等细碎肌群：由术语字典自动翻译 ─────────────────────────

const TERM_CN: [RegExp, string][] = [
  [/\bextensor digitorum longus\b/, '趾长伸肌'],
  [/\bbrachioradialis\b/, '肱桡肌'],
  [/\bflexor carpi radialis\b/, '桡侧腕屈肌'],
  [/\bflexor carpi ulnaris\b/, '尺侧腕屈肌'],
  [/\bextensor carpi radialis longus\b/, '桡侧腕长伸肌'],
  [/\bextensor carpi radialis brevis\b/, '桡侧腕短伸肌'],
  [/\bextensor carpi ulnaris\b/, '尺侧腕伸肌'],
  [/\bflexor digitorum superficialis\b/, '指浅屈肌'],
  [/\bflexor digitorum profundus\b/, '指深屈肌'],
  [/\bextensor digitorum\b/, '指伸肌'],
  [/\bextensor pollicis longus\b/, '拇长伸肌'],
  [/\bextensor pollicis brevis\b/, '拇短伸肌'],
  [/\babductor pollicis longus\b/, '拇长展肌'],
  [/\bflexor pollicis longus\b/, '拇长屈肌'],
  [/\bpronator teres\b/, '旋前圆肌'],
  [/\bpronator quadratus\b/, '旋前方肌'],
  [/\bsupinator\b/, '旋后肌'],
  [/\banconeus\b/, '肘肌'],
  [/\bpalmaris longus\b/, '掌长肌'],
];

const PART_WORD_CN: Record<string, string> = {
  'humeral head': '肱头',
  'ulnar head': '尺头',
  'radial head': '桡头',
  'long head': '长头',
  'short head': '短头',
  'lateral head': '外侧头',
  'medial head': '内侧头',
};

function fallbackPart(base: string): { cn: string; short: string; en: string } {
  let cn = '';
  for (const [re, val] of TERM_CN) {
    if (re.test(base)) {
      cn = val;
      break;
    }
  }
  if (!cn) {
    // 退化：按单词表拼
    const words = base.split(/\s+/);
    cn = words.map((w) => PART_WORD_CN[w] ?? w).join(' ');
  }
  // 补「头」修饰
  for (const [en, headCn] of Object.entries(PART_WORD_CN)) {
    if (base.toLowerCase().includes(en)) {
      const main = cn.replace(headCn, '').trim();
      cn = `${main}${main && headCn ? '·' : ''}${headCn}`;
      break;
    }
  }
  const en = base.replace(/(^| )\S/g, (m) => m.toUpperCase());
  return { cn: cn || en, short: cn || base, en };
}

// ───────────────────────── 查询 API ─────────────────────────

function defsOf(groupId: string): PartDef[] {
  return GROUP_PART_DEF[groupId] ?? [];
}

const cache = new Map<string, PartInfo[]>();

/** 列出某肌群的所有亚部（左右合并为一个亚部）；没有细分的肌群返回空数组 */
export function listParts(groupId: string): PartInfo[] {
  const cached = cache.get(groupId);
  if (cached) return cached;

  const nodes = GROUP_NODES[groupId];
  const defs = defsOf(groupId);
  if (!nodes) {
    cache.set(groupId, []);
    return [];
  }

  const names = [...nodes.left, ...nodes.right, ...nodes.center];
  // 归一化后去重
  const bases = [...new Set(names.map(baseMeshName))];
  if (bases.length < 2) {
    cache.set(groupId, []);
    return [];
  }

  const parentCn = MUSCLE_META[groupId]?.cn ?? groupId;
  const total = bases.length;

  const list: PartInfo[] = bases.map((base) => {
    const def = defs.find((d) => d.match.toLowerCase() === base.toLowerCase());
    let cn: string;
    let en: string;
    let note: string | undefined;
    let key: string;
    let rank: number;

    if (def) {
      cn = def.cn;
      en = base.replace(/(^| )\S/g, (m) => m.toUpperCase());
      note = def.note;
      key = def.key;
      rank = def.rank ?? 90;
    } else {
      const fb = fallbackPart(base);
      cn = fb.cn;
      en = fb.en;
      key = slug(base);
      rank = 95;
    }

    const index = bases.filter((b) => (defs.find((d) => d.match.toLowerCase() === b.toLowerCase())?.rank ?? 95) < rank).length;

    return {
      id: `${groupId}:${key}`,
      groupId,
      key,
      cn: def?.prefix ? `${parentCn}${cn}` : cn,
      short: cn,
      en,
      note,
      rank,
      // 色相：在父肌群周围均分，避开 0°(红) 太刺眼，从 20° 开始
      hue: (20 + (index * 300) / Math.max(total, 1)) % 360,
    };
  });

  list.sort((a, b) => a.rank - b.rank || a.cn.localeCompare(b.cn, 'zh'));
  // 排序后重算色相，保证视觉顺序一致
  list.forEach((p, i) => {
    p.hue = (20 + (i * 300) / Math.max(list.length, 1)) % 360;
  });

  cache.set(groupId, list);
  return list;
}

const baseMap = new Map<string, PartInfo | null>();

/** 给定 GLB 网格节点名，反查它属于哪个亚部 */
export function partOfMesh(groupId: string, meshName: string): PartInfo | null {
  const parts = listParts(groupId);
  if (!parts.length) return null;
  const base = baseMeshName(meshName);
  const cacheKey = `${groupId}|${base.toLowerCase()}`;
  if (baseMap.has(cacheKey)) return baseMap.get(cacheKey) ?? null;

  let hit: PartInfo | null = null;
  for (const p of parts) {
    // PartInfo.en 保留了归一化后的英文基础名
    if (p.en.toLowerCase() === base.toLowerCase()) {
      hit = p;
      break;
    }
  }
  baseMap.set(cacheKey, hit);
  return hit;
}

export function getPart(partId: string): PartInfo | undefined {
  const idx = partId.lastIndexOf(':');
  if (idx < 0) return undefined;
  const groupId = partId.slice(0, idx);
  const key = partId.slice(idx + 1);
  return listParts(groupId).find((p) => p.key === key);
}

/** 该肌群是否可在 3D 里细分 */
export function isSubdividable(groupId: string): boolean {
  return listParts(groupId).length > 1;
}

/** 亚部显示色（HSL → 颜色字符串）。
 * 注意必须用逗号分隔的 hsl() 老语法，THREE.Color 不支持空格分隔的 CSS4 写法（会退化成白色）。
 */
export function partColor(part: PartInfo, sat = 70, light = 56): string {
  return `hsl(${Math.round(part.hue)}, ${sat}%, ${light}%)`;
}
