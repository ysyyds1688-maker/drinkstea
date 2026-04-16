import React, { useEffect, useState } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: 'provider' | 'client' | 'admin';
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userName, userRole }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      // 延遲顯示動畫
      setTimeout(() => setIsVisible(true), 100);
      setTimeout(() => setTextVisible(true), 400);
      setTimeout(() => setSubtitleVisible(true), 800);
      setTimeout(() => setButtonVisible(true), 1200);
    } else {
      setIsVisible(false);
      setTextVisible(false);
      setSubtitleVisible(false);
      setButtonVisible(false);
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 根據用戶角色顯示不同的歡迎訊息
  const getWelcomeMessage = () => {
    const name = userName || '新朋友';
    
    if (userRole === 'provider') {
      return {
        title: `歡迎，${name}！`,
        subtitle: '來到茶王的國度',
        description: '您已成為後宮佳麗的一員，開始您的美好旅程吧！',
      };
    } else if (userRole === 'client') {
      return {
        title: `歡迎，${name}！`,
        subtitle: '來到茶王的國度',
        description: '開始探索精彩的品茶之旅，發現更多美好體驗！',
      };
    } else {
      return {
        title: `歡迎，${name}！`,
        subtitle: '來到茶王的國度',
        description: '感謝您的加入，祝您在這裡度過愉快的時光！',
      };
    }
  };

  const message = getWelcomeMessage();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          opacity: isVisible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景裝飾 */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: 'linear-gradient(90deg, #1a5f3f 0%, #15803d 50%, #1a5f3f 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
          
          .welcome-title {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .welcome-subtitle {
            animation: fadeInUp 0.6s ease-out 0.2s both;
          }
          
          .welcome-description {
            animation: fadeIn 0.8s ease-out 0.4s both;
          }
          
          .welcome-button {
            animation: fadeInUp 0.5s ease-out 0.6s both;
          }
          
          .tea-icon {
            animation: float 3s ease-in-out infinite;
          }
          
          .sparkle {
            animation: sparkle 1.5s ease-in-out infinite;
          }
        `}</style>

        {/* 內容 */}
        <div className="p-8 pt-12 text-center relative">
          {/* 裝飾圖標 - 茶葉 */}
          <div className="mb-6 tea-icon">
            <div className="relative inline-block">
              <div
                className="text-6xl mb-2"
                style={{
                  background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 4px 6px rgba(26, 95, 63, 0.3))',
                }}
              >
                🍵
              </div>
              
              {/* 閃爍效果 */}
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                <span className="sparkle text-2xl" style={{ animationDelay: '0s' }}>✨</span>
                <span className="sparkle text-xl" style={{ animationDelay: '0.5s' }}>✨</span>
                <span className="sparkle text-lg" style={{ animationDelay: '1s' }}>✨</span>
              </div>
            </div>
          </div>

          {/* 標題 */}
          <h2
            className={`text-3xl font-black mb-4 welcome-title ${
              textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              transition: 'all 0.6s ease-out',
              color: '#1a5f3f',
              textShadow: '0 2px 4px rgba(26, 95, 63, 0.2)',
            }}
          >
            {message.title}
          </h2>

          {/* 副標題 */}
          <p
            className={`text-xl font-bold mb-6 welcome-subtitle ${
              subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              transition: 'all 0.6s ease-out 0.2s',
              background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {message.subtitle}
          </p>

          {/* 描述 */}
          <p
            className={`text-gray-600 mb-8 welcome-description ${
              subtitleVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transition: 'opacity 0.8s ease-out 0.4s',
              lineHeight: '1.8',
            }}
          >
            {message.description}
          </p>

          {step === 1 ? (
            /* Step 1: 歡迎 → 下一步 */
            <button
              className={`welcome-button ${buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              onClick={() => setStep(2)}
              style={{
                transition: 'all 0.5s ease-out 0.6s',
                padding: '0.875rem 2.5rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: 'white',
                background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)',
                boxShadow: '0 4px 6px -1px rgba(26, 95, 63, 0.3), 0 2px 4px -1px rgba(26, 95, 63, 0.2)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              下一步
            </button>
          ) : (
            /* Step 2: TG 綁定提醒 */
            <div className="text-left space-y-4 welcome-description">
              <h3 className="text-lg font-bold text-center" style={{ color: '#1a5f3f' }}>
                綁定 Telegram，解鎖更多功能
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  收藏的小姐自動同步到 TG Bot
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  忘記密碼時可從 TG 直接重設
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  新上架小姐第一時間 TG 通知
                </li>
              </ul>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('navigate-to-profile-tab'));
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)' }}
                >
                  前往綁定
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 text-sm border border-gray-200 hover:bg-gray-50"
                >
                  稍後再說
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部裝飾線 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #1a5f3f 50%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
};


