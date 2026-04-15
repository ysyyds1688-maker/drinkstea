import React from 'react';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PriceInfoProps {
  profile: Profile;
}

export const PriceInfo: React.FC<PriceInfoProps> = ({ profile }) => {
  const { price, prices, addonServices } = profile;
  const hasAddonServices = addonServices && addonServices.length > 0;

  // 判断是否为"私訊詢問"模式
  const isInquiryOnly = price <= 0 ||
    (prices?.oneShot && (prices.oneShot.price <= 0 || prices.oneShot.price === -1));

  // 收集所有價格層級
  const allTiers = [
    prices?.oneShot,
    prices?.twoShot,
    prices?.threeShot,
    prices?.fourShot,
    prices?.fiveShot,
    prices?.sixShot,
  ].filter(t => t && t.price > 0);

  return (
    <div className="mb-10 p-6 rounded-2xl" style={{
      border: '1px solid rgba(26, 95, 63, 0.15)',
      boxShadow: '0 4px 6px -1px rgba(26, 95, 63, 0.1), 0 2px 4px -1px rgba(26, 95, 63, 0.06)'
    }}>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-serif font-bold text-brand-black">服務價格</h3>
        <span className="text-xs font-black tracking-widest" style={{ color: '#1a5f3f' }}>* 現金交易 / 安全隱私</span>
      </div>

      {isInquiryOnly ? (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">詳細價格請聯繫客服詢問</p>
          <a
            href="https://lin.ee/yxB700g"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: '#1a5f3f' }}
          >
            聯繫客服詢價
          </a>
        </div>
      ) : allTiers.length > 0 ? (
        <div className="space-y-2">
          {allTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center px-4 py-3 rounded-xl ${
                idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">{tier!.desc}</span>
              <span className={`text-lg font-black ${idx === 0 ? 'text-green-700' : 'text-brand-black'}`}>
                ${tier!.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-3xl font-serif font-black text-brand-black">
            NT$ {price.toLocaleString()}
          </p>
        </div>
      )}

      {hasAddonServices && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            添加配料價格請在預約時與客服確認
          </p>
        </div>
      )}
    </div>
  );
};
