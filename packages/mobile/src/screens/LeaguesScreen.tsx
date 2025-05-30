import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';
import { Team, LeagueTier } from '@kicklink/shared';

export default function LeaguesScreen() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTier, setSelectedTier] = useState<LeagueTier>('BRONZE');

  React.useEffect(() => {
    loadTeams();
  }, [selectedTier]);

  async function loadTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('league_tier', selectedTier);

    if (error) {
      console.error('Error loading teams:', error);
      return;
    }

    setTeams(data);
  }

  async function handleCreateTeam() {
    const teamName = 'New Team'; // In real app, show modal for input
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          manager_id: profile.id,
          colours: 'Red/White',
          league_tier: selectedTier,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Team created successfully!');
      loadTeams();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  const renderTeam = ({ item }: { item: Team }) => (
    <View style={styles.teamCard}>
      <Text style={styles.teamName}>{item.name}</Text>
      <Text style={styles.teamDetail}>Colors: {item.colours}</Text>
      <Text style={styles.teamDetail}>League: {item.league_tier}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tierSelector}>
        {(['BRONZE', 'SILVER', 'GOLD'] as LeagueTier[]).map((tier) => (
          <TouchableOpacity
            key={tier}
            style={[
              styles.tierButton,
              selectedTier === tier && styles.tierButtonActive,
            ]}
            onPress={() => setSelectedTier(tier)}
          >
            <Text style={[
              styles.tierButtonText,
              selectedTier === tier && styles.tierButtonTextActive,
            ]}>
              {tier}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateTeam}
      >
        <Text style={styles.createButtonText}>Create New Team</Text>
      </TouchableOpacity>

      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  tierSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  tierButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tierButtonActive: {
    backgroundColor: '#4CAF50',
  },
  tierButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  tierButtonTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    gap: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  teamDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});