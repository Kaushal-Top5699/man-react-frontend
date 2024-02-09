import { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";

import { useStatev2 } from "../../hooks/UseStatev2";

import { errorToast } from "../../utils/Toasts";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";
import DeleteIcon from "../../assets/svgs/trash.svg";

import "./JoinNode.scss";

const ACCEPT_CONNECTIONS = [
  "selectNode",
  "joinNode",
  "groupByNode",
  "aggregateNode",
];

const OPERATORS_MAP = {
  eq: "=",
  neq: "<>",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
};

export const JoinNode = ({ id, data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [leftConnectedNode, setLeftConnectedNode] = useState(data.connectedLeftNode ?? null);
  const [rightConnectedNode, setRightConnectedNode] = useState(data.connectedRightNode ?? null);
  const [selectedFields, setSelectedFields] = useStatev2([]);
  const [leftSelectedFields, setLeftSelectedFields] = useStatev2([]);
  const [rightSelectedFields, setRightSelectedFields] = useStatev2([]);

  const [whereCondition, setWhereCondition] = useState({
    leftAttribute: "0",
    operator: "=",
    rightAttribute: "0",
  });

  useEffect(() => {
    if (leftConnectedNode !== null && rightConnectedNode !== null) {
      const leftSelectedFields = leftConnectedNode.data.fields.filter(field => field.checked);
      setLeftSelectedFields(leftSelectedFields);

      const rightSelectedFields = rightConnectedNode.data.fields.filter(field => field.checked);
      setRightSelectedFields(rightSelectedFields);

      setSelectedFields([
        ...leftSelectedFields,
        ...rightSelectedFields,
      ]);
    }
  }, [leftConnectedNode, rightConnectedNode]);

  useEffect(() => {
    if (leftConnectedNode !== null && rightConnectedNode !== null) {
      const whereCondition = {
        leftAttribute: String(leftSelectedFields().findIndex(field => field.field.name === data.json?.where[0])),
        operator: data.json?.where[1] ?? "eq",
        rightAttribute: String(rightSelectedFields().findIndex(field => field.field.name === data.json?.where[2])),
      };
      if (whereCondition.leftAttribute === "-1")
        whereCondition.leftAttribute = "0";
      if (whereCondition.rightAttribute === "-1")
        whereCondition.rightAttribute = "0";
      setWhereCondition(whereCondition);

      data.left = leftConnectedNode;
      data.right = rightConnectedNode;
      data.fields = selectedFields();
      data.where = whereCondition;

      const allFields = [
        ...leftConnectedNode.data.fields.filter(field => field.checked).map(field => field.field),
        ...rightConnectedNode.data.fields.filter(field => field.checked).map(field => field.field),
      ];
      data.json = {
        fields: allFields.map(field => field.name),
        where: [
          leftSelectedFields().find(field => field.field.fieldId === whereCondition.leftAttribute).field.name,
          whereCondition.operator,
          rightSelectedFields().find(field => field.field.fieldId === whereCondition.rightAttribute).field.name,
        ],
      };
    }
  }, [selectedFields()]);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (
      leftConnectedNode === null ||
      rightConnectedNode === null ||
      (leftConnectedNode.data.json === undefined || rightConnectedNode.data.json === undefined)
    ) {
      errorToast("Please connect and setup Select nodes first");
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

  function onLeftNodeConnect(o) {
    const targetId = o.target;
    const selectNode = data.nodes().find(node => node.id === targetId);
    if (!selectNode) {
      setLeftConnectedNode(null);
      return;
    }

    setLeftConnectedNode(selectNode);
  }

  function onRightNodeConnect(o) {
    const targetId = o.target;
    const selectNode = data.nodes().find(node => node.id === targetId);
    if (!selectNode) {
      setRightConnectedNode(null);
      return;
    }

    setRightConnectedNode(selectNode);
  }

  function onContinue(e) {
    e.preventDefault();
    e.stopPropagation();

    data.left = leftConnectedNode;
    data.right = rightConnectedNode;
    data.fields = selectedFields();
    data.where = whereCondition;

    const allFields = [
      ...leftConnectedNode.data.fields.filter(field => field.checked).map(field => field.field),
      ...rightConnectedNode.data.fields.filter(field => field.checked).map(field => field.field),
    ];
    data.json = {
      fields: allFields.map(field => field.name),
      where: [
        leftSelectedFields().find(field => field.field.fieldId === whereCondition.leftAttribute).field.name,
        whereCondition.operator,
        rightSelectedFields().find(field => field.field.fieldId === whereCondition.rightAttribute).field.name,
      ],
    };

    if ("onDone" in data)
      data.onDone();

    dialogRef.current.close();
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();

    setWhereCondition(data.where);
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
      <div
        className="query-join-node"
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
        <span>Join</span>

        {
          (leftConnectedNode !== null && rightConnectedNode !== null) &&
          (whereCondition.leftAttribute !== "-1" && whereCondition.rightAttribute !== "-1") &&
          (
            leftSelectedFields().find(field => field.field.fieldId === whereCondition.leftAttribute) &&
            rightSelectedFields().find(field => field.field.fieldId === whereCondition.rightAttribute)
          ) &&
          <div
            className="query-join-node-where-condition"
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
              `${leftSelectedFields().find(field => field.field.fieldId === whereCondition.leftAttribute).field.name} ${OPERATORS_MAP[whereCondition.operator]} ${rightSelectedFields().find(field => field.field.fieldId === whereCondition.rightAttribute).field.name}`
            }
          </div>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="qjn-dialog"
        onClose={dialogReset}
      >
        <div className="qjn-body">
          <div className="head">
            <span className="title">Join</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>

          <div className="field">
            <label className="title">Where</label>

            <div className="field-body">
              <div key={whereCondition.id} className="where-condition-container">
                <div className="where-condition">
                  <select
                    placeholder="Attribute"
                    value={whereCondition.leftAttribute}
                    onChange={e => {
                      whereCondition.leftAttribute = e.target.value;
                      setWhereCondition({ ...whereCondition });
                    }}
                  >
                    {
                      leftSelectedFields().map(field => (
                        <option key={field.field.fieldId} value={field.field.fieldId}>{field.field.name}</option>
                      ))
                    }
                  </select>

                  <select
                    placeholder="Operator"
                    value={whereCondition.operator}
                    onChange={e => {
                      whereCondition.operator = e.target.value;
                      setWhereCondition({ ...whereCondition });
                    }}
                  >
                    <option value="eq">=</option>
                    <option value="neq">{"<>"}</option>
                    <option value="lt">{"<"}</option>
                    <option value="gt">{">"}</option>
                    <option value="lte">{"<"}=</option>
                    <option value="gte">{">"}=</option>
                  </select>

                  <select
                    placeholder="Attribute"
                    value={whereCondition.rightAttribute}
                    onChange={e => {
                      whereCondition.rightAttribute = e.target.value;
                      setWhereCondition({ ...whereCondition });
                    }}
                  >
                    {
                      rightSelectedFields().map(field => (
                        <option key={field.field.fieldId} value={field.field.fieldId}>{field.field.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            className="continue-button"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </dialog>
      <Handle
        type="source"
        position={Position.Left}
        id="b"
        onConnect={onLeftNodeConnect}
        isValidConnection={(c) => {
          const target = c.target;
          if (target === null || target === id) return false;

          const targetNode = data.nodes().find(node => node.id === target);
          if (!targetNode) return false;

          return ACCEPT_CONNECTIONS.includes(targetNode.type);
        }}
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="c"
        onConnect={onRightNodeConnect}
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
