import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/store';
import { driverService } from '../../services/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- COLOR DEFINITIONS ---
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_800 = '#1C1C1E'; // Card background
const GRAY_700 = '#2C2C2E'; // Separator
const GRAY_500 = '#8E8E93'; // Secondary text
const BLUE = '#0A84FF';
const GREEN = '#30D158';

export const DriverActivityScreen = () => {
    const user = useAuthStore((state: any) => state.user);
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await driverService.getDriverRideHistory(user.id);
            if (error) throw error;
            setRides(data || []);
        } catch (error) {
            console.error('Fetch history error:', error);
            Alert.alert('Error', 'Failed to load ride history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    };

    const renderRideItem = ({ item }: { item: any }) => {
        const formattedDate = formatDate(item.created_at);
        const isCompleted = item.status === 'completed';
        const isCancelled = item.status === 'cancelled';

        return (
            <View style={styles.rideCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                        <View style={[
                            styles.statusBadge,
                            isCompleted ? styles.statusSuccess : styles.statusCancelled
                        ]}>
                            <Text style={styles.statusText}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.fareText}>
                        ${(item.actual_fare || item.estimated_fare || 0).toFixed(2)}
                    </Text>
                </View>

                <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                        <View style={[styles.dot, styles.greenDot]} />
                        <Text style={styles.addressText} numberOfLines={1}>
                            {item.pickup_address}
                        </Text>
                    </View>
                    <View style={styles.connectorLine} />
                    <View style={styles.routePoint}>
                        <View style={[styles.dot, styles.redDot]} />
                        <Text style={styles.addressText} numberOfLines={1}>
                            {item.dropoff_address}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.riderInfo}>
                    <View style={styles.riderAvatar}>
                        <Ionicons name="person" size={16} color={GRAY_500} />
                    </View>
                    <Text style={styles.riderName}>
                        {item.rider?.first_name} {item.rider?.last_name}
                    </Text>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD60A" />
                        <Text style={styles.ratingText}>{item.rider?.rating?.toFixed(1) || '5.0'}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activity</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={WHITE} />
                </View>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderRideItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={WHITE}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="documents-outline" size={64} color={GRAY_700} />
                            <Text style={styles.emptyText}>No rides yet</Text>
                            <Text style={styles.emptySubtext}>Completed rides will appear here</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BLACK,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: GRAY_700,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: WHITE,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    rideCard: {
        backgroundColor: GRAY_800,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    dateContainer: {
        gap: 4,
    },
    dateText: {
        color: GRAY_500,
        fontSize: 13,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusSuccess: {
        backgroundColor: 'rgba(48, 209, 88, 0.15)',
    },
    statusCancelled: {
        backgroundColor: 'rgba(255, 69, 58, 0.15)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: WHITE,
    },
    fareText: {
        fontSize: 18,
        fontWeight: '700',
        color: WHITE,
    },
    routeContainer: {
        marginLeft: 4,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 24,
    },
    connectorLine: {
        width: 2,
        height: 16,
        backgroundColor: GRAY_700,
        marginLeft: 4,
        marginVertical: 2,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    greenDot: {
        backgroundColor: GREEN,
    },
    redDot: {
        backgroundColor: '#FF453A',
    },
    addressText: {
        color: WHITE,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: GRAY_700,
        marginTop: 16,
        marginBottom: 12,
    },
    riderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    riderAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: GRAY_700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    riderName: {
        color: GRAY_500,
        fontSize: 13,
        flex: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        color: WHITE,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: WHITE,
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: GRAY_500,
        fontSize: 15,
        marginTop: 8,
    },
});
