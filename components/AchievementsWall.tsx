import React, { useState, useEffect, useRef } from 'react';
import { Achievement, UserBadge } from '../types';
import { achievementsApi, badgesApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { BadgeViewModal } from './BadgeViewModal';
import { AchievementViewModal } from './AchievementViewModal';

interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: 'forum' | 'premium_tea' | 'lady_booking' | 'loyalty' | 'all';
  pointsReward: number;
  experienceReward: number;
}

// 獲取勳章圖標路徑（根據 badgeId 判斷是品茶客還是後宮佳麗）
const getBadgeIconPath = (badgeId: string, isProvider: boolean = false): string => {
  const fileName = `${badgeId}.svg`;
  // 如果 badgeId 以 lady_ 開頭，使用後宮佳麗路徑，否則使用品茶客路徑
  const basePath = (badgeId.startsWith('lady_') || isProvider)
    ? '/images/後宮佳麗/勳章'
    : '/images/品茶客/勳章';
  return `${basePath}/${fileName}`;
};

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

export const AchievementsWall: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [definitions, setDefinitions] = useState<AchievementDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<{ badgeId: string; badgeName: string; badgeDescription?: string; unlockedAt?: string } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<{ achievementType: string; achievementName: string; achievementDescription?: string; unlockedAt?: string } | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isProvider]);

  const loadData = async () => {
    if (loadingRef.current) return;
    
    // 先從緩存讀取數據
    const cacheKey = `achievements_wall_${isProvider ? 'provider' : 'client'}`;
    let hasValidCache = false;
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 緩存有效期 5 分鐘
        if (now - cacheTime < 5 * 60 * 1000 && cached.achievements && cached.userBadges !== undefined && cached.definitions) {
          setAchievements(cached.achievements);
          setUserBadges(cached.userBadges);
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
      const [achievementsData, definitionsData, badgesData] = await Promise.all([
        achievementsApi.getMy().catch(err => {
          console.error('獲取用戶成就失敗:', err);
          return { achievements: [] };
        }),
        achievementsApi.getDefinitions().catch(err => {
          console.error('獲取成就定義失敗:', err);
          return { definitions: [] };
        }),
        badgesApi.getMy().catch(err => {
          console.error('獲取用戶勳章失敗:', err);
          return { badges: [] };
        }),
      ]);
      const achievementsList = achievementsData.achievements || [];
      const definitionsList = definitionsData.definitions || [];
      const badgesList = badgesData.badges || [];
      
      setAchievements(achievementsList);
      setDefinitions(definitionsList);
      setUserBadges(badgesList);
      
      // 更新緩存
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          achievements: achievementsList,
          definitions: definitionsList,
          userBadges: badgesList,
          timestamp: Date.now()
        }));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (error) {
      console.error('載入成就與勳章失敗:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // 獲取已解鎖的成就定義
  const getUnlockedAchievementDefinition = (type: string) => {
    return definitions.find(d => d.type === type);
  };

  // 未登入提示
  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-600 text-lg mb-2">請先登入以查看成就勳章牆</p>
        <p className="text-gray-500 text-sm">登入後即可查看您的所有成就和勳章</p>
      </div>
    );
  }

  if (loading && achievements.length === 0 && userBadges.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 animate-pulse">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalItems = achievements.length + userBadges.length;


  return (
    <div className="space-y-8">
      {/* 統計信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
        <div className="flex flex-wrap gap-6 justify-center text-center">
          <div>
            <div className="text-2xl font-bold text-brand-green">{achievements.length}</div>
            <div className="text-sm text-gray-600">成就</div>
          </div>
          <div className="w-px bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-brand-green">{userBadges.length}</div>
            <div className="text-sm text-gray-600">勳章</div>
          </div>
          <div className="w-px bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-brand-green">{totalItems}</div>
            <div className="text-sm text-gray-600">總計</div>
          </div>
        </div>
      </div>

      {/* 成就牆 */}
      <div className="space-y-4">
        {/* 標題在背景圖上方 */}
        <h2 className="text-xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
          <span className="text-2xl">📝</span>
          <span>成就牆</span>
        </h2>
        
        {/* 背景圖容器 - 響應式設計，保留原圖白底，兩張圖片上下拼接 */}
        <div 
          className="rounded-lg border-2 border-amber-200 shadow-lg relative bg-white w-full mx-auto overflow-hidden"
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            minHeight: 'clamp(280px, 40vw, 600px)',
            maxWidth: '100%'
          }}
        >
          {/* 背景層：使用兩張圖片上下拼接，如果只有一張圖片則重複使用 */}
          {/* 上半部分背景圖 */}
          <div 
            className="absolute top-0 left-0 right-0 z-0"
            style={{
              height: '50%',
              backgroundImage: isProvider 
                ? 'url(/images/後宮佳麗/成就/成就牆背景.jpeg)'
                : 'url(/images/品茶客/成就/成就牆背景.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'white'
            }}
          />
          {/* 下半部分背景圖 - 如果有多張圖片可以替換不同的圖片 */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-0"
            style={{
              height: '50%',
              backgroundImage: isProvider 
                ? 'url(/images/後宮佳麗/成就/成就牆背景.jpeg)'
                : 'url(/images/品茶客/成就/成就牆背景.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'white'
            }}
          />
          {/* 網格對齊層 - 用於精確對齊背景圖的格子 */}
          <div 
            className="absolute inset-0 z-10"
            style={{
              paddingTop: 'clamp(4.2%, 4.7%, 5.2%)',
              paddingBottom: 'clamp(4.2%, 4.7%, 5.2%)',
              paddingLeft: 'clamp(5.2%, 5.7%, 6.2%)',
              paddingRight: 'clamp(4.8%, 5.3%, 5.8%)',
              boxSizing: 'border-box'
            }}
          >
            {/* 成就網格 - 對齊背景圖的格子 */}
            {achievements.length > 0 ? (
              <div 
                className="w-full h-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gridTemplateRows: 'repeat(4, 1fr)',
                  gap: '0',
                  alignItems: 'stretch',
                  justifyItems: 'stretch'
                }}
              >
                {achievements
                  .sort((a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime())
                  .map((achievement) => {
                    const definition = getUnlockedAchievementDefinition(achievement.achievementType);
                    if (!definition) return null;

                    const iconPath = getAchievementIconPath(achievement.achievementType, isProvider);

                    return (
                      <AchievementWallItem
                        key={achievement.id}
                        achievementId={achievement.id}
                        achievementType={achievement.achievementType}
                        achievementName={definition.name}
                        achievementIcon={definition.icon}
                        achievementDescription={definition.description}
                        unlockedAt={achievement.unlockedAt}
                        iconPath={iconPath}
                        onClick={() => {
                          setSelectedAchievement({
                            achievementType: achievement.achievementType,
                            achievementName: definition.name,
                            achievementDescription: definition.description,
                            unlockedAt: achievement.unlockedAt
                          });
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 relative z-10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-600">還沒有獲得任何成就</p>
                <p className="text-sm text-gray-500 mt-2">完成任務、參與活動來解鎖成就吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 勳章牆 */}
      <div className="space-y-4">
        {/* 標題在背景圖上方 */}
        <h2 className="text-xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
          <span className="text-2xl">🏅</span>
          <span>勳章牆</span>
        </h2>
        
        {/* 背景圖容器 - 響應式設計 */}
        <div 
          className="rounded-lg border-2 border-blue-200 shadow-lg relative bg-white w-full mx-auto"
          style={{
            backgroundImage: isProvider 
              ? 'url(/images/後宮佳麗/勳章/勳章牆背景.jpeg)'
              : 'url(/images/品茶客/勳章/勳章牆背景.jpeg)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            aspectRatio: '1 / 1',
            minHeight: 'clamp(280px, 40vw, 600px)',
            maxWidth: '100%'
          }}
        >
          {/* 網格對齊層 - 用於精確對齊背景圖的格子 */}
          <div 
            className="absolute inset-0"
            style={{
              paddingTop: 'clamp(4.2%, 4.7%, 5.2%)',
              paddingBottom: 'clamp(4.2%, 4.7%, 5.2%)',
              paddingLeft: 'clamp(5.2%, 5.7%, 6.2%)',
              paddingRight: 'clamp(4.8%, 5.3%, 5.8%)',
              boxSizing: 'border-box'
            }}
          >
            {/* 勳章網格 - 對齊背景圖的格子，從左上角開始，響應式調整 */}
            {userBadges.length > 0 ? (
              <div 
                className="w-full h-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gridTemplateRows: 'repeat(4, 1fr)',
                  gap: '0',
                  alignItems: 'stretch',
                  justifyItems: 'stretch'
                }}
              >
                {userBadges
                  .sort((a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime())
                  .map((badge, index) => {
                    const badgeIdForIcon = badge.badgeId || badge.badgeIcon;
                    // 支持品茶客勳章 (badge_*) 和後宮佳麗勳章 (lady_*)
                    const iconPath = badgeIdForIcon && (badgeIdForIcon.startsWith('badge_') || badgeIdForIcon.startsWith('lady_')) 
                      ? getBadgeIconPath(badgeIdForIcon) 
                      : null;

                    return (
                      <BadgeWallItem
                        key={badge.id}
                        badgeId={badgeIdForIcon || badge.badgeIcon || badge.id}
                        badgeName={badge.badgeName}
                        badgeIcon={badge.badgeIcon}
                        iconPath={iconPath}
                        unlockedAt={badge.unlockedAt}
                        onClick={() => {
                          setSelectedBadge({
                            badgeId: badgeIdForIcon || badge.badgeIcon || badge.id,
                            badgeName: badge.badgeName,
                            badgeDescription: undefined,
                            unlockedAt: badge.unlockedAt
                          });
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 relative z-10">
                <div className="text-4xl mb-3">🎖️</div>
                <p className="text-gray-600">還沒有獲得任何勳章</p>
                <p className="text-sm text-gray-500 mt-2">使用積分兌換勳章來展示您的身份吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 勳章查看彈窗 */}
      {selectedBadge && (
        <BadgeViewModal
          badgeId={selectedBadge.badgeId}
          badgeName={selectedBadge.badgeName}
          badgeDescription={selectedBadge.badgeDescription}
          unlockedAt={selectedBadge.unlockedAt}
          onClose={() => setSelectedBadge(null)}
        />
      )}

      {/* 成就查看彈窗 */}
      {selectedAchievement && (
        <AchievementViewModal
          achievementType={selectedAchievement.achievementType}
          achievementName={selectedAchievement.achievementName}
          achievementDescription={selectedAchievement.achievementDescription}
          unlockedAt={selectedAchievement.unlockedAt}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
};

// 單個成就牆項目組件
const AchievementWallItem: React.FC<{
  achievementId: string;
  achievementType: string;
  achievementName: string;
  achievementIcon: string;
  achievementDescription: string;
  unlockedAt: string;
  iconPath: string | null;
  onClick?: () => void;
}> = ({ achievementName, achievementIcon, iconPath, onClick }) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`bg-transparent transition-all hover:bg-white hover:bg-opacity-20 h-full w-full ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={onClick}
      title={achievementName}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6px, 2%, 10px)'
      }}
    >
      {iconPath && !imgError ? (
        <img
          src={iconPath}
          alt={achievementName}
          className="object-contain drop-shadow-lg"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            margin: 'auto'
          }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="drop-shadow-lg"
          style={{
            fontSize: 'clamp(1.75rem, 2.5rem, 3.5rem)',
            lineHeight: '1',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {achievementIcon}
        </div>
      )}
    </div>
  );
};

// 單個勳章牆項目組件
const BadgeWallItem: React.FC<{
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
  iconPath: string | null;
  unlockedAt: string;
  onClick?: () => void;
}> = ({ badgeName, badgeIcon, iconPath, unlockedAt, onClick }) => {
  const [imgError, setImgError] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div
      className={`bg-transparent transition-all hover:bg-white hover:bg-opacity-20 h-full w-full ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={onClick}
      title={badgeName}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6px, 2%, 10px)'
      }}
    >
      {/* 圖標區域 - 完全置中 */}
      {iconPath && !imgError ? (
        <img
          src={iconPath}
          alt={badgeName}
          className="object-contain drop-shadow-lg"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            margin: 'auto'
          }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div 
          className="drop-shadow-lg"
          style={{
            fontSize: 'clamp(1.75rem, 2.5rem, 3.5rem)',
            lineHeight: '1',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {badgeIcon && !badgeIcon.startsWith('badge_') && badgeIcon.length < 10 && !badgeIcon.includes('@') 
            ? badgeIcon 
            : '🏅'}
        </div>
      )}
    </div>
  );
};

export default AchievementsWall;

