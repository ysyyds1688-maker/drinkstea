import React, { useState } from 'react';

interface BadgeViewModalProps {
  badgeId: string;
  badgeName: string;
  badgeDescription?: string;
  unlockedAt?: string;
  onClose: () => void;
}

export const BadgeViewModal: React.FC<BadgeViewModalProps> = ({
  badgeId,
  badgeName,
  badgeDescription,
  unlockedAt,
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);

  // 根據 badge ID 獲取對應的 SVG 圖標路徑（根據 badgeId 判斷是品茶客還是後宮佳麗）
  const getBadgeIconPath = (badgeId: string): string => {
    const fileName = `${badgeId}.svg`;
    // 如果 badgeId 以 lady_ 開頭，使用後宮佳麗路徑，否則使用品茶客路徑
    const basePath = badgeId.startsWith('lady_')
      ? '/images/後宮佳麗/勳章'
      : '/images/品茶客/勳章';
    return `${basePath}/${fileName}`;
  };

  const iconPath = getBadgeIconPath(badgeId);

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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{badgeName}</h2>
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
            {/* 勳章圖片 */}
            <div className="mb-4 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
              {imgError ? (
                <svg className="w-48 h-48 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <img
                  src={iconPath}
                  alt={badgeName}
                  className="w-full h-full object-contain p-6"
                  loading="eager"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            {/* 勳章資訊 */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{badgeName}</h3>
              {badgeDescription && (
                <p className="text-gray-600 text-sm mb-2">{badgeDescription}</p>
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

export default BadgeViewModal;

