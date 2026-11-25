export type LandingPaletteId = 'apple-cleanroom' | 'pcb-emerald' | 'royal-violet' | 'wafer-gold';

export interface LandingPalette {
  id: LandingPaletteId;
  label: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  accentText: string;
  gridLine: string;
  glowA: string;
  glowB: string;
}

export const LANDING_PALETTES: Record<LandingPaletteId, LandingPalette> = {
  'apple-cleanroom': {
    id: 'apple-cleanroom',
    label: 'Studio Light',
    bg: '#f5f5f7',
    surface: '#ffffff',
    surfaceAlt: '#f0f0f3',
    border: '#e2e2e7',
    text: '#1d1d1f',
    muted: '#6e6e73',
    accent: '#0071e3',
    accentSecondary: '#e05a33',
    accentText: '#ffffff',
    gridLine: 'rgba(0, 0, 0, 0.03)',
    glowA: 'rgba(0, 113, 227, 0.08)',
    glowB: 'rgba(224, 90, 51, 0.08)',
  },
  'pcb-emerald': {
    id: 'pcb-emerald',
    label: 'PCB Emerald',
    bg: '#050a08',
    surface: '#0b1411',
    surfaceAlt: '#070f0c',
    border: '#173026',
    text: '#ecfdf5',
    muted: '#94b8aa',
    accent: '#10b981',
    accentSecondary: '#f59e0b',
    accentText: '#03150e',
    gridLine: 'rgba(16, 185, 129, 0.05)',
    glowA: 'rgba(16, 185, 129, 0.16)',
    glowB: 'rgba(245, 158, 11, 0.10)',
  },
  'royal-violet': {
    id: 'royal-violet',
    label: 'Royal Violet',
    bg: '#090712',
    surface: '#130f24',
    surfaceAlt: '#0d0a1a',
    border: '#2a214a',
    text: '#f5f3ff',
    muted: '#b4a9d6',
    accent: '#a855f7',
    accentSecondary: '#ec4899',
    accentText: '#140621',
    gridLine: 'rgba(168, 85, 247, 0.05)',
    glowA: 'rgba(168, 85, 247, 0.17)',
    glowB: 'rgba(236, 72, 153, 0.10)',
  },
  'wafer-gold': {
    id: 'wafer-gold',
    label: 'Wafer Gold',
    bg: '#0b0905',
    surface: '#161209',
    surfaceAlt: '#0f0c06',
    border: '#362b14',
    text: '#fefce8',
    muted: '#c7b88e',
    accent: '#f59e0b',
    accentSecondary: '#fb7185',
    accentText: '#1c1102',
    gridLine: 'rgba(245, 158, 11, 0.05)',
    glowA: 'rgba(245, 158, 11, 0.16)',
    glowB: 'rgba(251, 113, 133, 0.09)',
  },
};

const STORAGE_KEY = 'silicon_landing_palette_v2';

export function getSavedLandingPalette(): LandingPaletteId {
  try {
    const val = localStorage.getItem(STORAGE_KEY) as LandingPaletteId | null;
    if (val && val in LANDING_PALETTES) return val;
  } catch {
    // ignore storage errors
  }
  return 'apple-cleanroom';
}

export function saveLandingPalette(id: LandingPaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore storage errors
  }
}