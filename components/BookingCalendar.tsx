import React, { useState, useEffect } from 'react';
import { Booking, User } from '../types';
import { bookingApi, authApi } from '../services/apiService';

interface BookingCalendarProps {
  profileId?: string;
  providerId?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ profileId, providerId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Record<string, User>>({}); // 存儲茶客資訊
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
    
    // 監聽預約更新事件（當茶客創建預約時，佳麗的日曆會自動刷新）
    const handleBookingUpdate = () => {
      loadBookings();
    };
    
    // 監聽多種預約相關事件
    window.addEventListener('booking-created', handleBookingUpdate);
    window.addEventListener('booking-updated', handleBookingUpdate);
    window.addEventListener('booking-status-changed', handleBookingUpdate);
    
    // 定期刷新（每30秒檢查一次新預約）
    const refreshInterval = setInterval(() => {
      loadBookings();
    }, 30000);
    
    return () => {
      window.removeEventListener('booking-created', handleBookingUpdate);
      window.removeEventListener('booking-updated', handleBookingUpdate);
      window.removeEventListener('booking-status-changed', handleBookingUpdate);
      clearInterval(refreshInterval);
    };
  }, [profileId, providerId]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await bookingApi.getMy();
      console.log('[BookingCalendar] 獲取到預約數據:', bookingsData.length, '筆', bookingsData);
      
      // 過濾邏輯：
      // 1. 如果提供了 profileId，優先顯示該 profile 的預約
      // 2. 如果提供了 providerId，顯示所有與該 provider 相關的預約（通過 profile.userId 匹配）
      // 3. 如果都沒有提供，顯示所有預約
      let filteredBookings = bookingsData;
      
      if (profileId) {
        // 優先使用 profileId 過濾
        filteredBookings = bookingsData.filter(b => b.profileId === profileId);
        console.log('[BookingCalendar] 使用 profileId 過濾:', filteredBookings.length, '筆', { profileId });
      } else if (providerId) {
        // 如果沒有 profileId 但有 providerId，需要通過 profile 的 userId 來匹配
        // 但這需要額外的 API 調用來獲取 profile 資訊，所以先顯示所有預約
        // 實際上，對於 provider，bookingApi.getMy() 應該已經返回了所有相關預約
        filteredBookings = bookingsData;
        console.log('[BookingCalendar] 使用 providerId，顯示所有預約:', filteredBookings.length, '筆', { providerId });
      }
      
      console.log('[BookingCalendar] 過濾後的預約數據:', filteredBookings.length, '筆', {
        profileId,
        providerId,
        bookings: filteredBookings.map(b => ({
          id: b.id,
          profileId: b.profileId,
          status: b.status,
          bookingDate: b.bookingDate,
          bookingTime: b.bookingTime
        }))
      });
      setBookings(filteredBookings);
      
      // 載入茶客資訊（僅對 provider 角色）
      if (providerId && filteredBookings.length > 0) {
        const clientIds = [...new Set(filteredBookings.map(b => b.clientId).filter(Boolean))];
        const clientPromises = clientIds.map(id => authApi.getUserProfile(id).catch(() => null));
        const clientResults = await Promise.all(clientPromises);
        
        const clientsMap: Record<string, User> = {};
        clientResults.forEach((client, index) => {
          if (client) {
            clientsMap[clientIds[index]] = client;
          }
        });
        setClients(clientsMap);
      }
    } catch (error) {
      console.error('[BookingCalendar] 載入預約失敗:', error);
      setBookings([]); // 發生錯誤時設置為空數組
    } finally {
      setLoading(false);
    }
  };

  // 獲取當前月份的第一天
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // 獲取當前月份的最後一天
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // 獲取日曆視圖的所有日期
  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // 從週日開始

    const days: Date[] = [];
    const current = new Date(startDate);
    
    // 生成 6 週的日期（42 天）
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // 獲取某個日期的預約
  const getBookingsForDate = (date: Date): Booking[] => {
    // 使用本地時區格式化日期，避免 UTC 時區問題
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 過濾預約，確保日期格式匹配
    const dayBookings = bookings.filter(booking => {
      if (!booking.bookingDate) return false;
      // 處理可能的日期格式差異（YYYY-MM-DD 或帶時間的格式）
      const bookingDateStr = booking.bookingDate.split('T')[0]; // 如果包含時間，只取日期部分
      return bookingDateStr === dateStr;
    });
    
    console.log('[BookingCalendar] 獲取日期預約:', {
      dateStr,
      totalBookings: bookings.length,
      dayBookings: dayBookings.length,
      bookings: dayBookings.map(b => ({
        id: b.id,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        status: b.status
      }))
    });
    
    return dayBookings;
  };

  // 獲取預約狀態的顏色
  const getStatusColor = (booking: Booking) => {
    // 如果被標記為失約，優先顯示失約狀態
    if (booking.noShow) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    
    switch (booking.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 獲取狀態的中文名稱
  const getStatusLabel = (booking: Booking) => {
    if (booking.noShow) {
      return '失約';
    }
    
    const statusMap: Record<Booking['status'], string> = {
      pending: '待確認',
      accepted: '已接受',
      completed: '已完成',
      cancelled: '已取消',
      rejected: '已拒絕',
    };
    return statusMap[booking.status] || booking.status;
  };

  // 切換月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedBookings([]);
  };

  // 點擊日期
  const handleDateClick = (date: Date) => {
    // 使用本地時區格式化日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayBookings = getBookingsForDate(date);
    
    if (dayBookings.length > 0) {
      setSelectedDate(dateStr);
      setSelectedBookings(dayBookings);
    } else {
      setSelectedDate(null);
      setSelectedBookings([]);
    }
  };

  // 格式化日期顯示
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">載入預約中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 標題和月份切換 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-900">約會狀況</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadBookings()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新預約"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="上一個月"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="下一個月"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(null);
              setSelectedBookings([]);
            }}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="回到今天"
          >
            今天
          </button>
        </div>
      </div>

      {/* 日曆 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 星期標題 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <div
              key={index}
              className="p-1.5 sm:p-2 text-center text-xs font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            // 使用本地時區格式化日期，與 getBookingsForDate 保持一致
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayBookings = getBookingsForDate(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[60px] sm:min-h-[80px] p-0.5 sm:p-1 border-r border-b border-gray-200 cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isToday ? 'ring-2 ring-brand-green ring-inset' : ''}
                  ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
                style={isToday ? { ringColor: '#1a5f3f' } : {}}
              >
                <div className="flex flex-col h-full">
                  {/* 日期數字 */}
                  <div
                    className={`
                      text-xs font-medium mb-1
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday ? 'text-brand-green font-bold' : ''}
                    `}
                    style={isToday ? { color: '#1a5f3f' } : {}}
                  >
                    {date.getDate()}
                  </div>

                  {/* 預約標記 */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    {dayBookings.slice(0, 2).map((booking, idx) => {
                      const client = clients[booking.clientId];
                      const clientName = client?.userName || client?.email || '茶客';
                      return (
                        <div
                          key={booking.id}
                          className={`
                            text-[10px] px-1 py-0.5 rounded border truncate cursor-pointer
                            ${getStatusColor(booking)}
                          `}
                          title={`${booking.bookingTime} - ${getStatusLabel(booking)} - ${clientName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(date);
                          }}
                        >
                          <div className="truncate">{booking.bookingTime}</div>
                          {providerId && (
                            <div className="truncate text-[9px] opacity-80">{clientName}</div>
                          )}
                        </div>
                      );
                    })}
                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-gray-500 px-1">
                        +{dayBookings.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選中日期的預約詳情 */}
      {selectedDate && selectedBookings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
            {formatDate(new Date(selectedDate))} 的預約
          </h4>
          <div className="space-y-2">
            {selectedBookings
              .sort((a, b) => {
                // 先按狀態排序：未完成的在前，已完成的在後
                const aIsCompleted = a.status === 'completed';
                const bIsCompleted = b.status === 'completed';
                
                if (aIsCompleted !== bIsCompleted) {
                  return aIsCompleted ? 1 : -1; // 未完成的在前
                }
                
                // 如果狀態相同，按時間排序：離現在越近的在前面
                const aDateTime = new Date(`${a.bookingDate}T${a.bookingTime}`);
                const bDateTime = new Date(`${b.bookingDate}T${b.bookingTime}`);
                const now = new Date();
                
                // 計算距離現在的時間差（絕對值）
                const aDiff = Math.abs(aDateTime.getTime() - now.getTime());
                const bDiff = Math.abs(bDateTime.getTime() - now.getTime());
                
                return aDiff - bDiff; // 距離現在越近的排在前面
              })
              .map((booking) => {
              const client = clients[booking.clientId];
              const clientName = client?.userName || client?.email || booking.clientContactInfo?.phone || booking.clientContactInfo?.email || '茶客';
              return (
                <div
                  key={booking.id}
                  className={`
                    p-3 rounded-lg border
                    ${getStatusColor(booking)}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{booking.bookingTime}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(booking)}`}>
                          {getStatusLabel(booking)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium mb-1">
                        茶客：{clientName}
                      </p>
                      {booking.location && (
                        <p className="text-xs text-gray-600">地點：{booking.location}</p>
                      )}
                      {booking.notes && (
                        <p className="text-xs text-gray-600 mt-1">備註：{booking.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 圖例 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">狀態說明</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['pending', 'accepted', 'completed', 'cancelled', 'rejected'] as Booking['status'][]).map((status) => {
            const mockBooking: Booking = { 
              id: '', 
              clientId: '', 
              profileId: '', 
              bookingDate: '', 
              bookingTime: '', 
              status,
              createdAt: '',
              updatedAt: ''
            };
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor(mockBooking)}`}></div>
                <span className="text-xs text-gray-600">{getStatusLabel(mockBooking)}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border bg-orange-100 text-orange-800 border-orange-300"></div>
            <span className="text-xs text-gray-600">失約</span>
          </div>
        </div>
      </div>
    </div>
  );
};

