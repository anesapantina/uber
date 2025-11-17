import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { RideHomeScreen } from '../screens/rider/RideHomeScreen';
import { RideRequestScreen } from '../screens/rider/RideRequestScreen';
import { RideTrackingScreen } from '../screens/rider/RideTrackingScreen';
import { RideRatingScreen } from '../screens/rider/RideRatingScreen';
import { RiderActivityScreen } from '../screens/rider/RiderActivityScreen';
import { RiderProfileScreen } from '../screens/rider/RiderProfileScreen';
import { AvailableRidesScreen } from '../screens/driver/AvailableRidesScreen';
import { ActiveRideScreen } from '../screens/driver/ActiveRideScreen';
import { DriverProfileScreen } from '../screens/driver/DriverProfileScreen';
import { useAuthStore } from '../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface NavigationProps {
  onUserTypeChange: (userType: 'rider' | 'driver' | null) => void;
}

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const RiderTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarShowLabel: false,
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="RideHome"
      component={RideHomeScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="home" size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="RiderActivity"
      component={RiderActivityScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="list" size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="RiderProfile"
      component={RiderProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="person" size={28} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const RiderStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="RiderTabs"
      component={RiderTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="RideRequest"
      component={RideRequestScreen}
      options={{ title: 'Request a Ride' }}
    />
    <Stack.Screen
      name="RideTracking"
      component={RideTrackingScreen}
      options={{ title: 'Track Your Ride' }}
    />
    <Stack.Screen
      name="RideRating"
      component={RideRatingScreen}
      options={{ title: 'Rate Your Ride' }}
    />
  </Stack.Navigator>
);

const DriverTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarShowLabel: false,
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="AvailableRides"
      component={AvailableRidesScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="home" size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="DriverProfile"
      component={DriverProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="person" size={28} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const DriverStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="DriverTabs"
      component={DriverTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ActiveRide"
      component={ActiveRideScreen}
      options={{ title: 'Active Ride' }}
    />
  </Stack.Navigator>
);

export const RootNavigator: React.FC<NavigationProps> = ({ onUserTypeChange }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userType = useAuthStore((state) => state.userType);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      ) : userType === 'driver' ? (
        <Stack.Screen name="DriverStack" component={DriverStack} />
      ) : (
        <Stack.Screen name="RiderStack" component={RiderStack} />
      )}
    </Stack.Navigator>
  );
};
