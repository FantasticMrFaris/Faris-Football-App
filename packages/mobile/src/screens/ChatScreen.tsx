import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';
import { Chat, Message } from '@kicklink/shared';

export default function ChatScreen({ navigation }) {
  const { profile } = useSelector((state: RootState) => state.auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    loadChats();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: selectedChat ? `chat_id=eq.${selectedChat.id}` : undefined,
      }, payload => {
        setMessages(current => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedChat]);

  async function loadChats() {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        messages:messages(
          sender_id,
          body,
          sent_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
      return;
    }

    setChats(data);
  }

  async function loadMessages(chatId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data);
  }

  async function sendMessage() {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: profile.id,
          body: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        setSelectedChat(item);
        loadMessages(item.id);
      }}
    >
      <Text style={styles.chatTitle}>
        {item.is_group ? 'Group Chat' : 'Direct Message'}
      </Text>
      {item.messages?.[0] && (
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.messages[0].body}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender_id === profile.id && styles.ownMessage,
    ]}>
      <Text style={styles.messageText}>{item.body}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.sent_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedChat(null)}
      >
        <Text style={styles.backButtonText}>← Back to Chats</Text>
      </TouchableOpacity>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatList: {
    padding: 16,
    gap: 12,
  },
  chatItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  messageList: {
    padding: 16,
    gap: 8,
  },
  messageContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  ownMessage: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});