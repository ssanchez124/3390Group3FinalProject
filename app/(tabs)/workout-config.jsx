import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Core', 'Calves',
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const WorkoutSelection = () => {
  const [muscleGroups, setMuscleGroups] = useState([])
  const [numExercises, setNumExercises] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const toggleMuscleGroup = (group) => {
    if (muscleGroups.includes(group)) {
      setMuscleGroups(muscleGroups.filter((g) => g !== group))
    } else if (muscleGroups.length < 3) {
      setMuscleGroups([...muscleGroups, group])
    } else {
      Alert.alert('Limit reached', 'You can select up to 3 muscle groups.')
    }
  }

  const handleSubmit = () => {
    if (!muscleGroups.length || !numExercises || !durationMinutes || !difficulty) {
      Alert.alert('Incomplete', 'Please fill in all fields before submitting.')
      return
    }
    const selection = {
      muscleGroups,
      numExercises: parseInt(numExercises, 10),
      durationMinutes: parseInt(durationMinutes, 10),
      difficulty,
    }
    console.log(selection)
    Alert.alert(
      'Workout Set!',
      `Muscles: ${muscleGroups.join(', ')}\nExercises: ${numExercises}\nDuration: ${durationMinutes} min\nDifficulty: ${difficulty}`
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Build Your Workout</Text>

      {/* Muscle Group Multi-Select */}
      <Text style={styles.label}>Muscle Groups (up to 3)</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownVisible(true)}>
        <Text style={muscleGroups.length ? styles.dropdownText : styles.placeholder}>
          {muscleGroups.length ? muscleGroups.join(', ') : 'Select muscle groups...'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select up to 3 Muscle Groups</Text>
            <FlatList
              data={MUSCLE_GROUPS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = muscleGroups.includes(item)
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, selected && styles.optionSelected]}
                    onPress={() => toggleMuscleGroup(item)}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                )
              }}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setDropdownVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Number of Exercises */}
      <Text style={styles.label}>Number of Exercises</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={numExercises}
        onChangeText={setNumExercises}
      />

      {/* Duration */}
      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 45"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
      />

      {/* Difficulty */}
      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.difficultyRow}>
        {DIFFICULTIES.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.difficultyButton, difficulty === level && styles.difficultySelected]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextSelected]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Generate Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default WorkoutSelection

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ADD8E6',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#aac',
  },
  dropdownText: { fontSize: 15, color: '#222', flex: 1 },
  placeholder: { fontSize: 15, color: '#999', flex: 1 },
  arrow: { fontSize: 12, color: '#555' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 6,
  },
  optionSelected: { backgroundColor: '#d0eaff' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { fontWeight: '700', color: '#1a5fa8' },
  checkmark: { fontSize: 16, color: '#1a5fa8' },
  doneButton: {
    marginTop: 14,
    backgroundColor: '#1a5fa8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#aac',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aac',
  },
  difficultySelected: { backgroundColor: '#1a5fa8', borderColor: '#1a5fa8' },
  difficultyText: { fontSize: 15, color: '#333', fontWeight: '600' },
  difficultyTextSelected: { color: '#fff' },
  submitButton: {
    marginTop: 36,
    backgroundColor: '#1a5fa8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})