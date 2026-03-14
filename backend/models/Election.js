const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  electionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  maxVotes: {
    type: Number,
    required: true,
    min: 1
  },
  currentVoteCount: {
    type: Number,
    default: 0
  },
  resultsPublished: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Election', electionSchema);