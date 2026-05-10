import { Tabs } from 'expo-router'
import HamburgerMenu from '../../components/HamburgerMenu'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => <HamburgerMenu title={options.title} />,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="workout-config" options={{ title: 'Workout' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}