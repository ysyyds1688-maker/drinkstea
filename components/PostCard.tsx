import React, { useState } from 'react';
import { ForumPost } from '../types';
import { MembershipBadge } from './MembershipBadge';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerificationBadges } from './VerificationBadges';
import { UserProfileModal } from './UserProfileModal';
import { UserBadges } from './UserBadges';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { forumApi } from '../services/apiService';
import { formatText } from '../utils/textFormatter';

interface PostCardProps {
  post: ForumPost;
  onClick: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(post.favoritesCount || 0);

  // 將英文標籤映射為中文版塊名稱
  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'experience': '經驗分享',
      'question': '問題求助',
      'chat': '閒聊區',
      'general': '綜合討論',
      'announcement': '官方公告',
      'premium_tea': '嚴選好茶',
      'fish_market': '特選魚市',
      'booking': '預約交流',
      'lady_promotion': '佳麗御選名鑑',
    };
    return categoryMap[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.userId && post.userId.trim() !== '') {
      // 發送導航事件到用戶個人頁面
      window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
        detail: { userId: post.userId }
      }));
    } else {
      // 如果沒有userId，使用舊的modal方式
      setShowUserModal(true);
    }
  };

  // 複製到剪貼板
  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('連結已複製到剪貼板！');
    }).catch(err => {
      console.error('複製失敗:', err);
      // 降級方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('連結已複製到剪貼板！');
      } catch (err) {
        alert('複製失敗，請手動複製連結');
      }
      document.body.removeChild(textArea);
    });
  };

  // 分享茶帖
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    const title = post.title;
    const text = post.content || post.title;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url,
      }).catch(err => {
        console.log('分享失敗:', err);
        copyToClipboard(url, e);
      });
    } else {
      copyToClipboard(url, e);
    }
  };

  // 處理收藏
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('請先登入');
      return;
    }

    try {
      const result = await forumApi.toggleFavorite(post.id);
      setIsFavorited(result.favorited);
      setFavoritesCount(result.favorited ? favoritesCount + 1 : favoritesCount - 1);
    } catch (error: any) {
      alert(error.message || '操作失敗');
    }
  };

  // 獲取第一張圖片（如果有的話）
  const firstImage = post.images && post.images.length > 0 ? post.images[0] : null;

  // 檢查是否為版規茶帖
  const isRulesPost = post.id.startsWith('rules_');

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
        isRulesPost 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500' 
          : 'border-transparent hover:border-brand-green'
      }`}
      style={!isRulesPost && post.isPinned ? { borderLeftColor: '#fbbf24' } : undefined}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* 左側圖片（如果有） */}
        {firstImage && (
          <div className="flex-shrink-0 w-full sm:w-24 md:w-32 lg:w-40 h-40 sm:h-24 md:h-32 lg:h-40 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={firstImage}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // 如果圖片加載失敗，隱藏圖片容器
                (e.target as HTMLElement).parentElement?.classList.add('hidden');
              }}
            />
          </div>
        )}
        
        {/* 右側內容 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isRulesPost && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  版規
                </span>
              )}
              {post.isPinned && !isRulesPost && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                  置頂
                </span>
              )}
              {post.isFeatured && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                  精華
                </span>
              )}
              {post.isLocked && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  鎖定
                </span>
              )}
              {!isRulesPost && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {getCategoryLabel(post.category)}
                </span>
              )}
              {post.relatedProfileName && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {post.relatedProfileName}
                </span>
              )}
            </div>
            {/* 標籤 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>
                )}
              </div>
            )}
            <h3 className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 transition-colors line-clamp-2 ${
              isRulesPost 
                ? 'text-blue-700' 
                : 'text-gray-900 hover:text-brand-green'
            }`}>
              {post.title}
            </h3>
            <p className={`text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3 ${
              isRulesPost ? 'text-gray-700' : 'text-gray-600'
            }`}>
              {formatText(post.content)}
            </p>
          </div>
          
          {/* 底部統計信息 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 mt-auto w-full">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={handleUserClick}
                className="flex items-center gap-1 sm:gap-1.5 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  {post.avatarUrl ? (
                    <img
                      src={post.avatarUrl}
                      alt={post.userName || '用戶'}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border ${
                        post.emailVerified && post.phoneVerified
                          ? 'border-blue-500'
                          : 'border-gray-200'
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center border ${
                      post.emailVerified && post.phoneVerified
                        ? 'border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {/* Email 驗證徽章 */}
                  {post.emailVerified && (
                    <EmailVerifiedBadge size="sm" />
                  )}
                </div>
                <span className="font-medium text-xs sm:text-sm">{post.userName || '匿名用戶'}</span>
              </button>
              {post.userRole === 'admin' && <AdminBadge size="sm" />}
              {post.membershipLevel && (
                <MembershipBadge level={post.membershipLevel} size="sm" showLabel={false} />
              )}
              {post.isVip && <VipBadge size="sm" />}
              {post.verificationBadges && post.verificationBadges.length > 0 && (
                <VerificationBadges badges={post.verificationBadges} size="sm" />
              )}
              {(post.warningBadge || post.noShowBadge) && (
                <UserBadges 
                  user={{
                    id: post.userId,
                    warningBadge: post.warningBadge,
                    noShowBadge: post.noShowBadge,
                    violationLevel: post.violationLevel,
                  } as any}
                  size="sm"
                />
              )}
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
              <button
                onClick={handleShare}
                className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="分享茶帖"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('確定要刪除此茶帖嗎？此操作無法復原。')) {
                      try {
                        await forumApi.deletePost(post.id);
                        alert('茶帖已刪除');
                        window.location.reload();
                      } catch (error: any) {
                        alert(error.message || '刪除失敗');
                      }
                    }
                  }}
                  className="p-1 sm:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="刪除茶帖（管理員）"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <span className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.views}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.repliesCount}
              </span>
              <span className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-500">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {post.likesCount}
              </span>
              {isAuthenticated && !isRulesPost && (
                <button
                  onClick={handleFavorite}
                  className={`flex items-center gap-0.5 sm:gap-1 ${isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} transition-colors`}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {favoritesCount > 0 && <span className="text-xs sm:text-sm">{favoritesCount}</span>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal
        userId={post.userId}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </div>
  );
};

export default PostCard;



