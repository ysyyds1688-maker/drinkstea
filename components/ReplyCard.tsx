import React, { useState } from 'react';
import { ForumReply } from '../types';
import { forumApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { MembershipBadge } from './MembershipBadge';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerificationBadges } from './VerificationBadges';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { UserBadges } from './UserBadges';
import { UserProfileModal } from './UserProfileModal';
import { RichTextEditor } from './RichTextEditor';
import { formatText } from '../utils/textFormatter';

interface ReplyCardProps {
  reply: ForumReply;
  onReply?: (replyId: string) => void;
  onUpdate?: () => void;
  depth?: number;
  postId: string;
  isRulesPost?: boolean;
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, onReply, onUpdate, depth = 0, postId, isRulesPost = false }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reply.likesCount);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('請先登入');
      return;
    }

    try {
      const result = await forumApi.toggleLike('reply', reply.id);
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('點讚失敗:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const maxDepth = 3;
  const canReply = depth < maxDepth && isAuthenticated;

  return (
    <div className={`mb-3 sm:mb-4 ${depth > 0 ? 'ml-4 sm:ml-6 md:ml-8 border-l-2 border-gray-200 pl-2 sm:pl-3 md:pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (reply.userId && reply.userId.trim() !== '') {
                  // 發送導航事件到用戶個人頁面
                  window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
                    detail: { userId: reply.userId }
                  }));
                } else {
                  // 如果沒有userId，使用舊的modal方式
                  setShowUserModal(true);
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 md:gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="relative">
                {reply.avatarUrl ? (
                  <img
                    src={reply.avatarUrl}
                    alt={reply.userName || '用戶'}
                    className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover border ${
                      reply.emailVerified && reply.phoneVerified
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    }`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center border ${
                    reply.emailVerified && reply.phoneVerified
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {/* Email 驗證徽章 */}
                {reply.emailVerified && (
                  <EmailVerifiedBadge size="sm" />
                )}
              </div>
              <span className="font-medium text-gray-900 text-xs sm:text-sm">{reply.userName || '匿名用戶'}</span>
            </button>
            {reply.userRole === 'admin' && <AdminBadge size="sm" />}
            {reply.membershipLevel && (
              <MembershipBadge level={reply.membershipLevel} size="sm" showLabel={false} />
            )}
            {reply.isVip && <VipBadge size="sm" />}
            {reply.verificationBadges && reply.verificationBadges.length > 0 && (
              <VerificationBadges badges={reply.verificationBadges} size="sm" />
            )}
            {(reply.warningBadge || reply.noShowBadge) && (
              <UserBadges 
                user={{
                  id: reply.userId,
                  warningBadge: reply.warningBadge,
                  noShowBadge: reply.noShowBadge,
                  violationLevel: reply.violationLevel,
                } as any}
                size="sm"
              />
            )}
            <span className="text-[10px] sm:text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
          </div>
        </div>
        
        <div className="text-gray-700 mb-2 sm:mb-3 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
          {formatText(reply.content)}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs sm:text-sm ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs sm:text-sm">{likesCount}</span>
            </button>
            {canReply && (
              <button
                onClick={() => {
                  setIsReplying(!isReplying);
                  if (!isReplying && onReply) {
                    onReply(reply.id);
                  }
                }}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {isReplying ? '取消' : '回覆'}
              </button>
            )}
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('確定要刪除此回覆嗎？此操作無法復原。')) {
                  try {
                    await forumApi.deleteReply(reply.id);
                    alert('回覆已刪除');
                    if (onUpdate) {
                      onUpdate();
                    }
                  } catch (error: any) {
                    alert(error.message || '刪除失敗');
                  }
                }
              }}
              className="px-2 py-1 text-[10px] sm:text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="刪除回覆（管理員）"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline-block mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除
            </button>
          )}
        </div>

        {/* 回覆編輯器 */}
        {isReplying && isAuthenticated && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">回覆</span>
                <span className="text-xs sm:text-sm text-blue-600 font-semibold">
                  @{reply.userName || '匿名用戶'}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">
                {formatText(reply.content)}
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!replyContent.trim()) {
                alert('請輸入回覆內容');
                return;
              }

              setIsSubmitting(true);
              try {
                await forumApi.createReply(postId, {
                  content: replyContent,
                  parentReplyId: reply.id,
                });
                
                setReplyContent('');
                setIsReplying(false);
                if (onUpdate) {
                  onUpdate();
                }
              } catch (error: any) {
                alert(error.message || '回覆失敗');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <RichTextEditor
                value={replyContent}
                onChange={setReplyContent}
                rows={3}
                placeholder="輸入回覆內容..."
                className="mb-2 sm:mb-3"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 text-xs sm:text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  {isSubmitting ? '發佈中...' : '發佈回覆'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 嵌套回覆 */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="mt-4">
            {reply.replies.map(nestedReply => (
              <ReplyCard
                key={nestedReply.id}
                reply={nestedReply}
                onReply={onReply}
                onUpdate={onUpdate}
                depth={depth + 1}
                postId={postId}
                isRulesPost={isRulesPost}
              />
            ))}
          </div>
        )}
      </div>

      <UserProfileModal
        userId={reply.userId}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </div>
  );
};

export default ReplyCard;



