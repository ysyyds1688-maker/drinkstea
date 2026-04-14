import React, { useState, useRef } from 'react';
import { reportApi } from '../services/apiService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  bookingId?: string;
  reporterRole?: 'client' | 'provider'; // 檢舉人角色
  targetRole?: 'client' | 'provider'; // 被檢舉人角色
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  bookingId,
  reporterRole = 'provider', // 默認為佳麗檢舉茶客
  targetRole = 'client',
  onSuccess,
}) => {
  // 根據檢舉人角色確定可用的檢舉類型
  const providerReportTypes = ['solicitation', 'scam', 'harassment', 'no_show', 'other'] as const;
  const clientReportTypes = ['not_real_person', 'scam', 'service_mismatch', 'fake_profile', 'harassment', 'other'] as const;
  
  const availableReportTypes = reporterRole === 'provider' ? providerReportTypes : clientReportTypes;
  
  const [reportType, setReportType] = useState<string>(availableReportTypes[0]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [dialogueHistory, setDialogueHistory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportTypeLabels: Record<string, string> = {
    // 佳麗檢舉茶客
    solicitation: '招攬客人',
    scam: '詐騙',
    harassment: '騷擾',
    no_show: '失約',
    // 茶客檢舉佳麗
    not_real_person: '非本人',
    service_mismatch: '服務不符',
    fake_profile: '假檔案',
    // 共用
    other: '其他',
  };

  // 圖片壓縮函數
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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
        img.onerror = reject;
      };
      reader.onerror = reject;
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
      setAttachments(prev => [...prev, ...compressed]);
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

  // 移除圖片
  const handleRemoveImage = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('請填寫檢舉原因');
      return;
    }

    if (!description.trim()) {
      setError('請填寫詳細描述');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportApi.create({
        targetUserId,
        bookingId,
        reportType,
        reason: reason.trim(),
        description: description.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        dialogueHistory: dialogueHistory.trim() || undefined,
      });

      alert('檢舉記錄已提交，管理員將盡快處理。');
      // 重置表單
      setReason('');
      setDescription('');
      setAttachments([]);
      setDialogueHistory('');
      setReportType(availableReportTypes[0]);
      setIsDragging(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || '提交檢舉失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-black text-brand-black">
            {reporterRole === 'provider' ? '檢舉茶客' : '檢舉佳麗'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* 檢舉類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              檢舉類型 <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            >
              {availableReportTypes.map((value) => (
                <option key={value} value={value}>
                  {reportTypeLabels[value]}
                </option>
              ))}
            </select>
          </div>

          {/* 檢舉原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              檢舉原因 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請簡要說明檢舉原因"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              required
            />
          </div>

          {/* 詳細描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              詳細描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="請詳細描述事件經過，包括時間、地點、具體行為等"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent resize-none"
              required
            />
          </div>

          {/* 對話記錄 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              互動對話記錄（選填）
            </label>
            <textarea
              value={dialogueHistory}
              onChange={(e) => setDialogueHistory(e.target.value)}
              placeholder="請貼上相關的對話記錄（如 LINE、簡訊等）"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent resize-none"
            />
          </div>

          {/* 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              圖片證據（選填）
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragging 
                  ? 'border-brand-green bg-green-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="report-image-upload"
              />
              <label htmlFor="report-image-upload" className="cursor-pointer">
                <div className="text-3xl mb-2">{isCompressing ? '⏳' : '📤'}</div>
                <p className="text-sm text-gray-600 mb-1">
                  {isCompressing ? '圖片處理中...' : '拖曳圖片到這裡或點擊上傳'}
                </p>
                <p className="text-xs text-gray-500">支持 JPG、PNG 格式，最多 5 張</p>
              </label>
            </div>

            {/* 已上傳的圖片預覽 */}
            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {attachments.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`證據 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交檢舉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


