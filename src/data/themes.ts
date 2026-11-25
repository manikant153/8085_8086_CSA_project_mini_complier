export type ThemeId =
  | 'silicon-dark'
  | 'phosphor-crt'
  | 'cleanroom-light'
  | 'wafer-gold'
  | 'custom';

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  bgApp: string;
  bgPanel: string;
  bgPanelAlt: string;
  bgElevated: string;
  bgInput: string;
  bgSvg: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  accentGlow: string;
  secondary: string;
  secondarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  synOpcode: string;
  synDirective: string;
  synRegister: string;
  synLiteral: string;
  synLabel: string;
  synComment: string;
  svgBlockBg: string;
  svgBlockStroke: string;
  svgBusBg: string;
  svgBusStroke: string;
  svgAddrBus: string;
  svgDataBus: string;
}

export interface AppTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
}

const APPLE_CLEANROOM_TOKENS: ThemeTokens = {
  bgApp: '#f5f5f7',
  bgPanel: '#ffffff',
  bgPanelAlt: '#f5f5f7',
  bgElevated: '#ececf0',
  bgInput: '#ffffff',
  bgSvg: '#f9f9fb',
  borderSubtle: '#e2e2e7',
  borderStrong: '#d1d1d6',
  textPrimary: '#1d1d1f',
  textSecondary: '#3a3a3c',
  textMuted: '#6e6e73',
  accent: '#0071e3',
  accentSoft: 'rgba(0, 113, 227, 0.12)',
  accentText: '#005bb5',
  accentGlow: 'rgba(0, 113, 227, 0.18)',
  secondary: '#e05a33',
  secondarySoft: 'rgba(224, 90, 51, 0.12)',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  warning: '#d97706',
  warningSoft: 'rgba(217, 119, 6, 0.14)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  synOpcode: '#0071e3',
  synDirective: '#7c3aed',
  synRegister: '#b45309',
  synLiteral: '#059669',
  synLabel: '#db2777',
  synComment: '#86868b',
  svgBlockBg: '#ffffff',
  svgBlockStroke: '#d1d1d6',
  svgBusBg: '#ececf0',
  svgBusStroke: '#c7c7cc',
  svgAddrBus: '#e05a33',
  svgDataBus: '#0071e3',
};

const APPLE_THEME_BASE = {
  name: 'Studio Light',
  tagline: 'Clean Apple-inspired engineering workspace',
  mode: 'light' as ThemeMode,
  tokens: APPLE_CLEANROOM_TOKENS,
};

export const PRESET_THEMES: Record<Exclude<ThemeId, 'custom'>, AppTheme> = {
  'silicon-dark': { id: 'silicon-dark', ...APPLE_THEME_BASE },
  'phosphor-crt': { id: 'phosphor-crt', ...APPLE_THEME_BASE },
  'cleanroom-light': { id: 'cleanroom-light', ...APPLE_THEME_BASE },
  'wafer-gold': { id: 'wafer-gold', ...APPLE_THEME_BASE },
};

export function generateThemeFromAccent(
  _accentInput: string,
  _mode: ThemeMode,
  name = 'Studio Light'
): AppTheme {
  return {
    id: 'cleanroom-light',
    name,
    tagline: 'Clean Apple-inspired engineering workspace',
    mode: 'light',
    tokens: APPLE_CLEANROOM_TOKENS,
  };
}

const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  bgApp: '--ss-bg-app',
  bgPanel: '--ss-bg-panel',
  bgPanelAlt: '--ss-bg-panel-alt',
  bgElevated: '--ss-bg-elevated',
  bgInput: '--ss-bg-input',
  bgSvg: '--ss-bg-svg',
  borderSubtle: '--ss-border-subtle',
  borderStrong: '--ss-border-strong',
  textPrimary: '--ss-text-primary',
  textSecondary: '--ss-text-secondary',
  textMuted: '--ss-text-muted',
  accent: '--ss-accent',
  accentSoft: '--ss-accent-soft',
  accentText: '--ss-accent-text',
  accentGlow: '--ss-accent-glow',
  secondary: '--ss-secondary',
  secondarySoft: '--ss-secondary-soft',
  success: '--ss-success',
  successSoft: '--ss-success-soft',
  warning: '--ss-warning',
  warningSoft: '--ss-warning-soft',
  danger: '--ss-danger',
  dangerSoft: '--ss-danger-soft',
  synOpcode: '--ss-syn-opcode',
  synDirective: '--ss-syn-directive',
  synRegister: '--ss-syn-register',
  synLiteral: '--ss-syn-literal',
  synLabel: '--ss-syn-label',
  synComment: '--ss-syn-comment',
  svgBlockBg: '--ss-svg-block-bg',
  svgBlockStroke: '--ss-svg-block-stroke',
  svgBusBg: '--ss-svg-bus-bg',
  svgBusStroke: '--ss-svg-bus-stroke',
  svgAddrBus: '--ss-svg-addr-bus',
  svgDataBus: '--ss-svg-data-bus',
};

export function applyThemeToDocument(_theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', 'cleanroom-light');
  root.setAttribute('data-theme-mode', 'light');
  root.style.colorScheme = 'light';
  (Object.keys(TOKEN_TO_CSS_VAR) as (keyof ThemeTokens)[]).forEach((key) => {
    root.style.setProperty(TOKEN_TO_CSS_VAR[key], APPLE_CLEANROOM_TOKENS[key]);
  });
}