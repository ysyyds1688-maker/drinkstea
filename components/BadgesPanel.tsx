import React, { useState, useEffect, useRef } from 'react';
import { Badge, UserBadge } from '../types';
import { badgesApi, userStatsApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { BadgeViewModal } from './BadgeViewModal';

type BadgeCategory = 'all' | 'identity' | 'taste' | 'status' | 'royal' | 'quality' | 'experience' | 'client_relation' | 'certification';

const CLIENT_BADGE_CATEGORY_NAMES: Record<string, string> = {
  all: '全部勳章',
  identity: '身分稱號',
  taste: '品味風格',
  status: '座上地位',
  royal: '皇室御印',
};

const LADY_BADGE_CATEGORY_NAMES: Record<string, string> = {
  all: '全部勳章',
  quality: '服務品質',
  experience: '服務資歷',
  client_relation: '客戶關係',
  certification: '專業認證',
};

export const BadgesPanel: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<{ badgeId: string; badgeName: string; badgeDescription?: string } | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isProvider]);

  const loadData = async () => {
    if (loadingRef.current) return;
    
    // 先從緩存讀取數據
    const cacheKey = `badges_${isProvider ? 'provider' : 'client'}`;
    let hasValidCache = false;
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 緩存有效期 5 分鐘
        if (now - cacheTime < 5 * 60 * 1000 && cached.availableBadges && cached.userBadges !== undefined) {
          setAvailableBadges(cached.availableBadges);
          setUserBadges(cached.userBadges);
          setCurrentPoints(cached.currentPoints || 0);
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
      const [badgesData, userBadgesData, statsData] = await Promise.all([
        badgesApi.getAvailable().catch(err => {
          console.error('獲取可兌換勳章失敗:', err);
          return { badges: [] };
        }),
        badgesApi.getMy().catch(err => {
          console.error('獲取用戶勳章失敗:', err);
          return { badges: [] };
        }),
        userStatsApi.getMy().catch(err => {
          console.error('獲取用戶統計失敗:', err);
          return { stats: { currentPoints: 0 } };
        }),
      ]);
      const available = badgesData.badges || [];
      const owned = userBadgesData.badges || [];
      const points = statsData.stats?.currentPoints || 0;
      
      if (import.meta.env.DEV) {
        console.log('勳章資料載入:', { 
          available: available.length,
          owned: owned.length,
          points: points
        });
      }
      setAvailableBadges(available);
      setUserBadges(owned);
      setCurrentPoints(points);
      
      // 更新緩存
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          availableBadges: available,
          userBadges: owned,
          currentPoints: points,
          timestamp: Date.now()
        }));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (error) {
      console.error('載入勳章失敗:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handlePurchase = async (badgeId: string) => {
    if (!confirm('確定要兌換此勳章嗎？')) {
      return;
    }

    try {
      await badgesApi.purchase(badgeId);
      await loadData();
      alert('勳章兌換成功！');
    } catch (error: any) {
      alert(error.message || '兌換失敗');
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(b => b.badgeId === badgeId);
  };

  const filteredBadges = activeCategory === 'all'
    ? availableBadges
    : availableBadges.filter(b => b.category === activeCategory);

  // 根据 badge ID 或名称获取对应的 SVG 图标路径
  const getBadgeIconPath = (badgeId: string, badgeName: string): string => {
    // 映射 badge ID 到对应的 SVG 文件名（使用 badge ID 作为文件名）
    const fileName = `${badgeId}.svg`;
    // 如果 badgeId 以 lady_ 開頭，使用後宮佳麗路徑，否則使用品茶客路徑
    const basePath = (badgeId.startsWith('lady_') || isProvider)
      ? '/images/後宮佳麗/勳章'
      : '/images/品茶客/勳章';
    return `${basePath}/${fileName}`;
  };

  // BadgeIcon 组件：用于显示徽章图标，支持错误回退和点击查看
  const BadgeIcon: React.FC<{ 
    badgeId: string; 
    badgeName: string; 
    badgeDescription?: string;
    className?: string; 
    showFallback?: boolean;
    onClick?: () => void;
  }> = ({ 
    badgeId, 
    badgeName, 
    badgeDescription,
    className,
    showFallback = true,
    onClick
  }) => {
    const iconPath = getBadgeIconPath(badgeId, badgeName);
    const [imgError, setImgError] = React.useState(false);
    
    if (imgError && showFallback) {
      return (
        <svg 
          className={className}
          fill="currentColor" 
          viewBox="0 0 24 24"
          onClick={onClick}
          style={{ 
            width: '32px', 
            height: '32px',
            cursor: onClick ? 'pointer' : 'default' 
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    
    return (
      <img 
        src={iconPath} 
        alt={badgeName}
        className={className}
        loading="lazy"
        style={{ 
          width: '32px',
          height: '32px',
          objectFit: 'contain', 
          display: 'block',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
        onError={() => {
          setImgError(true);
        }}
      />
    );
  };

  // 未登入提示
  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-600 text-lg mb-2">請先登入以查看勳章</p>
        <p className="text-gray-500 text-sm">登入後即可查看您的勳章和可用積分</p>
      </div>
    );
  }

  if (loading && availableBadges.length === 0 && userBadges.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* 當前積分 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">當前可用積分</p>
            <p className="text-3xl font-bold text-blue-600">{currentPoints.toLocaleString()}</p>
          </div>
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-2">積分可用於兌換勳章</p>
      </div>

      {/* 已擁有勳章 */}
      {userBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4">已擁有勳章</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userBadges.map(badge => (
              <div
                key={badge.id}
                className="bg-white rounded-lg shadow p-4 text-center border-2 border-yellow-300"
              >
                <div className="mb-2 flex justify-center">
                  <div className="text-yellow-500">
                    <BadgeIcon 
                      badgeId={badge.badgeId} 
                      badgeName={badge.badgeName} 
                      onClick={() => setSelectedBadge({ badgeId: badge.badgeId, badgeName: badge.badgeName })}
                    />
                  </div>
                </div>
                <p className="font-medium text-sm">{badge.badgeName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(badge.unlockedAt).toLocaleDateString('zh-TW')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分類標籤頁 */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(isProvider ? LADY_BADGE_CATEGORY_NAMES : CLIENT_BADGE_CATEGORY_NAMES) as BadgeCategory[]).map(category => {
            const categoryName = (isProvider ? LADY_BADGE_CATEGORY_NAMES : CLIENT_BADGE_CATEGORY_NAMES)[category] || category;
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

      {/* 可兌換勳章 */}
      <div>
        <h3 className="text-lg font-bold mb-4">{(isProvider ? LADY_BADGE_CATEGORY_NAMES : CLIENT_BADGE_CATEGORY_NAMES)[activeCategory] || activeCategory}</h3>
        {filteredBadges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            此分類暫無勳章
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBadges.map(badge => {
            const owned = hasBadge(badge.id);
            const canAfford = currentPoints >= badge.pointsCost;

            return (
              <div
                key={badge.id}
                className={`bg-white rounded-lg shadow p-4 border-2 ${
                  owned ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="text-gray-700">
                        <BadgeIcon 
                          badgeId={badge.id} 
                          badgeName={badge.name}
                          badgeDescription={badge.description}
                          onClick={() => setSelectedBadge({ badgeId: badge.id, badgeName: badge.name, badgeDescription: badge.description })}
                        />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold">{badge.name}</h4>
                      {owned && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          已擁有
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {badge.pointsCost} 積分
                      </span>
                      {!owned && (
                        <button
                          onClick={() => handlePurchase(badge.id)}
                          disabled={!canAfford}
                          className={`px-4 py-1 rounded text-sm font-medium ${
                            canAfford
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? '兌換' : '積分不足'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 勳章查看彈窗 */}
      {selectedBadge && (
        <BadgeViewModal
          badgeId={selectedBadge.badgeId}
          badgeName={selectedBadge.badgeName}
          badgeDescription={selectedBadge.badgeDescription}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default BadgesPanel;

