import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { ExternalLink } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import type { Post } from '../src/lib/mock-data'
import { getVisualStatus } from '../src/lib/status-config'
import { useUpdatePostStatus } from '../src/lib/queries'
import { Sheet } from './ui/BottomSheet'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatScheduledDate, formatScheduledTime } from '../src/lib/utils'

interface ClientPostDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  post: Post | null
}

// Solo flusso Gestione: il cliente approva o richiede modifiche. Il flusso
// Consulenza (cliente creatore) vive in PostDetailSheet.tsx, condiviso con lo
// SMM — vedi modifiche/2026-07-08-piano-client-consulenza-parita-smm.md.
export function ClientPostDetailSheet({ sheetRef, post }: ClientPostDetailSheetProps) {
  const { mutateAsync: updateStatus, isPending } = useUpdatePostStatus()
  const [requestingChange, setRequestingChange] = useState(false)
  const [feedback, setFeedback] = useState('')

  const resetState = () => {
    setRequestingChange(false)
    setFeedback('')
  }

  if (!post) return null

  const visualStatus = getVisualStatus(post.status, post.hasChangesRequested)

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

        {/* Caption */}
        {!!post.caption && (
          <View style={styles.section}>
            <Text style={styles.label}>Caption</Text>
            <Text style={styles.body}>{post.caption}</Text>
          </View>
        )}

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

        {/* Azioni cliente */}
        {visualStatus === 'pending' && (
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
      </View>
    </Sheet>
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
  section: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.muted },
  feedbackTitle: { ...typography.label, color: colors.text.secondary },
  body: { ...typography.body, color: colors.text.primary, lineHeight: 22 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  link: { ...typography.small, color: colors.primary, flex: 1 },
  actions: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
})
