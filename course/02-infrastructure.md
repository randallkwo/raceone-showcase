# 02 — 基礎架構規劃

> 本章教你：SaaS 平台的完整架構設計，從「一頁靜態網頁」到「多租戶管理平台」

---

## 🎯 本章目標

理解一個現代 SaaS 平台需要哪些基礎設施元件，以及如何用最少的成本達到最大的效益。

## 2.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare (DNS + CDN + WAF)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Vercel    │ ← 前端部署 (Next.js)
                    │ Edge Network│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴───┐  ┌────┴───┐  ┌────┴───┐
         │Supabase│  │  LINE  │  │Resend  │
         │(DB+Auth)│  │  Bot   │  │(Email) │
         └────────┘  └────────┘  └────────┘
              │
         ┌────┴───────────────┐
         │  Hetzner VPS       │ ← Hermes AI Agent
         │  (Ubuntu 26.04)    │   Gateway + Cron
         └────────────────────┘
```

## 2.2 各元件職責

| 元件 | 方案 | 月費 | 職責 |
|------|------|------|------|
| **DNS/CDN** | Cloudflare Free | $0 | 網域解析、全球加速、DDoS 防護 |
| **前端部署** | Vercel Hobby | $0 | Next.js 託管、Edge Functions |
| **資料庫** | Supabase Free | $0 | PostgreSQL、Auth、Storage、Realtime |
| **Email** | Resend Free | $0 | 交易性郵件 (100 封/天) |
| **Bot 平台** | LINE Messaging API | $0 | 即時通訊、群組管理 |
| **AI 服務** | OpenRouter | 隨用隨付 | LLM API 代理 |
| **VPS** | Hetzner CX22 | ~€4/月 | 背景服務、Gateway、Cron |
| **金流** | 藍新金流 | $0 | 信用卡/ATM 收款 |

**總成本**：約 **€4/月** (~$5 USD) + AI API 用量費

## 2.3 Supabase — 為什麼選它

### 免費方案包含

| 資源 | 規格 | 夠用嗎？ |
|------|------|----------|
| PostgreSQL | 500MB | ✅ 初期非常夠 |
| Auth | 50,000 用戶 | ✅ |
| Storage | 1GB | ✅ 儲存賽事圖片 |
| Realtime | 2M 訊息 | ✅ 聊天/即時更新 |
| API | 無限制 | ✅ REST + GraphQL |
| Edge Functions | 500K 次/月 | ✅ 輕量後端邏輯 |

### 為什麼不是其他方案？

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| **Supabase** | 一體化、免費額度高 | 不是自管 DB | ✅ 適合初期 |
| **Firebase** | 生態成熟 | Google 鎖定、昂貴 | ❌ |
| **自管 PostgreSQL** | 完全控制 | 要自己管備份、監控 | ❌ 太費工 |
| **MongoDB Atlas** | 彈性 Schema | 沒有 Auth/Realtime | ❌ |

## 2.4 Vercel — 部署平台

### 為什麼選 Vercel

```yaml
優點:
  - GitHub 整合：push 自動部署
  - Edge Network：全球 100+ 節點
  - Preview Deployments：每個 PR 自動產生預覽網址
  - Serverless Functions：不需管理伺服器
  - 免費 SSL 憑證：自動頒發與更新

限制 (Hobby Plan):
  - 建置時間：每月 6000 分鐘
  - Serverless：10 秒超時
  - Cron：每天 1 次 (Hobby)
  - 團隊協作：單人
```

### Vercel 專案設定

```bash
# 1. GitHub 連線
#    Vercel Dashboard → Add New Project → Import GitHub Repo

# 2. Framework Preset
#    Next.js (自動偵測)

# 3. 環境變數
#    在 Vercel Dashboard 設定以下變數：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_LINE_LIFF_ID=200...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://www.raceone.ai

# 4. 自訂網域
#    設定 → Domains → 輸入 raceone.ai
```

## 2.5 Hetzner VPS — 為什麼還需要一台伺服器

雖然 Supabase + Vercel 已經涵蓋大部分需求，但有些東西需要一台**自己的 VPS**：

| 需求 | 為什麼不用 Serverless | 解法 |
|------|----------------------|------|
| **AI Agent 常駐** | 要長時間運行，不能 10s 超時 | VPS 跑 systemd service |
| **LINE Bot Webhook** | 需要穩定 IP 註冊 | VPS 跑 Gateway |
| **排程任務** | 需要自由排程，不限 1 次/天 | VPS 跑 cron |
| **背景處理** | 長時間檔案處理、同步 | VPS 背景 process |

### 基本設定

```bash
# 1. 購買 Hetzner CX22 (2 vCPU, 4GB RAM, 40GB SSD, ~€4/月)
# 2. 安裝 Ubuntu 26.04 LTS
# 3. 基本安全設定

# SSH 登入
ssh root@你的VPS_IP

# 基本設定
apt update && apt upgrade -y
apt install -y ufw nginx git curl

# 防火牆
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安裝 pnpm
npm install -g pnpm
```

## 2.6 多租戶架構 (Multi-Tenant)

RaceOne 使用 **單一資料庫 + tenant_id 欄位** 的架構：

```
┌──────────────────────────────────┐
│         Supabase (單一 DB)       │
│                                  │
│  race_events                     │
│  ├── tenant_id: b6cf147b (RaceOne)  │
│  └── tenant_id: 0251d4e7 (Changming)│
│                                  │
│  profiles                        │
│  ├── tenant_id + role            │
│  ├── super_admin (跨租戶)        │
│  └── admin (單一租戶)            │
└──────────────────────────────────┘
```

### 優缺點

| 面向 | 優點 | 缺點 |
|------|------|------|
| 成本 | 單一資料庫，不增加費用 | — |
| 維護 | 只要管一個 DB，備份簡單 | 一個出問題全掛 |
| 隔離 | RLS 依 tenant_id 過濾 | 需確保 RLS 正確，否則資料外洩 |
| 擴展 | 上千租戶沒問題 | 超大租戶需獨立 DB |

## 2.7 環境區分

```yaml
production:
  url: https://www.raceone.ai
  db: Supabase Production
  env: Vercel Production
  branch: master

staging:
  url: https://staging.raceone.ai
  db: Supabase Staging (或同 Production)
  env: Vercel Preview
  branch: feature/*

development:
  url: http://localhost:3000
  db: Supabase Local (或 Development Project)
  env: .env.local
  branch: 本地開發
```

## 2.8 實戰 Lessons Learned

### ✅ 做對的事
- 一開始就用 Supabase，省去 DB 管理的時間
- Vercel + GitHub 整合，PR preview 自動生成
- 保留 Hetzner VPS 跑背景服務，避免 Serverless 限制

### ❌ 踩過的坑
- Vercel Hobby Plan cron 限制 1 次/天，需要合併多個任務到單一 endpoint
- Supabase Free Plan 連線數限制，太多人同時連線會 timeout
- 忘了設 Vercel 環境變數，本地跑得動但部署後掛掉

---

**下一章**：[03 — 前端開發實戰](03-frontend-setup.md)