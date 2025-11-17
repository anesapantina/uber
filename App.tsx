// ✅ React & Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { Text } from 'react-native';

// ✅ Store
import { useAuthStore } from './src/store/store';

// ✅ Rider Screens
import RideHomeScreen from './src/screens/rider/RideHomeScreen';
import RideRequestScreen from './src/screens/rider/RideRequestScreen';
import RideTrackingScreen from './src/screens/rider/RideTrackingScreen';
import RideRatingScreen from './src/screens/rider/RideRatingScreen';
import RiderProfileScreen from './src/screens/rider/RiderProfileScreen';
import RiderActivityScreen from './src/screens/rider/RiderActivityScreen';

// ✅ Driver Screens
import ActiveRideScreen from './src/screens/driver/ActiveRideScreen';
import AvailableRidesScreen from './src/screens/driver/AvailableRidesScreen';
import DriverProfileScreen from './src/screens/driver/DriverProfileScreen';

// ✅ Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// ✅ Chat Screen
import ChatScreen from './src/screens/chat/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Driver Bottom Tabs
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#3F3F3F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AvailableRides"
        component={AvailableRidesScreen}
        options={{
          tabBarLabel: 'Rides',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🚗</Text>,
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Rider Bottom Tabs
function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#3F3F3F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="RideHome"
        component={RideRequestScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="RiderActivity"
        component={RiderActivityScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="RiderProfile"
        component={RiderProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userType = useAuthStore((state) => state.userType);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
      >
        {!isAuthenticated ? (
          <>
            {/* Splash & Auth Screens */}
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
            />
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
            />
          </>
        ) : userType === 'driver' ? (
          <>
            {/* Driver Screens */}
            <Stack.Screen 
              name="DriverTabs" 
              component={DriverTabs}
            />
            <Stack.Screen 
              name="ActiveRide" 
              component={ActiveRideScreen}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
            />
          </>
        ) : (
          <>
            {/* Rider Screens */}
            <Stack.Screen 
              name="RiderTabs" 
              component={RiderTabs}
            />
            <Stack.Screen 
              name="RideRequest" 
              component={RideRequestScreen}
            />
            <Stack.Screen 
              name="RideTracking" 
              component={RideTrackingScreen}
            />
            <Stack.Screen 
              name="RideRating" 
              component={RideRatingScreen}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

