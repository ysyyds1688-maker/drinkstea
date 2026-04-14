import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Profile } from '../types';
import { bookingApi, authApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

// 預約日曆視圖組件（從 BookingModal 提取）
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
  const loadingRef = useRef(false);

  const monthKey = useMemo(() => {
    return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  }, [currentMonth]);

  useEffect(() => {
    if (loadingRef.current) return;
    
    const timer = setTimeout(() => {
      loadBookedDates();
    }, 500);
    
    const handleBookingCreated = (event: CustomEvent) => {
      const { profileId: createdProfileId } = event.detail || {};
      if (createdProfileId === profileId) {
        setRequestCache(new Map());
        setTimeout(() => {
          loadBookedDates();
        }, 1000);
      }
    };
    
    window.addEventListener('booking-created', handleBookingCreated as EventListener);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('booking-created', handleBookingCreated as EventListener);
    };
  }, [profileId, monthKey]);

  const loadBookedDates = async () => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const bookedDatesSet = new Set<string>();
      
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
      maxDate.setDate(today.getDate() + 14);
      
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const actualLastDay = maxDate < lastDay ? maxDate : lastDay;
      
      const checkDates: string[] = [];
      const current = new Date(today);
      while (current <= actualLastDay && current <= lastDay) {
        if (current.getMonth() === currentMonth.getMonth() && 
            current.getFullYear() === currentMonth.getFullYear()) {
          checkDates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
      
      const cacheKey = `${profileId}-${monthKey}`;
      const cached = requestCache.get(cacheKey);
      const now = Date.now();
      const cacheValid = cached && (now - cached.timestamp < 10 * 60 * 1000);
      
      if (cacheValid) {
        setBookedDates(cached.data);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      if (checkDates.length === 0) {
        setBookedDates(bookedDatesSet);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      const delayBetweenRequests = 400;
      
      for (let i = 0; i < checkDates.length; i++) {
        const date = checkDates[i];
        try {
          const data = await bookingApi.getAvailableTimes(profileId, date);
          if (data.availableTimes.length === 0 && data.bookedTimes.length > 0) {
            bookedDatesSet.add(date);
          }
        } catch (error: any) {
          if (error.message && error.message.includes('429')) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
        }
        
        if (i < checkDates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
      }
      
      setRequestCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, { data: bookedDatesSet, timestamp: now });
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
  const getTaiwanDate = () => {
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
  
  const today = getTaiwanDate();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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

      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

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

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSuccess?: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSuccess
}) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
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
  const [showCalendar, setShowCalendar] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyBookingCount, setDailyBookingCount] = useState(0);
  const [weeklyBookingCount, setWeeklyBookingCount] = useState(0);
  const [loadingBookingLimits, setLoadingBookingLimits] = useState(false);

  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'
  ];
  
  // 獲取服務時長（小時）
  const getServiceDuration = (serviceType: string): number => {
    switch (serviceType) {
      case 'oneShot':
        return 1; // 1小時（50分鐘）
      case 'twoShot':
        return 2; // 2小時（100分鐘）
      case 'threeShot':
        return 3; // 3小時
      case 'overnight':
        return 12; // 過夜，假設12小時
      case 'dating':
        return 4; // 約會，假設4小時
      case 'escort':
        return 6; // 伴遊，假設6小時
      default:
        return 1; // 默認1小時
    }
  };
  
  // 獲取台灣時區的當前時間
  const getTaiwanNow = (): Date => {
    const now = new Date();
    // 獲取台灣時區的日期和時間字符串
    const taiwanDateStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const taiwanTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Taipei',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // 解析日期：YYYY-MM-DD
    const [year, month, day] = taiwanDateStr.split('-').map(Number);
    // 解析時間：HH:MM:SS
    const [hour, minute, second] = taiwanTimeStr.split(':').map(Number);
    
    // 創建一個 UTC 時間，然後轉換為台灣時區的本地時間
    // 注意：這裡創建的 Date 對象會使用本地時區，但我們已經從台灣時區獲取了正確的值
    return new Date(year, month - 1, day, hour, minute, second || 0);
  };
  
  // 檢查時間是否已過（基於台灣時區）
  const isTimePast = (date: string, time: string): boolean => {
    if (!date || !time) return false;
    
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    // 獲取台灣時區的今天日期（不包含時間）
    const taiwanTodayStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [todayYear, todayMonth, todayDay] = taiwanTodayStr.split('-').map(Number);
    
    // 如果選擇的不是今天的日期，則不應該標記為已過時
    if (year !== todayYear || month !== todayMonth || day !== todayDay) {
      return false;
    }
    
    // 只有選擇今天的日期時，才檢查時間是否已過
    // 獲取台灣時區的當前時間（時分）
    const taiwanNowTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Taipei',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [nowHour, nowMinute] = taiwanNowTimeStr.split(':').map(Number);
    
    // 比較時間（只比較時分，不比較秒）
    const bookingTimeMinutes = hour * 60 + minute;
    const nowTimeMinutes = nowHour * 60 + nowMinute;
    
    // 調試日誌（僅開發環境）
    if (process.env.NODE_ENV === 'development') {
      console.log('[isTimePast]', {
        date,
        time,
        bookingTimeMinutes,
        nowTimeMinutes,
        taiwanNow: `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')} ${String(nowHour).padStart(2, '0')}:${String(nowMinute).padStart(2, '0')}`,
        isPast: bookingTimeMinutes <= nowTimeMinutes
      });
    }
    
    return bookingTimeMinutes <= nowTimeMinutes;
  };
  
  // 檢查時間段是否可用（考慮服務時長）
  const isTimeSlotAvailable = (date: string, time: string, serviceType: string): boolean => {
    if (!date || !time || !serviceType) return true; // 如果沒有選擇服務類型，不限制
    
    const duration = getServiceDuration(serviceType);
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    const startTime = new Date(year, month - 1, day, hour, minute, 0);
    
    // 檢查從開始時間到結束時間的所有時段是否可用
    for (let i = 0; i < duration; i++) {
      const checkTime = new Date(startTime);
      checkTime.setHours(checkTime.getHours() + i);
      
      const checkTimeStr = `${String(checkTime.getHours()).padStart(2, '0')}:${String(checkTime.getMinutes()).padStart(2, '0')}`;
      
      // 如果檢查的時間不在 timeOptions 中，跳過（例如跨日）
      if (!timeOptions.includes(checkTimeStr)) {
        // 跨日處理：檢查是否在同一天
        if (checkTime.getDate() !== startTime.getDate()) {
          // 跨日了，檢查是否在允許的時間範圍內（00:00, 01:00, 02:00）
          const nextDayHour = checkTime.getHours();
          if (nextDayHour > 2) {
            return false; // 超過允許的時間範圍
          }
        }
        continue;
      }
      
      // 檢查該時段是否已被預約
      const normalizeTime = (t: string): string => {
        if (t.includes(':') && t.split(':').length === 3) {
          return t.substring(0, 5);
        }
        return t;
      };
      
      const normalizedCheckTime = normalizeTime(checkTimeStr);
      const normalizedBookedTimes = bookedTimes.map(normalizeTime);
      
      if (normalizedBookedTimes.includes(normalizedCheckTime)) {
        return false; // 該時段已被預約
      }
    }
    
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow.toISOString().split('T')[0]);
      setBookingTime('');
      setLocation('');
      setServiceType('');
      setNotes('');
      setCurrentMonth(new Date());
      
      if (isAuthenticated) {
        checkEmailVerificationStatus();
      } else {
        setError('');
      }
    }
  }, [isOpen, isAuthenticated]);

  const checkEmailVerificationStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      const currentUser = await authApi.getMe();
      if (!currentUser.emailVerified) {
        setError('預約特選魚市需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('[MessageModal] 獲取用戶狀態失敗:', error);
      if (!user?.emailVerified) {
        setError('預約特選魚市需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
      } else {
        setError('');
      }
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkEmailVerificationStatus();
    }
  }, [isOpen, isAuthenticated, user?.emailVerified]);

  useEffect(() => {
    if (bookingDate && isOpen) {
      loadAvailableTimes(bookingDate);
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
  
  // 當服務類型改變時，如果已選擇的時間不可用，清空選擇
  useEffect(() => {
    if (bookingDate && bookingTime && serviceType) {
      if (!isTimeSlotAvailable(bookingDate, bookingTime, serviceType)) {
        setBookingTime('');
        setError('所選時間段因服務時長限制不可用，請重新選擇時間');
      }
    }
  }, [serviceType, bookingDate, bookingTime]);

  const loadBookingLimits = async (date: string) => {
    if (!profile.userId || !isAuthenticated || !user) return;
    
    try {
      setLoadingBookingLimits(true);
      const allBookings = await bookingApi.getMy();
      const fishMarketBookings = allBookings.filter(b => b.providerId && 
        (b.status === 'pending' || b.status === 'accepted' || b.status === 'completed'));
      
      const sameDayCount = fishMarketBookings.filter(b => b.bookingDate === date).length;
      setDailyBookingCount(sameDayCount);
      
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
      
      const normalizeTime = (time: string): string => {
        if (time.includes(':') && time.split(':').length === 3) {
          return time.substring(0, 5);
        }
        return time;
      };
      
      const normalizedBookedTimes = data.bookedTimes.map(normalizeTime);
      setBookedTimes(normalizedBookedTimes);
      
      const normalizedBookingTime = normalizeTime(bookingTime);
      if (bookingTime && normalizedBookedTimes.includes(normalizedBookingTime)) {
        setBookingTime('');
      }
    } catch (error) {
      console.error('載入可用時間失敗:', error);
      setAvailableTimes(timeOptions);
      setBookedTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('請先登入');
      return;
    }

    if (!bookingDate || !bookingTime) {
      setError('請選擇預約日期和時間');
      return;
    }

    if (!serviceType) {
      setError('請選擇服務類型');
      return;
    }

    try {
      await refreshUser();
      const currentUser = await authApi.getMe();
      if (!currentUser.emailVerified) {
        setError('預約特選魚市需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
        return;
      }
    } catch (error) {
      if (!user?.emailVerified) {
        setError('預約特選魚市需要先完成 Email 驗證。請前往個人資料頁面完成驗證。');
        return;
      }
    }

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

    const normalizeTime = (time: string): string => {
      if (time.includes(':') && time.split(':').length === 3) {
        return time.substring(0, 5);
      }
      return time;
    };
    
    const normalizedBookingTime = normalizeTime(bookingTime);
    const normalizedBookedTimes = bookedTimes.map(normalizeTime);
    
    // 檢查時間是否已過（基於台灣時區）
    if (isTimePast(bookingDate, bookingTime)) {
      setError('所選時間已過，請選擇未來的時間');
      return;
    }
    
    // 檢查時間是否已被預約
    if (normalizedBookedTimes.includes(normalizedBookingTime)) {
      setError('該時間已被預約，請選擇其他時間');
      return;
    }
    
    // 檢查服務時長是否可用
    if (serviceType && !isTimeSlotAvailable(bookingDate, bookingTime, serviceType)) {
      const duration = getServiceDuration(serviceType);
      setError(`所選時間段的後續 ${duration} 小時不可用，請選擇其他時間`);
      return;
    }

    setIsSubmitting(true);

    try {
      await bookingApi.create({
        profileId: profile.id,
        serviceType: serviceType || undefined,
        bookingDate,
        bookingTime,
        location: location || undefined,
        notes: notes || undefined,
      });

      window.dispatchEvent(new CustomEvent('booking-created', {
        detail: {
          profileId: profile.id,
          bookingDate,
          bookingTime
        }
      }));
      
      alert('預約請求已發送！請前往訊息收件箱查看預約詳情。');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || '建立預約失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const priceList = profile.prices ? Object.entries(profile.prices)
    .filter(([_, value]) => value && value.price > 0)
    .map(([key, value]) => ({
      key,
      ...value
    })) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-serif font-bold text-brand-black">
            預約 {profile.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="關閉"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* 價格資訊 */}
          {profile.userId && priceList.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {profile.type === 'outcall' ? '上門服務' : '定點服務'}價格
              </h3>
              <div className="space-y-3">
                {priceList.map((item) => (
                  <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{item.desc || item.key}</p>
                      {item.key === 'dating' && (
                        <p className="text-xs text-gray-500 mt-1">你選擇地點</p>
                      )}
                      {item.key === 'overnight' && (
                        <p className="text-xs text-gray-500 mt-1">在我家 xo</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      NT$ {item.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 服务类型 */}
          {profile.prices && Object.keys(profile.prices).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                服務類型 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">（請先選擇服務類型，系統會根據服務時長過濾可用時間）</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  // 如果改變服務類型，清空已選擇的時間（因為時長可能不同）
                  if (bookingTime) {
                    setBookingTime('');
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              >
                <option value="">請選擇服務類型</option>
                {profile.prices.oneShot && (
                  <option value="oneShot">
                    {profile.prices.oneShot.desc} - NT$ {profile.prices.oneShot.price.toLocaleString()}
                  </option>
                )}
                {profile.prices.twoShot && (
                  <option value="twoShot">
                    {profile.prices.twoShot.desc} - NT$ {profile.prices.twoShot.price.toLocaleString()}
                  </option>
                )}
                {profile.prices.threeShot && (
                  <option value="threeShot">
                    {profile.prices.threeShot.desc} - NT$ {profile.prices.threeShot.price.toLocaleString()}
                  </option>
                )}
                {profile.prices.overnight && (
                  <option value="overnight">
                    {profile.prices.overnight.desc} - NT$ {profile.prices.overnight.price.toLocaleString()}
                  </option>
                )}
                {profile.prices.dating && (
                  <option value="dating">
                    {profile.prices.dating.desc} - NT$ {profile.prices.dating.price.toLocaleString()}
                  </option>
                )}
                {profile.prices.escort && (
                  <option value="escort">
                    {profile.prices.escort.desc} - NT$ {profile.prices.escort.price.toLocaleString()}
                  </option>
                )}
                {Object.entries(profile.prices).filter(([key]) => !['oneShot', 'twoShot', 'threeShot', 'overnight', 'dating', 'escort'].includes(key)).map(([key, value]) => (
                  value && (
                    <option key={key} value={key}>
                      {value.desc || key} - NT$ {value.price.toLocaleString()}
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

          {/* 預約限制提示 */}
          {profile.userId && bookingDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-blue-800 mb-1">預約限制提醒：</p>
              <ul className="text-blue-700 space-y-0.5">
                <li>• 同一天最多預約 2 個時段（目前：{dailyBookingCount}/2）</li>
                <li>• 一週最多預約 10 個時段（目前：{weeklyBookingCount}/10）</li>
              </ul>
            </div>
          )}

          {/* 预约时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預約時間 <span className="text-red-500">*</span>
              {loadingTimes && (
                <span className="ml-2 text-xs text-gray-500">載入中...</span>
              )}
              {serviceType && (
                <span className="ml-2 text-xs text-blue-600">
                  （已選擇 {getServiceDuration(serviceType)} 小時服務，系統已過濾可用時間）
                </span>
              )}
              {/* 顯示當前台灣時間（用於調試） */}
              {bookingDate && (
                <span className="ml-2 text-xs text-gray-500">
                  （當前時間：{getTaiwanNow().toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}）
                </span>
              )}
            </label>
            {bookingDate ? (
              !serviceType ? (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  ⚠️ 請先選擇服務類型，系統會根據服務時長顯示可用時間
                </div>
              ) : (
              <div className="space-y-3">
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  disabled={loadingTimes}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">請選擇時間</option>
                  {(() => {
                    // 預先計算每個時段的狀態，以便後續時段可以檢查前面的時段
                    const timeSlotStates = timeOptions.map((time, timeIndex) => {
                      const normalizeTime = (t: string): string => {
                        if (t.includes(':') && t.split(':').length === 3) {
                          return t.substring(0, 5);
                        }
                        return t;
                      };
                      
                      const normalizedTime = normalizeTime(time);
                      const normalizedBookedTimes = bookedTimes.map(normalizeTime);
                      
                      const isBooked = normalizedBookedTimes.includes(normalizedTime);
                      const isPast = isTimePast(bookingDate, time);
                      const isServiceSlotAvailable = serviceType ? isTimeSlotAvailable(bookingDate, time, serviceType) : true;
                      
                      return {
                        time,
                        timeIndex,
                        isBooked,
                        isPast,
                        isServiceSlotAvailable
                      };
                    });
                    
                    // 標記被前面時段覆蓋的時段
                    const blockedSlots = new Set<number>();
                    if (serviceType) {
                      const duration = getServiceDuration(serviceType);
                      timeSlotStates.forEach((slot, index) => {
                        // 如果這個時段因為後續時段不可用而被禁用
                        if (!slot.isServiceSlotAvailable && !slot.isBooked && !slot.isPast) {
                          // 標記從這個時段開始往後的所有時段都被阻擋
                          for (let i = index; i < Math.min(index + duration, timeOptions.length); i++) {
                            blockedSlots.add(i);
                          }
                        }
                      });
                    }
                    
                    return timeOptions.map((time, timeIndex) => {
                      const normalizeTime = (t: string): string => {
                        if (t.includes(':') && t.split(':').length === 3) {
                          return t.substring(0, 5);
                        }
                        return t;
                      };
                      
                      const normalizedTime = normalizeTime(time);
                      const normalizedBookedTimes = bookedTimes.map(normalizeTime);
                      const normalizedAvailableTimes = availableTimes.map(normalizeTime);
                      
                      const slotState = timeSlotStates[timeIndex];
                      const isBooked = slotState.isBooked;
                      const isAvailable = normalizedAvailableTimes.includes(normalizedTime);
                      const isPast = slotState.isPast;
                      const isServiceSlotAvailable = slotState.isServiceSlotAvailable;
                      const isBlockedByPreviousSlot = blockedSlots.has(timeIndex);
                      
                      // 禁用條件：已預約、已過時、服務時長不可用、或被前面的時段阻擋
                      const isDisabled = isBooked || isPast || !isServiceSlotAvailable || isBlockedByPreviousSlot;
                      
                      let statusText = '';
                      // 優先顯示已過時狀態（如果時間已過）
                      if (isPast) {
                        statusText = '(已過時)';
                      } else if (isBooked || isBlockedByPreviousSlot || (!isServiceSlotAvailable && serviceType)) {
                        // 其次顯示已預約狀態（包括實際已預約和因後續時段不可用而視為已預約）
                        statusText = '(已預約)';
                      } else if (isAvailable) {
                        statusText = '(可預約)';
                      }
                      
                      return (
                        <option
                          key={time}
                          value={time}
                          disabled={isDisabled}
                          style={isDisabled ? { color: '#9ca3af' } : {}}
                        >
                          {time} {statusText}
                        </option>
                      );
                    });
                  })()}
                </select>
                {serviceType && (
                  <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="font-medium text-blue-800 mb-1">💡 提示：</p>
                    <ul className="text-blue-700 space-y-0.5">
                      <li>• 系統已自動過濾已過時的時間（基於台灣時區）</li>
                      <li>• 系統已根據服務時長（{getServiceDuration(serviceType)} 小時）過濾可用時間</li>
                      <li>• 如果某個時間段的後續時段不可用，該時間將被禁用</li>
                    </ul>
                  </div>
                )}
              </div>
              )
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
              placeholder="請輸入備註..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent resize-none"
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
