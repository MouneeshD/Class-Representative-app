import Candidate from './candidate.js';

export default class Election {
  constructor({
    id,
    title,
    maxVotes,
    currentVoteCount = 0,
    candidates = [],
    votedStudents = [],
    createdAt = new Date(),
    resultsPublished = false,
  }) {
    this.id = id;
    this.title = title;
    this.maxVotes = maxVotes;
    this.currentVoteCount = currentVoteCount;
    this.candidates = candidates;
    this.votedStudents = votedStudents;
    this.createdAt = createdAt;
    this.resultsPublished = resultsPublished;
  }

  get isVotingClosed() {
    return this.currentVoteCount >= this.maxVotes;
  }

  hasStudentVoted(studentName) {
    return this.votedStudents.includes(studentName.toLowerCase().trim());
  }

  recordVote(studentName, candidateId) {
    if (this.isVotingClosed) {
      throw new Error('Voting is closed for this election');
    }

    if (this.hasStudentVoted(studentName)) {
      throw new Error('You have already voted in this election');
    }

    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    candidate.voteCount++;
    this.currentVoteCount++;
    this.votedStudents.push(studentName.toLowerCase().trim());
  }

  getWinners() {
    if (this.candidates.length === 0) return [];

    const maxVotes = Math.max(...this.candidates.map((c) => c.voteCount));
    return this.candidates.filter((c) => c.voteCount === maxVotes);
  }

  toggleResultsPublished() {
    this.resultsPublished = !this.resultsPublished;
  }
}