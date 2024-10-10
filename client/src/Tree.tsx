import React, { useEffect, useState } from "react";
import axios from "axios";
import { Node } from "./interface";

const Tree: React.FC = () => {
  const [tree, setTree] = useState<Node[]>([]);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [order, setOrder] = useState<number | string>("");
  const [editNodeId, setEditNodeId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Track loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://localhost:5000/api/nodes");
      setTree(response.data);
    } catch (err) {
      console.error("Error fetching tree:", err);
      setError("Failed to load the data.");
    } finally {
      setLoading(false); // Set loading to false after the data is fetched
    }
  };

  const resetFields = () => {
    setNewNodeTitle("");
    setParentId("");
    setOrder("");
    setEditNodeId(null);
  };

  const addNode = async () => {
    if (newNodeTitle.trim() === "") {
      alert("Node title cannot be empty");
      return;
    }

    const parentNodeId = parentId === "" ? null : Number(parentId);

    try {
      await axios.post("http://localhost:5000/api/nodes", {
        title: newNodeTitle,
        parent_node_id: parentNodeId,
      });
      resetFields();
      fetchTree();
    } catch (error) {
      console.error("Error adding node:", error);
    }
  };

  const updateNode = async () => {
    if (newNodeTitle.trim() === "") {
      alert("Node title cannot be empty");
      return;
    }

    const parentNodeId = parentId === "" ? null : Number(parentId);
    const orderValue = order === "" ? null : Number(order);

    try {
      await axios.put(`http://localhost:5000/api/nodes/${editNodeId}`, {
        title: newNodeTitle,
        parent_node_id: parentNodeId,
        ordering: orderValue,
      });

      resetFields();
      fetchTree();
    } catch (error) {
      console.error("Error updating node:", error);
    }
  };

  const deleteNode = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/nodes/${id}`);
      fetchTree();
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  const handleEditClick = (node: Node) => {
    setNewNodeTitle(node.title);
    setParentId(
      node.parent_node_id !== null ? node.parent_node_id.toString() : ""
    );
    setOrder(node.ordering.toString());
    setEditNodeId(node.id);
  };

  const renderTree = (nodes: Node[], parentId: number | null = null) => {
    const filteredNodes = nodes.filter(
      (node) => node.parent_node_id === parentId
    );

    return (
      <div className="flex flex-col items-center my-2">
        {filteredNodes.length > 0 && (
          <div className="flex flex-row justify-center space-x-4">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                className="flex flex-col items-center mx-2 relative"
              >
                {node.parent_node_id !== null && (
                  <div className="absolute top-0 w-px h-8 bg-white z-0"></div>
                )}
                <div className="card bg-gray-800 w-24 h-auto text-xs p-2 shadow-md rounded-lg mb-2 z-0">
                  <div>ID: {node.id}</div>
                  <div>Title: {node.title}</div>
                  <div>
                    Parent Node:{" "}
                    {node.parent_node_id !== null
                      ? node.parent_node_id
                      : "NULL"}
                  </div>
                  <div>Order: {node.ordering}</div>
                  {node.parent_node_id !== null && (
                    <button
                      onClick={() => deleteNode(node.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => handleEditClick(node)}
                    className="text-blue-500 hover:underline ml-2"
                  >
                    Update
                  </button>
                </div>
                {renderTree(nodes, node.id)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const scale = Math.max(0.1, 1 - (tree.length / 10) * 0.1);

  return (
    <div>
      <div className="fixed pt-0 top-0 bg-base-100 w-full left-0 right-0 p-4 z-10">
        <h1>Tree Structure</h1>
        <div className="flex justify-center space-x-4 mt-2 mb-2">
          <div className="flex flex-col">
            <label className="text-sm">Node Title</label>
            <input
              type="text"
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder="New node title"
              className="input-sm bg-base-200 rounded"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm">Parent Node ID</label>
            <input
              type="text"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              placeholder="Leave empty for root"
              className="input-sm bg-base-200 rounded"
            />
          </div>
          {editNodeId && (
            <div className="flex flex-col">
              <label className="text-sm">Order</label>
              <input
                type="text"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Node Order (optional)"
                className="input-sm bg-base-200 rounded"
              />
            </div>
          )}
        </div>
        <button
          onClick={editNodeId ? updateNode : addNode}
          className="btn-sm bg-base-200 rounded"
        >
          {editNodeId ? "Update Node" : "Add Node"}
        </button>
        {editNodeId && (
          <button
            onClick={resetFields}
            className="btn-sm bg-red-900 rounded ml-4"
          >
            Cancel
          </button>
        )}
      </div>
      <div
        className="mt-28 flex justify-center"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
        <div className="flex flex-col items-center">
          {!loading && !error && renderTree(tree)}
        </div>
      </div>
    </div>
  );
};

export default Tree;
