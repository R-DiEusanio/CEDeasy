import { useState } from 'react'
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
import { Briefcase, User } from 'lucide-react-native'
import { supabase } from '../../src/lib/supabase'
import { upsertProfile } from '../../src/lib/supabase/profiles'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

type Role = 'SMM' | 'CLIENT'

const schema = z
  .object({
    fullName: z.string().min(2, 'Nome troppo corto (min. 2 caratteri)'),
    email: z.string().email('Email non valida'),
    password: z.string().min(8, 'Password troppo corta (min. 8 caratteri)'),
    confirmPassword: z.string(),
    brandId: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterScreen() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('SMM')

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', brandId: '' },
  })

  const onSubmit = async (data: FormData) => {
    if (role === 'CLIENT' && !data.brandId?.trim()) {
      Toast.show({ type: 'error', text1: 'Brand ID mancante', text2: 'Inserisci il Brand ID fornito dal tuo SMM' })
      return
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error) {
      Toast.show({ type: 'error', text1: 'Registrazione fallita', text2: error.message })
      return
    }

    try {
      await upsertProfile(data.fullName, role, role === 'CLIENT' ? data.brandId : undefined)
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
        <Text style={styles.subheading}>Scegli il tuo ruolo per iniziare</Text>

        {/* Selezione ruolo */}
        <View style={styles.roleRow}>
          <RoleCard
            icon={Briefcase}
            label="Social Media Manager"
            description="Gestisci i contenuti dei tuoi clienti"
            selected={role === 'SMM'}
            onPress={() => setRole('SMM')}
          />
          <RoleCard
            icon={User}
            label="Cliente"
            description="Approva i contenuti del tuo SMM"
            selected={role === 'CLIENT'}
            onPress={() => setRole('CLIENT')}
          />
        </View>

        {/* Campi form */}
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

          {role === 'CLIENT' && (
            <Controller
              control={control}
              name="brandId"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Brand ID"
                  placeholder="Fornito dal tuo Social Media Manager"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.brandId?.message}
                />
              )}
            />
          )}

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
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface RoleCardProps {
  icon: typeof Briefcase
  label: string
  description: string
  selected: boolean
  onPress: () => void
}

function RoleCard({ icon: Icon, label, description, selected, onPress }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleCard, selected && styles.roleCardSelected]}
    >
      <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
        <Icon size={22} color={selected ? colors.primaryForeground : colors.text.secondary} />
      </View>
      <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{label}</Text>
      <Text style={styles.roleDescription}>{description}</Text>
    </Pressable>
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
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: { backgroundColor: colors.primary },
  roleLabel: { ...typography.smallMedium, color: colors.text.primary },
  roleLabelSelected: { color: colors.primary },
  roleDescription: { ...typography.caption, color: colors.text.secondary },
  form: { gap: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.body, color: colors.text.secondary },
  link: { ...typography.bodyMedium, color: colors.primary },
})
