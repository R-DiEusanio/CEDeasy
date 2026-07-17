import { useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import type { Post } from '../../src/lib/mock-data'
import { usePosts, useAllPosts } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import { STATUS_CONFIG, STATUS_ORDER } from '../../src/lib/status-config'
import { getBrandHue } from '../../src/lib/mock-data'
import { Badge } from '../../components/ui/Badge'
import { PostCard } from '../../components/PostCard'
import { CreatePostSheet } from '../../components/CreatePostSheet'
import { PostDetailSheet } from '../../components/PostDetailSheet'
import { SmmHeader } from '../../components/SmmHeader'
import type { BottomSheetModal } from '../../components/ui/BottomSheet'
import { EmptyState } from '../../components/ui/EmptyState'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const MAX_DOTS = 3

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function SmmCalendarioScreen() {
  const { userId, smmMode, selectedBrandId } = useAppStore()
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const detailSheetRef = useRef<BottomSheetModal>(null)
  const createSheetRef = useRef<BottomSheetModal>(null)

  const singleBrandQuery = usePosts(selectedBrandId)
  const allBrandsQuery = useAllPosts(userId)
  const { data: posts } = selectedBrandId ? singleBrandQuery : allBrandsQuery

  const filteredPosts = useMemo(
    () => (posts ?? []).filter((p) => p.workMode === smmMode),
    [posts, smmMode]
  )

  const postsByDay = useMemo(() => {
    const map = new Map<number, Post[]>()
    for (const p of filteredPosts) {
      const d = new Date(p.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(p)
      }
    }
    return map
  }, [filteredPosts, year, month])

  const dayPosts = useMemo(
    () => filteredPosts.filter((p) => sameDay(new Date(p.date), selectedDate)),
    [filteredPosts, selectedDate]
  )

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const selectedLabel = selectedDate.toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
  const isToday = sameDay(selectedDate, today)

  const openPost = (post: Post) => {
    setSelectedPost(post)
    detailSheetRef.current?.present()
  }

  return (
    <>
    <View style={styles.screen}>
      <SmmHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Calendario</Text>
        <Text style={styles.subheading}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} · tocca un giorno per filtrare
        </Text>

        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />
              const dateForCell = new Date(year, month, day)
              const selected = sameDay(dateForCell, selectedDate)
              const posts = postsByDay.get(day) ?? []

              return (
                <Pressable
                  key={day}
                  style={styles.cell}
                  onPress={() => setSelectedDate(dateForCell)}
                >
                  <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{day}</Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {posts.slice(0, MAX_DOTS).map((p, idx) => (
                      <View
                        key={p.id}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: selectedBrandId
                              ? STATUS_CONFIG[p.status].dotColor
                              : `hsl(${getBrandHue(p.brandId)}, 65%, 55%)`,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legend}>
          {STATUS_ORDER.map((status) => (
            <Badge key={status} status={status} />
          ))}
        </ScrollView>

        <Text style={styles.dayHeading}>
          {isToday ? 'OGGI · ' : ''}{selectedLabel.toUpperCase()}
        </Text>

        {dayPosts.length === 0 ? (
          <EmptyState title="Nessun contenuto in questo giorno" />
        ) : (
          <View style={styles.dayList}>
            {dayPosts.map((p) => (
              <PostCard key={p.id} post={p} onPress={() => openPost(p)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => createSheetRef.current?.present()} hitSlop={8}>
        <Plus size={26} color="#fff" />
      </Pressable>
    </View>

    <CreatePostSheet
      sheetRef={createSheetRef}
      defaultBrandId={selectedBrandId ?? undefined}
      defaultDate={selectedDate}
    />
    <PostDetailSheet sheetRef={detailSheetRef} post={selectedPost} />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] * 2, gap: spacing.md },
  heading: { ...typography.displayHeading, color: colors.text.primary },
  subheading: { ...typography.body, color: colors.text.secondary },

  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  weekRow: { flexDirection: 'row' },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: spacing.xs, gap: 3 },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primary },
  dayNum: { ...typography.smallMedium, color: colors.text.primary },
  dayNumSelected: { color: colors.primaryForeground, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  legend: { gap: spacing.sm, paddingVertical: spacing.xs },

  dayHeading: { ...typography.label, color: colors.text.muted, marginTop: spacing.sm },
  dayList: { gap: spacing.sm },

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
