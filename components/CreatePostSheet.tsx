import { useEffect, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Button } from './ui/Button'
import { useCreatePost, useCreateClientPost, useBrands } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import type { Channel, PostType } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const schema = z.object({
  title:         z.string().min(1, 'Titolo obbligatorio'),
  caption:       z.string().optional(),
  mediaLink:     z.string().optional(),
  internalNotes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// "Carosello" non è più un'opzione in UI (non presente nelle foto di riferimento),
// ma resta un valore DB valido per i post storici già salvati con quel formato.
const POST_TYPES: PostType[] = ['Post', 'Reel', 'Story']
const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
]

interface CreatePostSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
  // Brand pre-selezionato (es. aperto dalla scheda di un cliente specifico) —
  // resta comunque cambiabile dal picker "Cliente" nello sheet. Se omesso (es.
  // aperto con "Tutti" selezionato in Calendario/Griglia), lo SMM deve sceglierlo.
  defaultBrandId?: string
  defaultDate?: Date
}

// Condiviso tra SMM (Gestione, picker "Cliente" nello sheet) e cliente (Consulenza,
// brandId derivato server-side da useCreateClientPost, nessun picker per lui — crea
// sempre per il proprio unico brand). "Note interne" è un campo privato SMM.
export function CreatePostSheet({ sheetRef, defaultBrandId, defaultDate }: CreatePostSheetProps) {
  const { role, userId, smmMode } = useAppStore()
  const isClient = role === 'client'
  const { data: brands } = useBrands(userId)
  const filteredBrands = (brands ?? []).filter((b) => b.workMode === smmMode)
  const { mutateAsync: createPost } = useCreatePost()
  const { mutateAsync: createClientPost } = useCreateClientPost()
  const [targetBrandId, setTargetBrandId] = useState<string | null>(defaultBrandId ?? null)
  const [postType, setPostType] = useState<PostType>('Post')
  const [channel, setChannel] = useState<Channel>('instagram')
  const [date, setDate] = useState(defaultDate ?? new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (defaultDate) setDate(defaultDate)
  }, [defaultDate])

  useEffect(() => {
    setTargetBrandId(defaultBrandId ?? null)
  }, [defaultBrandId])

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', caption: '', mediaLink: '', internalNotes: '' },
  })

  const pad = (n: number) => n.toString().padStart(2, '0')
  const isoDate = () => {
    const d = date
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`
  }

  const onSubmit = async (data: FormData) => {
    if (!isClient && !targetBrandId) {
      Toast.show({ type: 'error', text1: 'Seleziona un cliente' })
      return
    }
    try {
      if (isClient) {
        await createClientPost({
          title:     data.title,
          caption:   data.caption ?? '',
          type:      postType,
          channel,
          date:      isoDate(),
          mediaLink: data.mediaLink || undefined,
        })
      } else {
        await createPost({
          brandId: targetBrandId!,
          title:         data.title,
          caption:       data.caption ?? '',
          type:          postType,
          channel,
          date:          isoDate(),
          status:        'bozza_privata',
          mediaLink:     data.mediaLink || undefined,
          internalNotes: data.internalNotes || undefined,
        })
      }
      Toast.show({ type: 'success', text1: 'Post creato!' })
      reset()
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <Sheet ref={sheetRef} title="Nuovo post" snapPoints={['95%']} scrollable>
      <View style={styles.form}>
        {/* Cliente (solo SMM — il cliente crea sempre per il proprio unico brand) */}
        {!isClient && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.clientRow}>
                {filteredBrands.map((b) => (
                  <Pressable
                    key={b.id}
                    style={[styles.clientPill, targetBrandId === b.id && styles.typeBtnActive]}
                    onPress={() => setTargetBrandId(b.id)}
                  >
                    <Text
                      style={[styles.typeBtnText, targetBrandId === b.id && styles.typeBtnTextActive]}
                      numberOfLines={1}
                    >
                      {b.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Canale + Formato */}
        <View style={styles.dualRow}>
          <View style={[styles.field, styles.dualField]}>
            <Text style={styles.fieldLabel}>Canale</Text>
            <View style={styles.typeRow}>
              {CHANNELS.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.typeBtn, channel === c.key && styles.typeBtnActive]}
                  onPress={() => setChannel(c.key)}
                >
                  <Text style={[styles.typeBtnText, channel === c.key && styles.typeBtnTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.field, styles.dualField]}>
            <Text style={styles.fieldLabel}>Formato</Text>
            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeBtn, postType === t && styles.typeBtnActive]}
                  onPress={() => setPostType(t)}
                >
                  <Text style={[styles.typeBtnText, postType === t && styles.typeBtnTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Titolo *"
              placeholder="Es. Post prodotto estate"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="caption"
          render={({ field: { onChange, onBlur, value } }) => (
            <Textarea
              label="Caption"
              placeholder="Testo del post..."
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              minHeight={80}
            />
          )}
        />

        {/* Data */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Data</Text>
          <Pressable style={styles.datePill} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePillText}>
              {date.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowDatePicker(false)
              if (selected) setDate(selected)
            }}
          />
        )}

        <Controller
          control={control}
          name="mediaLink"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Link media"
              placeholder="https://drive.google.com/..."
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
            />
          )}
        />

        {!isClient && (
          <Controller
            control={control}
            name="internalNotes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                label="Note interne"
                placeholder="Visibili solo a te..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
                minHeight={60}
              />
            )}
          />
        )}

        <Button
          label="Crea post"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  form: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  dualRow: { flexDirection: 'row', gap: spacing.md },
  dualField: { flex: 1 },
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  clientRow: { flexDirection: 'row', gap: spacing.sm },
  clientPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  typeBtnText: { ...typography.smallMedium, color: colors.text.secondary },
  typeBtnTextActive: { color: colors.primary },
  datePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  datePillText: { ...typography.body, color: colors.text.primary },
})
