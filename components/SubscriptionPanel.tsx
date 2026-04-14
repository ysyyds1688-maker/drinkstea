import React, { useState, useEffect } from 'react';
import { SubscriptionStatus, SubscriptionHistory } from '../types';
import { subscriptionsApi } from '../services/apiService';
import { VipBadge } from './VipBadge';
import { useAuth } from '../contexts/AuthContext';

export const SubscriptionPanel: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const vipDuration = 365; // VIP訂閱固定為一年
  const [showVipBenefitsModal, setShowVipBenefitsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 監聽 email 驗證完成事件，確保驗證狀態更新後立即響應
  useEffect(() => {
    const handleEmailVerified = () => {
      // 當用戶完成 email 驗證時，組件會自動重新渲染（因為 user 狀態更新）
      // 這裡不需要額外操作，React 會自動處理
    };
    
    window.addEventListener('user-email-verified', handleEmailVerified);
    return () => {
      window.removeEventListener('user-email-verified', handleEmailVerified);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, historyData] = await Promise.all([
        subscriptionsApi.getMy(),
        subscriptionsApi.getHistory(),
      ]);
      setStatus(statusData);
      setHistory(historyData);
    } catch (error) {
      console.error('載入訂閱資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // 檢查驗證狀態（只需要Email驗證）
    if (!user?.emailVerified) {
      alert(`購買VIP前，請先完成Email驗證。\n\n請前往個人資料頁面完成驗證。`);
      return;
    }
    
    try {
      await subscriptionsApi.subscribe('tea_scholar', vipDuration); // VIP訂閱固定為一年（365天）
      alert('訂閱成功！您已獲得VIP頭銜，有效期為一年。');
      await loadData();
      await refreshUser?.();
    } catch (error: any) {
      alert('訂閱失敗：' + (error.message || '未知錯誤'));
    }
  };

  const handleCancel = async () => {
    if (!confirm('確定要取消VIP訂閱嗎？取消後VIP頭銜將消失。')) return;
    try {
      await subscriptionsApi.cancel();
      alert('訂閱已取消');
      await loadData();
      await refreshUser?.();
    } catch (error: any) {
      alert('取消訂閱失敗：' + (error.message || '未知錯誤'));
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  if (!status) {
    return <div className="text-center py-8">無法載入訂閱資訊</div>;
  }

  const isVipActive = status.isActive && status.membershipExpiresAt;

  return (
    <div className="space-y-6">
      {/* 重要說明 */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-yellow-900">關於御選資格</h3>
                  <button
                    onClick={() => setShowVipBenefitsModal(true)}
                    className="flex-shrink-0 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm whitespace-nowrap w-full sm:w-auto"
                  >
                    查看VIP權益詳情
                  </button>
                </div>
                <p className="text-sm text-yellow-800 mb-3 leading-relaxed">
                  <strong>御選資格（VIP訂閱）可額外獲得VIP頭銜並享有VIP專屬權益。</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">購買VIP訂閱後，您的個人資料將顯示VIP頭銜標識</span>
                  </div>
                  <div className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">VIP訂閱可額外獲得VIP專屬權益，與會員等級（茶客位階）的權益不同</span>
                  </div>
                  <div className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">會員等級通過完成任務獲得經驗值免費升級，請前往「積分與任務」頁面查看</span>
                  </div>
                  <div className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">VIP權益與會員等級權益可同時享有，互不衝突</span>
                  </div>
                  <div className="text-sm text-yellow-800 flex items-start gap-2 sm:col-span-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">訂閱到期後，VIP頭銜和VIP權益將消失，但您的會員等級不受影響</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 當前VIP狀態 */}
      <div className="bg-white rounded-lg shadow-lg border-2 p-4 sm:p-6" style={{ borderColor: isVipActive ? '#fbbf24' : '#e5e7eb' }}>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">當前VIP狀態</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {isVipActive ? (
              <>
                <VipBadge size="lg" />
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold whitespace-nowrap">
                  VIP 訂閱中
                </span>
              </>
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium whitespace-nowrap">
                尚未訂閱VIP
              </span>
            )}
          </div>
          {isVipActive && status.membershipExpiresAt && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-xs text-gray-500 whitespace-nowrap">VIP到期時間</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  {new Date(status.membershipExpiresAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
        {isVipActive && (
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            取消VIP訂閱
          </button>
        )}
      </div>

      {/* 訂閱VIP */}
      {!isVipActive && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">訂閱VIP</h2>
          <div className="mb-6 space-y-3">
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 leading-relaxed">
                <strong>💡 提示：</strong>訂閱VIP後，您將獲得VIP頭銜顯示在個人資料中，並享有所有VIP專屬權益。VIP訂閱有效期為一年（365天）。
              </p>
            </div>
            {!user?.emailVerified && (
              <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-sm text-red-800 leading-relaxed font-bold mb-2">
                  ⚠️ 購買VIP前需要完成Email驗證
                </p>
                <div className="space-y-1 text-sm text-red-700">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Email 未驗證</span>
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  請前往「個人資料」頁面完成Email驗證後再購買VIP。
                </p>
              </div>
            )}
            {user?.emailVerified && (
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 leading-relaxed">
                  ✓ 您已完成 Email 驗證，可以購買VIP。
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4 max-w-md">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-yellow-900">VIP年費訂閱</h3>
                  <p className="text-sm text-yellow-700 mt-1">一次性訂閱一年，享受完整VIP權益</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">365天</p>
                  <p className="text-xs text-yellow-600">有效期</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-yellow-800">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="leading-relaxed">VIP專屬標識和頭銜</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="leading-relaxed">20項VIP專屬權益</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="leading-relaxed">一年內無限次使用</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={!user?.emailVerified}
              className={`w-full px-6 py-3 rounded-lg transition-all font-bold text-lg shadow-md ${
                !user?.emailVerified
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 hover:from-yellow-500 hover:to-yellow-700'
              }`}
            >
              立即訂閱VIP（一年）
            </button>
          </div>
        </div>
      )}

      {/* 訂閱歷史 */}
      {history && history.history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">訂閱歷史</h2>
          <div className="space-y-3">
            {history.history.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <VipBadge size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(sub.startedAt).toLocaleDateString('zh-TW')} -{' '}
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('zh-TW') : '無限期'}
                    </p>
                    {sub.expiresAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(sub.expiresAt) > new Date() ? '已過期' : '進行中'}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  sub.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {sub.isActive ? '活躍' : '已過期'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIP權益說明彈窗 */}
      {showVipBenefitsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowVipBenefitsModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">VIP專屬權益說明</h2>
                <button
                  onClick={() => setShowVipBenefitsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 說明：</strong>VIP權益與會員等級權益不同，是通過付費訂閱立即獲得的專屬權益。VIP權益專注於服務便利性、特殊福利和身份展示，與會員等級的功能性權益互補，可同時享有。所有VIP權益均為線上服務，不涉及任何線下活動。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getVipBenefits().map((benefit, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">{benefit.name}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>✨ 提示：</strong>訂閱VIP後，所有VIP權益將立即生效，無需等待或累積經驗值。訂閱到期後，VIP權益將暫停，但您可以隨時續訂繼續享受。首次購買VIP還可額外獲得500經驗值和1000積分獎勵。
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowVipBenefitsModal(false)}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// VIP權益定義
const getVipBenefits = (): Array<{ name: string; description: string }> => {
  return [
    {
      name: 'VIP專屬標識',
      description: '在個人資料、論壇茶帖、評論等所有公開顯示的地方，都會顯示醒目的VIP金色標識，彰顯您的尊貴身份。'
    },
    {
      name: '新茶上架優先通知',
      description: '當有新的嚴選好茶或特選魚市上架時，您會第一時間收到推送通知，不錯過任何新資訊。'
    },
    {
      name: '約會24小時保障',
      description: '約會申請後24小時內必定得到回覆，不會讓您等待過久，享受更高效的約會體驗。'
    },
    {
      name: 'VIP專屬客服通道',
      description: '專屬的VIP客服通道，問題處理速度更快，平均回應時間在5分鐘內，享受最快速的服務支援。'
    },
    {
      name: '收藏夾無限容量',
      description: 'VIP會員收藏夾沒有數量限制，可以收藏任意數量的嚴選好茶和特選魚市，建立您的專屬收藏庫。非VIP會員則根據會員等級有數量限制。'
    },
    {
      name: '約會快速通道',
      description: '約會流程簡化，跳過部分驗證步驟，讓您更快完成約會申請，節省寶貴時間。'
    },
    {
      name: 'VIP專屬標籤',
      description: '在個人資料和論壇中顯示「VIP」專屬標籤，讓其他用戶一眼就能認出您的VIP身份。'
    },
    {
      name: '完整資料查看權限',
      description: '可以查看嚴選好茶的完整詳細資料，包括更多照片、評價詳情等，無任何限制。'
    },
    {
      name: '評論查看無限制',
      description: '可以查看所有評論內容，不受會員等級限制，完整了解其他用戶的體驗分享。'
    },
    {
      name: '約會次數上限提升',
      description: '根據會員等級，每月約會次數上限會相應提升，讓您有更多選擇機會。'
    }
  ];
};

export default SubscriptionPanel;

