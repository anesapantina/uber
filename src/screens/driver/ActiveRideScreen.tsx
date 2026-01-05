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
import { driverService, riderService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  }, [rideId]);

  const fetchRide = async () => {
    try {
      // First try to get active ride by driver ID
      const { data, error } = await driverService.getActiveRide(user?.id || '');

      if (error || !data) {
        if (error) console.error('Error fetching active ride:', error);
        
        // If no active ride found, try to fetch by rideId directly
        const { data: rideData, error: rideError } = await riderService.getRideStatus(rideId);
        if (!rideError && rideData) {
          console.log('🔄 Ride status check:', rideData.status);
          
          // Check if ride was cancelled by rider
          if (rideData.status === 'cancelled' && rideData.cancelled_by === 'rider') {
            Alert.alert(
              '💰 Ride Cancelled',
              `The rider cancelled this ride. You have been compensated €${rideData.cancellation_fee?.toFixed(2) || '2.00'} for your time.`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          } else if (rideData.status === 'cancelled' || rideData.status === 'completed') {
            // Only alert if we are not already in completed state locally
            if (rideStatus !== 'completed') {
               Alert.alert('Ride Ended', 'This ride has ended or been cancelled.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
              return;
            }
          }
          setRide(rideData);
          setRideStatus(rideData.status);
        } else {
          // Ride not found via ID
          console.log('⚠️ Ride not found via ID:', rideId);
          // Do NOT exit automatically if ride is not found. 
          // This prevents accidental exits due to network glitches or query issues.
          // The user can manually go back if needed.
        }
        setLoading(false);
        return;
      }

      if (data) {
        setRide(data);
        setRideStatus(data.status);
      }
      setLoading(false);
    } catch (error) {
      console.error('Exception fetching ride:', error);
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    try {
      const { error } = await driverService.startRide(rideId);
      if (error) {
        console.error('Failed to start ride:', error);
        return;
      }
      setRideStatus('in_progress');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const handleCompleteRide = async () => {
    try {
      const actualFare = ride?.estimated_fare || 0;
      const { error } = await driverService.completeRide(rideId, actualFare);
      if (error) {
        console.error('Failed to complete ride:', error);
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error('An error occurred:', error);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* RIDER PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.riderHeader}>
            <View style={styles.riderInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{ride?.rider?.first_name?.charAt(0) || 'R'}</Text>
              </View>
              <View>
                <Text style={styles.riderName}>
                  {ride?.rider?.first_name} {ride?.rider?.last_name}
                </Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={BLACK} />
                  <Text style={styles.ratingText}>{ride?.rider?.rating || '5.0'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.communicationActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Chat', { rideId })}
              >
                <Ionicons name="chatbubble-outline" size={22} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => Alert.alert('Call', `Calling ${ride?.rider?.phone_number || 'Rider'}...`)}
              >
                <Ionicons name="call-outline" size={22} color={WHITE} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ROUTE CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Route</Text>
          <View style={styles.routeContainer}>
            {/* Timeline Visual */}
            <View style={styles.timeline}>
              <View style={styles.dotStart} />
              <View style={styles.line} />
              <View style={styles.dotEnd} />
            </View>

            <View style={styles.routeTextContainer}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeAddress}>{ride?.pickup_address}</Text>
              </View>
              <View style={[styles.routeItem, { marginTop: 24 }]}>
                <Text style={styles.routeLabel}>DROPOFF</Text>
                <Text style={styles.routeAddress}>{ride?.dropoff_address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* STATS CARD */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>EST. EARNING</Text>
            <Text style={styles.statValue}>€{ride?.estimated_fare?.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{ride?.estimated_distance_km?.toFixed(1)} km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>{ride?.estimated_duration_minutes} min</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION SHEET */}
      <View style={styles.bottomSheet}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: rideStatus === 'in_progress' ? '#32D74B' : '#FF9F0A' }]} />
          <Text style={styles.statusText}>
            {rideStatus === 'accepted' && 'Heading to Pickup'}
            {rideStatus === 'in_progress' && 'Trip in Progress'}
            {rideStatus === 'completed' && 'Trip Completed'}
          </Text>
        </View>

        {rideStatus === 'accepted' && (
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: WHITE }]}
            onPress={handleStartRide}
          >
            <Text style={[styles.mainButtonText, { color: BLACK }]}>Start Trip</Text>
            <Ionicons name="arrow-forward" size={24} color={BLACK} />
          </TouchableOpacity>
        )}

        {rideStatus === 'in_progress' && (
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: '#32D74B' }]}
            onPress={handleCompleteRide}
          >
            <Text style={styles.mainButtonText}>Complete Trip</Text>
            <Ionicons name="checkmark" size={24} color={WHITE} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={handleCancelRide}
        >
          <Text style={styles.cancelLinkText}>Cancel Trip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Deep Black
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E', // Dark Card
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: WHITE,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200, // Space for bottom sheet
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  riderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLACK,
  },
  communicationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
    paddingVertical: 6,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WHITE,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#3A3A3C',
    marginVertical: 4,
  },
  dotEnd: {
    width: 12,
    height: 12,
    borderWidth: 3,
    borderColor: WHITE,
    backgroundColor: '#1C1C1E',
  },
  routeTextContainer: {
    flex: 1,
  },
  routeItem: {
    minHeight: 60,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: WHITE,
    lineHeight: 22,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3A3A3C',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
  },
  cancelLink: {
    alignItems: 'center',
    padding: 10,
  },
  cancelLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF453A',
  },
});

export default ActiveRideScreen;
