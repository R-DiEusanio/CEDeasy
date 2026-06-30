import { useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react-native'
import type { BottomSheetModal } from '../../../components/ui/BottomSheet'
import { usePosts, useBrands } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import type { Post } from '../../../src/lib/mock-data'
import { PostCard } from '../../../components/PostCard'
import { CreatePostSheet } from '../../../components/CreatePostSheet'
import { PostDetailSheet } from '../../../components/PostDetailSheet'
import { ContentGrid } from '../../../components/ContentGrid'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/SkeletonLoader'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

export default function BrandDetailScreen() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>()
  const { userId } = useAppStore()
  const { data: brands } = useBrands(userId)
  const { data: posts, isLoading, refetch } = usePosts(brandId)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const createSheetRef = useRef<BottomSheetModal>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const brand = brands?.find((b) => b.id === brandId)

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.brandName} numberOfLines={1}>
            {brand?.name ?? '...'}
          </Text>
          {brand?.category && (
            <Text style={styles.brandCategory}>{brand.category}</Text>
          )}
        </View>
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <ContentGrid
              posts={posts ?? []}
              brandId={brandId}
              onDayPress={(date) => {
                setDefaultDate(date)
                createSheetRef.current?.present()
              }}
              onPostPress={(post) => openPost(post)}
            />
            <View style={styles.postsHeader}>
              <Text style={styles.sectionTitle}>Tutti i post</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nessun post"
              subtitle="Nessun post per questo cliente"
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            <PostCard post={item} onPress={() => openPost(item)} />
          </View>
        )}
      />

      {/* FAB crea post */}
      <Pressable
        style={styles.fab}
        onPress={() => createSheetRef.current?.present()}
        hitSlop={8}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <CreatePostSheet sheetRef={createSheetRef} brandId={brandId} defaultDate={defaultDate} />
      <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  brandName: { ...typography.h3, color: colors.text.primary },
  brandCategory: { ...typography.small, color: colors.primary },
  list: { paddingBottom: 100 },
  postsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  postItem: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  skeletons: { paddingHorizontal: spacing.lg, gap: spacing.sm },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
})
