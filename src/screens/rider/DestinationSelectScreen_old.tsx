import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LocationAutocompleteInput } from '../../components/LocationAutocompleteInput';
import { ScheduleRideModal } from '../../components/ScheduleRideModal';
import { getRecentLocations, saveRecentLocation, SavedLocation } from '../../services/locationService';

// Conditional map import
let MapView: any, Marker: any;
if (Platform.OS === 'web') {
  const webMaps = require('../../../react-native-maps-web');
  MapView = webMaps.MapView;
  Marker = webMaps.Marker;
} else {
  const nativeMaps = require('react-native-maps');
  MapView = nativeMaps.default;
  Marker = nativeMaps.Marker;
}

interface DestinationSelectScreenProps {
  navigation: any;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_300 = '#E0E0E0';
const GRAY_700 = '#666666';

export const DestinationSelectScreen: React.FC<DestinationSelectScreenProps> = ({ navigation }) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);

  const [recentLocations, setRecentLocations] = useState<SavedLocation[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: 42.6629,
    longitude: 21.1581,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Load recent locations on mount
  useEffect(() => {
    loadRecentLocations();
    getCurrentLocation();
  }, []);

  const loadRecentLocations = async () => {
    const locations = await getRecentLocations();
    setRecentLocations(locations);
  };

  const getCurrentLocation = () => {
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        },
        (error) => {
          console.log('Location error:', error);
        }
      );
    }
  };

  const handlePickupSelect = (address: string, lat: number, lng: number) => {
    setPickupAddress(address);
    setPickupLat(lat);
    setPickupLng(lng);

    // Update map region
    setMapRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    // Save to recent locations
    saveRecentLocation({ address, lat, lng, timestamp: Date.now() });
    loadRecentLocations();
  };

  const handleDropoffSelect = (address: string, lat: number, lng: number) => {
    setDropoffAddress(address);
    setDropoffLat(lat);
    setDropoffLng(lng);

    // Save to recent locations
    saveRecentLocation({ address, lat, lng, timestamp: Date.now() });
    loadRecentLocations();
  };

  const handleRecentLocationPress = (location: SavedLocation, isPickup: boolean) => {
    if (isPickup) {
      handlePickupSelect(location.address, location.lat, location.lng);
    } else {
      handleDropoffSelect(location.address, location.lat, location.lng);
    }
  };

  const handleScheduleConfirm = (time: Date) => {
    setScheduledTime(time);
  };

  const handleContinue = () => {
    if (!pickupAddress || !dropoffAddress || !pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return;
    }

    // Navigate to ride request with all the details
    navigation.navigate('RideRequest', {
      pickup: pickupAddress,
      pickupLat,
      pickupLng,
      dropoff: dropoffAddress,
      dropoffLat,
      dropoffLng,
      scheduledTime: scheduledTime?.toISOString(),
    });
  };

  const formatScheduledTime = (time: Date) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          mapType="standard"
        >
          {pickupLat && pickupLng && (
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              title="Pickup"
              pinColor="#4A90E2"
            />
          )}
          {dropoffLat && dropoffLng && (
            <Marker
              coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
              title="Dropoff"
              pinColor="#FF0000"
            />
          )}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Where to?</Text>

          {/* Location Inputs */}
          <View style={styles.inputsContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.dotIndicator}>
                <View style={styles.pickupDot} />
              </View>
              <View style={styles.inputField}>
                <LocationAutocompleteInput
                  placeholder="Your location"
                  value={pickupAddress}
                  onLocationSelect={handlePickupSelect}
                  icon="ellipse"
                  iconColor="#4A90E2"
                />
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.inputWrapper}>
              <View style={styles.dotIndicator}>
                <View style={styles.dropoffDot} />
              </View>
              <View style={styles.inputField}>
                <LocationAutocompleteInput
                  placeholder="Where to?"
                  value={dropoffAddress}
                  onLocationSelect={handleDropoffSelect}
                  icon="location-sharp"
                  iconColor="#FF0000"
                />
              </View>
            </View>
          </View>

          {/* Schedule Ride Section */}
          {pickupAddress && dropoffAddress && (
            <View style={styles.scheduleSection}>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() => setShowScheduleModal(true)}
              >
                <Ionicons name="time-outline" size={20} color={BLACK} />
                <Text style={styles.scheduleButtonText}>
                  {scheduledTime ? formatScheduledTime(scheduledTime) : 'Schedule for later'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={GRAY_700} />
              </TouchableOpacity>
            </View>
          )}

          {/* Recent Locations */}
          {recentLocations.length > 0 && !pickupAddress && !dropoffAddress && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Locations</Text>
              {recentLocations.slice(0, 5).map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleRecentLocationPress(location, !pickupAddress)}
                >
                  <View style={styles.recentIconContainer}>
                    <Ionicons name="time-outline" size={20} color={GRAY_700} />
                  </View>
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentAddress} numberOfLines={1}>
                      {location.address}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={GRAY_700} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Continue Button */}
          {pickupAddress && dropoffAddress && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={WHITE} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Schedule Modal */}
      <ScheduleRideModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  mapContainer: {
    height: '40%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
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
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BLACK,
    marginTop: 8,
    marginBottom: 24,
  },
  inputsContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dotIndicator: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
  },
  dividerLine: {
    width: 1,
    height: 20,
    backgroundColor: GRAY_300,
    marginLeft: 14,
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
  },
  scheduleSection: {
    marginBottom: 24,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_100,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_300,
  },
  scheduleButtonText: {
    flex: 1,
    fontSize: 16,
    color: BLACK,
    marginLeft: 12,
    fontWeight: '500',
  },
  recentSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  recentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentAddress: {
    fontSize: 16,
    color: BLACK,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: BLACK,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginRight: 8,
  },
});

export default DestinationSelectScreen;
