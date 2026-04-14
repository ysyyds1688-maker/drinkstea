import React from 'react';

// 簡單的文本格式化函數，支持基本的 Markdown 和 HTML
export const formatText = (text: string): React.ReactNode => {
  if (!text) return null;

  // 先處理 HTML 標籤（如 <u>, <span> 等）
  const parts: (string | React.ReactElement)[] = [];
  let currentIndex = 0;
  const htmlRegex = /<(u|span|strong|em|b|i)([^>]*)>(.*?)<\/\1>/g;
  let match;

  while ((match = htmlRegex.exec(text)) !== null) {
    // 添加標籤前的文本
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    const tag = match[1];
    const attrs = match[2];
    const content = match[3];

    // 處理 span 標籤的 style 屬性
    if (tag === 'span' && attrs.includes('font-size')) {
      const fontSizeMatch = attrs.match(/font-size:\s*([^;]+)/);
      if (fontSizeMatch) {
        parts.push(
          <span key={match.index} style={{ fontSize: fontSizeMatch[1] }}>
            {formatText(content)}
          </span>
        );
      } else {
        parts.push(<span key={match.index}>{formatText(content)}</span>);
      }
    } else if (tag === 'u') {
      parts.push(<u key={match.index}>{formatText(content)}</u>);
    } else if (tag === 'strong' || tag === 'b') {
      parts.push(<strong key={match.index}>{formatText(content)}</strong>);
    } else if (tag === 'em' || tag === 'i') {
      parts.push(<em key={match.index}>{formatText(content)}</em>);
    } else {
      parts.push(formatText(content));
    }

    currentIndex = match.index + match[0].length;
  }

  // 添加剩餘文本
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    // 處理 Markdown 格式（**加粗**, *斜體*）
    const markdownParts: (string | React.ReactElement)[] = [];
    let mdIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;

    // 先處理加粗
    let boldMatch;
    while ((boldMatch = boldRegex.exec(remainingText)) !== null) {
      if (boldMatch.index > mdIndex) {
        markdownParts.push(remainingText.substring(mdIndex, boldMatch.index));
      }
      markdownParts.push(<strong key={`bold-${boldMatch.index}`}>{boldMatch[1]}</strong>);
      mdIndex = boldMatch.index + boldMatch[0].length;
    }

    if (mdIndex < remainingText.length) {
      const restText = remainingText.substring(mdIndex);
      // 處理斜體（但不在加粗內）
      const italicParts: (string | React.ReactElement)[] = [];
      let itIndex = 0;
      let italicMatch;
      while ((italicMatch = italicRegex.exec(restText)) !== null) {
        if (italicMatch.index > itIndex) {
          italicParts.push(restText.substring(itIndex, italicMatch.index));
        }
        italicParts.push(<em key={`italic-${italicMatch.index}`}>{italicMatch[1]}</em>);
        itIndex = italicMatch.index + italicMatch[0].length;
      }
      if (itIndex < restText.length) {
        italicParts.push(restText.substring(itIndex));
      }
      markdownParts.push(...italicParts);
    } else {
      markdownParts.push(remainingText.substring(mdIndex));
    }

    parts.push(...markdownParts);
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

