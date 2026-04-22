import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0F172A' }, headerTintColor: '#fff', contentStyle: { backgroundColor: '#0F172A' },}}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="personal-details" options={{ title: 'Complete Profile' }}
      />
    </Stack>
  );
}