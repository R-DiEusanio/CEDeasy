import { useState } from 'react'
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronUp, X } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { useCreateBrand } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import type { WorkMode } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const CATEGORIES = ['Ristorazione', 'Benessere', 'Abbigliamento', 'Fitness', 'Tecnologia']
const EXTRA_CATEGORIES = ['Finanza']

const WORK_MODES: { value: WorkMode; label: string; hint: string }[] = [
  { value: 'gestione',   label: 'Gestione',   hint: 'Crei tu i post, il cliente li approva.' },
  { value: 'consulenza', label: 'Consulenza', hint: 'Il cliente crea i post, tu suggerisci/modifichi/approvi.' },
]

const schema = z.object({
  name:     z.string().min(1, 'Nome obbligatorio'),
  category: z.string().optional(),
  ownerName:z.string().optional(),
  email:    z.string().email('Email non valida').optional().or(z.literal('')),
  phone:    z.string().optional(),
  instagramUrl: z.string().optional(),
  tiktokUrl:    z.string().optional(),
  facebookUrl:  z.string().optional(),
  linkedinUrl:  z.string().optional(),
  telegramUrl:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface CreateBrandSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
}

export function CreateBrandSheet({ sheetRef }: CreateBrandSheetProps) {
  const { userId, smmMode } = useAppStore()
  const { mutateAsync: createBrand } = useCreateBrand()
  const [showSocial, setShowSocial] = useState(false)
  const [showExtraModal, setShowExtraModal] = useState(false)
  // Default alla modalità della tab attiva in dashboard — modificabile prima di salvare
  const [workMode, setWorkMode] = useState<WorkMode>(smmMode)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: '', ownerName: '', email: '', phone: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await createBrand({
        name:         data.name,
        category:     data.category || undefined,
        ownerName:    data.ownerName || undefined,
        email:        data.email || undefined,
        phone:        data.phone || undefined,
        instagramUrl: data.instagramUrl || undefined,
        tiktokUrl:    data.tiktokUrl || undefined,
        facebookUrl:  data.facebookUrl || undefined,
        linkedinUrl:  data.linkedinUrl || undefined,
        telegramUrl:  data.telegramUrl || undefined,
        smmId:        userId!,
        workMode,
      })
      Toast.show({ type: 'success', text1: 'Brand creato!' })
      reset()
      setWorkMode(smmMode)
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <Sheet ref={sheetRef} title="Nuovo cliente" snapPoints={['92%']} scrollable>
      <View style={styles.form}>
        {/* Modalità cliente */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Modalità</Text>
          <View style={styles.modeRow}>
            {WORK_MODES.map((m) => {
              const active = workMode === m.value
              return (
                <Pressable
                  key={m.value}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => setWorkMode(m.value)}
                >
                  <Text style={[styles.modeBtnLabel, active && styles.modeBtnLabelActive]}>{m.label}</Text>
                </Pressable>
              )
            })}
          </View>
          <Text style={styles.modeHint}>
            {WORK_MODES.find((m) => m.value === workMode)?.hint}
          </Text>
        </View>

        <Controller control={control} name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome brand *" placeholder="Es. Pizzeria Da Mario"
              onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )} />

        <Controller control={control} name="category"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.categoryGroup}>
              <Input label="Categoria" placeholder="Es. Ristorazione"
                onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
              <View style={styles.chips}>
                {CATEGORIES.map((cat) => {
                  const active = value === cat
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onChange(active ? '' : cat)}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat}</Text>
                    </Pressable>
                  )
                })}
                <Pressable
                  style={[styles.chip, EXTRA_CATEGORIES.includes(value ?? '') && styles.chipActive]}
                  onPress={() => setShowExtraModal(true)}
                >
                  <Text style={[styles.chipLabel, EXTRA_CATEGORIES.includes(value ?? '') && styles.chipLabelActive]}>
                    Altro
                  </Text>
                </Pressable>
              </View>

              {/* Overlay extra categorie */}
              <Modal
                visible={showExtraModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExtraModal(false)}
              >
                <Pressable style={styles.overlay} onPress={() => setShowExtraModal(false)}>
                  <Pressable style={styles.extraBox} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.extraHeader}>
                      <Text style={styles.extraTitle}>Altre categorie</Text>
                      <Pressable onPress={() => setShowExtraModal(false)}>
                        <X size={18} color={colors.text.secondary} />
                      </Pressable>
                    </View>
                    <View style={styles.chips}>
                      {EXTRA_CATEGORIES.map((cat) => {
                        const active = value === cat
                        return (
                          <Pressable
                            key={cat}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => {
                              onChange(active ? '' : cat)
                              setShowExtraModal(false)
                            }}
                          >
                            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat}</Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
          )} />

        <Controller control={control} name="ownerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome proprietario" placeholder="Es. Mario Rossi"
              autoCapitalize="words" onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
          )} />
        <Controller control={control} name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Email" placeholder="brand@esempio.com" keyboardType="email-address"
              onChangeText={onChange} onBlur={onBlur} value={value ?? ''} error={errors.email?.message} />
          )} />
        <Controller control={control} name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Telefono" placeholder="+39 333 000 0000" keyboardType="phone-pad"
              onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
          )} />

        {/* Social links collapsibili */}
        <Pressable style={styles.socialToggle} onPress={() => setShowSocial((v) => !v)}>
          <Text style={styles.socialLabel}>Link social</Text>
          {showSocial
            ? <ChevronUp size={18} color={colors.text.secondary} />
            : <ChevronDown size={18} color={colors.text.secondary} />}
        </Pressable>

        {showSocial && (
          <>
            {(['instagramUrl', 'tiktokUrl', 'facebookUrl', 'linkedinUrl', 'telegramUrl'] as const).map((field) => (
              <Controller key={field} control={control} name={field}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={field.replace('Url', '').replace(/^./, c => c.toUpperCase())}
                    placeholder="https://..."
                    autoCapitalize="none"
                    onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
                )} />
            ))}
          </>
        )}

        <Button label="Crea cliente" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  form: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  modeBtnLabel: { ...typography.smallMedium, color: colors.text.secondary },
  modeBtnLabelActive: { color: colors.primary },
  modeHint: { ...typography.small, color: colors.text.muted },
  socialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialLabel: { ...typography.label, color: colors.text.secondary },
  categoryGroup: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  chipLabel: { ...typography.small, color: colors.text.secondary },
  chipLabelActive: { color: colors.primary, fontWeight: '600' },

  // overlay extra categorie
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  extraBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  extraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraTitle: { ...typography.h3, color: colors.text.primary },
})
