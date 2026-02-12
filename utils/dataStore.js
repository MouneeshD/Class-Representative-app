import Election from '../frontend/models/election';
import Candidate from '../frontend/models/candidate';

class UserProfile {
  constructor({ regNo, password, fullName, email, department, year = null }) {
    this.regNo = regNo;
    this.password = password;
    this.fullName = fullName;
    this.email = email;
    this.department = department;
    this.year = year;
  }
}

class DataStore {
  constructor() {
    this.elections = [];
    this.currentUserName = null;
    this.currentUserRole = null;

    this.registeredStudents = [];
    this.registeredFaculty = [];

    // Demo credentials - FIXED: Use lowercase keys
    this.studentCredentials = {
      'student': 'student123',
      's001': 'pass123',
      '2021001': 'pass123',
    };

    this.facultyCredentials = {
      'faculty': 'faculty123',
      'fac001': 'admin123',
      'FAC001': 'admin123',
    };
  }

  register({ regNo, password, role, fullName, email, department, year = null }) {
    const normalizedRegNo = regNo.toLowerCase();
    
    if (role === 'student') {
      if (
        this.registeredStudents.some((u) => u.regNo.toLowerCase() === normalizedRegNo) ||
        this.studentCredentials[normalizedRegNo]
      ) {
        return false;
      }

      this.registeredStudents.push(
        new UserProfile({ regNo, password, fullName, email, department, year })
      );
    } else {
      if (
        this.registeredFaculty.some((u) => u.regNo.toLowerCase() === normalizedRegNo) ||
        this.facultyCredentials[normalizedRegNo]
      ) {
        return false;
      }

      this.registeredFaculty.push(
        new UserProfile({ regNo, password, fullName, email, department })
      );
    }

    return true;
  }

  login(regNo, password, role) {
    const normalizedRegNo = regNo.toLowerCase();
    
    if (role === 'student') {
      // Check registered students first
      const user = this.registeredStudents.find(
        (u) => u.regNo.toLowerCase() === normalizedRegNo && u.password === password
      );

      if (user) {
        this.currentUserName = user.fullName;
        this.currentUserRole = role;
        return true;
      }

      // Check demo credentials
      if (
        this.studentCredentials[normalizedRegNo] &&
        this.studentCredentials[normalizedRegNo] === password
      ) {
        this.currentUserName = regNo;
        this.currentUserRole = role;
        return true;
      }
    } else {
      // Check registered faculty first
      const user = this.registeredFaculty.find(
        (u) => u.regNo.toLowerCase() === normalizedRegNo && u.password === password
      );

      if (user) {
        this.currentUserName = user.fullName;
        this.currentUserRole = role;
        return true;
      }

      // Check demo credentials
      if (
        this.facultyCredentials[normalizedRegNo] &&
        this.facultyCredentials[normalizedRegNo] === password
      ) {
        this.currentUserName = regNo;
        this.currentUserRole = role;
        return true;
      }
    }

    return false;
  }

  logout() {
    this.currentUserName = null;
    this.currentUserRole = null;
  }

  generateElectionId() {
    let id;
    do {
      id = (Math.floor(Math.random() * 9000) + 1000).toString();
    } while (this.elections.some((e) => e.id === id));
    return id;
  }

  createElection(title, maxVotes) {
    const election = new Election({
      id: this.generateElectionId(),
      title,
      maxVotes,
    });
    this.elections.push(election);
    return election;
  }

  addCandidateToElection(electionId, candidateName, description = null, qualification = null) {
    const election = this.getElectionById(electionId);
    if (!election) {
      throw new Error('Election not found');
    }

    const candidateId = `${electionId}_${election.candidates.length + 1}`;
    const candidate = new Candidate({
      id: candidateId,
      name: candidateName,
      description,
      qualification,
    });

    election.candidates.push(candidate);
  }

  getElectionById(id) {
    return this.elections.find((e) => e.id === id);
  }

  castVote(electionId, candidateId) {
    if (!this.currentUserName) {
      throw new Error('User not logged in');
    }

    const election = this.getElectionById(electionId);
    if (!election) {
      throw new Error('Election not found');
    }

    election.recordVote(this.currentUserName, candidateId);
  }

  toggleElectionResults(electionId) {
    const election = this.getElectionById(electionId);
    if (!election) {
      throw new Error('Election not found');
    }
    election.toggleResultsPublished();
  }

  getActiveElections() {
    return this.elections.filter((e) => !e.isVotingClosed);
  }

  getAllElections() {
    return this.elections;
  }
}

export default new DataStore();