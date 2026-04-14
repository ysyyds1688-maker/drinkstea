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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="請輸入註冊時的 Email"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <p className="text-xs text-gray-500 mt-1">我們將發送驗證碼到您的郵箱</p>
                </div>
                <button
                  onClick={async () => {
                    if (!forgotPasswordEmail.trim()) {
                      setError('請輸入 Email');
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(forgotPasswordEmail.trim())) {
                      setError('請輸入有效的 Email 格式');
                      return;
                    }
                    setIsSubmitting(true);
                    setError(null);
                    try {
                      await authApi.forgotPassword(forgotPasswordEmail.trim());
                      setForgotPasswordStep('verify');
                    } catch (err: any) {
                      setError(err.message || '發送驗證碼失敗');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? '發送中...' : '發送驗證碼'}
                </button>
              </>
            )}

            {forgotPasswordStep === 'verify' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">驗證碼</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="請輸入6位驗證碼"
                    maxLength={6}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-gray-500 mt-1">驗證碼已發送到 {forgotPasswordEmail}</p>
                  <button
                    onClick={() => {
                      setForgotPasswordStep('request');
                      setVerificationCode('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
                  >
                    重新發送驗證碼
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!verificationCode.trim() || verificationCode.length !== 6) {
                      setError('請輸入6位驗證碼');
                      return;
                    }
                    setIsSubmitting(true);
                    setError(null);
                    try {
                      const result = await authApi.verifyForgotPassword(forgotPasswordEmail.trim(), verificationCode.trim());
                      setPasswordResult(result);
                      setForgotPasswordStep('result');
                    } catch (err: any) {
                      setError(err.message || '驗證失敗');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? '驗證中...' : '驗證'}
                </button>
              </>
            )}

            {forgotPasswordStep === 'result' && passwordResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-bold text-green-900 mb-2">✅ 驗證成功</h4>
                {passwordResult.password ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-800">您的原始密碼：</p>
                    <div className="p-3 bg-white border-2 border-green-300 rounded-lg">
                      <p className="text-lg font-mono font-bold text-center text-green-900">{passwordResult.password}</p>
                    </div>
                    {passwordResult.note && (
                      <p className="text-xs text-green-700 mt-2">{passwordResult.note}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-green-800">{passwordResult.passwordHint || '無法顯示原始密碼'}</p>
                    {passwordResult.needReset && (
                      <p className="text-xs text-gray-600 mt-2">如需重置密碼，請聯繫客服。</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setMode('login');
                    setForgotPasswordStep('request');
                    setForgotPasswordEmail('');
                    setVerificationCode('');
                    setPasswordResult(null);
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

