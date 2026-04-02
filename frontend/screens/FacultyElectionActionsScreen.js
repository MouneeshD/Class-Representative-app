import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function FacultyElectionActionsScreen({ route, navigation }) {
  const { electionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState(null);

  useEffect(() => {
    loadElection();
  }, []);

  const loadElection = async () => {
    setLoading(true);
    const freshElection = await DataStore.getElectionById(electionId);
    setElection(freshElection);
    setLoading(false);
  };

  const handleCloseElection = async () => {
    if (!election) return;
    const action = election.isClosed ? 'Reopen' : 'Close';
    Alert.alert(
      `${action} Election`,
      `Are you sure you want to ${action.toLowerCase()} "${election.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: election.isClosed ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await DataStore.closeElection(election.id);
              await loadElection();
            } catch (error) {
              Alert.alert('Error', 'Failed to update election status');
            }
          },
        },
      ]
    );
  };

  const handleDeleteElection = () => {
    if (!election) return;
    Alert.alert(
      'Delete Election',
      `Delete "${election.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataStore.deleteElection(election.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete election');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
        <Text style={styles.loadingText}>Loading election...</Text>
      </View>
    );
  }

  if (!election) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Election not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Election Actions</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.title}>{election.title}</Text>
          <Text style={styles.subTitle}>Election ID: {election.id}</Text>
          <Text style={[styles.status, { color: election.isClosed ? '#757575' : '#4CAF50' }]}>
            {election.isClosed ? 'Closed' : 'Active'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddCandidates', { electionId: election.id })}
        >
          <Icon name="pencil" size={18} color="#2196F3" />
          <Text style={[styles.actionText, { color: '#2196F3' }]}>Edit Candidates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteElection}>
          <Icon name="delete" size={18} color="#F44336" />
          <Text style={[styles.actionText, { color: '#F44336' }]}>Delete Election</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: election.isClosed ? '#4CAF50' : '#FF6F00' }]}
          onPress={handleCloseElection}
        >
          <Icon name={election.isClosed ? 'lock-open' : 'lock'} size={18} color={election.isClosed ? '#4CAF50' : '#FF6F00'} />
          <Text style={[styles.actionText, { color: election.isClosed ? '#4CAF50' : '#FF6F00' }]}>
            {election.isClosed ? 'Reopen Election' : 'Close Election'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resultButton}
          onPress={() => navigation.navigate('Results', { electionId: election.id })}
        >
          <Icon name="chart-bar" size={18} color="#FFFFFF" />
          <Text style={styles.resultText}>View Detailed Results</Text>
        </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 24 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333333' },
  subTitle: { fontSize: 13, color: '#666666', marginTop: 6 },
  status: { fontSize: 13, fontWeight: 'bold', marginTop: 8 },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    elevation: 1,
  },
  actionText: { fontSize: 15, fontWeight: '700' },
  resultButton: {
    marginTop: 4,
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resultText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});
