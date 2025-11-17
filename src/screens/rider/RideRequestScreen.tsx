import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { riderService, calculateDistance } from '../../services/supabase';
import { useAuthStore, useRiderStore } from '../../store/store';

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
    icon: '',
    passengers: 4,
    priceMultiplier: 1.0,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Newer cars with extra legroom',
    icon: '',
    passengers: 4,
    priceMultiplier: 1.3,
  },
  {
    id: 'xl',
    name: 'UberXL',
    description: 'Affordable rides for groups up to 6',
    icon: '',
    passengers: 6,
    priceMultiplier: 1.6,
  },
];

export const RideRequestScreen: React.FC<RideRequestScreenProps> = ({ navigation }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('economy');
  const [loading, setLoading] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDropoffModal, setShowDropoffModal] = useState(false);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [estimatedFares, setEstimatedFares] = useState<any>({});
  
  const user = useAuthStore((state: any) => state.user);
  const setCurrentRide = useRiderStore((state: any) => state.setCurrentRide);

  const calculateFares = (pickupCity: string, dropoffCity: string) => {
    if (!pickupCity || !dropoffCity || pickupCity === dropoffCity) return;

    const pickupCoords = KOSOVO_CITIES.find(c => c.name === pickupCity);
    const dropoffCoords = KOSOVO_CITIES.find(c => c.name === dropoffCity);
    if (!pickupCoords || !dropoffCoords) return;

    const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
    const farePerKm = 1.5;
    const baseFare = 2.5;
    const baseEstimate = baseFare + distance * farePerKm;

    const fares: any = {};
    VEHICLE_TYPES.forEach(vehicle => {
      fares[vehicle.id] = baseEstimate * vehicle.priceMultiplier;
    });
    setEstimatedFares(fares);
  };

  const filterCities = (search: string) => {
    if (!search) return KOSOVO_CITIES;
    return KOSOVO_CITIES.filter((city) => city.name.toLowerCase().includes(search.toLowerCase()));
  };

  const handleSelectPickup = (city: any) => {
    setPickup(city.name);
    setShowPickupModal(false);
    setPickupSearch('');
    calculateFares(city.name, dropoff);
  };

  const handleSelectDropoff = (city: any) => {
    setDropoff(city.name);
    setShowDropoffModal(false);
    setDropoffSearch('');
    calculateFares(pickup, city.name);
  };

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }
    if (pickup === dropoff) {
      Alert.alert('Error', 'Pickup and dropoff locations cannot be the same');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

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
        console.error('❌ Ride request error:', error);
        Alert.alert('Error', `Failed to request ride: ${(error as any)?.message || 'Please try again.'}`);
        return;
      }

      if (createdRide) {
        setCurrentRide(createdRide);
        Alert.alert('Success', 'Ride requested! Looking for nearby drivers...', [
          { text: 'OK', onPress: () => navigation.navigate('RideTracking', { rideId: createdRide.id }) },
        ]);
      }
    } catch (error) {
      console.error('❌ Ride request exception:', error);
      Alert.alert('Error', `An error occurred: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCityItem = (item: any, onSelect: (city: any) => void) => (
    <TouchableOpacity style={styles.cityItem} onPress={() => onSelect(item)}>
      <Text style={styles.cityItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderVehicleOption = (vehicle: any) => {
    const isSelected = selectedVehicle === vehicle.id;
    const fare = estimatedFares[vehicle.id];

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => setSelectedVehicle(vehicle.id)}
        disabled={!fare}
      >
        <View style={styles.vehicleLeft}>
          <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
            <Text style={styles.vehiclePassengers}> {vehicle.passengers}</Text>
          </View>
        </View>
        <View style={styles.vehicleRight}>
          {fare ? <Text style={styles.vehiclePrice}>${fare.toFixed(2)}</Text> : <Text style={styles.vehiclePriceEmpty}>-</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}></Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose a ride</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.locationSection}>
            <View style={styles.locationIndicator}>
              <View style={styles.dotPickup} />
              <View style={styles.verticalLine} />
              <View style={styles.dotDropoff} />
            </View>

            <View style={styles.locationInputs}>
              <TouchableOpacity style={styles.locationButton} onPress={() => setShowPickupModal(true)}>
                <Text style={pickup ? styles.locationText : styles.locationPlaceholder}>
                  {pickup || 'Pickup location'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.locationButton} onPress={() => setShowDropoffModal(true)}>
                <Text style={dropoff ? styles.locationText : styles.locationPlaceholder}>
                  {dropoff || 'Dropoff location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {pickup && dropoff && (
            <View style={styles.vehicleSection}>
              <Text style={styles.sectionTitle}>Choose a ride</Text>
              {VEHICLE_TYPES.map(renderVehicleOption)}
            </View>
          )}
        </ScrollView>

        {pickup && dropoff && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.requestButton, loading && styles.requestButtonDisabled]}
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

        <Modal visible={showPickupModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select pickup location</Text>
                <TouchableOpacity onPress={() => setShowPickupModal(false)}>
                  <Text style={styles.modalClose}></Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.searchInput} placeholder="Search cities..." value={pickupSearch} onChangeText={setPickupSearch} placeholderTextColor={GRAY_700} />
              <FlatList data={filterCities(pickupSearch)} keyExtractor={(item) => item.name} renderItem={({ item }) => renderCityItem(item, handleSelectPickup)} />
            </View>
          </View>
        </Modal>

        <Modal visible={showDropoffModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select dropoff location</Text>
                <TouchableOpacity onPress={() => setShowDropoffModal(false)}>
                  <Text style={styles.modalClose}></Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.searchInput} placeholder="Search cities..." value={dropoffSearch} onChangeText={setDropoffSearch} placeholderTextColor={GRAY_700} />
              <FlatList data={filterCities(dropoffSearch)} keyExtractor={(item) => item.name} renderItem={({ item }) => renderCityItem(item, handleSelectDropoff)} />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  container: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
  backButton: { fontSize: 24, color: BLACK, fontWeight: '400' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: BLACK },
  content: { flex: 1 },
  locationSection: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
  locationIndicator: { width: 20, alignItems: 'center', marginRight: 15, paddingTop: 15 },
  dotPickup: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLACK },
  verticalLine: { width: 2, flex: 1, backgroundColor: GRAY_300, marginVertical: 8 },
  dotDropoff: { width: 10, height: 10, backgroundColor: BLACK },
  locationInputs: { flex: 1, gap: 15 },
  locationButton: { paddingVertical: 15, paddingHorizontal: 15, backgroundColor: GRAY_100, borderRadius: 8 },
  locationText: { fontSize: 16, color: BLACK, fontWeight: '500' },
  locationPlaceholder: { fontSize: 16, color: GRAY_700 },
  vehicleSection: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: BLACK, marginBottom: 20 },
  vehicleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderWidth: 1, borderColor: GRAY_200, borderRadius: 12, marginBottom: 12, backgroundColor: WHITE },
  vehicleCardSelected: { borderColor: BLACK, borderWidth: 2, backgroundColor: GRAY_100 },
  vehicleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  vehicleIcon: { fontSize: 40, marginRight: 15 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 18, fontWeight: '600', color: BLACK, marginBottom: 4 },
  vehicleDescription: { fontSize: 13, color: GRAY_700, marginBottom: 4 },
  vehiclePassengers: { fontSize: 13, color: GRAY_700 },
  vehicleRight: { alignItems: 'flex-end' },
  vehiclePrice: { fontSize: 20, fontWeight: '700', color: BLACK },
  vehiclePriceEmpty: { fontSize: 20, color: GRAY_300 },
  footer: { padding: 20, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: GRAY_200 },
  requestButton: { backgroundColor: BLACK, paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  requestButtonDisabled: { opacity: 0.5 },
  requestButtonText: { color: WHITE, fontSize: 18, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: BLACK },
  modalClose: { fontSize: 24, color: BLACK },
  searchInput: { marginHorizontal: 20, marginVertical: 15, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: GRAY_100, borderRadius: 8, fontSize: 16, color: BLACK },
  cityItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
  cityItemText: { fontSize: 16, color: BLACK },
});

export default RideRequestScreen;
