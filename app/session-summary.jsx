import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'

export default function SessionSummary() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.subtitle}>
          Your sets have been saved. Keep showing up — that's how progress is made.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/history')}
        >
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 15,
    fontWeight: '600',
  },
})