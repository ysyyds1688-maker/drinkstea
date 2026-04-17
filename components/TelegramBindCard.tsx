import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const TelegramBindCard: React.FC = () => {
  const [status, setStatus] = useState<{
    bound: boolean;
    telegramUsername?: string | null;
    telegramId?: string | null;
    unbindCount?: number;
    canUnbind?: boolean;
    remainingUnbinds?: number;
  }>({ bound: false });
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);
  const [error, setError] = useState<string>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // 在 TG Web App 內點 t.me 連結會卡住 —— 改用官方 API openTelegramLink
  const openBot = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      e.preventDefault();
      try {
        tg.openTelegramLink('https://t.me/teaprincess_bot');
      } catch {
        window.open('https://t.me/teaprincess_bot', '_blank');
      }
    }
    // 非 webapp 環境 → 讓預設 href 正常執行
  };

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/tg/status`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Api-Key': 'tk-api-2026-secret' },
      });
      if (resp.ok) {
        const data = await resp.json();
        setStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const generateCode = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/tg/generate-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Api-Key': 'tk-api-2026-secret' },
      });
      if (resp.ok) {
        const data = await resp.json();
        setCode(data.code);
      } else {
        setError('生成驗證碼失敗，請重試');
      }
    } catch (e) {
      setError('連線失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async () => {
    setUnbinding(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/tg/unbind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Api-Key': 'tk-api-2026-secret' },
      });
      const data = await resp.json();
      if (resp.ok) {
        setShowUnbindConfirm(false);
        await fetchStatus(); // 刷新狀態
      } else {
        setError(data.error || '解除綁定失敗');
      }
    } catch (e) {
      setError('連線失敗');
    } finally {
      setUnbinding(false);
    }
  };

  const unbindCount = status.unbindCount || 0;
  const canUnbind = status.canUnbind !== false && unbindCount < 2;

  return (
    <div data-tg-bind-card className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 md:p-6 border-2 border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.846 1.467 1.618 2.94 2.453 4.413.428.752 1.057 1.475 2.011 1.585.954.11 1.706-.482 2.301-1.156 1.43-1.622 2.873-3.243 4.296-4.871.62-.703 1.276-1.41 1.882-2.123.293-.345.654-.787.84-1.348.187-.561.034-1.305-.66-1.554Z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">綁定 Telegram</h3>
          <p className="text-xs text-gray-500">綁定後在 TG Bot 也能查看你的最愛</p>
        </div>
      </div>

      {/* === 為什麼要綁定（一律顯示）=== */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm mb-2">為什麼要綁定 Telegram？</p>
            <ul className="text-xs text-gray-700 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5"><svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>你在網站收藏的小姐會自動同步到 TG Bot</li>
              <li className="flex items-start gap-1.5"><svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>在 TG Bot 直接看到小姐照片 + 資料卡</li>
              <li className="flex items-start gap-1.5"><svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>截圖資料卡，直接傳給 LINE 客服預約</li>
              <li className="flex items-start gap-1.5"><svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>不用每次都來網站翻找喜歡的小姐</li>
              <li className="flex items-start gap-1.5"><svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>新妹上架第一時間 TG 通知</li>
            </ul>
          </div>
        </div>
      </div>

      {status.bound ? (
        <div className="bg-white rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            已綁定 Telegram
          </div>
          <div className="text-sm text-gray-600">
            {status.telegramUsername ? `@${status.telegramUsername}` : `Telegram ID: ${status.telegramId}`}
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-lg text-xs text-green-700 leading-relaxed">
            你在網站收藏的小姐已自動同步到 TG Bot<br/>
            到 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" onClick={openBot} className="underline font-medium">@teaprincess_bot</a> 點「我的最愛」即可查看
          </div>

          {/* 解除綁定區塊 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!canUnbind ? (
              // 已達上限，禁用
              <div className="text-xs text-gray-400 text-center py-2">
                <svg className="w-4 h-4 inline-block mr-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                解除綁定次數已用完（{unbindCount}/2 次），如需協助請聯繫客服
              </div>
            ) : showUnbindConfirm ? (
              // 二次確認
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-sm font-bold text-red-700 mb-2">確定要解除綁定？</p>
                <p className="text-xs text-red-600 mb-3">
                  解除後 TG Bot 將無法查看收藏，也無法透過 TG 重設密碼。
                  <br/>你還剩 <span className="font-bold">{2 - unbindCount}</span> 次解除綁定機會。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUnbind}
                    disabled={unbinding}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {unbinding ? '解除中...' : '確定解除'}
                  </button>
                  <button
                    onClick={() => setShowUnbindConfirm(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              // 解除綁定按鈕
              <button
                onClick={() => setShowUnbindConfirm(true)}
                className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                解除綁定（已使用 {unbindCount}/2 次）
              </button>
            )}
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          </div>
        </div>
      ) : (
        <div>
          {/* === 操作步驟（一律顯示）=== */}
          <div className="bg-white rounded-xl p-4 mb-3 border border-blue-100">
            <p className="font-bold text-gray-800 text-sm mb-3">綁定步驟（3 分鐘完成）</p>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>點下方按鈕「<span className="font-bold text-blue-600">取得驗證碼</span>」（10 分鐘有效）</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>到 Telegram 找 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" onClick={openBot} className="text-blue-600 underline font-bold">@teaprincess_bot</a></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>輸入 <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600 font-mono">/bind 驗證碼</code> 即可完成綁定</span>
              </li>
            </ol>
          </div>

          {/* 如果之前有解綁過，顯示提醒 */}
          {unbindCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-700">
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              你已使用 {unbindCount}/2 次解除綁定機會，剩餘 {2 - unbindCount} 次
            </div>
          )}

          {!code ? (
            <>
              <button
                onClick={generateCode}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md"
              >
                {loading ? '生成中...' : '取得驗證碼'}
              </button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          ) : (
            <div className="bg-white rounded-xl p-4 border-2 border-blue-300">
              <p className="text-sm text-gray-600 mb-2 font-medium">你的驗證碼（10 分鐘有效）：</p>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 text-center mb-3 border-2 border-dashed border-blue-300">
                <code className="text-3xl font-bold text-blue-600 tracking-widest">{code}</code>
              </div>
              <p className="text-sm text-gray-700 mb-2 font-medium">點下方按鈕複製完整指令，到 TG Bot 貼上送出：</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`/bind ${code}`).then(() => alert('已複製！\n\n到 @teaprincess_bot 貼上即可'));
                }}
                className="w-full py-3 mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                複製 /bind {code}
              </button>
              <a
                href={`https://t.me/teaprincess_bot`}
                target="_blank"
                rel="noopener"
                onClick={openBot}
                className="block w-full py-3 mb-3 bg-white border-2 border-blue-500 text-blue-600 text-center rounded-xl font-bold hover:bg-blue-50 transition"
              >
                開啟 @teaprincess_bot
              </a>
              <div className="bg-gray-50 rounded-lg p-3 text-center mb-2">
                <code className="text-blue-600 font-mono text-sm select-all">/bind {code}</code>
              </div>
              <button
                onClick={() => { setCode(''); fetchStatus(); }}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                我已綁定，重新檢查狀態
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
