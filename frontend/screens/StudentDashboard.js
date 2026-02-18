import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function StudentDashboard({ navigation }) {
  const [electionIdInput, setElectionIdInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joinedElections, setJoinedElections] = useState([]);

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
    if (!electionIdInput.trim()) {
      Alert.alert('Error', 'Please enter an Election ID');
      return;
    }

    const alreadyJoined = DataStore.studentJoinedElectionIds.includes(
      electionIdInput.trim()
    );
    if (alreadyJoined) {
      Alert.alert('Already Joined', 'You have already joined this election');
      setElectionIdInput('');
      return;
    }

    setLoading(true);
    const election = await DataStore.getElectionById(electionIdInput.trim());
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

  const getElectionStatus = (election) => {
    const hasVoted = election.hasStudentVoted(DataStore.currentUserRegNo || '');
    const isClosed = election.isClosed;

    if (hasVoted && isClosed) {
      return { label: 'Closed', color: '#9C27B0', bg: '#9C27B015', icon: 'lock' };
    } else if (hasVoted) {
      return { label: 'Voted', color: '#2196F3', bg: '#2196F315', icon: 'check-circle' };
    } else if (isClosed) {
      return { label: 'Closed', color: '#999999', bg: '#99999915', icon: 'lock' };
    } else {
      return { label: 'Active', color: '#FF6F00', bg: '#FF6F0015', icon: 'clock-outline' };
    }
  };

  const handleElectionCardPress = (election) => {
    const hasVoted = election.hasStudentVoted(DataStore.currentUserRegNo || '');
    const isClosed = election.isClosed;

    if (hasVoted && isClosed) {
      navigation.navigate('Results', { electionId: election.id });
    } else if (hasVoted && !isClosed) {
      Alert.alert(
        'Election Still Active',
        'You have already voted. Results will be available once the faculty closes this election.'
      );
    } else if (!hasVoted && isClosed) {
      Alert.alert('Voting Closed', 'This election has been closed by the faculty.');
    } else {
      navigation.navigate('Voting', { electionId: election.id });
    }
  };

  const renderElectionCard = (election) => {
    const hasVoted = election.hasStudentVoted(DataStore.currentUserRegNo || '');
    const isClosed = election.isClosed;
    const status = getElectionStatus(election);
    const turnoutPercent =
      election.maxVotes > 0
        ? Math.min(Math.round((election.currentVoteCount / election.maxVotes) * 100), 100)
        : 0;

    return (
      <TouchableOpacity
        key={election.id}
        style={[
          styles.electionCard,
          hasVoted && isClosed && styles.resultReadyCard,
        ]}
        onPress={() => handleElectionCardPress(election)}
        activeOpacity={0.7}
      >
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitle} numberOfLines={1}>
            {election.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.electionIdContainer}>
          <Icon name="tag" size={16} color="#6A1B9A" />
          <Text style={styles.electionId}>ID: {election.id}</Text>
        </View>

        <View style={styles.electionInfo}>
          <View style={styles.infoItem}>
            <Icon name="account-group" size={16} color="#666666" />
            <Text style={styles.infoText}>
              {election.currentVoteCount} / {election.maxVotes} votes
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={14} color="#666666" />
            <Text style={styles.infoText}>
              {new Date(election.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${turnoutPercent}%`,
                backgroundColor: isClosed ? '#999999' : '#6A1B9A',
              },
            ]}
          />
        </View>

        <View style={styles.actionRow}>
          {hasVoted && isClosed && (
            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={() => navigation.navigate('Results', { electionId: election.id })}
            >
              <Icon name="trophy" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>View Results</Text>
            </TouchableOpacity>
          )}

          {hasVoted && !isClosed && (
            <View style={styles.waitingRow}>
              <Icon name="clock-outline" size={16} color="#2196F3" />
              <Text style={styles.waitingText}>
                Vote submitted. Waiting for faculty to close election
              </Text>
            </View>
          )}

          {!hasVoted && !isClosed && (
            <TouchableOpacity
              style={styles.voteNowButton}
              onPress={() => navigation.navigate('Voting', { electionId: election.id })}
            >
              <Icon name="vote" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Vote Now</Text>
            </TouchableOpacity>
          )}

          {!hasVoted && isClosed && (
            <View style={styles.closedRow}>
              <Icon name="lock" size={16} color="#999999" />
              <Text style={styles.closedText}>Election closed by faculty</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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
      <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={styles.header}>
        <Text style={styles.headerTitle}>Student Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={styles.welcomeCard}>
          <View style={styles.welcomeIconContainer}>
            <Icon name="account" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeLabel}>Welcome back</Text>
            <Text style={styles.welcomeName}>
              {DataStore.currentUser?.fullName || 'Student'}
            </Text>
          </View>
          <View style={styles.welcomeStats}>
            <Text style={styles.welcomeStatValue}>{joinedElections.length}</Text>
            <Text style={styles.welcomeStatLabel}>Elections</Text>
          </View>
        </LinearGradient>

        <View style={styles.joinCard}>
          <View style={styles.joinHeader}>
            <View style={styles.joinIconContainer}>
              <Icon name="login" size={22} color="#6A1B9A" />
            </View>
            <Text style={styles.joinTitle}>Join Election</Text>
          </View>
          <TextInput
            style={styles.joinInput}
            placeholder="Enter 4-digit Election ID"
            placeholderTextColor="#999999"
            value={electionIdInput}
            onChangeText={setElectionIdInput}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TouchableOpacity onPress={handleJoinElection}>
            <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={styles.joinButton}>
              <Icon name="vote" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Join Election</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Elections</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionCount}>{joinedElections.length}</Text>
          </View>
        </View>

        {joinedElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>
              Enter an Election ID above to join and vote
            </Text>
          </View>
        ) : (
          joinedElections.map(renderElectionCard)
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
  logoutButton: { padding: 8 },
  content: { flex: 1, padding: 16 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4 },
  welcomeIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: 12, marginRight: 16 },
  welcomeTextContainer: { flex: 1 },
  welcomeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  welcomeName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 },
  welcomeStats: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10 },
  welcomeStatValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  welcomeStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  joinCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 4 },
  joinHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  joinIconContainer: { backgroundColor: '#6A1B9A10', borderRadius: 8, padding: 8, marginRight: 12 },
  joinTitle: { fontSize: 20, fontWeight: 'bold' },
  joinInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#FAFAFA', color: '#000000' },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  joinButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242' },
  sectionBadge: { backgroundColor: '#6A1B9A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionCount: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  electionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  resultReadyCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  electionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  electionTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  electionIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6A1B9A08', padding: 10, borderRadius: 8, marginBottom: 10, gap: 8 },
  electionId: { fontSize: 14, fontWeight: 'bold', color: '#6A1B9A' },
  electionInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: '#666666' },
  progressBarContainer: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 3 },
  actionRow: { marginTop: 4 },
  viewResultsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 10, gap: 8 },
  voteNowButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6A1B9A', paddingVertical: 10, borderRadius: 10, gap: 8 },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196F315', padding: 10, borderRadius: 10, gap: 8 },
  waitingText: { fontSize: 12, color: '#2196F3', fontWeight: '500', flex: 1 },
  closedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#99999915', padding: 10, borderRadius: 10, gap: 8 },
  closedText: { fontSize: 13, color: '#999999', fontWeight: '500' },
  emptyState: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 },
});