import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DestinationSelectScreenProps {
  navigation: any;
}

// Popular cities in Kosovo
const CITIES = [
  { id: 1, name: 'Prishtina', subtitle: 'Capital of Kosovo' },
  { id: 2, name: 'Prizren', subtitle: 'Historic City' },
  { id: 3, name: 'Peja', subtitle: 'Western Kosovo' },
  { id: 4, name: 'Gjakova', subtitle: 'Old Bazaar' },
  { id: 5, name: 'Ferizaj', subtitle: 'Central Kosovo' },
  { id: 6, name: 'Gjilan', subtitle: 'Eastern Kosovo' },
  { id: 7, name: 'Mitrovica', subtitle: 'Northern Kosovo' },
  { id: 8, name: 'Vushtrri', subtitle: 'Northern Region' },
  { id: 9, name: 'Podujeva', subtitle: 'Northeast Kosovo' },
  { id: 10, name: 'Suhareka', subtitle: 'Southern Kosovo' },
];

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const LIGHT_GRAY = '#F5F5F5';
const MEDIUM_GRAY = '#E0E0E0';
const TEXT_GRAY = '#666666';

export const DestinationSelectScreen: React.FC<DestinationSelectScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(CITIES);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredCities(CITIES);
    } else {
      const filtered = CITIES.filter(city =>
        city.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  };

  const handleCitySelect = (cityName: string) => {
    // Navigate to ride request with selected destination
    navigation.navigate('RideRequest', { destination: cityName });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Where to?</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={TEXT_GRAY} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination..."
            placeholderTextColor={TEXT_GRAY}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cities List */}
      <ScrollView style={styles.citiesContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Popular Destinations</Text>
        
        {filteredCities.length > 0 ? (
          filteredCities.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={styles.cityItem}
              onPress={() => handleCitySelect(city.name)}
              activeOpacity={0.7}
            >
              <View style={styles.cityIconContainer}>
                <Ionicons name="location" size={24} color={BLACK} />
              </View>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.citySubtitle}>{city.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={TEXT_GRAY} />
            <Text style={styles.emptyStateText}>No cities found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
          </View>
        )}

        {/* Recent Destinations (Optional) */}
        {searchQuery === '' && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity style={styles.cityItem} activeOpacity={0.7}>
              <View style={styles.cityIconContainer}>
                <Ionicons name="time" size={24} color={TEXT_GRAY} />
              </View>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>No recent destinations</Text>
                <Text style={styles.citySubtitle}>Your recent trips will appear here</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: MEDIUM_GRAY,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BLACK,
  },
  headerPlaceholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: WHITE,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: BLACK,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: BLACK,
    padding: 0,
  },
  citiesContainer: {
    flex: 1,
    backgroundColor: WHITE,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_GRAY,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  cityIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 17,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 3,
  },
  citySubtitle: {
    fontSize: 14,
    color: TEXT_GRAY,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_GRAY,
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: TEXT_GRAY,
    marginTop: 5,
  },
  recentSection: {
    marginTop: 20,
  },
});

export default DestinationSelectScreen;
