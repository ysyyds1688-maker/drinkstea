import React from 'react';
import { VerificationBadge as VerificationBadgeType } from '../types';

interface VerificationBadgesProps {
  badges: VerificationBadgeType[];
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig: Record<VerificationBadgeType, { label: string; icon: string; color: string }> = {
  email_verified: {
    label: '郵箱已驗證',
    icon: '✉️',
    color: 'text-blue-600',
  },
  phone_verified: {
    label: '手機已驗證',
    icon: '📱',
    color: 'text-green-600',
  },
};

const sizeClasses = {
  sm: 'w-4 h-4 text-xs',
  md: 'w-5 h-5 text-sm',
  lg: 'w-6 h-6 text-base',
};

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({ 
  badges, 
  size = 'md' 
}) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const sizeClass = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {badges.map((badge) => {
        const config = badgeConfig[badge];
        return (
          <span
            key={badge}
            className={`inline-flex items-center justify-center ${sizeClass} ${config.color}`}
            title={config.label}
          >
            {config.icon}
          </span>
        );
      })}
    </div>
  );
};

export default VerificationBadges;

