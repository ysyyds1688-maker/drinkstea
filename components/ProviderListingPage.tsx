import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Profile, FilterCriteria } from '../types';
import { profilesApi, reviewsApi } from '../services/apiService';
import { getImageUrl } from '../config/api';
import { SidebarFilter } from './SidebarFilter';
import { ProfileCardWithReviews } from './ProfileCardWithReviews';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface ProviderListingPageProps {
  onProfileClick?: (profile: Profile) => void;
}

export const ProviderListingPage: React.FC<ProviderListingPageProps> = ({ onProfileClick }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false); // 移动端筛选抽屉状态
  const [currentPage, setCurrentPage] = useState(1); // 當前頁碼
  const [itemsPerPage] = useState(12); // 每頁顯示數量
  const loadingRef = useRef(false); // 防止重複請求
  
  const { userStatus, isSubscribed, refreshSubscription, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<FilterCriteria>({
    type: 'all',
    location: '全部',
    nationalities: [],
    bodyTypes: [],
    personalities: [],
    ageRange: [18, 80],
    priceRange: [0, 200000], // 提高上限，但實際不限制價格顯示
    cup: []
  });

  // 加载数据
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    // 防止重複請求
    if (loadingRef.current) {
      return;
    }
    
    // 先從緩存讀取數據，立即顯示（提升 LCP）
    const cacheKey = 'provider_listing_profiles';
    let hasValidCache = false;
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 緩存有效期 5 分鐘
        if (now - cacheTime < 5 * 60 * 1000 && cached.profiles && cached.profiles.length > 0) {
          setProfiles(cached.profiles);
          hasValidCache = true;
        }
      }
    } catch (e) {
      // 忽略緩存錯誤
    }
    
    try {
      loadingRef.current = true;
      // 只有在沒有有效緩存時才顯示 loading
      if (!hasValidCache) {
        setIsLoading(true);
      }
      setError(null);
      
      // 列表頁需要載入所有 profiles 進行篩選（但使用分頁 API 獲取更多數據）
      const result = await profilesApi.getAll({ limit: 100, offset: 0 }); // 先載入前 100 個
      const profiles = result.profiles || [];
      setProfiles(profiles);
      
      // 更新緩存
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          profiles: profiles,
          timestamp: Date.now()
        }));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (err: any) {
      // 靜默處理錯誤，不顯示 console.error（除非沒有緩存）
      if (!hasValidCache) {
        setError(err.message || '無法載入資料');
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

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

  // 筛选逻辑
  const filteredProfiles = useMemo(() => {
    // 先应用搜索
    let result = searchProfiles(profiles, searchQuery);
    
    // 特選鮮魚頁面只顯示由Provider用戶自己上架的profiles（userId不為空）
    result = result.filter(p => p.userId != null && p.userId !== '');
    
    const filtered = result.filter(p => {
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      
      // 區域篩選：支援多區域（用逗號分隔）
      if (filters.location !== '全部') {
        const profileLocations = p.location ? p.location.split(',').map(loc => loc.trim()) : [];
        if (!profileLocations.includes(filters.location)) return false;
      }
      
      if (filters.nationalities.length > 0 && !filters.nationalities.includes(p.nationality)) return false;
      if (filters.ageRange[0] > p.age || filters.ageRange[1] < p.age) return false;
      // 移除價格上限限制，所有價格都能顯示
      // if (filters.priceRange[0] > p.price || filters.priceRange[1] < p.price) return false;
      if (filters.cup.length > 0 && !filters.cup.includes(p.cup)) return false;
      
      // Body types and personalities (tags)
      if (filters.bodyTypes.length > 0) {
        const hasBodyType = filters.bodyTypes.some(bt => p.tags?.includes(bt));
        if (!hasBodyType) return false;
      }
      if (filters.personalities.length > 0) {
        const hasPersonality = filters.personalities.some(per => p.tags?.includes(per));
        if (!hasPersonality) return false;
      }
      
      return true;
    });

    return filtered;
  }, [profiles, filters, searchQuery]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage, itemsPerPage]);

  // 當篩選條件或搜索改變時，回到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const handleResetFilters = useCallback(() => {
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
  }, []);

  // 獲取可見評論數量（特選鮮魚頁面只顯示1則）
  const getVisibleReviewCount = (): number | 'all' => {
    if (userStatus === 'guest') return 0;
    return 1; // 只顯示1則評論
  };

  const handleSubscribeClick = useCallback(async () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }
    
    try {
      const { subscriptionsApi } = await import('../services/apiService');
      await subscriptionsApi.subscribe('tea_scholar', 30); // 订阅30天，入門茶士等級
      await refreshSubscription();
    } catch (error: any) {
      alert('訂閱失敗：' + (error.message || '未知錯誤'));
    }
  }, [isAuthenticated, refreshSubscription]);

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      {/* Banner - 16:9 比例 - 固定尺寸避免 CLS */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-lg bg-gray-100" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${getImageUrl("/images/tea_king_jp_61trv5d1k.jpg")})`,

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
              <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-lg">御選魚市</h1>
              <p className="text-lg md:text-xl opacity-90 drop-shadow-md">茶王嚴選 · 值得一試的上等好茶</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* 左侧：进阶筛选 */}
          <div className="lg:w-80 flex-shrink-0 hidden lg:block lg:pr-4">
            <div className="sticky top-24">
              <SidebarFilter
                filters={filters}
                setFilters={setFilters}
                totalCount={filteredProfiles.length}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          {/* 右侧：小姐卡片列表 */}
          <div className="flex-1 min-w-0">
            {/* 搜索框和筛选结果 */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋佳麗名字、地區、標籤..."
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
              {/* 筛选结果提示 */}
              <div className="lg:text-right">
                <p className="text-sm text-gray-600">
                  找到 <strong>{filteredProfiles.length}</strong> 位佳麗
                </p>
              </div>
            </div>

            {/* 手機版進階篩選按鈕 */}
            <div className="mb-6 lg:hidden">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-xs font-black tracking-[0.3em] text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>打開進階篩選</span>
              </button>
            </div>

            {/* 加载状态 - 使用骨架屏提升 LCP */}
            {isLoading && profiles.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] bg-gray-200"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="flex gap-2 mt-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* 错误信息 */}
            {error && !isLoading && (
              <div className="py-8 px-6 mb-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ 載入資料失敗</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 小姐卡片网格 */}
            {!isLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredProfiles.length === 0 ? (
                    <div className="col-span-full py-40 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                      <h3 className="text-xl font-serif font-black text-gray-400">目前沒有符合條件的內容</h3>
                      <button 
                        onClick={handleResetFilters} 
                        className="mt-6 px-6 py-2 bg-brand-black text-white rounded-full text-xs font-bold uppercase"
                      >
                        重置篩選
                      </button>
                    </div>
                  ) : (
                    paginatedProfiles.map(profile => (
                      <ProfileCardWithReviews
                        key={profile.id}
                        profile={profile}
                        userStatus={userStatus}
                        visibleReviewCount={getVisibleReviewCount()}
                        onProfileClick={() => onProfileClick?.(profile)}
                        onLoginClick={() => {
                          setAuthModalMode('login');
                          setShowAuthModal(true);
                        }}
                        onSubscribeClick={handleSubscribeClick}
                      />
                    ))
                  )}
                </div>

                {/* 分頁控制 */}
                {filteredProfiles.length > itemsPerPage && (
                  <div className="mt-16 flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-brand-green text-white hover:bg-opacity-90'
                        }`}
                        style={currentPage !== 1 ? { backgroundColor: '#1a5f3f' } : {}}
                      >
                        上一頁
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {[...Array(Math.min(7, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
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
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-brand-green text-white hover:bg-opacity-90'
                        }`}
                        style={currentPage !== totalPages ? { backgroundColor: '#1a5f3f' } : {}}
                      >
                        下一頁
                      </button>
                    </div>
                    
                    {/* 顯示當前頁資訊 */}
                    <div className="text-sm text-gray-500">
                      顯示第 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProfiles.length)} 項，共 {filteredProfiles.length} 項
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 认证模态框 */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}

      {/* 手機版進階篩選抽屜 */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          
          {/* 抽屜內容 */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-serif font-black text-brand-black">進階篩選</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <SidebarFilter
                filters={filters}
                setFilters={setFilters}
                totalCount={filteredProfiles.length}
                onResetFilters={() => {
                  handleResetFilters();
                  setIsFilterOpen(false);
                }}
              />
              
              {/* 應用按鈕 */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-6">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full py-3 bg-brand-green text-white rounded-xl font-bold text-sm hover:bg-opacity-90 transition-colors"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  應用篩選
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

