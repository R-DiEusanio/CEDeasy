import { StyleSheet, Text, View } from 'react-native'
import { STATUS_CONFIG, type VisualStatus } from '../../src/lib/status-config'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

interface BadgeProps {
  status: VisualStatus
  showDot?: boolean
}

export function Badge({ status, showDot = true }: BadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <View style={[styles.badge, { backgroundColor: config.badgeColor }]}>
      {showDot && (
        <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      )}
      <Text style={[styles.label, { color: config.badgeTextColor }]}>
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.smallMedium,
  },
})
