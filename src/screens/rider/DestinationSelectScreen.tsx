import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LocationAutocompleteInput } from '../../components/LocationAutocompleteInput';
import { ScheduleRideModal } from '../../components/ScheduleRideModal';
import { CustomAlert } from '../../components/CustomAlert';
import { getRecentLocations, saveRecentLocation, SavedLocation } from '../../services/locationService';
import { riderService, authService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';

interface DestinationSelectScreenProps {
  navigation: any;
  route?: any;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_50 = '#FAFAFA';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_300 = '#CCCCCC';
const GRAY_400 = '#999999';
const GRAY_600 = '#666666';
const GRAY_800 = '#333333';
const BLUE_ACCENT = '#007AFF'; // iOS Blue-like

export const DestinationSelectScreen: React.FC<DestinationSelectScreenProps> = ({ navigation, route }) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);

  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff'>('dropoff');

  const [recentLocations, setRecentLocations] = useState<SavedLocation[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

  // Saved Places State
  const [homeLocation, setHomeLocation] = useState<string | null>(null);
  const [workLocation, setWorkLocation] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [isEditingPlace, setIsEditingPlace] = useState<string | null>(null); // 'home', 'work', 'custom'
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [tempPlaceAddress, setTempPlaceAddress] = useState('');
  const [tempPlaceLat, setTempPlaceLat] = useState<number | null>(null);
  const [tempPlaceLng, setTempPlaceLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const user = useAuthStore((state: any) => state.user);
  const setUser = useAuthStore((state: any) => state.setUser);

  // Load initial data
  useEffect(() => {
    loadRecentLocations();
    loadUserProfile();

    if (route?.params?.scheduledTime) {
      setScheduledTime(new Date(route.params.scheduledTime));
    }

    // Persistence: Pre-fill from params
    if (route?.params?.pickup) {
      setPickupAddress(route.params.pickup);
      setPickupLat(route.params.pickupLat);
      setPickupLng(route.params.pickupLng);
    }
    if (route?.params?.dropoff) {
      setDropoffAddress(route.params.dropoff);
      setDropoffLat(route.params.dropoffLat);
      setDropoffLng(route.params.dropoffLng);
    }

    if (route?.params?.reset) {
      resetFields();
      navigation.setParams({ reset: false });
    }
  }, [route?.params]);


  const resetFields = () => {
    setPickupAddress('');
    setPickupLat(null);
    setPickupLng(null);
    setDropoffAddress('');
    setDropoffLat(null);
    setDropoffLng(null);
    setScheduledTime(null);
  };

  const loadRecentLocations = async () => {
    const locations = await getRecentLocations();
    setRecentLocations(locations);
  };

  const loadUserProfile = async () => {
    if (user?.id) {
      setLoading(true);
      const { data, error } = await riderService.getRiderProfile(user.id);
      if (data && !error) {
        setHomeLocation(data.home_address);
        setWorkLocation(data.work_address);
        setSavedPlaces(data.saved_places || []);
        // Update store just in case
        setUser(data, 'rider');
      }
      setLoading(false);
    }
  };

  const handlePickupSelect = (address: string, lat: number, lng: number) => {
    setPickupAddress(address);
    setPickupLat(lat);
    setPickupLng(lng);
    saveRecentLocation({ address, lat, lng, timestamp: Date.now() });
    loadRecentLocations();
  };

  const handleDropoffSelect = (address: string, lat: number, lng: number) => {
    setDropoffAddress(address);
    setDropoffLat(lat);
    setDropoffLng(lng);
    saveRecentLocation({ address, lat, lng, timestamp: Date.now() });
    loadRecentLocations();
  };

  const handlePlaceSelect = (address: string, lat: number, lng: number) => {
    setTempPlaceAddress(address);
    setTempPlaceLat(lat);
    setTempPlaceLng(lng);
  };

  const handleSavePlace = async () => {
    if (!user?.id) return;
    if (!tempPlaceAddress) return;

    setLoading(true);
    try {
      if (isEditingPlace === 'home') {
        await riderService.updateRiderProfile(user.id, { home_address: tempPlaceAddress });
        setHomeLocation(tempPlaceAddress);
      } else if (isEditingPlace === 'work') {
        await riderService.updateRiderProfile(user.id, { work_address: tempPlaceAddress });
        setWorkLocation(tempPlaceAddress);
      } else if (isEditingPlace === 'custom') {
        // Simple implementation for now - just adding string address to array if not exists
        const newPlaces = [...savedPlaces, { address: tempPlaceAddress, lat: tempPlaceLat, lng: tempPlaceLng, name: 'Saved Place' }];
        await riderService.updateRiderProfile(user.id, { saved_places: newPlaces });
        setSavedPlaces(newPlaces);
      }
      setShowPlaceModal(false);
      setIsEditingPlace(null);
      setTempPlaceAddress('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const onPlacePress = (type: 'home' | 'work' | 'custom', address: string | null) => {
    if (address) {
      // Use as dropoff
      // Ideally we would get coordinates too, but for Home/Work string might be all we have initially if just migrated
      // For a robust app, we should geocode here if coords missing.
      // Assuming address string is enough for now or user will pick from autocomplete for precise setup.
      setDropoffAddress(address);
      // Hack: we don't have coords if just string is saved. 
      // In real implementation we'd probably save JSON {address, lat, lng} for home/work too.
      // For now, let's assume we proceed and maybe Autocomplete will resolve it or we just need coords eventually.
      // If we don't have coords, we can't really proceed to RideRequest properly without geocoding.
      // Let's open the PlaceModal to "Edit" if it's a long press? 
      // For now, if simply clicking:

      // Since we need coords for the map, if we don't have them, maybe we treat it as selecting text for the input
      // and let the user tap the suggestion or we auto-search.

      // Better UX: If we have address but no coords, put it in input and let Autocomplete find it?
      // Or just set it and let RideRequest handle it (RideRequest needs coords though).
      setDropoffAddress(address);
    } else {
      // Set new place
      setIsEditingPlace(type);
      setShowPlaceModal(true);
    }
  };

  const renderLibraryItem = (
    icon: string,
    label: string,
    value: string | null,
    type: 'home' | 'work' | 'custom',
    color: string = BLUE_ACCENT
  ) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => onPlacePress(type, value)}
      onLongPress={() => {
        setIsEditingPlace(type);
        setTempPlaceAddress(value || '');
        setShowPlaceModal(true);
      }}
      delayLongPress={500}
    >
      <View style={[styles.libraryIconCircle, { backgroundColor: value ? color : GRAY_200 }]}>
        <Ionicons name={icon} size={24} color={value ? WHITE : GRAY_600} />
      </View>
      <Text style={styles.libraryLabel}>{label}</Text>
      {!value && <Text style={styles.libraryAdd}>Add</Text>}
    </TouchableOpacity>
  );

  const handleContinue = () => {
    if (!pickupAddress || !dropoffAddress) {
      return;
    }

    // Safety check for coordinates
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      Alert.alert(
        'Invalid Location',
        'Please select a location from the suggestion list to ensure we have the correct coordinates.'
      );
      return;
    }

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
    const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `Scheduled: ${timeStr}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <View style={{ width: 40 }} />
            {/* Empty view for balance if we had a back button, but typically drag handles imply sheets. 
                     If full screen, maybe keep back button. Let's keep Back button for safety. */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('RiderTabs');
                }
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.mainContent}>
            <Text style={styles.largeTitle}>Where to?</Text>

            {/* Input Group */}
            <View style={styles.inputGroup}>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineDotStart} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDotEnd} />
              </View>

              <View style={styles.inputsContainer}>
                <View style={[styles.inputWrapper, { zIndex: activeInput === 'pickup' ? 20 : 1 }]}>
                  <LocationAutocompleteInput
                    placeholder="Current Location"
                    value={pickupAddress}
                    onLocationSelect={handlePickupSelect}
                    containerStyle={styles.inputFieldContainer}
                    inputStyle={styles.inputField}
                    autoFocus={route?.params?.initialField === 'pickup'}
                    darkMode={true}
                    onFocus={() => setActiveInput('pickup')}
                  />
                </View>
                <View style={[styles.inputDivider, { zIndex: 0 }]} />
                <View style={[styles.inputWrapper, { zIndex: activeInput === 'dropoff' ? 20 : 1 }]}>
                  <LocationAutocompleteInput
                    placeholder="Search destination"
                    value={dropoffAddress}
                    onLocationSelect={handleDropoffSelect}
                    containerStyle={styles.inputFieldContainer}
                    inputStyle={styles.inputField}
                    autoFocus={route?.params?.initialField === 'dropoff' || (!route?.params?.initialField && !dropoffAddress)}
                    darkMode={true}
                    onFocus={() => setActiveInput('dropoff')}
                  />
                </View>
              </View>
            </View>

            {/* Library Section (Horizontal) */}
            <View style={styles.librarySection}>
              <Text style={styles.sectionHeader}>Library</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryScroll}>
                {renderLibraryItem('home', 'Home', homeLocation, 'home', '#4A90E2')}
                {renderLibraryItem('briefcase', 'Work', workLocation, 'work', '#F5A623')}
                {renderLibraryItem('add', 'Add', null, 'custom', GRAY_600)}
              </ScrollView>
            </View>

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <View style={styles.recentsSection}>
                <Text style={styles.sectionHeader}>Recents</Text>
                {recentLocations.slice(0, 5).map((loc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.recentItem}
                    onPress={() => handleDropoffSelect(loc.address, loc.lat, loc.lng)}
                  >
                    <View style={styles.recentIconContainer}>
                      <Ionicons name="time" size={20} color={WHITE} />
                    </View>
                    <View style={styles.recentTextContainer}>
                      <Text style={styles.recentTitle} numberOfLines={1}>{loc.address.split(',')[0]}</Text>
                      <Text style={styles.recentSubtitle} numberOfLines={1}>{loc.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Schedule Button */}
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => setShowScheduleModal(true)}
            >
              <View style={styles.scheduleIconBadge}>
                <Ionicons name="time" size={18} color={BLACK} />
              </View>
              <Text style={styles.scheduleText}>
                {scheduledTime ? formatScheduledTime(scheduledTime) : 'Schedule Ride'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={GRAY_400} />
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* Footer Action */}
        {pickupAddress && dropoffAddress && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Place Edit Modal */}
      <Modal visible={showPlaceModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditingPlace === 'home' ? 'Set Home' : isEditingPlace === 'work' ? 'Set Work' : 'Add Place'}
            </Text>
            <TouchableOpacity onPress={() => setShowPlaceModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>Address</Text>
            <LocationAutocompleteInput
              placeholder="Search address..."
              value={tempPlaceAddress}
              onLocationSelect={handlePlaceSelect}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalSaveButton, (!tempPlaceAddress || loading) && styles.disabledButton]}
              onPress={handleSavePlace}
              disabled={!tempPlaceAddress || loading}
            >
              {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.modalSaveText}>Save Location</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScheduleRideModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={(time) => {
          setScheduledTime(time);
          setShowSuccessAlert(true);
        }}
        navigation={navigation}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Ride Scheduled"
        message={`Your ride has been scheduled for ${scheduledTime ? formatScheduledTime(scheduledTime).replace('Scheduled: ', '') : ''}.\n\nWe'll notify you when your driver is on the way.`}
        icon="calendar"
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              setShowSuccessAlert(false);
              resetFields();
              navigation.navigate('RiderTabs'); // Or go back to Home
            },
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BLACK },
  container: { flex: 1, backgroundColor: BLACK },
  header: { alignItems: 'center', paddingBottom: 10 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 8 },
  headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginTop: 10 },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 16, color: BLUE_ACCENT, fontWeight: '600' },

  mainContent: { paddingHorizontal: 20 },
  largeTitle: { fontSize: 32, fontWeight: '700', color: WHITE, marginBottom: 20, marginTop: 10 },

  inputGroup: { flexDirection: 'row', marginBottom: 30 },
  timelineContainer: { width: 30, alignItems: 'center', paddingTop: 18 },
  timelineDotStart: { width: 12, height: 12, borderRadius: 6, backgroundColor: GRAY_400 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#333', marginVertical: 4 },
  timelineDotEnd: { width: 12, height: 12, borderRadius: 2, backgroundColor: WHITE },

  inputsContainer: { flex: 1 },
  inputWrapper: { height: 50, justifyContent: 'center' },
  inputFieldContainer: { backgroundColor: '#1A1A1A', borderRadius: 12 },
  inputField: { backgroundColor: 'transparent', paddingLeft: 10, color: WHITE },
  inputDivider: { height: 1, backgroundColor: '#333', marginLeft: 10 },

  sectionHeader: { fontSize: 20, fontWeight: '700', color: WHITE, marginBottom: 15 },

  librarySection: { marginBottom: 30 },
  libraryScroll: { paddingRight: 20, gap: 20 },
  libraryItem: { alignItems: 'center', width: 70 },
  libraryIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#1A1A1A' },
  libraryLabel: { fontSize: 13, fontWeight: '600', color: WHITE },
  libraryAdd: { fontSize: 11, color: BLUE_ACCENT, marginTop: 2 },

  recentsSection: { marginBottom: 30 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  recentIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentTextContainer: { flex: 1 },
  recentTitle: { fontSize: 16, fontWeight: '600', color: WHITE, marginBottom: 2 },
  recentSubtitle: { fontSize: 13, color: GRAY_400 },

  scheduleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, marginBottom: 40 },
  scheduleIconBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  scheduleText: { flex: 1, fontSize: 16, fontWeight: '600', color: WHITE },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  continueButton: { backgroundColor: BLUE_ACCENT, padding: 18, borderRadius: 14, alignItems: 'center' },
  continueText: { color: WHITE, fontSize: 18, fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: BLACK, paddingTop: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: WHITE },
  modalClose: { fontSize: 16, color: BLUE_ACCENT },
  modalBody: { padding: 20 },
  modalLabel: { color: GRAY_400, marginBottom: 10, fontSize: 14 },
  modalSaveButton: { backgroundColor: BLUE_ACCENT, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  modalSaveText: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
  disabledButton: { opacity: 0.5 },
});

export default DestinationSelectScreen;
