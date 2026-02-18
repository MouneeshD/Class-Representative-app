const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'mouneesh',   // put your real password if you have one
  database: 'cr_voting_app',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Database Connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL Database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// ==================== AUTH ROUTES ====================

// Register User
app.post('/api/register', async (req, res) => {
  try {
    const { regNo, fullName, email, department, year, password, role } = req.body;

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE reg_no = ?',
      [regNo]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Register number already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      `INSERT INTO users (reg_no, full_name, email, department, year, password, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [regNo, fullName, email, department, year, hashedPassword, role]
    );

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

// Login User
app.post('/api/login', async (req, res) => {
  try {
    const { regNo, password, role } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE reg_no = ? AND role = ?',
      [regNo, role]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        regNo: user.reg_no,
        fullName: user.full_name,
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

// Create Election
app.post('/api/elections', async (req, res) => {
  try {
    const { title, maxVotes, createdBy } = req.body;

    // Generate 4-digit election ID
    let electionId;
    let exists = true;
    
    while (exists) {
      electionId = (Math.floor(Math.random() * 9000) + 1000).toString();
      const [rows] = await pool.query(
        'SELECT id FROM elections WHERE id = ?',
        [electionId]
      );
      exists = rows.length > 0;
    }

    await pool.query(
      `INSERT INTO elections (id, title, max_votes, created_by) 
       VALUES (?, ?, ?, ?)`,
      [electionId, title, maxVotes, createdBy]
    );

    const [election] = await pool.query(
      'SELECT * FROM elections WHERE id = ?',
      [electionId]
    );

    res.json({ 
      success: true, 
      election: election[0] 
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get All Elections
app.get('/api/elections', async (req, res) => {
  try {
    const [elections] = await pool.query(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM candidates WHERE election_id = e.id) as candidate_count
      FROM elections e
      ORDER BY e.created_at DESC
    `);

    // Get candidates for each election
    for (let election of elections) {
      const [candidates] = await pool.query(
        'SELECT * FROM candidates WHERE election_id = ? ORDER BY vote_count DESC',
        [election.id]
      );
      
      const [votes] = await pool.query(
        'SELECT voter_reg_no FROM votes WHERE election_id = ?',
        [election.id]
      );
      
      election.candidates = candidates;
      election.votedStudents = votes.map(v => v.voter_reg_no);
      election.isVotingClosed = election.current_vote_count >= election.max_votes;
    }

    res.json({ 
      success: true, 
      elections 
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get Election by ID
app.get('/api/elections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query(
      'SELECT * FROM elections WHERE id = ?',
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    const election = elections[0];

    const [candidates] = await pool.query(
      'SELECT * FROM candidates WHERE election_id = ? ORDER BY vote_count DESC',
      [id]
    );

    const [votes] = await pool.query(
      'SELECT voter_reg_no FROM votes WHERE election_id = ?',
      [id]
    );

    election.candidates = candidates;
    election.votedStudents = votes.map(v => v.voter_reg_no);
    election.isVotingClosed = election.current_vote_count >= election.max_votes;

    res.json({ 
      success: true, 
      election 
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Toggle Results Published
app.put('/api/elections/:id/toggle-results', async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query(
      'SELECT results_published FROM elections WHERE id = ?',
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    const newStatus = !elections[0].results_published;

    await pool.query(
      'UPDATE elections SET results_published = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({ 
      success: true, 
      resultsPublished: newStatus 
    });
  } catch (error) {
    console.error('Toggle results error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== CANDIDATE ROUTES ====================

// Add Candidate
app.post('/api/candidates', async (req, res) => {
  try {
    const { electionId, name, description, qualification } = req.body;

    // Get current candidate count
    const [candidates] = await pool.query(
      'SELECT COUNT(*) as count FROM candidates WHERE election_id = ?',
      [electionId]
    );

    const candidateId = `${electionId}_${candidates[0].count + 1}`;

    await pool.query(
      `INSERT INTO candidates (id, election_id, name, description, qualification) 
       VALUES (?, ?, ?, ?, ?)`,
      [candidateId, electionId, name, description, qualification]
    );

    const [newCandidate] = await pool.query(
      'SELECT * FROM candidates WHERE id = ?',
      [candidateId]
    );

    res.json({ 
      success: true, 
      candidate: newCandidate[0] 
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== VOTING ROUTES ====================

// Cast Vote
app.post('/api/vote', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { electionId, voterRegNo, candidateId } = req.body;

    // Check if already voted
    const [existingVotes] = await connection.query(
      'SELECT * FROM votes WHERE election_id = ? AND voter_reg_no = ?',
      [electionId, voterRegNo]
    );

    if (existingVotes.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'You have already voted in this election' 
      });
    }

    // Check if voting is closed
    const [elections] = await connection.query(
      'SELECT * FROM elections WHERE id = ?',
      [electionId]
    );

    if (elections.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    const election = elections[0];

    if (election.current_vote_count >= election.max_votes) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Voting is closed for this election' 
      });
    }

    // Record vote
    await connection.query(
      `INSERT INTO votes (election_id, voter_reg_no, candidate_id) 
       VALUES (?, ?, ?)`,
      [electionId, voterRegNo, candidateId]
    );

    // Increment candidate vote count
    await connection.query(
      'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
      [candidateId]
    );

    // Increment election vote count
    await connection.query(
      'UPDATE elections SET current_vote_count = current_vote_count + 1 WHERE id = ?',
      [electionId]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Vote recorded successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Vote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  } finally {
    connection.release();
  }
});

// Check if User Voted
app.get('/api/elections/:electionId/voted/:regNo', async (req, res) => {
  try {
    const { electionId, regNo } = req.params;

    const [votes] = await pool.query(
      'SELECT * FROM votes WHERE election_id = ? AND voter_reg_no = ?',
      [electionId, regNo]
    );

    res.json({ 
      success: true, 
      hasVoted: votes.length > 0 
    });
  } catch (error) {
    console.error('Check vote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ==================== CLOSE ELECTION ====================

// Close Election (Faculty only)
app.put('/api/elections/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    const [elections] = await pool.query(
      'SELECT is_closed FROM elections WHERE id = ?',
      [id]
    );

    if (elections.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Election not found' 
      });
    }

    const newStatus = !elections[0].is_closed;

    await pool.query(
      'UPDATE elections SET is_closed = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({ 
      success: true, 
      isClosed: newStatus 
    });
  } catch (error) {
    console.error('Close election error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update Candidate
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, qualification, description } = req.body;

    await pool.query(
      'UPDATE candidates SET name = ?, qualification = ?, description = ? WHERE id = ?',
      [name, qualification, description, id]
    );

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

// Delete Candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM candidates WHERE id = ?', [id]);

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

// Delete Election (CASCADE will delete candidates and votes)
app.delete('/api/elections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM elections WHERE id = ?', [id]);

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

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});