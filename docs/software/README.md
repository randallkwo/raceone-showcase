# RaceOne 軟體開發文件集

> 完整的軟體開發規劃、架構、元件、資料庫與 QA 文件。
> **閱讀建議**: 依以下順序瀏覽,由總覽到細節。

---

## 📂 文件清單

| 文件 | 說明 | 類型 |
|:-----|:-----|:-----|
| [SRS.md](SRS.md) | 系統需求規格書 — 功能/非功能需求、RBAC、驗收標準 | 規劃 |
| [architecture.html](architecture.html) | **架構圖** (互動式 HTML,瀏覽器開啟) | 圖表 |
| [ERD.md](ERD.md) | 資料庫設計與關連圖 (Mermaid ERD + 28 表總覽) | 圖表 |
| [COMPONENTS.md](COMPONENTS.md) | 元件 / 頁面 / API / 資料表對應指南 | 設計 |
| [QA.md](QA.md) | QA 測試流程 + Release QA Gate | 測試 |

---

## 🏗 系統定位

**RaceOne.ai 智慧平台** — AI 驅動的一站式超馬賽事營運系統。

| 層級 | 技術 |
|:-----|:-----|
| Web | Next.js 14 + React18 + TS + Tailwind + shadcn/ui → Vercel |
| DB | Supabase PostgreSQL 28 表 + RLS + RBAC |
| Auth | Supabase Auth + Resend (密碼重設 SMTP) |
| Bot | Hermes Agent (LINE / Telegram) → Hetzner VPS |
| 金流 | 綠界 NewebPay Webhook |
| AI | Hermes Agent 記憶/技能/任務自動化 |

---

## 🔗 關聯的既有文件 (docs/)

| 文件 | 主題 |
|:-----|:-----|
| [../role-permissions.md](../role-permissions.md) | RBAC 角色權限矩陣 |
| [../MULTI_PROJECT_ARCHITECTURE.md](../MULTI_PROJECT_ARCHITECTURE.md) | 白牌多專案架構 |
| [../DEPLOY_STRATEGY_B_MULTIPROJECT.md](../DEPLOY_STRATEGY_B_MULTIPROJECT.md) | 部署策略 B |
| [../EMAIL_SETUP.md](../EMAIL_SETUP.md) | Email / Resend 設定 |
| [../PLATFORM_SETUP.md](../PLATFORM_SETUP.md) | LINE/Telegram 平台參數 |
| [../COST_ESTIMATE_zh.md](../COST_ESTIMATE_zh.md) | 成本估算 (中文·USD) |
| [../COST_ESTIMATE_en.md](../COST_ESTIMATE_en.md) | Cost estimate (English) |
| [../PROJECT_HISTORY_AND_LESSONS.md](../PROJECT_HISTORY_AND_LESSONS.md) | 專案歷史與教訓 |
| [../LESSONS_2026_08_04.md](../LESSONS_2026_08_04.md) | 2026-08-04 變更與教訓 |

---

## 🗃 主要程式碼位置

```
admin/
├── src/app/            # 40+ 頁面 (App Router)
├── src/app/api/        # 30+ API routes
├── src/components/     # UI 元件
├── src/lib/            # 共用 library (supabase/permissions/brand/sanitize)
├── src/middleware.ts   # Auth + RBAC 路徑控管
└── supabase/migrations/# 19 支 SQL migration (28 表)
```

---

*RaceOne.ai 智能平台 · 文件生成 2026-08-07*
