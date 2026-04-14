import React, { useState } from 'react';
import { AnalysisMode, UserInput } from '../types';
import { MODE_CONFIG } from '../constants';

interface AnalysisFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, isLoading }) => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.PERSONALITY);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [gender1, setGender1] = useState('secret');
  const [gender2, setGender2] = useState('secret');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim()) return;
    if (MODE_CONFIG[mode].requiresTwoNames && !name2.trim()) return;
    
    onSubmit({
      name1,
      name2: MODE_CONFIG[mode].requiresTwoNames ? name2 : undefined,
      mode,
      gender1,
      gender2: MODE_CONFIG[mode].requiresTwoNames ? gender2 : undefined
    });
  };

  return (
    <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-4 border-white/50">
      <h2 className="text-3xl font-black text-center text-fun-600 mb-6 drop-shadow-sm">
        ✨ 開始分析 ✨
      </h2>
      
      {/* Mode Selection */}
      <div className="flex justify-center gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl">
        {Object.values(AnalysisMode).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all duration-300 ${
              mode === m 
                ? 'bg-white text-fun-600 shadow-md transform scale-105' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {MODE_CONFIG[m].icon} {MODE_CONFIG[m].label.substring(0, 4)}
          </button>
        ))}
      </div>

      <div className="mb-6 text-center text-gray-600 italic text-sm bg-fun-50 p-3 rounded-lg border border-fun-100">
        {MODE_CONFIG[mode].description}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name 1 */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-bold ml-1">
            {mode === AnalysisMode.LOVE_MATCH ? '你的名字' : '請輸入名字'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-fun-400 focus:ring-4 focus:ring-fun-100 outline-none transition-all text-lg"
              placeholder="王小明"
              required
            />
            <select 
              value={gender1}
              onChange={(e) => setGender1(e.target.value)}
              className="px-3 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 outline-none focus:border-fun-400"
            >
              <option value="secret">秘密</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        {/* Name 2 (Conditional) */}
        {MODE_CONFIG[mode].requiresTwoNames && (
          <div className="space-y-2 animate-fade-in-up">
            <label className="block text-gray-700 font-bold ml-1">對方的名字</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-fun-400 focus:ring-4 focus:ring-fun-100 outline-none transition-all text-lg"
                placeholder="林小美"
                required
              />
               <select 
                value={gender2}
                onChange={(e) => setGender2(e.target.value)}
                className="px-3 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 outline-none focus:border-fun-400"
              >
                <option value="secret">秘密</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl text-white font-black text-xl tracking-wider shadow-lg transform transition-all hover:scale-[1.02] active:scale-95 ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-fun-500 to-orange-400 hover:shadow-fun-300/50'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI 運算中...
            </span>
          ) : (
            '🔮 馬上揭曉'
          )}
        </button>
      </form>
    </div>
  );
};
