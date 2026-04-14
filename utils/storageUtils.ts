/**
 * localStorage 工具函數
 * 處理配額超限和緩存管理
 */

// 估算字符串大小（字節）
const estimateSize = (str: string): number => {
  return new Blob([str]).size;
};

// 檢查並清理舊緩存
export const cleanupOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const forumCacheKeys = keys.filter(key => key.startsWith('forum_posts_'));
    
    // 如果論壇緩存超過 10 個，刪除最舊的
    if (forumCacheKeys.length > 10) {
      const cacheEntries = forumCacheKeys.map(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            return { key, timestamp: parsed.timestamp || 0 };
          } catch {
            return { key, timestamp: 0 };
          }
        }
        return { key, timestamp: 0 };
      }).sort((a, b) => a.timestamp - b.timestamp);
      
      // 刪除最舊的一半緩存
      const toDelete = cacheEntries.slice(0, Math.floor(cacheEntries.length / 2));
      toDelete.forEach(({ key }) => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.warn('清理緩存失敗:', error);
  }
};

// 安全設置 localStorage，處理配額超限
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    // 如果值太大（超過 1MB），不存儲
    const size = estimateSize(value);
    if (size > 1024 * 1024) {
      // 對於論壇帖子緩存，這是正常的，不需要警告
      if (!key.startsWith('forum_posts_')) {
        console.warn(`值太大（${Math.round(size / 1024)}KB），跳過存儲: ${key}`);
      }
      return false;
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('localStorage 配額超限，嘗試清理緩存...');
      
      // 嘗試清理舊緩存
      cleanupOldCache();
      
      // 再次嘗試存儲
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error('清理緩存後仍無法存儲:', retryError);
        
        // 最後嘗試：刪除非關鍵緩存
        try {
          const keys = Object.keys(localStorage);
          const nonCriticalKeys = keys.filter(k => 
            k.startsWith('forum_posts_') || 
            k.startsWith('sf_profiles_') || 
            k.startsWith('sf_articles_')
          );
          
          // 刪除一半非關鍵緩存
          nonCriticalKeys.slice(0, Math.floor(nonCriticalKeys.length / 2)).forEach(k => {
            localStorage.removeItem(k);
          });
          
          localStorage.setItem(key, value);
          return true;
        } catch (finalError) {
          console.error('無法存儲到 localStorage:', finalError);
          return false;
        }
      }
    } else {
      console.error('localStorage 錯誤:', error);
      return false;
    }
  }
};

// 獲取 localStorage 使用情況（估算）
export const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  let used = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key) || '';
        used += estimateSize(key + value);
      }
    }
  } catch (error) {
    console.warn('無法計算存儲使用量:', error);
  }
  
  // 大多數瀏覽器的 localStorage 限制約為 5-10MB
  const total = 5 * 1024 * 1024; // 5MB
  const percentage = (used / total) * 100;
  
  return { used, total, percentage };
};

