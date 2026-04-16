import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MOCK_BANNERS } from './constants';
import { Profile, Article, FilterCriteria } from './types';
import { ProfileDetail } from './components/ProfileDetail';
import { AdminEditor } from './components/AdminEditor';
import { SidebarFilter } from './components/SidebarFilter';
import { NewsList } from './components/NewsList';
import { ArticleDetail } from './components/ArticleDetail';
import { AdminArticleEditor } from './components/AdminArticleEditor';
import { PageTransition } from './components/PageTransition';
import { PriceDisplay } from './components/PriceDisplay';
import { ProviderListingPage } from './components/ProviderListingPage';
import { ProviderDashboard } from './components/ProviderDashboard';
import { UserProfile } from './components/UserProfile';
import { UserBlogPage } from './components/UserBlogPage';
import { ForumPage } from './components/ForumPage';
import { PostDetail } from './components/PostDetail';
import { CreatePostPage } from './components/CreatePostPage';
import { AboutTeaKing } from './components/AboutTeaKing';
import { NotFound } from './components/NotFound';
import { Footer } from './components/Footer';
import { MembershipBadge } from './components/MembershipBadge';
import { NotificationBox } from './components/NotificationBox';
import { VerificationBadges } from './components/VerificationBadges';
import { VipBadge } from './components/VipBadge';
import { AdminBadge } from './components/AdminBadge';
import { FavoriteButton } from './components/FavoriteButton';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { profilesApi, articlesApi } from './services/apiService';
import { getImageUrl } from './config/api';

type ViewState = 'HOME' | 'NEWS' | 'PROFILE_DETAIL' | 'ADMIN_PROFILE' | 'ARTICLE_DETAIL' | 'PROVIDER_LISTING' | 'PROVIDER_DASHBOARD' | 'USER_PROFILE' | 'USER_BLOG' | 'FORUM' | 'CREATE_POST' | 'ABOUT' | 'NOT_FOUND';

// 動態假數字組件
const FakeStats: React.FC<{ id: string }> = ({ id }) => {
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
    return h;
  }, [id]);
  const [views, setViews] = useState(() => 800 + Math.abs(seed % 4200));
  const [favs, setFavs] = useState(() => 30 + Math.abs((seed >> 8) % 270));
  useEffect(() => {
    const t = setInterval(() => {
      setViews(v => v + Math.floor(Math.random() * 3) + 1);
      setFavs(v => v + (Math.random() < 0.3 ? 1 : 0));
    }, 15000 + Math.random() * 25000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-end gap-3" onClick={(e) => e.preventDefault()}>
      <div className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-xs text-gray-500">{views.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-pink-400 fill-current" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-xs text-gray-500">{favs}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // 從後端 API 獲取資料
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterCriteria>({
    type: 'all',
    location: '全部',
    nationalities: [],
    bodyTypes: [],
    personalities: [],
    ageRange: [18, 80],
    priceRange: [0, 200000], // 提高上限到20万，确保所有价格都能显示
    cup: []
  });

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [profileDetailSource, setProfileDetailSource] = useState<ViewState>('HOME'); // 跟踪详情页的来源页面
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // 快選分類：all=全部 / popular=熱門 / new=新上架
  const [quickTab, setQuickTab] = useState<'all' | 'popular' | 'new'>('all');
  const [popularProfiles, setPopularProfiles] = useState<Profile[]>([]);
  const [newProfiles, setNewProfiles] = useState<Profile[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [itemsPerPage] = useState(12); // 每页显示数量
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null); // 選中的御茶室茶帖ID
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // 選中的用戶ID（用於查看用戶個人頁面）
  const [previousView, setPreviousView] = useState<ViewState | null>(null); // 追蹤之前的視圖（用於返回按鈕）
  
  const { user, isAuthenticated, logout, showWelcomeModal, setShowWelcomeModal } = useAuth();

  // 不再顯示首次進入遮罩，直接顯示內容

  // 從後端 API 載入資料（優化：先顯示緩存，後台更新）
  const isLoadingDataRef = useRef(false);
  
  const loadData = async () => {
    // 防止重複請求
    if (isLoadingDataRef.current) {
      return;
    }

    setError(null);
    
    // 先從 localStorage 讀取緩存（**只信 5 分鐘內的**，避免新妹上架看不到）
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const cacheAge = (key: string) => {
      const t = parseInt(localStorage.getItem(`${key}_time`) || '0', 10);
      return Date.now() - t;
    };

    let hasValidCache = false;
    try {
      const cachedProfiles = localStorage.getItem('sf_profiles_v1');
      const cachedArticles = localStorage.getItem('sf_articles_v1');

      if (cachedProfiles && cacheAge('sf_profiles_v1') < CACHE_TTL_MS) {
        try {
          const profiles = JSON.parse(cachedProfiles);
          if (profiles && profiles.length > 0) {
            setProfiles(profiles);
            hasValidCache = true;
            if (import.meta.env.DEV) {
              console.log(`[緩存] 已載入 ${profiles.length} 個 profiles`);
            }
          }
        } catch (e) {
          console.warn('無法解析緩存的 profiles:', e);
        }
      }
      
      if (cachedArticles && cacheAge('sf_articles_v1') < CACHE_TTL_MS) {
        try {
          const articles = JSON.parse(cachedArticles);
          if (articles && articles.length > 0) {
            setArticles(articles);
            hasValidCache = true;
            if (import.meta.env.DEV) {
              console.log(`[緩存] 已載入 ${articles.length} 個 articles`);
            }
          }
        } catch (e) {
          console.warn('無法解析緩存的 articles:', e);
        }
      }
    } catch (e) {
      console.warn('讀取緩存失敗:', e);
    }
    
    // 只有在沒有有效緩存時才顯示 loading
    if (!hasValidCache) {
      setIsLoading(true);
    }
    
    // 然後在後台從 API 獲取最新數據
    try {
      isLoadingDataRef.current = true;
      
      // 嚴選好茶需要顯示所有 profiles（因為需要篩選出 userId 為空的）
      // ==================== 首頁載入順序調整（避免同時發送大量請求）====================
      // 按照規格書：先串行載入關鍵數據，然後並行載入次要數據
      
      // 1. 先載入 profiles（關鍵數據，串行）
      const INITIAL_PROFILES_LIMIT = 100;
      const profilesResult = await Promise.allSettled([
        profilesApi.getAll({ limit: INITIAL_PROFILES_LIMIT, offset: 0 })
      ]).then(results => results[0]);
      
      // 2. 然後載入 articles（關鍵數據，串行）
      const INITIAL_ARTICLES_LIMIT = 20;
      const articlesResult = await Promise.allSettled([
        articlesApi.getAll({ limit: INITIAL_ARTICLES_LIMIT, offset: 0 })
      ]).then(results => results[0]);
      
      // 如果第一頁還有更多數據，繼續載入
      if (profilesResult.status === 'fulfilled' && profilesResult.value.hasMore) {
        const firstPageProfiles = profilesResult.value.profiles || [];
        const total = profilesResult.value.total || 0;
        const remaining = total - firstPageProfiles.length;
        
        if (remaining > 0) {
          // 載入剩餘的數據
          try {
            const remainingResult = await profilesApi.getAll({ 
              limit: remaining, 
              offset: firstPageProfiles.length 
            });
            const allProfiles = [...firstPageProfiles, ...(remainingResult.profiles || [])];
            setProfiles(allProfiles);
            
            // 更新緩存（只保存必要字段）
            try {
              const profilesForCache = allProfiles.map(p => ({
                id: p.id,
                name: p.name,
                nationality: p.nationality,
                age: p.age,
                height: p.height,
                weight: p.weight,
                cup: p.cup,
                location: p.location,
                district: p.district,
                type: p.type,
                imageUrl: p.imageUrl,
                price: p.price,
                prices: p.prices,
                tags: p.tags,
                basicServices: p.basicServices,
                addonServices: p.addonServices,
                isAvailable: p.isAvailable,
                isNew: p.isNew,
                userId: p.userId,
              }));
              localStorage.setItem('sf_profiles_v1', JSON.stringify(profilesForCache));
              localStorage.setItem('sf_profiles_v1_time', Date.now().toString());
              localStorage.setItem('sf_profiles_total', total.toString());
              if (import.meta.env.DEV) {
                console.log(`[API] 已載入所有 ${allProfiles.length} 個 profiles（分頁載入）`);
              }
            } catch (cacheError: any) {
              if (cacheError.name !== 'QuotaExceededError') {
                console.warn('無法保存所有 profiles 到緩存:', cacheError);
              }
            }
          } catch (remainingError) {
            // 如果載入剩餘數據失敗，至少使用第一頁的數據
            console.warn('載入剩餘 profiles 失敗，使用第一頁數據:', remainingError);
          }
        }
      }
      
      // 處理 profiles 結果（如果沒有分頁載入，則使用第一頁數據）
      if (profilesResult.status === 'fulfilled') {
        const result = profilesResult.value;
        // 如果沒有執行分頁載入（hasMore 為 false 或 remaining <= 0），則使用第一頁數據
        if (!result.hasMore || (result.total || 0) <= (result.profiles || []).length) {
          const profiles = result.profiles || [];
          setProfiles(profiles);
          // 更新緩存 - 優化：只保存必要字段，避免 localStorage 配額超限
          try {
            const profilesForCache = profiles.map(p => ({
              id: p.id,
              name: p.name,
              nationality: p.nationality,
              age: p.age,
              height: p.height,
              weight: p.weight,
              cup: p.cup,
              location: p.location,
              district: p.district,
              type: p.type,
              imageUrl: p.imageUrl,
              price: p.price,
              prices: p.prices,
              tags: p.tags,
              basicServices: p.basicServices,
              addonServices: p.addonServices,
              isAvailable: p.isAvailable,
              isNew: p.isNew,
              userId: p.userId,
            }));
            localStorage.setItem('sf_profiles_v1', JSON.stringify(profilesForCache));
            localStorage.setItem('sf_profiles_total', result.total?.toString() || '0');
            localStorage.setItem('sf_profiles_hasMore', result.hasMore?.toString() || 'false');
            if (import.meta.env.DEV) {
              console.log(`[API] 已更新 ${profiles.length} 個 profiles（總共 ${result.total} 個）`);
            }
          } catch (e: any) {
            if (e.name !== 'QuotaExceededError') {
              console.warn('無法保存 profiles 到緩存:', e);
            }
          }
        }
      } else {
        console.warn('載入 profiles 失敗:', profilesResult.reason);
        // 如果沒有緩存數據，設置錯誤
        if (!localStorage.getItem('sf_profiles_v1')) {
          setError('無法載入 profiles，請檢查後端連線');
        }
      }
      
      // 處理 articles 結果
      if (articlesResult.status === 'fulfilled') {
        const result = articlesResult.value;
        const articles = result.articles || [];
        setArticles(articles);
        // 更新緩存
        try {
          localStorage.setItem('sf_articles_v1', JSON.stringify(articles));
          localStorage.setItem('sf_articles_v1_time', Date.now().toString());
          if (import.meta.env.DEV) {
            console.log(`[API] 已更新 ${articles.length} 個 articles（總共 ${result.total} 個）`);
          }
        } catch (e) {
          console.warn('無法保存 articles 到緩存:', e);
        }
      } else {
        console.warn('載入 articles 失敗:', articlesResult.reason);
        // 如果沒有緩存數據，設置錯誤
        if (!localStorage.getItem('sf_articles_v1')) {
          setError('無法載入 articles，請檢查後端連線');
        }
      }
      
      // 如果兩個都失敗且沒有緩存，設置錯誤訊息
      if (profilesResult.status === 'rejected' && articlesResult.status === 'rejected' 
          && !localStorage.getItem('sf_profiles_v1') && !localStorage.getItem('sf_articles_v1')) {
        setError('無法載入資料，請檢查後端連線');
      }
    } catch (err: any) {
      console.error('載入資料失敗:', err);
      // 只有在沒有緩存數據時才顯示錯誤
      if (!localStorage.getItem('sf_profiles_v1') && !localStorage.getItem('sf_articles_v1')) {
        setError(err.message || '無法載入資料，請檢查後端連線');
      }
    } finally {
      setIsLoading(false);
      isLoadingDataRef.current = false;
    }
  };

  // 手機右滑返回上一頁
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;
      // 從螢幕左半邊開始 + 右滑超過 100px + 垂直位移小於 60px + 0.5 秒內
      if (touchStartX < window.innerWidth * 0.3 && dx > 100 && Math.abs(dy) < 60 && dt < 500) {
        // 不要在 drawer 開啟時觸發
        if (!document.querySelector('.fixed.inset-0.z-\\[100\\]')) {
          window.history.back();
        }
      }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // 初始載入（使用 useRef 防止重複載入）
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, []);

  // 監聽瀏覽器上下頁
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const profileId = params.get('profile');
      if (profileId) {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
          setCurrentView('PROFILE_DETAIL');
          setSelectedProfile(profile);
        }
      } else {
        setCurrentView('HOME');
        setSelectedProfile(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [profiles]);

  // 處理 URL 參數，當有 ?post= 時自動跳轉到對應的茶帖
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    const articleId = urlParams.get('article');
    const profileId = urlParams.get('profile');
    
    // 檢查是否有 404 參數（用於手動觸發 404 頁面）
    if (urlParams.get('404') === 'true') {
      setCurrentView('NOT_FOUND');
      return;
    }
    
    if (postId) {
      // 清除 URL 參數，避免刷新時重複處理
      window.history.replaceState({}, '', window.location.pathname);
      // 導航到御茶室並設置選中的茶帖
      setCurrentView('FORUM');
      setSelectedPostId(postId);
    } else if (articleId) {
      // 處理文章 ID —— 保留 URL 讓連結可分享（跟 profile 一樣）
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setCurrentView('ARTICLE_DETAIL');
        setSelectedArticle(article);
        // 不清 URL，讓 ?article=xxx 保留
      } else if (articles.length > 0) {
        setCurrentView('NOT_FOUND');
      }
    } else if (profileId) {
      // 處理 Profile ID（保留 URL 讓連結可分享）
      // 優化：先查本地有沒有 → 沒有就直接打 API，不等全部列表載完
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setCurrentView('PROFILE_DETAIL');
        setSelectedProfile(profile);
      } else {
        // 本地沒有 → 直接 fetch 該位（極快）
        setCurrentView('PROFILE_DETAIL');
        profilesApi.getById(profileId)
          .then(p => {
            if (p) setSelectedProfile(p);
            else setCurrentView('NOT_FOUND');
          })
          .catch(() => setCurrentView('NOT_FOUND'));
      }
    }
  }, [articles, profiles]);

  // 監聽通知導航事件
  useEffect(() => {
    const handleNavigateToUserProfile = (event: CustomEvent) => {
      const { tab } = event.detail || {};
      handleNavigation('USER_PROFILE');
      // 發送設置 tab 的事件
      if (tab) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user-profile-set-tab', { detail: { tab } }));
        }, 100);
      }
    };

    const handleNavigateToForum = () => {
      handleNavigation('FORUM');
    };

    const handleNavigateToForumPost = (event: CustomEvent) => {
      const { postId } = event.detail || {};
      if (postId) {
        setSelectedPostId(postId);
        handleNavigation('POST_DETAIL');
      }
    };

    const handleNavigateToProfile = (event: CustomEvent) => {
      const { profileId } = event.detail || {};
      if (profileId) {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
          handleNavigation('PROFILE_DETAIL', profile);
        }
      }
    };

    const handleNavigateToUserBlog = (event: CustomEvent) => {
      const { userId } = event.detail || {};
      
      // 詳細的調試日誌
      if (import.meta.env.DEV) {
        console.log('[導航] 收到 navigate-to-user-blog 事件', { 
          userId, 
          userIdType: typeof userId,
          userIdLength: userId?.length,
          detail: event.detail 
        });
      }
      
      // 確保 userId 存在且不為空字符串
      if (userId && typeof userId === 'string' && userId.trim() !== '') {
        const trimmedUserId = userId.trim();
        // 保存當前的視圖作為之前的視圖
        setPreviousView(currentView);
        setSelectedUserId(trimmedUserId);
        handleNavigation('USER_BLOG');
        
        if (import.meta.env.DEV) {
          console.log('[導航] 成功導航到用戶頁面', { userId: trimmedUserId });
        }
      } else {
        console.warn('無法導航到用戶頁面：userId 為空或未定義', { 
          userId, 
          userIdType: typeof userId,
          detail: event.detail 
        });
        // 如果 userId 無效，不進行導航，避免顯示錯誤頁面
        alert('無法查看該用戶的公開檔案：用戶ID無效');
      }
    };

    const handleNavigate = (event: CustomEvent) => {
      const { view } = event.detail || {};
      if (view === 'PROVIDER_LISTING') {
        handleNavigation('PROVIDER_LISTING');
      }
    };

    window.addEventListener('navigate-to-user-profile', handleNavigateToUserProfile as EventListener);
    window.addEventListener('navigate-to-forum', handleNavigateToForum);
    window.addEventListener('navigate-to-forum-post', handleNavigateToForumPost as EventListener);
    window.addEventListener('navigate-to-profile', handleNavigateToProfile as EventListener);
    window.addEventListener('navigate-to-user-blog', handleNavigateToUserBlog as EventListener);
    window.addEventListener('navigate', handleNavigate as EventListener);

    return () => {
      window.removeEventListener('navigate-to-user-profile', handleNavigateToUserProfile as EventListener);
      window.removeEventListener('navigate-to-forum', handleNavigateToForum);
      window.removeEventListener('navigate-to-forum-post', handleNavigateToForumPost as EventListener);
      window.removeEventListener('navigate-to-profile', handleNavigateToProfile as EventListener);
      window.removeEventListener('navigate-to-user-blog', handleNavigateToUserBlog as EventListener);
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, [profiles, currentView]);

  // 當切換到 HOME 或 NEWS 時，重新載入資料（確保顯示最新資料）
  useEffect(() => {
    if (currentView === 'HOME' || currentView === 'NEWS') {
      // 如果有緩存數據，不立即重新載入，避免影響 LCP
      // 只在沒有緩存時才載入，或延遲載入（後台更新）
      const hasCache = currentView === 'NEWS' 
        ? localStorage.getItem('sf_articles_v1')
        : localStorage.getItem('sf_profiles_v1');
      
      if (!hasCache) {
        // 沒有緩存時立即載入
        loadData();
      } else {
        // 有緩存時延遲載入（後台更新），不影響顯示
        const timer = setTimeout(() => {
          loadData();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // 重置所有篩選並重新載入資料
  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      location: '全部',
      nationalities: [],
      bodyTypes: [],
      personalities: [],
      ageRange: [18, 80],
      priceRange: [0, 200000],
      cup: []
    });
    loadData();
  };

  // 自動更新：TG Web App / 瀏覽器分頁回到前景時，悄悄重抓最新資料
  // 避免用戶看到舊快取（特別是新妹上架後）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // 上次載入超過 60 秒才重抓，避免快速切換造成濫請求
      const lastLoad = parseInt(localStorage.getItem('sf_profiles_v1_time') || '0', 10);
      if (Date.now() - lastLoad > 60_000) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // 搜索功能
  const searchProfiles = (profiles: Profile[], query: string): Profile[] => {
    if (!query.trim()) return profiles;
    
    const lowerQuery = query.toLowerCase().trim();
    return profiles.filter(p => {
      // 搜索名字
      if (p.name.toLowerCase().includes(lowerQuery)) return true;
      // 搜索地区
      if (p.location.toLowerCase().includes(lowerQuery)) return true;
      // 搜索标签
      if (p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
      // 搜索服务
      if (p.basicServices?.some(service => service.toLowerCase().includes(lowerQuery))) return true;
      if (p.addonServices?.some(service => service.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });
  };

  // 篩選 + 搜索 + 隨機排序（本月精選隨機出現）
  const filteredProfiles = useMemo(() => {
    // 快選分頁：熱門 / 新上架 → 直接用後端排好的陣列
    let source: Profile[] = profiles;
    if (currentView === 'HOME' && quickTab === 'popular' && popularProfiles.length > 0) {
      source = popularProfiles;
    } else if (currentView === 'HOME' && quickTab === 'new' && newProfiles.length > 0) {
      source = newProfiles;
    }

    // 先应用搜索
    let result = searchProfiles(source, searchQuery);

    // 嚴選好茶页面只显示后台管理员上架的profiles（userId为空或null）
    if (currentView === 'HOME') {
      result = result.filter(p => {
        const hasUserId = p.userId && p.userId !== '' && p.userId !== null && p.userId !== undefined;
        return !hasUserId;
      });
    }
    
    // 再应用筛选
    result = result.filter(p => {
      const tags = p.tags || [];
      // 获取实际价格：优先使用prices.oneShot.price，如果没有则使用price字段
      const actualPrice = p.prices?.oneShot?.price || p.price || 0;
      const priceValue = typeof actualPrice === 'number' ? actualPrice : Number(actualPrice || 0);

      const matchType = filters.type === 'all' || p.type === filters.type;
      // 地區：去掉「市」「縣」做模糊比對 + 支援多選（逗號分隔，OR 邏輯）
      const normLoc = (s: string) => (s || '').replace(/[市縣]/g, '');
      const matchLoc = !filters.location || filters.location === '全部' || filters.location.split(',').some(loc => {
        const n = normLoc(loc);
        const pn = normLoc(p.location);
        return pn.includes(n) || n.includes(pn);
      });
      // 國籍：篩選 value 可能是 emoji 也可能是文字，DB 可能存 emoji 也可能存中文，雙向都比對
      const FLAG_TO_TEXT: Record<string, string> = {
        '🇹🇼': '台灣', '🇯🇵': '日本', '🇰🇷': '韓國', '🇭🇰': '香港',
        '🇨🇳': '中國', '🇹🇭': '泰國', '🇻🇳': '越南', '🇲🇾': '馬來西亞', '🇸🇬': '新加坡',
      };
      const TEXT_TO_FLAG: Record<string, string> = Object.fromEntries(
        Object.entries(FLAG_TO_TEXT).map(([k, v]) => [v, k])
      );
      const matchNat = filters.nationalities.length === 0 || filters.nationalities.some(filterVal => {
        const filterText = FLAG_TO_TEXT[filterVal] || filterVal;
        const filterFlag = TEXT_TO_FLAG[filterVal] || filterVal;
        const pNat = p.nationality || '';
        return pNat === filterVal || pNat === filterText || pNat === filterFlag ||
               pNat.includes(filterText) || pNat.includes(filterFlag);
      });
      const matchCup = filters.cup.length === 0 || filters.cup.includes(p.cup);
      // 價格過濾：拉 slider 後，沒價格的小姐也要被過濾掉
      const priceLimit = filters.priceRange ? filters.priceRange[1] : 200000;
      const noPriceFilter = !filters.priceRange || priceLimit >= 200000;
      const matchPrice = noPriceFilter || (priceValue > 0 && priceValue <= priceLimit);
      // 年齡過濾：實際比對範圍
      const matchAge = !filters.ageRange || (p.age >= filters.ageRange[0] && p.age <= filters.ageRange[1]);

      const shouldShow = matchType && matchLoc && matchNat && matchCup && matchPrice && matchAge;
      
      return shouldShow;
    });

    return result;
  }, [profiles, filters, searchQuery, currentView, quickTab, popularProfiles, newProfiles]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, currentView]);

  // 導航核心邏輯（即時切換，無遮罩）
  const handleNavigation = (view: ViewState, data?: any) => {
    setIsMobileNavOpen(false);
    // 如果导航到详情页，记录来源页面 + 更新 URL（可分享）
    if (view === 'PROFILE_DETAIL') {
      setSelectedProfile(data);
      setProfileDetailSource(currentView);
      if (data?.id) {
        window.history.pushState({}, '', `?profile=${data.id}`);
      }
    } else if (view === 'FORUM') {
      setSelectedPostId(null);
    } else if (view === 'HOME' || view === 'NEWS' || view === 'PROVIDER_LISTING') {
      setSelectedProfile(null);
      setSelectedArticle(null);
      window.history.pushState({}, '', window.location.pathname);
    }
    if (view === 'ARTICLE_DETAIL') {
      setSelectedArticle(data);
      if (data?.id) {
        window.history.pushState({}, '', `?article=${data.id}`);
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSaveProfile = (savedProfile: Profile) => {
    setProfiles(prev => {
        const exists = prev.find(p => p.id === savedProfile.id);
        if (exists) return prev.map(p => p.id === savedProfile.id ? savedProfile : p);
        return [savedProfile, ...prev];
    });
    handleNavigation('HOME');
  };

  const handleDeleteProfile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!window.confirm("確定下架此項目？")) {
      return;
    }
    
    try {
      // 調用後端 API 刪除
      await profilesApi.delete(id);
      // 刪除成功後重新載入資料
      await loadData();
    } catch (err: any) {
      console.error('刪除失敗:', err);
      alert('刪除失敗: ' + (err.message || '無法連接到後端'));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-brand-black font-sans">
      <PageTransition isVisible={isTransitioning} />

      {/* 導覽列 */}
      <header className="bg-white sticky top-0 z-50 border-b h-20 flex items-center shadow-sm relative" style={{
        borderBottom: '2px solid rgba(26, 95, 63, 0.1)',
        boxShadow: '0 2px 4px -1px rgba(26, 95, 63, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-center md:justify-between relative">
          {/* 手機版漢堡選單（靠左） */}
          <button
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-700 bg-white shadow-sm absolute left-4 top-1/2 -translate-y-1/2 space-y-1 z-10"
            aria-label="Open navigation"
            onClick={() => setIsMobileNavOpen(prev => !prev)}
          >
            <span className="block w-6 h-[2px] bg-gray-800 rounded-full" />
            <span className="block w-6 h-[2px] bg-gray-800 rounded-full" />
            <span className="block w-6 h-[2px] bg-gray-800 rounded-full" />
          </button>

          {/* 手機版右上角：個人檔案 + 通知鈴鐺 */}
          {isAuthenticated ? (
            <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
              <button
                onClick={() => handleNavigation('USER_PROFILE')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md"
                style={{ backgroundColor: '#1a5f3f' }}
                aria-label="個人檔案"
                title="個人檔案"
              >
                👤
              </button>
              <NotificationBox />
            </div>
          ) : (
            <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthModalMode('login');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                登入
              </button>
            </div>
          )}

          {/* Logo + 標題置中（手機版） */}
          <div className="flex items-center gap-2 md:gap-10">
            <button
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleNavigation('ABOUT')}
            >
              <div className="w-[50px] h-[50px] flex items-center justify-center overflow-hidden relative flag-container" style={{
                background: 'transparent'
              }}>
                <img
                  src={getImageUrl("/images/關於茶王/旗幟.png")}
                  alt="茶王旗幟"
                  className="w-full h-full object-contain group-hover:brightness-110 transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(26, 95, 63, 0.3))',
                    /* 移除無限動畫，省手機 GPU */
                    transformOrigin: 'center center',
                    width: '50px',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    // 如果圖片載入失敗，顯示文字作為備用
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-black text-2xl" style="background: linear-gradient(135deg, #1a5f3f 0%, #15803d 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">茶</span>';
                    }
                  }}
                />
                <style>{`
                  @keyframes flagWave {
                    0%, 100% {
                      transform: scale(1) rotate(0deg);
                    }
                    25% {
                      transform: scale(1.05) rotate(1deg);
                    }
                    50% {
                      transform: scale(1) rotate(0deg);
                    }
                    75% {
                      transform: scale(1.05) rotate(-1deg);
                    }
                  }
                `}</style>
              </div>
              <div className="flex flex-col items-start leading-tight">
                <h1 className="text-2xl font-serif font-black tracking-tight text-brand-black">
                  茶王
                </h1>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                  一本道品茶，只為懂茶的你
                </p>
              </div>
            </button>

            {/* 桌面版導覽列 */}
            <nav className="hidden md:flex gap-8 ml-8">
              <button 
                onClick={() => handleNavigation('HOME')} 
                className={`text-xs font-black tracking-widest uppercase transition-all pb-1 border-b-2 elegant-hover ${currentView === 'HOME' ? 'text-brand-yellow border-brand-yellow' : 'text-gray-400 border-transparent hover:text-brand-black'}`}
                style={currentView === 'HOME' ? { color: '#1a5f3f', borderColor: '#1a5f3f' } : {}}
              >
                嚴選好茶
              </button>
              <button 
                onClick={() => handleNavigation('NEWS')} 
                className={`text-xs font-black tracking-widest uppercase transition-all pb-1 border-b-2 elegant-hover ${currentView === 'NEWS' || currentView === 'ARTICLE_DETAIL' ? 'text-brand-yellow border-brand-yellow' : 'text-gray-400 border-transparent hover:text-brand-black'}`}
                style={currentView === 'NEWS' || currentView === 'ARTICLE_DETAIL' ? { color: '#1a5f3f', borderColor: '#1a5f3f' } : {}}
              >
                御前茶訊
              </button>
              <button 
                onClick={() => handleNavigation('ABOUT')} 
                className={`text-xs font-black tracking-widest uppercase transition-all pb-1 border-b-2 elegant-hover ${currentView === 'ABOUT' ? 'text-brand-yellow border-brand-yellow' : 'text-gray-400 border-transparent hover:text-brand-black'}`}
                style={currentView === 'ABOUT' ? { color: '#1a5f3f', borderColor: '#1a5f3f' } : {}}
              >
                關於茶王
              </button>
            </nav>
          </div>
          
          {/* 桌面版右側 */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavigation('USER_PROFILE')}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all hover:scale-105"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  👤 {user?.userName || '個人檔案'}
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  登出
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthModalMode('login');
                }}
                className="premium-button text-white px-6 py-2 rounded-lg font-medium text-sm transition-all shadow-md"
              >
                登入/註冊
              </button>
            )}
          </div>
        </div>
        
        {/* 手機版下拉選單 */}
        {isMobileNavOpen && (
          <div className="md:hidden absolute top-20 inset-x-0 bg-white border-b border-gray-100 shadow-sm z-40">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <button
                onClick={() => handleNavigation('HOME')}
                className={`text-sm text-left py-2 elegant-hover ${currentView === 'HOME' ? 'font-black' : 'text-gray-700'}`}
                style={currentView === 'HOME' ? { color: '#1a5f3f' } : {}}
              >
                嚴選好茶
              </button>
              <button
                onClick={() => handleNavigation('NEWS')}
                className={`text-sm text-left py-2 elegant-hover ${currentView === 'NEWS' || currentView === 'ARTICLE_DETAIL' ? 'font-black' : 'text-gray-700'}`}
                style={currentView === 'NEWS' || currentView === 'ARTICLE_DETAIL' ? { color: '#1a5f3f' } : {}}
              >
                御前茶訊
              </button>
              <button
                onClick={() => {
                  handleNavigation('ABOUT');
                  setIsMobileNavOpen(false);
                }}
                className={`text-sm text-left py-2 elegant-hover ${currentView === 'ABOUT' ? 'font-black' : 'text-gray-700'}`}
                style={currentView === 'ABOUT' ? { color: '#1a5f3f' } : {}}
              >
                關於茶王
              </button>
              <div className="border-t border-gray-200 mt-3 pt-3 space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => { handleNavigation('USER_PROFILE'); setIsMobileNavOpen(false); }}
                      className="w-full text-center px-4 py-2 rounded-lg text-white text-sm font-bold"
                      style={{ backgroundColor: '#1a5f3f' }}
                    >
                      👤 {user?.userName || '個人檔案'}
                    </button>
                    <button
                      onClick={() => { logout(); setIsMobileNavOpen(false); }}
                      className="w-full text-center px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                    >
                      登出
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setAuthModalMode('login'); setIsMobileNavOpen(false); }}
                    className="w-full text-center px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#1a5f3f' }}
                  >
                    登入/註冊
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 主內容區 */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className={`flex flex-col lg:flex-row gap-12 ${currentView === 'HOME' ? '' : 'justify-center'}`}>

          {/* 嚴選好茶 - 篩選抽屜（桌面+手機統一用抽屜） */}

          <div className="flex-1 w-full">
            {/* 視圖切換邏輯 */}
            {currentView === 'HOME' && (
              <div className="animate-fade-in-up">
                {/* Banner - 16:9 比例 - 固定尺寸避免 CLS */}
                <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-lg bg-gray-100" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${getImageUrl("/images/tea_king_jp_4cs6eng0g.jpg")})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
                    <div className="relative h-full flex items-center justify-center px-6">
                      <div className="text-center text-white">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-lg">嚴選好茶</h1>
                        <p className="text-lg md:text-xl opacity-90 drop-shadow-md">茶室皇家精選，品質保證</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-serif font-black text-brand-black">茶室皇家精選</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Royal Selection</p>
                    </div>
                    <div className="hidden sm:flex gap-2 items-center">
                         <div className="h-1.5 w-12 bg-brand-yellow rounded-full"></div>
                         <div className="h-1.5 w-4 bg-gray-200 rounded-full"></div>
                    </div>
                </div>

                {/* 快選分類：全部 / 熱門 / 新上架 — 跟篩選分開 */}
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {[
                    { key: 'all',     label: '✨ 全部佳麗', desc: '看全部' },
                    { key: 'popular', label: '🔥 熱門',     desc: '最多人收藏' },
                    { key: 'new',     label: '🆕 新上架',   desc: '7 天內' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={async () => {
                        setQuickTab(t.key as any);
                        setCurrentPage(1);
                        if (t.key === 'popular' && popularProfiles.length === 0) {
                          try {
                            const r = await profilesApi.getPopular(50);
                            setPopularProfiles(r.profiles);
                          } catch (e) { console.warn('load popular failed', e); }
                        }
                        if (t.key === 'new' && newProfiles.length === 0) {
                          try {
                            const r = await profilesApi.getNew(50);
                            setNewProfiles(r.profiles);
                          } catch (e) { console.warn('load new failed', e); }
                        }
                      }}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                        quickTab === t.key
                          ? 'text-white shadow-lg scale-105'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                      style={quickTab === t.key ? { backgroundColor: '#1a5f3f' } : {}}
                      title={t.desc}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* 搜索框 */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋茶茶名字、地區、標籤..."
                      className="w-full px-4 py-3 pl-12 pr-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-sm"
                      style={{ focusRingColor: '#1a5f3f' }}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* 篩選按鈕 - sticky 黏在頁面頂部，滾動也看得到 */}
                <div className="sticky top-2 z-30 mb-4 flex justify-start">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white shadow-2xl transition-transform hover:scale-105"
                    style={{ backgroundColor: '#1a5f3f' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    進階篩選
                    {(filters.location !== '全部' || filters.nationalities.length > 0 || filters.bodyTypes.length > 0 || filters.personalities.length > 0 || filters.cup.length > 0 || filters.type !== 'all') && (
                      <span className="ml-1 bg-white/30 px-2 py-0.5 rounded-full text-xs">已篩選</span>
                    )}
                  </button>
                </div>

                {/* 隱藏舊浮動按鈕（用 sticky 取代）*/}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="hidden"
                  style={{ display: 'none' }}
                  title="進階篩選"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeWidth={2} />
                  </svg>
                  <span className="hidden sm:inline">篩選</span>
                </button>

                {/* 篩選抽屜 */}
                {isFilterOpen && createPortal(
                  <div className="fixed inset-0 z-[100]">
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-80 bg-white shadow-2xl flex flex-col animate-slide-in-right">
                      {/* Header — 固定 */}
                      <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                        <h3 className="font-bold text-lg">進階篩選</h3>
                        <button onClick={() => setIsFilterOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {/* Content — 唯一可滾動區 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        <SidebarFilter
                          filters={filters}
                          setFilters={setFilters}
                          totalCount={filteredProfiles.length}
                          onResetFilters={() => setFilters({ type: 'all', location: '全部', nationalities: [], bodyTypes: [], personalities: [], ageRange: [18, 80], priceRange: [0, 200000], cup: [] })}
                        />
                      </div>
                      {/* Bottom 按鈕 — 固定 */}
                      <div className="flex-shrink-0 bg-white border-t p-4">
                        <button
                          onClick={() => setIsFilterOpen(false)}
                          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-transform hover:scale-105"
                          style={{ backgroundColor: '#1a5f3f' }}
                        >
                          應用篩選
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

                {/* 載入狀態 - Skeleton */}
                {isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                        <div className="p-4 space-y-3">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-2/3" />
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                          <div className="flex gap-2">
                            <div className="h-6 bg-gray-100 rounded-full animate-pulse w-16" />
                            <div className="h-6 bg-gray-100 rounded-full animate-pulse w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 錯誤訊息 */}
                {error && !isLoading && (
                  <div className="py-8 px-6 mb-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ 載入資料失敗</h3>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                      <button 
                        onClick={loadData} 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        重試
                      </button>
                    </div>
                  </div>
                )}

                {/* Profiles 列表 */}
                {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProfiles.length === 0 ? (
                          <div className="col-span-full py-40 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                            <h3 className="text-xl font-serif font-black text-gray-400">目前沒有符合條件的內容</h3>
                            <button onClick={() => setFilters({ type: 'all', location: '全部', nationalities: [], bodyTypes: [], personalities: [], ageRange: [0, 200], priceRange: [0, 200000], cup: [] })} className="mt-6 px-6 py-2 bg-brand-black text-white rounded-full text-xs font-bold uppercase">重置篩選</button>
                        </div>
                    ) : (
                        <>
                        {paginatedProfiles.map((p, pIdx) => (
                            <a
                                key={p.id}
                                href={`#profile-${p.id}`}
                                className="group cursor-pointer japanese-card-border premium-card-shadow elegant-hover relative bg-white block" 
                                style={{ 
                                    borderRadius: '16px',
                                    overflow: 'hidden'
                                }} 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNavigation('PROFILE_DETAIL', p);
                                }}
                            >
                                {/* 圖片容器 - 優化 LCP */}
                                <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '3 / 4' }}>
                                    <img 
                                        src={getImageUrl(p.imageUrl)} 
                                        alt={p.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                        loading={pIdx < 6 ? "eager" : "lazy"}
                                        decoding="async"
                                        fetchPriority={pIdx < 6 ? "high" : "low"}
                                        width={400}
                                        height={533}
                                    />
                                    
                                    {/* 收藏按钮 - 所有人都看得到 */}
                                    <div className="absolute top-5 right-5 z-20">
                                      <FavoriteButton profileId={p.id} />
                                    </div>
                                    
                                    {/* 原有的標籤和文字 */}
                                    <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
                                        <span className={`text-white font-black px-3 py-1 rounded-lg ${p.type === 'incall' ? 'bg-blue-600' : 'bg-brand-black'}`} style={{ fontSize: '10px' }}>
                                            {p.type === 'incall' ? '🏠 定點' : '🚗 外送'}
                                        </span>
                                    </div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent z-10">
                                        <div className="flex justify-between items-end text-white">
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-serif font-black">{p.name} {p.nationality}</h3>
                                                <div className="flex gap-2 mt-1.5 sm:mt-2 opacity-80 font-bold text-[11px] sm:text-xs">
                                                    <span>{p.age}歲</span><span>{'|'}</span><span>{p.cup}罩杯</span><span>{'|'}</span><span>{p.location}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <PriceDisplay 
                                                  price={p.price} 
                                                  prices={p.prices}
                                                  type={p.type}
                                                  showWarning={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <FakeStats id={p.id} />
                                {/* 評論摘要 */}
                                {((p as any).reviewCount > 0 || (p as any).averageRating > 0) && (
                                  <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                                    <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <span className="text-sm font-bold text-gray-700">{((p as any).averageRating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-gray-400">({(p as any).reviewCount} 則評論)</span>
                                  </div>
                                )}
                            </a>
                        ))}

                        {/* 分页控件 */}
                        {totalPages > 1 && (
                          <div className="col-span-full mt-12 pb-20 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                currentPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-brand-green text-white hover:bg-opacity-90'
                              }`}
                              style={currentPage !== 1 ? { backgroundColor: '#1a5f3f' } : {}}
                            >
                              上一頁
                            </button>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 7) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 4) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 3) {
                                  pageNum = totalPages - 6 + i;
                                } else {
                                  pageNum = currentPage - 3 + i;
                                }

                                // 手機版只顯示當前頁附近 3 個
                                const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm transition-colors ${
                                      isNearCurrent ? '' : 'hidden sm:inline-flex'
                                    } ${
                                      currentPage === pageNum
                                        ? 'bg-brand-green text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    style={currentPage === pageNum ? { backgroundColor: '#1a5f3f' } : {}}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                currentPage === totalPages
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-brand-green text-white hover:bg-opacity-90'
                              }`}
                              style={currentPage !== totalPages ? { backgroundColor: '#1a5f3f' } : {}}
                            >
                              下一頁
                            </button>
                          </div>
                        )}
                        </>
                    )}
                </div>
                )}
              </div>
            )}

            {currentView === 'NEWS' && (
              <div className="animate-fade-in-up w-full">
                {/* Banner - 16:9 比例 */}
                <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-lg" style={{ aspectRatio: '16/9' }}>
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${getImageUrl("/images/tea_king_jp_jylllrdh4.jpg")})`,

                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
                    <div className="relative h-full flex items-center justify-center px-6">
                      <div className="text-center text-white">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-lg">御前茶訊</h1>
                        <p className="text-lg md:text-xl opacity-90 drop-shadow-md">茶王親示 · 最新消息與重要提醒</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-12 border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-serif font-black text-brand-black">御前茶訊</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Latest News & Announcements</p>
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => setEditingArticle({} as Article)}
                        className="px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 font-medium flex items-center gap-2"
                        style={{ backgroundColor: '#1a5f3f' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        發佈新文章
                      </button>
                    )}
                </div>
                {isLoading && articles.length === 0 ? (
                  // 骨架屏 - 提升 LCP，讓用戶更快看到內容結構
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden animate-pulse">
                        <div className="aspect-[16/10] bg-gray-200"></div>
                        <div className="p-7 space-y-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="flex justify-between items-center pt-5 border-t border-gray-50">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="py-8 px-6 mb-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ 載入資料失敗</h3>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                      <button 
                        onClick={loadData} 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        重試
                      </button>
                    </div>
                  </div>
                ) : editingArticle !== null ? (
                  <AdminArticleEditor
                    onSave={(article) => {
                      setArticles([article, ...articles]);
                      setEditingArticle(null);
                      loadData();
                    }}
                    onCancel={() => setEditingArticle(null)}
                  />
                ) : (
                <NewsList articles={articles} onArticleClick={(a) => handleNavigation('ARTICLE_DETAIL', a)} />
                )}
              </div>
            )}

            {currentView === 'PROFILE_DETAIL' && selectedProfile && (
                <ProfileDetail
                  profile={selectedProfile}
                  onBack={() => handleNavigation(profileDetailSource === 'PROVIDER_LISTING' ? 'PROVIDER_LISTING' : 'HOME')}
                />
            )}
            {currentView === 'PROFILE_DETAIL' && !selectedProfile && (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#1a5f3f', borderTopColor: 'transparent' }} />
                    <p className="text-gray-500 text-sm">載入佳麗資料中...</p>
                </div>
            )}

            {currentView === 'USER_PROFILE' && (
                <UserProfile />
            )}

            {currentView === 'ARTICLE_DETAIL' && selectedArticle && (
                <ArticleDetail
                  article={selectedArticle}
                  onBack={() => handleNavigation('NEWS')}
                  allArticles={articles}
                  onArticleClick={(article) => handleNavigation('ARTICLE_DETAIL', article)}
                  onBrowseProfiles={() => handleNavigation('HOME')}
                />
            )}


            {currentView === 'ADMIN_PROFILE' && (
                <AdminEditor 
                    initialData={editingProfile} 
                    allProfiles={profiles}
                    onSave={handleSaveProfile} 
                    onCancel={() => handleNavigation('HOME')} 
                />
            )}


            {currentView === 'ABOUT' && (
              <AboutTeaKing
                onBack={previousView ? () => handleNavigation(previousView) : undefined}
                onNavigateToForum={() => handleNavigation('HOME')}
                onNavigateToNews={() => handleNavigation('NEWS')}
              />
            )}

            {currentView === 'NOT_FOUND' && (
              <NotFound
                onBack={() => handleNavigation('HOME')}
              />
            )}
          </div>


        </div>
      </main>

      {/* 頁尾 */}
      <footer className="bg-white border-t border-gray-100 py-20 mt-20 relative" style={{
        borderTop: '2px solid rgba(26, 95, 63, 0.1)'
      }}>
          {/* Japanese decorative line */}
          <div className="japanese-line"></div>
          <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-6 overflow-hidden relative" style={{
                background: 'transparent'
              }}>
                <img
                  src={getImageUrl("/images/關於茶王/旗幟.png")}
                  alt="茶王旗幟"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(26, 95, 63, 0.3))',
                    /* 移除無限動畫，省手機 GPU */
                    transformOrigin: 'center center',
                    width: '48px',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-black text-2xl" style="background: linear-gradient(135deg, #1a5f3f 0%, #15803d 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">茶</span>';
                    }
                  }}
                />
              </div>
              <p className="text-brand-black text-sm font-black tracking-[0.3em] uppercase mb-4">一本道品茶，只為懂茶的你</p>
              <p className="text-gray-300 text-[10px]">© 2025 茶王 ALL RIGHTS RESERVED.</p>
          </div>
      </footer>

      {/* 底部狀態欄：顯示時間和在線人數 */}
      <Footer />

      <style>{`
        .animate-fade-in-up { animation: fadeInUp 0.12s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flagWave {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.05) rotate(-2deg);
          }
          50% {
            transform: scale(1) rotate(0deg);
          }
          75% {
            transform: scale(1.05) rotate(2deg);
          }
        }
      `}</style>


      {/* 皇朝御璽風浮動按鈕 */}
      <a
        href="https://lin.ee/yxB700g"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-3 bottom-4 sm:right-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 group"
      >
        {/* 御璽印章主體 */}
        <div className="relative flex flex-col items-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-x-1">
          {/* 外框 - 雙層金邊 */}
          <div
            className="relative w-12 h-16 sm:w-16 sm:h-20 rounded-sm flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0f2e1f 0%, #1a5f3f 50%, #0f2e1f 100%)',
              border: '2px solid #c9a96e',
              boxShadow: '0 0 0 1px #0f2e1f, 0 0 0 3px #c9a96e30, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,169,110,0.3)',
            }}
          >
            {/* 頂部裝飾線 */}
            <div className="absolute top-1.5 left-2 right-2 h-px" style={{ backgroundColor: '#c9a96e40' }} />

            {/* 御璽文字 */}
            <span
              className="font-serif font-black text-base sm:text-lg leading-none"
              style={{ color: '#c9a96e', textShadow: '0 0 8px rgba(201,169,110,0.4)' }}
            >
              約
            </span>
            <span
              className="font-serif font-black text-base sm:text-lg leading-none mt-0.5"
              style={{ color: '#c9a96e', textShadow: '0 0 8px rgba(201,169,110,0.4)' }}
            >
              茶
            </span>

            {/* 底部裝飾線 */}
            <div className="absolute bottom-1.5 left-2 right-2 h-px" style={{ backgroundColor: '#c9a96e40' }} />
          </div>

          {/* 下方小標籤 */}
          <div
            className="mt-1 px-2 py-0.5 rounded-sm text-center"
            style={{
              backgroundColor: '#c9a96e',
              color: '#0f2e1f',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.15em',
            }}
          >
            聯繫客服
          </div>

          {/* hover 時的光暈效果 */}
          <div
            className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: '0 0 20px rgba(201,169,110,0.4), 0 0 40px rgba(26,95,63,0.2)' }}
          />
        </div>
      </a>
      {/* 认证模态框 */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};

export default App;