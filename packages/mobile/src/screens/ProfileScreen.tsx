import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  async function handleImagePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const file = {
          uri: result.assets[0].uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        };

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`${Date.now()}.jpg`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.path);

        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        Alert.alert('Success', 'Profile picture updated!');
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile picture');
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    dispatch(logout());
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick} disabled={loading}>
          <Image
            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Updating...</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{profile.display_name}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Favorite Club</Text>
          <Text style={styles.value}>{profile.fav_club}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Skill Level</Text>
          <Text style={styles.value}>{profile.skill_level}/5</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Home County</Text>
          <Text style={styles.value}>{profile.home_county}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 16,
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});