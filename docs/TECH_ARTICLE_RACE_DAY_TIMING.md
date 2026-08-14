# 技術文章大綱：賽日即時計時系統 —— 分段記錄、排名與即時更新的資料流設計

**目標發布平台**：個人部落格 / Medium / Notion 公開頁面  
**預估字數**：2,500-3,000 字  
**目標讀者**：後端工程師、即時資料系統開發者、賽事系統開發者  
**SEO 關鍵字**：即時計時系統, racing timing, split time, ranking, Supabase realtime, 資料即時更新, 輪詢 vs 推送

> **本文是 RaceOne 技術系列第 4 篇**。系列導覽：① RLS → ② 多租戶遷移 → ③ Bot Gateway → ④ 即時計時（本篇）→ ⑤ QA Gate。

---

## 📋 文章結構總覽

```
1. 開場：為什麼賽日計時「即時」很重要？（300 字）
2. 資料模型：分段記錄怎麼存？（400 字）
3. 核心問題：即時更新的三種做法（400 字）
4. 方案評估：輪詢 vs 推送 vs 混合（500 字）
5. 排名與分段計算的資料流程（400 字）
6. 使用者介面：計時台的即時儀表板（400 字）
7. 效能與容錯：斷線、延遲、資料一致性（400 字）
8. 實測與避坑（300 字）
9. 總結與可複製設計（200 字）
```

---

## 1. 開場：為什麼賽日計時「即時」很重要？（~300 字）

### Hook
> 「超馬賽事現場，幾百名跑者在不同補給站前後穿越，主辦方和志工需要**在幾秒內**知道誰到站了、誰棄賽了、誰在 30K 停太久。計時台每慢一分鐘，跑者家屬就多焦慮一分鐘。RaceOne 的即時計時系統，讓分段記錄、排名、棄賽標記在賽道上『幾乎同步』地跳到補給站志工的平板上。」

### 背景
- RaceOne 賽日營運模組：`timing_records` 即時計時、分段記錄、排名計算
- 前端計時台：補給站志工 / 終點工作人員操作
- 後端：Supabase PostgreSQL + Real-time

---

## 2. 資料模型：分段記錄怎麼存？（~400 字）

### 2.1 Timing Record 資料結構

計時資料以「跑者 × 檢查點」為單位，記錄分段時間與累計時間：

```typescript
interface TimingRecord {
  id: string;
  registration_id: string;    // 關聯報名（對應跑者）
  checkpoint_id: string;      // 檢查點（起點/補給站/終點）
  checkpoint_name: string;    // 例如 '30K 補給站'
  distance_km: number;        // 該檢查點距離
  split_time: string;         // 本段用時 (例如 01:45:30)
  cumulative_time: string;    // 累計時間 (自起跑累計)
  rank_overall: number | null;// 總排名
  rank_category: number | null; // 組別排名
  status: 'passed' | 'finished' | 'dnf' | 'dns'; // 狀態
  recorded_at: string;
}
```

### 2.2 分段式賽事的快照

```typescript
// 單一跑者在頁面上的快照（依檢查點聚合）
interface TimingSnapshot {
  bib_number: number;
  display_name: string;
  category_name: string;
  split_times: {
    start?: string; cp1?: string; cp2?: string;
    cp3?: string; cp4?: string; finish?: string;
  };
  total_time: string | null;
  pace: string | null;          // 配速
  status: 'running' | 'finished' | 'dnf' | 'dns';
  rank_overall: number | null;
  rank_category: number | null;
  last_updated: string;
}
```

> **設計關鍵**：分段時間從「檢查點綁定在跑者上」的記錄聚合而成，讓排名可在 SQL 層直接計算，不需在前端重算。

---

## 3. 核心問題：即時更新的三種做法（~400 字）

賽日資料隨時變動，前端要「看到最新」。三種主流做法：

| 做法 | 機制 | 即時性 | 成本 |
|------|------|:------:|:----:|
| **① 輪詢 (Polling)** | 前端定時（如每 10 秒）重新查詢 | 中（10s 延遲） | 低 |
| **② 推送 (Push / Realtime)** | Server 主動推送變更到訂閱端 | 高（近即時） | 中 |
| **③ 混合 (Hybrid)** | 輪詢兜底 + 推送補即時 | 高 | 中高 |

---

## 4. 方案評估：輪詢 vs 推送 vs 混合（~500 字）

### 4.1 方案 A：輪詢（Polling）——簡單可靠

```typescript
// 前端每 10 秒重新查詢
useEffect(() => {
  loadData();                                 // 首次載入
  const interval = setInterval(() => {
    if (autoRefresh) loadData();              // 定時刷新
  }, 10000);                                  // 10 秒
  return () => clearInterval(interval);
}, [eventId, autoRefresh]);
```

**優點**：
- 實作最簡單、幾乎沒有學習成本
- 邏輯直白、易除錯；不會漏任何變更（每次全量拿最新）
- 對低頻變更（賽事計時通常非超高頻）已足夠

**缺點**：
- 延遲固定（約等於輪詢間隔）
- 同時段多客戶端輪詢 = 對 DB 的重複查詢
- 空載時仍持續查詢（浪費）

### 4.2 方案 B：推送（Supabase Realtime / WebSocket）

```typescript
// 訂閱資料表，變更時收到事件
const channel = supabase
  .channel('timing-updates')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'timing_records' },
    (payload) => {
      // 有新的計時記錄 → 刷新對應跑者
      upsertTiming(payload.new);
    })
  .subscribe();
```

**優點**：
- 近即時（毫秒級推送到訂閱端）
- 有變更才送，節省無謂查詢

**缺點**：
- 需處理連線建立、斷線重連
- 訂閱分發邏輯較複雜（要對應到哪個跑者/哪個排行榜）
- 若全欄位訂閱，重新排序/名次計算仍需前端處理

### 4.3 方案 C：混合（Hybrid）——實際採用的方向

```
- 輪詢作為「兜底」：確保即使 Realtime 斷線，資料仍會定期刷新
- 推送作為「加速」：有變更時立即更新單筆
- 結合：Realtime 收到 INSERT → 觸發單筆刷新；輪詢 10 秒做全量對帳
```

> **決策理由**：計時系統需要「可靠」甚於「極致即時」。輪詢保證不遺漏，Realtime 減少延遲；兩者並行提供「又快又穩」。

---

## 5. 排名與分段計算的資料流程（~400 字）

### 5.1 排名的計算策略

排名（總排名 + 組別排名）在資料庫層計算，避免前端重算差異：

```sql
-- 概念 SQL：依累計時間排序並輸出排名（示意，非實際 Policy）
-- 總排名
RANK() OVER (ORDER BY cumulative_time ASC) AS rank_overall

-- 組別內排名
RANK() OVER (PARTITION BY category_id ORDER BY cumulative_time ASC) AS rank_category
```

### 5.2 分段到終點的資料流

```
跑者通過檢查點
      │
      ▼
計時志工輸入（計時台）或晶片感應
      │
      ▼
寫入 timing_records（含 checkpoint, split, cumulative）
      │
      ▼
資料庫計算累計時間 + 排名（RANK window function）
      │
      ▼
前端計時台（輪詢 + Realtime）刷新該跑者狀態
```

> **關鍵**：排名是「事後計算」而非「逐筆寫死」——依當前已記錄的累計時間動態排序，確保遲到/漏記錄時排名仍一致。

---

## 6. 使用者介面：計時台的即時儀表板（~400 字）

### 6.1 儀表板功能區

計時台頁面（`/races/[id]/timing`）提供給賽日工作人員：

| 功能 | 說明 |
|------|------|
| **跑者清單** | 顯示號碼布、姓名、組別、分段時間、狀態 |
| **即時搜尋** | 依號碼布/姓名快速查單一跑者 |
| **狀態篩選** | 依 running / finished / DNF / DNS 過濾 |
| **組別篩選** | 只顯示特定組別 |
| **自動刷新開關** | 可開/關 10 秒輪詢（供低頻查看節省流量） |
| **最後同步時間** | 顯示資料最後更新時刻（可信度提示） |

### 6.2 狀態徽章即時變化

```
running   → 藍色「進行中」
finished  → 綠色「已完賽」
dnf       → 紅色「DNF 棄賽」
dns       → 灰色「DNS 未到」
```

> **UX 亮點**：狀態以品牌色徽章呈現（沿用 CIS），幫助工作人員一眼判讀賽況。

---

## 7. 效能與容錯：斷線、延遲、資料一致性（~400 字）

### 7.1 斷線 / 競態情境

| 情境 | 處置 |
|------|------|
| 前端 Realtime 斷線 | 輪詢兜底，仍有資料刷新；重連後再訂閱 |
| 後端寫入失敗 | 提示計時員重試；寫入採 idempotent（避免重複） |
| 多裝置同時寫同一跑者 | 以檢查點維度隔離，降低衝突；取最後寫入為準 |
| 網路延遲 | 輪詢間隔可調，最後同步時間讓使用者知道資料新舊 |

### 7.2 資料一致性原則

```
- 單一事實來源：timing_records 表
- 排名由 DB 計算：所有端點拿到一致排名
- 快照派生：前端只讀、不自行重算名次（避免與 DB 偏差）
- 可稽核：每次計時記錄帶 recorded_at，可追溯誰在何時輸入
```

---

## 8. 實測與避坑（~300 字）

### 避坑清單

| 坑 | 症狀 | 解法 |
|----|------|------|
| **前端重算排名** | 與 DB 排名不一致 | 統一由 DB window function 計算 |
| **Realtime 斷線全黑** | 資料停滯 | 輪詢兜底，勿單靠推送 |
| **10 秒輪詢過度** | 空載時浪費查詢 | 提供「自動刷新」開關 |
| **分段時間遺漏** | 少一站 | 以檢查點維度記錄，缺省顯示空而非 0 |
| **狀態誤判** | finished/DNF 混淆 | 明確定義狀態機 + 徽章色彩標示 |

### 實測數據（概估）
- 輪詢間隔：10s（可調 5/10/30s）
- Realtime 推送延遲：近即時（毫秒級）
- 同時開啟計時台的客戶端：數個（後台工作人員）
- 資料一致性：排名統一 DB 計算，無跨端偏差

---

## 9. 總結與可複製設計（~200 字）

### 核心原則
1. **「可靠」優先於「極致即時」**——輪詢兜底保證不遺漏，Realtime 加速提升體驗
2. **排名由資料庫計算**——單一事實來源，避免前端重算偏差
3. **以檢查點維度建模**——分段記錄靈活、缺省清楚
4. **狀態機明確**——running/finished/DNF/DNS 以徽章色差輔助判讀
5. **可稽核**——每筆帶時間戳，賽後可還原

### 適用場景
任何「多端點輸入、排行榜即時呈現」的場景（賽事、物流、據點回報、即時儀表板）皆可套用此「輪詢兜底 + Realtime 加速 + DB 統一計算」架構。

---

## 📎 附錄：可附程式碼片段

| 片段 | 價值 |
|------|------|
| `TimingRecord` / `TimingSnapshot` 型別 | 資料模型可直接套用 |
| 輪詢 useEffect 範本 | Polling 兜底 |
| Realtime subscribe 範本 | 訂閱加速 |
| RANK() window function | 統一排名計算 |

---

**發布清單**：
- [ ] 文章 Markdown 完成
- [ ] 程式碼片段整理至 Gist / GitHub 目錄
- [ ] 附件：計時儀表板示意圖、資料流圖
- [ ] 部落格發布 + 系列互相連結

---

**優先級**：🟡 中——即時資料系統，作為系列文章中偏系統設計的展示