import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture_url?: string;
  rating: number;
  total_rides: number;
}

export interface Driver {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  rating: number;
  total_rides: number;
  is_available: boolean;
  current_latitude: number;
  current_longitude: number;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  estimated_distance_km: number;
  estimated_duration_minutes: number;
  estimated_fare: number;
  actual_fare?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  scheduled_time?: string; // ISO string for scheduled rides
  driver?: any; // Driver details when ride is accepted
}

interface AuthStore {
  user: User | Driver | null;
  userType: 'rider' | 'driver' | null;
  isAuthenticated: boolean;
  setUser: (user: User | Driver, type: 'rider' | 'driver') => void;
  logout: () => void;
}

interface RiderStore {
  currentRide: Ride | null;
  rideHistory: Ride[];
  setCurrentRide: (ride: Ride | null) => void;
  setRideHistory: (rides: Ride[]) => void;
  clearCurrentRide: () => void;
}

interface DriverStore {
  isOnDuty: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  availableRides: Ride[];
  activeRide: Ride | null;
  setOnDuty: (onDuty: boolean) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setAvailableRides: (rides: Ride[]) => void;
  setActiveRide: (ride: Ride | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      userType: null,
      isAuthenticated: false,
      setUser: (user, type) =>
        set({
          user,
          userType: type,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          userType: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useRiderStore = create<RiderStore>()(
  persist(
    (set) => ({
      currentRide: null,
      rideHistory: [],
      setCurrentRide: (ride) => {
        console.log('Setting current ride:', ride?.id, ride?.status);
        set({ currentRide: ride });
      },
      setRideHistory: (rides) => set({ rideHistory: rides }),
      clearCurrentRide: () => set({ currentRide: null }),
    }),
    {
      name: 'rider-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist currentRide if it's active (not completed or cancelled)
      partialize: (state) => ({
        currentRide:
          state.currentRide &&
            state.currentRide.status !== 'completed' &&
            state.currentRide.status !== 'cancelled'
            ? state.currentRide
            : null,
        rideHistory: state.rideHistory,
      }),
    }
  )
);

export const useDriverStore = create<DriverStore>()(
  persist(
    (set) => ({
      isOnDuty: false,
      currentLocation: null,
      availableRides: [],
      activeRide: null,
      setOnDuty: (onDuty) => set({ isOnDuty: onDuty }),
      setCurrentLocation: (location) => set({ currentLocation: location }),
      setAvailableRides: (rides) => set({ availableRides: rides }),
      setActiveRide: (ride) => set({ activeRide: ride }),
    }),
    {
      name: 'driver-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
