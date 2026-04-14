import React, { useState, useRef, useEffect } from 'react';
import { forumApi, profilesApi, geminiApi } from '../services/apiService';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from './RichTextEditor';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [relatedProfileId, setRelatedProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProvider = user?.role === 'provider';

  // 載入 Profiles（僅在需要時載入）
  useEffect(() => {
    if (isOpen && (category === 'premium_tea' || category === 'fish_market' || category === 'booking')) {
      loadProfiles();
    }
  }, [isOpen, category]);

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

  if (!isOpen) return null;

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

  // 刪除圖片
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 觸發文件選擇
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        relatedProfileId: relatedProfileId || undefined
      });
      setTitle('');
      setContent('');
      setCategory('general');
      setTags([]);
      setImages([]);
      setRelatedProfileId('');
      setProfileSearchQuery('');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || '發茶帖失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold">發佈新茶帖</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
            aria-label="關閉"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">分類</label>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              placeholder="輸入標題..."
              style={{ focusRingColor: '#1a5f3f' }}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">內容</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              rows={8}
              placeholder="輸入內容..."
            />
          </div>

          {/* 圖片上傳區域 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">圖片（選填）</label>
            
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
              <div className="flex flex-col items-center justify-center space-y-1.5 sm:space-y-2">
                <svg 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" 
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
                <div className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold text-brand-green" style={{ color: '#1a5f3f' }}>
                    點擊上傳
                  </span>
                  <span className="hidden sm:inline">{' '}或拖放圖片到此處</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500">
                  支持 JPG、PNG 格式，可上傳多張圖片
                </div>
                {isCompressing && (
                  <div className="text-xs sm:text-sm text-brand-green" style={{ color: '#1a5f3f' }}>
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
              <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`預覽 ${index + 1}`}
                      className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-lg border border-gray-200"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs sm:text-base"
                      aria-label="刪除圖片"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                關聯佳麗（選填）
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileSearchQuery}
                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                  onFocus={() => loadProfiles()}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">標籤（選填）</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 min-w-[150px] px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                placeholder="輸入標籤後按Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 whitespace-nowrap"
              >
                新增
              </button>
              <button
                type="button"
                onClick={handleSuggestTags}
                disabled={isLoadingSuggestions || (!title.trim() && !content.trim())}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"
                style={{ backgroundColor: '#1a5f3f' }}
                title="根據標題和內容智能建議標籤"
              >
                {isLoadingSuggestions ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              {isSubmitting ? '發佈中...' : '發佈'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;



