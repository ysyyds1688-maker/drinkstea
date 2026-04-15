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
            <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.846 1.467 1.618 2.94 2.453 4.413.428.752 1.057 1.475 2.011 1.585.954.11 1.706-.482 2.301-1.156 1.43-1.622 2.873-3.243 4.296-4.871.62-.703 1.276-1.41 1.882-2.123.293-.345.654-.787.84-1.348.187-.561.034-1.305-.66-1.554-.31-.111-.673-.123-1.018-.073-.345.05-.682.155-1 .283-.638.255-1.221.642-1.804 1.03-.194.13-.388.26-.583.387-.71.464-1.421.926-2.136 1.382L7.78 11.95c-.55.353-1.105.7-1.658 1.046-.295.184-.59.367-.886.55l-.026.017a1.073 1.073 0 0 1-1.108-.045 1.073 1.073 0 0 1-.342-1.054c.069-.398.328-.687.612-.893.31-.226.681-.402 1.066-.563l.027-.011 7.732-3.297c1.06-.452 2.121-.904 3.181-1.357.91-.388 1.82-.776 2.731-1.165.348-.148.696-.296 1.044-.444a1.69 1.69 0 0 1 .768-.135.69.69 0 0 1 .377.17c.205.193.117.51.022.768Z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">綁定 Telegram</h3>
          <p className="text-xs text-gray-500">綁定後在 TG Bot 也能查看你的最愛</p>
        </div>
      </div>

      {status.bound ? (
        <div className="bg-white rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            已綁定
          </div>
          <div className="text-sm text-gray-600">
            {status.telegramUsername ? `@${status.telegramUsername}` : `Telegram ID: ${status.telegramId}`}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            你在網站收藏的小姐會自動同步到 TG Bot
          </div>
        </div>
      ) : (
        <div>
          {!code ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                綁定步驟：<br/>
                1️⃣ 點擊下方按鈕取得驗證碼<br/>
                2️⃣ 到 Telegram 找 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" className="text-blue-600 underline font-medium">@teaprincess_bot</a><br/>
                3️⃣ 輸入 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">/bind 驗證碼</code>
              </p>
              <button
                onClick={generateCode}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '生成中...' : '取得驗證碼'}
              </button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          ) : (
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">你的驗證碼（10 分鐘有效）：</p>
              <div className="bg-blue-50 rounded-lg p-3 text-center mb-3">
                <code className="text-2xl font-bold text-blue-600 tracking-widest">{code}</code>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                到 Telegram 找 <a href="https://t.me/teaprincess_bot" target="_blank" rel="noopener" className="text-blue-600 underline font-medium">@teaprincess_bot</a>，輸入：
              </p>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <code className="text-blue-600 font-mono">/bind {code}</code>
              </div>
              <button
                onClick={() => { setCode(''); fetchStatus(); }}
                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
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
