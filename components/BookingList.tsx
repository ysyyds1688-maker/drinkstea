import React, { useState, useEffect, useRef } from 'react';
import { Booking, Profile, User } from '../types';
import { bookingApi, profilesApi, authApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { ReviewModal } from './ReviewModal';
import { ClientReviewModal } from './ClientReviewModal';
import { ReportModal } from './ReportModal';

interface BookingListProps {
  userRole: 'client' | 'provider';
  onUserClick?: (userId: string) => void; // 點擊用戶頭像時的回調
}

export const BookingList: React.FC<BookingListProps> = ({ userRole, onUserClick }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [clients, setClients] = useState<Record<string, User>>({}); // 存儲茶客資訊（供佳麗查看）
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<Record<string, boolean>>({});
  const [showReportModal, setShowReportModal] = useState<Record<string, boolean>>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCancelWarningModal, setShowCancelWarningModal] = useState<{ bookingId: string; currentCount: number; violationLevel: number } | null>(null);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showProviderCancelModal, setShowProviderCancelModal] = useState<{ bookingId: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const bookingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadBookings();
    
    // 檢查是否首次訪問品茶紀錄頁面
    const storageKey = `booking_list_first_visit_${userRole}_${user?.id || 'guest'}`;
    const hasVisited = localStorage.getItem(storageKey);
    if (!hasVisited && user) {
      setShowFirstTimeModal(true);
    }
    
    // 監聽顯示幫助彈窗的事件
    const handleShowHelp = () => {
      setShowHelpModal(true);
    };
    
    // 監聽高亮預約的事件（從通知跳轉時使用）
    const handleHighlightBooking = (event: CustomEvent) => {
      const { bookingId } = event.detail || {};
      if (bookingId) {
        setHighlightedBookingId(bookingId);
        // 延遲滾動，確保品茶紀錄已經渲染
        setTimeout(() => {
          const bookingElement = bookingRefs.current[bookingId];
          if (bookingElement) {
            bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 3秒後移除高亮
            setTimeout(() => {
              setHighlightedBookingId(null);
            }, 3000);
          }
        }, 500);
      }
    };
    
    // 監聽 email 驗證完成事件（確保驗證狀態更新後立即響應）
    const handleEmailVerified = () => {
      // 組件會自動重新渲染（因為 user 狀態更新），這裡不需要額外操作
    };
    
    window.addEventListener('show-booking-help', handleShowHelp);
    window.addEventListener('highlight-booking', handleHighlightBooking as EventListener);
    window.addEventListener('user-email-verified', handleEmailVerified);
    
    return () => {
      window.removeEventListener('show-booking-help', handleShowHelp);
      window.removeEventListener('highlight-booking', handleHighlightBooking as EventListener);
      window.removeEventListener('user-email-verified', handleEmailVerified);
    };
  }, [user?.id, userRole]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('[BookingList] 開始載入品茶紀錄，用戶角色:', userRole);
      const bookingsData = await bookingApi.getMy();
      console.log('[BookingList] 獲取到品茶紀錄:', bookingsData.length, '筆', bookingsData);
      setBookings(bookingsData);

      if (userRole === 'provider') {
        // 佳麗查看：載入茶客資訊
        const clientIds = [...new Set(bookingsData.map(b => b.clientId))];
        const clientPromises = clientIds.map(id => authApi.getUserProfile(id).catch(() => null));
        const clientResults = await Promise.all(clientPromises);
        
        const clientsMap: Record<string, User> = {};
        clientResults.forEach((client, index) => {
          if (client) {
            clientsMap[clientIds[index]] = client;
          }
        });
        setClients(clientsMap);
      } else {
        // 茶客或管理員查看：載入佳麗檔案資訊
        // admin 角色也應該載入 profile 資訊
        // 茶客查看：載入佳麗檔案資訊
        const profileIds = [...new Set(bookingsData.map(b => b.profileId))];
        console.log('[BookingList] 開始載入 profiles:', profileIds);
        
        const profilePromises = profileIds.map(async (id) => {
          try {
            const profile = await profilesApi.getById(id);
            console.log(`[BookingList] 成功載入 profile ${id}:`, profile?.name || '無名稱');
            return profile;
          } catch (error: any) {
            console.error(`[BookingList] 載入 profile ${id} 失敗:`, {
              error: error.message,
              status: error.status,
              profileId: id,
              bookingIds: bookingsData.filter(b => b.profileId === id).map(b => b.id)
            });
            return null;
          }
        });
        
        const profileResults = await Promise.all(profilePromises);
        
        const profilesMap: Record<string, Profile> = {};
        profileResults.forEach((profile, index) => {
          if (profile) {
            profilesMap[profile.id] = profile;
          } else {
            // 如果載入失敗，記錄日誌以便調試
            console.warn(`[BookingList] 無法載入 profile: ${profileIds[index]}`, {
              profileId: profileIds[index],
              bookingCount: bookingsData.filter(b => b.profileId === profileIds[index]).length
            });
          }
        });
        
        console.log('[BookingList] 載入完成，成功:', Object.keys(profilesMap).length, '失敗:', profileIds.length - Object.keys(profilesMap).length);
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('加载预约记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status'], cancellationReason?: string) => {
    try {
      await bookingApi.updateStatus(bookingId, newStatus, cancellationReason);
      await loadBookings();
      
      // 發送事件通知，讓預約日曆和通知系統自動刷新
      window.dispatchEvent(new CustomEvent('booking-status-changed', {
        detail: {
          bookingId,
          newStatus
        }
      }));
      // 同時觸發通知刷新事件
      window.dispatchEvent(new CustomEvent('booking-updated'));
      
      alert('狀態更新成功');
    } catch (error: any) {
      alert('狀態更新失敗: ' + (error.message || '未知錯誤'));
    }
  };

  const handleProviderCancel = async () => {
    if (!showProviderCancelModal) return;
    
    if (!cancellationReason || cancellationReason.trim().length < 5) {
      alert('請填寫取消原因（至少5個字元）');
      return;
    }
    
    if (!confirm('確定要取消此預約嗎？取消後將發送訊息通知茶客。')) {
      return;
    }
    
    try {
      await handleStatusUpdate(showProviderCancelModal.bookingId, 'cancelled', cancellationReason.trim());
      setShowProviderCancelModal(null);
      setCancellationReason('');
    } catch (error: any) {
      alert('取消預約失敗: ' + (error.message || '未知錯誤'));
    }
  };

  const handleFirstTimeAgree = () => {
    if (hasAgreed && user) {
      const storageKey = `booking_list_first_visit_${userRole}_${user.id}`;
      localStorage.setItem(storageKey, 'true');
      setShowFirstTimeModal(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    // 如果是茶客，先檢查違規記錄並顯示警告
    if (userRole === 'client' && user) {
      const currentCount = user.bookingCancellationCount || 0;
      const violationLevel = user.violationLevel || 0;
      const nextCount = currentCount + 1;
      
      // 計算如果取消會達到的後果
      let willFreeze = false;
      let freezeDuration = '';
      let willMarkBadge = false;
      let willPermanentBan = false;
      
      if (nextCount >= 3) {
        willFreeze = true;
        if (nextCount >= 10) {
          willPermanentBan = true;
          freezeDuration = '永久凍結';
        } else if (nextCount >= 9 && violationLevel >= 2) {
          freezeDuration = '1年';
        } else if (nextCount >= 6 && violationLevel >= 1) {
          freezeDuration = '6個月';
          willMarkBadge = true;
        } else {
          freezeDuration = '1個月';
        }
      }
      
      // 顯示警告通知
      setShowCancelWarningModal({
        bookingId,
        currentCount,
        violationLevel
      });
      return;
    }
    
    // 佳麗或其他角色直接確認取消
    if (!confirm('確定要取消此預約嗎？取消後將無法恢復。')) {
      return;
    }

    await executeCancelBooking(bookingId);
  };

  const executeCancelBooking = async (bookingId: string) => {
    try {
      // 使用 updateStatus 將預約狀態改為 cancelled，而不是直接刪除
      await bookingApi.updateStatus(bookingId, 'cancelled');
      await loadBookings();
      
      // 發送事件通知，讓預約日曆自動刷新
      window.dispatchEvent(new CustomEvent('booking-status-changed', {
        detail: {
          bookingId,
          newStatus: 'cancelled'
        }
      }));
      
      alert('預約已取消');
      setShowCancelWarningModal(null);
    } catch (error: any) {
      alert('取消預約失敗: ' + (error.message || '未知錯誤'));
      setShowCancelWarningModal(null);
    }
  };

  const handleReviewSubmit = async (bookingId: string) => {
    try {
      // 注意：ClientReviewModal 和 ReviewModal 已經在內部調用了 updateReviewStatus
      // 這裡需要重新載入預約列表來更新 UI
      // 新增小延遲確保後端更新完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 重新載入預約列表
      const updatedBookings = await bookingApi.getMy();
      setBookings(updatedBookings);
      
      // 如果是佳麗，重新載入茶客資訊
      if (userRole === 'provider') {
        const clientIds = [...new Set(updatedBookings.map(b => b.clientId))];
        const clientPromises = clientIds.map(id => authApi.getUserProfile(id).catch(() => null));
        const clientResults = await Promise.all(clientPromises);
        
        const clientsMap: Record<string, User> = {};
        clientResults.forEach((client, index) => {
          if (client) {
            clientsMap[clientIds[index]] = client;
          }
        });
        setClients(clientsMap);
      } else {
        // 茶客查看：重新載入佳麗檔案資訊
        const profileIds = [...new Set(updatedBookings.map(b => b.profileId))];
        const profilePromises = profileIds.map(id => 
          profilesApi.getById(id).catch(error => {
            console.error(`載入 profile ${id} 失敗:`, error);
            return null;
          })
        );
        const profileResults = await Promise.all(profilePromises);
        
        const profilesMap: Record<string, Profile> = {};
        profileResults.forEach((profile, index) => {
          if (profile) {
            profilesMap[profile.id] = profile;
          } else {
            // 如果載入失敗，記錄日誌以便調試
            console.warn(`無法載入 profile: ${profileIds[index]}`);
          }
        });
        setProfiles(profilesMap);
      }
      
      setShowReviewModal(prev => ({ ...prev, [bookingId]: false }));
    } catch (error: any) {
      console.error('更新評論狀態失敗:', error);
      // 即使失敗也重新載入並關閉 modal
      try {
        await loadBookings();
      } catch (loadError) {
        console.error('重新載入預約列表失敗:', loadError);
      }
      setShowReviewModal(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusLabel = (status: Booking['status']): string => {
    const labels: Record<Booking['status'], string> = {
      pending: '預約中',
      accepted: '預約成功',
      rejected: '已拒絕',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  };

  // 將服務類型轉換為中文
  const getServiceTypeLabel = (serviceType?: string): string => {
    if (!serviceType) return '';
    const serviceTypeMap: Record<string, string> = {
      'oneShot': '一節',
      'twoShot': '兩節',
      'threeShot': '三節',
      'overnight': '過夜',
      'dating': '約會',
      'escort': '伴遊',
    };
    return serviceTypeMap[serviceType] || serviceType;
  };

  const getStatusColor = (status: Booking['status']): string => {
    const colors: Record<Booking['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const formatDateTime = (date: string, time: string) => {
    // 檢查日期和時間是否存在
    if (!date || !time) {
      return '日期時間未設定';
    }
    
    try {
      // 確保日期格式為 YYYY-MM-DD
      // 如果日期已經是正確格式，直接使用；否則嘗試解析
      let formattedDate = date;
      
      // 如果日期包含其他字符，嘗試提取 YYYY-MM-DD 格式
      const dateMatch = date.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        formattedDate = dateMatch[1];
      } else {
        // 嘗試解析日期並格式化為 YYYY-MM-DD
        const d = new Date(date + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
      
      // 確保時間格式為 HH:MM:SS
      let formattedTime = time;
      const timeMatch = time.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        formattedTime = timeMatch[1];
      } else if (time.match(/\d{2}:\d{2}/)) {
        // 如果只有 HH:MM，補上 :00
        formattedTime = time + ':00';
      }
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      // 如果格式化失敗，嘗試提取基本格式
      const dateMatch = date.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = time.match(/(\d{2}:\d{2}:\d{2})/);
      if (dateMatch && timeMatch) {
        return `${dateMatch[1]} ${timeMatch[1]}`;
      }
      return `${date} ${time}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (bookings.length === 0) {
    // 只對茶客顯示預約說明
    if (userRole === 'client') {
      return (
        <div className="space-y-6 py-8">
          {/* 藍色提示框 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>預約前請先看說明：</strong>請詳細閱讀預約規則和操作說明，避免違規導致帳號被凍結。
            </p>
          </div>

          {/* 如何預約特選魚市 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              如何預約特選魚市
            </h3>
            
            <div className="space-y-4">
              {/* 步驟說明 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-semibold text-gray-900">完成 Email 驗證</p>
                    <p className="text-sm text-gray-600 mt-1">預約特選魚市和嚴選好茶前，必須先完成 Email 驗證。請前往「個人資料」頁面完成驗證。</p>
                    {!user?.emailVerified && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ 您尚未完成 Email 驗證，請先完成驗證後才能預約。
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">瀏覽特選魚市</p>
                    <p className="text-sm text-gray-600 mt-1">在首頁或「特選魚市」頁面瀏覽可預約的佳麗資料，查看服務內容、價格和評價。</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-semibold text-gray-900">選擇日期和時間</p>
                    <p className="text-sm text-gray-600 mt-1">點擊「立即預約」按鈕，在行事曆中選擇可預約的日期，然後選擇合適的時間段。</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <p className="font-semibold text-gray-900">選擇服務類型</p>
                    <p className="text-sm text-gray-600 mt-1">選擇您需要的服務類型（一節、兩節、過夜等），並填寫預約備註（可選）。</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                  <div>
                    <p className="font-semibold text-gray-900">提交預約請求</p>
                    <p className="text-sm text-gray-600 mt-1">確認預約資訊無誤後提交，系統會發送通知給佳麗。佳麗會在 24 小時內回覆您的預約請求。</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
                  <div>
                    <p className="font-semibold text-gray-900">等待確認</p>
                    <p className="text-sm text-gray-600 mt-1">預約狀態為「預約中」時，請耐心等待佳麗在「訊息收件箱」中確認。確認後您會收到通知，並可在「我的訊息」中查看佳麗的聯絡方式。</p>
                  </div>
                </div>
              </div>

              {/* 預約規則 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  預約規則與限制
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-red-800 mb-2">📅 每日預約限制</p>
                    <p className="text-red-700">同一天最多只能預約 <strong>2 個時段</strong>（防止系統濫用）</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-red-800 mb-2">📆 每週預約限制</p>
                    <p className="text-red-700">一週（週一到週日）最多只能預約 <strong>10 個時段</strong></p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-red-800 mb-2">⏰ 重複預約限制</p>
                    <p className="text-red-700">與同一位佳麗在 <strong>24 小時內</strong>只能有一個有效預約（pending、accepted 或 completed 狀態）</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-red-800 mb-2">✅ 驗證要求</p>
                    <p className="text-red-700">預約特選魚市和嚴選好茶前，必須完成 <strong>Email 驗證</strong></p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-red-800 mb-2">🚫 無法預約的情況</p>
                    <ul className="text-red-700 space-y-1 ml-4 list-disc">
                      <li>帳號被凍結（失信茶客、失約茶客）</li>
                      <li>該佳麗帳號被凍結或永久除名</li>
                      <li>該時間段已被其他茶客預約</li>
                      <li>超過每日或每週預約限制</li>
                      <li>與同一位佳麗在 24 小時內已有有效預約</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 重要提醒 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  重要提醒
                </h4>
                <ul className="text-sm text-yellow-800 space-y-2 ml-4 list-disc">
                  <li>請仔細閱讀預約規則，避免違規導致帳號被凍結</li>
                  <li>取消預約和失約會累計違規次數，請謹慎操作</li>
                  <li>預約成功後請準時赴約，失約會導致帳號被標記為「失約茶客」</li>
                  <li>完成服務後請給予真實評價，幫助其他茶客參考</li>
                  <li>與佳麗的聯絡資訊與後續溝通，請統一透過「我的訊息」完成</li>
                  <li>如有問題，可使用「檢舉佳麗」功能回報</li>
                </ul>
              </div>

              {/* 開始預約按鈕 */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  點擊下方按鈕前往「特選魚市」頁面瀏覽可預約的佳麗資料
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 導航到特選魚市頁面
                    // 如果當前在用戶檔案頁面，需要先返回首頁再導航
                    if (window.location.pathname.includes('user-profile') || window.location.hash.includes('user-profile')) {
                      // 先導航到首頁
                      window.location.href = '/';
                      // 等待頁面載入後再導航到特選魚市
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'PROVIDER_LISTING' } }));
                      }, 100);
                    } else {
                      // 直接導航到特選魚市
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'PROVIDER_LISTING' } }));
                    }
                  }}
                  className="px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg cursor-pointer"
                  type="button"
                  style={{ backgroundColor: '#1a5f3f' }}
                >
                  前往特選魚市開始預約
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 佳麗的空狀態顯示
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">還沒有品茶紀錄</p>
        <p className="text-sm text-gray-400 mt-2">當有茶客預約您的服務時，品茶紀錄會顯示在這裡</p>
      </div>
    );
  }

  return (
    <>
      {/* 首次訪問說明彈窗 */}
      {showFirstTimeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            // 點擊背景不關閉，必須勾選同意才能關閉
            e.stopPropagation();
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-serif font-black text-brand-black">
                {userRole === 'client' ? '品茶紀錄說明（茶客必讀）' : '品茶紀錄說明（佳麗必讀）'}
              </h2>
              <button
                onClick={() => {
                  // 未勾選同意時不能關閉
                  if (hasAgreed) {
                    handleFirstTimeAgree();
                  }
                }}
                className={`text-gray-400 hover:text-gray-600 transition-colors ${!hasAgreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!hasAgreed}
                title={!hasAgreed ? '請先勾選同意' : '關閉'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* 顯示完整的說明內容（與 showHelpModal 相同的內容） */}
              <div className="space-y-6">
                {/* 根據用戶角色優先顯示對應的凍結規則 */}
                {/* 茶客用戶：優先顯示「預約凍結規則（茶客必讀）」 */}
                {userRole === 'client' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      預約凍結規則（茶客必讀）
                    </h4>
                    <div className="space-y-4">
                      {/* 取消預約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                            <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 失約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯（總計5次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 重要提醒 */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                          <li>取消預約和失約分開計算，互不影響</li>
                          <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                          <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                          <li>自動解凍前 3 天會收到提醒通知</li>
                          <li>解凍後請遵守預約規則，避免再次被凍結</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 佳麗用戶：優先顯示「佳麗凍結規則（佳麗必讀）」 */}
                {userRole === 'provider' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      佳麗凍結規則（佳麗必讀）
                    </h4>
                    <div className="space-y-4">
                      {/* 檢舉次數規則 */}
                      <div>
                        <h5 className="font-semibold text-purple-800 mb-2">⚠️ 檢舉次數規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">初次違規（3次檢舉）：</span>
                            <span className="text-purple-600">凍結 1 個月，自動解凍</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">累犯第一次（總計6次）：</span>
                            <span className="text-purple-600">凍結 6 個月，自動解凍，帳號標記為「警示佳麗」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">累犯第二次（總計9次）：</span>
                            <span className="text-purple-600">凍結 1 年，自動解凍，持續顯示「警示佳麗」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">嚴重違規（超過12次）：</span>
                            <span className="text-purple-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 嚴重違規（立即永久凍結） */}
                      <div>
                        <h5 className="font-semibold text-purple-800 mb-2">🚫 嚴重違規（立即永久凍結）</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">3次以上「非本人」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">3次以上「詐騙」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">5次以上「假檔案」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 重要提醒 */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                          <li>檢舉次數累計計算，不同類型的檢舉都會計入總檢舉次數</li>
                          <li>凍結期間無法接受預約、更新檔案或在論壇發文</li>
                          <li>警示佳麗標記會顯示在您的公開個人頁面、個人頁面和御茶室</li>
                          <li>自動解凍前 3 天會收到提醒通知</li>
                          <li>解凍後請遵守平台規則，避免再次被凍結</li>
                          <li>如對檢舉有異議，可聯繫客服申訴</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 管理員：顯示「預約凍結規則（管理員參考）」 */}
                {userRole === 'admin' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      預約凍結規則（管理員參考）
                    </h4>
                    <div className="space-y-4">
                      {/* 取消預約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                            <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 失約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯（總計5次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 重要提醒 */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                          <li>取消預約和失約分開計算，互不影響</li>
                          <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                          <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                          <li>自動解凍前 3 天會收到提醒通知</li>
                          <li>解凍後請遵守預約規則，避免再次被凍結</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 茶客用戶：其次顯示「佳麗凍結規則（茶客參考）」 */}
                {userRole === 'client' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      佳麗凍結規則（茶客參考：了解佳麗凍結規則）
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 茶客須知：</strong>以下規則適用於佳麗。了解這些規則有助於您理解為什麼某些佳麗無法接受預約，以及如何識別有問題的佳麗。
                      </p>
                    </div>
                    <div className="space-y-4">
                      {/* 檢舉次數規則 */}
                      <div>
                        <h5 className="font-semibold text-purple-800 mb-2">⚠️ 檢舉次數規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">初次違規（3次檢舉）：</span>
                            <span className="text-purple-600">凍結 1 個月，自動解凍</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">累犯第一次（總計6次）：</span>
                            <span className="text-purple-600">凍結 6 個月，自動解凍，帳號標記為「警示佳麗」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">累犯第二次（總計9次）：</span>
                            <span className="text-purple-600">凍結 1 年，自動解凍，持續顯示「警示佳麗」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">嚴重違規（超過12次）：</span>
                            <span className="text-purple-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 嚴重違規（立即永久凍結） */}
                      <div>
                        <h5 className="font-semibold text-purple-800 mb-2">🚫 嚴重違規（立即永久凍結）</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">3次以上「非本人」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">3次以上「詐騙」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-700">5次以上「假檔案」檢舉：</span>
                            <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 重要提醒 */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                          <li>檢舉次數累計計算，不同類型的檢舉都會計入總檢舉次數</li>
                          <li>凍結期間無法接受預約、更新檔案或在論壇發文</li>
                          <li>警示佳麗標記會顯示在您的公開個人頁面、個人頁面和御茶室</li>
                          <li>自動解凍前 3 天會收到提醒通知</li>
                          <li>解凍後請遵守平台規則，避免再次被凍結</li>
                          <li>如對檢舉有異議，可聯繫客服申訴</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 佳麗用戶：其次顯示「預約凍結規則（佳麗參考）」 */}
                {userRole === 'provider' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      預約凍結規則（佳麗參考：了解茶客凍結規則）
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 佳麗須知：</strong>以下規則適用於茶客。了解這些規則有助於您理解為什麼某些茶客無法預約，以及如何識別有問題的茶客。
                      </p>
                    </div>
                    <div className="space-y-4">
                      {/* 取消預約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                            <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 失約規則 */}
                      <div>
                        <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                        <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                            <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">累犯（總計5次）：</span>
                            <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                            <span className="text-red-600">永久除名，驅逐出御茶室</span>
                          </div>
                        </div>
                      </div>

                      {/* 重要提醒 */}
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                          <li>取消預約和失約分開計算，互不影響</li>
                          <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                          <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                          <li>如果茶客帳號被凍結，您將無法接受其預約請求</li>
                          <li>您可以在茶客的個人檔案中查看其違規標記和凍結狀態</li>
                          <li>如遇問題茶客，可使用檢舉功能回報</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 查看方式說明 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    查看方式
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {userRole === 'provider' ? (
                      <>
                        <p className="text-gray-700">
                          <strong className="text-brand-green">佳麗視角：</strong>您可以看到所有向您預約的茶客資訊。
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                          <li>點擊茶客頭像可查看其個人資料</li>
                          <li>預約的確認和拒絕操作，請在「訊息收件箱」中處理</li>
                          <li>預約完成後，可在品茶紀錄中點擊「標記為已完成」按鈕</li>
                          <li>預約完成後，可對茶客進行評論</li>
                          <li>與茶客的聯絡資訊與後續溝通，請統一透過「訊息收件箱」完成</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700">
                          <strong className="text-brand-green">茶客視角：</strong>您可以看到所有您預約的佳麗資訊。
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                          <li>點擊佳麗頭像可查看其個人資料</li>
                          <li>預約完成後，可對佳麗進行評論</li>
                          <li>與佳麗的聯絡資訊與後續溝通，請統一透過「我的訊息」完成</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {/* 預約狀態說明 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    預約狀態說明
                  </h3>
                    <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">預約中</span>
                      <span className="text-gray-700">等待對方確認，若 24 小時內未確認將自動取消</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">預約成功</span>
                      <span className="text-gray-700">預約已確認，可在「我的訊息」或「訊息收件箱」中查看對方聯絡方式</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">已拒絕</span>
                      <span className="text-gray-700">對方已拒絕此次預約</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">已完成</span>
                      <span className="text-gray-700">預約已完成，可進行評論</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">已取消</span>
                      <span className="text-gray-700">預約已取消</span>
                    </div>
                  </div>
                </div>

                {/* 操作說明 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    操作說明
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {userRole === 'provider' ? (
                      <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                        <li><strong>確認/拒絕預約：</strong>請前往「訊息收件箱」，在對應的預約訊息中點擊「確認預約」或「拒絕預約」按鈕處理預約請求</li>
                        <li><strong>標記為已完成：</strong>預約成功後，在品茶紀錄中點擊「標記為已完成」按鈕標記預約已完成</li>
                        <li><strong>評論茶客：</strong>預約完成後，點擊「評論茶客」按鈕進行評分。<strong className="text-red-600">重要：只有完成評論後，該次預約才會被計入，您才能獲得經驗值和積分。</strong></li>
                        <li><strong>查看個人資料：</strong>點擊茶客頭像可查看其完整個人資料</li>
                        <li><strong>失約回報：</strong>可在預約中或預約成功時回報茶客未到場，此記錄將計入茶客的失約次數</li>
                        <li><strong>檢舉功能：</strong>如遇不當行為，可使用檢舉功能回報並上傳證據</li>
                        <li><strong>聯絡與溝通：</strong>請統一透過「訊息收件箱」進行後續聯絡與溝通</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                        <li><strong>取消預約：</strong>預約中或預約成功時，可點擊「取消預約」按鈕取消預約（注意：取消次數超過3次將收到警告）</li>
                        <li><strong>評論佳麗：</strong>預約完成後，點擊「評論佳麗」按鈕進行評分。<strong className="text-red-600">重要：只有完成評論後，該次預約才會被計入，您才能獲得經驗值和積分。</strong></li>
                        <li><strong>查看個人資料：</strong>點擊佳麗頭像可查看其完整個人資料</li>
                        <li><strong>檢舉佳麗：</strong>預約完成、取消或拒絕後，如遇問題可使用檢舉功能回報</li>
                        <li><strong>聯絡與溝通：</strong>請統一透過「我的訊息」進行後續聯絡與溝通</li>
                      </ul>
                    )}
                  </div>
                  </div>
                </div>

                {/* 雙方警示標語 */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-5 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-900 mb-3 text-lg">⚠️ 重要警示</h4>
                      <div className="space-y-3 text-sm text-red-800">
                        <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                          <p className="font-semibold mb-2">🤝 雙方尊重原則</p>
                          <p>請以尊重、禮貌的態度對待每一位用戶。任何形式的騷擾、威脅、不當言語或行為都將被嚴肅處理，違規者將面臨帳號凍結或永久除名。</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                          <p className="font-semibold mb-2">🛡️ 保護自身安全</p>
                          <p>請務必保護個人隱私和安全。建議在公共場所進行首次見面，避免在私人場所單獨見面。如遇任何可疑情況或感到不安全，請立即終止預約並使用檢舉功能回報。</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                          <p className="font-semibold mb-2">📋 遵守平台規範</p>
                          <p>請嚴格遵守平台預約規則和行為準則。違反規則將導致帳號被凍結或永久除名，請謹慎使用平台服務，珍惜您的帳號權益。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 同意確認 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                    style={{ accentColor: '#1a5f3f' }}
                  />
                  <span className="text-sm text-gray-700">
                    我已閱讀並理解上述預約規則和操作說明，同意遵守平台預約規範。
                  </span>
                </label>
              </div>

              {/* 確認按鈕 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleFirstTimeAgree}
                  disabled={!hasAgreed}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    hasAgreed
                      ? 'bg-brand-green text-white hover:bg-opacity-90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  style={hasAgreed ? { backgroundColor: '#1a5f3f' } : {}}
                >
                  我已了解並同意
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取消預約警告通知 */}
      {showCancelWarningModal && user && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowCancelWarningModal(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">取消預約警告</h3>
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">⚠️ 您的違規記錄</p>
                  <div className="space-y-2 text-sm text-red-800">
                    <div className="flex justify-between">
                      <span>目前取消次數：</span>
                      <span className="font-bold">{showCancelWarningModal.currentCount} 次</span>
                    </div>
                    <div className="flex justify-between">
                      <span>違規級別：</span>
                      <span className="font-bold">
                        {showCancelWarningModal.violationLevel === 0 ? '無違規' :
                         showCancelWarningModal.violationLevel === 1 ? '初次違規' :
                         showCancelWarningModal.violationLevel === 2 ? '累犯1' :
                         showCancelWarningModal.violationLevel === 3 ? '累犯2' :
                         '嚴重違規'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">📋 如果取消此預約</p>
                  <div className="space-y-2 text-sm text-yellow-800">
                    {(() => {
                      const nextCount = showCancelWarningModal.currentCount + 1;
                      const nextViolationLevel = showCancelWarningModal.violationLevel;
                      
                      if (nextCount >= 10) {
                        return (
                          <div className="space-y-1">
                            <p className="font-bold text-red-600">• 取消次數將達 {nextCount} 次</p>
                            <p className="font-bold text-red-600">• 將被永久凍結，驅逐出御茶室</p>
                            <p className="font-bold text-red-600">• 無法再預約嚴選好茶和特選魚市</p>
                          </div>
                        );
                      } else if (nextCount >= 9 && nextViolationLevel >= 2) {
                        return (
                          <div className="space-y-1">
                            <p className="font-bold">• 取消次數將達 {nextCount} 次</p>
                            <p className="font-bold">• 將被凍結 1 年</p>
                            <p className="font-bold">• 凍結期間無法預約</p>
                          </div>
                        );
                      } else if (nextCount >= 6 && nextViolationLevel >= 1) {
                        return (
                          <div className="space-y-1">
                            <p className="font-bold">• 取消次數將達 {nextCount} 次</p>
                            <p className="font-bold">• 將被凍結 6 個月</p>
                            <p className="font-bold">• 帳號將標記為「失信茶客」</p>
                            <p className="font-bold">• 凍結期間無法預約</p>
                          </div>
                        );
                      } else if (nextCount >= 3) {
                        return (
                          <div className="space-y-1">
                            <p className="font-bold">• 取消次數將達 {nextCount} 次</p>
                            <p className="font-bold">• 將被凍結 1 個月</p>
                            <p className="font-bold">• 凍結期間無法預約</p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-1">
                            <p className="font-bold">• 取消次數將達 {nextCount} 次</p>
                            <p className="text-gray-600">• 目前不會被凍結，但請謹慎取消</p>
                            {nextCount === 2 && (
                              <p className="text-red-600 font-bold">• 再取消 1 次將觸發凍結機制</p>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>提醒：</strong>取消預約和失約分開計算。請確認是否真的需要取消，避免影響您的預約權限。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelWarningModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  我再想想
                </button>
                <button
                  onClick={() => executeCancelBooking(showCancelWarningModal.bookingId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  確定取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 幫助說明彈窗 */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-serif font-black text-brand-black">品茶紀錄說明</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 根據用戶角色優先顯示對應的凍結規則 */}
              {/* 茶客用戶：優先顯示「預約凍結規則（茶客必讀）」 */}
              {userRole === 'client' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    預約凍結規則（茶客必讀）
                  </h4>
                  <div className="space-y-4">
                    {/* 取消預約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                          <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 失約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯（總計5次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 重要提醒 */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                      <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                        <li>取消預約和失約分開計算，互不影響</li>
                        <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                        <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                        <li>自動解凍前 3 天會收到提醒通知</li>
                        <li>解凍後請遵守預約規則，避免再次被凍結</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 佳麗用戶：優先顯示「佳麗凍結規則（佳麗必讀）」 */}
              {userRole === 'provider' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    佳麗凍結規則（佳麗必讀）
                  </h4>
                  <div className="space-y-4">
                    {/* 檢舉次數規則 */}
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-2">⚠️ 檢舉次數規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">初次違規（3次檢舉）：</span>
                          <span className="text-purple-600">凍結 1 個月，自動解凍</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">累犯第一次（總計6次）：</span>
                          <span className="text-purple-600">凍結 6 個月，自動解凍，帳號標記為「警示佳麗」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">累犯第二次（總計9次）：</span>
                          <span className="text-purple-600">凍結 1 年，自動解凍，持續顯示「警示佳麗」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">嚴重違規（超過12次）：</span>
                          <span className="text-purple-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 嚴重違規（立即永久凍結） */}
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-2">🚫 嚴重違規（立即永久凍結）</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">3次以上「非本人」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">3次以上「詐騙」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">5次以上「假檔案」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 重要提醒 */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                      <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                        <li>檢舉次數累計計算，不同類型的檢舉都會計入總檢舉次數</li>
                        <li>凍結期間無法接受預約、更新檔案或在論壇發文</li>
                        <li>警示佳麗標記會顯示在您的公開個人頁面、個人頁面和御茶室</li>
                        <li>自動解凍前 3 天會收到提醒通知</li>
                        <li>解凍後請遵守平台規則，避免再次被凍結</li>
                        <li>如對檢舉有異議，可聯繫客服申訴</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 管理員：顯示「預約凍結規則（管理員參考）」 */}
              {userRole === 'admin' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    預約凍結規則（管理員參考）
                  </h4>
                  <div className="space-y-4">
                    {/* 取消預約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                          <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 失約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯（總計5次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 重要提醒 */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                      <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                        <li>取消預約和失約分開計算，互不影響</li>
                        <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                        <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                        <li>自動解凍前 3 天會收到提醒通知</li>
                        <li>解凍後請遵守預約規則，避免再次被凍結</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 茶客用戶：其次顯示「佳麗凍結規則（茶客參考）」 */}
              {userRole === 'client' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    佳麗凍結規則（茶客參考：了解佳麗凍結規則）
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 茶客須知：</strong>以下規則適用於佳麗。了解這些規則有助於您理解為什麼某些佳麗無法接受預約，以及如何識別有問題的佳麗。
                    </p>
                  </div>
                  <div className="space-y-4">
                    {/* 檢舉次數規則 */}
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-2">⚠️ 檢舉次數規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">初次違規（3次檢舉）：</span>
                          <span className="text-purple-600">凍結 1 個月，自動解凍</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">累犯第一次（總計6次）：</span>
                          <span className="text-purple-600">凍結 6 個月，自動解凍，帳號標記為「警示佳麗」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">累犯第二次（總計9次）：</span>
                          <span className="text-purple-600">凍結 1 年，自動解凍，持續顯示「警示佳麗」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">嚴重違規（超過12次）：</span>
                          <span className="text-purple-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 嚴重違規（立即永久凍結） */}
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-2">🚫 嚴重違規（立即永久凍結）</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">3次以上「非本人」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">3次以上「詐騙」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-purple-700">5次以上「假檔案」檢舉：</span>
                          <span className="text-purple-600">立即永久凍結，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 重要提醒 */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                      <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                        <li>檢舉次數累計計算，不同類型的檢舉都會計入總檢舉次數</li>
                        <li>凍結期間無法接受預約、更新檔案或在論壇發文</li>
                        <li>警示佳麗標記會顯示在您的公開個人頁面、個人頁面和御茶室</li>
                        <li>自動解凍前 3 天會收到提醒通知</li>
                        <li>解凍後請遵守平台規則，避免再次被凍結</li>
                        <li>如對檢舉有異議，可聯繫客服申訴</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 佳麗用戶：其次顯示「預約凍結規則（佳麗參考）」 */}
              {userRole === 'provider' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    預約凍結規則（佳麗參考：了解茶客凍結規則）
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 佳麗須知：</strong>以下規則適用於茶客。了解這些規則有助於您理解為什麼某些茶客無法預約，以及如何識別有問題的茶客。
                    </p>
                  </div>
                  <div className="space-y-4">
                    {/* 取消預約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">⚠️ 取消預約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次取消）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第一次（總計6次）：</span>
                          <span className="text-red-600">凍結 6 個月，自動解凍，帳號標記為「失信茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯第二次（總計9次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失信茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過10次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 失約規則 */}
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">🚫 失約規則</h5>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">初次違規（3次失約）：</span>
                          <span className="text-red-600">凍結 1 個月，自動解凍，帳號標記為「失約茶客」</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">累犯（總計5次）：</span>
                          <span className="text-red-600">凍結 1 年，自動解凍，持續顯示「失約茶客」標記</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-red-700">嚴重違規（超過6次）：</span>
                          <span className="text-red-600">永久除名，驅逐出御茶室</span>
                        </div>
                      </div>
                    </div>

                    {/* 重要提醒 */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">📌 重要提醒：</p>
                      <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                        <li>取消預約和失約分開計算，互不影響</li>
                        <li>凍結期間無法預約嚴選好茶和特選魚市</li>
                        <li>失信茶客和失約茶客標記會顯示在茶客的公開個人頁面、個人頁面和御茶室</li>
                        <li>如果茶客帳號被凍結，您將無法接受其預約請求</li>
                        <li>您可以在茶客的個人檔案中查看其違規標記和凍結狀態</li>
                        <li>如遇問題茶客，可使用檢舉功能回報</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 查看方式說明 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  查看方式
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {userRole === 'provider' ? (
                    <>
                      <p className="text-gray-700">
                        <strong className="text-brand-green">佳麗視角：</strong>您可以看到所有向您預約的茶客資訊。
                      </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                          <li>點擊茶客頭像可查看其個人資料</li>
                          <li>預約完成後，可對茶客進行評論</li>
                          <li>與茶客的聯絡資訊與後續溝通，請統一透過「訊息收件箱」完成</li>
                        </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700">
                        <strong className="text-brand-green">茶客視角：</strong>您可以看到所有您預約的佳麗資訊。
                      </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                          <li>點擊佳麗頭像可查看其個人資料</li>
                          <li>預約完成後，可對佳麗進行評論</li>
                          <li>與佳麗的聯絡資訊與後續溝通，請統一透過「我的訊息」完成</li>
                        </ul>
                    </>
                  )}
                </div>
              </div>

              {/* 預約狀態說明 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  預約狀態說明
                </h3>
                    <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">預約中</span>
                    <span className="text-gray-700">等待對方確認，若 24 小時內未確認將自動取消</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">預約成功</span>
                    <span className="text-gray-700">預約已確認，可查看對方聯絡方式</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">已拒絕</span>
                    <span className="text-gray-700">對方已拒絕此次預約</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">已完成</span>
                    <span className="text-gray-700">預約已完成，可進行評論</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">已取消</span>
                    <span className="text-gray-700">預約已取消</span>
                  </div>
                </div>
              </div>

              {/* 操作說明 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  操作說明
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {userRole === 'provider' ? (
                    <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                      <li><strong>確認/拒絕預約：</strong>請前往「訊息收件箱」，在對應的預約訊息中點擊「確認預約」或「拒絕預約」按鈕處理預約請求</li>
                      <li><strong>標記為已完成：</strong>預約成功後，在品茶紀錄中點擊「標記為已完成」按鈕標記預約已完成</li>
                      <li><strong>回報失約：</strong>如果茶客預約後未到場，可點擊「回報失約」按鈕回報，此記錄將計入茶客的失約次數</li>
                      <li><strong>評論茶客：</strong>預約完成後，點擊「評論茶客」按鈕進行評分。<strong className="text-red-600">重要：只有完成評論後，該次預約才會被計入，您才能獲得經驗值和積分。</strong></li>
                      <li><strong>查看個人資料：</strong>點擊茶客頭像可查看其完整個人資料</li>
                      <li><strong>檢舉功能：</strong>如遇不當行為，可使用檢舉功能回報並上傳證據</li>
                      <li><strong>聯絡與溝通：</strong>請統一透過「訊息收件箱」進行後續聯絡與溝通</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                      <li><strong>取消預約：</strong>預約中或預約成功時，可點擊「取消預約」按鈕取消預約（注意：取消次數超過3次將收到警告）</li>
                      <li><strong>評論佳麗：</strong>預約完成後，點擊「評論佳麗」按鈕進行評分</li>
                      <li><strong>查看個人資料：</strong>點擊佳麗頭像可查看其完整個人資料</li>
                      <li><strong>聯絡與溝通：</strong>請統一透過「我的訊息」進行後續聯絡與溝通</li>
                    </ul>
                  )}
                </div>
              </div>

              {/* 雙方警示標語 */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-5 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-3 text-lg">⚠️ 重要警示</h4>
                    <div className="space-y-3 text-sm text-red-800">
                      <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                        <p className="font-semibold mb-2">🤝 雙方尊重原則</p>
                        <p>請以尊重、禮貌的態度對待每一位用戶。任何形式的騷擾、威脅、不當言語或行為都將被嚴肅處理，違規者將面臨帳號凍結或永久除名。</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                        <p className="font-semibold mb-2">🛡️ 保護自身安全</p>
                        <p>請務必保護個人隱私和安全。建議在公共場所進行首次見面，避免在私人場所單獨見面。如遇任何可疑情況或感到不安全，請立即終止預約並使用檢舉功能回報。</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                        <p className="font-semibold mb-2">📋 遵守平台規範</p>
                        <p>請嚴格遵守平台預約規則和行為準則。違反規則將導致帳號被凍結或永久除名，請謹慎使用平台服務，珍惜您的帳號權益。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  注意事項
                </h4>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm ml-4">
                  <li>預約狀態為「預約中」時，請等待對方確認</li>
                  <li>若 24 小時內對方未確認，預約將自動取消</li>
                  <li>只有預約成功或完成後才能查看對方聯絡方式</li>
                  <li>預約完成後，雙方都需要進行評論才能完成整個流程</li>
                  {userRole === 'provider' && (
                    <>
                      <li><strong>失約回報：</strong>可在預約中或預約成功時回報茶客未到場，此記錄將計入茶客的失約次數</li>
                      <li><strong>檢舉功能：</strong>如遇不當行為，可使用檢舉功能回報並上傳證據</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 預約前請先看說明提示 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            <strong>預約前請先看說明：</strong>請詳細閱讀預約規則和操作說明，避免違規導致帳號被凍結。
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowHelpModal(true);
          }}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
          type="button"
        >
          查看說明
        </button>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
        // 根據角色決定顯示的資訊
        // admin 角色應該作為 client 來查看品茶紀錄（顯示 profile 資訊）
        const isClientView = userRole === 'client' || userRole === 'admin';
        const profile = isClientView ? profiles[booking.profileId] : null;
        const client = userRole === 'provider' ? clients[booking.clientId] : null;
        
        // 調試：檢查 profile 是否載入
        if (isClientView && !profile && booking.profileId) {
          console.warn('[BookingList] Profile 未載入:', {
            profileId: booking.profileId,
            availableProfiles: Object.keys(profiles),
            bookingId: booking.id,
            userRole: userRole
          });
        }
        
        const displayName = userRole === 'provider' 
          ? (client?.userName || client?.email || client?.phoneNumber || '未知茶客')
          : (profile?.name || `未知佳麗 (ID: ${booking.profileId?.substring(0, 20) || 'N/A'})`);
        
        const displayImage = userRole === 'provider'
          ? (client?.avatarUrl || '/images/default-avatar.svg')
          : (profile?.imageUrl || '/images/default-avatar.svg');
        
        const isPending = booking.status === 'pending';
        const isAccepted = booking.status === 'accepted';
        const isCompleted = booking.status === 'completed';
        const isCancelled = booking.status === 'cancelled';
        const canReportNoShow = userRole === 'provider' && (isPending || isAccepted) && !booking.noShow;
        const contactInfo = userRole === 'client' 
          ? selectedBooking?.providerContactInfo 
          : selectedBooking?.clientContactInfo;

        const isHighlighted = highlightedBookingId === booking.id;

        return (
          <div
            key={booking.id}
            ref={(el) => {
              if (el) {
                bookingRefs.current[booking.id] = el;
              }
            }}
            className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
              isHighlighted 
                ? 'border-brand-green border-4 ring-4 ring-brand-green ring-opacity-30' 
                : 'border-gray-200'
            }`}
            style={isHighlighted ? { 
              borderColor: '#1a5f3f',
              boxShadow: '0 0 0 4px rgba(26, 95, 63, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)'
            } : {}}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* 左侧：预约信息 */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      if (onUserClick) {
                        const userId = userRole === 'provider' ? booking.clientId : (profile?.userId || null);
                        if (userId && userId.trim() !== '') {
                          onUserClick(userId);
                        }
                      }
                    }}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={displayImage}
                      alt={displayName}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.svg';
                      }}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {displayName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                        {booking.noShow && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">失約</span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>預約時間：{formatDateTime(booking.bookingDate, booking.bookingTime)}</p>
                      {booking.location && <p>地點：{booking.location}</p>}
                      {booking.serviceType && <p>服務類型：{getServiceTypeLabel(booking.serviceType)}</p>}
                      {booking.notes && <p>備註：{booking.notes}</p>}
                      {/* 顯示佳麗的預約流程（僅茶客視角） */}
                      {userRole === 'client' && profile?.bookingProcess && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            預約流程
                          </p>
                          <p className="text-xs text-blue-800 whitespace-pre-wrap">{profile.bookingProcess}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        創建時間：{new Date(booking.createdAt).toLocaleString('zh-TW', { 
                          timeZone: 'Asia/Taipei',
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex flex-col gap-2 md:w-48" style={{ zIndex: 10, position: 'relative' }}>
                {/* 狀態操作按鈕 */}
                {/* 佳麗的確認/拒絕預約按鈕已移除，統一在訊息收件箱中處理 */}
                
                {userRole === 'provider' && isAccepted && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStatusUpdate(booking.id, 'completed');
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      type="button"
                    >
                      標記為已完成
                    </button>
                    {/* 佳麗取消預約按鈕 */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowProviderCancelModal({ bookingId: booking.id });
                        setCancellationReason('');
                      }}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      type="button"
                    >
                      取消預約
                    </button>
                  </>
                )}
                
                {/* 佳麗在預約中狀態也可以取消 */}
                {userRole === 'provider' && booking.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProviderCancelModal({ bookingId: booking.id });
                      setCancellationReason('');
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    type="button"
                  >
                    取消預約
                  </button>
                )}

                {/* 佳麗回報失約按鈕（預約中或預約成功時可回報） */}
                {canReportNoShow && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReportNoShow(booking.id);
                    }}
                    className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                    type="button"
                  >
                    回報失約
                  </button>
                )}

                {/* 佳麗檢舉按鈕（任何狀態都可以檢舉） */}
                {userRole === 'provider' && client && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowReportModal({ ...showReportModal, [booking.id]: true });
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    type="button"
                  >
                    檢舉茶客
                  </button>
                )}

                {/* 茶客檢舉佳麗按鈕（預約完成、取消或拒絕後可檢舉） */}
                {userRole === 'client' && booking.providerId && (isCompleted || isCancelled || booking.status === 'rejected') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowReportModal({ ...showReportModal, [booking.id]: true });
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    type="button"
                  >
                    檢舉佳麗
                  </button>
                )}

                {/* 茶客取消預約按鈕（預約中或預約成功時可取消） */}
                {userRole !== 'provider' && (isPending || isAccepted) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancelBooking(booking.id);
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    type="button"
                  >
                    取消預約
                  </button>
                )}

                {/* 評論按鈕（預約完成後顯示） */}
                {isCompleted && (
                  <div className="space-y-2">
                    {userRole === 'client' && (
                      <>
                        <p className="text-xs text-gray-500 mb-1">
                          評論狀態：{booking.clientReviewed ? '✓ 已評論' : '✗ 未評論'}
                        </p>
                        {booking.profileId && (
                          booking.clientReviewed ? (
                            <button
                              disabled
                              className="w-full px-4 py-2 text-sm bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                            >
                              已完成評論
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowReviewModal({ ...showReviewModal, [booking.id]: true });
                              }}
                              className="w-full px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
                              type="button"
                            >
                              評論佳麗
                            </button>
                          )
                        )}
                      </>
                    )}
                    {userRole === 'provider' && (
                      <>
                        <p className="text-xs text-gray-500 mb-1">
                          評論狀態：{booking.providerReviewed ? '✓ 已評論' : '✗ 未評論'}
                        </p>
                        {client && (
                          booking.providerReviewed ? (
                            <button
                              disabled
                              className="w-full px-4 py-2 text-sm bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                              type="button"
                            >
                              已完成評論
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowReviewModal({ ...showReviewModal, [booking.id]: true });
                              }}
                              className="w-full px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
                              type="button"
                            >
                              評論茶客
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 佳麗取消預約彈窗 */}
      {showProviderCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">取消預約</h3>
            <p className="text-sm text-gray-600 mb-4">
              請填寫取消原因（至少5個字元）。取消後將發送訊息通知茶客。
            </p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="請說明取消預約的原因..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 min-h-[100px]"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowProviderCancelModal(null);
                  setCancellationReason('');
                }}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleProviderCancel}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                確認取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 評論模態框 */}
      {Object.entries(showReviewModal).map(([bookingId, isOpen]) => {
        if (!isOpen) return null;
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return null;
        
        // 茶客評論佳麗的 profile
        if (userRole === 'client' && booking.profileId) {
          return (
            <ReviewModal
              key={bookingId}
              profileId={booking.profileId}
              onClose={() => setShowReviewModal({ ...showReviewModal, [bookingId]: false })}
              onSubmit={() => handleReviewSubmit(bookingId)}
            />
          );
        }
        
        // 佳麗評論茶客
        if (userRole === 'provider' && booking.clientId) {
          const client = clients[booking.clientId];
          const clientName = client?.userName || client?.email || client?.phoneNumber || '茶客';
          return (
            <ClientReviewModal
              key={bookingId}
              bookingId={bookingId}
              clientId={booking.clientId}
              clientName={clientName}
              onClose={() => setShowReviewModal({ ...showReviewModal, [bookingId]: false })}
              onSubmit={() => handleReviewSubmit(bookingId)}
            />
          );
        }
        
        return null;
      })}

      {/* 檢舉模態框 */}
      {Object.entries(showReportModal).map(([bookingId, isOpen]) => {
        if (!isOpen) return null;
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return null;

        // 根據角色確定檢舉對象
        const targetUser = userRole === 'provider' 
          ? clients[booking.clientId] // 佳麗檢舉茶客
          : profiles[booking.profileId]?.userId ? { id: booking.providerId } : null; // 茶客檢舉佳麗（需要 providerId）
        
        if (!targetUser) return null;

        return (
          <ReportModal
            key={bookingId}
            isOpen={isOpen}
            onClose={() => setShowReportModal({ ...showReportModal, [bookingId]: false })}
            targetUserId={targetUser.id}
            bookingId={booking.id}
            reporterRole={userRole}
            targetRole={userRole === 'provider' ? 'client' : 'provider'}
            onSuccess={async () => {
              await loadBookings();
            }}
          />
        );
      })}
      </div>
    </>
  );
};

