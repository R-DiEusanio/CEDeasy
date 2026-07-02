import { useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CheckCircle, Clock, AlertTriangle, FileText, Star, ThumbsUp, Timer, Download, History } from 'lucide-react-native'
import { useClientStats, useClientKPIs, useClientPosts, useClientComparison } from '../../src/lib/queries'
import { Skeleton } from '../../components/ui/SkeletonLoader'
import { ReportSheet } from '../../components/ReportSheet'
import { HistorySheet } from '../../components/HistorySheet'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  color: string
  bg: string
  icon: React.ComponentType<{ size: number; color: string }>
}

function StatCard({ label, value, color, bg, icon: Icon }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color?: string
  icon: React.ComponentType<{ size: number; color: string }>
}

function KpiCard({ label, value, sub, color = colors.primary, icon: Icon }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '18' }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { short: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <View style={styles.chart}>
      {data.map((item, i) => (
        <View key={i} style={styles.chartCol}>
          <Text style={styles.chartCount}>{item.count > 0 ? item.count : ''}</Text>
          <View style={styles.chartBarWrap}>
            <View
              style={[
                styles.chartBar,
                { height: `${Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0)}%` as any },
              ]}
            />
          </View>
          <Text style={styles.chartLabel}>{item.short}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Qualità SMM ──────────────────────────────────────────────────────────────

const QUALITY_CONFIG = {
  green:  { color: colors.status.approved.dot, bg: colors.status.approved.bg, label: 'Ottimo' },
  yellow: { color: colors.status.pending.dot,  bg: colors.status.pending.bg,  label: 'Migliorabile' },
  red:    { color: colors.status.changes.dot,  bg: colors.status.changes.bg,  label: 'Critico' },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton height={24} width="50%" />
      <Skeleton height={14} width="35%" />
      <Skeleton height={80} borderRadius={radius.lg} />
      <View style={styles.statsGrid}>
        {[0,1,2,3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <Skeleton height={20} width="50%" />
            <Skeleton height={12} width="70%" />
          </View>
        ))}
      </View>
      <Skeleton height={140} borderRadius={radius.lg} />
      <Skeleton height={120} borderRadius={radius.lg} />
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientDashboardScreen() {
  const { data: stats,      isLoading: loadingStats } = useClientStats()
  const { data: kpis,       isLoading: loadingKPIs  } = useClientKPIs()
  const { data: comparison                          } = useClientComparison()
  const { data: posts = [] }                          = useClientPosts()
  const reportSheetRef  = useRef<BottomSheetModal>(null)
  const historySheetRef = useRef<BottomSheetModal>(null)

  const isLoading = loadingStats || loadingKPIs

  const approvalRate = stats && stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Dashboard</Text>
          {stats && <Text style={styles.month}>{stats.month}</Text>}
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => historySheetRef.current?.present()}>
            <History size={14} color={colors.primary} />
            <Text style={styles.headerBtnLabel}>Storico</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => reportSheetRef.current?.present()}>
            <Download size={14} color={colors.primary} />
            <Text style={styles.headerBtnLabel}>Report</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? <DashboardSkeleton /> : stats && kpis ? (
        <>
          {/* Brand */}
          <Text style={styles.brandName}>{stats.brandName}</Text>

          {/* Barra avanzamento */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tasso di approvazione</Text>
              <Text style={styles.progressPercent}>{approvalRate}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${approvalRate}%` as any }]} />
            </View>
            <Text style={styles.progressSub}>
              {stats.approved} approvati su {stats.total} post totali
            </Text>
          </View>

          {/* Card stati */}
          <View style={styles.statsGrid}>
            <StatCard label="Totale post"        value={stats.total}            color={colors.primary}               bg={colors.primaryLight}          icon={FileText}      />
            <StatCard label="In approvazione"    value={stats.pending}          color={colors.status.pending.text}   bg={colors.status.pending.bg}     icon={Clock}         />
            <StatCard label="Modifica richiesta" value={stats.changesRequested} color={colors.status.changes.text}   bg={colors.status.changes.bg}     icon={AlertTriangle} />
            <StatCard label="Approvati"          value={stats.approved}         color={colors.status.approved.text}  bg={colors.status.approved.bg}    icon={CheckCircle}   />
          </View>

          {/* KPI */}
          <Text style={styles.sectionTitle}>KPI</Text>
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Tempo medio approvazione"
              value={kpis.avgApprovalDays != null ? `${kpis.avgApprovalDays}g` : '—'}
              sub="giorni dalla creazione"
              icon={Timer}
            />
            <KpiCard
              label="Approvazione al 1° invio"
              value={`${kpis.firstPassRate}%`}
              sub="senza modifiche"
              color={colors.status.approved.text}
              icon={ThumbsUp}
            />
          </View>

          {/* Qualità SMM */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Qualità SMM</Text>
          </View>
          {(() => {
            const q = QUALITY_CONFIG[kpis.qualityColor]
            return (
              <View style={[styles.qualityCard, { backgroundColor: q.bg, borderColor: q.color + '40' }]}>
                <View style={[styles.qualityDot, { backgroundColor: q.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.qualityLabel, { color: q.color }]}>{q.label}</Text>
                  <Text style={styles.qualitySub}>
                    {kpis.feedbackRate}% dei post ha ricevuto richieste di modifica
                  </Text>
                </View>
                <Star size={20} color={q.color} />
              </View>
            )
          })()}

          {/* Grafico mensile */}
          <Text style={styles.sectionTitle}>Post per mese</Text>
          <View style={styles.chartCard}>
            <BarChart data={kpis.monthlyChart} />
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Nessun dato disponibile</Text>
      )}

      {stats && kpis && (
        <ReportSheet
          sheetRef={reportSheetRef}
          stats={stats}
          kpis={kpis}
          posts={posts}
        />
      )}
      {comparison && (
        <HistorySheet
          sheetRef={historySheetRef}
          comparison={comparison}
          posts={posts}
        />
      )}
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: spacing['3xl'], gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { ...typography.h1, color: colors.text.primary },
  month: { ...typography.small, color: colors.text.muted },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  headerBtnLabel: { ...typography.small, color: colors.primary, fontWeight: '600' },
  brandName: { ...typography.h3, color: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // progress
  progressSection: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...typography.bodyMedium, color: colors.text.primary },
  progressPercent: { ...typography.h2, color: colors.primary },
  progressTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  progressSub: { ...typography.small, color: colors.text.muted },

  // stat cards
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '47%', borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { ...typography.h2 },
  statLabel: { ...typography.small, color: colors.text.secondary },

  // kpi cards
  kpiGrid: { flexDirection: 'row', gap: spacing.md },
  kpiCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.border },
  kpiIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  kpiValue: { ...typography.h2, color: colors.primary },
  kpiLabel: { ...typography.small, color: colors.text.primary, fontWeight: '600' },
  kpiSub: { ...typography.caption, color: colors.text.muted },

  // qualità smm
  qualityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1 },
  qualityDot: { width: 12, height: 12, borderRadius: 6 },
  qualityLabel: { ...typography.bodyMedium, fontWeight: '700' },
  qualitySub: { ...typography.small, color: colors.text.secondary },

  // bar chart
  chartCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  chartBarWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', backgroundColor: colors.primary, borderRadius: 4, minHeight: 0 },
  chartCount: { ...typography.caption, color: colors.text.muted, fontSize: 10 },
  chartLabel: { ...typography.caption, color: colors.text.muted, fontSize: 10 },

  // skeleton
  skeletonWrap: { gap: spacing.lg },
  skeletonCard: { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  empty: { ...typography.body, color: colors.text.muted, textAlign: 'center' },
})
