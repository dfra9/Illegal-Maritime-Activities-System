const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const validator = require("validator");
const app = express();
const PORT = process.env.PORT || 5000;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://default:0UNeuqozGaF6@ep-proud-rain-a1bew3r1.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require";
const client = new Client(DATABASE_URL);

client
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err));

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

const selectUnverifiedUsersQuery = `SELECT * FROM unverified_users;`;
const selectVerifiedUsersQuery = `SELECT id, email, password FROM users;`;

app.get("/api/unverified_users", async (req, res) => {
  try {
    const result = await client.query(selectUnverifiedUsersQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching unverified users:", err);
    res.status(500).json({ error: "Failed to fetch unverified users" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await client.query(selectVerifiedUsersQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching verified users:", err);
    res.status(500).json({ error: "Failed to fetch verified users" });
  }
});

app.get("/api/user/:email", async (req, res) => {
  const { email } = req.params;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

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
app.post('/api/unverified_user', async (req, res) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const insertQuery = 'INSERT INTO unverified_users (email, password) VALUES ($1, $2) RETURNING id, email, created_at;';
  const values = [email, password];

  try {
    const result = await client.query(insertQuery, values);
    const insertedUser = result.rows[0];
    res.status(201).json(insertedUser);
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/push_user", async (req, res) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists in verified users." });
    }

    const insertUserQuery = `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id;`;
    const insertResult = await client.query(insertUserQuery, [email, password]);
    const newUserId = insertResult.rows[0].id;

    const deleteUnverifiedUserQuery = `DELETE FROM unverified_users WHERE email = $1;`;
    await client.query(deleteUnverifiedUserQuery, [email]);

    res.status(200).json({ message: "User successfully pushed to verified users", newUserId });
  } catch (err) {
    console.error("Error pushing user:", err);
    res.status(500).json({ error: "Failed to push user" });
  }
});

app.put("/api/update_user/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const updateUserQuery = `UPDATE users SET email = $1, password = $2 WHERE id = $3;`;
    await client.query(updateUserQuery, [email, password, id]);
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/delete_verified_user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteUserQuery = `DELETE FROM users WHERE id = $1;`;
    await client.query(deleteUserQuery, [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.delete("/api/delete_unverified_user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteUnverifiedUserQuery = `DELETE FROM unverified_users WHERE id = $1;`;
    await client.query(deleteUnverifiedUserQuery, [id]);
    res.status(200).json({ message: "Unverified user deleted successfully" });
  } catch (err) {
    console.error("Error deleting unverified user:", err);
    res.status(500).json({ error: "Failed to delete unverified user" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
