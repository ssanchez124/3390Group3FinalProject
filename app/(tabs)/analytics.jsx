import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { LineChart } from 'react-native-chart-kit'
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

function processMuscleGroupVolume(logs) {
  // Returns { [muscleGroup]: [{ date, volume }] } where volume = Σ(weight × reps) per session
  const map = {} // { group: { date: volume } } — date order preserved via insertion (logs ordered asc)
  logs.forEach(log => {
    const group = log.muscle_group || 'Other'
    const date = new Date(log.workout_sessions.completed_at)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const volume = (log.sets_data || []).reduce((sum, s) => {
      const w = parseFloat(s.weight_kg) || 0
      const r = parseInt(s.reps) || 0
      return sum + w * r
    }, 0)
    if (volume === 0) return
    if (!map[group]) map[group] = {}
    map[group][date] = (map[group][date] || 0) + volume
  })
  const result = {}
  Object.entries(map).forEach(([group, dateMap]) => {
    result[group] = Object.entries(dateMap).map(([date, volume]) => ({ date, volume: Math.round(volume) }))
  })
  return result
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

  if (strongest.name) insights.push(`Strongest lift: ${strongest.name} at ${strongest.weight} kg`)
  if (mostImproved.name && mostImproved.pct > 0) insights.push(`📈 Most improved: ${mostImproved.name} (+${mostImproved.pct}%)`)
  if (totalSessions > 0) insights.push(`Total workouts logged: ${totalSessions}`)
  if (insights.length === 0) insights.push('Log some weighted sets to see insights here.')
  return insights
}

function computeStreaks(sessionDates) {
  if (sessionDates.length === 0) return { currentStreak: 0, longestStreak: 0, activeDays: new Set() }

  const daySet = new Set(sessionDates.map(d => d.toISOString().split('T')[0]))
  const days = [...daySet].sort()

  // Longest streak
  let longest = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const gap = (new Date(days[i]) - new Date(days[i - 1])) / 86400000
    if (gap === 1) { run++; if (run > longest) longest = run }
    else run = 1
  }

  // Current streak — count if today OR yesterday has a workout (gives grace for logging later)
  const todayStr = new Date().toISOString().split('T')[0]
  const yestStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let current = 0
  if (daySet.has(todayStr) || daySet.has(yestStr)) {
    let check = new Date(daySet.has(todayStr) ? todayStr : yestStr)
    while (daySet.has(check.toISOString().split('T')[0])) {
      current++
      check = new Date(check.getTime() - 86400000)
    }
  }

  return { currentStreak: current, longestStreak: longest, activeDays: daySet }
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StreakCard({ currentStreak, longestStreak, activeDays }) {
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    return {
      key: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
    }
  })

  const motivation =
    currentStreak === 0 ? 'Start your streak today!'
    : currentStreak < 3 ? 'Great start — keep it up!'
    : currentStreak < 7 ? 'Building momentum! 💪'
    : currentStreak < 14 ? "You're on fire! 🔥"
    : currentStreak < 30 ? 'Unstoppable — keep going!'
    : 'Legendary dedication! 🏆'

  return (
    <View style={styles.card}>
      <SectionTitle>Workout Streak</SectionTitle>

      <View style={styles.streakRow}>
        <View style={styles.streakBlock}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>current{'\n'}streak</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakBlock}>
          <Text style={styles.streakEmoji}>🏆</Text>
          <Text style={styles.streakNumber}>{longestStreak}</Text>
          <Text style={styles.streakLabel}>best{'\n'}streak</Text>
        </View>
      </View>

      <Text style={styles.streakMotivation}>{motivation}</Text>

      <Text style={styles.dotGridLabel}>Last 14 days</Text>
      <View style={styles.dotRow}>
        {last14.map(({ key, label }) => (
          <View key={key} style={styles.dotCol}>
            <View style={[styles.dot, activeDays.has(key) && styles.dotActive]} />
            <Text style={styles.dotLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

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
        <SectionTitle>Volume by Muscle Group</SectionTitle>
        <Text style={styles.emptyText}>No data yet.</Text>
      </View>
    )
  }

  const points = muscleGroupMap[selected] || []
  const hasChart = points.length >= 2

  let insight = null
  if (points.length >= 2) {
    const first = points[0].volume
    const last = points[points.length - 1].volume
    const diff = last - first
    const pct = first > 0 ? Math.round((diff / first) * 100) : 0
    if (diff > 0) insight = `📈 Volume up ${pct}% since your first session`
    else if (diff < 0) insight = `📉 Volume down ${Math.abs(pct)}% — consider adding more sets`
    else insight = `➡ Consistent volume across sessions`
  } else if (points.length === 1) {
    insight = `First session recorded — keep training to track volume trends!`
  }

  const chartData = {
    labels: points.map(p => p.date),
    datasets: [{ data: points.map(p => p.volume) }],
  }

  return (
    <View style={styles.card}>
      <SectionTitle>Volume by Muscle Group</SectionTitle>
      <Text style={styles.volumeSubtitle}>Total kg × reps per session</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {groups.map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, selected === g && styles.pillActive]}
            onPress={() => setSelected(g)}
          >
            <Text style={[styles.pillText, selected === g && styles.pillTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
        />
      ) : (
        <Text style={styles.emptyText}>Train this muscle group in at least 2 sessions to see a trend.</Text>
      )}

      {insight && <Text style={styles.insightText}>{insight}</Text>}
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
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, activeDays: new Set() })

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        const [logsResult, sessionsResult] = await Promise.all([
          supabase
            .from('exercise_logs')
            .select(`exercise_name, muscle_group, sets_data, workout_sessions ( completed_at )`)
            .eq('user_id', user.id)
            .order('logged_at', { ascending: true }),
          supabase
            .from('workout_sessions')
            .select('completed_at', { count: 'exact' })
            .eq('user_id', user.id),
        ])

        const { data: logs, error } = logsResult
        const { data: sessions, count } = sessionsResult

        if (!error && logs) {
          const progress = processExerciseProgress(logs)
          const muscleGroup = processMuscleGroupVolume(logs)
          const ins = computeInsights(progress, count ?? 0)
          const streak = computeStreaks((sessions || []).map(s => new Date(s.completed_at)))
          setProgressMap(progress)
          setMuscleGroupMap(muscleGroup)
          setInsights(ins)
          setTotalSessions(count ?? 0)
          setStreakData(streak)
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

        <StreakCard {...streakData} />
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
  volumeSubtitle: {
    fontSize: 11, color: 'rgba(165,56,96,0.6)',
    marginBottom: 10, marginTop: -8,
  },

  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  streakBlock: { flex: 1, alignItems: 'center' },
  streakDivider: { width: 1, height: 64, backgroundColor: 'rgba(165,56,96,0.3)', marginHorizontal: 16 },
  streakEmoji: { fontSize: 30, marginBottom: 4 },
  streakNumber: { fontSize: 44, fontWeight: '800', color: '#EF88AD', lineHeight: 48 },
  streakLabel: { fontSize: 11, color: 'rgba(165,56,96,0.7)', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  streakMotivation: { fontSize: 13, color: '#EF88AD', fontWeight: '600', textAlign: 'center', marginTop: 12, marginBottom: 16 },

  dotGridLabel: { fontSize: 11, color: 'rgba(165,56,96,0.6)', marginBottom: 8 },
  dotRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dotCol: { alignItems: 'center', flex: 1 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(165,56,96,0.15)',
    borderWidth: 1, borderColor: 'rgba(165,56,96,0.25)',
    marginBottom: 4,
  },
  dotActive: { backgroundColor: '#EF88AD', borderColor: '#EF88AD' },
  dotLabel: { fontSize: 8, color: 'rgba(165,56,96,0.5)' },
})