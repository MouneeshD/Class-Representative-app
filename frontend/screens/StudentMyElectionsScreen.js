import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function StudentMyElectionsScreen({ navigation }) {
  const { isCompact, horizontalPadding, headerTopPadding } = useResponsiveLayout();
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

  const getElectionStatus = (election) => {
    const hasVoted = election.hasStudentVoted(DataStore.currentUserRegNo || '');
    const isClosed = election.isClosed;

    if (hasVoted && isClosed) {
      return { label: 'Closed', color: '#9C27B0', bg: '#9C27B015', icon: 'lock' };
    }
    if (hasVoted) {
      return { label: 'Voted', color: '#2196F3', bg: '#2196F315', icon: 'check-circle' };
    }
    if (isClosed) {
      return { label: 'Closed', color: '#999999', bg: '#99999915', icon: 'lock' };
    }
    return { label: 'Active', color: '#FF6F00', bg: '#FF6F0015', icon: 'clock-outline' };
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
    const turnout = election.maxVotes > 0
      ? Math.min(Math.round((election.currentVoteCount / election.maxVotes) * 100), 100)
      : 0;

    return (
      <TouchableOpacity
        key={election.id}
        style={[styles.electionCard, hasVoted && isClosed && styles.resultReadyCard]}
        onPress={() => handleElectionCardPress(election)}
        activeOpacity={0.7}
      >
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitle} numberOfLines={1}>{election.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.electionIdContainer}>
          <Icon name="tag" size={16} color="#6A1B9A" />
          <Text style={styles.electionId}>ID: {election.id}</Text>
        </View>

        <View style={styles.electionInfo}>
          <View style={styles.infoItem}>
            <Icon name="account-group" size={16} color="#666666" />
            <Text style={styles.infoText}>{election.candidates.length} candidates</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={14} color="#666666" />
            <Text style={styles.infoText}>{new Date(election.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${turnout}%`, backgroundColor: isClosed ? '#999999' : '#6A1B9A' },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A1B9A" />
        <Text style={styles.loadingText}>Loading elections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6A1B9A', '#9C27B0']}
        style={[styles.header, { paddingTop: headerTopPadding }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>My Elections</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.fixedTitleRow, { paddingHorizontal: horizontalPadding }]}>
        <Text style={styles.sectionTitle}>My Elections</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionCount}>{joinedElections.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {joinedElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>Join elections from Student Dashboard</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 16, color: '#666666' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerTitleCompact: { fontSize: 19 },
  fixedTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242' },
  sectionBadge: { backgroundColor: '#6A1B9A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionCount: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
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
  progressBarContainer: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  emptyState: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 },
});
