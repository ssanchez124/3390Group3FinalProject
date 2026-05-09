import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
        placeholderTextColor="rgba(239, 136, 173, 0.35)"
        value={weightKg}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.setInput}
        placeholder="reps"
        placeholderTextColor="rgba(239, 136, 173, 0.35)"
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
      <View style={styles.cardSheen} />
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
        <View style={styles.headerSheen} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Your Sets</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Fill in the weight and reps you actually completed for each set. Leave a set blank to skip it.
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
            ? <ActivityIndicator color="#EF88AD" />
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
    backgroundColor: '#080005',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(58, 5, 25, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165, 56, 96, 0.3)',
    overflow: 'hidden',
  },
  headerSheen: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(239, 136, 173, 0.2)',
  },
  backButton: {
    marginRight: 14,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    color: '#EF88AD',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.85)',
    marginBottom: 16,
    lineHeight: 19,
  },
  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  muscleGroup: {
    fontSize: 12,
    color: '#EF88AD',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  setHeaderLabel: {
    fontSize: 11,
    color: 'rgba(165, 56, 96, 0.7)',
    fontWeight: '600',
    width: 80,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  setLabel: {
    fontSize: 13,
    color: '#EF88AD',
    fontWeight: '700',
    width: 40,
  },
  setInput: {
    flex: 1,
    backgroundColor: 'rgba(8, 0, 5, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.35)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
    color: '#FFFFFF',
  },
  addSetButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addSetText: {
    color: '#EF88AD',
    fontWeight: '700',
    fontSize: 13,
  },
  completeButton: {
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(103, 13, 47, 0.15)',
    shadowOpacity: 0,
    borderColor: 'rgba(165, 56, 96, 0.25)',
  },
  completeButtonText: {
    color: '#EF88AD',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
})
