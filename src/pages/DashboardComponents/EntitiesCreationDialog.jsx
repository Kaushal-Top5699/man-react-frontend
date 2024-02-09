import { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
} from "reactflow";

import {
  commit as commitApi,
} from "../../services/Api_v1";

import { StreamNode } from "../../components/react_flow_nodes/StreamNode";
import { EnumNode } from "../../components/react_flow_nodes/EnumNode";

import {
  useStatev2,
} from "../../hooks/UseStatev2";
import {
  useEdgesStatev2,
  useNodesStatev2,
} from "../../hooks/ReactFlowHooks";

import { errorToast, informativeToast } from "../../utils/Toasts";

import DismissIcon from "../../assets/svgs/dismiss.svg";

import "reactflow/dist/style.css";
import "./EntitiesCreationDialog.scss";

const ENTITY_TYPE_KIND_MAP = {
  streamNode: "stream",
  enumNode: "enum",
};

export const EntitiesCreationDialog = ({
  ecdRef,
  ecdPropsRef,
  dispatch = null,
  directoryRefreshCallback,
}) => {
  const nodeTypes = useMemo(() => ({
    streamNode: StreamNode,
    enumNode: EnumNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesStatev2([]);
  const [edges, setEdges, onEdgesChange] = useEdgesStatev2([]);

  const [canAddStream, setCanAddStream] = useStatev2(true);
  const [canAddEnum, setCanAddEnum] = useStatev2(true);
  const [canCommit, setCanCommit] = useStatev2(false);

  ecdPropsRef.current.init = () => {
    if (ecdPropsRef.current.nodeType === "streamNode") {
      const node = ecdPropsRef.current.streamNode;
      node.data = {
        ...node.data,
        noAutoOpenDialog: true,
        readOnlyStreamName: true,
        readOnlyNode: true,
        reservedStreamNames: () => [
          ...(ecdPropsRef.current.streams?.map(stream => stream.streamName) ?? []),
        ],
        enums: () => [
          ...(ecdPropsRef.current.enums ?? []),
        ],
        onNodeRemove: () => {
          const updatedNodes = nodes().filter(_node => _node.id !== node.id);
          setNodes(updatedNodes);

          setCanCommit(updatedNodes.length > 0 && canAddEnum);
          setCanAddStream(updatedNodes.length === 0 || updatedNodes.every(node => node.type !== "streamNode" || node.data.json !== undefined));
        },
        onFinishHandler: () => {
          setCanCommit(nodes().length > 0 && nodes().every(node => !!node.data.json));
          setCanAddStream(nodes().length === 0 || nodes().every(node => node.type !== "streamNode" || node.data.json !== undefined));
        },
      };

      setNodes([node]);
    } else if (ecdPropsRef.current.nodeType === "enumNode") {
      const node = ecdPropsRef.current.enumNode;

      node.data = {
        ...node.data,
        noAutoOpenDialog: true,
        readOnlyEnumName: true,
        readOnlyNode: true,
        reservedEnumNames: () => [
          ...(ecdPropsRef.current.enums?.map(enm => enm.enumName) ?? []),
        ],
        onNodeRemove: () => {
          const updatedNodes = nodes().filter(_node => _node.id !== node.id);
          setNodes(updatedNodes);

          setCanCommit(updatedNodes.length > 0 && canAddStream);
          setCanAddEnum(updatedNodes.length === 0 || updatedNodes.filter(node => node.type === "enumNode").every(node => node.data.json !== undefined));
        },
        onFinishHandler: () => {
          setCanCommit(nodes().length > 0 && nodes().every(node => !!node.data.json));
          setCanAddEnum(nodes().length === 0 || nodes().filter(node => node.type === "enumNode").every(node => node.data.json !== undefined));
        },
      };

      setNodes([node]);
    }
  };

  async function addStream() {
    const node = {
      id: String(Date.now()),
      type: "streamNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        reservedStreamNames: () => [
          ...nodes()
            .filter(_node => _node.type === "streamNode" && _node.data.json !== undefined && _node.id !== node.id)
            .map(node => node.data.streamName),
          ...(ecdPropsRef.current.streams?.map(stream => stream.streamName) ?? []),
        ],
        enums: () => [
          ...nodes()
            .filter(node => node.type === "enumNode" && node.data.json !== undefined)
            .map(node => node.data.json),
          ...(ecdPropsRef.current.enums ?? []),
        ],
        streamName: "",
        attributes: [],
        onNodeRemove: () => {
          const updatedNodes = nodes().filter(_node => _node.id !== node.id);
          setNodes(updatedNodes);

          setCanCommit(updatedNodes.length > 0 && canAddEnum);
          setCanAddStream(updatedNodes.length === 0 || updatedNodes.every(node => node.type !== "streamNode" || node.data.json !== undefined));
        },
        onFinishHandler: () => {
          setCanCommit(nodes().length > 0 && nodes().every(node => !!node.data.json));
          setCanAddStream(nodes().length === 0 || nodes().every(node => node.type !== "streamNode" || node.data.json !== undefined));
        },
      },
    };
    setNodes([...nodes(), node]);

    setCanAddStream(false);
    setCanCommit(false);
  }
  async function addEnum() {
    const node = {
      id: String(Date.now()),
      type: "enumNode",
      position: {
        x: 50,
        y: 50,
      },
      data: {
        reservedEnumNames: () => [
          ...nodes()
            .filter(_node => _node.type === "enumNode" && _node.data.json !== undefined && _node.id !== node.id)
            .map(node => node.data.enumName),
          ...(ecdPropsRef.current.enums?.map(enm => enm.enumName) ?? []),
        ],
        enumName: "",
        values: [],
        onNodeRemove: () => {
          const updatedNodes = nodes().filter(_node => _node.id !== node.id);
          setNodes(updatedNodes);

          setCanCommit(updatedNodes.length > 0 && canAddStream);
          setCanAddEnum(updatedNodes.length === 0 || updatedNodes.filter(node => node.type === "enumNode").every(node => node.data.json !== undefined));
        },
        onFinishHandler: () => {
          setCanCommit(nodes().length > 0 && nodes().every(node => !!node.data.json));
          setCanAddEnum(nodes().length === 0 || nodes().filter(node => node.type === "enumNode").every(node => node.data.json !== undefined));
        },
      },
    };
    setNodes([...nodes(), node]);

    setCanAddEnum(false);
    setCanCommit(false);
  }

  async function commit() {
    ecdPropsRef.current.commitCallback(nodes, ENTITY_TYPE_KIND_MAP);
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();

    setNodes([]);
    setEdges([]);
    setCanAddEnum(true);
    setCanAddStream(true);
    setCanCommit(false);
  }

  return (
    <dialog
      ref={ecdRef}
      className="entities-creation-dialog"
      onClose={dialogReset}
    >
      <div className="ecd-body">
        <div className="dismiss-btn-container">
          <img
            className="dismiss-btn"
            src={DismissIcon}
            alt="Dismiss"
            onClick={() => ecdRef.current.close()}
            onKeyDown={() => ecdRef.current.close()}
          />
        </div>
        <div className="content">
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes()}
            edges={edges()}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
          <div className="controls-container">
            <div className="controls">
              <button onClick={addStream} disabled={!canAddStream()} type="stream-button">Stream</button>
              <button onClick={addEnum} disabled={!canAddEnum()} type="enum-button">Enum</button>
            </div>

            <button
              className="entity-create"
              onClick={commit}
              disabled={!canCommit()}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
