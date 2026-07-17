import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { supabase } from '../../src/lib/supabase'
import { upsertProfile } from '../../src/lib/supabase/profiles'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

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

// Registrazione libera = sempre SMM (Task 10). Un cliente non si registra mai
// da qui: arriva sempre da un Link Magico o un Codice Invito (vedi
// app/(auth)/join/), che collega automaticamente il brand corretto.
export default function RegisterScreen() {
  const router = useRouter()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: FormData) => {
    // Il trigger DB on_auth_user_created (handle_new_user) crea già la riga in
    // profiles leggendo questi metadata — se non passati qui, inserisce role
    // sbagliato (default 'CLIENT') e upsertProfile() non lo corregge più:
    // trovando il profilo già esistente aggiorna solo full_name.
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, role: 'SMM' },
      },
    })

    if (error) {
      Toast.show({ type: 'error', text1: 'Registrazione fallita', text2: error.message })
      return
    }

    try {
      await upsertProfile(data.fullName, 'SMM')
      Toast.show({ type: 'success', text1: 'Account creato!', text2: 'Accedi con le tue credenziali' })
      router.replace('/(auth)/login')
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore profilo', text2: e.message })
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Crea un account</Text>
        <Text style={styles.subheading}>Per gestire i contenuti dei tuoi clienti</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nome completo"
                placeholder="Mario Rossi"
                autoComplete="name"
                autoCapitalize="words"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="nome@esempio.com"
                keyboardType="email-address"
                autoComplete="email"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Minimo 8 caratteri"
                secureEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Conferma password"
                placeholder="Ripeti la password"
                secureEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            label="Crea account"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>

        {/* Link login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Hai già un account?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}> Accedi</Text>
          </Pressable>
        </View>

        {/* Sei un cliente invitato? */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Hai ricevuto un invito da un cliente?</Text>
          <Pressable onPress={() => router.push('/(auth)/join')}>
            <Text style={styles.link}> Ho un codice</Text>
          </Pressable>
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  footerText: { ...typography.body, color: colors.text.secondary },
  link: { ...typography.bodyMedium, color: colors.primary },
})
