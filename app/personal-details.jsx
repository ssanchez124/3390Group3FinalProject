import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase'

export default function PersonalDetailsScreen() {
    const { email } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinishSignup = async () => {
        if(!name.trim() || !age.trim()  || !weight.trim()  || !height.trim()  || !gender.trim()  ) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        } 
        setLoading(true);
        try {
        const {error} = await supabase.auth.updateUser({ data: {name: name.trim(), age: age.trim(), weight: weight.trim(), height: height.trim(), gender: gender.trim(), onboarding_complete: true, },});
        if(error) {
            Alert.alert('Error', error.message);
            return;
        }
        Alert.alert('Success', 'Profile completed successfully');
        router.replace('/(tabs)/home');
        } catch(err) {
            console.error('Profile completion error:', err);
            Alert.alert('Error', 'Something went wrong while saving your profile.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>Tell us about yourself we can personalize your workouts.</Text>
                 {!!email && (<Text style={styles.emailText}>Signing up as: {email}</Text>)}
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Name" value={name} placeholderTextColor="#94A3B8" onChangeText={setName} editable={!loading} />
                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} placeholderTextColor="#94A3B8" onChangeText={setAge} editable={!loading} />
                <Text style={styles.label}>Weight(kg)</Text>
                <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} placeholderTextColor="#94A3B8" onChangeText={setWeight} editable={!loading} />
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} placeholderTextColor="#94A3B8" onChangeText={setHeight} editable={!loading} />
                <Text style={styles.label}>Gender</Text>
                <TextInput style={styles.input} placeholder="Gender" value={gender} placeholderTextColor="#94A3B8" onChangeText={setGender} editable={!loading} />
                <TouchableOpacity style={[styles.button, loading && styles.disabledButton]} onPress={handleFinishSignup} disabled={loading}>
                    {loading ? ( <ActivityIndicator color="#fff" /> ) : ( <Text style={styles.buttonText}>Finish Sign Up</Text>)}
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
    disabledButton: {
        opacity: 0.7,
    },
    label: {
    color: '#CBD5E1',
    marginBottom: 6,
    fontWeight: '600',
  },
});