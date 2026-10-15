import type { MuscleState, Symptom } from './types';

/**
 * 症状反查库。
 *
 * 用户进站时往往不知道自己该练哪块肌肉，只知道「脖子酸」「下楼梯膝盖痛」。
 * 这一层把「用户说的话」翻译回「可能涉及的肌肉 + 相关体态 + 该做什么」，
 * 和肌肉库、体态库共用同一套肌肉 id 与动作 id，因此可以直接复用详情页与动作卡。
 *
 * 三条写作原则：
 * 1. 不诊断。只说「常见情况是什么、怎么判断、什么时候必须就医」。
 * 2. 每条都给「怎么判断就是它」，否则多块肌肉罗列等于没说。
 * 3. 先分诊再给方案：有危险信号的一律先指向就医，再谈训练。
 */

const DISCLAIMER =
  '以上为健身科普建议，非医疗诊断。症状持续加重、影响睡眠或日常生活，或出现麻木、无力、放射痛时，请咨询医生或物理治疗师。';

const SEE_DOCTOR_COMMON =
  '疼痛超过 2 周无改善、反复发作、出现麻木或无力、夜间痛醒或影响睡眠，建议就医或找物理治疗师评估。';

/** 通用危险信号：出现任一情况，先就医再谈训练 */
const RED_FLAGS_COMMON = [
  '外伤后立即出现的剧烈疼痛、畸形或无法负重',
  '肢体进行性麻木、无力，或大小便 / 会阴部感觉异常',
  '夜间痛醒、伴发热或不明原因体重下降',
  '近期有胸痛、呼吸困难、头晕或意识改变',
];

type Draft = Omit<Symptom, 'redFlags' | 'seeDoctor' | 'disclaimer'> &
  Partial<Pick<Symptom, 'redFlags' | 'seeDoctor' | 'disclaimer'>>;

/** 填默认值，避免每条症状重复写一遍免责与危险信号 */
function S(d: Draft): Symptom {
  return {
    redFlags: RED_FLAGS_COMMON,
    seeDoctor: SEE_DOCTOR_COMMON,
    disclaimer: DISCLAIMER,
    ...d,
  };
}

export const SYMPTOMS: Record<string, Symptom> = {
  // ─────────────────── 头颈 ───────────────────
  neck_ache: S({
    id: 'neck_ache',
    cn: '低头久了颈后酸、发僵',
    aliases: ['脖子酸', '颈椎不好', '后颈僵', '颈肩酸痛', '富贵包', '低头就疼'],
    region: 'head_neck',
    summary:
      '头每往前探一点，颈后要撑住的力矩就成倍增加。多数被称为"颈椎病"的不适，其实是颈部肌群在维持头位时长期超负荷，而不是骨头本身出了问题。',
    typical: '伏案工作、长时间看手机、通勤低头、压力大时不自觉耸肩',
    causes: [
      {
        muscle: 'neck_suboccipital',
        role: 'primary',
        state: 'tight',
        why: '枕下肌群负责头颅的精细定位。低头时它们持续收缩，把后脑固定在最前位，是"后发际线那一圈发沉"的直接来源。',
        tell: '按压后发际线下方、颅骨底部的凹陷处有明显酸胀，且轻轻把头向后收（做双下巴）会更舒服。',
      },
      {
        muscle: 'neck_levator',
        role: 'primary',
        state: 'tight',
        why: '肩胛提肌连接颈椎横突与肩胛骨内上角，低头叠加耸肩时被双重拉短，是最常见的一转头就痛的位置。',
        tell: '脖子往某一侧转受限最明显；按压肩胛骨内上角（肩膀最上方偏内）会串到脖子。',
      },
      {
        muscle: 'back_trapezius_upper',
        role: 'secondary',
        state: 'overworked',
        why: '紧张、疲劳、伏案时会不自觉耸肩，上斜方肌代偿撑住整个肩带，整片发硬。',
        tell: '肩颈交界那一整片（而非某一个点）僵硬，按压有"疙瘩感"，耸肩时更紧。',
      },
      {
        muscle: 'neck_deep_flexor',
        role: 'secondary',
        state: 'weak',
        why: '颈深屈肌负责把前探的头拉回来。它们失活后，只能靠后侧肌群被动拽住头——松完还会再紧。',
        tell: '靠墙做收下巴（双下巴）动作，撑不到 15 秒就发抖，或做不出来、后颈反而更酸。',
      },
    ],
    postures: ['forward_head'],
    quickChecks: [
      {
        id: 'nc_chin_tuck',
        name: '收下巴保持测试',
        steps: [
          '靠墙站立，脚跟、臀部、肩胛贴墙，头先不刻意贴墙',
          '做"双下巴"动作，把后脑往墙的方向平移',
          '保持这个姿势，数到 15',
        ],
        meaning:
          '能保持 15 秒且颈前深部有轻微发力感 → 深屈肌还能工作，按方案练即可；撑不住或后颈更酸 → 后侧主导代偿，先放松拉伸，别直接练力量。',
      },
      {
        id: 'nc_lie_gap',
        name: '仰卧后颈贴地观察',
        steps: ['仰卧屈膝，全身放松', '感受后颈与地面的接触是否均匀、左右是否对称'],
        meaning: '单侧明显离地或某一侧紧绷感更强 → 该侧短缩，放松与拉伸要偏向这一侧。',
      },
    ],
    acute: [
      '先停掉引起症状的姿势：长时间低头、托腮、单肩背包',
      '每 30 分钟换一次姿势，做 5 次缓慢的收下巴',
      '后颈热敷 15 分钟（若是 48 小时内的急性扭伤，改用冷敷）',
    ],
    avoid: [
      '快速甩头、大幅度颈部绕环',
      '让他人猛力扳脖子或追求"咔咔响"',
      '同一低头角度连续维持超过 40 分钟',
      '用按摩仪顶着痛点持续加压（越痛越按）',
    ],
    plan: {
      relax: ['ex_suboccipital_release', 'ex_release_upper_trap', 'ex_release_deep_neck'],
      stretch: ['ex_stretch_deep_neck', 'ex_levator_stretch', 'ex_scm_stretch'],
      activate: ['ex_chin_tuck'],
      strengthen: ['ex_chin_tuck', 'ex_prone_y'],
    },
    dailyTips: [
      '把屏幕抬到眼睛平视的高度；笔记本用支架 + 外接键盘',
      '手机举到眼前看，而不是低头看手里的手机',
      '枕头高度以侧卧时头颈与躯干成一条直线为准，过高过低都会让颈后整夜受力',
    ],
  }),

  neck_stiff_turn: S({
    id: 'neck_stiff_turn',
    cn: '脖子转不动、早起像落枕',
    aliases: ['落枕', '扭头受限', '脖子不能转', '晨起脖子痛', '脖子扭了'],
    region: 'head_neck',
    summary:
      '"落枕"通常是颈部某侧肌肉的保护性痉挛。肌肉在收缩状态下保护自己，强行掰开只会让它更紧——所以急性期的重点是温和活动，而不是拉到痛。',
    typical: '睡姿不良、空调直吹后、前一晚长时间低头、精神紧张时',
    causes: [
      {
        muscle: 'neck_levator',
        role: 'primary',
        state: 'tight',
        why: '肩胛提肌最常在睡觉时因头颈侧向扭转而被拉短，醒来一转头就痛。',
        tell: '往一侧转头受限最明显，且这一侧的肩胛骨内上角一按就串痛。',
      },
      {
        muscle: 'neck_scm',
        role: 'primary',
        state: 'tight',
        why: '胸锁乳突肌负责转头与屈颈，长时间单侧卧或单侧看屏幕会让它整夜处于缩短位。',
        tell: '脖子侧面从耳后到锁骨的那条束状结构一按就痛，且向对侧转头（如右痛则向左转）最受限。',
      },
      {
        muscle: 'neck_suboccipital',
        role: 'secondary',
        state: 'tight',
        why: '枕下肌群跟着一起痉挛，后脑发沉。',
        tell: '后发际线下方深层酸胀，轻按会"痛得舒服"。',
      },
      {
        muscle: 'back_trapezius_upper',
        role: 'secondary',
        state: 'overworked',
        why: '疼痛时整个肩带不自觉上提，上斜方跟着代偿紧张。',
        tell: '疼痛向肩膀蔓延，肩颈交界处整片僵硬。',
      },
    ],
    postures: ['forward_head'],
    quickChecks: [
      {
        id: 'nst_turn',
        name: '左右转头范围对比',
        steps: [
          '坐直，目视前方',
          '缓慢向左转头到极限，记住下巴相对肩膀的位置',
          '缓慢向右转头到极限，比较两侧',
        ],
        meaning:
          '两侧差距超过一掌宽度，且受限一侧伴随疼痛 → 该侧处于痉挛状态；若两侧都差且伴手麻无力，不要自行处理，直接就医。',
      },
    ],
    acute: [
      '48 小时内用冷敷（每次 10-15 分钟），之后改热敷',
      '在"不痛"的范围内缓慢地、小幅度地活动脖子，每小时几次',
      '不要整天绝对不动——长时间固定反而会更僵',
      '睡觉时把枕头调低，必要时在颈下垫一条薄毛巾卷',
    ],
    avoid: [
      '强行把头转到痛的一侧',
      '立即做大重量推举、硬拉等需要颈肩稳定的动作',
      '当天做深度推拿或猛烈拉伸',
      '长时间低头看手机"转移注意力"',
    ],
    plan: {
      relax: ['ex_release_upper_trap', 'ex_release_deep_neck', 'ex_suboccipital_release'],
      stretch: ['ex_levator_stretch', 'ex_scm_stretch', 'ex_stretch_deep_neck'],
      activate: ['ex_chin_tuck', 'ex_wall_angel'],
      strengthen: ['ex_chin_tuck', 'ex_prone_y'],
    },
    dailyTips: [
      '发作期枕头宁可矮一点，避免整夜把头颈折向一侧',
      '避免空调或风扇直吹颈后',
      '反复落枕（一个月超过两次）说明颈深屈肌长期失活，症状退后要坚持练收下巴',
    ],
    redFlags: [
      '伴上肢麻木、无力或手部精细动作变差（扣扣子、写字困难）',
      '外伤后出现的颈部剧痛',
      '伴发热、头痛剧烈、颈项强直',
      ...RED_FLAGS_COMMON,
    ],
  }),

  tension_headache: S({
    id: 'tension_headache',
    cn: '后脑到太阳穴的紧箍样头痛',
    aliases: ['紧张性头痛', '头疼', '太阳穴涨', '后脑勺痛', '头箍'],
    region: 'head_neck',
    summary:
      '紧张性头痛最常见的来源是颅底与上颈段的肌肉持续收缩，疼痛会从颈后"放散"到头顶与太阳穴。它通常在下午加重、活动后不恶化、按压颈后能缓解。',
    typical: '长时间盯屏幕、赶工压力大、咬牙、睡眠不足、咖啡因摄入过多',
    causes: [
      {
        muscle: 'neck_suboccipital',
        role: 'primary',
        state: 'tight',
        why: '枕下肌群紧邻枕大神经，长期收缩会直接引起后脑到头顶的钝痛。',
        tell: '按压颅底（后发际线正中两侧凹陷）时，头痛部位会有"按到根上了"的酸胀感。',
      },
      {
        muscle: 'back_trapezius_upper',
        role: 'secondary',
        state: 'overworked',
        why: '压力状态下持续耸肩，上斜方把张力一路传到颅底与颞区。',
        tell: '肩膀放松下来后头痛减轻；按压肩上那块肌肉时太阳穴会有牵扯感。',
      },
      {
        muscle: 'neck_scm',
        role: 'secondary',
        state: 'tight',
        why: '头前伸时胸锁乳突肌持续工作，把疼痛牵向耳周与太阳穴。',
        tell: '脖子侧面那条束状结构压痛明显，转头时牵扯到耳周。',
      },
      {
        muscle: 'neck_deep_flexor',
        role: 'secondary',
        state: 'weak',
        why: '深屈肌撑不住头位，后侧只能被动加班，头痛反复发作。',
        tell: '收下巴撑不到 15 秒；头向前探得越明显，头痛频率越高。',
      },
    ],
    postures: ['forward_head'],
    quickChecks: [
      {
        id: 'th_press',
        name: '颅底按压试验',
        steps: [
          '双手拇指放在后发际线下方、颅骨底部两侧的凹陷处',
          '向上（朝眼睛方向）轻轻按压，保持 10 秒',
          '观察头痛是否随之出现或加重',
        ],
        meaning:
          '按压能复制出平时的头痛 → 高度提示肌肉来源，按方案处理；完全没有关联 → 建议就医排查其它类型头痛。',
      },
    ],
    acute: [
      '停下手头工作，闭眼 5 分钟，把肩膀主动往下沉几次',
      '热敷后颈 15 分钟',
      '缓慢做 10 次收下巴，不要做到痛',
      '补足一杯水，很多"头痛"其实是缺水加疲劳',
    ],
    avoid: [
      '靠止痛药硬扛继续加班',
      '大幅甩头或用力按摩颅底',
      '在痛的时候做高强度训练',
    ],
    plan: {
      relax: ['ex_suboccipital_release', 'ex_release_upper_trap', 'ex_release_deep_neck'],
      stretch: ['ex_stretch_deep_neck', 'ex_levator_stretch', 'ex_scm_stretch'],
      activate: ['ex_chin_tuck'],
      strengthen: ['ex_chin_tuck', 'ex_prone_y'],
    },
    dailyTips: [
      '注意自己是否在无意识咬牙——上下牙轻轻分开、舌头放平',
      '咖啡因控制在下午两点前，过量与戒断都会诱发头痛',
      '屏幕抬到平视高度，比任何按摩仪都管用',
    ],
    redFlags: [
      '从未经历过的突发剧烈头痛（"雷击样"）',
      '头痛伴发热、颈项强直、视物模糊、言语不清或单侧肢体无力',
      '50 岁后新发的头痛，或头痛性质与以往完全不同',
      '头痛在清晨最重、咳嗽或用力时加重',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 肩部 ───────────────────
  shoulder_overhead_pain: S({
    id: 'shoulder_overhead_pain',
    cn: '抬手过头时肩痛或卡住',
    aliases: ['抬手痛', '肩上举受限', '肩峰下撞击', '梳头困难', '够高处痛'],
    region: 'shoulder',
    summary:
      '把手举过头顶时，肩胛骨需要同步上回旋、肱骨需要外旋，给肌腱腾出通道。胸小肌与背阔肌偏紧、肩袖与中下斜方肌无力时，这条通道变窄，抬到某个角度就"卡"住并痛。',
    typical: '经常做推举/卧推、游泳、打羽毛球；长期伏案圆肩',
    causes: [
      {
        muscle: 'shoulder_rotator_cuff',
        role: 'primary',
        state: 'weak',
        why: '肩袖负责把肱骨头稳定地压在关节盂里。它控制不住时，肱骨会上移撞到肩峰。',
        tell: '抬手到 60-120 度之间最痛（痛弧），过顶后反而减轻；手臂自然下垂时做抗阻外旋会酸软无力。',
      },
      {
        muscle: 'back_trapezius_lower',
        role: 'primary',
        state: 'weak',
        why: '中下斜方肌负责肩胛上回旋与下沉，它一弱，抬手时肩胛转不动，只能靠耸肩代偿。',
        tell: '抬手时不自觉耸肩，且肩胛骨内侧缘翘起离开胸壁。',
      },
      {
        muscle: 'chest_pec_minor',
        role: 'secondary',
        state: 'tight',
        why: '胸小肌把肩胛骨拉向前倾位，直接缩小肩峰下间隙。',
        tell: '靠墙时手背贴不上墙；肩前侧（锁骨下方）一按就紧。',
      },
      {
        muscle: 'back_lat',
        role: 'secondary',
        state: 'tight',
        why: '背阔肌紧张会限制过顶活动度，抬手时被"拽住"。',
        tell: '双手上举抓杠悬垂时，腋下到侧胸那一带明显牵拉受限。',
      },
    ],
    postures: ['rounded_shoulder', 'thoracic_kyphosis'],
    quickChecks: [
      {
        id: 'sop_arc',
        name: '痛弧观察',
        steps: [
          '站立，手臂自然下垂，拇指朝上',
          '缓慢从侧面抬起手臂到头顶，全程注意疼痛出现的角度',
          '再缓慢放下，注意疼痛消失的角度',
        ],
        meaning:
          '疼痛集中在中段（约 60-120 度）而过顶后减轻 → 典型的肩峰下卡压，按方案练；全程都痛或静息也痛 → 先就医评估。',
      },
      {
        id: 'sop_sr',
        name: '肩胛上回旋观察',
        steps: ['请人站在背后，看你在抬手过程中两侧肩胛骨的运动', '注意是否一侧明显转得慢或翘起来'],
        meaning: '患侧肩胛上回旋不足、靠耸肩代偿 → 中下斜方肌是重点，别只盯着肩袖练。',
      },
    ],
    acute: [
      '2-3 周内先把过头顶的动作换成"肩胛平面"内的动作（手臂略前偏 30 度、拇指朝上）',
      '训练高度降到不痛的范围，宁可少练也别在痛弧里加重量',
      '疼痛明显时暂停卧推、直立划船、背后臂屈伸',
    ],
    avoid: [
      '在痛弧里强行加重量或"忍痛练通"',
      '用大重量推举去"拉开"受限角度',
      '长时间反复够高处（如整理衣柜、擦高窗）',
    ],
    plan: {
      relax: ['ex_foam_roll_pec', 'ex_release_upper_trap', 'ex_release_scapula_border'],
      stretch: ['ex_stretch_pec_minor_corner', 'ex_pec_stretch_doorway', 'ex_stretch_lat_hang'],
      activate: ['ex_wall_angel', 'ex_scapular_pullup', 'ex_external_rotation'],
      strengthen: ['ex_face_pull', 'ex_cuban_press', 'ex_side_lying_er', 'ex_reverse_fly'],
    },
    dailyTips: [
      '把常用物品从高处挪到腰部高度，减少反复够高的动作',
      '推类动作与拉类动作按 1:2 安排，练胸的同时一定练背',
      '卧推时主动"把肩胛骨收拢压在凳子上"，能显著减少肩前侧负荷',
    ],
  }),

  shoulder_night_pain: S({
    id: 'shoulder_night_pain',
    cn: '侧睡压着的肩膀痛',
    aliases: ['睡觉压肩痛', '夜间肩痛', '侧卧肩膀痛', '肩袖损伤'],
    region: 'shoulder',
    summary:
      '夜间痛是肩袖问题的一个典型信号：白天肌肉主动收缩时还能"撑住"，夜里放松下来，受损或劳损的肌腱持续受压，痛感就冒出来了。',
    typical: '常年侧睡、近期上肢训练量突增、40 岁以后反复过顶动作',
    causes: [
      {
        muscle: 'shoulder_rotator_cuff',
        role: 'primary',
        state: 'overworked',
        why: '肩袖肌腱本身血供较差，反复过顶或突然加量后容易进入劳损状态，夜间受压即痛。',
        tell: '侧卧压到患肩时痛醒；手臂外旋抗阻无力；痛感集中在肩外侧（三角肌止点附近）。',
      },
      {
        muscle: 'back_trapezius_lower',
        role: 'secondary',
        state: 'weak',
        why: '肩胛控制不足会让肩袖承担更多稳定工作，加速劳损。',
        tell: '俯卧做 Y 字抬手时患侧明显吃力，肩胛骨后缩困难。',
      },
      {
        muscle: 'chest_pec_minor',
        role: 'secondary',
        state: 'tight',
        why: '前方短缩让肩胛处于前倾位，睡眠平卧时肩袖被挤在更窄的空间里。',
        tell: '平躺时肩前侧有被"吊住"的紧感，手背贴墙困难。',
      },
      {
        muscle: 'back_lat',
        role: 'secondary',
        state: 'tight',
        why: '背阔肌紧张限制肩关节上举空间，夜间手臂上举时会加重挤压。',
        tell: '睡觉时手臂举过头的姿势最难受，放下反而好些。',
      },
    ],
    postures: ['rounded_shoulder'],
    quickChecks: [
      {
        id: 'snp_er',
        name: '抗阻外旋对比',
        steps: [
          '肘部夹在体侧、屈肘 90 度',
          '用另一只手（或弹力带）挡住患侧手背向外转的力',
          '两侧各试一次，比较力量与是否诱发疼痛',
        ],
        meaning:
          '患侧明显无力或诱发同样的痛 → 肩袖劳损可能性高，按方案保守处理并观察 2 周；完全抬不起来（无法外旋或外展）→ 需尽快就医排除肌腱撕裂。',
      },
    ],
    acute: [
      '侧睡时在患侧手臂下方垫一个枕头，让肩不被压扁',
      '尽量仰卧或侧卧在健侧；避免手臂举过头睡',
      '2 周内降低过顶与推类动作量，改做肩胛平面内的低负荷动作',
    ],
    avoid: [
      '忍着夜间痛继续大重量推举',
      '直接按压痛点做深度按摩',
      '把"越痛越按""越痛越拉"当成恢复手段',
    ],
    plan: {
      relax: ['ex_release_scapula_border', 'ex_foam_roll_pec', 'ex_release_cuff_posterior'],
      stretch: ['ex_stretch_cuff_sleeper', 'ex_stretch_pec_minor_corner', 'ex_stretch_lat_hang'],
      activate: ['ex_external_rotation', 'ex_scapular_pullup', 'ex_wall_angel'],
      strengthen: ['ex_side_lying_er', 'ex_cuban_press', 'ex_face_pull', 'ex_db_row'],
    },
    dailyTips: [
      '肩袖类问题需要的是"低负荷 + 高频次"，每天做比一周猛练一次有效',
      '训练量按每周不超过 10% 的幅度增加',
      '床垫过软会让肩部整夜陷进去，适当加硬有帮助',
    ],
    redFlags: [
      '手臂完全无法主动抬起（提示可能存在肩袖撕裂）',
      '肩部明显肿胀、发热或皮肤变色',
      '外伤后无法抬臂、肩部外形改变',
      ...RED_FLAGS_COMMON,
    ],
  }),

  scapula_inner_ache: S({
    id: 'scapula_inner_ache',
    cn: '肩胛骨内侧那条缝酸',
    aliases: ['肩胛骨酸', '背后缝酸', '菱形肌痛', '翼状肩胛', '肩胛骨内侧痛'],
    region: 'shoulder',
    summary:
      '肩胛骨靠肌肉"贴"在胸廓上，本身没有骨头连接。负责把它拉回中线的菱形肌与中下斜方肌一旦疲劳，肩胛就会往外滑，内侧缘那一条缝会又酸又累。',
    typical: '长时间手臂前伸用鼠标、圆肩伏案、练胸远多于练背',
    causes: [
      {
        muscle: 'back_rhomboid',
        role: 'primary',
        state: 'weak',
        why: '菱形肌负责肩胛后缩。它被拉长无力后，肩胛骨被前侧肌群拖离中线，内侧缘持续被牵扯。',
        tell: '把两侧肩胛骨用力往中间夹时，酸感集中出现；维持"夹住"的姿势撑不过 10 秒。',
      },
      {
        muscle: 'back_trapezius_lower',
        role: 'primary',
        state: 'weak',
        why: '中下斜方肌负责肩胛下沉与上回旋，它一弱，肩胛会往上滑、内侧缘翘起。',
        tell: '俯卧做 Y/T 字抬手时患侧明显吃力；放松时患侧肩膀看起来比另一侧高。',
      },
      {
        muscle: 'chest_serratus',
        role: 'secondary',
        state: 'weak',
        why: '前锯肌负责把肩胛贴住胸廓。它无力时会出现"翼状肩胛"，内侧缘格外累。',
        tell: '做俯卧撑推到顶时肩胛骨内侧缘明显翘起（像小翅膀）。',
      },
      {
        muscle: 'chest_pec_minor',
        role: 'secondary',
        state: 'tight',
        why: '胸小肌把肩胛往前下方拉，对抗后侧肌群，让内侧缘长期处于高张力。',
        tell: '肩前锁骨下方按压紧张，靠墙时手背贴不上墙。',
      },
    ],
    postures: ['rounded_shoulder'],
    quickChecks: [
      {
        id: 'sia_squeeze',
        name: '肩胛后缩保持测试',
        steps: [
          '坐直，双臂自然下垂',
          '两侧肩胛骨用力向中间夹，像夹住一支笔',
          '保持 10 秒，观察是否发抖或酸到坚持不住',
        ],
        meaning:
          '撑不到 10 秒或酸感立刻出现 → 后缩肌群耐力不足，这是主因；能轻松保持但日常仍酸 → 更可能是姿势性持续低负荷，重点在工作站调整。',
      },
    ],
    acute: [
      '把手臂前伸的时间打散：每 30 分钟放下手臂做 10 次肩胛后缩',
      '热敷肩胛内侧 15 分钟',
      '避免长时间单手托腮或单侧背包',
    ],
    avoid: [
      '用泡沫轴直接压肩胛骨内侧缘（那里是骨面与肌腱，越压越刺激）',
      '练完胸不练背',
      '长时间保持"挺胸夹背"的僵硬姿势',
    ],
    plan: {
      relax: ['ex_release_scapula_border', 'ex_release_upper_trap', 'ex_foam_roll_pec'],
      stretch: ['ex_stretch_scapula_protract', 'ex_pec_stretch_doorway'],
      activate: ['ex_scapular_pullup', 'ex_wall_angel', 'ex_band_pullapart'],
      strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_seated_cable_row', 'ex_prone_y'],
    },
    dailyTips: [
      '鼠标尽量靠近身体，键盘前沿不超过肘部',
      '显示器上沿与眼睛齐平，避免长时间低头或仰头',
      '拉类动作与推类动作安排到同等容量',
    ],
    redFlags: [
      '肩胛内侧痛伴胸闷、气短、左臂放射痛或出冷汗——先排除心血管问题，立即就医',
      '伴上肢麻木无力或手部精细动作变差',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 上背 ───────────────────
  upper_back_stiff: S({
    id: 'upper_back_stiff',
    cn: '上背发紧、深呼吸也扯着',
    aliases: ['上背紧', '背部僵硬', '呼吸浅', '胸闷', '扩胸就痛'],
    region: 'upper_back',
    summary:
      '胸椎段被"锁"在屈曲位时，肋骨的活动也跟着受限，于是深呼吸会觉得扯着、吸不到底。这不是肺的问题，是胸椎与前侧胸肌一起把胸廓箍住了。',
    typical: '久坐含胸、整天对着笔记本、很少做伸展类动作',
    causes: [
      {
        muscle: 'back_trapezius_lower',
        role: 'primary',
        state: 'weak',
        why: '中下斜方肌是胸椎伸展的主动肌之一，它无力时胸椎段只能靠被动结构维持。',
        tell: '俯卧做"眼镜蛇式"时胸骨离地不高，且腰比背更酸（腰部代偿）。',
      },
      {
        muscle: 'back_rhomboid',
        role: 'primary',
        state: 'weak',
        why: '菱形肌与中下斜方一起维持胸椎挺立，长期被拉长后上背整片发紧。',
        tell: '肩胛骨内侧缘酸，且夹背动作撑不久。',
      },
      {
        muscle: 'chest_pec_minor',
        role: 'secondary',
        state: 'tight',
        why: '胸小肌短缩直接限制胸廓扩张，是"深呼吸扯着"的直接来源。',
        tell: '深吸气时锁骨下方与前胸有牵扯感，扩胸动作做不到位。',
      },
      {
        muscle: 'back_erector',
        role: 'secondary',
        state: 'overworked',
        why: '胸段竖脊肌长期被拉长却要维持姿势，处于"又长又累"的状态。',
        tell: '沿着脊柱两侧（肩胛骨之间）按压有广泛酸痛，伸展一下会舒服。',
      },
    ],
    postures: ['thoracic_kyphosis', 'rounded_shoulder'],
    quickChecks: [
      {
        id: 'ubs_cobra',
        name: '俯卧胸椎伸展观察',
        steps: [
          '俯卧，双手放在肩两侧，前额贴地',
          '缓慢用手把上半身撑起（骨盆不要离地）',
          '看胸骨能离地多高，注意是背在酸还是腰在酸',
        ],
        meaning:
          '胸椎能撑起但主要酸在背部 → 胸椎伸肌无力，这是主因；如果腰先酸、腰先受不了 → 是腰部在代偿，先减少幅度再练。',
      },
    ],
    acute: [
      '每 30-45 分钟站起来做一次"胸前张开"的伸懒腰，配 3 次深呼吸',
      '用泡沫轴横向垫在胸椎下方（垫肩胛下缘附近，不是腰椎），做 5 次缓慢后展',
      '暂停需要长时间弓背的器械划船',
    ],
    avoid: [
      '用外力强行"压背"或追求咔咔响',
      '把泡沫轴垫在腰椎上做同样动作（腰椎不适合这么压）',
      '长时间维持一个"刻意挺直"的僵硬姿势',
    ],
    plan: {
      relax: ['ex_foam_roll_pec', 'ex_release_erector', 'ex_release_scapula_border'],
      stretch: ['ex_stretch_child_pose', 'ex_pec_stretch_doorway', 'ex_stretch_serratus_wall'],
      activate: ['ex_wall_angel', 'ex_prone_y', 'ex_band_pullapart'],
      strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_seated_cable_row'],
    },
    dailyTips: [
      '每天保证几分钟"胸打开"的时间（门框拉伸、靠墙天使），比周末猛练有效',
      '久坐时在腰部垫一个靠垫，能让胸椎更容易挺起来',
      '呼吸练习：吸气时让两侧肋骨向外扩，而不是只抬肩膀',
    ],
    redFlags: [
      '背痛伴晨僵超过 30 分钟、活动后缓解、夜间痛醒——需就医排查炎症性关节病',
      '伴发热、不明原因体重下降或进行性加重',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 腰背 ───────────────────
  low_back_sit_pain: S({
    id: 'low_back_sit_pain',
    cn: '久坐下背酸、起身要缓一下',
    aliases: ['腰酸', '坐下就腰痛', '站起来腰酸', '下背痛', '久坐腰疼'],
    region: 'low_back',
    summary:
      '坐姿把髋屈肌维持在缩短位，同时让臀肌"关机"。于是骨盆被拉向前倾，腰椎前凸加大，竖脊肌与腰方肌只能一直绷着把躯干撑住——酸的是腰，问题常常在髋。',
    typical: '每天坐 6 小时以上、开车通勤、核心训练长期缺席',
    causes: [
      {
        muscle: 'hip_iliopsoas',
        role: 'primary',
        state: 'tight',
        why: '久坐让髂腰肌长期处于缩短位，站起来时它会把腰椎往前拽。',
        tell: '坐久了站起来腰要"缓"几秒才伸得直；仰卧时患侧腿自然向外撇、不能完全放平。',
      },
      {
        muscle: 'hip_glute_max',
        role: 'primary',
        state: 'weak',
        why: '臀大肌被抑制后，本该由它完成的伸髋全部转嫁给腰部伸肌。',
        tell: '俯卧或四足位做"后蹬腿"时几乎感觉不到臀部发力，腰先酸。',
      },
      {
        muscle: 'core_transverse',
        role: 'primary',
        state: 'weak',
        why: '腹横肌负责从前面兜住躯干压力，它不工作时腰椎前侧失去支撑。',
        tell: '仰卧做"死虫"动作时腰会离地、腹部发抖；咳嗽或提重物时腰部有"顶出来"的感觉。',
      },
      {
        muscle: 'back_erector',
        role: 'secondary',
        state: 'overworked',
        why: '竖脊肌长期代偿维持姿势，是"酸"的直接感受器。',
        tell: '脊柱两侧那两条竖着的肌肉按压广泛酸痛，伸展腰部会舒服。',
      },
      {
        muscle: 'back_ql',
        role: 'secondary',
        state: 'overworked',
        why: '腰方肌在单侧受力（翘二郎腿、单侧背包）时尤其容易过载。',
        tell: '单侧腰更酸，久坐后站起来那一下最明显。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'lbs_bridge',
        name: '臀桥发力观察',
        steps: [
          '仰卧屈膝，脚掌踩地',
          '收紧臀部把骨盆抬起来，到肩-髋-膝成一条直线',
          '把手放在臀部与腰部下方，比较哪边更"累"',
        ],
        meaning:
          '腰比臀更酸、或抬到一半就抽筋 → 臀大肌没有接管伸髋，先做激活再谈强化；臀部先累 → 发力正确，可以直接进入强化。',
      },
    ],
    acute: [
      '把坐姿时间切碎：每 30 分钟站起来走 1-2 分钟',
      '腰酸当天不要做大幅度前屈拉伸（如站立体前屈）',
      '48 小时内若是急性发作用冷敷；慢性酸痛用热敷',
    ],
    avoid: [
      '久坐后立刻做大幅弯腰拉伸或"扭腰"',
      '疼痛期做大重量硬拉、深蹲',
      '长时间维持"挺腰"的僵硬站姿',
    ],
    plan: {
      relax: ['ex_release_psoas', 'ex_release_ql', 'ex_release_erector', 'ex_foam_roll_quad'],
      stretch: ['ex_hip_flexor_stretch', 'ex_stretch_psoas_lunge', 'ex_stretch_quad_standing'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_hip_thrust', 'ex_plank', 'ex_dead_bug', 'ex_romanian_deadlift'],
    },
    dailyTips: [
      '把椅子调高一点、屏幕抬高，减少"塌着坐"',
      '翘二郎腿的习惯单侧受力明显，尽量改掉',
      '站立时双脚平均分担体重，别长期用一侧"稍息"站姿',
    ],
  }),

  low_back_morning_stiff: S({
    id: 'low_back_morning_stiff',
    cn: '早晨起来腰发僵',
    aliases: ['早起腰僵', '晨僵', '起床腰痛', '睡觉腰酸'],
    region: 'low_back',
    summary:
      '夜间长时间保持同一姿势会让腰部组织液循环变慢，起床时僵硬很常见；但"活动后缓解、持续时间短"通常问题不大，若僵硬超过半小时且伴夜间痛，则需要认真排查。',
    typical: '床垫过软或过硬、久坐人群、中老年人、前一天训练量突增',
    causes: [
      {
        muscle: 'back_erector',
        role: 'primary',
        state: 'overworked',
        why: '整夜维持同一姿势让竖脊肌持续低张力收缩，晨起最紧。',
        tell: '起床后弯不下腰，活动 10-20 分钟后明显缓解。',
      },
      {
        muscle: 'hip_iliopsoas',
        role: 'primary',
        state: 'tight',
        why: '睡眠中髋处于屈曲位，髂腰肌本就偏短的人早上会更紧。',
        tell: '仰卧伸直腿时患侧腿放不平；站起来那一刻腰椎前侧有牵拉感。',
      },
      {
        muscle: 'core_transverse',
        role: 'secondary',
        state: 'weak',
        why: '核心支撑不足时，翻身与起床都要靠腰部硬撑。',
        tell: '仰卧从床上坐起时，腰先离床、腹部"顶"起来。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'tight',
        why: '腘绳肌紧张会连带限制骨盆活动，加重晨起僵硬感。',
        tell: '仰卧位直腿抬高不到 70 度就有明显牵拉。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'lbm_time',
        name: '僵硬持续时间记录',
        steps: [
          '起床后记录"从僵硬到基本活动自如"用了多久',
          '连续记录 3 天',
        ],
        meaning:
          '10-20 分钟内缓解 → 多为机械性僵硬，按方案处理；超过 30 分钟、且活动后反而更舒服、伴夜间痛醒 → 需就医排查炎症性问题。',
      },
    ],
    acute: [
      '起床前先在床上做几次"抱膝滚背"，让腰部先活动开',
      '热敷腰部 15 分钟后再下床',
      '当天避免空腹做大重量训练',
    ],
    avoid: [
      '一起床就弯腰刷牙、系鞋带（先活动再弯）',
      '把"越僵越要猛拉"当成策略',
      '长期睡过软的床垫',
    ],
    plan: {
      relax: ['ex_release_erector', 'ex_release_ql', 'ex_release_psoas'],
      stretch: ['ex_stretch_child_pose', 'ex_hip_flexor_stretch', 'ex_stretch_hamstring_supine'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_hip_thrust', 'ex_plank', 'ex_dead_bug', 'ex_side_plank'],
    },
    dailyTips: [
      '床垫的选择标准：侧卧时脊柱从侧面看是一条直线，不塌也不顶',
      '睡前 5 分钟做"抱膝—转膝"的轻柔活动',
      '起床顺序改为：侧身 → 手撑起身 → 再坐起，能明显减少腰部冲击',
    ],
    redFlags: [
      '晨僵超过 30 分钟，活动后缓解，伴夜间痛醒',
      '伴发热、皮疹、眼部不适或血便（需排查系统性病变）',
      ...RED_FLAGS_COMMON,
    ],
  }),

  low_back_to_leg: S({
    id: 'low_back_to_leg',
    cn: '腰痛串到臀腿（放射样）',
    aliases: ['坐骨神经痛', '腿麻', '椎间盘突出', '放射痛', '屁股痛到腿'],
    region: 'low_back',
    summary:
      '疼痛从腰臀部沿大腿后外侧往小腿方向串，往往提示神经受到刺激。这类情况里，肌肉训练只在"没有危险信号、且症状不向外周加重"的前提下才安全——先分诊，再谈练。',
    typical: '久坐、反复弯腰搬物、突然增加训练量、咳嗽打喷嚏时加重',
    causes: [
      {
        muscle: 'back_ql',
        role: 'secondary',
        state: 'overworked',
        why: '腰方肌持续收缩会抬高骨盆、加剧该侧张力，让症状更容易被诱发。',
        tell: '单侧腰部深层酸痛，久坐与翻身时加重。',
      },
      {
        muscle: 'hip_glute_max',
        role: 'secondary',
        state: 'weak',
        why: '臀肌无力让骨盆稳定性下降，腰部与梨状肌区域负担加重。',
        tell: '单腿站立时骨盆明显歪斜（Trendelenburg 样表现）。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'tight',
        why: '腘绳肌紧张会限制神经的滑动空间，牵伸时症状被复制。',
        tell: '仰卧直腿抬高时，串痛会向下复制（需与肌肉牵拉感区分：是"串"还是"绷"）。',
      },
      {
        muscle: 'core_transverse',
        role: 'secondary',
        state: 'weak',
        why: '核心支撑不足使腰椎小节活动缺乏控制。',
        tell: '仰卧抬腿时腰会离地；翻身时腰部"一格一格"地动。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'lbl_slr',
        name: '直腿抬高（有无放射）',
        steps: [
          '仰卧，一侧腿伸直缓慢抬起（另一腿保持贴地）',
          '抬到有感觉为止，注意是"肌肉绷紧"还是"往下串的痛或麻"',
          '两侧对比，记录角度',
        ],
        meaning:
          '只是大腿后侧绷紧 → 腘绳肌紧张，可正常拉伸；出现往下串的痛麻 → 神经受累，不要再做加重它的动作，先就医评估。',
      },
    ],
    acute: [
      '避免任何会把症状"往外周推"的动作（如直腿前屈、坐位体前屈、强力拉伸腘绳肌）',
      '找到"中央化"的姿势：多数人俯卧或后仰时症状会往腰部集中，这是好现象，多做这个方向',
      '保持日常活动，但避开诱发动作；不要长期绝对卧床',
      '咳嗽打喷嚏时用手撑住腰部，减少瞬间冲击',
    ],
    avoid: [
      '疼痛向下肢加重时继续练',
      '用蛮力做"正骨""复位"或深度按压',
      '长时间久坐（坐位对神经的压力通常最大）',
      '盲目做大重量硬拉与深蹲',
    ],
    plan: {
      relax: ['ex_release_ql', 'ex_release_glute_max', 'ex_release_hamstrings'],
      stretch: ['ex_stretch_child_pose', 'ex_stretch_hamstring_supine'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_plank', 'ex_hip_thrust', 'ex_dead_bug', 'ex_side_plank'],
    },
    dailyTips: [
      '把久坐切成 20-30 分钟一段，站起来走动比任何拉伸都有效',
      '拎东西时靠近身体、屈膝不屈腰',
      '症状往腰部集中是好趋势，往脚的方向发展是坏趋势——记住这个方向性判断',
    ],
    redFlags: [
      '会阴部（鞍区）麻木、大小便失禁或排尿困难——立即急诊',
      '双腿进行性无力、走路发飘或频繁绊倒',
      '疼痛伴发热、夜间痛醒或不明原因体重下降',
      '外伤后出现的腰腿痛与活动障碍',
      ...RED_FLAGS_COMMON,
    ],
    seeDoctor:
      '出现上述任一危险信号请立即就医；无危险信号但放射痛持续 2 周无改善、或麻木无力加重，也建议做专业评估（必要时影像学检查）。',
  }),

  low_back_after_lift: S({
    id: 'low_back_after_lift',
    cn: '搬东西或硬拉后腰部不适',
    aliases: ['闪腰', '搬东西腰痛', '硬拉后腰痛', '弓背拉伤'],
    region: 'low_back',
    summary:
      '弯腰搬物或大重量拉起时，腰部伸肌承担了主要负荷。急性发作后现代处理原则已经改变：短期保护 + 尽早恢复日常活动，比长期卧床更有效。',
    typical: '搬重物、搬家、硬拉或深蹲后第二天、久坐后突然站起发力',
    causes: [
      {
        muscle: 'back_erector',
        role: 'primary',
        state: 'overworked',
        why: '竖脊肌是伸髋与维持脊柱姿势的主力，超负荷后第二天最酸。',
        tell: '脊柱两侧广泛酸痛，弯腰与后仰都受限，活动后略缓解。',
      },
      {
        muscle: 'back_ql',
        role: 'primary',
        state: 'overworked',
        why: '单侧发力或搬物时躯干侧倾，腰方肌首当其冲。',
        tell: '单侧更痛，向对侧弯腰时牵扯明显。',
      },
      {
        muscle: 'core_transverse',
        role: 'secondary',
        state: 'weak',
        why: '腹内压建立不足时，脊柱缺少"气囊"支撑，负荷直接压到被动结构。',
        tell: '做硬拉时憋气方式不对（全程憋气或完全不憋），腰部有"顶出来"的感觉。',
      },
      {
        muscle: 'hip_glute_max',
        role: 'secondary',
        state: 'weak',
        why: '臀肌不接管伸髋，腰部被动加班。',
        tell: '硬拉后臀部不如腰部酸，甚至完全没感觉。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'lbal_dir',
        name: '疼痛方向偏好测试',
        steps: [
          '站立，缓慢做 5 次后仰（双手扶腰）',
          '休息片刻，缓慢做 5 次前屈（膝盖可微屈）',
          '比较哪个方向更舒服',
        ],
        meaning:
          '后仰更舒服、前屈加重 → 多做后仰方向的活动（ McKenzie 方向偏好），避免反复弯腰；两个方向都剧烈痛或伴下肢放射 → 就医。',
      },
    ],
    acute: [
      '48 小时内冷敷（每次 10-15 分钟），之后改热敷',
      '不要卧床超过 2 天：在"不加重"的范围内维持日常走动',
      '前两天避免弯腰提物，改为屈膝靠近物体再起身',
      '睡眠时在膝下垫一个枕头（仰卧）或两腿间夹枕（侧卧）',
    ],
    avoid: [
      '急性期做大幅度前屈拉伸与扭腰',
      '立即深度推拿或"正骨"',
      '疼痛未退就回到原重量硬拉',
      '长时间保持一个姿势不动',
    ],
    plan: {
      relax: ['ex_release_erector', 'ex_release_ql', 'ex_release_glute_max'],
      stretch: ['ex_stretch_child_pose', 'ex_stretch_hamstring_supine'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_hip_thrust', 'ex_plank', 'ex_dead_bug', 'ex_romanian_deadlift'],
    },
    dailyTips: [
      '搬物原则：靠近身体、屈膝不屈腰、转身不要扭腰',
      '恢复训练时重量从原重量的 50% 起步，先重建动作模式',
      '学会"憋气支撑"（瓦氏呼吸）：吸气到腹部、屏住撑住核心、完成动作后再呼气',
    ],
    redFlags: [
      '无法站立或行走、腰部明显畸形',
      '伴下肢麻木无力或大小便异常',
      '外伤（跌倒、车祸）后出现的腰痛',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 髋臀 ───────────────────
  hip_front_tight: S({
    id: 'hip_front_tight',
    cn: '髋前面紧、久坐站起费劲',
    aliases: ['髋前面紧', '髂腰肌紧张', '屈髋受限', '起身腰要帮一下', '大腿根紧'],
    region: 'hip',
    summary:
      '髋前侧的紧，本质是"坐出来的"。久坐让髂腰肌一直待在缩短位，站起来时它拽着骨盆往前转，腰椎被迫加大前凸来代偿——所以髋紧的人常常腰也酸。',
    typical: '每天久坐、骑车、跑步后不做髋部活动、训练只练腿不练髋',
    causes: [
      {
        muscle: 'hip_iliopsoas',
        role: 'primary',
        state: 'tight',
        why: '髂腰肌是最强屈髋肌，久坐使其长期缩短，站立时把骨盆拉向前倾。',
        tell: '仰卧在床沿让一侧腿自然下垂（另一腿抱膝），垂下的腿抬不到水平；站起时髋前有牵扯感。',
      },
      {
        muscle: 'hip_glute_max',
        role: 'primary',
        state: 'weak',
        why: '臀大肌是伸髋主力，与髂腰肌互为拮抗。它一弱，前侧更收不住。',
        tell: '臀桥时腰比臀更酸；爬楼或上坡感觉"腿在推、臀没参与"。',
      },
      {
        muscle: 'hip_tfl_itb',
        role: 'secondary',
        state: 'tight',
        why: '阔筋膜张肌在久坐与长期单侧受力时缩短，加重髋前外侧的紧张。',
        tell: '髋外侧偏前（裤口袋上方）按压紧张，侧卧时患侧在上更难受。',
      },
      {
        muscle: 'core_rectus',
        role: 'secondary',
        state: 'weak',
        why: '腹直肌负责把骨盆前端拉回来，力量不足时前倾更明显。',
        tell: '仰卧做卷腹时颈部先累、腹部参与感弱。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'hft_thomas',
        name: '托马斯测试（简化版）',
        steps: [
          '坐在床沿或硬桌边，慢慢向后躺下',
          '双手抱住一侧膝盖拉向胸口',
          '观察另一侧自然下垂的腿：大腿能落到水平线以下吗',
        ],
        meaning:
          '垂下的大腿抬起来、落不到水平 → 该侧髂腰肌明显短缩；能落下但膝盖伸不开 → 股四头肌更紧，拉伸要换目标。',
      },
    ],
    acute: [
      '每坐 30 分钟站起来做 10 次高抬腿或髋部绕环',
      '当天避免长时间骑行（骑行是髋屈肌的最短位）',
      '热敷髋前 10-15 分钟后再拉伸，效果更好',
    ],
    avoid: [
      '拉伸时塌腰代偿（会把拉伸力转移到腰椎）',
      '边拉伸边用力顶髋（容易刺激到股神经）',
      '久坐后立刻做大重量深蹲',
    ],
    plan: {
      relax: ['ex_release_psoas', 'ex_foam_roll_quad', 'ex_release_glute_max'],
      stretch: ['ex_stretch_psoas_lunge', 'ex_hip_flexor_stretch', 'ex_standing_hip_flexor'],
      activate: ['ex_glute_bridge', 'ex_dead_bug'],
      strengthen: ['ex_hip_thrust', 'ex_romanian_deadlift', 'ex_plank'],
    },
    dailyTips: [
      '工位改成"坐站交替"，哪怕每小时站 5 分钟',
      '拉伸髋屈肌时先做骨盆后倾（把腰贴地），再往后送髋',
      '跑步训练日结束后补 5 分钟髋部活动',
    ],
  }),

  hip_side_sleep_pain: S({
    id: 'hip_side_sleep_pain',
    cn: '侧睡时髋外侧压着痛',
    aliases: ['侧睡髋痛', '大转子痛', '髋外侧痛', '压着胯骨痛'],
    region: 'hip',
    summary:
      '侧卧时身体的重量正好压在髋外侧的骨突上。这里的臀中肌肌腱与滑囊本就被长期受力，一压就痛——它常常不是"练少了"，而是"压多了 + 臀中肌耐力不够"。',
    typical: '常年固定一侧睡、跑步量突增、单腿支撑类运动（羽毛球、篮球）',
    causes: [
      {
        muscle: 'hip_glute_med',
        role: 'primary',
        state: 'overworked',
        why: '臀中肌肌腱止于大转子，长期单腿支撑与受压会让这一带进入劳损状态。',
        tell: '患侧在上侧卧时（腿往下压）更痛；单腿站立时骨盆会往对侧掉。',
      },
      {
        muscle: 'hip_tfl_itb',
        role: 'secondary',
        state: 'tight',
        why: '髂胫束张力过高会把压力集中到大转子表面。',
        tell: '髋外侧从上到下一整条紧张；屈伸髋时有"弹响髋"的感觉。',
      },
      {
        muscle: 'hip_glute_max',
        role: 'secondary',
        state: 'weak',
        why: '臀大肌上部纤维也止于髂胫束，它无力时张力分布更差。',
        tell: '臀桥时臀部参与感弱；爬楼时大腿前侧先酸。',
      },
    ],
    postures: ['knee_valgus'],
    quickChecks: [
      {
        id: 'hsp_single',
        name: '单腿站立观察',
        steps: [
          '单腿站立，另一腿屈膝抬起',
          '请人从背后看骨盆是否水平',
          '坚持 20 秒，观察是否明显晃动或髋外侧发酸',
        ],
        meaning:
          '骨盆往抬起腿的一侧掉、或 20 秒内髋外侧发酸 → 臀中肌耐力不足，是训练重点；能稳定保持则更多是受压问题，优先改睡姿。',
      },
    ],
    acute: [
      '侧睡时在两膝之间夹一个枕头，避免上面的腿往下压',
      '尽量换到健侧卧或仰卧（膝下垫枕）',
      '减少直接压迫痛点的动作：盘腿、跷二郎腿、长时间单侧站',
      '48 小时内冷敷 10-15 分钟，之后改热敷',
    ],
    avoid: [
      '用泡沫轴直接猛滚大转子骨突处（骨面上滚会加重刺激）',
      '忍痛继续长距离跑',
      '长时间跷二郎腿',
    ],
    plan: {
      relax: ['ex_release_glute_med', 'ex_foam_roll_itb', 'ex_release_glute_max'],
      stretch: ['ex_stretch_figure4', 'ex_stretch_adductor_butterfly'],
      activate: ['ex_clamshell', 'ex_side_lying_raise'],
      strengthen: ['ex_band_walk', 'ex_side_lying_raise', 'ex_hip_thrust', 'ex_copenhagen'],
    },
    dailyTips: [
      '床垫太软会让髋部整夜陷进去，适当加硬或加一层垫子',
      '跑步量每周增幅控制在 10% 以内',
      '臀中肌是耐力肌：小重量、高次数、每天做，效果远好于一周猛练一次',
    ],
    redFlags: [
      '髋外侧痛伴跛行、无法单腿站立或夜间静息痛',
      '伴髋部活动明显受限或下肢不等长感',
      ...RED_FLAGS_COMMON,
    ],
  }),

  butt_deep_ache: S({
    id: 'butt_deep_ache',
    cn: '臀部深处酸、坐久了加重',
    aliases: ['屁股深处酸', '坐久屁股痛', '梨状肌', '屁股筋痛', '坐骨那块痛'],
    region: 'hip',
    summary:
      '臀部深处的酸胀多数来自臀肌本身的耐力不足与久坐压迫：臀肌"关机"后，深层的稳定肌被迫长时间工作，坐得越久越酸。若伴向下串的麻痛，则需优先排查神经来源。',
    typical: '每天久坐 8 小时、钱包放后裤袋、长时间开车、跑步量突增',
    causes: [
      {
        muscle: 'hip_glute_max',
        role: 'primary',
        state: 'weak',
        why: '臀大肌负责伸髋与外旋，久坐让它长期处于被抑制的拉长位。',
        tell: '臀桥与髋推时臀部参与感弱；久坐起身后要走几步才"活过来"。',
      },
      {
        muscle: 'hip_glute_med',
        role: 'secondary',
        state: 'weak',
        why: '臀中肌负责单腿支撑时的骨盆稳定，耐力不足时深层结构代偿。',
        tell: '单腿站立时骨盆往对侧掉；侧卧抬腿时大腿外侧先酸。',
      },
      {
        muscle: 'hip_iliopsoas',
        role: 'secondary',
        state: 'tight',
        why: '前侧缩短让骨盆位置改变，臀部深层被动处于不利长度。',
        tell: '仰卧时患侧腿自然外撇；站起时髋前有牵扯。',
      },
      {
        muscle: 'core_transverse',
        role: 'secondary',
        state: 'weak',
        why: '核心不兜底时，骨盆稳定性整体下降。',
        tell: '仰卧抬腿腰会离地；长时间坐姿容易塌腰。',
      },
    ],
    postures: ['anterior_pelvic_tilt', 'knee_valgus'],
    quickChecks: [
      {
        id: 'bda_sit',
        name: '坐站对比',
        steps: [
          '连续坐 30 分钟后，站起来评估臀部酸的程度（0-10）',
          '走动 2 分钟后再评估一次',
        ],
        meaning:
          '走动后明显缓解 → 以压迫与抑制为主，按方案练；走动后依旧酸或加重、且向下肢串 → 需排查神经与其它来源。',
      },
    ],
    acute: [
      '每 40 分钟站起来走动 2 分钟',
      '把后裤袋里的钱包、手机取出（"钱包坐骨神经"很常见）',
      '热敷或温水淋浴臀部 10 分钟',
    ],
    avoid: [
      '直接用硬物（网球、按摩球）顶压坐骨正下方（那里有神经经过）',
      '久坐后直接冲去跑长距离',
      '忍痛做大量深蹲',
    ],
    plan: {
      relax: ['ex_release_glute_max', 'ex_release_glute_med', 'ex_release_psoas'],
      stretch: ['ex_stretch_figure4', 'ex_stretch_psoas_lunge'],
      activate: ['ex_glute_bridge', 'ex_clamshell'],
      strengthen: ['ex_hip_thrust', 'ex_side_lying_raise', 'ex_band_walk', 'ex_romanian_deadlift'],
    },
    dailyTips: [
      '坐垫选前低后高的款式，或在前部加楔形垫，能减少坐骨区压力',
      '开车超过 1 小时，下车活动 3 分钟',
      '臀部训练要"先激活再负重"：徒手臀桥找到发力感后再加重量',
    ],
    redFlags: [
      '臀部痛伴下肢麻木、串痛或足背/足底感觉减退',
      '进行性下肢无力或走路发飘',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 膝 ───────────────────
  knee_front_pain: S({
    id: 'knee_front_pain',
    cn: '膝盖前方或髌骨周围酸痛',
    aliases: ['膝盖痛', '髌骨软化', '跑步膝', '深蹲膝盖痛', '髌股关节痛'],
    region: 'knee',
    summary:
      '髌骨像滑轮一样在股骨的沟槽里滑动。大腿前侧偏紧、臀中肌控制不足时，髌骨会被拉偏，滑动轨迹歪了就会磨出酸痛。因此"膝前痛"的治疗重点常常不在膝盖，而在髋。',
    typical: '跑步、深蹲、久坐后突然运动、上下楼梯、女生久坐后久站',
    causes: [
      {
        muscle: 'thigh_quads',
        role: 'primary',
        state: 'tight',
        why: '股四头肌（尤其外侧头）紧张会把髌骨向外上方拉，改变滑动轨迹。',
        tell: '跪坐或把脚跟拉向臀部时膝前发紧；久坐后站起来那一瞬间最酸。',
      },
      {
        muscle: 'hip_glute_med',
        role: 'primary',
        state: 'weak',
        why: '臀中肌控不住股骨内旋内收，膝盖相对外偏，髌骨轨迹随之歪斜。',
        tell: '单腿下蹲时膝盖明显往内塌；单腿站立骨盆往对侧掉。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'weak',
        why: '腘绳肌与股四头肌共同稳定膝关节，前后失衡会增加髌股关节压力。',
        tell: '俯卧屈膝抗阻时力量明显弱于伸膝；跑下坡时控制不住。',
      },
      {
        muscle: 'calf_gastroc',
        role: 'secondary',
        state: 'tight',
        why: '小腿后侧紧张限制踝背屈，下蹲时身体会用膝前移来代偿。',
        tell: '弓步靠墙测试时脚跟离墙很近就跟腱小腿后侧绷紧。',
      },
    ],
    postures: ['knee_valgus'],
    quickChecks: [
      {
        id: 'kfp_squat',
        name: '单腿下蹲轨迹观察',
        steps: [
          '面对镜子单腿站立，另一腿微屈抬起',
          '缓慢下蹲约 30-45 度',
          '观察膝盖是否朝脚尖方向，还是向内塌',
        ],
        meaning:
          '膝盖向内塌 → 髋的控制是主战场（臀中肌）；膝盖基本对位但仍痛 → 多与训练量突增有关，先减量再练。',
      },
    ],
    acute: [
      '先把跑量或深蹲量减 30-50%，换游泳、骑车等低冲击形式',
      '冰敷膝前 10-15 分钟（运动后）',
      '下蹲深度退到不痛的范围，别勉强蹲到底',
    ],
    avoid: [
      '忍痛跑长距离或加大重量深蹲',
      '长时间屈膝久坐（"影剧院膝"）',
      '做完全伸直位的负重伸膝（末端压力最大）',
    ],
    plan: {
      relax: ['ex_foam_roll_quad', 'ex_release_glute_med', 'ex_foam_roll_calf'],
      stretch: ['ex_stretch_quad_standing', 'ex_calf_stretch_wall', 'ex_stretch_adductor_butterfly'],
      activate: ['ex_clamshell', 'ex_glute_bridge', 'ex_single_leg_balance'],
      strengthen: ['ex_hip_thrust', 'ex_band_walk', 'ex_leg_extension', 'ex_side_lying_raise'],
    },
    dailyTips: [
      '增加训练量遵守"每周不超过 10%"原则',
      '避免长时间屈膝久坐，坐着时每隔一会儿伸直腿活动',
      '选鞋时关注鞋底磨损：外侧过度磨损提示力线偏外',
    ],
    redFlags: [
      '膝盖明显肿胀、发热、绞锁或打软腿（无法承重）',
      '外伤后即刻肿胀（提示可能有韧带或半月板损伤）',
      ...RED_FLAGS_COMMON,
    ],
  }),

  knee_inner_pain: S({
    id: 'knee_inner_pain',
    cn: '膝盖内侧痛',
    aliases: ['膝内侧痛', '鹅足滑囊', '内侧副韧带', '膝盖里面痛'],
    region: 'knee',
    summary:
      '膝盖内侧的痛常与"膝盖往内塌 + 足弓塌陷"的组合有关：内侧结构被持续挤压拉长。单纯按痛点处理往往无效，需要同时看髋的稳定和足的支撑。',
    typical: '长距离跑、深蹲量大、扁平足、体重较大、中老年',
    causes: [
      {
        muscle: 'hip_glute_med',
        role: 'primary',
        state: 'weak',
        why: '臀中肌控制不足导致动态膝外翻，内侧结构被拉长受压。',
        tell: '单腿下蹲时膝盖往内塌；单腿站立骨盆往对侧掉。',
      },
      {
        muscle: 'thigh_adductor',
        role: 'secondary',
        state: 'tight',
        why: '内收肌紧张会把张力集中到膝内侧止点区域。',
        tell: '做蝴蝶式拉伸时腹股沟到膝内侧一带明显紧张。',
      },
      {
        muscle: 'foot_tibialis_post',
        role: 'secondary',
        state: 'weak',
        why: '胫骨后肌支撑足弓，它无力时足弓塌陷、小腿内旋，连锁到膝内侧。',
        tell: '站立时足弓塌陷、足跟外偏；单腿提踵做不了多次。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'weak',
        why: '腘绳肌（尤其内侧）参与抵抗膝外翻，力量不足时内侧缺少保护。',
        tell: '俯卧屈膝抗阻时患侧明显更弱。',
      },
    ],
    postures: ['knee_valgus', 'flat_foot'],
    quickChecks: [
      {
        id: 'kip_arch',
        name: '坐—站足弓对比',
        steps: ['坐着看足内侧弓形', '站起来负重再看同一位置', '比较塌陷程度'],
        meaning:
          '一站就塌 → 足弓支撑不足是链条的一环，必须同时练胫骨后肌；足弓维持良好 → 重点回到髋部控制。',
      },
    ],
    acute: [
      '减少跑量与深蹲量 30-50%，换成直线路面的快走或骑行',
      '冰敷内侧 10-15 分钟（运动后）',
      '避免内扣动作模式：下蹲时刻意让膝盖对准第 2-3 脚趾',
    ],
    avoid: [
      '忍痛继续长跑',
      '做"膝盖夹球"类动作硬顶到痛',
      '长期穿磨偏的旧跑鞋',
    ],
    plan: {
      relax: ['ex_release_adductor', 'ex_release_glute_med', 'ex_foam_roll_calf'],
      stretch: ['ex_stretch_adductor_butterfly'],
      activate: ['ex_clamshell', 'ex_short_foot'],
      strengthen: ['ex_band_walk', 'ex_side_lying_raise', 'ex_tibialis_post_strengthen', 'ex_hip_thrust'],
    },
    dailyTips: [
      '跑鞋每 500-800 公里更换一次',
      '训练中把注意力放在"膝盖对准脚尖"上，比事后拉伸更重要',
      '体重较大者先用快走与骑行建立基础，再逐步加入跑',
    ],
    redFlags: [
      '外伤后内侧痛伴无法负重或明显松弛感',
      '关节绞锁、突然卡住无法伸屈',
      ...RED_FLAGS_COMMON,
    ],
  }),

  knee_stairs_pain: S({
    id: 'knee_stairs_pain',
    cn: '下楼梯膝盖痛、腿发软',
    aliases: ['下楼梯膝盖痛', '腿软', '上下楼痛', '膝盖打软'],
    region: 'knee',
    summary:
      '下楼梯时股四头肌在做离心收缩（一边被拉长一边发力），这是肌肉最容易受损、也最考验控制的模式。"腿发软"本质上是控制不住下降速度。',
    typical: '体重较大、久坐少动、跑步或爬山后、膝超伸人群',
    causes: [
      {
        muscle: 'thigh_quads',
        role: 'primary',
        state: 'overworked',
        why: '下楼时股四头肌承担主要离心负荷，耐力不足就会痛与发软。',
        tell: '下楼比上楼明显更痛；单腿缓慢下蹲（离心）时抖得厉害。',
      },
      {
        muscle: 'hip_glute_med',
        role: 'primary',
        state: 'weak',
        why: '臀中肌稳定股骨，控制不足时下降过程中膝盖会内塌、力线变差。',
        tell: '单腿下楼梯时骨盆往对侧掉、膝盖往内。',
      },
      {
        muscle: 'calf_soleus',
        role: 'secondary',
        state: 'tight',
        why: '比目鱼肌紧张限制踝背屈，下降时更多负荷被推向膝关节。',
        tell: '屈膝版本的靠墙推测试（膝盖顶墙）脚跟抬不起来。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'weak',
        why: '腘绳肌协助控制下降，力量不足时膝关节缺乏后侧支撑。',
        tell: '俯卧屈膝抗阻力量偏弱；下坡时控制差。',
      },
    ],
    postures: ['knee_valgus', 'knee_hyperextension'],
    quickChecks: [
      {
        id: 'ksp_stepdown',
        name: '台阶下降观察',
        steps: [
          '站在 15-20 厘米台阶上，单腿支撑',
          '缓慢把另一条腿的脚跟放到地面再收回（控制 3 秒）',
          '观察膝盖是否内塌、骨盆是否歪斜',
        ],
        meaning:
          '膝盖内塌或骨盆歪斜 → 髋部控制是主因；对位良好但发抖酸痛 → 股四头肌离心耐力不足，重点练离心下蹲。',
      },
    ],
    acute: [
      '减少下坡与下楼的重复次数（尤其是负重下楼）',
      '下楼时扶扶手分担部分负荷',
      '冰敷 10-15 分钟（症状明显时）',
    ],
    avoid: [
      '连续多日爬山或长距离下坡',
      '痛的时候做跳箱、深蹲跳',
      '把"腿软"当成缺钙自行补钙了事',
    ],
    plan: {
      relax: ['ex_foam_roll_quad', 'ex_release_soleus', 'ex_release_glute_med'],
      stretch: ['ex_stretch_quad_standing', 'ex_stretch_soleus_wall'],
      activate: ['ex_clamshell', 'ex_single_leg_balance'],
      strengthen: ['ex_bulgarian_split_squat', 'ex_leg_curl', 'ex_hip_thrust', 'ex_band_walk'],
    },
    dailyTips: [
      '练"慢速下蹲"：3 秒下、1 秒上，每周 2-3 次，比普通深蹲更对症',
      '下楼时缩短步幅、放慢速度',
      '体重每减 1 公斤，膝关节在上下楼时承受的负荷约减少 4 公斤',
    ],
  }),

  // ─────────────────── 小腿 ───────────────────
  shin_splint: S({
    id: 'shin_splint',
    cn: '跑后小腿前内侧痛（外胫夹）',
    aliases: ['外胫夹', '小腿前侧痛', '跑步腿疼', '胫骨内侧痛'],
    region: 'lower_leg',
    summary:
      '跑步落地时胫骨前肌要反复"刹车"控制脚掌下落。跑量涨得太快，它就被累到发炎——痛在小腿内侧中下段，是典型的"负荷超过组织承受能力"。',
    typical: '刚开始跑步、跑量突然增加、硬地跑步、足弓塌陷、军训或体测季',
    causes: [
      {
        muscle: 'calf_tibialis_ant',
        role: 'primary',
        state: 'overworked',
        why: '胫骨前肌负责背屈与落地缓冲，跑量突增时被反复离心拉扯。',
        tell: '小腿内侧沿胫骨内缘中下段有压痛，跑起来痛、热身走一段后反而减轻。',
      },
      {
        muscle: 'foot_intrinsic',
        role: 'secondary',
        state: 'weak',
        why: '足内在肌负责吸收地面的冲击，它无力时冲击全部上移到胫骨周围。',
        tell: '赤脚做"缩足弓"动作困难；长时间站立后足底发酸。',
      },
      {
        muscle: 'calf_gastroc',
        role: 'secondary',
        state: 'tight',
        why: '小腿后侧紧张会限制踝背屈，落地缓冲空间变少。',
        tell: '直腿靠墙推测试时脚跟离墙较近就绷紧。',
      },
      {
        muscle: 'foot_tibialis_post',
        role: 'secondary',
        state: 'weak',
        why: '足弓支撑不足使落地时的旋前增加，牵拉胫骨内侧。',
        tell: '站立时足弓塌陷、足跟外偏明显。',
      },
    ],
    postures: ['flat_foot'],
    quickChecks: [
      {
        id: 'ss_hop',
        name: '单腿轻跳测试',
        steps: ['单腿站立', '原地小幅轻跳 10 次（约 5 厘米高）', '观察是否诱发同样的痛'],
        meaning:
          '诱发疼痛且是"钝痛一片" → 外胫夹，按方案减量处理；若痛变成"某个固定点锐痛"且夜间也痛 → 需拍片排除胫骨应力性骨折。',
      },
    ],
    acute: [
      '跑量先减 50%，改为快走、游泳、骑行维持体能',
      '避开硬地（水泥）与下坡跑，改塑胶跑道或草地',
      '跑后冰敷小腿内侧 10-15 分钟',
      '2 周内不做跳跃类与折返跑',
    ],
    avoid: [
      '忍痛跑完全程或"跑开就好了"',
      '在水泥地做间歇跑',
      '疼痛未退就参加比赛或体测',
    ],
    plan: {
      relax: ['ex_release_tibialis', 'ex_foam_roll_calf', 'ex_release_soleus'],
      stretch: ['ex_stretch_kneeling_tibialis', 'ex_stretch_soleus_wall'],
      activate: ['ex_short_foot', 'ex_towel_curl'],
      strengthen: ['ex_tibialis_raise', 'ex_tibialis_post_strengthen', 'ex_seated_calf_raise', 'ex_short_foot'],
    },
    dailyTips: [
      '跑量每周增幅不超过 10%',
      '鞋底磨损严重或超过 600-800 公里就换鞋',
      '提高步频（约 170-180 步/分）能降低每次落地的冲击',
    ],
    redFlags: [
      '小腿内侧出现固定一点的骨性锐痛、夜间也痛、一负重就痛',
      '局部明显肿胀发红发热',
      '单腿跳完全无法完成',
      ...RED_FLAGS_COMMON,
    ],
  }),

  calf_cramp: S({
    id: 'calf_cramp',
    cn: '半夜小腿抽筋',
    aliases: ['抽筋', '小腿痉挛', '夜间抽筋', '腿抽筋'],
    region: 'lower_leg',
    summary:
      '夜间小腿抽筋多数与"白天肌肉疲劳 + 睡眠时脚尖下垂的缩短位 + 体液电解质不足"三者叠加有关。单纯补钙通常不是主因；关键在于减少疲劳与避免缩短位。',
    typical: '白天久站久走、大量出汗、孕期、趴睡（脚尖朝下）、老年人',
    causes: [
      {
        muscle: 'calf_gastroc',
        role: 'primary',
        state: 'overworked',
        why: '腓肠肌跨膝跨踝，白天负荷累积后夜间容易进入异常放电状态。',
        tell: '抽筋时小腿后方上段（膝下）硬成一团，脚掌不由自主向下勾。',
      },
      {
        muscle: 'calf_soleus',
        role: 'primary',
        state: 'tight',
        why: '比目鱼肌只跨踝关节，趴睡时脚尖下垂正好把它放到最短位。',
        tell: '小腿下段（靠近跟腱）抽；趴着睡或被子压住脚背时更容易发作。',
      },
      {
        muscle: 'thigh_hamstrings',
        role: 'secondary',
        state: 'tight',
        why: '腘绳肌紧张常与小腿一起处于高张力，牵一发而动全身。',
        tell: '坐位体前屈受限明显；大腿后侧也偶有抽筋。',
      },
    ],
    postures: [],
    quickChecks: [
      {
        id: 'cc_trigger',
        name: '脚尖位置诱发测试',
        steps: ['坐在床上，把脚尖主动向下踩（脚背绷直）保持 10 秒', '观察是否诱发抽筋前的"预感"'],
        meaning:
          '主动勾脚尖能快速缓解、脚尖向下容易诱发 → 缩短位触发是主因，睡眠姿势是优先调整项；与姿势无关且频繁发作 → 关注日间疲劳与水分电解质。',
      },
    ],
    acute: [
      '抽筋时缓慢、持续地把脚尖向小腿方向勾（勾脚背），而不是猛力掰',
      '站起来把重心移到该腿，缓慢走动 1-2 分钟',
      '之后轻揉放松，喝一杯温水',
    ],
    avoid: [
      '猛力拉扯或让别人掰脚趾',
      '抽筋后立刻继续睡觉而不活动开',
      '出汗很多却只喝白水不补电解质',
    ],
    plan: {
      relax: ['ex_foam_roll_calf', 'ex_release_soleus', 'ex_release_hamstrings'],
      stretch: ['ex_calf_stretch_wall', 'ex_stretch_soleus_wall', 'ex_stretch_hamstring_supine'],
      activate: ['ex_standing_calf_raise'],
      strengthen: ['ex_standing_calf_raise', 'ex_seated_calf_raise', 'ex_tibialis_raise'],
    },
    dailyTips: [
      '睡前做 3 组小腿拉伸（直腿 + 屈膝各 30 秒）',
      '避免趴睡；用被子压住脚背会让脚尖长期下垂',
      '白天大量出汗时补充含电解质的饮品，而不是只喝白水',
    ],
    redFlags: [
      '频繁抽筋伴下肢水肿、皮肤变色或夜间静息痛',
      '伴下肢麻木、走路距离明显变短（间歇性跛行）',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 足踝 ───────────────────
  heel_pain_morning: S({
    id: 'heel_pain_morning',
    cn: '足跟晨起第一步痛',
    aliases: ['足跟痛', '足底筋膜炎', '踩地痛', '脚跟疼', '骨刺'],
    region: 'foot',
    summary:
      '足底筋膜经过一整夜的缩短，清晨第一次负重时被猛地拉开，所以"第一步最痛、走几步后缓解"是典型特征。它本质是负荷管理问题：拉伸有帮助，但渐进负重训练更关键。',
    typical: '长时间站立、体重较大、跑量突增、常穿硬底或支撑差的鞋、久站工作者',
    causes: [
      {
        muscle: 'calf_gastroc',
        role: 'primary',
        state: 'tight',
        why: '小腿后侧紧张会限制踝背屈，把更多张力转移到足底筋膜。',
        tell: '直腿靠墙推测试时脚跟抬不起；上坡或踮脚时小腿紧绷。',
      },
      {
        muscle: 'calf_soleus',
        role: 'primary',
        state: 'tight',
        why: '比目鱼肌是维持站立的主力，紧张时足底筋膜的持续张力更高。',
        tell: '屈膝版本的靠墙推测试同样受限；久站后症状加重。',
      },
      {
        muscle: 'foot_intrinsic',
        role: 'secondary',
        state: 'weak',
        why: '足内在肌负责维持足弓，它无力时筋膜被动承担过多张力。',
        tell: '做"缩足弓"（不用弯脚趾把足弓提起来）时几乎做不出动作。',
      },
      {
        muscle: 'foot_tibialis_post',
        role: 'secondary',
        state: 'weak',
        why: '胫骨后肌支撑内侧纵弓，功能不足时足弓塌陷、筋膜被拉长。',
        tell: '站立时足弓塌陷、足跟外偏；单腿提踵次数明显少。',
      },
    ],
    postures: ['flat_foot'],
    quickChecks: [
      {
        id: 'hpm_first',
        name: '第一步与走一段后对比',
        steps: ['起床下地第一步，给疼痛打分（0-10）', '走动 2 分钟后再打分', '对比两次分数'],
        meaning:
          '第二步明显缓解 → 典型足底筋膜负荷问题，按方案处理；走动后反而加重或持续整天 → 需就医排查其它来源（脂肪垫、神经、应力反应）。',
      },
    ],
    acute: [
      '下床前先在床上做 10 次勾脚，再用毛巾套住前脚掌轻拉 30 秒',
      '床边备一双硬底拖鞋，避免赤脚踩硬地',
      '减少长时间站立；站立时轮换重心',
      '运动后冰敷足跟（可用冰水瓶滚 10 分钟）',
    ],
    avoid: [
      '赤脚在硬地板上长时间走',
      '穿鞋底磨平或完全平底的鞋',
      '忍痛跑长距离或久站',
    ],
    plan: {
      relax: ['ex_release_foot_plantar', 'ex_foam_roll_calf', 'ex_release_soleus'],
      stretch: ['ex_calf_stretch_wall', 'ex_stretch_soleus_wall', 'ex_stretch_toe_flexor'],
      activate: ['ex_short_foot', 'ex_towel_curl'],
      strengthen: ['ex_short_foot', 'ex_towel_curl', 'ex_tibialis_post_strengthen', 'ex_seated_calf_raise'],
    },
    dailyTips: [
      '足跟垫或支撑鞋垫有帮助，但只是争取时间的手段，训练才是根本',
      '控制体重对足底筋膜的减负效果最明显',
      '这类问题恢复以"月"为单位，坚持 8-12 周才看得到明显变化',
    ],
    redFlags: [
      '跟腱区域肿痛、单腿提踵无力（需排除跟腱病变）',
      '足跟剧痛且无法负重、伴明显肿胀',
      '伴足部麻木、发凉或肤色改变',
      ...RED_FLAGS_COMMON,
    ],
  }),

  arch_fatigue: S({
    id: 'arch_fatigue',
    cn: '走路久了足弓酸、脚底板累',
    aliases: ['足弓酸', '脚底板累', '走多了脚痛', '脚心酸'],
    region: 'foot',
    summary:
      '足弓靠"肌肉 + 韧带 + 骨骼排列"三者共同维持，其中肌肉是唯一能训练的部分。足内在肌与胫骨后肌耐力不足时，走久了足弓就撑不住，酸胀往下传导到脚心。',
    typical: '扁平足、长时间站立工作、突然增加步行量、常穿软底鞋',
    causes: [
      {
        muscle: 'foot_intrinsic',
        role: 'primary',
        state: 'weak',
        why: '足内在肌是维持足弓的第一道肌肉支撑，久坐与长期穿硬底鞋让它失活。',
        tell: '赤脚做"缩足弓"时几乎做不出；走久后脚心（而非足跟）酸。',
      },
      {
        muscle: 'foot_tibialis_post',
        role: 'primary',
        state: 'weak',
        why: '胫骨后肌是内侧纵弓最重要的动态支撑。它一弱，足弓一站就塌。',
        tell: '单腿提踵做不了 10 次；从后面看足跟明显外偏、脚趾外展。',
      },
      {
        muscle: 'calf_gastroc',
        role: 'secondary',
        state: 'tight',
        why: '小腿后侧紧张增加前足负荷，间接加重足弓负担。',
        tell: '直腿靠墙推测试受限；踮脚时小腿绷紧明显。',
      },
    ],
    postures: ['flat_foot'],
    quickChecks: [
      {
        id: 'af_heelraise',
        name: '单腿提踵次数',
        steps: ['单腿站立扶墙保持平衡', '缓慢提踵到最高再放下，做 3 秒一次', '数能做多少次到力竭'],
        meaning:
          '少于 10 次或足弓明显塌陷 → 支撑链耐力不足，这是主因；能做 15 次以上但走路仍酸 → 更多是鞋与站姿问题。',
      },
    ],
    acute: [
      '减少连续站立时间，能坐就坐 5 分钟',
      '换成有足弓支撑的鞋，暂时避免完全平底的鞋',
      '晚上用网球轻滚足底 2-3 分钟（不要顶到痛）',
    ],
    avoid: [
      '突然把日行步数从 3000 拉到 20000',
      '长期穿完全平底或人字拖走远路',
      '用足弓垫替代训练（垫子一撤就回到原样）',
    ],
    plan: {
      relax: ['ex_release_foot_plantar', 'ex_foam_roll_calf'],
      stretch: ['ex_calf_stretch_wall', 'ex_stretch_toe_flexor'],
      activate: ['ex_short_foot', 'ex_towel_curl'],
      strengthen: ['ex_short_foot', 'ex_towel_curl', 'ex_tibialis_post_strengthen', 'ex_tibialis_raise'],
    },
    dailyTips: [
      '在家赤脚走 10 分钟，是足内在肌最便宜的训练',
      '步行量每周增幅不超过 10%',
      '鞋垫可以争取时间，但撤掉之前必须把足部力量练起来',
    ],
  }),

  ankle_unstable: S({
    id: 'ankle_unstable',
    cn: '脚踝反复崴、站不稳',
    aliases: ['崴脚', '脚踝不稳', '习惯性扭伤', '脚踝松'],
    region: 'foot',
    summary:
      '第一次崴脚后，踝关节的位置觉（本体感觉）与腓骨肌反应速度会下降，于是更容易再崴——形成循环。打破它的关键是练平衡与反应，而不是靠护具长期固定。',
    typical: '有过崴脚史、球类与跑跳运动、在不平地面训练、踝背屈受限',
    causes: [
      {
        muscle: 'calf_peroneal',
        role: 'primary',
        state: 'weak',
        why: '腓骨肌是防止踝内翻的第一道防线，反应慢一步就会再崴。',
        tell: '单腿站立在不平面上明显晃动；抗阻足外翻力量弱。',
      },
      {
        muscle: 'calf_tibialis_ant',
        role: 'secondary',
        state: 'weak',
        why: '胫骨前肌负责背屈，力量不足时脚掌落地控制差。',
        tell: '勾脚抗阻无力；走路容易踢到地面。',
      },
      {
        muscle: 'calf_gastroc',
        role: 'secondary',
        state: 'tight',
        why: '背屈受限会让落地时踝关节没有缓冲空间，更容易被"别"到。',
        tell: '靠墙推测试时脚跟离墙不足 10 厘米就受限。',
      },
      {
        muscle: 'hip_glute_med',
        role: 'secondary',
        state: 'weak',
        why: '髋的稳定决定了膝与踝的排列，髋一歪，踝就要承担更多。',
        tell: '单腿站立骨盆往对侧掉。',
      },
    ],
    postures: [],
    quickChecks: [
      {
        id: 'au_balance',
        name: '单腿闭眼站立',
        steps: ['单腿站立，另一腿屈膝抬起', '先睁眼保持 20 秒', '再闭眼保持，记录能撑多久'],
        meaning:
          '睁眼就不稳或闭眼撑不到 10 秒 → 本体感觉明显受损，先做平衡训练再上强度；能撑 20 秒以上 → 可进入动态（单腿跳、变向）训练。',
      },
    ],
    acute: [
      '48 小时内按"保护 + 冰敷 + 加压 + 抬高"处理，每次冰敷 10-15 分钟',
      '在无痛范围内尽早活动（画字母练习），不要长期完全固定',
      '若无法负重走 4 步或外踝骨性压痛明显，先去拍片排除骨折',
    ],
    avoid: [
      '疼痛与肿胀未退就回到变向、跳跃类运动',
      '长期依赖护踝替代训练',
      '在不平整地面做高强度跑跳',
    ],
    plan: {
      relax: ['ex_release_peroneal', 'ex_foam_roll_calf', 'ex_release_glute_med'],
      stretch: ['ex_stretch_peroneal', 'ex_calf_stretch_wall'],
      activate: ['ex_single_leg_balance', 'ex_clamshell'],
      strengthen: ['ex_band_walk', 'ex_single_leg_balance', 'ex_tibialis_raise', 'ex_side_lying_raise'],
    },
    dailyTips: [
      '平衡训练每天 2 分钟（刷牙时单腿站），比一周一次集中练有效',
      '恢复运动前先过"单腿跳 10 次无痛 + 单腿闭眼站 20 秒"这两关',
      '第一次崴脚处理得当，能显著降低复发概率',
    ],
    redFlags: [
      '无法负重行走 4 步以上，或外踝/内踝骨性压痛明显',
      '踝部明显畸形、肿胀迅速加重',
      '伴足部麻木、皮肤发凉或肤色改变',
      ...RED_FLAGS_COMMON,
    ],
  }),

  // ─────────────────── 手肘腕 ───────────────────
  elbow_lateral_pain: S({
    id: 'elbow_lateral_pain',
    cn: '手肘外侧痛（网球肘）',
    aliases: ['网球肘', '鼠标肘', '抬腕痛', '拧毛巾痛', '高尔夫球肘'],
    region: 'arm',
    summary:
      '手肘外侧的痛，来自前臂伸肌肌腱在肱骨外上髁的止点长期被反复牵拉。它几乎从不因一次受伤而起，而是长时间"握—伸—拧"累计的结果，所以恢复也要靠负荷管理。',
    typical: '长时间用鼠标、反复拧螺丝或工具、球拍类运动、新手做大量引体与划船',
    causes: [
      {
        muscle: 'arm_forearm_extensor',
        role: 'primary',
        state: 'overworked',
        why: '伸腕伸指肌群共同止于肱骨外上髁，反复抓握与伸腕让它持续过载。',
        tell: '手肘外侧骨突压痛；抗阻伸腕（手背向上顶）或提重物时诱发同样的痛。',
      },
      {
        muscle: 'arm_forearm_flexor',
        role: 'secondary',
        state: 'overworked',
        why: '屈肌群与伸肌群共同维持抓握，一侧过载时另一侧也会代偿紧张。',
        tell: '握拳抗阻或长时间握持后前臂内侧（偏内髁方向）也酸。',
      },
      {
        muscle: 'shoulder_rotator_cuff',
        role: 'secondary',
        state: 'weak',
        why: '动力链上游不稳时，末端（手肘、前臂）要承担更多精细控制。',
        tell: '肩外旋力量弱；做划船类动作时肩先晃再带动手臂。',
      },
    ],
    postures: [],
    quickChecks: [
      {
        id: 'elp_grip',
        name: '抗阻伸腕测试',
        steps: [
          '手臂前伸、手心向下放在桌沿',
          '用另一只手压住手背，试着把手背向上抬',
          '观察手肘外侧是否诱发同样的痛',
        ],
        meaning:
          '诱发同样的痛 → 伸肌肌腱劳损，按方案做离心训练；痛在手肘内侧 → 可能是屈肌侧（高尔夫球肘），训练方向相反（改为屈腕离心）。',
      },
    ],
    acute: [
      '减少反复抓握与拧的动作：提重物改用托举（掌心向上）而非抓握（掌心向下）',
      '把鼠标换成垂直鼠标或加宽握持，减少伸腕角度',
      '冰敷外侧骨突 10-15 分钟（使用后）',
      '护肘可在高强度使用时短期佩戴，不要整天戴',
    ],
    avoid: [
      '忍痛继续大量引体向上、划船、俯卧撑支撑',
      '反复"甩手"或用大力按摩痛点',
      '在痛点做局部封闭后立刻恢复高强度使用',
    ],
    plan: {
      relax: ['ex_release_forearm', 'ex_release_triceps'],
      stretch: ['ex_stretch_wrist_extensor', 'ex_stretch_wrist_flexor'],
      activate: ['ex_hammer_curl'],
      strengthen: ['ex_hammer_curl', 'ex_db_curl', 'ex_triceps_pushdown', 'ex_reverse_fly'],
    },
    dailyTips: [
      '键盘鼠标让前臂有支撑，手腕保持中立不外翻',
      '工具的握把加粗（缠上护手带）能显著降低伸肌负荷',
      '离心训练（1-2kg，慢速放下 3-5 秒）是循证支持最好的保守手段，需坚持 8-12 周',
    ],
    redFlags: [
      '手肘明显肿胀、发热或变形',
      '外伤后无法屈伸手肘',
      ...RED_FLAGS_COMMON,
    ],
  }),

  wrist_sore_desk: S({
    id: 'wrist_sore_desk',
    cn: '手腕酸痛发麻（鼠标手）',
    aliases: ['鼠标手', '手腕痛', '手麻', '腕管综合征', '手指麻'],
    region: 'arm',
    summary:
      '手腕长时间处于背伸或尺偏位，会让腕管内的压力升高，前臂屈肌肌腱也一并劳损。需要留意的是：手麻也可能是颈椎来源，两者的处理方式完全不同。',
    typical: '每天使用鼠标键盘 8 小时、手腕长期悬空、孕期、需要反复抓握的工作',
    causes: [
      {
        muscle: 'arm_forearm_flexor',
        role: 'primary',
        state: 'tight',
        why: '屈肌群共同通过腕管，长期紧张会让管内压力升高。',
        tell: '手腕掌侧与前臂下段紧张；握拳或敲键盘久了手心发酸。',
      },
      {
        muscle: 'arm_forearm_extensor',
        role: 'secondary',
        state: 'overworked',
        why: '手腕长期背伸（手背向后翘）会让伸肌持续工作。',
        tell: '手背向上翘着用鼠标时症状加重。',
      },
      {
        muscle: 'shoulder_rotator_cuff',
        role: 'secondary',
        state: 'weak',
        why: '肩胛与肩的稳定不足，会让前臂与手腕承担更多静态负荷。',
        tell: '长时间办公后肩先酸再到手；肩外旋力量偏弱。',
      },
    ],
    postures: ['rounded_shoulder'],
    quickChecks: [
      {
        id: 'wsd_neck',
        name: '颈部来源鉴别',
        steps: [
          '坐直，把头缓慢向患侧侧屈并轻轻后仰（约 10 秒）',
          '观察手部的麻是否出现或加重',
          '再做手腕正中神经叩击（轻叩腕横纹处）对比',
        ],
        meaning:
          '颈部动作能复制手麻 → 更像颈椎来源，应优先处理颈与肩胛，单纯做手腕训练无效；只有叩腕诱发 → 腕管方向更符合，按方案处理。',
      },
    ],
    acute: [
      '让手腕保持中立：鼠标键盘放低，前臂有支撑（肘约 90 度）',
      '每 30 分钟甩手放松 + 手腕轻柔活动 30 秒',
      '夜间可戴中立位护腕，避免睡觉时手腕长时间弯折',
    ],
    avoid: [
      '长时间手腕悬空打字（腕下加垫不如前臂有支撑）',
      '反复用力握捏与拧的动作',
      '把手麻当成"血液循环不好"猛甩手',
    ],
    plan: {
      relax: ['ex_release_forearm', 'ex_release_biceps'],
      stretch: ['ex_stretch_wrist_flexor', 'ex_stretch_wrist_extensor'],
      activate: ['ex_scapular_pullup', 'ex_wall_angel'],
      strengthen: ['ex_face_pull', 'ex_reverse_fly', 'ex_band_pullapart', 'ex_db_row'],
    },
    dailyTips: [
      '鼠标靠近身体，避免手臂长期前伸',
      '键盘前沿略低于肘部，手腕自然平放而不是翘起',
      '如果症状出现在夜间麻醒，尽早就医做神经检查',
    ],
    redFlags: [
      '持续麻木、夜间麻醒，或拇指/食指/中指感觉减退',
      '大鱼际（拇指根部）变薄、捏东西无力',
      ...RED_FLAGS_COMMON,
    ],
  }),

  shoulder_press_sore: S({
    id: 'shoulder_press_sore',
    cn: '推举或卧推后肩膀前面酸痛',
    aliases: ['推举肩痛', '卧推肩膀痛', '肩膀前面酸', '三角肌痛', '推完肩膀痛'],
    region: 'shoulder',
    summary:
      '肩膀前侧酸痛多半出现在推类动作量突增时：三角肌前束承担了大部分负荷，而胸肌紧张、肩胛控制不足会让肱骨在前推过程中往前滑，前侧压力进一步加大。',
    typical: '刚开始练卧推或肩推、一周内推类动作大幅增加、练胸远多于练背',
    causes: [
      {
        muscle: 'shoulder_deltoid',
        role: 'primary',
        state: 'overworked',
        why: '三角肌前束是推类动作的主要发力肌，容量突增时最先被累到。',
        tell: '肩膀最外侧偏前的位置酸痛，手臂前平举到肩高时最明显。',
      },
      {
        muscle: 'chest_pec_major',
        role: 'secondary',
        state: 'tight',
        why: '胸大肌紧张会把肱骨往前拉，让前推时肩前侧压力更大。',
        tell: '肩前（锁骨下方到腋前）按压紧张，做门框拉伸时前胸牵拉明显。',
      },
      {
        muscle: 'shoulder_rotator_cuff',
        role: 'secondary',
        state: 'weak',
        why: '肩袖负责把肱骨头稳定在关节中心，它控制不住时前推会产生异常滑动。',
        tell: '推到接近锁定位置时肩前出现"顶住"的感觉；抗阻外旋力量偏弱。',
      },
      {
        muscle: 'back_trapezius_lower',
        role: 'secondary',
        state: 'weak',
        why: '肩胛后缩下沉不足，推的时候肩胛不稳，负荷全压在肩前。',
        tell: '卧推时肩胛收不紧、容易耸肩；俯卧 Y 字抬手吃力。',
      },
    ],
    postures: ['rounded_shoulder'],
    quickChecks: [
      {
        id: 'sps_ratio',
        name: '推拉容量对比',
        steps: [
          '回忆上周训练，数一下"推"的动作（卧推、肩推、俯卧撑、夹胸）共多少组',
          '再数"拉"的动作（划船、下拉、面拉、引体）共多少组',
        ],
        meaning:
          '推明显多于拉 → 先把拉的量补到至少相等，再谈肩前的放松；两者已经相当却仍痛 → 更可能是动作模式（肩胛没收紧）或单次容量突增。',
      },
    ],
    acute: [
      '本周把推类动作减 30%，重量降到能轻松完成的水平',
      '推类动作前先做 2 组面拉与肩胛激活',
      '训练后冰敷肩前 10-15 分钟',
    ],
    avoid: [
      '忍痛继续加重量',
      '把"练到酸痛才算有效"当成标准',
      '一周内突然把推类容量翻倍',
    ],
    plan: {
      relax: ['ex_release_delt', 'ex_foam_roll_pec', 'ex_release_scapula_border'],
      stretch: ['ex_stretch_delt_anterior', 'ex_pec_stretch_doorway'],
      activate: ['ex_scapular_pullup', 'ex_wall_angel', 'ex_external_rotation'],
      strengthen: ['ex_face_pull', 'ex_cuban_press', 'ex_reverse_fly', 'ex_db_row'],
    },
    dailyTips: [
      '推与拉按 1:1 甚至 1:1.5 安排，是预防肩前问题最有效的一条',
      '卧推时肩胛主动收拢压在凳面上，能显著减少肩前负荷',
      '肩推把手臂放在肩胛平面（略前偏 30 度），比正前方推更友好',
    ],
  }),

  abs_workout_back_pain: S({
    id: 'abs_workout_back_pain',
    cn: '练腹时腰比肚子更酸',
    aliases: ['练腹腰酸', '卷腹腰疼', '抬腿腰酸', '腹部训练腰疼', '仰卧起坐腰疼'],
    region: 'low_back',
    summary:
      '练腹时腰先酸，通常不是"腰太弱要练腰"，而是髂腰肌抢走了本该由腹肌完成的工作。抬腿、卷腹这类动作里髋屈肌一旦主导，腰椎就会被反复拉向前凸——所以越练腰越酸。',
    typical: '做仰卧起坐或悬垂举腿、核心训练以卷腹抬腿为主、久坐导致髋屈肌偏紧',
    causes: [
      {
        muscle: 'hip_iliopsoas',
        role: 'primary',
        state: 'overworked',
        why: '抬腿与卷腹时髂腰肌会抢先发力，而它连在腰椎上，一收缩就把腰往前拽。',
        tell: '做仰卧抬腿时腰逐渐离地、越抬越酸；放下腿的瞬间腰部"弹"一下。',
      },
      {
        muscle: 'core_rectus',
        role: 'primary',
        state: 'weak',
        why: '腹直肌负责把胸廓与骨盆拉近。它不参与时，动作就全交给髋屈肌。',
        tell: '做卷腹时几乎感觉不到腹部收缩，脖子先酸；仰卧起坐靠"甩"起来。',
      },
      {
        muscle: 'core_transverse',
        role: 'secondary',
        state: 'weak',
        why: '腹横肌负责从深层兜住腰椎，它不工作时腰部缺少内压支撑。',
        tell: '做死虫动作时腰会离地、腹部发抖撑不住。',
      },
      {
        muscle: 'core_oblique',
        role: 'secondary',
        state: 'weak',
        why: '腹斜肌负责抗旋转与侧屈稳定，弱的时候躯干控制差、更容易塌腰。',
        tell: '侧平板撑不到 20 秒；做俄罗斯转体时腰比侧腹更酸。',
      },
    ],
    postures: ['anterior_pelvic_tilt'],
    quickChecks: [
      {
        id: 'awb_leglow',
        name: '仰卧单腿下落测试',
        steps: [
          '仰卧，双手放在腰下（掌心贴地感受腰部是否离地）',
          '双腿抬到髋膝各 90 度',
          '缓慢放下一条腿到接近地面，同时保持腰部始终贴地',
        ],
        meaning:
          '腿刚放下腰就顶起来 → 核心撑不住这个幅度，把动作退阶（膝盖弯得多一点、只放到一半）；能全程贴地 → 可以正常做抬腿类动作。',
      },
    ],
    acute: [
      '把抬腿类动作换成"腰贴地"的版本：死虫、平板、侧平板',
      '训练中全程保持腰贴地，一旦顶起就说明幅度超过了当前能力',
      '暂停仰卧起坐与负重体前屈类动作',
    ],
    avoid: [
      '腰已经离地还继续把腿往下放',
      '追求卷腹次数与速度',
      '用器械做负重仰卧起坐',
    ],
    plan: {
      relax: ['ex_release_psoas', 'ex_foam_roll_quad'],
      stretch: ['ex_hip_flexor_stretch', 'ex_stretch_quad_standing'],
      activate: ['ex_dead_bug', 'ex_glute_bridge'],
      strengthen: ['ex_dead_bug', 'ex_plank', 'ex_side_plank', 'ex_pallof_press'],
    },
    dailyTips: [
      '核心训练的第一目标不是"酸"，而是"腰始终贴地"',
      '久坐族先松髋屈肌再练腹，事半功倍',
      '抗旋转类动作（侧平板、Pallof 推）对腰最友好，可以多做',
    ],
    redFlags: [
      '练腹时出现向下肢放射的痛麻',
      '腰部剧烈疼痛或无法直立',
      ...RED_FLAGS_COMMON,
    ],
  }),
};

export const SYMPTOM_REGION_CN: Record<Symptom['region'], string> = {
  head_neck: '头颈',
  shoulder: '肩部',
  upper_back: '上背',
  low_back: '腰背',
  hip: '髋臀',
  knee: '膝部',
  lower_leg: '小腿',
  foot: '足踝',
  arm: '手肘腕',
};

export const SYMPTOM_REGION_ORDER: Symptom['region'][] = [
  'head_neck',
  'shoulder',
  'upper_back',
  'low_back',
  'hip',
  'knee',
  'lower_leg',
  'foot',
  'arm',
];

export const MUSCLE_STATE_CN: Record<MuscleState, string> = {
  tight: '长期紧张',
  weak: '无力失活',
  overworked: '负荷过大',
};

export const CAUSE_ROLE_CN: Record<'primary' | 'secondary', string> = {
  primary: '主要嫌疑',
  secondary: '常一起受累',
};

/** 按 id 取症状 */
export function getSymptom(id: string): Symptom | undefined {
  return SYMPTOMS[id];
}

/** 全部症状，按部位顺序返回 */
export function listSymptoms(): Symptom[] {
  return Object.values(SYMPTOMS).sort(
    (a, b) =>
      SYMPTOM_REGION_ORDER.indexOf(a.region) - SYMPTOM_REGION_ORDER.indexOf(b.region) ||
      a.cn.localeCompare(b.cn),
  );
}

/**
 * 关键词搜索：匹配名称、别名、涉及肌肉、相关体态。
 * 用户只会说"脖子酸"，不会说专业术语，所以别名很关键。
 */
export function searchSymptoms(q: string, muscleCn: (id: string) => string): Symptom[] {
  const kw = q.trim().toLowerCase();
  if (!kw) return listSymptoms();
  return listSymptoms().filter((s) => {
    const haystack = [s.cn, ...s.aliases, s.summary, ...s.causes.map((c) => muscleCn(c.muscle))]
      .join(' ')
      .toLowerCase();
    return haystack.includes(kw);
  });
}

/** 反查：某块肌肉出现在哪些症状里 */
export function symptomsByMuscle(muscleId: string): Symptom[] {
  return listSymptoms().filter((s) => s.causes.some((c) => c.muscle === muscleId));
}

/** 反查：某个体态问题可能表现为哪些症状 */
export function symptomsByPosture(postureId: string): Symptom[] {
  return listSymptoms().filter((s) => s.postures.includes(postureId));
}
