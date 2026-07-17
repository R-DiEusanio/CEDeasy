import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { Brand } from '../src/lib/mock-data'
import { BRAND_COLOR_HEX } from '../src/lib/mock-data'
import { Avatar } from './ui/Avatar'
import { Card } from './ui/Card'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

interface BrandStats {
  total: number
  toSend: number
  inReview: number
}

interface BrandCardProps {
  brand: Brand
  stats?: BrandStats
  onPress: () => void
}

// Chip ToV/Obiettivo/Target/Posizionamento: "Da definire" finché il campo non
// è compilato nella scheda Strategia (Task 9).
function strategyChips(brand: Brand) {
  return [
    { label: 'ToV', value: brand.toneOfVoice, color: colors.status.changes },
    { label: 'Obiettivo', value: brand.obiettivo, color: colors.status.pending },
    { label: 'Target', value: brand.target, color: colors.status.approved },
    { label: 'Posizionamento', value: brand.posizionamento, color: colors.status.draft },
  ]
}

export function BrandCard({ brand, stats, onPress }: BrandCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.card} padding={spacing.md}>
        <View style={styles.topRow}>
          <Avatar name={brand.name} id={brand.id} size={46} color={BRAND_COLOR_HEX[brand.color]} />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{brand.name}</Text>
            {!!stats && (
              <Text style={styles.statsLine} numberOfLines={1}>
                {stats.total} contenuti · {stats.toSend} da inviare · {stats.inReview} in revisione
              </Text>
            )}
            {!stats && brand.ownerName && (
              <Text style={styles.owner} numberOfLines={1}>{brand.ownerName}</Text>
            )}
          </View>

          <ChevronRight size={18} color={colors.text.muted} />
        </View>

        <View style={styles.chips}>
          {strategyChips(brand).map((s) => (
            <View key={s.label} style={[styles.chip, { backgroundColor: s.color.bg }]}>
              <Text style={[styles.chipText, { color: s.color.text }]} numberOfLines={1}>
                {s.label} · {s.value || 'Da definire'}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  name: { ...typography.bodyMedium, color: colors.text.primary },
  statsLine: { ...typography.small, color: colors.text.muted },
  owner: { ...typography.small, color: colors.text.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  chipText: { ...typography.caption, fontWeight: '600' },
})
