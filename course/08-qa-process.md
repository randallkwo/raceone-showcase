# 08 — QA 品管流程

> 本章教你：從隨機測試到系統化 10 項 QA Gate 的完整品管體系

---

## 🎯 本章目標

完成後你將擁有：
- 結構化五階段 QA 流程
- 10 項鐵律 Release Gate
- 合約測試、無障礙掃描等自動化檢查
- 量化評分機制
- 可重複執行的 QA 腳本

## 8.1 傳統做法的問題

### 之前：隨機測試

```
打開網站 → 點擊幾頁 → 「看起來沒問題」 → 上線
```

結果：
- 圖表線條透明（用了 undefined CSS variable）
- 金額合計不隨篩選改變
- 404 沒人發現
- `.single()` crash 沒人知道
- 無障礙完全沒測

### 之後：QA Gate v2.0

```
Phase 1: Build 檢查       → 最快速，先確認能不能編譯
Phase 2: HTTP 合約檢查     → 所有頁面狀態碼正確
Phase 3: DB/RLS 合約檢查   → 資料庫完整 + 權限正確
Phase 4: 靜態分析          → 程式碼品質檢查
Phase 5: Browser UI 驗證   → 圖表、篩選、空狀態
```

## 8.2 10 項 Release QA Gate

| # | 項目 | 驗證方式 | 失敗處理 |
|---|------|----------|----------|
| 1 | Build 成功 | `pnpm build` exit 0 | 禁止部署 |
| 2 | 公開頁面 200 | 6 個公開 URL 回 HTTP 200 | 禁止部署 |
| 3 | 受保護頁 307 | `/dashboard` 等未登入跳轉 | 禁止部署 |
| 4 | DB 表格齊全 | REST API 查 15 張關鍵表成功 | 禁止部署 |
| 5 | Middleware 正確 | 公開路徑排除 regex | 禁止部署 |
| 6 | API 安全 | 未登入 API 回 401 | 禁止部署 |
| 7 | 表單健壯 | 全部有 try/catch/finally | 禁止部署 |
| 8 | .single() 安全 | 無未保護的 .single() | ⚠️ 需修復 |
| 9 | 圖表色彩正確 | 用十六進位色碼，非 CSS variable | ❌ 線條透明 |
| 10 | 合計動態計算 | 篩選變化時同步更新 | ❌ 合計錯誤 |

## 8.3 Phase 1: Build 檢查

```bash
# 最簡單但最重要的檢查
cd raceone-admin
rm -rf .next
pnpm run build

# 確認 exit code
echo $?
# 0 = 成功, 非0 = 失敗
```

## 8.4 Phase 2: HTTP 合約檢查

```bash
# 公開頁面 → 走 Cloudflare CDN，必須 200
for url in / /events /news /login /guide; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://www.raceone.ai$url")
  [[ $code == 200 ]] && echo "✅ $url" || echo "❌ $url"
done

# 受保護頁 → 未登入應 307
for url in /dashboard /races /settings /bot; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://www.raceone.ai$url")
  [[ $code == 307 ]] && echo "✅ $url" || echo "❌ $url"
done

# API → 應回 401
for url in /api/public/register; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://www.raceone.ai$url")
  echo "$url → $code"
done
```

## 8.5 Phase 3: DB/RLS 合約檢查

```python
# 檢查所有表格是否存在
tables = ['race_events','registrations','profiles','sponsors',
          'transactions','aid_stations','timing_records']
for t in tables:
    status = rest(f'{BASE}/rest/v1/{t}?select=count', SVC)
    # 200 = 表格存在

# 檢查 RLS 權限
anon_tests = [
    ("Anon reads events", ANON, f"{BASE}/rest/v1/race_events", 200),
    ("Anon blocked sponsors", ANON, f"{BASE}/rest/v1/sponsors", 200),  # Supabase 回 200 + []
    ("Anon blocked transactions", ANON, f"{BASE}/rest/v1/transactions", 200),
]
```

### 關於 RLS 測試的重點

Supabase RLS 的設計是：
- 權限不足時**回 200 + 空陣列**，不是 401
- 這是標準行為，不是漏洞
- 合約測試應該驗證「回來的資料是空的」而非「回 401」

## 8.6 Phase 4: 靜態分析

```bash
# 檢查 .single() 使用 (有風險的方法)
grep -rn "\.single()" src/app/ --include="*.tsx" --include="*.ts"
# 確認每個 .single() 都有 try/catch 或 maybeSingle

# 檢查表單模式
grep -rn "try\s*{" src/app/*/page.tsx
grep -rn "finally" src/app/*/page.tsx
# 每個表單應有 try/catch/finally
```

## 8.7 Phase 5: Browser UI 驗證

### 檢查項目

| 檢查 | 方法 | 預期結果 |
|------|------|----------|
| 首頁渲染 | 開啟首頁 | 所有元素可見，無 console error |
| 賽事列表 | 開啟 /events | 顯示賽事卡片 |
| 賽事詳情 | 點擊賽事 | 資訊完整 |
| 公告文章 | 點擊公告 | Markdown 正確渲染 |
| 404 路徑 | 訪問不存在路徑 | 顯示 404 頁面 |
| Console | 檢查 devtools | 0 errors |

### Accessibility 掃描

```javascript
// 在 browser console 執行
(async () => {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.0/axe.min.js';
  document.head.appendChild(s);
  await new Promise(r => setTimeout(r, 1000));
  const result = await axe.run();
  console.log(`Violations: ${result.violations.length}`);
  console.log(`Passes: ${result.passes.length}`);
})();
```

## 8.8 量化評分模型

檢查完成後，按權重計算總分：

| 維度 | 權重 | 滿分 |
|------|------|------|
| Build 建置 | 15% | 15 |
| HTTP 合約 | 20% | 20 |
| DB 架構 | 15% | 15 |
| RLS 安全 | 15% | 15 |
| 靜態分析 | 15% | 15 |
| Browser UI | 10% | 10 |
| Accessibility | 10% | 10 |

**目標分數**：≥ 80/100 才能部署上 production

## 8.9 QA 自動化腳本

完整 QA Gate 腳本：

```bash
#!/bin/bash
# run-qa-gate.sh

DOMAIN="${1:-https://www.raceone.ai}"
PASS=0; FAIL=0

echo "=== Phase 1: Build ==="
cd raceone-admin
rm -rf .next && pnpm run build
echo $? | grep -q 0 && ((PASS++)) || ((FAIL++))

echo "=== Phase 2: HTTP Contracts ==="
for url in / /events /news /login /guide; do
  code=$(curl -s -o /dev/null -w '%{http_code}' $DOMAIN$url)
  [[ $code == 200 ]] && ((PASS++)) || ((FAIL++))
done

echo "=== Phase 3: DB ==="
python3 check-db-contracts.py

echo "=== Phase 4: Static Analysis ==="
grep -rn "\.single()" src/app/ | grep -v "maybeSingle" && ((FAIL++)) || ((PASS++))

echo "=== Phase 5: Browser ==="
echo "Manual check for charts, filters, empty states"

echo ""
echo "Score: $PASS/$((PASS+FAIL))"
```

## 8.10 Skills 技能庫對 QA 的賦能

這次 QA 能做到**7 個維度**而不是以前的 3 個，是因為有新的技能：

| 技能 | 貢獻 |
|------|------|
| **contract-testing** | API/RLS 合約驗證、HTTP 狀態碼 |
| **accessibility-testing** | axe-core 無障礙掃描 |
| **ci-cd-pipeline** | GitHub Actions 模板 |
| **performance-testing** | Lighthouse/k6 效能測試 |
| **release-engineering** | 版本管理、changelog |

## 8.11 實戰 Lessons Learned

### ✅ 做對的事
- 建立結構化的五階段流程，而不是隨機點擊
- 合約測試 + 靜態分析可以自動化，大幅減少人工作業
- 量化評分讓品質可視化，知道哪裡需要加強

### ❌ 踩過的坑
- 初期合約測試預期 RLS 回 401 → 實際是 200+空陣列（Supabase 行為）
- Accessibility 掃描發現雙重 `<main>` → layout 和頁面都包了 main
- 圖表線條透明 → 用了 CSS variable 而非十六進位色碼

---

**下一章**：[09 — 踩坑記錄與教訓](09-lessons-learned.md)