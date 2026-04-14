
export enum AnalysisMode {
  PERSONALITY = 'PERSONALITY',
  LOVE_MATCH = 'LOVE_MATCH',
  FUTURE_LUCK = 'FUTURE_LUCK'
}

export interface ChartDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

export interface AnalysisResult {
  score: number;
  title: string;
  description: string;
  luckyColor: string;
  luckyItem: string;
  keywords: string[];
  stats: ChartDataPoint[];
  poem: string;
}

export interface UserInput {
  name1: string;
  name2?: string;
  mode: AnalysisMode;
  gender1?: string;
  gender2?: string;
}

export interface Album {
  category: string;
  images: string[];
}

export interface Profile {
  id: string;
  userId?: string; // 關聯的用戶ID，如果為空則表示是後台管理員上架的
  name: string;
  nationality: string;
  age: number;
  height: number;
  weight: number;
  cup: string;
  location: string;
  district?: string; // 新增：行政區 (例如：大安區)
  type: 'outcall' | 'incall';
  imageUrl: string;
  gallery: string[];
  albums: Album[];
  
  price: number;
  prices: {
    oneShot?: { price: number; desc: string };
    twoShot?: { price: number; desc: string };
    threeShot?: { price: number; desc: string };
    overnight?: { price: number; desc: string }; // 過夜
    dating?: { price: number; desc: string }; // 約會
    escort?: { price: number; desc: string }; // 伴遊
    [key: string]: { price: number; desc: string } | undefined; // 允許其他自定義服務類型
  };

  tags: string[];
  basicServices: string[];
  addonServices: string[];
  
  // 聯絡方式
  contactInfo?: {
    line?: string;
    phone?: string;
    email?: string;
    telegram?: string;
    // 社群帳號（動態對象，key為平台名稱，value為帳號/連結）
    socialAccounts?: {
      [platform: string]: string;
    };
    // 首选联系方式
    preferredMethod?: 'line' | 'phone' | 'email' | 'telegram';
    // 联系说明
    contactInstructions?: string;
  };
  
  // 備註
  remarks?: string;
  
  // 作品影片（僅嚴選好茶）
  videos?: Array<{
    url: string;
    code?: string;     // 番号
    title?: string;    // 影片标题
    thumbnail?: string; // 缩略图URL
  }>;
  
  // 預約流程說明（僅特選鮮魚）
  bookingProcess?: string;
  
  isNew?: boolean;
  isAvailable?: boolean;

  availableTimes: {
    today: string;
    tomorrow: string;
  };
  
  views?: number; // 瀏覽次數
  contactCount?: number; // 聯繫客服次數
  // Provider 相關資訊（僅特選魚市）
  isVip?: boolean; // Provider 是否為 VIP
  providerEmailVerified?: boolean; // Provider 的 Email 驗證狀態
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  tag: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  tag: string;
  date: string;
  views: number;
  content?: string;
}

export interface FilterCriteria {
  type: 'all' | 'outcall' | 'incall';
  location: string;
  nationalities: string[];
  bodyTypes: string[];
  personalities: string[];
  ageRange: [number, number];
  priceRange: [number, number];
  cup: string[];
}

export type UserStatus = 'guest' | 'logged_in' | 'subscribed';

export type MembershipLevel = 'tea_guest' | 'tea_scholar' | 'royal_tea_scholar' | 'royal_tea_officer' | 'tea_king_attendant' | 'imperial_chief_tea_officer' | 'tea_king_confidant' | 'tea_king_personal_selection' | 'imperial_golden_seal_tea_officer' | 'national_master_tea_officer';

export type LadyMembershipLevel = 'lady_trainee' | 'lady_apprentice' | 'lady_junior' | 'lady_senior' | 'lady_expert' | 'lady_master' | 'lady_elite' | 'lady_premium' | 'lady_royal' | 'lady_empress';

export type AnyMembershipLevel = MembershipLevel | LadyMembershipLevel;

// 品茶客等級中文名稱映射
export const CLIENT_LEVEL_NAMES: Record<MembershipLevel, string> = {
  tea_guest: '茶客',
  tea_scholar: '入門茶士',
  royal_tea_scholar: '御前茶士',
  royal_tea_officer: '御用茶官',
  tea_king_attendant: '茶王近侍',
  imperial_chief_tea_officer: '御前總茶官',
  tea_king_confidant: '茶王心腹',
  tea_king_personal_selection: '茶王親選',
  imperial_golden_seal_tea_officer: '御賜金印茶官',
  national_master_tea_officer: '國師級茶官',
};

// 後宮佳麗等級中文名稱映射
export const LADY_LEVEL_NAMES: Record<LadyMembershipLevel, string> = {
  lady_trainee: '初級佳麗',
  lady_apprentice: '見習佳麗',
  lady_junior: '中級佳麗',
  lady_senior: '高級佳麗',
  lady_expert: '資深佳麗',
  lady_master: '御用佳麗',
  lady_elite: '金牌佳麗',
  lady_premium: '鑽石佳麗',
  lady_royal: '皇家佳麗',
  lady_empress: '皇后級佳麗',
};

// 保持向後兼容
export const LEVEL_NAMES = CLIENT_LEVEL_NAMES;

// 根據等級獲取名稱（支援兩種等級系統）
export const getLevelName = (level: AnyMembershipLevel): string => {
  if (level in LADY_LEVEL_NAMES) {
    return LADY_LEVEL_NAMES[level as LadyMembershipLevel];
  }
  return CLIENT_LEVEL_NAMES[level as MembershipLevel] || level;
};

export type VerificationBadge = 'email_verified' | 'phone_verified';

export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  userName?: string;
  avatarUrl?: string;
  role: 'provider' | 'client' | 'admin';
  membershipLevel: AnyMembershipLevel;
  membershipExpiresAt?: string;
  verificationBadges?: VerificationBadge[];
  nicknameChangedAt?: string; // 暱稱最後修改時間
  nicknameChangeCount?: number; // 暱稱修改次數（從第一次修改開始計算）
  isVip?: boolean; // 是否有活躍的付費訂閱（VIP狀態）
  bookingCancellationCount?: number; // 預約取消次數
  noShowCount?: number; // 放鳥次數
  violationLevel?: number; // 違規級別
  warningBadge?: boolean; // 警示戶頭標記
  noShowBadge?: boolean; // 放鳥標記徽章
  // 佳麗檢舉相關欄位
  providerReportCount?: number; // 被檢舉次數
  providerScamReportCount?: number; // 詐騙檢舉次數
  providerNotRealPersonCount?: number; // 非本人檢舉次數
  providerFakeProfileCount?: number; // 假檔案檢舉次數
  providerViolationLevel?: number; // 違規級別（0-4）
  providerWarningBadge?: boolean; // 警示標記
  providerFrozen?: boolean; // 是否被凍結
  providerFrozenAt?: string; // 凍結時間
  providerAutoUnfreezeAt?: string; // 自動解凍時間
  publicId?: string; // 公開 ID
  createdAt?: string; // 註冊時間
  lastLoginAt?: string; // 最後登入時間
  telegramUserId?: string; // Telegram ID
  telegramUsername?: string; // Telegram 用戶名
}

export interface UserStats {
  userId: string;
  totalPoints: number;
  currentPoints: number;
  experiencePoints: number;
  level: number;
  postsCount: number;
  repliesCount: number;
  likesReceived: number;
  premiumTeaBookingsCount?: number;
  ladyBookingsCount?: number;
  repeatLadyBookingsCount?: number;
  consecutiveLoginDays?: number;
  lastLoginDate?: string | null;
  // 後宮佳麗專屬統計字段
  completedBookingsCount?: number;
  acceptedBookingsCount?: number;
  fiveStarReviewsCount?: number;
  fourStarReviewsCount?: number;
  totalReviewsCount?: number;
  averageRating?: number;
  repeatClientBookingsCount?: number;
  uniqueReturningClientsCount?: number;
  cancellationRate?: number;
  averageResponseTime?: number;
  consecutiveCompletedBookings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsResponse {
  stats: UserStats;
  currentLevel: AnyMembershipLevel;
  nextLevel: string | null;
  experienceNeeded: number;
  progress: number;
  isVip: boolean;
  vipSubscription: Subscription | null;
}

export interface ForumPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  images?: string[]; // 圖片 URL 數組
  videos?: string[]; // 影片 URL 數組
  views: number;
  likesCount: number;
  repliesCount: number;
  favoritesCount?: number; // 收藏數
  isPinned: boolean;
  isLocked: boolean;
  isFeatured?: boolean; // 是否為精華帖
  relatedProfileId?: string; // 關聯的 Profile ID
  relatedReviewId?: string; // 關聯的 Review ID
  createdAt: string;
  updatedAt: string;
  userName?: string;
  avatarUrl?: string;
  membershipLevel?: MembershipLevel;
  isVip?: boolean;
  userRole?: 'client' | 'provider' | 'admin'; // 用戶角色
  relatedProfileName?: string; // 關聯的 Profile 名稱（用於顯示）
  verificationBadges?: VerificationBadge[]; // 驗證勳章
  emailVerified?: boolean; // Email 驗證狀態
  phoneVerified?: boolean; // 手機號碼驗證狀態
}

export interface ForumReply {
  id: string;
  postId: string;
  userId: string;
  parentReplyId?: string;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  avatarUrl?: string;
  membershipLevel?: MembershipLevel;
  isVip?: boolean;
  userRole?: 'client' | 'provider' | 'admin'; // 用戶角色
  verificationBadges?: VerificationBadge[]; // 驗證勳章
  emailVerified?: boolean; // Email 驗證狀態
  phoneVerified?: boolean; // 手機號碼驗證狀態
  warningBadge?: boolean; // 警示戶頭標記
  noShowBadge?: boolean; // 放鳥標記徽章
  violationLevel?: number; // 違規級別
  replies?: ForumReply[];
}

export type BadgeUnlockType = 'purchasable' | 'auto_unlock' | 'admin_granted';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsCost: number;
  category: string;
  unlockType?: BadgeUnlockType; // 解鎖類型（可選，向後兼容）
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
  pointsCost: number;
  unlockedAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  achievementName: string;
  pointsEarned: number;
  experienceEarned: number;
  unlockedAt: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskType: string;
  taskDate: string;
  isCompleted: boolean;
  progress: number;
  target: number;
  pointsEarned: number;
  createdAt: string;
  name?: string;
  description?: string;
  pointsReward?: number;
  experienceReward?: number;
}

export interface LoginCredentials {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phoneNumber?: string;
  password: string;
  userName?: string;
  role?: 'provider' | 'client';
  age: number;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  replyType: 'provider' | 'admin';
  authorId?: string;
  content: string;
  createdAt: string;
}

export interface Review {
  id: string;
  profileId?: string;
  clientId: string;
  clientName?: string;
  clientAvatarUrl?: string;
  clientEmailVerified?: boolean; // 評論者 Email 驗證狀態
  targetUserId?: string; // 被評論的用戶ID（當 reviewType = 'client' 時）
  reviewType?: 'profile' | 'client'; // 評論類型：'profile' = 茶客評論佳麗, 'client' = 佳麗評論茶客
  rating: number;
  comment: string;
  serviceType?: string;
  bookingId?: string; // 關聯的預約ID
  isVerified: boolean;
  isVisible: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
  replies?: ReviewReply[];
  userLiked?: boolean;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  visibleCount: number;
  maxReviewCount?: number; // 根據等級和VIP狀態的最大評論數量（-1表示全部）
  userStatus: UserStatus;
  canSeeAll: boolean;
  isVip?: boolean; // 是否為VIP
  userLevel?: MembershipLevel; // 用戶等級
  averageRating: number;
}

export interface Subscription {
  id: string;
  userId: string;
  membershipLevel: MembershipLevel;
  startedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionStatus {
  membershipLevel: MembershipLevel;
  membershipExpiresAt?: string;
  verificationBadges: VerificationBadge[];
  isActive: boolean;
  activeSubscription: Subscription | null;
}

export interface MembershipBenefits {
  level: MembershipLevel;
  benefits: string[];
}

export interface SubscriptionHistory {
  history: Subscription[];
}

export interface Favorite {
  id: string;
  clientId: string;
  profileId: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  providerId?: string;
  clientId: string;
  profileId: string;
  serviceType?: string;
  bookingDate: string;
  bookingTime: string;
  location?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  clientReviewed?: boolean;
  providerReviewed?: boolean;
  noShow?: boolean; // 是否被回報為放鳥
  createdAt: string;
  updatedAt: string;
  // 扩展字段（从 API 返回时可能包含）
  providerContactInfo?: Profile['contactInfo'];
  clientContactInfo?: {
    phone?: string;
    email?: string;
  };
}
