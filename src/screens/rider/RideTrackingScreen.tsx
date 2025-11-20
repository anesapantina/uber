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
import { riderService } from '../../services/supabase';
import { useRiderStore, useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
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

  const handleCancelRide = async () => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', onPress: () => {} },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const { error } = await riderService.cancelRide(rideId, 'Rider cancelled');
            if (error) {
              console.error('Failed to cancel ride:', error);
              return;
            }
            setCurrentRideStore(null);
            navigation.navigate('RiderTabs');
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
              logout();
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

  // Handle cancelled/completed state
  if (!ride || ride.status === 'cancelled' || ride.status === 'completed') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Ride {ride?.status}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: BLACK }]} onPress={() => navigation.navigate('RiderTabs')}>
          <Text style={styles.buttonText}>Go Back to Home</Text>
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
          // Don't clear the ride, just navigate back
          navigation.navigate('RiderTabs', { screen: 'Home' });
        }}
      >
        <Ionicons name="arrow-back" size={24} color={BLACK} />
      </TouchableOpacity>
      
      {/* SETTINGS BUTTON - Floating top right */}
      <TouchableOpacity 
        style={styles.floatingSettingsButton}
        onPress={() => {}}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={BLACK} />
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
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [{ color: '#212121' }],
          },
          {
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#212121' }],
          },
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ color: '#757575' }],
          },
          {
            featureType: 'administrative.country',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9e9e9e' }],
          },
          {
            featureType: 'administrative.land_parcel',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#bdbdbd' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#181818' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#1b1b1b' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.fill',
            stylers: [{ color: '#2c2c2c' }],
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#8a8a8a' }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#373737' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#3c3c3c' }],
          },
          {
            featureType: 'road.highway.controlled_access',
            elementType: 'geometry',
            stylers: [{ color: '#4e4e4e' }],
          },
          {
            featureType: 'road.local',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#000000' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#3d3d3d' }],
          },
        ]}
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
            pinColor="#4A90E2"
          />
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
          pinColor="#000000"
        />
        
        {/* Dropoff Marker */}
        <Marker
          coordinate={{
            latitude: ride.dropoff_latitude,
            longitude: ride.dropoff_longitude,
          }}
          title="Dropoff Location"
          description={ride.dropoff_address}
          pinColor="#FF0000"
        />
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
                <Ionicons name="chatbubble-outline" size={20} color={BLACK} />
                <Text style={styles.buttonLabel}>Send a message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call-outline" size={20} color={BLACK} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={BLACK} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
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
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
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
    color: BLACK,
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
    color: BLACK,
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
    color: BLACK,
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
    color: BLACK,
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
    color: BLACK,
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
    color: BLACK,
    marginBottom: 4,
  },
  rideDetailsSubtitle: {
    fontSize: 14,
    color: GRAY_700,
  },
  cancelButton: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY_300,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
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
    color: BLACK,
  },
}); 

export default RideTrackingScreen;