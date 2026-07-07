import { useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { ExternalLink } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import type { Post } from '../src/lib/mock-data'
import type { CommentTargetField } from '../src/lib/supabase/comments'
import { getVisualStatus } from '../src/lib/status-config'
import { useUpdatePostStatus, useComments } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import { Sheet } from './ui/BottomSheet'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { EditClientPostSheet } from './EditClientPostSheet'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatScheduledDate, formatScheduledTime, formatRelativeDate } from '../src/lib/utils'

const FIELD_LABELS: Record<CommentTargetField, string> = {
  title:          'Titolo',
  caption:        'Caption',
  platform:       'Tipo',
  media_link:     'Media',
  scheduled_date: 'Data',
}

interface ClientPostDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  post: Post | null
}

// Suggerimenti SMM ancorati a un campo — mostrati vicino alla sezione pertinente,
// non in un thread generico (Task 7.2, Q3).
function FieldSuggestions({ field, comments }: { field: CommentTargetField; comments: { id: string; body: string; createdAt: string }[] }) {
  if (!comments.length) return null
  return (
    <View style={styles.suggestionsBox}>
      <Text style={styles.suggestionsTitle}>💡 Suggerimento SMM · {FIELD_LABELS[field]}</Text>
      {comments.map((c) => (
        <View key={c.id} style={styles.suggestionItem}>
          <Text style={styles.suggestionBody}>{c.body}</Text>
          <Text style={styles.suggestionTime}>{formatRelativeDate(c.createdAt)}</Text>
        </View>
      ))}
    </View>
  )
}

export function ClientPostDetailSheet({ sheetRef, post }: ClientPostDetailSheetProps) {
  const { userId } = useAppStore()
  const { mutateAsync: updateStatus, isPending } = useUpdatePostStatus()
  const { data: comments = [] } = useComments(post?.id)
  const [requestingChange, setRequestingChange] = useState(false)
  const [feedback, setFeedback] = useState('')
  const editSheetRef = useRef<BottomSheetModal>(null)

  const resetState = () => {
    setRequestingChange(false)
    setFeedback('')
  }

  if (!post) return null

  const isConsulenza = post.workMode === 'consulenza'
  const visualStatus = getVisualStatus(post.status, post.hasChangesRequested)

  // Consulenza: il cliente crea/modifica finché non è approvato dall'SMM (Task 3.2)
  const notYetSent = isConsulenza && visualStatus === 'draft'
  const inReview    = isConsulenza && visualStatus === 'pending'
  const canEditConsulenza = notYetSent || inReview
  const modifiedBySmm = isConsulenza && !!post.lastUpdatedBy && post.lastUpdatedBy !== userId

  const suggestionsFor = (field: CommentTargetField) => comments.filter((c) => c.targetField === field)
  const generalSuggestions = comments.filter((c) => !c.targetField)

  const handleApprove = async () => {
    try {
      await updateStatus({ id: post.id, status: 'approved', brandId: post.brandId })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({ type: 'success', text1: 'Post approvato!' })
      resetState()
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  // Consulenza: "Invia all'SMM" — CLIENT_DRAFT → SMM_REVIEW
  const handleSendToSmm = async () => {
    try {
      await updateStatus({ id: post.id, status: 'pending', brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Post inviato al tuo SMM!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      Toast.show({ type: 'error', text1: 'Scrivi un feedback prima di inviare' })
      return
    }
    try {
      await updateStatus({
        id: post.id,
        status: 'revision_requested',
        brandId: post.brandId,
        feedback: feedback.trim(),
      })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Feedback inviato!' })
      resetState()
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  return (
    <>
    <Sheet
      ref={sheetRef}
      title={post.title}
      snapPoints={['45%']}
      scrollable
      onClose={resetState}
    >
      <View style={styles.content}>
        {/* Meta */}
        <View style={styles.metaRow}>
          <Badge status={visualStatus} />
          <Text style={styles.date}>
            {formatScheduledDate(post.date)} · {formatScheduledTime(post.date)}
          </Text>
        </View>

        {/* Consulenza: il post non è ancora stato inviato per la revisione */}
        {notYetSent && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Bozza non ancora inviata al tuo SMM.</Text>
          </View>
        )}

        {/* Consulenza: l'SMM ha modificato direttamente il contenuto (Q2: nessun diff, solo nota) */}
        {modifiedBySmm && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Il tuo SMM ha modificato questo post.</Text>
          </View>
        )}

        {/* Titolo (con eventuale suggerimento ancorato) */}
        {isConsulenza && <FieldSuggestions field="title" comments={suggestionsFor('title')} />}

        {/* Caption */}
        {!!post.caption && (
          <View style={styles.section}>
            <Text style={styles.label}>Caption</Text>
            <Text style={styles.body}>{post.caption}</Text>
          </View>
        )}
        {isConsulenza && <FieldSuggestions field="caption" comments={suggestionsFor('caption')} />}

        {/* Media */}
        {!!post.mediaLink && (
          <View style={styles.section}>
            <Text style={styles.label}>Media</Text>
            <Pressable
              onPress={() => Linking.openURL(post.mediaLink!)}
              style={styles.linkRow}
            >
              <ExternalLink size={14} color={colors.primary} />
              <Text style={styles.link} numberOfLines={1}>{post.mediaLink}</Text>
            </Pressable>
          </View>
        )}
        {isConsulenza && <FieldSuggestions field="media_link" comments={suggestionsFor('media_link')} />}
        {isConsulenza && <FieldSuggestions field="platform" comments={suggestionsFor('platform')} />}
        {isConsulenza && <FieldSuggestions field="scheduled_date" comments={suggestionsFor('scheduled_date')} />}

        {/* Suggerimenti generici (non ancorati a un campo specifico) */}
        {isConsulenza && generalSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsTitle}>💡 Suggerimento SMM</Text>
            {generalSuggestions.map((c) => (
              <View key={c.id} style={styles.suggestionItem}>
                <Text style={styles.suggestionBody}>{c.body}</Text>
                <Text style={styles.suggestionTime}>{formatRelativeDate(c.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Azioni cliente — Gestione: approva / richiedi modifica */}
        {!isConsulenza && visualStatus === 'pending' && (
          requestingChange ? (
            <View style={styles.actions}>
              <Text style={styles.feedbackTitle}>Scrivi il tuo feedback</Text>
              <Textarea
                placeholder="Cosa vorresti cambiare?"
                value={feedback}
                onChangeText={setFeedback}
                minHeight={100}
              />
              <Button
                label="Invia richiesta"
                onPress={handleSendFeedback}
                loading={isPending}
                fullWidth
              />
              <Button
                label="Annulla"
                onPress={() => setRequestingChange(false)}
                variant="ghost"
                fullWidth
              />
            </View>
          ) : (
            <View style={styles.actions}>
              <Button
                label="Approva"
                onPress={handleApprove}
                loading={isPending}
                fullWidth
              />
              <Button
                label="Richiedi modifica"
                onPress={() => setRequestingChange(true)}
                variant="secondary"
                fullWidth
              />
            </View>
          )
        )}

        {/* Azioni cliente — Consulenza: modifica / invia all'SMM (l'approvazione è dell'SMM) */}
        {canEditConsulenza && (
          <View style={styles.actions}>
            <Button
              label="Modifica post"
              onPress={() => editSheetRef.current?.present()}
              variant="secondary"
              fullWidth
            />
            {notYetSent && (
              <Button
                label="Invia all'SMM"
                onPress={handleSendToSmm}
                loading={isPending}
                fullWidth
              />
            )}
          </View>
        )}
      </View>
    </Sheet>

    <EditClientPostSheet sheetRef={editSheetRef} post={post} />
    </>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { ...typography.small, color: colors.text.muted },
  infoBox: {
    backgroundColor: colors.input,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoText: { ...typography.small, color: colors.text.secondary },
  section: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.muted },
  feedbackTitle: { ...typography.label, color: colors.text.secondary },
  body: { ...typography.body, color: colors.text.primary, lineHeight: 22 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  link: { ...typography.small, color: colors.primary, flex: 1 },
  suggestionsBox: {
    backgroundColor: colors.status.pending.bg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.pending.dot,
    gap: spacing.xs,
  },
  suggestionsTitle: { ...typography.label, color: colors.status.pending.text },
  suggestionItem: { gap: 2 },
  suggestionBody: { ...typography.body, color: colors.status.pending.text },
  suggestionTime: { ...typography.caption, color: colors.status.pending.text },
  actions: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
})
