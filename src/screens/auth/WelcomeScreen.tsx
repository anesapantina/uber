import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, PanResponder } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WelcomeScreenProps {
  navigation: any;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_700 = '#3F3F3F';
const GRAY_500 = '#6B6B6B';

// Generate random lines
const generateLines = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x1: Math.random() * 300,
    y1: Math.random() * 300,
    x2: Math.random() * 300,
    y2: Math.random() * 300,
    duration: 3000 + Math.random() * 4000,
    delay: Math.random() * 2000,
  }));
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const [lines] = useState(generateLines(10));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Logo Circle at Top */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="person" size={28} color={BLACK} />
        </View>
      </View>

      {/* Animated Lines Pattern - Interactive */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.linesContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        {lines.map((line) => (
          <AnimatedLine key={line.id} line={line} pan={pan} />
        ))}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.subtitleText}>Your journey starts from here</Text>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.phoneButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.phoneButtonText}>Continue with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Terms Text */}
        <Text style={styles.termsText}>
          By pressing on "Continue with..." you agree{'\n'}
          to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' — '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

// Animated Line Component with bend effect
const AnimatedLine: React.FC<{ line: any; pan: any }> = ({ line, pan }) => {
  const moveAnim = useRef(new Animated.ValueXY({ x: line.x1, y: line.y1 })).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bendAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(moveAnim, {
              toValue: { x: line.x2, y: line.y2 },
              duration: line.duration,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.7,
              duration: line.duration / 2,
              useNativeDriver: false,
            }),
            Animated.timing(bendAnim, {
              toValue: 1,
              duration: line.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(moveAnim, {
              toValue: { x: line.x1, y: line.y1 },
              duration: line.duration,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: line.duration / 2,
              useNativeDriver: false,
            }),
            Animated.timing(bendAnim, {
              toValue: 0,
              duration: line.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ]),
        ])
      ).start();
    };

    setTimeout(() => animate(), line.delay);
  }, []);

  // Create bend effect based on pan gesture
  const bendInterpolate = Animated.add(
    bendAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
    Animated.divide(pan.x, 10)
  );

  return (
    <Animated.View
      style={[
        styles.line,
        {
          left: moveAnim.x,
          top: moveAnim.y,
          opacity: opacityAnim,
          transform: [
            {
              rotateZ: bendInterpolate.interpolate({
                inputRange: [-20, 20],
                outputRange: ['-10deg', '10deg'],
              })
            },
          ],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  linesContainer: {
    marginTop: 60,
    width: 300,
    height: 300,
    alignSelf: 'center',
  },
  line: {
    position: 'absolute',
    width: 100,
    height: 1,
    backgroundColor: WHITE,
    shadowColor: WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: GRAY_700,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  phoneButton: {
    backgroundColor: WHITE,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  phoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  appleButton: {
    backgroundColor: GRAY_700,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  termsText: {
    fontSize: 11,
    color: GRAY_700,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
