// 30+ 个肌群的中文档案：展示名、英文名、拉丁名、所属分区、正/背面可见
import type { MuscleId, MuscleRegion } from '@/kb/types';

export interface MuscleMeta {
  id: MuscleId;
  cn: string;
  en: string;
  latin: string;
  region: MuscleRegion;
  /** 主要在哪一面可见，用于正/背面切换时的快速定位 */
  view: 'front' | 'back' | 'both';
}

export const MUSCLE_META: Record<string, MuscleMeta> = {
  chest_pec_major: { id: 'chest_pec_major', cn: '胸大肌', en: 'Pectoralis major', latin: 'M. pectoralis major', region: 'chest', view: 'front' },
  chest_pec_minor: { id: 'chest_pec_minor', cn: '胸小肌', en: 'Pectoralis minor', latin: 'M. pectoralis minor', region: 'chest', view: 'front' },
  chest_serratus: { id: 'chest_serratus', cn: '前锯肌', en: 'Serratus anterior', latin: 'M. serratus anterior', region: 'chest', view: 'front' },

  shoulder_deltoid: { id: 'shoulder_deltoid', cn: '三角肌', en: 'Deltoid', latin: 'M. deltoideus', region: 'shoulder', view: 'both' },
  shoulder_rotator_cuff: { id: 'shoulder_rotator_cuff', cn: '肩袖肌群', en: 'Rotator cuff', latin: 'Mm. cuffae rotatoriae', region: 'shoulder', view: 'back' },

  back_trapezius_upper: { id: 'back_trapezius_upper', cn: '斜方肌上束', en: 'Upper trapezius', latin: 'M. trapezius (descending)', region: 'back', view: 'back' },
  back_trapezius_lower: { id: 'back_trapezius_lower', cn: '斜方肌中下束', en: 'Middle/Lower trapezius', latin: 'M. trapezius (transverse/ascending)', region: 'back', view: 'back' },
  back_lat: { id: 'back_lat', cn: '背阔肌', en: 'Latissimus dorsi', latin: 'M. latissimus dorsi', region: 'back', view: 'back' },
  back_rhomboid: { id: 'back_rhomboid', cn: '菱形肌', en: 'Rhomboids', latin: 'Mm. rhomboidei', region: 'back', view: 'back' },
  back_erector: { id: 'back_erector', cn: '竖脊肌', en: 'Erector spinae', latin: 'Mm. erectores spinae', region: 'back', view: 'back' },
  back_ql: { id: 'back_ql', cn: '腰方肌', en: 'Quadratus lumborum', latin: 'M. quadratus lumborum', region: 'back', view: 'back' },

  arm_biceps: { id: 'arm_biceps', cn: '肱二头肌', en: 'Biceps brachii', latin: 'M. biceps brachii', region: 'arm', view: 'front' },
  arm_triceps: { id: 'arm_triceps', cn: '肱三头肌', en: 'Triceps brachii', latin: 'M. triceps brachii', region: 'arm', view: 'back' },
  arm_forearm_flexor: { id: 'arm_forearm_flexor', cn: '前臂屈肌群', en: 'Forearm flexors', latin: 'Mm. flexores antebrachii', region: 'arm', view: 'front' },
  arm_forearm_extensor: { id: 'arm_forearm_extensor', cn: '前臂伸肌群', en: 'Forearm extensors', latin: 'Mm. extensores antebrachii', region: 'arm', view: 'back' },

  core_rectus: { id: 'core_rectus', cn: '腹直肌', en: 'Rectus abdominis', latin: 'M. rectus abdominis', region: 'core', view: 'front' },
  core_oblique: { id: 'core_oblique', cn: '腹斜肌', en: 'Obliques', latin: 'Mm. obliqui abdominis', region: 'core', view: 'front' },
  core_transverse: { id: 'core_transverse', cn: '腹横肌', en: 'Transversus abdominis', latin: 'M. transversus abdominis', region: 'core', view: 'front' },

  hip_glute_max: { id: 'hip_glute_max', cn: '臀大肌', en: 'Gluteus maximus', latin: 'M. gluteus maximus', region: 'hip', view: 'back' },
  hip_glute_med: { id: 'hip_glute_med', cn: '臀中肌', en: 'Gluteus medius', latin: 'M. gluteus medius', region: 'hip', view: 'back' },
  hip_iliopsoas: { id: 'hip_iliopsoas', cn: '髂腰肌', en: 'Iliopsoas', latin: 'M. iliopsoas', region: 'hip', view: 'front' },
  hip_tfl_itb: { id: 'hip_tfl_itb', cn: '阔筋膜张肌/髂胫束', en: 'TFL / IT band', latin: 'M. tensor fasciae latae', region: 'hip', view: 'both' },

  thigh_quads: { id: 'thigh_quads', cn: '股四头肌', en: 'Quadriceps', latin: 'M. quadriceps femoris', region: 'thigh', view: 'front' },
  thigh_hamstrings: { id: 'thigh_hamstrings', cn: '腘绳肌', en: 'Hamstrings', latin: 'Mm. hamstring', region: 'thigh', view: 'back' },
  thigh_adductor: { id: 'thigh_adductor', cn: '内收肌群', en: 'Adductors', latin: 'Mm. adductores', region: 'thigh', view: 'front' },

  calf_gastroc: { id: 'calf_gastroc', cn: '腓肠肌', en: 'Gastrocnemius', latin: 'M. gastrocnemius', region: 'calf', view: 'back' },
  calf_soleus: { id: 'calf_soleus', cn: '比目鱼肌', en: 'Soleus', latin: 'M. soleus', region: 'calf', view: 'back' },
  calf_tibialis_ant: { id: 'calf_tibialis_ant', cn: '胫骨前肌', en: 'Tibialis anterior', latin: 'M. tibialis anterior', region: 'calf', view: 'front' },
  calf_peroneal: { id: 'calf_peroneal', cn: '腓骨肌群', en: 'Peroneals', latin: 'Mm. peronei', region: 'calf', view: 'both' },

  neck_scm: { id: 'neck_scm', cn: '胸锁乳突肌', en: 'Sternocleidomastoid', latin: 'M. sternocleidomastoideus', region: 'neck', view: 'front' },
  neck_levator: { id: 'neck_levator', cn: '肩胛提肌', en: 'Levator scapulae', latin: 'M. levator scapulae', region: 'neck', view: 'back' },
  neck_suboccipital: { id: 'neck_suboccipital', cn: '枕下肌群', en: 'Suboccipital muscles', latin: 'Mm. suboccipitales', region: 'neck', view: 'back' },
  neck_deep_flexor: { id: 'neck_deep_flexor', cn: '颈深屈肌', en: 'Deep neck flexors', latin: 'Mm. longi colli/capitis', region: 'neck', view: 'front' },

  foot_tibialis_post: { id: 'foot_tibialis_post', cn: '胫骨后肌', en: 'Tibialis posterior', latin: 'M. tibialis posterior', region: 'foot', view: 'back' },
  foot_intrinsic: { id: 'foot_intrinsic', cn: '足内在肌', en: 'Intrinsic foot muscles', latin: 'Mm. pedis intrinsici', region: 'foot', view: 'both' },
};

export const REGION_CN: Record<MuscleRegion, string> = {
  chest: '胸部',
  shoulder: '肩部',
  back: '背部',
  arm: '手臂',
  core: '核心',
  hip: '髋臀',
  thigh: '大腿',
  calf: '小腿',
  neck: '颈肩',
  foot: '足部',
  other: '其他',
};

export function muscleCn(id: string): string {
  return MUSCLE_META[id]?.cn ?? id;
}
