import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { LISTING_TERMS } from '../constants/terms';
import { uploadApi } from '../services/apiService';

interface ProviderEditorProps {
  initialData?: Profile | null;
  onSave: (profile: Profile) => void;
  onCancel: () => void;
}

const DEFAULT_GALLERY: string[] = [];

export const ProviderEditor: React.FC<ProviderEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    age: 20,
    price: 3000,
    height: 160,
    weight: 45,
    cup: 'C',
    location: '台北市',
    district: '',
    type: 'outcall',
    nationality: '🇹🇼',
    tags: [],
    imageUrl: '',
    isAvailable: true,
    isNew: true,
    basicServices: [],
    addonServices: [],
    contactInfo: {
      line: '',
      phone: '',
      email: '',
      telegram: '',
      socialAccounts: {},
      preferredMethod: undefined,
      contactInstructions: ''
    },
    remarks: '',
    bookingProcess: '',
    prices: {
        oneShot: { price: 3000, desc: '一節/50min/1S' },
        twoShot: { price: 5500, desc: '兩節/100min/2S' }
    },
    availableTimes: {
        today: '12:00~02:00',
        tomorrow: '12:00~02:00'
    },
    gallery: DEFAULT_GALLERY,
    albums: []
  });

  const [newAddon, setNewAddon] = useState('');
  const [description, setDescription] = useState(''); // 補充資訊欄位
  const [remarks, setRemarks] = useState(''); // 備註字段
  const [contactInfo, setContactInfo] = useState({
    line: '',
    phone: '',
    email: '',
    telegram: '',
    socialAccounts: {} as Record<string, string>,
    preferredMethod: undefined as 'line' | 'phone' | 'email' | 'telegram' | undefined,
    contactInstructions: ''
  });
  const [bookingProcess, setBookingProcess] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState({ name: '', value: '' });
  const [agreedToListingTerms, setAgreedToListingTerms] = useState(false);
  const [showListingTerms, setShowListingTerms] = useState(false);
  
  // 社群平台圖標組件
  const SocialPlatformIcon: React.FC<{ platform: string }> = ({ platform }) => {
    const iconSize = 16;
    
    if (platform === 'X' || platform.includes('Twitter')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    }
    
    if (platform === 'IG' || platform.includes('Instagram')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    }
    
    if (platform === 'FB' || platform.includes('Facebook')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    }
    
    if (platform.includes('WhatsApp')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      );
    }
    
    if (platform.includes('OnlyFans')) {
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" className="text-pink-600">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      );
    }
    
    return null;
  };

  // 預設社群平台
  const socialPlatforms = [
    { key: 'X', label: 'X (Twitter)' },
    { key: 'IG', label: 'Instagram' },
    { key: 'FB', label: 'Facebook' },
    { key: 'WhatsApp', label: 'WhatsApp' },
    { key: 'OnlyFans', label: 'OnlyFans' },
  ];

  // 选项列表
  const locations = ['台北市', '新北市', '基隆市', '桃園市', '新竹市', '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣'];
  const districts = ['大安區', '中正區', '信義區', '松山區', '中山區', '大同區', '萬華區', '文山區', '南港區', '內湖區', '士林區', '北投區', '板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區', '西屯區', '南屯區', '北屯區', '豐原區', '東區', '南區', '西區', '北區', '中區', '其他'];
  const cups = ['A', 'B', 'C', 'D', 'E', 'F', 'G+'];
  const bodyTypes = ['纖細', '勻稱', '肉感', '豐滿', '模特兒', '長腿'];
  const personalities = ['氣質', '鄰家', '性感', '溫柔', '活潑', '御姐', '學生'];
  const basicServicesOptions = ['聊天', '按摩', '陪遊', '伴遊', '約會', '其他'];
  const addonServicesOptions = ['毒龍', '69', '自拍', '雙飛', '口爆', '無套', '顏射', '後門', 'SM', '角色扮演'];

  useEffect(() => {
    if (initialData) {
        setFormData({ ...initialData });
        // 從basicServices中提取補充資訊（備註）
        const noteService = initialData.basicServices?.find(s => s.startsWith('備註：'));
        if (noteService) {
          setDescription(noteService.replace('備註：', ''));
        } else {
          setDescription('');
        }
        // 設定備註和聯絡方式
        setRemarks(initialData.remarks || '');
        setContactInfo({
          line: initialData.contactInfo?.line || '',
          phone: initialData.contactInfo?.phone || '',
          email: initialData.contactInfo?.email || '',
          telegram: initialData.contactInfo?.telegram || '',
          socialAccounts: initialData.contactInfo?.socialAccounts || {},
          preferredMethod: initialData.contactInfo?.preferredMethod,
          contactInstructions: initialData.contactInfo?.contactInstructions || ''
        });
        setBookingProcess(initialData.bookingProcess || '');
    } else {
      setDescription('');
      setRemarks('');
      setContactInfo({
        line: '',
        phone: '',
        email: '',
        telegram: '',
        socialAccounts: {},
        preferredMethod: undefined,
        contactInstructions: ''
      });
      setBookingProcess('');
    }
  }, [initialData]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
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
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (error) => {
          reject(new Error('Image loading failed'));
        };
      };
      reader.onerror = (error) => {
        reject(new Error('FileReader failed'));
      };
    });
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsCompressing(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file);
        const response = await uploadApi.uploadImage(compressedFile);
        return response.imageUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData(prev => ({
        ...prev,
        imageUrl: prev.imageUrl || uploadedUrls[0],
        gallery: [...(prev.gallery || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('文件上傳失敗:', error);
      alert('圖片上傳失敗，請稍後重試');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDeleteImage = (indexToDelete: number) => {
    setFormData(prev => {
        const newGallery = (prev.gallery || []).filter((_, idx) => idx !== indexToDelete);
        const newImageUrl = prev.imageUrl === prev.gallery?.[indexToDelete] ? (newGallery[0] || '') : prev.imageUrl;
        return { ...prev, gallery: newGallery, imageUrl: newImageUrl };
    });
  };

  const handleAddAddon = () => {
      if (!newAddon.trim()) return;
      setFormData(prev => ({
          ...prev,
          addonServices: [...(prev.addonServices || []), newAddon.trim()]
      }));
      setNewAddon('');
  };

  const handleRemoveAddon = (idx: number) => {
      setFormData(prev => ({
          ...prev,
          addonServices: (prev.addonServices || []).filter((_, i) => i !== idx)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      alert("請填寫姓名並上傳照片");
      return;
    }
    
    if (!agreedToListingTerms) {
      alert("請閱讀並同意上架資料服務條款");
      return;
    }
    
    // 將補充資訊新增到basicServices的備註中
    const finalBasicServices = [...(formData.basicServices || [])];
    // 移除之前的備註（如果存在）
    const servicesWithoutNote = finalBasicServices.filter(s => !s.startsWith('備註：'));
    if (description.trim()) {
      // 將補充資訊作為備註新增到basicServices陣列
      servicesWithoutNote.push(`備註：${description.trim()}`);
    }
    
    onSave({
        id: initialData?.id || Date.now().toString(),
        ...formData as Profile,
        basicServices: servicesWithoutNote,
        contactInfo: {
          ...contactInfo,
          socialAccounts: Object.keys(contactInfo.socialAccounts).length > 0 ? contactInfo.socialAccounts : undefined
        },
        remarks: remarks.trim() || undefined,
        bookingProcess: bookingProcess.trim() || undefined,
    });
  };

  // 多选处理函数
  const handleMultiSelect = (field: 'location' | 'district' | 'tags' | 'basicServices' | 'addonServices', value: string) => {
    if (field === 'location') {
      const currentLocations = formData.location ? formData.location.split(',').filter(l => l.trim()) : [];
      const newLocations = currentLocations.includes(value)
        ? currentLocations.filter(l => l !== value)
        : [...currentLocations, value];
      setFormData(prev => ({ ...prev, location: newLocations.join(',') }));
    } else if (field === 'district') {
      const currentDistricts = Array.isArray(formData.district) ? formData.district : (formData.district ? formData.district.split(',').filter(d => d.trim()) : []);
      const newDistricts = currentDistricts.includes(value)
        ? currentDistricts.filter(d => d !== value)
        : [...currentDistricts, value];
      setFormData(prev => ({ ...prev, district: newDistricts.join(',') }));
    } else if (field === 'tags') {
      const currentTags = formData.tags || [];
      const newTags = currentTags.includes(value)
        ? currentTags.filter(t => t !== value)
        : [...currentTags, value];
      setFormData(prev => ({ ...prev, tags: newTags }));
    } else if (field === 'basicServices') {
      const currentServices = formData.basicServices || [];
      const newServices = currentServices.includes(value)
        ? currentServices.filter(s => s !== value)
        : [...currentServices, value];
      setFormData(prev => ({ ...prev, basicServices: newServices }));
    } else if (field === 'addonServices') {
      const currentAddons = formData.addonServices || [];
      const newAddons = currentAddons.includes(value)
        ? currentAddons.filter(a => a !== value)
        : [...currentAddons, value];
      setFormData(prev => ({ ...prev, addonServices: newAddons }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up px-4 md:px-0 pb-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-8 relative">
        <h2 className="text-xl md:text-2xl font-serif font-black text-brand-black mb-4 md:mb-8 border-b pb-3 md:pb-4">
            {initialData ? '✏️ 編輯我的資料' : '⚡ 立即上架'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* 照片區塊 - 移动端优化 */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm md:text-base font-bold text-gray-700 block mb-3">📸 照片管理 (第一張為封面)</label>
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
                    className={`border-4 border-dashed rounded-xl p-6 md:p-10 text-center transition-all ${isDragging ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white'}`}
                    style={isDragging ? { borderColor: '#1a5f3f' } : {}}
                >
                    <input type="file" multiple accept="image/*" onChange={(e) => processFiles(e.target.files)} className="hidden" id="provider-file-upload" />
                    <label htmlFor="provider-file-upload" className="cursor-pointer">
                        <div className="text-3xl md:text-4xl mb-3 md:mb-4">{isCompressing ? '⏳' : '📤'}</div>
                        <p className="text-sm md:text-base font-bold text-gray-600">拖曳或點擊上傳</p>
                    </label>
                </div>
                
                {formData.gallery && formData.gallery.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
                        {formData.gallery.map((img, i) => (
                            <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group transition-all ${formData.imageUrl === img ? 'border-brand-green scale-105 z-10' : 'border-gray-100'}`} onClick={() => setFormData(p => ({...p, imageUrl: img}))} style={formData.imageUrl === img ? { borderColor: '#1a5f3f' } : {}}>
                                <img src={img} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                
                                {/* 刪除按鈕 */}
                                <button 
                                    type="button" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleDeleteImage(i); 
                                    }}
                                    className="absolute top-1 right-1 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center text-xs font-black shadow-xl hover:bg-red-600 active:scale-90 z-[50]"
                                    title="刪除此圖片"
                                >
                                    ✕
                                </button>
                                
                                {formData.imageUrl === img && (
                                    <div className="absolute inset-x-0 bottom-0 bg-brand-green/90 text-white text-[10px] font-black py-1 text-center" style={{ backgroundColor: 'rgba(26, 95, 63, 0.9)' }}>當前封面</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 姓名和价格 - 移动端单列 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">姓名 *</label>
                    <input required name="name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base" style={{ focusRingColor: '#1a5f3f' }} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">基本價格 (NT$) *</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData(p => ({...p, price: Number(e.target.value)}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base" style={{ focusRingColor: '#1a5f3f' }} />
                    <p className="text-xs text-gray-500">此價格將作為預設價格顯示</p>
                </div>
            </div>

            {/* 服務類型與價格 */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 block">服務類型與價格 *</label>
                <p className="text-xs text-gray-500 mb-4">請勾選您提供的服務類型，並填寫對應的價格和說明</p>
                
                {/* 一節 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.oneShot}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.oneShot = { price: 3000, desc: '一節/50min/1S' };
                                } else {
                                    delete newPrices.oneShot;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">一節</label>
                    </div>
                    {formData.prices?.oneShot && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.oneShot.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            oneShot: { ...p.prices?.oneShot!, price: Number(e.target.value), desc: p.prices?.oneShot?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.oneShot.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            oneShot: { ...p.prices?.oneShot!, price: p.prices?.oneShot?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：一節/50min/1S"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 兩節 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.twoShot}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.twoShot = { price: 5500, desc: '兩節/100min/2S' };
                                } else {
                                    delete newPrices.twoShot;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">兩節</label>
                    </div>
                    {formData.prices?.twoShot && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.twoShot.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            twoShot: { ...p.prices?.twoShot!, price: Number(e.target.value), desc: p.prices?.twoShot?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.twoShot.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            twoShot: { ...p.prices?.twoShot!, price: p.prices?.twoShot?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：兩節/100min/2S"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 三節 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.threeShot}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.threeShot = { price: 8000, desc: '三節/150min/3S' };
                                } else {
                                    delete newPrices.threeShot;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">三節</label>
                    </div>
                    {formData.prices?.threeShot && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.threeShot.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            threeShot: { ...p.prices?.threeShot!, price: Number(e.target.value), desc: p.prices?.threeShot?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.threeShot.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            threeShot: { ...p.prices?.threeShot!, price: p.prices?.threeShot?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：三節/150min/3S"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 過夜 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.overnight}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.overnight = { price: 15000, desc: '過夜/8小時' };
                                } else {
                                    delete newPrices.overnight;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">過夜</label>
                    </div>
                    {formData.prices?.overnight && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.overnight.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            overnight: { ...p.prices?.overnight!, price: Number(e.target.value), desc: p.prices?.overnight?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.overnight.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            overnight: { ...p.prices?.overnight!, price: p.prices?.overnight?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：過夜/8小時"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 約會 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.dating}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.dating = { price: 5000, desc: '約會/3小時' };
                                } else {
                                    delete newPrices.dating;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">約會</label>
                    </div>
                    {formData.prices?.dating && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.dating.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            dating: { ...p.prices?.dating!, price: Number(e.target.value), desc: p.prices?.dating?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.dating.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            dating: { ...p.prices?.dating!, price: p.prices?.dating?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：約會/3小時"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 伴遊 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            checked={!!formData.prices?.escort}
                            onChange={(e) => {
                                const newPrices = { ...formData.prices };
                                if (e.target.checked) {
                                    newPrices.escort = { price: 8000, desc: '伴遊/4小時' };
                                } else {
                                    delete newPrices.escort;
                                }
                                setFormData(p => ({ ...p, prices: newPrices }));
                            }}
                            className="w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            style={{ accentColor: '#1a5f3f' }}
                        />
                        <label className="text-sm font-semibold text-gray-700">伴遊</label>
                    </div>
                    {formData.prices?.escort && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                            <div>
                                <label className="text-xs text-gray-600">價格 (NT$)</label>
                                <input
                                    type="number"
                                    value={formData.prices.escort.price}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            escort: { ...p.prices?.escort!, price: Number(e.target.value), desc: p.prices?.escort?.desc || '' }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">說明</label>
                                <input
                                    type="text"
                                    value={formData.prices.escort.desc}
                                    onChange={(e) => setFormData(p => ({
                                        ...p,
                                        prices: {
                                            ...p.prices,
                                            escort: { ...p.prices?.escort!, price: p.prices?.escort?.price || 0, desc: e.target.value }
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="例如：伴遊/4小時"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 自定義服務類型 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 block mb-3">自定義服務類型（選填）</label>
                    <div className="space-y-3">
                        {Object.entries(formData.prices || {}).filter(([key]) => !['oneShot', 'twoShot', 'threeShot', 'overnight', 'dating', 'escort'].includes(key)).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="text-xs text-gray-600">服務名稱</label>
                                    <input
                                        type="text"
                                        value={key}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">價格 (NT$)</label>
                                    <input
                                        type="number"
                                        value={value?.price || 0}
                                        onChange={(e) => {
                                            const newPrices = { ...formData.prices };
                                            newPrices[key] = { price: Number(e.target.value), desc: value?.desc || '' };
                                            setFormData(p => ({ ...p, prices: newPrices }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">說明</label>
                                    <input
                                        type="text"
                                        value={value?.desc || ''}
                                        onChange={(e) => {
                                            const newPrices = { ...formData.prices };
                                            newPrices[key] = { price: value?.price || 0, desc: e.target.value };
                                            setFormData(p => ({ ...p, prices: newPrices }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPrices = { ...formData.prices };
                                            delete newPrices[key];
                                            setFormData(p => ({ ...p, prices: newPrices }));
                                        }}
                                        className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="customServiceName"
                                placeholder="服務名稱（例如：包天）"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const serviceName = input.value.trim();
                                        if (serviceName && !formData.prices?.[serviceName]) {
                                            const newPrices = { ...formData.prices || {} };
                                            newPrices[serviceName] = { price: 0, desc: '' };
                                            setFormData(p => ({ ...p, prices: newPrices }));
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.getElementById('customServiceName') as HTMLInputElement;
                                    const serviceName = input.value.trim();
                                    if (serviceName && !formData.prices?.[serviceName]) {
                                        const newPrices = { ...formData.prices || {} };
                                        newPrices[serviceName] = { price: 0, desc: '' };
                                        setFormData(p => ({ ...p, prices: newPrices }));
                                        input.value = '';
                                    }
                                }}
                                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-semibold"
                                style={{ backgroundColor: '#1a5f3f' }}
                            >
                                新增
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 國家/國籍 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">國家/國籍 *</label>
                <select value={formData.nationality || '🇹🇼'} onChange={(e) => setFormData(p => ({...p, nationality: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white" style={{ focusRingColor: '#1a5f3f' }}>
                    <option value="🇹🇼">🇹🇼 台灣</option>
                    <option value="🇯🇵">🇯🇵 日本</option>
                    <option value="🇰🇷">🇰🇷 韓國</option>
                    <option value="🇭🇰">🇭🇰 香港</option>
                    <option value="🇨🇳">🇨🇳 中國</option>
                    <option value="🇹🇭">🇹🇭 泰國</option>
                    <option value="🇻🇳">🇻🇳 越南</option>
                    <option value="🇲🇾">🇲🇾 馬來西亞</option>
                    <option value="🇸🇬">🇸🇬 新加坡</option>
                </select>
            </div>

            {/* 城市 - 多选 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">城市 *（可多選）</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {locations.map(loc => {
                        const currentLocations = formData.location ? formData.location.split(',').filter(l => l.trim()) : [];
                        const isSelected = currentLocations.includes(loc);
                        return (
                            <label key={loc} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMultiSelect('location', loc)}
                                    className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                                    style={{ accentColor: '#1a5f3f' }}
                                />
                                <span className="text-sm text-gray-700">{loc}</span>
                            </label>
                        );
                    })}
                </div>
                {formData.location && (
                    <p className="text-xs text-gray-500 mt-2">已選擇：{Array.isArray(formData.location) ? formData.location.join(', ') : formData.location}</p>
                )}
            </div>

            {/* 行政區 - 多选 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">行政區（可多選）</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {districts.map(dist => {
                        const currentDistricts = formData.district ? formData.district.split(',').filter(d => d.trim()) : [];
                        const isSelected = currentDistricts.includes(dist);
                        return (
                            <label key={dist} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMultiSelect('district', dist)}
                                    className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                                    style={{ accentColor: '#1a5f3f' }}
                                />
                                <span className="text-sm text-gray-700">{dist}</span>
                            </label>
                        );
                    })}
                </div>
                {formData.district && (
                    <p className="text-xs text-gray-500 mt-2">已選擇：{formData.district}</p>
                )}
            </div>

            {/* 年龄、身高、体重、罩杯 - 移动端2列，桌面端4列 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">年齡 *</label>
                    <input type="number" value={formData.age} onChange={(e) => setFormData(p => ({...p, age: Number(e.target.value)}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base" style={{ focusRingColor: '#1a5f3f' }} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">身高 (cm) *</label>
                    <input type="number" value={formData.height} onChange={(e) => setFormData(p => ({...p, height: Number(e.target.value)}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base" style={{ focusRingColor: '#1a5f3f' }} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">體重 (kg) *</label>
                    <input type="number" value={formData.weight} onChange={(e) => setFormData(p => ({...p, weight: Number(e.target.value)}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base" style={{ focusRingColor: '#1a5f3f' }} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">罩杯 *</label>
                    <select value={formData.cup || ''} onChange={(e) => setFormData(p => ({...p, cup: e.target.value}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white" style={{ focusRingColor: '#1a5f3f' }}>
                        <option value="">請選擇罩杯</option>
                        {cups.map(cup => (
                            <option key={cup} value={cup}>{cup}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 類型 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">類型 *</label>
                <select value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value as 'outcall' | 'incall'}))} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white" style={{ focusRingColor: '#1a5f3f' }}>
                    <option value="outcall">外送</option>
                    <option value="incall">定點</option>
                </select>
            </div>

            {/* 標籤 - 身材條件和風格特質多选 */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 block">標籤 *（可多選）</label>
                
                {/* 身材條件 */}
                <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">身材條件</p>
                    <div className="flex flex-wrap gap-2">
                        {bodyTypes.map(type => {
                            const isSelected = (formData.tags || []).includes(type);
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleMultiSelect('tags', type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-brand-green text-white'
                                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-brand-green'
                                    }`}
                                    style={isSelected ? { backgroundColor: '#1a5f3f' } : {}}
                                >
                                    {type}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 風格特質 */}
                <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">風格特質</p>
                    <div className="flex flex-wrap gap-2">
                        {personalities.map(personality => {
                            const isSelected = (formData.tags || []).includes(personality);
                            return (
                                <button
                                    key={personality}
                                    type="button"
                                    onClick={() => handleMultiSelect('tags', personality)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-brand-green text-white'
                                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-brand-green'
                                    }`}
                                    style={isSelected ? { backgroundColor: '#1a5f3f' } : {}}
                                >
                                    {personality}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {formData.tags && formData.tags.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">已選擇：{formData.tags.join(', ')}</p>
                )}
            </div>

            {/* 基本服務 - 多选 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">基本服務 *（可多選）</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {basicServicesOptions.map(service => {
                        const isSelected = (formData.basicServices || []).includes(service);
                        return (
                            <label key={service} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMultiSelect('basicServices', service)}
                                    className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                                    style={{ accentColor: '#1a5f3f' }}
                                />
                                <span className="text-sm text-gray-700">{service}</span>
                            </label>
                        );
                    })}
                </div>
                {formData.basicServices && formData.basicServices.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">已選擇：{formData.basicServices.join(', ')}</p>
                )}
            </div>

            {/* 聯絡方式 */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700 block">聯絡方式</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-600">LINE ID</label>
                        <input
                            type="text"
                            value={contactInfo.line}
                            onChange={(e) => setContactInfo({ ...contactInfo, line: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                            placeholder="請輸入 LINE ID"
                            style={{ focusRingColor: '#1a5f3f' }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-600">電話</label>
                        <input
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                            placeholder="請輸入電話號碼"
                            style={{ focusRingColor: '#1a5f3f' }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-600">信箱</label>
                        <input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                            placeholder="請輸入 Email"
                            style={{ focusRingColor: '#1a5f3f' }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-600">Telegram</label>
                        <input
                            type="text"
                            value={contactInfo.telegram}
                            onChange={(e) => setContactInfo({ ...contactInfo, telegram: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                            placeholder="請輸入 Telegram ID"
                            style={{ focusRingColor: '#1a5f3f' }}
                        />
                    </div>
                </div>
                
                {/* 社群帳號 */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="text-sm font-semibold text-gray-700 block mb-3">社群帳號</label>
                    
                    {/* 預設平台 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {socialPlatforms.map(platform => (
                            <div key={platform.key} className="space-y-2">
                                <label className="text-xs text-gray-600 flex items-center gap-2">
                                    <SocialPlatformIcon platform={platform.key} />
                                    {platform.label}
                                </label>
                                <input
                                    type="text"
                                    value={contactInfo.socialAccounts?.[platform.key] || ''}
                                    onChange={(e) => setContactInfo({
                                        ...contactInfo,
                                        socialAccounts: {
                                            ...contactInfo.socialAccounts,
                                            [platform.key]: e.target.value
                                        }
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                                    placeholder={`請輸入 ${platform.label} 帳號或連結`}
                                    style={{ focusRingColor: '#1a5f3f' }}
                                />
                            </div>
                        ))}
                    </div>
                    
                    {/* 自訂平台 */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-600 font-semibold">自訂社群平台</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSocialPlatform.name}
                                onChange={(e) => setNewSocialPlatform({ ...newSocialPlatform, name: e.target.value })}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm bg-white"
                                placeholder="平台名稱（如：TikTok）"
                                style={{ focusRingColor: '#1a5f3f' }}
                            />
                            <input
                                type="text"
                                value={newSocialPlatform.value}
                                onChange={(e) => setNewSocialPlatform({ ...newSocialPlatform, value: e.target.value })}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm bg-white"
                                placeholder="帳號或連結"
                                style={{ focusRingColor: '#1a5f3f' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newSocialPlatform.name && newSocialPlatform.value) {
                                        setContactInfo({
                                            ...contactInfo,
                                            socialAccounts: {
                                                ...contactInfo.socialAccounts,
                                                [newSocialPlatform.name]: newSocialPlatform.value
                                            }
                                        });
                                        setNewSocialPlatform({ name: '', value: '' });
                                    }
                                }}
                                className="px-4 py-2 bg-brand-green text-white rounded-xl font-semibold hover:bg-opacity-90 transition-colors"
                                style={{ backgroundColor: '#1a5f3f' }}
                            >
                                新增
                            </button>
                        </div>
                        
                        {/* 顯示已新增的自訂平台 */}
                        {Object.keys(contactInfo.socialAccounts || {}).filter(key => !socialPlatforms.find(p => p.key === key)).length > 0 && (
                            <div className="mt-2 space-y-2">
                                {Object.entries(contactInfo.socialAccounts || {}).filter(([key]) => !socialPlatforms.find(p => p.key === key)).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                        <span className="text-sm font-semibold text-gray-700 flex-1">{key}:</span>
                                        <span className="text-sm text-gray-600 flex-1 truncate">{value}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newAccounts = { ...contactInfo.socialAccounts };
                                                delete newAccounts[key];
                                                setContactInfo({ ...contactInfo, socialAccounts: newAccounts });
                                            }}
                                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 首選聯繫方式 */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">首選聯繫方式</label>
                    <select
                        value={contactInfo.preferredMethod || ''}
                        onChange={(e) => setContactInfo({
                            ...contactInfo,
                            preferredMethod: e.target.value as 'line' | 'phone' | 'email' | 'telegram' | undefined || undefined
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base bg-white"
                        style={{ focusRingColor: '#1a5f3f' }}
                    >
                        <option value="">請選擇</option>
                        <option value="line">LINE</option>
                        <option value="phone">電話</option>
                        <option value="email">Email</option>
                        <option value="telegram">Telegram</option>
                    </select>
                </div>
                
                {/* 聯繫說明 */}
                <div className="mt-4">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">聯繫說明（選填）</label>
                    <textarea
                        value={contactInfo.contactInstructions}
                        onChange={(e) => setContactInfo({ ...contactInfo, contactInstructions: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base resize-y min-h-[80px] bg-white"
                        placeholder="例如：最佳聯繫時間、如何聯繫等..."
                        style={{ focusRingColor: '#1a5f3f' }}
                    />
                </div>
            </div>
            
            {/* 預約流程 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">預約流程說明</label>
                <textarea 
                    value={bookingProcess} 
                    onChange={(e) => setBookingProcess(e.target.value)} 
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base resize-y bg-white" 
                    placeholder="請描述如何與您聯繫以及預約流程，例如：\n1. 透過 LINE 聯繫\n2. 確認時間與地點\n3. 預付訂金\n4. 確認預約..."
                    style={{ focusRingColor: '#1a5f3f' }}
                />
            </div>

            {/* 補充訊息 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">補充訊息</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base resize-y bg-white" 
                    placeholder="請在此輸入補充訊息，例如：特殊服務、注意事項、個人特色等..."
                    style={{ focusRingColor: '#1a5f3f' }}
                />
            </div>

            {/* 備註 */}
            <div className="space-y-2 bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">備註</label>
                <textarea 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green text-base resize-y bg-white" 
                    placeholder="請在此輸入備註資訊..."
                    style={{ focusRingColor: '#1a5f3f' }}
                />
            </div>

            {/* 加值服務區塊 - 多选 + 手动输入 */}
            <div className="space-y-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-xl p-4 md:p-6">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    💎 加值服務（可多選）
                </label>
                
                {/* 預設選項 */}
                <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">快速選擇</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {addonServicesOptions.map(option => {
                            const isSelected = (formData.addonServices || []).includes(option);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleMultiSelect('addonServices', option)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-brand-green text-white'
                                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-brand-green'
                                    }`}
                                    style={isSelected ? { backgroundColor: '#1a5f3f' } : {}}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* 已选择的加值服务 */}
                {formData.addonServices && formData.addonServices.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-600 mb-2 font-medium">已選擇的加值服務</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.addonServices.map((addon, idx) => (
                                <div key={idx} className="bg-white text-brand-green px-3 py-2 rounded-lg text-sm font-medium border-2 border-brand-green/30 flex items-center gap-2 shadow-sm" style={{ color: '#1a5f3f', borderColor: 'rgba(26, 95, 63, 0.3)' }}>
                                    {addon}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveAddon(idx); }} className="hover:text-red-500 text-base leading-none">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* 手动输入 */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={newAddon} 
                        onChange={(e) => setNewAddon(e.target.value)}
                        placeholder="手動新增，如: 毒龍+5000"
                        className="flex-1 px-4 py-3 text-sm border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green bg-white"
                        style={{ focusRingColor: '#1a5f3f' }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAddon();
                            }
                        }}
                    />
                    <button type="button" onClick={handleAddAddon} className="px-6 py-3 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors whitespace-nowrap">新增</button>
                </div>
            </div>

            {/* 上架條款確認 */}
            <div className="space-y-2 bg-yellow-50 rounded-xl p-4 md:p-6 border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="agreeListingTerms"
                        checked={agreedToListingTerms}
                        onChange={(e) => setAgreedToListingTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                        style={{ accentColor: '#1a5f3f' }}
                        required
                    />
                    <label htmlFor="agreeListingTerms" className="flex-1 text-sm text-gray-700 cursor-pointer">
                        <span className="font-semibold">我已仔細閱讀並同意</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowListingTerms(true);
                            }}
                            className="text-brand-green font-bold hover:underline ml-1"
                            style={{ color: '#1a5f3f' }}
                        >
                            《上架資料服務條款》
                        </button>
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                </div>
                <div className="text-xs text-gray-600 pl-8">
                    確認我已年滿18周歲，理解並接受所有風險和责任
                </div>
            </div>

            {/* 按钮组 - 移动端优化 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-4 z-10">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="flex-1 py-3 px-6 font-semibold text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    取消
                </button>
                <button 
                    type="submit" 
                    disabled={!agreedToListingTerms}
                    className={`flex-1 py-3 px-6 font-bold text-white rounded-xl shadow-lg transition-colors ${
                        agreedToListingTerms 
                            ? 'bg-brand-green hover:bg-opacity-90 cursor-pointer' 
                            : 'bg-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    style={agreedToListingTerms ? { backgroundColor: '#1a5f3f' } : {}}
                >
                    {agreedToListingTerms ? '確認發布' : '請先同意上架條款'}
                </button>
            </div>
        </form>
      </div>

      {/* 上架條款詳情 Modal */}
      {showListingTerms && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setShowListingTerms(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{LISTING_TERMS.title}</h3>
              <button
                onClick={() => setShowListingTerms(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p className="mb-4">在您上架資料前，請仔細閱讀以下條款：</p>
              {LISTING_TERMS.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-bold text-base mb-2 text-gray-900">{index + 1}. {section.title}</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="mt-6 pt-4 border-t border-gray-200 text-gray-700">{LISTING_TERMS.footer}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setAgreedToListingTerms(true);
                  setShowListingTerms(false);
                }}
                className="w-full py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                我已閱讀並同意
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

