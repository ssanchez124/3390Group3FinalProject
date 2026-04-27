import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import Bootzie from '../../assets/BootSmug.png'

export default function Home() {
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
    // auth state change in _layout.jsx redirects to /(auth)/login
  }

  return (
    <View style={styles.container}>
      <Image source={Bootzie} style={styles.logo} />
      <Text style={styles.title}>Workout App</Text>
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
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 40,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#c0392b',
    fontSize: 14,
    fontWeight: '600',
  },
})