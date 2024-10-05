import express from "express";
import cors from "cors";
import pool from "./db/db";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // To parse incoming JSON

// Get all nodes
app.get("/api/nodes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM nodes ORDER BY position");
    res.json(result.rows);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Add a new node
app.post("/api/nodes", async (req, res) => {
  const { name, parent_id } = req.body;
  try {
    const positionRes = await pool.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM nodes WHERE parent_id = $1",
      [parent_id]
    );
    const { next_position } = positionRes.rows[0];

    const newNode = await pool.query(
      "INSERT INTO nodes (name, parent_id, position) VALUES ($1, $2, $3) RETURNING *",
      [name, parent_id, next_position]
    );
    res.json(newNode.rows[0]);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Update a node
app.put("/api/nodes/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const updatedNode = await pool.query(
      "UPDATE nodes SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.json(updatedNode.rows[0]);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Delete a node and all its children
app.delete("/api/nodes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM nodes WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
