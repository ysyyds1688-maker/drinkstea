import React, { useState, useEffect } from 'react';
import { ForumPost, ForumReply, Profile } from '../types';
import { forumApi, profilesApi, reviewsApi } from '../services/apiService';
import { ReplyCard } from './ReplyCard';
import { useAuth } from '../contexts/AuthContext';
import { MembershipBadge } from './MembershipBadge';
import { VipBadge } from './VipBadge';
import { AdminBadge } from './AdminBadge';
import { VerificationBadges } from './VerificationBadges';
import { UserBadges } from './UserBadges';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';
import { UserProfileModal } from './UserProfileModal';
import { RichTextEditor } from './RichTextEditor';
import { formatText } from '../utils/textFormatter';
import { AchievementNotification } from './AchievementNotification';

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onProfileClick?: (profile: Profile) => void;
  onNavigateToCategory?: (category?: string) => void;
  onPostClick?: (postId: string) => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({ postId, onBack, onProfileClick, onNavigateToCategory, onPostClick }) => {
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideos, setEditVideos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [relatedProfile, setRelatedProfile] = useState<Profile | null>(null);
  const [profileRating, setProfileRating] = useState<{ average: number; total: number } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<ForumPost[]>([]);
  const [isLoadingRelatedPosts, setIsLoadingRelatedPosts] = useState(false);
  
  // 成就通知狀態
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'achievement' | 'levelUp' | 'reward';
    title: string;
    message: string;
    achievements?: Array<{ type: string; name: string; icon: string }>;
    newLevel?: string;
    rewards?: { points?: number; experience?: number };
  }>({
    isOpen: false,
    type: 'reward',
    title: '',
    message: '',
  });

  // 將英文標籤映射為中文版塊名稱
  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'experience': '經驗分享',
      'question': '問題求助',
      'chat': '閒聊區',
      'general': '綜合討論',
      'announcement': '官方公告',
      'premium_tea': '嚴選好茶',
      'fish_market': '特選魚市',
      'booking': '預約交流',
      'lady_promotion': '佳麗御選名鑑',
    };
    return categoryMap[category] || category;
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  // 當茶帖載入時，初始化編輯表單
  useEffect(() => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setEditCategory(post.category || '');
      setEditImages(post.images || []);
      setEditVideos(post.videos || []);
    }
  }, [post]);

  // 載入關聯的 Profile 資料和評分
  useEffect(() => {
    const loadRelatedProfile = async () => {
      if (!post?.relatedProfileId) {
        setRelatedProfile(null);
        setProfileRating(null);
        return;
      }

      setIsLoadingProfile(true);
      try {
        // 載入 Profile 資料
        const profile = await profilesApi.getById(post.relatedProfileId);
        setRelatedProfile(profile);

        // 載入評分資料
        try {
          const reviewsData = await reviewsApi.getByProfileId(post.relatedProfileId);
          setProfileRating({
            average: reviewsData.averageRating,
            total: reviewsData.total
          });
        } catch (error) {
          console.error('載入評分失敗:', error);
          setProfileRating({ average: 0, total: 0 });
        }
      } catch (error) {
        console.error('載入關聯 Profile 失敗:', error);
        setRelatedProfile(null);
        setProfileRating(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadRelatedProfile();
  }, [post?.relatedProfileId]);

  // 載入該版區的其他精選茶帖
  useEffect(() => {
    const loadRelatedPosts = async () => {
      if (!post?.category) {
        setRelatedPosts([]);
        return;
      }
      
      setIsLoadingRelatedPosts(true);
      try {
        const data = await forumApi.getPosts({ 
          category: post.category, 
          sortBy: 'hot',
          limit: 6 
        });
        
        // 過濾掉當前茶帖和版規茶帖
        const filtered = data.posts
          .filter(p => p.id !== postId && !p.id.startsWith('rules_'))
          .slice(0, 6);
        
        setRelatedPosts(filtered);
      } catch (error) {
        console.error('載入相關茶帖失敗:', error);
        setRelatedPosts([]);
      } finally {
        setIsLoadingRelatedPosts(false);
      }
    };

    if (post) {
      loadRelatedPosts();
    }
  }, [post, postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      // 檢查是否為版規茶帖
      if (postId.startsWith('rules_')) {
        let category = postId.replace('rules_', '');
        // 處理 'rules_all' 的情況（全部茶帖對應空字符串分類）
        if (category === 'all' || category === '') {
          category = '';
        }
        const rules = getRulesForCategory(category);
        if (rules) {
          const rulesContent = rules.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n\n');
          
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
          
          // 嘗試從後端載入版規茶帖（可能已經創建）
          try {
            const data = await forumApi.getPostById(postId);
            setPost(data.post);
            const uniqueReplies = data.replies.reduce((acc: ForumReply[], reply: ForumReply) => {
              const existingIndex = acc.findIndex(r => r.id === reply.id);
              if (existingIndex >= 0) {
                acc[existingIndex] = reply;
              } else {
                acc.push(reply);
              }
              return acc;
            }, []);
            setReplies(uniqueReplies);
            setIsLiked(data.isLiked);
            setIsFavorited(data.isFavorited || false);
            return;
          } catch (error) {
            // 如果後端還沒有創建，使用本地生成的版本
            console.log('版規茶帖尚未在後端創建，使用本地版本');
          }
          
          // 使用本地生成的版規茶帖
          setPost({
            id: postId,
            userId: 'system',
            title: `【版規】${rules.title}`,
            content: rulesContent + '\n\n---\n\n**📝 請在下方留言簽到，表示您已閱讀並同意遵守以上版規。**',
            category: category || '',
            images: [getRulesImage(category || '')],
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
          });
          setReplies([]);
          setIsLiked(false);
          setIsFavorited(false);
        }
        return;
      }
      
      const data = await forumApi.getPostById(postId);
      setPost(data.post);
      // 後端已經返回了組織好的嵌套結構，直接使用
      // 去除重複的回覆（基於 ID），保留最後一個
      const uniqueReplies = data.replies.reduce((acc: ForumReply[], reply: ForumReply) => {
        const existingIndex = acc.findIndex(r => r.id === reply.id);
        if (existingIndex >= 0) {
          acc[existingIndex] = reply; // 替換重複的
        } else {
          acc.push(reply);
        }
        return acc;
      }, []);
      setReplies(uniqueReplies);
      setIsLiked(data.isLiked);
      setIsFavorited(data.isFavorited || false);
    } catch (error) {
      console.error('載入茶帖失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 獲取版規內容的輔助函數
  const getRulesForCategory = (category: string) => {
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
    return FORUM_RULES[category] || null;
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('請先登入');
      return;
    }

    try {
      const result = await forumApi.toggleLike('post', postId);
      setIsLiked(result.liked);
      if (post) {
        setPost({
          ...post,
          likesCount: result.liked ? post.likesCount + 1 : post.likesCount - 1,
        });
      }
    } catch (error) {
      console.error('點讚失敗:', error);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      alert('請先登入');
      return;
    }

    try {
      const result = await forumApi.toggleFavorite(postId);
      setIsFavorited(result.favorited);
      if (post) {
        setPost({
          ...post,
          favoritesCount: result.favorited ? (post.favoritesCount || 0) + 1 : Math.max(0, (post.favoritesCount || 0) - 1),
        });
      }
    } catch (error: any) {
      alert(error.message || '操作失敗');
    }
  };

  // 複製到剪貼板
  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      alert('連結已複製到剪貼板！');
    }).catch(err => {
      console.error('複製失敗:', err);
      // 降級方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('連結已複製到剪貼板！');
      } catch (err) {
        alert('複製失敗，請手動複製連結');
      }
      document.body.removeChild(textArea);
    });
  };

  // 分享茶帖
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    const title = post?.title || '論壇茶帖';
    const text = post?.content?.substring(0, 100) || title;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url,
      }).catch(err => {
        console.log('分享失敗:', err);
        copyToClipboard(url, e);
      });
    } else {
      copyToClipboard(url, e);
    }
  };

  // 檢查是否有編輯權限
  const canEdit = post && (
    user?.role === 'admin' || 
    (isAuthenticated && user?.id === post.userId)
  );

  // 圖片壓縮函數
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
      };
    });
  };

  // 處理文件選擇
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('請選擇圖片文件');
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await Promise.all(imageFiles.map(compressImage));
      setEditImages(prev => [...prev, ...compressed]);
    } catch (error) {
      console.error('圖片處理失敗:', error);
      alert('圖片處理失敗，請重試');
    } finally {
      setIsCompressing(false);
    }
  };

  // 處理文件輸入
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // 重置 input，允許選擇相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 處理拖放
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // 處理影片文件
  const processVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      alert('請選擇影片文件');
      return;
    }

    // 檢查文件大小（限制為 50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    for (const file of videoFiles) {
      if (file.size > maxSize) {
        alert(`影片文件 ${file.name} 超過 50MB 限制，請使用較小的文件或使用外部影片連結`);
        return;
      }
    }

    setIsProcessingVideo(true);
    try {
      const videoDataUrls = await Promise.all(
        videoFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              if (result) {
                resolve(result);
              } else {
                reject(new Error('讀取影片失敗'));
              }
            };
            reader.onerror = () => reject(new Error('讀取影片失敗'));
            reader.readAsDataURL(file);
          });
        })
      );
      setEditVideos(prev => [...prev, ...videoDataUrls]);
    } catch (error) {
      console.error('影片處理失敗:', error);
      alert('影片處理失敗，請重試或使用外部影片連結');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // 處理影片輸入
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processVideoFiles(e.target.files);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  // 刪除圖片
  const handleRemoveImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  // 刪除影片
  const handleRemoveVideo = (index: number) => {
    setEditVideos(prev => prev.filter((_, i) => i !== index));
  };

  // 觸發文件選擇
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 觸發影片選擇
  const handleVideoUploadClick = () => {
    videoInputRef.current?.click();
  };

  // 處理編輯茶帖
  const handleEdit = () => {
    if (!post) return;
    setIsEditing(true);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category || '');
    setEditImages(post.images || []);
    setEditVideos(post.videos || []);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setEditCategory(post.category || '');
      setEditImages(post.images || []);
      setEditVideos(post.videos || []);
    }
  };

  // 提交編輯
  const handleSaveEdit = async () => {
    if (!post) return;
    
    if (!editTitle.trim() || !editContent.trim()) {
      alert('標題和內容不能為空');
      return;
    }

    try {
      const updateData: { title: string; content: string; category?: string; images?: string[]; videos?: string[] } = {
        title: editTitle.trim(),
        content: editContent.trim(),
        images: editImages.length > 0 ? editImages : [],
        videos: editVideos.length > 0 ? editVideos : [],
      };
      
      // 只有管理員可以編輯分類
      if (user?.role === 'admin' && editCategory !== undefined) {
        updateData.category = editCategory;
      }
      
      const updatedPost = await forumApi.updatePost(postId, updateData);
      
      setPost(updatedPost);
      setIsEditing(false);
      alert('茶帖已更新');
    } catch (error: any) {
      console.error('更新茶帖失敗:', error);
      alert('更新失敗: ' + (error.message || '請稍後再試'));
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      alert('請輸入回覆內容');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forumApi.createReply(postId, {
        content: replyContent,
        parentReplyId: replyingTo || undefined,
      });
      
      // 如果是版規簽到
      if (isRulesPost) {
        if (result.isFirstCheckIn && result.checkInBonus) {
          // 首次簽到：顯示獎勵
          if (result.levelUp) {
            // 等級升級通知
            setNotification({
              isOpen: true,
              type: 'levelUp',
              title: '🎉 恭喜升級！',
              message: '版規簽到成功！您已升級到新等級。',
              newLevel: result.newLevel || '未知',
              rewards: {
                points: result.checkInBonus.points,
                experience: result.checkInBonus.experience,
              },
            });
          } else {
            // 獎勵通知
            setNotification({
              isOpen: true,
              type: 'reward',
              title: '✅ 版規簽到成功！',
              message: '感謝您閱讀並遵守版規！',
              rewards: {
                points: result.checkInBonus.points,
                experience: result.checkInBonus.experience,
              },
            });
          }
        } else {
          // 後續回覆：簡單提示
          setNotification({
            isOpen: true,
            type: 'reward',
            title: '回覆成功！',
            message: '⚠️ 注意：版規茶帖後續回覆不會獲得經驗值或積分。',
          });
        }
      } else if (result.experienceEarned && result.experienceEarned > 0) {
        // 普通茶帖回覆：顯示經驗值獎勵
        if (result.taskCompleted) {
          setNotification({
            isOpen: true,
            type: 'reward',
            title: '任務完成！',
            message: '回覆成功！您完成了每日任務。',
            rewards: {
              points: result.pointsEarned || 0,
              experience: result.experienceEarned || 0,
            },
          });
        } else {
          setNotification({
            isOpen: true,
            type: 'reward',
            title: '回覆成功！',
            message: '獲得經驗值獎勵',
            rewards: {
              experience: result.experienceEarned || 0,
            },
          });
        }
      }
      
      // 如果有解鎖的成就，顯示成就通知
      if (result.unlockedAchievements && result.unlockedAchievements.length > 0) {
        setTimeout(() => {
          setNotification({
            isOpen: true,
            type: 'achievement',
            title: '🏆 成就解鎖！',
            message: `恭喜您解鎖了 ${result.unlockedAchievements.length} 個成就！`,
            achievements: result.unlockedAchievements.map((a: any) => ({
              type: a.type,
              name: a.name || a.type,
              icon: a.icon || '🏆',
            })),
          });
        }, result.levelUp ? 6500 : 5000); // 如果同時有等級升級，延遲顯示成就通知
      }
      
      setReplyContent('');
      setReplyingTo(null);
      loadPost();
    } catch (error: any) {
      alert(error.message || '回覆失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">茶帖不存在</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90"
          style={{ backgroundColor: '#1a5f3f' }}
        >
          返回
        </button>
      </div>
    );
  }

  // 組織嵌套回覆
  // 注意：後端已經組織好了嵌套結構，但如果後端返回的是扁平列表，則需要重新組織
  const organizeReplies = (repliesList: ForumReply[]): ForumReply[] => {
    // 如果列表為空，直接返回
    if (repliesList.length === 0) {
      return repliesList;
    }
    
    // 檢查是否已經是嵌套結構（所有頂層回覆都沒有 parentReplyId）
    // 後端返回的嵌套結構：只有根回覆在頂層，嵌套回覆在 replies 屬性中
    const allAreRootReplies = repliesList.every(reply => !reply.parentReplyId);
    
    if (allAreRootReplies) {
      // 後端已經組織好了嵌套結構，直接返回
      return repliesList;
    }
    
    // 後端返回的是扁平列表，需要重新組織
    const replyMap = new Map<string, ForumReply & { replies?: ForumReply[] }>();
    const rootReplies: (ForumReply & { replies?: ForumReply[] })[] = [];

    // 第一步：創建所有回覆的映射，保留現有的 replies 數組（如果有的話）
    repliesList.forEach(reply => {
      replyMap.set(reply.id, { 
        ...reply, 
        replies: reply.replies && reply.replies.length > 0 ? [...reply.replies] : [] 
      });
    });

    // 第二步：組織嵌套結構
    repliesList.forEach(reply => {
      const replyWithReplies = replyMap.get(reply.id)!;
      if (reply.parentReplyId) {
        const parent = replyMap.get(reply.parentReplyId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          // 檢查是否已經存在，避免重複
          if (!parent.replies.find(r => r.id === reply.id)) {
            parent.replies.push(replyWithReplies);
          }
        } else {
          // 如果找不到父回覆，仍然顯示為根回覆（防止數據不一致）
          if (!rootReplies.find(r => r.id === reply.id)) {
            rootReplies.push(replyWithReplies);
          }
        }
      } else {
        if (!rootReplies.find(r => r.id === reply.id)) {
          rootReplies.push(replyWithReplies);
        }
      }
    });

    return rootReplies as ForumReply[];
  };

  const organizedReplies = organizeReplies(replies);
  
  // 計算總回覆數（包括嵌套回覆）
  const countAllReplies = (repliesList: ForumReply[]): number => {
    let count = 0;
    repliesList.forEach(reply => {
      count += 1; // 當前回覆
      if (reply.replies && reply.replies.length > 0) {
        count += countAllReplies(reply.replies); // 遞歸計算嵌套回覆
      }
    });
    return count;
  };
  const totalRepliesCount = countAllReplies(organizedReplies);
  
  // 檢查是否為版規茶帖
  const isRulesPost = post.id.startsWith('rules_');

  // SVG Icons（與ForumPage.tsx保持一致）
  const CategoryIcon = ({ name }: { name: string }) => {
    const icons: Record<string, JSX.Element> = {
      '全部帖子': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      '嚴選好茶': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      '特選魚市': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      '預約交流': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      '綜合討論': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      '經驗分享': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      '問題求助': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      '閒聊區': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      '佳麗御選名鑑': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    };
    return icons[name] || icons['全部帖子'];
  };

  // 論壇版區列表
  const forumCategories = [
    { value: '', label: '全部帖子' },
    { value: 'premium_tea', label: '嚴選好茶' },
    { value: 'fish_market', label: '特選魚市' },
    { value: 'booking', label: '預約交流' },
    { value: 'experience', label: '經驗分享' },
    { value: 'question', label: '問題求助' },
    { value: 'chat', label: '閒聊區' },
    { value: 'lady_promotion', label: '佳麗御選名鑑' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <button
        onClick={onBack}
        className="mb-3 md:mb-4 text-brand-green hover:text-opacity-80 font-medium text-sm md:text-base flex items-center gap-1"
        style={{ color: '#1a5f3f' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>返回御茶室</span>
      </button>

      {/* 版區導航按鈕 */}
      <div className="mb-4 md:mb-6 bg-white rounded-lg shadow-md p-3 md:p-4">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">快速導航</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {forumCategories.map(cat => (
            <button
              key={cat.value}
              onClick={() => {
                if (onNavigateToCategory) {
                  onNavigateToCategory(cat.value);
                }
              }}
              className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5"
              style={{ backgroundColor: '#f3f4f6' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a5f3f';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <CategoryIcon name={cat.label} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 茶帖內容 */}
      <div className={`rounded-lg shadow-md p-4 sm:p-5 md:p-6 mb-4 md:mb-6 ${
        isRulesPost 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300' 
          : 'bg-white'
      }`}>
        <div className="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
          {isRulesPost && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              版規
            </span>
          )}
          {post.isPinned && !isRulesPost && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium whitespace-nowrap">
              置頂
            </span>
          )}
          {post.isFeatured && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium whitespace-nowrap">
              精華
            </span>
          )}
          {!isRulesPost && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
            {getCategoryLabel(post.category)}
          </span>
          )}
          {post.relatedProfileName && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {post.relatedProfileName}
            </span>
          )}
        </div>
        {/* 標籤 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
            {post.tags.map((tag, index) => (
              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="mb-4 space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="茶帖標題"
              style={{ focusRingColor: '#1a5f3f' }}
            />
            {/* 管理員可以編輯分類 */}
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版區分類
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  style={{ focusRingColor: '#1a5f3f' }}
                >
                  <option value="">全部</option>
                  <option value="general">綜合討論</option>
                  <option value="premium_tea">嚴選好茶</option>
                  <option value="fish_market">特選魚市</option>
                  <option value="booking">預約交流</option>
                  <option value="experience">經驗分享</option>
                  <option value="question">問題求助</option>
                  <option value="chat">閒聊區</option>
                  <option value="lady_promotion">佳麗御選名鑑</option>
                  <option value="announcement">官方公告</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 leading-tight ${
            isRulesPost ? 'text-blue-700' : 'text-gray-900'
          }`}>{post.title}</h1>
        )}
        
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-3 md:mb-4 flex-wrap">
          <button
            onClick={() => {
              if (post.userId && post.userId.trim() !== '') {
                // 發送導航事件到用戶個人頁面
                window.dispatchEvent(new CustomEvent('navigate-to-user-blog', {
                  detail: { userId: post.userId }
                }));
              } else {
                // 如果沒有userId，使用舊的modal方式
                setSelectedUserId(post.userId);
                setShowUserModal(true);
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="relative">
              {post.avatarUrl ? (
                <img
                  src={post.avatarUrl}
                  alt={post.userName || '用戶'}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border flex-shrink-0 ${
                    post.emailVerified && post.phoneVerified
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  }`}
                />
              ) : (
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center border flex-shrink-0 ${
                  post.emailVerified && post.phoneVerified
                    ? 'border-blue-500'
                    : 'border-gray-300'
                }`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {/* Email 驗證徽章 */}
              {post.emailVerified && (
                <EmailVerifiedBadge size="sm" />
              )}
            </div>
            <span className="font-medium truncate max-w-[120px] sm:max-w-none">{post.userName || '匿名用戶'}</span>
          </button>
          {post.userRole === 'admin' && <AdminBadge size="sm" />}
          {post.membershipLevel && (
            <MembershipBadge level={post.membershipLevel} size="sm" />
          )}
          {post.isVip && <VipBadge size="sm" />}
          {post.verificationBadges && post.verificationBadges.length > 0 && (
            <VerificationBadges badges={post.verificationBadges} size="sm" />
          )}
          {(post.warningBadge || post.noShowBadge) && (
            <UserBadges 
              user={{
                id: post.userId,
                warningBadge: post.warningBadge,
                noShowBadge: post.noShowBadge,
                violationLevel: post.violationLevel,
              } as any}
              size="sm"
            />
          )}
          <span className="hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm">{formatDate(post.createdAt)}</span>
        </div>

        <div className="prose max-w-none mb-4 md:mb-6">
          {isEditing ? (
            <>
              <RichTextEditor
                value={editContent}
                onChange={setEditContent}
                rows={10}
                placeholder="茶帖內容"
                className="min-h-[200px]"
              />
              
              {/* 圖片上傳區域 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">圖片（選填）</label>
                
                {/* 拖放上傳區域 */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                  className={`
                    border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-all
                    ${isDragging 
                      ? 'border-brand-green bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                    ${isCompressing ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  style={{ borderColor: isDragging ? '#1a5f3f' : undefined }}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg 
                      className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-brand-green" style={{ color: '#1a5f3f' }}>
                        點擊上傳
                      </span>
                      <span className="hidden sm:inline">{' '}或拖放圖片到此處</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      支持 JPG、PNG 格式，可上傳多張圖片
                    </div>
                    {isCompressing && (
                      <div className="text-sm text-brand-green" style={{ color: '#1a5f3f' }}>
                        正在處理圖片...
                      </div>
                    )}
                  </div>
                </div>

                {/* 隱藏的檔案輸入 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* 圖片預覽網格 */}
                {editImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {editImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`預覽 ${index + 1}`}
                          className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg border border-gray-200"
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-sm sm:text-base font-bold"
                          aria-label="刪除圖片"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 影片上傳區域 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">影片（選填）</label>
                
                {/* 拖放上傳區域 */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    processVideoFiles(e.dataTransfer.files);
                  }}
                  onClick={handleVideoUploadClick}
                  className={`
                    border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-all
                    ${isDragging 
                      ? 'border-brand-green bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                    ${isProcessingVideo ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  style={{ borderColor: isDragging ? '#1a5f3f' : undefined }}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg 
                      className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-brand-green" style={{ color: '#1a5f3f' }}>
                        點擊上傳影片
                      </span>
                      <span className="hidden sm:inline">{' '}或拖放影片到此處</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      支持 MP4、WebM 格式，單個文件不超過 50MB
                    </div>
                    {isProcessingVideo && (
                      <div className="text-sm text-brand-green" style={{ color: '#1a5f3f' }}>
                        正在處理影片...
                      </div>
                    )}
                  </div>
                </div>

                {/* 隱藏的影片輸入 */}
                <input
                  ref={videoInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />

                {/* 影片預覽 */}
                {editVideos.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4">
                    {editVideos.map((video, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={video}
                          controls
                          className="w-full h-auto rounded-lg border border-gray-200"
                          style={{ maxHeight: '300px' }}
                        >
                          您的瀏覽器不支持影片播放
                        </video>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVideo(index);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-sm sm:text-base font-bold"
                          aria-label="刪除影片"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : isRulesPost ? (
            <div className="text-gray-700 text-sm sm:text-base leading-relaxed">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-3">
                  {formatText(paragraph)}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
              {formatText(post.content)}
            </div>
          )}
        </div>

        {/* 茶帖圖片和影片顯示（版規和普通茶帖都顯示，編輯模式下不顯示，因為圖片已在上傳區域中） */}
        {!isEditing && ((post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)) && (
          <div className="mb-4 md:mb-6 space-y-4">
            {/* 圖片顯示 */}
            {post.images && post.images.length > 0 && (
              <div className={`grid gap-3 md:gap-4 ${
                post.images.length === 1 ? 'grid-cols-1' : 
                post.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {post.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`茶帖圖片 ${index + 1}`}
                      className="w-full rounded-lg shadow-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '500px', minHeight: '200px' }}
                      loading="lazy"
                      decoding="async"
                      onClick={() => {
                        // 點擊圖片可以放大查看
                        setSelectedImage(image);
                      }}
                      onError={(e) => {
                        // 如果圖片加載失敗，隱藏該圖片
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {post.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1} / {post.images.length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 影片顯示 */}
            {post.videos && post.videos.length > 0 && (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {post.videos.map((video, index) => (
                  <div key={index} className="relative">
                    <video
                      src={video}
                      controls
                      className="w-full h-auto rounded-lg shadow-md"
                      style={{ maxHeight: '600px' }}
                    >
                      您的瀏覽器不支持影片播放
                    </video>
                    {post.videos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        影片 {index + 1} / {post.videos.length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 md:pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 sm:gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm sm:text-base">{post.likesCount}</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={handleFavorite}
                className={`flex items-center gap-1.5 sm:gap-2 ${isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} transition-colors`}
                title={isFavorited ? '取消收藏' : '收藏'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm sm:text-base">{post.favoritesCount || 0}</span>
              </button>
            )}
            <span className="text-gray-500 flex items-center gap-1 text-sm sm:text-base">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views}
            </span>
            <span className="text-gray-500 flex items-center gap-1 text-sm sm:text-base">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.repliesCount}
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="分享茶帖"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm sm:text-base hidden sm:inline">分享</span>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && !isEditing && (
              <button
                onClick={handleEdit}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                title="編輯茶帖"
                type="button"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">編輯</span>
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-white bg-brand-green hover:bg-opacity-90 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: '#1a5f3f' }}
                  title="儲存編輯"
                  type="button"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">儲存</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  title="取消編輯"
                  type="button"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">取消</span>
                </button>
              </>
            )}
            {user?.role === 'admin' && !isEditing && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('確定要刪除此茶帖嗎？此操作無法復原。')) {
                    try {
                      await forumApi.deletePost(postId);
                      alert('茶帖已刪除');
                      onBack();
                    } catch (error: any) {
                      alert(error.message || '刪除失敗');
                    }
                  }
                }}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                title="刪除茶帖（管理員）"
                type="button"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">刪除</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 版規簽到提示 */}
      {isRulesPost && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-1.5 sm:mb-2">版規簽到</h3>
              <p className="text-blue-700 text-xs sm:text-sm md:text-base mb-2 leading-relaxed">
                請在下方留言區簽到，表示您已閱讀並同意遵守以上版規。簽到內容可以是「已讀」、「簽到」、「同意」等簡短回應。
              </p>
              {isAuthenticated && (
                <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                  <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">🎁 簽到獎勵：</p>
                  <ul className="text-[10px] sm:text-xs md:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
                    <li>• 首次簽到：<span className="font-bold text-green-600">+20 積分</span></li>
                    <li>• 首次簽到：<span className="font-bold text-green-600">+15 經驗值</span></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 關聯佳麗卡片 */}
      {relatedProfile && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 mt-4 md:mt-6 mb-4 md:mb-6">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-gray-900">關聯佳麗</h3>
          <button
            onClick={() => {
              if (onProfileClick) {
                onProfileClick(relatedProfile);
              } else {
                // 降級方案：使用 hash 導航
                window.location.href = `#profile-${relatedProfile.id}`;
              }
            }}
            className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg p-3 sm:p-4 md:p-5 transition-all shadow-sm hover:shadow-md border border-gray-200 text-left"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              {/* 照片 */}
              <div className="flex-shrink-0">
                <img
                  src={relatedProfile.imageUrl}
                  alt={relatedProfile.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg object-cover border-2 border-white shadow-md"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* 資訊 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate mb-1">
                      {relatedProfile.name} {relatedProfile.nationality}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm text-gray-600">
                      <span>{relatedProfile.age}歲</span>
                      <span>•</span>
                      <span>{relatedProfile.cup}罩杯</span>
                      <span>•</span>
                      <span>{relatedProfile.location}</span>
                      {relatedProfile.district && (
                        <>
                          <span>•</span>
                          <span>{relatedProfile.district}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 評分 */}
                {profileRating && profileRating.total > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            i < Math.round(profileRating.average)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm sm:text-base font-bold text-gray-700">
                      {profileRating.average.toFixed(1)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      ({profileRating.total} 則評論)
                    </span>
                  </div>
                )}

                {/* 價格 */}
                <div className="mt-2 sm:mt-3">
                  <span className="text-sm sm:text-base font-bold text-brand-green" style={{ color: '#1a5f3f' }}>
                    NT$ {relatedProfile.price.toLocaleString()}
                  </span>
                  {relatedProfile.prices?.oneShot?.desc && (
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      {relatedProfile.prices.oneShot.desc}
                    </span>
                  )}
                </div>
              </div>

              {/* 箭頭圖標 */}
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 回覆表單 - 僅用於直接回覆帖子（不是回覆留言） */}
      {isAuthenticated && !post.isLocked && !replyingTo && (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <form onSubmit={handleSubmitReply}>
            <RichTextEditor
              value={replyContent}
              onChange={setReplyContent}
              rows={4}
              placeholder={isRulesPost ? "簽到內容（例如：已讀、簽到、同意等）..." : "輸入回覆內容..."}
              className="mb-2 sm:mb-3 md:mb-4"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 text-xs sm:text-sm md:text-base font-medium transition-colors"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              {isSubmitting ? '發佈中...' : '發佈回覆'}
            </button>
          </form>
        </div>
      )}

      {/* 回覆列表 */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4">回覆 ({totalRepliesCount})</h2>
        {organizedReplies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">還沒有回覆，成為第一個回覆的人吧！</p>
        ) : (
          <div>
            {organizedReplies.map((reply, index) => (
              <ReplyCard
                key={`${reply.id}-${index}`}
                reply={reply}
                onReply={(replyId) => {
                  // 當點擊回覆時，清除頂部表單的 replyingTo 狀態
                  // 編輯器會顯示在該留言下方
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                onUpdate={loadPost}
                postId={postId}
                isRulesPost={isRulesPost}
              />
            ))}
          </div>
        )}
      </div>

      {/* 精選茶帖（該版區的其他茶帖） */}
      {relatedPosts.length > 0 && !isRulesPost && (
        <div className="mt-6 md:mt-8">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-brand-black mb-2">精選茶帖</h2>
            <p className="text-sm text-gray-500">探索{post?.category ? getCategoryLabel(post.category) : '其他'}版區的更多內容</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relatedPosts.map((relatedPost) => (
              <div
                key={relatedPost.id}
                onClick={() => {
                  if (onPostClick) {
                    onPostClick(relatedPost.id);
                  }
                }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
              >
                {/* 圖片 */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {relatedPost.images && relatedPost.images.length > 0 ? (
                    <img
                      src={relatedPost.images[0]}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">📝</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-brand-green text-white text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#1a5f3f' }}>
                      {relatedPost.category ? getCategoryLabel(relatedPost.category) : '茶帖'}
                    </span>
                  </div>
                </div>
                {/* 內容 */}
                <div className="p-3 md:p-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-green transition-colors" style={{ color: '#1a5f3f' }}>
                    {relatedPost.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                    {relatedPost.content?.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {relatedPost.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {relatedPost.repliesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {relatedPost.likesCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 圖片查看模態框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 text-3xl sm:text-4xl font-bold z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full transition-all hover:bg-opacity-70"
            title="關閉"
            aria-label="關閉"
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="放大查看"
            className="max-w-full max-h-[95vh] sm:max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* 用戶資料模態框 */}
      {showUserModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
      
      {/* 成就通知 */}
      <AchievementNotification
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        achievements={notification.achievements}
        newLevel={notification.newLevel}
        rewards={notification.rewards}
      />
    </div>
  );
};

// export default PostDetail; // Keep named export only



