import { useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import type { Post } from '../../src/lib/mock-data'
import { usePosts, useAllPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import { STATUS_CONFIG } from '../../src/lib/status-config'
import { Badge } from '../../components/ui/Badge'
import { CreatePostSheet } from '../../components/CreatePostSheet'
import { PostDetailSheet } from '../../components/PostDetailSheet'
import { SmmHeader } from '../../components/SmmHeader'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const CHANNEL_LABEL: Record<Post['channel'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
}

function GridRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const cfg = STATUS_CONFIG[post.status]
  const d = new Date(post.date)
  const dayNum = d.getDate()
  const weekday = d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '').toUpperCase()

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.dateCol}>
        <Text style={styles.dayNum}>{dayNum}</Text>
        <Text style={styles.weekday}>{weekday}</Text>
      </View>
      <View style={[styles.bar, { backgroundColor: cfg.dotColor }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>{post.title}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {post.brandName ? `${post.brandName} · ` : ''}{CHANNEL_LABEL[post.channel]} · {post.type}
        </Text>
      </View>
      <Badge status={post.status} />
    </Pressable>
  )
}

export default function SmmGrigliaScreen() {
  const { userId, smmMode, selectedBrandId } = useAppStore()
  const [createDate, setCreateDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)
  const createSheetRef = useRef<BottomSheetModal>(null)

  const singleBrandQuery = usePosts(selectedBrandId)
  const allBrandsQuery = useAllPosts(userId)
  const { data: posts, isLoading, refetch } = selectedBrandId ? singleBrandQuery : allBrandsQuery

  const now = useMemo(() => new Date(), [])
  const monthLabel = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  const monthPosts = useMemo(() => {
    return (posts ?? [])
      .filter((p) => p.workMode === smmMode)
      .filter((p) => {
        const d = new Date(p.date)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [posts, smmMode, now])

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  const openCreate = () => {
    setCreateDate(new Date())
    createSheetRef.current?.present()
  }

  return (
    <>
    <View style={styles.screen}>
      <SmmHeader />

      <View style={styles.headingRow}>
        <Text style={styles.heading}>Griglia del mese</Text>
        <Text style={styles.subheading}>
          Tutti i contenuti di {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </Text>
      </View>

      {isLoading ? null : monthPosts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon={Plus} title="Nessun contenuto questo mese" />
        </View>
      ) : (
        <FlatList
          data={monthPosts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => <GridRow post={item} onPress={() => openPost(item)} />}
          ListFooterComponent={
            <Pressable style={styles.addRow} onPress={openCreate}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addRowText}>Aggiungi contenuto</Text>
            </Pressable>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={openCreate} hitSlop={8}>
        <Plus size={26} color="#fff" />
      </Pressable>
    </View>

    <CreatePostSheet
      sheetRef={createSheetRef}
      defaultBrandId={selectedBrandId ?? undefined}
      defaultDate={createDate}
    />
    <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headingRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 2 },
  heading: { ...typography.displayHeading, color: colors.text.primary },
  subheading: { ...typography.body, color: colors.text.secondary },

  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm, paddingBottom: 100 },
  emptyWrap: { flex: 1, justifyContent: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    shadowColor: colors.shadow.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  dateCol: { width: 34, alignItems: 'center' },
  dayNum: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '700' },
  weekday: { ...typography.caption, color: colors.text.muted },
  bar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  rowContent: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyMedium, color: colors.text.primary },
  rowMeta: { ...typography.small, color: colors.text.muted },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  addRowText: { ...typography.smallMedium, color: colors.primary },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
})
