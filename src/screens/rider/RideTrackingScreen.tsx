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
import MapView, { Marker, Polyline } from 'react-native-maps';
import { riderService } from '../../services/supabase';
import { useRiderStore, useAuthStore } from '../../store/store';

interface RideTrackingScreenProps {
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

export const RideTrackingScreen: React.FC<RideTrackingScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const currentRide = useRiderStore((state: any) => state.currentRide);
  const [ride, setRide] = useState<any>(currentRide);
  const [loading, setLoading] = useState(!currentRide);
  const [refreshing, setRefreshing] = useState(false);
  const setCurrentRideStore = useRiderStore((state: any) => state.setCurrentRide);
  const setUser = useAuthStore((state: any) => state.setUser);
  const logout = useAuthStore((state: any) => state.logout);
  const user = useAuthStore((state: any) => state.user);

  useEffect(() => {
    // If we have the ride from props, use it immediately
    if (currentRide) {
      setRide(currentRide);
      setLoading(false);
    }
    
    // Poll for ride status updates every 2 seconds (faster polling)
    const fetchRideStatus = async () => {
      try {
        const { data, error } = await riderService.getRideStatus(rideId);
        if (!error && data) {
          const previousStatus = ride?.status;
          console.log('🔄 Ride status:', data.status);
          
          // Show alert when driver accepts
          if (previousStatus === 'pending' && data.status === 'accepted') {
            Alert.alert(
              '🎉 Driver Found!',
              `${data.driver?.first_name || 'A driver'} has accepted your ride and will arrive soon!`,
              [{ text: 'OK' }]
            );
          }
          
          setRide(data);
          setCurrentRideStore(data);
          
          // If ride is completed, navigate to rating screen
          if (data.status === 'completed') {
            navigation.replace('RideRating', { rideId: data.id });
          }
        }
      } catch (error) {
        console.error('Error fetching ride status:', error);
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Set up polling interval (every 2 seconds for faster updates)
    const interval = setInterval(fetchRideStatus, 2000);

    return () => clearInterval(interval);
  }, [rideId, ride?.status]);

  const handleCancelRide = async () => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', onPress: () => {} },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const { error } = await riderService.cancelRide(rideId, 'Rider cancelled');
            if (error) {
              Alert.alert('Error', 'Failed to cancel ride');
              return;
            }
            Alert.alert('Success', 'Ride cancelled');
            setCurrentRideStore(null);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'An error occurred');
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              const { authService } = await import('../../services/supabase');
              await authService.logout();
              logout(); // Use the store's logout function
              // The auth state change will automatically navigate to Login screen
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Finding a driver...';
      case 'accepted':
        return `Driver is ${ride?.driver?.estimated_arrival_minutes || 'a few'} min away`;
      case 'in_progress':
        return 'Ride in progress';
      case 'completed':
      case 'cancelled':
        return `Status: ${status}`;
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return GRAY_700;
      case 'accepted':
      case 'in_progress':
        return BLACK;
      case 'completed':
        return GRAY_900;
      default:
        return BLACK;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLACK} />
        <Text style={{ marginTop: 10, color: GRAY_700 }}>Loading Ride Status...</Text>
      </View>
    );
  }

  // Handle cancelled/completed state if the navigation.replace failed for some reason
  if (!ride || ride.status === 'cancelled' || ride.status === 'completed') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Ride {ride?.status}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: BLACK }]} onPress={() => navigation.navigate('RiderHome')}>
          <Text style={styles.buttonText}>Go Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      
      {/* HEADER WITH CHAT BUTTON */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Ride Status</Text>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { rideId: ride.id })}
        >
          <Text style={styles.chatButtonText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
      
      {/* MAP/NAVIGATION VIEW */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (ride.pickup_latitude + ride.dropoff_latitude) / 2,
          longitude: (ride.pickup_longitude + ride.dropoff_longitude) / 2,
          latitudeDelta: Math.abs(ride.pickup_latitude - ride.dropoff_latitude) + 0.1,
          longitudeDelta: Math.abs(ride.pickup_longitude - ride.dropoff_longitude) + 0.1,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: ride.pickup_latitude,
            longitude: ride.pickup_longitude,
          }}
          title="Pickup"
          pinColor="#e8ccd7"
        />
        {/* Dropoff Marker */}
        <Marker
          coordinate={{
            latitude: ride.dropoff_latitude,
            longitude: ride.dropoff_longitude,
          }}
          title="Dropoff"
          pinColor="#b8869e"
        />
        {/* Route Line */}
        <Polyline
          coordinates={[
            { latitude: ride.pickup_latitude, longitude: ride.pickup_longitude },
            { latitude: ride.dropoff_latitude, longitude: ride.dropoff_longitude },
          ]}
          strokeColor="#b8869e"
          strokeWidth={3}
        />
      </MapView>

      <ScrollView style={styles.content}>
        
        {/* STATUS CARD */}
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(ride.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(ride.status)}
          </Text>
        </View>

        {/* WAITING MESSAGE (Show when pending) */}
        {ride.status === 'pending' && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingText}>🔔 You will be notified when a driver accepts your ride</Text>
          </View>
        )}

        {/* FARE & RIDE DETAILS CARD */}
        <View style={styles.fareCard}>
          <Text style={styles.cardTitle}>Ride Details</Text>
          
          <View style={styles.fareRow}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance</Text>
              <Text style={styles.fareValue}>{ride.estimated_distance_km?.toFixed(1) || '0'} km</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Duration</Text>
              <Text style={styles.fareValue}>{ride.estimated_duration_minutes || '0'} min</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Fare</Text>
              <Text style={styles.fareValue}>${ride.estimated_fare?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* DRIVER DETAILS CARD (Only show if accepted/in_progress) */}
        {(ride.status === 'accepted' || ride.status === 'in_progress') && ride.driver && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Driver</Text>
            <View style={styles.driverInfo}>
              <View style={styles.driverLeft}>
                <Text style={styles.driverName}>
                  {ride.driver.first_name} {ride.driver.last_name}
                </Text>
                <Text style={styles.driverRating}>
                  <Text style={{ color: '#ffc107' }}>★</Text> {ride.driver.rating}
                </Text>
              </View>
              <View style={styles.driverRight}>
                <Text style={styles.carInfo}>{ride.driver.car_model}</Text>
                <Text style={styles.plateInfo}>{ride.driver.license_plate}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ROUTE INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>📍</Text>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.address}>{ride.pickup_address}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>🎯</Text>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.address}>{ride.dropoff_address}</Text>
            </View>
          </View>
        </View>

        {/* CANCEL BUTTON (Show if not yet in progress or completed) */}
        {ride.status !== 'in_progress' && ride.status !== 'completed' && (
          <TouchableOpacity style={styles.cancelButtonStyle} onPress={handleCancelRide} disabled={refreshing}>
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
        
        {/* LOGOUT BUTTON AT BOTTOM */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// ... Styles (from your original snippet, with additions) ...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: WHITE,
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
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 300,
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statusBar: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
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
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: GRAY_200,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
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
  waitingCard: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  waitingText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: BLACK,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonStyle: {
    backgroundColor: WHITE,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: BLACK,
  },
  cancelButtonText: {
    color: BLACK,
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: { // Reused from the loading screen logic above
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: { // Reused from the loading screen logic above
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: BLACK,
  },
  fareCard: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: BLACK,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  fareItem: {
    alignItems: 'center',
    flex: 1,
  },
  fareLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 5,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BLACK,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  driverLeft: {
    flex: 1,
  },
  driverRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BLACK,
  },
  driverRating: {
    fontSize: 14,
    color: GRAY_700,
    marginTop: 5,
  },
  carInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: BLACK,
  },
  plateInfo: {
    fontSize: 12,
    color: GRAY_700,
    marginTop: 3,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  routeIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
    marginLeft: 32,
  },
}); 

export default RideTrackingScreen;