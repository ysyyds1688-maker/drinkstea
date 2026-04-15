import React, { useState, useEffect, useMemo } from 'react';
import { Article } from '../types';
import { getImageUrl } from '../config/api';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  allArticles?: Article[];
  onNavigateToForum?: (category?: string) => void;
  onArticleClick?: (article: Article) => void;
  onBrowseProfiles?: () => void;  // 去看佳麗
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, allArticles = [], onArticleClick, onBrowseProfiles }) => {
  // 複製到剪貼板
  const copyToClipboard = (text: string) => {
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

  // Helper: Parse bold text (**text**) and highlight specific markers (👉)
  const parseInlineContent = (text: string) => {
    // Split by bold markers
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      // Handle Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-gray-900 font-bold">{part.slice(2, -2)}</strong>;
      }
      // Handle "👉" highlight
      if (part.includes('👉')) {
          const subParts = part.split('👉');
          return (
             <span key={i}>
                {subParts.map((sp, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-brand-yellow mx-1" style={{ color: '#1a5f3f' }}>👉</span>}
                        {sp}
                    </React.Fragment>
                ))}
             </span>
          )
      }
      return part;
    });
  };

  // Helper: Convert raw text with symbols into formatted React elements
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();

      // 1. Horizontal Rule (---)
      if (trimmed === '---') {
        return <hr key={index} className="my-8 border-t border-gray-200" />;
      }

      // 2. H3 Headers (### )
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-serif font-bold text-brand-black mt-10 mb-4 pb-2 border-b border-gray-100">{line.replace('### ', '')}</h3>;
      }

      // 3. H4 Headers (#### )
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-2 bg-gray-50 inline-block px-3 py-1 rounded-r-full border-l-4 border-brand-yellow" style={{ borderColor: '#1a5f3f' }}>{line.replace('#### ', '')}</h4>;
      }

      // 4. Bullet Points (•)
      if (trimmed.startsWith('•')) {
         return (
           <div key={index} className="flex items-start gap-3 mb-2 pl-2">
              <span className="text-brand-yellow font-bold mt-2 text-[10px] flex-shrink-0" style={{ color: '#1a5f3f' }}>●</span>
              <div className="flex-1 text-gray-700 leading-relaxed">
                  {parseInlineContent(trimmed.substring(1).trim())}
              </div>
           </div>
         )
      }

      // 5. Q&A Highlight (Q1:, Q2: etc.)
      if (/^Q\d+[：:]/.test(trimmed)) {
          return (
             <div key={index} className="mt-6 mb-2">
                 <span className="font-bold text-brand-black bg-yellow-100 px-2 py-0.5 rounded mr-2">{trimmed.split(/[：:]/)[0]}</span>
                 <span className="font-bold text-gray-900">{trimmed.substring(trimmed.indexOf('：') + 1 || trimmed.indexOf(':') + 1)}</span>
             </div>
          )
      }

      // 6. Empty lines (Spacers)
      if (trimmed === '') {
         return <div key={index} className="h-3"></div>;
      }

      // 7. Normal Paragraphs
      return (
        <p key={index} className="mb-3 text-gray-700 leading-8 tracking-wide">
          {parseInlineContent(line)}
        </p>
      );
    });
  };

  // 精選文章（排除當前文章，最多顯示 6 篇）
  const featuredArticles = useMemo(() => {
    return allArticles
      .filter(a => a.id !== article.id)
      .slice(0, 6);
  }, [allArticles, article.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Breadcrumb / Back */}
      <div className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
        <button onClick={onBack} className="transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = '#1a5f3f'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>御前茶訊</button>
        <span>/</span>
        <span className="text-brand-black truncate max-w-[200px]">{article.title}</span>
      </div>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Image */}
        <div className="w-full aspect-[21/9] relative overflow-hidden">
          <img 
            src={getImageUrl(article.imageUrl)} 
            alt={article.title} 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
             <span className="bg-brand-yellow text-white text-xs font-bold px-3 py-1 rounded-sm mb-3 inline-block tracking-wider" style={{ backgroundColor: '#1a5f3f' }}>
                 {article.tag}
             </span>
             <h1 className="text-2xl md:text-4xl font-serif font-bold leading-tight drop-shadow-lg mb-2">
                 {article.title}
             </h1>
             <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                 <span className="flex items-center gap-1">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                   {article.date}
                 </span>
                 <span className="flex items-center gap-1">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                   {article.views.toLocaleString()} 次閱讀
                 </span>
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-12">
           {/* Custom Formatted Content */}
           <div className="font-sans text-base md:text-lg">
               {renderFormattedContent(article.content || article.summary)}
           </div>
        </div>

        {/* 操作按鈕欄 */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                const url = window.location.href;
                const title = article.title;
                const text = article.summary || article.title;
                
                if (navigator.share) {
                  navigator.share({
                    title: title,
                    text: text,
                    url: url,
                  }).catch(err => {
                    console.log('分享失敗:', err);
                    copyToClipboard(url);
                  });
                } else {
                  copyToClipboard(url);
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              分享文章
            </button>
            <button
              onClick={() => onBrowseProfiles?.()}
              className="premium-button text-white px-8 py-3 rounded shadow-lg transition-colors font-bold tracking-wide"
            >
              🀫 去看佳麗
            </button>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gray-50 p-8 text-center border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">喜歡這篇文章嗎？</h3>
            <p className="text-gray-500 text-sm mb-6">立即預約體驗，感受茶王的頂級服務</p>
        </div>
      </article>

      {/* 精選文章 */}
      {featuredArticles.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-brand-black mb-2">精選文章</h2>
            <p className="text-sm text-gray-500">探索更多精彩內容</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((featuredArticle) => (
              <div
                key={featuredArticle.id}
                onClick={() => {
                  if (onArticleClick) {
                    onArticleClick(featuredArticle);
                  }
                }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
              >
                {/* 圖片 */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={getImageUrl(featuredArticle.imageUrl)}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-brand-yellow text-white text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#1a5f3f' }}>
                      {featuredArticle.tag}
                    </span>
                  </div>
                </div>
                {/* 內容 */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-green transition-colors" style={{ color: '#1a5f3f' }}>
                    {featuredArticle.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {featuredArticle.summary}
                  </p>
                  <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {featuredArticle.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {featuredArticle.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};