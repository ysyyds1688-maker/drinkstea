import React from 'react';

interface ProviderVerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 佳麗驗證勳章 - 只有購買 VIP 的佳麗才能獲得
 * 顯示在頭像上，類似 Email 驗證勳章，但是金色/綠色背景
 */
export const ProviderVerifiedBadge: React.FC<ProviderVerifiedBadgeProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-4',
    lg: 'w-8 h-8 border-4',
  };

  const iconSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div 
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-white flex items-center justify-center shadow-lg z-10 ${className}`}
      title="佳麗驗證勳章（VIP）"
      style={{
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
      }}
    >
      <svg 
        className={`${iconSizeClasses[size]} text-white`} 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        {/* 五瓣花朵圖標 */}
        <path d="M12 2l2.5 7.5L22 10l-5.5 4.5L18 22l-6-4.5L6 22l1.5-7.5L2 10l7.5-.5L12 2z"/>
      </svg>
    </div>
  );
};

export default ProviderVerifiedBadge;

