// 茶王皇朝 - 標準服務項目定義
// 每個服務都包含名稱、說明、分類

export interface ServiceDefinition {
  name: string;
  description: string;
  category: 'basic' | 'addon' | 'mode' | 'communication';
}

// 服務模式
export const SERVICE_MODES: ServiceDefinition[] = [
  { name: '1對1', description: '一對一私密服務', category: 'mode' },
  { name: '快餐', description: '快速服務，約30~50分鐘', category: 'mode' },
  { name: '2S', description: '兩次服務，時間較長', category: 'mode' },
  { name: '包夜', description: '過夜服務，整晚陪伴', category: 'mode' },
];

// 基本服務（通常包含在底價內）
export const BASIC_SERVICES: ServiceDefinition[] = [
  { name: '按摩', description: '全身舒壓按摩放鬆', category: 'basic' },
  { name: '陪洗', description: '貼心陪同沐浴清洗', category: 'basic' },
  { name: '共浴', description: '浪漫共同泡澡', category: 'basic' },
  { name: '殘廢澡', description: '全程溫柔幫你洗澡', category: 'basic' },
  { name: '中文溝通', description: '可使用中文交流', category: 'communication' },
  { name: '英文溝通', description: '可使用英文交流', category: 'communication' },
];

// 加值服務（可配合項目）
export const ADDON_SERVICES: ServiceDefinition[] = [
  { name: '奶砲', description: '胸部夾擊特殊服務', category: 'addon' },
  { name: '毒龍', description: '舌尖後庭深度服務', category: 'addon' },
  { name: '裸舌毒龍', description: '無保護後庭舌尖服務', category: 'addon' },
  { name: '69', description: '雙方互相口交姿勢', category: 'addon' },
  { name: 'LG', description: '舌吻，依現場氣氛與衛生狀況而定', category: 'addon' },
  { name: '可親嘴', description: '可以溫柔親吻', category: 'addon' },
  { name: '無套吹', description: '無保護口交服務', category: 'addon' },
  { name: '口爆', description: '口中完成射精', category: 'addon' },
  { name: '吞精', description: '吞嚥精華服務', category: 'addon' },
  { name: '足交', description: '用美足提供特殊服務', category: 'addon' },
  { name: '品鮑', description: '品嚐女方私密部位', category: 'addon' },
  { name: '舔蛋', description: '舌尖輕舔敏感部位', category: 'addon' },
  { name: '奶推', description: '用豐滿胸部按摩全身', category: 'addon' },
  { name: '屁推', description: '用翹臀按摩服務', category: 'addon' },
  { name: '顏射', description: '射在臉部', category: 'addon' },
  { name: '浴中蕭', description: '浴缸中的口交服務', category: 'addon' },
  { name: '深喉嚨', description: '深喉口交技巧', category: 'addon' },
  { name: '艷舞秀', description: '性感舞蹈表演秀', category: 'addon' },
  { name: '變裝', description: '角色扮演變裝服務（自備免付）', category: 'addon' },
  { name: '絲襪', description: '絲襪裝扮情趣服務（自備免付）', category: 'addon' },
  { name: '玩具(按摩棒)', description: '使用按摩棒輔助服務', category: 'addon' },
  { name: '玩具(跳蛋)', description: '使用跳蛋增添情趣', category: 'addon' },
  { name: '情趣用品', description: '可使用情趣用品（客人自備）', category: 'addon' },
  { name: '自慰秀', description: '自慰表演觀賞', category: 'addon' },
  { name: '攝影', description: '可配合拍照或錄影留念', category: 'addon' },
  { name: '射後清槍', description: '完事後再次清潔口交服務', category: 'addon' },
];

// 完整服務清單（合併所有分類）
export const ALL_SERVICES: ServiceDefinition[] = [
  ...SERVICE_MODES,
  ...BASIC_SERVICES,
  ...ADDON_SERVICES,
];

// 服務名稱 → 描述的快速查詢 Map
export const SERVICE_DESCRIPTION_MAP: Record<string, string> = {};
ALL_SERVICES.forEach(s => {
  SERVICE_DESCRIPTION_MAP[s.name] = s.description;
});

// 根據名稱取得描述
export function getServiceDescription(name: string): string | undefined {
  return SERVICE_DESCRIPTION_MAP[name];
}
