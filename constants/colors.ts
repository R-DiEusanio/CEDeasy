export const colors = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  primaryForeground: '#ffffff',

  background: '#ffffff',
  card: '#f8fafc',
  border: '#e2e8f0',
  input: '#f1f5f9',

  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },

  destructive: '#ef4444',
  destructiveLight: '#fef2f2',
  destructiveForeground: '#ffffff',

  success: '#10b981',
  successLight: '#ecfdf5',

  status: {
    draft:    { dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
    pending:  { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
    changes:  { dot: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
    approved: { dot: '#10b981', bg: '#ecfdf5', text: '#047857' },
  },

  overlay: 'rgba(0,0,0,0.4)',
} as const
