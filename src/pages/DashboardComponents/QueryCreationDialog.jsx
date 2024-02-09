import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
} from "reactflow";

import { createEntities as createEntitiesApi } from "../../services/Api_v1";

import { useStatev2 } from "../../hooks/UseStatev2";
import {
  useEdgesStatev2,
  useNodesStatev2,
} from "../../hooks/ReactFlowHooks";

import { JoinNode } from "../../components/react_flow_query_nodes/JoinNode";
import { ProjectNode } from "../../components/react_flow_query_nodes/ProjectNode";
import { SelectNode } from "../../components/react_flow_query_nodes/SelectNode";
import { StreamNode } from "../../components/react_flow_query_nodes/StreamNode";
import { GroupByNode } from "../../components/react_flow_query_nodes/GroupByNode";
import { AggregateNode } from "../../components/react_flow_query_nodes/AggregateNode";

import { errorToast, informativeToast } from "../../utils/Toasts";

import DismissIcon from "../../assets/svgs/dismiss.svg";

import "./QueryCreationDialog.scss";

const QUERY_NAME_MATCHER = /^[a-z_]\w*$/i;

/**
 * @param {any[]} nodes 
 * @param {any[]} edges 
 * @returns {[any[], any[], any]}
 */
function sortNodesAndEdges(nodes, edges) {
  // Group nodes by id
  const grouped = {};
  for (const node of nodes)
    grouped[node.id] = node;

  // Sort nodes by level
  nodes = nodes.sort((l, r) => l.level - r.level);

  // Sort edges by source and target
  edges = edges.sort((l, r) => l["source"] === r["target"]);

  return [nodes, edges, grouped];
}

export const QueryCreationDialog = ({
  qcdRef,
  qcdPropsRef,
  createQuery,
}) => {
  const nodeTypes = useMemo(() => ({
    streamNode: StreamNode,
    selectNode: SelectNode,
    projectNode: ProjectNode,
    joinNode: JoinNode,
    groupByNode: GroupByNode,
    aggregateNode: AggregateNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesStatev2([]);
  const [edges, setEdges, onEdgesChange] = useEdgesStatev2([]);

  const [queryName, setQueryName] = useState("");
  const [canCreateQuery, setCanCreateQuery] = useState(false);

  const [streams, setStreams] = useStatev2([]);
  const [enums, setEnums] = useStatev2([]);

  qcdPropsRef.current.init = () => {
    setStreams(qcdPropsRef.current?.streams ?? {});
    setEnums(qcdPropsRef.current?.enums ?? {});

    if ("initialNodes" in qcdPropsRef.current && "initialEdges" in qcdPropsRef.current) {
      let initialNodes = qcdPropsRef.current.initialNodes;
      let initialEdges = qcdPropsRef.current.initialEdges;

      let groupedNodes;
      [initialNodes, initialEdges, groupedNodes] = sortNodesAndEdges(initialNodes, initialEdges);

      // Pre-process nodes
      for (const node of initialNodes) {
        if (node.type === "streamNode") {
          const newData = {
            json: {
              ...node.data,
            },
            allStreams: streams,
            selectedStream: node.data.stream ?? "-none-",
            onDone: () => {
              setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
            },
            onNodeRemove: () => {
              removeNode(node.id);
            },
          };

          node.data = newData;
        } else if (
          node.type === "selectNode" ||
          node.type === "projectNode" ||
          node.type === "joinNode" ||
          node.type === "groupByNode" ||
          node.type === "aggregateNode"
        ) {
          const newData = {
            json: {
              ...node.data,
            },
            nodes,
            onDone: () => {
              setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
            },
            onNodeRemove: () => {
              removeNode(node.id);
            },
          };

          node.data = newData;
        }
      }

      // Pre-process edges
      for (const edge of initialEdges) {
        const sourceNode = groupedNodes[edge.source];
        const targetNode = groupedNodes[edge.target];

        if (
          sourceNode.type === "selectNode" ||
          sourceNode.type === "projectNode" ||
          sourceNode.type === "groupByNode" ||
          sourceNode.type === "aggregateNode"
        ) {
          sourceNode.data.connectedNode = targetNode;
        } else if (sourceNode.type === "joinNode") {
          if (edge.sourceHandle === "b")
            sourceNode.data.connectedLeftNode = targetNode;
          else if (edge.sourceHandle === "c")
            sourceNode.data.connectedRightNode = targetNode;
        }
      }

      setNodes(initialNodes);
      setEdges(initialEdges);

      if (qcdPropsRef.current.queryName)
        setQueryName(qcdPropsRef.current.queryName);
    }
  };

  useEffect(() => {
    setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
  }, [nodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );
  const onNodesDelete = useCallback(
    (deleted) => {
      const deletedIds = {};
      deleted.forEach(node => deletedIds[node.id] = true);

      setEdges(
        edges().filter(edge => !(edge["source"] in deletedIds) && !(edge["target"] in deletedIds)),
      );
    },
    [nodes(), edges()]
  );

  function validateQueryName() {
    if (queryName.trim().length === 0)
      return <span className="error-message">* Query name is required</span>;
    if (!QUERY_NAME_MATCHER.test(queryName))
      return <span className="error-message">* Query name cannot begin with a digit and can only contain alphanumeric and underscore characters</span>;

    return null;
  }

  function removeNode(id) {
    const node = nodes().find(node => node.id === id);
    setNodes(nodes().filter(node => node.id !== id));
    onNodesDelete([node]);
  }

  function addStreamNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 1,
      id: String(Date.now()),
      type: "streamNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        allStreams: streams,
        selectedStream: "-none-",
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };

    setNodes([...nodes(), node]);
  }
  function addSelectNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 2,
      id: String(Date.now()),
      type: "selectNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        nodes,
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };
    setNodes([...nodes(), node]);
  }
  function addProjectNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 4,
      id: String(Date.now()),
      type: "projectNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        nodes,
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };
    setNodes([...nodes(), node]);
  }
  function addJoinNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 3,
      id: String(Date.now()),
      type: "joinNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        nodes,
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };
    setNodes([...nodes(), node]);
  }
  function addGroupByNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 3,
      id: String(Date.now()),
      type: "groupByNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        nodes,
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };
    setNodes([...nodes(), node]);
  }
  function addAggregateNode(e) {
    e.preventDefault();
    e.stopPropagation();

    const node = {
      level: 3,
      id: String(Date.now()),
      type: "aggregateNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        nodes,
        onDone: () => {
          setCanCreateQuery(nodes().length > 0 && nodes().every(node => "json" in node.data));
        },
        onNodeRemove: () => {
          removeNode(node.id);
        },
      },
    };
    setNodes([...nodes(), node]);
  }

  async function queryCallback(e) {
    e.preventDefault();
    e.stopPropagation();

    await createQuery(queryName, nodes(), edges());
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();

    setQueryName("");
    setNodes([]);
    setEdges([]);
    setCanCreateQuery(false);
  }

  return (
    <dialog
      ref={qcdRef}
      className="query-creation-dialog"
      onClose={dialogReset}
    >
      <div className="qcd-body">
        <div className="dismiss-btn-container">
          <img
            className="dismiss-btn"
            src={DismissIcon}
            alt="Dismiss"
            onClick={() => qcdRef.current.close()}
            onKeyDown={() => qcdRef.current.close()}
          />
        </div>
        <div className="content">
          <ReactFlow
            key="react-flow-2"
            nodeTypes={nodeTypes}
            nodes={nodes()}
            edges={edges()}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>

          <div className="controls-container">
            <div className="query-name-input-container">
              <input
                type="text"
                placeholder="Query name"
                value={queryName}
                onChange={e => setQueryName(e.target.value)}
                readOnly={"queryNameReadOnly" in qcdPropsRef.current ? qcdPropsRef.current.queryNameReadOnly : false}
              />
              {validateQueryName()}
            </div>

            <div className="widgets-container">
              <span className="title">Widgets</span>
              <div className="widgets">
                <button onClick={addStreamNode} type="stream-button">Stream</button>
                <button onClick={addSelectNode} type="select-button">Select</button>
                <button onClick={addProjectNode} type="project-button">Project</button>
                <button onClick={addJoinNode} type="join-button">Join</button>
                <button onClick={addGroupByNode} type="group-by-button">Group by</button>
                <button onClick={addAggregateNode} type="aggregate-button">Aggregate</button>
              </div>
            </div>

            <div className="stream-details-container">
              <span className="title">Stream-details</span>
              <div className="stream-details">

              </div>
            </div>

            <div className="actions">
              <button
                className="query-create"
                onClick={queryCallback}
                disabled={validateQueryName() || !canCreateQuery}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
