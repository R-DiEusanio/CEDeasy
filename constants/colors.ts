export const colors = {
  // Rosa/magenta: CTA principali, logo, pillola attiva, FAB
  primary: '#FF4D8D',
  primaryLight: '#FFE3EE',
  primaryForeground: '#ffffff',

  // Viola: accento secondario (stato "programmato", pillole selezionate alternative)
  secondary: '#7c3aed',
  secondaryLight: '#ede9fe',

  background: '#FBF1E7', // cream, sfondo pagina
  card: '#ffffff', // card sopra lo sfondo cream
  border: '#F1E2D3', // tono cream più scuro, mai grigio duro
  input: '#ffffff',

  text: {
    primary: '#2B2230', // plum scuro, non slate
    secondary: '#6b5f6e',
    muted: '#a89aae',
    inverse: '#ffffff',
  },

  destructive: '#ef4444',
  destructiveLight: '#fef2f2',
  destructiveForeground: '#ffffff',

  success: '#10b981',
  successLight: '#ecfdf5',

  toast: '#2B2230',

  status: {
    draft:    { dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
    pending:  { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
    changes:  { dot: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
    approved: { dot: '#10b981', bg: '#ecfdf5', text: '#047857' },
  },

  // Ombre morbide e colorate (mai grigie) — valori dal brief di design
  shadow: {
    card: 'rgba(50,25,60,0.06)',
    primary: 'rgba(255,77,141,0.3)',
  },

  overlay: 'rgba(0,0,0,0.4)',
} as const
