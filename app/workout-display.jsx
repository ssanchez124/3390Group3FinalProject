import { useState } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { getWorkoutPlan } from '../lib/workoutStore'

function initSets(count) {
  return Array.from({ length: count }, (_, i) => ({
    set: i + 1, reps: '', weight_kg: '',
  }))
}

function initLogs(exercises) {
  const logs = {}
  exercises.forEach(ex => { logs[ex.id] = initSets(ex.sets) })
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
      <View style={styles.cardSheen} />

      {/* Name + Swap + Remove */}
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
            ? <ActivityIndicator size="small" color="#EF88AD" />
            : <Text style={styles.swapText}>Swap</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.removeBtn]} onPress={onRemove}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="Sets" value={exercise.sets} />
        <Stat label="Reps" value={exercise.reps} />
        <Stat label="Rest" value={`${exercise.restSeconds}s`} />
        <Stat label="Level" value={exercise.difficulty} />
      </View>

      <Text style={styles.instructions}>{exercise.instructions}</Text>

      {/* Toggle */}
      <TouchableOpacity style={styles.toggleRow} onPress={onToggle}>
        <Text style={styles.toggleText}>
          {isExpanded ? '▲ Hide log' : '▼ Log sets'}
        </Text>
      </TouchableOpacity>

      {/* Logging section */}
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
                placeholderTextColor="rgba(239,136,173,0.35)"
                value={s.weight_kg}
                onChangeText={val => onUpdateSet(i, 'weight_kg', val)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.setInput}
                placeholder="0"
                placeholderTextColor="rgba(239,136,173,0.35)"
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
  const [expandedIds, setExpandedIds] = useState({})
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

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id })
        .select()
        .single()
      if (sessionError) throw sessionError

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
        <View style={styles.headerSheen} />
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
        showsVerticalScrollIndicator={false}
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
              ? <ActivityIndicator color="#EF88AD" />
              : <Text style={styles.completeButtonText}>Complete Workout</Text>
            }
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#080005' },

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
    top: 0, left: 16, right: 16, height: 1,
    backgroundColor: 'rgba(239, 136, 173, 0.2)',
  },
  backButton: { marginRight: 14, paddingVertical: 4 },
  backText: { fontSize: 15, color: '#EF88AD', fontWeight: '600' },
  planTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  planMeta: { fontSize: 12, color: 'rgba(165, 56, 96, 0.85)', marginTop: 2 },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

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
    top: 0, left: 16, right: 16, height: 1,
    backgroundColor: 'rgba(239, 136, 173, 0.28)',
    borderRadius: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  muscleGroup: {
    fontSize: 12, color: '#EF88AD', fontWeight: '600',
    marginTop: 3, textTransform: 'capitalize', letterSpacing: 0.3,
  },

  iconButton: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    marginLeft: 6, alignItems: 'center', justifyContent: 'center',
  },
  swapBtn: {
    borderWidth: 1, borderColor: 'rgba(239,136,173,0.55)',
    backgroundColor: 'rgba(239,136,173,0.08)',
  },
  swapText: { color: '#EF88AD', fontWeight: '700', fontSize: 12 },
  iconButtonDisabled: { borderColor: 'rgba(165,56,96,0.25)', backgroundColor: 'transparent' },
  removeBtn: { borderWidth: 1, borderColor: 'rgba(229,115,115,0.55)', backgroundColor: 'rgba(229,115,115,0.08)' },
  removeText: { color: '#e57373', fontWeight: '700', fontSize: 13 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 0, 5, 0.45)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(165,56,96,0.2)',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#EF88AD', textTransform: 'capitalize' },
  statLabel: { fontSize: 10, color: 'rgba(165,56,96,0.7)', marginTop: 2, letterSpacing: 0.5 },

  instructions: { fontSize: 13, color: 'rgba(165,56,96,0.75)', lineHeight: 19, marginBottom: 8 },

  toggleRow: { alignItems: 'center', paddingVertical: 6 },
  toggleText: { fontSize: 12, color: '#EF88AD', fontWeight: '700', letterSpacing: 0.5 },

  logSection: {
    borderTopWidth: 1, borderTopColor: 'rgba(165,56,96,0.2)',
    marginTop: 4, paddingTop: 12,
  },
  logHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 2 },
  logHeaderText: { fontSize: 11, color: 'rgba(165,56,96,0.7)', fontWeight: '600', letterSpacing: 0.5 },

  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setNum: { flex: 1, fontSize: 13, color: '#EF88AD', fontWeight: '700' },
  setInput: {
    flex: 2,
    backgroundColor: 'rgba(8,0,5,0.6)',
    borderWidth: 1, borderColor: 'rgba(165,56,96,0.35)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
    fontSize: 14, textAlign: 'center', marginHorizontal: 4, color: '#FFFFFF',
  },

  addSetBtn: { marginTop: 4, alignSelf: 'flex-start' },
  addSetText: { color: '#EF88AD', fontWeight: '700', fontSize: 12 },

  completeButton: {
    backgroundColor: 'rgba(239,136,173,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,136,173,0.55)',
    borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 8, marginBottom: 32,
    shadowColor: '#EF88AD', shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  completeButtonDisabled: { opacity: 0.5 },
  completeButtonText: { color: '#EF88AD', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
})