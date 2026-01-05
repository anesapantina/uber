import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    ScrollView,
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { saveScheduledRide, ScheduledRide } from '../services/locationService';

interface ScheduleRideModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (scheduledTime: Date) => void;
    navigation?: any;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_800 = '#1C1C1E'; // iOS System Dark Gray
const GRAY_600 = '#3A3A3C';
const GRAY_400 = '#8E8E93';
const GRAY_200 = '#C7C7CC';
const BLUE_IOS = '#0A84FF';

export const ScheduleRideModal: React.FC<ScheduleRideModalProps> = ({
    visible,
    onClose,
    onConfirm,
    navigation,
}) => {
    // Current time + 30 mins as default
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Time Picker State (controlled separately for custom picker feel)
    const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
    const [selectedMinute, setSelectedMinute] = useState<number>(0);
    const [isPM, setIsPM] = useState<boolean>(new Date().getHours() >= 12);

    // Generate dates for next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Generate hours (1-12)
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5 min increments for cleaner UX

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    const isDateSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const formatDateDay = (date: Date) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    };

    const handleConfirm = async () => {
        const scheduledDateTime = new Date(selectedDate);
        let actualHour = selectedHour;

        if (isPM && selectedHour !== 12) actualHour += 12;
        if (!isPM && selectedHour === 12) actualHour = 0;

        scheduledDateTime.setHours(actualHour, selectedMinute, 0, 0);

        // Validate future time
        const now = new Date();
        if (scheduledDateTime <= now) {
            Alert.alert('Invalid Time', 'Please select a future time for your ride.');
            return;
        }

        // Save scheduled ride
        const scheduledRide: ScheduledRide = {
            id: Date.now().toString(),
            scheduledTime: scheduledDateTime.toISOString(),
            createdAt: Date.now(),
        };

        await saveScheduledRide(scheduledRide);

        // Close modal and notify
        onConfirm(scheduledDateTime);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Schedule a Ride</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={30} color={GRAY_400} />
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker (Horizontal) */}
                    <View style={styles.section}>
                        <FlatList
                            data={dates}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.toDateString()}
                            contentContainerStyle={styles.dateListContainer}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.dateItem,
                                        isDateSelected(item) && styles.dateItemSelected
                                    ]}
                                    onPress={() => handleDateSelect(item)}
                                >
                                    <Text style={[
                                        styles.dateDayText,
                                        isDateSelected(item) && styles.dateTextSelected
                                    ]}>
                                        {item.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                    </Text>
                                    <Text style={[
                                        styles.dateNumText,
                                        isDateSelected(item) && styles.dateTextSelected
                                    ]}>
                                        {item.getDate()}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Time Picker (Wheel-like imitation) */}
                    <View style={styles.timePickerContainer}>
                        {/* Hours */}
                        <View style={styles.timeColumn}>
                            <Text style={styles.columnLabel}>HOUR</Text>
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.wheelScroll}>
                                {hours.map((h) => (
                                    <TouchableOpacity
                                        key={h}
                                        style={[styles.wheelItem, selectedHour === h && styles.wheelItemSelected]}
                                        onPress={() => setSelectedHour(h)}
                                    >
                                        <Text style={[styles.wheelText, selectedHour === h && styles.wheelTextSelected]}>
                                            {h}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.timeSeparator}>:</Text>

                        {/* Minutes */}
                        <View style={styles.timeColumn}>
                            <Text style={styles.columnLabel}>MINUTE</Text>
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.wheelScroll}>
                                {minutes.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.wheelItem, selectedMinute === m && styles.wheelItemSelected]}
                                        onPress={() => setSelectedMinute(m)}
                                    >
                                        <Text style={[styles.wheelText, selectedMinute === m && styles.wheelTextSelected]}>
                                            {m.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* AM/PM */}
                        <View style={styles.timeColumn}>
                            <Text style={styles.columnLabel}>MERIDIEM</Text>
                            <View style={styles.amPmContainer}>
                                <TouchableOpacity
                                    style={[styles.amPmItem, !isPM && styles.amPmItemSelected]}
                                    onPress={() => setIsPM(false)}
                                >
                                    <Text style={[styles.amPmText, !isPM && styles.amPmTextSelected]}>AM</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.amPmItem, isPM && styles.amPmItemSelected]}
                                    onPress={() => setIsPM(true)}
                                >
                                    <Text style={[styles.amPmText, isPM && styles.amPmTextSelected]}>PM</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Footer Action */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Schedule Uber</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: BLACK,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '65%', // Takes up substantial screen space
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: WHITE,
    },
    closeButton: {
        padding: 5,
    },
    section: {
        marginBottom: 10,
    },
    dateListContainer: {
        paddingHorizontal: 15,
    },
    dateItem: {
        width: 60,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: GRAY_800,
        marginHorizontal: 5,
    },
    dateItemSelected: {
        backgroundColor: BLUE_IOS,
    },
    dateDayText: {
        fontSize: 12,
        color: GRAY_400,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateNumText: {
        fontSize: 20,
        color: WHITE,
        fontWeight: 'bold',
    },
    dateTextSelected: {
        color: WHITE,
    },
    divider: {
        height: 1,
        backgroundColor: GRAY_800,
        marginVertical: 15,
    },
    timePickerContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    timeColumn: {
        alignItems: 'center',
        height: 200,
        width: 80,
    },
    columnLabel: {
        fontSize: 10,
        color: GRAY_400,
        fontWeight: '600',
        marginBottom: 10,
        letterSpacing: 1,
    },
    wheelScroll: {
        width: '100%',
    },
    wheelItem: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderRadius: 8,
    },
    wheelItemSelected: {
        backgroundColor: GRAY_800,
    },
    wheelText: {
        fontSize: 24,
        color: GRAY_400,
        fontWeight: '400',
    },
    wheelTextSelected: {
        fontSize: 28,
        color: WHITE,
        fontWeight: 'bold',
    },
    timeSeparator: {
        fontSize: 30,
        color: WHITE,
        paddingBottom: 20,
        opacity: 0.5,
    },
    amPmContainer: {
        backgroundColor: GRAY_800,
        borderRadius: 12,
        padding: 4,
    },
    amPmItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 4,
    },
    amPmItemSelected: {
        backgroundColor: GRAY_600,
    },
    amPmText: {
        fontSize: 16,
        color: GRAY_400,
        fontWeight: '600',
    },
    amPmTextSelected: {
        color: WHITE,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    confirmButton: {
        backgroundColor: WHITE,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLACK,
    },
});
