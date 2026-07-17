import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Button } from './ui/Button'
import { useUpdateBrand } from '../src/lib/queries'
import type { Brand, Channel } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

interface FormData {
  toneOfVoice: string
  obiettivo: string
  target: string
  posizionamento: string
  frequenzaPubblicazione: string
  hashtagRicorrenti: string
  linkUtili: string
}

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
]

interface StrategiaSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
  brand: Brand | null
}

// I campi chiave (ToV/Obiettivo/Target/Posizionamento) diventano i chip colorati
// mostrati sotto il nome del cliente in lista/dettaglio (BrandCard, [brandId].tsx)
// non appena compilati qui — SMM-only, vedi trigger prevent_client_brand_field_change.
export function StrategiaSheet({ sheetRef, brand }: StrategiaSheetProps) {
  const { mutateAsync: updateBrand, isPending } = useUpdateBrand()
  const [canaliAttivi, setCanaliAttivi] = useState<Channel[]>([])

  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      toneOfVoice: '', obiettivo: '', target: '', posizionamento: '',
      frequenzaPubblicazione: '', hashtagRicorrenti: '', linkUtili: '',
    },
  })

  useEffect(() => {
    if (!brand) return
    reset({
      toneOfVoice: brand.toneOfVoice ?? '',
      obiettivo: brand.obiettivo ?? '',
      target: brand.target ?? '',
      posizionamento: brand.posizionamento ?? '',
      frequenzaPubblicazione: brand.frequenzaPubblicazione ?? '',
      hashtagRicorrenti: brand.hashtagRicorrenti ?? '',
      linkUtili: brand.linkUtili ?? '',
    })
    setCanaliAttivi(brand.canaliAttivi ?? [])
  }, [brand?.id])

  if (!brand) return null

  const toggleCanale = (c: Channel) => {
    setCanaliAttivi((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const onSubmit = async (data: FormData) => {
    try {
      await updateBrand({
        id: brand.id,
        dto: {
          toneOfVoice: data.toneOfVoice || undefined,
          obiettivo: data.obiettivo || undefined,
          target: data.target || undefined,
          posizionamento: data.posizionamento || undefined,
          frequenzaPubblicazione: data.frequenzaPubblicazione || undefined,
          canaliAttivi,
          hashtagRicorrenti: data.hashtagRicorrenti || undefined,
          linkUtili: data.linkUtili || undefined,
        },
      })
      Toast.show({ type: 'success', text1: 'Strategia salvata!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <Sheet ref={sheetRef} title={`Strategia · ${brand.name}`} snapPoints={['95%']} scrollable>
      <View style={styles.form}>
        <Controller control={control} name="toneOfVoice"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Tono di voce" placeholder="Es. Amichevole e verace"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <Controller control={control} name="obiettivo"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Obiettivo" placeholder="Es. Più clienti nel weekend"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <Controller control={control} name="target"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Target" placeholder="Es. Famiglie 30-55"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <Controller control={control} name="posizionamento"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Posizionamento" placeholder="Es. La vera napoletana del quartiere"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <Controller control={control} name="frequenzaPubblicazione"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Frequenza di pubblicazione" placeholder="Es. 3 post a settimana"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Canali attivi</Text>
          <View style={styles.channelRow}>
            {CHANNELS.map((c) => {
              const active = canaliAttivi.includes(c.key)
              return (
                <Pressable
                  key={c.key}
                  style={[styles.channelBtn, active && styles.channelBtnActive]}
                  onPress={() => toggleCanale(c.key)}
                >
                  <Text style={[styles.channelBtnText, active && styles.channelBtnTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Controller control={control} name="hashtagRicorrenti"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea label="Hashtag ricorrenti" placeholder="#pizzanapoletana #dagigi"
              onChangeText={onChange} onBlur={onBlur} value={value} minHeight={60} />
          )} />

        <Controller control={control} name="linkUtili"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Link utili" placeholder="dagigi.it/menu" autoCapitalize="none"
              onChangeText={onChange} onBlur={onBlur} value={value} />
          )} />

        <Button label="Salva strategia" onPress={handleSubmit(onSubmit)} loading={isPending} fullWidth />
        <Text style={styles.hint}>I campi chiave diventano tag colorati sotto il nome del cliente</Text>
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  form: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  channelRow: { flexDirection: 'row', gap: spacing.sm },
  channelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  channelBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  channelBtnText: { ...typography.smallMedium, color: colors.text.secondary },
  channelBtnTextActive: { color: colors.primary },
  hint: { ...typography.small, color: colors.text.muted, textAlign: 'center' },
})
