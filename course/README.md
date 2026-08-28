# RaceOne 0-to-1 實戰課程 🏁

> **從零到一，用 7 天打造一個超馬賽事管理平台**
> 適合對象：具備基礎程式能力，想了解完整 SaaS 產品開發流程的學生與開發者

---

## 📖 課程簡介

本課程以 **RaceOne.ai** 真實專案為案例，完整記錄從**網域申請 → 基礎架構 → 前端開發 → 資料庫設計 → LINE Bot 整合 → AI Agent 串接 → 部署上線 → 品質管理**的全部過程。

這不是理論課程，而是**真實戰場的實戰記錄** — 包含所有踩坑、決策取捨、以及 Lessons Learned。

## 🎯 學習目標

完成本課程後，你將能夠：

| # | 能力 | 對應章節 |
|---|------|----------|
| 1 | 申請網域 + 設定 DNS + CDN 防護 | 01 |
| 2 | 規劃 SaaS 基礎架構 (VPS + DB + 部署) | 02 |
| 3 | 用 Next.js 14 + Tailwind + shadcn/ui 架站 | 03 |
| 4 | 設計 Supabase 資料庫 + RLS 安全策略 | 04 |
| 5 | 串接 LINE Messaging API + LIFF | 05 |
| 6 | 整合 AI Agent 自動化運營 | 06 |
| 7 | 自動化 CI/CD 部署流程 | 07 |
| 8 | 建立 10 項 QA Gate 品管體系 | 08 |
| 9 | 從錯誤中學習：11 個真實踩坑教訓 | 09 |

## 📚 課程章節

```
course/
├── README.md              ← 你正在看這裡
├── 00-pre-requisites.md   — 前置知識與環境準備
├── 01-domain-and-dns.md   — 網域申請、Cloudflare、DNS 設定
├── 02-infrastructure.md   — 伺服器、Supabase、Vercel 架構
├── 03-frontend-setup.md   — Next.js 14 + Tailwind + shadcn/ui
├── 04-backend-database.md — Supabase 資料庫設計、RLS、Auth
├── 05-integration-line.md — LINE Bot + LIFF 整合
├── 06-ai-agent-hermes.md  — Hermes AI Agent 整合
├── 07-deployment-cicd.md  — 部署流程、CI/CD、環境變數
├── 08-qa-process.md       — 10 項 QA Gate 品管流程
├── 09-lessons-learned.md  — 11 個踩坑記錄與教訓
└── 10-appendix.md         — 工具速查表、參考資源
```

## 🛠️ 使用技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| **前端** | Next.js 14 (App Router) + React 18 | 頁面渲染與路由 |
| **UI** | Tailwind CSS + shadcn/ui + Recharts | 介面設計與圖表 |
| **後端** | Supabase (PostgreSQL + Auth + Storage) | 資料庫、認證、檔案 |
| **部署** | Vercel (Hobby/Pro) | 前端託管 |
| **網域** | Cloudflare (DNS + CDN + WAF) | 網域管理與安全 |
| **Bot** | LINE Messaging API + LIFF | 即時通訊 |
| **AI** | Hermes Agent + OpenRouter + Supabase MCP | 智慧自動化 |
| **VPS** | Hetzner (Ubuntu) + systemd | 背景服務運行 |
| **版本** | GitHub + Git | 程式碼管理 |
| **金流** | 藍新金流 (NewebPay) | 線上收款 |

## ⏱️ 預估時數

| 章節 | 閱讀 | 實作 |
|------|------|------|
| 00 前置準備 | 30 min | 1-2 hr |
| 01 網域/DNS | 20 min | 30 min |
| 02 基礎架構 | 30 min | 1 hr |
| 03 前端開發 | 45 min | 3-4 hr |
| 04 後端資料庫 | 45 min | 3-4 hr |
| 05 LINE Bot | 30 min | 2-3 hr |
| 06 AI Agent | 30 min | 2-3 hr |
| 07 部署上線 | 20 min | 1 hr |
| 08 QA 流程 | 30 min | 2 hr |
| 09 踩坑教訓 | 20 min | — |

## 📦 相關連結

| 資源 | 連結 |
|------|------|
| 線上平台 | [raceone.ai](https://www.raceone.ai) |
| 原始碼展示 | [github.com/randallkwo/raceone-showcase](https://github.com/randallkwo/raceone-showcase) |
| 技術部落格 | [blog.randallkwo.com/raceone-series](https://blog.randallkwo.com/raceone-series) |
| 展示 Demo | [demo.raceone.ai](https://demo.raceone.ai) |

---

**下一章**：[00 — 前置知識與環境準備](00-pre-requisites.md)