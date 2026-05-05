import { useEffect, useState, useCallback } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'

function AuthGate({ children }) {
  const segments = useSegments()
  const router = useRouter()
  const [session, setSession] = useState(undefined)
  const [hasProfile, setHasProfile] = useState(undefined)

  const checkProfile = useCallback(async (sess) => {
    if (!sess) { setHasProfile(false); return }
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', sess.user.id)
        .single()
      setHasProfile(!!data)
    } catch {
      setHasProfile(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      checkProfile(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      checkProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [checkProfile])

  useEffect(() => {
    if (session === undefined || hasProfile === undefined) return

    const inAuthGroup = segments[0] === '(auth)'
      const onPersonalDetails = segments[0] === 'personal-details'
      const onboardingComplete = session?.user?.user_metadata?.onboarding_complete === true

    if (!session && !inAuthGroup) {
      router.replace('/(auth)')
      return
    } 
    if (session && !onboardingComplete && !onPersonalDetails) {
      router.replace('/personal-details')
      return
    }
    if (session && onboardingComplete && inAuthGroup) {
      router.replace('/(tabs)/home')
    }
  }, [session, hasProfile, segments])

  return children
}

export default function RootLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  )
}