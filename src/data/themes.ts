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

export const PRESET_THEMES: Record<Exclude<ThemeId, 'custom'>, AppTheme> = {
  'silicon-dark': {
    id: 'silicon-dark',
    name: 'Silicon Dark',
    tagline: 'Deep obsidian wafer with cyan bus telemetry',
    mode: 'dark',
    tokens: {
      bgApp: '#05080f',
      bgPanel: 'rgba(2, 6, 23, 0.88)',
      bgPanelAlt: 'rgba(15, 23, 42, 0.72)',
      bgElevated: '#0f172a',
      bgInput: '#0f172a',
      bgSvg: '#070b14',
      borderSubtle: 'rgba(30, 41, 59, 0.9)',
      borderStrong: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      accent: '#22d3ee',
      accentSoft: 'rgba(34, 211, 238, 0.16)',
      accentText: '#a5f3fc',
      accentGlow: 'rgba(34, 211, 238, 0.25)',
      secondary: '#c084fc',
      secondarySoft: 'rgba(192, 132, 252, 0.16)',
      success: '#34d399',
      successSoft: 'rgba(52, 211, 153, 0.16)',
      warning: '#fbbf24',
      warningSoft: 'rgba(251, 191, 36, 0.18)',
      danger: '#fb7185',
      dangerSoft: 'rgba(251, 113, 133, 0.18)',
      synOpcode: '#22d3ee',
      synDirective: '#c084fc',
      synRegister: '#fcd34d',
      synLiteral: '#34d399',
      synLabel: '#f472b6',
      synComment: '#64748b',
      svgBlockBg: 'rgba(15, 23, 42, 0.92)',
      svgBlockStroke: '#1e293b',
      svgBusBg: 'rgba(30, 41, 59, 0.65)',
      svgBusStroke: '#334155',
      svgAddrBus: '#fbbf24',
      svgDataBus: '#22d3ee',
    },
  },
  'phosphor-crt': {
    id: 'phosphor-crt',
    name: 'Phosphor CRT',
    tagline: 'Retro P31 green & amber mainframe terminal',
    mode: 'dark',
    tokens: {
      bgApp: '#030a05',
      bgPanel: 'rgba(5, 16, 8, 0.92)',
      bgPanelAlt: 'rgba(9, 27, 14, 0.78)',
      bgElevated: '#0a1f10',
      bgInput: '#091b0e',
      bgSvg: '#040d07',
      borderSubtle: 'rgba(22, 101, 52, 0.5)',
      borderStrong: '#166534',
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4ade80',
      accent: '#22c55e',
      accentSoft: 'rgba(34, 197, 94, 0.18)',
      accentText: '#bbf7d0',
      accentGlow: 'rgba(34, 197, 94, 0.3)',
      secondary: '#f59e0b',
      secondarySoft: 'rgba(245, 158, 11, 0.18)',
      success: '#4ade80',
      successSoft: 'rgba(74, 222, 128, 0.16)',
      warning: '#fbbf24',
      warningSoft: 'rgba(251, 191, 36, 0.18)',
      danger: '#f87171',
      dangerSoft: 'rgba(248, 113, 113, 0.18)',
      synOpcode: '#4ade80',
      synDirective: '#fbbf24',
      synRegister: '#a3e635',
      synLiteral: '#2dd4bf',
      synLabel: '#fde047',
      synComment: '#228b4e',
      svgBlockBg: 'rgba(8, 28, 14, 0.94)',
      svgBlockStroke: '#14532d',
      svgBusBg: 'rgba(20, 83, 45, 0.45)',
      svgBusStroke: '#166534',
      svgAddrBus: '#fbbf24',
      svgDataBus: '#22c55e',
    },
  },
  'cleanroom-light': {
    id: 'cleanroom-light',
    name: 'Cleanroom Light',
    tagline: 'Crisp lab paper for classrooms & projectors',
    mode: 'light',
    tokens: {
      bgApp: '#f1f5f9',
      bgPanel: '#ffffff',
      bgPanelAlt: '#f8fafc',
      bgElevated: '#e2e8f0',
      bgInput: '#ffffff',
      bgSvg: '#f8fafc',
      borderSubtle: '#cbd5e1',
      borderStrong: '#94a3b8',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      accent: '#0284c7',
      accentSoft: 'rgba(2, 132, 199, 0.12)',
      accentText: '#0369a1',
      accentGlow: 'rgba(2, 132, 199, 0.2)',
      secondary: '#7c3aed',
      secondarySoft: 'rgba(124, 58, 237, 0.12)',
      success: '#059669',
      successSoft: 'rgba(5, 150, 105, 0.12)',
      warning: '#d97706',
      warningSoft: 'rgba(217, 119, 6, 0.14)',
      danger: '#e11d48',
      dangerSoft: 'rgba(225, 29, 72, 0.12)',
      synOpcode: '#0284c7',
      synDirective: '#7c3aed',
      synRegister: '#b45309',
      synLiteral: '#059669',
      synLabel: '#db2777',
      synComment: '#64748b',
      svgBlockBg: '#ffffff',
      svgBlockStroke: '#cbd5e1',
      svgBusBg: '#e2e8f0',
      svgBusStroke: '#94a3b8',
      svgAddrBus: '#d97706',
      svgDataBus: '#0284c7',
    },
  },
  'wafer-gold': {
    id: 'wafer-gold',
    name: 'Wafer Gold',
    tagline: 'Die-bond gold & copper traces on matte carbon',
    mode: 'dark',
    tokens: {
      bgApp: '#090705',
      bgPanel: 'rgba(20, 16, 12, 0.9)',
      bgPanelAlt: 'rgba(34, 26, 19, 0.74)',
      bgElevated: '#261d15',
      bgInput: '#1c150f',
      bgSvg: '#0d0a07',
      borderSubtle: 'rgba(120, 83, 42, 0.45)',
      borderStrong: '#78532a',
      textPrimary: '#fef3c7',
      textSecondary: '#e7d5b8',
      textMuted: '#a89074',
      accent: '#f59e0b',
      accentSoft: 'rgba(245, 158, 11, 0.18)',
      accentText: '#fde68a',
      accentGlow: 'rgba(245, 158, 11, 0.28)',
      secondary: '#fb7185',
      secondarySoft: 'rgba(251, 113, 133, 0.16)',
      success: '#34d399',
      successSoft: 'rgba(52, 211, 153, 0.16)',
      warning: '#fbbf24',
      warningSoft: 'rgba(251, 191, 36, 0.18)',
      danger: '#f43f5e',
      dangerSoft: 'rgba(244, 63, 94, 0.18)',
      synOpcode: '#fbbf24',
      synDirective: '#fb7185',
      synRegister: '#38bdf8',
      synLiteral: '#34d399',
      synLabel: '#f472b6',
      synComment: '#8b7355',
      svgBlockBg: 'rgba(28, 21, 15, 0.94)',
      svgBlockStroke: '#523920',
      svgBusBg: 'rgba(82, 57, 32, 0.4)',
      svgBusStroke: '#78532a',
      svgAddrBus: '#fb7185',
      svgDataBus: '#f59e0b',
    },
  },
};

function normalizeHex(hex: string): string {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return (
      '#' +
      clean
        .split('')
        .map((c) => c + c)
        .join('')
        .toLowerCase()
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return '#' + clean.toLowerCase();
  }
  return '#22d3ee';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.slice(0, 2), 16) / 255;
  const g = parseInt(norm.slice(2, 4), 16) / 255;
  const b = parseInt(norm.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateThemeFromAccent(
  accentInput: string,
  mode: ThemeMode,
  name = 'Custom Generated'
): AppTheme {
  const baseHex = normalizeHex(accentInput);
  const { h, s } = hexToHsl(baseHex);
  const sat = Math.max(45, s);

  const accent = mode === 'dark' ? hslToHex(h, sat, 60) : hslToHex(h, Math.min(90, sat), 40);
  const accentText = mode === 'dark' ? hslToHex(h, sat, 82) : hslToHex(h, sat, 30);
  const secondary = mode === 'dark' ? hslToHex(h + 135, 75, 68) : hslToHex(h + 135, 70, 46);
  const success = mode === 'dark' ? '#34d399' : '#059669';
  const warning = mode === 'dark' ? '#fbbf24' : '#d97706';
  const danger = mode === 'dark' ? '#fb7185' : '#e11d48';

  if (mode === 'light') {
    return {
      id: 'custom',
      name,
      tagline: `Generated light palette (${baseHex.toUpperCase()})`,
      mode: 'light',
      tokens: {
        bgApp: hslToHex(h, 18, 95),
        bgPanel: '#ffffff',
        bgPanelAlt: hslToHex(h, 20, 97),
        bgElevated: hslToHex(h, 16, 90),
        bgInput: '#ffffff',
        bgSvg: hslToHex(h, 22, 97),
        borderSubtle: hslToHex(h, 16, 84),
        borderStrong: hslToHex(h, 18, 70),
        textPrimary: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        accent,
        accentSoft: hexToRgba(accent, 0.13),
        accentText,
        accentGlow: hexToRgba(accent, 0.22),
        secondary,
        secondarySoft: hexToRgba(secondary, 0.13),
        success,
        successSoft: hexToRgba(success, 0.13),
        warning,
        warningSoft: hexToRgba(warning, 0.14),
        danger,
        dangerSoft: hexToRgba(danger, 0.13),
        synOpcode: accent,
        synDirective: secondary,
        synRegister: '#b45309',
        synLiteral: '#059669',
        synLabel: hslToHex(h + 210, 72, 46),
        synComment: '#64748b',
        svgBlockBg: '#ffffff',
        svgBlockStroke: hslToHex(h, 18, 82),
        svgBusBg: hslToHex(h, 16, 89),
        svgBusStroke: hslToHex(h, 18, 72),
        svgAddrBus: warning,
        svgDataBus: accent,
      },
    };
  }

  return {
    id: 'custom',
    name,
    tagline: `Generated dark palette (${baseHex.toUpperCase()})`,
    mode: 'dark',
    tokens: {
      bgApp: hslToHex(h, 35, 4),
      bgPanel: hexToRgba(hslToHex(h, 32, 8), 0.9),
      bgPanelAlt: hexToRgba(hslToHex(h, 28, 13), 0.76),
      bgElevated: hslToHex(h, 28, 14),
      bgInput: hslToHex(h, 28, 12),
      bgSvg: hslToHex(h, 34, 5),
      borderSubtle: hexToRgba(hslToHex(h, 24, 28), 0.75),
      borderStrong: hslToHex(h, 24, 34),
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: hslToHex(h, 15, 54),
      accent,
      accentSoft: hexToRgba(accent, 0.18),
      accentText,
      accentGlow: hexToRgba(accent, 0.28),
      secondary,
      secondarySoft: hexToRgba(secondary, 0.16),
      success,
      successSoft: hexToRgba(success, 0.16),
      warning,
      warningSoft: hexToRgba(warning, 0.18),
      danger,
      dangerSoft: hexToRgba(danger, 0.18),
      synOpcode: accent,
      synDirective: secondary,
      synRegister: '#fcd34d',
      synLiteral: '#34d399',
      synLabel: hslToHex(h + 220, 80, 72),
      synComment: hslToHex(h, 14, 48),
      svgBlockBg: hexToRgba(hslToHex(h, 28, 11), 0.94),
      svgBlockStroke: hslToHex(h, 24, 22),
      svgBusBg: hexToRgba(hslToHex(h, 24, 22), 0.65),
      svgBusStroke: hslToHex(h, 24, 32),
      svgAddrBus: warning,
      svgDataBus: accent,
    },
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

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.mode);
  root.style.colorScheme = theme.mode;
  (Object.keys(TOKEN_TO_CSS_VAR) as (keyof ThemeTokens)[]).forEach((key) => {
    root.style.setProperty(TOKEN_TO_CSS_VAR[key], theme.tokens[key]);
  });
}