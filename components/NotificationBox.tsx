import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/apiService';

export interface Notification {
  id: string;
  userId: string;
  type: 'achievement' | 'task' | 'system' | 'message' | 'booking' | 'review';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: any;
}

export const NotificationBox: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // 清除之前的 interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isAuthenticated && user?.id) {
      // 延遲載入通知，避免與其他請求衝突
      const timer = setTimeout(() => {
        loadNotifications();
      }, 1500); // 延遲 1.5 秒載入
      
      // 每15秒刷新一次通知（縮短間隔以提升即時性）
      intervalRef.current = setInterval(() => {
        loadNotifications();
      }, 15000);
      
      // 監聽預約和消息相關事件，即時更新通知
      const handleBookingCreated = () => {
        loadNotifications();
      };
      
      const handleBookingUpdated = () => {
        loadNotifications();
      };
      
      const handleMessageSent = () => {
        loadNotifications();
      };
      
      const handleNotificationCreated = () => {
        loadNotifications();
      };
      
      // 監聽各種可能觸發通知的事件
      window.addEventListener('booking-created', handleBookingCreated);
      window.addEventListener('booking-updated', handleBookingUpdated);
      window.addEventListener('booking-status-changed', handleBookingUpdated);
      window.addEventListener('message-sent', handleMessageSent);
      window.addEventListener('notification-created', handleNotificationCreated);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        window.removeEventListener('booking-created', handleBookingCreated);
        window.removeEventListener('booking-updated', handleBookingUpdated);
        window.removeEventListener('booking-status-changed', handleBookingUpdated);
        window.removeEventListener('message-sent', handleMessageSent);
        window.removeEventListener('notification-created', handleNotificationCreated);
        clearTimeout(timer);
      };
    }
  }, [isAuthenticated, user?.id]); // 只依賴 user.id，而不是整個 user 對象

  // 點擊外部關閉下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!isAuthenticated || !user) return;
    
    // 檢查 token 是否存在，避免發送無效請求
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }
    
    // 防止重複請求
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await notificationsApi.getMy();
      const notifications = response.notifications || [];
      setNotifications(notifications);
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error: any) {
      // 如果是 401 錯誤，可能是 token 過期，靜默處理
      if (error.status === 401 || error.message?.includes('401')) {
        // Token 過期或無效，不顯示錯誤
        return;
      }
      // 其他錯誤也靜默處理，不影響用戶體驗
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      // 靜默失敗，不影響用戶體驗
      if (error.message && !error.message.includes('fetch') && !error.message.includes('Failed to fetch')) {
        console.warn('標記已讀失敗:', error.message);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error: any) {
      // 靜默失敗，不影響用戶體驗
      if (error.message && !error.message.includes('fetch') && !error.message.includes('Failed to fetch')) {
        console.warn('全部標記已讀失敗:', error.message);
      }
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deleted = notifications.find(n => n.id === notificationId);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('刪除通知失敗:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.link) return;
    
    // 關閉通知下拉列表
    setIsOpen(false);
    
    // 解析 link
    try {
      const url = new URL(notification.link, window.location.origin);
      const path = url.pathname;
      const params = new URLSearchParams(url.search);
      
      // 處理不同的通知類型
      if (path === '/user-profile' || path.startsWith('/user-profile')) {
        // 用戶檔案頁面
        const tab = params.get('tab');
        
        // 發送導航事件
        window.dispatchEvent(new CustomEvent('navigate-to-user-profile', {
          detail: { tab }
        }));
        
        // 如果是品茶紀錄，額外發送事件來設置 activeTab 和 bookingId（如果有的話）
        if (tab === 'bookings') {
          const bookingId = notification.metadata?.bookingId;
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('user-profile-set-tab', {
              detail: { tab: 'bookings', bookingId }
            }));
          }, 100);
        } else if (tab === 'messages') {
          // 如果是訊息，導航到訊息標籤頁
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('user-profile-set-tab', {
              detail: { tab: 'messages' }
            }));
          }, 100);
        } else if (tab === 'points') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('user-profile-set-tab', {
              detail: { tab: 'points' }
            }));
          }, 100);
        }
      } else if (path.startsWith('/forum') || path.startsWith('/post')) {
        // 論壇相關
        const postId = params.get('post') || params.get('id');
        if (postId) {
          window.dispatchEvent(new CustomEvent('navigate-to-forum-post', {
            detail: { postId }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('navigate-to-forum'));
        }
      } else if (path.startsWith('/profile')) {
        // Profile 詳情頁
        const profileId = params.get('id') || path.split('/').pop();
        if (profileId) {
          window.dispatchEvent(new CustomEvent('navigate-to-profile', {
            detail: { profileId }
          }));
        }
      } else {
        // 其他情況，使用默認跳轉
        window.location.href = notification.link;
      }
    } catch (error) {
      // 如果解析失敗，使用默認跳轉
      console.warn('無法解析通知連結，使用默認跳轉:', error);
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'achievement':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'task':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'system':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'message':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'booking':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'review':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-TW');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知圖標 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="通知"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉列表 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-96 overflow-hidden flex flex-col">
          {/* 標題欄 */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                全部標記已讀
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">載入中...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-500">暫無通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id);
                      }
                      if (notification.link) {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* 圖標 */}
                      <div className="flex-shrink-0 text-brand-green" style={{ color: '#1a5f3f' }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* 內容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          
                          {/* 操作按鈕 */}
                          <div className="flex-shrink-0 flex items-center gap-1">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                              aria-label="刪除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // 導航到通知中心頁面
                  window.dispatchEvent(new CustomEvent('navigate-to-user-profile', {
                    detail: { tab: 'notifications' }
                  }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                查看全部
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

