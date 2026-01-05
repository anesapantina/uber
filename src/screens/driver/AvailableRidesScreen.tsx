import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { driverService, supabase } from '../../services/supabase';
import { useAuthStore, useDriverStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AvailableRidesScreenProps {
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

export const AvailableRidesScreen: React.FC<AvailableRidesScreenProps> = ({ navigation }) => {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [onDuty, setOnDuty] = useState(false);
  const user = useAuthStore((state: any) => state.user);
  const setAvailableRides = useDriverStore((state: any) => state.setAvailableRides);
  const setOnDutyStore = useDriverStore((state: any) => state.setOnDuty);

  useEffect(() => {
    // Auto-enable on duty when screen loads
    const initializeDriver = async () => {
      if (!onDuty && user?.id) {
        console.log('🔄 Auto-enabling on duty for driver');
        setOnDuty(true);
        setOnDutyStore(true);
        await driverService.setDriverAvailability(user.id, true);
      }
    };

    initializeDriver();
  }, []);

  useEffect(() => {
    if (onDuty) {
      startLocationUpdates();
      fetchAvailableRides();
      // Reduced interval from 10s to 3s for faster updates
      const interval = setInterval(fetchAvailableRides, 3000);
      return () => clearInterval(interval);
    }
  }, [onDuty]);

  const startLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      if (user?.id) {
        await driverService.updateDriverLocation(
          user.id,
          location.coords.latitude,
          location.coords.longitude
        );
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      let location;
      try {
        location = await Location.getCurrentPositionAsync({});
      } catch (e) {
        console.log('Location unavailable, trying last known...');
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        // Fallback for emulator/testing if no location
        console.log('Using fallback location');
        location = { coords: { latitude: 37.78825, longitude: -122.4324 } };
      }

      console.log('📍 Driver location:', location.coords.latitude, location.coords.longitude);

      const { data, error } = await driverService.getAvailableRides(
        location.coords.latitude,
        location.coords.longitude,
        50 // Increased radius to 50km
      );

      console.log('🚗 Available rides found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📦 First ride:', data[0]);
      }

      if (error) {
        console.error('Error fetching rides:', error);
        setRides([]);
        setAvailableRides([]);
        return;
      }

      setRides(data || []);
      setAvailableRides(data || []);
    } catch (error) {
      console.error('Fetch rides error:', error);
      setRides([]);
      setAvailableRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDuty = async (value: boolean) => {
    if (!user?.id) return;

    setOnDuty(value);
    setOnDutyStore(value);

    try {
      await driverService.setDriverAvailability(user.id, value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) return;

    try {
      // First, ensure driver exists in database with Supabase auth user ID
      console.log('👤 Getting Supabase user ID...');
      const { data: authData } = await supabase.auth.getUser();
      const driverId = authData?.user?.id || user.id;

      console.log('👤 Ensuring driver exists in database with ID:', driverId);
      console.log('👤 Using email:', authData?.user?.email || user.email);
      const profileResult = await driverService.updateDriverProfile(driverId, {
        email: authData?.user?.email || user.email || 'driver@gmail.com',
        first_name: 'Driver',
        last_name: 'User',
        phone_number: '555-0200',
        license_number: `DL-${driverId.substring(0, 8)}`,
        vehicle_model: 'Toyota Camry',
        vehicle_plate: `PL-${driverId.substring(0, 6)}`,
      });

      if (profileResult.error) {
        console.error('❌ Driver profile error:', profileResult.error);
        Alert.alert('Error', `Failed to create driver profile: ${JSON.stringify(profileResult.error)}`);
        return;
      }

      console.log('✅ Driver profile ensured, now accepting ride...');
      const { error } = await driverService.acceptRide(rideId, driverId);
      if (error) {
        console.error('❌ Accept error:', error);
        Alert.alert('Error', `Failed to accept ride: ${JSON.stringify(error)}`);
        return;
      }

      Alert.alert('Success', 'Ride accepted!');
      fetchAvailableRides(); // Refresh the list
      navigation.navigate('ActiveRide', { rideId });
    } catch (error) {
      console.error('❌ Accept exception:', error);
      Alert.alert('Error', `An error occurred. Please log in as driver@gmail.com`);
    }
  };

  const handleDenyRide = async (rideId: string) => {
    try {
      // Cancel the ride in the database
      const { error } = await driverService.cancelRide(rideId, 'Denied by driver');
      if (error) {
        console.error('Error denying ride:', error);
      }
      // Remove from local list
      setRides(prevRides => prevRides.filter(ride => ride.id !== rideId));
      Alert.alert('Ride Denied', 'The ride has been cancelled');
    } catch (error) {
      console.error('Deny ride error:', error);
    }
  };

  const renderRideItem = ({ item }: { item: any }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <Text style={styles.riderName}>
          {item.rider?.first_name} {item.rider?.last_name}
        </Text>
        <Text style={styles.rating}>⭐ {item.rider?.rating}</Text>
      </View>

      <View style={styles.rideDetails}>
        <Text style={styles.label}>From</Text>
        <Text style={styles.address}>{item.pickup_address}</Text>

        <Text style={[styles.label, { marginTop: 10 }]}>
          To
        </Text>
        <Text style={styles.address}>{item.dropoff_address}</Text>
      </View>

      <View style={styles.rideStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>
            {item.estimated_distance_km?.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>
            {item.estimated_duration_minutes} min
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Fare</Text>
          <Text style={styles.statValue}>
            ${item.estimated_fare?.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRide(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => handleDenyRide(item.id)}
        >
          <Text style={styles.denyButtonText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{onDuty ? 'Looking for rides...' : 'You are offline'}</Text>
            <Text style={styles.headerSubtitle}>{onDuty ? 'We\'ll notify you when a ride is near' : 'Go online to start earning'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: onDuty ? '#0A84FF' : '#3A3A3C' }]}>
            <Text style={styles.statusText}>{onDuty ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.contentContainer}>
        {!onDuty ? (
          <View style={styles.offlineContainer}>
            <TouchableOpacity
              style={styles.goButton}
              onPress={() => handleToggleDuty(true)}
              activeOpacity={0.8}
            >
              <View style={styles.goButtonInner}>
                <Text style={styles.goButtonText}>GO</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                const storage = (global as any).mockStorage;
                Alert.alert('Debug', `Total rides: ${storage?.rides?.length || 0}`);
              }}
            >
              <Text style={styles.debugText}>Debug Tools</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.onlineContainer}>
            {loading && rides.length === 0 ? (
              <View style={styles.centerContent}>
                <View style={styles.radarContainer}>
                  <View style={styles.radarRing} />
                  <Ionicons name="search" size={32} color="#636366" />
                </View>
                <Text style={styles.loadingText}>Searching area...</Text>
              </View>
            ) : rides.length === 0 ? (
              <View style={styles.centerContent}>
                <Ionicons name="car-sport-outline" size={64} color="#3A3A3C" />
                <Text style={styles.emptyText}>No rides locally</Text>
                <Text style={styles.emptySubtext}>Move to a busier area</Text>
              </View>
            ) : (
              <FlatList
                data={rides}
                renderItem={renderRideItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Floating Offline Button */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => handleToggleDuty(false)}
            >
              <Ionicons name="power" size={24} color={BLACK} />
              <Text style={styles.stopButtonText}>Go Offline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Deep Black Background
  },
  headerContainer: {
    backgroundColor: '#1C1C1E', // Dark Card Background
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#AEAEB2', // Light Gray Text
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  goButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#32D74B', // Green like images
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  goButtonInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: {
    fontSize: 48,
    fontWeight: '800',
    color: WHITE,
  },
  debugButton: {
    marginTop: 40,
    padding: 10,
  },
  debugText: {
    color: '#636366',
    fontSize: 12,
  },
  onlineContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    opacity: 0.5,
  },
  loadingText: {
    color: '#AEAEB2',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#636366',
    marginTop: 5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  rideCard: {
    backgroundColor: '#1C1C1E', // Dark Card
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    marginTop: 2, // Tiny separation
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  riderName: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: -0.5,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: BLACK,
    backgroundColor: '#FFD60A', // Keep gold badge for contrast
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rideDetails: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  address: {
    fontSize: 16,
    fontWeight: '500',
    color: WHITE,
    marginBottom: 16,
    lineHeight: 22,
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E', // Slightly lighter than card
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#AEAEB2',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: WHITE, // White button for contrast in dark mode
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  acceptButtonText: {
    color: BLACK,
    fontSize: 17,
    fontWeight: '700',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#FF453A', // iOS Dark Red
    fontSize: 17,
    fontWeight: '600',
  },
  stopButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default AvailableRidesScreen;