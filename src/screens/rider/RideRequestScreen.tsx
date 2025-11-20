import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { riderService, calculateDistance } from '../../services/supabase';
import { useAuthStore, useRiderStore } from '../../store/store';
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

interface RideRequestScreenProps {
  navigation: any;
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
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_300 = '#D4D4D4';
const GRAY_700 = '#3F3F3F';

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

export const RideRequestScreen: React.FC<RideRequestScreenProps> = ({ navigation }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('economy');
  const [loading, setLoading] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [estimatedFares, setEstimatedFares] = useState<any>({});
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 42.6629,
    longitude: 21.1581,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  
  const user = useAuthStore((state: any) => state.user);
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
  useEffect(() => {
    if (pickup && dropoff) {
      calculateFares(pickup, dropoff);
    }
  }, [pickup, dropoff]);

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
              setPickup(address);
              setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            },
            (error) => {
              console.error('Location error:', error.message);
              Alert.alert(
                'Location Access',
                'Please enable location services to use your current location.',
                [{ text: 'OK' }]
              );
              // Set default location if permission denied
              setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: 'Prishtinë, Kosovo' });
              setPickup('Prishtinë, Kosovo');
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );
        } else {
          console.warn('Geolocation not available');
          setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: 'Prishtinë, Kosovo' });
          setPickup('Prishtinë, Kosovo');
        }
      } else {
        // For native platforms, you would use react-native-geolocation-service or expo-location
        setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: 'Prishtinë, Kosovo' });
        setPickup('Prishtinë, Kosovo');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation({ lat: 42.6629, lng: 21.1581, address: 'Prishtinë, Kosovo' });
      setPickup('Prishtinë, Kosovo');
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
      const pickupCity = KOSOVO_CITIES.find(c => c.name === pickup);
      const dropoffCity = KOSOVO_CITIES.find(c => c.name === dropoff);
      const pickupCoords = pickupCity ? { lat: pickupCity.lat, lng: pickupCity.lng } : { lat: 42.6629, lng: 21.1581 };
      const dropoffCoords = dropoffCity ? { lat: dropoffCity.lat, lng: dropoffCity.lng } : { lat: 42.2139, lng: 20.7398 };

      const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
      const duration = Math.ceil(distance * 2.5);
      const estimatedFare = estimatedFares[selectedVehicle] || 0;

      const { data: createdRide, error } = await riderService.requestRide(
        user.id, pickupCoords.lat, pickupCoords.lng, pickup,
        dropoffCoords.lat, dropoffCoords.lng, dropoff,
        distance, duration, estimatedFare, selectedVehicle, 'wallet'
      );

      if (error) {
        console.error('Ride request error:', error);
        const errorMsg = (error as any)?.message || 'Please try again.';
        console.error('Failed to request ride:', errorMsg);
        return;
      }

      if (createdRide) {
        setCurrentRide(createdRide);
        navigation.navigate('RideTracking', { rideId: createdRide.id });
      }
    } catch (error) {
      console.error('Ride request exception:', error);
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
            {currentLocation && (
              <Marker
                coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                title="Your Location"
              />
            )}
          </MapView>
        </View>

        {/* Header with Menu */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('RiderTabs');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uber</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={BLACK} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Where to?"
            placeholderTextColor={GRAY_700}
            value={dropoff}
            onFocus={() => {
              setActiveField('dropoff');
              setShowCityPicker(true);
            }}
          />
          <Ionicons name="search" size={20} color={GRAY_700} style={styles.searchIcon} />
        </View>

        {/* Current Location */}
        {!showCityPicker && currentLocation && (
          <View style={styles.quickActionPanel}>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setActiveField('pickup'); setShowCityPicker(true); }}>
              <Ionicons name="location" size={20} color={BLACK} style={styles.actionIcon} />
              <Text style={styles.actionText}>My current location</Text>
              <TouchableOpacity onPress={() => setCurrentLocation(null)}>
                <Ionicons name="close" size={20} color={GRAY_700} />
              </TouchableOpacity>
            </TouchableOpacity>
            
            {pickup && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{pickup}</Text>
              </View>
            )}
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

        {/* Ride Selection Bottom Sheet */}
        {pickup && dropoff && (
          <View style={styles.rideSelectionPanel}>
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

            <TouchableOpacity
              style={[styles.requestButton, loading && styles.buttonDisabled]}
              onPress={handleRequestRide}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.requestButtonText}>
                  Request {VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.name}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  container: { flex: 1 },
  mapWrapper: { 
    flex: 1,
    backgroundColor: '#000000',
  },
  map: { 
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 24, fontWeight: 'bold', color: BLACK },
  headerTitle: { fontSize: 20, fontWeight: '700', color: BLACK },
  menuButton: { padding: 8 },
  menuButtonText: { fontSize: 24, color: BLACK },
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
    backgroundColor: WHITE,
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

  modalTitle: { fontSize: 16, fontWeight: '600', color: BLACK },
  modalSearchInput: {
    marginHorizontal: 15,
    marginVertical: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: GRAY_100,
    borderRadius: 8,
    fontSize: 15,
    color: BLACK,
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
  cityName: { fontSize: 15, color: BLACK },
  rideSelectionPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  panelTitle: { fontSize: 18, fontWeight: '700', color: BLACK, marginBottom: 15 },
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
  vehicleOptionSelected: { borderColor: BLACK, backgroundColor: GRAY_100 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '600', color: BLACK, marginBottom: 3 },
  vehicleDesc: { fontSize: 13, color: GRAY_700 },
  vehiclePrice: { fontSize: 18, fontWeight: '700', color: BLACK },
  requestButton: {
    backgroundColor: BLACK,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: { opacity: 0.5 },
  requestButtonText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});

export default RideRequestScreen;
