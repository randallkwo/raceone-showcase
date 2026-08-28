# 07 — 部署流程與 CI/CD

> 本章教你：從本地開發到 production 上線的完整部署流程，包含自動化 CI/CD 與安全管理

---

## 🎯 本章目標

完成後你將擁有：
- GitHub → Vercel 自動部署流程
- 環境變數安全管理
- 資料庫 Migration 流程
- 零停機部署策略
- 回滾程序

## 7.1 部署架構

```
開發者 push → GitHub → GitHub Actions (CI 檢查)
                         ↓ 通過
                      Vercel (自動部署)
                         ↓
                    Cloudflare CDN
                         ↓
                    使用者看到更新
```

## 7.2 環境變數管理

### 三層環境

```yaml
# .env.local (本地開發)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # 本地 anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # 本地 service key

# Vercel Preview (自動從 GitHub PR 產生)
# 繼承 Production 的環境變數，不另外設定

# Vercel Production
NEXT_PUBLIC_SUPABASE_URL=https://lklicakxcvumkqujeqcy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # ⚠️ 需在 Vercel Dashboard 設定
RESEND_API_KEY=re_...
NEXT_PUBLIC_LINE_LIFF_ID=200...
NEXT_PUBLIC_SITE_URL=https://www.raceone.ai
```

### 安全規則

```bash
# ✅ 一定要設在 Vercel Dashboard (不是程式碼中)
# ❌ 絕對不能 commit 到 GitHub
# ✅ .env.local 已在 .gitignore 中

# 在 Vercel Dashboard 設定環境變數
# Project → Settings → Environment Variables
```

## 7.3 Vercel 部署設定

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

### 自動部署

```bash
# 每次 push 到 master → Vercel 自動部署
git push origin master

# 每次開 PR → 自動產生 Preview URL
git checkout -b feature/new-feature
git push origin feature/new-feature
# → GitHub 顯示 Preview URL: https://raceone-admin-git-feature.vercel.app
```

## 7.4 資料庫 Migration

### Supabase Migration 流程

```bash
# 1. 本地修改 schema
# 2. 產生 migration 檔案
supabase migration new add_sponsor_table

# 3. 編輯 migration SQL
# 4. 本地測試
supabase db reset

# 5. 遠端套用
supabase db push

# 6. commit migration 檔案
git add supabase/migrations/
git commit -m "feat(db): add sponsor table"
```

### Migration 範例

```sql
-- supabase/migrations/20260825_add_sponsors.sql
CREATE TABLE sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  contact_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- RLS: admin 可管理，superviewer 唯讀
CREATE POLICY "Admins manage sponsors"
  ON sponsors FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Superviewers read sponsors"
  ON sponsors FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superviewer'))
  );
```

## 7.5 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm run lint       # ESLint 檢查
      - run: pnpm run typecheck   # TypeScript 型別檢查
      - run: pnpm run build       # Build 驗證
```

## 7.6 VPS 服務管理 (systemd)

```bash
# Hermes Gateway systemd service
cat > /etc/systemd/system/hermes-gateway.service << 'EOF'
[Unit]
Description=Hermes Gateway - LINE Bot Webhook
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/hermes-gateway
ExecStart=/usr/local/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 啟動服務
systemctl daemon-reload
systemctl enable hermes-gateway
systemctl start hermes-gateway

# 查看狀態
systemctl status hermes-gateway
journalctl -u hermes-gateway -f
```

## 7.7 零停機部署

Vercel 的部署模式：

```yaml
Vercel 預設: Blue-Green Deployment
- 現有版本 (Blue): 持續服務
- 新版本 (Green): 在背景啟動
- 驗證通過後：切換流量到 Green
- 如果失敗：Instant Rollback 回到 Blue
```

### 回滾程序

```bash
# 方法 1: Vercel Dashboard 一鍵回滾
#   Deployments → 找到前一個穩定版本 → ... → Promote to Production

# 方法 2: Git revert + push
git revert HEAD
git push origin master
# Vercel 自動部署 revert 後的版本

# 方法 3: DB 向下遷移 (極少用)
supabase db diff
# 需要時執行反向 migration
```

## 7.8 部署檢查清單

每次部署前必須檢查：

```
□ Build 成功 (pnpm run build exit 0)
□ 公開頁面 200 (curl 6 個 URL)
□ 受保護頁 307 (未登入應跳轉)
□ 資料庫表格完整 (15 張)
□ Middleware 正確 (公開頁不會被攔)
□ API 安全 (未登入回 401)
□ 表單健壯 (try/catch/finally)
□ 圖表色彩正確 (#0066FF)
□ 合計動態計算 (篩選後更新)
□ .env 變數已設定 (Vercel Dashboard)
```

## 7.9 實戰 Lessons Learned

### ✅ 做對的事
- Vercel + GitHub 整合，push 即部署
- Preview Deployments 讓 QA 可以在獨立環境測試
- DB migration 用檔案追蹤，版本清楚

### ❌ 踩過的坑
- Vercel Hobby cron 每天只能 1 次 → 合併所有 cron 到單一 `/api/cron/daily`
- 忘了在 Vercel 設定環境變數 → 本地 build OK，但上線掛掉
- service_role key 更新後忘了同步到 Vercel → API 認證失敗
- Vercel Protection Bypass 沒關 → Cron job 無法訪問 API

---

**下一章**：[08 — QA 品管流程](08-qa-process.md)