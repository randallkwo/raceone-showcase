# Randall Kwo — 履歷範本（RaceOne 專案）

> **說明**：這是一份以 **RaceOne 超馬賽事平台** 為主軸的履歷範本，可直接複製到你的正式履歷 / LinkedIn / PDF。
> 所有連結（GitHub showcase、Demo、技術文章）皆已就緒，面試官一鍵可達。

---

## 👤 基本資訊

| 項目 | 內容 |
|------|------|
| **姓名** | Randall Kwo |
| **職稱** | 全端工程師 / 系統架構師 (Full-Stack Engineer / System Architect) |
| **Email** | randallkwo@hotmail.com |
| **GitHub** | github.com/randallkwo/raceone-showcase |
| **線上 Demo** | demo.raceone.ai（帳號 demo1234 見 README） |
| **技術部落格** | blog.randallkwo.com/raceone-series |
| **語言** | 繁體中文（母語）· 英文（專業） |

---

## 🎯 個人簡介 (Summary)

> 具備 6+ 年全端開發經驗的獨立開發者暨系統架構師，專注於 **SaaS 多租戶平台**、**Supabase/PostgreSQL 安全架構** 與 **即時通訊整合**。從 0 到 1 打造「RaceOne」超馬賽事管理平台——涵蓋報名、財務、賽日營運、LINE/Telegram Bot、多租戶白牌部署完整生態。擅長把複雜的領域問題抽象成可維護、可擴充、安全可靠的系統架構。

---

## 🧰 核心技能 (Technical Skills)

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

## 🚀 代表專案：RaceOne 超馬賽事管理平台 (2025–2026)

**角色**：全端工程師 / 架構師（從 0 到 1 獨立開發）

**技術棧**：Next.js 14 + Supabase PostgreSQL + TypeScript + Tailwind CSS + shadcn/ui + Hermes AI Agent  
**部署**：Vercel (Web) + Hetzner VPS (Bot Gateway)  
**規模**：28 張表 · 6 種角色 · Phase 1-6 完整功能 · 三平台 Bot

### 🏆 核心成果與技術亮點

#### 1. 多租戶白牌 SaaS 架構
- 將單一賽事系統重構為**多租戶白牌平台**，支援每租戶獨立品牌、賽事、功能開關
- 建立 `tenants.config JSONB` 品牌系統，把 11+ 處硬編碼品牌文字集中化
- 設計六階段可回滾遷移流程，完成零停機遷移
- 📖 [技術文章：多租戶白牌遷移](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_MULTI_TENANT_MIGRATION.md)

#### 2. 細粒度 RBAC + RLS 安全架構
- 6 種角色 × 28 張表的細粒度權限控制，三層防禦（Middleware + UI + Database RLS）
- 用 `EXISTS` 子查詢 + `STABLE` 函數 + 精準索引優化，百萬級資料查詢 p95 < 100ms
- 建立 Matrix 自動化測試（168 種角色×操作組合）納入 CI 守門
- 📖 [技術文章：RLS 細粒度權限控制](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_RLS_DEEP_DIVE.md)

#### 3. LINE/Telegram Bot Gateway（多平台統一路由）
- 以 Adapter Pattern 建立統一的 `Incoming/OutgoingMessage` 抽象層，一份業務邏輯服務三平台
- 實現**動態指令熱載入**——指令存於資料庫，非工程師也能透過管理後台新增指令且免重部署
- 實作 LINE HMAC-SHA256 簽章驗證、Telegram Secret Token、多租戶 webhook 路由
- 📖 [技術文章：Bot Gateway](https://github.com/randallkwo/raceone-showcase/blob/main/docs/TECH_ARTICLE_BOT_GATEWAY.md)

#### 4. 賽日營運即時系統
- 建置即時計時 / 分段記錄 / 成績排名系統，支援賽時上百萬筆寫入
- 補給站物資庫存管理、QR Code 簽到、DNF/DNS 管理、財務報表
- 金流串接（綠界 NeWebPay）Webhook 自動更新報名付款狀態

#### 5. Release QA Gate（自動化品質門檻）
- 建立 7 大檢查項的 Release QA Gate：Build + 公開頁 HTTP 200 + 受保護頁 307 + DB + Middleware + Browserbase 使用者模擬（訪客 7 頁 + 後台 8 頁 + 跑者 3 流程）
- 所有變更觸發 production 前必須全通過，確保品質與穩定性

### 📦 線下資產（遞履歷時可附）
- **GitHub**：github.com/randallkwo/raceone-showcase（架構文件 + 技術文章 + 公用元件）
- **線上 Demo**：demo.raceone.ai — 可實際操作體驗（唯讀模式）
- **技術文章**：5 篇系列深挖架構決策

---

## 💼 其他經歷

| 時間 | 專案 / 職位 | 說明 |
|------|------------|------|
| 2025–2026 | **RaceOne 平台架構師 / 全端** | 主導平台從 0 到 1、多租戶化、Bot 生態 |
| (前) | **Changming 長明賞超馬盃** | RaceOne 前身，單一賽事管理系統 → 轉型 SaaS |
| (前) | 獨立接案 / 系統開發 | 基礎架設、DNS、伺服器、自動化維運 |

---

## 📌 產出資產一覽

| 類別 | 連結 / 位置 |
|------|-------------|
| 📁 Public GitHub | github.com/randallkwo/raceone-showcase |
| 🎮 線上 Demo | demo.raceone.ai |
| 📖 技術文章系列 | 5 篇（RLS / 多租戶 / Bot Gateway / 即時計時 / QA Gate） |
| 📊 系統文件 | SRS / ERD / 架構圖 / 元件指南 / QA 流程（showcase repo 內） |

---

> **給面試官的引導語**：想看架構深度請點開 showcase repo 的 `docs/`；想親手操作請用 demo 帳號登入（認證見 README）；想要面試聊架構決策可直接跳到技術文章系列。

---

*可依實際年資、過往工作經驗、教育背景擴充調整。此範本以「一個高完成度 Side Project 撐起整份履歷」為設計策略，適合把它當主要亮點。*
