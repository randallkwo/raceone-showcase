# RaceOne 系統需求規格書 (SRS)

> **系統**: RaceOne 超馬賽事管理平台 (原 Changming Ultra Marathon System)
> **版本**: 1.0 | **日期**: 2026-08-07
> **狀態**: 正式版 (Release QA Gate 全 PASS)
> **官網**: https://www.raceone.ai

---

## 1. 系統概述

### 1.1 定位
RaceOne 是一套 **AI 驅動的一站式超馬賽事營運系統**,涵蓋從報名、比賽、完賽到復原的完整旅程,服務對象包含:

| 使用者 | 需求 |
|:-------|:-----|
| **主辦方 / 管理團隊** | 賽事管理、報名、財務、預算、贊助商、行程、志工、公告 |
| **跑者 / 參賽者** | 公開報名、查詢成績、下載證書、自助管理個人資料 |
| **贊助商** | 專屬後台查看贊助方案與對應權益 |
| **志工領隊** | 志工排班、補給站、計時、簽到 |

### 1.2 使命
> **FIRST TO FINISH / 率先完賽,零失誤,可複製** — 讓每一場超馬賽事更安全、更有序、更有人溫度。

### 1.3 技術棧
| 層級 | 技術 |
|:-----|:-----|
| 前端框架 | Next.js 14 (App Router) + React 18 + TypeScript |
| 樣式 | Tailwind CSS + shadcn/ui |
| 資料庫 | Supabase (PostgreSQL) + RLS |
| 認證 | Supabase Auth (Email/Password + 密碼重設) |
| 金流 | 綠界 (NewebPay) Webhook |
| AI Agent | Hermes Agent (LINE / Telegram Bot) |
| 部署 | Vercel (Web) + Hetzner VPS (Bot Gateway) |
| 通知 | Resend (Email) + LINE / Telegram Bot |

---

## 2. 功能需求 (Functional Requirements)

### 2.1 賽事管理
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-101 | 管理員可建立/編輯/刪除賽事 (CRUD) | 高 |
| FR-102 | 每場賽事可設定多個組別 (race_categories) | 高 |
| FR-103 | 每場賽事可設定自訂報名欄位 (registration_custom_fields) | 中 |
| FR-104 | 賽事狀態流: 草稿 → 報名中 → 進行中 → 結束 | 高 |
| FR-105 | 公開頁展示賽事列表與詳情 | 高 |

### 2.2 報名管理 (Registration)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-201 | 跑者可透過公開頁自助報名 (需註冊帳號) | 高 |
| FR-202 | 管理員可手動新增報名 / 編輯 / 刪除 | 高 |
| FR-203 | 支援團體報名 (team_members) | 高 |
| FR-204 | 報名時收集醫療資訊 (血型、過敏、藥物、病史) | 中 |
| FR-205 | 名額限制與候補 (waitlist) | 中 |
| FR-206 | 報名後串接綠界金流付款 | 高 |

### 2.3 財務與預算 (Finance & Budget)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-301 | 記帳收支 (transactions: income/expense) | 高 |
| FR-302 | 預算規劃 vs 實際支出儀表板 (budget_plans/actuals) | 高 |
| FR-303 | 產生財務報表 (收支配對、報名分析) | 高 |
| FR-304 | **僅 super_admin / finance 可見** 財務資料 (RLS) | 高 |

### 2.4 贊助商管理 (Sponsors)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-401 | 贊助商 CRUD + 方案等級 (sponsor_tier) | 高 |
| FR-402 | 贊助商專屬登入與後台 (sponsor-users / sponsor/dashboard) | 中 |
| FR-403 | 贊助商記錄關聯到賽事與交易 | 中 |

### 2.5 賽日營運 (Race Day)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-501 | 簽到 / 號碼布分配 (checkin) + QR Code 生成列印 | 高 |
| FR-502 | 即時計時 / 分段記錄 (timing_records) | 高 |
| FR-503 | 補給站管理 / 物資庫存 (aid_stations/checkpoints/supplies) | 中 |
| FR-504 | DNF/DNS 管理 (dnf_records) | 中 |
| FR-505 | 醫療驗證 (medical-verification) | 中 |
| FR-506 | 公開成績頁: 排行榜、分段時間、篩選 | 高 |

### 2.6 志工管理 (Volunteers)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-601 | 志工角色 / 排班 / 指派 / 簽到 | 中 |
| FR-602 | 志工領隊 (volunteer_lead) 角色權限 | 中 |

### 2.7 公告與內容 (News)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-701 | 公告 CRUD + Markdown + 排程發佈 | 高 |
| FR-702 | 公開公告列表與詳情頁 (+ SEO/JSON-LD) | 高 |
| FR-703 | 內容來源 (管理員) 已做 **XSS 淨化** | 高 |

### 2.8 Bot 與通知 (Bot & Notifications)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-801 | LINE / Telegram Bot: 賽事查詢、報名提醒 | 中 |
| FR-802 | 自訂指令動態 CRUD + 審計 (bot_commands) | 中 |
| FR-803 | 通知服務: Email (Resend) + Telegram + LINE (notification_logs) | 高 |

### 2.9 使用者與權限 (Users & RBAC)
| ID | 需求 | 優先級 |
|:---|:-----|:------:|
| FR-901 | 使用者管理 CRUD + Email (super_admin) | 高 |
| FR-902 | 6 種角色 RBAC (WAITING: super_admin/manager/finance/content_editor/volunteer_lead/sponsor_manager/viewer) | 高 |
| FR-903 | 密碼重設 (Forgot password → Email 重設連結) | 高 |
| FR-904 | 跑者自助平台 (/my): 個人資料、報名、成績 | 高 |

---

## 3. 非功能需求 (Non-Functional Requirements)

| 分類 | 需求 |
|:-----|:-----|
| **安全** | RLS 多租戶隔離、RBAC 雙層過濾、XSS 淨化、密碼 bcrypt、HTTPS、未授權 API 401 |
| **效能** | 公開頁 ISR 30-60s、Server Component 首載、動態 import 大 library |
| **可用性** | 公開頁 200、受保護頁 307 導登入、表單 loading/disabled 防重複 |
| **可維護性** | TypeScript 全型別、shadcn/ui 元件、品牌色集中 (brand-config.ts)、SQL migration 版本化 |
| **可擴展性** | Multi-tenant / White-label 架構 (projects/tenants 表 + project-config.ts) |
| **相容性** | 桌面 + 行動 (Tailwind 響應式)、LINE/Telegram/Email 多通知管道 |

---

## 4. 角色權限矩陣 (RBAC)

| 角色 | 財務 | 使用者管理 | Bot | Notion | 審計 |
|:-----|:----:|:----:|:----:|:------:|:----:|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ❌ | ✅ | ✅ | ❌ |
| finance | ✅ | ❌ | ✅ | ✅ | ❌ |
| content_editor | ❌ | ❌ | ❌ | ❌ | ❌ |
| volunteer_lead | ❌ | ❌ | ❌ | ❌ | ❌ |
| sponsor_manager | ❌ | ❌ | ❌ | ❌ | ❌ |
| viewer | ❌ | ❌ | ❌ | ❌ | ❌ |

> 詳細頁面/路徑權限矩陣見 `docs/software/COMPONENTS.md` 與 `docs/role-permissions.md`

---

## 5. 驗收標準 (Acceptance Criteria)

每次 Release 前需通過 **Release QA Gate**(見 `docs/software/QA.md`)— 包含 Build、公開/受保護頁 HTTP 狀態、DB 表格、Middleware、未登入 API 401、表單 try/catch/finally + disabled 稽核、Browserbase 三組使用者模擬驗證。

---

*本文件對應資料庫 28 張表、19 支 SQL migration、App Router 40+ 頁面、30+ API routes、6 種 RBAC 角色。*
