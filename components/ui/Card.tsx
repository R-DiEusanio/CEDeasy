import { StyleSheet, View, type ViewProps } from 'react-native'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'

interface CardProps extends ViewProps {
  padding?: number
}

export function Card({ style, padding = spacing.lg, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
})
