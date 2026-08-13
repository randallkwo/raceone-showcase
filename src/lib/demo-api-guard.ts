/**
 * Demo Mode API Guard — RaceOne 伺服端 Demo 模式攔截器
 * 
 * 用於 API Route (src/app/api/*) 與 Server Actions 中，
 * 攔截寫入操作並回傳標準化 403 回應。
 */

import { NextRequest, NextResponse } from 'next/server'

/** 判斷是否為 Demo 模式 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

/** 被攔截的 HTTP 方法 */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const

/** 操作代碼對應表 (依 API 路徑推斷) */
const ROUTE_ACTION_MAP: Record<string, string> = {
  // races
  '/api/races': 'create_race',
  '/api/races/': 'update_race', // 動態路由會在 middleware 處理
  // registrations
  '/api/registrations': 'create_registration',
  // transactions
  '/api/transactions': 'create_transaction',
  // budget
  '/api/budget': 'create_budget_plan',
  // sponsors
  '/api/sponsors': 'create_sponsor',
  // schedule
  '/api/schedule': 'create_schedule',
  // bot
  '/api/bot/commands': 'create_bot_command',
  '/api/bot/broadcast': 'send_bot_broadcast',
  // volunteers
  '/api/volunteers': 'create_volunteer_role',
  // users
  '/api/users': 'create_user',
  // news
  '/api/news': 'create_news',
  // checkin
  '/api/checkin': 'checkin_runner',
  // timing
  '/api/timing': 'record_timing',
  // dnf-dns
  '/api/dnf-dns': 'record_dnf',
  // aid-stations
  '/api/aid-stations': 'update_aid_station',
  // notion
  '/api/notion/sync': 'trigger_notion_sync',
  // notifications
  '/api/notifications': 'send_email',
  // payments
  '/api/payments/webhook': 'trigger_payment_webhook',
  '/api/payments/refund': 'refund_payment',
}

/** 從請求路徑推斷操作代碼 */
export const inferActionFromRequest = (req: NextRequest): string | null => {
  const path = req.nextUrl.pathname
  
  // 精確匹配
  if (ROUTE_ACTION_MAP[path]) return ROUTE_ACTION_MAP[path]
  
  // 前綴匹配 (針對動態路由 /api/races/[id] 等)
  for (const [prefix, action] of Object.entries(ROUTE_ACTION_MAP)) {
    if (path.startsWith(prefix)) {
      // 根據 HTTP 方法細分
      const method = req.method
      if (method === 'POST') return action.replace('update_', 'create_').replace('delete_', 'create_')
      if (['PUT', 'PATCH'].includes(method)) return action.replace('create_', 'update_')
      if (method === 'DELETE') return action.replace('create_', 'delete_').replace('update_', 'delete_')
      return action
    }
  }
  
  return null
}

/** 標準化 Demo 模式錯誤回應 */
export const createDemoBlockedResponse = (action: string, method: string): NextResponse => {
  const labels: Record<string, string> = {
    create_race: '新增賽事', update_race: '編輯賽事', delete_race: '刪除賽事',
    create_registration: '新增報名', update_registration: '編輯報名', delete_registration: '刪除報名',
    create_transaction: '新增收支', update_transaction: '編輯收支', delete_transaction: '刪除收支',
    create_budget_plan: '新增預算', update_budget_plan: '編輯預算', delete_budget_plan: '刪除預算',
    create_budget_actual: '新增實際收支', update_budget_actual: '編輯實際收支', delete_budget_actual: '刪除實際收支',
    create_sponsor: '新增贊助商', update_sponsor: '編輯贊助商', delete_sponsor: '刪除贊助商',
    create_schedule: '新增行程', update_schedule: '編輯行程', delete_schedule: '刪除行程',
    create_bot_command: '新增 Bot 指令', update_bot_command: '編輯 Bot 指令', delete_bot_command: '刪除 Bot 指令',
    send_bot_broadcast: '發送廣播',
    create_volunteer_role: '新增志工角色', update_volunteer_role: '編輯志工角色', delete_volunteer_role: '刪除志工角色',
    create_volunteer_shift: '新增志工班次', update_volunteer_shift: '編輯志工班次', delete_volunteer_shift: '刪除志工班次',
    assign_volunteer: '指派志工', unassign_volunteer: '取消指派',
    create_user: '新增使用者', update_user: '編輯使用者', delete_user: '刪除使用者',
    change_user_role: '變更角色', reset_user_password: '重設密碼',
    create_news: '新增公告', update_news: '編輯公告', delete_news: '刪除公告', publish_news: '發佈公告',
    checkin_runner: '簽到/領號碼布', assign_bib: '指派號碼布', print_qr_codes: '列印 QR Code',
    record_timing: '記錄計時', manual_timing_adjust: '手動調整計時',
    record_dnf: '記錄 DNF', record_dns: '記錄 DNS',
    update_aid_station: '編輯補給站', update_supply_quantity: '更新物資數量', create_supply: '新增物資',
    trigger_notion_sync: '觸發 Notion 同步', test_notion_connection: '測試 Notion 連線',
    send_email: '發送 Email', send_line: '發送 LINE', send_telegram: '發送 Telegram',
    trigger_payment_webhook: '觸發金流通知', refund_payment: '退款', manual_payment: '手動記帳付款',
  }

  const label = labels[action] || action
  
  return NextResponse.json(
    {
      error: 'DEMO_MODE_BLOCKED',
      message: `🔒 Demo 模式：${label} 功能已停用`,
      detail: '此為公開展示環境，所有寫入操作（新增/編輯/刪除/發送/同步/金流）均被攔截。如需完整體驗，請部署正式環境。',
      action,
      method,
      demoMode: true,
    },
    { 
      status: 403,
      headers: {
        'X-Demo-Mode': 'true',
        'X-Demo-Blocked-Action': action,
      }
    }
  )
}

/**
 * Middleware 風格的 Demo Guard — 可在 API Route 頂部直接呼叫
 * 
 * @example
 * export async function POST(req: NextRequest) {
 *   const demoResponse = demoApiGuard(req)
 *   if (demoResponse) return demoResponse
 *   // 繼續實際邏輯...
 * }
 */
export const demoApiGuard = (req: NextRequest): NextResponse | null => {
  if (!isDemoMode()) return null
  
  const method = req.method
  if (!MUTATING_METHODS.includes(method as any)) return null // GET, HEAD, OPTIONS 放行
  
  const action = inferActionFromRequest(req)
  if (!action) return null // 無法推斷操作，放行 (由各 API 自行處理)
  
  // 特殊情況：某些 POST 其實是查詢 (如搜尋、匯出)
  const searchParams = req.nextUrl.searchParams
  if (method === 'POST' && (searchParams.has('search') || searchParams.has('export'))) {
    return null
  }
  
  return createDemoBlockedResponse(action, method)
}

/**
 * Higher-Order Function: 包裝 API Handler 自動加入 Demo Guard
 * 
 * @example
 * export const POST = withDemoApiGuard('create_race', async (req) => {
 *   const data = await req.json()
 *   return api.races.create(data)
 * })
 */
export const withDemoApiGuard = (
  action: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (isDemoMode() && MUTATING_METHODS.includes(req.method as any)) {
      return createDemoBlockedResponse(action, req.method)
    }
    return handler(req)
  }
}

/**
 * Server Actions 專用 Guard
 * 
 * @example
 * 'use server'
 * export async function createRaceAction(data: RaceFormData) {
 *   demoServerActionGuard('create_race')
 *   // 繼續...
 * }
 */
export const demoServerActionGuard = (action: string): void => {
  if (!isDemoMode()) return
  
  const labels: Record<string, string> = {
    create_race: '新增賽事', update_race: '編輯賽事', delete_race: '刪除賽事',
    create_registration: '新增報名', update_registration: '編輯報名', delete_registration: '刪除報名',
    create_transaction: '新增收支', update_transaction: '編輯收支', delete_transaction: '刪除收支',
    create_budget_plan: '新增預算', update_budget_plan: '編輯預算', delete_budget_plan: '刪除預算',
    create_sponsor: '新增贊助商', update_sponsor: '編輯贊助商', delete_sponsor: '刪除贊助商',
    create_schedule: '新增行程', update_schedule: '編輯行程', delete_schedule: '刪除行程',
    create_bot_command: '新增 Bot 指令', update_bot_command: '編輯 Bot 指令', delete_bot_command: '刪除 Bot 指令',
    send_bot_broadcast: '發送廣播',
    create_user: '新增使用者', update_user: '編輯使用者', delete_user: '刪除使用者',
    change_user_role: '變更角色', reset_user_password: '重設密碼',
    create_news: '新增公告', update_news: '編輯公告', delete_news: '刪除公告', publish_news: '發佈公告',
    checkin_runner: '簽到/領號碼布', assign_bib: '指派號碼布', print_qr_codes: '列印 QR Code',
    record_timing: '記錄計時', manual_timing_adjust: '手動調整計時',
    record_dnf: '記錄 DNF', record_dns: '記錄 DNS',
    update_aid_station: '編輯補給站', update_supply_quantity: '更新物資數量', create_supply: '新增物資',
    trigger_notion_sync: '觸發 Notion 同步', test_notion_connection: '測試 Notion 連線',
    send_email: '發送 Email', send_line: '發送 LINE', send_telegram: '發送 Telegram',
    trigger_payment_webhook: '觸發金流通知', refund_payment: '退款', manual_payment: '手動記帳付款',
  }

  const label = labels[action] || action
  
  throw new Error(
    `DEMO_MODE_BLOCKED: 🔒 Demo 模式：${label} 功能已停用。\n\n` +
    `此為公開展示環境，所有寫入操作均被攔截。如需完整體驗，請部署正式環境。`
  )
}

export default demoApiGuard