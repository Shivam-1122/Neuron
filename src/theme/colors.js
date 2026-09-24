// Neuron Sanctuary Warm Amber & Dark Charcoal Theme
// 100% matched to the Web Application Cognitive Sanctuary design system

export const Colors = {
  // Backgrounds - Dark Charcoal Slate matching web #111318
  background: '#111318',
  card: '#181a20',
  surface: '#16181f',
  surfaceElevated: '#1f222a',
  surfaceHighlight: '#262933',
  modalOverlay: 'rgba(17, 19, 24, 0.94)',

  // Primary Sanctuary Colors - Warm Golden Amber
  primary: '#f59e0b',
  primaryLight: '#fbbf24',
  primaryDark: '#d97706',
  primaryMuted: 'rgba(245, 158, 11, 0.15)',
  primaryBorder: 'rgba(245, 158, 11, 0.35)',
  primaryGlow: 'rgba(245, 158, 11, 0.45)',

  amber: '#f59e0b',
  amberLight: '#fbbf24',
  amberDark: '#d97706',
  amberMuted: 'rgba(245, 158, 11, 0.15)',
  amberBorder: 'rgba(245, 158, 11, 0.35)',
  amberGlow: 'rgba(245, 158, 11, 0.45)',

  // Aliased to Warm Amber to guarantee NO blue tint across legacy components
  cyan: '#f59e0b',
  cyanMuted: 'rgba(245, 158, 11, 0.15)',
  cyanBorder: 'rgba(245, 158, 11, 0.35)',
  cyanGlow: 'rgba(245, 158, 11, 0.45)',

  // Calming Secondary Accents
  emerald: '#10b981',
  emeraldMuted: 'rgba(16, 185, 129, 0.15)',
  emeraldBorder: 'rgba(16, 185, 129, 0.35)',

  purple: '#a855f7',
  purpleMuted: 'rgba(168, 85, 247, 0.15)',

  blue: '#f59e0b', // remapped to amber
  blueMuted: 'rgba(245, 158, 11, 0.15)',

  red: '#ef4444',
  redMuted: 'rgba(239, 68, 68, 0.15)',

  // Typography
  textPrimary: '#ffffff',
  textSecondary: '#e2e2e9',
  textMuted: '#94a3b8',
  textDark: '#64748b',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderAmber: 'rgba(245, 158, 11, 0.35)',
};

export const Shadows = {
  amberGlow: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cyanGlow: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emeraldGlow: {
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
};
