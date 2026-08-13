import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
    // Registration status
    pending: { label: '待審核', variant: 'warning' },
    confirmed: { label: '已確認', variant: 'success' },
    cancelled: { label: '已取消', variant: 'destructive' },
    waitlist: { label: '備取', variant: 'outline' },
    completed: { label: '完賽', variant: 'default' },

    // Event status
    draft: { label: '草稿', variant: 'outline' },
    published: { label: '已發布', variant: 'default' },
    registration_open: { label: '開放報名', variant: 'success' },
    ongoing: { label: '進行中', variant: 'default' },

    // Transaction type
    income: { label: '收入', variant: 'success' },
    expense: { label: '支出', variant: 'destructive' },

    // News status
    scheduled: { label: '排程中', variant: 'warning' },
    archived: { label: '已封存', variant: 'outline' },

    // Schedule status
    in_progress: { label: '進行中', variant: 'default' },
    delayed: { label: '延遲', variant: 'destructive' },

    // Sponsor status
    negotiating: { label: '洽談中', variant: 'warning' },
    fulfilled: { label: '已履約', variant: 'success' },
  };

  return configs[status] || { label: status, variant: 'default' };
}

/**
 * 報名狀態機：定義合法轉換。
 * 狀態流：pending → confirmed → completed；waitlist 可遞補為 confirmed；
 * pending/waitlist/confirmed 可取消；cancelled/completed 為終態不可再轉。
 */
export const REGISTRATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'waitlist', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  waitlist: ['confirmed', 'cancelled'],
  cancelled: [],      // 終態
  completed: [],      // 終態
};

/** 回傳某狀態可合法轉換的目標狀態清單（不含自身）；未知狀態回傳所有狀態 */
export function getAllowedRegistrationTransitions(current: string): string[] {
  if (REGISTRATION_STATUS_TRANSITIONS[current]) {
    return REGISTRATION_STATUS_TRANSITIONS[current];
  }
  return ['pending', 'confirmed', 'cancelled', 'waitlist', 'completed'];
}

/** 檢查轉換是否合法 */
export function isRegistrationTransitionAllowed(current: string, next: string): boolean {
  if (current === next) return true; // 相同視為合法（無操作）
  const allowed = REGISTRATION_STATUS_TRANSITIONS[current];
  return Array.isArray(allowed) && allowed.includes(next);
}

export function getRoleConfig(role: string) {
  const configs: Record<string, { label: string; description: string; color: string }> = {
    super_admin: { label: '超級管理員', description: '平台最高權限', color: 'text-purple-600' },
    manager: { label: '管理者', description: '所有業務功能，無使用者管理權限', color: 'text-blue-600' },
    finance: { label: '財務管理員', description: '收支管理、報表', color: 'text-green-600' },
    content_editor: { label: '內容編輯', description: '公告、新聞、賽事資訊', color: 'text-blue-600' },
    volunteer_lead: { label: '志工長', description: '行程、志工協調', color: 'text-orange-600' },
    sponsor_manager: { label: '贊助商管理', description: '贊助商、權益、曝光', color: 'text-pink-600' },
    viewer: { label: '檢視者', description: '唯讀權限', color: 'text-gray-600' },
  };

  return configs[role] || { label: role, description: '', color: 'text-gray-600' };
}