/**
 * Demo Mode Guard — RaceOne 前端 Demo 模式攔截器
 * 
 * 用途：在 demo.raceone.ai 環境下，攔截所有寫入/敏感操作，
 * 僅允許讀取/瀏覽，並回傳友善提示訊息。
 * 
 * 啟用條件：NEXT_PUBLIC_DEMO_MODE=true (透過 .env.demo 設定)
 */

'use client'

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

/** Demo 模式下被攔截的操作類型 */
export type DemoBlockedAction = 
  // 賽事管理
  | 'create_race' | 'update_race' | 'delete_race' | 'duplicate_race'
  | 'create_category' | 'update_category' | 'delete_category'
  // 報名管理
  | 'create_registration' | 'update_registration' | 'delete_registration' | 'import_registrations'
  | 'update_registration_status' | 'manual_payment_confirm'
  // 財務管理 (完全唯讀)
  | 'create_transaction' | 'update_transaction' | 'delete_transaction'
  | 'create_budget_plan' | 'update_budget_plan' | 'delete_budget_plan'
  | 'create_budget_actual' | 'update_budget_actual' | 'delete_budget_actual'
  // 贊助商
  | 'create_sponsor' | 'update_sponsor' | 'delete_sponsor'
  // 行程
  | 'create_schedule' | 'update_schedule' | 'delete_schedule' | 'reorder_schedule'
  // Bot 管理 (完全唯讀)
  | 'create_bot_command' | 'update_bot_command' | 'delete_bot_command' | 'toggle_bot_command'
  | 'send_bot_broadcast' | 'test_bot_webhook'
  // 志工
  | 'create_volunteer_role' | 'update_volunteer_role' | 'delete_volunteer_role'
  | 'create_volunteer_shift' | 'update_volunteer_shift' | 'delete_volunteer_shift'
  | 'assign_volunteer' | 'unassign_volunteer'
  // 使用者管理
  | 'create_user' | 'update_user' | 'delete_user' | 'reset_user_password' | 'change_user_role'
  // 公告
  | 'create_news' | 'update_news' | 'delete_news' | 'publish_news' | 'pin_news'
  // 賽日營運
  | 'checkin_runner' | 'assign_bib' | 'bulk_assign_bibs' | 'print_qr_codes'
  | 'record_timing' | 'manual_timing_adjust' | 'record_dnf' | 'record_dns'
  | 'update_aid_station' | 'update_supply_quantity' | 'create_supply'
  // 整合
  | 'trigger_notion_sync' | 'test_notion_connection'
  | 'send_email' | 'send_line' | 'send_telegram'
  // 金流
  | 'trigger_payment_webhook' | 'refund_payment' | 'manual_payment'
  // 系統
  | 'run_migration' | 'clear_cache' | 'export_data' | 'import_data'

/** 操作中文說明對照表 */
const ACTION_LABELS: Record<DemoBlockedAction, string> = {
  create_race: '新增賽事', update_race: '編輯賽事', delete_race: '刪除賽事', duplicate_race: '複製賽事',
  create_category: '新增組別', update_category: '編輯組別', delete_category: '刪除組別',
  create_registration: '新增報名', update_registration: '編輯報名', delete_registration: '刪除報名',
  import_registrations: '匯入報名', update_registration_status: '變更報名狀態', manual_payment_confirm: '手動確認付款',
  create_transaction: '新增收支', update_transaction: '編輯收支', delete_transaction: '刪除收支',
  create_budget_plan: '新增預算項目', update_budget_plan: '編輯預算項目', delete_budget_plan: '刪除預算項目',
  create_budget_actual: '新增實際收支', update_budget_actual: '編輯實際收支', delete_budget_actual: '刪除實際收支',
  create_sponsor: '新增贊助商', update_sponsor: '編輯贊助商', delete_sponsor: '刪除贊助商',
  create_schedule: '新增行程', update_schedule: '編輯行程', delete_schedule: '刪除行程', reorder_schedule: '調整行程順序',
  create_bot_command: '新增 Bot 指令', update_bot_command: '編輯 Bot 指令', delete_bot_command: '刪除 Bot 指令',
  toggle_bot_command: '啟用/停用指令', send_bot_broadcast: '發送廣播', test_bot_webhook: '測試 Webhook',
  create_volunteer_role: '新增志工角色', update_volunteer_role: '編輯志工角色', delete_volunteer_role: '刪除志工角色',
  create_volunteer_shift: '新增志工班次', update_volunteer_shift: '編輯志工班次', delete_volunteer_shift: '刪除志工班次',
  assign_volunteer: '指派志工', unassign_volunteer: '取消指派',
  create_user: '新增使用者', update_user: '編輯使用者', delete_user: '刪除使用者',
  reset_user_password: '重設密碼', change_user_role: '變更角色',
  create_news: '新增公告', update_news: '編輯公告', delete_news: '刪除公告', publish_news: '發佈公告', pin_news: '置頂公告',
  checkin_runner: '簽到/領號碼布', assign_bib: '指派號碼布', bulk_assign_bibs: '批次指派號碼布', print_qr_codes: '列印 QR Code',
  record_timing: '記錄計時', manual_timing_adjust: '手動調整計時', record_dnf: '記錄 DNF', record_dns: '記錄 DNS',
  update_aid_station: '編輯補給站', update_supply_quantity: '更新物資數量', create_supply: '新增物資',
  trigger_notion_sync: '觸發 Notion 同步', test_notion_connection: '測試 Notion 連線',
  send_email: '發送 Email', send_line: '發送 LINE', send_telegram: '發送 Telegram',
  trigger_payment_webhook: '觸發金流通知', refund_payment: '退款', manual_payment: '手動記帳付款',
  run_migration: '執行遷移', clear_cache: '清除快取', export_data: '匯出資料', import_data: '匯入資料',
}

/** Demo 模式攔截結果 */
export interface DemoGuardResult {
  blocked: boolean
  message?: string
  action?: DemoBlockedAction
}

/**
 * 核心攔截函數 — 在任何寫入操作前呼叫
 * 
 * @param action 被嘗試的操作代碼
 * @returns { blocked: true, message } 若被攔截；{ blocked: false } 若允許通過
 * 
 * @example
 * const guard = demoGuard('create_race')
 * if (guard.blocked) { toast.error(guard.message); return }
 * // 繼續執行實際邏輯
 */
export const demoGuard = (action: DemoBlockedAction): DemoGuardResult => {
  if (!isDemoMode()) {
    return { blocked: false }
  }

  const label = ACTION_LABELS[action] || action
  return {
    blocked: true,
    message: `🔒 Demo 模式：${label} 功能已停用\n\n此為公開展示環境，所有寫入操作（新增/編輯/刪除/發送/同步）均被攔截。\n\n如需完整體驗，請部署正式環境或聯繫 admin@raceone.ai。`,
    action,
  }
}

/**
 * 批次檢查多個操作 — 適合在表單提交前一次檢查
 */
export const demoGuardBatch = (actions: DemoBlockedAction[]): DemoGuardResult[] => {
  return actions.map(demoGuard).filter(r => r.blocked)
}

/**
 * React Hook 版本 — 方便在元件中使用
 */
export const useDemoGuard = () => {
  const check = (action: DemoBlockedAction) => demoGuard(action)
  const checkBatch = (actions: DemoBlockedAction[]) => demoGuardBatch(actions)
  const mode = isDemoMode()
  
  return { check, checkBatch, mode }
}

/**
 * 高階函數：包裝 async 函數自動加入 demo guard
 * 
 * @example
 * const handleSave = withDemoGuard('update_race', async (data) => {
 *   await api.races.update(id, data)
 *   toast.success('已儲存')
 * })
 */
export const withDemoGuard = <T extends (...args: any[]) => Promise<any>>(
  action: DemoBlockedAction,
  fn: T
): T => {
  return (async (...args: Parameters<T>) => {
    const guard = demoGuard(action)
    if (guard.blocked) {
      // 拋出可被錯誤邊界捕獲的錯誤，或直接返回
      throw new Error(guard.message)
    }
    return fn(...args)
  }) as T
}

/**
 * 讀取操作白名單 — 這些操作在 Demo 模式下永遠允許
 */
export const DEMO_ALLOWED_READ_ACTIONS = [
  'view_dashboard', 'view_races', 'view_race_detail', 'view_registrations',
  'view_transactions', 'view_budget', 'view_sponsors', 'view_schedule',
  'view_bot', 'view_volunteers', 'view_users', 'view_news', 'view_news_detail',
  'view_checkin', 'view_timing', 'view_dnf_dns', 'view_reports', 'view_notion',
  'view_my_registrations', 'view_my_results', 'view_my_profile',
  'view_events', 'view_event_detail', 'view_results',
] as const

export type DemoAllowedReadAction = typeof DEMO_ALLOWED_READ_ACTIONS[number]

/** 檢查是否為允許的讀取操作 */
export const isDemoAllowedRead = (action: string): boolean => {
  if (!isDemoMode()) return true
  return DEMO_ALLOWED_READ_ACTIONS.includes(action as DemoAllowedReadAction)
}

export default demoGuard