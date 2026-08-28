# 09 — 踩坑記錄與教訓

> 本章收錄 RaceOne 開發過程中 11 個最痛的錯誤，以及如何避免

---

## 🎯 為什麼要看這章

每個錯誤都曾經讓我們卡關 1-6 小時。看完這章，你可以避開這 11 個坑，節省至少一週的開發時間。

---

## 🕳️ 坑 #1: RLS 遞迴 (infinite recursion)

### 症狀
```sql
ERROR: infinite recursion detected in policy for relation "profiles"
```

### 原因
```sql
-- ❌ 錯誤：policy 中又查詢 policies，造成無窮遞迴
CREATE POLICY "admin" ON profiles FOR ALL USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles          -- ← 又查 profiles!
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);
```

### 解法
```sql
-- ✅ 正確：用 auth.jwt() 替代遞迴查詢
CREATE POLICY "admin" ON profiles FOR ALL USING (
  id = auth.uid()
  OR auth.jwt() ->> 'role' = 'super_admin'    -- ← 從 JWT 直接取
);
```

### 教訓
**永遠不要在建 policy 時查詢自己那張表**，用 JWT claim 或 EXIST 查一張不會遞迴的表。

---

## 🕳️ 坑 #2: `.single()` 噴 PGRST116

### 症狀
```typescript
const { data } = await supabase.from('race_events').select('id').eq('slug', slug).single();
// 如果沒有 match → PGRST116: "The result contains 0 rows"
```

### 原因
`.single()` 要求**恰好回傳 1 筆**，0 筆或多筆都 crash。

### 解法
```typescript
// ✅ 用 .maybeSingle()
const { data } = await supabase.from('race_events').select('id').eq('slug', slug).maybeSingle();
// data 可能是 null，但不會 crash
```

### 教訓
只有「**100% 確定該查詢必有資料**」時才用 `.single()`（如 `auth.getUser()`），否則一律 `.maybeSingle()`。

---

## 🕳️ 坑 #3: 圖表線條透明

### 症狀
圖表上有 tooltip 但看不到線條。

### 原因
```tsx
// ❌ 錯誤：hsl(var(--chart-1)) 在 Recharts 中 undefined
<Line stroke="hsl(var(--chart-1))" />

// ✅ 正確：明確十六進位色碼
<Line stroke="#0066FF" />
```

### 教訓
Recharts 的 `stroke` 不接受 CSS variable。**圖表色碼一律用硬編碼十六進位**。

---

## 🕳️ 坑 #4: `pnpm` 和 `npm` 混用

### 症狀
```bash
npm install     # 裝了 package-lock.json
pnpm run build  # 壞掉
# node_modules 裡混亂的連結
```

### 解法
```bash
# 解決方法
rm -rf node_modules package-lock.json
pnpm install

# 團隊規則：只用 pnpm，加入專案 README
```

### 教訓
專案一開始就決定套件管理器，寫進 `.npmrc` 強制：
```bash
# .npmrc
engine-strict=true
```

---

## 🕳️ 坑 #5: Vercel 環境變數不同步

### 症狀
本地 build OK，部署後 AP 回 500 或認證失敗。

### 原因
```bash
# 更新了 .env.local 但忘記同步到 Vercel Dashboard
SUPABASE_SERVICE_ROLE_KEY 在新版已更新
Vercel 上還是舊的 key → API 403
```

### 解法
每次更新環境變數後：
```bash
# 1. 在 Vercel Dashboard 更新
# 2. 重新部署 (git commit --allow-empty && git push)
# 3. 驗證
curl -I https://www.raceone.ai/api/health
```

### 教訓
環境變數是「部署配置」，不是「程式碼」。改 .env 一定要同步到 Vercel。

---

## 🕳️ 坑 #6: Middleware 保護了不該保護的路徑

### 症狀
```bash
curl https://www.raceone.ai/news
# 回 307 跳轉到登入頁 (但公告應該是公開的!)
```

### 原因
```typescript
// ❌ 錯誤的 matcher
matcher: ['/((?!_next/static|favicon.ico).*)']
// 擋住了除了 next 和 favicon 以外的所有路徑
```

### 解法
```typescript
// ✅ 正確：明確排除公開路徑
matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|api/|$|events(?:/.*)?$|news(?:/.*)?$|login|guide).*)']
```

### 教訓
Middleware matcher regex 要**明確列出所有公開路徑**，否則容易誤擋。

---

## 🕳️ 坑 #7: 雙重 `<main>` Landmark

### 症狀
Accessibility 掃描報：`Document should not have more than one main landmark`

### 原因
```tsx
// public layout.tsx 有 <main>
<main className="bg-[#F8FAFC]">{children}</main>

// news/[slug]/page.tsx 又包一層 <main>
<main className="max-w-4xl mx-auto">...</main>
```

### 解法
```tsx
// 頁面層用 <div> 取代 <main>
<div className="max-w-4xl mx-auto">...</div>
```

### 教訓
Layout 已經有 `<main>` 時，頁面層要用 `<div>` 或 `<section>`，不可巢狀 `<main>`。

---

## 🕳️ 坑 #8: Vercel Hobby Cron 限制

### 症狀
設了 4 個 cron 排程，但只有第 1 個執行。

### 原因
Vercel Hobby Plan 的 crons 限制：
- **每天只能執行 1 次**
- 不能設定執行時間

### 解法
```typescript
// 合併所有 cron 為單一端點
// src/app/api/cron/daily/route.ts
export async function GET() {
  await Promise.all([
    notionSync(),
    cleanOldLogs(),
    updateStats(),
    healthCheck(),
  ]);
  return Response.json({ ok: true });
}

// vercel.json: 只設一個 cron
{
  "crons": [{
    "path": "/api/cron/daily",
    "schedule": "0 0 * * *"
  }]
}
```

### 教訓
Hobby Plan 要把所有 cron 合併。升級 Pro ($20/月) 才能多 cron。

---

## 🕳️ 坑 #9: 金額單位不一致

### 症狀
DB 存 1000（分），UI 顯示 1000 元（應為 10 元），差了 100 倍。

### 原因
開發初期沒有統一約定「DB 存分、UI 顯示元」。

### 解法
```typescript
// DB 欄位命名：amount_cents (強制提醒)
// 所有查詢前先確認單位

// 查詢時
const { data } = await supabase.from('transactions').select('amount_cents');
// 顯示時
<TableCell>NT${(amount_cents / 100).toFixed(0)}</TableCell>
```

### 教訓
**金額單位應該寫進欄位名稱** (`amount_cents`)、API 文件、和 migration 註解。

---

## 🕳️ 坑 #10: LLM Agent 擅加 i18n

### 症狀
```bash
git status --porcelain
# ?? src/app/next-intl/  ← 誰裝的?!
```

### 原因
Agent 自己判斷「這個專案需要多國語言」就擅自裝了 `next-intl` 並改了 middleware。

### 解法
```bash
# 每次 Agent 工作後檢查未追蹤檔案
git status --porcelain | grep "^??"
```

### 教訓
Agent 有創造力，但也會做你不想要的事。**每次 Agent 交作業後先 `git status`**，確認沒有不該有的檔案。

---

## 🕳️ 坑 #11: LINE Webhook 超時

### 症狀
LINE Bot 回覆慢，有時不回。

### 原因
Webhook 跑在 Vercel Serverless（10s timeout），但 LLM 處理 + LINE API 回覆需要更久。

### 解法
```bash
# 搬到 VPS 跑 systemd service，無 timeout 限制
server {
    listen 8443 ssl;
    location /webhook {
        proxy_pass http://127.0.0.1:3000;
        proxy_read_timeout 120s;
    }
}
```

### 教訓
**LINE Bot Webhook 不該放在 Serverless**。要用 VPS 或長期運行的服務。

---

## 📊 統計

| 坑 # | 類別 | 損失時間 | 偵測方式 | 預防方法 |
|------|------|----------|----------|----------|
| 1 | RLS | 4h | 錯誤訊息 | 用 JWT 代替遞迴查詢 |
| 2 | .single() | 2h | 線上 crash | 一律 maybeSingle |
| 3 | 圖表 | 3h | 用戶回報 | 用十六進位色碼 |
| 4 | 套件 | 1h | build fail | 鎖定套件管理器 |
| 5 | 環境變數 | 1h | 線上 error | 改 env 後檢查 Vercel |
| 6 | Middleware | 3h | 用戶回報 | regex 明確排除公開頁 |
| 7 | 無障礙 | 30min | axe-core | layout 標準化 |
| 8 | Cron | 2h | 沒執行 | 合併 cron |
| 9 | 金額 | 4h | 財務回報 | 欄位名加 cents |
| 10 | i18n | 30min | git status | 每次檢查 |
| 11 | timeout | 2h | 用戶回報 | VPS 代替 Serverless |

**總計：約 23 小時的踩坑時間**，透過記錄和技能庫避免重複犯錯。

---

**下一章**：[10 — 附錄與工具速查表](10-appendix.md)