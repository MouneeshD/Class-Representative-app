import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const bootstrap = async () => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      const user = await DataStore.restoreSession();
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1400));
      await minDelay;

      const hasValidSession = user ? await DataStore.refreshElections() : false;

      if (user?.role === 'student' && hasValidSession) {
        navigation.reset({ index: 0, routes: [{ name: 'StudentDashboard' }] });
      } else if (user?.role === 'faculty' && hasValidSession) {
        navigation.reset({ index: 0, routes: [{ name: 'FacultyDashboard' }] });
      } else {
        await DataStore.logout();
        navigation.reset({ index: 0, routes: [{ name: 'LoginSelection' }] });
      }
    };

    bootstrap();
  }, []);

  return (
    <LinearGradient
      colors={['#6A1B9A', '#9C27B0', '#FF6F00']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <Icon name="vote" size={100} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>CR Voting App</Text>
        <Text style={styles.subtitle}>Digital Class Representative Elections</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
});
