import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const genderOptions = ['Female', 'Male', 'Non-binary','Kitten','Discord Mod', 'Prefer not to say'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    const metadata = user.user_metadata || {};
    setEmail(user.email || '');
    setName(metadata.name || '');
    setAge(metadata.age || '');
    setWeight(metadata.weight || '');
    setHeight(metadata.height || '');
    setGender(metadata.gender || '');
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !age.trim() || !weight.trim() || !height.trim() || !gender.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { name: name.trim(), age: age.trim(), weight: weight.trim(), height: height.trim(), gender: gender.trim(), onboarding_complete: true},
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Success', 'Profile updated successfully.');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout Failed', error.message);
      return;
    }
    router.replace('/(auth)');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Edit your personal details.</Text>
        <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} placeholderTextColor="#94A3B8" onChangeText={setName} editable={!loading} />
        <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} placeholderTextColor="#94A3B8" onChangeText={setAge} editable={!loading} />
        <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} placeholderTextColor="#94A3B8" onChangeText={setWeight} editable={!loading} />
        <Text style={styles.label}>Height (cm)</Text>
          <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} placeholderTextColor="#94A3B8" onChangeText={setHeight} editable={!loading} />
        <Text style={styles.label}>Gender</Text>
          <TouchableOpacity style={styles.input} onPress={() => setGenderDropdownOpen(true)}>
          <Text style={{ color: gender ? '#fff' : '#94A3B8', fontSize: 16 }}>{gender || 'Select gender'}</Text>
          </TouchableOpacity>
          <Modal visible={genderDropdownOpen} transparent animationType="fade" onRequestClose={() => setGenderDropdownOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setGenderDropdownOpen(false)}>
            <View style={styles.dropdown}>{genderOptions.map((option) => (
                <TouchableOpacity key={option} style={styles.dropdownOption} onPress={() => { setGender(option); setGenderDropdownOpen(false);}}>
                <Text style={styles.dropdownOptionText}>{option}</Text></TouchableOpacity>))}
              </View>
          </Pressable>
          </Modal>

        <TouchableOpacity style={[styles.button, saving && styles.disabledButton]} onPress={handleSaveProfile} disabled={saving}>
          {saving ? ( <ActivityIndicator color="#fff" /> ) : ( <Text style={styles.buttonText}>Save Changes</Text>)}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
  label: {
    color: '#CBD5E1',
    marginBottom: 6,
    fontWeight: '600',
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
  disabledInput: {
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#1d2795',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#991b1b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdown: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 8,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    color: '#fff',
    fontSize: 16,
  },
});
