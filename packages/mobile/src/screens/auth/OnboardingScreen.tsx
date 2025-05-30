import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { setProfile } from '../../store/slices/authSlice';

const SKILL_LEVELS = [1, 2, 3, 4, 5];
const COUNTIES = ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds']; // Add more counties

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [favClub, setFavClub] = useState('');
  const [skillLevel, setSkillLevel] = useState(3);
  const [homeCounty, setHomeCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  async function handleImagePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      // Upload to Supabase Storage
      const file = {
        uri: result.assets[0].uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      };

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${Date.now()}.jpg`, file);

      if (error) {
        Alert.alert('Error', 'Failed to upload image');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    }
  }

  async function handleSubmit() {
    if (!displayName || !favClub || !homeCounty) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const avatarUrl = await handleImagePick();

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          fav_club: favClub,
          skill_level: skillLevel,
          home_county: homeCounty,
        })
        .select()
        .single();

      if (error) throw error;
      dispatch(setProfile(data));
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        style={styles.input}
        placeholder="Favorite Club"
        value={favClub}
        onChangeText={setFavClub}
      />

      <View style={styles.skillContainer}>
        <Text style={styles.label}>Skill Level</Text>
        <View style={styles.skillButtons}>
          {SKILL_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.skillButton,
                skillLevel === level && styles.skillButtonActive,
              ]}
              onPress={() => setSkillLevel(level)}
            >
              <Text style={[
                styles.skillButtonText,
                skillLevel === level && styles.skillButtonTextActive,
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.countyContainer}>
        <Text style={styles.label}>Home County</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COUNTIES.map((county) => (
            <TouchableOpacity
              key={county}
              style={[
                styles.countyButton,
                homeCounty === county && styles.countyButtonActive,
              ]}
              onPress={() => setHomeCounty(county)}
            >
              <Text style={[
                styles.countyButtonText,
                homeCounty === county && styles.countyButtonTextActive,
              ]}>
                {county}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Profile...' : 'Complete Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  skillContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  skillButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  skillButtonText: {
    fontSize: 16,
    color: '#666',
  },
  skillButtonTextActive: {
    color: '#fff',
  },
  countyContainer: {
    marginBottom: 20,
  },
  countyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  countyButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  countyButtonText: {
    color: '#666',
  },
  countyButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});