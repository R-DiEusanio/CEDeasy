import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { useState } from 'react'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import type { ClientComparison, ComparisonBlock, MonthSummary } from '../src/lib/supabase/posts'
import type { Post } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

// ─── Tipi ─────────────────────────────────────────────────────────────────────

interface HistorySheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  comparison: ClientComparison
  posts: Post[]
}

type Tab = 'confronto' | 'storico'

// ─── Delta helper ─────────────────────────────────────────────────────────────

function Delta({ current, previous, suffix = '%' }: { current: number; previous: number; suffix?: string }) {
  const diff = current - previous
  if (diff === 0 || previous === 0) return <Minus size={12} color={colors.text.muted} />
  const up    = diff > 0
  const color = up ? colors.status.approved.dot : colors.status.changes.dot
  const Icon  = up ? TrendingUp : TrendingDown
  const abs   = Math.abs(diff)
  return (
    <View style={styles.deltaRow}>
      <Icon size={12} color={color} />
      <Text style={[styles.deltaText, { color }]}>
        {up ? '+' : '-'}{abs}{suffix}
      </Text>
    </View>
  )
}

// ─── Comparison Card ──────────────────────────────────────────────────────────

function ComparisonCard({ title, current, previous }: {
  title: string
  current: ComparisonBlock
  previous: ComparisonBlock
}) {
  return (
    <View style={styles.compCard}>
      <Text style={styles.compTitle}>{title}</Text>
      <View style={styles.compRow}>

        {/* Periodo corrente */}
        <View style={[styles.compCol, styles.compColActive]}>
          <Text style={styles.compPeriodLabel} numberOfLines={1}>{current.label}</Text>
          <Text style={styles.compValue}>{current.total}</Text>
          <Text style={styles.compSub}>post</Text>
          <View style={styles.compMetaRow}>
            <Text style={styles.compMetaLabel}>Approvati</Text>
            <Text style={[styles.compMetaValue, { color: colors.status.approved.dot }]}>
              {current.approvalRate}%
            </Text>
          </View>
          <View style={styles.compMetaRow}>
            <Text style={styles.compMetaLabel}>Feedback</Text>
            <Text style={[styles.compMetaValue, { color: colors.status.changes.dot }]}>
              {current.feedbackRate}%
            </Text>
          </View>
        </View>

        {/* Divider con delta */}
        <View style={styles.compDivider}>
          <Text style={styles.compVs}>vs</Text>
          <Delta current={current.total}        previous={previous.total}        suffix=" post" />
          <Delta current={current.approvalRate} previous={previous.approvalRate} />
          <Delta current={previous.feedbackRate} previous={current.feedbackRate} />
        </View>

        {/* Periodo precedente */}
        <View style={styles.compCol}>
          <Text style={styles.compPeriodLabel} numberOfLines={1}>{previous.label}</Text>
          <Text style={[styles.compValue, styles.compValueMuted]}>{previous.total}</Text>
          <Text style={styles.compSub}>post</Text>
          <View style={styles.compMetaRow}>
            <Text style={styles.compMetaLabel}>Approvati</Text>
            <Text style={styles.compMetaValue}>{previous.approvalRate}%</Text>
          </View>
          <View style={styles.compMetaRow}>
            <Text style={styles.compMetaLabel}>Feedback</Text>
            <Text style={styles.compMetaValue}>{previous.feedbackRate}%</Text>
          </View>
        </View>

      </View>
    </View>
  )
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniChart({ data }: { data: MonthSummary[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  return (
    <View style={styles.chartWrap}>
      <Text style={styles.sectionLabel}>Andamento ultimi 6 mesi</Text>
      <View style={styles.chart}>
        {data.map((item, i) => (
          <View key={i} style={styles.chartCol}>
            <Text style={styles.chartCount}>{item.total > 0 ? item.total : ''}</Text>
            <View style={styles.chartBarWrap}>
              <View
                style={[
                  styles.chartBar,
                  { height: `${Math.max((item.total / max) * 100, item.total > 0 ? 8 : 0)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{item.short}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Storico Row ──────────────────────────────────────────────────────────────

function postsForMonth(posts: Post[], m: MonthSummary): Post[] {
  return posts.filter((p) => {
    const d = new Date(p.date)
    return d.getFullYear() === m.year && d.getMonth() === m.monthIndex
  })
}

function downloadMonthCSV(m: MonthSummary, posts: Post[]) {
  if (Platform.OS !== 'web') {
    Toast.show({ type: 'info', text1: 'CSV disponibile solo su web' })
    return
  }
  const mp = postsForMonth(posts, m)
  const header = 'Titolo,Tipo,Data,Approvato,Feedback\n'
  const rows = mp.map((p) => {
    const approved = p.status === 'approved' ? 'Sì' : 'No'
    return `"${p.title}","${p.type}","${p.date.split('T')[0]}","${approved}","${p.feedback ? 'Sì' : 'No'}"`
  }).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `post_${m.year}_${String(m.monthIndex + 1).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  Toast.show({ type: 'success', text1: `CSV ${m.label} scaricato!` })
}

function HistoryRow({ m, posts }: { m: MonthSummary; posts: Post[] }) {
  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.historyMonth}>{m.label}</Text>
        <View style={styles.historyPills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{m.total} post</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.status.approved.bg }]}>
            <Text style={[styles.pillText, { color: colors.status.approved.dot }]}>
              {m.approvalRate}% approvati
            </Text>
          </View>
          {m.withFeedback > 0 && (
            <View style={[styles.pill, { backgroundColor: colors.status.changes.bg }]}>
              <Text style={[styles.pillText, { color: colors.status.changes.dot }]}>
                {m.withFeedback} feedback
              </Text>
            </View>
          )}
        </View>
      </View>
      <Pressable style={styles.csvBtn} onPress={() => downloadMonthCSV(m, posts)}>
        <Download size={12} color={colors.primary} />
        <Text style={styles.csvBtnLabel}>CSV</Text>
      </Pressable>
    </View>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function HistorySheet({ sheetRef, comparison, posts }: HistorySheetProps) {
  const [tab, setTab] = useState<Tab>('confronto')

  return (
    <Sheet ref={sheetRef} title="Storico & Confronto" snapPoints={['95%']} scrollable>
      <View style={styles.container}>

        {/* Tab selector */}
        <View style={styles.tabs}>
          {(['confronto', 'storico'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'confronto' ? 'Confronto' : 'Storico'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'confronto' ? (
          <View style={{ gap: spacing.lg }}>
            <ComparisonCard
              title="Mese su mese (MoM)"
              current={comparison.mom.current}
              previous={comparison.mom.previous}
            />
            <ComparisonCard
              title="Trimestre su trimestre (QoQ)"
              current={comparison.qoq.current}
              previous={comparison.qoq.previous}
            />
            <MiniChart data={[...comparison.monthlyHistory].reverse()} />
          </View>
        ) : (
          <View style={{ gap: spacing.xs }}>
            {comparison.monthlyHistory.map((m, i) => (
              <HistoryRow key={i} m={m} posts={posts} />
            ))}
          </View>
        )}

      </View>
    </Sheet>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },

  // tabs
  tabs: { flexDirection: 'row', backgroundColor: colors.input, borderRadius: radius.md, padding: 3, gap: 3 },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabLabel: { ...typography.small, color: colors.text.muted },
  tabLabelActive: { ...typography.small, color: colors.text.primary, fontWeight: '600' },

  // comparison card
  compCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  compTitle: { ...typography.label, color: colors.text.secondary },
  compRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  compCol: { flex: 1, gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  compColActive: { borderWidth: 1, borderColor: colors.primary + '30', backgroundColor: colors.primaryLight },
  compPeriodLabel: { ...typography.caption, color: colors.text.muted },
  compValue: { ...typography.h2, color: colors.primary },
  compValueMuted: { color: colors.text.secondary },
  compSub: { ...typography.caption, color: colors.text.muted, marginTop: -4 },
  compMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compMetaLabel: { ...typography.caption, color: colors.text.muted },
  compMetaValue: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },

  // divider delta
  compDivider: { width: 48, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: 28 },
  compVs: { ...typography.caption, color: colors.text.muted },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  deltaText: { ...typography.caption, fontWeight: '600' },

  // mini chart
  chartWrap: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.text.secondary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chartCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', backgroundColor: colors.primary, borderRadius: 3, minHeight: 0 },
  chartCount: { fontSize: 9, color: colors.text.muted },
  chartLabel: { fontSize: 9, color: colors.text.muted },

  // history rows
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyMonth: { ...typography.bodyMedium, color: colors.text.primary },
  historyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: colors.input },
  pillText: { ...typography.caption, color: colors.text.secondary },
  csvBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: colors.primary + '50',
    borderRadius: radius.sm, paddingHorizontal: spacing.sm,
    paddingVertical: 5, backgroundColor: colors.primaryLight,
  },
  csvBtnLabel: { ...typography.caption, color: colors.primary, fontWeight: '600' },
})
