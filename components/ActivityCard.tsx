import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CheckCircle, AlertTriangle, FilePlus, MessageSquare, User } from 'lucide-react-native'
import type { Activity } from '../src/lib/supabase/posts'
import { Card } from './ui/Card'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const ICON_MAP = {
  approved:           { Icon: CheckCircle, color: colors.status.approved.dot },
  revision_requested: { Icon: AlertTriangle, color: colors.status.changes.dot },
  new_post:           { Icon: FilePlus, color: colors.primary },
  client_proposed:    { Icon: MessageSquare, color: colors.status.pending.dot },
}

interface ActivityCardProps {
  activity: Activity
  onPress?: () => void
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { Icon, color } = ICON_MAP[activity.type]

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={styles.card} padding={spacing.md}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message} numberOfLines={2}>{activity.message}</Text>
          {!!activity.brandName && (
            <View style={styles.clientRow}>
              <User size={11} color={colors.text.muted} />
              <Text style={styles.clientName}>{activity.brandName}</Text>
            </View>
          )}
          <Text style={styles.time}>{activity.time}</Text>
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 2 },
  message: { ...typography.bodyMedium, color: colors.text.primary },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clientName: { ...typography.small, color: colors.text.muted, fontStyle: 'italic' },
  time: { ...typography.small, color: colors.text.muted },
})
