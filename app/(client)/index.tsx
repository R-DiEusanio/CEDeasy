import { useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CheckCircle, Clock, FileEdit, Plus } from 'lucide-react-native'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { useClientPosts, useBrand } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import type { Post, PostStatus } from '../../src/lib/mock-data'
import { PostCard } from '../../components/PostCard'
import { ClientPostDetailSheet } from '../../components/ClientPostDetailSheet'
import { CreateClientPostSheet } from '../../components/CreateClientPostSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing, radius } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const FILTERS: { key: PostStatus; label: string }[] = [
  { key: 'pending', label: 'Da approvare' },
  { key: 'approved', label: 'Approvati' },
]

// In Consulenza il cliente ha anche le proprie bozze (CLIENT_DRAFT → status "draft"
// lato frontend) da rivedere/inviare — invisibili nei filtri Gestione esistenti.
// "In revisione" invece di "Da approvare": in Consulenza è l'SMM ad approvare, non il cliente.
const CONSULENZA_FILTERS: { key: PostStatus; label: string }[] = [
  { key: 'draft', label: 'Bozze' },
  { key: 'pending', label: 'In revisione' },
  { key: 'approved', label: 'Approvati' },
]

export default function ClientPostsScreen() {
  const { activeBrandId } = useAppStore()
  const { data: brand } = useBrand(activeBrandId)
  const isConsulenza = brand?.workMode === 'consulenza'
  const { data: allPosts, isLoading, refetch } = useClientPosts()
  const [filter, setFilter] = useState<PostStatus>('pending')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)
  const createSheetRef = useRef<BottomSheetModal>(null)

  const filters = isConsulenza ? CONSULENZA_FILTERS : FILTERS
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
          {filters.map(({ key, label }) => {
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
          {filter === 'draft' ? (
            <EmptyState
              icon={FileEdit}
              title="Nessuna bozza"
              subtitle="Crea il tuo primo post con il tasto +"
            />
          ) : filter === 'pending' ? (
            <EmptyState
              icon={Clock}
              title={isConsulenza ? 'Nessun post in revisione' : 'Nessun post in attesa'}
              subtitle={isConsulenza ? 'I post che invii al tuo SMM appariranno qui' : 'I post inviati dal tuo SMM appariranno qui'}
            />
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="Nessun post approvato"
              subtitle={isConsulenza ? 'I post approvati dal tuo SMM appariranno qui' : 'I post approvati da te appariranno qui'}
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

      {isConsulenza && (
        <Pressable
          style={styles.fab}
          onPress={() => createSheetRef.current?.present()}
          hitSlop={8}
        >
          <Plus size={26} color="#fff" />
        </Pressable>
      )}

      <ClientPostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
      <CreateClientPostSheet sheetRef={createSheetRef} />
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
