import React, { useState, useEffect } from 'react';

interface AchievementNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'achievement' | 'levelUp' | 'reward';
  title: string;
  message: string;
  achievements?: Array<{ type: string; name: string; icon: string }>;
  newLevel?: string;
  rewards?: {
    points?: number;
    experience?: number;
  };
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  achievements = [],
  newLevel,
  rewards
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // 自動關閉：成就解鎖 5 秒，等級升級 6 秒，獎勵 4 秒
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 300); // 淡出動畫時間
      }, type === 'levelUp' ? 6000 : type === 'achievement' ? 5000 : 4000);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, type, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* 通知卡片 */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-500 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          animation: isAnimating ? 'slideInBounce 0.6s ease-out' : 'none',
        }}
      >
        {/* 頂部裝飾條 */}
        <div
          className={`h-2 ${
            type === 'levelUp'
              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500'
              : type === 'achievement'
              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}
        />

        <div className="p-6">
          {/* 圖標和標題 */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl ${
                type === 'levelUp'
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse'
                  : type === 'achievement'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                  : 'bg-gradient-to-br from-green-500 to-emerald-500'
              } shadow-lg`}
              style={{
                animation: type === 'levelUp' ? 'bounce 1s infinite' : 'none',
              }}
            >
              {type === 'levelUp' ? '🎉' : type === 'achievement' ? '🏆' : '✨'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>

          {/* 等級升級顯示 */}
          {type === 'levelUp' && newLevel && (
            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">新等級</p>
              <p className="text-3xl font-black text-orange-600">{newLevel}</p>
            </div>
          )}

          {/* 成就列表 */}
          {type === 'achievement' && achievements.length > 0 && (
            <div className="mb-4 space-y-2">
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.type}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                  style={{
                    animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{achievement.name}</p>
                    <p className="text-xs text-gray-500">成就已解鎖</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 獎勵顯示 */}
          {rewards && (rewards.points || rewards.experience) && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <p className="text-sm font-bold text-gray-700 mb-2">獲得獎勵</p>
              <div className="flex gap-4">
                {rewards.points && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="font-bold text-green-600">+{rewards.points} 積分</span>
                  </div>
                )}
                {rewards.experience && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span className="font-bold text-purple-600">+{rewards.experience} 經驗值</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 關閉按鈕 */}
          <button
            onClick={() => {
              setIsAnimating(false);
              setTimeout(() => {
                setIsVisible(false);
                onClose();
              }, 300);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl font-bold text-gray-700 transition-all duration-200 shadow-sm"
          >
            知道了
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInBounce {
          0% {
            transform: scale(0.8) translateY(-50px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(0);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          0% {
            transform: translateX(-20px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

