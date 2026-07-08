import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, Copy, Repeat } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { useBrands, useUpdateBrand } from '../../../src/lib/queries'
import { useAppStore } from '../../../src/lib/app-store'
import type { WorkMode } from '../../../src/lib/mock-data'
import { BrandPostsBoard } from '../../../components/BrandPostsBoard'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { typography } from '../../../constants/typography'

export default function BrandDetailScreen() {
  const { brandId, openPostId } = useLocalSearchParams<{ brandId: string; openPostId?: string }>()
  const { userId } = useAppStore()
  const { data: brands } = useBrands(userId)
  const { mutateAsync: updateBrand } = useUpdateBrand()

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

      {/* Codice Cliente */}
      <Pressable style={styles.codeCard} onPress={copyCode}>
        <Copy size={15} color={colors.primary} />
        <Text style={styles.copyLabel}>Copia codice cliente</Text>
      </Pressable>

      <BrandPostsBoard brandId={brandId} workMode={brand?.workMode ?? 'gestione'} openPostId={openPostId} />
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
})
