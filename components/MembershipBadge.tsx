import React from 'react';
import { MembershipLevel, LadyMembershipLevel, AnyMembershipLevel, CLIENT_LEVEL_NAMES, LADY_LEVEL_NAMES, getLevelName } from '../types';

interface MembershipBadgeProps {
  level: AnyMembershipLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// 品茶客等级图标路径映射
const clientLevelIconPaths: Record<MembershipLevel, string> = {
  tea_guest: '/images/品茶客/等級/茶客.svg',
  tea_scholar: '/images/品茶客/等級/入門茶士.svg',
  royal_tea_scholar: '/images/品茶客/等級/御前茶士.svg',
  royal_tea_officer: '/images/品茶客/等級/御用茶官.svg',
  tea_king_attendant: '/images/品茶客/等級/茶王近侍.svg',
  imperial_chief_tea_officer: '/images/品茶客/等級/御前總茶官.svg',
  tea_king_confidant: '/images/品茶客/等級/茶王心腹.svg',
  tea_king_personal_selection: '/images/品茶客/等級/茶王親選.svg',
  imperial_golden_seal_tea_officer: '/images/品茶客/等級/御賜金印茶官.svg',
  national_master_tea_officer: '/images/品茶客/等級/國師級茶官.svg',
};

// 後宮佳麗等級圖標路徑映射
const ladyLevelIconPaths: Record<LadyMembershipLevel, string> = {
  lady_trainee: '/images/後宮佳麗/等級/初級佳麗.svg',
  lady_apprentice: '/images/後宮佳麗/等級/見習佳麗.svg',
  lady_junior: '/images/後宮佳麗/等級/中級佳麗.svg',
  lady_senior: '/images/後宮佳麗/等級/高級佳麗.svg',
  lady_expert: '/images/後宮佳麗/等級/資深佳麗.svg',
  lady_master: '/images/後宮佳麗/等級/御用佳麗.svg',
  lady_elite: '/images/後宮佳麗/等級/金牌佳麗.svg',
  lady_premium: '/images/後宮佳麗/等級/鑽石佳麗.svg',
  lady_royal: '/images/後宮佳麗/等級/皇家佳麗.svg',
  lady_empress: '/images/後宮佳麗/等級/皇后級佳麗.svg',
};

// 獲取等級圖標路徑
const getLevelIconPath = (level: AnyMembershipLevel): string => {
  if (level in ladyLevelIconPaths) {
    return ladyLevelIconPaths[level as LadyMembershipLevel];
  }
  return clientLevelIconPaths[level as MembershipLevel] || clientLevelIconPaths.tea_guest;
};

// 等级图标组件
const LevelIcon: React.FC<{ level: AnyMembershipLevel; className?: string }> = ({ level, className = 'w-4 h-4' }) => {
  const iconPath = getLevelIconPath(level);
  const [imgError, setImgError] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  
  // 如果图片加载失败，显示一个彩色占位符SVG（使用品牌色）
  if (imgError) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1a5f3f' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    );
  }
  
  return (
    <div className={className} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {!imgLoaded && !imgError && (
        <div className="absolute inset-0 bg-brand-green/20 animate-pulse rounded" style={{ minWidth: '1em', minHeight: '1em', backgroundColor: 'rgba(26, 95, 63, 0.2)' }} />
      )}
      <img 
        src={iconPath} 
        alt={getLevelName(level)} 
        className={className}
        style={{ 
          objectFit: 'contain', 
          display: imgLoaded ? 'block' : 'none',
          width: '100%', 
          height: '100%',
          flexShrink: 0,
          filter: 'none' // 確保沒有灰階過濾器
        }}
        onError={(e) => {
          console.error('等級圖標加載失敗:', iconPath);
          setImgError(true);
          setImgLoaded(false);
        }}
        onLoad={() => {
          setImgLoaded(true);
          setImgError(false);
        }}
        loading="eager" // 改為 eager，確保圖標優先加載
        decoding="async"
      />
    </div>
  );
};

// 品茶客等級配置
const clientMembershipConfig: Record<MembershipLevel, { label: string; color: string; bgColor: string }> = {
  tea_guest: {
    label: CLIENT_LEVEL_NAMES.tea_guest,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  tea_scholar: {
    label: CLIENT_LEVEL_NAMES.tea_scholar,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  royal_tea_scholar: {
    label: CLIENT_LEVEL_NAMES.royal_tea_scholar,
    color: 'text-gray-600',
    bgColor: 'bg-gray-200',
  },
  royal_tea_officer: {
    label: CLIENT_LEVEL_NAMES.royal_tea_officer,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  tea_king_attendant: {
    label: CLIENT_LEVEL_NAMES.tea_king_attendant,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  imperial_chief_tea_officer: {
    label: CLIENT_LEVEL_NAMES.imperial_chief_tea_officer,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  tea_king_confidant: {
    label: CLIENT_LEVEL_NAMES.tea_king_confidant,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  tea_king_personal_selection: {
    label: CLIENT_LEVEL_NAMES.tea_king_personal_selection,
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
  },
  imperial_golden_seal_tea_officer: {
    label: CLIENT_LEVEL_NAMES.imperial_golden_seal_tea_officer,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-200',
  },
  national_master_tea_officer: {
    label: CLIENT_LEVEL_NAMES.national_master_tea_officer,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

// 後宮佳麗等級配置
const ladyMembershipConfig: Record<LadyMembershipLevel, { label: string; color: string; bgColor: string }> = {
  lady_trainee: {
    label: LADY_LEVEL_NAMES.lady_trainee,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  lady_apprentice: {
    label: LADY_LEVEL_NAMES.lady_apprentice,
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
  },
  lady_junior: {
    label: LADY_LEVEL_NAMES.lady_junior,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  lady_senior: {
    label: LADY_LEVEL_NAMES.lady_senior,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  lady_expert: {
    label: LADY_LEVEL_NAMES.lady_expert,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  lady_master: {
    label: LADY_LEVEL_NAMES.lady_master,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  lady_elite: {
    label: LADY_LEVEL_NAMES.lady_elite,
    color: 'text-amber-700',
    bgColor: 'bg-amber-200',
  },
  lady_premium: {
    label: LADY_LEVEL_NAMES.lady_premium,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  lady_royal: {
    label: LADY_LEVEL_NAMES.lady_royal,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  lady_empress: {
    label: LADY_LEVEL_NAMES.lady_empress,
    color: 'text-rose-700',
    bgColor: 'bg-rose-200',
  },
};

// 獲取等級配置
const getMembershipConfig = (level: AnyMembershipLevel): { label: string; color: string; bgColor: string } | null => {
  if (level in ladyMembershipConfig) {
    return ladyMembershipConfig[level as LadyMembershipLevel];
  }
  if (level in clientMembershipConfig) {
    return clientMembershipConfig[level as MembershipLevel];
  }
  return null;
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1 sm:px-3 sm:py-1.5',
  md: 'text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2',
  lg: 'text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5',
};

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({ 
  level, 
  size = 'md', 
  showLabel = true 
}) => {
  // 防御性检查：如果 level 无效或不存在，使用默认值
  const normalizedLevel: AnyMembershipLevel = (() => {
    if (!level) {
      // 默認值取決於上下文，這裡返回品茶客默認值
      return 'tea_guest';
    }
    
    // 映射旧等级名称到新名称
    const oldToNew: Record<string, AnyMembershipLevel> = {
      'free': 'tea_guest',
      'bronze': 'tea_scholar',
      'silver': 'royal_tea_scholar',
      'gold': 'royal_tea_officer',
      'diamond': 'tea_king_attendant',
    };
    
    if (oldToNew[level]) {
      return oldToNew[level];
    }
    
    // 檢查是否是有效的等級
    if (level in clientMembershipConfig || level in ladyMembershipConfig) {
      return level as AnyMembershipLevel;
    }
    
    // 默認返回 tea_guest
    return 'tea_guest';
  })();
  
  const config = getMembershipConfig(normalizedLevel);
  const sizeClass = sizeClasses[size];

  if (!config) {
    // 如果仍然沒有配置，返回默認顯示
    const defaultLabel = getLevelName(normalizedLevel);
    return (
      <span
        className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full font-medium bg-gray-100 text-gray-600 ${sizeClass}`}
        title={defaultLabel}
        style={{ filter: 'none' }} // 確保 badge 沒有灰階過濾器
      >
        <LevelIcon level={normalizedLevel} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ filter: 'none' }} />
        {showLabel && <span>{defaultLabel}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClass}`}
      title={config.label}
    >
      <LevelIcon level={normalizedLevel} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default MembershipBadge;

