import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    searchLocations,
    formatLocationDisplay,
    debounce,
    LocationSuggestion,
    SavedLocation,
    getRecentLocations,
    saveRecentLocation,
} from '../services/locationService';

interface LocationAutocompleteInputProps {
    placeholder: string;
    value: string;
    onLocationSelect: (address: string, lat: number, lng: number) => void;
    icon?: string;
    iconColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    autoFocus?: boolean;
    predefinedPlaces?: { name: string; lat: number; lng: number }[];
    darkMode?: boolean;
    onFocus?: () => void;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#EEEEEE';
const GRAY_300 = '#E0E0E0';
const GRAY_700 = '#666666';
const GRAY_800 = '#333333';
const GRAY_900 = '#1A1A1A';

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
    placeholder,
    value,
    onLocationSelect,
    icon = 'location',
    iconColor = BLACK,
    containerStyle,
    inputStyle,
    autoFocus = false,
    predefinedPlaces = [],
    darkMode = false,
    onFocus,
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [recentLocations, setRecentLocations] = useState<SavedLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        loadRecentLocations();
    }, []);

    const loadRecentLocations = async () => {
        const recents = await getRecentLocations();
        setRecentLocations(recents);
    };

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            const trimmedQuery = query.trim().toLowerCase();
            let results: LocationSuggestion[] = [];

            if (predefinedPlaces && predefinedPlaces.length > 0) {
                const matchedPlaces = predefinedPlaces.filter(place =>
                    place.name.toLowerCase().includes(trimmedQuery)
                ).map(place => ({
                    place_id: `predefined-${place.name}`,
                    lat: place.lat.toString(),
                    lon: place.lng.toString(),
                    display_name: place.name,
                    type: 'city',
                    importance: 1,
                    address: { city: place.name }
                } as LocationSuggestion));
                results = [...matchedPlaces];
            }

            if (trimmedQuery.length >= 2) {
                try {
                    const apiResults = await searchLocations(query);
                    const existingNames = new Set(results.map(r => r.display_name.toLowerCase()));
                    const newResults = apiResults.filter(r => !existingNames.has(formatLocationDisplay(r).toLowerCase()));
                    results = [...results, ...newResults];
                } catch (error) {
                    console.error('Search failed', error);
                }
            }

            setSuggestions(results);
            setLoading(false);
        }, 500),
        [predefinedPlaces]
    );

    const handleInputChange = (text: string) => {
        setInputValue(text);
        setShowSuggestions(true);

        if (text.trim().length >= 2) {
            setLoading(true);
            debouncedSearch(text);
        } else {
            setSuggestions([]);
            setLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        const formattedAddress = formatLocationDisplay(suggestion);
        setInputValue(formattedAddress);
        setShowSuggestions(false);
        setSuggestions([]);

        saveRecentLocation({
            address: formattedAddress,
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lon),
            timestamp: Date.now(),
        });

        onLocationSelect(formattedAddress, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    };

    const handleSelectRecentLocation = (location: SavedLocation) => {
        setInputValue(location.address);
        setShowSuggestions(false);
        setSuggestions([]);
        onLocationSelect(location.address, location.lat, location.lng);
    };

    const bgColor = darkMode ? GRAY_900 : WHITE;
    const textColor = darkMode ? WHITE : BLACK;
    const borderColor = darkMode ? GRAY_800 : BLACK;
    const subtextColor = darkMode ? GRAY_300 : GRAY_700;

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, containerStyle, darkMode && styles.inputContainerDark]}>
                {icon && <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />}
                <TextInput
                    style={[styles.input, inputStyle, { color: textColor }]}
                    placeholder={placeholder}
                    placeholderTextColor={subtextColor}
                    value={inputValue}
                    onChangeText={handleInputChange}
                    onFocus={() => { setShowSuggestions(true); onFocus?.(); }}
                    autoFocus={autoFocus}
                />
                {loading && <ActivityIndicator size="small" color={textColor} style={styles.loader} />}
                {inputValue.length > 0 && !loading && (
                    <TouchableOpacity
                        onPress={() => {
                            setInputValue('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color={subtextColor} />
                    </TouchableOpacity>
                )}
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { top: containerStyle ? 55 : 55, backgroundColor: bgColor, borderColor: borderColor }]}>
                    <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.lat}-${item.lon}-${index}`}
                                style={[styles.suggestionItem, { borderBottomColor: darkMode ? GRAY_800 : GRAY_200 }]}
                                onPress={() => handleSelectSuggestion(item)}
                            >
                                <Ionicons name="location-outline" size={18} color={subtextColor} style={styles.suggestionIcon} />
                                <View style={styles.suggestionTextContainer}>
                                    <Text style={[styles.suggestionText, { color: textColor }]} numberOfLines={1}>
                                        {formatLocationDisplay(item)}
                                    </Text>
                                    <Text style={[styles.suggestionSubtext, { color: subtextColor }]} numberOfLines={1}>
                                        {item.display_name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WHITE,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: BLACK,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputContainerDark: {
        backgroundColor: GRAY_900,
        borderColor: GRAY_800,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        padding: 0,
    },
    loader: {
        marginRight: 8,
    },
    suggestionsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        maxHeight: 300,
    },
    suggestionsList: {
        borderRadius: 12,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
    },
    suggestionIcon: {
        marginRight: 12,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    suggestionSubtext: {
        fontSize: 12,
    },
    recentHeader: {
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
