import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_LOCATIONS_KEY = '@recent_locations';
const MAX_RECENT_LOCATIONS = 10;

export interface LocationSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        house_number?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        country?: string;
    };
}

export interface SavedLocation {
    address: string;
    lat: number;
    lng: number;
    timestamp: number;
}

// Debounce helper
let debounceTimer: NodeJS.Timeout;
export const debounce = (func: Function, delay: number) => {
    return (...args: any[]) => {
        clearTimeout(debounceTimer);
        return new Promise((resolve) => {
            debounceTimer = setTimeout(() => resolve(func(...args)), delay);
        });
    };
};

/**
 * Search for location suggestions using Nominatim API
 */
export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        // Focus search on Kosovo region for better results
        // Include street-level detail with featuretype parameter
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `q=${encodeURIComponent(query)}&` +
            `addressdetails=1&` +
            `limit=10&` + // Increased to 10 for more street results
            `countrycodes=xk,al,rs&` + // Kosovo, Albania, Serbia
            `bounded=1&` +
            `viewbox=19.5,43.5,21.8,42.0&` + // Kosovo bounding box
            `dedupe=1`, // Remove duplicate results
            {
                headers: {
                    'User-Agent': 'RideKs-App/1.0',
                },
            }
        );

        if (!response.ok) {
            console.error('Nominatim API error:', response.status);
            return [];
        }

        const data = await response.json();
        
        // Prioritize results with street addresses
        return data.sort((a: LocationSuggestion, b: LocationSuggestion) => {
            const aHasStreet = a.address?.road ? 1 : 0;
            const bHasStreet = b.address?.road ? 1 : 0;
            return bHasStreet - aHasStreet; // Street addresses first
        });
    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&` +
            `lat=${lat}&` +
            `lon=${lng}&` +
            `zoom=18&` +
            `addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'RideKs-App/1.0',
                },
            }
        );

        const data = await response.json();

        if (data.address) {
            const { road, house_number, neighbourhood, suburb, city, town, village } = data.address;

            // Build a nice formatted address
            const parts = [];
            if (house_number && road) {
                parts.push(`${road} ${house_number}`);
            } else if (road) {
                parts.push(road);
            }

            if (neighbourhood) parts.push(neighbourhood);
            if (suburb) parts.push(suburb);
            if (city || town || village) parts.push(city || town || village);

            return parts.join(', ') || 'Current Location';
        }

        return 'Current Location';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Current Location';
    }
};

/**
 * Format location suggestion for display
 */
export const formatLocationDisplay = (suggestion: LocationSuggestion): string => {
    const { address } = suggestion;
    const parts = [];

    if (address.house_number && address.road) {
        parts.push(`${address.road} ${address.house_number}`);
    } else if (address.road) {
        parts.push(address.road);
    }

    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
    }

    return parts.join(', ') || suggestion.display_name;
};

/**
 * Save location to recent locations
 */
export const saveRecentLocation = async (location: SavedLocation): Promise<void> => {
    try {
        const existing = await getRecentLocations();

        // Remove duplicates (same address)
        const filtered = existing.filter(
            (loc) => loc.address.toLowerCase() !== location.address.toLowerCase()
        );

        // Add new location at the beginning
        const updated = [location, ...filtered].slice(0, MAX_RECENT_LOCATIONS);

        await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving recent location:', error);
    }
};

/**
 * Get recent locations from storage
 */
export const getRecentLocations = async (): Promise<SavedLocation[]> => {
    try {
        const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error getting recent locations:', error);
        return [];
    }
};

/**
 * Clear all recent locations
 */
export const clearRecentLocations = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY);
    } catch (error) {
        console.error('Error clearing recent locations:', error);
    }
};

// ===== SCHEDULED RIDES MANAGEMENT =====

const SCHEDULED_RIDES_KEY = '@scheduled_rides';

export interface ScheduledRide {
    id: string;
    scheduledTime: string; // ISO string
    createdAt: number;
}

/**
 * Save a scheduled ride
 */
export const saveScheduledRide = async (ride: ScheduledRide): Promise<void> => {
    try {
        const existing = await getScheduledRides();
        const updated = [...existing, ride];
        await AsyncStorage.setItem(SCHEDULED_RIDES_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving scheduled ride:', error);
    }
};

/**
 * Get all scheduled rides
 */
export const getScheduledRides = async (): Promise<ScheduledRide[]> => {
    try {
        const data = await AsyncStorage.getItem(SCHEDULED_RIDES_KEY);
        if (data) {
            const rides = JSON.parse(data);
            // Filter out past rides
            const now = new Date().getTime();
            const validRides = rides.filter((ride: ScheduledRide) => {
                const scheduledTime = new Date(ride.scheduledTime).getTime();
                return scheduledTime > now;
            });
            // Save back filtered list
            if (validRides.length !== rides.length) {
                await AsyncStorage.setItem(SCHEDULED_RIDES_KEY, JSON.stringify(validRides));
            }
            return validRides;
        }
        return [];
    } catch (error) {
        console.error('Error getting scheduled rides:', error);
        return [];
    }
};

/**
 * Delete a scheduled ride
 */
export const deleteScheduledRide = async (rideId: string): Promise<void> => {
    try {
        const existing = await getScheduledRides();
        const updated = existing.filter(ride => ride.id !== rideId);
        await AsyncStorage.setItem(SCHEDULED_RIDES_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error deleting scheduled ride:', error);
    }
};

/**
 * Clear all scheduled rides
 */
export const clearScheduledRides = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SCHEDULED_RIDES_KEY);
    } catch (error) {
        console.error('Error clearing scheduled rides:', error);
    }
};
