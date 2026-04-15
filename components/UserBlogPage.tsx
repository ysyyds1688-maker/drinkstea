import React, { useState, useEffect } from 'react';
import { authApi, reviewsApi, forumApi } from '../services/apiService';
import { getImageUrl } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { MembershipBadge } from './MembershipBadge';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerificationBadges } from './VerificationBadges';
import { UserBadges } from './UserBadges';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { ReviewCard } from './ReviewCard';
import { ForumPost } from '../types';
import { formatText } from '../utils/textFormatter';

// 根據 badge ID 獲取對應的 SVG 圖標路徑（根據 badgeId 判斷是品茶客還是後宮佳麗）
const getBadgeIconPath = (badgeId: string, isProvider: boolean = false): string => {
  const fileName = `${badgeId}.svg`;
  // 如果 badgeId 以 lady_ 開頭，使用後宮佳麗路徑，否則使用品茶客路徑
  const basePath = (badgeId.startsWith('lady_') || isProvider)
    ? '/images/後宮佳麗/勳章'
    : '/images/品茶客/勳章';
  return getImageUrl(`${basePath}/${fileName}`);
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
    'lady_first_regular': { fileName: '初次熟客.svg', category: '客戶忠誠' },
    'lady_regular_client': { fileName: '熟客佳麗.svg', category: '客戶忠誠' },
    'lady_loyalty_master': { fileName: '忠誠大師.svg', category: '客戶忠誠' },
    
    // 平台參與
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
  
  return getImageUrl(`${basePath}/${mapping.category}/${mapping.fileName}`);
};

interface UserBlogPageProps {
  userId: string;
  onBack: () => void;
}

export const UserBlogPage: React.FC<UserBlogPageProps> = ({ userId, onBack }) => {
  const { user: currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'posts'>('overview');

  useEffect(() => {
    // 只有在 userId 有效時才載入數據
    if (userId && userId.trim() !== '') {
      loadUserData();
    } else {
      console.warn('UserBlogPage: userId 為空，無法載入用戶資料', { userId });
      setLoading(false);
    }
  }, [userId]);

  // 監聽 email 驗證完成事件，如果是當前用戶的檔案，重新載入數據以顯示驗證徽章
  useEffect(() => {
    const handleEmailVerified = (event: CustomEvent) => {
      // 如果是當前用戶的公開檔案，重新載入數據
      if (currentUser?.id === userId) {
        loadUserData();
      }
    };
    
    window.addEventListener('user-email-verified', handleEmailVerified as EventListener);
    return () => {
      window.removeEventListener('user-email-verified', handleEmailVerified as EventListener);
    };
  }, [userId, currentUser?.id]);

  const loadUserData = async () => {
    if (!userId || userId.trim() === '') {
      console.error('用戶ID為空，無法載入用戶資料', { userId, userIdType: typeof userId });
      setLoading(false);
      return;
    }

    const trimmedUserId = userId.trim();
    
    if (import.meta.env.DEV) {
      console.log('[UserBlogPage] 開始載入用戶資料', { userId: trimmedUserId });
    }

    try {
      setLoading(true);
      const data = await authApi.getUserProfile(trimmedUserId);
      
      if (import.meta.env.DEV) {
        console.log('[UserBlogPage] 用戶資料載入成功', { userId: trimmedUserId, userData: data });
      }
      
      setUserData(data);

      // 載入用戶的評論
      try {
        const reviewsData = await reviewsApi.getByUserId(trimmedUserId);
        setReviews(reviewsData.reviews || []);
        setAverageRating(reviewsData.averageRating || 0);
        setTotalReviews(reviewsData.total || 0);
      } catch (error) {
        console.error('載入用戶評論失敗:', error);
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
      }

      // 載入用戶的論壇帖子
      try {
        const postsData = await forumApi.getPostsByUserId(trimmedUserId);
        setPosts(postsData.posts || []);
      } catch (error) {
        console.error('載入用戶帖子失敗:', error);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('載入用戶資料失敗:', error, { userId: trimmedUserId });
      
      // 如果是 404 錯誤或用戶不存在，設置 userData 為 null 以觸發"用戶不存在"的顯示
      if (error.message?.includes('404') || 
          error.message?.includes('Route not found') || 
          error.message?.includes('用戶不存在') ||
          error.message?.includes('用戶ID不能為空')) {
        setUserData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-20">
            <p className="text-gray-500">用戶不存在</p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按鈕 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </button>

        {/* 用戶頭像和基本信息 - 個人形象展示 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 relative">
              <div className="relative">
                <img
                  src={userData.avatarUrl || getImageUrl('/images/default-avatar.svg')}
                  alt={userData.userName || '用戶'}
                  className={`w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 shadow-xl ring-4 ${
                    userData.emailVerified && userData.phoneVerified
                      ? 'border-blue-500 ring-blue-500/20'
                      : 'border-white ring-brand-green/10'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getImageUrl('/images/default-avatar.svg');
                  }}
                />
                {/* Email 驗證徽章（右下角） */}
                {userData.emailVerified && (
                  <EmailVerifiedBadge 
                    size="md" 
                    className=""
                  />
                )}
                {/* VIP 徽章（左下角，如果有Email驗證徽章；否則右下角） */}
                {userData.isVip && (
                  <div className={`absolute ${userData.emailVerified ? 'bottom-0 left-0 right-auto' : 'bottom-0 right-0'} w-6 h-6 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center shadow-lg z-10`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {userData.userName || '未設置暱稱'}
                </h1>
                {userData.role === 'admin' && <AdminBadge size="sm" />}
                {userData.isVip && <VipBadge size="sm" />}
                {userData.membershipLevel && (
                  <MembershipBadge level={userData.membershipLevel} size="md" />
                )}
                {userData.verificationBadges && userData.verificationBadges.length > 0 && (
                  <VerificationBadges badges={userData.verificationBadges} size="sm" />
                )}
                {((userData.warningBadge || userData.noShowBadge || userData.violationLevel === 4) ||
                  (userData.providerWarningBadge || userData.providerFrozen || userData.providerViolationLevel === 4)) && (
                  <UserBadges 
                    user={{
                      id: userData.id,
                      role: userData.role,
                      warningBadge: userData.warningBadge,
                      noShowBadge: userData.noShowBadge,
                      violationLevel: userData.violationLevel,
                      providerWarningBadge: userData.providerWarningBadge,
                      providerFrozen: userData.providerFrozen,
                      providerViolationLevel: userData.providerViolationLevel,
                    } as any}
                    size="md"
                  />
                )}
              </div>
              <p className="text-gray-600 mb-2 text-lg">
                {userData.role === 'provider' ? '後宮佳麗' : userData.role === 'client' ? '品茶客' : '管理員'}
              </p>
              
              {/* 評分顯示（如果有） */}
              {averageRating > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4 bg-yellow-50 rounded-lg px-4 py-2 inline-flex">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({totalReviews} 則評論)</span>
                </div>
              )}

              {/* 統計信息卡片（積分/經驗值暫時隱藏） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{userData.postsCount || 0}</div>
                  <div className="text-xs text-gray-500 font-medium">發文數</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">{userData.repliesCount || 0}</div>
                  <div className="text-xs text-gray-500 font-medium">回覆數</div>
                </div>
              </div>

              {/* 成就和勳章預覽 */}
              {(userData.achievements?.length > 0 || userData.badges?.length > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                    {userData.badges?.slice(0, 6).map((badge: any) => {
                      const isProvider = userData.role === 'provider';
                      const badgeIdForIcon = badge.badgeId || badge.badgeIcon;
                      const iconPath = badgeIdForIcon && (badgeIdForIcon.startsWith('badge_') || badgeIdForIcon.startsWith('lady_')) 
                        ? getBadgeIconPath(badgeIdForIcon, isProvider) 
                        : null;
                      
                      return (
                        <div key={badge.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                          {iconPath ? (
                            <img
                              src={getImageUrl(iconPath)}
                              alt={badge.badgeName}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-lg">
                              {badge.badgeIcon && !badge.badgeIcon.startsWith('badge_') && !badge.badgeIcon.startsWith('lady_') && badge.badgeIcon.length < 10 && !badge.badgeIcon.includes('@')
                                ? badge.badgeIcon 
                                : '🏅'}
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-700">{badge.badgeName}</span>
                        </div>
                      );
                    })}
                    {(userData.badges?.length > 6 || userData.achievements?.length > 0) && (
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="text-xs text-brand-green hover:underline font-medium"
                      >
                        查看更多...
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab 導航 */}
        <div className="bg-white rounded-2xl shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-brand-green border-b-2 border-brand-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              總覽
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-brand-green border-b-2 border-brand-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              評論 {totalReviews > 0 && `(${totalReviews})`}
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-brand-green border-b-2 border-brand-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              茶帖 {posts.length > 0 && `(${posts.length})`}
            </button>
          </div>
        </div>

        {/* Tab 內容 */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">個人檔案</h2>
              
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">角色</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userData.role === 'provider' ? '後宮佳麗' : userData.role === 'client' ? '品茶客' : '管理員'}
                  </p>
                </div>
                {userData.membershipLevel && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">會員等級</p>
                    <div className="flex items-center gap-2">
                      <MembershipBadge level={userData.membershipLevel} size="sm" />
                    </div>
                  </div>
                )}
                {userData.createdAt && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">註冊時間</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(userData.createdAt).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                )}
                {averageRating > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-2">平均評分</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">({totalReviews})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 成就展示 */}
              {userData.achievements && userData.achievements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">成就</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userData.achievements.slice(0, 8).map((achievement: any) => {
                      const isProvider = userData.role === 'provider';
                      const iconPath = getAchievementIconPath(achievement.achievementType, isProvider);
                      
                      return (
                        <div key={achievement.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 text-center">
                          <div className="flex items-center justify-center mb-2 h-12 min-h-[3rem]">
                            {iconPath ? (
                              <img
                                src={getImageUrl(iconPath)}
                                alt={achievement.name}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // 顯示 fallback emoji
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <div className="text-3xl" style={{ display: iconPath ? 'none' : 'block' }}>
                              {achievement.icon || '🏆'}
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{achievement.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString('zh-TW') : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 勳章展示 */}
              {userData.badges && userData.badges.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">勳章</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {userData.badges.map((badge: any) => {
                      const isProvider = userData.role === 'provider';
                      // badge.badgeId 或 badge.badgeIcon 可能包含 badge ID
                      const badgeIdForIcon = badge.badgeId || badge.badgeIcon;
                      const iconPath = badgeIdForIcon && (badgeIdForIcon.startsWith('badge_') || badgeIdForIcon.startsWith('lady_')) 
                        ? getBadgeIconPath(badgeIdForIcon, isProvider) 
                        : null;
                      
                      return (
                        <div key={badge.id} className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-center mb-2 h-16 min-h-[4rem]">
                            {iconPath ? (
                              <img
                                src={getImageUrl(iconPath)}
                                alt={badge.badgeName}
                                className="w-16 h-16 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // 顯示 fallback emoji
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <div className="text-4xl" style={{ display: iconPath ? 'none' : 'block' }}>
                              {badge.badgeIcon && !badge.badgeIcon.startsWith('badge_') && !badge.badgeIcon.startsWith('lady_') && badge.badgeIcon.length < 10 && !badge.badgeIcon.includes('@')
                                ? badge.badgeIcon 
                                : '🏅'}
                            </div>
                          </div>
                          <p className="text-xs font-medium text-gray-700">{badge.badgeName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    canInteract={!!currentUser}
                    onLikeChange={() => loadUserData()}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  尚無評論
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // 直接觸發導航事件，App.tsx 會處理視圖切換和設置 postId
                      window.dispatchEvent(new CustomEvent('navigate-to-forum-post', {
                        detail: { postId: post.id }
                      }));
                    }}
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{formatText(post.content)}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.repliesCount || 0} 回覆</span>
                      <span>{post.likesCount || 0} 讚</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('zh-TW')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  尚無茶帖
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

