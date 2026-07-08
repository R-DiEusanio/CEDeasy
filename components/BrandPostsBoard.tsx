import { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { CalendarDays, Plus } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { usePosts } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import type { Post, WorkMode } from '../src/lib/mock-data'
import { PostCard } from './PostCard'
import { CreatePostSheet } from './CreatePostSheet'
import { PostDetailSheet } from './PostDetailSheet'
import { ContentGrid } from './ContentGrid'
import { EmptyState } from './ui/EmptyState'
import { SkeletonCard } from './ui/SkeletonLoader'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

interface BrandPostsBoardProps {
  brandId: string
  workMode: WorkMode
  // Se valorizzato, apre automaticamente il dettaglio di questo post al montaggio
  // (link diretto da un'attività recente in dashboard SMM)
  openPostId?: string
}

// Calendario + lista + creazione/dettaglio post — condiviso tra lo SMM (brand in
// Gestione, app/(smm)/brands/[brandId].tsx) e il cliente (brand in Consulenza,
// app/(client)/index.tsx). Il ruolo di chi guarda determina solo se la creazione
// diretta è permessa qui: in Consulenza è il cliente a creare, non lo SMM.
export function BrandPostsBoard({ brandId, workMode, openPostId }: BrandPostsBoardProps) {
  const { role } = useAppStore()
  const { data: posts, isLoading, refetch } = usePosts(brandId)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const createSheetRef = useRef<BottomSheetModal>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const canCreateHere = !(role === 'smm' && workMode === 'consulenza')

  const openedRef = useRef(false)
  useEffect(() => {
    if (!openPostId || !posts || openedRef.current) return
    const post = posts.find((p) => p.id === openPostId)
    if (post) {
      openedRef.current = true
      setSelectedPost(post)
      setTimeout(() => detailSheetRef.current?.present(), 300)
    }
  }, [openPostId, posts])

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  const handleDayPress = (date: Date) => {
    if (!canCreateHere) {
      Toast.show({ type: 'info', text1: 'In Consulenza è il cliente a creare i post' })
      return
    }
    setDefaultDate(date)
    createSheetRef.current?.present()
  }

  return (
    <View style={styles.board}>
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
              onDayPress={handleDayPress}
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
              subtitle="I post di questo brand appariranno qui"
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            <PostCard post={item} onPress={() => openPost(item)} />
          </View>
        )}
      />

      {canCreateHere && (
        <Pressable
          style={styles.fab}
          onPress={() => createSheetRef.current?.present()}
          hitSlop={8}
        >
          <Plus size={26} color="#fff" />
        </Pressable>
      )}

      <CreatePostSheet sheetRef={createSheetRef} brandId={brandId} defaultDate={defaultDate} />
      <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </View>
  )
}

const styles = StyleSheet.create({
  board: { flex: 1 },
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
