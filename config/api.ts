// API 配置
// 本地開發時使用 localhost:8080，生產環境使用環境變量
// 注意：遷移到新的 Zeabur 部署時，必須更新 VITE_API_BASE_URL 環境變數
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:8080' : '');

// CDN 配置（用於靜態資源加速）
// 可以通過環境變量 VITE_CDN_URL 配置 CDN 地址
export const CDN_URL = import.meta.env.VITE_CDN_URL || '';

// 官方 Line 連結（用於嚴選好茶的立即約會品茶諮詢按鈕）
// 可以通過環境變量 VITE_OFFICIAL_LINE_URL 配置官方 Line 連結
export const OFFICIAL_LINE_URL = import.meta.env.VITE_OFFICIAL_LINE_URL || 'https://lin.ee/Hj61zlP';

// 獲取 CDN 優化的圖片 URL
export const getImageUrl = (url: string): string => {
  if (!url) return '';
  
  // 如果是完整 URL（http:// 或 https://），檢查是否需要替換為 CDN URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 優先處理後端生成的圖片 URL (包含 API_BASE_URL 或 localhost)
    if (CDN_URL) {
      // 替換後端可能生成的本地或 API 域名
      let processedUrl = url;
      if (API_BASE_URL && url.startsWith(API_BASE_URL)) {
        processedUrl = url.replace(API_BASE_URL, CDN_URL);
      } else if (url.startsWith('http://localhost:8080')) { // 處理本地開發環境的圖片 URL
        processedUrl = url.replace('http://localhost:8080', CDN_URL);
      }
      
      // 其他外部 CDN 圖片，例如 unsplash
      if (processedUrl.includes('images.unsplash.com') && CDN_URL) {
        return processedUrl.replace('https://images.unsplash.com', `${CDN_URL}/unsplash`);
      }
      return processedUrl;
    }
    return url; // 如果沒有配置 CDN，直接返回原始 URL
  }
  
  // 如果是相對路徑，使用 CDN（如果配置了）
  return CDN_URL ? `${CDN_URL}/${url.replace(/^\//, '')}` : url;
};

// API 端點
export const API_ENDPOINTS = {
  // 公開 API
  profiles: `${API_BASE_URL}/api/profiles`,
  articles: `${API_BASE_URL}/api/articles`,
  gemini: {
    parseProfile: `${API_BASE_URL}/api/gemini/parse-profile`,
    analyzeName: `${API_BASE_URL}/api/gemini/analyze-name`,
    suggestTags: `${API_BASE_URL}/api/gemini/suggest-tags`,
  },
  // 後台管理 API
  admin: {
    stats: `${API_BASE_URL}/api/admin/stats`,
    profiles: `${API_BASE_URL}/api/admin/profiles`,
    articles: `${API_BASE_URL}/api/admin/articles`,
  },
  // 認證 API
  auth: {
    base: `${API_BASE_URL}/api/auth`,
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    me: `${API_BASE_URL}/api/auth/me`,
    updateMe: `${API_BASE_URL}/api/auth/me`,
    sendVerificationEmail: `${API_BASE_URL}/api/auth/send-verification-email`,
    verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
    sendVerificationPhone: `${API_BASE_URL}/api/auth/send-verification-phone`,
    verifyPhone: `${API_BASE_URL}/api/auth/verify-phone`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    verifyForgotPassword: `${API_BASE_URL}/api/auth/forgot-password/verify`,
  },
  // 評論 API
  reviews: {
    getByProfile: (profileId: string) => `${API_BASE_URL}/api/reviews/profiles/${profileId}/reviews`,
    create: (profileId: string) => `${API_BASE_URL}/api/reviews/profiles/${profileId}/reviews`,
    update: (reviewId: string) => `${API_BASE_URL}/api/reviews/reviews/${reviewId}`,
    delete: (reviewId: string) => `${API_BASE_URL}/api/reviews/reviews/${reviewId}`,
    like: (reviewId: string) => `${API_BASE_URL}/api/reviews/reviews/${reviewId}/like`,
    reply: (reviewId: string) => `${API_BASE_URL}/api/reviews/reviews/${reviewId}/reply`,
  },
  // 訂閱 API
  subscriptions: {
    my: `${API_BASE_URL}/api/subscriptions/my`,
    subscribe: `${API_BASE_URL}/api/subscriptions/subscribe`,
    history: `${API_BASE_URL}/api/subscriptions/history`,
    cancel: `${API_BASE_URL}/api/subscriptions/cancel`,
    benefits: `${API_BASE_URL}/api/subscriptions/benefits`,
  },
  // 用戶統計 API
  userStats: {
    me: `${API_BASE_URL}/api/user-stats/me`,
  },
  // 任務 API
  tasks: {
    daily: `${API_BASE_URL}/api/tasks/daily`,
    definitions: `${API_BASE_URL}/api/tasks/definitions`,
  },
  // 御茶室 API
  forum: {
    posts: `${API_BASE_URL}/api/forum/posts`,
    post: (id: string) => `${API_BASE_URL}/api/forum/posts/${id}`,
    replies: (postId: string) => `${API_BASE_URL}/api/forum/posts/${postId}/replies`,
    likes: `${API_BASE_URL}/api/forum/likes`,
    deletePost: (id: string) => `${API_BASE_URL}/api/forum/posts/${id}`,
    deleteReply: (id: string) => `${API_BASE_URL}/api/forum/replies/${id}`,
  },
  // 勳章 API
  badges: {
    available: `${API_BASE_URL}/api/badges/available`,
    my: `${API_BASE_URL}/api/badges/my`,
    purchase: (badgeId: string) => `${API_BASE_URL}/api/badges/purchase/${badgeId}`,
  },
  // 成就 API
  achievements: {
    my: `${API_BASE_URL}/api/achievements/my`,
    definitions: `${API_BASE_URL}/api/achievements/definitions`,
    check: `${API_BASE_URL}/api/achievements/check`,
  },
  // 通知 API
  notifications: {
    my: `${API_BASE_URL}/api/notifications/my`,
    markAsRead: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
    markAllAsRead: `${API_BASE_URL}/api/notifications/read-all`,
    delete: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
  },
  // 統計 API
  stats: {
    online: `${API_BASE_URL}/api/stats/online`,
  },
  // Telegram API
  telegram: {
    linkUrl: `${API_BASE_URL}/api/telegram/link-url`,
    config: `${API_BASE_URL}/api/telegram/config`,
  },

  // 上傳 API
  upload: {
    image: `${API_BASE_URL}/api/upload/image`,
  },
};

