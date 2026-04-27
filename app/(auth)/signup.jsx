import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image, ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import Bootzie from '../../assets/BootSmug.png'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      Alert.alert('Signup Failed', error.message)
    } else {
      Alert.alert(
        'Account Created',
        'Welcome! Your account is ready.',
        [{ text: 'OK' }]
      )
      // auth state change in _layout.jsx will redirect to /(tabs)/home
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={Bootzie} style={styles.logo} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your fitness journey</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign Up</Text>
          }
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkHighlight}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkRow: {
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#444',
  },
  linkHighlight: {
    color: '#2e7d32',
    fontWeight: '700',
  },
})