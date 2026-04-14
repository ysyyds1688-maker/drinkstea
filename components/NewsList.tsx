import React from 'react';
import { Article } from '../types';
import { SEO } from './SEO';
import { getImageUrl } from '../config/api';

interface NewsListProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
}

export const NewsList: React.FC<NewsListProps> = ({ articles, onArticleClick }) => {
  // 複製到剪貼板
  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('連結已複製到剪貼板！');
    }).catch(err => {
      console.error('複製失敗:', err);
      // 降級方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('連結已複製到剪貼板！');
      } catch (err) {
        alert('複製失敗，請手動複製連結');
      }
      document.body.removeChild(textArea);
    });
  };

  // 分享文章
  const handleShare = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?article=${article.id}`;
    const title = article.title;
    const text = article.summary || article.title;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url,
      }).catch(err => {
        console.log('分享失敗:', err);
        copyToClipboard(url, e);
      });
    } else {
      copyToClipboard(url, e);
    }
  };

  if (!articles || articles.length === 0) {
    return (
      <>
        <SEO
          title="御前茶訊 - 茶王 | 最新茶訊・公告・資訊"
          description="御前茶訊是茶王官方發布最新消息、公告、茶文化資訊的平台。這裡有最新的茶王動態、活動公告、平台更新、茶文化知識等內容，讓每一位品茶客都能及時了解茶王國度的最新資訊。"
          keywords="御前茶訊, 茶王, 最新消息, 官方公告, 茶文化資訊, 平台動態, 活動公告, 茶王新聞, 茶訊"
          ogImage="https://teakingom.com/images/茶訊公告/teaking_compressed_84mgy1wxt.jpg"
          ogUrl="https://teakingom.com/news"
          canonical="https://teakingom.com/news"
        />
        <div className="w-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
          <div className="text-6xl mb-6 grayscale">📰</div>
          <h3 className="text-xl font-serif font-black text-gray-300">暫無公告文章</h3>
          <p className="text-sm text-gray-400 mt-2">請稍後再回來查看最新茶訊</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="御前茶訊 - 茶王 | 最新茶訊・公告・資訊"
        description="御前茶訊是茶王官方發布最新消息、公告、茶文化資訊的平台。這裡有最新的茶王動態、活動公告、平台更新、茶文化知識等內容，讓每一位品茶客都能及時了解茶王國度的最新資訊。"
        keywords="御前茶訊, 茶王, 最新消息, 官方公告, 茶文化資訊, 平台動態, 活動公告, 茶王新聞, 茶訊"
        ogImage="https://teakingom.com/images/茶訊公告/teaking_compressed_84mgy1wxt.jpg"
        ogUrl="https://teakingom.com/news"
        canonical="https://teakingom.com/news"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
      {articles.map((article) => (
        <div 
          key={article.id} 
          onClick={() => onArticleClick && onArticleClick(article)}
          className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-50 overflow-hidden group cursor-pointer flex flex-col"
        >
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
             <img 
               src={getImageUrl(article.imageUrl)} 
               alt={article.title} 
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
               loading="lazy"
               decoding="async"
               fetchPriority={articles.indexOf(article) < 3 ? "high" : "low"}
             />
             
             {/* Tag Badge */}
             <div className="absolute top-5 left-5">
               <span className="bg-brand-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">
                 {article.tag}
               </span>
             </div>

             {/* Overlay */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-brand-black/20 backdrop-blur-[2px]">
                <div className="bg-white text-brand-black px-6 py-2 rounded-full text-xs font-black shadow-2xl tracking-widest uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   Read Article
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="p-7 flex-1 flex flex-col">
            <h3 className="text-xl font-serif font-black text-brand-black mb-3 leading-tight group-hover:text-brand-yellow transition-colors line-clamp-2 h-[3.5rem]">
              {article.title}
            </h3>
            
            <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-[2.5rem] leading-relaxed">
              {article.summary}
            </p>

            <div className="mt-auto flex justify-between items-center border-t border-gray-50 pt-5 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                 <span className="flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                   {article.date}
                 </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleShare(article, e)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="分享文章"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                   <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                   {article.views.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </>
  );
};