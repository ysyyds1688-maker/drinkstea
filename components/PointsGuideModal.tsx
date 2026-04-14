import React from 'react';

interface PointsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointsGuideModal: React.FC<PointsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const pointsMethods = [
    { action: '每日登入', points: 10, experience: 0, description: '每天登入網站' },
    { action: '發表茶帖', points: 20, experience: 20, description: '在御茶室發表茶帖' },
    { action: '回覆茶帖', points: 0, experience: 8, description: '回覆其他用戶發的茶帖（版規茶帖後續回覆不獲得經驗值）' },
    { action: '版規簽到', points: 20, experience: 15, description: '首次在版規茶帖下簽到（僅首次簽到有獎勵）' },
    { action: '點讚內容', points: 5, experience: 0, description: '點讚茶帖/回覆（每日任務：點讚5次獲得25積分）' },
    { action: '完成預約', points: 50, experience: 30, description: '完成一次預約' },
    { action: '發表評論', points: 15, experience: 10, description: '發表評論' },
    { action: '驗證郵箱', points: 20, experience: 10, description: '完成郵箱驗證' },
    { action: '驗證手機', points: 20, experience: 10, description: '完成手機驗證' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">獲取經驗值與積分方法</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
            <h3 className="font-bold text-gray-900 mb-2 text-lg">📊 積分與經驗值說明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="font-semibold text-green-700 mb-1">💰 積分用途</p>
                <p className="text-gray-700">用於兌換勳章、解鎖特殊功能</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="font-semibold text-blue-700 mb-1">⭐ 經驗值用途</p>
                <p className="text-gray-700">用於提升會員等級，解鎖更多權益</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">獲取方式</h3>
            {pointsMethods.map((method, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-24 text-center">
                  {method.points > 0 && (
                    <div className="mb-2">
                      <span className="text-xl font-bold text-green-600">+{method.points}</span>
                      <p className="text-xs text-gray-500">積分</p>
                    </div>
                  )}
                  {method.experience > 0 && (
                    <div>
                      <span className="text-xl font-bold text-blue-600">+{method.experience}</span>
                      <p className="text-xs text-gray-500">經驗值</p>
                    </div>
                  )}
                  {method.points === 0 && method.experience === 0 && (
                    <div>
                      <span className="text-xs text-gray-400">無獎勵</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{method.action}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">💡 小貼士</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 每天完成所有每日任務可獲得約 85 積分和 50+ 經驗值</li>
              <li>• 積極參與御茶室討論可以獲得更多積分和經驗值</li>
              <li>• 發表優質內容獲得更多點讚，可以獲得更多積分</li>
              <li>• 經驗值達到門檻後會自動升級會員等級，解鎖更多權益</li>
              <li>• 版規茶帖只有首次簽到才有獎勵，後續回覆不獲得經驗值</li>
              <li>• 只有回覆其他用戶發的茶帖才會獲得經驗值</li>
            </ul>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90"
            style={{ backgroundColor: '#1a5f3f' }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointsGuideModal;



