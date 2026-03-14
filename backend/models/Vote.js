const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  electionId: {
    type: String,
    required: true,
    index: true
  },
  voterRegNo: {
    type: String,
    required: true,
    index: true
  },
  candidateId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

voteSchema.index({ electionId: 1, voterRegNo: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);