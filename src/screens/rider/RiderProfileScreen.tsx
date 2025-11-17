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
import { riderService } from '../../services/supabase';

interface RiderProfileScreenProps {
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_700 = '#3F3F3F';
const LABEL_GRAY = '#666';

export const RiderProfileScreen: React.FC<RiderProfileScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state: any) => state.user);
  const setUser = useAuthStore((state: any) => state.setUser);
  const logout = useAuthStore((state: any) => state.logout);
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [homeAddress, setHomeAddress] = useState(user?.home_address || '');
  const [workAddress, setWorkAddress] = useState(user?.work_address || '');

  const handleSave = async () => {
    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        home_address: homeAddress,
        work_address: workAddress,
      };

      const { data, error } = await riderService.updateRiderProfile(user.id, updates);
      
      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      // Update the user in the auth store
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser, 'rider');
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSwitchToDriver = () => {
    Alert.alert(
      'Switch to Driver Mode',
      'Do you want to switch to driver mode?',
      [
        { text: 'Cancel' },
        {
          text: 'Yes',
          onPress: () => {
            const driverUser = {
              ...user,
              license_number: user.license_number || '',
              vehicle_model: user.vehicle_model || '',
              vehicle_year: user.vehicle_year || 0,
              vehicle_color: user.vehicle_color || '',
              vehicle_plate: user.vehicle_plate || '',
              is_available: false,
              current_latitude: 0,
              current_longitude: 0,
            };
            setUser(driverUser, 'driver');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      {
        text: 'Yes',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profilePicPlaceholder}>
              <Text style={styles.profileInitials}>
                {firstName?.[0]?.toUpperCase() || 'R'}{lastName?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.headerSubtitle}>{user?.email}</Text>
          </View>

          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.value}>{firstName || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.value}>{lastName || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{phoneNumber || 'Not set'}</Text>
              )}
            </View>
          </View>

          {/* Saved Addresses Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saved Addresses</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏠 Home Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={homeAddress}
                  onChangeText={setHomeAddress}
                  placeholder="Home Address"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.value}>{homeAddress || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>💼 Work Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={workAddress}
                  onChangeText={setWorkAddress}
                  placeholder="Work Address"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.value}>{workAddress || 'Not set'}</Text>
              )}
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rider Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.total_rides || 0}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${user?.wallet_balance?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.statLabel}>Wallet</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setFirstName(user?.first_name || '');
                  setLastName(user?.last_name || '');
                  setPhoneNumber(user?.phone_number || '');
                  setHomeAddress(user?.home_address || '');
                  setWorkAddress(user?.work_address || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Switch to Driver Button */}
          <TouchableOpacity style={styles.switchModeButton} onPress={handleSwitchToDriver}>
            <Text style={styles.switchModeButtonText}>🚗 Switch to Driver Mode</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_100,
  },
  container: {
    flex: 1,
    backgroundColor: GRAY_100,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GRAY_700,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: LABEL_GRAY,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GRAY_700,
    marginBottom: 15,
  },
  editButton: {
    fontSize: 16,
    color: BLACK,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LABEL_GRAY,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: BLACK,
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BLACK,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: BLACK,
    backgroundColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GRAY_700,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: LABEL_GRAY,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: GRAY_700,
    shadowColor: GRAY_700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: LABEL_GRAY,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: LABEL_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    backgroundColor: GRAY_700,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: GRAY_700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  switchModeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: BLACK,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RiderProfileScreen;

