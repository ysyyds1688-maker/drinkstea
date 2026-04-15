import React, { useState, useEffect, useCallback, useRef } from 'react';
import { favoritesApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteButtonProps {
  profileId: string;
}

// 全局緩存，避免重複請求
const favoriteStatusCache = new Map<string, { isFavorited: boolean; timestamp: number }>();
const pendingRequests = new Map<string, Promise<{ isFavorited: boolean }>>();

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ profileId }) => {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const hasCheckedRef = useRef(false);

  const checkFavoriteStatus = useCallback(async () => {
    // 防止重複請求
    if (hasCheckedRef.current) {
      return;
    }

    // 檢查緩存（緩存有效期 1 分鐘）
    const cached = favoriteStatusCache.get(profileId);
    const now = Date.now();
    if (cached && (now - cached.timestamp < 60 * 1000)) {
      setIsFavorited(cached.isFavorited);
      setIsLoading(false);
      hasCheckedRef.current = true;
      return;
    }

    // 檢查是否有正在進行的請求
    const pendingRequest = pendingRequests.get(profileId);
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        setIsFavorited(result.isFavorited);
        setIsLoading(false);
        hasCheckedRef.current = true;
        return;
      } catch (error) {
        // 如果請求失敗，繼續發送新請求
      }
    }

    // 發送新請求
    hasCheckedRef.current = true;
    const requestPromise = favoritesApi.check(profileId);
    pendingRequests.set(profileId, requestPromise);

    try {
      const result = await requestPromise;
      setIsFavorited(result.isFavorited);
      // 更新緩存
      favoriteStatusCache.set(profileId, { isFavorited: result.isFavorited, timestamp: now });
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    } finally {
      setIsLoading(false);
      pendingRequests.delete(profileId);
    }
  }, [profileId]);

  useEffect(() => {
    hasCheckedRef.current = false;
    if (isAuthenticated) {
      checkFavoriteStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, profileId]); // 只依賴 profileId，不依賴 checkFavoriteStatus

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击
    if (!isAuthenticated || isToggling) return;

    setIsToggling(true);
    try {
      if (isFavorited) {
        await favoritesApi.remove(profileId);
        setIsFavorited(false);
        // 更新緩存
        favoriteStatusCache.set(profileId, { isFavorited: false, timestamp: Date.now() });
      } else {
        await favoritesApi.add(profileId);
        setIsFavorited(true);
        // 更新緩存
        favoriteStatusCache.set(profileId, { isFavorited: true, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      alert('操作失敗，請稍後重試');
    } finally {
      setIsToggling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          alert('請先登入/註冊，即可收藏小姐到我的最愛！\n\n綁定 Telegram 後，在 TG Bot 也能查看收藏 ❤️');
        }}
        className="p-2.5 rounded-full bg-white shadow-xl text-red-500 hover:text-red-600 hover:scale-110 transition-all border-2 border-red-200"
        title="登入後即可收藏"
        style={{ minWidth: '40px', minHeight: '40px' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  }

  if (isLoading) {
    return (
      <button
        disabled
        className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-gray-400"
        title="載入中..."
      >
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isToggling}
      className={`p-2.5 rounded-full bg-white shadow-xl transition-all hover:scale-110 border-2 ${
        isFavorited ? 'text-red-500 border-red-300' : 'text-red-400 border-red-200 hover:text-red-500'
      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFavorited ? '取消收藏' : '加入最愛'}
      style={{ minWidth: '40px', minHeight: '40px' }}
    >
      <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
};

