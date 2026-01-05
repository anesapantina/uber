import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/store';
import { riderService } from '../../services/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getScheduledRides, deleteScheduledRide, ScheduledRide } from '../../services/locationService';
import { CommonActions } from '@react-navigation/native';

interface RiderActivityScreenProps {
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#1A1A1A';
const GRAY_200 = '#2A2A2A';
const GRAY_700 = '#CCCCCC';
const LIGHT_BACKGROUND = BLACK;
const CARD_BACKGROUND = GRAY_100;
const TEXT_COLOR = WHITE;
const LABEL_GRAY = '#999';

export const RiderActivityScreen: React.FC<RiderActivityScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state: any) => state.user);
  const [rides, setRides] = useState<any[]>([]);
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Set up a listener to refresh when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchRideHistory(), fetchScheduledRides()]);
  };

  const fetchRideHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await riderService.getRideHistory(user?.id || '', 50);

      if (error) {
        console.error('Error fetching ride history:', error);
        setRides([]);
        return;
      }

      setRides(data || []);
    } catch (error) {
      console.error('Fetch ride history error:', error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledRides = async () => {
    try {
      const scheduled = await getScheduledRides();
      setScheduledRides(scheduled);
    } catch (error) {
      console.error('Error fetching scheduled rides:', error);
      setScheduledRides([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      case 'in_progress':
        return '#2196F3';
      default:
        return LABEL_GRAY;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const handleRidePress = (ride: any) => {
    if (ride.status === 'pending' || ride.status === 'accepted' || ride.status === 'in_progress') {
      // Navigate to tracking for active rides
      navigation.navigate('RideTracking', { rideId: ride.id });
    } else if (ride.status === 'completed') {
      // Navigate to rating screen if not rated yet
      navigation.navigate('RideRating', { rideId: ride.id });
    }
    // For cancelled rides, just show the details (no navigation)
  };

  const handleConfirmScheduledRide = async (scheduledRide: ScheduledRide) => {
    // Delete the scheduled ride first
    await deleteScheduledRide(scheduledRide.id);
    await fetchScheduledRides();

    // Navigate to DestinationSelectScreen with scheduled time
    // Access parent stack navigator
    navigation.navigate('DestinationSelect', {
      scheduledTime: scheduledRide.scheduledTime,
    });
  };

  const handleDeleteScheduledRide = async (rideId: string) => {
    Alert.alert(
      'Delete Scheduled Ride',
      'Are you sure you want to delete this scheduled ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScheduledRide(rideId);
            await fetchScheduledRides();
          },
        },
      ]
    );
  };

  const formatScheduledTime = (isoTime: string) => {
    const time = new Date(isoTime);
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

  const renderScheduledRideItem = ({ item }: { item: ScheduledRide }) => (
    <View style={styles.scheduledRideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.scheduledBadge}>
          <Ionicons name="time-outline" size={16} color={WHITE} />
          <Text style={styles.scheduledBadgeText}>{formatScheduledTime(item.scheduledTime)}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteScheduledRide(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.scheduledRideInfo}>
        <Ionicons name="calendar-outline" size={24} color={WHITE} />
        <Text style={styles.scheduledRideText}>Scheduled ride - Enter your addresses to request</Text>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => handleConfirmScheduledRide(item)}
      >
        <Text style={styles.confirmButtonText}>Enter Addresses & Request</Text>
        <Ionicons name="arrow-forward" size={18} color={BLACK} />
      </TouchableOpacity>
    </View>
  );

  const renderRideItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <Ionicons name="location" size={20} color={WHITE} style={styles.routeIcon} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.address}>{item.pickup_address}</Text>
          </View>
        </View>

        <View style={styles.routeDivider} />

        <View style={styles.routeItem}>
          <Ionicons name="flag" size={20} color={WHITE} style={styles.routeIcon} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.address}>{item.dropoff_address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Distance</Text>
          <Text style={styles.footerValue}>{item.estimated_distance_km?.toFixed(1)} km</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Duration</Text>
          <Text style={styles.footerValue}>{item.estimated_duration_minutes} min</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Fare</Text>
          <Text style={styles.footerValue}>${(item.actual_fare || item.estimated_fare)?.toFixed(2)}</Text>
        </View>
      </View>

      {item.driver && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverText}>
            Driver: {item.driver.first_name} {item.driver.last_name}
          </Text>
          <Text style={styles.driverVehicle}>
            {item.driver.vehicle_model} • {item.driver.vehicle_plate}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ride Activity</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={WHITE} />
          </View>
        ) : scheduledRides.length === 0 && rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={LABEL_GRAY} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No rides yet</Text>
            <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          </View>
        ) : (
          <SectionList
            sections={[
              ...(scheduledRides.length > 0
                ? [{ title: 'Scheduled Rides', data: scheduledRides, type: 'scheduled' }]
                : []),
              ...(rides.length > 0
                ? [{ title: 'Ride History', data: rides, type: 'history' }]
                : []),
            ]}
            renderItem={({ item, section }) =>
              section.type === 'scheduled' ? renderScheduledRideItem({ item }) : renderRideItem({ item })
            }
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            keyExtractor={(item, index) =>
              'id' in item ? item.id : `ride-${index}`
            }
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BLACK,
  },
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    backgroundColor: BLACK,
    padding: 20,
    paddingTop: 20,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: LABEL_GRAY,
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  rideCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideDate: {
    fontSize: 14,
    fontWeight: '600',
    color: LABEL_GRAY,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeContainer: {
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LABEL_GRAY,
    marginBottom: 3,
  },
  address: {
    fontSize: 15,
    color: TEXT_COLOR,
    fontWeight: '500',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
    marginLeft: 32,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: LABEL_GRAY,
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BLACK,
  },
  driverInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  driverText: {
    fontSize: 13,
    color: TEXT_COLOR,
    fontWeight: '600',
    marginBottom: 3,
  },
  driverVehicle: {
    fontSize: 12,
    color: LABEL_GRAY,
  },
  sectionHeader: {
    backgroundColor: BLACK,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduledRideCard: {
    backgroundColor: GRAY_100,
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  scheduledBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BLACK,
  },
  scheduledRideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  scheduledRideText: {
    flex: 1,
    fontSize: 14,
    color: WHITE,
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BLACK,
  },
});

export default RiderActivityScreen;
