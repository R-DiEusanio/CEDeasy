import { AlertTriangle, Check, Clock, FileText } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import type { PostStatus } from './mock-data'

export type VisualStatus = 'draft' | 'pending' | 'changes_requested' | 'approved'

export interface StatusConfig {
  label: string
  Icon: LucideIcon
  dotColor: string
  badgeColor: string
  badgeTextColor: string
}

export const STATUS_CONFIG: Record<VisualStatus, StatusConfig> = {
  draft: {
    label: 'Bozza privata',
    Icon: FileText,
    dotColor: '#94a3b8',
    badgeColor: '#f1f5f9',
    badgeTextColor: '#475569',
  },
  pending: {
    label: 'In approvazione',
    Icon: Clock,
    dotColor: '#f59e0b',
    badgeColor: '#fffbeb',
    badgeTextColor: '#b45309',
  },
  changes_requested: {
    label: 'Modifica richiesta',
    Icon: AlertTriangle,
    dotColor: '#f43f5e',
    badgeColor: '#fff1f2',
    badgeTextColor: '#be123c',
  },
  approved: {
    label: 'Approvato',
    Icon: Check,
    dotColor: '#10b981',
    badgeColor: '#ecfdf5',
    badgeTextColor: '#047857',
  },
}

export function getVisualStatus(status: PostStatus, hasChanges?: boolean): VisualStatus {
  if (hasChanges && status === 'draft') return 'changes_requested'
  return status
}
