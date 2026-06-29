import { ScrollView, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Activity as ActivityIcon, Bell } from 'lucide-react-native'
import { useRecentActivities, useRecentPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import { ActivityCard } from '../../components/ActivityCard'
import { PostCard } from '../../components/PostCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

export default function SmmDashboardScreen() {
  const { userId } = useAppStore()
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

  const onRefresh = async () => {
    await Promise.all([refetchActivities(), refetchPosts()])
  }

  return (
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

      {/* Attività recenti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attività recenti</Text>
        {loadingActivities ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !activities?.length ? (
          <EmptyState
            icon={ActivityIcon}
            title="Nessuna attività"
            subtitle="Le azioni dei tuoi clienti appariranno qui"
          />
        ) : (
          <View style={styles.list}>
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
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
        ) : !recentPosts?.length ? (
          <EmptyState
            icon={Bell}
            title="Nessun post recente"
            subtitle="I post che hai creato appariranno qui"
          />
        ) : (
          <View style={styles.list}>
            {recentPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
  section: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  list: { gap: spacing.sm },
})
