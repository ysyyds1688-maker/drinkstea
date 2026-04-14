import React, { useState } from 'react';
import { Review } from '../types';
import { reviewsApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';

interface ReviewCardProps {
  review: Review;
  canInteract: boolean;
  onLikeChange?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, canInteract, onLikeChange }) => {
  const [liked, setLiked] = useState(review.userLiked || false);
  const [likesCount, setLikesCount] = useState(review.likes);
  const [isLiking, setIsLiking] = useState(false);
  const { isAuthenticated } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const handleLike = async () => {
    if (!canInteract || !isAuthenticated || isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await reviewsApi.like(review.id);
      setLiked(response.liked);
      setLikesCount(prev => response.liked ? prev + 1 : prev - 1);
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {/* 评论头部 */}
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={() => {
            if (review.clientId && review.clientId.trim() !== '') {
              window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
                detail: { userId: review.clientId }
              }));
            }
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            {review.clientAvatarUrl ? (
              <img
                src={review.clientAvatarUrl}
                alt={review.clientName || '用戶頭像'}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 cursor-pointer"
                onError={(e) => {
                  // 如果頭像載入失敗，顯示預設頭像
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer';
                    fallback.textContent = review.clientName?.[0] || '匿';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                {review.clientName?.[0] || '匿'}
              </div>
            )}
            {/* Email 驗證徽章 */}
            {review.clientEmailVerified && (
              <EmailVerifiedBadge size="sm" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {review.clientName || '匿名用戶'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </button>
        
        {/* 评分 */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
              fill={i < review.rating ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ))}
        </div>
      </div>

      {/* 评论内容 */}
      <p className="text-sm text-gray-700 mb-2">{review.comment}</p>

      {/* 服务类型和验证标记 */}
      <div className="flex items-center gap-2 mb-2">
        {review.serviceType && (() => {
          const getServiceTypeLabel = (serviceType: string): string => {
            const serviceTypeMap: Record<string, string> = {
              'oneShot': '一節',
              'twoShot': '兩節',
              'threeShot': '三節',
              'overnight': '過夜',
              'dating': '約會',
              'escort': '伴遊',
            };
            return serviceTypeMap[serviceType] || serviceType;
          };
          return (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {getServiceTypeLabel(review.serviceType)}
            </span>
          );
        })()}
        {review.isVerified && (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
            ✓ 已验证
          </span>
        )}
      </div>

      {/* 互动按钮 - 点赞（爱心图标） */}
      {canInteract && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={handleLike}
            disabled={isLiking || !isAuthenticated}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'}`}
            title="按讚"
          >
            {/* 爱心图标（点赞） */}
            <svg
              className={`w-4 h-4 ${liked ? 'fill-current' : ''}`}
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likesCount}</span>
          </button>
        </div>
      )}

      {/* 回复 */}
      {review.replies && review.replies.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
          {review.replies.map(reply => (
            <div key={reply.id} className="text-xs text-gray-600 pl-4 border-l-2 border-gray-200">
              <span className="font-medium text-gray-700">
                {reply.replyType === 'provider' ? '後宮佳麗回覆：' : '管理員回覆：'}
              </span>
              <span>{reply.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

