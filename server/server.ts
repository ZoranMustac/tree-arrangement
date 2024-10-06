import express from "express";
import cors from "cors";
import pool from "./db";
import { body, validationResult } from "express-validator";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // To parse incoming JSON

// Get all nodes in the tree
app.get("/api/nodes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM nodes ORDER BY ordering");
    res.json(result.rows);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Add a new node
app.post(
  "/api/nodes",
  [
    body("title").not().isEmpty().withMessage("Title is required"), // Ensure title is present
    body("parent_node_id").optional().isInt(), // Validate parent_node_id if provided
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, parent_node_id } = req.body;

    // Check if parent_node_id is valid if provided
    if (parent_node_id !== null && parent_node_id !== undefined) {
      const parentCheck = await pool.query(
        "SELECT id FROM nodes WHERE id = $1",
        [parent_node_id]
      );
      if (parentCheck.rows.length === 0) {
        return res
          .status(400)
          .json({
            error: "Invalid parent_node_id. Parent node does not exist.",
          });
      }
    }

    try {
      // Get the next available ordering for the new node under the parent
      const orderingRes = await pool.query(
        "SELECT COALESCE(MAX(ordering), 0) + 1 AS next_ordering FROM nodes WHERE parent_node_id = $1",
        [parent_node_id]
      );
      const { next_ordering } = orderingRes.rows[0];

      // Insert the new node into the database
      const newNode = await pool.query(
        "INSERT INTO nodes (title, parent_node_id, ordering) VALUES ($1, $2, $3) RETURNING *",
        [title, parent_node_id, next_ordering]
      );
      res.json(newNode.rows[0]);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
        res.status(500).send("Server error");
      }
    }
  }
);

// Update a node's title
app.put("/api/nodes/:id", async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    const updatedNode = await pool.query(
      "UPDATE nodes SET title = $1 WHERE id = $2 RETURNING *",
      [title, id]
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
    // Delete the node (PostgreSQL will handle cascading deletes for children if ON DELETE CASCADE is set)
    await pool.query("DELETE FROM nodes WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
