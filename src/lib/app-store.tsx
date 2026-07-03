import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { getMyProfile, getMyBrandId } from './supabase/profiles'

export type Role = 'smm' | 'client'
export type SmmMode = 'consulenza' | 'gestione'

const SMM_MODE_KEY = '@cedeasy/smm_mode'

interface AppState {
  role: Role
  setRole: (r: Role) => void
  smmMode: SmmMode
  setSmmMode: (m: SmmMode) => void
  activeBrandId: string | null
  setActiveBrandId: (id: string | null) => void
  userId: string | null
  isReady: boolean
}

const Ctx = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('smm')
  const [smmMode, _setSmmMode] = useState<SmmMode>('consulenza')
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(SMM_MODE_KEY).then((val) => {
      if (val === 'consulenza' || val === 'gestione') _setSmmMode(val)
    })
  }, [])

  const setSmmMode = (m: SmmMode) => {
    _setSmmMode(m)
    AsyncStorage.setItem(SMM_MODE_KEY, m)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)

      if (uid) {
        try {
          const profile = await getMyProfile()
          const resolvedRole = profile.role === 'SMM' ? 'smm' : 'client'
          setRole(resolvedRole)
          if (resolvedRole === 'client') {
            setActiveBrandId(await getMyBrandId())
          }
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
          const resolvedRole = profile.role === 'SMM' ? 'smm' : 'client'
          setRole(resolvedRole)
          if (resolvedRole === 'client') {
            setActiveBrandId(await getMyBrandId())
          }
        } catch {
          // profilo non trovato
        }
      } else {
        setActiveBrandId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AppState>(
    () => ({ role, setRole, smmMode, setSmmMode, activeBrandId, setActiveBrandId, userId, isReady }),
    [role, smmMode, activeBrandId, userId, isReady]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStore missing')
  return v
}
