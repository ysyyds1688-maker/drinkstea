import React from 'react';
import { FilterCriteria } from '../types';

interface SidebarFilterProps {
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  totalCount: number;
  onResetFilters: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({ filters, setFilters, totalCount, onResetFilters }) => {
  const locations = ['全部', '台北市', '新北市', '基隆市', '桃園市', '新竹市', '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣'];
  const cups = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G+'];
  const nationalities = [
    { label: '全部', value: '全部' },
    { label: '台灣', value: '🇹🇼' },
    { label: '日本', value: '🇯🇵' },
    { label: '韓國', value: '🇰🇷' },
    { label: '香港', value: '🇭🇰' },
    { label: '中國', value: '🇨🇳' },
    { label: '泰國', value: '🇹🇭' },
    { label: '越南', value: '🇻🇳' },
    { label: '馬來西亞', value: '🇲🇾' },
    { label: '新加坡', value: '🇸🇬' },
  ];
  
  const bodyTypes = ['全部', '纖細', '勻稱', '肉感', '豐滿', '模特兒', '長腿'];
  const personalities = ['全部', '氣質', '鄰家', '性感', '溫柔', '活潑', '御姐', '學生'];
  
  const ages = [
    { label: '全部', value: [18, 80] },
    { label: '18-22歲', value: [18, 22] },
    { label: '23-27歲', value: [23, 27] },
    { label: '28-32歲', value: [28, 32] },
    { label: '33歲+', value: [33, 80] },
  ];

  const updateFilters = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleNationality = (val: string) => {
    if (val === '全部') {
      updateFilters('nationalities', []);
      return;
    }
    const current = [...(filters.nationalities || [])];
    const index = current.indexOf(val);
    if (index > -1) current.splice(index, 1);
    else current.push(val);
    updateFilters('nationalities', current);
  };

  const toggleArrayFilter = (key: 'bodyTypes' | 'personalities', val: string) => {
    if (val === '全部') {
      updateFilters(key, []);
      return;
    }
    const current = [...(filters[key] || [])];
    const index = current.indexOf(val);
    if (index > -1) current.splice(index, 1);
    else current.push(val);
    updateFilters(key, current);
  };

  return (
    <aside className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="space-y-6">
          
          {/* 地區 — 多選（逗號分隔） */}
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">地區位置（可複選）</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map(loc => {
                const selected = loc === '全部'
                  ? (filters.location === '全部' || !filters.location)
                  : (filters.location || '').split(',').includes(loc);
                return (
                <button
                  key={loc}
                  onClick={() => {
                    if (loc === '全部') { updateFilters('location', '全部'); return; }
                    const current = (filters.location && filters.location !== '全部') ? filters.location.split(',') : [];
                    const idx = current.indexOf(loc);
                    if (idx > -1) current.splice(idx, 1);
                    else current.push(loc);
                    updateFilters('location', current.length ? current.join(',') : '全部');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selected
                    ? 'text-white shadow-md'
                    : 'bg-white border-gray-100 text-gray-500'
                  }`}
                  style={selected ? {
                    backgroundColor: '#1a5f3f',
                    borderColor: '#1a5f3f'
                  } : {
                    borderColor: 'rgba(26, 95, 63, 0.2)'
                  }}
                >
                  {loc}
                </button>
              );
              })}
            </div>
          </section>

          {/* 國籍 */}
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">國家 / 國籍</h3>
            <div className="flex flex-wrap gap-2">
              {nationalities.map(n => (
                <button
                  key={n.value}
                  onClick={() => toggleNationality(n.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    (n.value === '全部' && filters.nationalities.length === 0) || filters.nationalities.includes(n.value)
                      ? 'bg-brand-black border-brand-black text-white'
                      : 'bg-white border-gray-100 text-gray-500'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </section>

          {/* 年齡區間 */}
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">年齡層</h3>
            <div className="grid grid-cols-2 gap-2">
              {ages.map(a => (
                <button
                  key={a.label}
                  onClick={() => updateFilters('ageRange', a.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    JSON.stringify(filters.ageRange) === JSON.stringify(a.value)
                    ? 'bg-brand-black border-brand-black text-white shadow-md' 
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          {/* 預算控制 */}
          <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">預算上限</h3>
                <span className="text-sm font-black text-brand-yellow font-serif" style={{ color: '#1a5f3f' }}>
                  {filters.priceRange[1] >= 100000 
                    ? `$ ${(filters.priceRange[1] / 1000).toFixed(0)}K+` 
                    : `$ ${filters.priceRange[1].toLocaleString()}`}
                </span>
            </div>
            <div className="relative pt-1">
              <input 
                  type="range" 
                  min="3000" 
                  max="200000" 
                  step="5000"
                  value={Math.min(filters.priceRange[1], 200000)}
                  onChange={(e) => updateFilters('priceRange', [0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#1a5f3f' }}
              />
              <div className="flex justify-between text-[10px] font-bold text-gray-300 mt-3">
                  <span>$3K</span>
                  <span>$50K</span>
                  <span>$100K+</span>
              </div>
            </div>
          </section>


          {/* 罩杯大小 */}
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">胸圍大小</h3>
            <div className="grid grid-cols-4 gap-2">
              {cups.map(c => (
                <button
                  key={c}
                  onClick={() => {
                      if (c === '全部') updateFilters('cup', []);
                      else updateFilters('cup', [c]);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    (c === '全部' && filters.cup.length === 0) || filters.cup.includes(c)
                      ? 'text-white'
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                  style={((c === '全部' && filters.cup.length === 0) || filters.cup.includes(c)) ? {
                    backgroundColor: '#1a5f3f',
                    borderColor: '#1a5f3f'
                  } : {
                    borderColor: 'rgba(26, 95, 63, 0.2)'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-6">
            <button 
              onClick={onResetFilters}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black tracking-[0.3em] hover:bg-brand-yellow transition-all shadow-xl shadow-gray-200 premium-button"
              style={{
                background: 'linear-gradient(135deg, #1a5f3f 0%, #15803d 100%)'
              }}
            >
              重置所有篩選
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};