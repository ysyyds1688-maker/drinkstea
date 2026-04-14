import React, { useCallback } from 'react';

interface AboutTeaKingProps {
  onBack?: () => void;
  onNavigateToForum?: () => void;
  onNavigateToNews?: () => void;
}

export const AboutTeaKing: React.FC<AboutTeaKingProps> = ({ onBack, onNavigateToForum, onNavigateToNews }) => {
  // 優化 INP：使用 useCallback 緩存事件處理器
  const handleBack = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const handleForumClick = useCallback(() => {
    if (onNavigateToForum) {
      onNavigateToForum();
    } else {
      // 如果沒有提供導航函數，使用全局事件
      window.dispatchEvent(new CustomEvent('navigate-to-forum'));
    }
  }, [onNavigateToForum]);

  const handleNewsClick = useCallback(() => {
    if (onNavigateToNews) {
      onNavigateToNews();
    } else {
      // 如果沒有提供導航函數，使用全局事件
      window.dispatchEvent(new CustomEvent('navigate-to-news'));
    }
  }, [onNavigateToNews]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-16">
        {/* 茶王影片 Banner - 手機版與內容區域對齊，有圓角 */}
        <div className="relative mb-8 sm:mb-12 mt-8 sm:mt-12">
          {/* 返回按鈕（僅在非首頁時顯示）- 絕對定位在影片上方 */}
          {onBack && (
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-lg px-3 py-2 transition-colors text-sm sm:text-base"
              style={{ '--hover-color': '#1a5f3f' } as React.CSSProperties}
              aria-label="返回"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>
          )}

          {/* 茶王影片 Banner */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ 
            boxShadow: '0 20px 40px -12px rgba(26, 95, 63, 0.3)',
            aspectRatio: '21/9',
            minHeight: '200px'
          }}>
            <video
              src="/images/關於茶王/茶王影片.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              style={{ 
                objectPosition: 'center',
                minHeight: '200px'
              }}
              onError={(e) => {
                console.error('影片載入失敗:', e);
              }}
            >
              您的瀏覽器不支援影片播放。
            </video>
          </div>
        </div>

        {/* 標題區域 */}
        <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-brand-black mb-3 sm:mb-4">
            關於茶王
          </h1>
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-brand-green to-transparent" style={{ backgroundColor: '#1a5f3f' }}></div>
        </div>

        {/* 故事內容 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
          
          {/* 序章 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-brand-green rounded-full" style={{ backgroundColor: '#1a5f3f' }}></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-black">序章：茶王的起源</h2>
            </div>
            
            {/* 圖片 - 固定尺寸避免 CLS，去除白底 */}
            <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{ 
              boxShadow: '0 20px 40px -12px rgba(26, 95, 63, 0.3)',
              aspectRatio: '16/9'
            }}>
              <img
                src="/images/關於茶王/茶王與後宮佳麗.jpg"
                alt="茶王與後宮佳麗"
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center'
                }}
                loading="lazy"
                decoding="async"
                width={800}
                height={450}
              />
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base">
              <p className="text-lg sm:text-xl font-medium text-brand-black mb-4" style={{ color: '#1a5f3f' }}>
                在古老的東方皇朝，有一位傳奇的茶王，他統治著一個以「品茶」為核心的帝國。
              </p>
              <p>
                相傳在數百年前，當朝皇帝為了尋找世間最頂級的茶葉，派遣了無數使者遠赴各地。然而，真正懂得品茶之道的人，卻發現了比茶葉更珍貴的寶物——那些如茶般香醇、如茶般令人回味無窮的佳人。
              </p>
              <p>
                於是，一個以「茶」為名的神秘組織應運而生。他們將這些精心挑選的佳人稱為「嚴選好茶」，將那些由民間推薦的優秀者稱為「特選魚市」。這個組織的領袖，被尊稱為「茶王」。
              </p>
            </div>
          </section>

          {/* 皇朝體系 */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-brand-green rounded-full" style={{ backgroundColor: '#1a5f3f' }}></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-black">皇朝體系：等級與榮譽</h2>
            </div>
            
            {/* 圖片 - 固定尺寸避免 CLS，去除白底 */}
            <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{ 
              boxShadow: '0 20px 40px -12px rgba(26, 95, 63, 0.3)',
              aspectRatio: '16/9'
            }}>
              <img
                src="/images/關於茶王/皇朝體系：等級與榮譽.jpg"
                alt="皇朝體系：等級與榮譽"
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center'
                }}
                loading="lazy"
                decoding="async"
                width={800}
                height={450}
              />
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base">
              <p>
                在茶王的國度中，每一位品茶客都有著自己的身份與等級。從初入門的「茶客」，到精通茶道的「入門茶士」，再到受皇帝賞識的「御前茶士」，每一級都代表著對茶文化的理解與尊重。
              </p>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-4 sm:p-6 rounded-r-lg my-4 sm:my-6">
                <p className="font-semibold text-amber-900 mb-2">🏆 最高榮譽</p>
                <p className="text-amber-800">
                  只有那些真正懂得品茶、尊重茶文化、並在茶王國度中留下傳奇故事的品茶客，才能獲得「國師級茶官」的至高榮譽。這是茶王親自授予的最高等級，代表著無上的尊貴與信任。
                </p>
              </div>
              <p>
                同樣地，那些被稱為「後宮佳麗」的優秀服務者，也有著自己的晉升體系。從「初級佳麗」到「皇后級佳麗」，每一級都代表著專業、服務品質與客戶滿意度的提升。
              </p>
            </div>
          </section>

          {/* 御茶室 */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-brand-green rounded-full" style={{ backgroundColor: '#1a5f3f' }}></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-black">御茶室：茶王的會客廳</h2>
            </div>
            
            {/* 圖片 - 固定尺寸避免 CLS，去除白底 */}
            <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{ 
              boxShadow: '0 20px 40px -12px rgba(26, 95, 63, 0.3)',
              aspectRatio: '16/9'
            }}>
              <img
                src="/images/關於茶王/御茶室.jpg"
                alt="御茶室"
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center'
                }}
                loading="lazy"
                decoding="async"
                width={800}
                height={450}
              />
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base">
              <p>
                在茶王的皇宮中，有一處名為「御茶室」的聖地。這裡是品茶客們交流心得、分享經驗、討論茶文化的殿堂。每一位進入御茶室的品茶客，都能在這裡找到志同道合的茶友，分享彼此的品茶故事。
              </p>
              <p>
                御茶室分為多個版區：「嚴選好茶」專區展示著由茶王親自挑選的頂級茶品；「特選魚市」則是由民間推薦的優質選擇；「經驗分享」讓品茶客們分享真實的品茶體驗；「問題求助」則為新手提供指導與幫助。
              </p>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 sm:p-6 rounded-r-lg my-4 sm:my-6">
                <p className="font-semibold text-green-900 mb-2">📜 版規精神</p>
                <p className="text-green-800">
                  在御茶室中，每一位品茶客都必須遵守「尊重、誠信、分享」的三大原則。這裡不僅是交流的平台，更是培養品茶文化的搖籃。只有真正尊重茶文化、誠信分享經驗的品茶客，才能在御茶室中獲得認可與尊重。
                </p>
              </div>
            </div>
          </section>

          {/* 茶王的使命 */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-brand-green rounded-full" style={{ backgroundColor: '#1a5f3f' }}></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-black">茶王的使命</h2>
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base">
              <p>
                茶王不僅是一個稱號，更是一種責任。茶王的使命是：
              </p>
              <ul className="list-none space-y-3 my-4 sm:my-6">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: '#1a5f3f' }}>1</span>
                  <span><strong className="text-brand-black">嚴選品質：</strong>確保每一位「嚴選好茶」都經過嚴格篩選，品質有保障。</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: '#1a5f3f' }}>2</span>
                  <span><strong className="text-brand-black">建立信任：</strong>通過真實的評論與評分系統，讓每一位品茶客都能做出明智的選擇。</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: '#1a5f3f' }}>3</span>
                  <span><strong className="text-brand-black">傳承文化：</strong>將品茶文化傳承下去，讓更多人了解並尊重這門古老的藝術。</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: '#1a5f3f' }}>4</span>
                  <span><strong className="text-brand-black">保護隱私：</strong>確保每一位參與者的隱私與安全，建立一個安全、可信的平台。</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 現代傳承 */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-brand-green rounded-full" style={{ backgroundColor: '#1a5f3f' }}></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-black">現代傳承：數位時代的茶王</h2>
            </div>
            
            {/* 圖片 - 固定尺寸避免 CLS，去除白底 */}
            <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{ 
              boxShadow: '0 20px 40px -12px rgba(26, 95, 63, 0.3)',
              aspectRatio: '16/9'
            }}>
              <img
                src="/images/tea_king_jp_4cs6eng0g.jpg"
                alt="茶王"
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center'
                }}
                loading="lazy"
                decoding="async"
                width={800}
                height={450}
              />
            </div>

            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-sm sm:text-base">
              <p>
                時至今日，茶王的傳統已經傳承到了數位時代。這個平台延續了古老皇朝的精神，將「品茶」文化帶入了現代社會。
              </p>
              <p>
                在這裡，每一位品茶客都可以：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 sm:my-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                      <img
                        src="/images/關於茶王/瀏覽嚴選好茶.svg"
                        alt="瀏覽嚴選好茶"
                        className="w-full h-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                      />
                    </div>
                    <h4 className="font-semibold text-brand-black">瀏覽嚴選好茶</h4>
                  </div>
                  <p className="text-sm text-gray-600">探索由茶王親自挑選的頂級茶品</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                      <img
                        src="/images/關於茶王/參與御茶室.svg"
                        alt="參與御茶室"
                        className="w-full h-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                      />
                    </div>
                    <h4 className="font-semibold text-brand-black">參與御茶室</h4>
                  </div>
                  <p className="text-sm text-gray-600">與其他品茶客交流心得與經驗</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                      <img
                        src="/images/關於茶王/累積經驗值.svg"
                        alt="累積經驗值"
                        className="w-full h-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                      />
                    </div>
                    <h4 className="font-semibold text-brand-black">累積經驗值</h4>
                  </div>
                  <p className="text-sm text-gray-600">通過參與活動提升會員等級</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                      <img
                        src="/images/關於茶王/獲得勳章.svg"
                        alt="獲得勳章"
                        className="w-full h-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={40}
                      />
                    </div>
                    <h4 className="font-semibold text-brand-black">獲得勳章</h4>
                  </div>
                  <p className="text-sm text-gray-600">完成任務與成就，獲得專屬勳章</p>
                </div>
              </div>
            </div>
          </section>

          {/* 結語 */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-brand-green/10 to-green-50 border-2 border-brand-green/20 p-6 sm:p-8 rounded-xl text-center" style={{ 
              backgroundColor: 'rgba(26, 95, 63, 0.05)',
              borderColor: 'rgba(26, 95, 63, 0.2)'
            }}>
              {/* 旗幟圖片 - 固定尺寸避免 CLS，去除白底 */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="w-full max-w-md aspect-[3/2] rounded-lg flex items-center justify-center">
                  <img
                    src="/images/關於茶王/旗幟.png"
                    alt="旗幟"
                    className="max-w-full max-h-full object-contain"
                    style={{ 
                      border: 'none',
                      outline: 'none'
                    }}
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={400}
                  />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-black mb-3" style={{ color: '#1a5f3f' }}>
                歡迎來到茶王的國度
              </h3>
              <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
                這裡不僅是一個平台，更是一個傳承千年的文化。每一位品茶客都是這個皇朝的一份子，每一位「嚴選好茶」和「特選魚市」都是這個國度的珍寶。
              </p>
              <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto mt-4 font-medium">
                讓我們一起，在這個數位時代的茶王國度中，繼續書寫屬於我們的傳奇故事。
              </p>
              
              {/* 導航按鈕 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 sm:mt-8">
                <button
                  onClick={handleForumClick}
                  className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  御茶室
                </button>
                <button
                  onClick={handleNewsClick}
                  className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  御前茶訊
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* 頁腳裝飾 */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
            <span>一本道品茶，只為懂茶的你</span>
            <span>•</span>
            <span>茶王 © 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTeaKing;

