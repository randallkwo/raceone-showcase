// Role-based access control helpers
// 與 Supabase RLS policies 保持一致

export type UserRole = 'super_admin' | 'manager' | 'finance' | 'content_editor' | 'volunteer_lead' | 'sponsor_manager' | 'viewer';

// ---- 頁面/路徑層級權限矩陣（與 middleware.ts roleAllowed 一致，單一來源）----
// 每個後台路徑對應可訪問的角色；此表同時供 UI(快速操作/隱藏邏輯) 與 middleware 參考。
export const PATH_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ['super_admin', 'manager', 'finance', 'content_editor', 'volunteer_lead', 'sponsor_manager'],
  '/races': ['super_admin', 'manager', 'content_editor', 'volunteer_lead', 'sponsor_manager'],
  '/registrations': ['super_admin', 'manager', 'content_editor'],
  '/transactions': ['super_admin', 'manager', 'finance'],
  '/budget': ['super_admin', 'manager', 'finance'],
  '/sponsors': ['super_admin', 'manager', 'sponsor_manager'],
  '/schedule': ['super_admin', 'manager', 'content_editor', 'volunteer_lead'],
  '/volunteers': ['super_admin', 'manager', 'volunteer_lead'],
  '/news': ['super_admin', 'manager', 'content_editor'],
  '/reports': ['super_admin', 'manager', 'finance', 'content_editor', 'volunteer_lead', 'sponsor_manager'],
  '/users': ['super_admin'],
  '/bot': ['super_admin', 'manager'],
  '/my': ['super_admin', 'manager', 'finance', 'content_editor', 'volunteer_lead', 'sponsor_manager', 'viewer'],
};

// 管理後台角色（可存取一般管理功能）
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'manager', 'finance', 'content_editor', 'volunteer_lead', 'sponsor_manager'];

// 財務角色（transactions / budget / bot / notion）
export const FINANCE_ROLES: UserRole[] = ['super_admin', 'manager', 'finance'];

// 公告角色
export const NEWS_ROLES: UserRole[] = ['super_admin', 'manager', 'content_editor', 'finance'];

// 志工角色
export const VOLUNTEER_ROLES: UserRole[] = ['super_admin', 'manager', 'volunteer_lead'];

// 贊助商角色
export const SPONSOR_ROLES: UserRole[] = ['super_admin', 'manager', 'sponsor_manager', 'finance'];

// 行程角色
export const SCHEDULE_ROLES: UserRole[] = ['super_admin', 'manager', 'volunteer_lead', 'content_editor', 'finance'];

// 使用者管理角色 - 僅超級管理員
export const USER_MGMT_ROLES: UserRole[] = ['super_admin'];

// 管理者角色 (所有業務功能，但無使用者管理)
export const MANAGER_ROLES: UserRole[] = ['super_admin', 'manager'];

export function hasRole(role: string | null | undefined, allowed: UserRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role as UserRole);
}

export function canViewFinance(role: string | null | undefined): boolean {
  return hasRole(role, FINANCE_ROLES);
}

export function canManageNews(role: string | null | undefined): boolean {
  return hasRole(role, NEWS_ROLES);
}

export function canManageVolunteers(role: string | null | undefined): boolean {
  return hasRole(role, VOLUNTEER_ROLES);
}

export function canManageSponsors(role: string | null | undefined): boolean {
  return hasRole(role, SPONSOR_ROLES);
}

export function canManageSchedule(role: string | null | undefined): boolean {
  return hasRole(role, SCHEDULE_ROLES);
}

export function canManageUsers(role: string | null | undefined): boolean {
  return hasRole(role, USER_MGMT_ROLES);
}

export function canManageRaces(role: string | null | undefined): boolean {
  // race WRITE 權限：所有 admin 角色包含 manager
  return hasRole(role, ADMIN_ROLES);
}

export function canManageBot(role: string | null | undefined): boolean {
  return hasRole(role, MANAGER_ROLES);
}

export function isAdmin(role: string | null | undefined): boolean {
  return hasRole(role, ADMIN_ROLES);
}

// 角色中文標籤
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超級管理員',
  manager: '管理者',
  finance: '財務稽核',
  content_editor: '內容編輯',
  volunteer_lead: '志工領隊',
  sponsor_manager: '贊助商管理',
  viewer: '唯閱者',
};