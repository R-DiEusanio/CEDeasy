import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { supabase } from '../../../src/lib/supabase'
import { upsertProfile } from '../../../src/lib/supabase/profiles'
import { validateInviteCode, acceptInviteCode } from '../../../src/lib/supabase/invites'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

const schema = z
  .object({
    fullName: z.string().min(2, 'Nome troppo corto (min. 2 caratteri)'),
    email: z.string().email('Email non valida'),
    password: z.string().min(8, 'Password troppo corta (min. 8 caratteri)'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

// Arrivo da un Link Magico (cedeasy://join/<code>) o da "Ho un codice"
// (app/(auth)/join/index.tsx, che spinge qui con lo stesso code). Nessun campo
// "Codice Cliente" da digitare a mano: il brand è già risolto dal codice.
export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [brandId, setBrandId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!code) return
    validateInviteCode(code)
      .then(({ brandId: id, brandName: name }) => {
        setBrandId(id)
        setBrandName(name)
        setState('valid')
      })
      .catch(() => setState('invalid'))
  }, [code])

  const onSubmit = async (data: FormData) => {
    if (!brandId) return

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, role: 'CLIENT', brand_id: brandId },
      },
    })

    if (error) {
      Toast.show({ type: 'error', text1: 'Registrazione fallita', text2: error.message })
      return
    }

    try {
      await upsertProfile(data.fullName, 'CLIENT', brandId)
      // Consuma il codice solo ora che la registrazione è andata a buon fine.
      await acceptInviteCode(code)
      Toast.show({ type: 'success', text1: 'Sei dentro!', text2: 'Accedi con le tue credenziali' })
      router.replace('/(auth)/login')
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  if (state === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (state === 'invalid') {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>Codice non valido</Text>
        <Text style={styles.subheading}>
          Questo invito non esiste più o è già stato usato. Chiedi al tuo SMM di generarne uno nuovo.
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Unisciti a {brandName}</Text>
        <Text style={styles.subheading}>Crea il tuo account cliente per approvare i contenuti</Text>

        <View style={styles.form}>
          <Controller control={control} name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nome completo" placeholder="Mario Rossi" autoCapitalize="words"
                onChangeText={onChange} onBlur={onBlur} value={value} error={errors.fullName?.message} />
            )} />
          <Controller control={control} name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Email" placeholder="nome@esempio.com" keyboardType="email-address"
                onChangeText={onChange} onBlur={onBlur} value={value} error={errors.email?.message} />
            )} />
          <Controller control={control} name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Password" placeholder="Minimo 8 caratteri" secureEntry
                onChangeText={onChange} onBlur={onBlur} value={value} error={errors.password?.message} />
            )} />
          <Controller control={control} name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Conferma password" placeholder="Ripeti la password" secureEntry
                onChangeText={onChange} onBlur={onBlur} value={value} error={errors.confirmPassword?.message} />
            )} />

          <Button label="Crea account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  heading: { ...typography.h2, color: colors.text.primary, textAlign: 'center' },
  subheading: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  form: { gap: spacing.lg },
})
