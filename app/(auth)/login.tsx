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
import { getMyProfile } from '../../src/lib/supabase/profiles'
import { getMyBrandId } from '../../src/lib/supabase/profiles'
import { useAppStore } from '../../src/lib/app-store'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password obbligatoria'),
})
type FormData = z.infer<typeof schema>

export default function LoginScreen() {
  const router = useRouter()
  const { setRole, setActiveBrandId } = useAppStore()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      Toast.show({ type: 'error', text1: 'Accesso fallito', text2: error.message })
      return
    }

    try {
      const profile = await getMyProfile()
      const role = profile.role === 'SMM' ? 'smm' : 'client'
      setRole(role)

      if (role === 'client') {
        const brandId = await getMyBrandId()
        setActiveBrandId(brandId)
        router.replace('/(client)')
      } else {
        router.replace('/(smm)')
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Errore', text2: 'Impossibile caricare il profilo' })
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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.appName}>CedEasy</Text>
          <Text style={styles.tagline}>Gestisci i tuoi contenuti social</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
                placeholder="La tua password"
                secureEntry
                autoComplete="password"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            label="Accedi"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>

        {/* Link registrazione */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Non hai un account?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}> Registrati</Text>
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
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    gap: spacing['3xl'],
  },
  logoArea: { alignItems: 'center', gap: spacing.sm },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  appName: { ...typography.h1, color: colors.text.primary },
  tagline: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  form: { gap: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.body, color: colors.text.secondary },
  link: { ...typography.bodyMedium, color: colors.primary },
})
