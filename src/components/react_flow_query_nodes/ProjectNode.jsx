import { useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";

import { errorToast } from "../../utils/Toasts";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";

import "./ProjectNode.scss";

const ACCEPT_CONNECTIONS = [
  "selectNode",
  "joinNode",
  "groupByNode",
  "aggregateNode",
];

export const ProjectNode = ({ id, data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [dialogEnabled, setDialogEnabled] = useState(false);
  const [connectedNode, setConnectedNode] = useState(data.connectedNode ?? null);
  const [selectedFields, setSelectedFields] = useState([]);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!dialogEnabled) {
      errorToast("Please connect a node first");
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

  function onNodeConnect(o) {
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

    data.fields = selectedFields;
    data.json = {
      fields: selectedFields.filter(field => field.checked).map(field => field.field.name),
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
    if (connectedNode === null) {
      setSelectedFields([]);
      setDialogEnabled(false);
      return;
    }

    if ("fields" in connectedNode.data) {
      const hasSelectedFields = "json" in data;
      const fieldsSelected = {};
      if (hasSelectedFields)
        for (const fieldName of data.json.fields)
          fieldsSelected[fieldName] = true;

      const fields = connectedNode.data.fields.filter(field => field.checked).map(field => field.field);
      const fields2 = fields.map(field => ({
        checked: hasSelectedFields ? field.name in fieldsSelected : false,
        field,
      }));
      setSelectedFields(fields2);

      data.fields = fields2;
      data.json = {
        fields: fields2.filter(field => field.checked).map(field => field.field.name),
      };

      setDialogEnabled(true);
    } else {
      setSelectedFields([]);
      setDialogEnabled(false);
    }
  }, [connectedNode]);

  return (
    <>
      <div
        className="query-project-node"
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
        <span>Project</span>
      </div>
      <dialog
        ref={dialogRef}
        className="qpn-dialog"
        onClose={dialogReset}
      >
        <div className="qpn-body">
          <div className="head">
            <span className="title">Project</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>

          <div className="field">
            <label>Select fields</label>
            <div className="select-fields">
              {
                selectedFields.map((field, i) => (
                  <div key={field.field.fieldId} className="select-field">
                    <input
                      type="checkbox"
                      checked={field.checked}
                      onChange={e => {
                        selectedFields[i].checked = e.target.checked;
                        setSelectedFields([...selectedFields]);
                      }}
                    />
                    {/* <span>{field.field.name} : <strong>{field.field.type}</strong></span> */}
                    <span>{field.field.name}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <button onClick={onContinue}>Continue</button>
        </div>
      </dialog>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        onConnect={onNodeConnect}
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
