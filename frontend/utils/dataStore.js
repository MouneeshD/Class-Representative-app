import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api';

class DataStore {
  constructor() {
    this.elections = [];
    this.currentUser = null;
    this.currentUserRegNo = null;
    this.currentUserRole = null;
    this.token = null;
    this.studentJoinedElectionIds = [];
  }

  async loadToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.token = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Load token error:', error);
    }
  }

  async saveToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
      this.token = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Save token error:', error);
    }
  }

  async clearToken() {
    try {
      await AsyncStorage.removeItem('authToken');
      this.token = null;
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Clear token error:', error);
    }
  }

  async register({ regNo, password, role, fullName, email, department, year = null }) {
    try {
      const response = await axios.post(`${API_URL}/register`, {
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
      const response = await axios.post(`${API_URL}/login`, {
        regNo, password, role,
      });
      if (response.data.success) {
        this.currentUser = response.data.user;
        this.currentUserRegNo = response.data.user.regNo;
        this.currentUserRole = response.data.user.role;
        this.studentJoinedElectionIds = [];
        
        await this.saveToken(response.data.token);
        
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
    await this.clearToken();
  }

  async refreshElections() {
    try {
      const response = await axios.get(`${API_URL}/elections`);
      if (response.data.success) {
        this.elections = response.data.elections.map((e) =>
          this._transformElection(e)
        );

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
    } catch (error) {
      console.error('Refresh elections error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        await this.logout();
      }
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
      const response = await axios.post(`${API_URL}/elections`, {
        title, maxVotes,
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

  async getElectionById(id) {
    try {
      const response = await axios.get(`${API_URL}/elections/${id}`);
      if (response.data.success) {
        const election = this._transformElection(response.data.election);
        const idx = this.elections.findIndex((e) => e.id === id);
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

      const response = await axios.post(`${API_URL}/vote`, {
        electionId,
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
      const response = await axios.put(
        `${API_URL}/elections/${electionId}/close`
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

  async toggleElectionResults(electionId) {
    try {
      const response = await axios.put(
        `${API_URL}/elections/${electionId}/toggle-results`
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

  async deleteElection(electionId) {
    try {
      const response = await axios.delete(`${API_URL}/elections/${electionId}`);
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