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
    }
  };

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

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>AI-POWERED</Text>
              </View>
            </View>
            <Text style={styles.title}>FitnessAI</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Welcome Back' : 'Create Your Account'}</Text>

            <View style={styles.card}>
              <View style={styles.cardSheen} />

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                  onPress={() => resetSignupFieldsIfNeeded(true)}
                  disabled={loading}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                  onPress={() => resetSignupFieldsIfNeeded(false)}
                  disabled={loading}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(165, 56, 96, 0.65)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(165, 56, 96, 0.65)"
                secureTextEntry
                autoComplete={isLogin ? 'password' : 'new-password'}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              {!isLogin && (
                <TextInput
                  style={[styles.input, styles.inputLast]}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(165, 56, 96, 0.65)"
                  secureTextEntry
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#EF88AD" />
                : <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Continue to Profile Details'}</Text>
              }
            </TouchableOpacity>

            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.linkText} onPress={() => !loading && resetSignupFieldsIfNeeded(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </Text>

            <TouchableOpacity
              onPress={async () => {
                await supabase.auth.signOut();
                Alert.alert('Signed out');
              }}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>Force Sign Out</Text>
            </TouchableOpacity>

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
    backgroundColor: '#080005',
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
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
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
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(165, 56, 96, 0.85)',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 0, 5, 0.5)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(239, 136, 173, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.45)',
  },
  toggleText: {
    color: 'rgba(165, 56, 96, 0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#EF88AD',
  },
  input: {
    backgroundColor: 'rgba(8, 0, 5, 0.55)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  inputLast: {
    marginBottom: 0,
  },
  button: {
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(103, 13, 47, 0.15)',
    shadowOpacity: 0,
    borderColor: 'rgba(165, 56, 96, 0.25)',
  },
  buttonText: {
    color: '#EF88AD',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerText: {
    color: 'rgba(165, 56, 96, 0.7)',
    textAlign: 'center',
    fontSize: 14,
  },
  linkText: {
    color: '#EF88AD',
    fontWeight: '700',
  },
  devButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#A53860',
    fontSize: 12,
  },
});
