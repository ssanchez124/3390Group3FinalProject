import { useState } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { getWorkoutPlan } from '../lib/workoutStore'

// Build one empty set row per set the AI recommended
function initSets(count) {
  return Array.from({ length: count }, (_, i) => ({
    set: i + 1,
    reps: '',
    weight_kg: '',
  }))
}

// Build the initial logs object keyed by exercise id
function initLogs(exercises) {
  const logs = {}
  exercises.forEach(ex => {
    logs[ex.id] = initSets(ex.sets)
  })
  return logs
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ExerciseCard({
  exercise, isExpanded, onToggle,
  onSwap, swapping, onRemove,
  sets, onUpdateSet, onAddSet,
}) {
  return (
    <View style={styles.card}>
      {/* ── Top row: name + Swap + Remove ── */}
      <View style={styles.cardTop}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onToggle} activeOpacity={0.7}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, styles.swapBtn, swapping && styles.iconButtonDisabled]}
          onPress={onSwap}
          disabled={swapping}
        >
          {swapping
            ? <ActivityIndicator size="small" color="#4CAF50" />
            : <Text style={styles.swapText}>Swap</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.removeBtn]} onPress={onRemove}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats bar ── */}
      <View style={styles.statsRow}>
        <Stat label="Sets" value={exercise.sets} />
        <Stat label="Reps" value={exercise.reps} />
        <Stat label="Rest" value={`${exercise.restSeconds}s`} />
        <Stat label="Level" value={exercise.difficulty} />
      </View>

      <Text style={styles.instructions}>{exercise.instructions}</Text>

      {/* ── Expand/collapse toggle hint ── */}
      <TouchableOpacity style={styles.toggleRow} onPress={onToggle}>
        <Text style={styles.toggleText}>
          {isExpanded ? '▲ Hide log' : '▼ Log sets'}
        </Text>
      </TouchableOpacity>

      {/* ── Logging section (only when expanded) ── */}
      {isExpanded && (
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={[styles.logHeaderText, { flex: 1 }]}>Set</Text>
            <Text style={[styles.logHeaderText, { flex: 2, textAlign: 'center' }]}>Weight (kg)</Text>
            <Text style={[styles.logHeaderText, { flex: 2, textAlign: 'center' }]}>Reps</Text>
          </View>

          {sets.map((s, i) => (
            <View key={i} style={styles.setRow}>
              <Text style={styles.setNum}>{s.set}</Text>
              <TextInput
                style={styles.setInput}
                placeholder="0"
                placeholderTextColor="#bbb"
                value={s.weight_kg}
                onChangeText={val => onUpdateSet(i, 'weight_kg', val)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.setInput}
                placeholder="0"
                placeholderTextColor="#bbb"
                value={s.reps}
                onChangeText={val => onUpdateSet(i, 'reps', val)}
                keyboardType="numeric"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default function WorkoutDisplay() {
  const router = useRouter()
  const plan = getWorkoutPlan()

  const [exercises, setExercises] = useState(plan.exercises)
  const [expandedIds, setExpandedIds] = useState({})   // { [id]: true/false }
  const [logs, setLogs] = useState(() => initLogs(plan.exercises))
  const [swappingId, setSwappingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const toggleExpand = (id) =>
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))

  const removeExercise = (id) => {
    setExercises(prev => prev.filter(e => e.id !== id))
    setLogs(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const updateSet = (exerciseId, setIndex, field, value) => {
    setLogs(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) =>
        i === setIndex ? { ...s, [field]: value } : s
      ),
    }))
  }

  const addSet = (exerciseId) => {
    setLogs(prev => ({
      ...prev,
      [exerciseId]: [
        ...prev[exerciseId],
        { set: prev[exerciseId].length + 1, reps: '', weight_kg: '' },
      ],
    }))
  }

  const handleSwap = async (exercise) => {
    setSwappingId(exercise.id)
    try {
      const excludeNames = exercises.map(e => e.name)
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutConfig: {},
          swapExercise: {
            id: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            excludeNames,
          },
        },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      const newExercise = { ...data, id: exercise.id }
      setExercises(prev => prev.map(e => e.id === exercise.id ? newExercise : e))
      // Reset the log for this exercise with the new set count
      setLogs(prev => ({ ...prev, [exercise.id]: initSets(newExercise.sets) }))
    } catch (err) {
      Alert.alert('Swap Failed', err.message)
    } finally {
      setSwappingId(null)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Save the session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id })
        .select()
        .single()
      if (sessionError) throw sessionError

      // Save all remaining exercises (not removed). sets_data is [] if user
      // didn't log any weights — exercise still appears in history either way.
      const exerciseLogs = exercises.map(ex => ({
        session_id: session.id,
        user_id: user.id,
        exercise_name: ex.name,
        muscle_group: ex.muscleGroup,
        sets_data: (logs[ex.id] ?? [])
          .filter(s => s.reps !== '' || s.weight_kg !== '')
          .map(s => ({
            set: s.set,
            reps: parseInt(s.reps) || 0,
            weight_kg: parseFloat(s.weight_kg) || 0,
          })),
      }))

      const { error: logsError } = await supabase
        .from('exercise_logs')
        .insert(exerciseLogs)
      if (logsError) throw logsError

      router.replace('/session-summary')
    } catch (err) {
      Alert.alert('Error saving workout', err.message)
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
        <View style={{ flex: 1 }}>
          <Text style={styles.planTitle}>{plan.planTitle}</Text>
          <Text style={styles.planMeta}>
            {plan.totalDuration} min · {exercises.length} exercises
          </Text>
        </View>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            isExpanded={!!expandedIds[item.id]}
            onToggle={() => toggleExpand(item.id)}
            onSwap={() => handleSwap(item)}
            swapping={swappingId === item.id}
            onRemove={() => removeExercise(item.id)}
            sets={logs[item.id] ?? []}
            onUpdateSet={(i, field, val) => updateSet(item.id, i, field, val)}
            onAddSet={() => addSet(item.id)}
          />
        )}
        ListFooterComponent={
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
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#ADD8E6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: { marginRight: 12 },
  backText: { fontSize: 15, color: '#2e7d32', fontWeight: '600' },
  planTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  planMeta: { fontSize: 13, color: '#555', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  muscleGroup: {
    fontSize: 12, color: '#4CAF50', fontWeight: '600',
    marginTop: 2, textTransform: 'capitalize',
  },

  // Buttons
  iconButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtn: { borderWidth: 1.5, borderColor: '#4CAF50' },
  swapText: { color: '#4CAF50', fontWeight: '700', fontSize: 12 },
  iconButtonDisabled: { borderColor: '#aaa' },
  removeBtn: { borderWidth: 1.5, borderColor: '#e57373' },
  removeText: { color: '#e57373', fontWeight: '700', fontSize: 13 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 1 },
  instructions: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 8 },

  // Toggle
  toggleRow: { alignItems: 'center', paddingVertical: 4 },
  toggleText: { fontSize: 12, color: '#4CAF50', fontWeight: '700' },

  // Log section
  logSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 10,
  },
  logHeader: { flexDirection: 'row', marginBottom: 6, paddingHorizontal: 2 },
  logHeaderText: { fontSize: 11, color: '#888', fontWeight: '600' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setNum: { flex: 1, fontSize: 13, color: '#555', fontWeight: '600' },
  setInput: {
    flex: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
    color: '#1a1a2e',
  },
  addSetBtn: { marginTop: 4, alignSelf: 'flex-start' },
  addSetText: { color: '#4CAF50', fontWeight: '700', fontSize: 12 },

  // Complete button
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  completeButtonDisabled: { backgroundColor: '#81C784' },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})