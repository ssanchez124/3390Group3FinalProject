import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetSignupFieldsIfNeeded = (nextIsLogin) => {
    setIsLogin(nextIsLogin);
    if(nextIsLogin) {
      setConfirmPassword('');
    }};

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()){
      Alert.alert('Error', 'Email and password are required.');
      return;
    }
    if(!isLogin) {
      if (!confirmPassword.trim()){
        Alert.alert('Error', 'Please confirm your password.');
        return;
      }
      if (password !== confirmPassword){
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      if (password.length < 6){
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        return;
      }
    }
    setLoading(true);

    try {
      if (isLogin){
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if(error){
          Alert.alert('Login Failed', error.message);
          return;
        }
      } else{
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options : { data: { onboarding_complete: false, },}, });
        if (error) {
          Alert.alert('Signup Failed', error.message);
          return;
        }
        router.replace({ pathname: '/personal-details', params: { email: cleanEmail },
        });
      }
    } catch(err){
      console.error('Auth error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally{
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.container}>
            <Text style={styles.title}>FitnessAI</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Welcome Back!' : 'Create a new account'}</Text>
            <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleButton, isLogin && styles.activeToggle]} onPress={() => resetSignupFieldsIfNeeded(true)} disabled={loading}>
                <Text style={[styles.toggleButtonText, isLogin && styles.activeToggleText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, !isLogin && styles.activeToggle]} onPress={() => resetSignupFieldsIfNeeded(false)} disabled={loading}>
                <Text style={[styles.toggleButtonText, !isLogin && styles.activeToggleText]}>Sign Up</Text>
            </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} editable={!loading} />

            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry autoComplete={isLogin ? 'password' : 'new-password'} value={password} onChangeText={setPassword} editable={!loading} />

            {!isLogin && (
              <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#888" secureTextEntry autoComplete="new-password" value={confirmPassword} onChangeText={setConfirmPassword} editable={!loading} />)}

            <TouchableOpacity style={[styles.mainButton, loading && styles.disabledButton]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : 
              ( <Text style={styles.mainButtonText}>
                  {isLogin ? 'Login' : 'Continue to Profile Details'}
                </Text>)}
            </TouchableOpacity>

            <TouchableOpacity onPress={async () => {
                  await supabase.auth.signOut();
                  Alert.alert('Signed out');
                }} style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Force Sign Out</Text>
              </TouchableOpacity>

            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Text style={styles.linkText} onPress={() => !loading && resetSignupFieldsIfNeeded(!isLogin)}>{isLogin ? 'Sign Up' : 'Login'}</Text>
            </Text>
          </View>

        </ScrollView>

    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#4c81c6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    padding: 4,
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
  disabledButton: {
    opacity: 0.7,
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