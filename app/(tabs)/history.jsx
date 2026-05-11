import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SetRow({ s }) {
  return (
    <Text style={styles.setRow}>
      Set {s.set}: {s.weight_kg > 0 ? `${s.weight_kg} kg` : "Bodyweight"} ×{" "}
      {s.reps} reps
    </Text>
  );
}

function ExerciseEntry({ log, onRemove }) {
  return (
    <View style={styles.exerciseEntry}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{log.exercise_name}</Text>
          <Text style={styles.muscleGroup}>{log.muscle_group}</Text>
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(log.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {log.sets_data.length > 0 ? (
        log.sets_data.map((s, i) => <SetRow key={i} s={s} />)
      ) : (
        <Text style={styles.noData}>No sets logged</Text>
      )}
    </View>
  );
}

function SessionCard({ session, onRemoveExercise, onRemoveSession }) {
  const [expanded, setExpanded] = useState(false);

  const totalSets = session.exercise_logs.reduce(
    (sum, l) => sum + l.sets_data.length,
    0,
  );

  const normalize = (g) =>
    g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : null;

  const uniqueGroups = [
    ...new Set(
      session.exercise_logs
        .map((l) => normalize(l.muscle_group))
        .filter(Boolean),
    ),
  ];

  const muscleGroupLabel =
    uniqueGroups.length > 0
      ? uniqueGroups.slice(0, 3).join(" · ") +
        (uniqueGroups.length > 3 ? ` +${uniqueGroups.length - 3}` : "")
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />

      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionDate}>
            {formatDate(session.completed_at)}
          </Text>

          <Text style={styles.sessionMeta}>
            {session.exercise_logs.length} exercises · {totalSets} sets
          </Text>

          {muscleGroupLabel ? (
            <Text style={styles.muscles} numberOfLines={1}>
              {muscleGroupLabel}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.deleteSessionBtn}
          onPress={() => onRemoveSession(session.id)}
        >
          <Text style={styles.deleteSessionText}>Delete</Text>
        </TouchableOpacity>

        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.exerciseList}>
          {session.exercise_logs.map((log) => (
            <ExerciseEntry key={log.id} log={log} onRemove={onRemoveExercise} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [muscleGroups, setMuscleGroups] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("workout_sessions")
          .select(
            `
            id,
            completed_at,
            exercise_logs (
              id,
              exercise_name,
              muscle_group,
              sets_data
            )
          `,
          )
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (!error && data) {
          setSessions(data);

          const normalize = (g) =>
            g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : null;

          const groups = [
            ...new Set(
              data
                .flatMap((s) =>
                  s.exercise_logs.map((l) => normalize(l.muscle_group)),
                )
                .filter(Boolean),
            ),
          ];

          setMuscleGroups(groups);
        }

        setLoading(false);
      };

      fetchHistory();
    }, []),
  );

  const handleRemoveSession = async (sessionId) => {
    Alert.alert(
      "Delete Workout",
      "Delete this entire workout session? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("exercise_logs")
              .delete()
              .eq("session_id", sessionId);

            const { error } = await supabase
              .from("workout_sessions")
              .delete()
              .eq("id", sessionId);

            if (error) {
              Alert.alert("Error", error.message);
              return;
            }

            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          },
        },
      ],
    );
  };

  const handleRemoveExercise = async (logId) => {
    Alert.alert("Remove Exercise", "Remove this exercise from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("exercise_logs")
            .delete()
            .eq("id", logId);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }

          setSessions((prev) =>
            prev
              .map((s) => ({
                ...s,
                exercise_logs: s.exercise_logs.filter((l) => l.id !== logId),
              }))
              .filter((s) => s.exercise_logs.length > 0),
          );
        },
      },
    ]);
  };

  const normalize = (g) =>
    g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : null;

  const allGroups = ["All", ...muscleGroups];

  const filteredSessions =
    selectedGroup === "All"
      ? sessions
      : sessions
          .map((s) => ({
            ...s,
            exercise_logs: s.exercise_logs.filter(
              (l) => normalize(l.muscle_group) === selectedGroup,
            ),
          }))
          .filter((s) => s.exercise_logs.length > 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EF88AD" />
      </View>
    );
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

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {allGroups.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.filterPill,
                selectedGroup === g && styles.filterPillActive,
              ]}
              onPress={() => setSelectedGroup(g)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedGroup === g && styles.filterPillTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            {sessions.length === 0
              ? "No workouts logged yet."
              : `No ${selectedGroup} exercises found.`}
          </Text>

          <Text style={styles.emptySub}>
            {sessions.length === 0
              ? "Complete a workout to see it here."
              : "Try a different filter."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onRemoveExercise={handleRemoveExercise}
              onRemoveSession={handleRemoveSession}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#080005",
  },

  centered: {
    flex: 1,
    backgroundColor: "#080005",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(58,5,25,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(165,56,96,0.3)",
    overflow: "hidden",
  },

  headerSheen: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "rgba(239,136,173,0.2)",
  },

  badgeRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  badge: {
    backgroundColor: "rgba(239,136,173,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,136,173,0.28)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EF88AD",
    letterSpacing: 3,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  filterWrapper: {
    backgroundColor: "rgba(58,5,25,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(165,56,96,0.2)",
    paddingVertical: 10,
  },

  filterContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },

  filterPill: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "rgba(165,56,96,0.4)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(151,142,146,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  filterPillActive: {
    backgroundColor: "rgba(239,136,173,0.15)",
    borderColor: "#EF88AD",
  },

  filterPillText: {
    fontSize: 12,
    color: "#EF88AD",
    fontWeight: "700",
    textTransform: "capitalize",
    opacity: 0.5,
  },

  filterPillTextActive: {
    opacity: 1,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  empty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  emptySub: {
    fontSize: 13,
    color: "rgba(165,56,96,0.7)",
  },

  card: {
    backgroundColor: "rgba(58,5,25,0.55)",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(165,56,96,0.3)",
    overflow: "hidden",
  },

  cardSheen: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "rgba(239,136,173,0.28)",
    borderRadius: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  sessionDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },

  sessionMeta: {
    fontSize: 13,
    color: "rgba(165,56,96,0.85)",
    marginBottom: 2,
  },

  muscles: {
    fontSize: 12,
    color: "#EF88AD",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  chevron: {
    fontSize: 12,
    color: "#EF88AD",
    marginLeft: 8,
  },

  deleteSessionBtn: {
    borderWidth: 1,
    borderColor: "rgba(165,56,96,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
    backgroundColor: "rgba(165,56,96,0.1)",
  },

  deleteSessionText: {
    fontSize: 12,
    color: "rgba(165,56,96,0.9)",
    fontWeight: "600",
  },

  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(165,56,96,0.2)",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  exerciseEntry: {
    paddingTop: 12,
    marginBottom: 4,
  },

  exerciseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  exerciseName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  muscleGroup: {
    fontSize: 12,
    color: "#EF88AD",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(165,56,96,0.15)",
    borderWidth: 1,
    borderColor: "rgba(165,56,96,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginTop: 1,
  },

  removeBtnText: {
    fontSize: 10,
    color: "rgba(165,56,96,0.8)",
    fontWeight: "700",
  },

  setRow: {
    fontSize: 13,
    color: "rgba(165,56,96,0.85)",
    marginBottom: 2,
    paddingLeft: 8,
  },

  noData: {
    fontSize: 12,
    color: "rgba(165,56,96,0.5)",
    fontStyle: "italic",
    paddingLeft: 8,
    marginTop: 2,
  },
});
