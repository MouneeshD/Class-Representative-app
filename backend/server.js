require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL Database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

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

    const hashedPassword = await bcrypt.hash(password, 10);

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
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        regNo: user.reg_no, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      token,
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

app.post('/api/elections', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const { title, maxVotes } = req.body;
    const createdBy = req.user.id;

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

app.get('/api/elections', authenticateToken, async (req, res) => {
  try {
    const [elections] = await pool.query(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM candidates WHERE election_id = e.id) as candidate_count
      FROM elections e
      ORDER BY e.created_at DESC
    `);

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

app.get('/api/elections/:id', authenticateToken, async (req, res) => {
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

app.put('/api/elections/:id/toggle-results', authenticateToken, authenticateFaculty, async (req, res) => {
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

app.put('/api/elections/:id/close', authenticateToken, authenticateFaculty, async (req, res) => {
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

app.delete('/api/elections/:id', authenticateToken, authenticateFaculty, async (req, res) => {
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

// ==================== CANDIDATE ROUTES ====================

app.post('/api/candidates', authenticateToken, authenticateFaculty, async (req, res) => {
  try {
    const { electionId, name, description, qualification } = req.body;

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

app.put('/api/candidates/:id', authenticateToken, authenticateFaculty, async (req, res) => {
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

app.delete('/api/candidates/:id', authenticateToken, authenticateFaculty, async (req, res) => {
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

// ==================== VOTING ROUTES ====================

app.post('/api/vote', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { electionId, candidateId } = req.body;
    const voterRegNo = req.user.regNo;

    if (req.user.role !== 'student') {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'Only students can vote' 
      });
    }

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

    if (election.current_vote_count >= election.max_votes || election.is_closed) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Voting is closed for this election' 
      });
    }

    await connection.query(
      `INSERT INTO votes (election_id, voter_reg_no, candidate_id) 
       VALUES (?, ?, ?)`,
      [electionId, voterRegNo, candidateId]
    );

    await connection.query(
      'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
      [candidateId]
    );

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

app.get('/api/elections/:electionId/voted/:regNo', authenticateToken, async (req, res) => {
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

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`JWT Authentication enabled`);
});