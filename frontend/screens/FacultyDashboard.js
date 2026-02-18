import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function FacultyDashboard({ navigation }) {
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

  const handleCloseElection = async (election) => {
    const action = election.isClosed ? 'Reopen' : 'Close';
    Alert.alert(
      `${action} Election`,
      `Are you sure you want to ${action.toLowerCase()} "${election.title}"?\n\n${
        election.isClosed
          ? 'Reopening will allow students to vote again.'
          : 'Closing will stop voting and allow students to view results.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: election.isClosed ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const newStatus = await DataStore.closeElection(election.id);
              Alert.alert(
                'Success',
                newStatus
                  ? 'Election Closed. Students can now view results'
                  : 'Election Reopened. Students can vote again'
              );
              await refreshData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update election status');
            }
          },
        },
      ]
    );
  };

  const handleDeleteElection = (election) => {
    Alert.alert(
      'Delete Election',
      `Are you sure you want to delete "${election.title}"?\n\nThis will permanently delete:\n- All candidates\n- All votes\n- All election data\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataStore.deleteElection(election.id);
              Alert.alert('Success', 'Election deleted successfully');
              await refreshData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete election');
            }
          },
        },
      ]
    );
  };

  const handleEditCandidates = (election) => {
    navigation.navigate('AddCandidates', { electionId: election.id });
  };

  const activeCount = myElections.filter((e) => !e.isClosed).length;
  const closedCount = myElections.filter((e) => e.isClosed).length;
  const totalVotes = myElections.reduce((sum, e) => sum + e.currentVoteCount, 0);

  const getElectionStatus = (election) => {
    if (election.isClosed) {
      return { label: 'Closed', color: '#999999', bg: '#99999915', icon: 'lock' };
    } else {
      return { label: 'Active', color: '#4CAF50', bg: '#4CAF5015', icon: 'check-circle' };
    }
  };

  const renderElectionCard = (election) => {
    const status = getElectionStatus(election);
    const isClosed = election.isClosed;
    const turnout =
      election.maxVotes > 0
        ? Math.min(Math.round((election.currentVoteCount / election.maxVotes) * 100), 100)
        : 0;

    return (
      <View
        key={election.id}
        style={[styles.electionCard, isClosed && styles.closedCard]}
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
          <Icon name="tag" size={18} color="#FF6F00" />
          <Text style={styles.electionId}>ID: {election.id}</Text>
          <Text style={styles.shareHint}>Share with students</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="account-group" size={15} color="#666666" />
            <Text style={styles.statText}>
              {election.currentVoteCount}/{election.maxVotes} votes
            </Text>
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

        <View style={styles.dateInfo}>
          <Icon name="calendar" size={13} color="#999999" />
          <Text style={styles.dateText}>
            Created: {new Date(election.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {election.candidates.length > 0 && (
          <View style={styles.candidatesPreview}>
            <Icon name="account-multiple" size={14} color="#666666" />
            <Text style={styles.candidatesPreviewText}>
              {election.candidates.slice(0, 3).map((c) => c.name).join(', ')}
              {election.candidates.length > 3 && ` +${election.candidates.length - 3} more`}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editCandidatesButton}
            onPress={() => handleEditCandidates(election)}
          >
            <Icon name="pencil" size={16} color="#2196F3" />
            <Text style={styles.editCandidatesText}>Edit Candidates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteElectionButton}
            onPress={() => handleDeleteElection(election)}
          >
            <Icon name="delete" size={16} color="#F44336" />
            <Text style={styles.deleteElectionText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.closeButton,
            { backgroundColor: isClosed ? '#4CAF50' : '#FF6F00' },
          ]}
          onPress={() => handleCloseElection(election)}
        >
          <Icon name={isClosed ? 'lock-open' : 'lock'} size={18} color="#FFFFFF" />
          <Text style={styles.closeButtonText}>
            {isClosed ? 'Reopen Election' : 'Close Election'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewResultsButton}
          onPress={() => navigation.navigate('Results', { electionId: election.id })}
        >
          <Icon name="chart-bar" size={18} color="#FF6F00" />
          <Text style={styles.viewResultsText}>View Detailed Results</Text>
        </TouchableOpacity>
      </View>
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
      <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.header}>
        <Text style={styles.headerTitle}>Faculty Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Elections</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{myElections.length}</Text>
          </View>
        </View>

        {myElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first election</Text>
          </View>
        ) : (
          myElections.map(renderElectionCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateElection')}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.fabGradient}>
          <Icon name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#666666', textAlign: 'center', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242' },
  sectionBadge: { backgroundColor: '#FF6F00', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionBadgeText: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  electionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  closedCard: { borderLeftWidth: 4, borderLeftColor: '#999999' },
  electionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  electionTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  electionIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6F0010', padding: 10, borderRadius: 8, marginBottom: 12, gap: 8 },
  electionId: { fontSize: 15, fontWeight: 'bold', color: '#FF6F00', flex: 1 },
  shareHint: { fontSize: 11, color: '#FF6F00', opacity: 0.8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#666666' },
  progressBarContainer: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', borderRadius: 3 },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dateText: { fontSize: 12, color: '#999999' },
  candidatesPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8, marginBottom: 12, gap: 6 },
  candidatesPreviewText: { fontSize: 12, color: '#666666', flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  editCandidatesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F310',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  editCandidatesText: { color: '#2196F3', fontWeight: 'bold', fontSize: 12 },
  deleteElectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4433610',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteElectionText: { color: '#F44336', fontWeight: 'bold', fontSize: 12 },
  closeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8, marginBottom: 8 },
  closeButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  viewResultsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, gap: 8, borderWidth: 1.5, borderColor: '#FF6F00', backgroundColor: '#FF6F0008' },
  viewResultsText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 13 },
  emptyState: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, borderRadius: 30, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});