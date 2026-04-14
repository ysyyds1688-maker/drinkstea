import React from 'react';

interface VipBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const VipBadge: React.FC<VipBadgeProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 ${sizeClasses[size]} shadow-sm`}
      title="VIP 會員"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      <span>VIP</span>
    </span>
  );
};

export default VipBadge;



