import React, { useState, useEffect } from 'react';
import { Review, Profile } from '../types';
import { reviewsApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface ReviewModalProps {
  profileId: string;
  onClose: () => void;
  onSubmit: (newReview: Review) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ profileId, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  // 自動填充用戶暱稱
  useEffect(() => {
    if (user) {
      const displayName = user.userName || user.email || user.phoneNumber || '';
      if (displayName) {
        setClientName(displayName);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('請選擇評分');
      return;
    }

    if (!comment.trim()) {
      setError('請輸入評論內容');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await reviewsApi.create(profileId, {
        rating,
        comment: comment.trim(),
        clientName: clientName.trim() || undefined,
      });

      // 回傳新評論給父組件，即時顯示
      onSubmit(newReview);
      onClose();
    } catch (err: any) {
      console.error('提交評論錯誤:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('無法連接到伺服器，請檢查網路連接或稍後再試');
      } else if (err.message?.includes('401') || err.message?.includes('Token')) {
        setError('登入已過期，請重新登入');
      } else if (err.message?.includes('400')) {
        setError('請檢查評論內容是否正確');
      } else {
        setError(err.message || '提交評論失敗，請稍後再試');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', '很差', '不太好', '還行', '不錯', '非常好'];
  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">寫評論</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 評分選擇 */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">評分 *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125"
                >
                  <svg
                    className={`w-9 h-9 ${star <= displayRating ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill={star <= displayRating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-sm text-gray-500">{ratingLabels[displayRating]}</span>
              )}
            </div>
          </div>

          {/* 暱稱（自動填充，鎖定） */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">暱稱</label>
            <input
              type="text"
              value={clientName}
              readOnly
              disabled
              className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600 text-sm"
            />
          </div>

          {/* 評論內容 */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">評論內容 *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{ '--tw-ring-color': '#1a5f3f' } as React.CSSProperties}
              placeholder="分享你的體驗..."
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/500</div>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-bold"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="flex-1 py-2.5 text-white rounded-xl disabled:opacity-50 text-sm font-bold"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              {isSubmitting ? '提交中...' : '提交評論'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
