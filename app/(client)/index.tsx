import { useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CheckCircle, Clock } from 'lucide-react-native'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { useClientPosts } from '../../src/lib/queries'
import type { Post, PostStatus } from '../../src/lib/mock-data'
import { PostCard } from '../../components/PostCard'
import { ClientPostDetailSheet } from '../../components/ClientPostDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing, radius } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const FILTERS: { key: PostStatus; label: string }[] = [
  { key: 'pending', label: 'Da approvare' },
  { key: 'approved', label: 'Approvati' },
]

export default function ClientPostsScreen() {
  const { data: allPosts, isLoading, refetch } = useClientPosts()
  const [filter, setFilter] = useState<PostStatus>('pending')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const posts = allPosts?.filter((p) => p.status === filter) ?? []

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Post</Text>

        <View style={styles.segmented}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key
            return (
              <Pressable
                key={key}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : !posts.length ? (
        <View style={styles.emptyWrap}>
          {filter === 'pending' ? (
            <EmptyState
              icon={Clock}
              title="Nessun post in attesa"
              subtitle="I post inviati dal tuo SMM appariranno qui"
            />
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="Nessun post approvato"
              subtitle="I post approvati da te appariranno qui"
            />
          )}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => openPost(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <ClientPostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  heading: { ...typography.h2, color: colors.text.primary },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentLabel: { ...typography.small, color: colors.text.secondary },
  segmentLabelActive: { color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 32 },
  skeletons: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flex: 1, justifyContent: 'center' },
})
