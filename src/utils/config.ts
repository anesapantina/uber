// Configuration and utility constants

export const APP_CONFIG = {
  // Pricing
  PRICING: {
    BASE_FARE: 2.5,
    FARE_PER_KM: 1.5,
    FARE_PER_MINUTE: 0.35,
    MINIMUM_FARE: 2.5,
    SURGE_MULTIPLIER: 1.0, // 1.0 = no surge
  },

  // Time settings
  TIMEOUTS: {
    RIDE_REQUEST_TIMEOUT: 60, // seconds
    DRIVER_ACCEPT_TIMEOUT: 30,
    LOCATION_UPDATE_INTERVAL: 5000, // ms
    RIDE_STATUS_POLL_INTERVAL: 5000,
  },

  // Location
  LOCATION: {
    DEFAULT_ZOOM: 15,
    SEARCH_RADIUS_KM: 5,
    MAX_SEARCH_RADIUS_KM: 20,
  },

  // Ratings
  RATINGS: {
    MIN_RATING: 1,
    MAX_RATING: 5,
    MIN_RATING_TO_ACCEPT_RIDES: 3.0,
  },

  // Ride types
  RIDE_TYPES: {
    ECONOMY: 'economy',
    COMFORT: 'comfort',
    PREMIUM: 'premium',
  },

  // Payment methods
  PAYMENT_METHODS: {
    WALLET: 'wallet',
    CARD: 'card',
    CASH: 'cash',
  },

  // Ride status
  RIDE_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
};

// Fare calculation
export const calculateFare = (
  distanceKm: number,
  durationMinutes: number,
  config = APP_CONFIG.PRICING
): number => {
  const distanceFare = Math.max(
    config.MINIMUM_FARE,
    distanceKm * config.FARE_PER_KM
  );
  const timeFare = durationMinutes * config.FARE_PER_MINUTE;
  const total = distanceFare + timeFare;
  return Math.round(total * 100) / 100; // Round to 2 decimals
};

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format time
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Format distance
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

// Haversine distance formula (already in supabase.ts but kept here for reference)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Estimate ride time (rough approximation)
export const estimateRideTime = (distanceKm: number, avgSpeedKmh = 40): number => {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60); // minutes
};

// Validate email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Get rating color
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return '#00c853'; // Green
  if (rating >= 4.0) return '#7cb342'; // Light green
  if (rating >= 3.5) return '#fbc02d'; // Yellow
  if (rating >= 3.0) return '#f57c00'; // Orange
  return '#d32f2f'; // Red
};

// Get status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#1976d2'; // Blue
    case 'accepted':
      return '#0288d1'; // Light blue
    case 'in_progress':
      return '#00c853'; // Green
    case 'completed':
      return '#7cb342'; // Light green
    case 'cancelled':
      return '#d32f2f'; // Red
    default:
      return '#757575'; // Gray
  }
};

// Get ride type multiplier
export const getRideTypeMultiplier = (rideType: string): number => {
  switch (rideType) {
    case 'economy':
      return 1.0;
    case 'comfort':
      return 1.25;
    case 'premium':
      return 1.5;
    default:
      return 1.0;
  }
};

// Mock data for testing
export const MOCK_RIDES = [
  {
    id: '1',
    pickup_address: '123 Main St, New York, NY',
    dropoff_address: '456 Park Ave, New York, NY',
    estimated_distance_km: 2.5,
    estimated_duration_minutes: 12,
    estimated_fare: 8.75,
  },
  {
    id: '2',
    pickup_address: '789 Broadway, New York, NY',
    dropoff_address: '321 5th Ave, New York, NY',
    estimated_distance_km: 1.8,
    estimated_duration_minutes: 10,
    estimated_fare: 6.95,
  },
];

export const MOCK_DRIVER = {
  id: 'driver-1',
  first_name: 'John',
  last_name: 'Doe',
  vehicle_model: 'Toyota Camry',
  vehicle_plate: 'ABC-123',
  rating: 4.8,
  current_latitude: 40.7128,
  current_longitude: -74.006,
};


export const MOCK_RIDER = {
  id: 'rider-1',
  first_name: 'Jane',
  last_name: 'Smith',
  phone_number: '555-0123',
  rating: 4.9,
};

export const GOOGLE_MAPS_DARK_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];
