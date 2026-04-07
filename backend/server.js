require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ELECTION_ID_REGEX = /^[A-Z]{2}\d{4}$/;
const generateElectionId = () => {
  let prefix = '';
  for (let i = 0; i < 2; i += 1) {
    prefix += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${suffix}`;
};
const normalizeElectionId = (value) => String(value || '').trim().toUpperCase();
const isValidElectionId = (value) => ELECTION_ID_REGEX.test(normalizeElectionId(value));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// ==================== JWT MIDDLEWARE ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

const authenticateFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ 
      success: false, 
      message: 'Faculty access required' 
    });
  }
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/api/register', async (req, res) => {
  try {
    const { regNo, fullName, email, department, year, password, role } = req.body;

    const existing = await User.findOne({ regNo });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Register number already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      regNo,
      fullName,
      email,
      department,
      year,
      password: hashedPassword,
      role
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'Registration successful' 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { regNo, password, role } = req.body;

    const user = await User.findOne({ regNo, role });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        regNo: user.regNo, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      token,
      user: {
        id: user._id,
        regNo: user.regNo,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        year: user.year,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== ELECTION ROUTES ====================

app.post('/api/elections', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const { title, maxVotes } = req.body;

    let electionId;
    let exists = true;
    
    while (exists) {
      electionId = generateElectionId();
      exists = await Election.findOne({ electionId });
    }

    const election = new Election({
      electionId,
      title,
      maxVotes,
      createdBy: req.user.id
    });

    await election.save();

    res.json({ 
      success: true, 
      election: {
        id: election.electionId,
        title: election.title,
        max_votes: election.maxVotes,
        current_vote_count: election.currentVoteCount,
        results_published: election.resultsPublished,
        is_closed: election.isClosed,
        created_by: election.createdBy,
        created_at: election.createdAt
      }
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.get('/api/elections', authenticateToken, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });

    const electionsWithData = await Promise.all(elections.map(async (election) => {
      const candidates = await Candidate.find({ electionId: election.electionId })
        .sort({ voteCount: -1 });
      
      const votes = await Vote.find({ electionId: election.electionId });
      
      return {
        id: election.electionId,
        title: election.title,
        max_votes: election.maxVotes,
        current_vote_count: election.currentVoteCount,
        results_published: election.resultsPublished,
        is_closed: election.isClosed,
        created_by: election.createdBy,
        created_at: election.createdAt,
        candidates: candidates.map(c => ({
          id: c.candidateId,
          election_id: c.electionId,
          name: c.name,
          description: c.description,
          qualification: c.qualification,
          vote_count: c.voteCount
        })),
        votedStudents: votes.map(v => v.voterRegNo),
        candidate_count: candidates.length
      };
    }));

    res.json({ 
      success: true, 
      elections: electionsWithData
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.get('/api/elections/:id', authenticateToken, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.params.id);
    if (!isValidElectionId(electionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Election ID format. Use 2 letters and 4 numbers (e.g., AB1234)'
      });
    }

    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    const candidates = await Candidate.find({ electionId: election.electionId })
      .sort({ voteCount: -1 });
    
    const votes = await Vote.find({ electionId: election.electionId });

    res.json({ 
      success: true, 
      election: {
        id: election.electionId,
        title: election.title,
        max_votes: election.maxVotes,
        current_vote_count: election.currentVoteCount,
        results_published: election.resultsPublished,
        is_closed: election.isClosed,
        created_by: election.createdBy,
        created_at: election.createdAt,
        candidates: candidates.map(c => ({
          id: c.candidateId,
          election_id: c.electionId,
          name: c.name,
          description: c.description,
          qualification: c.qualification,
          vote_count: c.voteCount
        })),
        votedStudents: votes.map(v => v.voterRegNo)
      }
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.put('/api/elections/:id/toggle-results', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.params.id);
    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    election.resultsPublished = !election.resultsPublished;
    await election.save();

    res.json({ 
      success: true, 
      resultsPublished: election.resultsPublished 
    });
  } catch (error) {
    console.error('Toggle results error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.put('/api/elections/:id/close', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.params.id);
    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    election.isClosed = !election.isClosed;
    await election.save();

    res.json({ 
      success: true, 
      isClosed: election.isClosed 
    });
  } catch (error) {
    console.error('Close election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.delete('/api/elections/:id', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.params.id);
    const election = await Election.findOne({ electionId });

    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    await Candidate.deleteMany({ electionId });
    await Vote.deleteMany({ electionId });
    await Election.deleteOne({ electionId });

    res.json({ 
      success: true, 
      message: 'Election deleted successfully' 
    });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== CANDIDATE ROUTES ====================

app.post('/api/candidates', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const { name, description, qualification } = req.body;
    const electionId = normalizeElectionId(req.body.electionId);
    if (!isValidElectionId(electionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Election ID format. Use 2 letters and 4 numbers (e.g., AB1234)'
      });
    }

    const count = await Candidate.countDocuments({ electionId });
    const candidateId = `${electionId}_${count + 1}`;

    const candidate = new Candidate({
      candidateId,
      electionId,
      name,
      description,
      qualification
    });

    await candidate.save();

    res.json({ 
      success: true, 
      candidate: {
        id: candidate.candidateId,
        election_id: candidate.electionId,
        name: candidate.name,
        description: candidate.description,
        qualification: candidate.qualification,
        vote_count: candidate.voteCount
      }
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.put('/api/candidates/:id', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const { name, qualification, description } = req.body;

    const candidate = await Candidate.findOne({ candidateId: req.params.id });

    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found' 
      });
    }

    candidate.name = name;
    candidate.qualification = qualification;
    candidate.description = description;
    await candidate.save();

    res.json({ 
      success: true, 
      message: 'Candidate updated successfully' 
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.delete('/api/candidates/:id', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    await Candidate.deleteOne({ candidateId: req.params.id });

    res.json({ 
      success: true, 
      message: 'Candidate deleted successfully' 
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== VOTING ROUTES ====================

app.post('/api/vote', authenticateToken, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.body.electionId);
    const { candidateId } = req.body;
    const voterRegNo = req.user.regNo;
    if (!isValidElectionId(electionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Election ID format. Use 2 letters and 4 numbers (e.g., AB1234)'
      });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only students can vote' 
      });
    }

    const existingVote = await Vote.findOne({ electionId, voterRegNo });
    if (existingVote) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already voted in this election' 
      });
    }

    const election = await Election.findOne({ electionId });
    if (!election) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    if (election.currentVoteCount >= election.maxVotes || election.isClosed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Voting is closed for this election' 
      });
    }

    const vote = new Vote({
      electionId,
      voterRegNo,
      candidateId
    });

    await vote.save();

    await Candidate.updateOne(
      { candidateId },
      { $inc: { voteCount: 1 } }
    );

    await Election.updateOne(
      { electionId },
      { $inc: { currentVoteCount: 1 } }
    );

    res.json({ 
      success: true, 
      message: 'Vote recorded successfully' 
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

app.get('/api/elections/:electionId/voted/:regNo', authenticateToken, async (req, res) => {
  try {
    const electionId = normalizeElectionId(req.params.electionId);
    const { regNo } = req.params;

    const vote = await Vote.findOne({ electionId, voterRegNo: regNo });

    res.json({ 
      success: true, 
      hasVoted: !!vote 
    });
  } catch (error) {
    console.error('Check vote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 JWT Authentication enabled`);
  console.log(`📊 MongoDB Connected`);
});
