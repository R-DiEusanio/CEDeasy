import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image, Film, LayoutGrid, Zap, User } from 'lucide-react-native'
import type { Post } from '../src/lib/mock-data'
import { getVisualStatus } from '../src/lib/status-config'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatScheduledDate } from '../src/lib/utils'

const TYPE_ICON = {
  Post:      { Icon: Image,      color: '#3b82f6' },
  Reel:      { Icon: Film,       color: '#8b5cf6' },
  Carosello: { Icon: LayoutGrid, color: '#10b981' },
  Story:     { Icon: Zap,        color: '#f59e0b' },
}

interface PostCardProps {
  post: Post
  onPress?: () => void
}

export function PostCard({ post, onPress }: PostCardProps) {
  const { Icon, color } = TYPE_ICON[post.type] ?? TYPE_ICON['Post']
  const visualStatus = getVisualStatus(post.status, post.hasChangesRequested)
  const awaitingSmmReview = post.workMode === 'consulenza' && visualStatus === 'pending'

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.card} padding={spacing.md}>
        {/* Riga superiore: icona tipo + titolo */}
        <View style={styles.topRow}>
          <View style={[styles.typeIcon, { backgroundColor: color + '20' }]}>
            <Icon size={16} color={color} />
          </View>
          <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
        </View>

        {/* Proposto dal cliente, in attesa di revisione SMM */}
        {awaitingSmmReview && (
          <View style={styles.proposedChip}>
            <Text style={styles.proposedChipText}>Proposto dal cliente · da rivedere</Text>
          </View>
        )}

        {/* Cliente */}
        {!!post.brandName && (
          <View style={styles.clientRow}>
            <User size={11} color={colors.text.muted} />
            <Text style={styles.clientName}>{post.brandName}</Text>
          </View>
        )}

        {/* Caption preview */}
        {!!post.caption && (
          <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
        )}

        {/* Riga inferiore: data + badge */}
        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatScheduledDate(post.date)}</Text>
          <Badge status={visualStatus} />
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },
  caption: { ...typography.small, color: colors.text.secondary, lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { ...typography.small, color: colors.text.muted },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName: { ...typography.small, color: colors.text.muted, fontStyle: 'italic' },
  proposedChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: colors.status.pending.bg,
  },
  proposedChipText: { ...typography.caption, color: colors.status.pending.text, fontWeight: '600' },
})
