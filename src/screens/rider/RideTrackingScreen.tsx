import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { riderService } from '../../services/supabase';
import { useRiderStore, useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CancellationFeeModal } from '../../components/CancellationFeeModal';
import { GOOGLE_MAPS_DARK_STYLE } from '../../utils/config';

// Conditional map import
let MapView: any, Marker: any, Polyline: any;
if (Platform.OS === 'web') {
  const webMaps = require('../../../react-native-maps-web');
  MapView = webMaps.MapView;
  Marker = webMaps.Marker;
  Polyline = webMaps.Polyline;
} else {
  const nativeMaps = require('react-native-maps');
  MapView = nativeMaps.default;
  Marker = nativeMaps.Marker;
  Polyline = nativeMaps.Polyline;
}

interface RideTrackingScreenProps {
  route: any;
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#1A1A1A';
const GRAY_200 = '#2A2A2A';
const GRAY_300 = '#3A3A3A';
const GRAY_700 = '#CCCCCC';
const GRAY_900 = '#0A0A0A';

export const RideTrackingScreen: React.FC<RideTrackingScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const currentRide = useRiderStore((state: any) => state.currentRide);
  const [ride, setRide] = useState<any>(currentRide);
  const [loading, setLoading] = useState(!currentRide);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const setCurrentRideStore = useRiderStore((state: any) => state.setCurrentRide);
  const setUser = useAuthStore((state: any) => state.setUser);
  const logout = useAuthStore((state: any) => state.logout);
  const user = useAuthStore((state: any) => state.user);

  // Get user's current location with continuous tracking
  useEffect(() => {
    let watchId: number | null = null;

    const startLocationTracking = () => {
      try {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            // Get initial position
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Current location:', latitude, longitude);
                setCurrentLocation({ lat: latitude, lng: longitude });
              },
              (error) => {
                console.error('Initial location error:', error);
              },
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );

            // Watch position for continuous updates
            watchId = navigator.geolocation.watchPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Location updated:', latitude, longitude);
                setCurrentLocation({ lat: latitude, lng: longitude });
              },
              (error) => {
                console.error('Watch location error:', error);
              },
              { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            );
          }
        }
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };

    startLocationTracking();

    // Cleanup
    return () => {
      if (watchId !== null && Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    // Poll for ride status updates every 2 seconds
    const fetchRideStatus = async () => {
      try {
        const { data, error } = await riderService.getRideStatus(rideId);
        if (!error && data) {
          const previousStatus = ride?.status;

          setRide(data);
          setCurrentRideStore(data);
          setLoading(false);

          // If ride is completed, navigate to rating screen
          if (data.status === 'completed') {
            navigation.replace('RideRating', { rideId: data.id });
          }
        } else if (error) {
          console.error('Error fetching ride status:', error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching ride status:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Set up polling interval
    const interval = setInterval(fetchRideStatus, 2000);

    return () => clearInterval(interval);
  }, [rideId, ride?.status]);

  const handleCancelRide = () => {
    setShowCancellationModal(true);
  };

  const handleConfirmCancellation = () => {
    const CANCELLATION_FEE = 2.00;
    setShowCancellationModal(false);
    // Wait for modal animation to complete before navigating
    setTimeout(() => {
      navigation.navigate('PaymentMethod', {
        isCancellation: true,
        rideId: rideId,
        cancellationFee: CANCELLATION_FEE,
      });
    }, 300);
  };

  const handleLogout = async () => {
    try {
      const { authService } = await import('../../services/supabase');
      await authService.logout();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout();
    }
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

  // Handle cancelled/completed state
  if (!ride || ride.status === 'cancelled' || ride.status === 'completed') {
    const isCancelled = ride?.status === 'cancelled';
    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name={isCancelled ? "close-circle" : "checkmark-circle"}
          size={64}
          color={isCancelled ? "#999" : "#4CAF50"}
          style={{ marginBottom: 20 }}
        />
        <Text style={styles.title}>Ride {ride?.status}</Text>
        <Text style={{ color: GRAY_700, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 }}>
          {isCancelled
            ? "Your ride has been cancelled. You can request a new ride."
            : "Thank you for riding with us!"}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: BLACK }]}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              navigation.navigate('DestinationSelect');
            }
          }}
        >
          <Text style={styles.buttonText}>Request New Ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BACK BUTTON - Floating top left */}
      <TouchableOpacity
        style={styles.floatingBackButton}
        onPress={() => {
          // CRITICAL FIX: Don't clear the ride, just navigate back
          // The ride will persist in the store
          console.log('Navigating back, keeping ride in store');
          navigation.navigate('RiderTabs', { screen: 'Home' });
        }}
      >
        <Ionicons name="arrow-back" size={24} color={WHITE} />
      </TouchableOpacity>

      {/* SETTINGS BUTTON - Floating top right */}
      <TouchableOpacity
        style={styles.floatingSettingsButton}
        onPress={() => { }}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={WHITE} />
      </TouchableOpacity>

      {/* MAP/NAVIGATION VIEW */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (ride.pickup_latitude + ride.dropoff_latitude) / 2,
          longitude: (ride.pickup_longitude + ride.dropoff_longitude) / 2,
          latitudeDelta: Math.abs(ride.pickup_latitude - ride.dropoff_latitude) + 0.1,
          longitudeDelta: Math.abs(ride.pickup_longitude - ride.dropoff_longitude) + 0.1,
        }}
        mapType="standard"
        customMapStyle={GOOGLE_MAPS_DARK_STYLE}
        userInterfaceStyle="dark"
      >
        {/* Current Location Marker (Rider) */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            title="Your Location"
            description="You are here"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(0, 122, 255, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#007AFF', // System Blue
                borderWidth: 2,
                borderColor: 'white',
              }} />
            </View>
          </Marker>
        )}

        {/* Driver Location Marker (when accepted or in progress) */}
        {(ride.status === 'accepted' || ride.status === 'in_progress') && ride.driver?.current_latitude && ride.driver?.current_longitude && (
          <Marker
            coordinate={{
              latitude: ride.driver.current_latitude,
              longitude: ride.driver.current_longitude,
            }}
            title={`${ride.driver.first_name} (Driver)`}
            description={`${ride.driver.vehicle_model} - ${ride.driver.vehicle_plate}`}
            pinColor="#00FF00"
          />
        )}

        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: ride.pickup_latitude,
            longitude: ride.pickup_longitude,
          }}
          title="Pickup Location"
          description={ride.pickup_address}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location-sharp" size={40} color="black" />
            <View style={{
              position: 'absolute',
              top: 8,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'white'
            }} />
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker
          coordinate={{
            latitude: ride.dropoff_latitude,
            longitude: ride.dropoff_longitude,
          }}
          title="Dropoff Location"
          description={ride.dropoff_address}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location-sharp" size={40} color="black" />
            <View style={{
              position: 'absolute',
              top: 8,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'white'
            }} />
          </View>
        </Marker>
        {/* Route Line */}
        <Polyline
          coordinates={[
            { latitude: ride.pickup_latitude, longitude: ride.pickup_longitude },
            { latitude: ride.dropoff_latitude, longitude: ride.dropoff_longitude },
          ]}
          strokeColor="#FFFFFF"
          strokeWidth={4}
        />
      </MapView>

      {/* OVERLAY CARD - Bottom sheet style */}
      <View style={styles.overlayCard}>
        {/* HANDLE BAR */}
        <View style={styles.handleBar} />

        {ride.status === 'pending' ? (
          // PENDING STATE
          <View style={styles.pendingContainer}>
            <ActivityIndicator size="large" color={BLACK} style={{ marginBottom: 15 }} />
            <Text style={styles.pendingTitle}>Finding your ride...</Text>
            <Text style={styles.pendingSubtitle}>This should only take a moment</Text>
          </View>
        ) : (
          // DRIVER MATCHED STATE
          <View style={styles.matchedContainer}>
            {/* Match notification */}
            <View style={styles.matchBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.matchText}>You've been matched with a driver</Text>
            </View>


            {/* Pickup time indicator */}
            <Text style={styles.pickupTime}>Pickup in 2 min</Text>

            {/* Driver Details Section */}
            <View style={styles.driverSection}>
              <View style={styles.driverImageContainer}>
                <View style={styles.driverImagePlaceholder}>
                  <Ionicons name="person" size={40} color={GRAY_700} />
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>{ride.driver?.rating || '4.9'}</Text>
                </View>
              </View>

              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>
                  {ride.driver?.first_name || 'Driver'}
                </Text>
                <View style={styles.vehicleInfo}>
                  <Ionicons name="car" size={16} color={GRAY_700} />
                  <Text style={styles.vehicleText}>
                    {ride.driver?.vehicle_model || 'Vehicle'}
                  </Text>
                </View>
              </View>

              <View style={styles.vehiclePlate}>
                <Text style={styles.plateText}>
                  {ride.driver?.vehicle_plate || '3M53AF2'}
                </Text>
                <Text style={styles.vehicleColor}>
                  {ride.driver?.vehicle_color || 'Silver Honda Civic'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => navigation.navigate('Chat', { rideId: ride.id })}
              >
                <Ionicons name="chatbubble-outline" size={20} color={WHITE} />
                <Text style={styles.buttonLabel}>Send a message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call-outline" size={20} color={WHITE} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={WHITE} />
              </TouchableOpacity>
            </View>

          </View>
        )}

        {/* Ride Details */}
        <View style={styles.rideDetailsSection}>
          <Text style={styles.rideDetailsTitle}>Ride details</Text>
          <Text style={styles.rideDetailsSubtitle}>Meet at {ride.pickup_address}</Text>
        </View>

        {/* Cancel Button */}
        {ride.status !== 'in_progress' && ride.status !== 'completed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRide}
          >
            <Text style={styles.cancelButtonText}>Cancel ride</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancellation Fee Modal */}
      <CancellationFeeModal
        visible={showCancellationModal}
        onCancel={() => setShowCancellationModal(false)}
        onConfirm={handleConfirmCancellation}
        cancellationFee={2.00}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingSettingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BLACK,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  overlayCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GRAY_900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: GRAY_300,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
  },
  pendingSubtitle: {
    fontSize: 14,
    color: GRAY_700,
  },
  matchedContainer: {
    paddingVertical: 10,
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  matchText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  pickupTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 20,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  driverImageContainer: {
    marginRight: 15,
    position: 'relative',
  },
  driverImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BLACK,
    marginLeft: 2,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: GRAY_700,
    marginLeft: 5,
  },
  vehiclePlate: {
    alignItems: 'flex-end',
  },
  plateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 2,
  },
  vehicleColor: {
    fontSize: 12,
    color: GRAY_700,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GRAY_100,
    padding: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginLeft: 8,
  },
  callButton: {
    width: 50,
    height: 50,
    backgroundColor: GRAY_100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  moreButton: {
    width: 50,
    height: 50,
    backgroundColor: GRAY_100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideDetailsSection: {
    marginBottom: 15,
  },
  rideDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 4,
  },
  rideDetailsSubtitle: {
    fontSize: 14,
    color: GRAY_700,
  },
  cancelButton: {
    backgroundColor: GRAY_200,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY_300,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    width: '80%',
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: WHITE,
  },
});

export default RideTrackingScreen;