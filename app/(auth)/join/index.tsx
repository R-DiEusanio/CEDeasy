import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

// Punto d'ingresso per chi ha ricevuto un Codice Invito testuale (non un Link
// Magico tappabile) — valida il codice spingendo su join/[code], stessa
// schermata di registrazione cliente di chi arriva da un link.
export default function JoinManualScreen() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const onContinue = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    router.push(`/(auth)/join/${encodeURIComponent(trimmed)}`)
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Ho un codice invito</Text>
        <Text style={styles.subheading}>Inserisci il codice fornito dal tuo Social Media Manager</Text>

        <View style={styles.form}>
          <Input
            label="Codice Invito"
            placeholder="Es. SMM-MARIO-123"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
          <Button label="Continua" onPress={onContinue} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  heading: { ...typography.h2, color: colors.text.primary },
  subheading: { ...typography.body, color: colors.text.secondary },
  form: { gap: spacing.lg },
})
