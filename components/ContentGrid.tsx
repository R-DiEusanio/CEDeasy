import { useState } from 'react'
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { Post } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { spacing, radius } from '../constants/spacing'
import { typography } from '../constants/typography'

const SCREEN_W = Dimensions.get('window').width
const CELL_W = Math.floor((SCREEN_W - spacing.lg * 2) / 7)
const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

const STATUS_CONFIG = {
  draft:    { label: 'Bozza privata',      color: colors.status.draft.text,    bg: colors.status.draft.bg },
  pending:  { label: 'In approvazione',    color: colors.status.pending.text,  bg: colors.status.pending.bg },
  changes:  { label: 'Richiesta modifica', color: colors.status.changes.text,  bg: colors.status.changes.bg },
  approved: { label: 'Approvato',          color: colors.status.approved.text, bg: colors.status.approved.bg },
}

function getStatusConfig(post: Post) {
  if (post.hasChangesRequested) return STATUS_CONFIG.changes
  if (post.status === 'pending')  return STATUS_CONFIG.pending
  if (post.status === 'approved') return STATUS_CONFIG.approved
  return STATUS_CONFIG.draft
}

interface Props {
  posts: Post[]
  brandId: string
  onDayPress?: (date: Date) => void
  onPostPress?: (post: Post) => void
}

export function ContentGrid({ posts, brandId, onDayPress, onPostPress }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const postsByDay = new Map<number, Post[]>()
  posts.forEach((p) => {
    const d = new Date(p.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!postsByDay.has(day)) postsByDay.set(day, [])
      postsByDay.get(day)!.push(p)
    }
  })

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('it-IT', {
    month: 'long', year: 'numeric',
  })

  return (
    <View style={styles.container}>
      {/* Navigatore mese */}
      <View style={styles.navigator}>
        <Pressable onPress={prevMonth} hitSlop={8} style={styles.navBtn}>
          <ChevronLeft size={20} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={nextMonth} hitSlop={8} style={styles.navBtn}>
          <ChevronRight size={20} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Intestazione giorni */}
      <View style={styles.row}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={[styles.cell, styles.headerCell]}>
            <Text style={styles.dayHeader}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Griglia */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />

          const dayPosts = postsByDay.get(day) ?? []
          const first = dayPosts[0]
          const extra = dayPosts.length - 1
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          const cfg = first ? getStatusConfig(first) : null

          return (
            <Pressable
              key={day}
              style={[styles.cell, styles.dayCell, cfg && { backgroundColor: cfg.bg }]}
              onPress={() => {
                if (first) onPostPress?.(first)
                else onDayPress?.(new Date(year, month, day))
              }}
            >
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                {day}
              </Text>
              {first && (
                <View style={[styles.postChip, { backgroundColor: cfg!.color }]}>
                  <Text style={styles.postChipText} numberOfLines={1}>
                    {first.title}
                  </Text>
                </View>
              )}
              {extra > 0 && (
                <Text style={[styles.extraBadge, { color: cfg!.color }]}>
                  +{extra}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.legendLabel}>{cfg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { },

  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navBtn: { padding: spacing.xs },
  monthLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },

  row: { flexDirection: 'row', paddingHorizontal: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  cell: {
    width: CELL_W,
    height: CELL_W + 8,
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeader: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
  },
  dayCell: {
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 3,
    borderRadius: radius.sm,
  },
  dayNum: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  dayNumToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  postChip: {
    marginTop: 2,
    borderRadius: radius.sm,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  postChipText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 13,
  },
  extraBadge: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
})
