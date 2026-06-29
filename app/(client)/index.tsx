import { useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Clock, LogOut } from 'lucide-react-native'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { supabase } from '../../src/lib/supabase'
import { useClientPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import type { Post } from '../../src/lib/mock-data'
import { PostCard } from '../../components/PostCard'
import { ClientPostDetailSheet } from '../../components/ClientPostDetailSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

export default function ClientPendingScreen() {
  const { setRole, setActiveBrandId } = useAppStore()
  const { data: allPosts, isLoading, refetch } = useClientPosts()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const posts = allPosts?.filter((p) => p.status === 'pending') ?? []

  const handleLogout = () => {
    Alert.alert('Esci', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          setRole('smm')
          setActiveBrandId(null)
        },
      },
    ])
  }

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Da approvare</Text>
        <Pressable onPress={handleLogout} hitSlop={8}>
          <LogOut size={20} color={colors.text.muted} />
        </Pressable>
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
            icon={Clock}
            title="Nessun post in attesa"
            subtitle="I post inviati dal tuo SMM appariranno qui"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
