import { View, Text, StyleSheet } from 'react-native'

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile — Coming in Phase 2</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ADD8E6', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#444' },
})