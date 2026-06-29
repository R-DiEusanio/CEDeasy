import { useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { useCreateBrand } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

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
  const { userId } = useAppStore()
  const { mutateAsync: createBrand } = useCreateBrand()
  const [showSocial, setShowSocial] = useState(false)

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
      })
      Toast.show({ type: 'success', text1: 'Brand creato!' })
      reset()
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <Sheet ref={sheetRef} title="Nuovo cliente" snapPoints={['92%']} scrollable>
      <View style={styles.form}>
        <Controller control={control} name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome brand *" placeholder="Es. Pizzeria Da Mario"
              onChangeText={onChange} onBlur={onBlur} value={value} error={errors.name?.message} />
          )} />
        <Controller control={control} name="category"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Categoria" placeholder="Es. Ristorazione"
              onChangeText={onChange} onBlur={onBlur} value={value ?? ''} />
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
  socialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialLabel: { ...typography.label, color: colors.text.secondary },
})
