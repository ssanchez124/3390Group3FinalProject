import { View, Text, StyleSheet } from 'react-native'

export default function History() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Workout History — Coming in Phase 5</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ADD8E6', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#444' },
})