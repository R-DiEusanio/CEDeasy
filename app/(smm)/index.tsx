import { useEffect, useState } from 'react'
import { ScrollView, RefreshControl, StyleSheet, Text, View, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Activity as ActivityIcon, Bell } from 'lucide-react-native'
import { useRecentActivities, useRecentPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import type { SmmMode } from '../../src/lib/app-store'
import { ActivityCard } from '../../components/ActivityCard'
import { PostCard } from '../../components/PostCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { OnboardingModal, ONBOARDING_KEY } from '../../components/OnboardingModal'
import { colors } from '../../constants/colors'
import { spacing, radius } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const MODES: { value: SmmMode; label: string }[] = [
  { value: 'consulenza', label: 'Consulenza' },
  { value: 'gestione',   label: 'Gestione'   },
]

export default function SmmDashboardScreen() {
  const { userId, smmMode, setSmmMode } = useAppStore()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) setShowOnboarding(true)
    })
  }, [])

  const {
    data: activities,
    isLoading: loadingActivities,
    refetch: refetchActivities,
  } = useRecentActivities()
  const {
    data: recentPosts,
    isLoading: loadingPosts,
    refetch: refetchPosts,
  } = useRecentPosts(userId)

  // Filtro reale per la tab attiva — prima smmMode era solo cosmetico
  const filteredActivities = activities?.filter((a) => a.workMode === smmMode)
  const filteredPosts = recentPosts?.filter((p) => p.workMode === smmMode)

  const onRefresh = async () => {
    await Promise.all([refetchActivities(), refetchPosts()])
  }

  return (
    <>
    <OnboardingModal
      visible={showOnboarding}
      onDone={() => setShowOnboarding(false)}
    />
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.heading}>Dashboard</Text>

      {/* Switch Consulenza / Gestione */}
      <View style={styles.modeSwitch}>
        {MODES.map((mode) => {
          const active = smmMode === mode.value
          return (
            <Pressable
              key={mode.value}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
              onPress={() => setSmmMode(mode.value)}
            >
              <Text style={[styles.modeBtnLabel, active && styles.modeBtnLabelActive]}>
                {mode.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Attività recenti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attività recenti</Text>
        {loadingActivities ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !filteredActivities?.length ? (
          <EmptyState
            icon={ActivityIcon}
            title="Nessuna attività"
            subtitle="Le azioni dei tuoi clienti appariranno qui"
          />
        ) : (
          <View style={styles.list}>
            {filteredActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                onPress={() => router.push(`/(smm)/brands/${a.brandId}?openPostId=${a.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Post recenti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Post recenti</Text>
        {loadingPosts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !filteredPosts?.length ? (
          <EmptyState
            icon={Bell}
            title="Nessun post recente"
            subtitle="I post che hai creato appariranno qui"
          />
        ) : (
          <View style={styles.list}>
            {filteredPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  heading: { ...typography.h1, color: colors.text.primary },

  // mode switch
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.input,
    borderRadius: radius.lg,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  modeBtnActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnLabel: {
    ...typography.smallMedium,
    color: colors.text.muted,
  },
  modeBtnLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  section: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  list: { gap: spacing.sm },
})
