import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { authService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';

interface RegisterScreenProps {
  navigation: any;
}

// Define the colors for clarity
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_700 = '#3F3F3F';

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const [userType, setUserType] = useState<'rider' | 'driver'>('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state: any) => state.setUser);

  // Driver specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const validateInputs = () => {
    // ... (Validation logic remains the same)
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phone) {
        Alert.alert('Error', 'Please fill in all fields');
        return false;
      }
  
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
      }
  
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
  
      if (userType === 'driver') {
        if (
          !licenseNumber ||
          !vehicleModel ||
          !vehicleYear ||
          !vehicleColor ||
          !vehiclePlate
        ) {
          Alert.alert('Error', 'Please fill in all vehicle details');
          return false;
        }
      }
  
      return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      let result;
      // ... (API call logic remains the same)
      if (userType === 'rider') {
        result = await authService.signUpRider(email, password, firstName, lastName, phone);
      } else {
        result = await authService.signUpDriver(
          email,
          password,
          firstName,
          lastName,
          phone,
          licenseNumber,
          vehicleModel,
          parseInt(vehicleYear),
          vehicleColor,
          vehiclePlate
        );
      }

      if (result.error) {
        Alert.alert('Registration Failed', (result.error as any).message || 'An error occurred');
        return;
      }

      // ... (User object creation logic remains the same)
      const user =
        userType === 'rider'
          ? {
              id: result.data?.user?.id || '',
              email,
              first_name: firstName,
              last_name: lastName,
              phone_number: phone,
              rating: 5.0,
              total_rides: 0,
            }
          : {
              id: result.data?.user?.id || '',
              email,
              first_name: firstName,
              last_name: lastName,
              phone_number: phone,
              license_number: licenseNumber,
              vehicle_model: vehicleModel,
              vehicle_year: parseInt(vehicleYear),
              vehicle_color: vehicleColor,
              vehicle_plate: vehiclePlate,
              rating: 5.0,
              total_rides: 0,
              is_available: false,
              current_latitude: 0,
              current_longitude: 0,
            };

      setUser(user, userType);
      Alert.alert('Success', `Welcome to Uber as a ${userType}!`);
      // Use reset to navigate to the appropriate home screen
      navigation.reset({
        index: 0,
        routes: [{ name: userType === 'driver' ? 'AvailableRides' : 'RideHome' }],
      });
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Sign Up</Text>

          {/* User Type Selection */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'rider' && styles.userTypeButtonActive,
              ]}
              onPress={() => setUserType('rider')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  userType === 'rider' && styles.userTypeButtonTextActive,
                ]}
              >
                Rider
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'driver' && styles.userTypeButtonActive,
              ]}
              onPress={() => setUserType('driver')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.userTypeButtonText,
                  userType === 'driver' && styles.userTypeButtonTextActive,
                ]}
              >
                Driver
              </Text>
            </TouchableOpacity>
          </View>

          {/* Common Fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+383 44 123 456"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="• • • • • • • •"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="• • • • • • • •"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          {/* Driver Specific Fields */}
          {userType === 'driver' && (
            <View style={styles.driverSection}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DL123456789"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Model</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Toyota Camry"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2022"
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  editable={!loading}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Silver"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Plate</Text>
                <TextInput
                  style={styles.input}
                  placeholder="01-ABC-123"
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Already have any account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  content: {
    padding: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 35,
    marginTop: 20,
    textAlign: 'center',
    color: BLACK,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 8,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    backgroundColor: GRAY_100, // Light background for the selector
    borderRadius: 10,
    padding: 5,
  },
  userTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  userTypeButtonActive: {
    backgroundColor: BLACK, // Pink background when active
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userTypeButtonText: {
    fontSize: 16,
    color: BLACK,
    fontWeight: '600',
  },
  userTypeButtonTextActive: {
    color: '#fff', // White text when active
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1.5,
    borderColor: GRAY_200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: BLACK,
    backgroundColor: WHITE,
  },
  driverSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: BLACK,
    textAlign: 'center',
  },
  button: {
    backgroundColor: BLACK,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterScreen;

