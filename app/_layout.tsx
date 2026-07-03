import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppState } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import Toast from 'react-native-toast-message'
import { AppStoreProvider, useAppStore } from '../src/lib/app-store'
import { OfflineBanner } from '../components/OfflineBanner'

// Mantieni la splash visibile finché l'app non è pronta
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// Aggiorna React Query quando l'app torna in foreground
focusManager.setEventListener((onFocus) => {
  const sub = AppState.addEventListener('change', (state) => {
    onFocus(state === 'active')
  })
  return () => sub.remove()
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthGuard />
          <Toast />
          <OfflineBanner />
        </GestureHandlerRootView>
      </AppStoreProvider>
    </QueryClientProvider>
  )
}

function AuthGuard() {
  const { userId, role, isReady } = useAppStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return

    const inAuth = segments[0] === '(auth)'
    const expectedSegment = role === 'smm' ? '(smm)' : '(client)'
    const expectedGroup = role === 'smm' ? '/(smm)' : '/(client)'

    if (!userId && !inAuth) {
      router.replace('/(auth)/login')
    } else if (userId && inAuth) {
      router.replace(expectedGroup)
    } else if (userId && !inAuth && segments[0] && segments[0] !== expectedSegment) {
      // Il gruppo montato non corrisponde al ruolo risolto: può succedere su reload web,
      // dove Expo Router risolve l'URL prima che il ruolo sia noto e (smm)/(client)
      // possono condividere lo stesso path (es. entrambi hanno un index o un profile).
      router.replace(expectedGroup)
    }

    // Nascondi la splash dopo la decisione di routing, non prima
    SplashScreen.hideAsync()
  }, [isReady, userId, role, segments])

  // Non renderizzare nessuna schermata finché l'auth non è determinata
  if (!isReady) return null

  return <Slot />
}
