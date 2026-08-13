# RaceOne QA 測試流程與 Release QA Gate

> **版本**: 2.0 | **日期**: 2026-08-07
> **鐵律**: 任何 code 要觸發 Vercel production 部署前,必須**全部通過 Release QA Gate**。

---

## 1. Release QA Gate 通過條件

| # | 檢查項 | 方式 | 狀態 |
|:-:|:-------|:-----|:----:|
| 1 | **Build 成功** | `pnpm run build` exit 0 (無 TS/lint error) | ✅ |
| 2 | **公開頁 HTTP 200** | curl `/` `/events` `/news` `/login` | ✅ |
| 3 | **受保護頁 307** | curl `/dashboard` `/races` (未登入→登入頁) | ✅ |
| 4 | **資料庫表格齊全** | REST 查全部表無 404 | ✅ |
| 5 | **Middleware 正確** | 公開路徑不被擋、受保護路徑 307 | ✅ |
| 6 | **未登入 API 401** | curl `/api/users` 系列回 401 (防 Email/資料外洩) | ✅ |
| 7 | **表單健壯性稽核** | 每個 mutation 表單有 try/catch/finally + disabled | ✅ |
| 8 | **Browserbase 使用者模擬** | 訪客 7 頁 / 後台 8 頁 / 跑者自助 3 流程 | ✅ |
| 9 | **RBAC 越權驗證** | finance 無法存取 /users 等越權頁 | ✅ |
| 10 | 無已知高優先 bug | — | ✅ |

> 自動化執行: `bash run-tests.sh <domain> [--skip-build]` — 涵蓋條件 2-7。
> 條件 8-9 需 Composio Browserbase 實機驗證。

---

## 2. 自動化驗證腳本 (run-tests.sh v2)

`run-tests.sh` 已擴充為 7 大區塊:

| 區塊 | 驗證 |
|:-----|:-----|
| 1. Build | `pnpm run build` 無 error |
| 2. 公開頁面 | `/` `/events` `/news` `/login` → 200 |
| 3. 受保護頁面 | `/dashboard` `/races` `/registrations` → 307 |
| 4. 資料庫表格 | 8 核心表 REST 可存取 |
| 5. Middleware | 公開路徑排除 regex 正確 |
| 6. **未登入 API 保護** | `/api/users` `/api/users/set-password` → 401 |
| 7. **表單 try/finally 稽核** | 6 個 mutation 表單需 `finally{}` + `disabled={loading}` |

執行:
```bash
bash run-tests.sh https://www.raceone.ai --skip-build
# → 結果: ✅ N 通過 | ❌ 0 失敗
```

---

## 3. Browserbase 使用者模擬驗證

三組並行實機驗證 (session `very` / `born`):

### A. 公開訪客
| 頁面 | 驗證 |
|:-----|:-----|
| 首頁 `/` | 正常載入 |
| `/events` | 賽事列表 (4 場) |
| 賽事詳情 | 內容 + 報名 CTA |
| `/events/[id]/results` | 成績頁 |
| `/news` + 詳情 | 公告 2 則 + 內文 |
| `/login` | 登入頁 |

### B. 後台管理 (admin@raceone.ai)
| 頁面 | 驗證 |
|:-----|:-----|
| `/dashboard` | 統計 (4 賽事 / 74 報名 / 營收) |
| `/races` + 詳情 | 報名 tab + 個人彈窗 |
| `/registrations` | 74 筆 |
| `/users` | 32 人含 Email |
| `/budget` / `/transactions` / `/sponsors` | 財務 / 18 贊助商 |

### C. 跑者自助 (randallkwo@hotmail.com)
登入 → `/my` 三 tab → 個人資料編輯「已儲存✅」→ 登出。**測試後還原資料變更**。

### D. RBAC 越權驗證 (finance)
登入 `test.finance@raceone.ai` → 記錄落地 URL。
- ✅ 可存取: `/dashboard` `/budget` `/transactions`
- ⛔ 越權導離: `/users` `/races` `/sponsors` `/volunteers` `/bot` → `/my`

---

## 4. 錯誤字串檢查清單

追蹤下列**使用者可見錯誤字串**(排除 CSS/script 誤報):
```
找不到此賽事 / error / Unexpected end of JSON input / 500 / 錯誤 / Cannot / Failed
```

---

## 5. 資安驗證重點 (2026-08-07 新增)

| 項目 | 驗證 | 方式 |
|:-----|:-----|:-----|
| **Stored XSS** | 新聞/賽事內容淨化 | 單元測試: `<script>` / `onerror` / `javascript:` / **HTML entity 混淆** 全擋 |
| **未登入資料外洩** | `/api/users` 系列 | 未登入 → 401 |
| **RBAC 越權** | finance 看 Email? | 導離 `/users` ✅ |
| **密碼重設信** | 正確 redirect + 品牌署名 | 端到端: `www.raceone.ai/reset-password` + 「RaceOne.ai 智能平台」|
| **表單防呆** | 按鈕連點 | `disabled={loading}` + `finally` 還原 |

---

## 6. 已知安全設計決策

1. **XSS sanitizer 零依賴自製**: `sanitize.ts` (server) + `sanitize-client.ts` (DOMPurify, client)。採自製是因 `isomorphic-dompurify`/`sanitize-html` 依賴 ESM-only 套件在 serverless 打包會 `ERR_REQUIRE_ESM`。
2. **金額一律 `_cents`**: DB 存分, UI 顯示元 (×100 / ÷100),避免浮點誤差。
3. **service-role 不可呼叫 user-level auth**: 重設信用 `admin.generateLink` + Resend 直接寄。
4. **RLS context**: middleware / server client 呼叫 `set_session_context_from_auth`。

---

*QA 完整程序另見 `raceone-testing` skill、`docs/LESSONS_2026_08_04.md`、`docs/PROJECT_HISTORY_AND_LESSONS.md`。*
