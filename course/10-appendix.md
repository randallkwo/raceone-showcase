# 10 — 附錄與工具速查表

> 常用指令、工具參考、延伸學習資源

---

## 10.1 常用指令速查

### Git

```bash
# 基礎
git status                    # 查看變更
git add -A                    # 加入所有變更
git commit -m "feat: msg"     # 提交 (Conventional Commits)
git push origin master        # 推送到遠端

# 分支
git checkout -b feature/xxx   # 建立並切換分支
git merge main                # 合併 main 到當前分支
git branch -d feature/xxx     # 刪除已合併分支

# 緊急
git revert HEAD               # 回退到上個 commit
git log --oneline -10         # 看最近 10 個 commit
```

### pnpm

```bash
pnpm install                  # 安裝依賴
pnpm add package              # 加依賴
pnpm add -D package           # 加 dev 依賴
pnpm run dev                  # 啟動開發伺服器
pnpm run build                # 建置
pnpm dlx shadcn-ui@latest add button  # 安裝 shadcn/ui 元件
```

### Supabase CLI

```bash
supabase init                 # 初始化
supabase link --project-ref xxx  # 連結遠端專案
supabase db push              # 套用 migration
supabase db reset             # 重置本地 DB
supabase gen types typescript --local > types/supabase.ts  # 產生型別
```

### Vercel CLI

```bash
vercel --version              # 確認版本
vercel link                   # 連結專案
vercel env pull .env          # 拉取遠端環境變數
vercel deploy                 # 部署
vercel logs                   # 查看日誌
```

### Cloudflare

```bash
dig www.raceone.ai            # DNS 查詢
curl -I https://www.raceone.ai | grep -i "cf-"  # 確認 CDN 代理
```

### Systemd

```bash
systemctl status hermes-gateway          # 查看服務狀態
journalctl -u hermes-gateway -f          # 即時日誌
systemctl restart hermes-gateway         # 重啟服務
systemctl enable hermes-gateway          # 開機啟動
```

## 10.2 專案結構速查

```
raceone-admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # 公開頁面 (Route Group)
│   │   │   ├── page.tsx        # 首頁 Landing
│   │   │   ├── events/         # 賽事列表 + 詳情
│   │   │   ├── news/           # 公告列表 + 內容
│   │   │   ├── guide/          # 使用指南
│   │   │   └── layout.tsx      # 公開頁共用佈局
│   │   ├── dashboard/          # 管理後台 (受保護)
│   │   │   ├── page.tsx        # 儀表板
│   │   │   ├── races/          # 賽事 CRUD
│   │   │   ├── news/           # 公告管理
│   │   │   └── ...
│   │   ├── api/                # API Routes
│   │   │   ├── public/         # 公開 API
│   │   │   ├── cron/           # 排程任務
│   │   │   └── notifications/  # 通知
│   │   ├── login/              # 登入頁
│   │   ├── settings/           # 個人設定 (LIFF 綁定)
│   │   ├── layout.tsx          # 根佈局
│   │   ├── middleware.ts       # Auth 路由守衛
│   │   └── sitemap.ts          # SEO Sitemap
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 元件
│   │   └── shared/             # 專案共用元件
│   └── lib/
│       ├── supabase/           # Supabase client
│       └── utils.ts            # 工具函式
├── supabase/
│   └── migrations/             # DB migration 檔案
├── .env.local                  # 本地環境變數 (勿提交)
├── tailwind.config.ts          # Tailwind 設定
└── vercel.json                 # Vercel 部署設定
```

## 10.3 Hermes Agent 常用指令

```bash
# 基本操作
hermes setup                    # 初始設定
hermes config set provider openrouter  # 設定 LLM 提供商

# Skills
hermes skills list              # 列出所有技能
hermes skills view contract-testing   # 查看技能內容

# Memory
hermes memory list              # 查看記憶
hermes memory add "key: value"  # 加入記憶

# Cron
hermes cron list                # 列出排程任務
hermes cron create "0 6 * * *" ...  # 建立排程

# Sessions
hermes sessions list            # 查看對話歷史
hermes sessions export out.jsonl --redact  # 匯出對話
```

## 10.4 學習資源推薦

### 官方文件

| 技術 | 文件 |
|------|------|
| Next.js 14 | [nextjs.org/docs](https://nextjs.org/docs) |
| Supabase | [supabase.com/docs](https://supabase.com/docs) |
| Tailwind CSS | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |
| LINE Developers | [developers.line.biz](https://developers.line.biz) |
| Cloudflare | [developers.cloudflare.com](https://developers.cloudflare.com) |

### 實戰課程

| 課程 | 平台 | 說明 |
|------|------|------|
| Next.js 14 實戰 | official learn | interactive 教學 |
| Supabase 系列 | YouTube | Fireship / Supabase 官方 |
| PostgreSQL 之道 | pgexercises.com | SQL 練習 |
| Tailwind 設計 | tailwindui.com | 元件模板 |

### 偵錯參考

| 問題 | 查哪裡 |
|------|--------|
| Next.js error | 錯誤訊息 + Google |
| Supabase RLS | Dashboard → SQL Editor → 測試 policy |
| LINE API | LINE Developers Console → 查看 webhook logs |
| Vercel deploy | Vercel Dashboard → Deployments → 看 build log |
| Hermes Agent | `journalctl -u hermes-gateway -f` |

## 10.5 專案 Timeline

```
Day 1  (2026-07-23): 專案初始化 + Next.js + shadcn/ui
Day 2  (2026-07-24): 賽事 CRUD + RLS 多租戶
Day 3  (2026-07-25): LINE Bot + LIFF + Auth
Day 4  (2026-07-26): 財務 + 報表 + 贊助商
Day 5  (2026-07-27): 佈署 Vercel + Cron + Gateway
Day 6  (2026-07-28): AI Agent 整合 + Skills 技能庫
Day 7  (2026-07-29): QA Gate + SEO + Sop 文件

持續優化 (2026-08): Skill 重整 → 38 技能
                    QA v2.0 → 10 Gate + 量化評分
                    無障礙修復 → WCAG 掃描
                    合約測試 → API/RLS 自動化
```

## 10.6 常見錯誤碼速查

| 錯誤碼 | 可能原因 | 檢查順序 |
|--------|----------|----------|
| **404** | 路由不存在、slug 錯誤 | sitemap.xml → Vercel 部署狀態 |
| **307** | Middleware 攔截了公開路徑 | middleware.ts matcher regex |
| **401** | 未登入、token 過期 | Supabase Auth → JWT 是否有效 |
| **403** | RLS 擋住了操作 | Supabase SQL Editor → 測試 RLS |
| **500** | Server error | Vercel Functions logs |
| **PGRST116** | `.single()` 查無資料 | 改 `.maybeSingle()` |
| **429** | Rate limited | Cloudflare WAF / LINE API |
| **ECONNREFUSED** | Gateway 沒開 | `systemctl status hermes-gateway` |

---

**🎉 恭喜完成課程！**

你現在學到了從 0 到 1 打造一個 SaaS 平台所需的完整知識。下一步：

1. 開啟你的第一個專案
2. 從申請網域開始，一路到部署上線
3. 遇到問題時回來翻這份文件
4. 建立你自己的技能庫

> **RaceOne — First to Finish 🏁**