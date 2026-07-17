import { useRef } from 'react'
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { ExternalLink, Trash2 } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import type { Post, PostStatus } from '../src/lib/mock-data'
import type { CommentTargetField } from '../src/lib/supabase/comments'
import { useUpdatePostStatus, useDeletePost, useComments } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import { Sheet } from './ui/BottomSheet'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { EditPostSheet } from './EditPostSheet'
import { PostPreview } from './PostPreview'
import { CommentsThread } from './CommentsThread'
import { STATUS_CONFIG, STATUS_ORDER } from '../src/lib/status-config'
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

// Quali stati può raggiungere il ruolo corrente da quello attuale — stessa
// logica del trigger DB posts_lock_fields_for_client (Task 2): lo SMM è
// sempre owner del brand quando vede questo sheet (RLS lo garantisce) e può
// spostare liberamente; il cliente solo lungo transizioni specifiche.
function getAllowedTargets(role: 'smm' | 'client', isConsulenza: boolean, current: PostStatus): PostStatus[] {
  if (role === 'smm') return STATUS_ORDER
  if (!isConsulenza) return current === 'da_revisionare' ? ['approvato', 'da_modificare'] : []
  return current === 'bozza_privata' ? ['bozza_privata', 'da_revisionare'] : []
}

interface PostDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
  post: Post | null
}

// Suggerimenti SMM ancorati a un campo — mostrati vicino alla sezione pertinente,
// non in un thread generico (vista sola lettura per il cliente-creatore).
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

// Condiviso tra SMM (Gestione: crea/invia/reimposta; Consulenza: revisore — suggerisce,
// modifica, approva) e cliente (Consulenza: creatore — modifica, elimina, invia
// all'SMM, anche dopo l'approvazione). Il flusso Gestione lato cliente resta in
// ClientPostDetailSheet.tsx, separato. Vedi modifiche/2026-07-08-piano-client-consulenza-parita-smm.md.
export function PostDetailSheet({ sheetRef, post }: PostDetailSheetProps) {
  const { role, userId } = useAppStore()
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdatePostStatus()
  const { mutateAsync: deletePost, isPending: deleting } = useDeletePost()
  const { data: comments = [] } = useComments(post?.id)
  const editSheetRef = useRef<BottomSheetModal>(null)
  const previewSheetRef = useRef<BottomSheetModal>(null)

  if (!post) return null

  const isConsulenza = post.workMode === 'consulenza'
  const isCreator = isConsulenza && role === 'client'
  const isReviewer = isConsulenza && role === 'smm'
  const visualStatus = post.status

  // Gestione (SMM crea, cliente approva) — comportamento invariato
  const canSend  = !isConsulenza && (visualStatus === 'bozza_privata' || visualStatus === 'da_modificare')
  const canReset = !isConsulenza && visualStatus === 'da_revisionare'
  const canEdit  = !isConsulenza && (visualStatus === 'bozza_privata' || visualStatus === 'da_modificare')

  // Consulenza — revisore (SMM): agisce solo mentre il post è in revisione
  const notYetSent = isConsulenza && visualStatus === 'bozza_privata'
  const inReview    = isConsulenza && visualStatus === 'da_revisionare'
  const reviewerCanAct = isReviewer && inReview

  // Consulenza — creatore (cliente): stessi poteri dello SMM in Gestione, modifica/elimina
  // sempre (anche dopo l'approvazione, Task 1.2), invio all'SMM solo prima della revisione
  const creatorCanEdit = isCreator
  const creatorCanSend = isCreator && notYetSent
  const modifiedBySmm = isCreator && !!post.lastUpdatedBy && post.lastUpdatedBy !== userId

  const suggestionsFor = (field: CommentTargetField) => comments.filter((c) => c.targetField === field)
  const generalSuggestions = comments.filter((c) => !c.targetField)

  const allowedTargets = getAllowedTargets(role, isConsulenza, visualStatus)

  const handleSendToClient = async () => {
    try {
      await updateStatus({ id: post.id, status: 'da_revisionare', brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Post inviato al cliente!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleSendToSmm = async () => {
    try {
      await updateStatus({ id: post.id, status: 'da_revisionare', brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Post inviato al tuo SMM!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleApprove = async () => {
    try {
      await updateStatus({ id: post.id, status: 'approvato', brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: 'Post approvato!' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleResetToDraft = async () => {
    try {
      await updateStatus({ id: post.id, status: 'bozza_privata', brandId: post.brandId })
      Toast.show({ type: 'success', text1: 'Post reimpostato a bozza' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handlePostpone = async () => {
    try {
      await updateStatus({ id: post.id, status: 'rimandato', brandId: post.brandId })
      Toast.show({ type: 'success', text1: 'Post rimandato' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleMoveTo = async (target: PostStatus) => {
    try {
      await updateStatus({ id: post.id, status: target, brandId: post.brandId })
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      Toast.show({ type: 'success', text1: `Spostato in "${STATUS_CONFIG[target].label}"` })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const doDelete = async () => {
    try {
      await deletePost({ id: post.id, brandId: post.brandId })
      Toast.show({ type: 'success', text1: 'Post eliminato' })
      sheetRef.current?.dismiss()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
    }
  }

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      doDelete()
      return
    }
    Alert.alert(
      'Elimina post',
      `Vuoi eliminare "${post.title}"? Questa azione non è reversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: doDelete },
      ]
    )
  }

  return (
    <>
    <Sheet ref={sheetRef} title={post.title} snapPoints={['85%']} scrollable>
      <View style={styles.content}>
        {/* Status + data */}
        <View style={styles.metaRow}>
          <Badge status={visualStatus} />
          <Text style={styles.date}>
            {formatScheduledDate(post.date)} · {formatScheduledTime(post.date)}
          </Text>
        </View>

        {/* Consulenza, revisore: il cliente non ha ancora inviato il post per la revisione */}
        {notYetSent && isReviewer && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Il cliente sta ancora scrivendo questo post — non lo ha ancora inviato per la revisione.
            </Text>
          </View>
        )}

        {/* Consulenza, creatore: bozza non ancora inviata */}
        {notYetSent && isCreator && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Bozza non ancora inviata al tuo SMM.</Text>
          </View>
        )}

        {/* Consulenza, creatore: l'SMM ha modificato direttamente il contenuto (Q2: nessun diff, solo nota) */}
        {modifiedBySmm && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Il tuo SMM ha modificato questo post.</Text>
          </View>
        )}

        {/* Titolo (con eventuale suggerimento ancorato, solo vista creatore) */}
        {isCreator && <FieldSuggestions field="title" comments={suggestionsFor('title')} />}

        {/* Caption */}
        {!!post.caption && (
          <View style={styles.section}>
            <Text style={styles.label}>Caption</Text>
            <Text style={styles.body}>{post.caption}</Text>
          </View>
        )}
        {isCreator && <FieldSuggestions field="caption" comments={suggestionsFor('caption')} />}

        {/* Feedback cliente (solo Gestione) */}
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
        {isCreator && <FieldSuggestions field="media_link" comments={suggestionsFor('media_link')} />}
        {isCreator && <FieldSuggestions field="platform" comments={suggestionsFor('platform')} />}
        {isCreator && <FieldSuggestions field="scheduled_date" comments={suggestionsFor('scheduled_date')} />}

        {/* Suggerimenti generici del creatore (non ancorati a un campo) */}
        {isCreator && generalSuggestions.length > 0 && (
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

        {/* Note interne (solo SMM) */}
        {!!post.internalNotes && !isCreator && (
          <View style={styles.section}>
            <Text style={styles.label}>Note interne</Text>
            <Text style={styles.body}>{post.internalNotes}</Text>
          </View>
        )}

        {/* Composer suggerimenti — solo revisore SMM, mentre in revisione */}
        {reviewerCanAct && (
          <View style={styles.section}>
            <CommentsThread postId={post.id} suggestionMode />
          </View>
        )}

        {/* Azioni */}
        <View style={styles.actions}>
          {(canEdit || reviewerCanAct || creatorCanEdit) && (
            <Button
              label="Modifica post"
              onPress={() => editSheetRef.current?.present()}
              variant="secondary"
              fullWidth
            />
          )}
          {canSend && (
            <>
              <Button
                label="Invia al cliente"
                onPress={handleSendToClient}
                loading={updatingStatus}
                fullWidth
              />
              <Text style={styles.actionNote}>
                Diventerà "{STATUS_CONFIG.da_revisionare.label}" e il cliente lo vedrà subito.
              </Text>
            </>
          )}
          {creatorCanSend && (
            <>
              <Button
                label="Invia all'SMM"
                onPress={handleSendToSmm}
                loading={updatingStatus}
                fullWidth
              />
              <Text style={styles.actionNote}>
                Diventerà "{STATUS_CONFIG.da_revisionare.label}" e il tuo SMM lo vedrà subito.
              </Text>
            </>
          )}
          {reviewerCanAct && (
            <Button
              label="Approva"
              onPress={handleApprove}
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

          {/* Anteprima (Task 12) + Rimanda (solo SMM, azione di pianificazione) */}
          <View style={styles.sideBySide}>
            <View style={styles.sideBySideItem}>
              <Button
                label="Anteprima IG/FB"
                onPress={() => previewSheetRef.current?.present()}
                variant="secondary"
                fullWidth
              />
            </View>
            {role === 'smm' && (
              <View style={styles.sideBySideItem}>
                <Button
                  label="Rimanda"
                  onPress={handlePostpone}
                  loading={updatingStatus}
                  variant="secondary"
                  fullWidth
                />
              </View>
            )}
          </View>

          {/* Sposta in un altro stato — libero per lo SMM, vincolato per il
              cliente in base a getAllowedTargets (stessa logica del trigger DB) */}
          <View style={styles.moveSection}>
            <Text style={styles.moveLabel}>SPOSTA IN UN ALTRO STATO</Text>
            <View style={styles.moveChips}>
              {STATUS_ORDER.map((status) => {
                const cfg = STATUS_CONFIG[status]
                const isCurrent = status === visualStatus
                const isEnabled = !isCurrent && allowedTargets.includes(status)
                return (
                  <Pressable
                    key={status}
                    disabled={!isEnabled}
                    onPress={() => handleMoveTo(status)}
                    style={[
                      styles.moveChip,
                      isCurrent && { backgroundColor: cfg.dotColor },
                      !isCurrent && !isEnabled && styles.moveChipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.moveChipText,
                        isCurrent && styles.moveChipTextCurrent,
                        !isCurrent && !isEnabled && styles.moveChipTextDisabled,
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Pressable onPress={handleDelete} style={styles.deleteBtn} disabled={deleting}>
            <Trash2 size={16} color={colors.destructive} />
            <Text style={styles.deleteText}>Elimina post</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>

    <EditPostSheet
      sheetRef={editSheetRef}
      post={post}
      onSaved={() => sheetRef.current?.dismiss()}
    />

    <Sheet ref={previewSheetRef} title="Anteprima" snapPoints={['75%']} scrollable>
      <View style={styles.previewContent}>
        <PostPreview post={post} />
      </View>
    </Sheet>
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: { ...typography.bodyMedium, color: colors.destructive },

  actionNote: { ...typography.small, color: colors.text.muted, textAlign: 'center' },

  sideBySide: { flexDirection: 'row', gap: spacing.sm },
  sideBySideItem: { flex: 1 },

  moveSection: { gap: spacing.sm },
  moveLabel: { ...typography.label, color: colors.text.muted },
  moveChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moveChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.input,
  },
  moveChipDisabled: { opacity: 0.4 },
  moveChipText: { ...typography.smallMedium, color: colors.text.primary },
  moveChipTextCurrent: { color: colors.primaryForeground, fontWeight: '700' },
  moveChipTextDisabled: { color: colors.text.muted },

  previewContent: { padding: spacing.lg },
})
