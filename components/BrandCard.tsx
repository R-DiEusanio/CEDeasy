import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { Brand } from '../src/lib/mock-data'
import { Avatar } from './ui/Avatar'
import { Card } from './ui/Card'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

interface BrandCardProps {
  brand: Brand
  pendingCount?: number
  onPress: () => void
}

export function BrandCard({ brand, pendingCount = 0, onPress }: BrandCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.card} padding={spacing.md}>
        <Avatar name={brand.name} id={brand.id} size={46} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{brand.name}</Text>
          {brand.category && (
            <Text style={styles.category} numberOfLines={1}>{brand.category}</Text>
          )}
          {brand.ownerName && (
            <Text style={styles.owner} numberOfLines={1}>{brand.ownerName}</Text>
          )}
        </View>

        <View style={styles.right}>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
          <ChevronRight size={18} color={colors.text.muted} />
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  name: { ...typography.bodyMedium, color: colors.text.primary },
  category: { ...typography.small, color: colors.primary },
  owner: { ...typography.small, color: colors.text.muted },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.status.pending.dot,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },
})
