# Randall Kwo

**全端工程師 / 系統架構師 (Full-Stack Engineer / System Architect)**

Email: randallkwo@hotmail.com · GitHub: github.com/randallkwo/raceone-showcase · Blog: blog.randallkwo.com/raceone-series

---

## 個人簡介 (Profile)

具備全端開發與系統架構經驗，專注於 **SaaS 多租戶平台**、**Supabase/PostgreSQL 安全架構** 與 **即時通訊整合**。從 0 到 1 打造「RaceOne」超馬賽事管理平台——涵蓋報名、財務、賽日營運、LINE/Telegram Bot、多租戶白牌部署完整生態。擅長把複雜的領域問題抽象成可維護、可擴充、安全可靠的系統架構。

---

## 核心技能 (Technical Skills)

| 類別 | 技能 |
|------|------|
| **前端** | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · shadcn/ui · Recharts |
| **後端** | Next.js API Routes · Server Actions · Node.js · REST API |
| **資料庫** | PostgreSQL · Supabase · Supabase Realtime · Row-Level Security (RLS) · 資料遷移 |
| **架構** | 多租戶 SaaS · White-label 白牌 · RBAC 權限設計 · 微服務 Gateway · Adapter Pattern |
| **即時通訊** | LINE Messaging API · Telegram Bot API · Discord · Webhook 簽章驗證 |
| **DevOps** | Vercel · Supabase · Hetzner VPS · GitHub Actions CI/CD · systemd |
| **測試** | Vitest · Browserbase E2E · Release QA Gate · RLS 回歸測試 |
| **其他** | AI Agent (Hermes) · Notion API · 金流串接 (綠界 NeWebPay) · Email (Resend) |

---

## 代表專案：RaceOne 超馬賽事管理平台 (2025–2026)

**角色**：全端工程師 / 架構師（從 0 到 1 開發）

**技術棧**：Next.js 14 + Supabase PostgreSQL + TypeScript + Tailwind CSS + shadcn/ui + Hermes AI Agent  
**部署**：Vercel (Web) + Hetzner VPS (Bot Gateway)  
**規模**：28 張資料表 · 6 種角色 · Phase 1-6 完整功能 · 三平台 Bot

### 核心成果

1. **多租戶白牌 SaaS 架構**
   單一賽事系統重構為多租戶白牌平台，支援每租戶獨立品牌、賽事、功能開關；品牌文字集中化（11+ 處硬編碼 → centralized config）；六階段可回滾遷移流程、零停機。
   《[多租戶白牌遷移](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_MULTI_TENANT_MIGRATION.md)》

2. **細粒度 RBAC + RLS 安全架構**
   6 種角色 × 28 張表的細粒度權限控制，三層防禦（Middleware + UI + Database RLS）；以 `EXISTS` 子查詢 + `STABLE` 函數 + 精準索引優化，百萬級資料查詢 p95 < 100ms；Matrix 自動化測試（168 種組合）納入 CI。
   《[RLS 細粒度權限控制](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_RLS_DEEP_DIVE.md)》

3. **LINE/Telegram Bot Gateway（多平台統一路由）**
   Adapter Pattern 建立統一 `Incoming/OutgoingMessage` 抽象層，一份業務邏輯服務三平台；動態指令熱載入（指令資料化，管理後台可增指令、免重部署）；LINE HMAC-SHA256 簽章驗證、多租戶 webhook 路由。
   《[Bot Gateway](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_BOT_GATEWAY.md)》

4. **賽日營運即時系統**
   即時計時 / 分段記錄 / 排名系統、補給站物資庫存、QR Code 簽到、DNF/DNS 管理、財務報表；金流串接（綠界 NeWebPay）Webhook 自動更新報名付款狀態。

5. **Release QA Gate（自動化品質門檻）**
   7 大檢查項的 Release QA Gate：Build + 公開頁 HTTP 200 + 受保護頁 307 + DB + Middleware + Browserbase 使用者模擬（訪客 7 頁 + 後台 8 頁 + 跑者 3 流程）。所有變更觸發 production 前必須全通過。

---

## 產出資產

| 類別 | 連結 |
|------|------|
| GitHub 專案 | github.com/randallkwo/raceone-showcase（架構文件 + 技術文章 + 公用元件 + Demo 部署套件） |
| 線上 Demo | demo.raceone.ai（公開瀏覽、寫入操作受保護，示範帳號見 README） |
| 技術文章系列 | RLS / 多租戶 / Bot Gateway / 即時計時 / QA Gate |
| 系統文件 | SRS / ERD / 架構圖 / 元件指南 / QA 流程（showcase repo `docs/`） |

---

## 其他經歷

| 時間 | 專案 / 職位 | 說明 |
|------|------------|------|
| 2025–2026 | RaceOne 平台架構師 / 全端 | 平台從 0 到 1、多租戶化、Bot 生態建置 |
| 前期 | Changming 長明賞超馬盃 | RaceOne 前身，單一賽事管理系統 → 轉型 SaaS |
| 前期 | 獨立接案 / 系統開發 | 基礎架設、DNS、伺服器、自動化維運 |