import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../../utils/dataStore.js';

export default function FacultyDashboard({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [_, forceUpdate] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      forceUpdate(n => n + 1);
      setRefreshing(false);
    }, 500);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          DataStore.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'LoginSelection' }],
          });
        },
      },
    ]);
  };

  const handleToggleResults = (election) => {
    DataStore.toggleElectionResults(election.id);
    Alert.alert(
      'Success',
      election.resultsPublished
        ? 'Results Published - Students can now view'
        : 'Results Hidden from Students'
    );
    forceUpdate(n => n + 1);
  };

  const allElections = DataStore.getAllElections();
  const activeElections = DataStore.getActiveElections();
  const totalVotes = allElections.reduce(
    (sum, e) => sum + e.currentVoteCount,
    0
  );

  const renderElectionCard = (election) => {
    const isClosed = election.isVotingClosed;

    return (
      <TouchableOpacity
        key={election.id}
        style={styles.electionCard}
        onPress={() => navigation.navigate('Results', { election })}
        activeOpacity={0.7}
      >
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitle}>{election.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isClosed ? '#99999910' : '#4CAF5010' },
            ]}
          >
            <Icon
              name={isClosed ? 'lock' : 'check-circle'}
              size={16}
              color={isClosed ? '#999999' : '#4CAF50'}
            />
            <Text
              style={[
                styles.statusText,
                { color: isClosed ? '#999999' : '#4CAF50' },
              ]}
            >
              {isClosed ? 'Closed' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.electionIdContainer}>
          <Icon name="tag" size={20} color="#FF6F00" />
          <Text style={styles.electionId}>ID: {election.id}</Text>
        </View>

        <View style={styles.electionInfo}>
          <View style={styles.infoItem}>
            <Icon name="account-group" size={18} color="#666666" />
            <Text style={styles.infoText}>
              {election.currentVoteCount} / {election.maxVotes} votes
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="account-multiple" size={18} color="#666666" />
            <Text style={styles.infoText}>
              {election.candidates.length} candidates
            </Text>
          </View>
        </View>

        <View style={styles.dateInfo}>
          <Icon name="calendar" size={16} color="#666666" />
          <Text style={styles.dateText}>
            {new Date(election.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.publishButton,
            {
              backgroundColor: election.resultsPublished
                ? '#4CAF50'
                : '#FF6F00',
            },
          ]}
          onPress={() => handleToggleResults(election)}
        >
          <Icon
            name={election.resultsPublished ? 'eye' : 'eye-off'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.publishButtonText}>
            {election.resultsPublished ? 'Results Published' : 'Publish Results'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Card */}
        <LinearGradient
          colors={['#FF6F00', '#FF8F00']}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeIconContainer}>
            <Icon name="account-tie" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeLabel}>Welcome back!</Text>
            <Text style={styles.welcomeName}>
              {DataStore.currentUserName || 'Faculty'}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="vote" size={28} color="#6A1B9A" />
            <Text style={[styles.statValue, { color: '#6A1B9A' }]}>
              {allElections.length}
            </Text>
            <Text style={styles.statLabel}>Total Elections</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="clock-outline" size={28} color="#FF6F00" />
            <Text style={[styles.statValue, { color: '#FF6F00' }]}>
              {activeElections.length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="account-group" size={28} color="#4CAF50" />
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {totalVotes}
            </Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>

        {/* Elections List */}
        <Text style={styles.sectionTitle}>All Elections</Text>

        {allElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button below to create your first election
            </Text>
          </View>
        ) : (
          allElections.map(renderElectionCard)
        )}
      </ScrollView>

      {/* Floating Action Button */}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 12,
    marginRight: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  electionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  electionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  electionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  electionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F0010',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  electionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  electionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});