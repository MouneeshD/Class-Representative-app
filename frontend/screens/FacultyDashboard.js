import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function FacultyDashboard({ navigation }) {
  const { isCompact, horizontalPadding, headerTopPadding } = useResponsiveLayout();
  const [activeSection, setActiveSection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myElections, setMyElections] = useState([]);

  useEffect(() => {
    loadMyElections();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMyElections = async () => {
    setLoading(true);
    await DataStore.refreshElections();
    setMyElections(DataStore.getFacultyElections());
    setLoading(false);
  };

  const refreshData = async () => {
    await DataStore.refreshElections();
    setMyElections(DataStore.getFacultyElections());
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          DataStore.logout();
          navigation.reset({ index: 0, routes: [{ name: 'LoginSelection' }] });
        },
      },
    ]);
  };

  const activeCount = myElections.filter((e) => !e.isClosed).length;
  const closedCount = myElections.filter((e) => e.isClosed).length;
  const totalVotes = myElections.reduce((sum, e) => sum + e.currentVoteCount, 0);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
        <Text style={styles.loadingText}>Loading elections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6F00', '#FF8F00']}
        style={[styles.header, { paddingTop: headerTopPadding + 8 }]}
      >
        <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>Faculty Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={[styles.fixedTop, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Profile')}>
          <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Icon name="account-tie" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeLabel}>Welcome back</Text>
              <Text style={styles.welcomeName}>
                {DataStore.currentUser?.fullName || 'Faculty'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          {[
            { icon: 'vote', color: '#6A1B9A', value: myElections.length, label: 'My Elections' },
            { icon: 'check-circle', color: '#4CAF50', value: activeCount, label: 'Active' },
            { icon: 'lock', color: '#999999', value: closedCount, label: 'Closed' },
            { icon: 'account-group', color: '#FF6F00', value: totalVotes, label: 'Total Votes' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Icon name={s.icon} size={24} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[
              styles.sectionTab,
              activeSection === 'create' && styles.sectionTabActive,
            ]}
            onPress={() => setActiveSection('create')}
          >
            <Icon
              name="plus-circle"
              size={20}
              color={activeSection === 'create' ? '#FFFFFF' : '#FF6F00'}
            />
            <Text
              style={[
                styles.sectionTabText,
                activeSection === 'create' && styles.sectionTabTextActive,
              ]}
            >
              Create Election
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sectionTab,
            ]}
            onPress={() => navigation.navigate('FacultyMyElections')}
          >
            <Icon
              name="format-list-bulleted"
              size={20}
              color="#FF6F00"
            />
            <Text
              style={styles.sectionTabText}
            >
              My Elections
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeSection === 'create' && (
          <View style={styles.createCard}>
            <View style={styles.createIconWrap}>
              <Icon name="vote-outline" size={36} color="#FF6F00" />
            </View>
            <Text style={styles.createTitle}>Create New Election</Text>
            <Text style={styles.createSubtitle}>
              Create an election, add candidates, and share the election ID (AB1234 format) with students.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateElection')}
            >
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Go to Create Election</Text>
            </TouchableOpacity>
          </View>
        )}

        {!activeSection && (
          <View style={styles.placeholderCard}>
            <Icon name="gesture-tap-button" size={38} color="#FF6F00" />
            <Text style={styles.placeholderTitle}>Choose a Section</Text>
            <Text style={styles.placeholderSubtitle}>
              Tap Create Election or My Elections to continue
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666666' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerTitleCompact: { fontSize: 20 },
  logoutButton: { padding: 8 },
  fixedTop: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 14, elevation: 4 },
  welcomeIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 12, marginRight: 16 },
  welcomeTextContainer: { flex: 1 },
  welcomeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  welcomeName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 },
  sectionTabs: { flexDirection: 'row', gap: 10 },
  sectionTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF6F0025',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 2,
  },
  sectionTabActive: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  sectionTabTextActive: { color: '#FFFFFF' },
  createCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  createIconWrap: {
    backgroundColor: '#FF6F0015',
    borderRadius: 40,
    padding: 16,
    marginBottom: 12,
  },
  createTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242' },
  createSubtitle: { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  createButton: {
    backgroundColor: '#FF6F00',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    elevation: 2,
  },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginTop: 10 },
  placeholderSubtitle: { fontSize: 13, color: '#777777', marginTop: 6, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#666666', textAlign: 'center', marginTop: 2 },
});
