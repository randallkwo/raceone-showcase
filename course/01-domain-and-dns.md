# 01 — 網域申請與 DNS 設定

> 本章教你：購買網域、設定 DNS、啟用 CDN 與 WAF 防護

---

## 🎯 本章目標

```
使用者輸入 https://www.raceone.ai → 瀏覽器
  → Cloudflare DNS (解析) → Cloudflare CDN (快取)
  → Vercel Edge Network → Next.js Server
  → 回傳頁面給使用者
```

## 1.1 選擇網域

### 命名原則

| 原則 | 說明 | 範例 |
|------|------|------|
| 簡短好記 | 6-12 個字元 | raceone.ai ✅ |
| 品牌關聯 | 一看就知道做什麼 | raceone.ai ✅ |
| 避免連字號 | 容易說錯、打錯 | race-one.ai ❌ |
| 選對後綴 | .com 最好，.ai 有科技感 | raceone.ai ✅ |

### 實際購買流程

```bash
# 1. 到 GoDaddy / Namecheap / Cloudflare Registrar 搜尋 domain
# 2. 確認 .com 或 .ai 可用
# 3. 付款 (約 $10-15 USD/年)
# 4. 設定 Nameserver 指向 Cloudflare

# 購買後你會得到：
# - 網域: raceone.ai
# - 管理後台: GoDaddy Domain Manager
# - 未來 DNS 管理: Cloudflare (推薦)
```

## 1.2 Cloudflare 設定

### 為什麼用 Cloudflare（免費方案）

| 功能 | 說明 |
|------|------|
| **DNS 代管** | 取代 GoDaddy 原生 DNS，更快更穩定 |
| **CDN 快取** | 全球 330+ 節點，加速靜態資源 |
| **WAF 防護** | 阻擋 SQL injection、XSS、DDoS |
| **SSL/TLS** | 自動頒發憑證，強制 HTTPS |
| **頁面規則** | 快取策略、301 重定向 |
| **免費** | 以上全部免費 |

### 設定步驟

```bash
# Step 1: 註冊 Cloudflare → 新增網站 → 輸入 raceone.ai
# Step 2: Cloudflare 掃描現有 DNS 記錄 → 自動匯入
# Step 3: 複製 Cloudflare 給的 Nameserver:
#   darl.ns.cloudflare.com
#   ollie.ns.cloudflare.com

# Step 4: 回到 GoDaddy Domain Manager
#   修改 Nameserver 為 Cloudflare 的兩組

# Step 5: 等待 DNS 生效 (通常 5-30 分鐘，最長 48 小時)
dig raceone.ai NS  # 確認 nameserver 已更新
```

## 1.3 DNS 記錄設定

### 必要記錄

| 類型 | 名稱 | 值 | 說明 |
|------|------|-----|------|
| **A** | `@` | `76.76.21.21` | Vercel Edge IP (or proxy) |
| **CNAME** | `www` | `cname.vercel-dns.com` | Vercel 託管 |
| **CNAME** | `*` | `cname.vercel-dns.com` | 萬用子網域 |
| **TXT** | `@` | `v=spf1 ...` | 郵件驗證 (選用) |
| **MX** | `@` | `aspmx.l.google.com` | Google Workspace 郵件 (選用) |

### 代理狀態 (Proxy Status)

```
☁️ 橘色雲 = Proxied (啟用 CDN/WAF) → 推薦
灰色雲 = DNS Only (無代理)
```

**重要**：Vercel 部署的網域**必須開啟 Proxy**，否則無法正確路由。

### 驗證方式

```bash
# 1. DNS 解析確認
dig www.raceone.ai
dig raceone.ai

# 2. Cloudflare 邊緣快取確認
curl -I https://www.raceone.ai | grep -i "cf-cache-status"

# 3. SSL 憑證確認
curl -vI https://www.raceone.ai 2>&1 | grep "SSL connection"
```

## 1.4 Vercel 網域綁定

```bash
# 在 Vercel Dashboard:
# Project → Settings → Domains → 輸入 raceone.ai
# Vercel 自動驗證 DNS 並頒發 SSL 憑證

# 或是用 CLI:
vercel domains add raceone.ai
vercel domains add www.raceone.ai
```

## 1.5 Cloudflare SSL/TLS 設定

| 設定 | 建議值 | 說明 |
|------|--------|------|
| SSL/TLS encryption | **Full (strict)** | 端到端加密，需 Vercel 有效憑證 |
| Always Use HTTPS | **On** | 強制 HTTPS 跳轉 |
| HSTS | **On** (max-age=31536000) | 防止 SSL Strip 攻擊 |
| Minimum TLS Version | **1.2** | 棄用 TLS 1.0/1.1 |

## 1.6 安全性強化

### WAF 規則範例

```yaml
# Cloudflare WAF Custom Rules
規則 1: 阻擋管理後台非授權 IP
  - 條件: (http.request.uri.path contains "/dashboard") AND (ip.src ne 你的IP)
  - 動作: BLOCK

規則 2: 阻擋常見攻擊
  - 條件: (http.request.uri contains "wp-admin") OR (http.request.uri contains ".env")
  - 動作: BLOCK

規則 3: Rate Limiting (API 防護)
  - 條件: (http.request.uri.path contains "/api/")
  - 速率: 100 次/10 秒
  - 動作: BLOCK (返回 429)
```

### robots.txt 設定

```txt
User-agent: *
Allow: /
Allow: /events
Allow: /news
Allow: /guide
Disallow: /dashboard
Disallow: /api/
Disallow: /admin
```

## 1.7 實戰 Lessons Learned

### ✅ 做對的事
- 第一天就設 Cloudflare，後續改 DNS 秒生效
- 啟用 Full (strict) SSL，不用擔心憑證問題
- 萬用子網域 CNAME `*` 方便後續加子網域

### ❌ 踩過的坑
- 忘記開 Proxy 狀態，Vercel 部署失敗
- DNS TTL 設太長 (24h)，改設定要等一天 → 改為 300s
- Cloudflare SSL 設 Flexible 導致 Vercel 端 security warning

### 🔑 關鍵指令速查

```bash
# DNS 查詢
dig raceone.ai A
dig raceone.ai NS
dig www.raceone.ai CNAME

# 連線測試
curl -sI https://www.raceone.ai
curl -svo /dev/null https://www.raceone.ai 2>&1 | grep -E "SSL|server|HTTP"

# SSL 憑證檢查
openssl s_client -connect raceone.ai:443 -servername raceone.ai 2>/dev/null | openssl x509 -text
```

---

**下一章**：[02 — 基礎架構規劃](02-infrastructure.md)