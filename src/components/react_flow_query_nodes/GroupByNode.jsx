import { useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
} from "reactflow";

import { useStatev2 } from "../../hooks/UseStatev2";

import { errorToast } from "../../utils/Toasts";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";

import "./GroupByNode.scss";

const ACCEPT_CONNECTIONS = [
  "selectNode",
  "joinNode",
  "groupByNode",
  "aggregateNode",
];

export const GroupByNode = ({ id, data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [connectedNode, setConnectedNode] = useState(data.connectedNode ?? null);
  const [selectedFields, setSelectedFields] = useStatev2([]);
  const [havingCondition, setHavingCondition] = useState(data.having ?? {
    attribute: "0",
    operator: "eq",
    rhs: "",
  });

  const canContinue = selectedFields().filter(field => field.checked).length > 0 && !validateWhereCondition();

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (connectedNode === null || !connectedNode.data?.fields) {
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

  function onConnectNode(o) {
    const targetId = o.target;
    const targetNode = data.nodes().find(node => node.id === targetId);
    if (!targetNode) {
      setConnectedNode(null);
      return;
    }

    setConnectedNode(targetNode);
  }

  function onContinue(e) {
    e.preventDefault();
    e.stopPropagation();

    data.fields = [
      ...(connectedNode !== null ? connectedNode.data.fields : []),
      ...selectedFields()
        .filter(field => field.checked)
        .map(field => field.field),
    ];
    data.having = havingCondition;
    data.json = {
      fields: selectedFields()
        .filter(field => field.checked)
        .map(field => field.field.name),
      having: [
        selectedFields().find(field => field.field.fieldId === havingCondition.attribute).field.name,
        havingCondition.operator,
        havingCondition.rhs,
      ],
    };

    if ("onDone" in data)
      data.onDone();

    dialogRef.current.close();
  }

  function validateWhereCondition() {
    if (havingCondition.rhs?.trim()?.length === 0)
      return <span className="error-message">* Value is required</span>;

    return null;
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    if (connectedNode !== null) {
      const hasJson = "json" in data;

      const selectedFields = connectedNode.data.fields
        .filter(field => field.checked)
        .map(field => ({
          checked: hasJson && !!data.json.fields.find(_field => _field === field.field.name),
          field: field.field,
        }));
      setSelectedFields(selectedFields);

      if (data.json?.having)
        setHavingCondition({
          attribute: String(selectedFields.findIndex(field => field.field.name === data.json?.having[0]) ?? 0),
          operator: data.json?.having[1] ?? "eq",
          rhs: data.json?.having[2] ?? "",
        });
      else
        setHavingCondition({
          attribute: "0",
          operator: "eq",
          rhs: "",
        });
    } else {
      setSelectedFields([]);
      setHavingCondition("");
    }
  }, [connectedNode]);

  useEffect(() => {
    if (selectedFields().length === 0) return;

    data.fields = [
      ...(connectedNode !== null ? connectedNode.data.fields : []),
      ...selectedFields()
        .filter(field => field.checked)
        .map(field => field.field),
    ];
    data.having = havingCondition;
    data.json = {
      fields: selectedFields()
        .filter(field => field.checked)
        .map(field => field.field.name),
      having: [
        selectedFields().find(field => field.field.fieldId === havingCondition.attribute)?.field?.name ?? selectedFields()[0].field.name,
        havingCondition.operator ?? "eq",
        havingCondition.rhs ?? "",
      ],
    };
  }, [selectedFields(), havingCondition]);

  return (
    <>
      <div
        className="query-group-by-node"
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
        <span>Group by</span>
      </div>
      <dialog
        ref={dialogRef}
        className="qgrpbyn-dialog"
        onClose={dialogReset}
      >
        <div className="qgrpbyn-body">
          <div className="head">
            <span className="title">Group by</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>

          <div className="field">
            <label>Select fields to group by</label>
            <div className="select-fields">
              {
                selectedFields().map((field, i) => (
                  <div key={field.field.fieldId} className="select-field">
                    <input
                      type="checkbox"
                      checked={field.checked}
                      onChange={e => {
                        selectedFields()[i].checked = e.target.checked;
                        setSelectedFields([...selectedFields()]);
                      }}
                    />
                    {/* <span>{field.field.name} : <strong>{field.field.type}</strong></span> */}
                    <span>{field.field.name}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="field">
            <label className="title">Where</label>

            <div className="field-body">
              <div className="having-condition-container">
                <div className="having-condition">
                  <select
                    placeholder="Attribute"
                    value={havingCondition.attribute}
                    onChange={e => {
                      havingCondition.attribute = e.target.value;
                      setHavingCondition({ ...havingCondition });
                    }}
                  >
                    {
                      selectedFields().map(field => (
                        <option key={field.field.fieldId} value={field.field.fieldId}>{field.field.name}</option>
                      ))
                    }
                  </select>

                  <select
                    placeholder="Operator"
                    value={havingCondition.operator}
                    onChange={e => {
                      havingCondition.operator = e.target.value;
                      setHavingCondition({ ...havingCondition });
                    }}
                  >
                    <option value="eq">=</option>
                    <option value="neq">{"<>"}</option>
                    <option value="lt">{"<"}</option>
                    <option value="gt">{">"}</option>
                    <option value="lte">{"<"}=</option>
                    <option value="gte">{">"}=</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Value"
                    value={havingCondition.rhs}
                    onChange={e => {
                      havingCondition.rhs = e.target.value;
                      setHavingCondition({ ...havingCondition });
                    }}
                  />
                </div>
                {validateWhereCondition()}
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            disabled={!canContinue}
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