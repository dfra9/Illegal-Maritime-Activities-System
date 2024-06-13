const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();

const DATABASE_URL = "postgresql://petra:Cd0DF6w8zIqedvVuLb91iQ@agile-db-9455.8nk.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full";
const client = new Client(DATABASE_URL);

client.connect()
  .then(() => console.log("Connected to the database"))
  .catch(err => console.error("Database connection error:", err));

app.use(express.json());
app.use(cors());

const selectUserQuery = `SELECT * FROM users WHERE email = $1;`;

async function getUserByEmail(email) {
  try {
    const result = await client.query(selectUserQuery, [email]);
    return result.rows[0];
  } catch (err) {
    console.error("Error selecting user:", err);
    throw err;
  }
}

app.get('/api/user/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await getUserByEmail(email);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
