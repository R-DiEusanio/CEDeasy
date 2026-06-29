import { useRef } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Plus, Users } from 'lucide-react-native'
import type { BottomSheetModal } from '../../../components/ui/BottomSheet'
import { useBrands } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import { BrandCard } from '../../../components/BrandCard'
import { CreateBrandSheet } from '../../../components/CreateBrandSheet'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/SkeletonLoader'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

export default function BrandsListScreen() {
  const { userId } = useAppStore()
  const { data: brands, isLoading, refetch } = useBrands(userId)
  const sheetRef = useRef<BottomSheetModal>(null)

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Clienti</Text>

      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : !brands?.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Users}
            title="Nessun cliente"
            subtitle="Aggiungi il tuo primo cliente con il tasto +"
          />
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BrandCard
              brand={item}
              pendingCount={0}
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

      <Pressable
        style={styles.fab}
        onPress={() => sheetRef.current?.present()}
        hitSlop={8}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <CreateBrandSheet sheetRef={sheetRef} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
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
