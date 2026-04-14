import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Profile, Booking } from '../types';
import { bookingApi, authApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

// 預約日曆視圖組件（用於選擇日期）
interface BookingCalendarViewProps {
  profileId: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const BookingCalendarView: React.FC<BookingCalendarViewProps> = ({
  profileId,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
}) => {
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [requestCache, setRequestCache] = useState<Map<string, { data: Set<string>; timestamp: number }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  // 使用 useMemo 穩定 currentMonth 的引用，避免不必要的重新渲染
  const monthKey = useMemo(() => {
    return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  }, [currentMonth]);

  useEffect(() => {
    // 防止重複請求
    if (loadingRef.current) {
      return;
    }
    
    // 延遲載入，避免與其他請求衝突
    const timer = setTimeout(() => {
      loadBookedDates();
    }, 500); // 延遲 500ms 載入
    
    // 監聽預約創建事件，自動刷新日曆
    const handleBookingCreated = (event: CustomEvent) => {
      const { profileId: createdProfileId, bookingDate: createdDate } = event.detail || {};
      // 如果是當前 profile 的預約，刷新日曆
      if (createdProfileId === profileId) {
        // 清除緩存並延遲刷新
        setRequestCache(new Map());
        setTimeout(() => {
          loadBookedDates();
        }, 1000); // 延遲 1 秒刷新
      }
    };
    
    window.addEventListener('booking-created', handleBookingCreated as EventListener);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('booking-created', handleBookingCreated as EventListener);
    };
  }, [profileId, monthKey]); // 使用 monthKey 而不是 currentMonth 對象

  const loadBookedDates = async () => {
    // 防止重複請求
    if (loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const bookedDatesSet = new Set<string>();
      
      // 只載入未來 14 天的日期（大幅減少請求數量，避免觸發 429）
      // 使用台灣時區獲取今天的日期
      const getTaiwanToday = () => {
        const now = new Date();
        const taiwanDateStr = now.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const [year, month, day] = taiwanDateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      };
      
      const today = getTaiwanToday();
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 14); // 只載入未來 14 天
      
      // 確保不超過當前月份的最後一天
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const actualLastDay = maxDate < lastDay ? maxDate : lastDay;
      
      const checkDates: string[] = [];
      const current = new Date(today);
      while (current <= actualLastDay && current <= lastDay) {
        // 只載入當前月份範圍內的日期
        if (current.getMonth() === currentMonth.getMonth() && 
            current.getFullYear() === currentMonth.getFullYear()) {
          checkDates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
      
      // 檢查緩存（緩存有效期 10 分鐘，增加緩存時間減少請求）
      const cacheKey = `${profileId}-${monthKey}`;
      const cached = requestCache.get(cacheKey);
      const now = Date.now();
      const cacheValid = cached && (now - cached.timestamp < 10 * 60 * 1000); // 10 分鐘緩存
      
      if (cacheValid) {
        setBookedDates(cached.data);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      // 如果沒有需要檢查的日期，直接返回
      if (checkDates.length === 0) {
        setBookedDates(bookedDatesSet);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      // 串行獲取所有日期的可用時間（避免同時發送大量請求觸發 429）
      // 優化：改為串行處理，每個請求之間延遲，避免觸發 rate limit
      const delayBetweenRequests = 400; // 每個請求之間延遲 400ms（增加延遲避免 429）
      
      for (let i = 0; i < checkDates.length; i++) {
        const date = checkDates[i];
        try {
          const data = await bookingApi.getAvailableTimes(profileId, date);
          // 如果該日期沒有可用時間（所有時間都被預約），標記為已預約
          if (data.availableTimes.length === 0 && data.bookedTimes.length > 0) {
            bookedDatesSet.add(date);
          }
        } catch (error: any) {
          // 如果是 429 錯誤，延長等待時間並跳過該日期
          if (error.message && error.message.includes('429')) {
            // 等待更長時間再繼續下一個請求
            await new Promise(resolve => setTimeout(resolve, 3000));
            // 跳過該日期，繼續處理下一個
            continue;
          }
          // 其他錯誤也靜默跳過
        }
        
        // 每個請求之間添加延遲（最後一個請求不需要延遲）
        if (i < checkDates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
      }
      
      // 更新緩存
      setRequestCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, { data: bookedDatesSet, timestamp: now });
        // 只保留最近 10 個緩存項
        if (newCache.size > 10) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      });
      
      setBookedDates(bookedDatesSet);
    } catch (error) {
      console.error('載入預約日期失敗:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const getCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    onMonthChange(newDate);
  };

  const calendarDays = getCalendarDays();
  // 使用台灣時區獲取今天的日期
  const getTaiwanDate = () => {
    const now = new Date();
    // 轉換為台灣時區的日期字符串 (YYYY-MM-DD)
    const taiwanDateStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // 創建台灣時區的日期對象（設置為當天 00:00:00）
    const [year, month, day] = taiwanDateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };
  
  const today = getTaiwanDate();
  const minDate = getTaiwanDate();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 月份切換 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          {currentMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xs text-gray-500 mt-2">載入預約狀況中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            // 比較日期（不包含時間），使用台灣時區
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const isToday = dateOnly.getTime() === todayOnly.getTime();
            const isPast = dateOnly.getTime() < todayOnly.getTime();
            const isBooked = bookedDates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (!isPast && !isBooked) {
                    onDateSelect(dateStr);
                  }
                }}
                disabled={isPast || isBooked}
                className={`
                  min-h-[50px] p-1 border-r border-b border-gray-200 transition-colors text-xs
                  ${isCurrentMonth ? (isPast ? 'bg-gray-100' : 'bg-white') : 'bg-gray-50'}
                  ${isPast ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'}
                  ${isToday && !isPast ? 'ring-2 ring-brand-green ring-inset' : ''}
                  ${isSelected && !isPast ? 'bg-brand-green text-white' : ''}
                  ${isBooked && !isPast ? 'bg-red-50 text-red-400 cursor-not-allowed' : ''}
                `}
                style={isSelected ? { backgroundColor: '#1a5f3f' } : isToday ? { ringColor: '#1a5f3f' } : {}}
                title={
                  isPast
                    ? '無法選擇過去的日期'
                    : isBooked
                    ? '該日期已滿'
                    : `選擇 ${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}`
                }
              >
                <div className="flex flex-col items-center">
                  <span className={isSelected ? 'font-bold' : ''}>{date.getDate()}</span>
                  {isBooked && (
                    <span className="text-[8px] mt-0.5">滿</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 圖例 */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-brand-green"></div>
          <span className="text-gray-600">今天</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-brand-green"></div>
          <span className="text-gray-600">已選擇</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div>
          <span className="text-gray-600">已滿</span>
        </div>
      </div>
    </div>
  );
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, profile, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true); // 顯示日曆視圖
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [profileBookings, setProfileBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [dailyBookingCount, setDailyBookingCount] = useState(0); // 當天已預約數量
  const [weeklyBookingCount, setWeeklyBookingCount] = useState(0); // 本週已預約數量
  const [loadingBookingLimits, setLoadingBookingLimits] = useState(false);

  // 获取今天和未来30天的日期
  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 时间选项（每小时）
  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'
  ];

  // 當日期改變時，獲取該日期的可用時間和預約限制
  useEffect(() => {
    if (bookingDate && isOpen) {
      loadAvailableTimes(bookingDate);
      // 僅特選魚市載入預約限制
      if (profile.userId) {
        loadBookingLimits(bookingDate);
      }
    } else {
      setAvailableTimes([]);
      setBookedTimes([]);
      setBookingTime('');
      setDailyBookingCount(0);
      setWeeklyBookingCount(0);
    }
  }, [bookingDate, isOpen, profile.id, profile.userId]);

  // 監聽預約創建事件，刷新當前選擇日期的可用時間和日曆
  useEffect(() => {
    if (!isOpen) return;
    
    const handleBookingCreated = (event: CustomEvent) => {
      const { profileId: createdProfileId, bookingDate: createdDate } = event.detail || {};
      // 如果是當前 profile 的預約，刷新可用時間
      if (createdProfileId === profile.id) {
        // 如果創建的預約是當前選擇的日期，刷新可用時間
        if (createdDate === bookingDate) {
          setTimeout(() => {
            loadAvailableTimes(bookingDate);
          }, 500);
        }
      }
    };
    
    window.addEventListener('booking-created', handleBookingCreated as EventListener);
    
    return () => {
      window.removeEventListener('booking-created', handleBookingCreated as EventListener);
    };
  }, [profile.id, bookingDate, isOpen]);

  // 載入預約限制（僅特選魚市）
  const loadBookingLimits = async (date: string) => {
    if (!profile.userId || !isAuthenticated || !user) return;
    
    try {
      setLoadingBookingLimits(true);
      // 獲取茶客的所有預約（特選魚市）
      const allBookings = await bookingApi.getMy();
      const fishMarketBookings = allBookings.filter(b => b.providerId && 
        (b.status === 'pending' || b.status === 'accepted' || b.status === 'completed'));
      
      // 計算當天預約數量
      const sameDayCount = fishMarketBookings.filter(b => b.bookingDate === date).length;
      setDailyBookingCount(sameDayCount);
      
      // 計算本週預約數量
      const bookingDateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = bookingDateObj.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const weekStart = new Date(bookingDateObj);
      weekStart.setDate(bookingDateObj.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekCount = fishMarketBookings.filter(b => {
        return b.bookingDate >= weekStartStr && b.bookingDate <= weekEndStr;
      }).length;
      setWeeklyBookingCount(weekCount);
    } catch (error) {
      console.error('載入預約限制失敗:', error);
    } finally {
      setLoadingBookingLimits(false);
    }
  };

  const loadAvailableTimes = async (date: string) => {
    setLoadingTimes(true);
    try {
      const data = await bookingApi.getAvailableTimes(profile.id, date);
      setAvailableTimes(data.availableTimes);
      
      // 標準化時間格式（確保格式一致：HH:MM）
      const normalizeTime = (time: string): string => {
        // 如果時間格式是 "HH:MM:SS"，轉換為 "HH:MM"
        if (time.includes(':') && time.split(':').length === 3) {
          return time.substring(0, 5);
        }
        return time;
      };
      
      const normalizedBookedTimes = data.bookedTimes.map(normalizeTime);
      setBookedTimes(normalizedBookedTimes);
      
      // 如果當前選擇的時間已被預約，清空選擇
      const normalizedBookingTime = normalizeTime(bookingTime);
      if (bookingTime && normalizedBookedTimes.includes(normalizedBookingTime)) {
        setBookingTime('');
      }
    } catch (error) {
      console.error('載入可用時間失敗:', error);
      // 如果載入失敗，顯示所有時間選項（不限制）
      setAvailableTimes(timeOptions);
      setBookedTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  // 載入該佳麗的預約數據
  useEffect(() => {
    if (isOpen && profile.id) {
      loadProfileBookings();
    }
  }, [isOpen, profile.id]);

  // 監聽 email 驗證完成事件（確保驗證完成後立即更新）
  useEffect(() => {
    const handleEmailVerified = () => {
      // 當用戶完成 email 驗證時，立即清除錯誤訊息
      if (isOpen && isAuthenticated) {
        setError('');
      }
    };
    
    window.addEventListener('user-email-verified', handleEmailVerified);
    return () => {
      window.removeEventListener('user-email-verified', handleEmailVerified);
    };
  }, [isOpen, isAuthenticated]);

  const loadProfileBookings = async () => {
    try {
      setLoadingBookings(true);
      // 獲取該 profile 的所有預約（通過獲取可用時間的 API，但我們需要所有日期的數據）
      // 由於沒有專門的 API，我們可以通過多次調用來獲取，或者創建一個新的 API
      // 暫時先獲取未來30天的預約數據
      const today = new Date();
      const bookings: Booking[] = [];
      
      // 嘗試獲取該 profile 的預約（如果用戶是該 profile 的 provider）
      // 但茶客無法直接獲取 provider 的預約，所以我們通過可用時間 API 來推斷
      // 這裡我們需要一個新的 API 端點來獲取 profile 的預約狀況
      // 暫時先使用現有的邏輯
      setProfileBookings(bookings);
    } catch (error) {
      console.error('載入預約數據失敗:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 重置表单
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow.toISOString().split('T')[0]);
      setBookingTime('');
      setLocation('');
      setServiceType('');
      setNotes('');
      setCurrentMonth(new Date());
      
      // 檢查驗證狀態並顯示警告（如果未驗證）
      // 注意：需要重新獲取最新的用戶狀態，因為 user 對象可能沒有及時更新
      if (isAuthenticated) {
        checkEmailVerificationStatus();
      } else {
        setError('');
      }
    }
  }, [isOpen, isAuthenticated]); // 只在模態框打開時重置

  // 檢查 email 驗證狀態的函數（重新獲取最新的用戶狀態）
  const checkEmailVerificationStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      // 重新獲取最新的用戶狀態
      const currentUser = await authApi.getMe();
      console.log('[BookingModal] 檢查 email 驗證狀態:', {
        emailVerified: currentUser.emailVerified,
        email: currentUser.email,
        userId: currentUser.id
      });
      
      if (!currentUser.emailVerified) {
        setError('預約特選魚市和嚴選好茶需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
      } else {
        setError(''); // 如果已驗證，清除錯誤訊息
      }
    } catch (error) {
      console.error('[BookingModal] 獲取用戶狀態失敗:', error);
      // 如果獲取失敗，使用緩存的 user 狀態
      if (!user?.emailVerified) {
        setError('預約特選魚市和嚴選好茶需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
      } else {
        setError('');
      }
    }
  };

  // 監聽驗證狀態變化（當 user.emailVerified 更新時重新檢查）
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkEmailVerificationStatus();
    }
  }, [isOpen, isAuthenticated, user?.emailVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('请先登录');
      return;
    }

    if (!bookingDate || !bookingTime) {
      setError('请选择预约日期和时间');
      return;
    }

    if (!serviceType) {
      setError('請選擇服務類型');
      return;
    }

    // 檢查驗證狀態：至少需要 email 驗證才能預約特選魚市和嚴選好茶
    // 注意：需要重新獲取最新的用戶狀態，因為 user 對象可能沒有及時更新
    try {
      const currentUser = await authApi.getMe();
      if (!currentUser.emailVerified) {
        setError('預約特選魚市和嚴選好茶需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
        return;
      }
    } catch (error) {
      // 如果獲取失敗，使用緩存的 user 狀態
      if (!user?.emailVerified) {
        setError('預約特選魚市和嚴選好茶需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
        return;
      }
    }

    // 防駭客機制：檢查預約限制（僅特選魚市）
    if (profile.userId) {
      if (dailyBookingCount >= 2) {
        setError(`您在同一天（${bookingDate}）已預約 ${dailyBookingCount} 個時段，同一天最多只能預約 2 個時段。`);
        return;
      }
      
      if (weeklyBookingCount >= 10) {
        const bookingDateObj = new Date(bookingDate + 'T00:00:00');
        const dayOfWeek = bookingDateObj.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(bookingDateObj);
        weekStart.setDate(bookingDateObj.getDate() - daysFromMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        setError(`您在本週（${weekStartStr} 至 ${weekEndStr}）已預約 ${weeklyBookingCount} 個時段，一週最多只能預約 10 個時段。`);
        return;
      }
    }

    // 檢查選擇的時間是否已被預約
    const normalizeTime = (time: string): string => {
      if (time.includes(':') && time.split(':').length === 3) {
        return time.substring(0, 5);
      }
      return time;
    };
    
    const normalizedBookingTime = normalizeTime(bookingTime);
    const normalizedBookedTimes = bookedTimes.map(normalizeTime);
    
    if (normalizedBookedTimes.includes(normalizedBookingTime)) {
      setError('該時間已被預約，請選擇其他時間');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await bookingApi.create({
        profileId: profile.id,
        serviceType: serviceType || undefined,
        bookingDate,
        bookingTime,
        location: location || undefined,
        notes: notes || undefined,
      });

      // 成功创建预约
      // 發送事件通知，讓所有預約日曆自動刷新
      window.dispatchEvent(new CustomEvent('booking-created', {
        detail: {
          profileId: profile.id,
          bookingDate,
          bookingTime
        }
      }));
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '建立預約失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-black text-brand-black">預約諮詢</h2>
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
          {/* 佳麗信息 */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-4">
              <img
                src={profile.imageUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
                <p className="text-sm text-gray-600">{profile.location}</p>
              </div>
            </div>
          </div>

          {/* 服务类型 */}
          {profile.prices && Object.keys(profile.prices).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                服務類型 <span className="text-red-500">*</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              >
                <option value="">請選擇服務類型</option>
                {profile.prices.oneShot && (
                  <option value="oneShot">
                    {profile.prices.oneShot.desc} - ${profile.prices.oneShot.price}
                  </option>
                )}
                {profile.prices.twoShot && (
                  <option value="twoShot">
                    {profile.prices.twoShot.desc} - ${profile.prices.twoShot.price}
                  </option>
                )}
                {profile.prices.threeShot && (
                  <option value="threeShot">
                    {profile.prices.threeShot.desc} - ${profile.prices.threeShot.price}
                  </option>
                )}
                {profile.prices.overnight && (
                  <option value="overnight">
                    {profile.prices.overnight.desc} - ${profile.prices.overnight.price}
                  </option>
                )}
                {profile.prices.dating && (
                  <option value="dating">
                    {profile.prices.dating.desc} - ${profile.prices.dating.price}
                  </option>
                )}
                {profile.prices.escort && (
                  <option value="escort">
                    {profile.prices.escort.desc} - ${profile.prices.escort.price}
                  </option>
                )}
                {/* 顯示其他自定義服務類型 */}
                {Object.entries(profile.prices).filter(([key]) => !['oneShot', 'twoShot', 'threeShot', 'overnight', 'dating', 'escort'].includes(key)).map(([key, value]) => (
                  value && (
                    <option key={key} value={key}>
                      {value.desc || key} - ${value.price}
                    </option>
                  )
                ))}
              </select>
            </div>
          )}

          {/* 预约日期 - 日曆視圖 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                預約日期 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-xs text-brand-green hover:text-opacity-80"
                style={{ color: '#1a5f3f' }}
              >
                {showCalendar ? '切換到日期選擇器' : '切換到日曆視圖'}
              </button>
            </div>
            
            {showCalendar ? (
              <BookingCalendarView
                profileId={profile.id}
                selectedDate={bookingDate}
                onDateSelect={(date) => {
                  setBookingDate(date);
                  loadAvailableTimes(date);
                }}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            ) : (
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  if (e.target.value) {
                    loadAvailableTimes(e.target.value);
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              />
            )}
          </div>

          {/* 預約限制提示（僅特選魚市） */}
          {profile.userId && bookingDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-blue-800 mb-1">預約限制提醒：</p>
              <ul className="text-blue-700 space-y-0.5">
                <li>• 同一天最多預約 2 個時段（目前：{dailyBookingCount}/2）</li>
                <li>• 一週最多預約 10 個時段（目前：{weeklyBookingCount}/10）</li>
              </ul>
              {dailyBookingCount >= 2 && (
                <p className="text-red-600 font-medium mt-2">
                  ⚠️ 您今天已預約 {dailyBookingCount} 個時段，無法再預約更多時段
                </p>
              )}
              {weeklyBookingCount >= 10 && (
                <p className="text-red-600 font-medium mt-2">
                  ⚠️ 您本週已預約 {weeklyBookingCount} 個時段，無法再預約更多時段
                </p>
              )}
            </div>
          )}

          {/* 预约时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預約時間 <span className="text-red-500">*</span>
              {loadingTimes && (
                <span className="ml-2 text-xs text-gray-500">載入中...</span>
              )}
            </label>
            {bookingDate ? (
              <div className="space-y-3">
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  disabled={loadingTimes}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">請選擇時間</option>
                  {timeOptions.map((time) => {
                    // 標準化時間格式進行比較
                    const normalizeTime = (t: string): string => {
                      if (t.includes(':') && t.split(':').length === 3) {
                        return t.substring(0, 5);
                      }
                      return t;
                    };
                    
                    const normalizedTime = normalizeTime(time);
                    const normalizedBookedTimes = bookedTimes.map(normalizeTime);
                    const normalizedAvailableTimes = availableTimes.map(normalizeTime);
                    
                    const isBooked = normalizedBookedTimes.includes(normalizedTime);
                    const isAvailable = normalizedAvailableTimes.includes(normalizedTime);
                    
                    return (
                      <option
                        key={time}
                        value={time}
                        disabled={isBooked}
                        className={isBooked ? 'text-gray-400 cursor-not-allowed' : ''}
                        style={isBooked ? { backgroundColor: '#fee2e2', color: '#991b1b' } : {}}
                      >
                        {time} {isBooked ? '(已預約，不可選擇)' : isAvailable ? '(可預約)' : ''}
                      </option>
                    );
                  })}
                </select>
                {bookedTimes.length > 0 && (
                  <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="font-medium text-yellow-800 mb-1">已預約時間：</p>
                    <div className="flex flex-wrap gap-2">
                      {bookedTimes.map((time) => (
                        <span key={time} className="px-2 py-1 bg-red-100 text-red-700 rounded">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {availableTimes.length > 0 && bookedTimes.length === 0 && (
                  <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p>✓ 此日期所有時間都可預約</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                請先選擇預約日期
              </div>
            )}
          </div>

          {/* 地点 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地點（選填）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="請輸入預約地點"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備註（選填）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="請輸入其他需求或備註..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent resize-none"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !bookingDate || !bookingTime || !serviceType}
              className="flex-1 px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1a5f3f' }}
            >
              {isSubmitting ? '提交中...' : '確認預約'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

