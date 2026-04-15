import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const TelegramBindCard: React.FC = () => {
  const [status, setStatus] = useState<{ bound: boolean; telegramUsername?: string | null; telegramId?: string | null }>({ bound: false });
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/tg/status`, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 md:p-6 border-2 border-blue-200">
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
              <li>✅ 你在網站❤️收藏的小姐會自動同步到 TG Bot</li>
              <li>✅ 在 TG Bot 直接看到小姐照片 + 資料卡</li>
              <li>✅ 截圖資料卡，直接傳給 LINE 客服預約</li>
              <li>✅ 不用每次都來網站翻找喜歡的小姐</li>
              <li>✅ 新妹上架第一時間 TG 通知</li>
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
            🎉 你在網站收藏的小姐已自動同步到 TG Bot<br/>
            👉 到 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" className="underline font-medium">@teaprincess_bot</a> 點「❤️ 我的最愛」即可查看
          </div>
        </div>
      ) : (
        <div>
          {/* === 操作步驟（一律顯示）=== */}
          <div className="bg-white rounded-xl p-4 mb-3 border border-blue-100">
            <p className="font-bold text-gray-800 text-sm mb-3">📝 綁定步驟（3 分鐘完成）</p>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>點下方按鈕「<span className="font-bold text-blue-600">取得驗證碼</span>」（10 分鐘有效）</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>到 Telegram 找 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" className="text-blue-600 underline font-bold">@teaprincess_bot</a></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>輸入 <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600 font-mono">/bind 驗證碼</code> 即可完成綁定</span>
              </li>
            </ol>
          </div>

          {!code ? (
            <>
              <button
                onClick={generateCode}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md"
              >
                {loading ? '生成中...' : '🔑 取得驗證碼'}
              </button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          ) : (
            <div className="bg-white rounded-xl p-4 border-2 border-blue-300">
              <p className="text-sm text-gray-600 mb-2 font-medium">✨ 你的驗證碼（10 分鐘有效）：</p>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 text-center mb-3 border-2 border-dashed border-blue-300">
                <code className="text-3xl font-bold text-blue-600 tracking-widest">{code}</code>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                👉 開啟 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" className="text-blue-600 underline font-bold">@teaprincess_bot</a>，輸入：
              </p>
              <div className="bg-gray-100 rounded-lg p-3 text-center mb-3">
                <code className="text-blue-600 font-mono text-base">/bind {code}</code>
              </div>
              <button
                onClick={() => { setCode(''); fetchStatus(); }}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                🔄 我已綁定，重新檢查狀態
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
