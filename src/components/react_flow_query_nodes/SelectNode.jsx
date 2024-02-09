import { useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";

import { useStatev2 } from "../../hooks/UseStatev2";

import { errorToast } from "../../utils/Toasts";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";
import DeleteIcon from "../../assets/svgs/trash.svg";

import "./SelectNode.scss";

const ACCEPT_CONNECTIONS = [
  "streamNode",
];

const OPERATORS_MAP = {
  eq: "=",
  neq: "<>",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
};

export const SelectNode = ({ id, data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [connectedStream, setConnectedStream] = useState(data.connectedNode ?? null);
  const [selectedFields, setSelectedFields] = useStatev2([]);
  const [whereConditions, setWhereConditions] = useState([]);

  const canContinue = whereConditions.length === 0 || whereConditions.every((_, index) => !validateWhereCondition(index));

  useEffect(() => {
    if (connectedStream !== null) {
      // Map of selected field names
      const hasListOfSelectedFields = "json" in data;
      const fieldsSelected = {};
      if (hasListOfSelectedFields)
        for (const fieldName of data.json.fields)
          fieldsSelected[fieldName] = true;

      const selectedFields = connectedStream.data.stream.fields.map(field => ({
        ...field,
        name: `${connectedStream.data.stream.streamName}.${field.name}`,
      }));
      setSelectedFields(selectedFields);
    } else
      setSelectedFields([]);
  }, [connectedStream]);

  useEffect(() => {
    if (connectedStream === null) return;

    const whereConditions = data.json?.where?.map(whereCondition => ({
      id: String(Date.now()),
      attribute: String(selectedFields().findIndex(field => field.name === whereCondition[0])),
      operator: whereCondition[1],
      rhs: whereCondition[2],
      next: whereCondition[3],
    })) ?? [];
    setWhereConditions(whereConditions);

    data.stream = connectedStream?.data?.selectedStream;
    data.fields = selectedFields().map(field => ({
      checked: true,
      field,
    }));
    data.selectedFields = selectedFields();
    data.where = whereConditions;
    data.json = {
      stream: data.stream.streamName,
      fields: data.selectedFields.map(field => field.name),
      where: whereConditions.map(whereCondition => ([
        selectedFields().find(field => field.fieldId === whereCondition.attribute).name,
        whereCondition.operator,
        whereCondition.rhs,
        whereCondition.next,
      ])),
    };
  }, [selectedFields()]);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (connectedStream === null || !connectedStream.data?.stream?.fields) {
      errorToast("Please connect a Stream node and choose a Stream first");
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

  function onStreamConnect(o) {
    const targetId = o.target;
    const streamNode = data.nodes().find(node => node.type === "streamNode" && node.id === targetId);
    if (!streamNode) {
      setConnectedStream(null);
      return;
    }

    setConnectedStream(streamNode);
  }

  function validateWhereCondition(i) {
    const whereCondition = whereConditions[i];

    if (whereCondition.rhs.trim().length === 0)
      return <span className="error-message">* Value is required</span>;

    return null;
  }

  function onContinue(e) {
    e.preventDefault();
    e.stopPropagation();

    data.stream = connectedStream?.data?.selectedStream;
    data.fields = selectedFields().map(field => ({
      checked: true,
      field,
    }));
    data.selectedFields = selectedFields();
    data.where = whereConditions;
    data.json = {
      stream: data.stream.streamName,
      fields: data.selectedFields.map(field => field.name),
      where: whereConditions.map(whereCondition => ([
        selectedFields().find(field => field.fieldId === whereCondition.attribute).name,
        whereCondition.operator,
        whereCondition.rhs,
        whereCondition.next,
      ])),
    };

    if ("onDone" in data)
      data.onDone();

    dialogRef.current.close();
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();

    setWhereConditions(data.where ?? []);
  }

  return (
    <>
      <div
        className="query-select-node"
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
        <span>Select</span>

        {
          (whereConditions ?? []).length > 0 &&
          <div
            className="query-select-node-where-condition"
            onMouseEnter={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseLeave={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {
              whereConditions
                .map(whereCondition => `${selectedFields().find(field => field.fieldId === whereCondition.attribute).name} ${OPERATORS_MAP[whereCondition.operator]} ${whereCondition.rhs}${whereCondition.next !== null ? ` ${whereCondition.next}` : ""}`)
                .join(" ")
            }
          </div>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="qseln-dialog"
        onClose={dialogReset}
      >
        <div className="qseln-body">
          <div className="head">
            <span className="title">Select</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>

          <div className="field">
            <label className="title">Where</label>

            <button
              className="add-condition-button"
              onClick={() => {
                if (whereConditions.length > 0)
                  whereConditions[whereConditions.length - 1].next = "AND";

                setWhereConditions([
                  ...whereConditions,
                  {
                    id: String(Date.now()),
                    attribute: "0",
                    operator: "eq",
                    rhs: "",
                    next: null,
                  },
                ]);
              }}
            >
              + Add
            </button>
            <div className="field-body">
              {
                whereConditions.map((whereCondition, index) => (
                  <div key={whereCondition.id} className="where-condition-container">
                    <div className="where-condition">
                      <img
                        src={DeleteIcon}
                        alt="Delete"
                        onClick={() => {
                          if (index === whereConditions.length - 1 && index - 1 >= 0)
                            whereConditions[index - 1].next = null;

                          setWhereConditions(whereConditions.filter(_whereCondition => _whereCondition.id !== whereCondition.id));
                        }}
                        onKeyDown={() => {
                          if (index === whereConditions.length - 1 && index - 1 >= 0)
                            whereConditions[index - 1].next = null;

                          setWhereConditions(whereConditions.filter(_whereCondition => _whereCondition.id !== whereCondition.id));
                        }}
                      />
                      <select
                        placeholder="Attribute"
                        value={whereCondition.attribute}
                        onChange={e => {
                          whereCondition.attribute = e.target.value;
                          setWhereConditions([...whereConditions]);
                        }}
                      >
                        {
                          selectedFields().map(field => (
                            <option key={field.fieldId} value={field.fieldId}>{field.name}</option>
                          ))
                        }
                      </select>

                      <select
                        placeholder="Operator"
                        value={whereCondition.operator}
                        onChange={e => {
                          whereCondition.operator = e.target.value;
                          setWhereConditions([...whereConditions]);
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
                        value={whereCondition.rhs}
                        onChange={e => {
                          whereCondition.rhs = e.target.value;
                          setWhereConditions([...whereConditions]);
                        }}
                      />
                    </div>
                    {validateWhereCondition(index)}

                    {
                      whereCondition.next !== null &&
                      <div className="conditions-chaining-container">
                        <select
                          className="conditions-chaining"
                          placeholder="Chaining"
                          value={whereCondition.next}
                          onChange={e => {
                            whereCondition.next = e.target.value;
                            setWhereConditions([...whereConditions]);
                          }}
                        >
                          <option value="and">AND</option>
                          <option value="or">OR</option>
                          <option value="not">NOT</option>
                        </select>
                      </div>
                    }
                  </div>
                ))
              }
            </div>
          </div>

          <button
            className="continue-button"
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
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        isValidConnection={(c) => {
          const target = c.target;
          if (target === null || target === id) return false;

          const targetNode = data.nodes().find(node => node.id === target);
          if (!targetNode) return false;

          return ACCEPT_CONNECTIONS.includes(targetNode.type);
        }}
        onConnect={onStreamConnect}
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
    </>
  );
};
