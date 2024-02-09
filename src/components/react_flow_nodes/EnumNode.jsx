import { useEffect, useRef, useState } from "react";

import TrashIcon from "../../assets/svgs/trash.svg";
import RemoveNodeIcon from "../../assets/svgs/remove.svg";

import "./EnumNode.scss";

const ENUM_NAME_REGEX = /^[a-z_]\w*$/i;
const ENUM_VALUES_REGEX = /^[a-z_]\w*$/i;
const PRIMITIVE_TYPES = [
  "string",
  "integer",
  "integer long",
  "float",
  "boolean",
  "vector",
];

export const EnumNode = ({ data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [enumName, setEnumName] = useState(data.enumName ?? "");
  const [values, setValues] = useState(data.values ?? []);

  function onClick() {
    dialogRef.current.showModal();
  }

  function nodeRemove(e) {
    e.preventDefault();
    e.stopPropagation();

    if ("onNodeRemove" in data)
      data.onNodeRemove();
  }

  function validateEnumName() {
    if (enumName.trim().length === 0) return <span className="error-message">* Please provide Enum name</span>;
    if (!ENUM_NAME_REGEX.test(enumName))
      return <span className="error-message">* Enum name can only contain alphabets, digits, and underscores</span>;
    if (!data.readOnlyEnumName && data.reservedEnumNames()?.includes(enumName))
      return <span className="error-message">* Enum names must be unique</span>;
    if (PRIMITIVE_TYPES.includes(enumName.trim()))
      return <span className="error-message">* Enum names cannot be named after primitive types</span>;

    return null;
  }
  function validateEnumValue(i) {
    if (values[i].data.trim().length === 0) return <span className="error-message">* Please provide Enum value</span>;
    if (!ENUM_VALUES_REGEX.test(values[i].data))
      return <span className="error-message">* Enum values can only contain alphabets, digits, and underscores</span>;
    if (values.find((value, _i) => _i !== i && value.data.trim() === values[i].data.trim()))
      return <span className="error-message">* Enum values must be unique</span>;

    return null;
  }

  function formSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    if (validateEnumName()) return;

    const errIndex = values.findIndex((value, i) => {
      return !ENUM_VALUES_REGEX.test(value.data) ||
        !!values.find((_value, _i) => _i !== i && _value.data === value.data);
    });
    if (errIndex !== -1) return;

    data.enumName = enumName;
    data.values = values;

    const json = {
      enumName,
      values: values.map((value, index) => [
        value.data,
        index,
      ]),
    };
    data.json = json;

    if ("onFinishHandler" in data)
      data.onFinishHandler();

    dialogRef.current.close();
  }

  function dialogReset() {
    setEnumName(data.enumName);
    setValues(data.values);
  }

  useEffect(() => {
    if (dialogRef.current && !data.noAutoOpenDialog)
      onClick();
  }, [dialogRef]);

  return (
    <>
      <div
        className="enum-node"
        onClick={onClick}
        onKeyDown={onClick}
        onMouseEnter={() => setShowDismiss(!data.readOnlyNode)}
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
        <span>Enum</span>
        {
          enumName.trim().length > 0 &&
          <span className="enum-name">{`${enumName}`}</span>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="enum-node-editor-dialog nodrag"
        onClose={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      >
        <div className="dialog-content no-drag">
          <form onSubmit={formSubmit}>
            <div className="field">
              <label htmlFor="enum-name">Name</label>
              <input
                name="enum-name"
                type="text"
                placeholder="Name of the Enum"
                value={enumName}
                onChange={(e) => setEnumName(e.target.value)}
                readOnly={data.readOnlyEnumName ?? false}
              />
              {validateEnumName()}
            </div>

            <hr />
            <div className="field">
              <label>Values</label>
              <div className="values">
                <div
                  className="add-value"
                  onClick={() => setValues([...values, { id: Date.now(), data: "" }])}
                  onKeyDown={() => setValues([...values, { id: Date.now(), data: "" }])}
                >
                  + Add
                </div>
                {
                  values.map((value, index) => (
                    <div key={value.id} className="value-container">
                      <div className="value">
                        <input
                          type="text"
                          placeholder="Enum value"
                          value={value.data}
                          onChange={e => {
                            values[index].data = e.target.value;
                            setValues([...values]);
                          }}
                        />
                        <img
                          src={TrashIcon}
                          alt="Delete value"
                          onClick={() => setValues(values.filter((_, i) => i !== index))}
                          onKeyDown={() => setValues(values.filter((_, i) => i !== index))}
                        />
                      </div>
                      {validateEnumValue(index)}
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="actions">
              <button onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                dialogReset();
                dialogRef.current.close();
              }}>Cancel</button>
              <button type="submit" disabled={values.length === 0}>Finish</button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
};