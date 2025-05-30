import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SwipeScreen({ navigation }) {
  const { profile } = useSelector((state: RootState) => state.auth);
  const [players, setPlayers] = useState([]);
  const swiperRef = useRef(null);

  React.useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)
      .not('id', 'in', (select: any) => {
        select
          .select('to_id')
          .from('likes')
          .eq('from_id', profile.id);
      });

    if (error) {
      console.error('Error loading players:', error);
      return;
    }

    setPlayers(data);
  }

  async function handleLike(index: number) {
    const likedPlayer = players[index];
    
    try {
      // Record the like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          from_id: profile.id,
          to_id: likedPlayer.id,
        });

      if (likeError) throw likeError;

      // Check for mutual like
      const { data: mutualLike, error: mutualError } = await supabase
        .from('likes')
        .select('*')
        .eq('from_id', likedPlayer.id)
        .eq('to_id', profile.id)
        .single();

      if (mutualError && mutualError.code !== 'PGRST116') throw mutualError;

      if (mutualLike) {
        // Create a chat
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({
            is_group: false,
          })
          .select()
          .single();

        if (chatError) throw chatError;

        // Navigate to chat
        navigation.navigate('Chat', { chatId: chat.id });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }

  const renderCard = (player) => (
    <View style={styles.card}>
      <Image
        source={{ uri: player.avatar_url || 'https://via.placeholder.com/300' }}
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{player.display_name}</Text>
        <Text style={styles.detail}>Favorite Club: {player.fav_club}</Text>
        <Text style={styles.detail}>Skill Level: {player.skill_level}/5</Text>
        <Text style={styles.detail}>County: {player.home_county}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {players.length > 0 ? (
        <Swiper
          ref={swiperRef}
          cards={players}
          renderCard={renderCard}
          onSwipedRight={handleLike}
          onSwipedLeft={() => {}}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={3}
          cardVerticalMargin={20}
          cardHorizontalMargin={20}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No more players to show</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH * 1.5,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});