import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/store';
import { driverService } from '../../services/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DriverProfileScreenProps {
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_700 = '#3F3F3F';
const LABEL_GRAY = '#666';

export const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state: any) => state.user);
  const setUser = useAuthStore((state: any) => state.setUser);
  const logout = useAuthStore((state: any) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicle_model || '');
  const [vehicleYear, setVehicleYear] = useState(user?.vehicle_year?.toString() || '');
  const [vehicleColor, setVehicleColor] = useState(user?.vehicle_color || '');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehicle_plate || '');

  const handleSave = async () => {
    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        vehicle_model: vehicleModel,
        vehicle_year: parseInt(vehicleYear) || 0,
        vehicle_color: vehicleColor,
        vehicle_plate: vehiclePlate,
      };

      const { data, error } = await driverService.updateDriverProfile(user.id, updates);

      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      // Update the user in the auth store
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser, 'driver');

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    // Auth state change will automatically navigate to login
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER WITH BACK BUTTON */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {firstName?.[0]?.toUpperCase() || 'D'}{lastName?.[0]?.toUpperCase() || 'R'}
            </Text>
          </View>
          <Text style={styles.nameText}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>

          <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editProfileText}>{isEditing ? 'Done' : 'Edit Profile'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row - Floating Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color="#0A84FF" />
            <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('DriverHistory')}
          >
            <Ionicons name="car-sport" size={20} color="#0A84FF" />
            <Text style={styles.statValue}>{user?.total_rides || 0}</Text>
            <Text style={styles.statLabel}>RIDES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('DriverHistory')}
          >
            <Ionicons name="wallet" size={20} color="#0A84FF" />
            <Text style={styles.statValue}>${user?.total_earnings?.toFixed(0) || '0'}</Text>
            <Text style={styles.statLabel}>EARNED</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>PERSONAL INFO</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>First Name</Text>
              {isEditing ? (
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{firstName}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{lastName}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              {isEditing ? (
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{phoneNumber}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>VEHICLE DETAILS</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              {isEditing ? (
                <TextInput
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  style={styles.input}
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{vehicleModel}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Year</Text>
              {isEditing ? (
                <TextInput
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{vehicleYear}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              {isEditing ? (
                <TextInput
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  style={styles.input}
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{vehicleColor}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plate</Text>
              {isEditing ? (
                <TextInput
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                  style={styles.input}
                  placeholderTextColor="#636366"
                />
              ) : (
                <Text style={styles.infoValue}>{vehiclePlate}</Text>
              )}
            </View>
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}



      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 8,
  },
  headerBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: WHITE,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: WHITE,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingLeft: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: WHITE,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#8E8E93',
    flex: 2,
    textAlign: 'right',
  },
  input: {
    flex: 2,
    fontSize: 16,
    color: '#0A84FF',
    textAlign: 'right',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
  },
  saveButton: {
    backgroundColor: '#0A84FF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
  switchButton: {
    backgroundColor: WHITE,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  switchButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: BLACK,
  },
});

export default DriverProfileScreen;

