# 茶王 Frontend

這是茶王專案的前端應用程式，使用 React + Vite + TypeScript 構建。

## 📁 專案結構

```
frontend/
├── src/
│   ├── components/              # React 組件
│   │   ├── AuthModal.tsx       # 登入/註冊彈窗
│   │   ├── ProfileCard.tsx     # 個人資料卡片
│   │   ├── ProfileCardWithReviews.tsx  # 帶評論的個人資料卡片
│   │   ├── ProfileDetail.tsx   # 個人資料詳情頁
│   │   ├── ProviderDashboard.tsx  # Provider 上架管理頁面
│   │   ├── ProviderListingPage.tsx  # 茶茶上架列表頁
│   │   ├── ReviewCard.tsx      # 評論卡片
│   │   ├── ReviewModal.tsx     # 評論提交彈窗
│   │   ├── SidebarFilter.tsx   # 進階篩選側邊欄
│   │   ├── PriceDisplay.tsx    # 價格顯示組件
│   │   ├── PriceInfo.tsx       # 價格資訊組件
│   │   ├── PageTransition.tsx  # 頁面轉場動畫
│   │   ├── MembershipBadge.tsx # 會員等級徽章組件
│   │   ├── VerificationBadges.tsx # 驗證勳章組件
│   │   ├── SubscriptionPanel.tsx # 訂閱管理面板
│   │   ├── PointsDisplay.tsx # 積分與經驗值顯示組件
│   │   ├── DailyTasksPanel.tsx # 每日任務面板
│   │   ├── AchievementsPanel.tsx # 成就面板（含分類標籤頁）
│   │   ├── BadgesPanel.tsx # 勳章面板（含分類標籤頁）
│   │   └── ...
│   ├── contexts/                # React Context
│   │   └── AuthContext.tsx     # 認證狀態管理
│   ├── services/                # API 服務
│   │   └── apiService.ts       # API 請求封裝
│   ├── config/                  # 配置檔案
│   │   └── api.ts              # API 端點配置
│   ├── types.ts                 # TypeScript 類型定義
│   ├── constants.ts             # 常數定義
│   ├── App.tsx                  # 主應用組件
│   └── index.tsx                # 應用入口
├── public/                       # 靜態資源
│   └── images/                  # 圖片資源
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 功能特色

### 核心功能
- ✅ React 18 + TypeScript
- ✅ Vite 構建工具（快速開發和構建）
- ✅ Tailwind CSS（樣式框架）
- ✅ 響應式設計（支援桌面和手機）
- ✅ 日式頂級風格設計

### 用戶功能
- ✅ 用戶註冊/登入（Email 或手機號）
- ✅ JWT Token 認證
- ✅ 用戶狀態管理（Context API）
- ✅ **用戶 ID 系統**（公開 ID `#Tea...` / `#Gri...` 顯示）
- ✅ **多級會員系統**（茶客、入門茶士、御前茶士等 10 個等級，基於經驗值自動升級）
- ✅ **VIP 訂閱系統**（付費訂閱獲得額外權益）
- ✅ **驗證勳章顯示**（郵箱驗證、手機驗證、佳麗驗證勳章）
- ✅ **積分與經驗值系統**（積分用於兌換勳章，經驗值用於升級等級）
- ✅ **成就系統**（分類瀏覽：茶席互動、嚴選好茶、特選魚市、茶客資歷）
- ✅ **勳章系統**（分類瀏覽：身分稱號、品味風格、座上地位、皇室御印）
- ✅ **每日任務系統**（完成任務獲得積分和經驗值）
- ✅ **訂閱管理面板**（訂閱、取消、歷史記錄、權益對比）

### 瀏覽功能
- ✅ 個人資料列表（本月精選推薦）
- ✅ 個人資料詳情頁
- ✅ 進階篩選功能（地區、國籍、年齡、價格等）
- ✅ **搜尋功能**（搜尋名字、地區、標籤、服務）
- ✅ **智能排序**（VIP 優先、活躍度、評分加權排序）
- ✅ 隨機排序（本月精選推薦）
- ✅ **價格顯示控制**（僅茶客可見，佳麗不可見）
- ✅ **收藏功能**（茶客專用）

### 評論系統
- ✅ 查看評論（根據用戶權限）
- ✅ 發表評論（5星評分）
- ✅ 評論點讚
- ✅ 評論回復（Provider 可回復）
- ✅ 評論可見性控制（訪客顯示「請登入查看評分」）
- ✅ **雙向評分系統**（茶客評分佳麗，佳麗評分茶客）
- ✅ **評分統計顯示**（平均評分和評論數量）

### Provider 功能
- ✅ Provider Dashboard（我的上架）
- ✅ 上架個人資料
- ✅ 編輯個人資料
- ✅ 查看品茶紀錄
- ✅ 約會狀況日曆（顯示預約日曆和狀態）
- ✅ 預約確認/拒絕功能

### 訊息系統（預約確認專用）
- ✅ Email 風格訊息收件箱（列表 + 詳情視圖）
- ✅ 預約確認訊息顯示
- ✅ **自動發送聯絡方式**（佳麗確認後，系統自動發送完整聯絡方式給茶客）
- ✅ 24小時倒數計時
- ✅ 預約狀態顯示
- ✅ **操作說明提醒**（茶客和佳麗都有專屬的操作說明和安全提醒）
- ⚠️ **不支援自由對話**：僅用於預約確認
- ⚠️ **聯絡方式管理**：預約記錄中不顯示聯絡方式，僅在訊息收件箱中顯示

### 預約系統
- ✅ 預約創建（選擇服務、日期、時間、地點）
- ✅ **時間衝突檢查**（防止同一佳麗同一時間雙重預約）
- ✅ 預約日曆視圖（顯示可用時間段）
- ✅ 服務時長優先排序
- ✅ 台灣時區時間驗證（無法選擇已過期時間）
- ✅ 品茶紀錄查看（茶客和佳麗都可查看）
- ✅ **約會狀況日曆**（佳麗專屬，顯示預約日曆和狀態）
- ✅ 預約狀態管理（確認、拒絕、完成、取消）
- ✅ **預約取消功能**（佳麗可取消預約，需填寫原因）

### 其他功能
- ✅ 文章列表和詳情
- ✅ 頁面轉場動畫
- ✅ 手機版漢堡選單
- ✅ 手機版篩選抽屜
- ✅ 論壇系統（發帖、回覆、點讚）

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env` 檔案：

```bash
# API 基礎 URL
VITE_API_BASE_URL=https://backenddrinktea.zeabur.app
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

應用將在 `http://localhost:5173` 啟動。

### 4. 構建生產版本

```bash
npm run build
```

構建輸出將在 `dist/` 資料夾中。

## 🎨 設計特色

### 日式頂級風格
- 綠色主題色（`#1a5f3f`）
- 精緻的卡片邊框設計
- 優雅的陰影效果
- 流暢的動畫過渡

### 響應式設計
- 桌面版：完整功能展示
- 手機版：優化的移動體驗
  - 漢堡選單
  - 篩選抽屜
  - 觸控優化

## 📡 API 整合

前端通過以下 API 與後端通信：

### 認證 API
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `GET /api/auth/me` - 取得當前用戶
- `POST /api/auth/logout` - 登出

### Profiles API
- `GET /api/profiles` - 取得所有個人資料
- `GET /api/profiles/:id` - 取得特定個人資料

### Reviews API
- `GET /api/reviews/profiles/:profileId/reviews` - 取得評論
- `POST /api/reviews/profiles/:profileId/reviews` - 創建評論
- `POST /api/reviews/reviews/:reviewId/like` - 點讚評論
- `POST /api/reviews/reviews/:reviewId/reply` - 回復評論

### Subscriptions API
- `GET /api/subscriptions/my` - 取得訂閱狀態（包含等級和勳章）
- `POST /api/subscriptions/subscribe` - 訂閱（支持選擇等級）
- `GET /api/subscriptions/history` - 取得訂閱歷史記錄
- `POST /api/subscriptions/cancel` - 取消訂閱
- `GET /api/subscriptions/benefits` - 取得會員等級權益列表

### Bookings API
- `POST /api/bookings` - 創建預約（包含時間衝突檢查）
- `GET /api/bookings/my` - 取得我的預約
- `GET /api/bookings/:id` - 取得特定預約詳情
- `PUT /api/bookings/:id/status` - 更新預約狀態（確認/拒絕/完成/取消，取消需提供原因）
- `GET /api/bookings/available-times/:profileId` - 取得可用時間段（用於日曆）

### Messages API（預約確認專用）
- `GET /api/messages/my` - 取得我的訊息收件箱（對話串列表）
- `GET /api/messages/thread/:threadId` - 取得對話串詳情
- `POST /api/messages/send` - 發送訊息（僅用於預約確認流程）
- `PUT /api/messages/:id/read` - 標記訊息為已讀
- `PUT /api/messages/read-all` - 標記所有訊息為已讀
- `DELETE /api/messages/:id` - 刪除對話串

### Achievements API
- `GET /api/achievements/my` - 取得我的成就
- `GET /api/achievements/definitions` - 取得所有成就定義
- `POST /api/achievements/check` - 檢查並解鎖成就

### Badges API
- `GET /api/badges/available` - 取得所有可兌換的勳章
- `GET /api/badges/my` - 取得我已擁有的勳章
- `POST /api/badges/purchase/:badgeId` - 兌換勳章（會扣除積分）

### Tasks API
- `GET /api/tasks/my` - 取得我的每日任務進度

### User Stats API
- `GET /api/user-stats/my` - 取得我的統計資訊（積分、經驗值、等級等）

### Stats API
- `GET /api/stats/online` - 取得在線人數（包含認證用戶和訪客）

### Favorites API
- `GET /api/favorites/my` - 取得我的收藏列表
- `POST /api/favorites/:profileId` - 添加收藏
- `DELETE /api/favorites/:profileId` - 取消收藏

### Notifications API
- `GET /api/notifications/my` - 取得我的通知
- `PUT /api/notifications/:id/read` - 標記通知為已讀
- `PUT /api/notifications/read-all` - 標記所有通知為已讀
- `DELETE /api/notifications/:id` - 刪除通知

詳細 API 配置請參考 `src/config/api.ts`。

## 🔐 認證流程

1. **註冊/登入**
   - 用戶點擊"登入/註冊"按鈕
   - 彈出 AuthModal
   - 選擇 Email 或手機號登入
   - 輸入帳號密碼
   - 成功後獲取 JWT Token

2. **Token 管理**
   - Token 存儲在 `localStorage`
   - 每次 API 請求自動帶上 Token
   - Token 過期後自動登出

3. **權限控制**
   - 訪客：只能瀏覽基本內容
   - 登入用戶：可查看部分評論、發表評論
   - 訂閱用戶：可查看所有評論（根據會員等級）
   - Provider：可管理自己的上架資料

4. **會員等級系統（基於經驗值）**
   - 系統支持 10 個等級，從「茶客」到「國師級茶官」
   - 等級會根據經驗值自動升級
   - 經驗值通過完成任務、解鎖成就、即時活動獲得

5. **積分與經驗值系統**
   - **積分**：用於兌換勳章，通過完成任務和解鎖成就獲得
   - **經驗值**：用於升級等級，通過完成任務、解鎖成就、即時活動獲得
   - 兩者獨立運作，各有不同用途

6. **成就系統**
   - 由用戶行為自動解鎖
   - 解鎖時會發放積分和經驗值
   - 分類瀏覽：茶席互動、嚴選好茶、特選魚市、茶客資歷

7. **勳章系統**
   - 使用積分兌換
   - 兌換後積分會被扣除
   - 分類瀏覽：身分稱號、品味風格、座上地位、皇室御印

8. **每日任務系統**
   - 完成任務獲得積分和經驗值
   - 任務類型：每日登入、發表帖子、回覆帖子、點讚內容、瀏覽個人資料

9. **驗證勳章**
   - 郵箱驗證勳章：完成郵箱驗證後顯示
   - 手機驗證勳章：完成手機驗證後顯示

## 📱 頁面結構

### 主要頁面
1. **首頁（HOME）**
   - 本月精選推薦
   - 搜尋功能
   - 進階篩選
   - 個人資料卡片列表

2. **茶訊公告（NEWS）**
   - 文章列表
   - 文章詳情

3. **茶茶上架（PROVIDER_LISTING）**
   - 個人上架列表
   - 評論系統
   - 進階篩選

4. **個人資料詳情（PROFILE_DETAIL）**
   - 詳細資訊
   - 照片集
   - 價格資訊
   - 評論列表

5. **Provider Dashboard（PROVIDER_DASHBOARD）**
   - 我的上架資料
   - 編輯功能
   - 預約管理

6. **個人資料頁（USER_PROFILE）**
   - 個人資訊管理
   - 會員等級顯示
   - 驗證勳章展示
   - **茶客評分顯示**（5星評分，平均評分和評論數）
   - 訂閱管理面板
   - 積分與經驗值顯示
   - 每日任務面板
   - 成就面板（含分類標籤頁）
   - 勳章面板（含分類標籤頁）
   - 收藏列表（Client）
   - 上架管理（Provider）
   - **訊息收件箱**（預約確認專用，含操作說明提醒）
   - **品茶紀錄**（查看和管理所有約會品茶記錄）
   - **約會狀況日曆**（佳麗專屬，顯示預約日曆視圖）

## 🚀 部署資訊

### 前端網域

**Base URL**: `https://happynewyears.zeabur.app`

### 環境變數設定

在部署平台設定以下環境變數：

- `VITE_API_BASE_URL` - 後端 API 基礎 URL（必填）

### 構建和部署

1. **構建專案**
   ```bash
   npm run build
   ```

2. **部署 `dist/` 資料夾**
   - 將 `dist/` 資料夾的內容上傳到靜態網站託管服務
   - 確保 `dist/images/` 中的圖片資源也被上傳

3. **設定環境變數**
   - 在部署平台設定 `VITE_API_BASE_URL`

## 🛠️ 開發工具

### 推薦的 VS Code 擴展
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### 代碼規範
- 使用 TypeScript 進行類型檢查
- 使用 ESLint 進行代碼檢查
- 使用 Prettier 進行代碼格式化

## ✅ 已完成功能

### 核心功能
- ✅ 用戶認證系統（註冊、登入、JWT）
- ✅ 個人資料管理（上架、編輯、瀏覽）
- ✅ 評論系統（評分、回復、點讚）
- ✅ 預約系統（創建、確認、拒絕、完成）
- ✅ 訊息系統（預約確認專用）
- ✅ 茶客評分系統（顯示平均評分和評論數）

### 進階功能
- ✅ 成就系統（自動解鎖）
- ✅ 勳章系統（積分兌換）
- ✅ 每日任務系統
- ✅ 會員等級系統（基於經驗值）
- ✅ 訂閱管理系統
- ✅ 收藏系統
- ✅ 搜尋和篩選功能
- ✅ 論壇系統（發帖、回覆、點讚）

## 🚧 待優化項目

### 高優先級
- [ ] Redis 緩存配置（支持多實例部署）
- [ ] SMTP 郵件服務配置（用於郵件驗證和通知）
- [ ] 性能監控和日誌收集系統
- [ ] 錯誤追蹤系統（如 Sentry）

### 中優先級
- [ ] 圖片上傳和存儲優化（CDN）
- [ ] API 響應時間優化
- [ ] 前端代碼分割和懶加載
- [ ] UI/UX 優化（成就解鎖通知、等級升級動畫）

### 低優先級
- [ ] 多語言支持
- [ ] 深色模式
- [ ] PWA 支持
- [ ] 移動端 APP

## 📚 相關文檔

- [後端 API 文檔](../backend/README.md)
- [專案結構說明](../README.md)
- [上線前檢查清單](../PRE_LAUNCH_CHECKLIST.md) ⭐ **新增**
- [成就系統判斷標準與未完成事項](../ACHIEVEMENT_SYSTEM_README.md)
- [Provider 系統預留設計提案](../PROVIDER_SYSTEM_PROPOSAL.md)

## 授權

ISC

