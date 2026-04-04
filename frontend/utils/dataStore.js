import axiosInstance from './axiosInstance.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'http://10.0.2.2:5000/api'; // Use axiosInstance
// const API_URL = 'http://localhost:5000/api'; // iOS Simulator
//const API_URL = 'http://10.238.241.128:5000/api'; // Real Device

class DataStore {
  constructor() {
    this.elections = [];
    this.currentUser = null;
    this.currentUserRegNo = null;
    this.currentUserRole = null;
    this.studentJoinedElectionIds = [];
  }

  async register({ regNo, password, role, fullName, email, department, year = null }) {
    try {
      const response = await axiosInstance.post('register', {
        regNo, fullName, email, department, year, password, role,
      });
      return response.data.success;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  async login(regNo, password, role) {
    try {
      const response = await axiosInstance.post('login', {
        regNo, password, role,
      });
      if (response.data.success) {
        const userData = {
          ...response.data.user,
          token: response.data.token
        };
        this.currentUser = userData;
        this.currentUserRegNo = response.data.user.regNo;
        this.currentUserRole = response.data.user.role;
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        this.studentJoinedElectionIds = [];
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout() {
    this.currentUser = null;
    this.currentUserRegNo = null;
    this.currentUserRole = null;
    this.elections = [];
    this.studentJoinedElectionIds = [];
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  }

  async restoreSession() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataRaw = await AsyncStorage.getItem('userData');
      if (!token || !userDataRaw) {
        return null;
      }

      const userData = JSON.parse(userDataRaw);
      if (!userData?.role || !userData?.regNo) {
        return null;
      }

      this.currentUser = userData;
      this.currentUserRegNo = userData.regNo;
      this.currentUserRole = userData.role;
      this.studentJoinedElectionIds = [];

      return userData;
    } catch (error) {
      console.error('Restore session error:', error);
      return null;
    }
  }

  async refreshElections() {
    try {
      const response = await axiosInstance.get('elections');
      if (response.data.success) {
        this.elections = response.data.elections.map((e) =>
          this._transformElection(e)
        );

        // Auto-add elections where current student has voted
        if (this.currentUserRole === 'student' && this.currentUserRegNo) {
          this.elections.forEach((election) => {
            const hasVoted = election.votedStudents.includes(
              this.currentUserRegNo.toLowerCase()
            );
            if (hasVoted && !this.studentJoinedElectionIds.includes(election.id)) {
              this.studentJoinedElectionIds.push(election.id);
            }
          });
        }
      }
      return Boolean(response.data?.success);
    } catch (error) {
      console.error('Refresh elections error:', error);
      return false;
    }
  }

  addStudentJoinedElection(election) {
    if (!this.studentJoinedElectionIds.includes(election.id)) {
      this.studentJoinedElectionIds.push(election.id);
    }
  }

  getStudentJoinedElections() {
    return this.elections.filter((e) =>
      this.studentJoinedElectionIds.includes(e.id)
    );
  }

  getFacultyElections() {
    if (!this.currentUser) return [];
    return this.elections.filter(
      (e) => String(e.createdBy) === String(this.currentUser.id)
    );
  }

  async createElection(title, maxVotes) {
    try {
      const response = await axiosInstance.post('elections', {
        title, maxVotes
      });
      if (response.data.success) {
        const election = this._transformElection(response.data.election);
        this.elections.push(election);
        return election;
      }
      return null;
    } catch (error) {
      console.error('Create election error:', error);
      throw new Error('Failed to create election');
    }
  }

  async addCandidateToElection(electionId, candidateName, description = null, qualification = null) {
    try {
      const response = await axiosInstance.post('candidates', {
        electionId, name: candidateName, description, qualification,
      });
      if (response.data.success) {
        const election = this.elections.find((e) => e.id === electionId);
        if (election) {
          election.candidates.push(response.data.candidate);
        }
        return response.data.candidate;
      }
      return null;
    } catch (error) {
      console.error('Add candidate error:', error);
      throw new Error('Failed to add candidate');
    }
  }

  async getElectionById(id) {
    try {
      const normalizedId = String(id || '').trim().toUpperCase();
      const response = await axiosInstance.get(`elections/${normalizedId}`);
      if (response.data.success) {
        const election = this._transformElection(response.data.election);
        const idx = this.elections.findIndex((e) => e.id === normalizedId);
        if (idx >= 0) {
          this.elections[idx] = election;
        } else {
          this.elections.push(election);
        }
        return election;
      }
      return null;
    } catch (error) {
      console.error('Get election error:', error);
      return null;
    }
  }

  async castVote(electionId, candidateId) {
    try {
      if (!this.currentUser) throw new Error('User not logged in');

      const response = await axiosInstance.post('vote', {
        electionId,
        voterRegNo: this.currentUser.regNo,
        candidateId,
      });

      if (response.data.success) {
        await this.refreshElections();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cast vote error:', error.response?.data || error);
      throw new Error(
        error.response?.data?.message || 'Failed to cast vote'
      );
    }
  }

  async closeElection(electionId) {
    try {
      const response = await axiosInstance.put(
        `elections/${electionId}/close`
      );
      if (response.data.success) {
        const election = this.elections.find((e) => e.id === electionId);
        if (election) {
          election.isClosed = response.data.isClosed;
        }
        return response.data.isClosed;
      }
      return null;
    } catch (error) {
      console.error('Close election error:', error);
      throw new Error('Failed to close election');
    }
  }

  // Add this method to your DataStore class

async deleteElection(electionId) {
  try {
    const response = await axiosInstance.delete(`elections/${electionId}`);
    if (response.data.success) {
      this.elections = this.elections.filter(e => e.id !== electionId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete election error:', error);
    throw new Error('Failed to delete election');
  }
}

  async toggleElectionResults(electionId) {
    try {
      const response = await axiosInstance.put(
        `elections/${electionId}/toggle-results`
      );
      if (response.data.success) {
        const election = this.elections.find((e) => e.id === electionId);
        if (election) {
          election.resultsPublished = response.data.resultsPublished;
        }
        return response.data.resultsPublished;
      }
      return null;
    } catch (error) {
      console.error('Toggle results error:', error);
      throw new Error('Failed to toggle results');
    }
  }

  getActiveElections() {
    return this.elections.filter((e) => !e.isVotingClosed);
  }

  getAllElections() {
    return this.elections;
  }

  _transformElection(backendElection) {
    const candidates = backendElection.candidates || [];
    const votedStudents = (backendElection.votedStudents || []).map(
      (s) => s.toLowerCase()
    );

    return {
      id: backendElection.id,
      title: backendElection.title,
      maxVotes: backendElection.max_votes,
      currentVoteCount: backendElection.current_vote_count,
      candidates: candidates,
      votedStudents: votedStudents,
      createdAt: backendElection.created_at
        ? new Date(backendElection.created_at).toISOString()
        : new Date().toISOString(),
      resultsPublished: Boolean(backendElection.results_published),
      createdBy: backendElection.created_by,
      isClosed: Boolean(backendElection.is_closed),
      isVotingClosed:
        Boolean(backendElection.is_closed) ||
        backendElection.current_vote_count >= backendElection.max_votes,
      // Check by regNo not name
      hasStudentVoted(regNo) {
        if (!regNo) return false;
        return votedStudents.includes(regNo.toLowerCase().trim());
      },
      getWinners() {
        if (candidates.length === 0) return [];
        const maxV = Math.max(...candidates.map((c) => c.vote_count || 0));
        return candidates.filter((c) => (c.vote_count || 0) === maxV);
      },
    };
  }
}

export default new DataStore();
