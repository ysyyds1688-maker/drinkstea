import React from 'react';

interface PageTransitionProps {
  isVisible: boolean;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center animate-fade-in" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a5f3f 100%)' }}>
      <div className="text-center space-y-6">
        {/* Logo Container with Pulse Effect - Japanese Style */}
        <div className="relative">
            <div className="w-20 h-20 border-2 border-brand-yellow rounded-sm flex items-center justify-center mx-auto relative z-10 bg-[#0f172a]" style={{ 
              border: '3px solid #1a5f3f',
              boxShadow: '0 0 20px rgba(26, 95, 63, 0.5), inset 0 0 10px rgba(26, 95, 63, 0.2)'
            }}>
                <span className="font-serif font-bold text-4xl text-brand-yellow animate-pulse" style={{ color: '#1a5f3f' }}>茶</span>
            </div>
            {/* Decor squares behind - Japanese double border effect */}
            <div className="absolute top-1 left-1 w-20 h-20 border border-brand-yellow/30 rounded-sm mx-auto z-0 animate-ping" style={{ 
              animationDuration: '2s',
              border: '2px solid rgba(26, 95, 63, 0.4)'
            }}></div>
            <div className="absolute top-2 left-2 w-16 h-16 border border-brand-yellow/20 rounded-sm mx-auto z-0" style={{ 
              border: '1px solid rgba(26, 95, 63, 0.2)'
            }}></div>
        </div>

        {/* Text */}
        <div className="space-y-2 animate-fade-in-up">
            <h2 className="text-2xl font-serif text-white font-bold tracking-widest uppercase">茶王</h2>
            <p className="text-brand-yellow text-xs tracking-[0.3em]" style={{ color: '#86efac' }}>
              一本道品茶，只為懂茶的你
            </p>
        </div>

        {/* Loading Bar - Green theme */}
        <div className="w-48 h-0.5 bg-gray-800 mx-auto mt-8 rounded-full overflow-hidden relative" style={{ backgroundColor: 'rgba(26, 95, 63, 0.3)' }}>
            <div className="absolute top-0 left-0 h-full w-1/2 bg-brand-yellow shadow-[0_0_10px_#1a5f3f] animate-[loading_1s_infinite_ease-in-out]" style={{ 
              backgroundColor: '#1a5f3f',
              boxShadow: '0 0 10px #1a5f3f'
            }}></div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};