import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import { getMyProfile } from './supabase/profiles'

export type Role = 'smm' | 'client'

interface AppState {
  role: Role
  setRole: (r: Role) => void
  activeBrandId: string | null
  setActiveBrandId: (id: string | null) => void
  userId: string | null
  isReady: boolean
}

const Ctx = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('smm')
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)

      if (uid) {
        try {
          const profile = await getMyProfile()
          setRole(profile.role === 'SMM' ? 'smm' : 'client')
        } catch {
          // profilo non trovato — default smm
        }
      }

      setIsReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user.id ?? null
      setUserId(uid)

      if (uid) {
        try {
          const profile = await getMyProfile()
          setRole(profile.role === 'SMM' ? 'smm' : 'client')
        } catch {
          // profilo non trovato
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AppState>(
    () => ({ role, setRole, activeBrandId, setActiveBrandId, userId, isReady }),
    [role, activeBrandId, userId, isReady]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStore missing')
  return v
}
