import React, { useEffect, useState } from "react";
import axios from "axios";

interface Node {
  id: number;
  name: string;
  parent_id: number | null;
  position: number;
}

const Tree: React.FC = () => {
  const [tree, setTree] = useState<Node[]>([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);

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
    await axios.post("http://localhost:5000/api/nodes", {
      name: newNodeName,
      parent_id: parentId,
    });
    setNewNodeName("");
    fetchTree(); // Refresh the tree after adding
  };

  // Delete a node
  const deleteNode = async (id: number) => {
    await axios.delete(`http://localhost:5000/api/nodes/${id}`);
    fetchTree(); // Refresh the tree after deleting
  };

  const renderTree = (nodes: Node[], parentId: number | null = null) => {
    const filteredNodes = nodes.filter((node) => node.parent_id === parentId);
    return (
      <ul>
        {filteredNodes.map((node) => (
          <li key={node.id}>
            {node.name}
            <button
              onClick={() => deleteNode(node.id)}
              className="ml-2 text-red-500"
            >
              Delete
            </button>
            {renderTree(nodes, node.id)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h1>Tree Structure</h1>
      <input
        type="text"
        value={newNodeName}
        onChange={(e) => setNewNodeName(e.target.value)}
        placeholder="New node name"
      />
      <input
        type="number"
        value={parentId ?? ""}
        onChange={(e) => setParentId(Number(e.target.value))}
        placeholder="Parent node ID"
      />
      <button onClick={addNode}>Add Node</button>
      <div>{renderTree(tree)}</div>
    </div>
  );
};

export default Tree;
