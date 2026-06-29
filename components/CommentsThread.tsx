import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Send } from 'lucide-react-native'
import { useComments, useAddComment } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'
import { formatRelativeDate } from '../src/lib/utils'

interface CommentsThreadProps {
  postId: string
}

export function CommentsThread({ postId }: CommentsThreadProps) {
  const { userId } = useAppStore()
  const { data: comments = [] } = useComments(postId)
  const { mutateAsync: addComment } = useAddComment()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await addComment({ postId, body: text })
      setBody('')
    } catch {}
    setSending(false)
  }

  const canSend = !!body.trim() && !sending

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {comments.length > 0 ? `Commenti (${comments.length})` : 'Commenti'}
      </Text>

      {comments.length > 0 && (
        <View style={styles.list}>
          {comments.map((c) => {
            const isMe = c.authorId === userId
            return (
              <View
                key={c.id}
                style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
              >
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

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Scrivi un commento..."
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
