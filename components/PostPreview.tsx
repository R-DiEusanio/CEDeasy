import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Heart, MessageCircle, MoreHorizontal, Send, Bookmark, ImageOff } from 'lucide-react-native'
import { useBrand } from '../src/lib/queries'
import { BRAND_COLOR_HEX } from '../src/lib/mock-data'
import type { Channel, Post } from '../src/lib/mock-data'
import { Avatar } from './ui/Avatar'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const PLATFORMS: { key: Channel; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
]

interface PostPreviewProps {
  post: Post
}

// Mockup realistico di come il post apparirebbe nel feed — usa sempre i dati
// reali del post (nessuna didascalia/foto inventata). Nessuna pubblicazione
// reale: è solo un'anteprima visiva, vedi nota fissa in fondo.
export function PostPreview({ post }: PostPreviewProps) {
  const { data: brand } = useBrand(post.brandId)
  const [platform, setPlatform] = useState<Channel>(post.channel)
  const [imageFailed, setImageFailed] = useState(false)

  const brandName = brand?.name ?? post.brandName ?? 'Cliente'
  const brandColor = brand ? BRAND_COLOR_HEX[brand.color] : undefined
  const hasImage = !!post.mediaLink && !imageFailed

  const media = hasImage ? (
    <Image
      source={{ uri: post.mediaLink }}
      style={styles.media}
      onError={() => setImageFailed(true)}
    />
  ) : (
    <View style={[styles.media, styles.mediaPlaceholder]}>
      <ImageOff size={28} color={colors.text.muted} />
      <Text style={styles.mediaPlaceholderText}>
        {post.mediaLink ? 'Anteprima non disponibile' : 'Nessuna immagine caricata'}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        {PLATFORMS.map((p) => {
          const active = platform === p.key
          return (
            <Pressable
              key={p.key}
              style={[styles.toggleBtn, active && styles.toggleBtnActive]}
              onPress={() => setPlatform(p.key)}
            >
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{p.label}</Text>
            </Pressable>
          )
        })}
      </View>

      {platform === 'facebook' ? (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Avatar name={brandName} id={post.brandId} size={40} color={brandColor} />
            <View style={styles.headerInfo}>
              <Text style={styles.brandName}>{brandName}</Text>
              <Text style={styles.meta}>2 h · Pubblico</Text>
            </View>
            <MoreHorizontal size={18} color={colors.text.muted} />
          </View>

          {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}
          {media}

          <View style={styles.fbActions}>
            <Text style={styles.fbActionText}>Mi piace</Text>
            <Text style={styles.fbActionText}>Commenta</Text>
            <Text style={styles.fbActionText}>Condividi</Text>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Avatar name={brandName} id={post.brandId} size={32} color={brandColor} />
            <Text style={[styles.brandName, styles.igUsername]}>{brandName.toLowerCase().replace(/\s+/g, '')}</Text>
            <MoreHorizontal size={18} color={colors.text.muted} />
          </View>

          {media}

          <View style={styles.igActions}>
            <Heart size={22} color={colors.text.primary} />
            <MessageCircle size={22} color={colors.text.primary} />
            <Send size={22} color={colors.text.primary} />
            <View style={styles.igSpacer} />
            <Bookmark size={22} color={colors.text.primary} />
          </View>

          {!!post.caption && (
            <Text style={styles.igCaption}>
              <Text style={styles.brandName}>{brandName.toLowerCase().replace(/\s+/g, '')} </Text>
              {post.caption}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.disclaimer}>
        Così apparirà nel feed — CedEasy non pubblica al posto tuo.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 3,
  },
  toggleBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.smallMedium, color: colors.text.secondary },
  toggleTextActive: { color: colors.primaryForeground },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerInfo: { flex: 1 },
  brandName: { ...typography.bodyMedium, color: colors.text.primary },
  igUsername: { flex: 1 },
  meta: { ...typography.caption, color: colors.text.muted },
  caption: { ...typography.body, color: colors.text.primary, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },

  media: { width: '100%', aspectRatio: 1.4 },
  mediaPlaceholder: {
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mediaPlaceholderText: { ...typography.small, color: colors.text.muted },

  fbActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fbActionText: { ...typography.smallMedium, color: colors.text.secondary },

  igActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  igSpacer: { flex: 1 },
  igCaption: { ...typography.body, color: colors.text.primary, paddingHorizontal: spacing.md, paddingBottom: spacing.md },

  disclaimer: { ...typography.small, color: colors.text.muted, textAlign: 'center' },
})
