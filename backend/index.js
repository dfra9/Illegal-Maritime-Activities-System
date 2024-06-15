const { send, json } = require('micro');
const { Pool } = require('pg');

// Replace with your actual PostgreSQL connection URL
const pool = new Pool({
  connectionString: 'postgresql://aoldb_owner:SivqGBTw1fY6@ep-empty-voice-a1h1zqlp-pooler.ap-southeast-1.aws.neon.tech/aoldb?sslmode=require',
  ssl: {
    rejectUnauthorized: false // only needed if your PostgreSQL server uses self-signed certificate
  }
});

// Handler function for GET requests
async function handleGet(req, res) {
  const { query } = req;
  const { user, pass } = query;

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [user, pass]);
    client.release();

    if (result.rows.length === 0) {
      send(res, 404, 'User not found');
    } else {
      send(res, 200, result.rows);
    }
  } catch (error) {
    send(res, 500, error.message);
  }
}

// Handler function for POST requests
async function handlePost(req, res) {
  try {
    const data = await json(req);
    const { email, password } = data;

    const client = await pool.connect();
    const result = await client.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', [email, password]);
    client.release();

    send(res, 201, result.rows[0]);
  } catch (error) {
    send(res, 500, error.message);
  }
}

// Handler function for DELETE requests
async function handleDelete(req, res) {
  const { query } = req;
  const { id } = query;

  try {
    const client = await pool.connect();
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    client.release();

    if (result.rows.length === 0) {
      send(res, 404, 'User not found');
    } else {
      send(res, 200, 'User deleted successfully');
    }
  } catch (error) {
    send(res, 500, error.message);
  }
}

// Main request handler function
module.exports = async (req, res) => {
  const { url, method } = req;

  if (method === 'GET' && url.startsWith('/rest=get')) {
    return handleGet(req, res);
  } else if (method === 'POST' && url === '/') {
    return handlePost(req, res);
  } else if (method === 'DELETE' && url.startsWith('/rest=delete')) {
    return handleDelete(req, res);
  } else {
    send(res, 404, 'Not Found');
  }
};
