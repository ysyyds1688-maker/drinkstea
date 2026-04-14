import React from 'react';
import { MembershipLevel, CLIENT_LEVEL_NAMES } from '../types';
import { getMaxReviewCount, getPremiumTeaBookingLimit, canJoinVipGroup } from '../utils/membershipBenefits';

interface MembershipBenefitsInfoProps {
  userLevel?: MembershipLevel;
  isVip: boolean;
  onSubscribeClick?: () => void;
}

export const MembershipBenefitsInfo: React.FC<MembershipBenefitsInfoProps> = ({
  userLevel,
  isVip,
  onSubscribeClick,
}) => {
  // 計算當前等級的權益
  const currentPremiumTeaReviewCount = getMaxReviewCount(userLevel, isVip, true);
  const currentFishMarketReviewCount = getMaxReviewCount(userLevel, isVip, false);
  const currentBookingLimit = getPremiumTeaBookingLimit(userLevel, isVip);
  const canJoinVip = canJoinVipGroup(userLevel);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
      <h3 className="text-xl font-serif font-black text-purple-900 mb-4">會員等級權益說明</h3>
      
      <div className="space-y-4">
        {/* 當前等級 */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">當前等級</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
              {userLevel ? CLIENT_LEVEL_NAMES[userLevel] : '未設定'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">VIP狀態</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              isVip ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isVip ? 'VIP會員' : '未購買VIP'}
            </span>
          </div>
        </div>

        {/* 評論查看權益 */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="text-sm font-bold text-gray-900 mb-3">評論查看權益</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">嚴選好茶評論</span>
              <span className="font-semibold text-gray-900">
                {currentPremiumTeaReviewCount === -1 
                  ? '全部' 
                  : `${currentPremiumTeaReviewCount} 則`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">特選魚市評論</span>
              <span className="font-semibold text-gray-900">
                {currentFishMarketReviewCount === -1 
                  ? '全部' 
                  : `${currentFishMarketReviewCount} 則`}
              </span>
            </div>
            {!isVip && (
              <p className="text-xs text-purple-600 mt-2">
                💡 購買VIP會員可查看全部評論
              </p>
            )}
          </div>
        </div>

        {/* 預約次數權益 */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h4 className="text-sm font-bold text-gray-900 mb-3">嚴選好茶預約次數（每月）</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">當前上限</span>
              <span className="font-semibold text-gray-900">{currentBookingLimit} 次</span>
            </div>
            {!isVip && (
              <p className="text-xs text-purple-600 mt-2">
                💡 購買VIP會員並升級等級可增加每月預約次數上限
              </p>
            )}
            {isVip && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">等級權益（需VIP+升級）：</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 茶客/入門茶士（1-2級）：3次</li>
                  <li>• 御前茶士（3級）：4次</li>
                  <li>• 御用茶官（4級）：5次</li>
                  <li>• 之後每升級+1次</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* VIP群組 */}
        {canJoinVip && isVip ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
            <h4 className="text-sm font-bold text-yellow-900 mb-2">✨ VIP群組資格</h4>
            <p className="text-xs text-yellow-700">
              您已達到「御前總茶官」等級，可以加入VIP群組，享受預約嚴選好茶的優先權等更多福利！
            </p>
          </div>
        ) : canJoinVip && !isVip ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-2">VIP群組資格</h4>
            <p className="text-xs text-gray-600 mb-2">
              您已達到「御前總茶官」等級，購買VIP會員即可加入VIP群組！
            </p>
            {onSubscribeClick && (
              <button
                onClick={onSubscribeClick}
                className="w-full mt-2 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
              >
                立即購買VIP
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-2">VIP群組資格</h4>
            <p className="text-xs text-gray-600">
              達到「御前總茶官」等級並購買VIP會員即可加入VIP群組，享受預約嚴選好茶的優先權等更多福利。
            </p>
          </div>
        )}

        {/* 升級提示 */}
        {!isVip && (
          <div className="bg-purple-100 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-800 text-center mb-2">
              <strong>💎 購買VIP會員解鎖更多權益</strong>
            </p>
            {onSubscribeClick && (
              <button
                onClick={onSubscribeClick}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                立即購買VIP
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};




