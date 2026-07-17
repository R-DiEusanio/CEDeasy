import { useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Bell, Plus, User } from 'lucide-react-native'
import { useAppStore } from '../src/lib/app-store'
import type { SmmMode } from '../src/lib/app-store'
import { useBrands, useRecentActivities } from '../src/lib/queries'
import { BRAND_COLOR_HEX } from '../src/lib/mock-data'
import { ActivityCard } from './ActivityCard'
import { CreateBrandSheet } from './CreateBrandSheet'
import { Sheet } from './ui/BottomSheet'
import type { BottomSheetModal } from './ui/BottomSheet'
import { EmptyState } from './ui/EmptyState'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

const MODES: { value: SmmMode; label: string }[] = [
  { value: 'gestione',   label: 'Gestione'   },
  { value: 'consulenza', label: 'Consulenza' },
]

// Header condiviso da tutte e 5 le tab SMM (Dashboard/Calendario/Griglia/Clienti/
// Report): logo, toggle Gestione/Consulenza, pulsante Novità (feed attività multi-
// cliente), icona profilo — e sotto, la riga di pillole cliente ("Tutti" + brand +
// "+ Nuovo"). Il cliente selezionato è condiviso tra le tab tramite selectedBrandId
// in app-store, così il filtro non si resetta cambiando schermata.
export function SmmHeader() {
  const router = useRouter()
  const { userId, smmMode, setSmmMode, selectedBrandId, setSelectedBrandId } = useAppStore()
  const { data: brands } = useBrands(userId)
  const { data: activities } = useRecentActivities()
  const novitaSheetRef = useRef<BottomSheetModal>(null)
  const createBrandSheetRef = useRef<BottomSheetModal>(null)

  const filteredBrands = (brands ?? []).filter((b) => b.workMode === smmMode)

  const selectMode = (mode: SmmMode) => {
    setSmmMode(mode)
    // Il cliente selezionato potrebbe non esistere nella nuova modalità: torna a "Tutti"
    setSelectedBrandId(null)
  }

  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.logo}>CEDeasy</Text>
        <View style={styles.topActions}>
          <View style={styles.modeSwitch}>
            {MODES.map((mode) => {
              const active = smmMode === mode.value
              return (
                <Pressable
                  key={mode.value}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => selectMode(mode.value)}
                >
                  <Text style={[styles.modeBtnLabel, active && styles.modeBtnLabelActive]}>
                    {mode.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Pressable
            style={styles.novitaBtn}
            onPress={() => novitaSheetRef.current?.present()}
          >
            {!!activities?.length && <View style={styles.novitaDot} />}
            <Bell size={14} color={colors.primary} />
            <Text style={styles.novitaLabel}>Novità</Text>
          </Pressable>
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push('/(smm)/profile')}
            hitSlop={8}
          >
            <User size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.brandScroll}
        contentContainerStyle={styles.brandRow}
      >
        <Pressable
          style={[styles.brandPill, selectedBrandId === null && styles.brandPillActive]}
          onPress={() => setSelectedBrandId(null)}
        >
          <Text style={[styles.brandPillText, selectedBrandId === null && styles.brandPillTextActive]}>
            Tutti
          </Text>
        </Pressable>

        {filteredBrands.map((b) => {
          const active = selectedBrandId === b.id
          return (
            <Pressable
              key={b.id}
              style={[styles.brandPill, active && styles.brandPillActive]}
              onPress={() => setSelectedBrandId(b.id)}
            >
              <View style={[styles.brandDot, { backgroundColor: BRAND_COLOR_HEX[b.color] }]} />
              <Text style={[styles.brandPillText, active && styles.brandPillTextActive]} numberOfLines={1}>
                {b.name}
              </Text>
            </Pressable>
          )
        })}

        <Pressable
          style={styles.newBrandPill}
          onPress={() => createBrandSheetRef.current?.present()}
        >
          <Plus size={13} color={colors.primary} />
          <Text style={styles.newBrandPillText}>Nuovo</Text>
        </Pressable>
      </ScrollView>

      <Sheet ref={novitaSheetRef} title="Novità da tutti i clienti" snapPoints={['70%']} scrollable>
        <View style={styles.novitaContent}>
          {!activities?.length ? (
            <EmptyState icon={Bell} title="Nessuna novità" subtitle="Le azioni dei tuoi clienti appariranno qui" />
          ) : (
            activities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                onPress={() => {
                  novitaSheetRef.current?.dismiss()
                  router.push(`/(smm)/brands/${a.brandId}?openPostId=${a.id}`)
                }}
              />
            ))
          )}
        </View>
      </Sheet>

      <CreateBrandSheet sheetRef={createBrandSheetRef} />
    </>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  logo: { ...typography.displayHeadingMedium, color: colors.primary },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 3,
  },
  modeBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  modeBtnLabelActive: { color: colors.primaryForeground },

  novitaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  novitaDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  novitaLabel: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  profileBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandScroll: { flexGrow: 0 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 32,
    paddingBottom: spacing.md,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  brandPillActive: { backgroundColor: colors.text.primary },
  brandDot: { width: 8, height: 8, borderRadius: 4 },
  brandPillText: { ...typography.smallMedium, color: colors.text.primary },
  brandPillTextActive: { color: colors.primaryForeground },
  newBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  newBrandPillText: { ...typography.smallMedium, color: colors.primary },

  novitaContent: { padding: spacing.lg, gap: spacing.sm },
})
