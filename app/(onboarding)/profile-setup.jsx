import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

function GlassCard({ children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      {children}
    </View>
  )
}

function SectionLabel({ children }) {
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelAccent} />
      <Text style={styles.label}>{children}</Text>
    </View>
  )
}

function ChipRow({ options, selected, onSelect }) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function ProfileSetup() {
  const router = useRouter()
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!age || !gender || !weightKg || !heightCm) {
      Alert.alert('Missing Info', 'Please fill in all fields.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      age: parseInt(age),
      gender: gender.toLowerCase().replace(/ /g, '_'),
      weight_kg: parseFloat(weightKg),
      height_cm: parseFloat(heightCm),
    })
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.replace('/(tabs)/home')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ONBOARDING</Text>
            </View>
          </View>
          <Text style={styles.title}>Set Up Your{'\n'}Profile</Text>
          <Text style={styles.subtitle}>This helps us personalize your workouts.</Text>
        </View>

        <GlassCard>
          <SectionLabel>Age</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="e.g. 22"
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Gender</SectionLabel>
          <ChipRow options={GENDERS} selected={gender} onSelect={setGender} />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Weight (kg)</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="e.g. 70"
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Height (cm)</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="e.g. 175"
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
          />
        </GlassCard>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#EF88AD" />
            : <Text style={styles.buttonText}>Save & Continue</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#080005',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.28)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF88AD',
    letterSpacing: 3,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(165, 56, 96, 0.85)',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.3)',
    overflow: 'hidden',
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(239, 136, 173, 0.28)',
    borderRadius: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EF88AD',
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(8, 0, 5, 0.55)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 0, 5, 0.45)',
  },
  chipActive: {
    backgroundColor: 'rgba(239, 136, 173, 0.12)',
    borderColor: '#EF88AD',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.8)',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#EF88AD',
    fontWeight: '700',
  },
  button: {
    marginTop: 24,
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(103, 13, 47, 0.15)',
    shadowOpacity: 0,
    borderColor: 'rgba(165, 56, 96, 0.25)',
  },
  buttonText: {
    color: '#EF88AD',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
})
