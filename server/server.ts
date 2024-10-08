import express from "express";
import cors from "cors";
import pool from "./db";
import { body, validationResult } from "express-validator";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/nodes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM nodes ORDER BY ordering");
    res.json(result.rows);
  } catch (err) {
    if (err instanceof Error) console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post(
  "/api/nodes",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("parent_node_id")
      .optional()
      .custom((value) => {
        if (value !== null && !Number.isInteger(value)) {
          throw new Error("Parent node ID must be an integer or null");
        }
        return true;
      }),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, parent_node_id } = req.body;

    if (parent_node_id === null) {
      const rootNodeCheck = await pool.query(
        "SELECT id FROM nodes WHERE parent_node_id IS NULL"
      );
      if (rootNodeCheck.rows.length > 0) {
        return res.status(400).json({
          error: "A root node already exists. Only one root node is allowed.",
        });
      }
    }

    if (parent_node_id !== null) {
      const parentCheck = await pool.query(
        "SELECT id FROM nodes WHERE id = $1",
        [parent_node_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({
          error: "Invalid parent_node_id. Parent node does not exist.",
        });
      }
    }

    try {
      const orderingRes = await pool.query(
        "SELECT COALESCE(MAX(ordering), 0) + 1 AS next_ordering FROM nodes WHERE parent_node_id = $1",
        [parent_node_id]
      );
      const { next_ordering } = orderingRes.rows[0];

      const newNode = await pool.query(
        "INSERT INTO nodes (title, parent_node_id, ordering) VALUES ($1, $2, $3) RETURNING *",
        [title, parent_node_id, next_ordering]
      );
      res.json(newNode.rows[0]);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

app.put("/api/nodes/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const { title, parent_node_id, ordering } = req.body;

  try {
    const nodeCheck = await pool.query("SELECT * FROM nodes WHERE id = $1", [
      id,
    ]);
    if (nodeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (nodeCheck.rows[0].parent_node_id === null && parent_node_id) {
      return res
        .status(400)
        .json({ error: "Root node cannot be reassigned a parent" });
    }

    const updatedNode = await pool.query(
      "UPDATE nodes SET title = $1, parent_node_id = $2, ordering = $3 WHERE id = $4 RETURNING *",
      [title, parent_node_id, ordering, id]
    );

    res.json(updatedNode.rows[0]);
  } catch (err) {
    if (err instanceof Error) console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.delete("/api/nodes/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const nodeCheck = await pool.query("SELECT * FROM nodes WHERE id = $1", [
      id,
    ]);
    if (nodeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (nodeCheck.rows[0].parent_node_id === null) {
      return res.status(400).json({ error: "Root node cannot be deleted." });
    }

    await pool.query("DELETE FROM nodes WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) console.error(err.message);
    res.status(500).send("Server error");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
