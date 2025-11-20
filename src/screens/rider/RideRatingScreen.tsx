import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { riderService, ratingService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface RideRatingScreenProps {
  route: any;
  navigation: any;
}

export const RideRatingScreen: React.FC<RideRatingScreenProps> = ({ route, navigation }) => {
  const { rideId, driverId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state: any) => state.user);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const { error } = await ratingService.createRating(
        rideId,
        user?.id || '',
        driverId,
        rating,
        comment,
        true
      );

      if (error) {
        Alert.alert('Error', 'Failed to submit rating');
        return;
      }

      Alert.alert('Success', 'Thank you for your rating!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Rate Your Ride</Text>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              disabled={loading}
            >
              <Ionicons 
                name={rating >= star ? "star" : "star-outline"} 
                size={40} 
                color={rating >= star ? "#ffc107" : "#ddd"}
                style={{ marginHorizontal: 8 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingText}>Your Rating: {rating} / 5</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Additional Comments</Text>
          <TextInput
            style={styles.input}
            placeholder="How was your ride?"
            value={comment}
            onChangeText={setComment}
            editable={!loading}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmitRating}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Rating</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RideRatingScreen;
