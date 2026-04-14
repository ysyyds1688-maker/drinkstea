import React, { useState } from 'react';
import { Article } from '../types';

interface AdminArticleEditorProps {
  onSave: (article: Article) => void;
  onCancel: () => void;
}

export const AdminArticleEditor: React.FC<AdminArticleEditorProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    summary: '',
    tag: '外送茶',
    imageUrl: '',
    content: '',
    views: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl || !formData.summary) {
        alert("請輸入標題、摘要並上傳圖片");
        return;
    }

    const newArticle: Article = {
        id: Date.now().toString(),
        ...formData as Article,
        views: Math.floor(Math.random() * 50000) // Random views for demo
    };
    onSave(newArticle);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-serif font-black text-brand-black mb-6 border-b pb-2">發布新文章 (後台管理)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Upload - Enhanced UI */}
        <div className="space-y-2">
            <label className="block font-bold text-gray-700 text-sm tracking-wide">封面圖片</label>
            <div className="flex items-start gap-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                {/* Preview Box */}
                <div className="w-32 h-20 bg-white rounded overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 relative">
                    {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                           <span className="text-xs">No Image</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-3">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-yellow file:text-white hover:file:bg-brand-black transition-colors cursor-pointer"
                    />
                    
                    <input 
                        type="text" 
                        name="imageUrl"
                        value={formData.imageUrl} 
                        onChange={handleInputChange}
                        placeholder="或貼上圖片網址 (https://...)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow outline-none"
                    />
                </div>
            </div>
        </div>

        <div>
            <label className="block font-bold text-gray-700 mb-1 text-sm">文章標題</label>
            <input required name="title" value={formData.title} onChange={handleInputChange} type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-yellow outline-none text-sm" placeholder="例如: 2025 喝茶攻略" />
        </div>

        <div>
            <label className="block font-bold text-gray-700 mb-1 text-sm">文章分類 (Tag)</label>
            <select name="tag" value={formData.tag} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                <option value="外送茶">外送茶</option>
                <option value="定點茶">定點茶</option>
                <option value="新手必看">新手必看</option>
                <option value="防雷專區">防雷專區</option>
                <option value="老司機心得">老司機心得</option>
            </select>
        </div>

        <div>
            <label className="block font-bold text-gray-700 mb-1 text-sm">文章摘要 (顯示在列表)</label>
            <textarea required name="summary" value={formData.summary} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-yellow outline-none text-sm" placeholder="簡短描述文章內容..." />
        </div>

        <div>
            <label className="block font-bold text-gray-700 mb-1 text-sm">發布日期</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="flex-1 py-3 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
            <button type="submit" className="flex-1 py-3 text-white font-bold bg-brand-yellow rounded-lg shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all">確認發布</button>
        </div>

      </form>
    </div>
  );
};