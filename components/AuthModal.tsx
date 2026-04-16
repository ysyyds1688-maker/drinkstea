import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TERMS_OF_SERVICE } from '../constants/terms';
import { authApi } from '../services/apiService';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'provider' | 'client'>('client');
  const [age, setAge] = useState<number | ''>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 忘記密碼相關狀態
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify' | 'result'>('request');
  const [passwordResult, setPasswordResult] = useState<{ password?: string; passwordHint?: string; needReset?: boolean; note?: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [tgInfo, setTgInfo] = useState<string>('');
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError(`請輸入${loginType === 'email' ? 'Email' : '手機號'}`);
      return;
    }

    // 驗證輸入格式
    if (loginType === 'email') {
      // Email 格式驗證
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone.trim())) {
        setError('請輸入有效的 Email 格式');
        return;
      }
    } else {
      // 手機號格式驗證（台灣手機號：09開頭，10位數字）
      const phoneRegex = /^09\d{8}$/;
      if (!phoneRegex.test(emailOrPhone.trim())) {
        setError('請輸入有效的手機號碼（格式：09XXXXXXXX）');
        return;
      }
    }

    if (!password) {
      setError('請輸入密碼');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('密碼至少需要6個字符');
        return;
      }
      if (password !== confirmPassword) {
        setError('兩次輸入的密碼不一致');
        return;
      }
      if (!age || age < 18) {
        setError('您必須年滿18周歲才能註冊');
        return;
      }
      if (!agreedToTerms) {
        setError('請閱讀並同意服務條款與用戶協議');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(emailOrPhone.trim(), password, loginType === 'email');
        onClose();
      } else {
        await register(emailOrPhone.trim(), password, loginType === 'email', role, age as number);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || `${mode === 'login' ? '登錄' : '註冊'}失敗`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full mx-2 my-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {mode === 'login' ? '登錄' : '註冊'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 切換登入方式 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setLoginType('email')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              loginType === 'email' 
                ? 'bg-brand-green text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              loginType === 'phone' 
                ? 'bg-brand-green text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            手機號
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 输入框 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {loginType === 'email' ? 'Email' : '手機號'}
            </label>
            <input
              type={loginType === 'email' ? 'email' : 'tel'}
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder={loginType === 'email' ? 'example@email.com' : '0912345678'}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">確認密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入密碼"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">身份</label>
                <p className="text-xs text-gray-500 mb-2">
                  此處「身份」為本專案中的角色分工，<span className="font-semibold text-gray-700">並非生理性別</span>。
                  不同身份會解鎖不同功能：<span className="font-semibold">品茶客</span> 主要用來瀏覽、預約與收藏嚴選好茶 / 特選魚市；
                  <span className="font-semibold">後宮佳麗</span> 則是上架與管理個人資料、收發預約與訊息。
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      role === 'client' 
                        ? 'bg-brand-green text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    品茶客
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      role === 'provider' 
                        ? 'bg-brand-green text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    後宮佳麗
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">年齡 *</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="請輸入您的年齡"
                  min="18"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">未滿18歲禁止註冊</p>
              </div>

              {/* 服務條款確認 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                    style={{ accentColor: '#1a5f3f' }}
                    required
                  />
                  <label htmlFor="agreeTerms" className="flex-1 text-sm text-gray-700 cursor-pointer">
                    <span>我已仔細閱讀並同意</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                      className="text-brand-green font-medium hover:underline ml-1"
                      style={{ color: '#1a5f3f' }}
                    >
                      《茶王平台服務條款與用戶協議》
                    </button>
                  </label>
                </div>
                <div className="mt-2 text-xs text-gray-600 pl-7">
                  {TERMS_OF_SERVICE.simplified}
                </div>
              </div>
            </>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? '處理中...' : mode === 'login' ? '登錄' : '註冊'}
            </button>
          </div>
        </form>

        {/* 切换模式 */}
        <div className="mt-4 text-center text-sm space-y-2">
          {mode === 'login' ? (
            <>
              <div>
                還沒有帳號？{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-brand-green font-medium hover:underline"
                >
                  立即註冊
                </button>
              </div>
              <div>
                <button
                  onClick={() => {
                    setMode('forgot-password');
                    setForgotPasswordStep('request');
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  忘記密碼？
                </button>
              </div>
            </>
          ) : mode === 'forgot-password' ? (
            <div>
              <button
                onClick={() => {
                  setMode('login');
                  setForgotPasswordStep('request');
                  setForgotPasswordEmail('');
                  setVerificationCode('');
                  setPasswordResult(null);
                  setError(null);
                }}
                className="text-brand-green font-medium hover:underline"
              >
                返回登錄
              </button>
            </div>
          ) : (
            <span>
              已有帳號？{' '}
              <button
                onClick={() => setMode('login')}
                className="text-brand-green font-medium hover:underline"
              >
                立即登錄
              </button>
            </span>
          )}
        </div>

        {/* 忘記密碼流程 */}
        {mode === 'forgot-password' && (
          <div className="mt-6 space-y-4">
            {forgotPasswordStep === 'request' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">帳號</label>
                  <input
                    type="text"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="請輸入註冊時的 Email 或手機號碼"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <p className="text-xs text-blue-600 mt-2 leading-relaxed flex items-start gap-1">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>驗證碼將發送到您綁定的 Telegram 帳號<br/>（需先在「茶客檔案」中綁定 TG）</span>
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const val = forgotPasswordEmail.trim();
                    if (!val) {
                      setError('請輸入 Email 或手機號碼');
                      return;
                    }
                    const isEmail = val.includes('@');
                    const isPhone = /^[0+]\d{7,}$/.test(val);
                    if (!isEmail && !isPhone) {
                      setError('請輸入有效的 Email 或手機號碼');
                      return;
                    }
                    setIsSubmitting(true);
                    setError(null);
                    try {
                      const { API_BASE_URL } = await import('../config/api');
                      const resp = await fetch(`${API_BASE_URL}/api/tg/forgot-password/request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: val }),
                      });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || '發送失敗');
                      setTgInfo(data.masked_tg || '已發送到綁定的 Telegram');
                      setForgotPasswordStep('verify');
                    } catch (err: any) {
                      setError(err.message || '發送驗證碼失敗');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? '發送中...' : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>發送驗證碼到 Telegram</>)}
                </button>
              </>
            )}

            {forgotPasswordStep === 'verify' && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  已發送驗證碼到 {tgInfo || '您綁定的 Telegram'}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">驗證碼（6 位數字）</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="請輸入收到的驗證碼"
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-center text-2xl tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">新密碼（至少 6 字）</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="輸入新密碼"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">確認新密碼</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="再次輸入新密碼"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!verificationCode.trim() || verificationCode.length !== 6) {
                      setError('請輸入 6 位驗證碼');
                      return;
                    }
                    if (newPassword.length < 6) {
                      setError('密碼至少 6 字');
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setError('兩次密碼不一致');
                      return;
                    }
                    setIsSubmitting(true);
                    setError(null);
                    try {
                      const { API_BASE_URL } = await import('../config/api');
                      const resp = await fetch(`${API_BASE_URL}/api/tg/forgot-password/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          identifier: forgotPasswordEmail.trim(),
                          code: verificationCode.trim(),
                          newPassword: newPassword,
                        }),
                      });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || '驗證失敗');
                      setForgotPasswordStep('result');
                    } catch (err: any) {
                      setError(err.message || '驗證失敗');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-bold"
                >
                  {isSubmitting ? '處理中...' : (<><svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>確認重設密碼</>)}
                </button>
                <button
                  onClick={() => {
                    setForgotPasswordStep('request');
                    setVerificationCode('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline w-full text-center"
                >
                  重新發送驗證碼
                </button>
              </>
            )}

            {forgotPasswordStep === 'result' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>密碼重設成功！</h4>
                <p className="text-sm text-green-800">請用新密碼登入。</p>
                <button
                  onClick={() => {
                    setMode('login');
                    setForgotPasswordStep('request');
                    setForgotPasswordEmail('');
                    setVerificationCode('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setError(null);
                  }}
                  className="w-full mt-4 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90"
                >
                  返回登錄
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 服務條款詳情 Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{TERMS_OF_SERVICE.title}</h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <p className="text-xs text-gray-500 mb-4">
                版本：{TERMS_OF_SERVICE.version} | 最後更新：{TERMS_OF_SERVICE.lastUpdated}
              </p>
              {TERMS_OF_SERVICE.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-bold text-base mb-2 text-gray-900">{section.title}</h4>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">{section.content}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTerms(false);
                }}
                className="w-full py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90"
                style={{ backgroundColor: '#1a5f3f' }}
              >
                我已閱讀並同意
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

