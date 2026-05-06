import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'

// Formats a UTC timestamp into a readable date string
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function SetRow({ s }) {
  return (
    <Text style={styles.setRow}>
      Set {s.set}: {s.weight_kg > 0 ? `${s.weight_kg} kg` : 'Bodyweight'} × {s.reps} reps
    </Text>
  )
}

function ExerciseEntry({ log }) {
  return (
    <View style={styles.exerciseEntry}>
      <Text style={styles.exerciseName}>{log.exercise_name}</Text>
      <Text style={styles.muscleGroup}>{log.muscle_group}</Text>
      {log.sets_data.map((s, i) => <SetRow key={i} s={s} />)}
    </View>
  )
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)

  // Count total sets across all exercises in this session
  const totalSets = session.exercise_logs.reduce(
    (sum, log) => sum + log.sets_data.length, 0
  )
  const muscleGroups = [...new Set(session.exercise_logs.map(l => l.muscle_group))]
    .filter(Boolean).join(', ')

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(e => !e)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionDate}>{formatDate(session.completed_at)}</Text>
          <Text style={styles.sessionMeta}>
            {session.exercise_logs.length} exercises · {totalSets} sets
          </Text>
          {muscleGroups ? <Text style={styles.muscles}>{muscleGroups}</Text> : null}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.exerciseList}>
          {session.exercise_logs.map((log, i) => (
            <ExerciseEntry key={i} log={log} />
          ))}
        </View>
      )}
    </View>
  )
}

export default function History() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // useFocusEffect re-runs every time this tab comes into focus.
  // This means if the user completes a workout and comes back, they see fresh data.
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch sessions with their exercise logs joined in one query
        const { data, error } = await supabase
          .from('workout_sessions')
          .select(`
            id,
            completed_at,
            exercise_logs ( exercise_name, muscle_group, sets_data )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })

        if (!error) setSessions(data ?? [])
        setLoading(false)
      }
      fetchHistory()
    }, [])
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <Text style={styles.title}>Workout History</Text>
      {sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>No workouts logged yet.</Text>
          <Text style={styles.emptySub}>Complete a workout to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SessionCard session={item} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  sessionMeta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  muscles: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exerciseEntry: {
    paddingTop: 12,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  muscleGroup: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  setRow: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    paddingLeft: 8,
  },
})
