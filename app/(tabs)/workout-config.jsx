import { View, Text, StyleSheet } from 'react-native'

export default function WorkoutConfig() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Workout Config — Coming in Phase 3</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ADD8E6', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#444' },
})