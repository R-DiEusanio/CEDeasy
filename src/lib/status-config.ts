import {
  Calendar,
  Check,
  CheckCheck,
  Circle,
  Clock,
  FileText,
  Pencil,
  RotateCcw,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import type { PostStatus } from './mock-data'

// Lo stato del post È lo stato visivo: nessuna collassatura/derivazione, un
// post ha sempre uno solo di questi 8 valori (vedi Post.status in mock-data.ts).
export type VisualStatus = PostStatus

export interface StatusConfig {
  label: string
  Icon: LucideIcon
  dotColor: string
  badgeColor: string
  badgeTextColor: string
}

export const STATUS_CONFIG: Record<VisualStatus, StatusConfig> = {
  da_fare: {
    label: 'Da fare',
    Icon: Circle,
    dotColor: '#94a3b8',
    badgeColor: '#f1f5f9',
    badgeTextColor: '#475569',
  },
  bozza_privata: {
    label: 'Bozza privata',
    Icon: FileText,
    dotColor: '#f43f5e',
    badgeColor: '#fff1f2',
    badgeTextColor: '#be123c',
  },
  da_revisionare: {
    label: 'Da revisionare',
    Icon: Clock,
    dotColor: '#f59e0b',
    badgeColor: '#fffbeb',
    badgeTextColor: '#b45309',
  },
  da_modificare: {
    label: 'Da modificare',
    Icon: Pencil,
    dotColor: '#f97316',
    badgeColor: '#fff7ed',
    badgeTextColor: '#c2410c',
  },
  approvato: {
    label: 'Approvato',
    Icon: Check,
    dotColor: '#10b981',
    badgeColor: '#ecfdf5',
    badgeTextColor: '#047857',
  },
  programmato: {
    label: 'Programmato',
    Icon: Calendar,
    dotColor: '#3b82f6',
    badgeColor: '#eff6ff',
    badgeTextColor: '#1d4ed8',
  },
  pubblicato: {
    label: 'Pubblicato',
    Icon: CheckCheck,
    dotColor: '#059669',
    badgeColor: '#d1fae5',
    badgeTextColor: '#065f46',
  },
  rimandato: {
    label: 'Rimandato',
    Icon: RotateCcw,
    dotColor: '#7c3aed',
    badgeColor: '#ede9fe',
    badgeTextColor: '#5b21b6',
  },
}

// Ordine di visualizzazione consigliato per liste/legende/kanban (Task 5-7).
export const STATUS_ORDER: VisualStatus[] = [
  'da_fare',
  'bozza_privata',
  'da_revisionare',
  'da_modificare',
  'approvato',
  'programmato',
  'pubblicato',
  'rimandato',
]
