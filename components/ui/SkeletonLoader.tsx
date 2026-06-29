import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { radius } from '../../constants/spacing'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.View
      style={[styles.skeleton, { width: width as any, height, borderRadius, opacity }]}
    />
  )
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.textGroup}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton height={12} />
      <Skeleton width="80%" height={12} />
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: '#e2e8f0' },
  card: { padding: 16, gap: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textGroup: { flex: 1, gap: 6 },
})
