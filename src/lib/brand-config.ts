/**
 * RaceOne.ai Brand Configuration — CIS v2.0
 * "FIRST TO FINISH" — Technology, Precision, Reliability, Speed
 */

export const BRAND = {
  // ── Identity ──
  appName: 'RaceOne',
  appDomain: 'raceone.ai',
  appTitle: 'RaceOne Admin',
  appDescription: '賽事管理平台',
  slogan: 'FIRST TO FINISH',
  sloganCn: '率先完賽，零失誤，可複製',
  tagline: '從報名到完賽，AI 驅動的一站式賽事營運系統',
  appType: '管理平台',

  // ── Products ──
  products: {
    timing: { name: 'RaceOne Timing', color: '#0066FF', icon: '/logo-timing.svg' },
    crm: { name: 'RaceOne CRM', color: '#00D4AA', icon: '/logo-crm.svg' },
    analytics: { name: 'RaceOne Analytics', color: '#FF3B30', icon: '/logo-analytics.svg' },
  },

  // ── Logo Assets ──
  logoIcon: '/logo-icon.svg',       // Rounded square, dark bg with blue R (App Icon)
  logoFull: '/logo-full.svg',       // Speed lines + R + RaceOne.ai + FIRST TO FINISH (light)
  logoDark: '/logo-full-dark.svg',  // Same, for dark backgrounds (white text)
  favicon: '/favicon.svg',          // Circular, dark with blue R
  logoText: 'RaceOne',
  logoSuffix: '.ai',

  // ── Colors (CIS v2.0) ──
  colors: {
    primary: '#0066FF',       // Race Blue — 科技/信任/速度
    primaryDark: '#0052CC',
    primaryLight: '#4D94FF',
    secondary: '#00D4AA',     // Finish Green — 成功/完成/數據
    accent: '#FF3B30',        // Alert Red — 異常/即時/關鍵
    dark: '#0A0E17',          // Deep Space — 開發者模式
    light: '#F8FAFC',         // Clean White — 消費者模式
    white: '#FFFFFF',
    income: '#00D4AA',
    expense: '#FF3B30',
  },

  // ── Typography (CIS v2.0) ──
  fonts: {
    sans: '"Inter Variable", -apple-system, BlinkMacSystemFont, sans-serif',
    tc: '"Noto Sans TC", sans-serif',
    mono: '"JetBrains Mono", "Tabular Figures", monospace',
  },

  // ── Domain ──
  domain: process.env.NEXT_PUBLIC_APP_URL || 'https://www.raceone.ai',

  // ── Text ──
  footer: `© ${new Date().getFullYear()} RaceOne. 賽事管理平台`,
  copyright: `© ${new Date().getFullYear()} RaceOne`,
  loginTitle: '管理後台登入',
  loginSubtitle: '請輸入您的帳號密碼',
  metaDescription: 'RaceOne 賽事管理平台 — 從報名到完賽，一站式賽事營運系統',
  contactEmail: 'hello@raceone.ai',
} as const;

// ── Helpers ──

export function createMetadata(title: string, description?: string) {
  return {
    title: `${title} | ${BRAND.appName}`,
    description: description || BRAND.metaDescription,
  };
}

export function getFooterText(tenantName?: string): string {
  const year = new Date().getFullYear();
  if (tenantName) {
    return `© ${year} ${BRAND.appName}. ${tenantName}管理平台`;
  }
  return `© ${year} ${BRAND.appName}. 賽事管理平台`;
}

export function getProductLogo(product: keyof typeof BRAND.products) {
  return BRAND.products[product];
}