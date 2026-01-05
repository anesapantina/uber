import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Easing } from 'react-native';

const BLACK = '#000000';
const WHITE = '#FFFFFF';

interface SplashScreenProps {
  navigation?: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current; // Start small and far
  const logoOpacity = useRef(new Animated.Value(0.4)).current; // Start slightly faded
  const glowIntensity = useRef(new Animated.Value(0)).current; // Glow effect
  const blurAmount = useRef(new Animated.Value(10)).current; // Blur effect (simulated with opacity)

  useEffect(() => {
    // Start at normal scale
    logoScale.setValue(1);

    // Zoom Out -> Zoom In Animation
    Animated.sequence([
      // 1. Zoom Out
      Animated.timing(logoScale, {
        toValue: 0.5,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      // 2. Zoom In with bounce
      Animated.timing(logoScale, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
    ]).start();

    // Navigate to Welcome screen after animation
    if (navigation) {
      const timer = setTimeout(() => {
        navigation.replace('Welcome');
      }, 2500); // Navigation slightly after animation finishes

      return () => clearTimeout(timer);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* RideKs Text Only */}
        <Text style={styles.logoText}>RideKs</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 64, // Big, bold font
    fontWeight: '900',
    color: WHITE,
    letterSpacing: -2, // Premium tight spacing
  },
});

export default SplashScreen;
