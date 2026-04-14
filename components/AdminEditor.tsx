import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { parseProfileFromText } from '../services/geminiService';
import { uploadApi } from '../services/apiService';

interface AdminEditorProps {
  initialData?: Profile | null;
  allProfiles: Profile[];
  onSave: (profile: Profile) => void;
  onCancel: () => void;
}

const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600'
];

export const AdminEditor: React.FC<AdminEditorProps> = ({ initialData, allProfiles, onSave, onCancel }) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showExport, setShowExport] = useState(false);

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
    basicServices: ['聊天', '按摩'],
    addonServices: [],
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

  useEffect(() => {
    if (initialData) {
        setFormData({ ...initialData });
    }
  }, [initialData]);

  const handleAutoParse = async () => {
    if (!rawText.trim() || isParsing) return;
    setIsParsing(true);
    try {
        const extractedData = await parseProfileFromText(rawText);
        setFormData(prev => ({
            ...prev,
            ...extractedData
        }));
    } catch (e: any) {
        alert(e.message);
    } finally {
        setTimeout(() => setIsParsing(false), 500);
    }
  };

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
    if (!formData.name || !formData.imageUrl) return alert("請填寫姓名並上傳照片");
    onSave({
        id: initialData?.id || Date.now().toString(),
        ...formData as Profile
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-serif font-black text-brand-black mb-8 border-b pb-4">
            {initialData ? '✏️ 編輯佳麗' : '⚡ 快速上架'}
        </h2>

        {!initialData && (
            <div className="mb-10 space-y-3">
                <label className="text-sm font-bold text-gray-600 block">🤖 AI 智慧填單 (貼上 Line 文案)</label>
                <div className="flex gap-2">
                    <textarea 
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="flex-1 h-24 p-3 text-sm border rounded-xl focus:ring-2 focus:ring-brand-yellow outline-none"
                        placeholder="在此貼上廣告文案..."
                    />
                    <button 
                        type="button"
                        onClick={handleAutoParse}
                        disabled={isParsing || !rawText.trim()}
                        className="bg-brand-yellow text-brand-black font-black px-6 rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-all min-w-[80px]"
                    >
                        {isParsing ? '解析中' : '解析'}
                    </button>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 照片區塊 */}
            <div className="space-y-4">
                <label className="text-sm font-bold text-gray-600 block">📸 照片管理 (第一張為封面)</label>
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
                    className={`border-4 border-dashed rounded-2xl p-10 text-center transition-all ${isDragging ? 'border-brand-yellow bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}
                >
                    <input type="file" multiple accept="image/*" onChange={(e) => processFiles(e.target.files)} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-4xl mb-4">{isCompressing ? '⏳' : '📤'}</div>
                        <p className="font-bold text-gray-500">拖曳或點擊上傳</p>
                    </label>
                </div>
                
                {formData.gallery && formData.gallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                        {formData.gallery.map((img, i) => (
                            <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group transition-all ${formData.imageUrl === img ? 'border-brand-yellow scale-105 z-10' : 'border-gray-100'}`} onClick={() => setFormData(p => ({...p, imageUrl: img}))}>
                                <img src={img} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                
                                {/* 刪除按鈕 - 提高 z-index 並阻止事件冒泡 */}
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
                                    <div className="absolute inset-x-0 bottom-0 bg-brand-yellow/90 text-white text-[10px] font-black py-1 text-center">當前封面</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">姓名</label>
                    <input required name="name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} className="w-full p-3 border rounded-xl" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">價格 (NT$)</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData(p => ({...p, price: Number(e.target.value)}))} className="w-full p-3 border rounded-xl" />
                </div>
            </div>

            {/* 新增：地區與行政區 */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">城市</label>
                    <input value={formData.location} onChange={(e) => setFormData(p => ({...p, location: e.target.value}))} className="w-full p-3 border rounded-xl" placeholder="如：台北市" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">行政區 / 地標</label>
                    <input value={formData.district} onChange={(e) => setFormData(p => ({...p, district: e.target.value}))} className="w-full p-3 border rounded-xl" placeholder="如：大安區、中正區" />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {['age', 'height', 'weight', 'cup'].map((key) => (
                    <div key={key} className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 capitalize">{key}</label>
                        <input value={(formData as any)[key]} onChange={(e) => setFormData(p => ({...p, [key]: e.target.value}))} className="w-full p-3 border rounded-xl" />
                    </div>
                ))}
            </div>

            {/* 加值服務區塊 */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                    💎 加值服務 (AI 自動提取)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {formData.addonServices?.map((addon, idx) => (
                        <div key={idx} className="bg-brand-yellow/10 text-brand-yellow px-3 py-1.5 rounded-full text-xs font-bold border border-brand-yellow/20 flex items-center gap-2">
                            {addon}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveAddon(idx); }} className="hover:text-red-500">✕</button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newAddon} 
                        onChange={(e) => setNewAddon(e.target.value)}
                        placeholder="手動新增，如: 毒龍+5000"
                        className="flex-1 p-3 text-sm border rounded-xl outline-none focus:ring-1 focus:ring-brand-yellow"
                    />
                    <button type="button" onClick={handleAddAddon} className="bg-gray-100 px-6 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">新增</button>
                </div>
            </div>

            <div className="flex gap-4 pt-8">
                <button type="button" onClick={onCancel} className="flex-1 py-4 font-bold text-gray-400 border rounded-2xl">取消</button>
                <button type="submit" className="flex-1 py-4 font-black text-brand-black bg-brand-yellow rounded-2xl shadow-xl shadow-yellow-200">確認發布</button>
            </div>
        </form>
      </div>
    </div>
  );
};
