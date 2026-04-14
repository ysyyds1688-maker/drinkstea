import React from 'react';

interface NotFoundProps {
  onBack?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 標題 */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-serif font-black text-brand-green mb-4" style={{ color: '#1a5f3f' }}>
            404
          </h1>
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-brand-green to-transparent mb-6" style={{ backgroundColor: '#1a5f3f' }}></div>
        </div>

        {/* 圖片區域 */}
        <div className="mb-8">
          <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <img 
              src="/images/tea_king_jp_2u8qtiwms.jpg" 
              alt="404 頁面圖片"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* 錯誤訊息 */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-black mb-4">
            頁面不見了
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            抱歉，您要尋找的頁面似乎已經消失了
          </p>
          <p className="text-base text-gray-500">
            就像一杯好茶，有時候需要重新沖泡才能找到最佳的味道
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首頁
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-white text-brand-green border-2 border-brand-green rounded-lg font-medium hover:bg-brand-green hover:text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            style={{ 
              borderColor: '#1a5f3f',
              color: '#1a5f3f'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a5f3f';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#1a5f3f';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            回到首頁
          </button>
        </div>

        {/* 裝飾元素 */}
        <div className="mt-12 flex justify-center gap-4 opacity-20">
          <span className="text-4xl">🍵</span>
          <span className="text-4xl">🫖</span>
          <span className="text-4xl">☕</span>
        </div>
      </div>
    </div>
  );
};

