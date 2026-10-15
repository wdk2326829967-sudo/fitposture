// 知识库共享类型：肌肉 / 动作 / 问题 / 体态

export type MuscleId =
  | 'chest_pec_major' | 'chest_pec_minor' | 'chest_serratus'
  | 'shoulder_deltoid' | 'shoulder_rotator_cuff'
  | 'back_trapezius_upper' | 'back_trapezius_lower' | 'back_lat' | 'back_rhomboid'
  | 'back_erector' | 'back_ql'
  | 'arm_biceps' | 'arm_triceps' | 'arm_forearm_flexor' | 'arm_forearm_extensor'
  | 'core_rectus' | 'core_oblique' | 'core_transverse'
  | 'hip_glute_max' | 'hip_glute_med' | 'hip_iliopsoas' | 'hip_tfl_itb'
  | 'thigh_quads' | 'thigh_hamstrings' | 'thigh_adductor'
  | 'calf_gastroc' | 'calf_soleus' | 'calf_tibialis_ant' | 'calf_peroneal'
  | 'neck_scm' | 'neck_levator' | 'neck_suboccipital' | 'neck_deep_flexor'
  | 'foot_tibialis_post' | 'foot_intrinsic'
  | 'tendon' | 'other';

export type MuscleRegion =
  | 'chest' | 'shoulder' | 'back' | 'arm' | 'core' | 'hip' | 'thigh' | 'calf' | 'neck' | 'foot' | 'other';

export type ProblemType =
  | 'soreness'        // 酸痛 / 延迟性肌肉酸痛
  | 'strain'          // 急性拉伤
  | 'chronic_tension' // 慢性紧张 / 僵硬
  | 'hypertrophy'     // 想练大
  | 'posture'         // 体态相关
  | 'limited_mobility'; // 活动度受限

export type ExerciseKind = 'relax' | 'stretch' | 'activate' | 'strengthen';

export type Equipment =
  | 'none' | 'band' | 'dumbbell' | 'barbell' | 'machine' | 'cable' | 'foam_roller' | 'wall' | 'bench';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  kind: ExerciseKind;
  targetMuscles: MuscleId[];
  synergists?: MuscleId[];
  sets?: string;
  reps?: string;
  rest?: string;
  frequency?: string;
  keyPoints: string;
  equipment: Equipment[];
  difficulty: Difficulty;
  cautions?: string[];
}

export interface Solution {
  criteria: string;
  redFlags?: string[];
  relax?: string[];
  stretch?: string[];
  activate?: string[];
  strengthen?: string[];
  progression: string;
  seeDoctor: string;
  disclaimer?: string;
}

export interface Muscle {
  id: MuscleId;
  cn: string;
  en: string;
  latin: string;
  region: MuscleRegion;
  origin: string;
  insertion: string;
  action: string;
  nerve: string;
  postureIssues?: string[];
  problems: Partial<Record<ProblemType, Solution>>;
  cautions?: string[];
}

// ---------- 体态 ----------

export type PostureId = string;

export interface SelfTest {
  id: string;
  name: string;
  steps: string[];
  whatToLook: string;
  normal: string;
  abnormal: string;
  threshold?: string;
  needsPartner?: boolean;
}

export interface PostureParams {
  headForward?: number;
  thoracicKyphosis?: number;
  lumbarLordosis?: number;
  pelvicTilt?: number;
  kneeHyperextension?: number;
  shoulderTilt?: number;
  pelvicTiltLR?: number;
  kneeValgus?: number;
  kneeVarus?: number;
  archHeight?: number;
}

export interface PostureDiagramSpec {
  view: 'side' | 'front' | 'back';
  normal: PostureParams;
  abnormal: PostureParams;
  annotations: { at: string; text: string }[];
}

export interface PostureIssue {
  id: PostureId;
  cn: string;
  en: string;
  category: 'shoulder' | 'spine' | 'pelvis' | 'lower' | 'foot';
  description: string;
  howToSelfCheck: string;
  tight: MuscleId[];
  weak: MuscleId[];
  plan: {
    relax?: string[];
    stretch?: string[];
    activate?: string[];
    strengthen?: string[];
  };
  selfTest: SelfTest[];
  diagram?: PostureDiagramSpec;
  cautions?: string[];
}

// ---------- 症状反查 ----------

export type SymptomRegion =
  | 'head_neck' | 'shoulder' | 'upper_back' | 'low_back'
  | 'hip' | 'knee' | 'lower_leg' | 'foot' | 'arm';

/** 这块肌肉在该症状里扮演的角色：长期缩短 / 被拉长失活 / 单纯负荷过大 */
export type MuscleState = 'tight' | 'weak' | 'overworked';

export interface SymptomCause {
  muscle: MuscleId;
  /** primary = 最可能的来源，secondary = 常一起受累但不一定是主因 */
  role: 'primary' | 'secondary';
  state: MuscleState;
  /** 为什么是它 */
  why: string;
  /** 怎么判断就是它（与同区域其它肌肉区分开） */
  tell: string;
}

export interface SymptomQuickCheck {
  id: string;
  name: string;
  steps: string[];
  /** 结果怎么读 */
  meaning: string;
}

export interface Symptom {
  id: string;
  cn: string;
  /** 口语说法与搜索关键词 */
  aliases: string[];
  region: SymptomRegion;
  /** 一句话说清这是怎么回事 */
  summary: string;
  /** 典型人群 / 常见诱发场景 */
  typical: string;
  causes: SymptomCause[];
  /** 相关的体态问题 */
  postures: PostureId[];
  /** 30 秒内可完成的区分性自测 */
  quickChecks: SymptomQuickCheck[];
  /** 急性期（48-72 小时内）该做什么 */
  acute: string[];
  /** 这段时间不要做什么 */
  avoid: string[];
  plan: {
    relax?: string[];
    stretch?: string[];
    activate?: string[];
    strengthen?: string[];
  };
  /** 生活 / 工位调整，往往比练十分钟更管用 */
  dailyTips: string[];
  redFlags: string[];
  seeDoctor: string;
  disclaimer?: string;
}

// ---------- 用户上下文 ----------

export interface UserContext {
  painLevel?: 0 | 1 | 2 | 3 | 4 | 5;      // 0 无痛 ~ 5 剧痛
  duration?: 'today' | 'within72h' | 'within2w' | 'over2w';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: Equipment[];
}
