import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/store';
import { riderService } from '../../services/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface RiderActivityScreenProps {
  navigation: any;
}

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_700 = '#3F3F3F';
const LIGHT_BACKGROUND = '#fcfcfc';
const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#333333';
const LABEL_GRAY = '#666';

export const RiderActivityScreen: React.FC<RiderActivityScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state: any) => state.user);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRideHistory();
  }, []);

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

  const renderRideItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.rideCard}>
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
          <Ionicons name="location" size={20} color={BLACK} style={styles.routeIcon} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.address}>{item.pickup_address}</Text>
          </View>
        </View>

        <View style={styles.routeDivider} />

        <View style={styles.routeItem}>
          <Ionicons name="flag" size={20} color={BLACK} style={styles.routeIcon} />
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
            <ActivityIndicator size="large" color={BLACK} />
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={LABEL_GRAY} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No rides yet</Text>
            <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            renderItem={renderRideItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={fetchRideHistory}
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
    backgroundColor: LIGHT_BACKGROUND,
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
});

export default RiderActivityScreen;
