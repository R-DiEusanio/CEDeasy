import { useRef, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { CheckCircle } from 'lucide-react-native'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { useClientPosts } from '../../src/lib/queries'
import type { Post } from '../../src/lib/mock-data'
import { PostCard } from '../../components/PostCard'
import { ClientPostDetailSheet } from '../../components/ClientPostDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

export default function ClientApprovedScreen() {
  const { data: allPosts, isLoading, refetch } = useClientPosts()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const posts = allPosts?.filter((p) => p.status === 'approved') ?? []

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Approvati</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : !posts.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={CheckCircle}
            title="Nessun post approvato"
            subtitle="I post approvati da te appariranno qui"
          />
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
  },
  heading: { ...typography.h2, color: colors.text.primary },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 32 },
  skeletons: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flex: 1, justifyContent: 'center' },
})
