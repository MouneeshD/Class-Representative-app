import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function LoginSelectionScreen({ navigation }) {
  const { isCompact, formPadding, headerTopPadding } = useResponsiveLayout();
  const handleRoleSelection = (role) => {
    navigation.navigate('Auth', { role });
  };

  return (
    <LinearGradient
      colors={['rgba(106, 27, 154, 0.05)', '#FFFFFF', 'rgba(255, 111, 0, 0.05)']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { padding: formPadding, paddingTop: Math.max(headerTopPadding + 18, 48) },
        ]}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#6A1B9A', '#9C27B0']}
            style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}
          >
            <Icon name="vote" size={isCompact ? 64 : 80} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>CR Voting App</Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelection('student')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#6A1B9A', '#9C27B0']}
              style={styles.cardIconContainer}
            >
              <Icon name="school" size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact, { color: '#6A1B9A' }]}>
              Student Login
            </Text>
            <Text style={styles.cardSubtitle}>
              Vote for your class representative
            </Text>
            <Icon name="arrow-right" size={24} color="#CCCCCC" style={styles.arrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelection('faculty')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF6F00', '#FF8F00']}
              style={styles.cardIconContainer}
            >
              <Icon name="account-tie" size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact, { color: '#FF6F00' }]}>
              Faculty Login
            </Text>
            <Text style={styles.cardSubtitle}>
              Create and manage elections
            </Text>
            <Icon name="arrow-right" size={24} color="#CCCCCC" style={styles.arrow} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    borderRadius: 100,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#6A1B9A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainerCompact: {
    padding: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  cardIconContainer: {
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardTitleCompact: {
    fontSize: 19,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  arrow: {
    marginTop: 8,
  },
});
