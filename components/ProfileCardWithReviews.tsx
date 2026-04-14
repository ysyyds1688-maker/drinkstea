import React, { useState, useEffect, useRef } from 'react';
import { Profile, Review, Booking } from '../types';
import { reviewsApi, favoritesApi, bookingApi } from '../services/apiService';
import { getImageUrl, OFFICIAL_LINE_URL } from '../config/api';
import { ReviewCard } from './ReviewCard';
import { ReviewModal } from './ReviewModal';
import { BookingModal } from './BookingModal';
import { useAuth } from '../contexts/AuthContext';
import { PriceDisplay } from './PriceDisplay';
import { ProviderVerifiedBadge } from './ProviderVerifiedBadge';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';

interface ProfileCardWithReviewsProps {
  profile: Profile;
  userStatus: 'guest' | 'logged_in' | 'subscribed';
  visibleReviewCount: number | 'all';
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onSubscribeClick?: () => void;
}

export const ProfileCardWithReviews: React.FC<ProfileCardWithReviewsProps> = ({
  profile,
  userStatus,
  visibleReviewCount,
  onProfileClick,
  onLoginClick,
  onSubscribeClick,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hasValidBooking, setHasValidBooking] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 追蹤組件是否在可視區域
  const cardRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();
  
  // 判斷是否為特選魚市（有 userId 表示是佳麗自己上架的）
  const isFishMarket = !!profile.userId;

  const checkFavoriteStatus = async () => {
    try {
      const result = await favoritesApi.check(profile.id);
      setIsFavorited(result.isFavorited);
    } catch (error) {
      console.error('檢查收藏狀態失敗:', error);
    }
  };

  const checkBookingStatus = async () => {
    try {
      // 檢查用戶是否有該 profile 的有效預約（accepted 或 completed）
      const bookings = await bookingApi.getMy();
      const validBooking = bookings.find(
        (booking: Booking) => 
          booking.profileId === profile.id && 
          (booking.status === 'accepted' || booking.status === 'completed')
      );
      setHasValidBooking(!!validBooking);
    } catch (error) {
      console.error('檢查預約狀態失敗:', error);
      setHasValidBooking(false);
    }
  };

  const loadReviews = async () => {
    // 如果不需要顯示評論，直接返回
    if (visibleReviewCount === 0) {
      setIsLoadingReviews(false);
      return;
    }
    
    // 未登入用戶不載入評分資料
    if (userStatus === 'guest') {
      setIsLoadingReviews(false);
      setAverageRating(0);
      setTotalReviews(0);
      setReviews([]);
      setTotalLikes(0);
      return;
    }
    
    setIsLoadingReviews(true);
    try {
      const data = await reviewsApi.getByProfileId(profile.id);
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      setTotalReviews(data.total);
      // 计算总点赞数
      const total = data.reviews.reduce((sum: number, review: Review) => sum + (review.likes || 0), 0);
      setTotalLikes(total);
    } catch (error) {
      // 靜默處理錯誤，不影響用戶體驗
      if (import.meta.env.DEV) {
        console.error('加载评论失败:', error);
      }
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // 加载评论和收藏状态
  // 優化：如果 visibleReviewCount 為 0（guest 用戶），不載入評論，提升性能
  // 注意：只保留一個 useEffect，避免重複請求
  // 只有當卡片進入視圖 (isVisible) 時才載入數據
  useEffect(() => {
    if (!isVisible) return;

    // 只有在需要顯示評論時才載入（visibleReviewCount > 0 或 'all'）
    if (visibleReviewCount !== 0) {
      loadReviews();
    } else {
      // guest 用戶不需要載入評論，直接設置為已載入狀態
      setIsLoadingReviews(false);
    }
    if (isAuthenticated && user?.role === 'client') {
      checkFavoriteStatus();
      checkBookingStatus();
    }
  }, [isVisible, profile.id, isAuthenticated, user?.role, visibleReviewCount]); // 增加 isVisible 依賴項

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || user?.role !== 'client') return;

    try {
      if (isFavorited) {
        await favoritesApi.remove(profile.id);
        setIsFavorited(false);
      } else {
        await favoritesApi.add(profile.id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('收藏操作失敗:', error);
      alert('操作失敗，請稍後重試');
    }
  };

  // 根據權限顯示評論
  // 卡片只顯示1則評論，點擊卡片看全部
  const getVisibleReviews = (): Review[] => {
    if (userStatus === 'guest') return [];
    // 卡片模式：只顯示1則評論
    if (visibleReviewCount === 1) {
      return reviews.slice(0, 1);
    }
    if (showAllReviews) return reviews; // 如果展開，顯示全部
    if (visibleReviewCount === 'all') return reviews;
    return reviews.slice(0, visibleReviewCount);
  };

  const visibleReviews = getVisibleReviews();
  // 卡片模式（visibleReviewCount === 1）：如果有評論就顯示「查看完整評論」按鈕
  // 其他模式：如果有更多評論才顯示
  const hasMoreReviews = visibleReviewCount === 1 
    ? reviews.length > 0 
    : reviews.length > 0 && (typeof visibleReviewCount === 'number' && reviews.length > visibleReviewCount && !showAllReviews);

  const handleReviewSubmit = () => {
    loadReviews();
  };

  return (
    <>
      <div 
        ref={cardRef}
        className="group cursor-pointer japanese-card-border premium-card-shadow elegant-hover relative bg-white rounded-2xl overflow-hidden"
      >
        {/* 小姐照片 - 固定尺寸避免 CLS */}
        <a
          href={`#profile-${profile.id}`}
          className="relative overflow-hidden block bg-gray-100"
          style={{ aspectRatio: '3 / 4' }}
          onClick={(e) => {
            e.preventDefault();
            onProfileClick?.();
          }}
        >
          <img 
            src={getImageUrl(profile.imageUrl)} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            loading="lazy"
            decoding="async"
            width={400}
            height={533}
            alt={profile.name}
          />
          
          {/* 收藏按钮 - 在照片右上角（仅限Client用户） */}
          {isAuthenticated && user?.role === 'client' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(e);
              }}
              className={`absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all hover:scale-110 ${
                isFavorited ? 'text-yellow-500' : 'text-gray-400'
              }`}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
          
          {/* 驗證勳章 - 只有特選魚市（有 userId）才顯示 */}
          {profile.userId && (
            <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
              {profile.isVip ? (
                <div 
                  className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  }}
                  title="佳麗驗證勳章（VIP）"
                >
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {/* 五瓣花朵圖標 */}
                    <path d="M12 2l2.5 7.5L22 10l-5.5 4.5L18 22l-6-4.5L6 22l1.5-7.5L2 10l7.5-.5L12 2z"/>
                  </svg>
                </div>
              ) : profile.providerEmailVerified ? (
                <span className="bg-blue-500/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg">
                  ✓ 已驗證
                </span>
              ) : null}
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent z-10">
            <div className="flex justify-between items-end text-white">
              <div>
                <h3 className="text-2xl font-serif font-black">{profile.name} {profile.nationality}</h3>
                <div className="flex gap-2 mt-2 opacity-80 font-bold" style={{ fontSize: '10px' }}>
                  <span>{profile.age}歲</span><span>{'|'}</span><span>{profile.cup}罩杯</span><span>{'|'}</span><span>{profile.location}</span>
                </div>
              </div>
              <div className="text-right">
                {/* 只有茶客才能看到價格 */}
                {isAuthenticated && user?.role === 'client' && (
                  <>
                    {/* 特選魚市（userId 存在）不顯示價格 */}
                    {!profile.userId && (
                      <PriceDisplay 
                        price={profile.price} 
                        prices={profile.prices}
                        type={profile.type}
                        showWarning={true}
                      />
                    )}
                    {/* 特選魚市：只有茶客才顯示「發送訊息查看價格」 */}
                    {profile.userId && (
                      <div className="text-white text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        發送訊息查看價格
                      </div>
                    )}
                  </>
                )}
                {/* 佳麗身份用戶不顯示任何價格相關資訊 */}
              </div>
            </div>
          </div>
        </a>

        {/* 照片下方信息区域：星级、爱心数、收藏数 - 固定高度避免 CLS */}
        <div className="p-4 border-b border-gray-100 min-h-[60px] flex items-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between w-full">
            {/* 左侧：星级评分 - 預留空間避免 CLS */}
            <div className="flex items-center gap-1 min-w-[80px]">
              {userStatus === 'guest' ? (
                <span className="text-xs text-gray-400">請登入查看評分</span>
              ) : averageRating > 0 ? (
                <>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="font-bold text-sm text-gray-700">{averageRating.toFixed(1)}</span>
                  {totalReviews > 0 && (
                    <span className="text-xs text-gray-500">({totalReviews})</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">尚無評分</span>
              )}
            </div>
            
            {/* 右侧：爱心数（点赞）和收藏数 - 預留空間避免 CLS */}
            <div className="flex items-center gap-4 min-w-[80px] justify-end">
              {/* 爱心数（点赞） */}
              <div className="flex items-center gap-1">
                {totalLikes > 0 && (
                  <>
                    <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-xs text-gray-600">{totalLikes}</span>
                  </>
                )}
              </div>
              
              {/* 收藏按钮（书签图标）- 照片下方信息区域 */}
              {isAuthenticated && user?.role === 'client' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(e);
                  }}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    isFavorited ? 'text-yellow-500' : 'text-gray-400'
                  } hover:text-yellow-500`}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-gray-300" title="登入後即可收藏">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 小姐信息和评论区域 */}
        <div className="p-4">
          {/* 聯絡方式 - 特選魚市和嚴選好茶都只顯示提示，不顯示聯絡方式 */}
          {profile.contactInfo && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  {isAuthenticated && user?.role === 'client' ? (
                    <>
                      約會品茶預約後即可查看聯絡方式
                    </>
                  ) : (
                    <>
                      登入並約會品茶預約後即可查看聯絡方式
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* 评论区域 - 固定最小高度避免 CLS */}
          <div className="border-t border-gray-200 pt-4 mt-4 min-h-[80px]">
            {/* 评论可见性提示 */}
            {userStatus === 'guest' ? (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 text-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoginClick?.();
                    }}
                    className="text-brand-green font-medium hover:underline"
                  >
                    登入
                  </button>
                  後即可查看評論
                </p>
              </div>
            ) : isLoadingReviews ? (
              <div className="text-center py-4 text-sm text-gray-500">載入評論中...</div>
            ) : visibleReviews.length > 0 ? (
              <div className="space-y-3 mb-3">
                {visibleReviews.map(review => (
                  <ReviewCard 
                    key={review.id} 
                    review={review}
                    canInteract={userStatus !== 'guest'}
                    onLikeChange={loadReviews}
                  />
                ))}
              </div>
            ) : userStatus !== 'guest' && (
              <div className="text-center py-4 text-sm text-gray-500">尚無評論</div>
            )}

            {/* 查看完整评论按钮（特選鮮魚页面）或写评论按钮 */}
            {/* 確保按鈕區域有固定高度，保持對齊一致 */}
            <div className="mt-3 min-h-[44px] flex items-center">
              {isAuthenticated ? (
                <>
                  {/* 特選鮮魚頁面：如果有評論或沒有評論，都顯示"查看完整評論"按鈕，點擊後進入詳情頁 */}
                  {visibleReviewCount === 1 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProfileClick?.();
                      }}
                      className="w-full py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                      style={{ backgroundColor: '#1a5f3f' }}
                    >
                      查看完整評論
                    </button>
                  ) : hasMoreReviews && !showAllReviews ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllReviews(true);
                      }}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      查看完整評論
                    </button>
                  ) : showAllReviews ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllReviews(false);
                      }}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      收起評論
                    </button>
                  ) : (
                    // 特選魚市：顯示「我要約會品茶」按鈕，打開預約系統
                    // 嚴選好茶：顯示「立即約會品茶諮詢」按鈕，直接導向官方 Line 連結
                    isFishMarket ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBookingModal(true);
                        }}
                        className="w-full py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                        style={{ backgroundColor: '#1a5f3f' }}
                      >
                        我要約會品茶
                      </button>
                    ) : (
                      <a
                        href={OFFICIAL_LINE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors text-center block"
                        style={{ backgroundColor: '#1a5f3f', textDecoration: 'none' }}
                      >
                        立即約會品茶諮詢
                      </a>
                    )
                  )}
                </>
              ) : (
                // 未登入時顯示空區域，保持高度一致
                <div className="w-full h-[44px]"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 评论模态框 */}
      {showReviewModal && (
        <ReviewModal
          profileId={profile.id}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* 預約模態框（僅特選魚市） */}
      {showBookingModal && isFishMarket && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          profile={profile}
          onSuccess={() => {
            setShowBookingModal(false);
            alert('約會品茶預約成功！請等待對方確認。');
            // 預約成功後重新檢查預約狀態（雖然還不是 accepted，但可以提示用戶）
            checkBookingStatus();
          }}
        />
      )}
    </>
  );
};
