import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import DataStore from '../utils/dataStore.js';

const API_URL = 'http://10.0.2.2:5000/api';

export default function AddCandidatesScreen({ route, navigation }) {
  const { electionId } = route.params;
  const [election, setElection] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [qualification, setQualification] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    loadElection();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });
    return () => backHandler.remove();
  }, [candidates.length]);

  const loadElection = async () => {
    const data = await DataStore.getElectionById(electionId);
    if (data) {
      setElection(data);
      setCandidates(data.candidates || []);
    }
    setLoading(false);
  };

  const handleAddCandidate = async () => {
    if (!candidateName.trim()) {
      Alert.alert('Error', 'Please enter candidate name');
      return;
    }

    if (!qualification.trim()) {
      Alert.alert('Error', 'Please enter register number');
      return;
    }

    setSubmitting(true);

    try {
      // Call API directly instead of through DataStore
      const response = await axios.post(`${API_URL}/candidates`, {
        electionId,
        name: candidateName.trim(),
        qualification: qualification.trim() || null,
        description: description.trim() || null,
      });

      if (response.data.success) {
        const newCandidate = response.data.candidate;
        setCandidates([...candidates, newCandidate]);
        Alert.alert('Success', 'Candidate added successfully');
        setCandidateName('');
        setQualification('');
        setDescription('');
      }
    } catch (error) {
      console.error('Add candidate error:', error);
      Alert.alert('Error', error.message || 'Failed to add candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setEditName(candidate.name);
    setEditQualification(candidate.qualification || '');
    setEditDescription(candidate.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter candidate name');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.put(
        `${API_URL}/candidates/${editingCandidate.id}`,
        {
          name: editName.trim(),
          qualification: editQualification.trim() || null,
          description: editDescription.trim() || null,
        }
      );

      if (response.data.success) {
        const updatedCandidates = candidates.map((c) =>
          c.id === editingCandidate.id
            ? {
                ...c,
                name: editName.trim(),
                qualification: editQualification.trim() || null,
                description: editDescription.trim() || null,
              }
            : c
        );
        setCandidates(updatedCandidates);
        setEditModalVisible(false);
        Alert.alert('Success', 'Candidate updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert('Error', 'Failed to update candidate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = (candidate) => {
    Alert.alert(
      'Delete Candidate',
      `Are you sure you want to delete ${candidate.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_URL}/candidates/${candidate.id}`
              );

              if (response.data.success) {
                setCandidates(candidates.filter((c) => c.id !== candidate.id));
                Alert.alert('Success', 'Candidate deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete candidate');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete candidate');
            }
          },
        },
      ]
    );
  };

  const handleBackPress = () => {
    if (candidates.length === 0) {
      Alert.alert(
        'No Candidates Added',
        'You have not added any candidates yet. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Dashboard',
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
      Alert.alert(
        'Leave Page',
        'Your candidates are saved. You can edit them later from the dashboard.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Go to Dashboard',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'FacultyDashboard' }],
              });
            },
          },
        ]
      );
    }
  };

  const handleFinish = async () => {
    if (candidates.length === 0) {
      Alert.alert(
        'No Candidates',
        'You have not added any candidates yet. Are you sure you want to finish?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Finish Anyway',
            onPress: async () => {
              await DataStore.refreshElections();
              navigation.reset({
                index: 0,
                routes: [{ name: 'FacultyDashboard' }],
              });
            },
          },
        ]
      );
    } else {
      await DataStore.refreshElections();
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
        <Text style={styles.candidateInitial}>{item.name[0].toUpperCase()}</Text>
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

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCandidate(item)}
        >
          <Icon name="pencil" size={18} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCandidate(item)}
        >
          <Icon name="delete" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Icon name="alert-circle" size={60} color="#FF6F00" />
        <Text style={styles.loadingText}>Election not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Candidates</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Icon name="check" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
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
              <Text style={styles.detailText}>{candidates.length} Candidates</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.formIconContainer}>
              <Icon name="account-plus" size={24} color="#FF6F00" />
            </View>
            <Text style={styles.formTitle}>Add Candidate</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Candidate Name"
            value={candidateName}
            onChangeText={setCandidateName}
            placeholderTextColor="#999999"
            editable={!submitting}
          />

          <TextInput
            style={styles.input}
            placeholder="Register Number"
            value={qualification}
            onChangeText={setQualification}
            placeholderTextColor="#999999"
            editable={!submitting}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            placeholderTextColor="#999999"
            editable={!submitting}
          />

          <TouchableOpacity onPress={handleAddCandidate} disabled={submitting}>
            <LinearGradient
              colors={['#FF6F00', '#FF8F00']}
              style={styles.addButton}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="plus" size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Candidate</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.candidatesHeader}>
          <Text style={styles.candidatesTitle}>Added Candidates</Text>
          <View style={styles.candidatesCountBadge}>
            <Text style={styles.candidatesCountText}>{candidates.length}</Text>
          </View>
        </View>

        {candidates.length > 0 ? (
          <FlatList
            data={candidates}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            extraData={candidates}
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

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Candidate</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Candidate Name"
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor="#999999"
              editable={!submitting}
            />

            <TextInput
              style={styles.input}
              placeholder="Register Number"
              value={editQualification}
              onChangeText={setEditQualification}
              placeholderTextColor="#999999"
              editable={!submitting}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={2}
              placeholderTextColor="#999999"
              editable={!submitting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSaveEdit} disabled={submitting}>
                <LinearGradient
                  colors={['#FF6F00', '#FF8F00']}
                  style={styles.modalSaveButton}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Icon name="content-save" size={20} color="#FFFFFF" />
                      <Text style={styles.modalSaveText}>Save</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  finishButton: { padding: 4 },
  content: { flex: 1, padding: 16 },
  electionCard: { padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4 },
  electionTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  electionDetails: { flexDirection: 'row', gap: 12 },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  detailText: { color: '#FFFFFF', fontWeight: 'bold' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4 },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  formIconContainer: { backgroundColor: '#FF6F0010', borderRadius: 8, padding: 8, marginRight: 12 },
  formTitle: { fontSize: 20, fontWeight: 'bold' },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  candidatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidatesTitle: { fontSize: 18, fontWeight: 'bold', color: '#424242' },
  candidatesCountBadge: { backgroundColor: '#FF6F00', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  candidatesCountText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  candidateInitial: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  qualificationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  qualification: { fontSize: 12, color: '#666666', fontStyle: 'italic' },
  description: { fontSize: 12, color: '#666666' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#2196F315', padding: 10, borderRadius: 8 },
  deleteButton: { backgroundColor: '#F4433615', padding: 10, borderRadius: 8 },
  emptyState: { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#666666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: 'bold', color: '#666666' },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});