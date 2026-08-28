# 00 — 前置知識與環境準備

> 在你開始打造 RaceOne 之前，需要準備好的工具與知識

---

## 🔧 必要工具

### 1. 開發環境

```
OS: macOS / Linux / Windows (WSL2 強烈建議)
Editor: VS Code (或任何你熟悉的 IDE)
Terminal: 熟悉基本指令 (cd, ls, mkdir, git, curl)
```

### 2. 帳號申請清單

| 服務 | 用途 | 費用 | 申請連結 |
|------|------|------|----------|
| GitHub | 程式碼託管 | 免費 | github.com |
| Vercel | 前端部署 | 免費 (Hobby Plan) | vercel.com |
| Supabase | 資料庫 + Auth | 免費 (500MB) | supabase.com |
| Cloudflare | DNS + CDN | 免費 | cloudflare.com |
| GoDaddy / Namecheap | 網域註冊 | ~$10-15/年 | godaddy.com |
| LINE Developers | Bot 開發 | 免費 | developers.line.biz |
| OpenRouter | AI API | 隨用隨付 | openrouter.ai |
| Resend | Email 發送 | 免費 (100封/天) | resend.com |

### 3. 必裝軟體

```bash
# Node.js 18+ (推薦 20 LTS)
node --version  # 確認

# pnpm (比 npm 快 3 倍，硬連結節省磁碟)
npm install -g pnpm

# Git
git --version

# 專案管理工具 (選用)
# Notion / Linear / Trello
```

## 📚 前置知識

### 你應該要會的

| 知識 | 程度 | 學習資源 |
|------|------|----------|
| HTML/CSS/JS 基礎 | 能看懂、能修改 | MDN Web Docs |
| React 基礎 | 理解 component, props, state | react.dev |
| SQL 基礎 | SELECT, INSERT, UPDATE, JOIN | SQL Bolt 互動教學 |
| Git 基礎 | clone, add, commit, push, pull | ohmygit 遊戲 |
| 終端機操作 | 基本指令、環境變數 | 任何 Linux 101 課程 |

### 你不需要會的（課程會教）

- Next.js App Router
- Tailwind CSS
- Supabase RLS Policy
- LINE Messaging API
- AI Agent 原理
- CI/CD 流程

## 🏗️ 專案初始化

```bash
# 1. 建立 Next.js 專案
pnpm create next-app raceone-admin --typescript --tailwind --eslint --app --src-dir

# 2. 進入目錄
cd raceone-admin

# 3. 安裝 shadcn/ui (UI 元件庫)
pnpm dlx shadcn-ui@latest init

# 4. 安裝常用元件
pnpm dlx shadcn-ui@latest add button card table dialog form input select toast

# 5. 安裝其他依賴
pnpm add @supabase/supabase-js recharts lucide-react date-fns
pnpm add -D @types/node

# 6. 初始化 Git
git init
git add .
git commit -m "chore: initial project setup"
```

## 📁 目錄結構規劃

```
raceone-admin/
├── src/
│   ├── app/                  # Next.js App Router 頁面
│   │   ├── (public)/         # 公開頁面 (首頁、賽事、公告)
│   │   ├── dashboard/        # 管理後台
│   │   ├── api/              # API Routes
│   │   └── layout.tsx        # 根佈局
│   ├── components/           # 共用元件
│   │   ├── ui/               # shadcn/ui 元件
│   │   └── shared/           # 專案共用元件
│   └── lib/                  # 工具函式
│       ├── supabase/         # Supabase client
│       └── utils.ts          # 通用工具
├── public/                   # 靜態資源
├── supabase/                 # DB migration
│   └── migrations/
└── .env.local                # 環境變數 (勿提交)
```

## ⚠️ 常見陷阱

| 陷阱 | 說明 | 解法 |
|------|------|------|
| **pnpm ≠ npm** | 混用會壞 node_modules | 只用 pnpm 安裝 |
| **Node 版本** | Next.js 14 要 Node 18.17+ | 用 nvm 管理版本 |
| **.env 外洩** | 常見 #1 資安問題 | 加到 .gitignore |
| **shadcn/ui 版本** | 不同版本行為不同 | 鎖版本號 |

---

**下一章**：[01 — 網域申請與 DNS 設定](01-domain-and-dns.md)