import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body']
const DURATIONS = [15, 30, 45, 60]
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const EXERCISE_COUNTS = [3, 4, 5, 6, 7, 8]

function SectionLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>
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

      router.push({
        pathname: '/workout-display',
        params: { plan: JSON.stringify(data) },
      })
    } catch (err) {
      Alert.alert('Generation Failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Build Your Workout</Text>

      <SectionLabel>Muscle Groups</SectionLabel>
      <ChipRow options={MUSCLE_GROUPS} selected={muscleGroups} onSelect={setMuscleGroups} multi />

      <SectionLabel>Number of Exercises</SectionLabel>
      <ChipRow options={EXERCISE_COUNTS} selected={numExercises} onSelect={setNumExercises} />

      <SectionLabel>Duration</SectionLabel>
      <ChipRow options={DURATIONS.map(d => `${d} min`)} selected={`${duration} min`}
        onSelect={(val) => setDuration(parseInt(val))} />

      <SectionLabel>Difficulty</SectionLabel>
      <ChipRow options={DIFFICULTIES} selected={difficulty} onSelect={setDifficulty} />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading
          ? <><ActivityIndicator color="#fff" /><Text style={styles.buttonText}>  Generating...</Text></>
          : <Text style={styles.buttonText}>Generate Workout</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 20,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  button: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonDisabled: {
    backgroundColor: '#81C784',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})