import React from 'react';

interface EmailVerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Email 驗證徽章 - 顯示在頭像右下角
 * 類似 VIP 徽章，但是藍色背景和打勾圖標
 */
export const EmailVerifiedBadge: React.FC<EmailVerifiedBadgeProps> = ({ 
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
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} bg-blue-500 rounded-full border-white flex items-center justify-center shadow-lg z-10 ${className}`}
      title="Email 已驗證"
    >
      <svg 
        className={`${iconSizeClasses[size]} text-white`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={3} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
    </div>
  );
};

export default EmailVerifiedBadge;




