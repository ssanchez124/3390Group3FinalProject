import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase'

function GlassCard({ children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      {children}
    </View>
  )
}

export default function PersonalDetailsScreen() {
  const { email } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Kitten', 'Discord Mod', 'Prefer not to say'];

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

        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SIGN UP</Text>
            </View>
          </View>
          <Text style={styles.title}>Complete Your{'\n'}Profile</Text>
          <Text style={styles.subtitle}>Tell us about yourself so we can personalize your workouts.</Text>
          {!!email && <Text style={styles.emailText}>Signing up as: {email}</Text>}
        </View>

        <GlassCard>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setName}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setAge}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={weight}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setWeight}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            keyboardType="numeric"
            value={height}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setHeight}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.input, styles.inputLast, styles.dropdownTrigger]}
            onPress={() => setGenderDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={gender ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {gender || 'Gender'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </GlassCard>

        <Modal visible={genderDropdownOpen} transparent animationType="fade" onRequestClose={() => setGenderDropdownOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setGenderDropdownOpen(false)}>
            <View style={styles.dropdown}>
              {genderOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    index < genderOptions.length - 1 && styles.dropdownOptionBorder,
                    gender === option && styles.dropdownOptionActive,
                  ]}
                  onPress={() => { setGender(option); setGenderDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownOptionText, gender === option && styles.dropdownOptionTextActive]}>
                    {option}
                  </Text>
                  {gender === option && <Text style={styles.dropdownCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFinishSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#EF88AD" />
            : <Text style={styles.buttonText}>Finish Sign Up</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080005',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 14,
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
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(165, 56, 96, 0.85)',
    lineHeight: 20,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 12,
    color: 'rgba(239, 136, 173, 0.55)',
    marginTop: 4,
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: 'rgba(165, 56, 96, 0.65)',
    flex: 1,
  },
  dropdownValue: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#EF88AD',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdown: {
    backgroundColor: 'rgba(8, 0, 5, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 5, 25, 0.9)',
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(239, 136, 173, 0.09)',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: 'rgba(196, 119, 142, 0.75)',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#EF88AD',
    fontWeight: '700',
  },
  dropdownCheck: {
    fontSize: 14,
    color: '#EF88AD',
    fontWeight: '700',
  },
  button: {
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
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
});
