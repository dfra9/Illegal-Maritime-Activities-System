const express = require('express');
const { Pool } = require('pg');

// PostgreSQL connection string
const connectionString = 'postgresql://aoldb_owner:SivqGBTw1fY6@ep-empty-voice-a1h1zqlp-pooler.ap-southeast-1.aws.neon.tech/aoldb?sslmode=require';

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
});

// Create express application
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle login
app.get('/rest=get', async (req, res) => {
  const { user, pass } = req.query;

  try {
    // Query PostgreSQL database for user authentication
    const query = {
      text: 'SELECT * FROM users WHERE email = $1 AND password = $2',
      values: [user, pass],
    };
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
