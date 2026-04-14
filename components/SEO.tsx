import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage = 'https://teakingom.com/images/關於茶王/旗幟.png',
  ogUrl,
  canonical,
}) => {
  useEffect(() => {
    // 更新 document title
    document.title = title;

    // 更新或創建 meta 標籤
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 更新 description
    updateMetaTag('description', description);

    // 更新 keywords（如果提供）
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // 更新 Open Graph 標籤
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImage, true);
    if (ogUrl) {
      updateMetaTag('og:url', ogUrl, true);
    }
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:locale', 'zh_TW', true);
    updateMetaTag('og:site_name', '茶王', true);

    // 更新 Twitter 標籤
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    if (ogUrl) {
      updateMetaTag('twitter:url', ogUrl);
    }

    // 更新 canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }
  }, [title, description, keywords, ogImage, ogUrl, canonical]);

  return null; // 這個組件不渲染任何內容
};

