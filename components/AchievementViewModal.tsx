import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AchievementViewModalProps {
  achievementType: string;
  achievementName: string;
  achievementDescription?: string;
  unlockedAt?: string;
  onClose: () => void;
}

export const AchievementViewModal: React.FC<AchievementViewModalProps> = ({
  achievementType,
  achievementName,
  achievementDescription,
  unlockedAt,
  onClose,
}) => {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [imgError, setImgError] = useState(false);

  // 根據成就 type 獲取對應的 SVG 圖標路徑
  const getAchievementIconPath = (type: string, isProvider: boolean = false): string | null => {
    // 品茶客成就映射
    const clientAchievementIconMap: Record<string, { fileName: string; category: string }> = {
      'forum_first_post': { fileName: '初次獻帖.svg', category: '茶席互動' },
      'forum_active_writer': { fileName: '活躍作者.svg', category: '茶席互動' },
      'forum_popular_star': { fileName: '人望之星.svg', category: '茶席互動' },
      'forum_core_member': { fileName: '茶會核心.svg', category: '茶席互動' },
      'tea_first_booking': { fileName: '初嚐御茶.svg', category: '嚴選好茶' },
      'tea_regular_guest': { fileName: '御茶常客.svg', category: '嚴選好茶' },
      'tea_master_taster': { fileName: '品鑑達人.svg', category: '嚴選好茶' },
      'lady_first_booking': { fileName: '初次入席.svg', category: '特選魚市' },
      'lady_loyal_guest': { fileName: '專屬熟客.svg', category: '特選魚市' },
      'lady_royal_guest': { fileName: '茶王座上賓.svg', category: '特選魚市' },
      'loyalty_30_days': { fileName: '守席之人.svg', category: '茶客資歷' },
      'loyalty_180_days': { fileName: '老茶客.svg', category: '茶客資歷' },
      'loyalty_1_year': { fileName: '茶王舊識.svg', category: '茶客資歷' },
    };

    // 後宮佳麗成就映射
    const ladyAchievementIconMap: Record<string, { fileName: string; category: string }> = {
      // 服務資歷
      'lady_first_booking': { fileName: '初入宮廷.svg', category: '服務資歷' },
      'lady_newbie': { fileName: '服務新手.svg', category: '服務資歷' },
      'lady_stable': { fileName: '穩定服務.svg', category: '服務資歷' },
      'lady_veteran': { fileName: '資深服務.svg', category: '服務資歷' },
      'lady_master': { fileName: '服務大師.svg', category: '服務資歷' },
      'lady_veteran_achievement': { fileName: '資深佳麗.svg', category: '服務資歷' },
      'lady_gold_achievement': { fileName: '金牌佳麗.svg', category: '服務資歷' },
      
      // 服務品質
      'lady_first_good_review': { fileName: '初次好評.svg', category: '服務品質' },
      'lady_highly_rated': { fileName: '好評如潮.svg', category: '服務品質' },
      'lady_perfect': { fileName: '完美評價.svg', category: '服務品質' },
      'lady_quality_assured': { fileName: '品質保證.svg', category: '服務品質' },
      'lady_quality_service_achievement': { fileName: '優質服務.svg', category: '服務品質' },
      'lady_perfect_service_achievement': { fileName: '完美服務.svg', category: '服務品質' },
      
      // 客戶忠誠
      'lady_returning_client': { fileName: '回頭客.svg', category: '客戶忠誠' },
      'lady_regular_clients': { fileName: '熟客成群.svg', category: '客戶忠誠' },
      
      // 服務效率
      'lady_efficient': { fileName: '效率之星.svg', category: '服務效率' },
      'lady_punctual': { fileName: '準時達人.svg', category: '服務效率' },
      
      // 平台參與
      'lady_forum_newbie': { fileName: '論壇新人.svg', category: '平台參與' },
      'lady_active': { fileName: '活躍佳麗.svg', category: '平台參與' },
    };

    const mapping = isProvider 
      ? ladyAchievementIconMap[type] 
      : clientAchievementIconMap[type];
    
    if (!mapping) return null;

    // 後宮佳麗成就使用專用目錄，品茶客成就使用新目錄
    const basePath = isProvider 
      ? '/images/後宮佳麗/成就' 
      : '/images/品茶客/成就';
    
    return `${basePath}/${mapping.category}/${mapping.fileName}`;
  };

  const iconPath = getAchievementIconPath(achievementType, isProvider);

  // 點擊背景關閉
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESC 鍵關閉
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 標題列 */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{achievementName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6">
          <div className="flex flex-col items-center">
            {/* 成就圖片 */}
            <div className="mb-4 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
              {iconPath && !imgError ? (
                <img
                  src={iconPath}
                  alt={achievementName}
                  className="w-full h-full object-contain p-6"
                  loading="eager"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="text-6xl">{achievementName}</div>
              )}
            </div>

            {/* 成就資訊 */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{achievementName}</h3>
              {achievementDescription && (
                <p className="text-gray-600 text-sm mb-2">{achievementDescription}</p>
              )}
              {unlockedAt && (
                <p className="text-gray-500 text-xs mt-2">
                  獲得日期：{new Date(unlockedAt).toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            style={{ backgroundColor: '#1a5f3f' }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementViewModal;

