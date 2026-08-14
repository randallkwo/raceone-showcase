# 技術文章大綱：Bot Gateway —— LINE/Telegram 雙平台統一路由與動態指令熱載入

**目標發布平台**：個人部落格 / Medium / Notion 公開頁面  
**預估字數**：2,800-3,200 字  
**目標讀者**：後端工程師、即時通訊開發者、微服務架構師  
**SEO 關鍵字**：LINE Bot, Telegram Bot, webhook, 多平台 Bot, 統一路由, hot-reload 指令, 動態指令

> **本文是 RaceOne 技術系列第 3 篇**。系列導覽：① RLS → ② 多租戶遷移 → ③ Bot Gateway（本篇）→ ④ 即時計時 → ⑤ QA Gate。

---

## 📋 文章結構總覽

```
1. 開場：為什麼一個賽事平台需要三種 Bot？（300 字）
2. 核心問題：每個平台的「方言」都不一樣（400 字）
3. 抽象層設計：統一 Incoming/Outgoing Message 模型（500 字）
4. 動態指令熱載入：讓非工程師也能加指令（600 字）
5. Webhook 安全：簽章驗證與防偽造（400 字）
6. 多專案路由：一個 Gateway 服務 N 個賽事（400 字）
7. 可靠度與降級：斷線、重試、熔斷（400 字）
8. 實測與避坑（300 字）
9. 總結與可複製架構（200 字）
```

---

## 1. 開場：為什麼一個賽事平台需要三種 Bot？（~300 字）

### Hook
> 「超馬賽事的跑者散落在不同的通訊軟體上——有人用 LINE 跟家人報平安，有人用 Telegram 接收賽事公告，還有人用 Discord 參與選手社群。如果每一種都要寫一套獨立的 Bot 邏輯，等於把『查成績』『報名狀態』『補給站公告』這些業務邏輯用三種不同的 API、三種不同的資料結構、三種不同的發送方式各寫一遍。維護成本 ×3。RaceOne 的做法是：建立一個 **Bot Gateway**，把三個平台的『方言』翻譯成一種統一的內部語言，讓業務邏輯只寫一次。」

### 背景
- RaceOne 支援 **LINE / Telegram / Discord** 三個平台
- 相同業務：賽事查詢、報名提醒、補給站公告、自訂指令
- 技術：Next.js API Routes + Supabase + 各平台官方 API

---

## 2. 核心問題：每個平台的「方言」都不一樣（~400 字）

### 三個平台的差異（第一個坑）

| 維度 | LINE | Telegram | Discord |
|------|------|----------|---------|
| **Webhook 格式** | `events[]` 陣列 | `update` 物件 | `interaction` 物件 |
| **回覆機制** | `replyToken`（一次性） | `chat_id` + `message_id` | `interaction.token` |
| **簽章驗證** | `X-Line-Signature` (HMAC-SHA256) | Secret Token header | Public Key 簽章 |
| **文字位置** | `event.message.text` | `update.message.text` | `interaction.data.options` |
| **群組標識** | `groupId` | `chat.id` | `guild_id` |
| **富媒體** | Flex Message | Inline Keyboard | Embed |

> **核心洞察**：如果直接在各平台 handler 寫業務邏輯，每次加功能（例如「新增一個查天氣指令」）就要改三個檔案、三個資料結構、三個測試。`if/else` 會爆炸。

---

## 3. 抽象層設計：統一 Incoming/Outgoing Message 模型（~500 字）

### 3.1 統一輸入模型 `IncomingMessage`

所有平台事件先「翻譯」成統一格式，業務邏輯只看這個介面：

```typescript
// src/lib/bot/types.ts （核心抽象）
interface IncomingMessage {
  platform: 'line' | 'telegram' | 'discord';
  userId: string;          // 統一用戶識別
  chatId?: string;         // 群組/房間識別
  text: string;            // 統一文字
  replyToken?: string;     // LINE 專用（一次性回覆 token）
  messageId?: string;
  timestamp: Date;
  rawEvent: any;           // 保留原始事件（需要平台專屬功能時可用）
}
```

### 3.2 統一輸出模型 `OutgoingMessage`

```typescript
interface OutgoingMessage {
  platform: 'line' | 'telegram' | 'discord';
  targetId: string;       // userId 或 chatId
  text: string;
  replyToken?: string;
  options?: {
    quickReply?: {...};   // LINE 的快捷回覆
    keyboard?: any;       // Telegram 的鍵盤
    embed?: any;          // Discord 的 Embed
    parseMode?: 'HTML' | 'Markdown';  // Telegram 的解析模式
  };
}
```

> **設計關鍵**：`options` 是可選的平台專屬擴充，讓通用邏輯不用依賴平台，但真正需要平台特性時仍有逃生門（透過 `rawEvent` / `options`）。

### 3.3 統一指令模型 `BotCommand`

```typescript
interface BotCommand {
  trigger: string;    // 例如 '成績'
  description: string;
  requiredRole?: string;  // RBAC 整合
  handler: (msg: IncomingMessage, args: string[], projectCode?: string) 
    => Promise<OutgoingMessage | OutgoingMessage[] | void>;
}
```

### 3.4 每個平台實作 Adapter

```
        ┌────────────────────────────────────────┐
        │               Business Logic            │
        │      (只懂 IncomingMessage/BotCommand)   │
        └────────────────────────────────────────┘
                          ▲
        ┌─────────────────┴─────────────────┐
        │         Bot Gateway (Router)      │
        └┬──────────────┬──────────────┬────┘
         │              │              │
   ┌─────┴────┐   ┌─────┴────┐   ┌─────┴────┐
   │LINE Adapter│  │TG Adapter │  │Discord Adpt│
   │ parse/send │  │ parse/send│  │ parse/send│
   └───────────┘   └──────────┘   └──────────┘
```

---

## 4. 動態指令熱載入：讓非工程師也能加指令（~600 字）

### 4.1 痛點
賽事主辦方常說：「我們想要一個指令，跑者輸入了『報名進度』就回覆目前的報名狀態。」傳統做法是工程師寫死一個 handler。但 RaceOne 希望主辦方能**自己透過管理後台新增指令**，不用改 code、不用重新部署。

### 4.2 設計：指令 = 資料庫記錄

```sql
-- bot_commands 表（核心規格）
CREATE TABLE bot_commands (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES race_events(id),  -- NULL = 全域指令
  trigger TEXT NOT NULL,        -- 例如 '報名進度'
  template TEXT,                -- 靜態回覆範本（可含 {project} {user} 等變數）
  use_llm BOOLEAN DEFAULT false,-- 是否走 LLM 動態生成
  platforms TEXT[],             -- ['line','telegram','discord']
  required_role TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT
);
```

### 4.3 動態載入：`loadCustomCommands()`

```typescript
// src/lib/bot/custom-commands.ts
export async function loadCustomCommands(
  projectCode: string, platform: 'line' | 'telegram' | 'discord'
): Promise<Map<string, BotCommand>> {
  // 1. 找 project → tenants → events（多租戶穿透）
  // 2. 查詢 bot_commands：全域 + 該專案賽事、啟用、支援該平台
  const { data: commands } = await supabase
    .from('bot_commands')
    .select('*')
    .eq('is_active', true)
    .contains('platforms', [platform])
    .order('sort_order', { ascending: true });

  // 3. 每個指令建立 handler
  const registry = new Map<string, BotCommand>();
  for (const cmd of commands) {
    registry.set(cmd.trigger, createCustomCommandHandler(cmd, platform));
  }
  return registry;
}
```

### 4.4 Template 與 LLM 兩種模式

```typescript
function createCustomCommandHandler(cmd, platform): BotCommand {
  return {
    trigger: cmd.trigger,
    handler: async (msg, args, projectCode) => {
      if (cmd.use_llm) {
        // LLM 模式：動態生成回覆（未來接 OpenAI/Anthropic）
        return runLLM(cmd.trigger, msg.text, projectCode);
      }
      // Template 模式：靜態範本 + 變數替換
      let text = cmd.template || '（無回覆內容）';
      text = text
        .replace('{project}', projectCode)
        .replace('{user}', msg.displayName || msg.userId)
        .replace('{trigger}', cmd.trigger)
        .replace('{args}', args.join(' '));
      return { platform, targetId: msg.chatId || msg.userId, text, replyToken: msg.replyToken };
    },
  };
}
```

### 4.5 合併內建 + 自訂（內建優先）

```typescript
export async function buildCommandRegistry(projectCode, platform, registerBuiltin) {
  const registry = new Map();
  registerBuiltin(registry);                       // 1. 內建指令優
  const custom = await loadCustomCommands(projectCode, platform);
  for (const [trigger, cmd] of custom) {
    if (!registry.has(trigger)) registry.set(trigger, cmd); // 2. 自訂不覆蓋內建
  }
  return registry;
}
```

> **「熱載入」的意義**：因為指令存在資料庫，主辦方在管理後台新增指令後，**不需要重新部署**——每次 webhook 觸發時重新 load（或定期 cache 刷新）即可生效。這是「資料驅動的程式碼行為」。

---

## 5. Webhook 安全：簽章驗證與防偽造（~400 字）

### 5.1 為何必須驗證簽章
若攻擊者知道 webhook URL，就能偽造 LINE 發送請求，騙取 Bot 執行指令（例如觸發「發送公告給所有跑者」）。**必須驗證請求確實來自官方平台。**

### 5.2 LINE 簽章驗證（HMAC-SHA256）

```typescript
// src/lib/bot/line.ts
import * as crypto from 'crypto';

function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(body)               // 原始 request body（未解析）
    .digest('base64');
  return hash === signature;    // 常數時間比較較安全
}
```

**關鍵細節**：
- 用**原始 raw body**（不是 JSON.stringify 後的）計算簽章
- 必須在 `req.text()` 讀取原始字串，不能先 `req.json()`
- 用**常數時間比較**（`crypto.timingSafeEqual`）防 timing attack

### 5.3 Telegram Secret Token

```typescript
// Telegram 使用自訂 header
function verifyTelegramToken(req: NextRequest): boolean {
  const token = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  return token === process.env.TELEGRAM_SECRET_TOKEN;
}
```

### 5.4 統一驗證掛鉤

```typescript
// route.ts 統一入口
export async function POST(req: NextRequest) {
  const rawBody = await req.text();  // 先讀 raw 才可驗簽
  if (!verifyLineSignature(rawBody, req.headers.get('X-Line-Signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  const events = JSON.parse(rawBody).events;
  return handleEvents(events, commandRegistry);  // 驗證通過才進業務
}
```

---

## 6. 多專案路由：一個 Gateway 服務 N 個賽事（~400 字）

### 6.1 需求
RaceOne 是多租戶（第 2 篇），所以 Bot 也要能**依專案**區分——不同賽事有不同的指令、不同的資料範圍。

### 6.2 策略 B：每專案獨立部署/獨立 webhook

```typescript
// 兩種 route 同時存在：
//   /api/bot/telegram            → 預設專案
//   /api/bot/[project]/telegram  → 指定專案專屬 Webhook
```

```typescript
// src/app/api/bot/[project]/telegram/route.ts
export async function POST(req: NextRequest, { params }: { params: { project: string } }) {
  // 依 project 載入該專案的 command registry（含租戶穿透）
  const registry = await buildCommandRegistry(params.project, 'telegram', registerTelegramCommands);
  return handleTelegramWebhook(req, registry, params.project);
}
```

> **多租戶穿透**：`loadCustomCommands` 內部會 `project → tenants → events` 找出該專案所有賽事的指令，確保**不會**載入其他專案的指令（延續第 2 篇的 tenant 隔離精神）。

---

## 7. 可靠度與降級：斷線、重試、熔斷（~400 字）

### 7.1 平台 API 失敗處理

| 情境 | 策略 |
|------|------|
| LINE API 5xx | 重試 2 次（指數退避），仍失敗記入 `notification_logs` |
| Telegram 429 (rate limit) | 尊重 `retry_after`，等待後重試 |
| Webhook 處理異常 | 記 audit_log，回傳 200 避免平台持續重送 |
| 外部整合超時 | 設 timeout（LINE reply 需在 1 秒內回應，逾時改用 push） |

### 7.2 LINE 的「1 秒回覆」陷阱

LINE 的 reply API 要求 webhook **收到後 1 秒內必須回應**。若業務邏輯要查 DB、呼叫外部 API，1 秒可能不夠。解法：

```
策略：先回 200 空回應，再用 push API 發送
好處：避免 LINE 視為逾時而重送，業務可在背景慢慢跑
```

```typescript
// 先 200 確認收到
return NextResponse.json({ received: true });

// 背景處理（或 fire-and-forget）
process.nextTick(async () => {
  const result = await runCommand(...);
  await pushLineMessage(userId, [result]);  // 用 push 不是 reply
});
```

### 7.3 監控與可觀測性

```typescript
// 每個 webhook 寫入 notification_logs
await supabase.from('notification_logs').insert({
  platform: 'line', direction: 'inbound',
  command: trigger, user_id: msg.userId, status: 'success'|'error',
  latency_ms, created_at: new Date()
});
```

---

## 8. 實測與避坑（~300 字）

### 避坑清單

| 坑 | 症狀 | 解法 |
|----|------|------|
| **用 JSON.stringify 後的 body 驗簽** | 簽章永遠不匹配 | 用原始 `req.text()` |
| **LINE reply 逾時** | 訊息沒發出去、平台重送 | 1 秒內回 200，業務用 push |
| **指令覆蓋** | 自訂指令蓋掉內建 `/start` | `buildCommandRegistry` 內建優先 |
| **跨租戶指令洩漏** | 載入到別家賽事的指令 | `project → tenants → events` 穿透過濾 |
| **Webhook 含 secret** | 環境變數洩露 | 放 server-only env，勿 `NEXT_PUBLIC_` |
| **密碼/金鑰硬編碼** | 原始碼洩露 | `.env.example` 用 placeholder |

### 實測數據（概估）
- 單一 webhook 平均延遲：< 300ms（不含外部整合）
- 指令熱載入：< 1s（DB 查詢，可 cache）
- 三平台邏輯重複程式碼：**從 3× → 1×**（抽象層節省）

---

## 9. 總結與可複製架構（~200 字）

### 核心原則
1. **翻譯，不重寫**——每個平台用 Adapter 翻譯成統一 Message 模型，業務邏輯只寫一次
2. **指令資料化**——把 handler 變資料庫記錄，非工程師也能加指令、且熱載入免重部署
3. **簽章是唯一信任來源**——每平台用官方簽章驗證，防偽造
4. **先回 200 再背景處理**——繞過平台回覆時限，提升可靠度
5. **租戶穿透延續**——指令載入依 `project→tenants→events` 過濾，防跨租戶洩漏

### 可複製目錄結構

```
src/lib/bot/
├── types.ts              # IncomingMessage / OutgoingMessage / BotCommand
├── line.ts               # LINE Adapter（簽章、parse、send）
├── telegram.ts           # Telegram Adapter
├── custom-commands.ts    # 動態指令載入 + template/LLM 模式
└── (discord.ts)          # 第三平台即插即用

src/app/api/bot/
├── [project]/line/route.ts      # 多專案 webhook
├── [project]/telegram/route.ts
├── line/route.ts                # 預設專案
└── telegram/route.ts
```

> **結論**：Bot Gateway 讓 RaceOne 用一份業務邏輯同時服務 LINE/Telegram/Discord 三平台，且主辦方能透過管理後台動態新增指令、免重新部署。這是「資料驅動程式行為」在即時通訊上的實際應用。

---

## 📎 附錄：可附程式碼片段

| 片段 | 價值 |
|------|------|
| `types.ts` 統一 Message 模型 | 核心抽象，可直接套用 |
| `verifyLineSignature()` | LINE 簽章驗證正確寫法 |
| `loadCustomCommands()` + `buildCommandRegistry()` | 動態指令熱載入 |
| `bot_commands` 表結構 | 指令資料化 |
| `[project]/telegram/route.ts` | 多租戶 webhook 路由 |

---

**發布清單**：
- [ ] 文章 Markdown 完成
- [ ] 程式碼片段整理至 Gist / GitHub 目錄
- [ ] 附件：三平台差異對照表精美版本、架構圖（Adapter pattern 示意）
- [ ] 部落格發布 + 系列互相連結

---

**預估完成時間**：2-3 個工作晚間  
**優先級**：🟢 中——即時通訊架構，作為系列文章的延伸主題
