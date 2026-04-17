import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

// 通知後端「已完成導覽」— 下次登入不再顯示
async function markOnboardingDone() {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Api-Key': 'tk-api-2026-secret',
      },
    });
  } catch {
    // 失敗不影響關閉
  }
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: 'provider' | 'client' | 'admin';
  isManualOpen?: boolean; // 手動開啟（茶客檔案裡點的）→ 不標記完成
}

interface Step {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  highlights?: string[];
  action?: { label: string; onClick: () => void; primary?: boolean };
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userName, userRole, isManualOpen = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 50);
      setStep(0);
    } else {
      setIsVisible(false);
      setStep(0);
    }
  }, [isOpen]);

  // 切換步驟時重新觸發動畫
  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [step]);

  if (!isOpen) return null;

  const name = userName || '新朋友';

  // 為不同角色量身訂做步驟
  const isProvider = userRole === 'provider';

  const steps: Step[] = isProvider
    ? [
        // === 後宮佳麗專屬導覽 ===
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.5 7.5L22 10l-5.5 4.5L18 22l-6-4.5L6 22l1.5-7.5L2 10l7.5-.5L12 2z" />
            </svg>
          ),
          title: `${name}，歡迎加入`,
          subtitle: '茶王後宮佳麗',
          description: '在這裡你可以上架個人檔案，管理預約，累積評價與成就徽章',
        },
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          title: '上架與管理檔案',
          subtitle: '從佳麗檔案開始',
          description: '點右上角頭像 → 佳麗檔案 → 編輯，填寫個人資料、價格、服務項目',
          highlights: ['照片上傳支援多張相簿', '服務項目可自訂', '預約請求即時通知'],
        },
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          title: '累積好評與等級',
          subtitle: '評價決定曝光',
          description: '每次被評論都會累積積分與經驗值，等級越高，檔案排序越前面',
          highlights: ['5 星好評曝光加成', '連續好評解鎖專屬成就', '完成預約自動提升等級'],
        },
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
          title: '綁定 Telegram',
          subtitle: '接收即時預約通知',
          description: '綁定後可透過 TG 收到預約提醒、忘記密碼時也能直接重設',
        },
      ]
    : [
        // === 茶客（品茶客 / admin）導覽 ===
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h12a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V11a2 2 0 012-2zM6 9V7a3 3 0 013-3h6a3 3 0 013 3v2M10 13v4M14 13v4" />
            </svg>
          ),
          title: `${name}，歡迎`,
          subtitle: '茶王・一本道品茶',
          description: '我們精選優質茶茶，接下來 30 秒帶你熟悉平台核心功能',
        },
        {
          icon: (
            <div className="flex gap-3">
              {/* 嚴選好茶 - 皇冠 icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)' }}>
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z" />
                </svg>
              </div>
              {/* 特選魚市 - 店鋪 icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16l-1.5 4.5a3 3 0 01-5.7 0 3 3 0 01-5.6 0 3 3 0 01-5.7 0L4 6zm2 6.5V20h12v-7.5M10 20v-5h4v5" />
                </svg>
              </div>
            </div>
          ),
          title: '兩大分類',
          subtitle: '嚴選好茶 vs 特選魚市',
          description: '依照你的需求挑選適合的茶茶',
          highlights: [
            '嚴選好茶：皇家精選，品質保證',
            '特選魚市：佳麗自營，直接聯繫',
          ],
        },
        {
          icon: (
            <svg className="w-16 h-16 text-pink-500 fill-current" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ),
          title: '收藏你喜歡的',
          subtitle: '點 ❤️ 加入我的最愛',
          description: '收藏後綁定 TG 可同步到 Bot 隨時查看資料卡',
          highlights: ['快速回訪不用翻找', '新上架第一時間推播', 'TG Bot 直接看資料卡'],
        },
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          title: '參考評論做決定',
          subtitle: '真實茶客留言',
          description: '會員等級越高能看到越多則評論，升級解鎖全部',
          highlights: ['1 級看 1 則、6 級看 6 則', '7 級以上查看全部', 'VIP 會員不限數量'],
        },
        {
          icon: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
          title: '綁定 Telegram',
          subtitle: '最後一步，解鎖全功能',
          description: '收藏同步、忘記密碼重設、新妹推播都靠它',
          highlights: ['收藏即時同步 TG Bot', '忘記密碼 TG 一鍵重設', '新上架第一時間通知'],
        },
      ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const isFirstStep = step === 0;

  // 關閉時標記（手動開啟的不標記，因為用戶只是複習）
  const finishAndClose = () => {
    if (!isManualOpen) {
      markOnboardingDone();
    }
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      finishAndClose();
      // 手動開啟的也不跳轉到 TG 綁定，只關閉 modal
      if (!isManualOpen) {
        window.dispatchEvent(new CustomEvent('navigate-to-profile-tab', { detail: { tab: 'profile', scrollTo: 'tg-bind' } }));
        window.dispatchEvent(new CustomEvent('user-profile-set-tab', { detail: { tab: 'profile' } }));
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    finishAndClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <style>{`
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .step-icon { animation: float 3s ease-in-out infinite; }
          .step-title { animation: slideInUp 0.4s ease-out both; }
          .step-subtitle { animation: slideInUp 0.4s ease-out 0.1s both; }
          .step-desc { animation: slideInUp 0.4s ease-out 0.2s both; }
          .step-highlight { animation: slideInUp 0.4s ease-out 0.3s both; }
          .step-button { animation: slideInUp 0.4s ease-out 0.4s both; }
        `}</style>

        {/* 頂部進度條 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((step + 1) / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, #1a5f3f 0%, #15803d 100%)',
            }}
          />
        </div>

        {/* 跳過按鈕 */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 px-3 py-1 z-10"
          >
            跳過導覽
          </button>
        )}

        {/* 內容 */}
        <div key={animKey} className="p-8 pt-12 text-center">
          {/* Icon */}
          <div className="mb-5 flex items-center justify-center step-icon" style={{ color: '#1a5f3f' }}>
            {currentStep.icon}
          </div>

          {/* 標題 */}
          <h2 className="text-2xl font-black mb-2 step-title" style={{ color: '#1a5f3f' }}>
            {currentStep.title}
          </h2>

          {/* 副標題 */}
          <p
            className="text-lg font-bold mb-4 step-subtitle"
            style={{
              background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {currentStep.subtitle}
          </p>

          {/* 描述 */}
          <p className="text-gray-600 text-sm mb-5 leading-relaxed step-desc">
            {currentStep.description}
          </p>

          {/* Highlights（重點） */}
          {currentStep.highlights && (
            <ul className="space-y-2 text-sm text-gray-700 mb-6 text-left bg-gray-50 rounded-xl p-4 step-highlight">
              {currentStep.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: '#1a5f3f' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* 步驟指示器（圓點） */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="transition-all"
                style={{
                  width: i === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === step ? '#1a5f3f' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={`步驟 ${i + 1}`}
              />
            ))}
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 step-button">
            {!isFirstStep && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
              >
                上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-[2] py-3 rounded-xl font-bold text-sm text-white transition"
              style={{
                background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)',
                boxShadow: '0 4px 10px -1px rgba(26, 95, 63, 0.4)',
              }}
            >
              {isLastStep ? '前往綁定 TG' : '下一步'}
            </button>
          </div>

          {/* 跳過綁定（最後一步才出現） */}
          {isLastStep && (
            <button
              onClick={handleSkip}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600"
            >
              稍後再說
            </button>
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
