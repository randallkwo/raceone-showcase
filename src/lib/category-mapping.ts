/**
 * Category Mapping: Database (English) → UI Display (Chinese)
 * 
 * All database enum values are stored in English.
 * Use these maps to convert for display in the UI.
 */

// Transaction category mapping
export const TRANSACTION_CATEGORY_MAP: Record<string, string> = {
  // Income
  registration_fee: '報名費收入',
  sponsorship: '贊助收入',
  merchandise: '商品收入',
  donation: '捐款收入',
  // Expense
  venue_permit: '場地許可費用',
  timing_equipment: '計時設備費用',
  medical_insurance: '醫療保險費用',
  marketing_design: '行銷設計費用',
  merchandise_production: '商品生產費用',
  volunteer_catering: '志工餐飲費用',
  admin_misc: '行政雜項',
};

// Reverse map: Chinese → English (for backward compatibility)
export const REVERSE_CATEGORY_MAP: Record<string, string> = {};
Object.entries(TRANSACTION_CATEGORY_MAP).forEach(([en, zh]) => {
  REVERSE_CATEGORY_MAP[zh] = en;
});

// Get category type (income/expense) from category value
export function getCategoryType(category: string): 'income' | 'expense' {
  const incomeCategories = ['registration_fee', 'sponsorship', 'merchandise', 'donation'];
  const expenseCategories = ['venue_permit', 'timing_equipment', 'medical_insurance', 'marketing_design', 'merchandise_production', 'volunteer_catering', 'admin_misc'];
  
  if (incomeCategories.includes(category)) return 'income';
  if (expenseCategories.includes(category)) return 'expense';
  return 'expense'; // default
}

// Get display label for a category
export function getCategoryLabel(category: string): string {
  return TRANSACTION_CATEGORY_MAP[category] || category;
}

// Transaction type mapping
export const TRANSACTION_TYPE_MAP: Record<string, string> = {
  income: '收入',
  expense: '支出',
};

// Registration status mapping
export const REGISTRATION_STATUS_MAP: Record<string, string> = {
  pending: '待付款',
  confirmed: '已確認',
  cancelled: '已取消',
  waitlist: '候補',
  completed: '已完成',
};

// Schedule status mapping
export const SCHEDULE_STATUS_MAP: Record<string, string> = {
  planned: '規劃中',
  in_progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
  delayed: '延遲',
};

// Sponsor tier mapping
export const SPONSOR_TIER_MAP: Record<string, string> = {
  diamond: '鑽石級',
  platinum: '白金級',
  gold: '金級',
  silver: '銀級',
  bronze: '銅級',
  media: '媒體合作',
  in_kind: '實物贊助',
};

// User role mapping
export const USER_ROLE_MAP: Record<string, string> = {
  super_admin: '超級管理員',
  manager: '管理者',
  finance: '財務管理',
  content_editor: '內容編輯',
  volunteer_lead: '志工組長',
  sponsor_manager: '贊助商管理',
  viewer: '檢視者',
};

// Generic helper: translate any enum value
export function translate(value: string, map: Record<string, string>): string {
  return map[value] || value;
}

// List of all valid transaction categories for dropdowns
export const TRANSACTION_CATEGORIES = Object.keys(TRANSACTION_CATEGORY_MAP).map(key => ({
  value: key,
  label: TRANSACTION_CATEGORY_MAP[key],
  type: getCategoryType(key),
}));

// List of all valid transaction types for dropdowns
export const TRANSACTION_TYPES = Object.keys(TRANSACTION_TYPE_MAP).map(key => ({
  value: key,
  label: TRANSACTION_TYPE_MAP[key],
}));