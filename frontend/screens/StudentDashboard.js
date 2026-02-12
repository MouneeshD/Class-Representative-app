import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function StudentDashboard({ navigation }) {
  const [electionId, setElectionId] = useState('');
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

  const handleJoinElection = () => {
    if (!electionId.trim()) {
      Alert.alert('Error', 'Please enter an Election ID');
      return;
    }

    const election = DataStore.getElectionById(electionId.trim());
    if (!election) {
      Alert.alert('Error', 'Invalid Election ID');
      return;
    }

    setElectionId('');
    navigation.navigate('Voting', { election });
  };

  const activeElections = DataStore.getActiveElections();

  const renderElectionCard = (election) => {
    const hasVoted = election.hasStudentVoted(DataStore.currentUserName || '');
    const canViewResults = election.resultsPublished && hasVoted;

    return (
      <TouchableOpacity
        key={election.id}
        style={styles.electionCard}
        onPress={() => {
          if (canViewResults) {
            navigation.navigate('Results', { election });
          } else {
            navigation.navigate('Voting', { election });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitle}>{election.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: hasVoted ? '#4CAF5010' : '#FF6F0010' },
            ]}
          >
            <Icon
              name={hasVoted ? 'check-circle' : 'clock-outline'}
              size={16}
              color={hasVoted ? '#4CAF50' : '#FF6F00'}
            />
            <Text
              style={[
                styles.statusText,
                { color: hasVoted ? '#4CAF50' : '#FF6F00' },
              ]}
            >
              {hasVoted ? 'Voted' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.electionIdContainer}>
          <Icon name="tag" size={20} color="#6A1B9A" />
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
            <Icon name="calendar" size={16} color="#666666" />
            <Text style={styles.infoText}>
              {new Date(election.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {canViewResults && (
          <TouchableOpacity
            style={styles.viewResultsButton}
            onPress={() => navigation.navigate('Results', { election })}
          >
            <Icon name="chart-bar" size={20} color="#FFFFFF" />
            <Text style={styles.viewResultsText}>View Results</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Card */}
        <LinearGradient
          colors={['#6A1B9A', '#9C27B0']}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeIconContainer}>
            <Icon name="account" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeLabel}>Welcome back!</Text>
            <Text style={styles.welcomeName}>
              {DataStore.currentUserName || 'Student'}
            </Text>
          </View>
        </LinearGradient>

        {/* Join Election Card */}
        <View style={styles.joinCard}>
          <View style={styles.joinHeader}>
            <View style={styles.joinIconContainer}>
              <Icon name="login" size={24} color="#6A1B9A" />
            </View>
            <Text style={styles.joinTitle}>Join Election</Text>
          </View>

          <TextInput
            style={styles.joinInput}
            placeholder="Enter 4-digit Election ID"
            value={electionId}
            onChangeText={setElectionId}
            keyboardType="number-pad"
            maxLength={4}
          />

          <TouchableOpacity onPress={handleJoinElection}>
            <LinearGradient
              colors={['#6A1B9A', '#9C27B0']}
              style={styles.joinButton}
            >
              <Icon name="vote" size={24} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Join Election</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Active Elections */}
        <Text style={styles.sectionTitle}>Active Elections</Text>

        {activeElections.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Active Elections</Text>
            <Text style={styles.emptySubtitle}>
              Use the Election ID above to join an election
            </Text>
          </View>
        ) : (
          activeElections.map(renderElectionCard)
        )}
      </ScrollView>
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
  joinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  joinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinIconContainer: {
    backgroundColor: '#6A1B9A10',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  joinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  joinInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#6A1B9A05',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  electionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  electionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  viewResultsText: {
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
});