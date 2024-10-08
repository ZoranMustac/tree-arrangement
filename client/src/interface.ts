export interface Node {
  id: number;
  title: string;
  parent_node_id: number | null;
  ordering: number;
}
