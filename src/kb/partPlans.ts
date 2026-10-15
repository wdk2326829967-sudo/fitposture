/**
 * 亚部专属训练方案
 *
 * 与 muscles.ts 的「整块肌群方案」不同，这里针对的是**同一个肌群里的不同亚部**
 * （三角肌前束/中束/后束、胸大肌上/中/下部、三头长头/外侧头/内侧头……）。
 * 亚部之间的差别主要来自：
 *   1) 是否跨过相邻关节（如三头长头跨肩 → 必须过顶才能练到）
 *   2) 力线方向（如上胸做由下往上、下胸做由上往下）
 *   3) 深浅位置（深层肌肉用小重量、慢节奏、激活优先）
 *
 * items 里写字符串表示复用 exercises.ts 的既有动作，写对象是本文件内联定义的专属动作。
 */
import type { Difficulty, Equipment, Exercise, ExerciseKind, ProblemType } from './types';
import { EXERCISES } from './exercises';

/**
 * 亚部视图的问题类型 → 优先展示的动作类型。
 * 亚部的动作库比整块肌群更细，所以这里不做「有/无方案」的判断，
 * 只按问题类型决定推荐顺序与主次。
 */
export const PART_PROBLEM_KINDS: Record<ProblemType, ExerciseKind[]> = {
  hypertrophy: ['strengthen', 'activate'],
  soreness: ['relax', 'stretch'],
  chronic_tension: ['relax', 'stretch'],
  limited_mobility: ['stretch', 'activate'],
  posture: ['activate', 'stretch'],
  strain: ['relax'],
};

/** 亚部视图下，每类问题的一句话处理思路（不含问题名，UI 会加前缀） */
export const PART_PROBLEM_HINT: Record<ProblemType, string> = {
  hypertrophy:
    '先看「强化」把主力动作做够量，再用「激活」唤醒这块亚部，避免被协同肌抢走负荷。',
  soreness:
    '先用「放松」促进循环，再做非常轻的「拉伸」；这一阶段不要加量加负重。',
  chronic_tension:
    '以「放松」为主，配合温和「拉伸」。不要用力猛拉 —— 越痛越容易缩得更紧。',
  limited_mobility:
    '「拉伸」和「激活」交替做：先拉开限制，再让新的活动范围变得可控。',
  posture:
    '以「激活」为主（把偷懒的那部分叫醒），「拉伸」为辅，放开真正紧张的部位。',
  strain:
    '先停止训练并休息、冰敷，必要时就医；疼痛缓解后再从「放松」和极轻的活动度练习开始。',
};

export interface PartPlanExercise {
  name: string;
  nameEn?: string;
  kind: ExerciseKind;
  sets: string;
  reps: string;
  rest: string;
  frequency: string;
  keyPoints: string;
  equipment: Equipment[];
  difficulty: Difficulty;
  cautions?: string[];
}

export interface PartPlan {
  /** 一句话定位 */
  cue: string;
  /** 常见错误 */
  mistakes?: string[];
  /** 推荐训练安排（搭配建议） */
  split?: string;
  items: (string | PartPlanExercise)[];
}

type Seed = Omit<
  PartPlanExercise,
  'name' | 'sets' | 'reps' | 'rest' | 'frequency' | 'difficulty'
> &
  Partial<Pick<PartPlanExercise, 'sets' | 'reps' | 'rest' | 'frequency' | 'difficulty'>>;

function ex(name: string, s: Seed): PartPlanExercise {
  return {
    name,
    sets: s.sets ?? '3',
    reps: s.reps ?? '12-15',
    rest: s.rest ?? '60 秒',
    frequency: s.frequency ?? '每周 2 次',
    difficulty: s.difficulty ?? 'beginner',
    ...s,
  };
}

// ───────────────────────── 三角肌三束 ─────────────────────────

const DELT_ANTERIOR: PartPlan = {
  cue: '脑子里想的是「把哑铃往正前方送去」，手臂始终比肩略低一点，别抬到脸前。',
  mistakes: [
    '靠身体前后摆动把重量甩起来（前束几乎没受力）',
    '前束已经很发达还天天推 → 肩膀越练越往前扣',
    '抬臂时耸肩，重量全跑到上斜方上了',
  ],
  split: '大多数人的前束在卧推/俯卧撑里已经吃了不少量，一周专项练 1-2 次就够，剩下的配额给中束和后束。',
  items: [
    'ex_front_raise',
    ex('阿诺德推举', {
      nameEn: 'Arnold Press', kind: 'strengthen', sets: '4', reps: '8-12', rest: '90 秒', difficulty: 'intermediate',
      equipment: ['dumbbell'],
      keyPoints: '起手时手心朝自己，上推过程中逐渐旋到手心朝前，顶点手臂在耳朵两侧。前束在"由前向上转"的这一段发力最集中。',
      cautions: ['有肩痛时用哑铃中立握或小幅度版本', '不要弓腰借力'],
    }),
    ex('单臂绳索前平举', {
      nameEn: 'Cable Front Raise', kind: 'strengthen', sets: '3', reps: '12-15/侧', rest: '45 秒', equipment: ['cable'],
      keyPoints: '滑轮调最低位，手臂从体前偏对侧拉起，绳索给的是恒定张力，比哑铃在底部更好控制。',
    }),
    'ex_incline_db_press',
    ex('前束拉抻（手臂后伸）', {
      nameEn: 'Anterior Delt Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '双手在背后十指交叉（或用毛巾），肩胛后缩下沉，把手臂往离开身体的方向抬起来拉伸前束与前锯。肩关节前侧有撞击感就减小幅度。',
    }),
  ],
};

const DELT_MIDDLE: PartPlan = {
  cue: '手臂在身体两侧偏前 10-20° 的平面上抬起，想象在用肘关节画一道圆弧，而不是把手腕往上拎。',
  mistakes: [
    '外旋不足（拇指低于小指）→ 撞击风险高，且中束受力下降',
    '抬过肩膀高度，重心全到了上斜方',
    '用大重量甩，实际受力的是腰和斜方',
  ],
  split: '中束是典型的"轻重量高次数"肌肉，可以用 12-20 次甚至递减组，一周 2-3 次。',
  items: [
    'ex_lateral_raise',
    'ex_cable_lateral_raise',
    ex('斜板单臂侧平举', {
      nameEn: 'Incline Bench Lateral Raise', kind: 'strengthen', sets: '3', reps: '12-15/侧', rest: '45 秒', difficulty: 'intermediate', equipment: ['dumbbell', 'bench'],
      keyPoints: '侧靠在 30-45° 的斜凳上，下方手臂沿身体外侧抬起，全程锁紧肩胛，抬到肩部高度时顶点停顿 1 秒。这个角度让中束在整个行程里都保持紧张。',
    }),
    ex('弹力带侧平举', {
      nameEn: 'Band Lateral Raise', kind: 'strengthen', sets: '3', reps: '15-20', rest: '30 秒', equipment: ['band'],
      keyPoints: '踩住弹力带中段，双手握两端向两侧抬起；弹性阻力在顶端最大，正好补上哑铃在顶点失力的短板。',
    }),
    'ex_upright_row',
    ex('中束拉伸（水平横拉）', {
      nameEn: 'Cross-body Shoulder Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '手臂横过胸前，另一手扣住肘关节向身体方向带；感觉到肩后方拉伸，不要压手腕。',
    }),
  ],
};

const DELT_POSTERIOR: PartPlan = {
  cue: '想象两只手在后端画弧、把两个「肘尖」往身后掰。重量小、次数高、顶峰停留。',
  mistakes: [
    '做成划船（肘向后屈）而不是展臂（肘保持微屈固定）',
    '俯身不够，实际变成中束',
    '耸肩用上斜方代偿',
  ],
  split: '后束是"最欠练的一块"，建议每次训练日都带 2-3 组，一周累计 6-10 组。和背部/肩日一起练效果最好。',
  items: [
    'ex_rear_delt_fly',
    'ex_face_pull',
    ex('反向蝴蝶机', {
      nameEn: 'Reverse Pec Deck', kind: 'strengthen', sets: '4', reps: '15-20', rest: '45 秒', equipment: ['machine'],
      keyPoints: '胸贴靠垫、双手握住前方的把手向外展；不要用手臂推，用肘后方的力量把手臂"拨"到身后。',
    }),
    ex('斜凳俯卧反向飞鸟', {
      nameEn: 'Chest-supported Rear Delt Fly', kind: 'strengthen', sets: '3', reps: '15-20', rest: '45 秒', equipment: ['dumbbell', 'bench'],
      keyPoints: '趴在 30-45° 斜凳上（胸有支撑），双手自然下垂后向两侧展开。因为有靠垫，腰不会代偿，非常适合后束。',
    }),
    ex('后束拉伸（水平内收）', {
      nameEn: 'Posterior Delt Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '手臂水平伸直横过胸前，另一手扣住上臂往身体拉，肩膀不要耸起，感觉肩后与肩胛外侧被拉开。',
    }),
  ],
};

// ───────────────────────── 胸大肌三部 ─────────────────────────

const PEC_CLAVICULAR: PartPlan = {
  cue: '推的方向是「由下往上、往身体中线」，手肘不要完全打开。',
  mistakes: [
    '上斜角度调得太高（超过 45°）→ 变成肩・胸次要',
    '杠铃下放位置太高（到脖子）→ 肩关节压力大',
    '只练上斜，忽视整体厚度',
  ],
  split: '上胸通常是视觉短板，可以在一周里安排 2 次（一次大重量推、一次绳索/哑铃高次数）。',
  items: [
    'ex_incline_db_press',
    ex('上斜杠铃卧推', {
      nameEn: 'Incline Barbell Press', kind: 'strengthen', sets: '4', reps: '8-10', rest: '2 分钟', difficulty: 'intermediate', equipment: ['barbell', 'bench'],
      keyPoints: '椅背 30°，杠铃下放至锁骨位置，肘与躯干约 45°。肩胛要主动后缩下沉贴在凳上。',
      cautions: ['肩峰撞击者改用哑铃中立握'],
    }),
    ex('低位绳索夹胸（下→上）', {
      nameEn: 'Low-to-High Cable Fly', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['cable'],
      keyPoints: '滑轮调到最低，双手从腰侧沿着一条由下往上的斜线夹到额头高度。这条斜线正好对应上胸纤维的走向。',
    }),
    ex('手高脚低俯卧撑', {
      nameEn: 'Decline Push-up', kind: 'strengthen', sets: '3', reps: '12-20', rest: '60 秒', equipment: ['none'],
      keyPoints: '双脚垫高 20-40cm，让推的方向偏向上胸。核心收紧不塌腰。',
    }),
    ex('上胸拉伸（低手位门框）', {
      nameEn: 'Clavicular Pec Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['wall'],
      keyPoints: '在门框上手臂放在较低位置（约腰高），身体向前缓慢跨一步，感受锁骨下方拉伸。',
    }),
  ],
};

const PEC_STERNOCOSTAL: PartPlan = {
  cue: '推的时候想象「把两块胸往中间挤」，而不是单纯把手臂推直。',
  mistakes: ['手肘外展 90° → 肩关节压力大', '杠铃弹到胸口反弹', '顶点放松核心导致塌腰'],
  split: '中胸是推力总量的主力，用大重量复合动作（卧推、俯卧撑）打底，再用蝴蝶机/绳索补量。',
  items: [
    'ex_bench_press',
    'ex_pushup',
    'ex_pec_deck',
    'ex_cable_fly',
    ex('哑铃平板卧推', {
      nameEn: 'Flat Dumbbell Press', kind: 'strengthen', sets: '4', reps: '8-12', rest: '90 秒', difficulty: 'intermediate', equipment: ['dumbbell', 'bench'],
      keyPoints: '比杠铃行程更长，拉伸更充分；哑铃在下放时略呈"水滴形"（手心相对偏内），肩更舒服。',
      cautions: ['大重量需要有人保护'],
    }),
  ],
};

const PEC_ABDOMINAL: PartPlan = {
  cue: '推的方向是「由上往下、向内收」，像要把手臂从高处往腰侧拉下来。',
  mistakes: [
    '双杠下放太深 → 肩关节前侧过度拉伸',
    '身体直立做变成了三头臂屈伸',
    '下斜凳角度太大（超过 30°）→ 头部充血、重量容易压到脖子',
  ],
  split: '下胸决定了胸腹过渡的轮廓线，一周安排 1-2 次针对训练。',
  items: [
    'ex_dip_chest',
    ex('下斜哑铃卧推', {
      nameEn: 'Decline Dumbbell Press', kind: 'strengthen', sets: '4', reps: '8-12', rest: '90 秒', difficulty: 'intermediate', equipment: ['dumbbell', 'bench'],
      keyPoints: '凳面下斜 20-30°，下放至胸下缘，感觉胸的下部被拉长再发力推起。',
      cautions: ['凳面要有防滑/挡板固定小腿'],
    }),
    ex('高位绳索夹胸（上→下）', {
      nameEn: 'High-to-Low Cable Fly', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['cable'],
      keyPoints: '滑轮调到最高，双手从肩的高度沿着由上往下的斜线夹到腹部位置，正好顺着下胸纤维。',
    }),
  ],
};

// ───────────────────────── 肩袖 ─────────────────────────

const CUFF_SUPRA: PartPlan = {
  cue: '动作要在「肩胛平面」（手臂在身体两侧偏前 30°）上抬，且大拇指朝上（全罐式），避免肩峰下受挤。',
  mistakes: ['做空罐式（拇指朝下）→ 增加撞击风险', '抬超过肩膀高度', '用大重量练 —— 冈上肌只需小重量'],
  split: '冈上肌是稳定肌，用 2-4kg 的小重量做高次数，安排在训练前 5 分钟作为热身激活。',
  items: [
    ex('全罐式侧举', {
      nameEn: 'Full Can Raise', kind: 'activate', sets: '3', reps: '15-20', rest: '45 秒', frequency: '每次训练前', equipment: ['dumbbell'],
      keyPoints: '手臂在肩胛平面、拇指朝上，从体侧抬到与肩同高即可（不要过顶），末端放慢。重量 2-5kg 足够。',
      cautions: ['出现尖峰疼痛立即停止', '不要抬过肩高'],
    }),
    ex('侧卧肩外旋 + 小幅外展', {
      nameEn: 'Side-lying ER', kind: 'activate', sets: '3', reps: '15/侧', rest: '30 秒', frequency: '每天', equipment: ['band'],
      keyPoints: '侧卧，上臂夹毛巾贴身侧，肘屈 90°，前臂向外旋对阻；再微微向前抬起 10°。肘全程不离开躯干。',
    }),
    ex('肩关节后关节囊滑行', {
      nameEn: 'Posterior Capsule Mobilization', kind: 'activate', sets: '2', reps: '每侧 20 次', rest: '-', frequency: '每天', equipment: ['foam_roller'],
      keyPoints: '侧卧，下方手臂屈肘垫住泡沫轴在前，上方手把泡沫轴往床面方向轻轻压，让肱骨头向后滑动。改善肩前挤。',
    }),
  ],
};

const CUFF_INFRA: PartPlan = {
  cue: '肘夹紧躯干，只旋转前臂，手肘像一个固定的转轴。',
  mistakes: ['肘部离开躯干 → 变成背阔/背阔代偿', '用躯干旋转带动手臂（说明重量太大）'],
  split: '肩袖任选每周 2-3 次，安排在推类训练后。',
  items: [
    'ex_external_rotation',
    'ex_side_lying_er',
    'ex_cuban_press',
    ex('俯卧 Y/T 转换（肩胛平面）', {
      nameEn: 'Prone Y-T Raise', kind: 'activate', sets: '3', reps: '12 次/角度', rest: '30 秒', frequency: '每周 2-3 次', equipment: ['none'],
      keyPoints: '俯卧在斜凳或地上，手臂先伸成 Y 再收回成 T，拇指始终朝上，用非常轻的哑铃（1-2kg）或空手。',
    }),
  ],
};

const CUFF_TERES_MINOR: PartPlan = {
  cue: '和冈下肌一起做「外旋 + 水平外展」，两者是同一个功能组合。',
  mistakes: ['试图单独隔离小圆肌（解剖上做不到，也没必要）'],
  items: ['ex_external_rotation', 'ex_side_lying_er', 'ex_face_pull'],
};

const CUFF_SUBSCAP: PartPlan = {
  cue: '内旋时用很小的阻力（<5kg），重点是慢速与控制，而不是强化力量。',
  mistakes: ['用大重量做大范围内旋 → 肩关节前侧不稳'],
  items: [
    'ex_internal_rotation',
    ex('抬离试验（内旋激活）', {
      nameEn: 'Lift-off', kind: 'activate', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['wall'],
      keyPoints: '手背贴在后腰，掌心朝外，试着把手掌慢慢推离后背（不用真的推很远），感觉腋下后方发力。',
    }),
    ex('背后拉手 / 毛巾牵伸', {
      nameEn: 'Internal Rotator Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '一只手从下方、另一只手从上方在背后尝试扣住（扣不住用毛巾），拉住后保持。放松紧的肩胛下肌，改善外旋受限。',
    }),
  ],
};

const CUFF_TERES_MAJOR: PartPlan = {
  cue: '它本质是「背阔的小兄弟」，用拉而不是转来练：一切颈前下拉、划船都会带到。',
  mistakes: ['把它当成肩袖本体去练孤立动作（没必要）'],
  items: ['ex_pullup', 'ex_lat_pulldown_machine'],
};

// ───────────────────────── 斜方肌中/下束 ─────────────────────────

const TRAP_MIDDLE: PartPlan = {
  cue: '先想「肩胛骨往脊柱夹」，再动手臂。所有拉的动作都要先沉肩胛。',
  mistakes: ['耸肩代偿 → 练到的是上斜方', '手臂屈太多做成弯举'],
  items: ['ex_face_pull', 'ex_prone_y', 'ex_scapular_pullup'],
};

const TRAP_LOWER: PartPlan = {
  cue: '拇指朝上做 Y 字上举，感觉是「骨盆方向的口袋里有一条绳把肘往下往上拉」——不能用耸肩来完成。',
  mistakes: ['耸肩 → 完全失去对下束的刺激', '抬手时腰椎过度伸展'],
  items: [
    'ex_prone_y',
    ex('四点跪位单臂 Y 上举', {
      nameEn: 'Quadruped Y Raise', kind: 'activate', sets: '3', reps: '12/侧', rest: '30 秒', frequency: '每天', equipment: ['none'],
      keyPoints: '四点跪撑，一手慢慢离地向斜前方抬起成 Y 形，拇指朝上，同时保持骨盆和躯干不晃。',
    }),
    ex('开式全员下拉（直臂下压）', {
      nameEn: 'Straight-arm Pulldown', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['cable'],
      keyPoints: '直臂（微屈不锁死）绳索从肩的高度压到髋两侧，全程肩胛下沉不耸肩，专门练下斜方与背阔。',
    }),
  ],
};

// ───────────────────────── 肱二头 ─────────────────────────

const BICEPS_LONG: PartPlan = {
  cue: '把肩膀放在身后（上斜凳/仰卧），让长头在被拉长的状态下发力 —— 这是增大二头外侧峰关键。',
  mistakes: ['所有动作都在身体前面做 → 主要练到短头', '摆动发力'],
  items: [
    ex('上斜哑铃弯举', {
      nameEn: 'Incline Dumbbell Curl', kind: 'strengthen', sets: '4', reps: '10-12', rest: '75 秒', difficulty: 'intermediate', equipment: ['dumbbell', 'bench'],
      keyPoints: '坐在 45-60° 斜凳上，双臂自然下垂（肩处于后伸位），弯举时手腕保持中立。长头在这个被拉长的起点上发力最强。',
    }),
    ex('拖曳弯举', {
      nameEn: 'Drag Curl', kind: 'strengthen', sets: '3', reps: '10-12', rest: '60 秒', equipment: ['barbell'],
      keyPoints: '杠铃紧贴身体向上"拖"，肘顺势往后走。整个过程肘留在身后，长头几乎没有放松的机会。',
    }),
    'ex_chinup',
  ],
};

const BICEPS_SHORT: PartPlan = {
  cue: '把上臂固定在身前（托臂凳/斜凳），短头在这种位置上的力学最占优。',
  mistakes: ['用大重量做代偿，实际受力的是肩和腰'],
  items: [
    ex('斜托弯举（托臂凳）', {
      nameEn: 'Preacher Curl', kind: 'strengthen', sets: '4', reps: '10-12', rest: '75 秒', difficulty: 'intermediate', equipment: ['barbell', 'bench'],
      keyPoints: '腋窝卡住托板顶端，肘不能往前滑，下放到接近完全伸直（不要锁死），慢放 2-3 秒。',
      cautions: ['手腕不适改用 EZ 杠或哑铃', '肘部不要超伸到疼痛'],
    }),
    ex('集中弯举', {
      nameEn: 'Concentration Curl', kind: 'strengthen', sets: '3', reps: '12-15/侧', rest: '45 秒', equipment: ['dumbbell'],
      keyPoints: '坐姿，肘顶在同侧大腿内侧，身体略前倾，单臂发力。顶峰停 1-2 秒再慢放。',
    }),
  ],
};

const BRACHIALIS: PartPlan = {
  cue: '中立握拳头朝上（像握锤子）——肱肌在这时才不会被二头的旋后功能抢走力。',
  mistakes: ['旋转手腕做成普通弯举', '用耸肩甩重量'],
  items: [
    'ex_hammer_curl',
    ex('反握 (正反) 弯举', {
      nameEn: 'Reverse Curl', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['barbell'],
      keyPoints: '手心朝下握杠，腕关节保持中立不塌，慢放。反握同时练到肱肌与全部前臂屈肌。',
      cautions: ['握力和前臂酸是正常现象，腕关节疼要减重'],
    }),
  ],
};

const CORACO: PartPlan = {
  cue: '喙肱肌只负责把上臂往前抬一点，没有专门的孤立动作，练它会一起练到二头和胸。',
  items: ['ex_chinup', 'ex_pushup'],
};

// ───────────────────────── 肱三头 ─────────────────────────

const TRI_LONG: PartPlan = {
  cue: '三头长头跨过肩关节 —— 只有当手臂举过头时它才被充分拉长，所以过顶类动作是长头的必练项。',
  mistakes: ['只做下压 → 长头几乎没被拉长', '过顶时手肘外张过大导致肩不适'],
  items: [
    'ex_overhead_extension',
    'ex_skull_crusher',
    ex('长头拉抻（过头屈肘）', {
      nameEn: 'Long Head Triceps Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '手臂举过头，屈肘使手掌落到上背中央，另一手轻压住该侧手肘往脑后带。感觉腋后下拉伸。',
    }),
  ],
};

const TRI_LATERAL: PartPlan = {
  cue: '下压时肘要像铰链一样钉在体侧，最后半程把手往外"分开"（V 把手/绳把手更容易）。',
  mistakes: ['手肘往前移动、身体前倾 → 变成卧推', '用腰在前后的撑'],
  items: [
    'ex_triceps_pushdown',
    'ex_close_grip_bench',
    ex('窄距俯卧撑（钻石）', {
      nameEn: 'Diamond Push-up', kind: 'strengthen', sets: '3', reps: '10-15', rest: '60 秒', equipment: ['none'],
      keyPoints: '双手拇指与食指扣成菱形放在胸正下方，肘贴身向后屈。手腕不适可改成窄距普通俯卧撑。',
    }),
  ],
};

const TRI_MEDIAL: PartPlan = {
  cue: '内侧头负责肘最后的"锁死"，用高次数、峰值停顿（每次顶端停 1-2 秒）最能刺激它。',
  items: [
    'ex_dip_triceps',
    ex('反握绳索下压', {
      nameEn: 'Reverse Grip Pushdown', kind: 'strengthen', sets: '3', reps: '15-20', rest: '45 秒', equipment: ['cable'],
      keyPoints: '手心朝上握横杆（反握），下压到最底端时把拳头朝地工具似的"翻出去"。反握和峰值停顿对内侧头刺激最好。',
    }),
    ex('静态锁定保持', {
      nameEn: 'Lockout Hold', kind: 'strengthen', sets: '3', reps: '保持 15-20 秒', rest: '45 秒', equipment: ['none'],
      keyPoints: '手臂伸直、手撑在台面/低杠上，身体略前倾，让三头在完全伸展的位置保持等长收缩。',
    }),
  ],
};

// ───────────────────────── 腹斜肌 ─────────────────────────

const OBLIQUE_EXTERNAL: PartPlan = {
  cue: '外斜负责把胸廓旋向对侧：向右转体时，是左侧外斜在发力 —— 两侧都要练。',
  mistakes: ['做得太快、靠甩', '负重太大 → 腰会练粗'],
  items: [
    'ex_russian_twist',
    'ex_side_plank',
    ex('站姿绳索劈砍', {
      nameEn: 'Cable Woodchopper (High-to-Low)', kind: 'strengthen', sets: '3', reps: '12/侧', rest: '45 秒', equipment: ['cable'],
      keyPoints: '侧对龙门架，滑轮在高位，双手从斜上方沿着一条对角线劈到对侧膝盖下方；用躯干带动而不是手拉。',
    }),
    ex('侧屈拉伸（站姿）', {
      nameEn: 'Standing Side Bend Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '训练后', equipment: ['none'],
      keyPoints: '双脚与肩同宽，一手过头向对侧倾，感觉腰侧被拉开。注意是侧屈不是旋转。',
    }),
  ],
};

const OBLIQUE_INTERNAL: PartPlan = {
  cue: '内斜的职责更多是"抗旋转"和"维持腹压"，所以比起转体，更该练的是让躯干不转。',
  items: [
    'ex_pallof_press',
    'ex_side_plank',
    ex('死虫式', {
      nameEn: 'Dead Bug', kind: 'activate', sets: '3', reps: '10-12/侧', rest: '30 秒', frequency: '每天', equipment: ['none'],
      keyPoints: '仰卧四肢朝天，腰部贴地不留缝，缓慢伸展对侧手腿。全程肋骨下沉、骨盆不要翻动。',
    }),
  ],
};

// ───────────────────────── 臀部深层 ─────────────────────────

const GLUTE_MEDIUS: PartPlan = {
  cue: '做髋外展时让脚轻微""脚后跟先走""（脚掌略朝下），减少阔筋膜张肌的代偿。',
  mistakes: ['腿外展时骨盆跟着倾斜（练到的是腰方肌）', '抬腿时躯干往后倒'],
  items: ['ex_clamshell', 'ex_side_lying_raise', 'ex_band_walk', 'ex_single_leg_balance',
    ex('站姿绳索髋外展', {
      nameEn: 'Standing Cable Hip Abduction', kind: 'strengthen', sets: '3', reps: '15/侧', rest: '45 秒', equipment: ['cable'],
      keyPoints: '脚踝系上踝带，侧步后单腿支撑并把另一条腿向外侧拉出；骨盆保持水平，支撑腿微微屈膝。',
    }),
  ],
};

const GLUTE_MINIMUS: PartPlan = {
  cue: '臀小肌在最深层，用很小的幅度、慢速就能刺激到位 —— 动作做华丽反而是问题。',
  items: [
    'ex_clamshell',
    ex('骨盆下沉保持（侧支撑抬髋）', {
      nameEn: 'Side Plank Hip Lift', kind: 'activate', sets: '3', reps: '12/侧', rest: '30 秒', equipment: ['none'],
      keyPoints: '侧撑（肘撑或手撑），骨盆往下沉到接近地面再用侧腹+臀小肌抬回，动作只在十来厘米范围内。',
    }),
    'ex_single_leg_balance',
  ],
};

const GLUTE_PIRIFORMIS: PartPlan = {
  cue: '梨状肌过度紧张是伪"坐骨神经痛"的常见原因 —— 先放松，再练力量。',
  items: [
    ex('90/90 梨状肌放松', {
      nameEn: '90/90 Piriformis Stretch', kind: 'stretch', sets: '2', reps: '每侧 45 秒', rest: '-', frequency: '每天', equipment: ['none'],
      keyPoints: '坐姿，前腿大腿与躯干成 90°、小腿在前 90°；后腿同样 90° 但在身后。躯干缓慢向前腿趴下再回正来回滚动。',
    }),
    ex('泡沫轴放松臀部', {
      nameEn: 'Foam Roll Glute', kind: 'relax', sets: '1', reps: '每侧 60 秒', rest: '-', frequency: '每天', equipment: ['foam_roller'],
      keyPoints: '手撑地，臀外侧压住泡沫轴缓慢滚动，在酸痛点停 20-30 秒配合深呼吸。注意别滚到骨头（坐骨）上。',
    }),
    ex('鸽子式', {
      nameEn: 'Pigeon Pose', kind: 'stretch', sets: '2', reps: '每侧 45 秒', rest: '-', frequency: '每天', equipment: ['none'],
      keyPoints: '前腿横放在身前、小腿朝斜前方，后腿伸直髋前倾，躯干慢慢往前趴。膝盖不适者在臀下垫瑜伽砖。',
    }),
  ],
};

const TFL: PartPlan = {
  cue: '阔筋膜张肌最容易在深蹲/外展中抢臀中肌的活。练臀之前先把它放松和拉伸。',
  items: [
    ex('泡沫轴放松阔筋膜张肌', {
      nameEn: 'TFL Foam Roll', kind: 'relax', sets: '1', reps: '每侧 60 秒', rest: '-', frequency: '每天', equipment: ['foam_roller'],
      keyPoints: '侧躺在泡沫轴上，滚的部位是骨盆前外侧（裤兜稍下），而不是大腿外侧的髂胫束中段。停下来、呼吸。',
    }),
    ex('站姿跨手侧屈拉伸', {
      nameEn: 'Standing TFL Stretch', kind: 'stretch', sets: '2', reps: '每侧 30 秒', rest: '-', frequency: '每天', equipment: ['none'],
      keyPoints: '站姿，把伸展侧的腿在后交叉，躯干向对侧弯并把同侧手臂向上后方延伸，感觉髋前外侧拉开。',
    }),
  ],
};

const IT_BAND: PartPlan = {
  cue: '髂胫束是筋膜不是肌肉，拉不长也压不软。膝盖外侧痛的时候，放松 + 练臀中肌才是正解。',
  items: [
    ex('侧向臀肌训练（代替"拉"髂胫束）', {
      nameEn: 'Hip Abduction over Roll', kind: 'activate', sets: '3', reps: '15/侧', rest: '30 秒', equipment: ['foam_roller'],
      keyPoints: '侧卧把泡沫轴压在大腿外侧下方，上方的腿反复做小幅外展 —— 同时兼具放松和训练效果。',
    }),
    'ex_band_walk',
  ],
};

const ILIOPSOAS_PSOAS: PartPlan = {
  cue: '腰大肌短会让骨盆前倾、腰椎过度挤压。多数人需要的是拉长，而不是加强。',
  items: [
    ex('箭步跪壕屈肌拉伸', {
      nameEn: 'Couch Stretch', kind: 'stretch', sets: '2', reps: '每侧 60 秒', rest: '-', frequency: '每天', equipment: ['none'],
      keyPoints: '后脚背贴墙面/长凳，前腿成弓步，躯干立起并把骨盆轻微后倾（收臀夹尾骨），感觉髋前被拉开。',
    }),
    ex('骨盆后倾箱式收腿', {
      nameEn: 'Supine Active Hip Flexion', kind: 'activate', sets: '3', reps: '10/侧', rest: '30 秒', equipment: ['none'],
      keyPoints: '仰卧，先让腰完全贴地（骨盆后倾），在这个前提下，缓慢抬起一侧手和对侧腿至接近地面再放下，全程腰不能离开地面。',
    }),
  ],
};

// ───────────────────────── 大腿 ─────────────────────────

const QUAD_RECTUS_FEMORIS: PartPlan = {
  cue: '股直肌同时跨髋和膝 —— 做髋伸展位的伸膝（比如登台阶、保加利亚蹲的前腿）最能刺激它。',
  mistakes: ['只靠坐姿腿屈伸 → 髋段完全不被活动，刺激有限'],
  items: [
    'ex_walking_lunge',
    'ex_bulgarian_split_squat',
    ex('登台阶（高箱）', {
      nameEn: 'Weighted Step-up', kind: 'strengthen', sets: '3', reps: '10-12/侧', rest: '75 秒', difficulty: 'intermediate', equipment: ['dumbbell'],
      keyPoints: '箱子高度让屈髋约 90°，全脚掌踩实，用上腿把身体"蹬上"箱子而不是靠后腿踮起登；下放用 2-3 秒。',
    }),
    ex('仰卧式腿屈伸（后倾髋 + 伸膝）', {
      nameEn: 'Lean-back Leg Extension', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['machine'],
      keyPoints: '靠背调到身体略后仰（髋处于伸展位），这样股直肌从拉长的起点收缩，刺激明显强于直立坐姿。',
    }),
  ],
};

const QUAD_VASTUS_LATERALIS: PartPlan = {
  cue: '宽站距、脚尖略朝外的深蹲/腿举，会让外侧束承担更多负荷。',
  items: [
    'ex_leg_press',
    'ex_squat',
    ex('宽距 toes-out 深蹲', {
      nameEn: 'Wide Stance Squat', kind: 'strengthen', sets: '4', reps: '10-12', rest: '90 秒', difficulty: 'intermediate', equipment: ['barbell'],
      keyPoints: '站距约为肩宽的 1.5 倍、脚尖朝外 30°，下蹲时膝盖顺着脚尖方向走。注意髋活动度不足的人不必强行加宽。',
    }),
  ],
};

const QUAD_VASTUS_MEDIALIS: PartPlan = {
  cue: 'VMO 只在膝伸柟的最后 15-30° 才最大发力 —— 多做"末端锁定"和小幅伸展。',
  mistakes: ['用大重量全范围蹲，VMO 实际贡献有限', '以为靠调整脚尖方向就能彻底孤立 VMO（它做不到）'],
  items: [
    ex('末端伸展 TKE（弹力带）', {
      nameEn: 'Terminal Knee Extension', kind: 'activate', sets: '3', reps: '15/侧', rest: '30 秒', frequency: '每天', equipment: ['band'],
      keyPoints: '弹力带套在膝后方并固定在前方，膝从微屈缓慢伸直到完全锁死，最后的行程慢、停、慢放。髌骨疼痛者首选。',
    }),
    ex('坐姿腿屈伸末端保持', {
      nameEn: 'Leg Extension Lockout Hold', kind: 'strengthen', sets: '3', reps: '12 次（顶端停 2 秒）', rest: '45 秒', equipment: ['machine'],
      keyPoints: '用中等重量，把腿伸直到最后 30° 的位置停 2 秒再慢放。不要用大重量猛踢。',
      cautions: ['髌骨软化/膝痛时把动作限制在无痛范围'],
    }),
    'ex_squat',
  ],
};

const QUAD_INTERMEDIUS: PartPlan = {
  cue: '它在里面被外层三块盖住，真正的刺激来自「持续的伸膝张力」—— 慢放 + 静态保持。',
  items: [
    'ex_leg_extension',
    ex('靠墙静蹲', {
      nameEn: 'Wall Sit', kind: 'strengthen', sets: '3', reps: '保持 30-45 秒', rest: '60 秒', equipment: ['wall'],
      keyPoints: '背靠墙，屈膝 60-90°，膝不超过脚尖，重心放在脚跟。呼吸放松，感觉到大腿前侧持续发热。',
    }),
  ],
};

const HAM_SEMI: PartPlan = {
  cue: '内侧腘绳（半腱/半膜）同时管膝屈和旋转控制：坐姿腿弯举时把脚尖朝外（小腿外旋）受力更多。',
  items: [
    'ex_leg_curl',
    ex('坐姿腿弯举（脚尖朝外）', {
      nameEn: 'Toes-out Leg Curl', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['machine'],
      keyPoints: '坐姿，脚尖/胫骨朝外旋，再做屈膝。感受内侧腘绳（膝后内侧）发力的变化。',
    }),
    'ex_nordic_curl',
  ],
};

const HAM_BICEPS_LONG: PartPlan = {
  cue: '长头跨髋 —— 任何「屈膝状态下伸髋」的动作（硬拉、臀桥）都是它的主战场。',
  items: ['ex_romanian_deadlift', 'ex_nordic_curl',
    ex('器械/沙发髋屈伸（反向HYPER）', {
      nameEn: 'Hip Extension Machine', kind: 'strengthen', sets: '3', reps: '12-15', rest: '60 秒', equipment: ['machine'],
      keyPoints: '固定骨盆后，屈髋 90°，用腘绳和臀把腿向下向后压；骨盆不要跟着抬起来借力。',
    }),
  ],
};

const HAM_BICEPS_SHORT: PartPlan = {
  cue: '短头只跨膝、不跨髋 —— 屈髋位（坐姿）做腿弯举时对它刺激最大。',
  items: [
    ex('坐姿腿弯举（脚尖朝内）', {
      nameEn: 'Toes-in Leg Curl', kind: 'strengthen', sets: '3', reps: '12-15', rest: '45 秒', equipment: ['machine'],
      keyPoints: '坐姿屈膝，同时把脚尖/胫骨朝内旋，这时外侧的股二头肌受力更明显。',
    }),
    'ex_leg_curl',
  ],
};

const ADDUCTOR_MAGNUS: PartPlan = {
  cue: '大收肌同时管内收和伸髋 —— 宽站的深蹲/硬拉（相扑）比单纯的夹腿机更能练到它。',
  items: ['ex_sumo_squat', 'ex_adductor_machine', 'ex_copenhagen'],
};

const ADDUCTOR_LONGUS: PartPlan = {
  cue: '长收肌是拉伤大户。先从小幅度的等长收缩开始，再上负重。',
  mistakes: ['热身不足直接做大重量相扑硬拉 → 腹股沟拉伤'],
  items: [
    ex('仰卧等长夹枕（枕头夹紧）', {
      nameEn: 'Isometric Adductor Squeeze', kind: 'activate', sets: '3', reps: '保持 15 秒 ×5', rest: '30 秒', equipment: ['none'],
      keyPoints: '仰卧屈膝，双膝间夹枕头/瑜伽球，用大腿内侧慢慢夹紧保持。可以无痛启动内收肌的第一步。',
    }),
    'ex_adductor_machine',
  ],
};

const GRACILIS: PartPlan = {
  cue: '股薄肌跨髋也跨膝，宽站 + 屈膝的位置（相扑深蹲）会带到它。没有必要专门练。',
  items: ['ex_sumo_squat', 'ex_adductor_machine'],
};

// ───────────────────────── 小腿 ─────────────────────────

const GASTROC_MEDIAL: PartPlan = {
  cue: '内侧头更大更靠下。提踵时脚尖朝外 (toes out)，把负荷往内侧推。',
  items: [
    'ex_standing_calf_raise',
    ex('单腿提踵（脚尖朝外）', {
      nameEn: 'Toes-out Single-leg Calf Raise', kind: 'strengthen', sets: '3', reps: '12-15/侧', rest: '45 秒', equipment: ['none'],
      keyPoints: '站在台阶边缘，脚尖略朝外 30°，脚跟下降到最低（充分拉长）再蹬到最高停顿 1 秒。手扶墙只用于平衡，不要借力。',
    }),
    'ex_calf_stretch_wall',
  ],
};

const GASTROC_LATERAL: PartPlan = {
  cue: '外侧头偏上部。提踵时脚尖朝内 (toes in)，负荷更多落在外侧。',
  items: [
    ex('坐姿提踵（脚尖朝内）', {
      nameEn: 'Toes-in Seated Calf Raise', kind: 'strengthen', sets: '3', reps: '15-20', rest: '45 秒', equipment: ['machine'],
      keyPoints: '膝盖压在垫片下，前脚掌踩踏板，脚尖朝内。屈膝位腓肠肌被削弱，但可以通过脚尖朝向引导负荷落到外侧头。',
    }),
    'ex_foam_roll_calf',
  ],
};

const PERONEAL_LONG: PartPlan = {
  cue: '足外翻 + 踩胭：这个动作同时保护脚踝外侧韧带，容易扭脚的人一定要练。',
  items: [
    ex('弹力带足外翻', {
      nameEn: 'Band Eversion', kind: 'strengthen', sets: '3', reps: '15-20/侧', rest: '30 秒', frequency: '每周 3 次', equipment: ['band'],
      keyPoints: '坐位，弹力带套在前脚掌外侧，脚向外侧翻（脚心朝向外侧）对抗阻力，小腿固定不动。',
    }),
    'ex_single_leg_balance',
  ],
};

const FOOT_ABDUCTOR_HALLUCIS: PartPlan = {
  cue: '拇展肌维持内侧纵弓，是扁平足最该练的肌肉，但要用非常细腻的小动作去唤醒。',
  items: [
    'ex_short_foot',
    'ex_towel_curl',
    ex('脚趾独立控制练习', {
      nameEn: 'Toe Spread & Press', kind: 'activate', sets: '3', reps: '15 次', rest: '30 秒', frequency: '每天', equipment: ['none'],
      keyPoints: '脚平放松，试着把五个脚趾分开，然后只把大脚趾压向地面同时其他脚趾保持抬起。做不出来是正常的，慢慢练。',
    }),
  ],
};

const MULTIFIDUS_LUMBAR: PartPlan = {
  cue: '多裂肌是深层的节段稳定肌：它要的是「脊柱一节一节地动」，不是大幅度动。用很慢的速度、很小的幅度。',
  mistakes: ['试图用大重量硬拉去练多裂肌（练到的是表层竖脊肌）'],
  items: [
    'ex_dead_bug',
    ex('鸟狗式', {
      nameEn: 'Bird Dog', kind: 'activate', sets: '3', reps: '10-12/侧', rest: '30 秒', frequency: '每天', equipment: ['none'],
      keyPoints: '四点跪撑，缓慢伸出对侧的手和腿到与地面平行，保持 2 秒再收回。全程骨盆不晃、腰不塌，想象背上放着一杯水。',
    }),
    ex('侧卧呼吸（腹横肌/多裂协同）', {
      nameEn: 'Side-lying Breathing', kind: 'relax', sets: '2', reps: '10 次呼吸', rest: '-', frequency: '每天', equipment: ['none'],
      keyPoints: '侧卧屈膝，手放在侧腹，吸气让侧腹与下背轻微扩张，呼气慢慢收回到地板。每天几分钟就能改善腰背紧绷。',
    }),
  ],
};

// ───────────────────────── 汇总 ─────────────────────────

export const PART_PLANS: Record<string, PartPlan> = {
  'shoulder_deltoid:anterior': DELT_ANTERIOR,
  'shoulder_deltoid:middle': DELT_MIDDLE,
  'shoulder_deltoid:posterior': DELT_POSTERIOR,

  'chest_pec_major:clavicular': PEC_CLAVICULAR,
  'chest_pec_major:sternocostal': PEC_STERNOCOSTAL,
  'chest_pec_major:abdominal': PEC_ABDOMINAL,

  'shoulder_rotator_cuff:supraspinatus': CUFF_SUPRA,
  'shoulder_rotator_cuff:infraspinatus': CUFF_INFRA,
  'shoulder_rotator_cuff:teres_minor': CUFF_TERES_MINOR,
  'shoulder_rotator_cuff:subscapularis': CUFF_SUBSCAP,
  'shoulder_rotator_cuff:teres_major': CUFF_TERES_MAJOR,

  'back_trapezius_lower:middle': TRAP_MIDDLE,
  'back_trapezius_lower:lower': TRAP_LOWER,

  'arm_biceps:long_head': BICEPS_LONG,
  'arm_biceps:short_head': BICEPS_SHORT,
  'arm_biceps:brachialis': BRACHIALIS,
  'arm_biceps:coracobrachialis': CORACO,

  'arm_triceps:long_head': TRI_LONG,
  'arm_triceps:lateral_head': TRI_LATERAL,
  'arm_triceps:medial_head': TRI_MEDIAL,

  'core_oblique:external': OBLIQUE_EXTERNAL,
  'core_oblique:internal': OBLIQUE_INTERNAL,

  'hip_glute_med:medius': GLUTE_MEDIUS,
  'hip_glute_med:minimus': GLUTE_MINIMUS,
  'hip_glute_med:piriformis': GLUTE_PIRIFORMIS,
  'hip_tfl_itb:tfl': TFL,
  'hip_tfl_itb:it_band': IT_BAND,
  'hip_iliopsoas:psoas': ILIOPSOAS_PSOAS,

  'thigh_quads:rectus_femoris': QUAD_RECTUS_FEMORIS,
  'thigh_quads:vastus_lateralis': QUAD_VASTUS_LATERALIS,
  'thigh_quads:vastus_medialis': QUAD_VASTUS_MEDIALIS,
  'thigh_quads:vastus_intermedius': QUAD_INTERMEDIUS,

  'thigh_hamstrings:semitendinosus': HAM_SEMI,
  'thigh_hamstrings:semimembranosus': HAM_SEMI,
  'thigh_hamstrings:biceps_long': HAM_BICEPS_LONG,
  'thigh_hamstrings:biceps_short': HAM_BICEPS_SHORT,

  'thigh_adductor:magnus': ADDUCTOR_MAGNUS,
  'thigh_adductor:longus': ADDUCTOR_LONGUS,
  'thigh_adductor:gracilis': GRACILIS,

  'calf_gastroc:medial_head': GASTROC_MEDIAL,
  'calf_gastroc:lateral_head': GASTROC_LATERAL,

  'calf_peroneal:longus': PERONEAL_LONG,
  'foot_intrinsic:abductor_hallucis': FOOT_ABDUCTOR_HALLUCIS,

  'back_erector:multifidus_lum': MULTIFIDUS_LUMBAR,
};

export function getPartPlan(partId: string): PartPlan | undefined {
  return PART_PLANS[partId];
}

/**
 * 每个肌群的「恢复动作」补充库（放松 + 拉伸）。
 *
 * 亚部方案主要围绕「怎么练得更准」写，多数只有强化/激活。
 * 但用户同样会问「这块酸痛怎么办 / 紧怎么办」——这里按肌群补上通用的放松与拉伸，
 * 由 resolvePartPlan 自动并入，避免为 44 个亚部重复书写。
 */
export const RECOVERY_BY_GROUP: Record<string, { relax?: string[]; stretch?: string[] }> = {
  shoulder_deltoid: {
    relax: ['ex_release_delt'],
    stretch: ['ex_stretch_delt_posterior', 'ex_stretch_delt_anterior'],
  },
  shoulder_rotator_cuff: {
    relax: ['ex_release_cuff_posterior'],
    stretch: ['ex_stretch_cuff_sleeper'],
  },
  chest_pec_major: {
    relax: ['ex_foam_roll_pec'],
    stretch: ['ex_pec_stretch_doorway', 'ex_stretch_delt_anterior'],
  },
  chest_pec_minor: {
    relax: ['ex_foam_roll_pec'],
    stretch: ['ex_stretch_pec_minor_corner'],
  },
  chest_serratus: { stretch: ['ex_stretch_serratus_wall'] },
  back_trapezius_upper: {
    relax: ['ex_release_upper_trap'],
    stretch: ['ex_upper_trap_stretch', 'ex_levator_stretch'],
  },
  back_trapezius_lower: {
    relax: ['ex_release_scapula_border'],
    stretch: ['ex_stretch_scapula_protract'],
  },
  back_lat: {
    relax: ['ex_foam_roll_lat'],
    stretch: ['ex_stretch_lat_hang', 'ex_stretch_child_pose'],
  },
  back_rhomboid: {
    relax: ['ex_release_scapula_border'],
    stretch: ['ex_stretch_scapula_protract'],
  },
  back_erector: {
    relax: ['ex_release_erector'],
    stretch: ['ex_stretch_child_pose', 'ex_stretch_cobra'],
  },
  back_ql: {
    relax: ['ex_release_ql', 'ex_release_waist_side'],
    stretch: ['ex_stretch_oblique_side'],
  },
  arm_biceps: { relax: ['ex_release_biceps'], stretch: ['ex_stretch_biceps_wall'] },
  arm_triceps: { relax: ['ex_release_triceps'], stretch: ['ex_stretch_triceps_overhead'] },
  arm_forearm_flexor: {
    relax: ['ex_release_forearm'],
    stretch: ['ex_stretch_wrist_flexor'],
  },
  arm_forearm_extensor: {
    relax: ['ex_release_forearm'],
    stretch: ['ex_stretch_wrist_extensor'],
  },
  core_rectus: { stretch: ['ex_stretch_cobra'] },
  core_oblique: { relax: ['ex_release_waist_side'], stretch: ['ex_stretch_oblique_side'] },
  core_transverse: { stretch: ['ex_stretch_child_pose'] },
  hip_glute_max: { relax: ['ex_release_glute_max'], stretch: ['ex_stretch_figure4'] },
  hip_glute_med: { relax: ['ex_release_glute_med'], stretch: ['ex_stretch_figure4'] },
  hip_iliopsoas: {
    relax: ['ex_release_psoas'],
    stretch: ['ex_hip_flexor_stretch', 'ex_standing_hip_flexor', 'ex_stretch_psoas_lunge', 'ex_stretch_quad_standing'],
  },
  hip_tfl_itb: { relax: ['ex_foam_roll_itb'], stretch: ['ex_stretch_figure4'] },
  thigh_quads: { relax: ['ex_foam_roll_quad'], stretch: ['ex_stretch_quad_standing'] },
  thigh_hamstrings: {
    relax: ['ex_release_hamstrings'],
    stretch: ['ex_stretch_hamstring_supine'],
  },
  thigh_adductor: {
    relax: ['ex_release_adductor'],
    stretch: ['ex_stretch_adductor_butterfly'],
  },
  calf_gastroc: {
    relax: ['ex_foam_roll_calf'],
    stretch: ['ex_calf_stretch_wall', 'ex_stretch_soleus_wall'],
  },
  calf_soleus: { relax: ['ex_release_soleus'], stretch: ['ex_stretch_soleus_wall'] },
  calf_tibialis_ant: {
    relax: ['ex_release_tibialis'],
    stretch: ['ex_stretch_kneeling_tibialis'],
  },
  calf_peroneal: { relax: ['ex_release_peroneal'], stretch: ['ex_stretch_peroneal'] },
  neck_scm: { relax: ['ex_suboccipital_release'], stretch: ['ex_scm_stretch'] },
  neck_levator: { relax: ['ex_release_upper_trap'], stretch: ['ex_levator_stretch'] },
  neck_suboccipital: {
    relax: ['ex_suboccipital_release'],
    stretch: ['ex_stretch_deep_neck'],
  },
  neck_deep_flexor: {
    relax: ['ex_release_deep_neck'],
    stretch: ['ex_stretch_deep_neck'],
  },
  foot_intrinsic: {
    relax: ['ex_release_foot_plantar'],
    stretch: ['ex_stretch_toe_flexor'],
  },
};

/** 取某个肌群的恢复动作（去重、忽略缺失 id） */
export function recoveryFor(groupId: string): Exercise[] {
  const rec = RECOVERY_BY_GROUP[groupId];
  if (!rec) return [];
  const seen = new Set<string>();
  const out: Exercise[] = [];
  for (const id of [...(rec.relax ?? []), ...(rec.stretch ?? [])]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const ex = EXERCISES[id];
    if (ex) out.push(ex);
    else console.warn('[partPlans] 恢复库缺少动作', id);
  }
  return out;
}

/** 把 PartPlan 的 items 解析成可直接渲染的 Exercise[]（不含肌群级恢复动作） */
export function resolvePartPlan(partId: string): Exercise[] {
  const plan = PART_PLANS[partId];
  if (!plan) return [];
  const out: Exercise[] = [];
  plan.items.forEach((item, i) => {
    if (typeof item === 'string') {
      const found = EXERCISES[item];
      if (found) out.push(found);
      else console.warn('[partPlans] 找不到动作', item);
      return;
    }
    out.push({
      id: `${partId}#${i}`,
      name: item.name,
      nameEn: item.nameEn,
      kind: item.kind,
      targetMuscles: [],
      sets: item.sets,
      reps: item.reps,
      rest: item.rest,
      frequency: item.frequency,
      keyPoints: item.keyPoints,
      equipment: item.equipment,
      difficulty: item.difficulty,
      cautions: item.cautions,
    });
  });
  return out;
}

/**
 * 亚部完整动作列表 = 亚部专属方案 + 所属肌群的通用恢复动作（放松/拉伸），按 id 去重。
 * 这样「这块肌肉酸痛」「这块肌肉很紧」在任意亚部下都有可执行的内容。
 */
export function resolvePartPlanWithRecovery(partId: string, groupId: string): Exercise[] {
  const own = resolvePartPlan(partId);
  const seen = new Set(own.map((e) => e.id));
  const extra = recoveryFor(groupId).filter((e) => !seen.has(e.id));
  return [...own, ...extra];
}
