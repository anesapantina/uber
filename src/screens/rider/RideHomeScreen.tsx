import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface RiderHomeScreenProps {
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const PRIMARY_PINK = '#e8ccd7'; 
const DARK_ACCENT = '#b8869e'; 
const LIGHT_BACKGROUND = '#fcfcfc';
const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#333333';
const LABEL_GRAY = '#666';

// Mock Data for "Uber Selection"
const rideOptions = [
  { id: '1', name: 'Standard', description: 'Affordable everyday rides.', icon: 'car-outline', priceFactor: 1.0 },
  { id: '2', name: 'Pet-Friendly', description: 'Bring your furry friends.', icon: 'paw-outline', priceFactor: 1.3 },
  { id: '3', name: 'Driverless', description: 'Autonomous vehicle experience.', icon: 'hardware-chip-outline', priceFactor: 1.4 },
  { id: '4', name: 'Luxury', description: 'Premium ride experience.', icon: 'diamond-outline', priceFactor: 2.2 },
  { id: '5', name: 'Closest', description: 'Fastest pickup time.', icon: 'flash-outline', priceFactor: 1.1 },
];

export const RideHomeScreen: React.FC<RiderHomeScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout); // Assuming you have a logout action
  const [selectedOption, setSelectedOption] = useState(rideOptions[0]);

  const handleContinue = () => {
    // Navigate to the screen where the user enters pickup/dropoff
    navigation.navigate('RideRequest', { rideType: selectedOption.name });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      { text: 'Yes', onPress: () => {
        logout(); // Execute the actual logout logic
        // In a real app, this would navigate to the Login/Auth screen
        navigation.replace('Login'); 
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {user?.first_name || 'Rider'}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Account</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        <Text style={[styles.label, { marginTop: 10 }]}>Payment Method</Text>
        <Text style={styles.value}>Visa ending in **** 1234</Text>
      </View>

      {/* Ride Selection */}
      <Text style={styles.sectionTitle}>Select Your Ride</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rideOptionsContainer}
      >
        {rideOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedOption.id === option.id && styles.optionSelected,
            ]}
            onPress={() => setSelectedOption(option)}
          >
            <Ionicons name={option.icon} size={40} color="#000" style={styles.optionIcon} />
            <Text style={styles.optionName}>{option.name}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
            <Text style={styles.optionPrice}>x{option.priceFactor.toFixed(1)} Rate</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue with {selectedOption.name}</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DARK_ACCENT,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: PRIMARY_PINK,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 15,
    marginTop: 15,
  },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: PRIMARY_PINK,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LABEL_GRAY,
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    color: TEXT_COLOR,
  },
  rideOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingVertical: 10,
  },
  optionCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  optionSelected: {
    borderColor: DARK_ACCENT,
    backgroundColor: PRIMARY_PINK + '30', // Light tint of the pink
  },
  optionIcon: {
    marginBottom: 8,
  },
  optionName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: DARK_ACCENT,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 11,
    textAlign: 'center',
    color: LABEL_GRAY,
    marginBottom: 5,
    height: 32,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  button: {
    backgroundColor: DARK_ACCENT,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: DARK_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RideHomeScreen;