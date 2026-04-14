import React, { useState, useEffect, useRef } from 'react';
import { ForumPost } from '../types';
import { forumApi } from '../services/apiService';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from './SEO';

interface ForumPageProps {
  onPostClick: (postId: string) => void;
  onCreatePost?: () => void;
}

const CATEGORIES = [
  { value: '', label: '全部', icon: '📋' },
  { value: 'general', label: '綜合討論', icon: '💬' },
  { value: 'premium_tea', label: '嚴選好茶', icon: '🍵' },
  { value: 'fish_market', label: '特選魚市', icon: '🐟' },
  { value: 'booking', label: '預約交流', icon: '📅' },
  { value: 'experience', label: '經驗分享', icon: '📖' },
  { value: 'question', label: '問題求助', icon: '❓' },
  { value: 'chat', label: '閒聊區', icon: '💭' },
  { value: 'lady_promotion', label: '佳麗御選名鑑', icon: '👑' },
  { value: 'announcement', label: '官方公告', icon: '📢' },
];

// SVG Icons
const CategoryIcon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    '全部': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    '嚴選好茶': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    '特選魚市': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    '預約交流': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    '綜合討論': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    '經驗分享': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    '問題求助': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    '閒聊區': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    '佳麗御選名鑑': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    '官方公告': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  };
  return icons[name] || icons['全部'];
};

const SORT_OPTIONS = [
  { value: 'latest', label: '最新發布' },
  { value: 'hot', label: '最熱門' },
  { value: 'replies', label: '最多回覆' },
  { value: 'views', label: '最多瀏覽' },
  { value: 'favorites', label: '最多收藏' },
];

// 版規內容
const FORUM_RULES: Record<string, { title: string; rules: string[] }> = {
  '': {
    title: '御茶室通用版規',
    rules: [
      '尊重他人，禁止人身攻擊、惡意中傷或歧視性言論',
      '禁止涉及未成年人的內容或相關討論',
      '禁止在公開討論中直接拉客、推銷或發布個人聯絡方式（Line、電話等）',
      '禁止重複發茶帖、刷屏或惡意灌水',
      '禁止發布假資訊、詐騙訊息或誤導性內容',
      '發茶帖前請先搜尋是否有相關討論，避免重複發問',
      '請使用適當的標題和分類，方便其他用戶查找',
      '鼓勵友善交流，分享真實經驗，幫助其他茶友',
      '討論時請保持理性，尊重不同觀點和選擇',
      '違規內容將被刪除，嚴重者將被禁言或封號'
    ]
  },
  'general': {
    title: '綜合討論版規',
    rules: [
      '本版為綜合討論區，歡迎討論各種相關話題',
      '發茶帖前請選擇合適的分類，避免內容與其他專版重複',
      '禁止發布與平台無關的內容（如政治、宗教等敏感話題）',
      '討論時請保持理性，尊重不同觀點和選擇',
      '鼓勵分享有價值的資訊和真實經驗',
      '提問前請先搜尋相關討論，避免重複問題',
      '回覆時請言之有物，避免無意義的回覆',
      '禁止在討論中直接發布聯絡方式或進行私下交易'
    ]
  },
  'premium_tea': {
    title: '嚴選好茶版規',
    rules: [
      '本版專門討論嚴選好茶相關話題，歡迎分享經驗和心得',
      '發茶帖時建議關聯相關的御選佳麗 profile，方便其他用戶參考',
      '分享經驗時請保持真實客觀，避免過度誇大或惡意貶低',
      '禁止在討論中直接發布聯絡方式、拉客或進行私下交易',
      '討論價格時請尊重市場行情，避免惡意壓價或哄抬',
      '鼓勵分享真實的預約和服務經驗，幫助其他茶友做選擇',
      '禁止發布御選佳麗的個人隱私資訊（如真實姓名、住址、身份證等）',
      '禁止發布未經同意的照片或影片',
      '如有糾紛，請透過平台客服處理，勿在版上公開爭執或人身攻擊'
    ]
  },
  'fish_market': {
    title: '特選魚市版規',
    rules: [
      '本版專門討論特選魚市相關話題，歡迎分享經驗和心得',
      '發茶帖時建議關聯相關的佳麗 profile，方便其他用戶參考',
      '分享經驗時請保持真實，避免虛假宣傳或惡意中傷',
      '討論時請尊重所有參與者，避免歧視性言論或人身攻擊',
      '禁止在討論中直接發布聯絡方式、拉客或進行私下交易',
      '鼓勵分享真實的預約和服務經驗，幫助其他用戶做選擇',
      '禁止發布佳麗的個人隱私資訊（如真實姓名、住址等）',
      '禁止發布未經同意的照片或影片',
      '如有問題或糾紛，請透過平台客服處理，勿在版上公開爭執'
    ]
  },
  'booking': {
    title: '預約交流版規',
    rules: [
      '本版專門討論預約流程、注意事項和經驗分享',
      '本版適用於嚴選好茶和特選魚市的預約交流',
      '發茶帖時可關聯相關的預約記錄（系統會自動驗證真實性）',
      '分享預約經驗時請保持真實，幫助其他用戶了解流程',
      '禁止發布虛假的預約經驗或誤導性資訊',
      '討論預約流程時請尊重平台規則，遵守預約流程',
      '禁止在版上進行預約交易、拉客或私下聯絡',
      '如有預約問題，請先查看平台說明或聯繫客服',
      '鼓勵分享預約技巧、注意事項和避坑經驗',
      '禁止發布佳麗或客戶的個人隱私資訊',
      '預約相關糾紛請透過平台客服處理，勿在版上公開爭執或人身攻擊'
    ]
  },
  'experience': {
    title: '經驗分享版規',
    rules: [
      '本版鼓勵分享真實的服務經驗和心得，幫助其他茶友',
      '分享時請保持客觀真實，避免過度誇大或惡意貶低',
      '禁止發布虛假經驗、廣告宣傳或誤導性內容',
      '分享時請尊重他人，避免使用不當言詞或人身攻擊',
      '鼓勵詳細描述服務過程和感受，幫助其他用戶做選擇',
      '禁止在經驗分享中直接發布聯絡方式或拉客',
      '禁止發布個人隱私資訊或未經同意的照片、影片',
      '如有負面經驗，請保持理性客觀，避免惡意攻擊或造謠',
      '鼓勵分享正面經驗，但請保持真實，避免過度美化'
    ]
  },
  'question': {
    title: '問題求助版規',
    rules: [
      '提問前請先搜尋相關討論，避免重複發問',
      '提問時請清楚描述問題，方便其他用戶回答',
      '禁止發布與平台無關的問題（如政治、宗教等）',
      '提問時請保持禮貌，尊重回答者的時間和建議',
      '鼓勵回答者提供有價值的建議和真實資訊',
      '禁止在問題中直接詢問聯絡方式、拉客或進行交易',
      '問題解決後，建議更新茶帖標記已解決，幫助其他用戶',
      '禁止發布涉及個人隱私的問題（如真實姓名、住址等）',
      '如有緊急問題或糾紛，請直接聯繫平台客服處理'
    ]
  },
  'chat': {
    title: '閒聊區版規',
    rules: [
      '本版為輕鬆交流區，歡迎友善的閒聊話題',
      '請保持友善和尊重，禁止人身攻擊或惡意中傷',
      '禁止涉及未成年人的內容或相關討論',
      '禁止廣告、推銷、拉客或商業推廣',
      '禁止重複發茶帖或惡意刷屏',
      '討論時請避免涉及過於敏感的話題（如政治、宗教等）',
      '鼓勵分享生活趣事、心情交流等輕鬆話題',
      '請勿在閒聊區發布正式的求助或經驗分享（請使用對應專版）',
      '禁止在閒聊中直接發布聯絡方式或進行私下交易'
    ]
  },
  'lady_promotion': {
    title: '佳麗御選名鑑版規',
    rules: [
      '本版專為佳麗提供宣傳平台，僅限佳麗角色發茶帖',
      '歡迎發布個人宣傳、服務介紹、優惠活動等內容',
      '禁止直接發布聯絡方式（Line、電話、Telegram 等），實際預約需透過特選魚市進行，可在此說明預約流程（為保護佳麗安全）',
      '可以發布個人照片、服務照片（需確保已成年且為本人）',
      '禁止直接發布價格資訊、服務項目、營業時間等，實際預約需透過特選魚市進行，可在此說明預約流程（為保護佳麗安全）',
      '鼓勵詳細介紹個人特色、服務內容和優勢',
      '禁止發布涉及未成年人的內容（為保護佳麗安全）',
      '禁止發布虛假資訊、詐騙訊息或誤導性內容（為保護佳麗安全）',
      '禁止惡意攻擊其他佳麗或客戶（為保護佳麗安全）',
      '禁止發布違法內容或涉及非法交易（為保護佳麗安全）',
      '建議定期更新茶帖，保持內容新鮮度',
      '客戶可在茶帖下回覆詢問，請友善回應'
    ]
  },
  'announcement': {
    title: '官方公告版規',
    rules: [
      '本版僅供管理員發布官方公告',
      '一般用戶無法在此版發茶帖',
      '請定期關注官方公告，了解平台最新資訊',
      '公告內容具有權威性，請遵守相關規定',
      '如有疑問，請透過客服管道詢問',
      '禁止在公告下發布無關回覆或惡意評論',
      '重要公告請務必仔細閱讀'
    ]
  }
};

export const ForumPage: React.FC<ForumPageProps> = ({ onPostClick, onCreatePost }) => {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const loadingRef = useRef(false); // 防止重複請求

  // 檢查是否為佳麗角色
  const isProvider = user?.role === 'provider';

  // 生成版規茶帖內容
  const generateRulesPost = (categoryValue: string): ForumPost | null => {
    const rules = FORUM_RULES[categoryValue];
    if (!rules) return null;

    // 格式化版規內容，每條規則一行，編號清晰
    const rulesContent = rules.rules.map((rule, index) => {
      return `${index + 1}. ${rule}`;
    }).join('\n\n');

    // 為不同分類選擇不同的圖片
    const getRulesImage = (cat: string): string => {
      const imageMap: Record<string, string> = {
        '': '/images/茶訊公告/teaking_compressed_84mgy1wxt.jpg',
        'general': '/images/tea_king_jp_3qb1pmafm.jpg',
        'premium_tea': '/images/tea_king_jp_civgdeba2.jpg',
        'fish_market': '/images/tea_king_jp_6lx9ajxz4.jpg',
        'booking': '/images/tea_king_jp_uumox9yah.jpg',
        'experience': '/images/tea_king_jp_pmeposdv7.jpg',
        'question': '/images/tea_king_jp_vrzcszolm.jpg',
        'chat': '/images/tea_king_jp_2u8qtiwms.jpg',
        'lady_promotion': '/images/tea_king_jp_at1x02l7e.jpg',
        'announcement': '/images/茶訊公告/teaking_compressed_rsybynlwm.jpg',
      };
      return imageMap[cat] || '/images/茶訊公告/teaking_compressed_84mgy1wxt.jpg';
    };

    return {
      id: `rules_${categoryValue || 'all'}`,
      userId: 'system',
      title: `【版規】${rules.title}`,
      content: rulesContent + '\n\n---\n\n**📝 請在下方留言簽到，表示您已閱讀並同意遵守以上版規。**',
      category: categoryValue || '',
      images: [getRulesImage(categoryValue || '')],
      views: 0,
      likesCount: 0,
      repliesCount: 0,
      favoritesCount: 0,
      isPinned: true,
      isLocked: false, // 改為 false，允許回覆簽到
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userName: '系統管理員',
      userRole: 'admin',
      membershipLevel: 'tea_king_attendant',
    };
  };

  useEffect(() => {
    // 切換分類時，立即清空帖子列表並顯示 loading，避免顯示舊分類的帖子
    setPosts([]);
    setLoading(true);
    // 重置 loadingRef，確保可以發起新請求
    loadingRef.current = false;
    loadPosts();
  }, [category, sortBy]);

  // 監聽自定義事件，用於從其他頁面導航到指定分類
  useEffect(() => {
    const handleSetCategory = (event: CustomEvent<{ category: string }>) => {
      const { category: targetCategory } = event.detail;
      setCategory(targetCategory);
    };

    window.addEventListener('forum-set-category', handleSetCategory as EventListener);
    return () => {
      window.removeEventListener('forum-set-category', handleSetCategory as EventListener);
    };
  }, []);

  const loadPosts = async () => {
    // 防止重複請求
    if (loadingRef.current) {
      return;
    }
    
    // 先從緩存讀取數據，立即顯示（提升 LCP）
    // 但只在首次載入時使用緩存，切換分類時不使用緩存，確保顯示正確的分類
    const cacheKey = `forum_posts_${category || 'all'}_${sortBy}`;
    let hasValidCache = false;
    let isInitialLoad = posts.length === 0; // 判斷是否為首次載入
    
    // 只在首次載入時使用緩存（切換分類時 posts 已被清空，所以不會使用緩存）
    if (isInitialLoad) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const cached = JSON.parse(cachedData);
          const cacheTime = cached.timestamp || 0;
          const now = Date.now();
          // 緩存有效期 5 分鐘
          if (now - cacheTime < 5 * 60 * 1000 && cached.posts && cached.posts.length > 0) {
            // 驗證緩存的分類是否匹配當前分類
            const cachedCategory = cached.category || '';
            if (cachedCategory === (category || '')) {
              setPosts(cached.posts);
              hasValidCache = true;
              // 如果有有效緩存，不顯示 loading，直接顯示內容
            }
          }
        }
      } catch (e) {
        // 忽略緩存錯誤
      }
    }
    
    try {
      loadingRef.current = true;
      // 只有在沒有有效緩存時才顯示 loading
      if (!hasValidCache) {
        setLoading(true);
      }
      // 載入更多帖子（增加到 100 篇，確保顯示所有帖子）
      // 確保排序時保持當前分類：如果 category 不為空，只對該分類的茶帖進行排序
      const categoryParam = category && category.trim() !== '' ? category.trim() : undefined;
      const data = await forumApi.getPosts({ 
        category: categoryParam, 
        sortBy: sortBy as any,
        limit: 100 // 增加到 100 篇，確保顯示所有帖子
      });
      // 去除重複的茶帖（基於 ID），保留最後一個
      let uniquePosts = data.posts.reduce((acc: ForumPost[], post: ForumPost) => {
        const existingIndex = acc.findIndex(p => p.id === post.id);
        if (existingIndex >= 0) {
          acc[existingIndex] = post; // 替換重複的
        } else {
          acc.push(post);
        }
        return acc;
      }, []);

      // 在前端再次過濾分類，確保只顯示該分類的茶帖（排除版規茶帖）
      if (category !== '') {
        // 過濾出符合當前分類的茶帖（排除版規茶帖）
        uniquePosts = uniquePosts.filter(post => {
          // 排除版規茶帖
          if (post.id.startsWith('rules_')) {
            return false;
          }
          // 確保分類完全匹配（嚴格匹配，排除 null、undefined、空字符串）
          const postCategory = post.category || '';
          return postCategory.trim() === category.trim();
        });
      } else {
        // 在"全部"分類中，過濾掉所有版規茶帖（包括從後端返回的）
        uniquePosts = uniquePosts.filter(post => !post.id.startsWith('rules_'));
      }

      // 生成版規茶帖並放在最前面
      // 注意：在"全部"分類中不顯示版規，避免擋住用戶發的最新茶帖
      if (category !== '') {
        // 只有在特定分類時才顯示該分類的版規
        const rulesPost = generateRulesPost(category);
        if (rulesPost) {
          // 檢查是否已經有版規茶帖（避免重複）
          const hasRulesPost = uniquePosts.some(p => p.id === rulesPost.id);
          if (!hasRulesPost) {
            uniquePosts.unshift(rulesPost);
          }
        }
      }

      setPosts(uniquePosts);
      
      // 更新緩存（同時保存分類信息，用於驗證）
      try {
        const cacheData = {
          posts: uniquePosts,
          category: category || '',
          sortBy: sortBy,
          timestamp: Date.now()
        };
        const { safeSetItem } = await import('../utils/storageUtils');
        safeSetItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // 忽略緩存錯誤
      }
    } catch (error) {
      console.error('載入茶帖失敗:', error);
      // 如果 API 失敗但有緩存，保持顯示緩存數據
      if (posts.length === 0) {
        setLoading(false);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleCreateSuccess = () => {
    loadPosts();
  };

  return (
    <>
      <SEO
        title="御茶室 - 茶王 | 品茶論道・交流心法・相互提點"
        description="御茶室是茶王的會客廳，品茶客們交流心得、分享經驗、討論茶文化的殿堂。這裡有嚴選好茶專區、特選魚市、經驗分享、問題求助等版區，讓每一位品茶客都能找到志同道合的茶友，分享彼此的品茶故事。"
        keywords="御茶室, 茶王, 品茶論道, 茶文化交流, 嚴選好茶討論, 特選魚市討論, 預約交流, 經驗分享, 問題求助, 茶友交流"
        ogImage="https://teakingom.com/images/關於茶王/御茶室.jpg"
        ogUrl="https://teakingom.com/forum"
        canonical="https://teakingom.com/forum"
      />
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Banner - 16:9 比例 */}
      <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden mb-4 md:mb-8 shadow-lg" style={{ aspectRatio: '16/9' }}>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(/images/茶訊公告/teaking_compressed_84mgy1wxt.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
          <div className="relative h-full flex items-center justify-center px-4 sm:px-6">
            <div className="text-center text-white">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 md:mb-4 drop-shadow-lg">御茶室</h1>
              <p className="text-sm sm:text-lg md:text-xl opacity-90 drop-shadow-md">品茶論道・交流心法・相互提點</p>
            </div>
          </div>
        </div>
      </div>

      {/* 分類按鈕 */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${
                category === cat.value
                  ? 'bg-brand-green text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={category === cat.value ? { backgroundColor: '#1a5f3f' } : {}}
            >
              <CategoryIcon name={cat.label} />
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 標題和發佈按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          {category ? CATEGORIES.find(c => c.value === category)?.label || '全部茶帖' : '全部茶帖'}
        </h2>
        {isAuthenticated && (
          <button
            onClick={() => {
              // 檢查佳麗御選名鑑的發帖權限
              if (category === 'lady_promotion' && !isProvider) {
                alert('此版區僅限佳麗發茶帖宣傳，請先註冊為佳麗身份');
                return;
              }
              if (onCreatePost) {
                onCreatePost();
              } else {
                setShowCreateModal(true);
              }
            }}
            className="w-full sm:w-auto px-4 md:px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 font-medium flex items-center justify-center gap-2 text-sm md:text-base"
            style={{ backgroundColor: '#1a5f3f' }}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>發佈新茶帖</span>
          </button>
        )}
      </div>

      {/* 排序 */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">排序方式：</label>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  sortBy === opt.value
                    ? 'bg-brand-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={sortBy === opt.value ? { backgroundColor: '#1a5f3f' } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 茶帖列表 */}
      {loading && posts.length === 0 ? (
        // 骨架屏 - 提升 LCP，讓用戶更快看到內容結構
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex gap-4 mt-2">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">還沒有茶帖，成為第一個發茶帖的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <PostCard key={`${post.id}-${index}`} post={post} onClick={() => onPostClick(post.id)} />
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      </div>
    </>
  );
};

export default ForumPage;



