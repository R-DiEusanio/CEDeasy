import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { WifiOff } from 'lucide-react-native'
import { spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

export function OfflineBanner() {
  const [slideAnim] = useState(() => new Animated.Value(-40))

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isOffline =
        state.isConnected === false ||
        (state.isConnected === true && state.isInternetReachable === false)

      Animated.timing(slideAnim, {
        toValue: isOffline ? 0 : -40,
        duration: 300,
        useNativeDriver: true,
      }).start()
    })
    return unsub
  }, [slideAnim])

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <WifiOff size={13} color="#fff" />
      <Text style={styles.text}>Nessuna connessione</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: '#ef4444',
  },
  text: { ...typography.smallMedium, color: '#fff' },
})
