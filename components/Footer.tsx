import React, { useState, useEffect } from 'react';
import { statsApi } from '../services/apiService';

export const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // 更新時間（每秒更新一次）
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const taiwanTimeStr = now.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTime(taiwanTimeStr);
    };

    // 立即更新一次
    updateTime();

    // 每秒更新一次
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // 獲取在線人數（每30秒更新一次）
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const data = await statsApi.getOnlineCount();
        setOnlineCount(data.onlineCount || 0);
      } catch (error) {
        // 靜默處理錯誤，不顯示在控制台（避免重複錯誤訊息）
        // 如果獲取失敗，保持當前值或設為 null
        if (onlineCount === null) {
          setOnlineCount(0); // 首次失敗時設為0，避免顯示"載入中..."
        }
      }
    };

    // 立即獲取一次
    fetchOnlineCount();

    // 每30秒更新一次
    const interval = setInterval(fetchOnlineCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-3 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">目前時間：</span>
            <span className="font-mono font-semibold text-gray-900">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="font-medium">在線人數：</span>
            {onlineCount !== null ? (
              <span className="font-semibold text-green-600">{onlineCount}</span>
            ) : (
              <span className="text-gray-400">載入中...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
