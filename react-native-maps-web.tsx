import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Mock MapView for web
export const MapView = ({ children, style, ...props }: any) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapHeader}>
        <Ionicons name="map" size={24} color="#666" />
        <Text style={styles.mapText}>Map View (Web)</Text>
      </View>
      {children}
    </View>
  );
};

// Mock Marker for web
export const Marker = ({ coordinate, title, description, pinColor }: any) => {
  return (
    <View style={styles.marker}>
      <View style={styles.markerContent}>
        <Ionicons name="location" size={16} color={pinColor || "#000"} />
        <Text style={styles.markerText}>{title || 'Marker'}</Text>
      </View>
    </View>
  );
};

// Mock Polyline for web
export const Polyline = ({ coordinates, strokeWidth, strokeColor }: any) => {
  return (
    <View style={styles.polyline}>
      <Ionicons name="path" size={20} color="#666" />
      <Text style={styles.polylineText}>Route</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapText: {
    fontSize: 24,
    color: '#666',
  },
  marker: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
    margin: 5,
  },
  markerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  markerText: {
    fontSize: 12,
  },
  polyline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 5,
  },
  polylineText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapView;
