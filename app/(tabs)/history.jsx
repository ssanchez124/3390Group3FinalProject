import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
      {log.sets_data.length > 0
        ? log.sets_data.map((s, i) => <SetRow key={i} s={s} />)
        : <Text style={styles.noData}>No sets logged</Text>
      }
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
      <View style={styles.cardSheen} />
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
        <ActivityIndicator size="large" color="#EF88AD" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerSheen} />
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>YOUR PROGRESS</Text>
          </View>
        </View>
        <Text style={styles.title}>Workout History</Text>
      </View>

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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <SessionCard session={item} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#080005',
  },
  centered: {
    flex: 1,
    backgroundColor: '#080005',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  empty: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.7)',
  },
  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
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
    alignItems: 'center',
    padding: 16,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  sessionMeta: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.85)',
    marginBottom: 2,
  },
  muscles: {
    fontSize: 12,
    color: '#EF88AD',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 12,
    color: '#EF88AD',
    marginLeft: 8,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 56, 96, 0.2)',
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
    color: '#FFFFFF',
  },
  muscleGroup: {
    fontSize: 12,
    color: '#EF88AD',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  setRow: {
    fontSize: 13,
    color: 'rgba(165, 56, 96, 0.85)',
    marginBottom: 2,
    paddingLeft: 8,
  },
  noData: {
    fontSize: 12,
    color: 'rgba(165, 56, 96, 0.5)',
    fontStyle: 'italic',
    paddingLeft: 8,
    marginTop: 2,
  },
})
