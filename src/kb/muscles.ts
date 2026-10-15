import type { Muscle, MuscleId, ProblemType, Solution } from './types';
import { MUSCLE_META } from './mesh/registry';

interface MuscleDetail {
  origin: string;
  insertion: string;
  action: string;
  nerve: string;
  problems: Partial<Record<ProblemType, Solution>>;
  cautions?: string[];
}

/** 通用免责声明（各方案共用，避免重复书写） */
const DISCLAIMER = '以上为健身科普建议，非医疗诊断。若疼痛持续加重、影响日常生活或出现麻木无力，请咨询医生或物理治疗师。';

const RED_FLAGS_COMMON = [
  '大小便失禁或会阴部（鞍区）麻木——需立即就医',
  '进行性加重的肢体无力或麻木',
  '外伤后畸形、无法负重',
  '夜间痛醒、伴发热或不明原因体重下降',
];

const SEE_DOCTOR_COMMON = '疼痛超过 2 周无改善、出现麻木/放射痛/无力、夜间痛醒或影响睡眠，建议就医或找物理治疗师评估。';

/** 只给 hypertrophy 时的通用模板 */
function hypertrophy(opts: { strengthen: string[]; activate?: string[]; progression: string; criteria?: string }): Solution {
  return {
    criteria: opts.criteria ?? '目标是让这块肌肉变厚变大（肌肥大）。判断方式：目标肌肉在训练后有明显泵感与酸胀，且 6-8 周内围度或力量有可测量增长。',
    redFlags: RED_FLAGS_COMMON,
    activate: opts.activate ?? [],
    strengthen: opts.strengthen,
    progression: opts.progression,
    seeDoctor: SEE_DOCTOR_COMMON,
    disclaimer: DISCLAIMER,
  };
}

const MUSCLE_DETAILS: Record<string, MuscleDetail> = {
  // ───────────── 胸部 ─────────────
  chest_pec_major: {
    origin: '锁骨内侧半、胸骨、上 6 肋软骨、腹直肌鞘前层',
    insertion: '肱骨大结节嵴',
    action: '肩关节内收、内旋、屈曲（锁骨部）；使上臂向前向内靠拢',
    nerve: '胸外侧神经与胸内侧神经（C5-T1）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_bench_press', 'ex_incline_db_press', 'ex_cable_fly', 'ex_dip_chest', 'ex_pushup', 'ex_pec_deck'],
        progression: '每周安排 10-20 组正式组，重量取 8-12RM。先增力量（4-6 次大重量）再增容量（12-15 次），每 4-6 周调整一次动作顺序或角度（平板/上斜/夹胸轮换）。',
      }),
    },
    cautions: ['胸肌紧张会加重圆肩，练胸的同时务必练背与拉伸胸小肌'],
  },
  chest_pec_minor: {
    origin: '第 3-5 肋骨前面',
    insertion: '肩胛骨喙突',
    action: '拉肩胛骨向前下方（前倾、下回旋）',
    nerve: '胸内侧神经（C8-T1）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_pec_stretch_doorway', 'ex_wall_angel', 'ex_band_pullapart'],
        progression: '胸小肌不需要"练大"，它过紧是圆肩的元凶。重点是拉伸放松 + 强化中下斜方肌与菱形肌来平衡。',
        criteria: '胸小肌属于深层稳定肌，一般不以增大为目标。它过紧会把肩胛拉向前倾，导致圆肩与肩峰下撞击。',
      }),
    },
  },
  chest_serratus: {
    origin: '第 1-9 肋骨外侧面',
    insertion: '肩胛骨内侧缘（腹侧面）',
    action: '拉肩胛骨向前、上回旋，使肩胛紧贴胸廓',
    nerve: '胸长神经（C5-C7）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_wall_angel', 'ex_scapular_pullup'],
        strengthen: ['ex_band_pullapart', 'ex_face_pull'],
        progression: '前锯肌无力会出现"翼状肩胛"。训练重点是肩胛前伸（推的动作末端把肩胛推出去）与上回旋控制，而非大重量。',
      }),
    },
  },

  // ───────────── 背部 ─────────────
  back_lat: {
    origin: '下 6 胸椎与全部腰椎棘突、骶正中嵴、髂嵴后部、下 3-4 肋骨',
    insertion: '肱骨结节间沟底',
    action: '肩关节内收、后伸、内旋；攀爬时把躯干拉向手臂',
    nerve: '胸背神经（C6-C8）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_pullup', 'ex_lat_pulldown', 'ex_barbell_row', 'ex_db_row', 'ex_straight_arm_pulldown', 'ex_seated_cable_row'],
        progression: '背部要兼顾"垂直拉"（引体/下拉）与"水平拉"（划船）两类。每周 10-20 组，重量 8-12RM，末端注意挤压肩胛。',
      }),
    },
    cautions: ['背阔肌过紧会限制过顶活动度，练完要做拉伸'],
  },
  back_trapezius_upper: {
    origin: '枕外隆凸、项韧带、C7 棘突',
    insertion: '锁骨外侧 1/3',
    action: '上提肩胛骨、协助肩胛上回旋',
    nerve: '副神经（CN XI）与 C3-C4',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_shrug', 'ex_upright_row'],
        progression: '上斜方肌在耸肩、硬拉、划船时都会参与。多数人它本来就过度紧张（久坐耸肩），训练建议以中下斜方为主、上斜方适度即可，避免过度发达加重"溜肩"观感。',
        criteria: '上斜方肌是多数人过度紧张的部位（压力大、久坐时会不自觉耸肩）。通常更需要放松而非强化。',
      }),
    },
  },
  back_trapezius_lower: {
    origin: 'T4-T12 棘突（中束）、T6-T12（下束）',
    insertion: '肩胛冈、肩峰、肩胛冈内侧端',
    action: '肩胛后缩（中束）、下沉与上回旋（下束）',
    nerve: '副神经（CN XI）与 C3-C4',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_prone_y', 'ex_scapular_pullup', 'ex_wall_angel'],
        strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_band_pullapart', 'ex_cuban_press'],
        progression: '中下斜方肌是改善圆肩驼背的核心。用小重量高次数（15-20 次），重点感受肩胛下沉后缩，每周 2-3 次。',
        criteria: '这块肌肉几乎人人偏弱。强化它能把前倾的肩胛拉回来，是改善圆肩、头前伸最有效的训练之一。',
      }),
    },
  },
  back_rhomboid: {
    origin: 'C7-T1（小菱形肌）、T2-T5 棘突（大菱形肌）',
    insertion: '肩胛骨内侧缘',
    action: '肩胛后缩、上提、下回旋',
    nerve: '肩胛背神经（C5）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_band_pullapart', 'ex_wall_angel'],
        strengthen: ['ex_reverse_fly', 'ex_face_pull', 'ex_db_row', 'ex_seated_cable_row'],
        progression: '菱形肌与中下斜方协同工作。划船类动作末端刻意停顿 1-2 秒夹紧肩胛，每周 2-3 次、12-20 次。',
      }),
    },
  },
  back_erector: {
    origin: '骶骨背面、髂嵴、腰椎棘突',
    insertion: '肋骨角、椎骨横突与棘突、颞骨乳突',
    action: '脊柱后伸、维持直立姿势',
    nerve: '脊神经后支',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_romanian_deadlift', 'ex_squat', 'ex_barbell_row'],
        progression: '竖脊肌在深蹲、硬拉中作为稳定肌得到充分锻炼，一般不需单独练。有腰痛者先强化核心与臀肌，再渐进负重。',
        criteria: '竖脊肌是维持直立的关键。多数腰痛与它的耐力不足、以及臀肌"失忆"有关。',
      }),
    },
    cautions: ['急性腰痛期不要做负重脊柱屈伸'],
  },
  back_ql: {
    origin: '髂嵴后部',
    insertion: '第 12 肋、L1-L4 横突',
    action: '脊柱侧屈、固定第 12 肋协助呼吸',
    nerve: 'T12-L3 神经前支',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_single_leg_balance', 'ex_side_plank'],
        progression: '腰方肌过紧是很多腰痛与骨盆侧倾的元凶，通常要放松而非强化。强化重点放在臀中肌与核心。',
      }),
    },
  },

  // ───────────── 肩部 ─────────────
  shoulder_deltoid: {
    origin: '锁骨外侧 1/3（前束）、肩峰（中束）、肩胛冈（后束）',
    insertion: '肱骨三角肌粗隆',
    action: '前束：肩屈曲内旋；中束：肩外展；后束：肩后伸外旋',
    nerve: '腋神经（C5-C6）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_ohp', 'ex_lateral_raise', 'ex_front_raise', 'ex_rear_delt_fly', 'ex_cable_lateral_raise', 'ex_upright_row'],
        progression: '肩部要三束均衡：前束在推类动作里已练很多，重点补中束（侧平举）与后束（反向飞鸟）。每周 12-20 组，中后束可用 15-20 次高次数。',
      }),
    },
    cautions: ['肩峰下疼痛时避免过顶推举与直立划船，先做肩袖强化'],
  },
  shoulder_rotator_cuff: {
    origin: '肩胛骨冈上窝、冈下窝、肩胛下窝、肩胛骨外侧缘',
    insertion: '肱骨大结节（冈上/冈下/小圆）、肱骨小结节（肩胛下）',
    action: '动态稳定肱骨头，肩外展启动、外旋、内旋',
    nerve: '肩胛上神经、腋神经、肩胛下神经',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_external_rotation', 'ex_internal_rotation', 'ex_side_lying_er'],
        strengthen: ['ex_cuban_press', 'ex_face_pull'],
        progression: '肩袖是稳定肌，永远用小重量（1-3kg 或轻弹力带）、15-25 次。把它当作"保养"每天做，而不是追求增大。',
        criteria: '肩袖肌群的目标不是变大，而是稳定肩关节、预防损伤。所有过顶动作前都应先激活它。',
      }),
    },
  },

  // ───────────── 手臂 ─────────────
  arm_biceps: {
    origin: '肩胛骨盂上结节（长头）、喙突（短头）',
    insertion: '桡骨粗隆、前臂筋膜',
    action: '屈肘、前臂旋后、协助屈肩',
    nerve: '肌皮神经（C5-C6）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_barbell_curl', 'ex_db_curl', 'ex_hammer_curl', 'ex_cable_curl', 'ex_chinup'],
        progression: '每周 10-20 组。兼顾三种肘位：身前（张力在长头）、身后（短头）、中立握（肱肌）。慢放离心 3 秒效果好。',
      }),
    },
  },
  arm_triceps: {
    origin: '肩胛骨盂下结节（长头）、肱骨后面（内侧头/外侧头）',
    insertion: '尺骨鹰嘴',
    action: '伸肘；长头协助肩后伸',
    nerve: '桡神经（C6-C8）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_close_grip_bench', 'ex_triceps_pushdown', 'ex_overhead_extension', 'ex_skull_crusher', 'ex_dip_triceps'],
        progression: '三头占上臂体积 2/3，想让手臂变粗优先练它。每周 10-16 组，包含过顶动作（拉长长头）与下压（外侧头）。',
      }),
    },
  },
  arm_forearm_flexor: {
    origin: '肱骨内上髁（屈肌总腱）',
    insertion: '腕骨、掌骨、指骨',
    action: '屈腕、屈指、前臂旋前',
    nerve: '正中神经、尺神经',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_hammer_curl'],
        progression: '前臂主要靠硬拉、农夫行走、握力训练与锤式弯举带动。每周 2-3 次，高次数（15-25 次）效果更好。',
      }),
    },
  },
  arm_forearm_extensor: {
    origin: '肱骨外上髁（伸肌总腱）',
    insertion: '掌骨、指背腱膜',
    action: '伸腕、伸指',
    nerve: '桡神经深支',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_tibialis_raise'],
        progression: '伸肌群常因过度使用而紧张（网球肘）。多做反向腕弯举与伸展，并放松前臂伸肌。',
      }),
    },
  },

  // ───────────── 核心 ─────────────
  core_rectus: {
    origin: '耻骨嵴与耻骨联合',
    insertion: '第 5-7 肋软骨、胸骨剑突',
    action: '脊柱屈曲、降肋、增加腹内压',
    nerve: 'T7-T12 肋间神经',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_dead_bug'],
        strengthen: ['ex_cable_crunch', 'ex_reverse_crunch', 'ex_hanging_leg_raise', 'ex_ab_wheel', 'ex_plank'],
        progression: '腹肌和其他肌肉一样需要抗阻渐进，光做仰卧起坐不够。每周 3 次、选 2-3 个动作、能做负重就负重（绳索卷腹、健腹轮）。体脂高时腹肌练再大也看不出来。',
        criteria: '想看到腹肌线条，训练 + 体脂管理缺一不可。男性一般体脂 12% 以下、女性 20% 以下才明显。',
      }),
    },
  },
  core_oblique: {
    origin: '第 5-12 肋骨外侧面（腹外斜肌）',
    insertion: '髂嵴、腹白线（经腹直肌鞘）',
    action: '脊柱侧屈与旋转、增加腹内压',
    nerve: 'T8-T12 肋间神经、髂腹下神经',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_side_plank', 'ex_russian_twist', 'ex_pallof_press'],
        progression: '腹斜肌不宜过度肥大（会让腰显粗）。重点练抗旋转与抗侧屈（帕洛夫推举、单边负重行走），而不是大量转体。',
      }),
    },
  },
  core_transverse: {
    origin: '第 7-12 肋软骨内面、髂嵴、胸腰筋膜',
    insertion: '腹白线',
    action: '压缩腹腔、稳定脊柱与骨盆（天然的"腰带"）',
    nerve: 'T7-L1 神经前支',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_dead_bug', 'ex_plank'],
        strengthen: ['ex_ab_wheel', 'ex_pallof_press'],
        progression: '腹横肌是深层稳定肌，靠低负荷持续收缩训练（死虫、平板、真空腹）。它对"收紧腰围"与保护腰椎最重要。',
        criteria: '腹横肌不产生可见的"块状"肌肉，但它是天然的护腰。训练目标是耐力与控制，不是体积。',
      }),
    },
  },

  // ───────────── 髋臀 ─────────────
  hip_glute_max: {
    origin: '髂骨翼外面、骶骨与尾骨后面、骶结节韧带',
    insertion: '臀肌粗隆、髂胫束',
    action: '髋关节后伸、外旋、外展（上部）；人体最大的肌肉',
    nerve: '臀下神经（L5-S2）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_glute_bridge', 'ex_clamshell'],
        strengthen: ['ex_hip_thrust', 'ex_squat', 'ex_romanian_deadlift', 'ex_bulgarian_split_squat', 'ex_cable_kickback', 'ex_walking_lunge'],
        progression: '臀大肌需要大重量（臀推可上很大重量）+ 充分伸展（髋屈位动作）。每周 2 次、10-20 组，8-12 次为主，配合 15-20 次的收尾。久坐人群先做臀桥激活。',
        criteria: '臀肌"失忆"是久坐人群的常见问题：深蹲时腰先累、臀没感觉。先激活再训练。',
      }),
    },
  },
  hip_glute_med: {
    origin: '髂骨翼外面（臀前线与臀后线之间）',
    insertion: '股骨大转子',
    action: '髋关节外展、稳定骨盆（单腿站立时防止对侧骨盆下沉）',
    nerve: '臀上神经（L4-S1）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_clamshell', 'ex_band_walk'],
        strengthen: ['ex_side_lying_raise', 'ex_single_leg_balance', 'ex_bulgarian_split_squat'],
        progression: '臀中肌是骨盆稳定器，训练以耐力与控制为主（15-25 次、慢速、加弹力带）。它有力了，膝内扣与跑步膝痛会明显改善。',
      }),
    },
  },
  hip_iliopsoas: {
    origin: 'T12-L5 椎体与横突（腰大肌）、髂窝（髂肌）',
    insertion: '股骨小转子',
    action: '屈髋；下肢固定时使躯干前屈',
    nerve: '腰丛分支（L1-L3）、股神经',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_hanging_leg_raise'],
        progression: '髂腰肌在久坐人群中几乎总是过紧，是骨盆前倾与腰痛的主因之一。优先拉伸放松，再配合核心与臀肌训练，而不是把它练得更有力。',
        criteria: '髂腰肌过紧会把腰椎向前拉，造成骨盆前倾与"假翘臀"。多数人需要的是拉伸而非强化。',
      }),
    },
  },
  hip_tfl_itb: {
    origin: '髂前上棘、髂嵴外唇',
    insertion: '经髂胫束止于胫骨外侧髁',
    action: '屈髋、髋内旋、协助外展；紧张时导致膝外侧摩擦',
    nerve: '臀上神经（L4-S1）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_clamshell'],
        strengthen: ['ex_side_lying_raise', 'ex_single_leg_balance'],
        progression: '髂胫束本身无法被"拉长"，关键是放松其两端的肌肉（阔筋膜张肌与臀大肌上部）+ 强化臀中肌。跑步膝痛多由此引起。',
      }),
    },
  },

  // ───────────── 大腿 ─────────────
  thigh_quads: {
    origin: '髂前下棘（股直肌）、股骨体（股内/外/中间肌）',
    insertion: '经髌韧带止于胫骨粗隆',
    action: '伸膝；股直肌兼屈髋',
    nerve: '股神经（L2-L4）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_squat', 'ex_leg_press', 'ex_bulgarian_split_squat', 'ex_walking_lunge', 'ex_leg_extension'],
        progression: '股四头肌要有大重量复合动作（深蹲、腿举）+ 孤立收尾（腿屈伸）。每周 2 次、10-18 组，6-12 次为主。注意膝不内扣。',
      }),
    },
    cautions: ['膝前痛者避免深度腿屈伸，先加强臀中肌与腘绳肌'],
  },
  thigh_hamstrings: {
    origin: '坐骨结节（股二头肌短头起自股骨粗线）',
    insertion: '腓骨头（股二头肌）、胫骨内侧髁（半腱/半膜肌）',
    action: '屈膝、伸髋',
    nerve: '坐骨神经（L5-S2）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_romanian_deadlift', 'ex_leg_curl', 'ex_hip_thrust', 'ex_nordic_curl'],
        progression: '腘绳肌要兼顾"屈膝"（腿弯举）与"伸髋"（罗马尼亚硬拉、臀推）两类。离心训练（北欧挺）能显著降低拉伤风险。每周 2 次。',
        criteria: '腘绳肌与股四头肌的力量比应维持在 0.6 以上，比值过低是拉伤与膝痛的高危因素。',
      }),
    },
  },
  thigh_adductor: {
    origin: '耻骨支、坐骨支',
    insertion: '股骨粗线全长、内收肌结节',
    action: '髋关节内收、协助屈髋内旋',
    nerve: '闭孔神经（L2-L4）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_copenhagen', 'ex_adductor_machine', 'ex_sumo_squat'],
        progression: '内收肌训练常被忽略，但它对预防腹股沟拉伤至关重要。每周 2 次，从等长（哥本哈根的简化版）开始渐进。',
      }),
    },
  },

  // ───────────── 小腿 ─────────────
  calf_gastroc: {
    origin: '股骨内/外侧髁后面',
    insertion: '经跟腱止于跟骨结节',
    action: '踝跖屈（踮脚）、协助屈膝',
    nerve: '胫神经（S1-S2）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_standing_calf_raise', 'ex_seated_calf_raise'],
        progression: '小腿需要高次数（15-25 次）与高频率（每周 2-3 次），且要在膝伸直（腓肠肌）与屈膝（比目鱼肌）两种姿势下都练。顶峰停顿 1 秒。',
        criteria: '小腿是最考验耐心的部位。它日常负荷大、耐受强，需要更大的训练量与频率。',
      }),
    },
  },
  calf_soleus: {
    origin: '胫骨后面、腓骨后面',
    insertion: '经跟腱止于跟骨结节',
    action: '踝跖屈；站立时维持姿势（比目鱼肌是"抗重力肌"）',
    nerve: '胫神经（S1-S2）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_seated_calf_raise', 'ex_standing_calf_raise'],
        progression: '屈膝 90° 的坐姿提踵才能有效刺激比目鱼肌。它占小腿体积的大半，只练站姿提踵会漏掉它。',
      }),
    },
  },
  calf_tibialis_ant: {
    origin: '胫骨外侧面',
    insertion: '内侧楔骨、第 1 跖骨底',
    action: '踝背屈（勾脚）、足内翻',
    nerve: '腓深神经（L4-S1）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_tibialis_raise'],
        progression: '胫骨前肌几乎人人偏弱。每天做勾脚抗阻 3 组 × 20 次，能改善小腿前侧疼痛（外胫夹）与膝超伸。',
      }),
    },
  },
  calf_peroneal: {
    origin: '腓骨外侧面',
    insertion: '第 1、5 跖骨底',
    action: '足外翻、协助跖屈',
    nerve: '腓浅神经（L5-S1）',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_tibialis_post_strengthen', 'ex_single_leg_balance'],
        progression: '腓骨肌群与胫骨后肌共同维持踝关节稳定。用弹力带做外翻抗阻，配合单腿平衡训练，可显著降低崴脚风险。',
      }),
    },
  },

  // ───────────── 颈肩 ─────────────
  neck_scm: {
    origin: '胸骨柄前面、锁骨内侧 1/3',
    insertion: '颞骨乳突、上项线外侧',
    action: '单侧收缩使头转向对侧并侧屈；双侧收缩使头前屈',
    nerve: '副神经（CN XI）、C2-C3',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_chin_tuck'],
        strengthen: ['ex_chin_tuck', 'ex_scm_stretch'],
        progression: '胸锁乳突肌在头前伸人群中通常过度紧张。重点是拉伸它 + 强化颈深屈肌（收下巴），而不是把它练粗。',
      }),
    },
  },
  neck_levator: {
    origin: 'C1-C4 横突后结节',
    insertion: '肩胛骨内上角',
    action: '上提肩胛骨、使肩胛下回旋',
    nerve: '肩胛背神经（C5）、C3-C4',
    problems: {
      hypertrophy: hypertrophy({
        strengthen: ['ex_levator_stretch', 'ex_upper_trap_stretch'],
        progression: '肩胛提肌是"落枕"和肩颈酸痛的常见来源。处理方式是拉伸放松 + 强化中下斜方肌让肩胛回到正确位置。',
      }),
    },
  },
  neck_suboccipital: {
    origin: '寰椎横突、枢椎棘突',
    insertion: '枕骨下项线',
    action: '头部后伸与旋转的精细控制，富含本体感受器',
    nerve: '枕下神经（C1）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_chin_tuck'],
        strengthen: ['ex_suboccipital_release'],
        progression: '枕下肌群富含本体感受器，长期头前伸会让它痉挛，引发颈源性头痛。用网球放松 + 收下巴训练效果最好。',
      }),
    },
  },
  neck_deep_flexor: {
    origin: 'C3-T3 椎体（颈长肌）、C3-C6 横突（头长肌）',
    insertion: '寰椎前弓、枕骨基底',
    action: '颈椎屈曲、稳定颈椎前凸',
    nerve: 'C2-C6 神经前支',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_chin_tuck'],
        strengthen: ['ex_chin_tuck'],
        progression: '颈深屈肌是头前伸的"解药"。每天做收下巴 3 组 × 10 次（每次保持 5 秒），2-4 周可见改善。',
        criteria: '长期低头看手机会让颈深屈肌变弱、后侧肌群紧张，形成典型的头前伸。收下巴训练是最直接的改善手段。',
      }),
    },
  },

  // ───────────── 足部 ─────────────
  foot_tibialis_post: {
    origin: '胫骨、腓骨后面与骨间膜',
    insertion: '舟骨、楔骨、跖骨底',
    action: '足内翻、维持足弓',
    nerve: '胫神经（L4-L5）',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_short_foot'],
        strengthen: ['ex_tibialis_post_strengthen', 'ex_short_foot'],
        progression: '胫骨后肌是足弓最重要的动态支撑。它功能不足会导致扁平足与足底筋膜炎。用弹力带内翻 + 短足练习，每天练。',
      }),
    },
  },
  foot_intrinsic: {
    origin: '跟骨、跖骨',
    insertion: '趾骨',
    action: '维持足弓、控制脚趾',
    nerve: '足底内/外侧神经',
    problems: {
      hypertrophy: hypertrophy({
        activate: ['ex_short_foot'],
        strengthen: ['ex_towel_curl', 'ex_short_foot'],
        progression: '足内在肌长期被鞋子"包办"，几乎人人偏弱。每天赤脚做毛巾抓握与短足练习，对扁平足、拇外翻、足底疼痛都有帮助。',
      }),
    },
  },
};

/** 合并静态档案（中英拉丁名/分区）与解剖细节 */
export const MUSCLES: Partial<Record<MuscleId, Muscle>> = {};
for (const [id, detail] of Object.entries(MUSCLE_DETAILS)) {
  const meta = MUSCLE_META[id];
  if (!meta) continue;
  MUSCLES[id as MuscleId] = {
    id: id as MuscleId,
    cn: meta.cn,
    en: meta.en,
    latin: meta.latin,
    region: meta.region,
    origin: detail.origin,
    insertion: detail.insertion,
    action: detail.action,
    nerve: detail.nerve,
    problems: detail.problems,
    cautions: detail.cautions,
  };
}

export function getMuscle(id: string): Muscle | undefined {
  return MUSCLES[id as MuscleId];
}

/** 有内容（可点击查看详情）的肌群 */
export const MUSCLES_WITH_CONTENT = Object.keys(MUSCLES) as MuscleId[];
