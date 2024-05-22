const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.use(express.json());
const port = 4000; // Adjust port number as needed

// Database credentials
const pool = mysql.createPool({
  host: 'bxrsxblwjpsuw7nuynet-mysql.services.clever-cloud.com',
  user: 'ufmrgtthzgsjw0ge',
  password: 'Yl00kMvk7PZOEga2gMBK',
  database: 'bxrsxblwjpsuw7nuynet'
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Unauthorized access: Token missing');
  jwt.verify(token.replace('Bearer ', ''), 'delice', (err, decoded) => {
    if (err) {
      console.error(err);
      return res.status(403).send('Unauthorized access: Invalid or expired token');
    }
    req.userId = decoded.id;
    next();
  });
};


//testing
app.get('/', (req, res) => {
  res.send('Hello World!')
})



// Get all data from a roles table
app.get('/students',verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving roles');
  }
});

// Select Single role
app.get('/students/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE s_id = ?', [id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error showing role');
  }
});

// Insert data into roles table
app.post('/students', verifyToken, async (req, res) => {
  const { ins_id, names, reg_no, created_at, updated_at, created_by, updated_by } = req.body; // Destructure data from request body
  if (!ins_id || !names || !reg_no || !created_at || !updated_at || !created_by || !updated_by ) {
    return res.status(400).send('Please provide all required fields (email,password)');
  }
  try {
    const [result] = await pool.query('INSERT INTO students SET ?', { ins_id, names, reg_no,  created_at, updated_at, created_by, updated_by });
    res.json({ message: `student inserted successfully with ID: ${result.insertId}` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting role');
  }
});

// Update role
app.put('/students/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  const { ins_id, names, reg_no, created_at, updated_at, created_by, updated_by } = req.body; // Destructure data from request body
  if (!ins_id || !names || !reg_no || !created_at || !updated_at || !created_by || !updated_by ) {
    return res.status(400).send('Please provide all required fields ( email,password)');
  }
  try {
    const [result] = await pool.query('UPDATE students SET ins_id=?, names=?, reg_no=?, created_at=?, updated_at=?, created_by=?, updated_by=? WHERE s_id =?', [ins_id,  names, reg_no, created_at, updated_at, created_by, updated_by, id]);
    const [rows] = await pool.query('SELECT * FROM students WHERE s_id = ?', [id]);  // Use ID from request params
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating student');
  }
});
// PATCH route to partially update reg_no and names of an existing student
app.patch('/students/:id', verifyToken, async (req, res) => {
  const studentId = req.params.id;
  const { reg_no, names } = req.body; // Destructure reg_no and names from request body
  if (!reg_no && !names) {
      return res.status(400).send('Please provide at least one field to update (reg_no or names)');
  }
  try {
      let updateData = {};
      if (reg_no) updateData.reg_no = reg_no;
      if (names) updateData.names = names;
      const [result] = await pool.query('UPDATE students SET ? WHERE s_id=?', [updateData, studentId]);
      if (result.affectedRows === 0) {
          res.status(404).json({ message: 'Student not found' });
      } else {
          res.status(200).json({ message: 'Student updated successfully' });
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating student');
  }
});

// Delete role by ID
app.delete('/students/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM students WHERE s_id = ?', [id]);
    res.json({ message: `Data with ID ${id} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting role');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username,password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (!users.length) {
      return res.status(404).send('User not found');
    }

    const user = users[0];
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send('Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, 'delice', { expiresIn: '1h' });

    // Send the token as response
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
