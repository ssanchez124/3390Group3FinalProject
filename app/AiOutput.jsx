import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import LinkButton from './LinkButton'



const index = () => {
  const aiWorkoutResponse = {
    "workoutConfig": {
      "muscleGroups": ["chest", "triceps"],
      "numExercises": 3,
      "durationMinutes": 30,
      "difficulty": "intermediate"
    },
    "planTitle": "Intermediate Chest and Triceps Workout",
    "totalDuration": 30,
    "exercises": [
      {
        "id": "1",
        "name": "Push-Ups",
        "muscleGroup": "Chest",
        "sets": 4,
        "reps": "10-15",
        "restSeconds": 60,
        "instructions": "Keep your body in a straight line from head to heels, lower until your chest is just above the ground, then push back up.",
        "difficulty": "Intermediate",
        "equipment": "None"
      },
      {
        "id": "2",
        "name": "Diamond Push-Ups",
        "muscleGroup": "Triceps",
        "sets": 3,
        "reps": "8-12",
        "restSeconds": 60,
        "instructions": "Place your hands close together under your chest forming a diamond shape, lower your body while keeping your elbows close, then push back up.",
        "difficulty": "Intermediate",
        "equipment": "None"
      },
      {
        "id": "3",
        "name": "Pike Push-Ups",
        "muscleGroup": "Chest/Shoulders",
        "sets": 3,
        "reps": "8-12",
        "restSeconds": 60,
        "instructions": "Start in a downward dog position, bend your elbows to lower your head towards the ground, then push back up.",
        "difficulty": "Intermediate",
        "equipment": "None"
      }
    ]
  };

  const assignResponses = (response) => {
    return response.exercises.map(exercise => {
      return { [exercise.id]: exercise };
    }).reduce((acc, obj) => ({ ...acc, ...obj }), {});
  };

  const responses = assignResponses(aiWorkoutResponse);

  const [currentId, setCurrentId] = useState('1');
  const currentExercise = responses[currentId];

  const nextResponse = () => {
    setCurrentId(currentId === '3' ? '1' : (parseInt(currentId) + 1).toString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Workout Response</Text>
      <View style={styles.responseContainer}>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        <View style={styles.muscleGroupContainer}>
          <Text style={styles.muscleGroup}>Muscle Group: {currentExercise.muscleGroup}</Text>
        </View>
        <Text style={styles.details}>Sets: {currentExercise.sets} | Reps: {currentExercise.reps}</Text>
        <Text style={styles.details}>Rest: {currentExercise.restSeconds} seconds</Text>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{currentExercise.instructions}</Text>
        </View>
        <Text style={styles.details}>Difficulty: {currentExercise.difficulty} | Equipment: {currentExercise.equipment}</Text>
      </View>
      <TouchableOpacity style={styles.buttonContainer} onPress={nextResponse}>
        <Text style={styles.buttonText}>Next Exercise</Text>
      </TouchableOpacity>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  responseContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  muscleGroupContainer: {
    backgroundColor: '#9e9e9e',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  muscleGroup: {
    fontSize: 16,
    //fontWeight: '600',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    borderWidth: 2,
    borderColor: '#3c3c3c',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  details: {
    fontSize: 14,
    marginBottom: 5,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    backgroundColor: '#00ab00',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
})