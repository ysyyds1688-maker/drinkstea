import React from 'react';

interface AdminBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold bg-gradient-to-r from-red-500 to-red-700 text-white ${sizeClasses[size]} shadow-sm`}
      title="管理員"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
      </svg>
      <span>管理員</span>
    </span>
  );
};

export default AdminBadge;

