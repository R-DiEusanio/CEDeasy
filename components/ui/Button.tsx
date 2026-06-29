import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        (pressed || isDisabled) && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.text.inverse}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },

  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.destructive },

  label: { ...typography.bodyMedium },
  label_primary: { color: colors.text.inverse },
  label_secondary: { color: colors.primary },
  label_ghost: { color: colors.text.secondary },
  label_destructive: { color: colors.text.inverse },
})
