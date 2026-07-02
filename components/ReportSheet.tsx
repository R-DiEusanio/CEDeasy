import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import type { Post } from '../src/lib/mock-data'
import type { ClientStats, ClientKPIs } from '../src/lib/supabase/posts'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

// ─── Tipi ─────────────────────────────────────────────────────────────────────

type Period = 'mese' | 'trimestre' | 'semestre'

const PERIOD_LABELS: Record<Period, string> = {
  mese:      'Mese corrente',
  trimestre: 'Trimestre',
  semestre:  'Semestre',
}

const PERIOD_MONTHS: Record<Period, number> = {
  mese: 1, trimestre: 3, semestre: 6,
}

interface ReportSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  stats: ClientStats
  kpis: ClientKPIs
  posts: Post[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterByPeriod(posts: Post[], period: Period): Post[] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - PERIOD_MONTHS[period] + 1, 1)
  return posts.filter((p) => new Date(p.date) >= from)
}

function statusLabel(post: Post): string {
  if (post.hasChangesRequested) return 'Modifica richiesta'
  if (post.status === 'approved')   return 'Approvato'
  if (post.status === 'pending')    return 'In approvazione'
  return 'Bozza'
}

function qualityText(rate: number): string {
  if (rate <= 20) return `Ottimo — solo il ${rate}% dei post ha richiesto modifiche.`
  if (rate <= 40) return `Migliorabile — il ${rate}% dei post ha richiesto modifiche.`
  return `Critico — il ${rate}% dei post ha richiesto modifiche. Si consiglia un confronto con l'SMM.`
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCSV(posts: Post[], brandName: string, period: string) {
  const header = 'Titolo,Tipo,Data,Stato,Feedback\n'
  const rows = posts.map((p) =>
    `"${p.title}","${p.type}","${p.date.split('T')[0]}","${statusLabel(p)}","${p.feedback ? 'Sì' : 'No'}"`
  ).join('\n')
  const csv = header + rows

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${brandName.replace(/\s+/g, '_')}_${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
    Toast.show({ type: 'success', text1: 'CSV scaricato!' })
  } else {
    Toast.show({ type: 'info', text1: 'Export CSV disponibile solo su web' })
  }
}

// ─── Export PDF ───────────────────────────────────────────────────────────────

function exportPDF(posts: Post[], stats: ClientStats, kpis: ClientKPIs, period: string) {
  if (Platform.OS !== 'web') {
    Toast.show({ type: 'info', text1: 'Export PDF disponibile solo su web' })
    return
  }

  const approved = posts.filter((p) => p.status === 'approved').length
  const rate = posts.length > 0 ? Math.round((approved / posts.length) * 100) : 0

  const rows = posts.map((p) => `
    <tr>
      <td>${p.title}</td>
      <td>${p.type}</td>
      <td>${p.date.split('T')[0]}</td>
      <td>${statusLabel(p)}</td>
      <td>${p.feedback ? 'Sì' : 'No'}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>Report ${stats.brandName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
  h1 { color: #7c3aed; }
  h2 { color: #475569; font-size: 14px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .meta { color: #94a3b8; font-size: 12px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
  .kpi { background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #7c3aed; }
  .kpi-label { font-size: 12px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #7c3aed; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .quality { padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; }
  .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Report — ${stats.brandName}</h1>
<p class="meta">Periodo: ${PERIOD_LABELS[period as Period]} &nbsp;|&nbsp; Generato il ${new Date().toLocaleDateString('it-IT')}</p>

<h2>Riepilogo</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value">${posts.length}</div><div class="kpi-label">Post totali</div></div>
  <div class="kpi"><div class="kpi-value">${approved}</div><div class="kpi-label">Approvati</div></div>
  <div class="kpi"><div class="kpi-value">${rate}%</div><div class="kpi-label">Tasso approvazione</div></div>
  <div class="kpi"><div class="kpi-value">${kpis.avgApprovalDays != null ? kpis.avgApprovalDays + 'g' : '—'}</div><div class="kpi-label">Tempo medio approvazione</div></div>
  <div class="kpi"><div class="kpi-value">${kpis.firstPassRate}%</div><div class="kpi-label">Approvazione al 1° invio</div></div>
  <div class="kpi"><div class="kpi-value">${kpis.feedbackRate}%</div><div class="kpi-label">Tasso modifiche richieste</div></div>
</div>

<h2>Valutazione qualità SMM</h2>
<div class="quality" style="background:${kpis.qualityColor === 'green' ? '#ecfdf5' : kpis.qualityColor === 'yellow' ? '#fffbeb' : '#fff1f2'}">
  <strong>${kpis.qualityLabel}</strong> — ${qualityText(kpis.feedbackRate)}
</div>

<h2>Lista post (${posts.length})</h2>
<table>
  <thead><tr><th>Titolo</th><th>Tipo</th><th>Data</th><th>Stato</th><th>Feedback</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">Generato con CEDeasy &nbsp;·&nbsp; ${new Date().toLocaleString('it-IT')}</div>
</body>
</html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 500)
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReportSheet({ sheetRef, stats, kpis, posts }: ReportSheetProps) {
  const [period, setPeriod] = useState<Period>('mese')
  const filtered = filterByPeriod(posts, period)
  const approved = filtered.filter((p) => p.status === 'approved').length
  const rate = filtered.length > 0 ? Math.round((approved / filtered.length) * 100) : 0
  const withFeedback = filtered.filter((p) => p.feedback).length

  return (
    <Sheet ref={sheetRef} title="Genera report" snapPoints={['95%']} scrollable>
      <View style={styles.container}>

        {/* Selezione periodo */}
        <View style={styles.periodRow}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Anteprima */}
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewBrand}>{stats.brandName}</Text>
            <Text style={styles.previewPeriod}>{PERIOD_LABELS[period]}</Text>
          </View>

          {/* KPI preview */}
          <View style={styles.kpiRow}>
            {[
              { label: 'Post totali',    value: String(filtered.length) },
              { label: 'Approvati',      value: String(approved) },
              { label: 'Tasso approv.',  value: `${rate}%` },
              { label: 'Con feedback',   value: String(withFeedback) },
            ].map((k) => (
              <View key={k.label} style={styles.kpiBox}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          {/* Qualità */}
          <View style={[styles.qualityRow, {
            backgroundColor: kpis.qualityColor === 'green'
              ? colors.status.approved.bg
              : kpis.qualityColor === 'yellow'
              ? colors.status.pending.bg
              : colors.status.changes.bg
          }]}>
            <Text style={styles.qualityText}>
              <Text style={{ fontWeight: '700' }}>{kpis.qualityLabel}</Text>
              {' — '}{qualityText(kpis.feedbackRate)}
            </Text>
          </View>

          {/* Lista post */}
          <Text style={styles.listTitle}>Post nel periodo ({filtered.length})</Text>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>Nessun post in questo periodo</Text>
          ) : filtered.map((p) => (
            <View key={p.id} style={styles.postRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.postTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.postMeta}>{p.type} · {p.date.split('T')[0]}</Text>
              </View>
              <View style={styles.postRight}>
                <Text style={styles.postStatus}>{statusLabel(p)}</Text>
                {!!p.feedback && <Text style={styles.postFeedback}>Feedback</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Bottoni export */}
        <View style={styles.actions}>
          <Button
            label="Scarica PDF"
            onPress={() => exportPDF(filtered, stats, kpis, period)}
            fullWidth
          />
          <Button
            label="Esporta CSV"
            onPress={() => exportCSV(filtered, stats.brandName, period)}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </Sheet>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },

  // periodo
  periodRow: { flexDirection: 'row', gap: spacing.sm },
  periodBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.input,
  },
  periodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  periodLabel: { ...typography.small, color: colors.text.secondary },
  periodLabelActive: { color: colors.primary, fontWeight: '600' },

  // preview
  preview: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  previewHeader: { gap: 2 },
  previewBrand: { ...typography.h3, color: colors.text.primary },
  previewPeriod: { ...typography.small, color: colors.text.muted },

  // kpi preview
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiBox: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: colors.border },
  kpiValue: { ...typography.bodyMedium, color: colors.primary, fontWeight: '700' },
  kpiLabel: { ...typography.caption, color: colors.text.muted, textAlign: 'center' },

  // qualità
  qualityRow: { borderRadius: radius.md, padding: spacing.md },
  qualityText: { ...typography.small, color: colors.text.secondary, lineHeight: 18 },

  // lista post
  listTitle: { ...typography.label, color: colors.text.secondary },
  postRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  postTitle: { ...typography.smallMedium, color: colors.text.primary },
  postMeta: { ...typography.caption, color: colors.text.muted },
  postRight: { alignItems: 'flex-end', gap: 2 },
  postStatus: { ...typography.caption, color: colors.text.secondary },
  postFeedback: { ...typography.caption, color: colors.status.changes.text, fontWeight: '600' },
  empty: { ...typography.small, color: colors.text.muted, textAlign: 'center', paddingVertical: spacing.lg },

  // azioni
  actions: { gap: spacing.sm },
})
