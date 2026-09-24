export const Colors = {
  // Backgrounds
  background: '#060a12',
  card: '#0c1322',
  surface: '#080d18',
  surfaceElevated: '#111b2e',
  modalOverlay: 'rgba(6, 10, 18, 0.88)',

  // Neons & Highlights
  cyan: '#00f0ff',
  cyanMuted: 'rgba(0, 240, 255, 0.15)',
  cyanBorder: 'rgba(0, 240, 255, 0.35)',
  cyanGlow: 'rgba(0, 240, 255, 0.4)',

  emerald: '#10b981',
  emeraldMuted: 'rgba(16, 185, 129, 0.15)',
  emeraldBorder: 'rgba(16, 185, 129, 0.4)',

  purple: '#a855f7',
  purpleMuted: 'rgba(168, 85, 247, 0.15)',
  purpleBorder: 'rgba(168, 85, 247, 0.4)',

  blue: '#3b82f6',
  amber: '#f59e0b',
  amberMuted: 'rgba(245, 158, 11, 0.15)',
  red: '#ef4444',
  redMuted: 'rgba(239, 68, 68, 0.15)',

  // Typography
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDark: '#334155',

  // Borders
  borderSubtle: '#1e293b',
  borderStrong: '#334155',
};

export const Shadows = {
  cyanGlow: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  emeraldGlow: {
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  purpleGlow: {
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
};
