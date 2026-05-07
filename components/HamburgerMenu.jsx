import { useState, useRef } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const DRAWER_WIDTH = 270

const NAV_ITEMS = [
  { label: 'Home', route: '/(tabs)/home', segment: 'home' },
  { label: 'Workout', route: '/(tabs)/workout-config', segment: 'workout-config' },
  { label: 'History', route: '/(tabs)/history', segment: 'history' },
]

export default function HamburgerMenu({ title }) {
  const [open, setOpen] = useState(false)
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  const openDrawer = () => {
    setOpen(true)
    Animated.timing(translateX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  const closeDrawer = (callback) => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false)
      callback?.()
    })
  }

  const navigate = (route) => {
    closeDrawer(() => router.navigate(route))
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.hamburgerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="boxing-glove" size={28} color="#EF88AD" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>{title ?? ''}</Text>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/profile')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Image source={require('../assets/icons8-monkey-64.png')} style={styles.monkeyIcon} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => closeDrawer()}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, styles.overlay]}
            activeOpacity={1}
            onPress={() => closeDrawer()}
          />
          <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
            <View style={[styles.drawerInner, { paddingTop: insets.top + 24 }]}>
              <Text style={styles.drawerHeading}>Menu</Text>
              {NAV_ITEMS.map(({ label, route, segment }) => {
                const active = pathname.includes(segment)
                return (
                  <TouchableOpacity
                    key={route}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => navigate(route)}
                  >
                    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: '#080005',
  },
  hamburgerBtn: {
    padding: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#EF88AD',
  },
  monkeyIcon: {
    width: 48,
    height: 48,
  },
  modalRoot: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#080005',
    borderRightWidth: 1,
    borderRightColor: 'rgba(165, 56, 96, 0.3)',
    shadowColor: '#EF88AD',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerInner: {
    paddingHorizontal: 24,
  },
  drawerHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EF88AD',
    marginBottom: 28,
    letterSpacing: 1,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(239, 136, 173, 0.12)',
    borderColor: 'rgba(239, 136, 173, 0.45)',
  },
  navLabel: {
    fontSize: 15,
    color: 'rgba(165, 56, 96, 0.8)',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#EF88AD',
    fontWeight: '700',
  },
})
