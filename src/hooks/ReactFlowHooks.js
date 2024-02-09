import { useEffect, useRef } from "react";
import { useNodesState, useEdgesState } from "reactflow";

export function useNodesStatev2(initialValue) {
  const nodesRef = useRef(initialValue);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialValue);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  /**
   * @param {typeof nodes | Function} arg
   */
  function customSetNodes(arg) {
    if (typeof arg === "function") {
      const updatedNodes = arg(nodesRef.current);
      nodesRef.current = updatedNodes;
      return setNodes(updatedNodes);
    }

    nodesRef.current = arg;
    return setNodes(arg);
  }

  return [() => nodesRef.current, customSetNodes, onNodesChange];
}

export function useEdgesStatev2(initialValue) {
  const edgesRef = useRef(initialValue);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialValue);

  /**
   * @param {typeof nodes | Function} arg
   */
  function customSetEdges(arg) {
    if (typeof arg === "function") {
      const updatedEdges = arg(edgesRef.current);
      edgesRef.current = updatedEdges;
      return setEdges(updatedEdges);
    }

    edgesRef.current = arg;
    return setEdges(arg);
  }

  return [() => edgesRef.current, customSetEdges, onEdgesChange];
}
