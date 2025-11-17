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
      const interval = setInterval(fetchAvailableRides, 10000);
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
      const location = await Location.getCurrentPositionAsync({});
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Rides</Text>
        <View style={styles.dutyToggle}>
          <Text style={styles.dutyText}>On Duty</Text>
          <Switch
            value={onDuty}
            onValueChange={handleToggleDuty}
            thumbColor={onDuty ? BLACK : WHITE}
            trackColor={{ false: GRAY_300, true: GRAY_700 }}
          />
        </View>
      </View>

      {!onDuty ? (
        <View style={styles.offDutyContainer}>
          <Text style={styles.offDutyText}>
            Toggle "On Duty" to start accepting rides
          </Text>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              const storage = (global as any).mockStorage;
              console.log('🗄️ DEBUG - All rides in storage:', JSON.stringify(storage?.rides || [], null, 2));
              Alert.alert('Debug', `Total rides in storage: ${storage?.rides?.length || 0}`);
            }}
          >
            <Text style={styles.debugButtonText}>Debug: Check Storage</Text>
          </TouchableOpacity>
        </View>
      ) : loading && rides.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available rides nearby</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    backgroundColor: BLACK, // Black Header
    padding: 20,
    paddingTop: 50, // Added padding for safe area
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dutyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dutyText: {
    color: '#fff',
    fontWeight: '600',
  },
  offDutyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offDutyText: {
    fontSize: 16,
    color: GRAY_700,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: GRAY_700,
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  rideCard: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: GRAY_200,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
  },
  rating: {
    fontSize: 14,
    color: GRAY_700,
  },
  rideDetails: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 3,
  },
  address: {
    fontSize: 16,
    color: BLACK,
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9', // Light gray background for stats
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: GRAY_700,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BLACK,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: BLACK, // Black button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  denyButton: {
    flex: 1,
    backgroundColor: WHITE,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLACK,
  },
  denyButtonText: {
    color: BLACK,
    fontWeight: 'bold',
    fontSize: 16,
  },
  debugButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AvailableRidesScreen;