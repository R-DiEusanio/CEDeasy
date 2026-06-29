import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { ExternalLink, Trash2 } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import type { Post } from '../src/lib/mock-data'
import { getVisualStatus } from '../src/lib/status-config'
import { useUpdatePostStatus, useDeletePost } from '../src/lib/queries'
import { Sheet } from './ui/BottomSheet'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { CommentsThread } from './CommentsThread'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatScheduledDate, formatScheduledTime } from '../src/lib/utils'

interface PostDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>
  post: Post | null
}

export function PostDetailSheet({ sheetRef, post }: PostDetailSheetProps) {
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdatePostStatus()
  const { mutateAsync: deletePost, isPending: deleting } = useDeletePost()

  if (!post) return null

  const visualStatus = getVisualStatus(post.status, post.hasChangesRequested)
  const canSend    = visualStatus === 'draft' || visualStatus === 'changes_requested'
  const canReset   = visualStatus === 'pending'

  const handleSendToClient = async () => {
    try {
      await updateStatus({ id: post.id, status: 'pending', brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Post inviato al cliente!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleResetToDraft = async () => {
    try {
      await updateStatus({ id: post.id, status: 'draft', brandId: post.brandId })
      Toast.show({ type: 'success', text1: 'Post reimpostato a bozza' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Elimina post',
      `Vuoi eliminare "${post.title}"? Questa azione non è reversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost({ id: post.id, brandId: post.brandId })
              Toast.show({ type: 'success', text1: 'Post eliminato' })
              sheetRef.current?.dismiss()
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
            }
          },
        },
      ]
    )
  }

  return (
    <Sheet ref={sheetRef} title={post.title} snapPoints={['60%', '95%']} scrollable>
      <View style={styles.content}>
        {/* Status + data */}
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

        {/* Feedback cliente */}
        {!!post.feedback && (
          <View style={[styles.section, styles.feedbackBox]}>
            <Text style={[styles.label, { color: colors.status.changes.text }]}>
              Feedback cliente
            </Text>
            <Text style={[styles.body, { color: colors.status.changes.text }]}>
              {post.feedback}
            </Text>
          </View>
        )}

        {/* Media link */}
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

        {/* Note interne */}
        {!!post.internalNotes && (
          <View style={styles.section}>
            <Text style={styles.label}>Note interne</Text>
            <Text style={styles.body}>{post.internalNotes}</Text>
          </View>
        )}

        {/* Commenti */}
        <View style={styles.commentsSection}>
          <CommentsThread postId={post.id} />
        </View>

        {/* Azioni SMM */}
        <View style={styles.actions}>
          {canSend && (
            <Button
              label="Invia al cliente"
              onPress={handleSendToClient}
              loading={updatingStatus}
              fullWidth
            />
          )}
          {canReset && (
            <Button
              label="Reimposta a bozza"
              onPress={handleResetToDraft}
              loading={updatingStatus}
              variant="secondary"
              fullWidth
            />
          )}
          <Pressable onPress={handleDelete} style={styles.deleteBtn} disabled={deleting}>
            <Trash2 size={16} color={colors.destructive} />
            <Text style={styles.deleteText}>Elimina post</Text>
          </Pressable>
        </View>
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
  body: { ...typography.body, color: colors.text.primary, lineHeight: 22 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  link: { ...typography.small, color: colors.primary, flex: 1 },
  feedbackBox: {
    backgroundColor: colors.status.changes.bg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.changes.dot,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: { ...typography.bodyMedium, color: colors.destructive },
})
