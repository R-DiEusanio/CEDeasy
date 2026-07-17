import { StyleSheet, Text, View } from 'react-native'
import { getBrandInitials, getBrandHue } from '../../src/lib/mock-data'
import { radius } from '../../constants/spacing'
import { typography } from '../../constants/typography'

interface AvatarProps {
  name: string
  id?: string
  size?: number
  // Colore esplicito (hex, es. da BRAND_COLOR_HEX) — se assente, ricade sul
  // colore deterministico calcolato dall'id (comportamento pre-esistente).
  color?: string
}

export function Avatar({ name, id = name, size = 40, color }: AvatarProps) {
  const initials = getBrandInitials(name)
  const hue = getBrandHue(id)
  const bg = color ? `${color}33` : `hsl(${hue}, 60%, 88%)`
  const textColor = color ?? `hsl(${hue}, 55%, 30%)`

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { color: textColor, fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { ...typography.label, lineHeight: undefined },
})
