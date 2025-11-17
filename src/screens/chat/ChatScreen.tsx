import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { messageService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

// Black theme colors
const BLACK = '#000000';
const DARK_GRAY = '#1a1a1a';
const MEDIUM_GRAY = '#2a2a2a';
const LIGHT_GRAY = '#3a3a3a';
const WHITE = '#FFFFFF';
const TEXT_GRAY = '#b0b0b0';
const MY_MESSAGE_BG = '#0084ff';
const THEIR_MESSAGE_BG = '#2a2a2a';

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const userType = useAuthStore((state: any) => state.userType);
  const user = useAuthStore((state: any) => state.user);

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds for real-time updates
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [rideId]);

  const loadMessages = async () => {
    const { data, error } = await messageService.getMessages(rideId);
    if (!error && data) {
      // Only update if there are new messages
      if (JSON.stringify(data) !== JSON.stringify(messages)) {
        setMessages(data);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX
    Keyboard.dismiss();

    const { error } = await messageService.sendMessage(
      rideId,
      userType,
      user?.id,
      messageText
    );

    if (error) {
      // If error, restore the message
      setNewMessage(messageText);
    } else {
      // Reload messages immediately after sending
      loadMessages();
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.sender_type === userType;
    const isSystem = item.sender_type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessage}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <Text style={styles.senderLabel}>
            {item.sender_type === 'driver' ? 'Driver' : 'Rider'}
          </Text>
        )}
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={TEXT_GRAY}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: DARK_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: MEDIUM_GRAY,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: MY_MESSAGE_BG,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: THEIR_MESSAGE_BG,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_GRAY,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: WHITE,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: TEXT_GRAY,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessage: {
    backgroundColor: MEDIUM_GRAY,
    color: TEXT_GRAY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: DARK_GRAY,
    borderTopWidth: 1,
    borderTopColor: MEDIUM_GRAY,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: MEDIUM_GRAY,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
    color: WHITE,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: MY_MESSAGE_BG,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default ChatScreen;
