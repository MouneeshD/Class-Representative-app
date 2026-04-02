import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function ProfileScreen({ navigation }) {
  const user = DataStore.currentUser || {};
  const isFaculty = user.role === 'faculty';
  const gradientColors = isFaculty ? ['#FF6F00', '#FF8F00'] : ['#6A1B9A', '#9C27B0'];
  const accentColor = isFaculty ? '#FF6F00' : '#6A1B9A';

  const rows = [
    { icon: 'account', label: 'Full Name', value: user.fullName || '-' },
    { icon: 'badge-account', label: 'Register Number', value: user.regNo || '-' },
    { icon: 'email-outline', label: 'Email', value: user.email || '-' },
    { icon: 'domain', label: 'Department', value: user.department || '-' },
    { icon: 'account-school', label: 'Role', value: user.role || '-' },
  ];

  if (user.role === 'student') {
    rows.push({ icon: 'calendar-account', label: 'Year', value: user.year || '-' });
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <LinearGradient colors={gradientColors} style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <Icon name={isFaculty ? 'account-tie' : 'account'} size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.heroName}>{user.fullName || 'User'}</Text>
          <Text style={styles.heroSub}>{(user.role || 'user').toUpperCase()}</Text>
        </LinearGradient>

        {rows.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}15` }]}>
              <Icon name={row.icon} size={18} color={accentColor} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 24 },
  profileHero: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarWrap: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  infoRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#757575' },
  infoValue: { fontSize: 16, color: '#212121', fontWeight: '600', marginTop: 2 },
});
