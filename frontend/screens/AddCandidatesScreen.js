import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon} from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function AddCandidatesScreen({ route, navigation }) {
  const { election } = route.params;
  const [candidateName, setCandidateName] = useState('');
  const [qualification, setQualification] = useState('');
  const [description, setDescription] = useState('');

  const handleAddCandidate = () => {
    if (!candidateName.trim()) {
      Alert.alert('Error', 'Please enter candidate name');
      return;
    }

    try {
      DataStore.addCandidateToElection(
        election.id,
        candidateName.trim(),
        description.trim() || null,
        qualification.trim() || null
      );

      Alert.alert('Success', `${candidateName.trim()} added successfully`);

      setCandidateName('');
      setQualification('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFinish = () => {
    if (election.candidates.length === 0) {
      Alert.alert(
        'No Candidates',
        "You haven't added any candidates yet. Are you sure you want to finish?",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Finish Anyway',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'FacultyDashboard' }],
              });
            },
          },
        ]
      );
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'FacultyDashboard' }],
      });
    }
  };

  const renderCandidate = ({ item, index }) => (
    <View style={styles.candidateCard}>
      <LinearGradient
        colors={['#FF6F00', '#FF8F00']}
        style={styles.candidateAvatar}
      >
        <Text style={styles.candidateInitial}>
          {item.name[0].toUpperCase()}
        </Text>
      </LinearGradient>

      <View style={styles.candidateInfo}>
        <Text style={styles.candidateName}>{item.name}</Text>
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

      <View style={styles.addedBadge}>
        <Icon name="check-circle" size={16} color="#4CAF50" />
        <Text style={styles.addedText}>Added</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.header}>
        <Text style={styles.headerTitle}>Add Candidates</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Icon name="check" size={24} color="#FFFFFF" />
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Election Info */}
        <LinearGradient
          colors={['#FF6F00', '#FF8F00']}
          style={styles.electionCard}
        >
          <Text style={styles.electionTitle}>{election.title}</Text>
          <View style={styles.electionDetails}>
            <View style={styles.detailBadge}>
              <Icon name="tag" size={16} color="#FFFFFF" />
              <Text style={styles.detailText}>ID: {election.id}</Text>
            </View>
            <View style={styles.detailBadge}>
              <Icon name="account-group" size={16} color="#FFFFFF" />
              <Text style={styles.detailText}>
                {election.candidates.length} Candidates
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Add Candidate Form */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.formIconContainer}>
              <Icon name="account-plus" size={24} color="#FF6F00" />
            </View>
            <Text style={styles.formTitle}>Add Candidate</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Candidate Name *"
            value={candidateName}
            onChangeText={setCandidateName}
            placeholderTextColor="#999999"
          />

          <TextInput
            style={styles.input}
            placeholder="Qualification (Optional)"
            value={qualification}
            onChangeText={setQualification}
            placeholderTextColor="#999999"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            placeholderTextColor="#999999"
          />

          <TouchableOpacity onPress={handleAddCandidate}>
            <LinearGradient
              colors={['#FF6F00', '#FF8F00']}
              style={styles.addButton}
            >
              <Icon name="plus" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Candidate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Candidates List */}
        {election.candidates.length > 0 ? (
          <FlatList
            data={election.candidates}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-plus" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Candidates Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add candidates using the form above
            </Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  electionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  electionDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  detailText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formIconContainer: {
    backgroundColor: '#FF6F0010',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    color: '#000000',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
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
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5010',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
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