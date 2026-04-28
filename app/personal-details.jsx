import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PersonalDetailsScreen() {
    const { email, password } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('');

    const handleFinishSignup = () => {
        if(!name || !age || !weight || !height || !gender ) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        } 
        const newUserData = { email, password, name, age, weight, height, gender };
        console.log('New user data:', newUserData);
        Alert.alert('Success', 'Profile completed successfully');
    };
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>Tell us about yourself we can personalize your workouts.</Text>
                <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
                <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
                <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
                <TextInput style={styles.input} placeholder="Gender" value={gender} onChangeText={setGender} />
                <TouchableOpacity style={styles.button} onPress={handleFinishSignup}>
                    <Text style={styles.buttonText}>Finish Sign Up</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#4c81c6',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 8,
        color: '#fff',
    },
    subtitle: {
        fontSize: 15,
        color: '#CBD5E1',
        marginBottom: 24,
        lineHeight: 22,
    },
    input: {
        backgroundColor: '#1e293b',
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 14,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#1d2795',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});