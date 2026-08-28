# 04 — 後端資料庫設計

> 本章教你：用 Supabase (PostgreSQL) 設計多租戶資料庫、RLS 安全策略、Auth 認證系統

---

## 🎯 本章目標

完成後你將擁有：
- 21 張資料表的多租戶資料庫
- Row Level Security (RLS) 完整防護
- 用戶認證系統 (Email + LINE)
- 角色權限管理 (super_admin / admin / superviewer)

## 4.1 資料庫架構概覽

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  tenants    │─────│ race_events   │─────│ registrations│
│ (租戶)      │     │ (賽事)        │     │ (報名)        │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐
        │aid_sta- │ │timing_  │ │dnf_    │
        │tions    │ │records  │ │records │
        │(補給站)  │ │(計時)   │ │(DNF)   │
        └─────────┘ └─────────┘ └─────────┘
```

### 核心表格 21 張

| 分類 | 表格 | 說明 |
|------|------|------|
| **租戶** | `tenants` | 多租戶組織（RaceOne、長明賞） |
| **用戶** | `profiles` | 用戶角色、綁定 LINE ID |
| **賽事** | `race_events` | 賽事基本資料、設定 |
| **賽事** | `race_categories` | 賽程組別 (100K/50K/21K) |
| **報名** | `registrations` | 跑者報名資料 |
| **賽事** | `aid_stations` | 補給站點管理 |
| **計時** | `timing_records` | 晶片計時資料 |
| **計時** | `dnf_records` | 未完賽記錄 |
| **財務** | `transactions` | 收支管理 |
| **財務** | `budget_plans` | 預算規劃 |
| **財務** | `budget_actuals` | 實際支出 |
| **贊助** | `sponsors` | 贊助商管理 |
| **公告** | `news_posts` | 最新消息/公告 |
| **通知** | `notification_logs` | 通知發送記錄 |
| **管理** | `schedule_items` | 賽程表管理 |
| **志工** | `volunteer_roles` | 志工角色 |
| **志工** | `volunteer_shifts` | 志工班表 |
| **LINE** | `bot_commands` | LINE Bot 指令設定 |
| **日誌** | `audit_logs` | 操作稽核日誌 |
| **日誌** | `bot_logs` | Bot 對話記錄 |
| **金流** | `payment_records` | 付款記錄 |

## 4.2 核心表格 Schema 範例

### tenants (租戶)

```sql
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,              -- 組織名稱
  slug TEXT UNIQUE NOT NULL,       -- 唯一代碼
  settings JSONB DEFAULT '{}',     -- 自訂設定
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### race_events (賽事)

```sql
CREATE TABLE race_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,              -- 賽事名稱
  slug TEXT NOT NULL,              -- URL 代碼 (changming2027)
  year INTEGER NOT NULL,           -- 年份
  status TEXT NOT NULL DEFAULT 'draft',
    -- draft | published | registration_open | closed
  location TEXT NOT NULL,          -- 舉辦地點
  start_at TIMESTAMPTZ NOT NULL,   -- 開始時間
  end_at TIMESTAMPTZ NOT NULL,     -- 結束時間
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',       -- 彈性設定
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tenant_id, slug)          -- 同一租戶下 slug 唯一
);
```

### profiles (用戶)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  role TEXT NOT NULL DEFAULT 'viewer',
    -- super_admin | admin | superviewer | viewer
  display_name TEXT,
  phone TEXT,
  line_user_id TEXT UNIQUE,        -- LINE User ID (U+32 hex)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 4.3 金額單位策略

**重要設計決策**：資料庫存「分」(cents)，UI 顯示「元」

```typescript
// 資料庫存：amount_cents: 1000  (代表 1000 分 = 10 元)
// UI 顯示：amount: 10 元

// 顯示轉換
function formatAmount(cents: number): string {
  return `NT$${(cents / 100).toLocaleString('zh-TW')}`;
}

// 儲存轉換
function toCents(amount: number): number {
  return Math.round(amount * 100);
}
```

**為什麼不分開存 decimal？**
- 避免浮點數誤差 (0.1 + 0.2 !== 0.3)
- 整數運算更快
- 國際通用模式 (Stripe 也用 cents)

## 4.4 Row Level Security (RLS)

### 啟用 RLS

```sql
-- 每張表都要執行
ALTER TABLE race_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
-- ... 每張表都要
```

### 角色策略表

| 角色 | 賽事(公開) | 賽事(管理) | 財務 | 用戶 |
|------|-----------|-----------|------|------|
| **anon** (未登入) | 可讀已發布 | ❌ | ❌ | ❌ |
| **viewer** | 同 anon | ❌ | ❌ | 僅自己 |
| **superviewer** | 可讀 | 唯讀 | 唯讀 | 唯讀 |
| **admin** | 可讀 | CRUD | CRUD | 同租戶 |
| **super_admin** | 可讀 | CRUD (跨租戶) | CRUD | 全部 |

### RLS 策略範例

```sql
-- 公開頁面：任何人都能看到已發布的賽事
CREATE POLICY "Public can read published events"
  ON race_events FOR SELECT
  USING (status IN ('published', 'registration_open'));

-- 管理後台：只有同租戶的 admin 以上可以管理
CREATE POLICY "Admins can manage their tenant events"
  ON race_events FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (true);

-- 財務資料：嚴格保護
CREATE POLICY "Only admins can read transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'superviewer')
      AND tenant_id = transactions.tenant_id
    )
  );
```

### RLS 遞迴保護

```sql
-- ❌ 錯誤：會造成 infinite recursion
CREATE POLICY "Bad recursive policy"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles  -- ← 遞迴!
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ✅ 正確：用 auth.jwt() 替代遞迴查詢
CREATE POLICY "Safe admin check"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR auth.jwt() ->> 'role' = 'super_admin'
  );
```

## 4.5 Auth 認證流程

### Supabase Auth 內建支援

| 方式 | 實作 |
|------|------|
| Email + Password | 內建 (signUp / signIn) |
| Magic Link | 內建 |
| Google OAuth | 內建 |
| LINE Login | 自訂 (LIFF) |
| Phone OTP | 內建 |

### LINE Login 整合

```typescript
// LIFF 登入流程
// 1. 用戶在 LINE 中開啟 LIFF
// 2. LIFF 取得 LINE User ID
// 3. 寫入 profiles.line_user_id
// 4. LINE Bot 透過 User ID 識別用戶

// settings/page.tsx (LIFF 綁定頁)
const liff = await import('@line/liff');
await liff.default.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
const profile = await liff.default.getProfile();
const lineUserId = profile.userId;  // U+32 hex
```

## 4.6 實戰 Lessons Learned

### ✅ 做對的事
- 所有金額存 cents → 避開浮點數
- 每張表都有 RLS → 沒人能看到不該看的
- 用 EXISTS 取代遞迴查詢 → 避開 infinite recursion

### ❌ 踩過的坑
- 忘了啟用 RLS → anon 可以讀 transactions
- RLS 遞迴 → `infinite recursion detected` → 改 EXISTS/JSON
- service_role key 過期 → 更新 .env 後忘記同步到 Vercel
- `.single()` 查不到資料噴 PGRST116 → 改 `.maybeSingle()`

---

**下一章**：[05 — LINE Bot 整合](05-integration-line.md)