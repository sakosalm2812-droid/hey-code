import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { resolveAccountPlan } from './lib/accountRecords.js'
import { enablePersistenceSync, disablePersistenceSync, hydrateFromSupabase } from './lib/persistenceSync.js'
import { createAuthLifecycle } from './lib/authLifecycle.js'
import { resetAccountState } from './core/accountState.js'
import { setMissionAccount } from './core/infinity/missionEngine.js'

const AuthContext = createContext(null)

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    session: null,
    identity: null,
    profile: null,
    loading: !DEV_MODE,
    error: null
  })
  const lifecycle = useRef(null)

  useEffect(() => {
    // Dev mode bypass - mock a user instantly
    if (DEV_MODE) {
      const devUser = { id: 'dev-owner', email: 'sako@hey.app', role: 'owner', user_metadata: { display_name: 'Owner' } }
      const devSession = { user: devUser, access_token: 'dev-token', refresh_token: 'dev-token' }
      const devProfile = { id: 'dev-owner', display_name: 'Owner', plan: 'owner', entitlements: ['all'] }

      setState({
        session: devSession,
        identity: devUser,
        profile: devProfile,
        loading: false,
        error: null
      })
      return
    }

    const account = createAuthLifecycle({
      client: supabase,
      onState: (changes) => setState((previous) => ({ ...previous, ...changes })),
      resetAccountState,
      setAccountScope: setMissionAccount,
      hydrate: hydrateFromSupabase,
      enableSync: enablePersistenceSync,
      disableSync: disablePersistenceSync,
    })
    lifecycle.current = account
    account.start()
    return () => {
      lifecycle.current = null
      account.stop()
    }
  }, [])

  const value = useMemo(() => ({
    ...state,
    user: state.session?.user ?? null,
    plan: resolveAccountPlan({ plan: state.profile?.plan, entitlements: state.profile?.entitlements || [] }),
    refreshProfile: (userId) => lifecycle.current?.refreshProfile(userId),
    retryAccount: () => lifecycle.current?.retry(),
    signUp: (email, password, displayName) => supabase.auth.signUp({
      email, password, options: { data: { display_name: displayName } },
    }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }),
    signInWithApple: () => supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  }), [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
