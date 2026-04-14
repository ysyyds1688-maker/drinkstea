import React, { useState } from 'react';
import { MembershipLevel, LadyMembershipLevel, AnyMembershipLevel, getLevelName, CLIENT_LEVEL_NAMES, LADY_LEVEL_NAMES } from '../types';
import { MembershipBadge } from './MembershipBadge';
import { useAuth } from '../contexts/AuthContext';

interface PointsDisplayProps {
  currentPoints: number;
  experiencePoints: number;
  currentLevel: AnyMembershipLevel;
  nextLevel: string | null;
  experienceNeeded: number;
  progress: number;
}

// 會員等級權益定義
const membershipBenefits: Record<MembershipLevel, string[]> = {
  tea_guest: ['基本功能'],
  tea_scholar: ['基本功能', '解鎖部分內容'],
  royal_tea_scholar: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤'],
  royal_tea_officer: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章'],
  tea_king_attendant: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章'],
  imperial_chief_tea_officer: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章', '御前特權'],
  tea_king_confidant: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章', '御前特權', '心腹特權'],
  tea_king_personal_selection: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章', '御前特權', '心腹特權', '茶王親選', '獨家內容'],
  imperial_golden_seal_tea_officer: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章', '御前特權', '心腹特權', '茶王親選', '獨家內容', '金印特權', '尊貴服務'],
  national_master_tea_officer: ['基本功能', '解鎖部分內容', '更多內容', '專屬標籤', '專屬徽章', '御前特權', '心腹特權', '茶王親選', '獨家內容', '金印特權', '尊貴服務', '國師級特權', '至尊服務', '無限權限'],
};

// 品茶客等級門檻值
const CLIENT_LEVEL_THRESHOLDS: Record<MembershipLevel, number> = {
  tea_guest: 0,
  tea_scholar: 100,
  royal_tea_scholar: 500,
  royal_tea_officer: 2000,
  tea_king_attendant: 10000,
  imperial_chief_tea_officer: 50000,
  tea_king_confidant: 100000,
  tea_king_personal_selection: 200000,
  imperial_golden_seal_tea_officer: 500000,
  national_master_tea_officer: 1000000,
};

// 後宮佳麗等級門檻值
const LADY_LEVEL_THRESHOLDS: Record<LadyMembershipLevel, number> = {
  lady_trainee: 0,
  lady_apprentice: 100,
  lady_junior: 500,
  lady_senior: 2000,
  lady_expert: 10000,
  lady_master: 50000,
  lady_elite: 100000,
  lady_premium: 200000,
  lady_royal: 500000,
  lady_empress: 1000000,
};

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  currentPoints,
  experiencePoints,
  currentLevel,
  nextLevel,
  experienceNeeded,
  progress,
}) => {
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';

  // 根據角色生成等級說明列表
  const getLevelList = () => {
    if (isProvider) {
      // 後宮佳麗等級
      return Object.entries(LADY_LEVEL_NAMES).map(([level, name]) => ({
        level: level as LadyMembershipLevel,
        name,
        threshold: LADY_LEVEL_THRESHOLDS[level as LadyMembershipLevel],
      }));
    } else {
      // 品茶客等級
      return Object.entries(CLIENT_LEVEL_NAMES).map(([level, name]) => ({
        level: level as MembershipLevel,
        name,
        threshold: CLIENT_LEVEL_THRESHOLDS[level as MembershipLevel],
      }));
    }
  };

  const levelList = getLevelList();

  return (
    <div className="space-y-4">
      {/* 當前等級 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">當前等級</h3>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <MembershipBadge level={currentLevel as any} size="lg" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">當前經驗值</span>
              <span className="text-xl font-bold text-purple-600">{experiencePoints.toLocaleString()}</span>
            </div>
            {nextLevel && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">距離下一級</span>
                  <span className="font-medium text-purple-600">還需 {experienceNeeded.toLocaleString()} 經驗值</span>
                </div>
              </>
            )}
            {!nextLevel && (
              <p className="text-sm text-gray-500">已達到最高等級！</p>
            )}
          </div>
        </div>
      </div>

      {/* 積分和經驗值 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 積分卡片 */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">當前積分</p>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">用於兌換勳章</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-3">{currentPoints.toLocaleString()}</p>
          {/* 積分進度條（可選：顯示積分累積進度，例如每100積分一個里程碑） */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPoints % 100) / 100) * 100}%` }}
              title={`距離下一個100積分里程碑：${100 - (currentPoints % 100)} 積分`}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">累積積分：{currentPoints.toLocaleString()}</p>
        </div>

        {/* 經驗值卡片 */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">當前經驗值</p>
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">用於升級等級</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mb-3">{experiencePoints.toLocaleString()}</p>
          {/* 經驗值進度條（顯示到下一級的進度） */}
          {nextLevel ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">距離下一級：{experienceNeeded.toLocaleString()} 經驗值</p>
            </>
          ) : (
            <p className="text-xs text-gray-500">已達到最高等級！</p>
          )}
        </div>
      </div>

      {/* 等級說明 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">等級說明</h3>
          {!isProvider && (
            <button
              onClick={() => setShowBenefitsModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              查看等級權益
            </button>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {levelList.map(({ level, name, threshold }) => (
            <div key={level} className="flex justify-between">
              <span>{name}</span>
              <span className="text-gray-500">{threshold.toLocaleString()} 經驗值</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>說明：</strong>積分用於兌換勳章，經驗值用於升級會員等級</span>
          </p>
        </div>
      </div>

      {/* 等級權益彈窗 */}
      {showBenefitsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBenefitsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-brand-green to-green-700 text-white p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">會員等級權益說明</h2>
                <button
                  onClick={() => setShowBenefitsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {(Object.keys(membershipBenefits) as MembershipLevel[]).map((level) => (
                  <div key={level} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4">
                      <MembershipBadge level={level} size="md" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{getLevelName(level as AnyMembershipLevel)}</h3>
                        <p className="text-sm text-gray-500">
                          {isProvider 
                            ? LADY_LEVEL_THRESHOLDS[level as LadyMembershipLevel]?.toLocaleString() || '0'
                            : CLIENT_LEVEL_THRESHOLDS[level as MembershipLevel]?.toLocaleString() || '0'
                          } 經驗值
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {membershipBenefits[level].map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                <p className="text-sm text-blue-800 font-bold">
                  💡 會員等級權益說明：
                </p>
                <div className="text-xs text-blue-800 space-y-2">
                  <div>
                    <strong>嚴選好茶約會次數：</strong>每個帳號每月最多3次。購買VIP後，根據會員等級可增加次數上限（御前茶士3級：4次，御用茶官4級：5次，之後每級+1次）。未購買VIP即使升級也不增加次數。
                  </div>
                  <div>
                    <strong>特選魚市約會次數：</strong>無限制，但需遵守平台規則。
                  </div>
                  <div>
                    <strong>評論查看權益：</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 嚴選好茶：1級1則，2級2則，3級3則，4級4則，5級5則，6級6則。購買VIP可查看全部評論。</li>
                      <li>• 特選魚市：1級1則，2級2則，3級3則，4級4則，5級5則，6級10則。購買VIP可查看全部評論。</li>
                    </ul>
                  </div>
                  <div>
                    <strong>收藏夾（私藏好茶）規則：</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 預設：嚴選好茶2位、特選魚市2位</li>
                      <li>• 升級到御用茶官（4級）開始依序增加：4級各3位，5級各4位，6級各5位，之後每級+1位</li>
                      <li>• 如果購買VIP但在御用茶官等級前，預設數量為各5個（嚴選好茶和特選魚市）</li>
                      <li>• 購買VIP後收藏夾無限制</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-blue-300">
                    <p className="text-xs text-blue-700">
                      會員等級可以通過完成任務獲得經驗值免費升級，也可以選擇付費訂閱立即獲得等級權益。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;

