import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function StudentDashboard({ navigation }) {
  const { isCompact, horizontalPadding, headerTopPadding } = useResponsiveLayout();
  const [electionIdInput, setElectionIdInput] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joinedElections, setJoinedElections] = useState([]);
  const electionIdPattern = /^[A-Z]{2}\d{4}$/;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    setLoading(true);
    await DataStore.refreshElections();
    setJoinedElections(DataStore.getStudentJoinedElections());
    setLoading(false);
  };

  const refreshData = async () => {
    await DataStore.refreshElections();
    setJoinedElections(DataStore.getStudentJoinedElections());
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

  const handleJoinElection = async () => {
    const normalizedElectionId = electionIdInput.trim().toUpperCase();

    if (!normalizedElectionId) {
      Alert.alert('Error', 'Please enter an Election ID');
      return;
    }
    if (!electionIdPattern.test(normalizedElectionId)) {
      Alert.alert('Error', 'Election ID must be 2 letters + 4 numbers (example: AB1234)');
      return;
    }

    const alreadyJoined = DataStore.studentJoinedElectionIds.includes(
      normalizedElectionId
    );
    if (alreadyJoined) {
      Alert.alert('Already Joined', 'You have already joined this election');
      setElectionIdInput('');
      return;
    }

    setLoading(true);
    const election = await DataStore.getElectionById(normalizedElectionId);
    setLoading(false);

    if (!election) {
      Alert.alert('Error', 'Invalid Election ID. Please check and try again.');
      return;
    }

    DataStore.addStudentJoinedElection(election);
    setJoinedElections(DataStore.getStudentJoinedElections());
    setElectionIdInput('');
    navigation.navigate('Voting', { electionId: election.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A1B9A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6A1B9A', '#9C27B0']}
        style={[styles.header, { paddingTop: headerTopPadding }]}
      >
        <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>Student Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={[styles.fixedTop, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Profile')}>
          <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={[styles.welcomeCard, isCompact && styles.welcomeCardCompact]}>
            <View style={styles.welcomeIconContainer}>
              <Icon name="account" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeLabel}>Welcome back</Text>
              <Text style={[styles.welcomeName, isCompact && styles.welcomeNameCompact]} numberOfLines={1}>
                {DataStore.currentUser?.fullName || 'Student'}
              </Text>
            </View>
            <View style={styles.welcomeStats}>
              <Text style={styles.welcomeStatValue}>{joinedElections.length}</Text>
              <Text style={styles.welcomeStatLabel}>Elections</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[
              styles.sectionTab,
              styles.leftTab,
              activeSection === 'join' && styles.sectionTabActive,
            ]}
            onPress={() => setActiveSection('join')}
          >
            <Icon
              name="login"
              size={20}
              color={activeSection === 'join' ? '#FFFFFF' : '#6A1B9A'}
            />
            <Text
              style={[
                styles.sectionTabText,
                activeSection === 'join' && styles.sectionTabTextActive,
              ]}
            >
              Join Election
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sectionTab,
            ]}
            onPress={() => navigation.navigate('StudentMyElections')}
          >
            <Icon
              name="format-list-bulleted"
              size={20}
              color="#6A1B9A"
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
        {activeSection === 'join' && (
          <View style={styles.joinCard}>
            <View style={styles.joinHeader}>
              <View style={styles.joinIconContainer}>
                <Icon name="login" size={22} color="#6A1B9A" />
              </View>
              <Text style={styles.joinTitle}>Join Election</Text>
            </View>
            <TextInput
              style={styles.joinInput}
              placeholder="Enter Election ID (AB1234)"
              placeholderTextColor="#999999"
              value={electionIdInput}
              onChangeText={(value) => setElectionIdInput(value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
              maxLength={6}
            />
            <TouchableOpacity onPress={handleJoinElection}>
              <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={styles.joinButton}>
                <Icon name="vote" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Election</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {!activeSection && (
          <View style={styles.placeholderCard}>
            <Icon name="gesture-tap-button" size={38} color="#6A1B9A" />
            <Text style={styles.placeholderTitle}>Choose a Section</Text>
            <Text style={styles.placeholderSubtitle}>
              Tap Join Election or My Elections to continue
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
  welcomeCardCompact: { padding: 14 },
  welcomeIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 12, marginRight: 16 },
  welcomeTextContainer: { flex: 1 },
  welcomeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  welcomeName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 },
  welcomeNameCompact: { fontSize: 17 },
  welcomeStats: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10 },
  welcomeStatValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  welcomeStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  sectionTabs: { flexDirection: 'row' },
  sectionTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6A1B9A20',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  leftTab: { marginRight: 10 },
  sectionTabActive: {
    backgroundColor: '#6A1B9A',
    borderColor: '#6A1B9A',
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  sectionTabTextActive: {
    color: '#FFFFFF',
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    marginTop: 4,
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 10,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 6,
    textAlign: 'center',
  },
  joinCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 4 },
  joinHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  joinIconContainer: { backgroundColor: '#6A1B9A10', borderRadius: 8, padding: 8, marginRight: 12 },
  joinTitle: { fontSize: 20, fontWeight: 'bold' },
  joinInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#FAFAFA', color: '#000000' },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  joinButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
