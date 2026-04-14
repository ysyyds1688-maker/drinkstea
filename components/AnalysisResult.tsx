import React from 'react';
import { AnalysisResult } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface AnalysisResultProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const AnalysisResultDisplay: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  return (
    <div className="w-full max-w-2xl animate-fade-in-up">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border-4 border-white/50">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-fun-500 to-orange-400 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <h2 className="text-4xl font-black mb-2 drop-shadow-md relative z-10">{result.title}</h2>
          <div className="flex justify-center items-center gap-2 mt-4 relative z-10">
            {result.keywords.map((kw, idx) => (
              <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-white/30">
                #{kw}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left: Score & Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                 {/* Circular Score Background */}
                 <div className="absolute inset-0 rounded-full border-[12px] border-fun-100"></div>
                 {/* This would ideally be a proper progress circle, simplified here for code brevity */}
                 <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                   <circle 
                     cx="50" cy="50" r="44" 
                     fill="transparent" 
                     stroke="#ff5c91" 
                     strokeWidth="12"
                     strokeDasharray={`${result.score * 2.76} 276`}
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-5xl font-black text-fun-600">{result.score}</span>
                   <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Score</span>
                 </div>
              </div>

              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.stats}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Stats"
                      dataKey="A"
                      stroke="#ff2e6c"
                      strokeWidth={2}
                      fill="#ff2e6c"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="space-y-6">
              <div className="bg-fun-50 p-4 rounded-2xl border border-fun-100">
                <h3 className="text-fun-800 font-bold mb-2 flex items-center">
                  <span className="text-xl mr-2">📜</span> 分析報告
                </h3>
                <p className="text-gray-700 leading-relaxed text-justify">
                  {result.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-center">
                  <span className="block text-xs text-yellow-600 font-bold uppercase mb-1">幸運色</span>
                  <span className="font-bold text-gray-800">{result.luckyColor}</span>
                  <div className="w-6 h-6 rounded-full mx-auto mt-2 border border-gray-200 shadow-sm" style={{ backgroundColor: result.luckyColor === '透明' ? 'white' : result.luckyColor }}></div>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                  <span className="block text-xs text-purple-600 font-bold uppercase mb-1">幸運物</span>
                  <span className="font-bold text-gray-800">{result.luckyItem}</span>
                  <span className="block text-xl mt-1">🎁</span>
                </div>
              </div>
            </div>
          </div>

          {/* Poem Section */}
          <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl text-center relative overflow-hidden shadow-inner">
             <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-fun-500 rounded-full filter blur-[50px] opacity-30"></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-blue-500 rounded-full filter blur-[50px] opacity-30"></div>
             <h4 className="text-sm text-gray-400 font-bold tracking-[0.2em] mb-3 uppercase">AI 命運詩籤</h4>
             <p className="whitespace-pre-line font-serif text-lg leading-loose italic relative z-10">
               {result.poem}
             </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onReset}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
            >
              🔄 再測一次
            </button>
            <button
              onClick={() => {
                alert("截圖功能尚未實作，請手動截圖分享喔！");
              }}
              className="flex-1 py-3 rounded-xl bg-fun-500 text-white font-bold hover:bg-fun-600 shadow-lg shadow-fun-200 transition-colors"
            >
              📤 分享結果
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
