import React, { useState, useEffect } from 'react';
import { MembershipBadge } from './MembershipBadge';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { MembershipLevel } from '../types';
import { authApi } from '../services/apiService';
import { getImageUrl } from '../config/api';
import { BadgeViewModal } from './BadgeViewModal';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfileData {
  id: string;
  userName?: string;
  avatarUrl?: string;
  email?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  role: string;
  membershipLevel: MembershipLevel;
  isVip: boolean;
  currentPoints: number;
  experiencePoints: number;
  postsCount: number;
  repliesCount: number;
  likesReceived: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  badges: Array<{
    id: string;
    badgeId: string;
    badgeName: string;
    badgeIcon?: string;
    unlockedAt: string;
  }>;
}

// 單個勳章項目組件（用於在 map 中使用 useState）
const BadgeItem: React.FC<{
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
  iconPath: string | null;
  unlockedAt: string;
  onClick?: () => void;
}> = ({ badgeName, badgeIcon, iconPath, unlockedAt, onClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };


  return (
    <div 
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 text-center ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center mb-2 h-12 min-h-[3rem]">
        {iconPath && !imgError ? (
          <img
            src={iconPath}
            alt={badgeName}
            className="w-10 h-10 object-contain"
            onError={(e) => {
              console.error('BadgeItem: 圖片載入失敗:', iconPath, e);
              setImgError(true);
            }}
          />
        ) : (
          <div className="text-3xl">
            {/* 如果 badgeIcon 是 badgeId（以 badge_ 開頭）或太長（可能是 ID 文本），不顯示，只顯示 emoji */}
            {badgeIcon && !badgeIcon.startsWith('badge_') && !badgeIcon.startsWith('lady_') && badgeIcon.length < 10 && !badgeIcon.includes('@') 
              ? badgeIcon 
              : '🏅'}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-800">{badgeName}</p>
      <p className="text-xs text-gray-500 mt-1">{formatDate(unlockedAt)}</p>
    </div>
  );
};

// 單個成就項目組件（用於在 map 中使用 useState）
const AchievementItem: React.FC<{
  achievementId: string;
  achievementType: string;
  achievementName: string;
  achievementIcon: string;
  iconPath: string | null;
  unlockedAt: string;
}> = ({ achievementName, achievementIcon, iconPath, unlockedAt }) => {
  const [imgError, setImgError] = React.useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200 text-center">
      <div className="flex items-center justify-center mb-2 h-12 min-h-[3rem]">
        {iconPath && !imgError ? (
          <img
            src={iconPath}
            alt={achievementName}
            className="w-10 h-10 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-3xl">{achievementIcon || '🏆'}</div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-800">{achievementName}</p>
      <p className="text-xs text-gray-500 mt-1">{formatDate(unlockedAt)}</p>
    </div>
  );
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, isOpen, onClose }) => {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<{ badgeId: string; badgeName: string; badgeDescription?: string } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  // 監聽 email 驗證完成事件，如果當前查看的是自己的檔案，重新載入數據以顯示驗證徽章
  useEffect(() => {
    const handleEmailVerified = () => {
      // 如果是打開的 modal，重新載入數據（無論是否為當前用戶，因為可能是查看其他人的檔案）
      // 但實際上只有當前用戶的驗證狀態會變化，所以可以重新載入
      if (isOpen && userId) {
        loadUserData();
      }
    };
    
    window.addEventListener('user-email-verified', handleEmailVerified);
    return () => {
      window.removeEventListener('user-email-verified', handleEmailVerified);
    };
  }, [isOpen, userId]);

  const loadUserData = async () => {
    if (!userId || userId.trim() === '') {
      console.error('用戶ID為空，無法載入用戶資料');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.getUserProfile(userId);
      setUserData({
        id: data.id,
        userName: data.userName,
        avatarUrl: data.avatarUrl,
        email: data.email,
        phoneNumber: data.phoneNumber,
        emailVerified: data.emailVerified || false,
        phoneVerified: data.phoneVerified || false,
        role: data.role,
        membershipLevel: data.membershipLevel,
        isVip: data.isVip || false,
        currentPoints: data.currentPoints || 0,
        experiencePoints: data.experiencePoints || 0,
        postsCount: data.postsCount || 0,
        repliesCount: data.repliesCount || 0,
        likesReceived: data.likesReceived || 0,
        achievements: data.achievements || [],
        badges: data.badges || [],
      });
    } catch (error) {
      console.error('載入用戶資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
    
    return getImageUrl(`${basePath}/${mapping.category}/${mapping.fileName}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        ) : userData ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-green to-green-700 text-white p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">用戶資料</h2>
                <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {userData.avatarUrl ? (
                    <img
                      src={getImageUrl(userData.avatarUrl)}
                      alt={userData.userName || '用戶'}
                      className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {/* Email 驗證徽章（右下角） */}
                  {userData.emailVerified && (
                    <EmailVerifiedBadge size="md" className="" />
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{userData.userName || '匿名用戶'}</h3>
                    {userData.emailVerified && userData.phoneVerified && (
                      <VerifiedBadge size="md" className="text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {userData.role === 'admin' && <AdminBadge size="sm" />}
                    <MembershipBadge level={userData.membershipLevel} size="sm" />
                    {userData.isVip && <VipBadge size="sm" />}
                    <span className="text-sm opacity-90">
                      {userData.role === 'client' ? '品茶客' : userData.role === 'provider' ? '後宮佳麗' : '管理員'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* 統計數據 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-brand-green">{userData.postsCount}</p>
                  <p className="text-xs text-gray-600 mt-1">發茶帖數</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{userData.repliesCount}</p>
                  <p className="text-xs text-gray-600 mt-1">回覆數</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{userData.likesReceived}</p>
                  <p className="text-xs text-gray-600 mt-1">獲讚數</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{userData.experiencePoints}</p>
                  <p className="text-xs text-gray-600 mt-1">經驗值</p>
                </div>
              </div>

              {/* 英雄事蹟 */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  英雄事蹟
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {userData.postsCount > 0 || userData.repliesCount > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {userData.postsCount > 0 && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          發表了 {userData.postsCount} 篇茶帖
                        </li>
                      )}
                      {userData.repliesCount > 0 && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          回覆了 {userData.repliesCount} 次
                        </li>
                      )}
                      {userData.likesReceived > 0 && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          獲得了 {userData.likesReceived} 個讚
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">還沒有英雄事蹟</p>
                  )}
                </div>
              </div>

              {/* 成就 */}
              {userData.achievements.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                    成就
                </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {userData.achievements.map((achievement) => {
                      // 嘗試從 achievement 對象中獲取 achievementType，如果沒有則使用 id 作為 fallback
                      const achievementType = (achievement as any).achievementType || achievement.id;
                      const isProvider = userData.role === 'provider';
                      const iconPath = getAchievementIconPath(achievementType, isProvider);
                      
                      return (
                        <AchievementItem
                          key={achievement.id}
                          achievementId={achievement.id}
                          achievementType={achievementType}
                          achievementName={achievement.name}
                          achievementIcon={achievement.icon || '🏆'}
                          iconPath={iconPath}
                          unlockedAt={achievement.unlockedAt}
                        />
                      );
                    })}
                  </div>
                      </div>
              )}

              {/* 勳章 */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  勳章
                </h3>
                {userData.badges.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {userData.badges.map((badge, index) => {
                      // badge.badgeId 是用於構建圖片路徑的 ID（如 'badge_tea_king_seat'）
                      // badge.badgeIcon 也可能包含 badge ID，如果 badgeId 不存在，使用 badgeIcon
                      // badge.id 是 user_badges 表的記錄 ID（如 'badge_1767072784608_4fb0c6a7-'）
                      const badgeIdForIcon = badge.badgeId || badge.badgeIcon;
                      const isProvider = userData.role === 'provider';
                      // 支持品茶客勳章 (badge_*) 和後宮佳麗勳章 (lady_*)
                      const iconPath = badgeIdForIcon && (badgeIdForIcon.startsWith('badge_') || badgeIdForIcon.startsWith('lady_')) 
                        ? getBadgeIconPath(badgeIdForIcon, isProvider) 
                        : null;
                      
                      return (
                        <BadgeItem
                          key={`${badge.id}-${index}`}
                          badgeId={badge.id}
                          badgeName={badge.badgeName}
                          badgeIcon={badge.badgeIcon}
                          iconPath={iconPath}
                          unlockedAt={badge.unlockedAt}
                          onClick={() => {
                            setSelectedBadge({
                              badgeId: badgeIdForIcon || badge.badgeIcon || badge.id,
                              badgeName: badge.badgeName,
                              badgeDescription: undefined
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500">還沒有獲得任何勳章</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">無法載入用戶資料</p>
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

export default UserProfileModal;

