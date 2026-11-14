export interface Theme {
  id: string;
  label: string;
  /** page background (CSS) */
  bg: string;
  /** score panel */
  panelBg: string;
  panelBorder: string;
  /** button colors */
  button: string;
  buttonLit: string;
  buttonGlow: string;
  text: string;
  accent: string;
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    label: 'Classic Blue',
    bg: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)',
    panelBg: 'rgba(255,255,255,0.12)',
    panelBorder: 'rgba(255,255,255,0.25)',
    button: 'radial-gradient(circle at 35% 30%, #93c5fd, #2563eb 65%, #1d4ed8)',
    buttonLit: 'radial-gradient(circle at 35% 30%, #fef9c3, #facc15 60%, #eab308)',
    buttonGlow: '0 0 40px 12px rgba(250,204,21,0.8)',
    text: '#ffffff',
    accent: '#facc15',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    bg: 'linear-gradient(160deg, #042f2e 0%, #0f766e 55%, #2dd4bf 100%)',
    panelBg: 'rgba(255,255,255,0.10)',
    panelBorder: 'rgba(255,255,255,0.22)',
    button: 'radial-gradient(circle at 35% 30%, #99f6e4, #0d9488 65%, #115e59)',
    buttonLit: 'radial-gradient(circle at 35% 30%, #ffffff, #67e8f9 60%, #06b6d4)',
    buttonGlow: '0 0 40px 12px rgba(103,232,249,0.8)',
    text: '#ecfeff',
    accent: '#67e8f9',
  },
  {
    id: 'candy',
    label: 'Candy',
    bg: 'linear-gradient(160deg, #831843 0%, #db2777 55%, #f9a8d4 100%)',
    panelBg: 'rgba(255,255,255,0.12)',
    panelBorder: 'rgba(255,255,255,0.25)',
    button: 'radial-gradient(circle at 35% 30%, #fbcfe8, #ec4899 65%, #be185d)',
    buttonLit: 'radial-gradient(circle at 35% 30%, #ffffff, #a5f3fc 60%, #22d3ee)',
    buttonGlow: '0 0 40px 12px rgba(165,243,252,0.85)',
    text: '#fff1f2',
    accent: '#a5f3fc',
  },
  {
    id: 'forest',
    label: 'Forest',
    bg: 'linear-gradient(160deg, #14532d 0%, #16a34a 55%, #86efac 100%)',
    panelBg: 'rgba(0,0,0,0.15)',
    panelBorder: 'rgba(255,255,255,0.22)',
    button: 'radial-gradient(circle at 35% 30%, #bbf7d0, #22c55e 65%, #15803d)',
    buttonLit: 'radial-gradient(circle at 35% 30%, #fff7ed, #fb923c 60%, #ea580c)',
    buttonGlow: '0 0 40px 12px rgba(251,146,60,0.85)',
    text: '#f0fdf4',
    accent: '#fdba74',
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
