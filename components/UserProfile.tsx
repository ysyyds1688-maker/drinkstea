import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Profile } from '../types';
import { favoritesApi, authApi, adminApi } from '../services/apiService';
import { getImageUrl } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { ProviderEditor } from './ProviderEditor';
import { MembershipBadge } from './MembershipBadge';
import { VerificationBadges } from './VerificationBadges';
import { SubscriptionPanel } from './SubscriptionPanel';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { UserBadges } from './UserBadges';
import { PointsDisplay } from './PointsDisplay';
import { DailyTasksPanel } from './DailyTasksPanel';
import { PointsGuideModal } from './PointsGuideModal';
import { BadgesPanel } from './BadgesPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { AchievementsWall } from './AchievementsWall';
import { BookingList } from './BookingList';
import { CalendarManager } from './CalendarManager';
import { BookingCalendar } from './BookingCalendar';
import { MessageList } from './MessageList';
import { NotificationBox } from './NotificationBox';
import { NotificationCenterPanel } from './NotificationCenterPanel';
import { userStatsApi, tasksApi, subscriptionsApi, reviewsApi, notificationsApi } from '../services/apiService';
import { UserStatsResponse, MembershipLevel, MembershipBenefits, AnyMembershipLevel, getLevelName } from '../types';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { getMaxReviewCount, getPremiumTeaBookingLimit, getMaxFavoriteCount, getMaxGalleryPhotoCount } from '../utils/membershipBenefits';
import { API_ENDPOINTS } from '../config/api';

interface UserProfileProps {
  onProfileClick?: (profile: Profile) => void;
}

// 權益key到中文標籤的映射
const getBenefitLabel = (benefitKey: string): string => {
  const labelMap: Record<string, string> = {
    'premium_tea_booking': '嚴選好茶約會次數（月）',
    'featured_tea_booking': '特選魚市約會次數',
    'premium_tea_reviews': '嚴選好茶評論查看',
    'featured_tea_reviews': '特選魚市評論查看',
    'premium_tea_favorites': '嚴選好茶收藏夾',
    'featured_tea_favorites': '特選魚市收藏夾',
    'premium_tea_gallery': '嚴選好茶寫真照片',
    'premium_tea_portfolio': '嚴選好茶作品集',
  };
  return labelMap[benefitKey] || benefitKey;
};

// 權益說明映射 - 根據 PointsDisplay.tsx 中的完整權益列表
const getBenefitDescription = (benefit: string, userRole?: 'provider' | 'client' | 'admin'): string => {
  // 後宮佳麗專屬權益說明
  if (userRole === 'provider') {
    const ladyDescriptions: Record<string, string> = {
      '基本功能': '【基礎功能權益】可以上架個人資料、管理預約、查看基本統計數據。',
      '上架管理': '【上架管理權益】可以上架和管理多個個人資料，包括編輯資料、更新照片、管理價格方案等。',
      '優先客服': '',
      '更多展示位': '',
      '專屬標籤': '【身份標識權益】在個人資料中顯示專屬的會員等級標識。',
      '數據分析': '',
      '專屬徽章': '【榮譽徽章權益】獲得專屬的會員等級徽章，顯示在個人資料中。',
      '優先推薦': '',
      '專屬服務': '',
      '御前特權': '',
      '專屬顧問': '',
      '金牌特權': '',
      '優先曝光': '',
      '鑽石推薦': '',
      '獨家展示': '',
      '皇家特權': '',
      '尊貴服務': '',
      '皇后級特權': '',
      '至尊服務': '',
      '無限權限': ''
    };
    const description = ladyDescriptions[benefit];
    if (description !== undefined) {
      return description; // 返回說明（可能為空字串）
    }
  }

  // 品茶客權益說明（原有邏輯）
  const descriptions: Record<string, string> = {
    // 基礎權益
    '基本功能': '【基礎功能權益】可以瀏覽嚴選好茶和特選魚市的基本資訊。',
    
    '解鎖部分內容': '【內容解鎖權益】可以查看更詳細的個人資料內容和評論。',
    
    '更多內容': '【內容擴展權益】嚴選好茶的高級茶相簿會依照會員等級解鎖：茶客可看1張、入門茶士可看2張、御前茶士可看3張、御用茶官以上全部解鎖。',
    
    '專屬標籤': '【身份標識權益】在個人資料和論壇中顯示專屬的會員等級標識。',
    
    '專屬徽章': '【榮譽徽章權益】獲得專屬的會員等級徽章，顯示在個人資料中。',
    
    // 高級權益（僅成就標識，無實際功能）
    '御前特權': '',
    '心腹特權': '',
    '茶王親選': '',
    '獨家內容': '',
    '金印特權': '',
    '尊貴服務': '',
    '國師級特權': '',
    '至尊服務': '',
    '無限權限': ''
  };
  
  // 數值型權益的說明（使用中文標籤）
  const numericBenefitDescriptions: Record<string, string> = {
    'premium_tea_booking': '【嚴選好茶約會次數權益】每個帳號每月最多3次，每月會刷新次數。購買VIP後，根據會員等級可增加次數上限：茶客和入門茶士為3次，御前茶士（3級）為4次，御用茶官（4級）為5次，之後每級+1次。未購買VIP即使升級也不增加次數。',
    'featured_tea_booking': '【特選魚市約會次數權益】無限制，但需遵守平台規則。',
    'premium_tea_reviews': '【嚴選好茶評論查看權益】根據會員等級可查看不同數量的評論：茶客（1級）1則，入門茶士（2級）2則，御前茶士（3級）3則，御用茶官（4級）4則，茶王近侍（5級）5則，御前總茶官（6級）6則。購買VIP可查看全部評論。',
    'featured_tea_reviews': '【特選魚市評論查看權益】根據會員等級可查看不同數量的評論：茶客（1級）1則，入門茶士（2級）2則，御前茶士（3級）3則，御用茶官（4級）4則，茶王近侍（5級）5則，御前總茶官（6級）10則。購買VIP可查看全部評論。',
    'premium_tea_favorites': '【嚴選好茶收藏夾權益】預設為2位。升級到御用茶官（4級）開始依序增加：4級3位，5級4位，6級5位，之後每級+1位。如果購買VIP但在御用茶官等級前，預設數量為5位。購買VIP且達到御用茶官等級或以上，收藏夾無限制。',
    'featured_tea_favorites': '【特選魚市收藏夾權益】預設為2位。升級到御用茶官（4級）開始依序增加：4級3位，5級4位，6級5位，之後每級+1位。如果購買VIP但在御用茶官等級前，預設數量為5位。購買VIP且達到御用茶官等級或以上，收藏夾無限制。',
    'premium_tea_gallery': '【嚴選好茶寫真照片權益】非VIP用戶：茶客（1級）無法查看，入門茶士（2級）1張，御前茶士（3級）2張，御用茶官（4級）2張，茶王近侍（5級）3張，御前總茶官（6級）3張，茶王心腹（7級）含之後全部解鎖。VIP用戶：購買VIP後，入門茶士（2級）可查看2張，御前茶士（3級）可查看3張，御用茶官（4級）含之後全部解鎖。',
    'premium_tea_portfolio': '【嚴選好茶作品集權益】非VIP用戶：茶客（1級）無法查看，入門茶士（2級）1張，御前茶士（3級）2張，御用茶官（4級）2張，茶王近侍（5級）3張，御前總茶官（6級）3張，茶王心腹（7級）含之後全部解鎖。VIP用戶：購買VIP後，入門茶士（2級）可查看2張，御前茶士（3級）可查看3張，御用茶官（4級）含之後全部解鎖。',
  };
  
  // 先檢查數值型權益
  if (numericBenefitDescriptions[benefit]) {
    return numericBenefitDescriptions[benefit];
  }
  
  // 如果找不到對應說明或為空字串（僅成就標識），返回空字串
  const description = descriptions[benefit];
  if (description === undefined) {
    // 如果完全沒有定義，返回空字串（不顯示說明）
    return '';
  }
  
  return description; // 返回說明（可能為空字串）
};

// 獲取所有權益說明列表（用於總覽顯示）
const getBenefitDescriptions = (userRole?: 'provider' | 'client' | 'admin'): Array<{ benefit: string; description: string }> => {
  // 後宮佳麗權益列表
  if (userRole === 'provider') {
    const allBenefits = [
      '基本功能',
      '上架管理',
      '優先客服',
      '更多展示位',
      '專屬標籤',
      '數據分析',
      '專屬徽章',
      '優先推薦',
      '專屬服務',
      '御前特權',
      '專屬顧問',
      '金牌特權',
      '優先曝光',
      '鑽石推薦',
      '獨家展示',
      '皇家特權',
      '尊貴服務',
      '皇后級特權',
      '至尊服務',
      '無限權限'
    ];
    return allBenefits.map(benefit => ({
      benefit,
      description: getBenefitDescription(benefit, userRole)
    }));
  }

  // 品茶客權益列表（原有邏輯）
  // 按照等級出現順序排列
  const allBenefits = [
    '基本功能',
    '解鎖部分內容',
    '更多內容',
    '專屬標籤',
    '專屬徽章',
    '御前特權',
    '心腹特權',
    '茶王親選',
    '獨家內容',
    '金印特權',
    '尊貴服務',
    '國師級特權',
    '至尊服務',
    '無限權限'
  ];
  
  return allBenefits.map(benefit => ({
    benefit,
    description: getBenefitDescription(benefit)
  }));
};

// Provider 上架管理组件
const ProviderListingManagement: React.FC = () => {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.role === 'provider') {
      loadMyProfile();
    }
  }, [user]);

  const loadMyProfile = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        console.error('用戶未登入或沒有用戶ID');
        return;
      }

      const profiles = await adminApi.profiles.getAll();
      const myProfile = profiles.find(p => p.userId === user.id);
      
      if (myProfile) {
        setMyProfile(myProfile);
      } else {
        setMyProfile(null);
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return <div className="text-center py-20">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {isEditing ? (
        <ProviderEditor
          initialData={myProfile || undefined}
          onSave={async (profileData) => {
            try {
              if (!user?.id) {
                alert('請先登入');
                return;
              }

              const profileToSave = {
                ...profileData,
                userId: user.id,
              };

              if (myProfile) {
                await adminApi.profiles.update(myProfile.id, profileToSave);
              } else {
                const newProfile = await adminApi.profiles.create({
                  ...profileToSave,
                  id: `profile-${Date.now()}`,
                } as Profile);
                setMyProfile(newProfile);
              }
              setIsEditing(false);
              await loadMyProfile();
              alert('保存成功！您的資料已上架到「特選鮮魚」頁面');
            } catch (error: any) {
              console.error('保存失敗:', error);
              alert('保存失敗: ' + (error.message || '未知錯誤'));
            }
          }}
          onCancel={() => {
            setIsEditing(false);
          }}
        />
      ) : (
        <>
          {/* 标题和按钮 - 移动端优化 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-serif font-black text-brand-black">
              {myProfile ? '我的上架資料' : '上架我的資料'}
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-green text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-md"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              {myProfile ? '編輯資料' : '立即上架'}
            </button>
          </div>
          
          <div className="space-y-6 md:space-y-8">
          {myProfile ? (
            <>
              {/* 信息卡片 - 移动端单列，桌面端双列 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">姓名</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.name} {myProfile.nationality}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">年齡</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.age}歲</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">身高/體重</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.height}cm / {myProfile.weight}kg</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">罩杯</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.cup}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">地區</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.location}{myProfile.district ? ' - ' + myProfile.district : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">類型</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{myProfile.type === 'outcall' ? '外送' : '定點'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">價格</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">
                    {myProfile.price <= 0 || (myProfile.prices?.oneShot?.price <= 0 || myProfile.prices?.oneShot?.price === -1) 
                      ? '私訊詢問' 
                      : `NT$ ${(myProfile.prices?.oneShot?.price || myProfile.price)?.toLocaleString()}`}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">狀態</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">
                    {myProfile.isAvailable ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>可用</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-gray-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>不可用</span>
                      </span>
                    )}
                  </p>
                </div>
                {/* 用戶ID - 用於 Telegram 預約（佳麗檔案） */}
                {user && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">用戶ID</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base md:text-lg font-semibold text-gray-900 break-all flex-1">
                          {user.publicId || user.id}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.publicId || user.id);
                            alert('用戶ID已複製到剪貼板');
                          }}
                          className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                          title="複製用戶ID"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                  </div>
                )}
              </div>
              
              {/* 标签卡片 */}
              {myProfile.tags && myProfile.tags.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">標籤</p>
                  <div className="flex flex-wrap gap-2">
                    {myProfile.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 行事曆管理 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                <CalendarManager
                  profile={myProfile}
                  onUpdate={loadMyProfile}
                />
              </div>

            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">您還沒有上架資料</p>
              <p className="text-sm text-gray-500 mb-4">上架後，您的資料將顯示在「特選鮮魚」頁面</p>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export const UserProfile: React.FC<UserProfileProps> = ({ onProfileClick }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'listing' | 'subscription' | 'points' | 'achievements' | 'badges' | 'wall' | 'bookings' | 'messages' | 'notifications'>('profile');

  // 監聽設置 tab 的事件（從通知跳轉時使用）
  useEffect(() => {
    const handleSetTab = (event: CustomEvent) => {
      const { tab, bookingId } = event.detail || {};
      if (tab && ['profile', 'favorites', 'listing', 'subscription', 'points', 'achievements', 'badges', 'wall', 'bookings', 'messages', 'notifications'].includes(tab)) {
        setActiveTab(tab as any);
        
        // 如果是預約標籤頁且有 bookingId，發送事件讓 BookingList 高亮該預約
        if (tab === 'bookings' && bookingId) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('highlight-booking', {
              detail: { bookingId }
            }));
          }, 300); // 延遲一下確保 BookingList 已經載入
        }
      }
    };

    window.addEventListener('user-profile-set-tab', handleSetTab as EventListener);
    return () => {
      window.removeEventListener('user-profile-set-tab', handleSetTab as EventListener);
    };
  }, []);
  const [taskSubTab, setTaskSubTab] = useState<'daily' | 'other'>('daily'); // 任務子標籤：每日任務 / 其他任務
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [showPointsGuide, setShowPointsGuide] = useState(false);
  const [showVerificationBadgeGuide, setShowVerificationBadgeGuide] = useState(false);
  const [favorites, setFavorites] = useState<Profile[]>([]);
  const [favoriteCategory, setFavoriteCategory] = useState<'premium' | 'provider'>('premium');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [benefits, setBenefits] = useState<MembershipBenefits[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [userIsVip, setUserIsVip] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    avatarUrl: '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [clientRating, setClientRating] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        nickname: user.userName || user.email || user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [isAuthenticated, user]);

  // 監聽 email 驗證完成事件，確保驗證狀態更新後立即顯示徽章
  useEffect(() => {
    const handleEmailVerified = () => {
      // 重新載入用戶信息以確保顯示最新的驗證狀態
      refreshUser().catch(error => {
        console.error('刷新用戶信息失敗:', error);
      });
    };
    
    window.addEventListener('user-email-verified', handleEmailVerified);
    return () => {
      window.removeEventListener('user-email-verified', handleEmailVerified);
    };
  }, [refreshUser]);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await favoritesApi.getMy();
      setFavorites(result.profiles || []);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isAuthenticated && activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab, isAuthenticated, loadFavorites]);

  // 載入佳麗的個人資料（用於訊息收件箱的預約狀況日曆）
  const loadMyProfile = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'provider' || !user?.id) {
      return;
    }
    
    try {
      const profiles = await adminApi.profiles.getAll();
      const profile = profiles.find(p => p.userId === user.id);
      if (profile) {
        setMyProfile(profile);
      }
    } catch (error) {
      console.error('載入個人資料失敗:', error);
    }
  }, [isAuthenticated, user?.role, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'provider' && activeTab === 'messages') {
      loadMyProfile();
    }
  }, [isAuthenticated, user?.role, activeTab, loadMyProfile]);

  // 加载用户统计数据
  const loadUserStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const stats = await userStatsApi.getMy();
      console.log('用戶統計數據:', stats);
      console.log('當前等級:', stats.currentLevel);
      console.log('用戶角色:', user?.role);
      console.log('特選魚市預約次數:', stats.stats?.ladyBookingsCount || 0);
      console.log('嚴選好茶預約次數:', stats.stats?.premiumTeaBookingsCount || 0);
      setUserStats(stats);
    } catch (error) {
      console.error('加载用户统计失败:', error);
      // 即使失敗也設定一個預設值，避免一直顯示載入中
      setUserStats(null);
    }
  }, [isAuthenticated, user?.role]);

  // 加载会员等级权益（lazy load，延遲載入）
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // 延遲載入，避免與其他請求衝突
    const timer = setTimeout(async () => {
      try {
        const data = await subscriptionsApi.getBenefits();
        setBenefits(data.benefits || []);
      } catch (error) {
        console.error('加载会员等级权益失败:', error);
      }
    }, 2000); // 延遲 2 秒載入
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // 檢查用戶VIP狀態
  useEffect(() => {
    if (user?.isVip) {
      setUserIsVip(true);
    } else {
      // 檢查是否有活躍的訂閱
      subscriptionsApi.getMy().then(status => {
        setUserIsVip(status.isActive || false);
      }).catch(() => {
        setUserIsVip(false);
      });
    }
  }, [user]);

  useEffect(() => {
    // 在「積分與任務」、「茶客檔案/佳麗檔案」或「私藏好茶」標籤頁時載入 userStats，確保等級顯示一致和顯示預約次數
    if (isAuthenticated && (activeTab === 'points' || activeTab === 'profile' || activeTab === 'favorites')) {
      loadUserStats();
    }
  }, [activeTab, isAuthenticated, loadUserStats]);

  // 載入茶客的評論評分（僅茶客）
  useEffect(() => {
    const loadClientRating = async () => {
      // 再次檢查 user 和 user.id，確保在異步操作時仍然有效
      if (!isAuthenticated || !user || user.role !== 'client' || !user.id || user.id.trim() === '') {
        setClientRating(null);
        return;
      }

      const userId = user.id.trim();
      if (!userId) {
        setClientRating(null);
        return;
      }

      try {
        const reviewsData = await reviewsApi.getByUserId(userId);
        if (reviewsData.averageRating > 0) {
          setClientRating({
            averageRating: reviewsData.averageRating,
            totalReviews: reviewsData.total || 0
          });
        } else {
          setClientRating(null);
        }
      } catch (error) {
        console.error('載入茶客評分失敗:', error);
        setClientRating(null);
      }
    };

    if (isAuthenticated && activeTab === 'profile') {
      loadClientRating();
    }
  }, [isAuthenticated, activeTab, user?.id, user?.role]);

  const handleSave = async () => {
    if (!user) return;
    
    // 检查昵称是否改变
    const nicknameChanged = formData.nickname !== user.userName;
    if (nicknameChanged && user.nicknameChangedAt) {
      const changeCount = user.nicknameChangeCount || 0;
      const isVip = userIsVip;
      const lastChangeDate = new Date(user.nicknameChangedAt);
      const now = new Date();
      
      // VIP用戶：每7天可以修改一次
      if (isVip) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (lastChangeDate > sevenDaysAgo) {
          const daysLeft = Math.ceil((lastChangeDate.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000));
          alert(`VIP會員每7天可以修改一次暱稱，距離上次修改還需等待 ${daysLeft} 天`);
          return;
        }
      } else {
        // 非VIP用戶：根據修改次數決定冷卻時間
        let cooldownDays = 0;
        if (changeCount === 0) {
          // 第一次修改：7天後才能改
          cooldownDays = 7;
        } else if (changeCount === 1) {
          // 第二次修改：30天後才能改
          cooldownDays = 30;
        } else {
          // 第三次以後：每30天後才能改
          cooldownDays = 30;
        }
        
        const cooldownDate = new Date(lastChangeDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
        if (now < cooldownDate) {
          const daysLeft = Math.ceil((cooldownDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          alert(`暱稱修改冷卻時間未到，還需等待 ${daysLeft} 天`);
          return;
        }
      }
    }
    
    setIsSaving(true);
    try {
      await authApi.updateMe({
        userName: formData.nickname || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      });
      
      // 刷新用户信息
      await refreshUser();
      
      setIsEditing(false);
      alert('保存成功！');
    } catch (error: any) {
      console.error('保存失敗:', error);
      alert('保存失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案');
      return;
    }

    // 检查文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 转换为 base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, avatarUrl: base64String });
    };
    reader.onerror = () => {
      alert('读取文件失败');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendEmailCode = async () => {
    if (!formData.email) {
      alert('請先輸入 Email');
      return;
    }
    
    // 如果 email 有變更，先保存
    if (formData.email !== user?.email) {
      try {
        await authApi.updateMe({ email: formData.email });
        await refreshUser();
      } catch (error: any) {
        alert('更新 Email 失敗: ' + (error.message || '未知錯誤'));
        return;
      }
    }
    
    setIsSendingEmailCode(true);
    try {
      await authApi.sendVerificationEmail();
      setShowEmailVerification(true);
      alert('驗證碼已發送，請查看您的郵箱（開發環境請查看控制台）');
    } catch (error: any) {
      alert('發送驗證碼失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailVerificationCode) {
      alert('請輸入驗證碼');
      return;
    }
    setIsVerifyingEmail(true);
    try {
      await authApi.verifyEmail(emailVerificationCode);
      // refreshUser 會自動檢測驗證狀態變化並發送事件，這裡不需要重複發送
      await refreshUser();
      setShowEmailVerification(false);
      setEmailVerificationCode('');
      
      alert('Email 驗證成功！');
    } catch (error: any) {
      alert('驗證失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!formData.phoneNumber) {
      alert('請先輸入手機號碼');
      return;
    }
    
    // 如果手機號碼有變更，先保存
    if (formData.phoneNumber !== user?.phoneNumber) {
      try {
        await authApi.updateMe({ phoneNumber: formData.phoneNumber });
        await refreshUser();
      } catch (error: any) {
        alert('更新手機號碼失敗: ' + (error.message || '未知錯誤'));
        return;
      }
    }
    
    setIsSendingPhoneCode(true);
    try {
      await authApi.sendVerificationPhone();
      setShowPhoneVerification(true);
      alert('驗證碼已發送，請查看您的手機簡訊（開發環境請查看控制台）');
    } catch (error: any) {
      alert('發送驗證碼失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerificationCode) {
      alert('請輸入驗證碼');
      return;
    }
    setIsVerifyingPhone(true);
    try {
      await authApi.verifyPhone(phoneVerificationCode);
      await refreshUser();
      setShowPhoneVerification(false);
      setPhoneVerificationCode('');
      alert('手機號碼驗證成功！');
    } catch (error: any) {
      alert('驗證失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">請先登入</h2>
          <p className="text-gray-600">登入後即可查看{user?.role === 'provider' ? '佳麗檔案' : '茶客檔案'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-serif font-black text-brand-black mb-4 md:mb-6">
            {user?.role === 'provider' ? '佳麗檔案' : '茶客檔案'}
          </h1>

          {/* 标签页 - 移动端优化，支持左右滑动 */}
                          <style>{`
            .user-profile-tabs-wrapper {
              overflow-x: scroll !important;
              overflow-y: hidden !important;
              -webkit-overflow-scrolling: touch !important;
              touch-action: pan-x !important;
              scrollbar-width: thin;
              scrollbar-color: #888 #f1f1f1;
            }
            .user-profile-tabs-wrapper::-webkit-scrollbar {
              height: 6px;
              display: block !important;
            }
            .user-profile-tabs-wrapper::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 3px;
            }
            .user-profile-tabs-wrapper::-webkit-scrollbar-thumb {
              background: #64748b;
              border-radius: 3px;
            }
            .user-profile-tabs-wrapper::-webkit-scrollbar-thumb:hover {
              background: #475569;
            }
            .user-profile-tabs-inner {
              min-width: max-content !important;
              width: max-content !important;
              flex-wrap: nowrap !important;
            }
          `}</style>
          <div 
            className="mb-4 md:mb-6 border-b border-gray-200 -mx-4 px-4 md:mx-0 md:px-0 user-profile-tabs-wrapper"
            style={{
              overflowX: 'scroll',
              touchAction: 'pan-x' as any
            }}
            ref={(el) => {
              if (el) {
                // 強制設置 touch-action，覆蓋全局設置
                el.style.setProperty('touch-action', 'pan-x', 'important');
                el.style.setProperty('overflow-x', 'scroll', 'important');
                el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
              }
            }}
          >
            <div 
              className="flex gap-2 md:gap-4 items-center user-profile-tabs-inner"
            >
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-brand-green text-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'profile' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
              >
                {user?.role === 'provider' ? '佳麗檔案' : '茶客檔案'}
              </button>
            {user?.role === 'client' && (
              <button
                onClick={() => {
                  setActiveTab('favorites');
                  loadFavorites();
                }}
                className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'favorites'
                    ? 'border-b-2 border-brand-green text-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'favorites' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
              >
                私藏好茶
              </button>
            )}
            {user?.role === 'provider' && (
              <button
                onClick={() => setActiveTab('listing')}
                className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'listing'
                    ? 'border-b-2 border-brand-green text-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'listing' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
              >
                上架管理
              </button>
            )}
            {/* 訊息收件箱（佳麗和茶客都可見）- 移動到上架管理右邊 */}
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'messages'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'messages' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              {user?.role === 'provider' ? '訊息收件箱' : '我的訊息'}
            </button>
            {/* 通知中心 - 移動到訊息收件箱右邊 */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'notifications' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              通知中心
            </button>
            {/* 品茶紀錄 - 移動到通知中心右邊 */}
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'bookings' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              品茶紀錄
            </button>
            {/* 其他標籤頁往後移 */}
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'subscription' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              御選資格
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'points'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'points' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              茶譽任務
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'achievements'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'achievements' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              {user?.role === 'provider' ? '佳麗成就' : '茶譽成就'}
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'badges'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'badges' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              御印徽章
            </button>
            <button
              onClick={() => setActiveTab('wall')}
              className={`flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'wall'
                  ? 'border-b-2 border-brand-green text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'wall' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
            >
              成就勳章牆
            </button>
            {/* 獲取經驗值和積分方法按鈕 */}
            <button
              onClick={() => setShowPointsGuide(true)}
              className="flex-shrink-0 pb-2 px-3 md:px-4 text-sm md:text-base font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap flex items-center gap-1 md:gap-2"
              title="查看獲取經驗值和積分的方法"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">獲取方法</span>
            </button>
            </div>
          </div>

          {/* 茶客檔案/佳麗檔案标签页 */}
          {activeTab === 'profile' && (
            <div className="space-y-6 md:space-y-8">
              {!isEditing ? (
                <>
                  {/* 頭像顯示 - 行動端優化 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-gray-100">
                    <button
                      onClick={() => {
                        if (user?.id && user.id.trim() !== '') {
                          window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
                            detail: { userId: user.id }
                          }));
                        }
                      }}
                      className="relative flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                      title="點擊預覽個人檔案"
                    >
                      <div className="relative">
                        {formData.avatarUrl ? (
                          <img
                            src={getImageUrl(formData.avatarUrl)}
                            alt="头像"
                            className={`w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 shadow-md ${
                              user?.emailVerified && user?.phoneVerified
                                ? 'border-blue-500'
                                : 'border-gray-200'
                            }`}
                          />
                        ) : (
                          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 shadow-md ${
                            user?.emailVerified && user?.phoneVerified
                              ? 'border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            <img
                              src={getImageUrl("/images/default-avatar.svg")}
                              alt="默认头像"
                              className="w-full h-full rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Removed direct innerHTML manipulation to avoid JSX errors.
                              }}
                            />
                          </div>
                        )}
                        {/* Email 驗證徽章（右下角，用戶自己也能看到） */}
                        {user?.emailVerified && (
                          <EmailVerifiedBadge
                            size="md"
                            className=""
                          />
                        )}
                        {/* VIP 徽章（左下角，如果有Email驗證徽章；否則右下角） */}
                        {user?.isVip && (
                          <div className={`absolute ${user?.emailVerified ? 'bottom-0 left-0 right-auto' : 'bottom-0 right-0'} w-6 h-6 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center shadow-lg z-10`}>
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl md:text-2xl font-bold">{formData.nickname || '未設置暱稱'}</h2>
                          {/* 驗證徽章直接顯示在暱稱旁邊 */}
                          {user?.emailVerified && (
                            <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full shadow-sm" title="Email 已驗證">
                              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {user?.isVip && (
                            <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-sm" title="VIP 會員">
                              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {user?.role === 'admin' && <AdminBadge size="sm" />}
                        {user?.isVip && <VipBadge size="sm" />}
                        {(() => {
                          // 優先使用 userStats.currentLevel（從後端計算的），如果沒有則使用 user.membershipLevel
                          const displayLevel = userStats?.currentLevel || user?.membershipLevel;
                          if (displayLevel) {
                            // 即使是默認等級也顯示徽章
                            return <MembershipBadge level={displayLevel as any} size="md" />;
                          }
                          return null;
                        })()}
                        {user?.verificationBadges && user.verificationBadges.length > 0 && (
                          <div className="flex items-center gap-1">
                            <VerificationBadges badges={user.verificationBadges} size="sm" />
                            <button
                              onClick={() => setShowVerificationBadgeGuide(true)}
                              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                              title="查看驗證徽章說明"
                            >
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {(user?.warningBadge || user?.noShowBadge || user?.violationLevel === 4) && (
                          <UserBadges 
                            user={{
                              id: user.id,
                              warningBadge: user.warningBadge,
                              noShowBadge: user.noShowBadge,
                              violationLevel: user.violationLevel,
                            } as any}
                            size="sm"
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formData.email || formData.phoneNumber}</p>
                      {user?.isVip && user?.membershipExpiresAt && (
                        <p className="text-xs text-yellow-600 mt-1">
                          VIP到期：{new Date(user.membershipExpiresAt).toLocaleDateString('zh-TW')}
                        </p>
                      )}
                      {/* 茶客評分顯示（如果有評論） */}
                      {user?.role === 'client' && clientRating && clientRating.averageRating > 0 && (
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 bg-yellow-50 rounded-lg px-4 py-2 inline-flex">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < Math.round(clientRating.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-lg font-bold text-gray-900">{clientRating.averageRating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({clientRating.totalReviews} 則評論)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 信息卡片 - 移动端单列，桌面端双列 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">暱稱</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base md:text-lg font-semibold text-gray-900">{formData.nickname || '-'}</p>
                        {user?.emailVerified && user?.phoneVerified && (
                          <VerifiedBadge size="sm" className="text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">身份</p>
                      <p className="text-base md:text-lg font-semibold text-gray-900">
                        <span className="flex items-center gap-1">
                          {user?.role === 'client' ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              品茶客
                            </>
                          ) : user?.role === 'provider' ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              後宮佳麗
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              管理員
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Email</p>
                      <p className="text-base md:text-lg font-semibold text-gray-900 break-all">{formData.email || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">手機號</p>
                      <p className="text-base md:text-lg font-semibold text-gray-900">{formData.phoneNumber || '-'}</p>
                    </div>
                    {/* 用戶ID - 用於 Telegram 預約 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">用戶ID</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base md:text-lg font-semibold text-gray-900 break-all flex-1">
                          {user?.publicId || user?.id || '-'}
                        </p>
                        {user && (user.publicId || user.id) && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.publicId || user.id);
                              alert('用戶ID已複製到剪貼板');
                            }}
                            className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                            title="複製用戶ID"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {/* VIP訂閱（御選資格）- 獨立顯示 */}
                    {user?.isVip && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 sm:col-span-2">
                        <p className="text-xs text-yellow-700 mb-2 sm:mb-3 uppercase tracking-wide font-bold">御選資格</p>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <VipBadge size="md" />
                          <span className="text-xs text-yellow-600">（額外獲得頭銜與擁有VIP權益）</span>
                        </div>
                      </div>
                    )}
                    {/* 會員等級（茶客位階/佳麗位階）- 獨立顯示，與積分與任務標籤頁的當前等級一致 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-2 sm:mb-3 uppercase tracking-wide">
                        {user?.role === 'provider' ? '佳麗位階' : '茶客位階'}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {(() => {
                          // 優先使用 userStats.currentLevel（從後端計算的），如果沒有則使用 user.membershipLevel
                          const displayLevel = userStats?.currentLevel || user?.membershipLevel;
                          if (displayLevel) {
                            return <MembershipBadge level={displayLevel as any} size="md" />;
                          }
                          // 如果都沒有，顯示默認等級
                          return <span className="text-gray-500">{user?.role === 'provider' ? '初級佳麗' : '茶客'}</span>;
                        })()}
                        {user?.verificationBadges && user.verificationBadges.length > 0 && (
                          <VerificationBadges badges={user.verificationBadges} size="md" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">通過完成任務獲得經驗值升級</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-brand-green text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-md"
                      style={{ backgroundColor: '#1a5f3f' }}
                    >
                      編輯資料
                    </button>
                  </div>

                  {/* 會員等級權益 - 品茶客和後宮佳麗都顯示 */}
                  <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold">{user?.role === 'provider' ? '後宮佳麗會員等級權益' : '品茶客會員等級權益'}</h2>
                        <button
                          onClick={() => setSelectedBenefit('all')}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 flex-shrink-0"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">查看權益說明</span>
                        </button>
                      </div>
                      {benefits.length > 0 ? (
                        <>
                          <style>{`
                            .benefits-table-scroll {
                              overflow-x: scroll !important;
                              overflow-y: hidden !important;
                              -webkit-overflow-scrolling: touch !important;
                              touch-action: pan-x !important;
                              overscroll-behavior-x: contain;
                              width: 100%;
                              max-width: 100%;
                              display: block;
                              position: relative;
                              cursor: grab;
                            }
                            .benefits-table-scroll:active {
                              cursor: grabbing;
                            }
                            /* 手機版和桌面版都顯示滾動條 */
                            .benefits-table-scroll {
                              scrollbar-width: thin;
                              scrollbar-color: #888 #f1f1f1;
                              /* 確保手機版可以水平滑動 */
                              touch-action: pan-x !important;
                              -webkit-overflow-scrolling: touch !important;
                            }
                            .benefits-table-scroll::-webkit-scrollbar {
                              height: 8px;
                              display: block !important;
                            }
                            .benefits-table-scroll::-webkit-scrollbar-track {
                              background: #f1f5f9;
                              border-radius: 4px;
                              margin: 2px 0;
                            }
                            .benefits-table-scroll::-webkit-scrollbar-thumb {
                              background: #64748b;
                              border-radius: 4px;
                              border: 1px solid #f1f5f9;
                            }
                            .benefits-table-scroll::-webkit-scrollbar-thumb:hover {
                              background: #475569;
                            }
                            /* 手機版滾動條稍微細一點 */
                            @media (max-width: 768px) {
                              .benefits-table-scroll::-webkit-scrollbar {
                                height: 6px;
                              }
                              /* 手機版表格字體稍微小一點 */
                              .benefits-table-scroll table {
                                font-size: 0.875rem;
                              }
                              .benefits-table-scroll th,
                              .benefits-table-scroll td {
                                padding: 0.5rem 0.75rem;
                              }
                              /* 手機版第一列寬度調整，確保文字不超出 */
                              .benefits-table-scroll th:first-child,
                              .benefits-table-scroll td:first-child {
                                min-width: 110px;
                                max-width: 140px;
                              }
                              /* 手機版第一列文字大小調整 */
                              .benefits-table-scroll th:first-child span,
                              .benefits-table-scroll td:first-child span {
                                font-size: 0.7rem;
                                line-height: 1.3;
                              }
                              /* 手機版：確保表格和第一列緊貼左側 */
                              .benefits-table-scroll-wrapper {
                                margin-left: 0 !important;
                                padding-left: 0 !important;
                              }
                              .benefits-table-scroll {
                                padding-left: 0 !important;
                                margin-left: 0 !important;
                              }
                              .benefits-table-scroll table {
                                margin-left: 0;
                              }
                            }
                            .benefits-table-scroll table {
                              min-width: max-content !important;
                              width: max-content !important;
                              display: table;
                              margin: 0;
                              table-layout: auto;
                            }
                            /* 確保表格列不會被壓縮 */
                            .benefits-table-scroll th,
                            .benefits-table-scroll td {
                              white-space: nowrap;
                            }
                            /* 凍結第一列（權益項目欄位）- 緊貼左側固定，避免滑動時看到空白 */
                            .benefits-table-scroll th:first-child,
                            .benefits-table-scroll td:first-child {
                              position: sticky;
                              left: 0;
                              z-index: 10;
                              background-color: #f9fafb;
                              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
                              border-right: 2px solid #e5e7eb;
                            }
                            .benefits-table-scroll thead th:first-child {
                              background-color: #f3f4f6;
                              z-index: 11;
                              border-right: 2px solid #d1d5db;
                            }
                            .benefits-table-scroll tbody tr:hover td:first-child {
                              background-color: #f9fafb;
                            }
                            /* 手機版：第一列緊貼左側，減少空白 */
                            @media (max-width: 768px) {
                              .benefits-table-scroll-wrapper {
                                margin-left: 0;
                                padding-left: 0;
                              }
                              .benefits-table-scroll {
                                padding-left: 0 !important;
                                margin-left: 0 !important;
                              }
                              .benefits-table-scroll th:first-child,
                              .benefits-table-scroll td:first-child {
                                left: 0;
                                padding-left: 1rem;
                                padding-right: 0.75rem;
                                margin-left: 0;
                              }
                            }
                            /* 手機版滑動提示和漸變效果 */
                            @media (max-width: 768px) {
                              /* 右側漸變提示 */
                              .benefits-table-scroll::after {
                                content: '';
                                position: absolute;
                                top: 0;
                                right: 0;
                                bottom: 0;
                                width: 30px;
                                background: linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent);
                                pointer-events: none;
                                z-index: 1;
                              }
                              /* 左側漸變提示 */
                              .benefits-table-scroll::before {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                bottom: 0;
                                width: 20px;
                                background: linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent);
                                pointer-events: none;
                                z-index: 1;
                              }
                              /* 滑動提示文字（使用額外的元素） */
                              .benefits-table-scroll-wrapper::after {
                                content: '← 滑動查看更多 →';
                                display: block;
                                text-align: center;
                                margin-top: 0.5rem;
                                font-size: 0.75rem;
                                color: #64748b;
                                white-space: nowrap;
                              }
                            }
                          `}</style>
                          <div className="benefits-table-scroll-wrapper">
                          <div 
                            className="benefits-table-scroll -mx-4 sm:mx-0 px-4 sm:px-0"
                            style={{
                              overflowX: 'scroll',
                              overflowY: 'hidden',
                              WebkitOverflowScrolling: 'touch',
                              touchAction: 'pan-x',
                              overscrollBehaviorX: 'contain',
                              width: '100%',
                              maxWidth: '100%',
                              display: 'block',
                              position: 'relative',
                              scrollbarWidth: 'thin',
                              cursor: 'grab'
                            } as React.CSSProperties}
                            ref={(el) => {
                              if (el) {
                                // 強制設置 touch-action，覆蓋全局設置
                                el.style.setProperty('touch-action', 'pan-x', 'important');
                                el.style.setProperty('overflow-x', 'scroll', 'important');
                                el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
                              }
                            }}
                          >
                            <table 
                              className="min-w-full divide-y divide-gray-200"
                              style={{ 
                                minWidth: 'max-content',
                                width: 'max-content',
                                display: 'table'
                              }}
                            >
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '100px', maxWidth: '120px' }}>權益項目</th>
                                {benefits.map((b) => (
                                  <th key={b.level} className="px-2 sm:px-4 py-2 sm:py-4 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '90px' }}>
                                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                                      <MembershipBadge level={b.level} size="sm" showLabel={false} />
                                      <span className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 sm:mt-1 leading-tight">{getLevelName(b.level as any) || b.level}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                // 定義所有權益項目（包括數值型權益）
                                const allBenefitItems: Array<{
                                  key: string;
                                  label: string;
                                  type: 'boolean' | 'number';
                                  getValue?: (level: MembershipLevel, isVip: boolean) => string | number;
                                }> = user?.role === 'client' ? [
                                  // 基本權益項目（從API獲取）
                                  ...(benefits.length > 0 && benefits[0].benefits 
                                    ? Array.from(new Set(benefits.flatMap(b => b.benefits))).map(benefit => ({
                                        key: benefit,
                                        label: benefit,
                                        type: 'boolean' as const
                                      }))
                                    : [
                                        '基本功能',
                                        '解鎖部分內容',
                                        '更多內容',
                                        '專屬標籤',
                                        '專屬徽章'
                                      ].map(benefit => ({
                                        key: benefit,
                                        label: benefit,
                                        type: 'boolean' as const
                                      }))
                                  ),
                                  // 數值型權益項目
                                  {
                                    key: 'premium_tea_booking',
                                    label: '嚴選好茶約會次數（月）',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const limit = getPremiumTeaBookingLimit(level, isVip);
                                      return `${limit}次`;
                                    }
                                  },
                                  {
                                    key: 'featured_tea_booking',
                                    label: '特選魚市約會次數',
                                    type: 'number' as const,
                                    getValue: () => '無限制'
                                  },
                                  {
                                    key: 'premium_tea_reviews',
                                    label: '嚴選好茶評論查看',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxReviewCount(level, isVip, true);
                                      return count === -1 ? '全部' : `${count}則`;
                                    }
                                  },
                                  {
                                    key: 'featured_tea_reviews',
                                    label: '特選魚市評論查看',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxReviewCount(level, isVip, false);
                                      return count === -1 ? '全部' : `${count}則`;
                                    }
                                  },
                                  {
                                    key: 'premium_tea_favorites',
                                    label: '嚴選好茶收藏夾',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxFavoriteCount(level, isVip, 'premium');
                                      return count === -1 ? '無限制' : `${count}位`;
                                    }
                                  },
                                  {
                                    key: 'featured_tea_favorites',
                                    label: '特選魚市收藏夾',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxFavoriteCount(level, isVip, 'featured');
                                      return count === -1 ? '無限制' : `${count}位`;
                                    }
                                  },
                                  {
                                    key: 'premium_tea_gallery',
                                    label: '嚴選好茶寫真照片',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxGalleryPhotoCount(level, false); // 顯示非VIP情況
                                      if (count === 0) return '無法查看';
                                      if (count === -1) return '全部';
                                      return `${count}張`;
                                    }
                                  },
                                  {
                                    key: 'premium_tea_portfolio',
                                    label: '嚴選好茶作品集',
                                    type: 'number' as const,
                                    getValue: (level, isVip) => {
                                      const count = getMaxGalleryPhotoCount(level, false); // 顯示非VIP情況
                                      if (count === 0) return '無法查看';
                                      if (count === -1) return '全部';
                                      return `${count}張`;
                                    }
                                  }
                                ] : (
                                  // 佳麗的權益項目（保持原有邏輯）
                                  benefits.length > 0 && benefits[0].benefits 
                                    ? Array.from(new Set(benefits.flatMap(b => b.benefits))).map(benefit => ({
                                        key: benefit,
                                        label: benefit,
                                        type: 'boolean' as const
                                      }))
                                    : [
                                        '基本功能',
                                        '上架管理',
                                        '優先客服',
                                        '更多展示位',
                                        '專屬標籤'
                                      ].map(benefit => ({
                                        key: benefit,
                                        label: benefit,
                                        type: 'boolean' as const
                                      }))
                                );

                                return allBenefitItems.map((item) => {
                                  const isNumericBenefit = item.type === 'number' && item.getValue;
                                  
                                  return (
                                    <tr key={item.key}>
                                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium bg-white">
                                        <button
                                          onClick={() => setSelectedBenefit(item.key)}
                                          className="flex items-center gap-1 sm:gap-2 hover:text-blue-600 transition-colors group w-full text-left"
                                        >
                                          <span className="break-words leading-tight overflow-wrap-anywhere text-[0.7rem] sm:text-xs">{item.label}</span>
                                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </button>
                                      </td>
                                      {benefits.map((b) => {
                                        const level = b.level as MembershipLevel;
                                        
                                        // 如果是數值型權益，顯示計算後的值
                                        // 注意：會員權益表格顯示的是非VIP情況下的權益
                                        if (isNumericBenefit && item.getValue) {
                                          const value = item.getValue(level, false); // 傳入 false 表示非VIP情況
                                          return (
                                            <td key={b.level} className="px-2 sm:px-4 py-2 sm:py-3 text-center bg-white">
                                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{value}</span>
                                            </td>
                                          );
                                        }
                                        
                                        // 如果是布林型權益，顯示打勾或減號
                                        const hasBenefit = b.benefits && b.benefits.includes(item.key);
                                        return (
                                          <td key={b.level} className="px-2 sm:px-4 py-2 sm:py-3 text-center bg-white">
                                            {hasBenefit ? (
                                              <span className="text-green-500 text-base sm:text-lg">✓</span>
                                            ) : (
                                              <span className="text-gray-300 text-base sm:text-lg">-</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                          </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">載入中...</div>
                      )}
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                        <p className="text-xs text-blue-800 font-bold">
                          💡 購買VIP後的權益變動：
                        </p>
                        <div className="text-xs text-blue-800 space-y-2">
                          <div>
                            <strong>嚴選好茶約會次數：</strong>購買VIP後，根據會員等級可增加次數上限（御前茶士3級：4次，御用茶官4級：5次，之後每級+1次）。
                          </div>
                          <div>
                            <strong>評論查看權益：</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                              <li>• 嚴選好茶：購買VIP可查看全部評論</li>
                              <li>• 特選魚市：購買VIP可查看全部評論</li>
                            </ul>
                          </div>
                          <div>
                            <strong>收藏夾（私藏好茶）：</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                              <li>• 購買VIP但在御用茶官等級前，預設數量為各5個（嚴選好茶和特選魚市）</li>
                              <li>• 購買VIP且達到御用茶官等級或以上，收藏夾無限制</li>
                            </ul>
                          </div>
                          <div>
                            <strong>嚴選好茶寫真照片與作品集：</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                              <li>• 購買VIP後，入門茶士（2級）可查看2張，御前茶士（3級）可查看3張</li>
                              <li>• 購買VIP且達到御用茶官（4級）含之後，全部解鎖</li>
                            </ul>
                          </div>
                          <div className="pt-2 border-t border-blue-300">
                            <p className="text-xs text-blue-700">
                              會員等級可以通過完成任務獲得經驗值免費升級，請前往「積分與任務」頁面查看。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                </>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  {/* 头像上传 - 移动端优化 */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">頭像</label>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div className="relative flex-shrink-0">
                        {formData.avatarUrl ? (
                          <img
                            src={getImageUrl(formData.avatarUrl)}
                            alt="头像预览"
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleAvatarClick}
                          />
                        ) : (
                          <div
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-gray-300 transition-colors"
                            onClick={handleAvatarClick}
                          >
                            <img
                              src={getImageUrl("/images/default-avatar.svg")}
                              alt="默认头像"
                              className="w-full h-full rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = '<svg class="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                                }
                              }}
                            />
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleAvatarClick}
                          className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium hover:bg-white hover:border-brand-green transition-colors mb-2"
                          style={{ borderColor: '#1a5f3f' }}
                        >
                          上傳頭像
                        </button>
                        {formData.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                            className="w-full sm:w-auto px-4 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                          >
                            移除
                          </button>
                        )}
                        <p className="text-xs text-gray-500 mt-3">支持 JPG、PNG 格式，大小不超过 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* 昵称输入 - 移动端优化 */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">暱稱</label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base"
                      placeholder="請輸入暱稱"
                      style={{ focusRingColor: '#1a5f3f' }}
                    />
                    {user?.nicknameChangedAt && formData.nickname !== user.userName && (() => {
                      const changeCount = user.nicknameChangeCount || 0;
                      const isVip = userIsVip;
                      const lastChangeDate = new Date(user.nicknameChangedAt);
                      const now = new Date();
                      
                      let canChange = false;
                      let daysLeft = 0;
                      let message = '';
                      
                      // VIP用戶：每7天可以修改一次
                      if (isVip) {
                        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        canChange = lastChangeDate <= sevenDaysAgo;
                        if (!canChange) {
                          daysLeft = Math.ceil((lastChangeDate.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000));
                          message = `VIP會員每7天可以修改一次暱稱，還需等待 ${daysLeft} 天`;
                        }
                      } else {
                        // 非VIP用戶：根據修改次數決定冷卻時間
                        let cooldownDays = 0;
                        if (changeCount === 0) {
                          cooldownDays = 7; // 第一次修改：7天後才能改
                        } else if (changeCount === 1) {
                          cooldownDays = 30; // 第二次修改：30天後才能改
                        } else {
                          cooldownDays = 30; // 第三次以後：每30天後才能改
                        }
                        
                        const cooldownDate = new Date(lastChangeDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
                        canChange = now >= cooldownDate;
                        if (!canChange) {
                          daysLeft = Math.ceil((cooldownDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                          message = `暱稱修改冷卻時間未到，還需等待 ${daysLeft} 天`;
                        }
                      }
                      
                      return !canChange ? (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{message}</span>
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Email 输入和验证 */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email
                      {user?.emailVerified && (
                        <span className="ml-2 text-xs text-green-600 font-normal">✓ 已驗證</span>
                      )}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base"
                        placeholder="請輸入 Email"
                        style={{ focusRingColor: '#1a5f3f' }}
                      />
                      {formData.email && !user?.emailVerified && (
                        <button
                          type="button"
                          onClick={handleSendEmailCode}
                          disabled={isSendingEmailCode}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isSendingEmailCode ? '發送中...' : '發送驗證碼'}
                        </button>
                      )}
                    </div>
                    {showEmailVerification && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={emailVerificationCode}
                          onChange={(e) => setEmailVerificationCode(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="請輸入驗證碼"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmail}
                          disabled={isVerifyingEmail || !emailVerificationCode}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isVerifyingEmail ? '驗證中...' : '驗證'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 手機號碼輸入和驗證 */}
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      手機號碼
                      {user?.phoneVerified && (
                        <span className="ml-2 text-xs text-green-600 font-normal">✓ 已驗證</span>
                      )}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          // 只允許數字
                          const value = e.target.value.replace(/[^\d]/g, '');
                          // 限制長度為10位（台灣手機號）
                          const trimmedValue = value.slice(0, 10);
                          setFormData({ ...formData, phoneNumber: trimmedValue });
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base"
                        placeholder="請輸入手機號碼（格式：09XXXXXXXX）"
                        maxLength={10}
                        style={{ focusRingColor: '#1a5f3f' }}
                      />
                      {formData.phoneNumber && !user?.phoneVerified && (
                        <button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={isSendingPhoneCode}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isSendingPhoneCode ? '發送中...' : '發送驗證碼'}
                        </button>
                      )}
                    </div>
                    {showPhoneVerification && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={phoneVerificationCode}
                          onChange={(e) => setPhoneVerificationCode(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="請輸入驗證碼"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhone}
                          disabled={isVerifyingPhone || !phoneVerificationCode}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isVerifyingPhone ? '驗證中...' : '驗證'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 按钮组 - 移动端优化 */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-brand-green text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      style={{ backgroundColor: '#1a5f3f' }}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setShowEmailVerification(false);
                        setShowPhoneVerification(false);
                        setEmailVerificationCode('');
                        setPhoneVerificationCode('');
                        if (user) {
                          setFormData({
                            nickname: user.userName || user.email || user.phoneNumber || '',
                            avatarUrl: user.avatarUrl || '',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || '',
                          });
                        }
                      }}
                      className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 上架管理标签页 - Provider */}
          {activeTab === 'listing' && user?.role === 'provider' && (
            <ProviderListingManagement />
          )}

          {/* 御選資格標籤頁 */}
          {activeTab === 'subscription' && (
            <SubscriptionPanel />
          )}

          {/* 積分與任務標籤頁 */}
          {activeTab === 'points' && (
            <div className="space-y-6">
              {userStats ? (
                <>
                  <PointsDisplay
                    currentPoints={userStats.stats.currentPoints}
                    experiencePoints={userStats.stats.experiencePoints}
                    currentLevel={userStats.currentLevel}
                    nextLevel={userStats.nextLevel}
                    experienceNeeded={userStats.experienceNeeded}
                    progress={userStats.progress}
                  />
                  
                  {/* 任務標籤頁 */}
                  <div className="bg-white rounded-lg shadow">
                    {/* 子標籤切換 */}
                    <div className="border-b border-gray-200 px-6 pt-4">
                      <div className="flex gap-6">
                        <button
                          onClick={() => setTaskSubTab('daily')}
                          className={`pb-3 px-2 text-sm font-medium transition-colors ${
                            taskSubTab === 'daily'
                              ? 'border-b-2 border-brand-green text-brand-green'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          style={taskSubTab === 'daily' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
                        >
                          每日任務
                        </button>
                        <button
                          onClick={() => setTaskSubTab('other')}
                          className={`pb-3 px-2 text-sm font-medium transition-colors ${
                            taskSubTab === 'other'
                              ? 'border-b-2 border-brand-green text-brand-green'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          style={taskSubTab === 'other' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
                        >
                          其他任務
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">
                          {taskSubTab === 'daily' ? '每日任務' : '其他任務'}
                        </h3>
                        {taskSubTab === 'daily' && (
                          <button
                            onClick={() => setShowPointsGuide(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            查看積分獲取方式
                          </button>
                        )}
                      </div>
                      <DailyTasksPanel filterType={taskSubTab} userRole={user?.role} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">載入中...</p>
                </div>
              )}
            </div>
          )}

          {/* 勳章標籤頁 */}
          {activeTab === 'badges' && (
            <BadgesPanel />
          )}

          {/* 成就標籤頁 */}
          {activeTab === 'achievements' && (
            <AchievementsPanel />
          )}

          {/* 成就勳章牆標籤頁 */}
          {activeTab === 'wall' && (
            <AchievementsWall />
          )}

          {/* 訊息收件箱標籤頁（佳麗和茶客都可見） */}
          {activeTab === 'messages' && user && (
            <div>
              <MessageList />
              {/* 預約狀況日曆（僅佳麗顯示，放在收件箱下面） */}
              {user.role === 'provider' && myProfile && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                  <BookingCalendar 
                    profileId={myProfile.id}
                    providerId={user?.id}
                  />
                </div>
              )}
            </div>
          )}

          {/* 通知中心標籤頁 */}
          {activeTab === 'notifications' && user && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-serif font-black text-brand-black">
                  通知中心
                </h2>
                <p className="text-sm text-gray-500 mt-2">查看所有系統通知和消息</p>
              </div>
              <NotificationCenterPanel />
            </div>
          )}

          {/* 品茶紀錄標籤頁 */}
          {activeTab === 'bookings' && user && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-serif font-black text-brand-black">
                  品茶紀錄
                </h2>
              </div>
              <BookingList 
                userRole={user.role} 
                onUserClick={(userId) => {
                  // 發送導航事件到用戶個人頁面
                  if (userId && userId.trim() !== '') {
                    window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
                      detail: { userId }
                    }));
                  }
                }}
              />
            </div>
          )}

          {/* 權益說明彈窗 */}
          {selectedBenefit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBenefit(null)}>
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">權益說明</h2>
                  <button
                    onClick={() => setSelectedBenefit(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  {selectedBenefit === 'all' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-bold text-blue-900 mb-2">📋 權益說明總覽</h3>
                        <p className="text-sm text-blue-800">點擊表格中的權益項目旁的 ⓘ 圖標，即可查看該權益的詳細說明。</p>
                      </div>
                      <div className="space-y-3">
                        {getBenefitDescriptions(user?.role).filter(item => item.description && item.description !== '').map((item) => (
                          <div key={item.benefit} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2">{item.benefit}</h4>
                            <p className="text-sm text-gray-700">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (() => {
                    const description = getBenefitDescription(selectedBenefit, user?.role);
                    // 如果說明為空，顯示提示訊息
                    if (!description || description === '') {
                      return (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-gray-900 break-words">{getBenefitLabel(selectedBenefit)}</h3>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-gray-500 italic">此權益為會員等級標識，無具體功能說明。</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 break-words">{getBenefitLabel(selectedBenefit)}</h3>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-gray-700 whitespace-pre-line break-words overflow-wrap-anywhere">
                            {description}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                  <button
                    onClick={() => setSelectedBenefit(null)}
                    className="w-full px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90"
                    style={{ backgroundColor: '#1a5f3f' }}
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 收藏标签页 */}
          {activeTab === 'favorites' && user?.role === 'client' && (
            <div>
              {/* 收藏分類標籤 */}
              <div className="flex gap-4 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setFavoriteCategory('premium')}
                  className={`pb-3 px-4 text-sm md:text-base font-medium transition-colors ${
                    favoriteCategory === 'premium'
                      ? 'border-b-2 border-brand-green text-brand-green'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={favoriteCategory === 'premium' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
                >
                  嚴選好茶
                </button>
                <button
                  onClick={() => setFavoriteCategory('provider')}
                  className={`pb-3 px-4 text-sm md:text-base font-medium transition-colors ${
                    favoriteCategory === 'provider'
                      ? 'border-b-2 border-brand-green text-brand-green'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={favoriteCategory === 'provider' ? { borderColor: '#1a5f3f', color: '#1a5f3f' } : {}}
                >
                  特選魚市
                </button>
              </div>

              {/* 預約次數進度條 - 根據分類顯示對應的預約次數 */}
              {userStats && (
                <div className="mb-6">
                  {/* 嚴選好茶預約次數 - 只在嚴選好茶標籤頁顯示 */}
                  {favoriteCategory === 'premium' && (
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-700 font-bold text-sm">嚴選好茶預約次數</span>
                          <span className="text-purple-600 font-black text-lg">
                            {userStats.stats.premiumTeaBookingsCount || 0}
                          </span>
                        </div>
                        <span className="text-xs text-purple-600">
                          {(() => {
                            const count = userStats.stats.premiumTeaBookingsCount || 0;
                            if (count >= 20) return '🎖️ 品鑑達人';
                            if (count >= 5) return '👑 御茶常客';
                            if (count >= 1) return '🍵 初嚐御茶';
                            return '目標：1次（初嚐御茶）';
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(((userStats.stats.premiumTeaBookingsCount || 0) / 20) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-purple-600 mt-1">
                        <span>0</span>
                        <span>目標：20次（品鑑達人）</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-300">
                        <p className="text-xs text-purple-700 leading-relaxed">
                          <strong>📋 計數說明：</strong><br/>
                          點擊預約按鈕 → 內部管理者確認成功赴約 → 發表評論 → 計數一次
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 特選魚市預約次數 - 只在特選魚市標籤頁顯示 */}
                  {favoriteCategory === 'provider' && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-bold text-sm">特選魚市預約次數</span>
                          <span className="text-blue-600 font-black text-lg">
                            {userStats.stats.ladyBookingsCount || 0}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600">
                          {(() => {
                            const count = userStats.stats.ladyBookingsCount || 0;
                            if (count >= 20) return '👸 茶王座上賓';
                            if (count >= 5) return '💎 專屬熟客';
                            if (count >= 1) return '💃 初次入席';
                            return '目標：1次（初次入席）';
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(((userStats.stats.ladyBookingsCount || 0) / 20) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>0</span>
                        <span>目標：20次（茶王座上賓）</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <p className="text-xs text-blue-700 leading-relaxed">
                          <strong>📋 計數說明：</strong><br/>
                          點擊預約按鈕 → 顯示成功預約 → 發表評論 → 計數一次
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">載入中...</p>
                </div>
              ) : (() => {
                // 根據分類篩選收藏
                // 嚴選好茶：userId 為空或 null（後台管理員上架的）
                // 特選魚市：userId 有值（後宮佳麗上架的）
                const filteredFavorites = favorites.filter(profile => {
                  if (favoriteCategory === 'premium') {
                    return !profile.userId || profile.userId === null || profile.userId === '';
                  } else {
                    return profile.userId && profile.userId !== null && profile.userId !== '';
                  }
                });

                if (filteredFavorites.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">
                        {favoriteCategory === 'premium' 
                          ? '還沒有收藏任何嚴選好茶' 
                          : '還沒有收藏任何特選魚市'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFavorites.map(profile => (
                      <a
                        key={profile.id}
                        href={`#profile-${profile.id}`}
                        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow block"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onProfileClick) {
                            onProfileClick(profile);
                          }
                        }}
                      >
                        <div className="relative overflow-hidden" style={{ aspectRatio: '3 / 4' }}>
                          <img
                            src={getImageUrl(profile.imageUrl)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            alt={profile.name}
                          />
                          <div className="absolute top-4 left-4">
                            {favoriteCategory === 'premium' ? (
                              <span className="bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg">
                                嚴選好茶
                              </span>
                            ) : (
                              <span className="bg-blue-600/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg">
                                特選魚市
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-white font-bold text-lg">{profile.name} {profile.nationality}</h3>
                            <p className="text-white text-xs opacity-80">{profile.age}歲 | {profile.location}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* 積分獲取方式說明彈窗 */}
      <PointsGuideModal
        isOpen={showPointsGuide}
        onClose={() => setShowPointsGuide(false)}
      />
      
      {/* 驗證徽章說明彈窗 */}
      {showVerificationBadgeGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowVerificationBadgeGuide(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">驗證徽章說明</h2>
              <button
                onClick={() => setShowVerificationBadgeGuide(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">完整驗證（Email + 手機）</h3>
                    <p className="text-sm text-gray-600">頭像會有藍色邊框 + 藍色勾勾徽章</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0 relative">
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">僅 Email 驗證</h3>
                    <p className="text-sm text-gray-600">只有藍色勾勾徽章，沒有藍色邊框</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">未驗證</h3>
                    <p className="text-sm text-gray-600">沒有驗證徽章，頭像為灰色邊框</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-yellow-800">
                  <strong>💡 提示：</strong>完成 Email 和手機驗證可以獲得藍色邊框，讓其他用戶更容易信任您的帳號。
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowVerificationBadgeGuide(false)}
              className="mt-6 w-full px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

