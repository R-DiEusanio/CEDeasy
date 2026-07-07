import { useMemo, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, CalendarDays, Copy, Plus, Repeat } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from '../../../components/ui/BottomSheet'
import { usePosts, useBrands, useUpdateBrand } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import type { Post, WorkMode } from '../../../src/lib/mock-data'
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
  const { brandId, openPostId } = useLocalSearchParams<{ brandId: string; openPostId?: string }>()
  const { userId } = useAppStore()
  const { data: brands } = useBrands(userId)
  const { data: posts, isLoading, refetch } = usePosts(brandId)
  const { mutateAsync: updateBrand } = useUpdateBrand()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const createSheetRef = useRef<BottomSheetModal>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)

  const brand = brands?.find((b) => b.id === brandId)
  const isConsulenza = brand?.workMode === 'consulenza'

  const handleSwitchMode = () => {
    if (!brand) return
    const nextMode: WorkMode = isConsulenza ? 'gestione' : 'consulenza'
    const nextLabel = nextMode === 'consulenza' ? 'Consulenza' : 'Gestione'
    const message = `${brand.name} passerà a ${nextLabel}. I post già esistenti restano invariati: la nuova modalità vale solo per i post creati da questo momento in poi.`

    const doSwitch = async () => {
      try {
        await updateBrand({ id: brandId, dto: { workMode: nextMode } })
        Toast.show({ type: 'success', text1: `Cliente passato a ${nextLabel}` })
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Errore', text2: e.message })
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(message)) doSwitch()
    } else {
      Alert.alert(`Passa a ${nextLabel}?`, message, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Conferma', onPress: doSwitch },
      ])
    }
  }

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

  const copyCode = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(brandId)
      }
      Toast.show({ type: 'success', text1: 'Codice copiato!', text2: 'Invialo al cliente per la registrazione' })
    } catch {
      Toast.show({ type: 'error', text1: 'Copia non riuscita' })
    }
  }

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
        {!!brand && (
          <Pressable style={styles.modeChip} onPress={handleSwitchMode} hitSlop={8}>
            <Repeat size={12} color={colors.primary} />
            <Text style={styles.modeChipText}>{isConsulenza ? 'Consulenza' : 'Gestione'}</Text>
          </Pressable>
        )}
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
            {/* Codice Cliente */}
            <Pressable style={styles.codeCard} onPress={copyCode}>
              <Copy size={15} color={colors.primary} />
              <Text style={styles.copyLabel}>Copia codice cliente</Text>
            </Pressable>

            <ContentGrid
              posts={posts ?? []}
              brandId={brandId}
              onDayPress={(date) => {
                if (isConsulenza) {
                  Toast.show({ type: 'info', text1: 'In Consulenza è il cliente a creare i post' })
                  return
                }
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

      {/* FAB crea post — solo Gestione: in Consulenza è il cliente a creare i post */}
      {!isConsulenza && (
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
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '10',
    flexShrink: 0,
  },
  modeChipText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
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
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 20,
    gap: 6,
  },
  copyLabel: { ...typography.small, color: colors.primary, fontWeight: '600' },
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
