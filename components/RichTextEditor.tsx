import React, { useRef, useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

// Unicode 符號列表（作為 emoji 的替代方案，更容易插入）
const SYMBOL_LIST: Array<{ symbol: string; keywords: string[] }> = [
  { symbol: '★', keywords: ['星星', 'star', '星', '標記'] },
  { symbol: '☆', keywords: ['星星', 'star', '星', '空星'] },
  { symbol: '♥', keywords: ['愛心', 'love', '愛', '喜歡'] },
  { symbol: '♡', keywords: ['愛心', 'love', '愛', '空愛心'] },
  { symbol: '♪', keywords: ['音樂', 'music', '音符', '歌'] },
  { symbol: '♫', keywords: ['音樂', 'music', '音符', '歌'] },
  { symbol: '✓', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✔', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✗', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✘', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '→', keywords: ['右', 'right', '箭頭', '方向'] },
  { symbol: '←', keywords: ['左', 'left', '箭頭', '方向'] },
  { symbol: '↑', keywords: ['上', 'up', '箭頭', '方向'] },
  { symbol: '↓', keywords: ['下', 'down', '箭頭', '方向'] },
  { symbol: '☀', keywords: ['太陽', 'sun', '天氣', '晴天'] },
  { symbol: '☁', keywords: ['雲', 'cloud', '天氣', '陰天'] },
  { symbol: '☂', keywords: ['雨傘', 'umbrella', '雨', '保護'] },
  { symbol: '☃', keywords: ['雪人', 'snow', '冬天', '雪'] },
  { symbol: '☎', keywords: ['電話', 'phone', 'call', '聯絡'] },
  { symbol: '☕', keywords: ['咖啡', 'coffee', '飲料', '茶'] },
  { symbol: '☮', keywords: ['和平', 'peace', '愛', '和平符號'] },
  { symbol: '☯', keywords: ['陰陽', 'yin', 'yang', '平衡'] },
  { symbol: '☺', keywords: ['開心', 'happy', '笑', '微笑'] },
  { symbol: '☹', keywords: ['難過', 'sad', '不開心', '哭'] },
  { symbol: '✌', keywords: ['勝利', 'victory', 'peace', '和平'] },
  { symbol: '✍', keywords: ['寫', 'write', '筆', '書寫'] },
  { symbol: '✎', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✏', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✐', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✑', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✒', keywords: ['筆', 'pen', '寫', '書寫'] },
  { symbol: '✓', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✔', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✕', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✖', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✗', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✘', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✙', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✚', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✛', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✜', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✝', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✞', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✟', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✠', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✡', keywords: ['星星', 'star', '猶太', '宗教'] },
  { symbol: '✢', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✣', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✤', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✥', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✦', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✧', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✨', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '✩', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✪', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✫', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✬', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✭', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✮', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✯', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✰', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✱', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✲', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✳', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✴', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✵', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✶', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✷', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✸', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✹', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✺', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✻', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✼', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✽', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✾', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✿', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❀', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❁', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❂', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❃', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❄', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❅', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❆', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❇', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❈', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❉', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❊', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❋', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '✁', keywords: ['剪刀', 'scissors', '剪', '工具'] },
  { symbol: '✂', keywords: ['剪刀', 'scissors', '剪', '工具'] },
  { symbol: '✃', keywords: ['剪刀', 'scissors', '剪', '工具'] },
  { symbol: '✄', keywords: ['剪刀', 'scissors', '剪', '工具'] },
  { symbol: '✆', keywords: ['電話', 'phone', 'call', '聯絡'] },
  { symbol: '✇', keywords: ['傳真', 'fax', '文件', '聯絡'] },
  { symbol: '✈', keywords: ['飛機', 'airplane', '飛行', '旅行'] },
  { symbol: '✉', keywords: ['信封', 'envelope', '郵件', '信'] },
  { symbol: '✊', keywords: ['拳頭', 'fist', '力量', '拳'] },
  { symbol: '✋', keywords: ['手', 'hand', '停止', '舉手'] },
  { symbol: '✌', keywords: ['勝利', 'victory', 'peace', '和平'] },
  { symbol: '✍', keywords: ['寫', 'write', '筆', '書寫'] },
  { symbol: '✎', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✏', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✐', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✑', keywords: ['筆', 'pencil', '寫', '書寫'] },
  { symbol: '✒', keywords: ['筆', 'pen', '寫', '書寫'] },
  { symbol: '✓', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✔', keywords: ['對', '正確', 'check', '完成'] },
  { symbol: '✕', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✖', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✗', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✘', keywords: ['錯', '錯誤', 'wrong', '取消'] },
  { symbol: '✙', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✚', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✛', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✜', keywords: ['加', 'plus', '數學', '符號'] },
  { symbol: '✝', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✞', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✟', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✠', keywords: ['十字', 'cross', '宗教', '信仰'] },
  { symbol: '✡', keywords: ['星星', 'star', '猶太', '宗教'] },
  { symbol: '✢', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✣', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✤', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✥', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✦', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✧', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✨', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '✩', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✪', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✫', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✬', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✭', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✮', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✯', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✰', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✱', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✲', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✳', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✴', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✵', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✶', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✷', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✸', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✹', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✺', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✻', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✼', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✽', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✾', keywords: ['星星', 'star', '符號', '裝飾'] },
  { symbol: '✿', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❀', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❁', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❂', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❃', keywords: ['花', 'flower', '植物', '裝飾'] },
  { symbol: '❄', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❅', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❆', keywords: ['雪', 'snow', '冬天', '雪花'] },
  { symbol: '❇', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❈', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❉', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❊', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
  { symbol: '❋', keywords: ['閃亮', 'sparkle', '星星', '閃爍'] },
];

// Emoji 列表，包含關鍵詞用於搜尋
const EMOJI_LIST: Array<{ emoji: string; keywords: string[] }> = [
  { emoji: '😀', keywords: ['笑', '開心', '高興', '快樂', 'smile', 'happy'] },
  { emoji: '😃', keywords: ['大笑', '開心', '高興', '快樂', 'laugh'] },
  { emoji: '😄', keywords: ['笑', '開心', '高興', '快樂'] },
  { emoji: '😁', keywords: ['笑', '開心', '高興', '快樂'] },
  { emoji: '😆', keywords: ['大笑', '開心', '高興', '快樂'] },
  { emoji: '😅', keywords: ['尷尬', '苦笑', '流汗'] },
  { emoji: '🤣', keywords: ['大笑', '笑死', '開心', '高興'] },
  { emoji: '😂', keywords: ['笑', '哭', '開心', '高興', '流淚'] },
  { emoji: '🙂', keywords: ['微笑', '開心', '高興'] },
  { emoji: '🙃', keywords: ['倒轉', '調皮'] },
  { emoji: '😉', keywords: ['眨眼', '調皮', 'wink'] },
  { emoji: '😊', keywords: ['微笑', '開心', '高興', '可愛'] },
  { emoji: '😇', keywords: ['天使', '善良', '純潔'] },
  { emoji: '🥰', keywords: ['愛', '喜歡', '愛心', 'love'] },
  { emoji: '😍', keywords: ['愛', '喜歡', '愛心', 'love', '花痴'] },
  { emoji: '🤩', keywords: ['星星', '驚喜', '興奮'] },
  { emoji: '😘', keywords: ['親', '吻', '愛', 'love', 'kiss'] },
  { emoji: '😗', keywords: ['親', '吻', 'kiss'] },
  { emoji: '😚', keywords: ['親', '吻', '害羞', 'kiss'] },
  { emoji: '😙', keywords: ['親', '吻', 'kiss'] },
  { emoji: '😋', keywords: ['吃', '美味', '好吃', 'food'] },
  { emoji: '😛', keywords: ['吐舌', '調皮'] },
  { emoji: '😜', keywords: ['吐舌', '調皮', 'wink'] },
  { emoji: '🤪', keywords: ['瘋狂', '調皮'] },
  { emoji: '😝', keywords: ['吐舌', '調皮'] },
  { emoji: '🤑', keywords: ['錢', '金錢', 'money', 'rich'] },
  { emoji: '🤗', keywords: ['擁抱', '抱', 'hug'] },
  { emoji: '🤭', keywords: ['秘密', '安靜', '噓'] },
  { emoji: '🤫', keywords: ['安靜', '噓', '秘密'] },
  { emoji: '🤔', keywords: ['思考', '想', '疑問', 'think'] },
  { emoji: '🤐', keywords: ['閉嘴', '安靜'] },
  { emoji: '🤨', keywords: ['懷疑', '疑問'] },
  { emoji: '😐', keywords: ['無表情', '中性'] },
  { emoji: '😑', keywords: ['無表情', '無語'] },
  { emoji: '😶', keywords: ['無語', '沉默'] },
  { emoji: '😏', keywords: ['得意', '狡猾'] },
  { emoji: '😒', keywords: ['無語', '不屑'] },
  { emoji: '🙄', keywords: ['翻白眼', '無語'] },
  { emoji: '😬', keywords: ['尷尬', '緊張'] },
  { emoji: '🤥', keywords: ['說謊', '騙'] },
  { emoji: '😌', keywords: ['放鬆', '安心'] },
  { emoji: '😔', keywords: ['難過', '傷心', 'sad'] },
  { emoji: '😪', keywords: ['累', '疲憊', 'tired'] },
  { emoji: '🤤', keywords: ['流口水', '想吃'] },
  { emoji: '😴', keywords: ['睡覺', '睡', 'sleep'] },
  { emoji: '😷', keywords: ['口罩', '生病', 'sick'] },
  { emoji: '🤒', keywords: ['發燒', '生病', 'sick'] },
  { emoji: '🤕', keywords: ['受傷', '生病', 'sick'] },
  { emoji: '🤢', keywords: ['噁心', '想吐', 'sick'] },
  { emoji: '🤮', keywords: ['吐', '嘔吐', 'sick'] },
  { emoji: '👍', keywords: ['讚', '好', 'good', 'like', 'thumbs up'] },
  { emoji: '👎', keywords: ['差', '不好', 'bad', 'thumbs down'] },
  { emoji: '👌', keywords: ['好', 'ok', 'okay'] },
  { emoji: '✌️', keywords: ['勝利', 'peace', 'victory'] },
  { emoji: '🤞', keywords: ['手指', 'cross'] },
  { emoji: '🤟', keywords: ['愛', 'love'] },
  { emoji: '🤘', keywords: ['搖滾', 'rock'] },
  { emoji: '🤙', keywords: ['電話', 'call'] },
  { emoji: '👏', keywords: ['鼓掌', '拍手', 'clap'] },
  { emoji: '🙌', keywords: ['舉手', '慶祝', 'celebrate'] },
  { emoji: '👐', keywords: ['手', 'open'] },
  { emoji: '🤲', keywords: ['手', 'pray'] },
  { emoji: '🤝', keywords: ['握手', 'handshake'] },
  { emoji: '🙏', keywords: ['祈禱', '拜', 'pray'] },
  { emoji: '✍️', keywords: ['寫', '筆', 'write'] },
  { emoji: '💪', keywords: ['肌肉', '強', 'strong', 'power'] },
  { emoji: '🦵', keywords: ['腿', 'leg'] },
  { emoji: '🦶', keywords: ['腳', 'foot'] },
  { emoji: '👂', keywords: ['耳朵', 'ear'] },
  { emoji: '👃', keywords: ['鼻子', 'nose'] },
  { emoji: '❤️', keywords: ['愛', '愛心', '紅心', 'love', 'heart', 'red'] },
  { emoji: '🧡', keywords: ['愛', '愛心', '橘心', 'love', 'heart', 'orange'] },
  { emoji: '💛', keywords: ['愛', '愛心', '黃心', 'love', 'heart', 'yellow'] },
  { emoji: '💚', keywords: ['愛', '愛心', '綠心', 'love', 'heart', 'green'] },
  { emoji: '💙', keywords: ['愛', '愛心', '藍心', 'love', 'heart', 'blue'] },
  { emoji: '💜', keywords: ['愛', '愛心', '紫心', 'love', 'heart', 'purple'] },
  { emoji: '🖤', keywords: ['愛', '愛心', '黑心', 'love', 'heart', 'black'] },
  { emoji: '🤍', keywords: ['愛', '愛心', '白心', 'love', 'heart', 'white'] },
  { emoji: '🤎', keywords: ['愛', '愛心', '棕心', 'love', 'heart', 'brown'] },
  { emoji: '💔', keywords: ['心碎', '傷心', 'broken', 'heart'] },
  { emoji: '❣️', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💕', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💞', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💓', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💗', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💖', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💘', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '💝', keywords: ['禮物', '愛心', 'gift', 'heart'] },
  { emoji: '💟', keywords: ['愛', '愛心', 'love', 'heart'] },
  { emoji: '☮️', keywords: ['和平', 'peace'] },
  { emoji: '🎉', keywords: ['慶祝', '派對', 'party', 'celebrate'] },
  { emoji: '🎊', keywords: ['慶祝', '派對', 'party', 'celebrate'] },
  { emoji: '🎈', keywords: ['氣球', 'balloon', 'party'] },
  { emoji: '🎁', keywords: ['禮物', 'gift', 'present'] },
  { emoji: '🏆', keywords: ['獎盃', '冠軍', 'trophy', 'winner'] },
  { emoji: '🥇', keywords: ['金牌', '第一', 'gold', 'first'] },
  { emoji: '🥈', keywords: ['銀牌', '第二', 'silver', 'second'] },
  { emoji: '🥉', keywords: ['銅牌', '第三', 'bronze', 'third'] },
  { emoji: '⚽', keywords: ['足球', 'soccer', 'football', 'sport'] },
  { emoji: '🏀', keywords: ['籃球', 'basketball', 'sport'] },
  { emoji: '🎯', keywords: ['目標', '靶', 'target', 'goal'] },
  { emoji: '🎲', keywords: ['骰子', 'dice', 'game'] },
  { emoji: '🎮', keywords: ['遊戲', '電玩', 'game', 'video game'] },
  { emoji: '🎰', keywords: ['老虎機', 'slot', 'game'] },
  { emoji: '🎸', keywords: ['吉他', 'guitar', 'music'] },
  { emoji: '🎹', keywords: ['鋼琴', 'piano', 'music'] },
  { emoji: '🎺', keywords: ['喇叭', 'trumpet', 'music'] },
  { emoji: '🎻', keywords: ['小提琴', 'violin', 'music'] },
  { emoji: '🥁', keywords: ['鼓', 'drum', 'music'] },
  { emoji: '🎤', keywords: ['麥克風', 'mic', 'microphone', 'music'] },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '輸入內容...',
  rows = 4,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const savedRangeRef = useRef<Range | null>(null);

  // 將純文本轉換為顯示格式（Markdown/HTML 轉 HTML）
  const formatForDisplay = (text: string): string => {
    if (!text) return '';
    let formatted = text;
    
    // 處理加粗 **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 處理斜體 *text* (但不在加粗內，且不是 **)
    formatted = formatted.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    
    // 處理下劃線 <u>text</u>
    formatted = formatted.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    
    // 處理字體大小 <span style="font-size: ...">
    formatted = formatted.replace(/<span style="font-size: ([^"]+)">(.*?)<\/span>/g, '<span style="font-size: $1">$2</span>');
    
    // 處理換行
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  // 從 HTML 提取文本並轉換回 Markdown/HTML 格式
  const extractFormattedText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    let result = '';
    
    const processNode = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent || '';
        
        if (tagName === 'strong' || tagName === 'b') {
          result += `**${text}**`;
        } else if (tagName === 'em' || tagName === 'i') {
          result += `*${text}*`;
        } else if (tagName === 'u') {
          result += `<u>${text}</u>`;
        } else if (tagName === 'span' && element.style.fontSize) {
          result += `<span style="font-size: ${element.style.fontSize}">${text}</span>`;
        } else if (tagName === 'br') {
          result += '\n';
        } else {
          // 遞歸處理子節點
          Array.from(element.childNodes).forEach(processNode);
        }
      }
    };
    
    Array.from(div.childNodes).forEach(processNode);
    
    return result;
  };

  // 同步編輯器內容
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentHtml = editor.innerHTML;
    const expectedHtml = formatForDisplay(value);
    
    // 只在內容不同時更新（避免循環更新）
    if (currentHtml !== expectedHtml) {
      // 保存當前游標位置
      saveSelection();
      editor.innerHTML = expectedHtml || '<br>';
      // 恢復游標位置
      restoreSelection();
    }
  }, [value]);

  // 點擊外部區域關閉選單（使用更精確的判斷）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 檢查是否點擊在按鈕上（包括按鈕內部元素）
      const clickedButton = target.closest('button');
      if (clickedButton && clickedButton.closest('.emoji-picker-container')) {
        return; // 點擊在 emoji 按鈕上，不關閉
      }
      
      // 檢查是否點擊在選單內部
      const emojiPicker = document.querySelector('.emoji-picker-container');
      const fontSizeMenu = document.querySelector('.font-size-menu-container');
      const toolbar = document.querySelector('.rich-text-toolbar');
      const editor = editorRef.current;
      
      const isClickInEmojiPicker = emojiPicker && emojiPicker.contains(target);
      const isClickInFontSizeMenu = fontSizeMenu && fontSizeMenu.contains(target);
      const isClickInToolbar = toolbar && toolbar.contains(target);
      const isClickInEditor = editor && (editor.contains(target) || editor === target);
      
      // 如果點擊在選單外部且不在編輯器內，關閉選單
      if (!isClickInEmojiPicker && !isClickInFontSizeMenu && !isClickInEditor && !isClickInToolbar) {
        if (showFontSizeMenu) {
          setShowFontSizeMenu(false);
        }
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        }
      }
    };

    if (showEmojiPicker || showFontSizeMenu) {
      // 使用 click 事件而不是 mousedown，並且增加延遲，確保點擊事件先執行
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, false); // 改為 false，使用冒泡階段
      }, 300); // 增加延遲到 300ms，確保按鈕點擊事件先執行
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, false);
      };
    }
  }, [showEmojiPicker, showFontSizeMenu]);

  const handleInput = () => {
    // 移除 isUpdating 檢查，確保所有輸入都能更新
    const editor = editorRef.current;
    if (!editor) return;

    // 保存當前游標位置
    saveSelection();

    const html = editor.innerHTML;
    const formattedText = extractFormattedText(html);
    onChange(formattedText);
  };

  // 保存游標位置
  const saveSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 檢查 range 是否在編輯器內
      if (editor.contains(range.commonAncestorContainer) || editor === range.commonAncestorContainer) {
        try {
          savedRangeRef.current = range.cloneRange();
        } catch (e) {
          // 忽略錯誤
        }
      }
    }
  };

  // 恢復游標位置
  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor || !savedRangeRef.current) return;
    
    try {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    } catch (e) {
      // 如果恢復失敗，將游標放在編輯器末尾
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const insertText = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // 設置 isUpdating 防止 useEffect 干擾
    setIsUpdating(true);

    // 確保編輯器獲得焦點
    editor.focus();
    
    // 使用 setTimeout 確保焦點已設置並 DOM 已更新
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) {
        setIsUpdating(false);
        return;
      }

      let range: Range;
      
      if (selection.rangeCount === 0) {
        // 沒有選中，創建新的 range 在編輯器末尾
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        range = selection.getRangeAt(0);
      }

      // 刪除當前選中內容
      range.deleteContents();
      
      // 插入文本節點
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // 移動游標到插入文本後
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      // 獲取更新後的 HTML 並轉換為格式文本
      const html = editor.innerHTML;
      const formattedText = extractFormattedText(html);
      
      // 直接更新值，不通過 handleInput（避免 isUpdating 檢查）
      onChange(formattedText);
      
      // 重置 isUpdating
      setIsUpdating(false);
      
      // 再次確保焦點
      editor.focus();
    }, 10);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      handleInput();
    }
  };

  const wrapText = (tag: string, style?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const element = document.createElement(tag);
      if (style) {
        element.setAttribute('style', style);
      }
      element.textContent = selectedText;
      range.deleteContents();
      range.insertNode(element);
      
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      const element = document.createElement(tag);
      if (style) {
        element.setAttribute('style', style);
      }
      element.innerHTML = '<br>';
      range.insertNode(element);
      
      range.setStart(element, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    handleInput();
  };

  const insertEmoji = (emoji: string) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    // 確保編輯器獲得焦點
    editor.focus();
    
    // 使用最簡單直接的方法
    try {
      // 先保存當前游標位置
      saveSelection();
      
      // 等待一下確保焦點已設置
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) {
          return;
        }

        // 恢復游標位置
        if (savedRangeRef.current) {
          try {
            selection.removeAllRanges();
            selection.addRange(savedRangeRef.current);
          } catch (e) {
            // 如果恢復失敗，將游標放在編輯器末尾
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else if (selection.rangeCount === 0) {
          // 沒有選中，創建新的 range 在編輯器末尾
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // 獲取當前 range
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (!range) return;

        // 確保 range 在編輯器內
        const container = range.commonAncestorContainer;
        if (!editor.contains(container) && editor !== container) {
          const newRange = document.createRange();
          newRange.selectNodeContents(editor);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
        
        // 方法1: 嘗試使用 execCommand
        let success = false;
        try {
          success = document.execCommand('insertText', false, emoji);
        } catch (e) {
          // execCommand 失敗，使用手動插入
        }

        if (!success) {
          // 方法2: 手動插入文本節點
          try {
            range.deleteContents();
            const textNode = document.createTextNode(emoji);
            range.insertNode(textNode);
            
            // 移動游標到插入文本後
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            console.error('手動插入失敗:', e);
            return;
          }
        }

        // 保存新的游標位置
        if (selection.rangeCount > 0) {
          savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        }

        // 觸發 input 事件
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        editor.dispatchEvent(inputEvent);
        
        // 手動更新狀態
        const html = editor.innerHTML;
        const formattedText = extractFormattedText(html);
        onChange(formattedText);
        
        // 關閉 emoji 選擇器
        setShowEmojiPicker(false);
        setEmojiSearch('');
        
        // 確保焦點
        editor.focus();
      }, 10);
    } catch (error) {
      console.error('插入 emoji 失敗:', error);
    }
  };

  // 合併 emoji 和符號列表
  const allItems = [
    ...EMOJI_LIST.map(item => ({ type: 'emoji' as const, value: item.emoji, keywords: item.keywords })),
    ...SYMBOL_LIST.map(item => ({ type: 'symbol' as const, value: item.symbol, keywords: item.keywords })),
  ];

  // 過濾列表
  const filteredItems = allItems.filter(item => {
    if (!emojiSearch) return true;
    const searchLower = emojiSearch.toLowerCase();
    return item.keywords.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
           item.value.includes(searchLower);
  });

  const applyFontSize = (size: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // 關閉字體大小選單
    setShowFontSizeMenu(false);

    // 確保編輯器獲得焦點
    editor.focus();
    
    // 使用 requestAnimationFrame 確保焦點已設置
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection) return;

      let range: Range;
      
      if (selection.rangeCount === 0) {
        // 沒有選中，創建新的 range 在編輯器末尾
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        range = selection.getRangeAt(0);
      }

      const selectedText = range.toString();
      
      if (selectedText && selectedText.trim()) {
        // 有選中文本，包裝選中文本
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.textContent = selectedText;
        range.deleteContents();
        range.insertNode(span);
        
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // 沒有選中文本，插入帶格式的文本節點
        const span = document.createElement('span');
        span.style.fontSize = size;
        const textNode = document.createTextNode('\u200B'); // 零寬度空格，避免 span 被刪除
        span.appendChild(textNode);
        range.insertNode(span);
        
        // 移動游標到 span 內
        range.setStart(textNode, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      handleInput();
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* 工具欄 */}
      <div 
        className="rich-text-toolbar flex items-center gap-1 sm:gap-1.5 mb-2 p-1.5 sm:p-2 bg-gray-50 rounded-lg border border-gray-200 flex-wrap relative z-40"
        onClick={(e) => {
          // 點擊工具欄空白處時，確保編輯器獲得焦點
          const editor = editorRef.current;
          if (editor && e.target === e.currentTarget) {
            editor.focus();
          }
        }}
      >
        {/* 加粗 */}
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-sm font-bold hover:bg-gray-200 rounded transition-colors min-w-[32px] sm:min-w-[36px]"
          title="加粗"
        >
          <strong>B</strong>
        </button>

        {/* 斜體 */}
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-sm italic hover:bg-gray-200 rounded transition-colors min-w-[32px] sm:min-w-[36px]"
          title="斜體"
        >
          <em>I</em>
        </button>

        {/* 下劃線 */}
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-sm underline hover:bg-gray-200 rounded transition-colors min-w-[32px] sm:min-w-[36px]"
          title="下劃線"
        >
          <u>U</u>
        </button>

        <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

        {/* 字體大小 */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFontSizeMenu(!showFontSizeMenu);
              setShowEmojiPicker(false);
            }}
            className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-sm hover:bg-gray-200 rounded transition-colors flex items-center gap-0.5 sm:gap-1 min-w-[32px] sm:min-w-[36px]"
            title="字體大小"
          >
            <span>A</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFontSizeMenu && (
            <div 
              className="font-size-menu-container absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[100px] sm:min-w-[120px]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  applyFontSize('0.875rem');
                }}
                className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              >
                <span style={{ fontSize: '0.875rem' }}>小</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  applyFontSize('1rem');
                }}
                className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              >
                <span style={{ fontSize: '1rem' }}>中</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  applyFontSize('1.25rem');
                }}
                className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              >
                <span style={{ fontSize: '1.25rem' }}>大</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />

        {/* Emoji 選擇器 */}
        <div className="relative" style={{ display: 'inline-block' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
              setShowFontSizeMenu(false);
              if (!showEmojiPicker) {
                setEmojiSearch('');
              }
            }}
            className="px-2 sm:px-2.5 py-1.5 sm:py-1 text-base sm:text-lg hover:bg-gray-200 rounded transition-colors min-w-[32px] sm:min-w-[36px]"
            title="插入表情符號"
          >
            😀
          </button>
          {showEmojiPicker && (
            <div 
              className="emoji-picker-container absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] w-[320px] max-w-[320px]"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                // 阻止事件冒泡，防止觸發外部點擊關閉
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                // 阻止事件冒泡，防止觸發外部點擊關閉
                e.stopPropagation();
              }}
            >
              {/* 搜尋框 */}
              <div className="p-2 sm:p-3 border-b border-gray-200">
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => {
                    setEmojiSearch(e.target.value);
                  }}
                  placeholder="搜尋表情符號..."
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                  style={{ focusRingColor: '#1a5f3f' }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Emoji 列表 */}
              <div 
                className="p-2 sm:p-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  // 不阻止事件，讓按鈕可以正常點擊
                }}
                onClick={(e) => {
                  // 不阻止事件，讓按鈕可以正常點擊
                }}
              >
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-0 sm:gap-0.5">
                    {filteredItems.map((item, index) => {
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 保存游標位置
                            saveSelection();
                            // 立即插入
                            insertEmoji(item.value);
                          }}
                          onMouseDown={(e) => {
                            // 不阻止默認行為，讓點擊可以正常觸發
                          }}
                          className="text-base sm:text-lg hover:bg-gray-100 active:bg-gray-200 rounded transition-colors cursor-pointer flex items-center justify-center aspect-square"
                          style={{ 
                            touchAction: 'manipulation', 
                            userSelect: 'none',
                            pointerEvents: 'auto',
                            zIndex: 10,
                            position: 'relative',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            minWidth: '2rem',
                            minHeight: '2rem'
                          }}
                          title={item.keywords.join(', ')}
                        >
                          {item.value}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
                    找不到相關符號
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 文本輸入框 - 使用 contentEditable 實現 WYSIWYG */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => {
          // 處理 Shift+Enter 換行
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak');
            return;
          }
          // 處理 Ctrl+Enter 或 Cmd+Enter（Mac）提交（如果需要）
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            // 這裡可以添加提交邏輯，但現在先允許默認行為
            return;
          }
        }}
        onFocus={() => {
          // 保存游標位置
          saveSelection();
          
          // 確保游標在內容末尾（僅在首次聚焦時）
          const editor = editorRef.current;
          if (editor && !editor.textContent) {
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.selectNodeContents(editor);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
              savedRangeRef.current = range.cloneRange();
            }
          }
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        data-placeholder={placeholder}
        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent min-h-[100px] overflow-y-auto outline-none relative z-0"
        style={{ 
          focusRingColor: '#1a5f3f',
          minHeight: `${rows * 24}px`,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          userSelect: 'text'
        }}
      />
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>

      {/* 移除覆蓋層，使用 handleClickOutside 處理外部點擊 */}
    </div>
  );
};
