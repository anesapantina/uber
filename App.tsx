// ✅ React & Navigation
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { Text, Platform, ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Font from 'expo-font';

// Web font setup
if (Platform.OS === 'web') {
  require('./react-native-vector-icons-web');
}

// Store
import { useAuthStore } from './src/store/store';

// Rider Screens
import RideHomeScreen from './src/screens/rider/RideHomeScreen';
import { RideRequestScreen } from './src/screens/rider/RideRequestScreen';
import RideTrackingScreen from './src/screens/rider/RideTrackingScreen';
import RideRatingScreen from './src/screens/rider/RideRatingScreen';
import RiderProfileScreen from './src/screens/rider/RiderProfileScreen';
import RiderActivityScreen from './src/screens/rider/RiderActivityScreen';

// Driver Screens
import ActiveRideScreen from './src/screens/driver/ActiveRideScreen';
import AvailableRidesScreen from './src/screens/driver/AvailableRidesScreen';
import DriverProfileScreen from './src/screens/driver/DriverProfileScreen';

// Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Chat Screen
import ChatScreen from './src/screens/chat/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Driver Bottom Tabs
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
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
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="RideHome"
        component={RideRequestScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="RiderActivity"
        component={RiderActivityScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="list" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="RiderProfile"
        component={RiderProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userType = useAuthStore((state) => state.userType);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        if (Platform.OS !== 'web') {
          await Font.loadAsync({
            'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
            'MaterialIcons': require('react-native-vector-icons/Fonts/MaterialIcons.ttf'),
            'FontAwesome': require('react-native-vector-icons/Fonts/FontAwesome.ttf'),
          });
        }
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue anyway
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

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

