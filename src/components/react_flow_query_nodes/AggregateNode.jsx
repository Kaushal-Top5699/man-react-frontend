import { useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
} from "reactflow";

import { errorToast } from "../../utils/Toasts";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";

import "./AggregateNode.scss";

const ACCEPT_CONNECTIONS = [
  "selectNode",
  "joinNode",
  "groupByNode",
  "aggregateNode",
];

export const AggregateNode = ({ id, data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [canContinue, setCanContinue] = useState(true);

  const [aggregate, setAggregate] = useState(data.json?.function ?? "sum");
  const [connectedNode, setConnectedNode] = useState(data.connectedNode ?? null);
  const [selectedFields, setSelectedFields] = useState(() => {
    return data.json?.fields?.map(fieldName => ({
      checked: true,
      field: {
        fieldId: `${Date.now()}`,
        name: fieldName,
        type: "integer",
      },
    })) ?? [];
  });

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (connectedNode === null || !connectedNode.data?.fields) {
      errorToast("Please connect a node and setup first");
      return;
    }

    dialogRef.current.showModal();
  }
  function nodeRemove(e) {
    e.preventDefault();
    e.stopPropagation();

    if ("onNodeRemove" in data)
      data.onNodeRemove();
  }

  function onConnectNode(o) {
    const nodeId = o.target;
    const selectedNode = data.nodes().find(node => node.id === nodeId);
    if (!selectedNode) {
      setConnectedNode(null);
      return;
    }

    setConnectedNode(selectedNode);
  }

  function onContinue(e) {
    e.preventDefault();
    e.stopPropagation();

    data.fields = [
      ...(connectedNode !== null ? connectedNode.data.fields : []),
      ...selectedFields
        .filter(field => field.checked)
        .map(field => ({
          ...field,
          field: {
            fieldId: String(Date.now()),
            name: `${aggregate.toUpperCase()}(${field.field.name})`,
            type: "integer",
          },
        })),
    ];
    data.json = {
      function: aggregate.toUpperCase(),
      fields: selectedFields
        .filter(field => field.checked)
        .map(field => field.field.name),
    };

    if ("onDone" in data)
      data.onDone();

    dialogRef.current.close();
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    if (["sum", "avg", "min", "max"].includes(aggregate))
      selectedFields.forEach(field => {
        if (!/^(integer|integer +long|float)$/i.test(field.field.type))
          field.checked = false;
      });
    setSelectedFields([...selectedFields]);
  }, [aggregate]);

  useEffect(() => {
    if (connectedNode !== null) {
      const hasJson = "json" in data;

      setAggregate(data.json?.function?.toLowerCase() ?? "sum");
      setSelectedFields(
        connectedNode.data.fields
          .filter(field => field.checked)
          .map(field => ({
            checked: hasJson && !!data.json.fields.find(_field => _field === field.field.name),
            field: field.field,
          }))
      );
    } else {
      setSelectedFields([]);
    }
  }, [connectedNode]);

  useEffect(() => {
    data.fields = [
      ...(connectedNode !== null ? connectedNode.data.fields : []),
      ...selectedFields
        .filter(field => field.checked)
        .map(field => ({
          ...field,
          field: {
            fieldId: String(Date.now()),
            name: `${aggregate.toUpperCase()}(${field.field.name})`,
            type: "integer",
          },
        })),
    ];
    data.json = {
      function: aggregate.toUpperCase(),
      fields: selectedFields
        .filter(field => field.checked)
        .map(field => field.field.name),
    };

    setCanContinue(true);
  }, [selectedFields]);

  return (
    <>
      <div
        className="query-aggregate-node"
        onClick={onClick}
        onKeyDown={onClick}
        onMouseEnter={() => setShowDismiss(true)}
        onMouseLeave={() => setShowDismiss(false)}
      >
        {
          showDismiss &&
          <img
            className="dismiss-node"
            src={RemoveNodeIcon}
            alt="Dismiss"
            onClick={nodeRemove}
            onKeyDown={nodeRemove}
          />
        }
        <span>Aggregate</span>
        {
          aggregate.trim().length > 0 &&
          <span className="aggregate-func-name">{`${aggregate.toUpperCase()}`}</span>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="qaggn-dialog"
        onClose={dialogReset}
      >
        <div className="qaggn-body">
          <div className="head">
            <span className="title">Aggregate</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>

          <div className="field">
            <span className="title">Select an Aggregate function</span>
            <select
              value={aggregate}
              onChange={e => setAggregate(e.target.value)}
            >
              <option value="sum">Sum</option>
              <option value="avg">Avg</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
          </div>

          {
            aggregate !== "-none-" &&
            <div className="field">
              <span className="title">Select fields to Aggregate:</span>
              <div className="fields">
                {
                  (
                    ["sum", "avg", "min", "max"].includes(aggregate) ?
                      selectedFields.filter(field => /^(integer|integer +long|float)$/i.test(field.field.type))
                      :
                      selectedFields
                  )
                    .map((field, i) => (
                      <div key={field.field.name} className="field">
                        <div className="field-body">
                          <div className="field-head">
                            <input
                              type="checkbox"
                              checked={field.checked}
                              onChange={e => {
                                field.checked = e.target.checked;
                                setSelectedFields([...selectedFields]);
                              }}
                            />

                            <span>{aggregate.toUpperCase()}{` (`}<strong>{field.field.name}</strong>{`)`}</span>
                          </div>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          }

          <button
            disabled={!canContinue}
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </dialog>
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        onConnect={console.log}
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        onConnect={onConnectNode}
        isValidConnection={(c) => {
          const target = c.target;
          if (target === null || target === id) return false;

          const targetNode = data.nodes().find(node => node.id === target);
          if (!targetNode) return false;

          return ACCEPT_CONNECTIONS.includes(targetNode.type);
        }}
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
    </>
  );
};