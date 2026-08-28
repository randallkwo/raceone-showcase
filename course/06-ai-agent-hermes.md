# 06 — AI Agent 整合 (Hermes Agent)

> 本章教你：如何用 AI Agent 自動化運營一個 SaaS 平台，從開發助手到賽事運營

---

## 🎯 本章目標

理解 AI Agent 的運作原理、Hermes Agent 架構，以及如何讓 AI 成為你的開發夥伴與運營助手。

## 6.1 什麼是 AI Agent

### Agent ≠ Chatbot

| 特性 | Chatbot | Agent |
|------|---------|-------|
| 工具使用 | 不能 | 能（讀檔案、執行指令、操作 UI） |
| 記憶 | 單次對話 | 跨 session 記憶 |
| 自主行動 | 被動回應 | 可主動排程、監控 |
| 技能庫 | 無 | 有（可學習的技能） |
| 持續運行 | 關對話就結束 | 可常駐、cron 排程 |

### Hermes Agent 核心能力

```
Hermes Agent ─── Multi-platform ─── Telegram, LINE, Discord, CLI
     │
     ├── Tools ───── 瀏覽器、終端機、檔案操作、API 呼叫
     ├── Skills ──── 可學習的技能庫 (38+ 技能)
     ├── Memory ──── 跨 session 持久記憶
     ├── Cron ────── 排程自動化任務
     └── SOUL ────── 人格憲章 (價值觀、行為準則)
```

## 6.2 我們為什麼需要 Hermes Agent

RaceOne 的開發過程中，Agent 扮演了關鍵角色：

| 階段 | Agent 做的事 | 節省時間 |
|------|-------------|----------|
| 開發 | 程式碼生成、debug、優化 | ~60% 開發時間 |
| 測試 | QA 自動化掃描、合約驗證 | ~80% 測試時間 |
| 部署 | CI/CD 腳本、環境管理 | ~50% 部署時間 |
| 運營 | LINE Bot 自動回覆、摘要 | 24hr 不中斷 |
| 維護 | 效能監控、錯誤告警 | 即時反應 |
| 文件 | 技術文件、使用手冊 | ~90% 文件時間 |

## 6.3 Hermes Agent 架構

```
┌───────────────────────────────────────────┐
│            Hermes Agent Core              │
│                                           │
│  User Input → Provider(LLM) → Tools       │
│              ↑           ↓                │
│           Memory ← Skills ← SOUL.md       │
│                                           │
└───────────────────────────────────────────┘
          ↓            ↓            ↓
    Telegram Bot  LINE Bot     CLI 終端機
```

### 三層架構

```yaml
Profile (設定檔):
  - raceone-ai 為專用 profile
  - 包含 models, providers, tools 設定
  - skills/ (技能庫), plugins/, cron/, memories/

Skills (技能庫):
  - 38 個軟體開發技能
  - 每次載入技能 = 教 Agent 一個新能力
  - skill_manage 可學習新技能

SOUL.md (人格憲章):
  - 核心身份：超馬守護者
  - 價值觀：跑者優先、誠實透明、極簡可靠
  - 自我改進引擎：持續從錯誤中學習
```

### Provider 設定

```yaml
# ~/.hermes/profiles/raceone-ai/.hermes.yaml
provider: openrouter
model: deepseek/deepseek-v4-flash
fallback:
  - google/gemini-2.5-pro-exp-03-25
  - x-ai/grok-3-mini-beta
```

## 6.4 Skills 技能庫系統

Skills 是 Hermes 最強大的設計 — 它讓 Agent 可以**學習新技能並記住**。

### 技能類別

```bash
# 目前的技能庫結構
skills/
├── software-development/     ← 38 個開發技能
├── devops/                   ← 部署維運
├── creative/                 ← 設計、文案
├── research/                 ← 研究分析
├── productivity/             ← 文件處理
├── social-media/             ← 社群
├── email/                    ← 郵件
└── note-taking/              ← 筆記
```

### 技能範例

```markdown
# 範例：contract-testing SKILL.md

---
name: contract-testing
description: "API/RLS contract checks: HTTP, schema, Supabase per-role."
version: 1.0.0
tags: [contract-testing, api, rls, testing]
---

# Contract Testing: API Route & RLS Verification

## API Route Tests
```bash
for url in / /events /news /login; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://www.raceone.ai$url")
  [[ $code == 200 ]] && echo "✅ $url" || echo "❌ $url"
done
```
```

### 技能載入機制

```
用戶請求 → Hermes 掃描可用 skills
  → 比對系統提示中的技能列表
  → 載入符合的技能內容
  → 執行任務 → 回饋學習 → 更新技能
```

## 6.5 Cron 排程任務

Agent 可以設定自動執行的排程任務：

```bash
# 設定每日 QA 檢查
cronjob action=create \
  schedule="0 6 * * *" \
  prompt="Run QA Gate on raceone.ai, report results" \
  skills="[\"nextjs-supabase-qa-gate\", \"raceone-testing\"]"

# 每 30 分鐘檢查伺服器狀態
cronjob action=create \
  schedule="30m" \
  no_agent=true \
  script="/path/to/health-check.sh"
```

## 6.6 AI Agent 的價值

### 開發賦能

```
傳統開發: 寫 code → 發現 bug → 手動 debug → 修復 → 測試 → 部署
          (可能需要數小時或數天)

Agent 輔助: 寫 code → Agent 自動測試 → 發現 bug → 自動修復 → 部署
            (通常在 30 分鐘內完成)
```

### 案例：7 天從零到上線

RaceOne 專案是 AI Agent 開發效率的最佳證明：

```
第 1 天: 專案初始化 + 基礎架構 → Agent 產出 ~3000 行程式碼
第 2 天: 賽事 CRUD + 多租戶 RLS → Agent 解決 RLS 遞迴問題
第 3 天: LINE Bot 整合 + 指令系統 → Agent 從頭建立 Webhook
第 4 天: 財務模組 + 報表中心 → Agent 產出完整圖表系統
第 5 天: 贊助商 + 志工管理 → Agent 實作完整 CRUD
第 6 天: 佈署上線 + cron 排程 → Agent 設定 Vercel + systemd
第 7 天: QA 掃描 + 技能庫建立 → Agent 建立 33 個開發技能
```

## 6.7 實戰 Lessons Learned

### ✅ 做對的事
- Skills 技能庫是關鍵 — Agent 越用越聰明
- SOUL.md 確保 Agent 行為一致、不會偏離價值觀
- Cron 自動化減少了 80% 例行維運工作

### ❌ 踩過的坑
- Agent 可能擅自安裝套件 (next-intl) → 要加`git status`檢查
- 幻覺：Agent 可能捏造 API 文件不存在的功能
- 過度授權：讓 Agent 直接 deploy 到 production → 必須有人類審核

---

**下一章**：[07 — 部署流程與 CI/CD](07-deployment-cicd.md)