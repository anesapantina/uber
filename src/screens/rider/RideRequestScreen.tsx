import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { riderService, calculateDistance } from '../../services/supabase';
import { useAuthStore, useRiderStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScheduleRideModal } from '../../components/ScheduleRideModal';
import { CustomAlert } from '../../components/CustomAlert';
import { LocationAutocompleteInput } from '../../components/LocationAutocompleteInput';
import { GOOGLE_MAPS_DARK_STYLE } from '../../utils/config';

const BLUE_ACCENT = '#007AFF';

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

interface RideRequestScreenProps {
  navigation: any;
  route: any;
}

const KOSOVO_CITIES = [
  { name: 'Drenas', lat: 42.4583, lng: 21.0500 },
  { name: 'Ferizaj', lat: 42.3721, lng: 21.2717 },
  { name: 'Fushë Kosova', lat: 42.5167, lng: 21.1333 },
  { name: 'Gjakova', lat: 42.4333, lng: 20.4667 },
  { name: 'Gjilan', lat: 42.4558, lng: 21.4669 },
  { name: 'Istog', lat: 42.6122, lng: 20.0378 },
  { name: 'Kaçanik', lat: 42.1978, lng: 21.2142 },
  { name: 'Kamenica', lat: 42.4889, lng: 21.6833 },
  { name: 'Klinë', lat: 42.5800, lng: 20.6447 },
  { name: 'Lipjan', lat: 42.5514, lng: 21.2511 },
  { name: 'Malisheva', lat: 42.2919, lng: 20.5819 },
  { name: 'Mitrovica', lat: 42.8854, lng: 20.8671 },
  { name: 'Obiliq', lat: 42.6225, lng: 21.0903 },
  { name: 'Pejë', lat: 42.6621, lng: 20.2769 },
  { name: 'Podujevë', lat: 42.5319, lng: 21.3608 },
  { name: 'Prishtinë', lat: 42.6629, lng: 21.1581 },
  { name: 'Prizren', lat: 42.2139, lng: 20.7398 },
  { name: 'Rahovec', lat: 42.3653, lng: 20.6361 },
  { name: 'Skenderaj', lat: 42.5683, lng: 20.8911 },
  { name: 'Suharekë', lat: 42.3689, lng: 20.7917 },
  { name: 'Shtërpcë', lat: 42.1008, lng: 21.0458 },
  { name: 'Shtime', lat: 42.4917, lng: 21.0333 },
  { name: 'Viti', lat: 42.1675, lng: 21.4589 },
  { name: 'Vushtrri', lat: 42.7475, lng: 20.9939 },
];

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#1A1A1A';
const GRAY_200 = '#2A2A2A';
const GRAY_300 = '#3A3A3A';
const GRAY_700 = '#CCCCCC';

const VEHICLE_TYPES = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable, everyday rides',
    passengers: 4,
    priceMultiplier: 1.0,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Newer cars with extra legroom',
    passengers: 4,
    priceMultiplier: 1.3,
  },
  {
    id: 'xl',
    name: 'UberXL',
    description: 'Affordable rides for groups up to 6',
    passengers: 6,
    priceMultiplier: 1.6,
  },
];

// Slide to Confirm Component
const SlideToConfirm: React.FC<{ onConfirm: () => void; loading: boolean; vehicleName: string }> = ({ onConfirm, loading, vehicleName }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [confirmed, setConfirmed] = useState(false);
  const maxSlide = 250; // Adjust based on container width

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loading && !confirmed,
      onMoveShouldSetPanResponder: () => !loading && !confirmed,
      onPanResponderGrant: () => {
        slideAnim.setOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= maxSlide) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Improved threshold - 60% instead of 70% for easier confirmation
        if (gestureState.dx > maxSlide * 0.6 || gestureState.vx > 0.5) {
          // User slid far enough or with enough velocity - confirm
          Animated.timing(slideAnim, {
            toValue: maxSlide,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setConfirmed(true);
            // Call the confirm handler which will navigate
            onConfirm();
          });
        } else {
          // Snap back with faster animation
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.slideContainer}>
      <View style={styles.slideTrack}>
        <Text style={styles.slideText}>
          {loading ? 'Processing...' : confirmed ? '✓ Confirmed!' : `Slide to confirm ${vehicleName}`}
        </Text>
      </View>
      {!loading && !confirmed && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.slideThumb,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={24} color={BLACK} />
        </Animated.View>
      )}
      {loading && (
        <View style={styles.slideThumb}>
          <ActivityIndicator color={BLACK} size="small" />
        </View>
      )}
    </View>
  );
};

export const RideRequestScreen: React.FC<RideRequestScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  // Get params from DestinationSelectScreen if available
  const params = route?.params || {};
  const [pickup, setPickup] = useState(params.pickup || '');
  const [pickupLat, setPickupLat] = useState(params.pickupLat || null);
  const [pickupLng, setPickupLng] = useState(params.pickupLng || null);
  const [dropoff, setDropoff] = useState(params.dropoff || '');
  const [dropoffLat, setDropoffLat] = useState(params.dropoffLat || null);
  const [dropoffLng, setDropoffLng] = useState(params.dropoffLng || null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(params.scheduledTime || null);

  const [selectedVehicle, setSelectedVehicle] = useState('economy');
  const [loading, setLoading] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleSuccessAlert, setShowScheduleSuccessAlert] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [estimatedFares, setEstimatedFares] = useState<any>({});
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: pickupLat || 42.6629,
    longitude: pickupLng || 21.1581,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Saved Places State
  const [homeLocation, setHomeLocation] = useState<string | null>(null);
  const [workLocation, setWorkLocation] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [isEditingPlace, setIsEditingPlace] = useState<string | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [tempPlaceAddress, setTempPlaceAddress] = useState('');
  const [tempPlaceLat, setTempPlaceLat] = useState<number | null>(null);
  const [tempPlaceLng, setTempPlaceLng] = useState<number | null>(null);

  const user = useAuthStore((state: any) => state.user);
  const setUser = useAuthStore((state: any) => state.setUser);
  const setCurrentRide = useRiderStore((state: any) => state.setCurrentRide);

  // Verify user exists on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (user?.id) {
        // Verify user in database
        const { data, error } = await riderService.getRiderProfile(user.id);
        if (error || !data) {
          console.warn('User not found in database:', user.id);
        } else {
          console.log('User verified in database:', data);
        }
      }
    };
    verifyUser();
  }, [user?.id]);

  // Get user's current location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Recalculate fares when pickup or dropoff changes
  // Recalculate fares when pickup or dropoff changes
  useEffect(() => {
    if (pickup && dropoff) {
      calculateFares(pickup, dropoff);
    }
  }, [pickup, dropoff]);

  // Load User Profile for Library
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (user?.id) {
      const { data, error } = await riderService.getRiderProfile(user.id);
      if (data && !error) {
        setHomeLocation(data.home_address);
        setWorkLocation(data.work_address);
        setSavedPlaces(data.saved_places || []);
        setUser(data, 'rider');
      }
    }
  };

  const handlePlaceSelect = (address: string, lat: number, lng: number) => {
    setTempPlaceAddress(address);
    setTempPlaceLat(lat);
    setTempPlaceLng(lng);
  };

  const handleSavePlace = async () => {
    if (!user?.id || !tempPlaceAddress) return;
    setLoading(true);
    try {
      if (isEditingPlace === 'home') {
        await riderService.updateRiderProfile(user.id, { home_address: tempPlaceAddress });
        setHomeLocation(tempPlaceAddress);
      } else if (isEditingPlace === 'work') {
        await riderService.updateRiderProfile(user.id, { work_address: tempPlaceAddress });
        setWorkLocation(tempPlaceAddress);
      } else if (isEditingPlace === 'custom') {
        const newPlaces = [...savedPlaces, { address: tempPlaceAddress, lat: tempPlaceLat, lng: tempPlaceLng, name: 'Saved Place' }];
        await riderService.updateRiderProfile(user.id, { saved_places: newPlaces });
        setSavedPlaces(newPlaces);
      }
      setShowPlaceModal(false);
      setIsEditingPlace(null);
      setTempPlaceAddress('');
    } catch (error) { Alert.alert('Error', 'Failed to save'); }
    finally { setLoading(false); }
  };

  const onPlacePress = (type: 'home' | 'work' | 'custom', address: string | null) => {
    if (address) {
      setDropoff(address);
      // Ideally geocode here if we don't have coords
    } else {
      setIsEditingPlace(type);
      setShowPlaceModal(true);
    }
  };

  const renderLibraryItem = (icon: string, label: string, value: string | null, type: 'home' | 'work' | 'custom', color: string = BLUE_ACCENT) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => onPlacePress(type, value)}
      onLongPress={() => { setIsEditingPlace(type); setTempPlaceAddress(value || ''); setShowPlaceModal(true); }}
    >
      <View style={[styles.libraryIconCircle, { backgroundColor: value ? color : '#EEEEEE' }]}>
        <Ionicons name={icon} size={24} color={value ? '#FFF' : '#666'} />
      </View>
      <Text style={styles.libraryLabel}>{label}</Text>
      {!value && <Text style={styles.libraryAdd}>Add</Text>}
    </TouchableOpacity>
  );

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          console.log('Requesting location permission...');
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              console.log('Location obtained:', latitude, longitude);
              const address = await reverseGeocode(latitude, longitude);
              console.log('Address:', address);
              setCurrentLocation({ lat: latitude, lng: longitude, address });
              setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            },
            (error) => {
              console.error('Location error:', error.message);
              // Don't set default location - let user select manually
              setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: '' });
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );
        } else {
          console.warn('Geolocation not available');
          setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: '' });
        }
      } else {
        // For native platforms, you would use react-native-geolocation-service or expo-location
        setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: '' });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: '' });
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Nominatim for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data.address) {
        const { road, neighbourhood, suburb, city, town, village, country } = data.address;
        return road || neighbourhood || suburb || city || town || village || country || 'Current Location';
      }
      return 'Current Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Current Location';
    }
  };

  const calculateFares = (pickupCity: string, dropoffCity: string) => {
    if (!pickupCity || !dropoffCity || pickupCity === dropoffCity) {
      console.log('Cannot calculate fares:', { pickupCity, dropoffCity });
      return;
    }

    // Try exact match first
    let pickupCoords = KOSOVO_CITIES.find(c => c.name === pickupCity);
    let dropoffCoords = KOSOVO_CITIES.find(c => c.name === dropoffCity);

    // If no exact match, try partial match (city name contained in address)
    if (!pickupCoords) {
      pickupCoords = KOSOVO_CITIES.find(c =>
        pickupCity.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(pickupCity.toLowerCase())
      );
    }
    if (!dropoffCoords) {
      dropoffCoords = KOSOVO_CITIES.find(c =>
        dropoffCity.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(dropoffCity.toLowerCase())
      );
    }

    // If still no match, use default coordinates (Prishtinë to Prizren)
    if (!pickupCoords) {
      console.log('Using default pickup coords for:', pickupCity);
      pickupCoords = { name: pickupCity, lat: 42.6629, lng: 21.1581 };
    }
    if (!dropoffCoords) {
      console.log('Using default dropoff coords for:', dropoffCity);
      dropoffCoords = { name: dropoffCity, lat: 42.2139, lng: 20.7398 };
    }

    const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
    const farePerKm = 1.5;
    const baseFare = 2.5;
    const baseEstimate = baseFare + distance * farePerKm;

    const fares: any = {};
    VEHICLE_TYPES.forEach(vehicle => {
      fares[vehicle.id] = baseEstimate * vehicle.priceMultiplier;
    });

    console.log('Calculated fares:', fares);
    setEstimatedFares(fares);
  };

  const filterCities = (search: string) => {
    if (!search) return KOSOVO_CITIES;
    return KOSOVO_CITIES.filter((city) => city.name.toLowerCase().includes(search.toLowerCase()));
  };

  const handleSelectCity = (city: any) => {
    if (activeField === 'pickup') {
      setPickup(city.name);
      if (dropoff) {
        calculateFares(city.name, dropoff);
      }
    } else if (activeField === 'dropoff') {
      setDropoff(city.name);
      if (pickup) {
        calculateFares(pickup, city.name);
      }
    }
    setShowCityPicker(false);
    setCitySearch('');
  };

  const handleScheduleConfirm = (time: Date) => {
    setScheduledTime(time.toISOString());
    setShowScheduleModal(false);
    setShowScheduleSuccessAlert(true);
  };

  const formatScheduledTime = (isoString: string) => {
    const time = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr = '';
    if (time.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (time.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  };

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
      console.warn('Please select both pickup and dropoff locations');
      return;
    }
    if (pickup === dropoff) {
      console.warn('Pickup and dropoff locations cannot be the same');
      return;
    }
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    console.log('Requesting ride with user ID:', user.id);

    setLoading(true);
    try {
      // Use exact coordinates if available, otherwise fall back to city lookup
      let pickupCoords = { lat: pickupLat || 42.6629, lng: pickupLng || 21.1581 };
      let dropoffCoords = { lat: dropoffLat || 42.2139, lng: dropoffLng || 20.7398 };

      // If no exact coords, try to find city
      if (!pickupLat || !pickupLng) {
        const pickupCity = KOSOVO_CITIES.find(c => c.name === pickup);
        if (pickupCity) {
          pickupCoords = { lat: pickupCity.lat, lng: pickupCity.lng };
        }
      }
      if (!dropoffLat || !dropoffLng) {
        const dropoffCity = KOSOVO_CITIES.find(c => c.name === dropoff);
        if (dropoffCity) {
          dropoffCoords = { lat: dropoffCity.lat, lng: dropoffCity.lng };
        }
      }

      const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
      const duration = Math.ceil(distance * 2.5);
      const estimatedFare = estimatedFares[selectedVehicle] || 5.0; // Fallback to 5.0 if 0 or undefined

      try {
        const { data: createdRide, error } = await riderService.requestRide(
          user.id, pickupCoords.lat, pickupCoords.lng, pickup,
          dropoffCoords.lat, dropoffCoords.lng, dropoff,
          distance, duration, estimatedFare, selectedVehicle, 'wallet'
        );

        if (error) {
          console.error('Ride request error:', error);
          Alert.alert('Request Failed', 'Could not request ride. Please try again.');
          return;
        }

        if (createdRide) {
          // Add scheduled_time if provided
          const rideWithSchedule = {
            ...createdRide,
            scheduled_time: scheduledTime,
          };

          // CRITICAL: Save to persistent store immediately
          console.log('Saving ride to persistent store:', rideWithSchedule.id);
          setCurrentRide(rideWithSchedule);

          if (scheduledTime) {
            setShowScheduleSuccessAlert(true);
          } else {
            // Navigate to tracking
            navigation.navigate('RideTracking', { rideId: createdRide.id });
          }
        }
      } catch (err) {
        Alert.alert('Network Error', 'Please check your internet connection.');
      }
    } catch (error) {
      console.error('Ride request exception:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Map View Background - Dark/Black Theme */}
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            region={mapRegion}
            mapType="standard"
            customMapStyle={GOOGLE_MAPS_DARK_STYLE}
            userInterfaceStyle="dark"
          >
            {currentLocation && (
              <Marker
                coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                title="Your Location"
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
            {/* Pickup Marker */}
            {pickup && (() => {
              const pickupCity = KOSOVO_CITIES.find(c => c.name === pickup || pickup.includes(c.name));
              if (pickupCity) {
                return (
                  <Marker
                    coordinate={{ latitude: pickupCity.lat, longitude: pickupCity.lng }}
                    title="Pickup"
                    description={pickup}
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
                );
              }
              return null;
            })()}

            {/* Dropoff Marker */}
            {dropoff && (() => {
              const dropoffCity = KOSOVO_CITIES.find(c => c.name === dropoff || dropoff.includes(c.name));
              if (dropoffCity) {
                return (
                  <Marker
                    coordinate={{ latitude: dropoffCity.lat, longitude: dropoffCity.lng }}
                    title="Dropoff"
                    description={dropoff}
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
                );
              }
              return null;
            })()}

            {/* Route Line */}
            {pickup && dropoff && (() => {
              const pickupCity = KOSOVO_CITIES.find(c => c.name === pickup || pickup.includes(c.name));
              const dropoffCity = KOSOVO_CITIES.find(c => c.name === dropoff || dropoff.includes(c.name));
              if (pickupCity && dropoffCity) {
                return (
                  <Polyline
                    coordinates={[
                      { latitude: pickupCity.lat, longitude: pickupCity.lng },
                      { latitude: dropoffCity.lat, longitude: dropoffCity.lng },
                    ]}
                    strokeColor="#FFFFFF"
                    strokeWidth={4}
                  />
                );
              }
              return null;
            })()}
          </MapView>
        </View>

        {/* Back Button - REMOVED */}



        {/* Location Input Fields */}
        {!(pickup && dropoff) && (
          <View style={styles.locationInputContainer}>
            <TouchableOpacity
              style={styles.locationInputField}
              onPress={() => {
                navigation.navigate('DestinationSelect', {
                  pickup,
                  pickupLat,
                  pickupLng,
                  dropoff,
                  dropoffLat,
                  dropoffLng,
                  initialField: 'pickup'
                });
              }}
            >
              <Ionicons name="ellipse" size={14} color="#4A90E2" style={{ marginRight: 15 }} />
              <Text style={pickup ? styles.locationInputText : styles.locationInputPlaceholder} numberOfLines={1}>
                {pickup || 'Your location'}
              </Text>
            </TouchableOpacity>

            <View style={styles.locationDivider} />

            <TouchableOpacity
              style={styles.locationInputField}
              onPress={() => {
                navigation.navigate('DestinationSelect', {
                  pickup,
                  pickupLat,
                  pickupLng,
                  dropoff,
                  dropoffLat,
                  dropoffLng,
                  scheduledTime
                });
              }}
            >
              <Ionicons name="location-sharp" size={18} color={WHITE} style={{ marginRight: 15 }} />
              <Text style={dropoff ? styles.locationInputText : styles.locationInputPlaceholder} numberOfLines={1}>
                {dropoff || 'Where to?'}
              </Text>
            </TouchableOpacity>

            {/* Library Section (Added inside the floating card or below it) */}
            <View style={styles.libraryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryScroll}>
                {renderLibraryItem('home', 'Home', homeLocation, 'home', '#4A90E2')}
                {renderLibraryItem('briefcase', 'Work', workLocation, 'work', '#F5A623')}
                {renderLibraryItem('star', 'Saved', null, 'custom', '#666')}
              </ScrollView>
            </View>
          </View>
        )}

        {/* City Picker Modal */}
        <Modal visible={showCityPicker} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => { setShowCityPicker(false); setCitySearch(''); }}>
                  <Ionicons name="close" size={28} color={BLACK} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {activeField === 'pickup' ? 'Pickup location' : 'Dropoff location'}
                </Text>
                <View style={{ width: 30 }} />
              </View>

              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search cities..."
                placeholderTextColor={GRAY_700}
                value={citySearch}
                onChangeText={setCitySearch}
              />

              <FlatList
                data={filterCities(citySearch)}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.cityItem} onPress={() => handleSelectCity(item)}>
                    <Ionicons name="location-outline" size={20} color={BLACK} style={styles.cityIcon} />
                    <Text style={styles.cityName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Place Edit Modal */}
        <Modal visible={showPlaceModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { height: '60%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditingPlace === 'home' ? 'Set Home' : isEditingPlace === 'work' ? 'Set Work' : 'Add Place'}
                </Text>
                <TouchableOpacity onPress={() => setShowPlaceModal(false)}>
                  <Text style={styles.modalClose}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <LocationAutocompleteInput
                  placeholder="Search address..."
                  value={tempPlaceAddress}
                  onLocationSelect={handlePlaceSelect}
                  autoFocus
                  predefinedPlaces={KOSOVO_CITIES}
                />
                <TouchableOpacity
                  style={[styles.modalSaveButton, !tempPlaceAddress && styles.disabledButton]}
                  onPress={handleSavePlace}
                  disabled={!tempPlaceAddress || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Slide Button Panel - Shows when both locations selected */}
        {pickup && dropoff && (
          <View style={[styles.rideSelectionPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.panelTitle}>Select a ride</Text>

            {VEHICLE_TYPES.map((vehicle) => {
              const isSelected = selectedVehicle === vehicle.id;
              const fare = estimatedFares[vehicle.id];

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.vehicleOption, isSelected && styles.vehicleOptionSelected]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                  </View>
                  {fare ? <Text style={styles.vehiclePrice}>${fare.toFixed(2)}</Text> : <Text>-</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Schedule Info Display */}
            {scheduledTime && (
              <View style={styles.scheduleInfoContainer}>
                <Ionicons name="time-outline" size={18} color={WHITE} />
                <Text style={styles.scheduleInfoText}>
                  Scheduled for {formatScheduledTime(scheduledTime)}
                </Text>
                <TouchableOpacity onPress={() => setScheduledTime(null)}>
                  <Ionicons name="close-circle" size={20} color={GRAY_700} />
                </TouchableOpacity>
              </View>
            )}

            {/* Slide to Confirm and Schedule Button Row */}
            <View style={styles.confirmRow}>
              <View style={styles.slideToConfirmContainer}>
                <SlideToConfirm
                  onConfirm={handleRequestRide}
                  loading={loading}
                  vehicleName={VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.name || 'ride'}
                />
              </View>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setShowScheduleModal(true)}
              >
                <Ionicons name="calendar-outline" size={24} color={BLACK} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Schedule Modal */}
      <ScheduleRideModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
        navigation={navigation}
      />

      <CustomAlert
        visible={showScheduleSuccessAlert}
        title="Ride Scheduled"
        message={`Your ride has been scheduled for ${scheduledTime ? formatScheduledTime(scheduledTime) : ''}.\n\nWe'll notify you when your driver is on the way.`}
        icon="calendar"
        buttons={[
          {
            text: 'OK',
            style: 'default',
            // Hard reset to ensure navigation works
            onPress: () => {
              // Reset current stack to DestinationSelect
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'DestinationSelect',
                  params: { reset: true }
                }]
              });
            },
          },
        ]}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BLACK },
  container: { flex: 1 },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingMenuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  locationInputContainer: {
    position: 'absolute',
    bottom: 40,
    left: 15,
    right: 15,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9,
  },
  locationInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  locationInputText: {
    flex: 1,
    fontSize: 16,
    color: WHITE,
    fontWeight: '500',
  },
  locationInputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: GRAY_700,
  },
  locationDivider: {
    height: 1,
    backgroundColor: GRAY_200,
    marginHorizontal: 10,
  },
  libraryContainer: {
    marginTop: 10,
    paddingBottom: 5,
  },
  libraryScroll: {
    paddingHorizontal: 16,
    gap: 15,
  },
  libraryItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  libraryIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  libraryLabel: {
    fontSize: 12,
    color: WHITE,
    fontWeight: '600',
  },
  libraryAdd: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalSaveButton: {
    backgroundColor: BLACK,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalSaveText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  arrowButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLACK,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_100,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: BLACK, paddingVertical: 8 },
  searchIcon: { marginLeft: 8 },
  quickActionPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  actionIcon: { marginRight: 12 },
  actionText: { flex: 1, fontSize: 15, color: BLACK },
  locationInfo: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: GRAY_100,
    borderRadius: 8,
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: GRAY_700,
  },
  divider: { height: 1, backgroundColor: GRAY_200, marginVertical: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    flex: 1,
    backgroundColor: BLACK,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },

  modalTitle: { fontSize: 16, fontWeight: '600', color: WHITE },
  modalSearchInput: {
    marginHorizontal: 15,
    marginVertical: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: GRAY_100,
    borderRadius: 8,
    fontSize: 15,
    color: WHITE,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  cityIcon: { marginRight: 12 },
  cityName: { fontSize: 15, color: WHITE },
  rideSelectionPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BLACK,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    maxHeight: '50%',
  },
  panelTitle: { fontSize: 18, fontWeight: '700', color: WHITE, marginBottom: 15 },
  vehicleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: GRAY_200,
    borderRadius: 10,
  },
  vehicleOptionSelected: { borderColor: WHITE, backgroundColor: GRAY_200 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: WHITE, marginBottom: 3 },
  vehicleDesc: { fontSize: 13, color: GRAY_700 },
  vehiclePrice: { fontSize: 18, fontWeight: '700', color: WHITE },
  requestButton: {
    backgroundColor: WHITE,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  buttonDisabled: { opacity: 0.5 },
  requestButtonText: { color: BLACK, fontSize: 16, fontWeight: '700' },
  slideContainer: {
    marginTop: 15,
    marginBottom: 5,
    height: 60,
    backgroundColor: GRAY_100,
    borderRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  slideTrack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    color: GRAY_700,
    fontSize: 16,
    fontWeight: '600',
  },
  slideThumb: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scheduleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_200,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  scheduleInfoText: {
    flex: 1,
    fontSize: 14,
    color: WHITE,
    marginLeft: 8,
    fontWeight: '500',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slideToConfirmContainer: {
    flex: 1,
  },
  calendarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default RideRequestScreen;
