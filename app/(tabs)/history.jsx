import { View, Text, StyleSheet } from 'react-native'

export default function History() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>COMING SOON</Text>
      <Text style={styles.title}>Workout History</Text>
      <Text style={styles.subtitle}>Your past sessions will appear here.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080005',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF88AD',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(165, 56, 96, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
})
