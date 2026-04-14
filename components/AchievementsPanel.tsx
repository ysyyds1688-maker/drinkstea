import React, { useState, useEffect, useRef } from 'react';
import { Achievement } from '../types';
import { achievementsApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

// 獲取成就圖標路徑（支援品茶客和後宮佳麗）
const getAchievementIconPath = (achievementType: string, isProvider: boolean = false): string | null => {
  // 品茶客成就映射
  const clientAchievementIconMap: Record<string, { fileName: string; category: string }> = {
    'forum_first_post': { fileName: '初次獻帖.svg', category: '茶席互動' },
    'forum_active_writer': { fileName: '活躍作者.svg', category: '茶席互動' },
    'forum_popular_star': { fileName: '人望之星.svg', category: '茶席互動' },
    'forum_core_member': { fileName: '茶會核心.svg', category: '茶席互動' },
    'tea_first_booking': { fileName: '初嚐御茶.svg', category: '嚴選好茶' },
    'tea_regular_guest': { fileName: '御茶常客.svg', category: '嚴選好茶' },
    'tea_master_taster': { fileName: '品鑑達人.svg', category: '嚴選好茶' },
    'lady_first_booking': { fileName: '初次入席.svg', category: '特選魚市' },
    'lady_loyal_guest': { fileName: '專屬熟客.svg', category: '特選魚市' },
    'lady_royal_guest': { fileName: '茶王座上賓.svg', category: '特選魚市' },
    'loyalty_30_days': { fileName: '守席之人.svg', category: '茶客資歷' },
    'loyalty_180_days': { fileName: '老茶客.svg', category: '茶客資歷' },
    'loyalty_1_year': { fileName: '茶王舊識.svg', category: '茶客資歷' },
  };

  // 後宮佳麗成就映射
  const ladyAchievementIconMap: Record<string, { fileName: string; category: string }> = {
    // 服務資歷
    'lady_first_booking': { fileName: '初入宮廷.svg', category: '服務資歷' },
    'lady_newbie': { fileName: '服務新手.svg', category: '服務資歷' },
    'lady_stable': { fileName: '穩定服務.svg', category: '服務資歷' },
    'lady_veteran': { fileName: '資深服務.svg', category: '服務資歷' },
    'lady_master': { fileName: '服務大師.svg', category: '服務資歷' },
    'lady_veteran_achievement': { fileName: '資深佳麗.svg', category: '服務資歷' },
    'lady_gold_achievement': { fileName: '金牌佳麗.svg', category: '服務資歷' },
    
    // 服務品質
    'lady_first_good_review': { fileName: '初次好評.svg', category: '服務品質' },
    'lady_highly_rated': { fileName: '好評如潮.svg', category: '服務品質' },
    'lady_perfect': { fileName: '完美評價.svg', category: '服務品質' },
    'lady_quality_assured': { fileName: '品質保證.svg', category: '服務品質' },
    'lady_quality_service_achievement': { fileName: '優質服務.svg', category: '服務品質' },
    'lady_perfect_service_achievement': { fileName: '完美服務.svg', category: '服務品質' },
    
    // 客戶忠誠
    'lady_returning_client': { fileName: '回頭客.svg', category: '客戶忠誠' },
    'lady_regular_clients': { fileName: '熟客成群.svg', category: '客戶忠誠' },
    
    // 服務效率
    'lady_efficient': { fileName: '效率之星.svg', category: '服務效率' },
    'lady_punctual': { fileName: '準時達人.svg', category: '服務效率' },
    
    // 平台參與
    'lady_forum_newbie': { fileName: '論壇新人.svg', category: '平台參與' },
    'lady_active': { fileName: '活躍佳麗.svg', category: '平台參與' },
  };

  const mapping = isProvider 
    ? ladyAchievementIconMap[achievementType] 
    : clientAchievementIconMap[achievementType];
  
  if (!mapping) return null;

  // 後宮佳麗成就使用專用目錄，品茶客成就使用新目錄
  const basePath = isProvider 
    ? '/images/後宮佳麗/成就' 
    : '/images/品茶客/成就';
  
  return `${basePath}/${mapping.category}/${mapping.fileName}`;
};

// 成就圖標組件
const AchievementIcon: React.FC<{
  achievementType: string;
  achievementIcon: string; // emoji fallback
  className?: string;
  isProvider?: boolean;
}> = ({ achievementType, achievementIcon, className = '', isProvider = false }) => {
  const [imgError, setImgError] = useState(false);
  const iconPath = getAchievementIconPath(achievementType, isProvider);

  if (!iconPath || imgError) {
    // 如果沒有圖片路徑或圖片加載失敗，回退到 emoji
    return <div className={className}>{achievementIcon}</div>;
  }

  return (
    <img
      src={iconPath}
      alt={achievementIcon}
      className={className}
      style={{
        width: '3rem',
        height: '3rem',
        objectFit: 'contain',
        display: 'block'
      }}
      onError={() => setImgError(true)}
      loading="lazy"
      decoding="async"
    />
  );
};

interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: 'forum' | 'premium_tea' | 'lady_booking' | 'loyalty' | 'all' | 'service_tenure' | 'service_quality' | 'client_loyalty' | 'service_efficiency' | 'platform_engagement';
  pointsReward: number;
  experienceReward: number;
}

type AchievementCategory = 'all' | 'forum' | 'premium_tea' | 'lady_booking' | 'loyalty' | 'service_tenure' | 'service_quality' | 'client_loyalty' | 'service_efficiency' | 'platform_engagement';

const CLIENT_CATEGORY_NAMES: Record<string, string> = {
  all: '全部成就',
  forum: '茶席互動',
  premium_tea: '嚴選好茶',
  lady_booking: '特選魚市',
  loyalty: '茶客資歷',
};

const LADY_CATEGORY_NAMES: Record<string, string> = {
  all: '全部成就',
  service_tenure: '服務資歷',
  service_quality: '服務品質',
  client_loyalty: '客戶忠誠',
  service_efficiency: '服務效率',
  platform_engagement: '平台參與',
};

export const AchievementsPanel: React.FC = () => {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [definitions, setDefinitions] = useState<AchievementDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('all');
  const loadingRef = useRef(false);

  useEffect(() => {
    // 確保在用戶登入後才載入數據
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isProvider, user]);

  const loadData = async () => {
    if (loadingRef.current) return;
    
    // 先從緩存讀取數據
    const cacheKey = `achievements_${isProvider ? 'provider' : 'client'}`;
    let hasValidCache = false;
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 緩存有效期 5 分鐘
        if (now - cacheTime < 5 * 60 * 1000 && cached.achievements && cached.definitions) {
          setAchievements(cached.achievements);
          setDefinitions(cached.definitions);
          hasValidCache = true;
        }
      }
    } catch (e) {
      // 忽略緩存錯誤
    }
    
    try {
      loadingRef.current = true;
      if (!hasValidCache) {
        setLoading(true);
      }
      const [achievementsData, definitionsData] = await Promise.all([
        achievementsApi.getMy().catch(err => {
          console.error('獲取用戶成就失敗:', err);
          return { achievements: [] };
        }),
        achievementsApi.getDefinitions().catch(err => {
          console.error('獲取成就定義失敗:', err);
          return { definitions: [] };
        }),
      ]);
      const achievementsList = achievementsData.achievements || [];
      const definitionsList = definitionsData.definitions || [];
      setAchievements(achievementsList);
      setDefinitions(definitionsList);
      
      // 更新緩存
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          achievements: achievementsList,
          definitions: definitionsList,
          timestamp: Date.now()
        }));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (error) {
      console.error('載入成就失敗:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const isUnlocked = (type: string) => {
    return achievements.some(a => a.achievementType === type);
  };

  const getUnlockedAchievement = (type: string) => {
    return achievements.find(a => a.achievementType === type);
  };

  // 未登入提示
  if (!user) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-600 text-lg mb-2">請先登入以查看成就</p>
        <p className="text-gray-500 text-sm">登入後即可查看您的成就進度和已解鎖成就</p>
      </div>
    );
  }

  if (loading && achievements.length === 0 && definitions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 過濾定義：根據分類過濾
  const filteredDefinitions = activeCategory === 'all' 
    ? definitions 
    : definitions.filter(d => d.category === activeCategory);
  
  // 在「全部成就」分類時，也顯示已解鎖但不在定義列表中的成就（可能是舊成就或跨角色成就）
  const unlockedButNotInDefinitions = activeCategory === 'all' 
    ? achievements.filter(a => !definitions.some(d => d.type === a.achievementType))
    : [];

  // 只統計在當前定義列表中存在的已解鎖成就（避免統計不同角色的成就）
  const validUnlockedAchievements = achievements.filter(a => 
    definitions.some(d => d.type === a.achievementType)
  );
  const unlockedCount = validUnlockedAchievements.length;
  const totalCount = definitions.length;
  const categoryUnlockedCount = activeCategory === 'all'
    ? unlockedCount
    : validUnlockedAchievements.filter(a => {
        const def = definitions.find(d => d.type === a.achievementType);
        return def?.category === activeCategory;
      }).length;
  const categoryTotalCount = filteredDefinitions.length;
  
  // 調試：如果已解鎖成就數量不匹配，輸出詳細信息（僅在開發環境）
  // 注意：這不是錯誤，可能是用戶角色變更後的歷史數據
  if (process.env.NODE_ENV === 'development' && achievements.length !== validUnlockedAchievements.length) {
    const invalidAchievements = achievements.filter(a => 
      !definitions.some(d => d.type === a.achievementType)
    );
  }

  return (
    <div className="space-y-6">
      {/* 成就統計 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">成就進度</p>
            <p className="text-3xl font-bold text-blue-600">
              {unlockedCount} / {totalCount}
            </p>
            {activeCategory !== 'all' && (
              <p className="text-sm text-gray-500 mt-1">
                {(isProvider ? LADY_CATEGORY_NAMES : CLIENT_CATEGORY_NAMES)[activeCategory] || activeCategory}：{categoryUnlockedCount} / {categoryTotalCount}
              </p>
            )}
          </div>
          <div className="text-4xl">🏆</div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 分類標籤頁 */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(isProvider ? LADY_CATEGORY_NAMES : CLIENT_CATEGORY_NAMES) as AchievementCategory[]).map(category => {
            const categoryName = (isProvider ? LADY_CATEGORY_NAMES : CLIENT_CATEGORY_NAMES)[category] || category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeCategory === category
                    ? 'bg-brand-green text-white border-b-2 border-brand-green'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={activeCategory === category ? { backgroundColor: '#1a5f3f', borderColor: '#1a5f3f' } : {}}
              >
                {categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 成就列表 */}
      <div>
        <h3 className="text-lg font-bold mb-4">{(isProvider ? LADY_CATEGORY_NAMES : CLIENT_CATEGORY_NAMES)[activeCategory] || activeCategory}</h3>
        {(filteredDefinitions.length === 0 && unlockedButNotInDefinitions.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            此分類暫無成就
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 顯示定義中的成就 */}
            {filteredDefinitions.map(definition => {
            const unlocked = isUnlocked(definition.type);
            const unlockedAchievement = getUnlockedAchievement(definition.type);
            
            // 如果在當前分類中未解鎖但用戶有其他已解鎖成就不在定義列表中，也顯示（僅在「全部」分類時）
            // 這是為了確保所有已解鎖成就都能被看到

            return (
              <div
                key={definition.type}
                className={`bg-white rounded-lg shadow p-4 border-l-4 transition-all ${
                  unlocked
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-300 bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <AchievementIcon 
                        achievementType={definition.type}
                        achievementIcon={definition.icon}
                        className="text-3xl"
                        isProvider={isProvider}
                      />
                    </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-bold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {definition.name}
                      </h4>
                      {unlocked && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          已解鎖
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${unlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                      {definition.description}
                    </p>
                    <p className="text-sm text-blue-600 mt-2 font-medium">
                      💰 +{definition.pointsReward} 積分 / ⭐ +{definition.experienceReward} 經驗值
                    </p>
                    {unlocked && unlockedAchievement && (
                      <p className="text-xs text-gray-500 mt-2">
                        解鎖時間：{new Date(unlockedAchievement.unlockedAt).toLocaleDateString('zh-TW')}
                      </p>
                    )}
                    {!unlocked && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        尚未解鎖
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* 在「全部成就」分類時，顯示已解鎖但不在定義列表中的成就 */}
          {unlockedButNotInDefinitions.map(achievement => {
            return (
              <div
                key={achievement.id}
                className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400 bg-yellow-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AchievementIcon 
                      achievementType={achievement.achievementType}
                      achievementIcon={achievement.icon || '🏆'}
                      className="text-3xl"
                      isProvider={isProvider}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900">
                        {achievement.achievementName || achievement.achievementType}
                      </h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        已解鎖
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      解鎖時間：{new Date(achievement.unlockedAt).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPanel;

