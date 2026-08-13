# RaceOne Demo 環境部署指引 (demo.raceone.ai)

> 目標：建立一個 **公開可瀏覽、但所有寫入操作被攔截** 的 Demo 環境，供面試官 / 客戶 / 履歷展示用。
> 與 production 完全隔離（獨立 Supabase 專案、獨立 Vercel 部署、獨立資料庫），不影響正式資料。

---

## 📋 部署前準備

| 項目 | 說明 | 取得方式 |
|------|------|----------|
| **Supabase 專案** | 新建一個空的 demo 專案（不要用 production） | [Supabase Dashboard](https://supabase.com/dashboard) → New Project |
| **Supabase URL + Anon Key** | 專案連接設定 | Dashboard → Settings → API |
| **Supabase Service Role Key** | 用於建立 demo 帳號（敏感，僅本地用，勿 commit） | Dashboard → Settings → API |
| **Vercel 專案** | 新建 demo 專案（或 reuse 既有但用不同 production branch） | [Vercel Dashboard](https://vercel.com) |
| **網域** | `demo.raceone.ai` CNAME → Vercel | Cloudflare DNS |

---

## 🚀 Step 1 — 建立 Demo 資料庫+資料

```bash
cd /root/raceone-showcase

# 執行設定腳本（會建立 .env.demo、注入 migration、填入 seed、建立帳號）
chmod +x scripts/setup-demo.sh
./scripts/setup-demo.sh https://<ref>.supabase.co <ANON_KEY> <SERVICE_ROLE_KEY>
```

腳本會：
1. 產生 `.env.demo`（含 `NEXT_PUBLIC_DEMO_MODE=true` 及關閉外部整合的 flag）
2. 執行 `supabase/migrations/*.sql`（需你從私有 `raceone-admin` repo 複製過來；**會自動過濾 super_admin/finance 寬鬆 Policy**）
3. 執行 `scripts/demo-seed.sql` 填入：
   - 1 個 tenant（RaceOne Demo）
   - 1 個賽事（2026 長明超馬 Demo，published 開放報名）
   - 3 個組別（100K / 50K / 25K）
   - 3 篇公開公告
   - 4 個贊助商
   - 8 個行程（甘特圖展示）
   - 5 個補給站 + 完整物資庫存
   - 2 筆報名（confirmed + paid）+ 完整計時成績
   - 12 筆預算規劃 + 6 筆實際
4. 建立 3 個 demo 帳號（需 service role，失敗會給手動指引）

> **注意**：`setup-demo.sh` 假設 migration 檔存在於 `supabase/migrations/`。此 directory 在 showcase 是空的（因隱私），需你先從 `raceone-admin` 複製 migration。若想跳過 migration，可直接只跑 seed：
> ```bash
> psql "postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres" -f scripts/demo-seed.sql
> ```

---

## 🚀 Step 2 — 前端 Demo 模式守衛

**已內建於 showcase**：
- `src/lib/demo-mode.ts` — 前端 Button/Form Guard（`demoGuard(action)`、`withDemoGuard()`、`useDemoGuard()`）
- `src/lib/demo-api-guard.ts` — Server API / Server Action Guard（`demoApiGuard(req)`、`withDemoApiGuard()`、`demoServerActionGuard()`）

**運作原理**：當 `NEXT_PUBLIC_DEMO_MODE=true` 時，上述 guard 會攔截所有寫入操作（新增/編輯/刪除/發送/同步/金流），回傳 403 或友善提示。

> 在 production 的完整功能版（私有 repo），你需在每個**寫入 API/Server Action** 頂部加入守衛。在 showcase 只是展示守衛實作範例。

---

## 🚀 Step 3 — 部署到 Vercel

### 3A. 連結 GitHub repo
1. Vercel → New Project → Import `randallkwo/raceone-showcase`
2. 但注意：**showcase 沒有 `src/app/`**，是純展示/參考，**無法獨立 build**。
3. **正確做法**：部署的是**私有 production repo**（`raceone-admin`），只是餵入 `.env.demo` 的變數，並設 `NEXT_PUBLIC_DEMO_MODE=true`。

### 3B. Production 與 Demo 用同一 codebase 的不同環境變數
| 環境 | 部署 branch | `NEXT_PUBLIC_APP_URL` | `NEXT_PUBLIC_DEMO_MODE` |
|------|------------|----------------------|--------------------------|
| **Production** | `main` | `https://www.raceone.ai` | `false` |
| **Demo** | `main`（Vercel 別名 demo.raceone.ai）或獨立 branch | `https://demo.raceone.ai` | `true` |

Vercel 支援「同 repo、多專案」：建立兩個 Vercel project，各自設定 env，分別掛到不同 domain。

### 3C. 環境變數設定
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service-role>
NEXT_PUBLIC_APP_URL=https://demo.raceone.ai
NEXT_PUBLIC_DEMO_MODE=true
DISABLE_NOTION_SYNC=true
DISABLE_EMAIL_SEND=true
DISABLE_BOT_WEBHOOK=true
MOCK_PAYMENT_WEBHOOK=true
MOCK_TIMING_REALTIME=true
```

### 3D. 網域
```bash
# Cloudflare DNS：CNAME
demo.raceone.ai → cname.vercel-dns.com
# （依 Vercel 給的 target 調整）
```

---

## ✅ Step 4 — 驗證

```bash
# 1. 公開頁面
curl -sI https://demo.raceone.ai        # 200
curl -sI https://demo.raceone.ai/events # 200
curl -sI https://demo.raceone.ai/login  # 200

# 2. 透過 API 確認寫入被攔截（Demo 模式應回 403 DEMO_MODE_BLOCKED）
curl -s -X POST https://demo.raceone.ai/api/races \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"name":"test"}'   # 預期 403

# 3. 手動登入 3 帳號截圖
#    admin@demo.raceone.ai / demo1234  (後台唯讀)
#    viewer@demo.raceone.ai / demo1234 (跑者視角)
```

---

## 🔐 Demo 帳號

| 帳號 | 密碼 | 角色 | 能看到 |
|------|------|------|--------|
| `admin@demo.raceone.ai` | `demo1234` | super_admin | 全部（唯讀） |
| `finance@demo.raceone.ai` | `demo1234` | finance | 財務/預算（唯讀） |
| `viewer@demo.raceone.ai` | `demo1234` | viewer | 我的報名、我的成績、賽事列表 |

---

## ⚠️ 安全注意

1. **Demo 用獨立 Supabase 專案**——絕不連 production DB
2. **`.env.demo` 含 service role key，勿 commit**（加入 `.gitignore`）
3. Demo 資料全為模擬（固定 UUID、假姓名、假電話）
4. `NEXT_PUBLIC_DEMO_MODE=true` 是最後防線，**RLS 仍應啟用**（資料庫層不該依賴前端 flag）
5. 若 Demo 環境要展示「管理後台」，務必確認 service_role 不會被前端拿到（只放 server-side）

---

## 📁 相關檔案

| 檔案 | 用途 |
|------|------|
| `scripts/setup-demo.sh` | 一鍵建立 demo DB + seed + 帳號 |
| `scripts/demo-seed.sql` | 完整種子資料（UUID 已校正） |
| `src/lib/demo-mode.ts` | 前端閃攔截 |
| `src/lib/demo-api-guard.ts` | 後端 API 攔截 |
| `.env.demo` | 產生後請加入 `.gitignore` |

---

**做完以上 → 在 README 把 demo 網址換成真實 `https://demo.raceone.ai`，即可放入履歷。**
