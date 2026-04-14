import { Profile, Article, User, LoginCredentials, RegisterData, Review, ReviewsResponse, Subscription, SubscriptionStatus, SubscriptionHistory, MembershipBenefits, MembershipLevel, Favorite, UserStatsResponse, DailyTask, ForumPost, ForumReply, Badge, UserBadge, Achievement, Booking } from '../types';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

// ==================== 429 Rate Limit 統一處理 ====================

// In-flight request 去重 Map
const inFlightRequests = new Map<string, Promise<any>>();

// 全局請求隊列（用於批次處理請求，避免同時發送大量請求）
interface QueuedRequest {
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
  attempt: number;
  timeout?: number;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
const QUEUE_BATCH_SIZE = 3; // 每批處理 3 個請求
const QUEUE_BATCH_DELAY = 200; // 批次之間延遲 200ms

// Cache 策略（profiles/articles）
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = {
  profiles: 60 * 1000, // 60 秒
  articles: 60 * 1000, // 60 秒
  default: 30 * 1000, // 30 秒
};

// Retry 策略配置
const RETRY_CONFIG = {
  base: 1000, // 1 秒
  max: 30000, // 30 秒
  maxRetry: 3,
  jitterMax: 300, // 300ms
};

// 計算 retry delay（指數退避 + jitter）
const calculateRetryDelay = (attempt: number, retryAfter?: number): number => {
  // 優先使用 Retry-After header
  if (retryAfter) {
    return retryAfter * 1000; // 轉換為毫秒
  }
  
  // 沒有 Retry-After 時使用指數退避 + jitter
  const exponentialDelay = Math.min(
    RETRY_CONFIG.base * Math.pow(2, attempt),
    RETRY_CONFIG.max
  );
  const jitter = Math.random() * RETRY_CONFIG.jitterMax;
  return exponentialDelay + jitter;
};

// 生成請求 key（用於去重）
const getRequestKey = (url: string, options: RequestInit): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

// 檢查並獲取緩存
const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
};

// 設置緩存
const setCache = <T>(key: string, data: T, ttl: number = CACHE_TTL.default): void => {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
};

// 判斷是否應該緩存（profiles/articles）
const shouldCache = (url: string): boolean => {
  return url.includes('/profiles') || url.includes('/articles');
};

// 獲取緩存 TTL
const getCacheTTL = (url: string): number => {
  if (url.includes('/profiles')) return CACHE_TTL.profiles;
  if (url.includes('/articles')) return CACHE_TTL.articles;
  return CACHE_TTL.default;
};

// UI 提示（非阻斷）
let rateLimitToast: ((message: string) => void) | null = null;
export const setRateLimitToast = (toastFn: (message: string) => void) => {
  rateLimitToast = toastFn;
};

// 顯示非阻斷提示
const showRateLimitToast = (retryAfter: number) => {
  if (rateLimitToast) {
    rateLimitToast(`請求過於頻繁，將於 ${Math.ceil(retryAfter / 1000)} 秒後自動重試`);
  }
};

// 處理請求隊列
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    // 取出一批請求
    const batch = requestQueue.splice(0, QUEUE_BATCH_SIZE);
    
    // 並發處理這批請求
    await Promise.allSettled(
      batch.map(({ url, options, resolve, reject, retries, attempt, timeout }) => {
        return apiRequestInternal(url, options, retries, attempt, timeout)
          .then(resolve)
          .catch(reject);
      })
    );

    // 如果還有請求，等待一段時間再處理下一批
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, QUEUE_BATCH_DELAY));
    }
  }

  isProcessingQueue = false;
};

// API 請求輔助函數（統一處理 429 和請求隊列）
const apiRequest = async <T>(
  url: string,
  options: RequestInit = {},
  retries: number = RETRY_CONFIG.maxRetry,
  attempt: number = 0,
  timeout: number | undefined = undefined
): Promise<T> => {
  // 生成請求 key（用於去重）
  const requestKey = getRequestKey(url, options);
  
  // 檢查是否有 in-flight 請求
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  // 檢查緩存（僅 GET 請求且應該緩存）
  const isGetRequest = !options.method || options.method === 'GET';
  if (isGetRequest && shouldCache(url)) {
    const cached = getCache<T>(requestKey);
    if (cached !== null) {
      return Promise.resolve(cached);
    }
  }

  // 判斷是否為關鍵請求（需要立即執行）
  const isCriticalRequest = url.includes('/auth/me') || 
                           url.includes('/auth/login') || 
                           url.includes('/auth/register') ||
                           attempt > 0; // 重試請求也是關鍵請求
  
  // 對於非關鍵請求，如果隊列中已有請求，則加入隊列批次處理
  if (!isCriticalRequest && (requestQueue.length > 0 || isProcessingQueue)) {
    return new Promise<T>((resolve, reject) => {
      requestQueue.push({
        url,
        options,
        resolve,
        reject,
        retries,
        attempt,
        timeout
      });
      
      // 觸發隊列處理（如果還沒開始處理）
      if (!isProcessingQueue) {
        processQueue();
      }
    });
  }

  // 關鍵請求或隊列為空時，立即執行
  return apiRequestInternal<T>(url, options, retries, attempt, timeout);
};

// 實際執行請求的內部函數（不處理隊列）
const apiRequestInternal = async <T>(
  url: string,
  options: RequestInit = {},
  retries: number = RETRY_CONFIG.maxRetry,
  attempt: number = 0,
  timeout: number | undefined = undefined
): Promise<T> => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 生成請求 key（用於去重）
  const requestKey = getRequestKey(url, options);
  
  // 檢查是否有 in-flight 請求
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  // 檢查緩存（僅 GET 請求且應該緩存）
  const isGetRequest = !options.method || options.method === 'GET';
  if (isGetRequest && shouldCache(url)) {
    const cached = getCache<T>(requestKey);
    if (cached !== null) {
      return Promise.resolve(cached);
    }
  }

  // 創建新的 AbortController
  const controller = new AbortController();
  let requestTimeout = timeout;
  if (requestTimeout === undefined) {
    requestTimeout = 30000;
    if (url.includes('/forum/posts')) {
      requestTimeout = 25000;
    } else if (url.includes('/articles')) {
      requestTimeout = 10000;
    } else if (url.includes('/profiles')) {
      requestTimeout = 60000;
    }
  }
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, requestTimeout);

  // 創建請求 Promise
  const requestPromise = (async (): Promise<T> => {
    try {
      const requestOptions: RequestInit = {
        ...options,
        headers,
        signal: controller.signal,
      };
      
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // 處理 429 Rate Limit
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader 
          ? parseInt(retryAfterHeader, 10) * 1000 
          : undefined;
        
        // 統一 Log 規格
        console.warn('[RATE_LIMIT]', {
          url: url.split('?')[0],
          method: options.method || 'GET',
          retryAfter: retryAfter ? `${retryAfter / 1000}s` : 'calculated',
          attempt
        });

        // 如果是 429 且有緩存，優先返回緩存
        if (isGetRequest && shouldCache(url)) {
          const cached = getCache<T>(requestKey);
          if (cached !== null) {
            // 背景重試
            setTimeout(() => {
              apiRequestInternal<T>(url, options, retries, attempt + 1, timeout).catch(() => {
                // 靜默失敗
              });
            }, retryAfter || calculateRetryDelay(attempt));
            return cached;
          }
        }

        // 顯示非阻斷提示
        showRateLimitToast(retryAfter || calculateRetryDelay(attempt));

        // 如果還有重試次數，進行重試
        if (attempt < retries) {
          const delay = calculateRetryDelay(attempt, retryAfter ? retryAfter / 1000 : undefined);
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiRequestInternal<T>(url, options, retries, attempt + 1, timeout);
        }

        // 重試次數用盡，拋出錯誤
        const error = await response.json().catch(() => ({ error: '請求過於頻繁，請稍後再試' }));
        throw new Error(error.error || '請求過於頻繁，請稍後再試');
      }

      // 處理其他錯誤
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      // 成功響應
      const data = await response.json();

      // 緩存成功響應（僅 GET 請求且應該緩存）
      if (isGetRequest && shouldCache(url)) {
        setCache(requestKey, data, getCacheTTL(url));
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // 網絡錯誤或超時，進行重試
      const isNetworkError = error.name === 'TypeError' || 
                            error.name === 'AbortError' || 
                            error.message?.includes('fetch') ||
                            error.message?.includes('network') ||
                            error.message?.includes('ERR_CONNECTION_REFUSED') ||
                            error.message?.includes('Failed to fetch');
      
      if (attempt < retries && isNetworkError) {
        const isSilentRetry = url.includes('/notifications') || 
                             url.includes('/api/notifications') ||
                             url.includes('/user-stats') ||
                             url.includes('/tasks');
        
        if (import.meta.env.DEV && !isSilentRetry) {
          console.warn(`[API] 請求失敗，正在重試 (${retries - attempt} 次機會): ${url.split('?')[0]}`);
        }
        
        const delay = calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiRequestInternal<T>(url, options, retries, attempt + 1, timeout);
      }
      
      // 處理超時錯誤
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('請求超時，請檢查網絡連接或稍後再試');
      }
      
      // 處理連接錯誤
      if (import.meta.env.DEV && (error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Failed to fetch'))) {
        console.error(`[API] 無法連接到後端服務器，請確認後端服務器是否正在運行 (${url.split('?')[0]})`);
      }
      
      throw error;
    } finally {
      // 清除 in-flight 請求
      inFlightRequests.delete(requestKey);
    }
  })();

  // 記錄 in-flight 請求
  inFlightRequests.set(requestKey, requestPromise);

  return requestPromise;
};

// ==================== API 定義 ====================

// Profiles API
export const profilesApi = {
  getAll: (options?: { limit?: number; offset?: number }): Promise<{ profiles: Profile[]; total: number; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const url = params.toString() ? `${API_ENDPOINTS.profiles}?${params.toString()}` : API_ENDPOINTS.profiles;
    return apiRequest<{ profiles: Profile[]; total: number; limit: number; offset: number; hasMore: boolean }>(url);
  },
  
  // 向後兼容：獲取所有 profiles（無分頁）
  getAllLegacy: (): Promise<Profile[]> => {
    return apiRequest<Profile[]>(API_ENDPOINTS.profiles).then((result: any) => {
      // 如果返回的是分頁結果，提取 profiles 數組
      if (result.profiles) {
        return result.profiles;
      }
      // 如果是舊格式（直接返回數組），直接返回
      return Array.isArray(result) ? result : [];
    });
  },

  getById: (id: string): Promise<Profile> => {
    const token = localStorage.getItem('auth_token');
    return apiRequest<Profile>(`${API_ENDPOINTS.profiles}/${id}`, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : undefined
    });
  },

  create: (profile: Profile): Promise<Profile> => {
    return apiRequest<Profile>(API_ENDPOINTS.profiles, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  update: (id: string, profile: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>(`${API_ENDPOINTS.profiles}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiRequest<void>(`${API_ENDPOINTS.profiles}/${id}`, {
      method: 'DELETE',
    });
  },

  // 記錄聯繫客服次數（嚴選好茶）
  recordContact: (id: string): Promise<{ message: string; contactCount: number; telegramInviteLink?: string | null }> => {
    return apiRequest<{ message: string; contactCount: number; telegramInviteLink?: string | null }>(`${API_ENDPOINTS.profiles}/${id}/contact`, {
      method: 'POST',
    });
  },
};

// Articles API
export const articlesApi = {
  getAll: (options?: { limit?: number; offset?: number }): Promise<{ articles: Article[]; total: number; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const url = params.toString() ? `${API_ENDPOINTS.articles}?${params.toString()}` : API_ENDPOINTS.articles;
    return apiRequest<{ articles: Article[]; total: number; limit: number; offset: number; hasMore: boolean }>(url, {}, RETRY_CONFIG.maxRetry, 0);
  },
  
  // 向後兼容：獲取所有 articles（無分頁）
  getAllLegacy: (): Promise<Article[]> => {
    return apiRequest<Article[]>(API_ENDPOINTS.articles).then((result: any) => {
      // 如果返回的是分頁結果，提取 articles 數組
      if (result.articles) {
        return result.articles;
      }
      // 如果是舊格式（直接返回數組），直接返回
      return Array.isArray(result) ? result : [];
    });
  },

  getById: (id: string): Promise<Article> => {
    return apiRequest<Article>(`${API_ENDPOINTS.articles}/${id}`);
  },

  create: (article: Article): Promise<Article> => {
    return apiRequest<Article>(API_ENDPOINTS.articles, {
      method: 'POST',
      body: JSON.stringify(article),
    });
  },

  update: (id: string, article: Partial<Article>): Promise<Article> => {
    return apiRequest<Article>(`${API_ENDPOINTS.articles}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiRequest<void>(`${API_ENDPOINTS.articles}/${id}`, {
      method: 'DELETE',
    });
  },
};

// Gemini API
export const geminiApi = {
  parseProfile: (text: string): Promise<Partial<Profile>> => {
    return apiRequest<Partial<Profile>>(API_ENDPOINTS.gemini.parseProfile, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  analyzeName: (input: { name1: string; mode?: string }): Promise<any> => {
    return apiRequest(API_ENDPOINTS.gemini.analyzeName, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  suggestTags: (data: { title: string; content: string; category?: string }): Promise<{ tags: string[] }> => {
    return apiRequest<{ tags: string[] }>(API_ENDPOINTS.gemini.suggestTags, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin API
export const adminApi = {
  getStats: () => {
    return apiRequest(API_ENDPOINTS.admin.stats);
  },

  // Profiles 管理
  profiles: {
    getAll: (): Promise<Profile[]> => {
      return apiRequest<Profile[]>(API_ENDPOINTS.admin.profiles);
    },

    getById: (id: string): Promise<Profile> => {
      return apiRequest<Profile>(`${API_ENDPOINTS.admin.profiles}/${id}`);
    },

    create: (profile: Profile): Promise<Profile> => {
      return apiRequest<Profile>(API_ENDPOINTS.admin.profiles, {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    },

    update: (id: string, profile: Partial<Profile>): Promise<Profile> => {
      return apiRequest<Profile>(`${API_ENDPOINTS.admin.profiles}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
    },

    delete: (id: string): Promise<void> => {
      return apiRequest<void>(`${API_ENDPOINTS.admin.profiles}/${id}`, {
        method: 'DELETE',
      });
    },

    batch: (action: string, ids: string[], data?: any) => {
      return apiRequest(`${API_ENDPOINTS.admin.profiles}/batch`, {
        method: 'POST',
        body: JSON.stringify({ action, ids, data }),
      });
    },
  },

  // Articles 管理
  articles: {
    getAll: (): Promise<Article[]> => {
      return apiRequest<Article[]>(API_ENDPOINTS.admin.articles);
    },

    getById: (id: string): Promise<Article> => {
      return apiRequest<Article>(`${API_ENDPOINTS.admin.articles}/${id}`);
    },

    create: (article: Article): Promise<Article> => {
      return apiRequest<Article>(API_ENDPOINTS.admin.articles, {
        method: 'POST',
        body: JSON.stringify(article),
      });
    },

    update: (id: string, article: Partial<Article>): Promise<Article> => {
      return apiRequest<Article>(`${API_ENDPOINTS.admin.articles}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article),
      });
    },

    delete: (id: string): Promise<void> => {
      return apiRequest<void>(`${API_ENDPOINTS.admin.articles}/${id}`, {
        method: 'DELETE',
      });
    },

    batch: (action: string, ids: string[], data?: any) => {
      return apiRequest(`${API_ENDPOINTS.admin.articles}/batch`, {
        method: 'POST',
        body: JSON.stringify({ action, ids, data }),
      });
    },
  },
};

// Auth API
export const authApi = {
  register: async (data: RegisterData): Promise<{ user: User; token: string; refreshToken: string }> => {
    return apiRequest<{ user: User; token: string; refreshToken: string }>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> => {
    return apiRequest<{ user: User; token: string; refreshToken: string }>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.auth.logout, {
      method: 'POST',
    });
  },

  forgotPassword: async (email: string): Promise<{ message: string; code?: string; warning?: string }> => {
    return apiRequest<{ message: string; code?: string; warning?: string }>(API_ENDPOINTS.auth.forgotPassword, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyForgotPassword: async (email: string, code: string): Promise<{ message: string; password?: string; passwordHint?: string; needReset?: boolean; note?: string }> => {
    return apiRequest<{ message: string; password?: string; passwordHint?: string; needReset?: boolean; note?: string }>(API_ENDPOINTS.auth.verifyForgotPassword, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  getMe: async (): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.auth.me, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  getUserProfile: async (userId: string): Promise<any> => {
    if (!userId || userId.trim() === '') {
      throw new Error('用戶ID不能為空');
    }
    // 對 userId 進行 URL 編碼，處理特殊字符（如 #）
    const encodedUserId = encodeURIComponent(userId.trim());
    return apiRequest<any>(`${API_ENDPOINTS.auth.base}/users/${encodedUserId}`);
  },

  updateMe: async (data: { userName?: string; avatarUrl?: string; email?: string; phoneNumber?: string }): Promise<User> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('未授权，请先登录');
    }
    
    // 確保 API_BASE_URL 有值
    // 注意：遷移到新的 Zeabur 部署時，必須設置 VITE_API_BASE_URL 環境變數
    if (!API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL 環境變數未設置，請在 Zeabur 環境變數中配置');
    }
    const url = `${API_BASE_URL}/api/auth/me`;
    
    if (!url || url === '/api/auth/me' || !url.startsWith('http')) {
      console.error('API_BASE_URL:', API_BASE_URL);
      console.error('Constructed URL:', url);
      throw new Error(`API 端点未配置: ${url}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('updateMe error:', error);
      console.error('URL:', url);
      console.error('Data:', data);
      throw error;
    }
  },

  sendVerificationEmail: async (): Promise<{ message: string; code?: string }> => {
    return apiRequest<{ message: string; code?: string }>(API_ENDPOINTS.auth.sendVerificationEmail, {
      method: 'POST',
    });
  },

  verifyEmail: async (code: string): Promise<{ message: string; user: { id: string; email?: string; emailVerified: boolean }; experienceEarned: number }> => {
    return apiRequest<{ message: string; user: { id: string; email?: string; emailVerified: boolean }; experienceEarned: number }>(API_ENDPOINTS.auth.verifyEmail, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  sendVerificationPhone: async (): Promise<{ message: string; code?: string }> => {
    return apiRequest<{ message: string; code?: string }>(API_ENDPOINTS.auth.sendVerificationPhone, {
      method: 'POST',
    });
  },

  verifyPhone: async (code: string): Promise<{ message: string; user: { id: string; phoneNumber?: string; phoneVerified: boolean }; experienceEarned: number }> => {
    return apiRequest<{ message: string; user: { id: string; phoneNumber?: string; phoneVerified: boolean }; experienceEarned: number }>(API_ENDPOINTS.auth.verifyPhone, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
};

// Reviews API
export const reviewsApi = {
  getByProfileId: async (profileId: string): Promise<ReviewsResponse> => {
    return apiRequest<ReviewsResponse>(API_ENDPOINTS.reviews.getByProfile(profileId));
  },

  getByUserId: async (userId: string): Promise<{ reviews: Review[]; total: number; averageRating: number }> => {
    if (!userId || userId.trim() === '') {
      throw new Error('用戶ID不能為空');
    }
    // 對 userId 進行 URL 編碼，處理特殊字符（如 #）
    const encodedUserId = encodeURIComponent(userId.trim());
    return apiRequest<{ reviews: Review[]; total: number; averageRating: number }>(`${API_BASE_URL}/api/reviews/users/${encodedUserId}/reviews`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  create: async (profileId: string, data: { rating: number; comment: string; serviceType?: string; clientName?: string }): Promise<Review> => {
    return apiRequest<Review>(API_ENDPOINTS.reviews.create(profileId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (reviewId: string, data: { rating?: number; comment?: string; serviceType?: string }): Promise<Review> => {
    return apiRequest<Review>(API_ENDPOINTS.reviews.update(reviewId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (reviewId: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.reviews.delete(reviewId), {
      method: 'DELETE',
    });
  },

  like: async (reviewId: string): Promise<{ liked: boolean }> => {
    return apiRequest<{ liked: boolean }>(API_ENDPOINTS.reviews.like(reviewId), {
      method: 'POST',
    });
  },

  // 佳麗評論茶客
  createClientReview: async (clientId: string, data: { rating: number; comment: string; bookingId?: string }): Promise<Review> => {
    return apiRequest<Review>(`${API_BASE_URL}/api/reviews/clients/${clientId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reply: async (reviewId: string, content: string): Promise<any> => {
    return apiRequest(API_ENDPOINTS.reviews.reply(reviewId), {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getMy: async (): Promise<SubscriptionStatus> => {
    return apiRequest<SubscriptionStatus>(API_ENDPOINTS.subscriptions.my);
  },

  subscribe: async (membershipLevel: MembershipLevel, duration?: number): Promise<{ message: string; membershipLevel: MembershipLevel; membershipExpiresAt: string; subscription: Subscription }> => {
    return apiRequest(API_ENDPOINTS.subscriptions.subscribe, {
      method: 'POST',
      body: JSON.stringify({ membershipLevel, duration }),
    });
  },

  getHistory: async (): Promise<SubscriptionHistory> => {
    return apiRequest<SubscriptionHistory>(API_ENDPOINTS.subscriptions.history);
  },

  cancel: async (): Promise<{ message: string }> => {
    return apiRequest(API_ENDPOINTS.subscriptions.cancel, {
      method: 'POST',
    });
  },

  getBenefits: async (): Promise<{ benefits: MembershipBenefits[] }> => {
    return apiRequest<{ benefits: MembershipBenefits[] }>(API_ENDPOINTS.subscriptions.benefits);
  },
};

// Favorites API
export const favoritesApi = {
  add: (profileId: string): Promise<Favorite> => {
    return apiRequest<Favorite>(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
  },
  remove: (profileId: string): Promise<void> => {
    return apiRequest<void>(`${API_BASE_URL}/api/favorites/${profileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
  check: (profileId: string): Promise<{ isFavorited: boolean }> => {
    return apiRequest<{ isFavorited: boolean }>(`${API_BASE_URL}/api/favorites/check/${profileId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
  getMy: (): Promise<{ favorites: Favorite[]; profiles: Profile[] }> => {
    return apiRequest<{ favorites: Favorite[]; profiles: Profile[] }>(`${API_BASE_URL}/api/favorites/my`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// User Stats API
export const userStatsApi = {
  getMy: async (): Promise<UserStatsResponse> => {
    return apiRequest<UserStatsResponse>(
      `${API_BASE_URL}/api/user-stats/me`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
};

// Tasks API
export const tasksApi = {
  getDaily: async (date?: string): Promise<{ tasks: DailyTask[] }> => {
    const url = date 
      ? `${API_BASE_URL}/api/tasks/daily?date=${date}`
      : `${API_BASE_URL}/api/tasks/daily`;
    return apiRequest<{ tasks: DailyTask[] }>(
      url, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
  getDefinitions: async (): Promise<{ definitions: any[] }> => {
    return apiRequest<{ definitions: any[] }>(
      `${API_BASE_URL}/api/tasks/definitions`,
      {},
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
};

// Forum API
export const forumApi = {
  getPosts: async (options?: { category?: string; sortBy?: string; limit?: number; offset?: number }): Promise<{ posts: ForumPost[]; favoritedPostIds?: string[] }> => {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/api/forum/posts${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest<{ posts: ForumPost[]; favoritedPostIds?: string[] }>(url, {}, RETRY_CONFIG.maxRetry, 0, 25000);
  },
  
  getPostById: async (id: string): Promise<{ post: ForumPost; replies: ForumReply[]; isLiked: boolean; isFavorited: boolean }> => {
    return apiRequest<{ post: ForumPost; replies: ForumReply[]; isLiked: boolean; isFavorited: boolean }>(`${API_BASE_URL}/api/forum/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
  
  getPostsByUserId: async (userId: string, limit?: number, offset?: number): Promise<{ posts: ForumPost[] }> => {
    if (!userId || userId.trim() === '') {
      throw new Error('用戶ID不能為空');
    }
    // 對 userId 進行 URL 編碼，處理特殊字符（如 #）
    const encodedUserId = encodeURIComponent(userId.trim());
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const url = `${API_BASE_URL}/api/forum/posts/user/${encodedUserId}${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest<{ posts: ForumPost[] }>(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
  
  createPost: async (data: { title: string; content: string; category: string; tags?: string[]; images?: string[]; relatedProfileId?: string; relatedReviewId?: string }): Promise<{ post: ForumPost }> => {
    return apiRequest<{ post: ForumPost }>(`${API_BASE_URL}/api/forum/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },
  
  updatePost: async (postId: string, data: { title?: string; content?: string; category?: string; tags?: string[]; images?: string[]; relatedProfileId?: string; relatedReviewId?: string }): Promise<ForumPost> => {
    return apiRequest<ForumPost>(`${API_BASE_URL}/api/forum/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },
  
  createReply: async (postId: string, data: { content: string; parentReplyId?: string }): Promise<{ 
    reply: ForumReply; 
    taskCompleted?: boolean;
    pointsEarned?: number;
    experienceEarned?: number;
    checkInBonus?: { points: number; experience: number };
    isFirstCheckIn?: boolean;
    levelUp?: boolean;
    newLevel?: string;
    unlockedAchievements?: any[];
  }> => {
    return apiRequest<{ 
      reply: ForumReply; 
      taskCompleted?: boolean;
      pointsEarned?: number;
      experienceEarned?: number;
      checkInBonus?: { points: number; experience: number };
      isFirstCheckIn?: boolean;
      levelUp?: boolean;
      newLevel?: string;
      unlockedAchievements?: any[];
    }>(`${API_BASE_URL}/api/forum/posts/${postId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },
  
  toggleLike: async (targetType: 'post' | 'reply', targetId: string): Promise<{ liked: boolean }> => {
    return apiRequest<{ liked: boolean }>(`${API_BASE_URL}/api/forum/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ targetType, targetId })
    });
  },

  deletePost: async (postId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`${API_BASE_URL}/api/forum/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  deleteReply: async (replyId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`${API_BASE_URL}/api/forum/replies/${replyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  toggleFavorite: async (postId: string): Promise<{ favorited: boolean }> => {
    return apiRequest<{ favorited: boolean }>(`${API_BASE_URL}/api/forum/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ postId })
    });
  },

  getFavorites: async (options?: { limit?: number; offset?: number }): Promise<{ posts: ForumPost[] }> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/api/forum/favorites${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest<{ posts: ForumPost[] }>(url);
  },

  createReport: async (data: { postId?: string; replyId?: string; reason: string }): Promise<{ success: boolean; reportId: string; message: string }> => {
    return apiRequest<{ success: boolean; reportId: string; message: string }>(`${API_BASE_URL}/api/forum/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },
};

// Badges API
export const badgesApi = {
  getAvailable: async (): Promise<{ badges: Badge[] }> => {
    return apiRequest<{ badges: Badge[] }>(
      `${API_BASE_URL}/api/badges/available`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
  
  getMy: async (): Promise<{ badges: UserBadge[] }> => {
    return apiRequest<{ badges: UserBadge[] }>(
      `${API_BASE_URL}/api/badges/my`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
  
  purchase: async (badgeId: string): Promise<{ badge: UserBadge; message: string }> => {
    return apiRequest<{ badge: UserBadge; message: string }>(`${API_BASE_URL}/api/badges/purchase/${badgeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
  
  check: async (): Promise<{ unlocked: UserBadge[]; count: number }> => {
    return apiRequest<{ unlocked: UserBadge[]; count: number }>(`${API_BASE_URL}/api/badges/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// Achievements API
export const achievementsApi = {
  getMy: async (): Promise<{ achievements: Achievement[] }> => {
    return apiRequest<{ achievements: Achievement[] }>(
      `${API_BASE_URL}/api/achievements/my`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
  
  getDefinitions: async (): Promise<{ definitions: any[] }> => {
    return apiRequest<{ definitions: any[] }>(
      `${API_BASE_URL}/api/achievements/definitions`,
      {},
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
  
  check: async (): Promise<{ unlocked: Achievement[]; count: number }> => {
    return apiRequest<{ unlocked: Achievement[]; count: number }>(
      `${API_BASE_URL}/api/achievements/check`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      },
      RETRY_CONFIG.maxRetry,
      0,
      10000 // timeout 10 seconds
    );
  },
};

// Notifications API
export const notificationsApi = {
  getMy: async (): Promise<{ notifications: any[] }> => {
    return apiRequest<{ notifications: any[] }>(API_ENDPOINTS.notifications.my, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  markAsRead: async (id: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.notifications.markAsRead(id), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.notifications.markAllAsRead, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.notifications.delete(id), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// Booking API
export const bookingApi = {
  getAvailableTimes: async (profileId: string, date: string): Promise<{ availableTimes: string[]; bookedTimes: string[]; allTimeSlots: string[] }> => {
    return apiRequest<{ availableTimes: string[]; bookedTimes: string[]; allTimeSlots: string[] }>(
      `${API_BASE_URL}/api/bookings/available-times/${profileId}?date=${date}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );
  },

  create: async (data: {
    profileId: string;
    serviceType?: string;
    bookingDate: string;
    bookingTime: string;
    location?: string;
    notes?: string;
  }): Promise<Booking> => {
    return apiRequest<Booking>(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },

  getMy: async (): Promise<Booking[]> => {
    return apiRequest<Booking[]>(`${API_BASE_URL}/api/bookings/my`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  getById: async (id: string): Promise<Booking> => {
    return apiRequest<Booking>(`${API_BASE_URL}/api/bookings/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  updateStatus: async (id: string, status: Booking['status'], cancellationReason?: string): Promise<Booking> => {
    return apiRequest<Booking>(`${API_BASE_URL}/api/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ status, cancellationReason })
    });
  },

  updateReviewStatus: async (id: string, reviewed: boolean): Promise<Booking> => {
    return apiRequest<Booking>(`${API_BASE_URL}/api/bookings/${id}/review-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ reviewed })
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`${API_BASE_URL}/api/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  reportNoShow: async (id: string): Promise<{ message: string; booking: Booking }> => {
    return apiRequest<{ message: string; booking: Booking }>(`${API_BASE_URL}/api/bookings/${id}/report-no-show`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// Reports API（檢舉功能 - 支持雙向檢舉）
export const reportApi = {
  // 創建檢舉記錄（支持佳麗檢舉茶客，茶客檢舉佳麗）
  create: async (data: {
    targetUserId: string;
    bookingId?: string;
    reportType: 'solicitation' | 'scam' | 'harassment' | 'no_show' | 'not_real_person' | 'service_mismatch' | 'fake_profile' | 'other';
    reason: string;
    description: string;
    attachments?: string[];
    dialogueHistory?: string;
  }): Promise<{ message: string; report: any }> => {
    return apiRequest<{ message: string; report: any }>(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },

  // 獲取自己的檢舉記錄
  getMy: async (): Promise<{ reports: any[] }> => {
    return apiRequest<{ reports: any[] }>(`${API_BASE_URL}/api/reports/my`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  // 獲取單個檢舉記錄
  getById: async (id: string): Promise<any> => {
    return apiRequest<any>(`${API_BASE_URL}/api/reports/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// Messages API（訊息功能）
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  profileId: string;
  parentMessageId?: string | null;
  threadId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  threadCount?: number;
  sender?: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    emailVerified?: boolean;
  };
  recipient?: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    emailVerified?: boolean;
  };
  profile?: {
    id: string;
    name?: string;
    imageUrl?: string;
  };
}

export interface ContactInfo {
  line?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  socialAccounts?: {
    [platform: string]: string;
  };
  preferredMethod?: 'line' | 'phone' | 'email' | 'telegram';
  contactInstructions?: string;
}

export const messagesApi = {
  // 發送訊息
  send: async (data: {
    profileId: string;
    recipientUserId: string;
    message: string;
    parentMessageId?: string;
  }): Promise<{ success: boolean; message: Message; contactInfo?: ContactInfo | null }> => {
    return apiRequest<{ success: boolean; message: Message; contactInfo?: ContactInfo | null }>(`${API_BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
  },

  // 獲取對話串的所有訊息
  getThread: async (threadId: string): Promise<{ messages: Message[] }> => {
    return apiRequest<{ messages: Message[] }>(`${API_BASE_URL}/api/messages/thread/${threadId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  // 獲取我的訊息（收件箱）
  getMy: async (options?: { limit?: number; offset?: number }): Promise<{ messages: Message[]; unreadCount: number; total: number }> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const url = `${API_BASE_URL}/api/messages/my${params.toString() ? '?' + params.toString() : ''}`;
    return apiRequest<{ messages: Message[]; unreadCount: number; total: number }>(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  // 標記訊息為已讀
  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`${API_BASE_URL}/api/messages/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  // 標記所有訊息為已讀
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`${API_BASE_URL}/api/messages/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },

  // 刪除訊息
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`${API_BASE_URL}/api/messages/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  },
};

// Stats API
export const statsApi = {
  getOnlineCount: async (): Promise<{ onlineCount: number; timestamp: string }> => {
    return apiRequest<{ onlineCount: number; timestamp: string }>(API_ENDPOINTS.stats.online);
  },
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 注意：這裡不設置 'Content-Type': 'application/json'，因為 FormData 會自動設置 multipart/form-data
    const response = await fetch(API_ENDPOINTS.upload.image, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown upload error' }));
      throw new Error(error.error || `Image upload failed: ${response.status}`);
    }

    return response.json();
  },
};
