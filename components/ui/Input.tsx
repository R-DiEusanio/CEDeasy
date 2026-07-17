import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  secureEntry?: boolean
}

export function Input({ label, error, secureEntry = false, ...props }: InputProps) {
  const [hidden, setHidden] = useState(secureEntry)
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.fieldRow, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          {...props}
          secureTextEntry={hidden}
          style={styles.input}
          placeholderTextColor={colors.text.muted}
          autoCapitalize={props.autoCapitalize ?? 'none'}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        />
        {secureEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} style={styles.eyeBtn}>
            {hidden
              ? <Eye size={18} color={colors.text.muted} />
              : <EyeOff size={18} color={colors.text.muted} />}
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.destructive },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
    outlineStyle: 'none', // web only
  } as unknown as TextStyle,
  eyeBtn: { paddingLeft: spacing.sm },
  error: { ...typography.small, color: colors.destructive },
})
