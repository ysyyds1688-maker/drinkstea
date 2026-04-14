import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserStatus, Subscription } from '../types';
import { authApi, subscriptionsApi } from '../services/apiService';
import { safeSetItem } from '../utils/storageUtils';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  userStatus: UserStatus;
  isAuthenticated: boolean;
  isSubscribed: boolean;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  login: (emailOrPhone: string, password: string, isEmail: boolean) => Promise<void>;
  register: (emailOrPhone: string, password: string, isEmail: boolean, role: 'provider' | 'client', age: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // 檢測是否為首次登入
  const checkFirstLogin = (userData: User, isRegister: boolean = false): boolean => {
    if (!userData) return false;
    
    // 如果是註冊，一定是首次登入
    if (isRegister) {
      return true;
    }
    
    // 檢查是否已經顯示過歡迎訊息
    const welcomeShown = localStorage.getItem(`welcome_shown_${userData.id}`);
    if (welcomeShown === 'true') {
      return false;
    }
    
    // 判斷是否為首次登入：
    // lastLoginAt 為空或與 createdAt 非常接近（首次登入）
    if (userData.createdAt && userData.lastLoginAt) {
      const createdAt = new Date(userData.createdAt).getTime();
      const lastLoginAt = new Date(userData.lastLoginAt).getTime();
      const diff = lastLoginAt - createdAt;
      // 如果最後登入時間與註冊時間相差不到 10 分鐘，認為是首次登入
      return diff < 10 * 60 * 1000;
    }
    
    // 如果沒有 lastLoginAt，可能是首次登入
    // 但需要檢查是否已經顯示過歡迎訊息
    return !userData.lastLoginAt && welcomeShown !== 'true';
  };

  // 从localStorage恢复token和用户信息
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // 验证token并获取最新用户信息（關鍵請求，立即執行）
          try {
            const currentUser = await authApi.getMe();
            setUser(currentUser);
            // 只存儲必要的用戶信息，減少存儲大小
            const userForStorage = {
              id: currentUser.id,
              publicId: currentUser.publicId || currentUser.id,
              email: currentUser.email,
              phoneNumber: currentUser.phoneNumber,
              emailVerified: currentUser.emailVerified,
              phoneVerified: currentUser.phoneVerified,
              userName: currentUser.userName,
              avatarUrl: currentUser.avatarUrl,
              role: currentUser.role,
              membershipLevel: currentUser.membershipLevel,
              membershipExpiresAt: currentUser.membershipExpiresAt,
              verificationBadges: currentUser.verificationBadges,
              isVip: currentUser.isVip,
              createdAt: currentUser.createdAt,
              lastLoginAt: currentUser.lastLoginAt,
            };
            safeSetItem('auth_user', JSON.stringify(userForStorage));
            
            // 获取订阅状态（非關鍵，延遲載入）
            setTimeout(async () => {
              try {
                const sub = await subscriptionsApi.getMy();
                setSubscription(sub);
              } catch (error) {
                console.error('Failed to load subscription:', error);
              }
            }, 1000); // 延遲 1 秒載入
          } catch (error) {
            // Token无效，清除
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('auth_user');
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (emailOrPhone: string, password: string, isEmail: boolean) => {
    const credentials = isEmail
      ? { email: emailOrPhone, password }
      : { phoneNumber: emailOrPhone, password };
    
    const response = await authApi.login(credentials);
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    // 只存儲必要的用戶信息，減少存儲大小
    const userForStorage = {
      id: response.user.id,
      publicId: response.user.publicId || response.user.id,
      email: response.user.email,
      phoneNumber: response.user.phoneNumber,
      emailVerified: response.user.emailVerified,
      phoneVerified: response.user.phoneVerified,
      userName: response.user.userName,
      avatarUrl: response.user.avatarUrl,
      role: response.user.role,
      membershipLevel: response.user.membershipLevel,
      membershipExpiresAt: response.user.membershipExpiresAt,
      verificationBadges: response.user.verificationBadges,
      isVip: response.user.isVip,
      createdAt: response.user.createdAt,
      lastLoginAt: response.user.lastLoginAt,
    };
    safeSetItem('auth_user', JSON.stringify(userForStorage));
    
    setUser(response.user);
    
    // 檢測是否為首次登入並顯示歡迎訊息
    if (checkFirstLogin(response.user, false)) {
      // 標記已顯示歡迎訊息
      localStorage.setItem(`welcome_shown_${response.user.id}`, 'true');
      // 延遲顯示，讓登入流程先完成
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 800);
    }
    
    // 获取订阅状态
    try {
      const sub = await subscriptionsApi.getMy();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const register = async (emailOrPhone: string, password: string, isEmail: boolean, role: 'provider' | 'client', age: number) => {
    const data = isEmail
      ? { email: emailOrPhone, password, role, age }
      : { phoneNumber: emailOrPhone, password, role, age };
    
    const response = await authApi.register(data);
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    // 只存儲必要的用戶信息，減少存儲大小
    const userForStorage = {
      id: response.user.id,
      publicId: response.user.publicId || response.user.id,
      email: response.user.email,
      phoneNumber: response.user.phoneNumber,
      emailVerified: response.user.emailVerified,
      phoneVerified: response.user.phoneVerified,
      userName: response.user.userName,
      avatarUrl: response.user.avatarUrl,
      role: response.user.role,
      membershipLevel: response.user.membershipLevel,
      membershipExpiresAt: response.user.membershipExpiresAt,
      verificationBadges: response.user.verificationBadges,
      isVip: response.user.isVip,
      createdAt: response.user.createdAt,
      lastLoginAt: response.user.lastLoginAt,
    };
    safeSetItem('auth_user', JSON.stringify(userForStorage));
    
    setUser(response.user);
    
    // 註冊後立即顯示歡迎訊息（註冊後立即登入視為首次登入）
    localStorage.setItem(`welcome_shown_${response.user.id}`, 'true');
    setTimeout(() => {
      setShowWelcomeModal(true);
    }, 800);
    
    // 获取订阅状态
    try {
      const sub = await subscriptionsApi.getMy();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    
    setUser(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      const previousEmailVerified = user?.emailVerified;
      const previousPhoneVerified = user?.phoneVerified;
      
      setUser(currentUser);
      // 只存儲必要的用戶信息，減少存儲大小
      const userForStorage = {
        id: currentUser.id,
        publicId: currentUser.publicId || currentUser.id,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
        emailVerified: currentUser.emailVerified,
        phoneVerified: currentUser.phoneVerified,
        userName: currentUser.userName,
        avatarUrl: currentUser.avatarUrl,
        role: currentUser.role,
        membershipLevel: currentUser.membershipLevel,
        membershipExpiresAt: currentUser.membershipExpiresAt,
        verificationBadges: currentUser.verificationBadges,
        isVip: currentUser.isVip,
      };
      safeSetItem('auth_user', JSON.stringify(userForStorage));
      
      // 如果驗證狀態發生變化，發送全局事件通知所有組件
      if (previousEmailVerified !== currentUser.emailVerified && currentUser.emailVerified) {
        window.dispatchEvent(new CustomEvent('user-email-verified', {
          detail: { emailVerified: currentUser.emailVerified }
        }));
      }
      if (previousPhoneVerified !== currentUser.phoneVerified && currentUser.phoneVerified) {
        window.dispatchEvent(new CustomEvent('user-phone-verified', {
          detail: { phoneVerified: currentUser.phoneVerified }
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const refreshSubscription = async () => {
    try {
      const sub = await subscriptionsApi.getMy();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const isAuthenticated = !!user;
  const isSubscribed = subscription?.isActive || false;
  
  const userStatus: UserStatus = !user
    ? 'guest'
    : isSubscribed
    ? 'subscribed'
    : 'logged_in';

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        userStatus,
        isAuthenticated,
        isSubscribed,
        showWelcomeModal,
        setShowWelcomeModal,
        login,
        register,
        logout,
        refreshUser,
        refreshSubscription,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

