import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import Bootzie from '../../assets/homeicon.png'

export default function Home() {
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
    // auth state change in _layout.jsx redirects to /(auth)/login
  }

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI-POWERED</Text>
        </View>
      </View>

      <Image source={Bootzie} style={styles.logo} />

<Text style={styles.subtitle}>Ready to get moving?</Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/(tabs)/workout-config')}
      >
        <Text style={styles.startButtonText}>Start a Workout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080005',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.28)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF88AD',
    letterSpacing: 3,
  },
  logo: {
    width: 420,
    height: 420,
    marginBottom: 0,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(165, 56, 96, 0.85)',
    marginBottom: 16,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  startButtonText: {
    color: '#EF88AD',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoutButton: {
    marginTop: 4,
    paddingVertical: 10,
  },
  logoutText: {
    color: 'rgba(165, 56, 96, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
})
