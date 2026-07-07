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
import { useUpdatePost } from '../src/lib/queries'
import type { Post, PostType } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const schema = z.object({
  title:     z.string().min(1, 'Titolo obbligatorio'),
  caption:   z.string().optional(),
  mediaLink: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const POST_TYPES: PostType[] = ['Post', 'Reel', 'Carosello', 'Story']

interface EditClientPostSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  post: Post | null
  onSaved?: () => void
}

// Modifica post lato Cliente (Consulenza), mentre è ancora CLIENT_DRAFT o SMM_REVIEW
// (Task 3.2). Niente "Note interne": è un campo privato dello SMM, il cliente non
// deve vederlo né poterlo sovrascrivere (a differenza di EditPostSheet, uso SMM).
export function EditClientPostSheet({ sheetRef, post, onSaved }: EditClientPostSheetProps) {
  const { mutateAsync: updatePost } = useUpdatePost()
  const [postType, setPostType] = useState<PostType>('Post')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', caption: '', mediaLink: '' },
  })

  useEffect(() => {
    if (!post) return
    setPostType(post.type)
    setDate(new Date(post.date))
    reset({
      title:     post.title,
      caption:   post.caption ?? '',
      mediaLink: post.mediaLink ?? '',
    })
  }, [post?.id])

  const pad = (n: number) => n.toString().padStart(2, '0')
  const isoDate = () => {
    const d = date
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`
  }

  if (!post) return null

  const onSubmit = async (data: FormData) => {
    try {
      await updatePost({
        id:  post.id,
        dto: {
          title:     data.title,
          caption:   data.caption ?? '',
          type:      postType,
          date:      isoDate(),
          mediaLink: data.mediaLink || undefined,
        },
      })
      Toast.show({ type: 'success', text1: 'Post aggiornato!' })
      sheetRef.current?.dismiss()
      onSaved?.()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <Sheet ref={sheetRef} title="Modifica post" snapPoints={['92%']} scrollable>
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

        <Button
          label="Salva modifiche"
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
