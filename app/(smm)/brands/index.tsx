import { useMemo, useRef } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Plus, Users } from 'lucide-react-native'
import type { BottomSheetModal } from '../../../components/ui/BottomSheet'
import { useAllPosts, useBrands } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import { BrandCard } from '../../../components/BrandCard'
import { CreateBrandSheet } from '../../../components/CreateBrandSheet'
import { SmmHeader } from '../../../components/SmmHeader'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/SkeletonLoader'
import { colors } from '../../../constants/colors'
import { radius, spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

// La tab Clienti mostra sempre il roster completo (solo filtrato per smmMode) —
// il selettore cliente dell'header ("Tutti"/pillole) non la restringe, dato che
// il suo scopo è proprio scegliere/sfogliare i clienti, non filtrarne il contenuto.
export default function BrandsListScreen() {
  const { userId, smmMode } = useAppStore()
  const { data: brands, isLoading, refetch } = useBrands(userId)
  const { data: allPosts } = useAllPosts(userId)
  const filteredBrands = brands?.filter((b) => b.workMode === smmMode)
  const sheetRef = useRef<BottomSheetModal>(null)

  const statsByBrand = useMemo(() => {
    const map = new Map<string, { total: number; toSend: number; inReview: number }>()
    for (const p of allPosts ?? []) {
      const s = map.get(p.brandId) ?? { total: 0, toSend: 0, inReview: 0 }
      s.total += 1
      if (p.status === 'bozza_privata') s.toSend += 1
      if (p.status === 'da_revisionare') s.inReview += 1
      map.set(p.brandId, s)
    }
    return map
  }, [allPosts])

  return (
    <View style={styles.screen}>
      <SmmHeader />

      <View style={styles.headingRow}>
        <Text style={styles.heading}>Clienti</Text>
        <Pressable style={styles.createBtn} onPress={() => sheetRef.current?.present()}>
          <Plus size={16} color={colors.primaryForeground} />
          <Text style={styles.createBtnText}>Crea cliente</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : !filteredBrands?.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Users}
            title="Nessun cliente"
            subtitle={
              smmMode === 'consulenza'
                ? 'Nessun cliente in Consulenza — aggiungine uno con il tasto +'
                : 'Aggiungi il tuo primo cliente con il tasto +'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BrandCard
              brand={item}
              stats={statsByBrand.get(item.id) ?? { total: 0, toSend: 0, inReview: 0 }}
              onPress={() => router.push(`/(smm)/brands/${item.id}`)}
            />
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

      <CreateBrandSheet sheetRef={sheetRef} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: { ...typography.displayHeading, color: colors.text.primary },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  createBtnText: { ...typography.smallMedium, color: colors.primaryForeground },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
  skeletons: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flex: 1, justifyContent: 'center' },
})
