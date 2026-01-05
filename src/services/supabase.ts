// Real Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://umfoglexbhxdjapubpmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZm9nbGV4Ymh4ZGphcHVicG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTEyNjgsImV4cCI6MjA3ODg4NzI2OH0.CoUkfeCOceCTiaNuZsHTHB3cIziVoQFCN1WY6AmsGi8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log('✅ Real Supabase client initialized');

// Type definitions for database schema
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture_url?: string;
  home_address?: string;
  work_address?: string;
  saved_places?: any;
  payment_method_id?: string;
  card_last_four?: string;
  wallet_balance: number;
  rating: number;
  total_rides: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  license_number: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  vehicle_photo_url?: string;
  bank_account?: string;
  payment_method_id?: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  is_active: boolean;
  is_available: boolean;
  current_latitude?: number;
  current_longitude?: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
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
  estimated_distance_km?: number;
  estimated_duration_minutes?: number;
  estimated_fare?: number;
  actual_fare?: number;
  status: string;
  ride_type: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

// Auth Service
export const authService = {
  // Sign up as rider
  signUpRider: async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Wait a moment for the user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user profile in users table using service role (bypass RLS)
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user?.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            password_hash: password,
            profile_picture_url: null,
            home_address: null,
            work_address: null,
            saved_places: null,
            payment_method_id: null,
            card_last_four: null,
            wallet_balance: 0.0,
            rating: 5.0,
            total_rides: 0,
            is_active: true,
          },
        ]);

      if (profileError) throw profileError;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign up as driver
  signUpDriver: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    licenseNumber: string,
    vehicleModel: string,
    vehicleYear: number,
    vehicleColor: string,
    vehiclePlate: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Wait a moment for the user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create driver profile in drivers table
      const { error: profileError } = await supabase
        .from('drivers')
        .insert([
          {
            id: data.user?.id,
            email,
            phone_number: phone,
            first_name: firstName,
            last_name: lastName,
            password_hash: password,
            license_number: licenseNumber,
            vehicle_model: vehicleModel,
            vehicle_year: vehicleYear,
            vehicle_color: vehicleColor,
            vehicle_plate: vehiclePlate,
            profile_picture_url: null,
            vehicle_photo_url: null,
            bank_account: null,
            payment_method_id: null,
            rating: 5.0,
            total_rides: 0,
            total_earnings: 0.0,
            is_active: false,
            is_available: false,
            current_latitude: null,
            current_longitude: null,
            verified: false,
          },
        ]);

      if (profileError) throw profileError;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Login
  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Logout
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data: data.user, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Rider Service
export const riderService = {
  // Get rider profile
  getRiderProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update rider profile
  updateRiderProfile: async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();
      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Request a ride
  requestRide: async (
    riderId: string,
    pickupLat: number,
    pickupLng: number,
    pickupAddress: string,
    dropoffLat: number,
    dropoffLng: number,
    dropoffAddress: string,
    estimatedDistance: number,
    estimatedDuration: number,
    estimatedFare: number,
    rideType: string = 'economy',
    paymentMethod: string = 'wallet'
  ) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .insert([
          {
            rider_id: riderId,
            pickup_latitude: pickupLat,
            pickup_longitude: pickupLng,
            pickup_address: pickupAddress,
            dropoff_latitude: dropoffLat,
            dropoff_longitude: dropoffLng,
            dropoff_address: dropoffAddress,
            estimated_distance_km: estimatedDistance,
            estimated_duration_minutes: estimatedDuration,
            estimated_fare: estimatedFare,
            status: 'pending',
            ride_type: rideType,
            payment_method: paymentMethod,
            discount_amount: 0,
          },
        ])
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get ride status
  getRideStatus: async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(
          `*,
          rider:users!rides_rider_id_fkey(id, first_name, last_name, phone_number, rating),
          driver:drivers!rides_driver_id_fkey(id, first_name, last_name, phone_number, vehicle_model, vehicle_plate, rating)`
        )
        .eq('id', rideId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Cancel ride
  cancelRide: async (rideId: string, reason: string = '') => {
    try {
      const CANCELLATION_FEE = 2.00; // €2 cancellation fee

      // First, get the ride details to find the rider
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('rider_id, status')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;

      // Update the ride status to cancelled
      const { data, error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: 'rider',
          cancelled_at: new Date().toISOString(),
          cancellation_fee: CANCELLATION_FEE,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) throw error;

      // Deduct cancellation fee from rider's wallet
      const { data: riderData, error: riderError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', ride.rider_id)
        .single();

      if (!riderError && riderData) {
        const newBalance = (riderData.wallet_balance || 0) - CANCELLATION_FEE;

        await supabase
          .from('users')
          .update({
            wallet_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ride.rider_id);
      }

      // Create a payment record for the cancellation fee
      await supabase
        .from('payments')
        .insert([
          {
            ride_id: rideId,
            user_id: ride.rider_id,
            amount: CANCELLATION_FEE,
            payment_method: 'cancellation_fee',
            payment_status: 'completed',
            transaction_id: `CANCEL-${Date.now()}`,
            card_last_four: null,
            receipt_url: null,
          },
        ]);

      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get ride history
  getRideHistory: async (riderId: string, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(
          `*,
          driver:drivers(id, first_name, last_name, vehicle_model, vehicle_plate)`
        )
        .eq('rider_id', riderId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Add money to wallet
  addWalletBalance: async (userId: string, amount: number) => {
    try {
      const user = await riderService.getRiderProfile(userId);
      const newBalance = (user.data?.wallet_balance || 0) + amount;

      const { data, error } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Driver Service
export const driverService = {
  // Get driver profile
  getDriverProfile: async (driverId: string) => {
    try {
      const { data, error } = await supabase.from('drivers').select('*').eq('id', driverId).single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update driver profile
  updateDriverProfile: async (driverId: string, updates: any) => {
    try {
      console.log('📝 Checking if driver exists:', driverId);

      // Check if driver already exists
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', driverId)
        .single();

      if (existingDriver) {
        // Driver exists, just update (exclude email to avoid unique constraint)
        console.log('📝 Updating existing driver profile');
        const { email, ...updatesWithoutEmail } = updates;
        const { data, error } = await supabase
          .from('drivers')
          .update({
            ...updatesWithoutEmail,
            updated_at: new Date().toISOString(),
          })
          .eq('id', driverId)
          .select();

        if (error) throw error;
        console.log('✅ Driver profile updated:', data);
        return { data: data?.[0], error: null };
      } else {
        // Driver doesn't exist, insert new
        console.log('📝 Creating new driver profile');
        const { data, error } = await supabase
          .from('drivers')
          .insert({
            id: driverId,
            password_hash: 'dummy_hash',
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;
        console.log('✅ Driver profile created:', data);
        return { data: data?.[0], error: null };
      }
    } catch (error) {
      console.error('❌ Driver profile error:', error);
      return { data: null, error };
    }
  },

  // Update driver location
  updateDriverLocation: async (driverId: string, latitude: number, longitude: number) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId)
        .select();

      if (error) throw error;

      // Also log to ride_tracking if there's an active ride
      const activeRide = await driverService.getActiveRide(driverId);
      if (activeRide.data?.id) {
        await supabase.from('ride_tracking').insert([
          {
            ride_id: activeRide.data.id,
            driver_id: driverId,
            latitude,
            longitude,
            speed: 0,
            heading: 0,
            accuracy: 0,
          },
        ]);
      }

      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Set driver availability
  setDriverAvailability: async (driverId: string, isAvailable: boolean) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          is_available: isAvailable,
          is_active: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId)
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get available rides nearby
  getAvailableRides: async (driverLat: number, driverLng: number, radiusKm: number = 5) => {
    try {
      console.log('🔍 Fetching available rides from REAL Supabase');

      const { data, error } = await supabase
        .from('rides')
        .select(
          `*,
          rider:users!rides_rider_id_fkey(id, first_name, last_name, phone_number, rating, home_address, work_address)`
        )
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: true });

      console.log('📋 Total pending rides found:', data?.length || 0);
      if (error) {
        console.error('❌ Supabase error:', error);
      }
      if (data && data.length > 0) {
        data.forEach((ride: any, index: number) => {
          console.log(`  Ride ${index + 1}: ${ride.pickup_address} → ${ride.dropoff_address}`);
        });
      }

      if (error) throw error;

      // Return ALL pending rides without distance filtering
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching rides:', error);
      return { data: null, error };
    }
  },

  // Accept ride
  acceptRide: async (rideId: string, driverId: string) => {
    try {
      console.log('🚗 Accepting ride:', rideId, 'for driver:', driverId);

      const { data, error } = await supabase
        .from('rides')
        .update({
          driver_id: driverId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) {
        console.error('❌ Accept ride error:', error);
        throw error;
      }

      console.log('✅ Ride accepted successfully:', data);

      // Send automatic message that ride was accepted
      const { messageService } = await import('./supabase');
      await messageService.sendMessage(
        rideId,
        'system',
        null,
        '✅ Your ride has been accepted! The driver is on the way.'
      );

      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('❌ Accept ride exception:', error);
      return { data: null, error };
    }
  },

  // Start ride
  startRide: async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) throw error;

      // Send automatic message that driver has arrived
      const { messageService } = await import('./supabase');
      await messageService.sendMessage(
        rideId,
        'system',
        null,
        '🚗 Your driver has arrived! Have a safe trip.'
      );

      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Complete ride
  completeRide: async (rideId: string, actualFare: number) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_fare: actualFare,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) throw error;

      // Create payment record
      if (data?.[0]) {
        await paymentService.createPayment(
          rideId,
          data[0].rider_id,
          actualFare,
          data[0].payment_method
        );

        // Record driver earnings
        const commission = actualFare * 0.2; // 20% commission
        const netAmount = actualFare - commission;
        await supabase.from('driver_earnings').insert([
          {
            driver_id: data[0].driver_id,
            ride_id: rideId,
            gross_amount: actualFare,
            commission,
            net_amount: netAmount,
            status: 'pending',
          },
        ]);
      }

      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Cancel/Deny ride
  cancelRide: async (rideId: string, reason: string = '') => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: 'driver',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Deny ride (return to pending status for other drivers)
  denyRide: async (rideId: string) => {
    try {
      console.log('🚫 Denying ride:', rideId);
      const { data, error } = await supabase
        .from('rides')
        .update({
          status: 'pending',
          driver_id: null,
          accepted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select();

      if (error) throw error;
      console.log('✅ Ride returned to pending status');
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('❌ Error denying ride:', error);
      return { data: null, error };
    }
  },

  // Get active ride
  getActiveRide: async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(
          `*,
          rider:users!rides_rider_id_fkey(id, first_name, last_name, phone_number, rating, home_address, work_address),
          driver:drivers!rides_driver_id_fkey(id, first_name, last_name, phone_number, vehicle_model, vehicle_plate, vehicle_color)`
        )
        .eq('driver_id', driverId)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return { data: data?.[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get ride history
  getDriverRideHistory: async (driverId: string, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(
          `*,
          rider:users!rides_rider_id_fkey(id, first_name, last_name, phone_number, rating)`
        )
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get earnings
  getEarnings: async (driverId: string, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select(
          `*,
          ride:rides(id, status, actual_fare, completed_at)`
        )
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get total earnings
  getTotalEarnings: async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('total_earnings')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      return { data: data?.total_earnings || 0, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  },
};

// Rating Service
export const ratingService = {
  // Create rating
  createRating: async (
    rideId: string,
    ratedById: string,
    ratedUserId: string,
    score: number,
    comment: string = '',
    isRiderRating: boolean = true
  ) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([
          {
            ride_id: rideId,
            rated_by_id: ratedById,
            rated_user_id: ratedUserId,
            rating_score: score,
            comment,
            is_rider_rating: isRiderRating,
            categories: null,
          },
        ])
        .select();

      if (error) throw error;

      // Update user/driver rating
      const ratings = await ratingService.getRatings(ratedUserId);
      if (ratings.data) {
        const avgRating =
          ratings.data.reduce((sum: number, r: any) => sum + r.rating_score, 0) / ratings.data.length;

        // Update appropriate table
        const table = isRiderRating ? 'drivers' : 'users';
        await supabase.from(table).update({ rating: avgRating }).eq('id', ratedUserId);
      }

      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get ratings for user
  getRatings: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(
          `*,
          ratedBy:rated_by_id(first_name, last_name),
          ride:rides(id, status)`
        )
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get average rating
  getAverageRating: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating_score')
        .eq('rated_user_id', userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: 5.0, error: null };
      }

      const avgRating = data.reduce((sum: number, r: any) => sum + r.rating_score, 0) / data.length;
      return { data: avgRating, error: null };
    } catch (error) {
      return { data: 5.0, error };
    }
  },
};

// Payment Service
export const paymentService = {
  // Create payment
  createPayment: async (
    rideId: string,
    userId: string,
    amount: number,
    paymentMethod: string = 'wallet'
  ) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            ride_id: rideId,
            user_id: userId,
            amount,
            payment_method: paymentMethod,
            payment_status: 'completed',
            transaction_id: `TXN-${Date.now()}`,
            card_last_four: null,
            receipt_url: null,
          },
        ])
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get payment history
  getPaymentHistory: async (userId: string, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `*,
          ride:rides(id, pickup_address, dropoff_address, completed_at)`
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get total spent
  getTotalSpent: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', userId)
        .eq('payment_status', 'completed');

      if (error) throw error;

      const total = data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      return { data: total, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  },
};

// Support Ticket Service
export const supportService = {
  // Create support ticket
  createTicket: async (
    userId: string | null,
    driverId: string | null,
    rideId: string | null,
    issueType: string,
    description: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: userId,
            driver_id: driverId,
            ride_id: rideId,
            issue_type: issueType,
            description,
            status: 'open',
            resolution: null,
          },
        ])
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get support tickets
  getTickets: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .or(`user_id.eq.${userId},driver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Message Service
export const messageService = {
  // Send a message
  sendMessage: async (rideId: string, senderType: 'rider' | 'driver' | 'system', senderId: string | null, message: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_messages')
        .insert({
          ride_id: rideId,
          sender_type: senderType,
          sender_id: senderId,
          message,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('❌ Send message error:', error);
      return { data: null, error };
    }
  },

  // Get messages for a ride
  getMessages: async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ Get messages error:', error);
      return { data: null, error };
    }
  },

  // Subscribe to new messages for a ride
  subscribeToMessages: (rideId: string, callback: (message: any) => void) => {
    console.log('🔌 Creating subscription channel for ride:', rideId);

    const channel = supabase
      .channel(`messages_${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log('🔔 Real-time event received:', payload);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return channel;
  },
};

// Utility function to calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
