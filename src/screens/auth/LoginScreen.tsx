import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import { authService, riderService, driverService } from '../../services/supabase';
import { useAuthStore } from '../../store/store';

interface LoginScreenProps {
  navigation: any;
}

// Define the colors for clarity
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E5E5E5';
const GRAY_700 = '#3F3F3F';

const STORE_KEY_EMAIL = 'auth_email';
const STORE_KEY_PASSWORD = 'auth_password';
const STORE_KEY_REMEMBER_ME = 'auth_remember_me';

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const setUser = useAuthStore((state: any) => state.setUser);

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      setCheckingAuth(true);
      const savedRememberMe = await SecureStore.getItemAsync(STORE_KEY_REMEMBER_ME);

      if (savedRememberMe === 'true') {
        setRememberMe(true);
        const savedEmail = await SecureStore.getItemAsync(STORE_KEY_EMAIL);
        const savedPassword = await SecureStore.getItemAsync(STORE_KEY_PASSWORD);

        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
      }
    } catch (error) {
      console.warn('Error loading saved credentials:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Handle Remember Me persistence
      if (rememberMe) {
        await SecureStore.setItemAsync(STORE_KEY_REMEMBER_ME, 'true');
        await SecureStore.setItemAsync(STORE_KEY_EMAIL, email);
        await SecureStore.setItemAsync(STORE_KEY_PASSWORD, password);
      } else {
        await SecureStore.deleteItemAsync(STORE_KEY_REMEMBER_ME);
        await SecureStore.deleteItemAsync(STORE_KEY_EMAIL);
        await SecureStore.deleteItemAsync(STORE_KEY_PASSWORD);
      }

      const { data, error } = await authService.login(email, password);

      if (error) {
        console.error('Login Failed:', (error as any).message || 'Invalid credentials');
        Alert.alert('Login Failed', 'Invalid email or password');
        return;
      }

      // Use the authenticated user's ID from Supabase
      const userId = data?.user?.id;

      if (!userId) {
        console.error('Failed to get user ID');
        Alert.alert('Error', 'Failed to get user details');
        return;
      }

      // Try to fetch from users table first (rider)
      const { data: riderProfile, error: riderError } = await riderService.getRiderProfile(userId);

      if (riderProfile && !riderError) {
        // User is a rider
        setUser(riderProfile, 'rider');
        return;
      }

      // Try to fetch from drivers table (driver)
      const { data: driverProfile, error: driverError } = await driverService.getDriverProfile(userId);

      if (driverProfile && !driverError) {
        // User is a driver
        setUser(driverProfile, 'driver');
        return;
      }

      // If neither profile exists, log error
      console.error('User profile not found. Please register first.');
      Alert.alert('Error', 'User profile not found. Please register first.');
    } catch (error) {
      console.error('An error occurred during login:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  if (checkingAuth) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BLACK} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              placeholderTextColor={GRAY_700}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="• • • • • • • •"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor={GRAY_700}
            />
          </View>

          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={toggleRememberMe}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={18} color={WHITE} />}
            </View>
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.registerLinkText}>
              Don't have any account? <Text style={styles.registerLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  content: { paddingHorizontal: 30, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', marginBottom: 40, color: BLACK },

  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: BLACK, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: GRAY_200, borderRadius: 12, padding: 16, fontSize: 16, color: BLACK, backgroundColor: WHITE },

  rememberMeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: GRAY_200, borderRadius: 6, marginRight: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
  checkboxChecked: { backgroundColor: BLACK, borderColor: BLACK },
  rememberMeText: { fontSize: 14, fontWeight: '500', color: BLACK },

  button: { backgroundColor: BLACK, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: BLACK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: WHITE, fontSize: 18, fontWeight: '700' },
  registerLink: { marginTop: 25, padding: 10, alignItems: 'center' },
  registerLinkText: { color: BLACK, fontSize: 14 },
  registerLinkBold: { color: BLACK, fontWeight: '700' },
});

export default LoginScreen;

