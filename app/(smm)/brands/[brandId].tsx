import { useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, Pencil, Plus, Repeat } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { useBrands, usePosts, useUpdateBrand } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import type { Brand, Post, WorkMode } from '../../../src/lib/mock-data'
import { BRAND_COLOR_HEX } from '../../../src/lib/mock-data'
import { STATUS_CONFIG } from '../../../src/lib/status-config'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import type { BottomSheetModal } from '../../../components/ui/BottomSheet'
import { EmptyState } from '../../../components/ui/EmptyState'
import { CreatePostSheet } from '../../../components/CreatePostSheet'
import { PostDetailSheet } from '../../../components/PostDetailSheet'
import { StrategiaSheet } from '../../../components/StrategiaSheet'
import { InviteClientSheet } from '../../../components/InviteClientSheet'
import { colors } from '../../../constants/colors'
import { radius, spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

const CHANNEL_LABEL: Record<Post['channel'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
}

// ToV/Obiettivo/Target/Posizionamento: "Da definire" finché il campo non è
// compilato nella scheda Strategia (Task 9).
function strategyChips(brand: Brand | undefined) {
  return [
    { label: 'ToV', value: brand?.toneOfVoice, color: colors.status.changes },
    { label: 'Obiettivo', value: brand?.obiettivo, color: colors.status.pending },
    { label: 'Target', value: brand?.target, color: colors.status.approved },
    { label: 'Posizionamento', value: brand?.posizionamento, color: colors.status.draft },
  ]
}

function ContentRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const cfg = STATUS_CONFIG[post.status]
  const d = new Date(post.date)
  const dateLabel = d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.contentRow, pressed && { opacity: 0.7 }]}>
      <View style={styles.contentInfo}>
        <View style={styles.contentTitleRow}>
          <Text style={styles.contentTitle} numberOfLines={1}>{post.title}</Text>
          {post.status === 'da_modificare' && <Pencil size={13} color={cfg.dotColor} />}
        </View>
        <Text style={styles.contentMeta} numberOfLines={1}>
          {CHANNEL_LABEL[post.channel]} · {post.type} · {dateLabel}
        </Text>
      </View>
      <Badge status={post.status} />
    </Pressable>
  )
}

export default function BrandDetailScreen() {
  const { brandId, openPostId } = useLocalSearchParams<{ brandId: string; openPostId?: string }>()
  const { userId } = useAppStore()
  const { data: brands } = useBrands(userId)
  const { mutateAsync: updateBrand } = useUpdateBrand()
  const { data: posts, isLoading, refetch } = usePosts(brandId)

  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)
  const createSheetRef = useRef<BottomSheetModal>(null)
  const strategiaSheetRef = useRef<BottomSheetModal>(null)
  const inviteSheetRef = useRef<BottomSheetModal>(null)

  const brand = brands?.find((b) => b.id === brandId)
  const isConsulenza = brand?.workMode === 'consulenza'

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

  const stats = {
    toSend: (posts ?? []).filter((p) => p.status === 'bozza_privata').length,
    inReview: (posts ?? []).filter((p) => p.status === 'da_revisionare').length,
    published: (posts ?? []).filter((p) => p.status === 'pubblicato').length,
  }

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

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        {!!brand && <Avatar name={brand.name} id={brand.id} size={46} color={BRAND_COLOR_HEX[brand.color]} />}
        <View style={styles.headerTitle}>
          <Text style={styles.brandName} numberOfLines={1}>{brand?.name ?? '...'}</Text>
          <Text style={styles.brandOwner} numberOfLines={1}>
            {brand?.ownerName ? `Referente: ${brand.ownerName}` : 'Referente non impostato'}
          </Text>
        </View>
        {!!brand && (
          <Pressable style={styles.modeChip} onPress={handleSwitchMode} hitSlop={8}>
            <Repeat size={12} color={colors.text.muted} />
            <Text style={styles.modeChipText}>{isConsulenza ? 'Consulenza' : 'Gestione'}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={false}
        ListHeaderComponent={
          <>
            <View style={styles.chips}>
              {strategyChips(brand).map((s) => (
                <View key={s.label} style={[styles.chip, { backgroundColor: s.color.bg }]}>
                  <Text style={[styles.chipText, { color: s.color.text }]} numberOfLines={1}>
                    {s.label} · {s.value || 'Da definire'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <View style={styles.actionBtn}>
                <Button label="Strategia" onPress={() => strategiaSheetRef.current?.present()} fullWidth />
              </View>
              <View style={styles.actionBtn}>
                <Button label="Invita cliente" onPress={() => inviteSheetRef.current?.present()} variant="secondary" fullWidth />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.status.changes.bg }]}>
                <Text style={[styles.statValue, { color: colors.status.changes.text }]}>{stats.toSend}</Text>
                <Text style={[styles.statLabel, { color: colors.status.changes.text }]}>Da inviare</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.status.pending.bg }]}>
                <Text style={[styles.statValue, { color: colors.status.pending.text }]}>{stats.inReview}</Text>
                <Text style={[styles.statLabel, { color: colors.status.pending.text }]}>In revisione</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.status.approved.bg }]}>
                <Text style={[styles.statValue, { color: colors.status.approved.text }]}>{stats.published}</Text>
                <Text style={[styles.statLabel, { color: colors.status.approved.text }]}>Pubblicati</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>I contenuti</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState icon={Plus} title="Nessun post" subtitle="I post di questo cliente appariranno qui" />
          )
        }
        renderItem={({ item }) => <ContentRow post={item} onPress={() => openPost(item)} />}
      />

      <Pressable style={styles.fab} onPress={() => createSheetRef.current?.present()} hitSlop={8}>
        <Plus size={26} color="#fff" />
      </Pressable>

      <CreatePostSheet sheetRef={createSheetRef} defaultBrandId={brandId} />
      <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />

      <StrategiaSheet sheetRef={strategiaSheetRef} brand={brand ?? null} />
      <InviteClientSheet sheetRef={inviteSheetRef} brand={brand ?? null} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, gap: 2 },
  brandName: { ...typography.h3, color: colors.text.primary },
  brandOwner: { ...typography.small, color: colors.text.muted },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    flexShrink: 0,
  },
  modeChipText: { ...typography.caption, color: colors.text.muted, fontWeight: '600' },

  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm, paddingBottom: 100 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  chipText: { ...typography.caption, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: { flex: 1, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', gap: 2 },
  statValue: { ...typography.displayHeading, fontSize: 22 },
  statLabel: { ...typography.caption, fontWeight: '600' },

  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  contentInfo: { flex: 1, gap: 2 },
  contentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contentTitle: { ...typography.bodyMedium, color: colors.text.primary, flexShrink: 1 },
  contentMeta: { ...typography.small, color: colors.text.muted },

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
