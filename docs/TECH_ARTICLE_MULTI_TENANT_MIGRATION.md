# 技術文章大綱：多租戶白牌遷移 —— 從單一賽事到 SaaS 架構的資料庫重構實錄

**目標發布平台**：個人部落格 / Medium / Notion 公開頁面  
**預估字數**：2,800-3,500 字  
**目標讀者**：系統架構師、資深後端、考慮 SaaS 化的獨立開發者  
**SEO 關鍵字**：多租戶架構, SaaS migration, white-label, 租戶隔離, Supabase 多租戶, 系統重構

> **本文是 RaceOne 技術系列第 2 篇**。系列導覽：① RLS 細粒度權限 → ② 多租戶白牌遷移（本篇）→ ③ Bot Gateway → ④ 即時計時 → ⑤ QA Gate。

---

## 📋 文章結構總覽

```
1. 開場：什麼是「白牌 SaaS」？為什麼要遷移？（300 字）
2. 遷移前現況盤點：單一賽事系統的隱形負債（500 字）
3. 目標架構：租戶隔離的 3 種模型與取捨（400 字）
4. 資料庫層：tenant_id 的穿透式設計（600 字）
5. 應用層：租戶上下文傳播 —— 最容易被忽略的痛點（600 字）
6. 品牌白牌化：把 11 個硬編碼改成集中設定（500 字）
7. 遷移執行：階段化、可回滾、零停機（400 字）
8. 成本與風險：實際工時、踩過的坑、防禦策略（400 字）
9. 總結與可複製檢查清單（200 字）
```

---

## 1. 開場：什麼是「白牌 SaaS」？為什麼要遷移？（~300 字）

### Hook
> 「我們的 RaceOne 平台最初只服務『長明賞超馬盃』一場賽事。當線上賽事主辦方開始問『能不能幫我也做一份』時，我們面臨一個抉擇：**是複製程式碼給每一家？還是把產品改造成一套程式碼服務所有賽事？** 前者快，但意味著永遠背著 N 份程式碼、N 份 bug、N 次修復的債。後者是 SaaS 的正道，但代價是一次艱難的架構遷移。這篇文章記錄我們如何從『單一賽事系統』重構成『多租戶白牌平台』——包括踩過的坑、砍掉的進度，和最終 48-84 小時的實際遷移成本。」

### 背景數字
- 起點：單一租戶（Changming 長明賞超馬盃）、單一 Organizer
- 終點：多租戶白牌平台，每租戶可有自己的品牌、賽事、設定
- 資料庫：Supabase PostgreSQL / Next.js 14 前端

---

## 2. 遷移前現況盤點：單一賽事系統的隱形負債（~500 字）

### 2.1 硬編碼是 SaaS 化的頭號敵人

我們用一個審計腳本掃出所有「寫死」的值，這些在單一租戶下沒問題，下一秒就會變成多租戶地雷：

| 硬編碼類型 | 數量 | 範例 | 嚴重性 |
|-----------|------|------|:------:|
| **Event UUID** | 3 處 | `const EVENT_ID = 'dfbc887d-...'` | 🔴 嚴重 |
| **品牌名稱「長明賞超馬盃」** | 11+ 處 | Footer、登入頁、儀表板、頁面描述 | 🔴 嚴重 |
| **網域 raceone.ai** | 3 處 | fallback URL、登入 placeholder | 🟡 中 |
| **種子資料** | 1 個 | migration 內建「2026 長明賞」公告 + 特定 URL | 🟡 中 |
| **品牌色** | 0（幸運） | 預設 shadcn 主題，未硬編碼 | 🟢 佳 |

> **教訓**：SaaS 化不是在開發完才做，而是在開發的第一天就要用 `brand-config.ts`、`EVENT_ID` 動態化等「防硬編碼」的紀律。我們前期沒做到，後期就得花 48-84 小時還債。

### 2.2 評估：資料庫層 vs 應用層的成熟度差距

| 層級 | 成熟度 | 說明 |
|------|:------:|------|
| **資料庫多租戶** | 🟢 3/10 | 結構幾乎完善：`tenants` 表、`race_events.tenant_id`、RLS 全表啟用 |
| **應用程式多租戶** | 🔴 8/10 | 無租戶上下文傳播、前端大量硬編碼 ID |
| **品牌白牌化** | 🔴 7/10 | 品牌名稱散落 11+ 處 |
| **部署可移植性** | 🟡 5/10 | 缺 Docker/CI、種子含品牌資料 |

> 我們最大的意外是：**資料庫早就準備好了，但應用層完全沒跟上**。Schema 設計者在第一天就把 `tenants` 表和 RLS 建好了，卻沒有把「誰是當前租戶」這個資訊從登入一路傳到查詢。

---

## 3. 目標架構：租戶隔離的 3 種模型與取捨（~400 字）

多租戶隔離有三種主流模型，我們在設計階段評估如下：

### 模型比較

| 模型 | 隔離度 | 成本 | 適合場景 | 我們的選擇 |
|------|:------:|:----:|----------|:----------:|
| **① 獨立資料庫/獨立 Schema** | 最高 | 最高（每租戶一 DB） | 企業級、法規嚴格 | ❌ |
| **② 共用資料庫 + 共用 Schema + Row-Level 隔離** | 中高 | 低（單一 DB） | 中小型 SaaS、白牌 | ✅ **採用** |
| **③ 共用資料庫 + 每個租戶一個 Schema** | 高 | 中 | 中型、需 Schema 層隔離 | ❌ |

### 為什麼選擇「共享 Schema + RLS 隔離」？

1. **成本極低**：單一 Supabase 專案，不須為每租戶開 DB
2. **遷移成本低**：既有單一租戶資料幾乎不用搬移
3. **擴充彈性**：需要時可升級為「獨立 Schema」或「獨立 DB」而不動業務邏輯
4. **RLS 當最後防線**：配合上一篇的 RLS 細粒度控制，資料庫層強制隔離

### 隔離維度設計

```
租戶隔離（tenant_id）→ 賽事隔離（event_id）→ 使用者隔離（user_id）
     ↑                    ↑                    ↑
  組織層級            賽事層級              個人層級
  tenants           race_events           profiles / registrations
```

---

## 4. 資料庫層：tenant_id 的穿透式設計（~600 字）

### 4.1 直接 vs 間接 tenant_id

審計發現我們有**兩種**隔離路徑：

```sql
-- 直接持有 tenant_id（隔離最強、查詢最快）
CREATE TABLE race_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),  -- 🔑 直接
  slug TEXT,
  UNIQUE (tenant_id, slug)  -- 防跨租戶 slug 衝突
);

-- 間接（透過 event_id → race_events → tenant_id）
CREATE TABLE registrations (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES race_events(id),
  -- 沒有 tenant_id！隔離靠 JOIN 一層層往上找
);
```

### 4.2 穿透式隔離的 RLS 寫法

```sql
-- 間接表透過 EXISTS 子查詢穿透到租戶
CREATE POLICY "registrations_tenant_isolation" ON registrations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM race_events re
    WHERE re.id = registrations.event_id
    AND re.tenant_id = current_tenant_id()  -- 穿透查詢
  )
);
```

### 4.3 審計發現的 18 張表隔離路徑

| 隔離方式 | 表格 | 風險 |
|---------|------|------|
| ✅ 直接 `tenant_id` | `profiles`, `race_events`, `registration_custom_fields` | 低 |
| ⚠️ 間接 `event_id` | `registrations`, `transactions`, `sponsors`, `schedule_items`, `news_posts`, `bot_commands`, `aid_*`, `timing_records`, `dnf_records`, `notion_*` | 中（查詢較慢） |
| ❌ 無隔離 | `audit_logs`, `budget_plans` | 🔴 高 |

> **進階建議**：高流量表（`transactions`、`timing_records`）應**反規範化加直接 `tenant_id`**，用空間換查詢效能，避免每次都要 JOIN 到 `race_events` 才能隔離。

---

## 5. 應用層：租戶上下文傳播 —— 最容易被忽略的痛點（~600 字）

### 5.1 問題核心：資料庫知道「有租戶」，但應用沒告訴它「我是誰」

這是整個遷移**最關鍵也最隱晦**的 bug。格局是這樣：

```
✅ 資料庫端：RLS 政策寫了 WHERE tenant_id = current_tenant_id()
❌ 應用端：current_tenant_id() 永遠回傳 NULL（JWT 沒帶、session 沒設定）
=> 結果：所有需要 RLS 的查詢回傳「空」
```

### 5.2 作為（錯誤）workaround 的 Admin Client

因為 RLS 一直回傳 NULL，開發者發現「用 `createAdminClient()`（service_role）就查得到」，於是一堆 bot、cron、付款邏輯都用 service_role client 繞過 RLS：

| 檔案 | 用途 | 繞過 RLS 風險 |
|------|------|:------------:|
| `bot/line.ts` | LINE Bot 處理器（6 處） | 🔴 跨租戶資料 |
| `bot/telegram.ts` | Telegram Bot（6 處） | 🔴 跨租戶資料 |
| `cron/tasks.ts` | 新聞發布、截止提醒 | 🔴 任意租戶 |
| `api/public/register` | 公開報名 | 🔴 |
| `api/payments/*` | 付款建立/回調 | 🔴 |

> **這是典型的「RLS 設定失敗 → 用管理員權限繞過 → 權限模型形同虛設」的惡性循環**。修復必須從「讓 RLS 真正運作」著手，而不是繼續繞。

### 5.3 正確解法：租戶上下文全鏈路傳播

```
登入 (Auth)                    Middleware                    Supabase Query
   │                               │                              │
   │ JWT 含 tenant_id+role         │ 解碼 JWT claims              │
   └──────────────────────────────▶│ supabase.rpc('set_context',  │
                                   │   { tenant_id, role })       │──▶ 查詢受 RLS 保護
                                   │ 或 set_config session 變數   │
```

```typescript
// middleware.ts（關鍵修復）
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-auth-token')
  const claims = decodeJwt<{tenant_id: string; role: string}>(token.value)
  
  // 用 RPC 設定 PostgreSQL session 變數（RLS 靠它取值）
  await supabase.rpc('set_tenant_context', {
    tenant_id: claims.tenant_id,
    role: claims.role
  })
}

// Supabase client wrapper 統一設定
export const createServerClient = (req: NextRequest) => {
  const client = createServerSupabaseClient(req)
  client.rpc('set_tenant_context', { /* 從 req claims 讀 */ })
  return client
}
```

```sql
-- 對應的 SQL function
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
  PERFORM set_config('app.current_user_role', p_role, false);
END $$;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;
```

### 5.4 減少 service_role 使用的原則

> **規則**：`createAdminClient()` 只用在「平台級、無租戶概念」的操作（建立使用者、付款處理金鑰），**所有**資料查詢、品牌資料讀取一律用帶租戶上下文的 `createServerClient()`。

---

## 6. 品牌白牌化：把 11 個硬編碼改成集中設定（~500 字）

### 6.1 品牌資產盤點

| 資產 | 遷移前 | 遷移後 |
|------|--------|--------|
| 應用程式名稱 | 硬編碼「長明賞超馬盃」「RaceOne」 | `tenants.config.branding.app_name` |
| Footer 文字 | 3 個檔案硬編碼 | 共用 `<AppFooter>` 元件 |
| 登入頁標題 | 硬編碼 | `branding.app_name` |
| 頁面描述 | 各頁面硬編碼 | `branding.app_tagline` |
| 品牌主色 | shadcn 預設 | `tenants.config.theme.primary` |
| Logo/Favicon | public/ 為空 | `tenants.config.theme.logo_url` |

### 6.2 中心化品牌設定 Schema

```jsonc
// tenants.config (JSONB)
{
  "theme": {
    "primary": "221.2 83.2% 53.3%",   // 改為 per-tenant
    "logo_url": "/logos/tenant-a.svg",
    "favicon_url": "/logos/tenant-a.svg"
  },
  "branding": {
    "app_name": "長明賞超馬盃",
    "app_tagline": "賽事管理平台",
    "footer_text": "© 2026 {app_name}. {tenant_name}"
  },
  "features": {
    "line_bot": true,
    "telegram_bot": false,
    "newebpay": true
  }
}
```

### 6.3 集中化元件的實作

```typescript
// src/lib/brand.ts —— 單一品牌真相來源
export const getBrand = async (tenantId: string) => {
  const { data } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', tenantId)
    .single()
  return data.config.branding
}

// 共用 Footer / AppHeader / Metadata 元件
// 所有頁面改參考這些元件，不再各自硬編碼
```

> **教訓**：品牌文字散落在 11+ 處，是因為前期沒有「集中化」紀律。修復的正確方式是建立「共用元件」，而不是一次改 11 個字串。

---

## 7. 遷移執行：階段化、可回滾、零停機（~400 字）

### 7.1 六階段遷移計畫（總計 48-84 小時）

| 階段 | 內容 | 估時 | 可回滾性 |
|------|------|:----:|:--------:|
| **1. 租戶上下文** | middleware JWT claim、client wrapper、session 設定 | 16-24h | 高（純加 code） |
| **2. 硬編碼 Event ID** | 4 頁改用 URL 路由參數動態決定 | 4-8h | 高 |
| **3. 硬編碼品牌文字** | 集中化品牌、共用元件 | 8-12h | 中 |
| **4. 資料庫強化** | 高流量表加直接 `tenant_id`、索引、更新 RLS | 4-8h | 低（DB 變更需審慎） |
| **5. Admin Client 審計** | 減少 service_role client 使用 | 8-16h | 高 |
| **6. 部署基礎設施** | Dockerfile、CI/CD、種子資料清理 | 8-16h | 高 |

### 7.2 關鍵紀律

1. **每個階段獨立 PR + 回滾腳本**——任何一步失敗都不影響其他階段
2. **DB migration 一律向前相容**——先加欄位，後改查詢，最後才刪舊欄
3. **Seed 資料從 migration 抽離**——品牌特定資料不該在 migration 裡（我們前期把「2026 長明賞」種子放進 migration，是錯誤示範）
4. **逐步下線 service_role**——用 feature flag 切換，綠燈才移除

### 7.3 遷移後驗證

```bash
# 建立第二個租戶 sandbox 驗證隔離
curl -X POST /api/tenant-a/races        # 201 建立
curl -X POST /api/tenant-b/races        # 201 建立
curl -H "tenant: A" /api/races          # 只看得到 A 的賽事
curl -H "tenant: B" /api/races          # 只看得到 B 的賽事（隔離成功）
```

---

## 8. 成本與風險：實際工時、踩過的坑、防禦策略（~400 字）

### 8.1 實際成本

| 項目 | 成本 |
|------|------|
| 總工時 | 48-84 小時（約 1.5-2.5 週全職） |
| 最大單一成本 | 階段 1（租戶上下文），16-24h——因為前期 bug 累積太多 |
| 最少成本 | 階段 2（硬編碼 ID），4-8h——純機械性替換 |
| 若一開始就設計多租戶 | 估計可省 60-70%（約省 40-50 小時） |

### 8.2 踩過的坑（血淚清單）

| 坑 | 症狀 | 防禦 |
|----|------|------|
| **RLS 回傳 NULL 就改用 service_role 繞過** | 權限模型形同虛設、跨租戶資料洩漏 | 修復上下文傳播，而非繼續繞 |
| **migration 內嵌品牌種子資料** | 部署新租戶會帶入舊品牌資料 | 種子獨立 `seed.sql`，不進 migration |
| **硬編碼 Event UUID** | 只能操作一場賽事 | 立即改用路由參數/查詢 |
| **直接 + 間接 tenant_id 混用** | 查詢效能不一致、隔離漏洞 | 統一規則：高流量表反規範化加直接 `tenant_id` |
| **service_role 過度使用** | 失去 RLS 保護 | 嚴格定義什麼能用 admin client |

### 8.3 防禦策略

1. **RLS Regression Test**（沿用第 1 篇的 Matrix 測試）
2. **每階段獨立回滾腳本**
3. **多租戶隔離手動測試**：兩個沙盒租戶互相驗證看不到對方資料
4. **審計日誌強化**：`audit_logs` 也加 `tenant_id`，讓每個動作可追溯到租戶

---

## 9. 總結與可複製檢查清單（~200 字）

### 核心洞察

1. **SaaS 化真正難的不是資料庫，而是應用層的租戶上下文**——資料庫 Schema 可能早準備好了，但「當前租戶是誰」沒傳下去，RLS 就白搭
2. **防硬編碼是第一天就該有的紀律**，補救成本是原始成本的 3 倍
3. **共享 Schema + RLS 是多租戶性價比最高的起點**，隔離度不夠再升級，不需重寫
4. **幣值用直接 tenant_id 反規範化**，穿透式 JOIN 查久了會慢

### 可複製檢查清單

```
☐ tenants 表 + config JSONB（品牌/主題/功能開關）
☐ 所有業務表直接或間接持有 tenant_id
☐ RLS 全表 enable + current_tenant_id() 輔助函數
☐ middleware 從 JWT 解碼 tenant_id + role 並 set_config
☐ Supabase client wrapper 統一注入租戶上下文
☐ 品牌文字集中 brand.ts + 共用 Footer/Header/Metadata 元件
☐ seed 資料獨立於 migration
☐ service_role client 只用在平台級操作
☐ 多租戶隔離自動化測試（sandbox A/B）
☐ audit_logs 含 tenant_id
```

---

## 📎 附錄：文章可附程式碼片段

| 片段 | 用途 |
|------|------|
| `set_tenant_context()` SQL + `current_tenant_id()` | 租戶上下文核心 |
| `createServerClient()` wrapper | 應用層注入 |
| `brand.ts` + 共用元件 | 品牌白牌化 |
| `seed.sql` 抽離範本 | 種子資料管理 |
| `.github/workflows/rls-test.yml` | 隔離回歸測試 |

---

**發布清單**：
- [ ] 文章 Markdown 完成
- [ ] 程式碼片段整理至 Gist / GitHub 目錄
- [ ] 附件：實際遷移前後線上前對比圖（隔離成功/失敗案例）、審計掃描腳本
- [ ] 部落格發布 + 系列文章互相連結

---

**預估完成時間**：3-4 個工作晚間（含審計截圖、圖表、發布）  
**優先級**：🔥 高——多租戶 SaaS 化是平台架構領域的重要主題，深度內容極具參考價值