# 05 — LINE Bot 整合

> 本章教你：LINE Messaging API 整合、LIFF 登入、群組管理、指令系統

---

## 🎯 本章目標

完成後你將擁有：
- LINE Bot 自動回覆跑者查詢
- LIFF 網頁嵌入 LINE 以綁定帳號
- 群組對話快取 + 摘要指令
- 角色權限控管

## 5.1 LINE Bot 架構

```
跑者傳訊息 → LINE Platform → Webhook → Hermes Gateway (VPS)
                                    ↓
                              AI Agent 處理
                                    ↓
角色判斷 → 指令匹配 → 查詢 Supabase → 回覆
```

## 5.2 前置設定

### LINE Developers Console

```bash
# 1. 登入 https://developers.line.biz
# 2. 建立 Provider
# 3. 建立 Messaging API Channel

# 取得以下資訊：
Channel ID:      2010608920
Channel Secret:  [REDACTED]
Channel Token:   [REDACTED]  # Long-lived token
Basic ID:        @8958fiiy

# 4. 設定 Webhook URL
#    https://your-vps:8443/webhook
#    (不建議用 Vercel Serverless，10s timeout 不夠)

# 5. 啟用 Webhook → Verify
```

### LIFF 設定

```bash
# 1. 在 LINE Developers → LIFF → Add
# 2. 設定：
Endpoint URL:  https://www.raceone.ai/settings
Size:          Full
View Type:     Bottom (手機底部導航)

# 3. 取得 LIFF ID
NEXT_PUBLIC_LIFF_ID=200...
```

## 5.3 Webhook 處理

```typescript
// Hermes Gateway 的 webhook handler (簡化版)
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    // 1. 只處理文字訊息
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    // 2. 取得使用者角色
    const role = await getUserRole(event.source.userId);

    // 3. 判斷是否為指令 (以 / 開頭)
    if (event.message.text.startsWith('/')) {
      await handleCommand(event, role);
    } else {
      // 非指令 → AI 回覆 (僅 admin 以上)
      if (role === 'admin' || role === 'super_admin') {
        await handleAIResponse(event);
      }
    }
  }

  res.status(200).end();
});
```

## 5.4 指令系統

### 指令清單

| 指令 | 權限 | 功能 |
|------|------|------|
| `/stats` | 全部 | 賽事統計摘要 |
| `/summary` | 全部 | 群組對話摘要 |
| `/races` | 全部 | 列出賽事 |
| `/report` | admin+ | 產出報表 |
| `/broadcast` | super_admin | 群組廣播 |
| `/help` | 全部 | 顯示說明 |

### 指令處理範例

```typescript
async function handleCommand(event, role) {
  const cmd = event.message.text.split(' ')[0];

  switch (cmd) {
    case '/stats':
      const stats = await getRaceStats();
      await reply(event.replyToken, formatStats(stats));
      break;

    case '/summary':
      const summary = await getConversationSummary(event.source.groupId);
      await reply(event.replyToken, summary);
      break;

    case '/broadcast':
      if (role !== 'super_admin') {
        await reply(event.replyToken, '無權限使用此指令');
        return;
      }
      // ... 廣播邏輯
      break;
  }
}
```

## 5.5 群組對話快取

### 為什麼要快取

LINE API 限制：
- 無法讀取歷史訊息
- Webhook 只推送事件當下的訊息
- 群組對話 Context 在 LLM 回覆中很重要

### 實作方式

```typescript
// 將群組對話儲存到 Supabase
interface ChatMessage {
  group_id: string;
  user_id: string;
  display_name: string;
  text: string;
  timestamp: Date;
}

// /summary 指令：擷取近期對話摘要
async function getConversationSummary(groupId: string): Promise<string> {
  const messages = await supabase
    .from('bot_logs')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  // 送給 LLM 產生摘要
  return summarizeWithLLM(messages);
}
```

## 5.6 角色權限控管

### 角色層級

```yaml
super_admin:
  - 所有指令
  - 跨租戶管理
  - 廣播系統公告
  - 管理其他管理員

admin:
  - 完整管理指令
  - 所屬租戶資料
  - 無法跨租戶

superviewer:
  - 唯讀查詢指令
  - 無法修改資料
  - 無法執行管理指令

viewer (預設):
  - 基本查詢指令
  - 僅個人相關資料
```

### 權限判斷

```typescript
const ROLE_HIERARCHY = {
  super_admin: 100,
  admin: 80,
  superviewer: 50,
  viewer: 10,
};

function hasPermission(userRole: string, minRole: string): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

// 使用
if (!hasPermission(role, 'admin')) {
  return reply(token, '⚠️ 此功能需要管理員權限');
}
```

## 5.7 LIFF 綁定頁面

LINE 登入後，用戶需要將 LINE User ID 綁定到系統帳號：

```tsx
// /settings 頁面包含 LIFF 初始化
'use client';

import liff from '@line/liff';

export default function SettingsPage() {
  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }
        const profile = await liff.getProfile();
        // 將 line_user_id 寫入 profiles 表
        await supabase
          .from('profiles')
          .update({ line_user_id: profile.userId })
          .eq('id', user.id);
      });
  }, []);
}
```

## 5.8 實戰 Lessons Learned

### ✅ 做對的事
- LINE User ID 存 profiles 而非 session（持久綁定）
- Webhook 走 VPS Gateway 而非 Vercel Serverless（避免 10s timeout）
- 角色權限分層，避免過度授權

### ❌ 踩過的坑
- LINE Webhook 驗證失敗 → 檢查 Channel Secret 是否正確
- LIFF 在 LINE 外部開啟失敗 → LiffId 需要對應正確的 Channel
- `line_user_id` 存的是 User ID (U+32 hex) 不是 Display ID
- Long token 複製不完整 → 複製時確認整串都 copy 到

---

**下一章**：[06 — AI Agent 整合](06-ai-agent-hermes.md)