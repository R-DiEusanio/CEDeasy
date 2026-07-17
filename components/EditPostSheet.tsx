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
import { useAppStore } from '../src/lib/app-store'
import type { Channel, Post, PostType } from '../src/lib/mock-data'
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
// ma resta un valore DB valido per i post storici — vedi typeOptions più sotto,
// che lo riaggiunge dinamicamente solo se il post in modifica lo usa già.
const POST_TYPES: PostType[] = ['Post', 'Reel', 'Story']
const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
]

interface EditPostSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
  post: Post | null
  onSaved?: () => void
}

// Condiviso tra SMM e cliente (Consulenza) — usa sempre useUpdatePost, già
// funzionante per entrambi grazie alla RLS estesa nella Task 1. "Note interne"
// resta nascosto al cliente: è un campo privato dello SMM.
export function EditPostSheet({ sheetRef, post, onSaved }: EditPostSheetProps) {
  const { role } = useAppStore()
  const isClient = role === 'client'
  const { mutateAsync: updatePost } = useUpdatePost()
  const [postType, setPostType] = useState<PostType>('Post')
  const [channel, setChannel] = useState<Channel>('instagram')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', caption: '', mediaLink: '', internalNotes: '' },
  })

  // Pre-compila i campi quando il post cambia
  useEffect(() => {
    if (!post) return
    setPostType(post.type)
    setChannel(post.channel)
    setDate(new Date(post.date))
    reset({
      title:         post.title,
      caption:       post.caption ?? '',
      mediaLink:     post.mediaLink ?? '',
      internalNotes: post.internalNotes ?? '',
    })
  }, [post?.id])

  const pad = (n: number) => n.toString().padStart(2, '0')
  const isoDate = () => {
    const d = date
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`
  }

  if (!post) return null

  // Riaggiunge "Carosello" come opzione solo se il post lo usa già (valore
  // storico), senza riproporlo per tutti i post come faceva prima.
  const typeOptions = POST_TYPES.includes(post.type) ? POST_TYPES : [...POST_TYPES, post.type]

  const onSubmit = async (data: FormData) => {
    try {
      await updatePost({
        id:  post.id,
        dto: {
          title:     data.title,
          caption:   data.caption ?? '',
          type:      postType,
          channel,
          date:      isoDate(),
          mediaLink: data.mediaLink || undefined,
          // Il cliente non vede mai il campo: non va rimandato in scrittura,
          // altrimenti sovrascriverebbe una nota SMM più recente con il valore
          // stantio pre-caricato nel form al momento dell'apertura.
          ...(isClient ? {} : { internalNotes: data.internalNotes || undefined }),
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
    <Sheet ref={sheetRef} title="Modifica post" snapPoints={['95%']} scrollable>
      <View style={styles.form}>

        {/* Feedback cliente in evidenza */}
        {!!post.feedback && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>Feedback cliente</Text>
            <Text style={styles.feedbackText}>{post.feedback}</Text>
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
              {typeOptions.map((t) => (
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
  feedbackBox: {
    backgroundColor: colors.status.changes.bg,
    padding: spacing.md,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.changes.dot,
    gap: 4,
  },
  feedbackLabel: { ...typography.label, color: colors.status.changes.text },
  feedbackText:  { ...typography.body, color: colors.status.changes.text },
  field: { gap: spacing.xs },
  dualRow: { flexDirection: 'row', gap: spacing.md },
  dualField: { flex: 1 },
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
