import React, { useState, useRef, useEffect } from 'react';
import { forumApi, profilesApi, geminiApi } from '../services/apiService';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from './RichTextEditor';
import { formatText } from '../utils/textFormatter';

interface CreatePostPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'general', label: '綜合討論' },
  { value: 'premium_tea', label: '嚴選好茶' },
  { value: 'fish_market', label: '特選魚市' },
  { value: 'booking', label: '預約交流' },
  { value: 'experience', label: '經驗分享' },
  { value: 'question', label: '問題求助' },
  { value: 'chat', label: '閒聊區' },
  { value: 'lady_promotion', label: '佳麗御選名鑑', providerOnly: true },
  { value: 'announcement', label: '官方公告' },
];

export const CreatePostPage: React.FC<CreatePostPageProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [relatedProfileId, setRelatedProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isProvider = user?.role === 'provider';

  // 載入 Profiles（僅在需要時載入）
  useEffect(() => {
    if (category === 'premium_tea' || category === 'fish_market' || category === 'booking') {
      loadProfiles();
    }
  }, [category]);

  const loadProfiles = async () => {
    try {
      // 創建茶帖時需要載入所有 profiles 供選擇
      const result = await profilesApi.getAll();
      const profiles = result.profiles || [];
      setProfiles(profiles);
    } catch (error) {
      console.error('載入 Profiles 失敗:', error);
    }
  };

  // 過濾 Profiles
  // 根據分類過濾：嚴選好茶只顯示管理員上架的（userId為空），特選魚市只顯示佳麗上架的（userId不為空）
  const filteredProfiles = profiles.filter(profile => {
    // 先根據分類過濾
    if (category === 'premium_tea') {
      // 嚴選好茶：只顯示 userId 為空或未定義的（管理員上架）
      if (profile.userId && profile.userId !== '') {
        return false;
      }
    } else if (category === 'fish_market') {
      // 特選魚市：只顯示 userId 不為空的（佳麗上架）
      if (!profile.userId || profile.userId === '') {
        return false;
      }
    }
    
    // 再根據搜尋關鍵字過濾
    return (
      profile.name.toLowerCase().includes(profileSearchQuery.toLowerCase()) ||
      profile.location.toLowerCase().includes(profileSearchQuery.toLowerCase())
    );
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 智能建議標籤
  const handleSuggestTags = async () => {
    if (!title.trim() && !content.trim()) {
      alert('請先輸入標題或內容，才能獲得標籤建議');
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const result = await geminiApi.suggestTags({
        title: title.trim(),
        content: content.trim(),
        category: category
      });
      setSuggestedTags(result.tags || []);
    } catch (error: any) {
      console.error('獲取標籤建議失敗:', error);
      alert(error.message || '獲取標籤建議失敗，請稍後再試');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 添加建議的標籤
  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    // 從建議列表中移除已添加的標籤
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

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
      setImages(prev => [...prev, ...compressed]);
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
      setVideos(prev => [...prev, ...videoDataUrls]);
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
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 刪除影片
  const handleRemoveVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // 觸發文件選擇
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 觸發影片選擇
  const handleVideoUploadClick = () => {
    videoInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('請填寫標題和內容');
      return;
    }

    setIsSubmitting(true);
    try {
      await forumApi.createPost({ 
        title, 
        content, 
        category, 
        tags: tags.length > 0 ? tags : undefined,
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
        relatedProfileId: relatedProfileId || undefined
      });
      setTitle('');
      setContent('');
      setCategory('general');
      setTags([]);
      setImages([]);
      setVideos([]);
      setRelatedProfileId('');
      setProfileSearchQuery('');
      onSuccess();
      onBack();
    } catch (error: any) {
      alert(error.message || '發茶帖失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 標題和返回按鈕 */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="返回"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">發佈新茶帖</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            {isPreview ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                編輯
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                預覽
              </>
            )}
          </button>
        </div>

        {/* 表單或預覽 */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
          {isPreview ? (
            /* 預覽模式 */
            <div className="space-y-4 sm:space-y-6">
              {/* 分類標籤 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded font-medium">
                  {CATEGORIES.find(c => c.value === category)?.label || '未分類'}
                </span>
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs sm:text-sm bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 標題 */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {title || <span className="text-gray-400 italic">（未填寫標題）</span>}
              </h2>

              {/* 內容 */}
              <div className="prose max-w-none text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                {content ? (
                  <div className="break-words">
                    {formatText(content)}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">（未填寫內容）</p>
                )}
              </div>

              {/* 圖片預覽 */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`預覽 ${index + 1}`}
                        className="w-full h-auto rounded-lg border border-gray-200 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{images.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 影片預覽 */}
              {videos.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        src={video}
                        controls
                        className="w-full h-auto rounded-lg border border-gray-200"
                        style={{ maxHeight: '500px' }}
                      >
                        您的瀏覽器不支持影片播放
                      </video>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        影片 {index + 1}/{videos.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 關聯佳麗 */}
              {relatedProfileId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>關聯佳麗：</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    {profiles.find(p => p.id === relatedProfileId)?.name || '未知'}
                  </span>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPreview(false)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  返回編輯
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  {isSubmitting ? '發佈中...' : '確認發佈'}
                </button>
              </div>
            </div>
          ) : (
            /* 編輯模式 */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">分類</label>
              <select
                value={category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  // 檢查佳麗御選名鑑的權限
                  if (newCategory === 'lady_promotion' && !isProvider) {
                    alert('此版區僅限佳麗發茶帖宣傳，請先註冊為佳麗身份');
                    return;
                  }
                  setCategory(newCategory);
                }}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent text-sm sm:text-base"
                style={{ focusRingColor: '#1a5f3f' }}
              >
                {CATEGORIES.map(cat => {
                  // 如果是佳麗專屬分類且不是佳麗，則不顯示
                  if (cat.providerOnly && !isProvider) {
                    return null;
                  }
                  return (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  );
                })}
              </select>
              {category === 'lady_promotion' && (
                <p className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  此版區可發布聯絡方式、照片、價格等宣傳內容
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">標題</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                placeholder="輸入標題..."
                style={{ focusRingColor: '#1a5f3f' }}
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">內容</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                rows={10}
                placeholder="輸入內容..."
              />
            </div>

            {/* 圖片上傳區域 */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">圖片（選填）</label>
              
              {/* 拖放上傳區域 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={`
                  border-2 border-dashed rounded-lg p-6 sm:p-8 md:p-12 text-center cursor-pointer transition-all
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
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400" 
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
                  <div className="text-sm sm:text-base text-gray-600">
                    <span className="font-semibold text-brand-green" style={{ color: '#1a5f3f' }}>
                      點擊上傳
                    </span>
                    <span className="hidden sm:inline">{' '}或拖放圖片到此處</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
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
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {images.map((image, index) => (
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
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">影片（選填）</label>
              
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
              {videos.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4">
                  {videos.map((video, index) => (
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

            {/* 關聯 Profile（僅在特定分類顯示） */}
            {(category === 'premium_tea' || category === 'fish_market' || category === 'booking') && (
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  關聯佳麗（選填）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileSearchQuery}
                    onChange={(e) => setProfileSearchQuery(e.target.value)}
                    onFocus={() => loadProfiles()}
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    placeholder="搜尋佳麗名字或地區..."
                  />
                  {profileSearchQuery && filteredProfiles.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProfiles.slice(0, 10).map(profile => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setRelatedProfileId(profile.id);
                            setProfileSearchQuery(profile.name);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                            relatedProfileId === profile.id ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-gray-500">{profile.location}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {relatedProfileId && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">已選擇：</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {profiles.find(p => p.id === relatedProfileId)?.name || '未知'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRelatedProfileId('');
                          setProfileSearchQuery('');
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        清除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">標籤（選填）</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  placeholder="輸入標籤後按Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 whitespace-nowrap"
                >
                  新增
                </button>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={isLoadingSuggestions || (!title.trim() && !content.trim())}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                  style={{ backgroundColor: '#1a5f3f' }}
                  title="根據標題和內容智能建議標籤"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      分析中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      智能建議
                    </>
                  )}
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {suggestedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">建議標籤（點擊添加）：</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddSuggestedTag(tag)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                {isSubmitting ? '發佈中...' : '發佈'}
              </button>
            </div>
          </form>
          )}
        </div>

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
      </div>
    </div>
  );
};

export default CreatePostPage;

