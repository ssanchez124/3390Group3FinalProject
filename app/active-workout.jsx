import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { getWorkoutPlan } from '../lib/workoutStore'

// Build the initial logging state from the AI plan.
// For each exercise, create one row per set the AI recommended.
// Each row starts empty — the user fills in what they actually lifted.
function buildInitialLogs(exercises) {
  return exercises.map(ex => ({
    exercise_name: ex.name,
    muscle_group: ex.muscleGroup,
    sets: Array.from({ length: ex.sets }, (_, i) => ({
      set: i + 1,
      reps: '',
      weight_kg: '',
    })),
  }))
}

function SetRow({ setNum, reps, weightKg, onChangeReps, onChangeWeight }) {
  return (
    <View style={styles.setRow}>
      <Text style={styles.setLabel}>Set {setNum}</Text>
      <TextInput
        style={styles.setInput}
        placeholder="kg"
        placeholderTextColor="#aaa"
        value={weightKg}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.setInput}
        placeholder="reps"
        placeholderTextColor="#aaa"
        value={reps}
        onChangeText={onChangeReps}
        keyboardType="numeric"
      />
    </View>
  )
}

function ExerciseLogger({ log, onChange }) {
  const updateSet = (setIndex, field, value) => {
    const updatedSets = log.sets.map((s, i) =>
      i === setIndex ? { ...s, [field]: value } : s
    )
    onChange({ ...log, sets: updatedSets })
  }

  const addSet = () => {
    onChange({
      ...log,
      sets: [...log.sets, { set: log.sets.length + 1, reps: '', weight_kg: '' }],
    })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.exerciseName}>{log.exercise_name}</Text>
      <Text style={styles.muscleGroup}>{log.muscle_group}</Text>

      <View style={styles.setHeader}>
        <Text style={styles.setHeaderLabel}>Set</Text>
        <Text style={styles.setHeaderLabel}>Weight (kg)</Text>
        <Text style={styles.setHeaderLabel}>Reps</Text>
      </View>

      {log.sets.map((s, i) => (
        <SetRow
          key={i}
          setNum={s.set}
          reps={s.reps}
          weightKg={s.weight_kg}
          onChangeReps={val => updateSet(i, 'reps', val)}
          onChangeWeight={val => updateSet(i, 'weight_kg', val)}
        />
      ))}

      <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function ActiveWorkout() {
  const router = useRouter()
  const plan = getWorkoutPlan()
  const [logs, setLogs] = useState(() => buildInitialLogs(plan.exercises))
  const [saving, setSaving] = useState(false)

  const updateLog = (index, updatedLog) => {
    setLogs(prev => prev.map((l, i) => i === index ? updatedLog : l))
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Create the session row — one row per completed workout
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (sessionError) throw sessionError

      // 2. For each exercise, save its sets_data as a JSON array.
      //    We filter out sets where both reps and weight are empty.
      const exerciseLogs = logs.map(log => ({
        session_id: session.id,
        user_id: user.id,
        exercise_name: log.exercise_name,
        muscle_group: log.muscle_group,
        sets_data: log.sets
          .filter(s => s.reps !== '' || s.weight_kg !== '')
          .map(s => ({
            set: s.set,
            reps: parseInt(s.reps) || 0,
            weight_kg: parseFloat(s.weight_kg) || 0,
          })),
      })).filter(log => log.sets_data.length > 0)

      if (exerciseLogs.length > 0) {
        const { error: logsError } = await supabase
          .from('exercise_logs')
          .insert(exerciseLogs)
        if (logsError) throw logsError
      }

      router.replace('/session-summary')
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Your Sets</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Fill in the weight and reps you actually completed for each set.
          Leave a set blank to skip it.
        </Text>

        {logs.map((log, i) => (
          <ExerciseLogger
            key={i}
            log={log}
            onChange={updated => updateLog(i, updated)}
          />
        ))}

        <TouchableOpacity
          style={[styles.completeButton, saving && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.completeButtonText}>Complete Workout</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 14,
  },
  backText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  muscleGroup: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  setHeaderLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    width: 80,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  setLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    width: 40,
  },
  setInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
    color: '#1a1a2e',
  },
  addSetButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addSetText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  completeButtonDisabled: {
    backgroundColor: '#81C784',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
