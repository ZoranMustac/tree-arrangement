import React, { useEffect, useState } from "react";
import axios from "axios";

interface Node {
  id: number;
  title: string;
  parent_node_id: number | null;
  ordering: number;
}

const Tree: React.FC = () => {
  const [tree, setTree] = useState<Node[]>([]);
  const [newNodeTitle, setNewNodeTitle] = useState(""); // Updated to match the title column
  const [parentId, setParentId] = useState<number | null>(null); // Parent node ID

  // Fetch the tree from the backend
  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    const response = await axios.get("http://localhost:5000/api/nodes");
    setTree(response.data);
  };

  // Add a new node
  const addNode = async () => {
    if (newNodeTitle.trim() === "") {
      alert("Node title cannot be empty");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/nodes", {
        title: newNodeTitle, // Ensure title is sent
        parent_node_id: parentId, // Ensure parent_node_id is sent
      });
      setNewNodeTitle(""); // Clear the input after adding
      fetchTree(); // Refresh the tree after adding
    } catch (error) {
      console.error("Error adding node:", error);
    }
  };

  // Delete a node
  const deleteNode = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/nodes/${id}`);
      fetchTree(); // Refresh the tree after deleting
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  const renderTree = (nodes: Node[], parentId: number | null = null) => {
    const filteredNodes = nodes.filter(
      (node) => node.parent_node_id === parentId
    );

    return (
      <div className="flex justify-center my-12">
        {filteredNodes.map((node) => (
          <div key={node.id} className="mx-4">
            <div className="card bg-gray-800 w-48 h-36 text-sm">
              <div>ID: {node.id}</div>
              <div>Title: {node.title}</div>
              <div>
                Parent Node:{" "}
                {node.parent_node_id ? node.parent_node_id : "NULL"}
              </div>
              <div>Order: {node.ordering}</div>
              <button
                onClick={() => deleteNode(node.id)}
                className="text-red-500"
              >
                Delete
              </button>
              {renderTree(nodes, node.id)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1>Tree Structure</h1>
      <input
        type="text"
        value={newNodeTitle}
        onChange={(e) => setNewNodeTitle(e.target.value)} // Update the title input
        placeholder="New node title"
      />
      <input
        type="number"
        value={parentId ?? ""} // Allow null for root node
        onChange={(e) => setParentId(Number(e.target.value))}
        placeholder="Parent node ID"
      />
      <button onClick={addNode}>Add Node</button>
      <div>{renderTree(tree)}</div>
    </div>
  );
};

export default Tree;
