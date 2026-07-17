import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

interface TextareaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label?: string
  error?: string
  minHeight?: number
}

export function Textarea({ label, error, minHeight = 100, ...props }: TextareaProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.text.muted}
        style={[styles.field, { minHeight }, focused && styles.fieldFocused, !!error && styles.fieldError]}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  field: {
    backgroundColor: colors.input,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.destructive },
  error: { ...typography.small, color: colors.destructive },
})
