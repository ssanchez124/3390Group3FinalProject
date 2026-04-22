import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = () => {
        if(!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Email and password are required');
            return;
        }
        if(!isLogin && password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if(isLogin) {
            // Handle login logic here
            Alert.alert('Success', 'Logged in successfully');
        } else {
            router.push({ pathname: 'personal-details', params: { email, password } });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>FitnessAI</Text>
                <Text style={styles.subtitle}>{isLogin ? 'Welcome Back!' : 'Create a new account'}</Text>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity style={[styles.toggleButton, isLogin && styles.activeToggle]} onPress={() => setIsLogin(true)}>
                        <Text style={[styles.toggleButtonText, isLogin && styles.activeToggleText]}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleButton, !isLogin && styles.activeToggle]} onPress={() => setIsLogin(false)}>
                        <Text style={[styles.toggleButtonText, !isLogin && styles.activeToggleText]}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
                {!isLogin && (
                    <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#888" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                )}
                <TouchableOpacity style={styles.mainButton} onPress={handleSubmit}>
                    <Text style={styles.mainButtonText}>{isLogin ? 'Login' : 'Continue'}</Text>
                </TouchableOpacity>
                <Text style={styles.footerText}>{isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <Text style={styles.linkText} onPress={() => setIsLogin(!isLogin)}>{isLogin ? 'Sign Up' : 'Login'}</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#4c81c6',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#CBD5E1',
        textAlign: 'center',
        marginBottom: 28,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#425ab2',
        borderRadius: 12,
        marginBottom: 20,
        padding:4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    activeToggle: {
        backgroundColor: '#1d3b95',
    },
    toggleButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    activeToggleText: {
        color: '#fff',
    },
    input: {
        backgroundColor: '#495b9d',
        color: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        fontSize: 16,
    },
    mainButton: {
        backgroundColor: '#1d2795',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    footerText: {
        color: '#CBD5E1',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
    linkText: {
        color: '#310b69',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },

});