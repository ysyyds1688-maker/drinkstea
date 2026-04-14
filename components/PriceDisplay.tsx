import React from 'react';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PriceDisplayProps {
  price: number;
  prices?: Profile['prices'];
  type?: 'outcall' | 'incall';
  showWarning?: boolean;
  className?: string;
}

// 判斷是否只有一個價格方案
const hasSinglePrice = (prices?: Profile['prices']): boolean => {
  if (!prices) return true;
  
  const priceKeys = Object.keys(prices).filter(key => 
    prices[key as keyof typeof prices] && 
    typeof prices[key as keyof typeof prices] === 'object' &&
    'price' in (prices[key as keyof typeof prices] as any)
  );
  
  // 如果只有一個價格選項，或兩個價格相同，視為單一價格
  if (priceKeys.length <= 1) return true;
  
  const oneShot = prices.oneShot?.price;
  const twoShot = prices.twoShot?.price;
  
  if (oneShot && twoShot && oneShot === twoShot) return true;
  
  return false;
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  prices,
  type = 'outcall',
  showWarning = true,
  className = ''
}) => {
  const { isAuthenticated, isSubscribed } = useAuth();
  
  // 嚴選好茶：只有VIP用戶才能看到價格
  // 如果未登入，不顯示任何價格資訊（包括「未聯繫客服」）
  if (!isAuthenticated) {
    return null; // 未登入用戶完全不顯示價格
  }
  
  // 如果已登入但未購買VIP，顯示「未聯繫客服」
  if (!isSubscribed) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-baseline gap-2">
          <span className="text-white text-xl font-serif font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            未聯繫客服
          </span>
        </div>
      </div>
    );
  }

  // 判断是否为"私訊詢問"模式
  // 如果 price <= 0 或 prices.oneShot.price <= 0 或 prices.oneShot.price === -1，则显示"私訊詢問"
  const isInquiryOnly = price <= 0 || 
    (prices?.oneShot && (prices.oneShot.price <= 0 || prices.oneShot.price === -1));

  if (isInquiryOnly) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-baseline gap-2">
          <span className="text-white text-xl font-serif font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            私訊詢問
          </span>
        </div>
      </div>
    );
  }

  // 显示实际价格
  const oneShot = prices?.oneShot;
  const twoShot = prices?.twoShot;
  const hasMultiplePrices = oneShot && twoShot && oneShot.price !== twoShot.price;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-end gap-1">
        {hasMultiplePrices ? (
          <>
            <span className="text-white text-xs font-bold opacity-80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              底價起
            </span>
            <span className="text-white text-xl font-serif font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              NT$ {oneShot.price.toLocaleString()}
            </span>
          </>
        ) : (
          <span className="text-white text-xl font-serif font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            NT$ {(oneShot?.price || price).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

