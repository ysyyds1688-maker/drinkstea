import React, { useState } from 'react';
import { bookingApi, reviewsApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface ClientReviewModalProps {
  bookingId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export const ClientReviewModal: React.FC<ClientReviewModalProps> = ({ 
  bookingId, 
  clientId,
  clientName, 
  onClose, 
  onSubmit 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // 創建佳麗對茶客的評論
      await reviewsApi.createClientReview(clientId, {
        rating,
        comment: comment.trim(),
        bookingId,
      });
      
      // 更新預約的評論狀態（後端會根據用戶角色自動判斷是 client 還是 provider）
      await bookingApi.updateReviewStatus(bookingId, true);
      
      // 等待父組件更新狀態完成後再關閉
      await onSubmit();
      onClose();
    } catch (err: any) {
      console.error('提交評論失敗:', err);
      setError(err.message || '提交評論失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">評論茶客</h3>
        <p className="text-sm text-gray-600 mb-4">您正在評論：{clientName}</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* 评分选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">評分 *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <svg
                    className="w-8 h-8"
                    fill={star <= rating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* 评论内容 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">評論內容 *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="分享您對這位茶客的評價..."
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

