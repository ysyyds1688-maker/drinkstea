import React from 'react';
import { User } from '../types';

interface UserBadgesProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

// 警告標記 SVG Icon
const WarningIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.364 2.722-1.364 3.487 0l5.58 9.923c.75 1.334-.213 2.986-1.742 2.986H4.42c-1.53 0-2.493-1.652-1.742-2.986l5.58-9.923zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// 放鳥標記 SVG Icon
const NoShowIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

// 嚴重違規標記 SVG Icon
const CriticalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export const UserBadges: React.FC<UserBadgesProps> = ({ user, size = 'md' }) => {
  const sizeConfig = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      gap: 'gap-1',
    },
    md: {
      container: 'px-2.5 py-1 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-1.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-base',
      icon: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-2',
    },
  };

  const config = sizeConfig[size];
  const isProvider = user.role === 'provider';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 茶客標記 */}
      {!isProvider && (
        <>
          {/* 失信茶客標記 */}
          {user.warningBadge && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-red-50 text-red-700 font-semibold border-2 border-red-300 shadow-sm`}
              title="失信茶客：該用戶有多次取消預約記錄"
            >
              <WarningIcon className={`${config.icon} text-red-600 flex-shrink-0`} />
              <span className={`${config.text} font-semibold`}>失信茶客</span>
            </span>
          )}

          {/* 失約茶客標記 */}
          {user.noShowBadge && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-orange-50 text-orange-700 font-semibold border-2 border-orange-300 shadow-sm`}
              title="失約茶客：該用戶有多次失約記錄"
            >
              <NoShowIcon className={`${config.icon} text-orange-600 flex-shrink-0`} />
              <span className={`${config.text} font-semibold`}>失約茶客</span>
            </span>
          )}

          {/* 永久除名標記 */}
          {user.violationLevel === 4 && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-red-100 text-red-900 font-bold border-2 border-red-500 shadow-md`}
              title="永久除名：該用戶已被永久驅逐出御茶室"
            >
              <CriticalIcon className={`${config.icon} text-red-700 flex-shrink-0`} />
              <span className={`${config.text} font-bold`}>永久除名</span>
            </span>
          )}
        </>
      )}

      {/* 佳麗標記 */}
      {isProvider && (
        <>
          {/* 警示戶頭標記（佳麗） */}
          {user.providerWarningBadge && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-yellow-50 text-yellow-700 font-semibold border-2 border-yellow-300 shadow-sm`}
              title="警示戶頭：該佳麗有多次檢舉記錄"
            >
              <WarningIcon className={`${config.icon} text-yellow-600 flex-shrink-0`} />
              <span className={`${config.text} font-semibold`}>警示戶頭</span>
            </span>
          )}

          {/* 已凍結標記（佳麗） */}
          {user.providerFrozen && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-gray-100 text-gray-800 font-semibold border-2 border-gray-400 shadow-sm`}
              title={user.providerViolationLevel === 4 ? '永久凍結：該佳麗已被永久除名，驅逐出御茶室' : '已凍結：該佳麗帳號已被凍結，無法接受預約'}
            >
              <svg className={`${config.icon} text-gray-600 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className={`${config.text} font-semibold`}>
                {user.providerViolationLevel === 4 ? '永久除名' : '已凍結'}
              </span>
            </span>
          )}

          {/* 永久除名標記（佳麗） */}
          {user.providerViolationLevel === 4 && !user.providerFrozen && (
            <span
              className={`inline-flex items-center ${config.gap} ${config.container} rounded-md bg-red-100 text-red-900 font-bold border-2 border-red-500 shadow-md`}
              title="永久除名：該佳麗已被永久驅逐出御茶室"
            >
              <CriticalIcon className={`${config.icon} text-red-700 flex-shrink-0`} />
              <span className={`${config.text} font-bold`}>永久除名</span>
            </span>
          )}
        </>
      )}
    </div>
  );
};
