import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Send } from 'lucide-react-native'
import { useComments, useAddComment } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import type { CommentTargetField } from '../src/lib/supabase/comments'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatRelativeDate } from '../src/lib/utils'

const FIELD_LABELS: Record<CommentTargetField, string> = {
  title:          'Titolo',
  caption:        'Caption',
  platform:       'Tipo',
  media_link:     'Media',
  scheduled_date: 'Data',
}
const FIELD_OPTIONS = Object.keys(FIELD_LABELS) as CommentTargetField[]

interface CommentsThreadProps {
  postId: string
  // Modalità suggerimento (SMM in Consulenza): mostra il selettore di campo e
  // ancora ogni messaggio a title/caption/tipo/media/data invece di un commento libero.
  suggestionMode?: boolean
}

export function CommentsThread({ postId, suggestionMode = false }: CommentsThreadProps) {
  const { userId } = useAppStore()
  const { data: comments = [] } = useComments(postId)
  const { mutateAsync: addComment } = useAddComment()
  const [body, setBody] = useState('')
  const [targetField, setTargetField] = useState<CommentTargetField | undefined>(undefined)
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await addComment({ postId, body: text, targetField: suggestionMode ? targetField : undefined })
      setBody('')
      setTargetField(undefined)
    } catch {}
    setSending(false)
  }

  const canSend = !!body.trim() && !sending
  const title = suggestionMode ? 'Suggerimenti' : 'Commenti'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {comments.length > 0 ? `${title} (${comments.length})` : title}
      </Text>

      {comments.length > 0 && (
        <View style={styles.list}>
          {comments.map((c) => {
            const isMe = c.authorId === userId
            return (
              <View
                key={c.id}
                style={[styles.bubble, isMe ? styles.myBubble : styles.bubble]}
              >
                {!!c.targetField && (
                  <View style={styles.fieldTag}>
                    <Text style={styles.fieldTagText}>{FIELD_LABELS[c.targetField]}</Text>
                  </View>
                )}
                <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                  {c.body}
                </Text>
                <Text style={[styles.time, isMe && styles.myTime]}>
                  {formatRelativeDate(c.createdAt)}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {suggestionMode && (
        <View style={styles.fieldPicker}>
          {FIELD_OPTIONS.map((f) => {
            const active = targetField === f
            return (
              <Pressable
                key={f}
                style={[styles.fieldChip, active && styles.fieldChipActive]}
                onPress={() => setTargetField(active ? undefined : f)}
              >
                <Text style={[styles.fieldChipText, active && styles.fieldChipTextActive]}>
                  {FIELD_LABELS[f]}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={suggestionMode ? 'Scrivi un suggerimento...' : 'Scrivi un commento...'}
          placeholderTextColor={colors.text.muted}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          hitSlop={8}
        >
          <Send size={18} color={canSend ? colors.primary : colors.text.muted} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  title: { ...typography.label, color: colors.text.muted },
  list: { gap: spacing.sm },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary + '18',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  bubbleText: { ...typography.body, color: colors.text.primary },
  myBubbleText: { color: colors.primary },
  time: { ...typography.caption, color: colors.text.muted },
  myTime: { color: colors.primary + 'aa', textAlign: 'right' },
  fieldTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.status.pending.bg,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  fieldTagText: { ...typography.caption, color: colors.status.pending.text, fontWeight: '600' },
  fieldPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  fieldChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  fieldChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  fieldChipText: { ...typography.caption, color: colors.text.secondary },
  fieldChipTextActive: { color: colors.primary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.input,
  },
})
