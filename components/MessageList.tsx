import React, { useState, useEffect, useRef } from 'react';
import { messagesApi, Message, bookingApi, Booking } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerifiedBadge } from './EmailVerifiedBadge';

export const MessageList: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [messageThreads, setMessageThreads] = useState<Message[]>([]); // 對話串列表（每個對話串的最新訊息）
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]); // 選中對話串的所有訊息
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadMessageThreads();
      
      // 每30秒刷新一次訊息
      const interval = setInterval(() => {
        loadMessageThreads();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, user?.role]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId);
      // 嘗試從 threadId 獲取預約資訊（threadId 就是 bookingId）
      loadBooking(selectedThreadId);
    } else {
      setThreadMessages([]);
      setBooking(null);
    }
  }, [selectedThreadId]);
  
  const loadBooking = async (bookingId: string) => {
    try {
      setLoadingBooking(true);
      const bookings = await bookingApi.getMy();
      const foundBooking = bookings.find(b => b.id === bookingId);
      setBooking(foundBooking || null);
      
      // 計算24小時倒計時（僅 pending 狀態）
      if (foundBooking && foundBooking.status === 'pending' && foundBooking.createdAt) {
        const createdAt = new Date(foundBooking.createdAt);
        const now = new Date();
        const elapsed = now.getTime() - createdAt.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24小時的毫秒數
        const remaining = twentyFourHours - elapsed;
        setTimeRemaining(Math.max(0, remaining));
      } else {
        setTimeRemaining(null);
      }
    } catch (error) {
      console.error('載入預約資訊失敗:', error);
      setBooking(null);
      setTimeRemaining(null);
    } finally {
      setLoadingBooking(false);
    }
  };
  
  // 更新倒計時
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1000; // 每秒減少1秒
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);
  
  // 格式化倒計時顯示
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '已過期';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    if (hours > 0) {
      return `${hours}小時${minutes}分鐘`;
    } else if (minutes > 0) {
      return `${minutes}分鐘${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };
  
  const handleAcceptBooking = async () => {
    if (!booking || !selectedThreadId) return;
    
    if (!confirm('確定要確認此預約嗎？')) return;
    
    try {
      await bookingApi.updateStatus(booking.id, 'accepted');
      await loadBooking(selectedThreadId);
      await loadThreadMessages(selectedThreadId);
      await loadMessageThreads();
      // 觸發通知刷新事件
      window.dispatchEvent(new CustomEvent('booking-updated'));
      alert('預約已確認！系統已自動發送確認訊息給茶客。');
    } catch (error: any) {
      alert('確認預約失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  const handleRejectBooking = async () => {
    if (!booking || !selectedThreadId) return;
    
    if (!confirm('確定要拒絕此預約嗎？')) return;
    
    try {
      await bookingApi.updateStatus(booking.id, 'rejected');
      await loadBooking(selectedThreadId);
      await loadThreadMessages(selectedThreadId);
      await loadMessageThreads();
      // 觸發通知刷新事件
      window.dispatchEvent(new CustomEvent('booking-updated'));
      alert('預約已拒絕。');
    } catch (error: any) {
      alert('拒絕預約失敗: ' + (error.message || '未知錯誤'));
    }
  };

  const loadMessageThreads = async () => {
    if (!isAuthenticated || !user) return;
    
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await messagesApi.getMy();
      setMessageThreads(response.messages || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error: any) {
      console.error('載入訊息失敗:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    setLoadingThread(true);
    try {
      const response = await messagesApi.getThread(threadId);
      setThreadMessages(response.messages || []);
      
      // 標記為已讀（僅佳麗）
      if (user?.role === 'provider') {
        const unreadMessages = response.messages.filter(m => !m.isRead && m.recipientId === user.id);
        for (const msg of unreadMessages) {
          try {
            await messagesApi.markAsRead(msg.id);
          } catch (error) {
            console.error('標記已讀失敗:', error);
          }
        }
        // 更新未讀數量
        setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));
      }
    } catch (error: any) {
      console.error('載入對話串失敗:', error);
    } finally {
      setLoadingThread(false);
    }
  };


  const handleMarkAllAsRead = async () => {
    if (user?.role !== 'provider') return;
    
    try {
      await messagesApi.markAllAsRead();
      setMessageThreads(prev => prev.map(m => ({ ...m, isRead: true })));
      setThreadMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('全部標記已讀失敗:', error);
    }
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm('確定要刪除此對話串嗎？')) return;
    
    try {
      // 刪除對話串中的所有訊息
      const thread = threadMessages.length > 0 ? threadMessages : messageThreads.filter(m => m.threadId === threadId);
      for (const msg of thread) {
        try {
          await messagesApi.delete(msg.id);
        } catch (error) {
          console.error('刪除訊息失敗:', error);
        }
      }
      
      // 從列表中移除
      setMessageThreads(prev => prev.filter(m => m.threadId !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
        setThreadMessages([]);
      }
    } catch (error: any) {
      console.error('刪除對話串失敗:', error);
      alert('刪除失敗: ' + (error.message || '未知錯誤'));
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
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">請先登入</p>
      </div>
    );
  }

  const isProvider = user.role === 'provider';

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 標題欄 */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl lg:text-2xl font-serif font-black text-brand-black truncate">
            {isProvider ? '訊息收件箱' : '我的訊息'}
          </h2>
          {isProvider && unreadCount > 0 && (
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              有 <span className="font-bold text-red-600">{unreadCount}</span> 封未讀訊息
            </p>
          )}
        </div>
        {isProvider && unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="ml-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            全部標記已讀
          </button>
        )}
      </div>

      {/* 簡短提醒文字（佳麗和茶客都顯示） */}
      {(isProvider || !isProvider) && (
        <div className="px-4 md:px-6 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 提醒：</span>
              {isProvider 
                ? '請查看操作說明，了解如何處理預約和保護自身安全'
                : '請查看操作說明，了解訊息收件箱和品茶紀錄的用處與分工'
              }
            </p>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline ml-2"
            >
              查看說明
            </button>
          </div>
        </div>
      )}

      {/* Email 風格佈局：左側列表 + 右側詳細視圖 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側：訊息列表（手機版：選中時隱藏；桌面版：始終顯示） */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 overflow-y-auto ${
          selectedThreadId ? 'hidden md:block' : 'block'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
            </div>
          ) : messageThreads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">暫無訊息</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messageThreads.map((thread) => {
                const isSelected = selectedThreadId === thread.threadId;
                const displayName = isProvider 
                  ? (thread.sender?.name || thread.sender?.email || '匿名用戶')
                  : (thread.profile?.name || '佳麗');
                const displayAvatar = isProvider 
                  ? thread.sender?.avatarUrl 
                  : thread.profile?.imageUrl;

                return (
                  <div
                    key={thread.threadId}
                    onClick={() => setSelectedThreadId(thread.threadId || null)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    } ${!thread.isRead && isProvider ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 頭像 */}
                      <div className="flex-shrink-0 relative">
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-lg">👤</span>
                          </div>
                        )}
                        {/* Email 驗證徽章 */}
                        {isProvider && thread.sender?.emailVerified && (
                          <EmailVerifiedBadge size="sm" />
                        )}
                      </div>

                      {/* 訊息內容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {displayName}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(thread.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {thread.message}
                        </p>
                        <div className="flex items-center gap-2">
                          {!thread.isRead && isProvider && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                              未讀
                            </span>
                          )}
                          {thread.threadCount && thread.threadCount > 1 && (
                            <span className="text-xs text-gray-500">
                              {thread.threadCount} 則訊息
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 右側：詳細視圖（手機版：未選中時隱藏；桌面版：始終顯示） */}
        <div className={`w-full md:w-2/3 flex-col overflow-hidden ${
          selectedThreadId ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedThreadId ? (
            <>
              {loadingThread ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">載入中...</p>
                </div>
              ) : (
                <>
                  {/* 對話串標題 */}
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      {/* 手機版返回按鈕 */}
                      <button
                        onClick={() => setSelectedThreadId(null)}
                        className="md:hidden flex-shrink-0 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="返回列表"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                          {isProvider 
                            ? (threadMessages[0].sender?.name || threadMessages[0].sender?.email || '匿名用戶')
                            : (threadMessages[0].profile?.name || '佳麗')
                          }
                        </h3>
                        {threadMessages[0].profile && (
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            關於：{threadMessages[0].profile.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(selectedThreadId)}
                        className="px-3 py-1 text-xs md:text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        刪除
                      </button>
                    </div>
                  </div>

                  {/* 訊息列表 */}
                  <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 md:space-y-6">
                    {threadMessages.map((msg, index) => {
                      const isFromMe = msg.senderId === user.id;
                      // 自己的訊息：顯示「我」或自己的暱稱，靠右；對方訊息：顯示對方名稱，靠左
                      const displayName = isFromMe 
                        ? (user.userName || user.email || '我')
                        : (isProvider ? (msg.sender?.name || msg.sender?.email || '匿名用戶') : (msg.profile?.name || '佳麗'));
                      const displayAvatar = isFromMe 
                        ? user.avatarUrl 
                        : (isProvider ? msg.sender?.avatarUrl : msg.profile?.imageUrl);

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 md:gap-4 ${isFromMe ? 'flex-row-reverse' : ''}`}
                        >
                          {/* 頭像 */}
                          <div className="flex-shrink-0 relative">
                            {displayAvatar ? (
                              <img
                                src={displayAvatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">👤</span>
                              </div>
                            )}
                            {/* Email 驗證徽章 */}
                            {isFromMe ? (
                              user.emailVerified && (
                                <EmailVerifiedBadge size="sm" />
                              )
                            ) : (
                              isProvider && msg.sender?.emailVerified && (
                                <EmailVerifiedBadge size="sm" />
                              )
                            )}
                          </div>

                          {/* 訊息內容 */}
                          <div className={`flex-1 ${isFromMe ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block max-w-[85%] md:max-w-[80%] ${isFromMe ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg p-3 md:p-4`}>
                              <div className={`flex items-center gap-2 mb-2 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                                <span className="font-semibold text-gray-900 text-sm">{displayName}</span>
                                <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap break-words text-left">{msg.message}</p>
                            </div>
                            {/* 24小時倒計時警告（僅 pending 狀態） */}
                            {booking && booking.status === 'pending' && index === threadMessages.length - 1 && (
                              <div className={`mt-4 px-4 py-3 rounded-lg border-2 ${
                                timeRemaining !== null && timeRemaining < 2 * 60 * 60 * 1000 // 少於2小時
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                              }`}>
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm mb-1">
                                      ⚠️ 重要提醒：請在24小時內確認預約
                                    </p>
                                    {timeRemaining !== null && timeRemaining > 0 ? (
                                      <p className="text-sm">
                                        剩餘時間：<span className="font-bold">{formatTimeRemaining(timeRemaining)}</span>
                                        {timeRemaining < 2 * 60 * 60 * 1000 && '（即將過期）'}
                                      </p>
                                    ) : (
                                      <p className="text-sm font-bold">已超過24小時，預約將自動取消</p>
                                    )}
                                    <p className="text-xs mt-1 opacity-90">
                                      如未在24小時內完成確認，該預約將自動取消
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* 預約確認/拒絕按鈕（僅佳麗且預約狀態為 pending） */}
                            {!isFromMe && isProvider && booking && booking.status === 'pending' && index === threadMessages.length - 1 && (
                              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                  onClick={handleAcceptBooking}
                                  disabled={loadingBooking || (timeRemaining !== null && timeRemaining <= 0)}
                                  className="flex-1 px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg text-sm md:text-base font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingBooking ? '處理中...' : '確認預約'}
                                </button>
                                <button
                                  onClick={handleRejectBooking}
                                  disabled={loadingBooking || (timeRemaining !== null && timeRemaining <= 0)}
                                  className="flex-1 px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg text-sm md:text-base font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingBooking ? '處理中...' : '拒絕預約'}
                                </button>
                              </div>
                            )}
                            {/* 顯示預約狀態（已確認/已拒絕） */}
                            {booking && booking.status !== 'pending' && index === threadMessages.length - 1 && (
                              <div className={`mt-4 px-4 py-2 rounded-lg ${
                                booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                <p className="text-sm font-medium">
                                  {booking.status === 'accepted' ? '✓ 預約已確認' :
                                   booking.status === 'rejected' ? '✗ 預約已拒絕' :
                                   `預約狀態：${booking.status}`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </>
              )}
            </>
          ) : (
            <div className="hidden md:flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>請從左側選擇一個對話串</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 操作說明彈窗（僅佳麗顯示） */}
      {isProvider && showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{isProvider ? '佳麗操作說明' : '茶客操作說明'}</h3>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {isProvider ? (
                <>
                  {/* 佳麗：基本操作說明 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">基本操作說明</h4>
                        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                          <li>在此平台預約都是約會品茶</li>
                          <li>您可以在訊息中確認或拒絕預約請求</li>
                          <li>完成後可在品茶紀錄中標記為已完成</li>
                          <li>與茶客的聯絡資訊與後續溝通，請統一透過此訊息收件箱完成</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* 佳麗：重要提醒 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 重要提醒</h4>
                        <p className="text-sm text-yellow-800 mb-2">
                          如果茶客與您約會完成後，請記得前往「品茶紀錄」標記為已完成並進行評論，這樣才算完成該次預約，您才能獲得經驗值和積分。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 佳麗：安全提醒 */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-2">🛡️ 保護自身安全</h4>
                        <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
                          <li>約會前請確認茶客身份，可查看其個人資料和評價</li>
                          <li>選擇安全的約會地點，建議在公共場所見面</li>
                          <li>告知親友您的約會時間和地點</li>
                          <li>如遇不當行為，請立即使用檢舉功能並聯繫客服</li>
                          <li>保護個人隱私，不要透露過多個人資訊</li>
                          <li>如感到不安全，請立即離開並尋求幫助</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 茶客：訊息收件箱和品茶紀錄的分工說明 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">訊息收件箱和品茶紀錄的用處與分工</h4>
                        <div className="text-sm text-blue-800 space-y-3">
                          <div>
                            <p className="font-semibold mb-1">📬 訊息收件箱（我的訊息）：</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              <li>接收佳麗的預約確認訊息</li>
                              <li>查看佳麗的聯絡方式（LINE、電話、Email 等）</li>
                              <li>查看預約詳情和狀態</li>
                              <li>與佳麗的後續溝通聯絡</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">📋 品茶紀錄：</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              <li>查看所有約會品茶的記錄</li>
                              <li>查看預約的完整資訊（日期、時間、地點等）</li>
                              <li>佳麗完成約會後，在此進行評論</li>
                              <li>查看自己的品茶歷史統計</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 茶客：重要提醒 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 重要提醒</h4>
                        <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                          <li>約會品茶完成後，記得對佳麗進行評論，這樣才算完成該次預約，您才能獲得經驗值和積分</li>
                          <li>聯絡佳麗請使用「訊息收件箱」中提供的聯絡方式</li>
                          <li>預約詳情和歷史記錄請查看「品茶紀錄」</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* 茶客：安全提醒 */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-2">🛡️ 保護自身安全</h4>
                        <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
                          <li>約會前請查看佳麗的個人資料和評價</li>
                          <li>選擇安全的約會地點，建議在公共場所見面</li>
                          <li>告知親友您的約會時間和地點</li>
                          <li>如遇不當行為，請立即使用檢舉功能並聯繫客服</li>
                          <li>保護個人隱私，不要透露過多個人資訊</li>
                          <li>如感到不安全，請立即離開並尋求幫助</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                我已了解
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
