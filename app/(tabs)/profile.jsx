import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

function SectionLabel({ children }) {
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelAccent} />
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

function GlassCard({ children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardSheen} />
      {children}
    </View>
  );
}

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
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Kitten', 'Discord Mod', 'Prefer not to say'];

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
      data: { name: name.trim(), age: age.trim(), weight: weight.trim(), height: height.trim(), gender: gender.trim(), onboarding_complete: true },
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
      <View style={styles.wrapper}>
        <ActivityIndicator color="#EF88AD" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>YOUR ACCOUNT</Text>
            </View>
          </View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Edit your personal details.</Text>
        </View>

        <GlassCard>
          <SectionLabel>Name</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setName}
            editable={!saving}
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Age</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setAge}
            editable={!saving}
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Weight (kg)</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={weight}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setWeight}
            editable={!saving}
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Height (cm)</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            keyboardType="numeric"
            value={height}
            placeholderTextColor="rgba(165, 56, 96, 0.65)"
            onChangeText={setHeight}
            editable={!saving}
          />
        </GlassCard>

        <GlassCard>
          <SectionLabel>Gender</SectionLabel>
          <TouchableOpacity
            style={[styles.input, styles.dropdownTrigger]}
            onPress={() => setGenderDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={gender ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {gender || 'Select gender'}
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
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving
            ? <><ActivityIndicator color="#EF88AD" /><Text style={styles.buttonText}>  Saving...</Text></>
            : <Text style={styles.buttonText}>Save Changes</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#080005',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    width: '100%',
  },
  container: {
    paddingHorizontal: 8,
    paddingTop: 64,
    paddingBottom: 52,
    width: '100%',
  },
  header: {
    marginBottom: 30,
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
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(165, 56, 96, 0.85)',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(58, 5, 25, 0.55)',
    borderRadius: 20,
    padding: 22,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#EF88AD',
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(8, 0, 5, 0.55)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(165, 56, 96, 0.45)',
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
    marginTop: 8,
    backgroundColor: 'rgba(239, 136, 173, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 136, 173, 0.55)',
    shadowColor: '#EF88AD',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
  logoutButton: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'rgba(165, 56, 96, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});
