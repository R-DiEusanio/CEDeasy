import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Post } from '../../src/lib/mock-data'
import { usePosts, useAllPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import { STATUS_CONFIG, STATUS_ORDER } from '../../src/lib/status-config'
import { PostCard } from '../../components/PostCard'
import { PostDetailSheet } from '../../components/PostDetailSheet'
import { SmmHeader } from '../../components/SmmHeader'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { OnboardingModal, ONBOARDING_KEY } from '../../components/OnboardingModal'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const COLUMN_WIDTH = 260

export default function SmmDashboardScreen() {
  const { userId, smmMode, selectedBrandId } = useAppStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) setShowOnboarding(true)
    })
  }, [])

  const singleBrandQuery = usePosts(selectedBrandId)
  const allBrandsQuery = useAllPosts(userId)
  const { data: posts, isLoading, refetch } = selectedBrandId ? singleBrandQuery : allBrandsQuery

  const filteredPosts = useMemo(
    () => (posts ?? []).filter((p) => p.workMode === smmMode),
    [posts, smmMode]
  )

  const columns = useMemo(() => {
    const byStatus = new Map<string, Post[]>()
    for (const status of STATUS_ORDER) byStatus.set(status, [])
    for (const post of filteredPosts) byStatus.get(post.status)?.push(post)
    return STATUS_ORDER.map((status) => ({ status, posts: byStatus.get(status) ?? [] }))
  }, [filteredPosts])

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <>
    <OnboardingModal
      visible={showOnboarding}
      onDone={() => setShowOnboarding(false)}
    />
    <View style={styles.screen}>
      <SmmHeader />
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subheading}>Trascina i post da uno stato all'altro</Text>

      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.board}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {columns.map(({ status, posts: columnPosts }) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <View key={status} style={styles.column}>
                <View style={styles.columnHeader}>
                  <View style={styles.columnTitleRow}>
                    <View style={[styles.columnDot, { backgroundColor: cfg.dotColor }]} />
                    <Text style={styles.columnTitle}>{cfg.label}</Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: cfg.badgeColor }]}>
                    <Text style={[styles.countText, { color: cfg.badgeTextColor }]}>
                      {columnPosts.length}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.columnList} contentContainerStyle={styles.columnListContent}>
                  {columnPosts.length === 0 ? (
                    <Text style={styles.emptyColumn}>Nessun post</Text>
                  ) : (
                    columnPosts.map((post) => (
                      <PostCard key={post.id} post={post} onPress={() => openPost(post)} />
                    ))
                  )}
                </ScrollView>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>

    <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { ...typography.displayHeading, color: colors.text.primary, paddingHorizontal: spacing.lg },
  subheading: {
    ...typography.body,
    color: colors.text.secondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletons: { padding: spacing.lg, gap: spacing.sm },

  board: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  columnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  columnDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { ...typography.smallMedium, color: colors.text.primary },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { ...typography.caption, fontWeight: '700' },
  columnList: { flexGrow: 0 },
  columnListContent: { gap: spacing.sm, paddingBottom: spacing.sm },
  emptyColumn: {
    ...typography.small,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
})
