import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { RootState } from '../store';
import { api } from '../store/api';
import { MatchGame } from '@kicklink/shared';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { profile } = useSelector((state: RootState) => state.auth);
  const { data: games, isLoading, error } = api.useGetNearbyGamesQuery(
    location ? {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
      radius: 50 // 50km radius
    } : null
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby games');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const renderGame = ({ item }: { item: MatchGame }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
    >
      <Text style={styles.gameTitle}>{item.title}</Text>
      <Text style={styles.gameVenue}>{item.venue}</Text>
      <Text style={styles.gameDate}>
        {format(new Date(item.gameDate), 'PPP')}
      </Text>
      <View style={styles.gameFooter}>
        <Text style={styles.gameFee}>£{(item.feeCents / 100).toFixed(2)}</Text>
        <Text style={[
          styles.gameStatus,
          item.status === 'FULL' && styles.gameFull
        ]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading nearby games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading games</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateGame')}
      >
        <Text style={styles.createButtonText}>Create New Game</Text>
      </TouchableOpacity>

      <FlatList
        data={games}
        renderItem={renderGame}
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
  gameCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameVenue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  gameStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  gameFull: {
    color: '#f44336',
  },
});