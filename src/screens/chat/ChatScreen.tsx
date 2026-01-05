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
  StatusBar,
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
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔄 ChatScreen mounted for ride:', rideId);
    console.log('👤 User type:', userType, 'User ID:', user?.id);

    // Load initial messages
    loadMessages();

    // Set up real-time subscription
    setupRealtimeSubscription();

    // Add polling as fallback (every 3 seconds)
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      console.log('🔄 ChatScreen unmounting, cleaning up subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [rideId]);

  const setupRealtimeSubscription = () => {
    console.log('🔌 Setting up real-time subscription for ride:', rideId);

    const subscription = messageService.subscribeToMessages(rideId, (message) => {
      console.log('📨 Real-time message received:', message);

      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        console.log('✅ Adding new message to list');
        return [...prev, message];
      });

      // Scroll to bottom after a short delay
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    subscriptionRef.current = subscription;
  };

  const loadMessages = async () => {
    console.log('📥 Loading messages for ride:', rideId);
    try {
      const { data, error } = await messageService.getMessages(rideId);

      if (error) {
        console.error('❌ Error loading messages:', error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Loaded', data.length, 'messages');
        setMessages(data);

        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 300);
      }
    } catch (error) {
      console.error('❌ Exception loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    console.log('📤 Sending message:', messageText);

    setNewMessage(''); // Clear immediately for better UX
    Keyboard.dismiss();

    try {
      const { data, error } = await messageService.sendMessage(
        rideId,
        userType,
        user?.id,
        messageText
      );

      if (error) {
        console.error('❌ Error sending message:', error);
        // If error, restore the message
        setNewMessage(messageText);
        return;
      }

      console.log('✅ Message sent successfully:', data);

      // Optimistically add the message to the list if not already present
      if (data) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.id);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Exception sending message:', error);
      setNewMessage(messageText);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (!item || !item.message) {
      console.warn('⚠️ Invalid message item:', item);
      return null;
    }

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
      <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons
                name={item.sender_type === 'driver' ? 'car' : 'person'}
                size={20}
                color={WHITE}
              />
            </View>
          </View>
        )}
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
        {isMyMessage && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.myAvatar]}>
              <Ionicons
                name={userType === 'driver' ? 'car' : 'person'}
                size={20}
                color={WHITE}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              const currentRoute = navigation.getState().routes[navigation.getState().index];
              if (currentRoute.params?.from) {
                navigation.navigate(currentRoute.params.from);
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              } else if (userType === 'driver') {
                // If we can't go back, go to the main driver screen
                navigation.navigate('DriverTabs');
              } else {
                navigation.navigate('RiderTabs');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Chat</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || `message-${index}`}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList
            ]}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={TEXT_GRAY} />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ backgroundColor: DARK_GRAY }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: BLACK,
  },
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 10 : 15,
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
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    maxWidth: '85%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myAvatar: {
    backgroundColor: MY_MESSAGE_BG,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    backgroundColor: MY_MESSAGE_BG,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: THEIR_MESSAGE_BG,
    borderBottomLeftRadius: 4,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: TEXT_GRAY,
    fontSize: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: TEXT_GRAY,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtext: {
    color: TEXT_GRAY,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
});

export default ChatScreen;
