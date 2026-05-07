import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { setWorkoutPlan } from '../../lib/workoutStore'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body']
const DURATIONS = [15, 30, 45, 60]
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const EXERCISE_COUNTS = [3, 4, 5, 6, 7, 8]

function SectionLabel({ children }) {
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelAccent} />
      <Text style={styles.label}>{children}</Text>
    </View>
  )
}

function GlassCard({ children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      {children}
    </View>
  )
}

function MuscleDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false)

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onSelect(selected.filter(o => o !== opt))
    } else if (selected.length < 3) {
      onSelect([...selected, opt])
    }
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text
          style={selected.length === 0 ? styles.dropdownPlaceholder : styles.dropdownValue}
          numberOfLines={1}
        >
          {selected.length === 0 ? 'Select up to 3 muscle groups' : selected.join('  ·  ')}
        </Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          {MUSCLE_GROUPS.map((opt, index) => {
            const active = selected.includes(opt)
            const maxed = !active && selected.length >= 3
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.dropdownItem,
                  index < MUSCLE_GROUPS.length - 1 && styles.dropdownItemBorder,
                  active && styles.dropdownItemActive,
                ]}
                onPress={() => toggle(opt)}
                disabled={maxed}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownItemText,
                  active && styles.dropdownItemTextActive,
                  maxed && styles.dropdownItemTextMaxed,
                ]}>
                  {opt}
                </Text>
                {active && <Text style={styles.dropdownCheck}>✓</Text>}
                {maxed && <Text style={styles.dropdownLock}>—</Text>}
              </TouchableOpacity>
            )
          })}
          {selected.length === 3 && (
            <View style={styles.dropdownMaxNote}>
              <Text style={styles.dropdownMaxNoteText}>MAXIMUM 3 SELECTED</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

function ChipRow({ options, selected, onSelect, multi = false }) {
  const toggle = (opt) => {
    if (multi) {
      onSelect(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt])
    } else {
      onSelect(opt)
    }
  }
  return (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected === opt
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => toggle(opt)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default function WorkoutConfig() {
  const router = useRouter()
  const [muscleGroups, setMuscleGroups] = useState([])
  const [numExercises, setNumExercises] = useState(5)
  const [duration, setDuration] = useState(30)
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (muscleGroups.length === 0) {
      Alert.alert('Select muscles', 'Pick at least one muscle group.')
      return
    }
    if (!difficulty) {
      Alert.alert('Select difficulty', 'Pick a difficulty level.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutConfig: {
            muscleGroups: muscleGroups.map(m => m.toLowerCase()),
            numExercises,
            durationMinutes: duration,
            difficulty: difficulty.toLowerCase(),
          },
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      setWorkoutPlan(data)
      router.push('/workout-display')
    } catch (err) {
      Alert.alert('Generation Failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI-POWERED</Text>
            </View>
          </View>
          <Text style={styles.title}>Build Your{'\n'}Workout</Text>
          <Text style={styles.subtitle}>Customize every detail and let AI craft your perfect session.</Text>
        </View>

        <GlassCard>
          <SectionLabel>Muscle Groups</SectionLabel>
          <Text style={styles.cardHint}>Select up to 3 target areas</Text>
          <MuscleDropdown selected={muscleGroups} onSelect={setMuscleGroups} />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Number of Exercises</SectionLabel>
          <ChipRow options={EXERCISE_COUNTS} selected={numExercises} onSelect={setNumExercises} />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Duration</SectionLabel>
          <ChipRow options={DURATIONS.map(d => `${d} min`)} selected={`${duration} min`}
            onSelect={(val) => setDuration(parseInt(val))} />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Difficulty</SectionLabel>
          <ChipRow options={DIFFICULTIES} selected={difficulty} onSelect={setDifficulty} />
        </GlassCard>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading
            ? <><ActivityIndicator color="#EF88AD" /><Text style={styles.buttonText}>  Generating...</Text></>
            : <Text style={styles.buttonText}>Generate Workout</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
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
    paddingBottom: 52,
  },
  header: {
    marginBottom: 30,
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
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
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
    marginBottom: 4,
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
  cardHint: {
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 10,
    marginLeft: 13,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 0, 5, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 8,
  },
  dropdownTriggerOpen: {
    borderColor: 'rgba(239, 136, 173, 0.65)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.65)',
    flex: 1,
  },
  dropdownValue: {
    fontSize: 13,
    color: '#EF88AD',
    fontWeight: '600',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#EF88AD',
    marginLeft: 8,
  },
  dropdownMenu: {
    backgroundColor: 'rgba(8, 0, 5, 0.88)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(239, 136, 173, 0.65)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 5, 25, 0.9)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(239, 136, 173, 0.09)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: 'rgba(196, 119, 142, 0.75)',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#EF88AD',
    fontWeight: '700',
  },
  dropdownItemTextMaxed: {
    color: 'rgba(90, 42, 58, 0.5)',
  },
  dropdownCheck: {
    fontSize: 14,
    color: '#EF88AD',
    fontWeight: '700',
  },
  dropdownLock: {
    fontSize: 14,
    color: 'rgba(90, 42, 58, 0.5)',
  },
  dropdownMaxNote: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(58, 5, 25, 0.9)',
    alignItems: 'center',
  },
  dropdownMaxNoteText: {
    fontSize: 10,
    color: '#EF88AD',
    fontWeight: '700',
    letterSpacing: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
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
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
