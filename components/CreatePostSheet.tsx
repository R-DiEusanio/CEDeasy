import { useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
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
import { useCreatePost } from '../src/lib/queries'
import type { PostType } from '../src/lib/mock-data'
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

const POST_TYPES: PostType[] = ['Post', 'Reel', 'Carosello', 'Story']

interface CreatePostSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  brandId: string
  defaultDate?: Date
}

export function CreatePostSheet({ sheetRef, brandId, defaultDate }: CreatePostSheetProps) {
  const { mutateAsync: createPost } = useCreatePost()
  const [postType, setPostType] = useState<PostType>('Post')
  const [date, setDate] = useState(defaultDate ?? new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    if (defaultDate) setDate(defaultDate)
  }, [defaultDate])
  const [showTimePicker, setShowTimePicker] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', caption: '', mediaLink: '', internalNotes: '' },
  })

  const pad = (n: number) => n.toString().padStart(2, '0')
  const isoDate = () => {
    const d = date
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createPost({
        brandId,
        title:         data.title,
        caption:       data.caption ?? '',
        type:          postType,
        date:          isoDate(),
        status:        'draft',
        mediaLink:     data.mediaLink || undefined,
        internalNotes: data.internalNotes || undefined,
      })
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
        {/* Tipo */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tipo</Text>
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

        {/* Data + ora */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
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
          <View style={styles.dateField}>
            <Text style={styles.fieldLabel}>Ora</Text>
            <Pressable style={styles.datePill} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.datePillText}>
                {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowDatePicker(false)
              if (selected) {
                const merged = new Date(selected)
                merged.setHours(date.getHours(), date.getMinutes())
                setDate(merged)
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowTimePicker(false)
              if (selected) {
                const merged = new Date(date)
                merged.setHours(selected.getHours(), selected.getMinutes())
                setDate(merged)
              }
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
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
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
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateField: { flex: 1, gap: spacing.xs },
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
