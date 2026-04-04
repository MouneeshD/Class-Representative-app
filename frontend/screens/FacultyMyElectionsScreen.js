import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';
import { useResponsiveLayout } from '../utils/responsive.js';

export default function FacultyMyElectionsScreen({ navigation }) {
  const { isCompact, horizontalPadding, headerTopPadding } = useResponsiveLayout();
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

  const getElectionStatus = (election) =>
    election.isClosed
      ? { label: 'Closed', color: '#999999', bg: '#99999915', icon: 'lock' }
      : { label: 'Active', color: '#4CAF50', bg: '#4CAF5015', icon: 'check-circle' };

  const renderElectionCard = (election) => {
    const status = getElectionStatus(election);
    const isClosed = election.isClosed;
    const turnout = election.maxVotes > 0
      ? Math.min(Math.round((election.currentVoteCount / election.maxVotes) * 100), 100)
      : 0;

    return (
      <TouchableOpacity
        key={election.id}
        style={[styles.electionCard, isClosed && styles.closedCard]}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('FacultyElectionActions', { electionId: election.id })}
      >
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitle} numberOfLines={1}>{election.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={13} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.electionIdContainer}>
          <Icon name="tag" size={18} color="#FF6F00" />
          <Text style={styles.electionId}>ID: {election.id}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="account-group" size={15} color="#666666" />
            <Text style={styles.statText}>{election.currentVoteCount}/{election.maxVotes} votes</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="account-multiple" size={15} color="#666666" />
            <Text style={styles.statText}>{election.candidates.length} candidates</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="poll" size={15} color="#666666" />
            <Text style={styles.statText}>{turnout}% turnout</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${turnout}%`, backgroundColor: isClosed ? '#999999' : '#FF6F00' },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.sectionBadgeText}>{myElections.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {myElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>Create elections from Faculty Dashboard</Text>
          </View>
        ) : (
          myElections.map(renderElectionCard)
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
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerTitleCompact: { fontSize: 19 },
  fixedTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242' },
  sectionBadge: { backgroundColor: '#FF6F00', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionBadgeText: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  electionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  closedCard: { borderLeftWidth: 4, borderLeftColor: '#999999' },
  electionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  electionTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  electionIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6F0010', padding: 10, borderRadius: 8, marginBottom: 12, gap: 8 },
  electionId: { fontSize: 15, fontWeight: 'bold', color: '#FF6F00', flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#666666' },
  progressBarContainer: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', borderRadius: 3 },
  emptyState: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 },
});
