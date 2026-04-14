import React, { useState, useEffect } from 'react';
import { Review, Profile } from '../types';
import { reviewsApi, profilesApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface ReviewModalProps {
  profileId: string;
  onClose: () => void;
  onSubmit: () => void;
}

// 服務類型標籤映射
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

export const ReviewModal: React.FC<ReviewModalProps> = ({ profileId, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [serviceType, setServiceType] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<Array<{ value: string; label: string }>>([]);

  // 載入 profile 資料以獲取可用的服務類型
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await profilesApi.getById(profileId);
        setProfile(profileData);
        
        // 根據 profile 的 prices 動態生成服務類型選項
        const serviceTypes: Array<{ value: string; label: string }> = [];
        
        if (profileData.prices) {
          // 檢查各種服務類型是否存在（只要存在就顯示，不限制價格）
          // 因為即使價格為 0 或 -1（私訊詢問），用戶仍可能選擇該服務類型進行評論
          if (profileData.prices.oneShot) {
            serviceTypes.push({ 
              value: 'oneShot', 
              label: profileData.prices.oneShot.desc || getServiceTypeLabel('oneShot') 
            });
          }
          if (profileData.prices.twoShot) {
            serviceTypes.push({ 
              value: 'twoShot', 
              label: profileData.prices.twoShot.desc || getServiceTypeLabel('twoShot') 
            });
          }
          if (profileData.prices.threeShot) {
            serviceTypes.push({ 
              value: 'threeShot', 
              label: profileData.prices.threeShot.desc || getServiceTypeLabel('threeShot') 
            });
          }
          if (profileData.prices.overnight) {
            serviceTypes.push({ 
              value: 'overnight', 
              label: profileData.prices.overnight.desc || getServiceTypeLabel('overnight') 
            });
          }
          if (profileData.prices.dating) {
            serviceTypes.push({ 
              value: 'dating', 
              label: profileData.prices.dating.desc || getServiceTypeLabel('dating') 
            });
          }
          if (profileData.prices.escort) {
            serviceTypes.push({ 
              value: 'escort', 
              label: profileData.prices.escort.desc || getServiceTypeLabel('escort') 
            });
          }
          
          // 處理其他自定義服務類型
          Object.keys(profileData.prices).forEach(key => {
            if (!['oneShot', 'twoShot', 'threeShot', 'overnight', 'dating', 'escort'].includes(key)) {
              const service = profileData.prices[key];
              if (service) {
                serviceTypes.push({ 
                  value: key, 
                  label: service.desc || getServiceTypeLabel(key) || key 
                });
              }
            }
          });
        }
        
        setAvailableServiceTypes(serviceTypes);
      } catch (error) {
        console.error('載入 profile 資料失敗:', error);
        // 如果載入失敗，使用預設選項
        setAvailableServiceTypes([
          { value: 'oneShot', label: '一節' },
          { value: 'twoShot', label: '兩節' },
        ]);
      }
    };
    
    loadProfile();
  }, [profileId]);

  // 自动填充用户昵称（从个人资料中的昵称）
  useEffect(() => {
    if (user) {
      // 优先使用userName（个人资料中的昵称），如果没有则使用email或手机号
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
    setError(null);
    try {
      await reviewsApi.create(profileId, {
        rating,
        comment: comment.trim(),
        serviceType: serviceType || undefined,
        clientName: clientName.trim() || undefined,
      });
      
      onSubmit();
      onClose();
    } catch (err: any) {
      console.error('提交評論錯誤:', err);
      // 提供更詳細的錯誤訊息
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

          {/* 昵称（自动填充，锁定） */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">暱稱</label>
            <input
              type="text"
              value={clientName}
              readOnly
              disabled
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700"
              style={{ borderColor: '#1a5f3f' }}
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                已自動同步您的個人資料暱稱：{user.userName || user.email || user.phoneNumber}
              </p>
            )}
          </div>

          {/* 服务类型 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">服務類型（選填）</label>
            {availableServiceTypes.length > 0 ? (
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">請選擇</option>
                {availableServiceTypes.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                disabled
              >
                <option value="">載入中...</option>
              </select>
            )}
          </div>

          {/* 评论内容 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">評論內容 *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="分享你的體驗..."
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

