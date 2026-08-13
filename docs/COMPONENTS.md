# RaceOne 元件與模組應用指南

> **版本**: 1.0 | **日期**: 2026-08-07
> 說明每個頁面 / API / UI 元件 / 資料表之間的關係。

---

## 1. 前端元件 (UI Components)

`src/components/`

| 元件 | 用途 |
|:-----|:-----|
| `ui/*` | shadcn/ui 基礎元件 (Button, Card, Input, Select, Table, Badge, Tabs...) |
| `AppHeader.tsx` | 共用麵包屑導航 / 頁面標題 |
| `certificate/Certificate.tsx` | 完賽證書彈窗 + 下載 PNG/JPG (html-to-image 動態載入) |
| 其他 | 各頁面專用子元件 |

共用 library:
- `src/lib/supabase/server.ts` — Server Component 用 client (RLS context)
- `src/lib/supabase/client.ts` — Client Component 用 client
- `src/lib/supabase/admin.ts` — service-role admin client (bypass RLS)
- `src/lib/permissions.ts` — 角色權限工具
- `src/lib/brand-config.ts` — 品牌集中設定
- `src/lib/api-auth.ts` — `requireSuperAdmin` guard
- `src/lib/sanitize.ts` — 零依賴 XSS sanitizer (server)
- `src/lib/sanitize-client.ts` — DOMPurify client sanitizer
- `src/lib/category-mapping.ts` — DB 英文 enum → UI 中文
- `src/lib/utils.ts` — 格式化工具

---

## 2. 頁面 ↔ 功能 ↔ 資料表對應

### 公開區 `(public)/`
| 頁面 | 功能 | 資料表 |
|:-----|:-----|:------|
| `/` | 首頁 / 官方網站 | race_events |
| `/events` | 賽事列表 (ISR 60s) | race_events |
| `/events/[id]` | 賽事詳情 + 報名 CTA | race_events, race_categories |
| `/events/[id]/register` | 公開報名 (自助) | races→registrations, team_members |
| `/events/[id]/results` | 公開成績排行榜 (ISR 30s) | timing_records, registrations |
| `/news` | 公告列表 | news_posts |
| `/news/[slug]` | 公告詳情 | news_posts |

### 認證區
| 頁面 | 功能 |
|:-----|:-----|
| `/login` | 登入 |
| `/forgot-password` | 忘記密碼 → 寄重設 Email |
| `/reset-password` | 從 Email 連結重設密碼 |
| `/sponsor/login` | 贊助商登入 |

### 後台區 (受保護 / RBAC)
| 頁面 | 功能 | 資料表 | 權限 |
|:-----|:-----|:------|:-----|
| `/dashboard` | 儀表板 (統計 + 快速操作) | 多表 | 依角色 |
| `/races` · `/races/new` | 賽事 CRUD | race_events, race_categories | 全部除 viewer |
| `/races/[id]` | 賽事詳情 (多分頁) | race_events | 全部除 viewer |
| `/races/[id]/checkin` | 簽到 / 號碼布 | registrations | admin/volunteer |
| `/races/[id]/checkin/qr-codes` | QR 生成列印 | registrations | admin |
| `/races/[id]/timing` | 即時計時 | timing_records | admin/volunteer |
| `/races/[id]/aid-stations` | 補給站 / 物資 | aid_stations* | admin/volunteer |
| `/races/[id]/dnf-dns` | DNF/DNS | dnf_records | admin/volunteer |
| `/races/[id]/medical-verification` | 醫療驗證 | registrations | admin |
| `/races/[id]/notion` | Notion 同步 | notion_* | **super_admin, finance** |
| `/races/[id]/reports` | 財務報表 | transactions | **super_admin, finance** |
| `/races/[id]/volunteers` | 志工管理 | volunteer_* | super_admin, volunteer_lead |
| `/registrations` · `/registrations/new` | 報名管理 | registrations | 全部除 viewer |
| `/transactions` · `/transactions/new` | 收支明細 | transactions | **super_admin, finance** |
| `/budget` | 預算儀表板 | budget_* | **super_admin, finance** |
| `/sponsors` · `/sponsors/[id]` · `/sponsors/new` | 贊助商 | sponsors | admin/sponsor |
| `/schedule` | 行程甘特 | schedule_items | 依角色 |
| `/bot` · `/bot/commands` | Bot 管理 | bot_commands | **super_admin, finance** |
| `/volunteers` · `/volunteers/races` | 志工總覽 | volunteer_* | super_admin, volunteer_lead |
| `/users` | 使用者管理 + Email | profiles, auth.users | **super_admin** |
| `/my` | 跑者自助平台 | registrations, timing_records, profiles | 登入者 |
| `/sponsor/dashboard` | 贊助商後台 | sponsors | sponsor |

---

## 3. API Routes 分類

### 公開
| 端點 | 用途 |
|:-----|:-----|
| `POST /api/public/register` | 公開報名 (建帳號+報名+revalidatePath) |
| `GET /api/public/custom-fields` | 讀取報名自訂欄位 |

### 付款 (綠界)
| 端點 | 用途 |
|:-----|:-----|
| `POST /api/payments/create` | 建立付款 → 回傳綠界表單 |
| `POST /api/payments/notify` | 綠界付款通知 Webhook |
| `GET /api/payments/return` | 付款完成跳轉 |

### 使用者 (requireSuperAdmin)
| 端點 | 用途 |
|:-----|:-----|
| `GET/POST /api/users` | 列表 (合併 Email) / 建立 |
| `PATCH/DELETE /api/users/[id]` | 更新 / 刪除 |
| `POST /api/users/set-password` | 設定密碼 |
| `POST /api/users/reset-password` | 發送重設信 (Resend) |
| `POST /api/sponsor-users` | 建立贊助商帳號 |

### Bot / 通知
| 端點 | 用途 |
|:-----|:-----|
| `POST /api/bot/line`, `/api/bot/[project]/line` | LINE webhook |
| `POST /api/bot/telegram`, `/api/bot/[project]/telegram` | Telegram webhook |
| `POST /api/notifications/email` | Email 通知 |
| `POST /api/notifications/telegram` | Telegram 通知 |

### Mobile API
| 端點 | 用途 |
|:-----|:-----|
| `POST /api/mobile/auth/login` | 行動端登入 |
| `GET /api/mobile/events`, `/[slug]`, `/[slug]/results` | 行動端賽事/成績 |
| `GET /api/mobile/news`, `/api/mobile/me` | 行動端公告/我的 |

### Cron 任務
| 端點 | 用途 |
|:-----|:-----|
| `/api/cron/cancel-unpaid` | 取消未付款報名 |
| `/api/cron/deadline-reminder` | 截止提醒 |
| `/api/cron/schedule-reminder` | 行程提醒 |
| `/api/cron/publish-news` | 公告排程發佈 |
| `/api/cron/notion-sync` | Notion 同步 |
| `/api/cron/consolidated` | 彙總任務 |

### 其他
| 端點 | 用途 |
|:-----|:-----|
| `POST /api/checkin/qr` | 產生簽到 QR |
| `/api/notion/sync`, `/api/notion/test` | Notion 同步/測試 |

---

## 4. 中介層 (Middleware)

`src/middleware.ts` 職責:
1. **雙層驗證**: cookie presence + `supabase.auth.getUser()`
2. **RLS session**: 呼叫 `set_session_context_from_auth` RPC
3. **受保護路徑**: 未登入 → 導向 `/login` (含 redirect param)
4. **RBAC 路徑權限**: 依角色矩陣,無權限 → 導向 `/my` 或 `/dashboard`
5. **公開路徑排除**: `matcher` 排除 `_next/static` / `api/` / `events` / `news` / `login`

---

## 5. 資料流範例

### 公開報名流程
```
跑者 /events/[id]/register
  → POST /api/public/register (service-role)
  → 建立 auth user (trigger → profiles)
  → 寫入 registrations (+ team_members)  
  → revalidatePath 刷新公開頁 ISR
  → POST /api/payments/create → 綠界表單
  → notifyRegistration (Resend Email)
```

### 密碼重設流程
```
/forgot-password → supabase.auth.resetPasswordForEmail
  → (Dashboard Custom SMTP: Resend)
  → Email 內連結 → /reset-password (site_url)
  → supabase.auth.updateUser({password})
  → redirect /login
```
> Admin 端重設: POST /api/users/reset-password → admin.generateLink + Resend 直接寄信。

---

*本文件與 `SRS.md`、`ERD.md`、`architecture.html` 配套閱讀。*
