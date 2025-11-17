import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { driverService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';

interface ActiveRideScreenProps {
  route: any;
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_300 = '#D4D4D4';
const GRAY_700 = '#3F3F3F';
const GRAY_900 = '#171717';

export const ActiveRideScreen: React.FC<ActiveRideScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState<'accepted' | 'in_progress' | 'completed'>('accepted');
  const user = useAuthStore((state: any) => state.user);

  useEffect(() => {
    fetchRide();
    const interval = setInterval(fetchRide, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRide = async () => {
    try {
      const { data, error } = await driverService.getActiveRide(user?.id || '');
      if (error) {
        Alert.alert('Error', 'Failed to fetch ride');
        return;
      }
      if (data) {
        setRide(data);
        setRideStatus(data.status);
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleStartRide = async () => {
    try {
      const { error } = await driverService.startRide(rideId);
      if (error) {
        Alert.alert('Error', 'Failed to start ride');
        return;
      }
      setRideStatus('in_progress');
      Alert.alert('Success', 'Ride started');
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleCompleteRide = async () => {
    try {
      const actualFare = ride?.estimated_fare || 0;
      const { error } = await driverService.completeRide(rideId, actualFare);
      if (error) {
        Alert.alert('Error', 'Failed to complete ride');
        return;
      }

      Alert.alert('Success', 'Ride completed!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleCancelRide = async () => {
    Alert.alert('Cancel Ride', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const { error } = await driverService.cancelRide(rideId, 'Driver cancelled');
            if (error) {
              Alert.alert('Error', 'Failed to cancel ride');
              return;
            }
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'An error occurred');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={BLACK} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER WITH CHAT BUTTON */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { rideId })}
        >
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        {/* Status Bar - Primary Pink/Teal */}
        <View
          style={[
            styles.statusBar,
            rideStatus === 'accepted' && { backgroundColor: GRAY_700 },
            rideStatus === 'in_progress' && { backgroundColor: BLACK },
            rideStatus === 'completed' && { backgroundColor: BLACK },
          ]}
        >
          <Text style={styles.statusText}>
            {rideStatus === 'accepted' && 'Head to pickup location'}
            {rideStatus === 'in_progress' && 'Ride in progress'}
            {rideStatus === 'completed' && 'Ride completed'}
          </Text>
        </View>

        {/* Card 1: Rider Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rider Details</Text>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {ride?.rider?.first_name} {ride?.rider?.last_name}
          </Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Rating
          </Text>
          <Text style={styles.value}>⭐ {ride?.rider?.rating}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Phone
          </Text>
          <Text style={styles.value}>{ride?.rider?.phone_number || 'N/A'}</Text>
        </View>

        {/* Card 2: Route Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Details</Text>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.address}>{ride?.pickup_address}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Dropoff
          </Text>
          <Text style={styles.address}>{ride?.dropoff_address}</Text>
        </View>

        {/* Card 3: Ride Stats */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>
                {ride?.estimated_distance_km?.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>
                {ride?.estimated_duration_minutes} min
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Fare</Text>
              <Text style={styles.value}>
                ${ride?.estimated_fare?.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {rideStatus === 'accepted' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: BLACK }]}
              onPress={handleStartRide}
            >
              <Text style={styles.buttonText}>Start Ride</Text>
            </TouchableOpacity>
          )}

          {rideStatus === 'in_progress' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: GRAY_900 }]}
              onPress={handleCompleteRide}
            >
              <Text style={styles.buttonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButtonStyle} onPress={handleCancelRide}>
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_100,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    color: GRAY_900,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatButton: {
    backgroundColor: GRAY_700,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButtonText: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: GRAY_100, // Light background
  },
  content: {
    padding: 20,
  },
  statusBar: {
    backgroundColor: GRAY_700, // Pink for accepted
    padding: 15,
    borderRadius: 10, // More modern
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: GRAY_700,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 20, // Increased padding
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: BLACK,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    color: BLACK,
    fontWeight: '600',
  },
  address: {
    fontSize: 16,
    color: BLACK,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 15,
  },
  button: {
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelButtonStyle: {
    backgroundColor: GRAY_900, // Use darker pink for cancel
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ActiveRideScreen;
