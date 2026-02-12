export default class Candidate {
  constructor({ id, name, voteCount = 0, description = null, qualification = null }) {
    this.id = id;
    this.name = name;
    this.voteCount = voteCount;
    this.description = description;
    this.qualification = qualification;
  }
}