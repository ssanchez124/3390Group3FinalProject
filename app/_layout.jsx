import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'

function AuthGate({ children }) {
  const segments = useSegments()
  const router = useRouter()
  const [session, setSession] = useState(undefined)
  const [hasProfile, setHasProfile] = useState(undefined)

  // Check profile whenever session changes
  const checkProfile = async (sess) => {
    if (!sess) { setHasProfile(false); return }
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', sess.user.id)
      .single()
    setHasProfile(!!data)
  }

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
  }, [])

  useEffect(() => {
    if (session === undefined || hasProfile === undefined) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (!hasProfile) {
      if (!inOnboarding) router.replace('/(onboarding)/profile-setup')
    } else {
      if (inAuthGroup || inOnboarding) router.replace('/(tabs)/home')
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
