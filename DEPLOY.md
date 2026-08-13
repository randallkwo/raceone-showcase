# RaceOne Admin 部署指南

## 1. Vercel 部署步驟

### 方式 A: Vercel Dashboard (推薦)

1. **推送到 GitHub**
   ```bash
   cd /root/.hermes/profiles/raceone-ai/admin
   git push -u origin master
   ```

2. **Vercel Import**
   - 登入 [Vercel Dashboard](https://vercel.com/dashboard)
   - 點擊 "Add New..." > "Project"
   - 選擇 `raceone/raceone-admin` repository
   - Framework Preset: Next.js (自動偵測)
   - 點擊 "Deploy"

3. **環境變數設定** (在 Vercel Project Settings > Environment Variables)
   從 `.env.example` 複製所有變數，分別設定：
   
   **必填 (Supabase):**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   
   **必填 (LINE Bot):**
   ```
   LINE_CHANNEL_SECRET=your-channel-secret
   LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
   ```
   
   **必填 (Telegram Bot):**
   ```
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_WEBHOOK_SECRET=your-webhook-secret  # 可選
   ```
   
   **必填 (NeWebPay 金流 - 測試環境):**
   ```
   NEWEBPAY_ENV=test
   NEWEBPAY_MERCHANT_ID=MS123456789
   NEWEBPAY_HASH_KEY=your-test-hash-key
   NEWEBPAY_HASH_IV=your-test-hash-iv
   NEWEBPAY_VERSION=1.7
   NEWEBPAY_RETURN_URL=https://your-vercel-domain.vercel.app/api/payments/return
   NEWEBPAY_NOTIFY_URL=https://your-vercel-domain.vercel.app/api/payments/notify
   NEWEBPAY_CLIENT_BACK_URL=https://your-vercel-domain.vercel.app/events
   ```
   
   **App 設定:**
   ```
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   NODE_ENV=production
   ```

4. **重新部署**
   - 設定完環境變數後，去 Deployments 標籤 > 三個點 > Redeploy

### 方式 B: Vercel CLI

```bash
cd /root/.hermes/profiles/raceone-ai/admin
npm i -g vercel
vercel login
vercel --prod
```

## 2. 設定 Webhook URL (部署完成後)

取得 Vercel 正式網域 (如 `https://raceone-admin.vercel.app`)，設定：

### LINE Developers Console
1. 登入 https://developers.line.biz/console/
2. 選擇 Channel > Messaging API
3. Webhook URL: `https://your-domain.vercel.app/api/bot/line`
4. 啟用 "Use webhook"
5. 點擊 "Verify" 確認成功

### Telegram BotFather
```bash
# 設定 Webhook
curl -F "url=https://your-domain.vercel.app/api/bot/telegram" \
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook

# 或使用 BotFather: /setwebhook > 輸入 URL
```

### 驗證 Webhook
```bash
# LINE
curl -X GET https://your-domain.vercel.app/api/bot/line

# Telegram  
curl -X GET https://your-domain.vercel.app/api/bot/telegram
```

## 3. NeWebPay 正式環境上線

取得正式帳號後，更新環境變數：
```
NEWEBPAY_ENV=production
NEWEBPAY_MERCHANT_ID=your-prod-merchant-id
NEWEBPAY_HASH_KEY=your-prod-hash-key
NEWEBPAY_HASH_IV=your-prod-hash-iv
NEWEBPAY_RETURN_URL=https://your-domain.vercel.app/api/payments/return
NEWEBPAY_NOTIFY_URL=https://your-domain.vercel.app/api/payments/notify
NEWEBPAY_CLIENT_BACK_URL=https://your-domain.vercel.app/events
```

在 Vercel 更新後 Redeploy。

## 4. 自動域名 (可選)

Vercel Project Settings > Domains > Add 自訂域名 (如 `admin.raceone.ai`)

## 5. 部署後檢查清單

- [ ] `/login` 正常登入
- [ ] `/registrations` 列表、篩選、CSV 匯出
- [ ] `/registrations/new` 手動新增
- [ ] `/transactions` 記帳、圖表
- [ ] `/sponsors` CRUD
- [ ] `/schedule` 時間軸 + 表格
- [ ] `/news` Markdown 編輯器、預覽
- [ ] `/users` RBAC 管理
- [ ] `/bot` Webhook URL 複製、測試連線
- [ ] `/events/[eventId]/register` 報名 + 付款流程
- [ ] LINE Bot `/help` `/register` `/myreg` 回覆正常
- [ ] Telegram Bot `/help` `/register` `/myreg` 回覆正常
- [ ] NeWebPay 付款流程 (測試環境)

## 6. 監控與日誌

- Vercel Functions Logs: Dashboard > Functions > View Logs
- Supabase Logs: Dashboard > Logs > PostgREST / Auth / Realtime
- Better Uptime: 已設定 4 個監控