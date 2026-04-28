import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

function ExerciseCard({ exercise, onSwap, swapping }) {
  return (
    <View style={styles.card}>
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
            ? <ActivityIndicator size="small" color="#4CAF50" />
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
  const { plan: planStr } = useLocalSearchParams()
  const router = useRouter()
  const [plan, setPlan] = useState(() => JSON.parse(planStr))
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
    backgroundColor: '#ADD8E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ADD8E6',
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  planMeta: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  muscleGroup: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  swapButton: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  swapButtonDisabled: {
    borderColor: '#aaa',
  },
  swapText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  equipmentLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  equipmentValue: {
    fontWeight: '400',
    textTransform: 'capitalize',
  },
  instructions: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },
})