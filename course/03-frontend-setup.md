# 03 — 前端開發實戰

> 本章教你：用 Next.js 14 App Router + Tailwind CSS + shadcn/ui 從零打造一個 SaaS 介面

---

## 🎯 本章目標

完成後你將擁有：
- 一個 Next.js 14 專案（App Router）
- 公開頁面（首頁、賽事列表、公告）
- 受保護的管理後台
- 統一的 UI 設計系統
- 響應式設計（手機 + 桌機）

## 3.1 技術選擇決策

| 問題 | 選擇 | 原因 |
|------|------|------|
| 框架 | Next.js 14 | SSR、SEO、App Router |
| 路由 | App Router | 最新的 React 模式 |
| CSS | Tailwind CSS | 快速開發、一致設計 |
| UI 元件 | shadcn/ui | 可自訂、不是套件是程式碼 |
| 圖表 | Recharts | React 原生、輕量 |
| 圖示 | Lucide | 開源、一致風格 |
| 表單 | React Hook Form + Zod | 驗證型別安全 |
| 套件管理 | pnpm | 比 npm 快、省磁碟 |

## 3.2 Next.js 14 App Router 結構

```
src/app/
├── (public)/                 # Route Group: 公開頁面
│   ├── page.tsx              # 首頁 (Landing)
│   ├── events/
│   │   ├── page.tsx          # 賽事列表
│   │   └── [eventId]/
│   │       ├── page.tsx      # 賽事詳情
│   │       └── register/
│   │           └── page.tsx  # 線上報名
│   ├── news/
│   │   ├── page.tsx          # 公告列表
│   │   └── [slug]/
│   │       └── page.tsx      # 公告內文
│   ├── guide/
│   │   └── page.tsx          # 使用指南
│   └── layout.tsx            # 公開頁面共用佈局
├── dashboard/                # 受保護後台
│   ├── page.tsx              # 儀表板首頁
│   ├── races/                # 賽事管理 CRUD
│   └── news/                 # 公告管理
├── settings/                 # 個人設定
├── login/                    # 登入頁
├── api/                      # API Routes
│   ├── public/               # 公開 API
│   ├── cron/                 # 排程 API
│   └── notifications/        # 通知 API
├── layout.tsx                # 根佈局
├── middleware.ts             # Auth 路由守衛
└── sitemap.ts                # SEO XML Sitemap
```

### Route Group 技巧

```typescript
// (public) 是 Route Group — 不影響 URL 路徑
// 用途：讓公開頁面共用一個 layout，不影響 URL
src/app/(public)/page.tsx          → https://www.raceone.ai
src/app/(public)/events/page.tsx   → https://www.raceone.ai/events
src/app/dashboard/page.tsx         → https://www.raceone.ai/dashboard
```

## 3.3 Tailwind CSS 設計系統

```typescript
// tailwind.config.ts
// RaceOne 品牌色彩
const config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066FF',    // Race Blue
          hover: '#0052CC',
          light: '#4D94FF',
        },
        success: '#00D4AA',      // Finish Green
        danger: '#FF3B30',       // Alert Red
        warning: '#FF9F43',      // Warning Orange
        background: '#F8FAFC',   // 淺灰背景
        surface: '#FFFFFF',      // 白色卡片
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
    },
  },
};
```

### 設計原則

```scss
/* 間距系統：4px 基數 */
.p-4 = 16px padding
.gap-6 = 24px gap
.space-y-8 = 32px spacing

/* 圓角系統 */
.rounded-lg = 8px (卡片)
.rounded-xl = 12px (大卡片)
.rounded-2xl = 16px (模態框)
.rounded-full = 9999px (按鈕、徽章)

/* 陰影系統 */
.shadow-sm = 卡片 hover
.shadow-md = 下拉選單
.shadow-lg = 模態框
```

## 3.4 shadcn/ui 元件使用

### 安裝方式

```bash
# 一次安裝所有需要的元件
pnpm dlx shadcn-ui@latest add button card table dialog form input select toast
pnpm dlx shadcn-ui@latest add badge separator tabs tooltip dropdown-menu
pnpm dlx shadcn-ui@latest add sheet avatar skeleton switch
```

### 元件組合範例

```tsx
// 管理後台表格範例
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RacesTable({ races }: { races: RaceEvent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>賽事名稱</TableHead>
          <TableHead>狀態</TableHead>
          <TableHead>日期</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {races.map(race => (
          <TableRow key={race.id}>
            <TableCell className="font-medium">{race.name}</TableCell>
            <TableCell>
              <Badge variant={race.status === 'published' ? 'default' : 'secondary'}>
                {race.status === 'published' ? '已發布' : '草稿'}
              </Badge>
            </TableCell>
            <TableCell>{new Date(race.start_at).toLocaleDateString('zh-TW')}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => router.push(`/races/${race.id}`)}>
                編輯
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## 3.5 Middleware 路由守衛

```typescript
// src/middleware.ts — 鑑別哪些頁面需要登入
export const config = {
  matcher: [
    // 保護管理後台，放行公開路徑
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/|$|events(?:/.*)?$|news(?:/.*)?$|login|guide).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);

  // 未登入訪問受保護頁面 → 導回登入頁
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}
```

**重要技巧**：matcher regex 要小心 — `/news` 不能回 307（公開頁面），`/dashboard` 要回 307（受保護）。

## 3.6 圖表實作 (Recharts)

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// RaceOne 圖表色彩 (不可讓線條透明!)
const CHART_COLORS = {
  primary: '#0066FF',
  success: '#00D4AA',
  danger: '#FF3B30',
};

export function RegistrationsChart({ data }: { data: DayStats[] }) {
  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="count"
        stroke={CHART_COLORS.primary}  // ⚠️ 使用明確十六進位色碼
        strokeWidth={2}
      />
    </LineChart>
  );
}
```

### ⚠️ 圖表常見陷阱

```typescript
// ❌ 錯誤：hsl(var(--chart-1)) 在 Recharts 中 undefined → 線條透明
<Line stroke="hsl(var(--chart-1))" />

// ✅ 正確：使用明確十六進位色碼
<Line stroke="#0066FF" />
```

## 3.7 響應式設計策略

```tsx
// 使用 Tailwind 響應式前綴
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 手機: 1 欄, 平板: 2 欄, 桌機: 3 欄 */}
</div>

// 行動版觸控目標 (至少 44px)
<Button className="min-h-[44px] min-w-[44px]">

// 表格響應式：手機改卡片式
// 桌機顯示表格，手機顯示資訊卡
```

## 3.8 表單處理模式

```tsx
// 表單的三個必備狀態
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ... 實際操作 ...
    setSuccess(true);
    setTimeout(() => router.push('/races'), 1500);
  } catch (err: any) {
    setError(err.message || '操作失敗');
  } finally {
    setLoading(false);  // ⚠️ 一定要在 finally 中關閉
  }
}
```

## 3.9 實戰 Lessons Learned

### ✅ 做對的事
- 用 Route Group `(public)` 分離公開頁面和後台
- shadcn/ui 安裝完整，避免後續缺元件
- 表單統一 try/catch/finally 模式

### ❌ 踩過的坑
- 圖表用 `hsl(var(--chart-N))` 導致線條透明 → 改 `#0066FF`
- 忘了 matcher regex 導致 `/news` 被保護 → 修正 regex
- pnpm 和 npm 混用 → 只准用 pnpm
- `.single()` 沒包 try/catch → 查無資料時 crash

---

**下一章**：[04 — 後端資料庫設計](04-backend-database.md)