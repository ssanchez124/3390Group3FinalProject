import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { supabase } from '../../lib/supabase'

const SCREEN_WIDTH = Dimensions.get('window').width
const CHART_WIDTH = SCREEN_WIDTH - 32

// ─── Data processing helpers ───────────────────────────────────────────────

function processExerciseProgress(logs) {
  // Returns { [exerciseName]: [{ date, maxWeight }] } sorted by date
  const map = {}
  logs.forEach(log => {
    const date = new Date(log.workout_sessions.completed_at)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weights = (log.sets_data || [])
      .map(s => parseFloat(s.weight_kg) || 0)
      .filter(w => w > 0)
    if (weights.length === 0) return
    const maxWeight = Math.max(...weights)
    if (!map[log.exercise_name]) map[log.exercise_name] = []
    map[log.exercise_name].push({ date, maxWeight })
  })
  return map
}

function processMuscleGroupBest(logs) {
  // Returns { [muscleGroup]: { [exerciseName]: maxWeightEver } }
  const map = {}
  logs.forEach(log => {
    const group = log.muscle_group || 'Other'
    const weights = (log.sets_data || []).map(s => parseFloat(s.weight_kg) || 0).filter(w => w > 0)
    if (weights.length === 0) return
    const max = Math.max(...weights)
    if (!map[group]) map[group] = {}
    if (!map[group][log.exercise_name] || map[group][log.exercise_name] < max) {
      map[group][log.exercise_name] = max
    }
  })
  return map
}

function computeInsights(progressMap, totalSessions) {
  const insights = []
  let strongest = { name: '', weight: 0 }
  let mostImproved = { name: '', pct: 0 }

  Object.entries(progressMap).forEach(([name, points]) => {
    if (points.length === 0) return
    const best = Math.max(...points.map(p => p.maxWeight))
    if (best > strongest.weight) strongest = { name, weight: best }

    if (points.length >= 2) {
      const first = points[0].maxWeight
      const last = points[points.length - 1].maxWeight
      if (first > 0) {
        const pct = Math.round(((last - first) / first) * 100)
        if (pct > mostImproved.pct) mostImproved = { name, pct }
      }
    }
  })

  if (strongest.name) insights.push(`💪 Strongest lift: ${strongest.name} at ${strongest.weight} kg`)
  if (mostImproved.name && mostImproved.pct > 0) insights.push(`📈 Most improved: ${mostImproved.name} (+${mostImproved.pct}%)`)
  if (totalSessions > 0) insights.push(`🏅 Total workouts logged: ${totalSessions}`)
  if (insights.length === 0) insights.push('Log some weighted sets to see insights here.')
  return insights
}

// ─── Sub-components ────────────────────────────────────────────────────────

const chartConfig = {
  backgroundGradientFrom: 'rgba(58,5,25,0.8)',
  backgroundGradientTo: 'rgba(8,0,5,0.9)',
  color: (opacity = 1) => `rgba(239,136,173,${opacity})`,
  labelColor: (opacity = 1) => `rgba(165,56,96,${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#EF88AD' },
  propsForBackgroundLines: { stroke: 'rgba(165,56,96,0.15)' },
}

function SectionTitle({ children }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  )
}

function ExerciseProgressChart({ progressMap }) {
  const exercises = Object.keys(progressMap)
  const [selected, setSelected] = useState(exercises[0] || null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (exercises.length === 0) {
    return (
      <View style={styles.card}>
        <SectionTitle>Weight Progress</SectionTitle>
        <Text style={styles.emptyText}>No weighted sets logged yet.</Text>
      </View>
    )
  }

  const points = progressMap[selected] || []
  const hasChart = points.length >= 2

  // Insight text for this exercise
  let insight = null
  if (points.length >= 2) {
    const first = points[0].maxWeight
    const last = points[points.length - 1].maxWeight
    const diff = last - first
    const pct = first > 0 ? Math.round((diff / first) * 100) : 0
    if (diff > 0) insight = `📈 Up ${pct}% since your first session (${first} → ${last} kg)`
    else if (diff < 0) insight = `📉 Down ${Math.abs(pct)}% since your first session`
    else insight = `➡ Weight has stayed at ${last} kg across sessions`

    // Check if last session was a PR
    const pr = Math.max(...points.map(p => p.maxWeight))
    if (last === pr && points.length > 1) insight = `🏆 New PR last session! ${last} kg`
  } else if (points.length === 1) {
    insight = `First session logged at ${points[0].maxWeight} kg — keep going to see progress!`
  }

  const chartData = {
    labels: points.map(p => p.date),
    datasets: [{ data: points.map(p => p.maxWeight) }],
  }

  return (
    <View style={styles.card}>
      <SectionTitle>Weight Progress</SectionTitle>

      {/* Exercise picker */}
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setDropdownOpen(o => !o)}
      >
        <Text style={styles.pickerText}>{selected || 'Select exercise'}</Text>
        <Text style={styles.pickerArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {dropdownOpen && (
        <View style={styles.dropdown}>
          {exercises.map(ex => (
            <TouchableOpacity
              key={ex}
              style={[styles.dropdownItem, selected === ex && styles.dropdownItemActive]}
              onPress={() => { setSelected(ex); setDropdownOpen(false) }}
            >
              <Text style={[styles.dropdownText, selected === ex && styles.dropdownTextActive]}>
                {ex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {hasChart ? (
        <LineChart
          data={chartData}
          width={CHART_WIDTH - 32}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines
          withOuterLines={false}
          yAxisSuffix=" kg"
        />
      ) : (
        <Text style={styles.emptyText}>Log this exercise in at least 2 sessions to see a chart.</Text>
      )}

      {insight && <Text style={styles.insightText}>{insight}</Text>}
    </View>
  )
}

function MuscleGroupChart({ muscleGroupMap }) {
  const groups = Object.keys(muscleGroupMap)
  const [selected, setSelected] = useState(groups[0] || null)

  if (groups.length === 0) {
    return (
      <View style={styles.card}>
        <SectionTitle>Best by Muscle Group</SectionTitle>
        <Text style={styles.emptyText}>No data yet.</Text>
      </View>
    )
  }

  const exercises = muscleGroupMap[selected] || {}
  const labels = Object.keys(exercises)
  const data = Object.values(exercises)
  const hasChart = labels.length > 0

  return (
    <View style={styles.card}>
      <SectionTitle>Best by Muscle Group</SectionTitle>

      {/* Group pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {groups.map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, selected === g && styles.pillActive]}
            onPress={() => setSelected(g)}
          >
            <Text style={[styles.pillText, selected === g && styles.pillTextActive]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {hasChart ? (
        <BarChart
          data={{
            labels: labels.map(l => l.length > 8 ? l.slice(0, 8) + '…' : l),
            datasets: [{ data }],
          }}
          width={CHART_WIDTH - 32}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          withInnerLines={false}
          yAxisSuffix=" kg"
          fromZero
        />
      ) : (
        <Text style={styles.emptyText}>No weighted exercises logged for this group.</Text>
      )}
    </View>
  )
}

function InsightsCard({ insights }) {
  return (
    <View style={styles.card}>
      <SectionTitle>Quick Insights</SectionTitle>
      {insights.map((text, i) => (
        <View key={i} style={styles.insightRow}>
          <Text style={styles.insightBullet}>→</Text>
          <Text style={styles.insightRowText}>{text}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [progressMap, setProgressMap] = useState({})
  const [muscleGroupMap, setMuscleGroupMap] = useState({})
  const [insights, setInsights] = useState([])
  const [totalSessions, setTotalSessions] = useState(0)

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch all exercise logs with their session dates
        const { data: logs, error } = await supabase
          .from('exercise_logs')
          .select(`
            exercise_name,
            muscle_group,
            sets_data,
            workout_sessions ( completed_at )
          `)
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true })

        // Count total sessions
        const { count } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (!error && logs) {
          const progress = processExerciseProgress(logs)
          const muscleGroup = processMuscleGroupBest(logs)
          const ins = computeInsights(progress, count ?? 0)
          setProgressMap(progress)
          setMuscleGroupMap(muscleGroup)
          setInsights(ins)
          setTotalSessions(count ?? 0)
        }
        setLoading(false)
      }
      fetchData()
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Analytics</Text>
        <Text style={styles.pageSubtitle}>Track your strength over time</Text>

        <InsightsCard insights={insights} />
        <ExerciseProgressChart progressMap={progressMap} />
        <MuscleGroupChart muscleGroupMap={muscleGroupMap} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#080005' },
  centered: { flex: 1, backgroundColor: '#080005', alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },

  pageTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: 'rgba(165,56,96,0.85)', marginBottom: 24 },

  card: {
    backgroundColor: 'rgba(58,5,25,0.55)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(165,56,96,0.3)',
  },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: '#EF88AD', marginRight: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  chart: { borderRadius: 12, marginTop: 12, marginBottom: 8 },

  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(8,0,5,0.6)',
    borderWidth: 1, borderColor: 'rgba(165,56,96,0.4)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  pickerText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  pickerArrow: { fontSize: 11, color: '#EF88AD' },

  dropdown: {
    backgroundColor: 'rgba(20,0,10,0.97)',
    borderWidth: 1, borderColor: 'rgba(165,56,96,0.3)',
    borderRadius: 12, marginTop: 6, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemActive: { backgroundColor: 'rgba(239,136,173,0.1)' },
  dropdownText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  dropdownTextActive: { color: '#EF88AD', fontWeight: '700' },

  pillRow: { flexDirection: 'row', marginBottom: 4 },
  pill: {
    borderWidth: 1, borderColor: 'rgba(165,56,96,0.4)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginRight: 8, backgroundColor: 'rgba(8,0,5,0.45)',
  },
  pillActive: { backgroundColor: 'rgba(239,136,173,0.12)', borderColor: '#EF88AD' },
  pillText: { fontSize: 12, color: 'rgba(165,56,96,0.8)', fontWeight: '600' },
  pillTextActive: { color: '#EF88AD', fontWeight: '700' },

  insightText: {
    fontSize: 13, color: '#EF88AD', fontWeight: '600',
    marginTop: 10, textAlign: 'center', lineHeight: 18,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  insightBullet: { color: '#EF88AD', fontWeight: '700', marginRight: 8, marginTop: 1 },
  insightRowText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 19 },

  emptyText: {
    fontSize: 13, color: 'rgba(165,56,96,0.7)',
    fontStyle: 'italic', textAlign: 'center', marginTop: 12,
  },
})