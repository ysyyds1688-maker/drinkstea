import React from 'react';
import { FilterCriteria } from '../types';

interface FilterBarProps {
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const locations = ['全部', '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
  const cups = ['全部', 'B', 'C', 'D', 'E', 'F', 'G+'];
  const nationalities = [
    { label: '全部', value: 'all' },
    { label: '🇹🇼 台灣', value: '🇹🇼' },
    { label: '🇯🇵 日本', value: '🇯🇵' },
    { label: '🇰🇷 韓國', value: '🇰🇷' },
    { label: '🇻🇳 越南', value: '🇻🇳' },
    { label: '🇹🇭 泰國', value: '🇹🇭' },
    { label: '🇨🇳 大陸', value: '🇨🇳' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-y border-gray-100 sticky top-20 z-40 mb-8 py-4 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-6 whitespace-nowrap">
        
        {/* 地區篩選 */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">地區</span>
          <div className="flex gap-2">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setFilters(prev => ({ ...prev, location: loc }))}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  filters.location === loc ? 'bg-brand-yellow text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* 國籍篩選 */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">國籍</span>
          <div className="flex gap-2">
            {nationalities.map(n => (
              <button
                key={n.value}
                onClick={() => setFilters(prev => ({ ...prev, nationalities: n.value === 'all' ? [] : [n.value] }))}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  (n.value === 'all' && filters.nationalities.length === 0) || filters.nationalities.includes(n.value)
                    ? 'bg-brand-yellow text-white shadow-lg shadow-blue-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* 罩杯篩選 */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">罩杯</span>
          <div className="flex gap-2">
            {cups.map(c => (
              <button
                key={c}
                onClick={() => setFilters(prev => ({ ...prev, cup: c === '全部' ? [] : [c] }))}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  (c === '全部' && filters.cup.length === 0) || filters.cup.includes(c)
                    ? 'bg-brand-yellow text-white shadow-lg shadow-blue-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};