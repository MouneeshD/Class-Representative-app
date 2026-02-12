import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon} from '@expo/vector-icons';
import DataStore from '../../utils/dataStore.js';

export default function VotingScreen({ route, navigation }) {
  const { election } = route.params;
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const hasVoted = election.hasStudentVoted(DataStore.currentUserName || '');
  const isVotingClosed = election.isVotingClosed;

  const handleCastVote = () => {
    if (!selectedCandidateId) {
      Alert.alert('Warning', 'Please select a candidate');
      return;
    }

    try {
      DataStore.castVote(election.id, selectedCandidateId);

      Alert.alert(
        'Vote Submitted!',
        'Your vote has been recorded successfully',
        [
          {
            text: 'Close',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderCandidate = ({ item, index }) => {
    const isSelected = selectedCandidateId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.candidateCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => {
          if (!hasVoted && !isVotingClosed) {
            setSelectedCandidateId(item.id);
          }
        }}
        disabled={hasVoted || isVotingClosed}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={
            isSelected
              ? ['#6A1B9A', '#9C27B0']
              : ['#E0E0E0', '#BDBDBD']
          }
          style={styles.candidateAvatar}
        >
          <Text style={styles.candidateInitial}>
            {item.name[0].toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={styles.candidateInfo}>
          <Text
            style={[
              styles.candidateName,
              isSelected && { color: '#6A1B9A' },
            ]}
          >
            {item.name}
          </Text>
          <Text style={styles.candidateNumber}>Candidate #{index + 1}</Text>

          {item.qualification && (
            <View style={styles.qualificationContainer}>
              <Icon name="school" size={14} color="#666666" />
              <Text style={styles.qualification}>{item.qualification}</Text>
            </View>
          )}

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <Icon
          name={isSelected ? 'check-circle' : 'circle-outline'}
          size={32}
          color={isSelected ? '#6A1B9A' : '#CCCCCC'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6A1B9A', '#9C27B0']} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cast Your Vote</Text>
        <TouchableOpacity>
          
        </TouchableOpacity>
      </LinearGradient>

      {/* Election Info Card */}
      <LinearGradient
        colors={['#6A1B9A', '#9C27B0']}
        style={styles.electionCard}
      >
        <Text style={styles.electionTitle}>{election.title}</Text>

        <View style={styles.electionIdBadge}>
          <Text style={styles.electionIdText}>Election ID: {election.id}</Text>
        </View>

        <View style={styles.voteInfo}>
          <Icon name="account-group" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.voteInfoText}>
            {election.currentVoteCount} / {election.maxVotes} votes cast
          </Text>
        </View>

        {(hasVoted || isVotingClosed) && (
          <View
            style={[
              styles.warningBadge,
              { backgroundColor: hasVoted ? '#4CAF5030' : '#FF980030' },
            ]}
          >
            <Icon
              name={hasVoted ? 'check-circle' : 'lock'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.warningText}>
              {hasVoted
                ? 'You have already voted in this election'
                : 'Voting is closed for this election'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Candidates List */}
      <FlatList
        data={election.candidates}
        renderItem={renderCandidate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-off" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Candidates Available</Text>
            <Text style={styles.emptySubtitle}>
              Candidates will appear here once added
            </Text>
          </View>
        }
      />

      {/* Vote Button */}
      {!hasVoted && !isVotingClosed && election.candidates.length > 0 && (
        <View style={styles.voteButtonContainer}>
          <TouchableOpacity onPress={handleCastVote}>
            <LinearGradient
              colors={['#6A1B9A', '#9C27B0']}
              style={styles.voteButton}
            >
              <Icon name="vote" size={24} color="#FFFFFF" />
              <Text style={styles.voteButtonText}>Submit Vote</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultButton: {
    padding: 4,
  },
  electionCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  electionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  electionIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  electionIdText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#6A1B9A',
    backgroundColor: '#6A1B9A05',
    shadowColor: '#6A1B9A',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  candidateAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  candidateInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  candidateNumber: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  qualificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  qualification: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 12,
    color: '#666666',
  },
  voteButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#6A1B9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
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