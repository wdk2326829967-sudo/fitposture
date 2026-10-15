import type { MuscleId, PostureIssue } from './types';

/**
 * 体态问题库。
 *
 * 组织方式沿用康复领域通行的「紧张—无力」模型：绝大多数体态偏差不是某块肌肉
 * 单独出了问题，而是一侧长期缩短紧张、对侧被拉长而无力，把骨骼拉离了中立位。
 * 所以每个问题都同时给出 tight / weak 两组肌肉——它们正好对应 3D 模型上的
 * 双色高亮，也让方案天然分成「先松后拉、再激活、最后强化」四步。
 *
 * 内容为健身科普，不构成医疗诊断；结构性问题（如脊柱侧弯）已标注就医提示。
 */

/** 通用免责声明 */
const DISCLAIMER =
  '以上为健身科普建议，非医疗诊断。若伴随疼痛、麻木、无力或症状持续加重，请咨询医生或物理治疗师。';

export const POSTURES: Record<string, PostureIssue> = {
  // ───────────────── 圆肩含胸 ─────────────────
  rounded_shoulder: {
    id: 'rounded_shoulder',
    cn: '圆肩含胸',
    en: 'Rounded Shoulders / Upper Crossed Syndrome',
    category: 'shoulder',
    description:
      '肩关节被向前、向内拉，肩胛骨前伸并离开胸廓，从侧面看肩膀像"扣"在胸前。' +
      '久坐伏案、长期开车、以及练胸远多于练背的训练习惯，是最常见的两类成因。' +
      '它常与头前伸同时出现，合称上交叉综合征。',
    howToSelfCheck:
      '自然站立、双臂放松下垂，看虎口朝向：朝前为中立，朝内（朝向大腿）提示肩内旋。' +
      '或背靠墙站立，肩胛与臀部贴墙，试着把双手背也贴到墙上——贴不上说明胸廓前侧偏紧。',
    tight: ['chest_pec_major', 'chest_pec_minor', 'back_lat', 'back_trapezius_upper', 'neck_levator'],
    weak: ['back_rhomboid', 'back_trapezius_lower', 'shoulder_rotator_cuff', 'neck_deep_flexor'],
    plan: {
      relax: ['ex_foam_roll_pec', 'ex_release_upper_trap', 'ex_release_scapula_border'],
      stretch: ['ex_pec_stretch_doorway', 'ex_stretch_pec_minor_corner', 'ex_stretch_lat_hang'],
      activate: ['ex_band_pullapart', 'ex_wall_angel', 'ex_prone_y'],
      strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_db_row', 'ex_seated_cable_row'],
    },
    selfTest: [
      {
        id: 'rst_wall',
        name: '靠墙手背贴墙测试',
        steps: [
          '背靠墙站立，脚跟离墙约 15 厘米',
          '臀部、肩胛骨、后脑尽量贴住墙面',
          '双臂自然下垂，尝试把两侧手背同时贴到墙上',
          '保持自然呼吸，不要刻意挺腰或憋气',
        ],
        whatToLook: '手背能否在不耸肩、不塌腰的情况下贴到墙面',
        normal: '手背可轻松贴墙，肩前侧无明显牵拉感',
        abnormal: '手背贴不上墙，或需要耸肩、腰部离墙才能勉强贴上',
        threshold: '手背与墙面距离超过一掌宽，或肩前侧有明显紧绷牵拉感',
      },
    ],
    cautions: [
      '拉伸胸肌时不要猛然发力或弹震，避免肩关节前侧被过度牵拉',
      '若肩关节有疼痛、弹响或活动受限，先做评估再练',
      DISCLAIMER,
    ],
  },

  // ───────────────── 头前伸 ─────────────────
  forward_head: {
    id: 'forward_head',
    cn: '头前伸（探颈）',
    en: 'Forward Head Posture',
    category: 'spine',
    description:
      '头部相对肩带向前移位，耳垂落在肩峰前方。看手机、用笔记本电脑时视线长期向下，' +
      '头不自觉前探，颈后与枕下肌群持续收缩维持头的位置，颈前深层屈肌则逐渐失活。' +
      '头每前移约 2.5 厘米，颈部负担就成倍增加，这也是颈肩酸痛最常见的来源之一。',
    howToSelfCheck:
      '请人从侧面拍一张自然站立的照片，看耳垂与肩峰（肩膀最高点）的相对位置。' +
      '正常情况下耳垂应大致落在肩峰正上方，明显偏前即为头前伸。',
    tight: ['neck_suboccipital', 'neck_levator', 'back_trapezius_upper', 'neck_scm'],
    weak: ['neck_deep_flexor', 'back_trapezius_lower', 'back_rhomboid'],
    plan: {
      relax: ['ex_suboccipital_release', 'ex_release_upper_trap', 'ex_release_deep_neck'],
      stretch: ['ex_stretch_deep_neck', 'ex_levator_stretch', 'ex_scm_stretch'],
      activate: ['ex_chin_tuck'],
      strengthen: ['ex_chin_tuck', 'ex_prone_y', 'ex_face_pull'],
    },
    selfTest: [
      {
        id: 'fhp_photo',
        name: '侧面照耳垂—肩峰对齐检查',
        steps: [
          '自然站立，目视前方，不要刻意纠正姿势',
          '请人从正侧面拍一张包含头、颈、肩的照片',
          '在照片上找到耳垂与肩峰（肩部最外侧骨性高点）',
          '比较两者的前后位置',
        ],
        whatToLook: '耳垂是否落在肩峰的正上方',
        normal: '耳垂大致与肩峰在同一条垂直线上',
        abnormal: '耳垂明显落在肩峰前方，头部看起来像"探"出去',
        threshold: '耳垂前移超过肩峰前后径的一半',
        needsPartner: true,
      },
    ],
    cautions: [
      '颈部动作要慢，出现头晕、手麻或视物模糊立即停止',
      '不要用力后仰或做快速的颈部绕环',
      DISCLAIMER,
    ],
  },

  // ───────────────── 驼背 ─────────────────
  thoracic_kyphosis: {
    id: 'thoracic_kyphosis',
    cn: '驼背（胸椎后凸加大）',
    en: 'Thoracic Kyphosis',
    category: 'spine',
    description:
      '胸椎段向后的曲度超过正常范围，背部看起来圆隆。久坐含胸、胸椎活动度不足，' +
      '会让胸段伸肌群长期处于被拉长无力的状态，而前侧胸肌持续缩短。' +
      '与圆肩的区别在于：圆肩主要是肩胛位置问题，驼背是整个胸椎曲度的改变。',
    howToSelfCheck:
      '背靠墙站立，尝试把后脑贴到墙上——若需要明显抬头或腰部大幅离墙才能做到，' +
      '提示胸椎伸展活动度受限。也可俯卧做眼镜蛇式，看胸骨能离地多高。',
    tight: ['chest_pec_major', 'chest_pec_minor', 'back_lat'],
    weak: ['back_erector', 'back_rhomboid', 'back_trapezius_lower'],
    plan: {
      relax: ['ex_foam_roll_pec', 'ex_release_erector', 'ex_release_scapula_border'],
      stretch: ['ex_stretch_child_pose', 'ex_pec_stretch_doorway', 'ex_stretch_serratus_wall'],
      activate: ['ex_wall_angel', 'ex_prone_y', 'ex_scapular_pullup'],
      strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_seated_cable_row', 'ex_prone_y'],
    },
    selfTest: [
      {
        id: 'tk_wall_head',
        name: '靠墙后脑贴墙测试',
        steps: [
          '背靠墙站立，脚跟、臀部、肩胛贴墙',
          '在不刻意仰头的前提下，尝试把后脑贴到墙面',
          '观察腰部是否需要大幅离墙来代偿',
        ],
        whatToLook: '后脑能否轻松贴墙，以及腰部的代偿程度',
        normal: '后脑可轻松贴墙，腰部与墙的间隙约一个手掌厚度',
        abnormal: '后脑贴不上墙，或必须明显仰头、腰部大幅拱起才能贴上',
      },
    ],
    cautions: [
      '胸椎伸展练习要循序渐进，不要借助外力强行压背',
      '若背部疼痛伴晨僵、夜间痛醒或进行性加重，需就医排查',
      DISCLAIMER,
    ],
  },

  // ───────────────── 骨盆前倾 ─────────────────
  anterior_pelvic_tilt: {
    id: 'anterior_pelvic_tilt',
    cn: '骨盆前倾',
    en: 'Anterior Pelvic Tilt / Lower Crossed Syndrome',
    category: 'pelvis',
    description:
      '骨盆前端向前下方旋转，腰椎前凸随之加大，外观上臀部后翘、小腹前凸。' +
      '久坐让髋屈肌长期缩短，而臀肌与腹部被抑制，形成典型的下交叉模式。' +
      '需要说明：骨盆前倾本身很常见，多数人没有症状，只有当伴随腰部不适时才需要针对性干预。',
    howToSelfCheck:
      '仰卧在硬一点的平面上，双手掌心插到腰与地面之间：正常应只有很小的缝隙。' +
      '若轻松塞进一个拳头甚至更多，且感觉腰部悬空明显，提示腰椎前凸偏大。',
    tight: ['hip_iliopsoas', 'back_erector', 'thigh_quads', 'back_ql'],
    weak: ['core_rectus', 'hip_glute_max', 'core_transverse', 'thigh_hamstrings'],
    plan: {
      relax: ['ex_release_psoas', 'ex_foam_roll_quad', 'ex_release_erector', 'ex_release_ql'],
      stretch: ['ex_hip_flexor_stretch', 'ex_stretch_psoas_lunge', 'ex_stretch_quad_standing'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_hip_thrust', 'ex_plank', 'ex_dead_bug', 'ex_romanian_deadlift'],
    },
    selfTest: [
      {
        id: 'apt_gap',
        name: '仰卧腰—地间隙测试',
        steps: [
          '仰卧于硬质平面，双腿自然伸直，全身放松',
          '将一只手的掌心插入腰与地面之间',
          '感受缝隙的大小与腰部悬空程度',
        ],
        whatToLook: '腰部与地面之间的间隙能容纳多少',
        normal: '缝隙很小，约能平放进一只手掌的厚度',
        abnormal: '可轻松塞进一个拳头，腰部明显悬空、难以放松贴地',
        threshold: '可放入一个完整拳头',
      },
    ],
    cautions: [
      '腰部有急性疼痛或椎间盘问题史者，先咨询医生再练',
      '拉伸髋屈肌时不要塌腰代偿，保持骨盆稳定',
      DISCLAIMER,
    ],
  },

  // ───────────────── 膝超伸 ─────────────────
  knee_hyperextension: {
    id: 'knee_hyperextension',
    cn: '膝超伸',
    en: 'Knee Hyperextension',
    category: 'lower',
    description:
      '站立时膝关节向后顶超过中立位，从侧面看腿的轮廓向后突。' +
      '小腿后侧与股四头肌偏紧、腘绳肌与臀肌偏弱时，身体会习惯用关节囊和韧带"锁"住膝盖来维持站立，' +
      '长期如此会增加膝关节前侧与髌股关节的压力。',
    howToSelfCheck:
      '脱鞋自然站立，从侧面观察或拍照：膝盖中心点若明显落在踝关节中心之后，即为超伸。' +
      '也可留意站立久了是否小腿前侧或膝盖前方容易酸。',
    tight: ['calf_gastroc', 'calf_soleus', 'thigh_quads'],
    weak: ['thigh_hamstrings', 'hip_glute_max'],
    plan: {
      relax: ['ex_foam_roll_calf', 'ex_release_soleus', 'ex_release_hamstrings'],
      stretch: ['ex_calf_stretch_wall', 'ex_stretch_soleus_wall'],
      activate: ['ex_single_leg_balance', 'ex_glute_bridge'],
      strengthen: ['ex_leg_curl', 'ex_nordic_curl', 'ex_hip_thrust', 'ex_standing_calf_raise'],
    },
    selfTest: [
      {
        id: 'kh_side',
        name: '侧面站立力线观察',
        steps: [
          '脱鞋，双脚与髋同宽自然站立',
          '请人从正侧面拍一张包含髋、膝、踝的照片',
          '比较膝关节中心与踝关节中心的前后关系',
        ],
        whatToLook: '膝盖是否向后顶过了踝关节，腿的轮廓是否向后突',
        normal: '膝与踝大致在同一垂直线上，或膝略偏前',
        abnormal: '膝关节中心明显落在踝关节后方，腿部轮廓向后呈弧形',
        needsPartner: true,
      },
    ],
    cautions: [
      '不要刻意"夹紧"或猛力伸直膝盖，微屈才是功能位',
      '膝关节有积液、韧带损伤史者先做评估',
      DISCLAIMER,
    ],
  },

  // ───────────────── 膝内扣 ─────────────────
  knee_valgus: {
    id: 'knee_valgus',
    cn: '膝内扣（动态膝外翻）',
    en: 'Dynamic Knee Valgus',
    category: 'lower',
    description:
      '下蹲、落地或上下楼梯时膝盖向内塌，股骨相对胫骨内旋内收。' +
      '臀中肌与臀大肌控制不足是最常见原因，大腿内侧与髂胫束偏紧会加重表现。' +
      '它在深蹲和跑跳落地时尤其明显，是膝前侧疼痛的常见相关因素。',
    howToSelfCheck:
      '面对镜子做徒手深蹲，缓慢下蹲到大腿接近水平，观察膝盖是否朝脚尖方向移动，' +
      '还是向内塌向中线。也可单腿下蹲观察膝盖与脚尖的对位。',
    tight: ['thigh_adductor', 'hip_tfl_itb', 'calf_gastroc'],
    weak: ['hip_glute_med', 'hip_glute_max'],
    plan: {
      relax: ['ex_release_adductor', 'ex_foam_roll_itb', 'ex_release_glute_med'],
      stretch: ['ex_stretch_adductor_butterfly'],
      activate: ['ex_clamshell', 'ex_band_walk', 'ex_side_lying_raise'],
      strengthen: ['ex_band_walk', 'ex_side_lying_raise', 'ex_hip_thrust', 'ex_copenhagen'],
    },
    selfTest: [
      {
        id: 'kv_squat',
        name: '徒手深蹲膝轨迹观察',
        steps: [
          '面对镜子，双脚与肩同宽、脚尖略外展',
          '双手前平举，缓慢下蹲到大腿接近水平',
          '全程观察膝盖的移动方向',
          '重复 5 次，看是否每次都出现内塌',
        ],
        whatToLook: '膝盖是否始终对着脚尖方向，还是向内塌向身体中线',
        normal: '膝盖方向与脚尖一致，没有明显内移',
        abnormal: '下蹲过程中膝盖明显向内塌，严重时脚内侧会离地',
      },
    ],
    cautions: [
      '先减轻负重和幅度，把动作模式练对再加量',
      '若下蹲时膝盖前方疼痛或有绞锁感，先做评估',
      DISCLAIMER,
    ],
  },

  // ───────────────── 扁平足 ─────────────────
  flat_foot: {
    id: 'flat_foot',
    cn: '扁平足（足弓塌陷）',
    en: 'Flat Foot / Overpronation',
    category: 'foot',
    description:
      '内侧足弓在负重时塌陷，足跟向外偏、前足外展。' +
      '胫骨后肌与足内在肌支撑不足，加上小腿后侧偏紧，会让足弓在站立和行走中难以维持。' +
      '很多人是"柔性扁平足"——不负重时有弓，一站就塌，这类通过训练改善空间较大。',
    howToSelfCheck:
      '湿足印测试：脚底沾水踩在纸袋或深色地面上，看足印内侧的缺口。' +
      '或坐在椅子上与站起来分别看足弓：站起来足弓明显消失即为柔性扁平足。',
    tight: ['calf_gastroc', 'calf_soleus', 'calf_peroneal'],
    weak: ['foot_tibialis_post', 'foot_intrinsic', 'calf_tibialis_ant'],
    plan: {
      relax: ['ex_release_foot_plantar', 'ex_foam_roll_calf', 'ex_release_peroneal'],
      stretch: ['ex_calf_stretch_wall', 'ex_stretch_peroneal'],
      activate: ['ex_short_foot', 'ex_towel_curl'],
      strengthen: ['ex_short_foot', 'ex_towel_curl', 'ex_tibialis_post_strengthen', 'ex_tibialis_raise'],
    },
    selfTest: [
      {
        id: 'ff_arch',
        name: '坐—站足弓对比',
        steps: [
          '坐在椅子上，观察（或请人看）足内侧的弓形',
          '站起来自然负重，再次观察同一位置',
          '比较两种状态下足弓的高度差',
        ],
        whatToLook: '负重后足弓是否明显塌陷甚至贴地',
        normal: '站立时足弓略有下降但仍可见明显弓形',
        abnormal: '一站起来足弓几乎完全消失，内侧贴近地面',
        threshold: '负重后足弓高度下降超过一半',
      },
    ],
    cautions: [
      '硬性扁平足（坐站都没有弓）或伴疼痛者，建议找专业人士评估',
      '足部训练要循序渐进，一下子走太多反而容易酸痛',
      DISCLAIMER,
    ],
  },
};

/** 按 id 取体态问题 */
export function getPosture(id: string): PostureIssue | undefined {
  return POSTURES[id];
}

/** 体态问题列表，按类别排序后返回，供导航与列表页使用 */
export function listPostures(): PostureIssue[] {
  const order: PostureIssue['category'][] = ['shoulder', 'spine', 'pelvis', 'lower', 'foot'];
  return Object.values(POSTURES).sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.cn.localeCompare(b.cn),
  );
}

export const POSTURE_CATEGORY_CN: Record<PostureIssue['category'], string> = {
  shoulder: '肩与上背',
  spine: '脊柱与颈',
  pelvis: '骨盆与腰',
  lower: '下肢力线',
  foot: '足与踝',
};

/** 取某体态问题涉及的紧张肌 id（供 3D 双色高亮） */
export function postureTightIds(id: string): MuscleId[] {
  return POSTURES[id]?.tight ?? [];
}

/** 取某体态问题涉及的无力肌 id（供 3D 双色高亮） */
export function postureWeakIds(id: string): MuscleId[] {
  return POSTURES[id]?.weak ?? [];
}
