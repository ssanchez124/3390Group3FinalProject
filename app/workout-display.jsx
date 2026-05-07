import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { getWorkoutPlan } from '../lib/workoutStore'

function ExerciseCard({ exercise, onSwap, swapping }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
        </View>
        <TouchableOpacity
          style={[styles.swapButton, swapping && styles.swapButtonDisabled]}
          onPress={onSwap}
          disabled={swapping}
        >
          {swapping
            ? <ActivityIndicator size="small" color="#EF88AD" />
            : <Text style={styles.swapText}>Swap</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Sets" value={exercise.sets} />
        <Stat label="Reps" value={exercise.reps} />
        <Stat label="Rest" value={`${exercise.restSeconds}s`} />
        <Stat label="Level" value={exercise.difficulty} />
      </View>

      <Text style={styles.equipmentLabel}>Equipment: <Text style={styles.equipmentValue}>{exercise.equipment}</Text></Text>
      <Text style={styles.instructions}>{exercise.instructions}</Text>
    </View>
  )
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function WorkoutDisplay() {
  const router = useRouter()
  const [plan, setPlan] = useState(() => getWorkoutPlan())
  const [swappingId, setSwappingId] = useState(null)

  const handleSwap = async (exercise) => {
    setSwappingId(exercise.id)
    try {
      const excludeNames = plan.exercises.map(e => e.name)
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

      // Replace the swapped exercise in the list
      setPlan(prev => ({
        ...prev,
        exercises: prev.exercises.map(e => e.id === exercise.id ? { ...data, id: exercise.id } : e),
      }))
    } catch (err) {
      Alert.alert('Swap Failed', err.message)
    } finally {
      setSwappingId(null)
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
          <Text style={styles.planMeta}>{plan.totalDuration} min · {plan.exercises?.length} exercises</Text>
        </View>
      </View>

      <FlatList
        data={plan.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            onSwap={() => handleSwap(item)}
            swapping={swappingId === item.id}
          />
        )}
      />
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
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  planMeta: {
    fontSize: 12,
    color: 'rgba(165, 56, 96, 0.85)',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  muscleGroup: {
    fontSize: 12,
    color: '#EF88AD',
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  swapButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 136, 173, 0.08)',
  },
  swapButtonDisabled: {
    borderColor: 'rgba(165, 56, 96, 0.25)',
    backgroundColor: 'transparent',
  },
  swapText: {
    color: '#EF88AD',
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 0, 5, 0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.2)',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF88AD',
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(165, 56, 96, 0.7)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  equipmentLabel: {
    fontSize: 12,
    color: 'rgba(165, 56, 96, 0.7)',
    marginBottom: 6,
    fontWeight: '600',
  },
  equipmentValue: {
    fontWeight: '400',
    textTransform: 'capitalize',
    color: 'rgba(239, 136, 173, 0.8)',
  },
  instructions: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.75)',
    lineHeight: 19,
  },
})
