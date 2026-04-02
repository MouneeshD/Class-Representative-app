import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DataStore from '../utils/dataStore.js';

export default function CreateElectionScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [maxVotes, setMaxVotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateElection = async () => {
    if (!title.trim() || !maxVotes.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const votes = parseInt(maxVotes);
    if (isNaN(votes) || votes < 1) {
      Alert.alert('Error', 'Please enter a valid number (minimum 1)');
      return;
    }

    setLoading(true);

    try {
      const election = await DataStore.createElection(title.trim(), votes);

      if (election) {
        Alert.alert(
          'Election Created',
          `Election ID: ${election.id}\n\nShare this ID with students`,
          [
            {
              text: 'Add Candidates',
              onPress: () => {
                // Pass only electionId, not full object
                navigation.replace('AddCandidates', { electionId: election.id });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create election');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6F00', '#FF8F00']} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Election</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
        >
          <ScrollView style={styles.content}>
        <LinearGradient
          colors={['#FF6F00', '#FF8F00']}
          style={styles.infoCard}
        >
          <Icon name="clipboard-check" size={40} color="#FFFFFF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>New Election</Text>
            <Text style={styles.infoSubtitle}>Fill in the details below</Text>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Election Details</Text>

          <View style={styles.inputContainer}>
            <Icon name="text" size={24} color="#FF6F00" />
            <TextInput
              style={styles.input}
              placeholder="Election Title *"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#999999"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="account-group" size={24} color="#FF6F00" />
            <TextInput
              style={styles.input}
              placeholder="Maximum Votes Allowed *"
              value={maxVotes}
              onChangeText={setMaxVotes}
              keyboardType="number-pad"
              placeholderTextColor="#999999"
              editable={!loading}
            />
          </View>

          <TouchableOpacity onPress={handleCreateElection} disabled={loading}>
            <LinearGradient
              colors={['#FF6F00', '#FF8F00']}
              style={styles.createButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="plus-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Election</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    elevation: 8,
  },
  infoTextContainer: { flex: 1, marginLeft: 16 },
  infoTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  infoSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  formLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    elevation: 4,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});