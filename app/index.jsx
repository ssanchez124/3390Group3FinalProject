import { View, ActivityIndicator, StyleSheet } from 'react-native'

// This screen briefly shows while the auth guard in _layout.jsx
// determines whether to redirect to /(auth)/login or /(tabs)/home.
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
})