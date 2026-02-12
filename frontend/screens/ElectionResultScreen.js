import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function ElectionResultScreen({ route, navigation }) {
  const { election } = route.params;
  const winners = election.getWinners();
  const sortedCandidates = [...election.candidates].sort(
    (a, b) => b.voteCount - a.voteCount
  );

  const totalVotes = election.currentVoteCount || 1;
  const isTie = winners.length > 1;
  const maxVotes = winners.length > 0 ? winners[0].voteCount : 0;

  const renderCandidate = ({ item, index }) => {
    const isWinner = winners.some((w) => w.id === item.id);
    const percentage = ((item.voteCount / totalVotes) * 100).toFixed(1);

    return (
      <View
        style={[
          styles.candidateCard,
          isWinner && styles.winnerCard,
        ]}
      >
        <View style={styles.candidateHeader}>
          <LinearGradient
            colors={
              isWinner
                ? ['#FF6F00', '#FF8F00']
                : ['#E0E0E0', '#BDBDBD']
            }
            style={styles.candidateAvatar}
          >
            <Text style={styles.candidateInitial}>
              {item.name[0].toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.candidateInfo}>
            <View style={styles.positionRow}>
              <View
                style={[
                  styles.positionBadge,
                  {
                    backgroundColor: isWinner ? '#FF6F0020' : '#E0E0E0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.positionText,
                    { color: isWinner ? '#FF6F00' : '#666666' },
                  ]}
                >
                  #{index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.candidateName,
                  isWinner && { color: '#FF6F00' },
                ]}
              >
                {item.name}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <Icon name="chart-bar" size={16} color="#666666" />
              <Text style={styles.statsText}>
                {percentage}% • {item.voteCount}{' '}
                {item.voteCount === 1 ? 'vote' : 'votes'}
              </Text>
            </View>
          </View>

          {isWinner && (
            <Icon name="trophy" size={28} color="#FF6F00" />
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor: isWinner ? '#FF6F00' : '#6A1B9A',
              },
            ]}
          />
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Election Results</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Election Info Card */}
        <LinearGradient
          colors={['#6A1B9A', '#9C27B0']}
          style={styles.electionCard}
        >
          <View style={styles.electionHeader}>
            <Icon name="vote" size={32} color="#FFFFFF" />
            <Text style={styles.electionTitle}>{election.title}</Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.infoBadge}>
              <Icon name="tag" size={16} color="#FFFFFF" />
              <Text style={styles.badgeText}>ID: {election.id}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Icon name="account-group" size={16} color="#FFFFFF" />
              <Text style={styles.badgeText}>
                {election.currentVoteCount}/{election.maxVotes} Votes
              </Text>
            </View>
            <View style={styles.infoBadge}>
              <Icon
                name={election.isVotingClosed ? 'lock' : 'check-circle'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.badgeText}>
                {election.isVotingClosed ? 'Closed' : 'Active'}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Icon name="calendar" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.dateText}>
              Created: {new Date(election.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>

        {/* Winner Card */}
        {election.candidates.length > 0 && (
          <LinearGradient
            colors={isTie ? ['#FF9800', '#FF5722'] : ['#FFD700', '#FFA000']}
            style={styles.winnerCard}
          >
            <Icon
              name={isTie ? 'star-four-points' : 'trophy'}
              size={60}
              color="#FFFFFF"
            />
            <Text style={styles.winnerTitle}>
              {isTie ? "It's a Tie!" : 'Winner!'}
            </Text>

            {isTie ? (
              winners.map((winner, index) => (
                <Text key={index} style={styles.winnerName}>
                  {winner.name}
                </Text>
              ))
            ) : (
              <Text style={styles.winnerName}>{winners[0]?.name}</Text>
            )}

            <View style={styles.votesBadge}>
              <Text style={styles.votesText}>
                {maxVotes} {maxVotes === 1 ? 'Vote' : 'Votes'}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Detailed Results</Text>

        {/* Candidates List */}
        {election.candidates.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="account-off" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Candidates</Text>
            <Text style={styles.emptySubtitle}>
              No candidates have been added to this election yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedCandidates}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        {/* Statistics Card */}
        {election.candidates.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsIconContainer}>
                <Icon name="chart-line" size={24} color="#6A1B9A" />
              </View>
              <Text style={styles.statsTitle}>Statistics</Text>
            </View>

            <View style={styles.statRow}>
              <Icon name="vote" size={20} color="#666666" />
              <Text style={styles.statLabel}>Total Votes Cast</Text>
              <Text style={styles.statValue}>{election.currentVoteCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statRow}>
              <Icon name="account-group" size={20} color="#666666" />
              <Text style={styles.statLabel}>Total Candidates</Text>
              <Text style={styles.statValue}>{election.candidates.length}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statRow}>
              <Icon name="poll" size={20} color="#666666" />
              <Text style={styles.statLabel}>Voter Turnout</Text>
              <Text style={styles.statValue}>
                {election.maxVotes > 0
                  ? ((election.currentVoteCount / election.maxVotes) * 100).toFixed(1)
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statRow}>
              <Icon name="chart-bar" size={20} color="#666666" />
              <Text style={styles.statLabel}>Avg. Votes per Candidate</Text>
              <Text style={styles.statValue}>
                {election.candidates.length > 0
                  ? (election.currentVoteCount / election.candidates.length).toFixed(1)
                  : 0}
              </Text>
            </View>
          </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  electionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  electionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  electionTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  winnerCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  winnerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  winnerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  votesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  votesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  winnerCard: {
    borderColor: '#FF6F00',
    backgroundColor: '#FF6F0005',
    shadowColor: '#FF6F00',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  candidateInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  candidateInfo: {
    flex: 1,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIconContainer: {
    backgroundColor: '#6A1B9A10',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
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