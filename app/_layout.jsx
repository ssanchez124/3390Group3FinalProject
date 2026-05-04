import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'

function AuthGate({ children }) {
  const segments = useSegments()
  const router = useRouter()
  const [session, setSession] = useState(undefined) // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return // wait for initial load

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
  }, [session, segments])

  return children
}

export default function RootLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  )
}