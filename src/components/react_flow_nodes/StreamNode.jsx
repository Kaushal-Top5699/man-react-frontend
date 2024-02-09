import { useEffect, useRef, useState } from "react";

import TrashIcon from "../../assets/svgs/trash.svg";
import RemoveNodeIcon from "../../assets/svgs/remove.svg";

import "./StreamNode.scss";

const STREAM_NAME_REGEX = /^[a-z_]\w*$/i;
const STREAM_ATTRIBUTE_NAME_REGEX = /^[a-z_]\w*$/i;
const STREAM_ATTRIBUTE_TYPE_REGEX = /^(string|integer|integer +long|float|boolean|vector)$/i;
const STREAM_ATTRIBUTE_TYPE_SIZE_MAX = 65536;

export const StreamNode = ({ data = {} }) => {
  const dialogRef = useRef(null);

  const [enums, setEnums] = useState({});

  const [showDismiss, setShowDismiss] = useState(false);
  const [streamName, setStreamName] = useState(data.streamName ?? "");
  const [attributes, setAttributes] = useState(() => {
    if (!data.attributes) return [];

    return data.attributes.map(attribute => {
      const hasSize = /^ *(string|vector)/i.test(attribute.type);

      return {
        ...attribute,
        id: Date.now(),
        type: hasSize ? /^ *(string|vector)/i.exec(attribute.type)[1] : attribute.type,
        size: hasSize ? parseInt(/\[(\d+)\] *$/.exec(attribute.type)[1], 10) : null,
      };
    });
  });
  const [selectedAttr, setSelectedAttr] = useState(-1);
  const [disableSize, setDisableSize] = useState(false);

  let selectedEnum;
  if (selectedAttr !== -1)
    selectedEnum = enums[attributes[selectedAttr].type];

  function onClick() {
    if (data.enums) {
      const temp = {};
      for (const enm of data.enums())
        temp[enm.enumName] = { ...enm, nameMatcher: RegExp(`(?:${enm.enumName}|\\[${enm.enumName}\\])`), };
      setEnums(temp);
    }

    dialogRef.current.showModal();
  }

  function nodeRemove(e) {
    e.preventDefault();
    e.stopPropagation();

    if ("onNodeRemove" in data)
      data.onNodeRemove();
  }

  function addAttribute() {
    setAttributes([
      ...attributes,
      {
        id: Date.now(),
        name: "",
        type: "string",
        size: null,
      },
    ]);
    setSelectedAttr(attributes.length);
  }
  function removeAttribute(index) {
    const temp = attributes.filter((_, i) => i !== index);
    if (selectedAttr >= temp.length) setSelectedAttr(temp.length - 1);
    setAttributes(temp);
  }

  function validateStreamName() {
    if (streamName.trim().length === 0) return <span className="error-message">* Please provide Stream name</span>;
    if (!STREAM_NAME_REGEX.test(streamName))
      return <span className="error-message">* Stream name can only contain alphabets, digits, and underscores</span>;
    if (!data.readOnlyStreamName && data.reservedStreamNames().includes(streamName))
      return <span className="error-message">* Stream names must be unique</span>;

    return null;
  }
  function validateAttributeName(selectedAttr) {
    if (selectedAttr < 0) return null;

    const attribute = attributes[selectedAttr];
    if (!("name" in attribute) || attribute.name.trim().length === 0)
      return <span className="error-message">* Please provide Attribute name</span>;
    if (!STREAM_ATTRIBUTE_NAME_REGEX.test(attribute.name ?? ""))
      return <span className="error-message">* Attribute name can only contain alphabets, digits, and underscores</span>;
    if (attributes.find((_attribute, i) => i !== selectedAttr && _attribute.name === attribute.name))
      return <span className="error-message">* Attribute names must be unique</span>;

    return null;
  }
  function validateAttributeType(selectedAttr) {
    if (selectedAttr < 0) return null;

    const attribute = attributes[selectedAttr];
    if (["string", "vector"].includes(attribute.type)) {
      if (attribute.size === null)
        return <span className="error-message">* Size is required</span>;

      try {
        const size = parseInt(attribute.size, 10);
        if (size < 1)
          return <span className="error-message">* Size cannot be non-negative</span>;
        if (size > STREAM_ATTRIBUTE_TYPE_SIZE_MAX)
          return <span className="error-message">* Size cannot exceed max. limit {`(${STREAM_ATTRIBUTE_TYPE_SIZE_MAX})`}</span>;
      } catch (error) {
        return <span className="error-message">* {error.message ?? "Please enter a valid argument"}</span>;
      }
    }

    return null;
  }



  function formSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    if (validateStreamName()) return;

    const errIndex = attributes.findIndex((attribute, i) => !!validateAttributeName(i) || !!validateAttributeType(i));
    if (errIndex !== -1) return setSelectedAttr(errIndex);

    data.streamName = streamName;
    data.attributes = attributes;

    const json = {
      streamName,
      fields: attributes.map((attribute, index) => ({
        fieldId: String(index),
        name: attribute.name,
        type: `${attribute.type}${attribute.size !== null ? ` [${attribute.size}]` : ""}`,
      })),
    };
    data.json = json;

    if ("onFinishHandler" in data)
      data.onFinishHandler();

    dialogRef.current.close();
  }

  function dialogReset() {
    setStreamName(data.streamName);

    setSelectedAttr(-1);
  }

  useEffect(() => {
    if (dialogRef.current && !data.noAutoOpenDialog)
      onClick();
  }, [dialogRef]);

  useEffect(() => {
    if (selectedAttr === -1) return;

    setDisableSize(!(["string", "vector"].includes(attributes[selectedAttr].type)));
  }, [selectedAttr]);

  // useEffect(() => {
  //   if (selectedAttr === -1) return;

  //   attributes[selectedAttr].size = null;
  //   setAttributes([...attributes]);
  // }, [disableSize]);

  return (
    <>
      <div
        className="stream-node"
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
        <span>Stream</span>
        {
          streamName.trim().length > 0 &&
          <span className="stream-name">{`${streamName}`}</span>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="stream-node-editor-dialog nodrag"
        onClose={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      >
        <div className="dialog-content no-drag">
          <form onSubmit={formSubmit}>
            <div className="field">
              <label htmlFor="stream-name">Name</label>
              <input
                name="stream-name"
                type="text"
                placeholder="Name of the Stream"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                readOnly={data.readOnlyStreamName ?? false}
              />
              {validateStreamName()}
            </div>

            <hr />
            <div className="field">
              <label>Attributes</label>
              <div className="attributes">
                <div className="attribute-names">
                  <span
                    className="attribute-add"
                    onClick={addAttribute}
                    onKeyDown={addAttribute}
                  >
                    Add +
                  </span>
                  <hr />
                  {attributes.map((attribute, i) => (
                    <>
                      <div key={attribute.id} className="attribute-item">
                        <img
                          src={TrashIcon}
                          alt="Remove"
                          onClick={() => removeAttribute(i)}
                          onKeyDown={() => removeAttribute(i)}
                        />
                        <div
                          className="attribute-details"
                          onClick={() => setSelectedAttr(i)}
                          onKeyDown={() => setSelectedAttr(i)}
                        >
                          <span className="attribute-details-name">
                            {attribute.name.length === 0 ? "Empty attribute" : attribute.name}
                          </span>
                        </div>
                      </div>
                      {i < attributes.length - 1 && <hr />}
                    </>
                  ))}
                </div>
                {selectedAttr >= 0 && (
                  <div className="attribute-info">
                    <div className="field">
                      <label htmlFor="attribute-name">Name</label>
                      <input
                        name="attribute-name"
                        type="text"
                        placeholder="Name of the Attribute"
                        value={attributes[selectedAttr].name ?? ""}
                        onChange={(e) => {
                          attributes[selectedAttr].name = e.target.value;
                          setAttributes([...attributes]);
                        }}
                        autoFocus={false}
                      />
                      {validateAttributeName(selectedAttr)}
                    </div>

                    <div className="field">
                      <label htmlFor="attribute-type">Type</label>
                      <div className="attribute-type">
                        <select
                          className="attribute-type-select"
                          value={attributes[selectedAttr].type}
                          onChange={e => {
                            attributes[selectedAttr].type = e.target.value;
                            setAttributes([...attributes]);

                            setDisableSize(!(["string", "vector"].includes(e.target.value)));
                          }}
                        >
                          <optgroup label="Primitive types">
                            <option value="string">string</option>
                            <option value="integer">integer</option>
                            <option value="integer long">integer long</option>
                            <option value="float">float</option>
                            <option value="boolean">boolean</option>
                            <option value="vector">vector</option>
                          </optgroup>
                          <optgroup label="User-defined types">
                            {
                              Object.values(enums).map(enm => (
                                <option key={enm.enumName} value={enm.enumName}>{enm.enumName}</option>
                              ))
                            }
                          </optgroup>
                        </select>
                        <input
                          name="attribute-type-size"
                          type="number"
                          placeholder={disableSize ? "Disabled" : "Size"}
                          value={disableSize ? "" : (attributes[selectedAttr].size ?? "")}
                          onChange={(e) => {
                            if (e.target.value === "") {
                              attributes[selectedAttr].size = null;
                            } else {
                              try {
                                attributes[selectedAttr].size = Math.max(1, Math.min(parseInt(e.target.value, 10), STREAM_ATTRIBUTE_TYPE_SIZE_MAX));
                              } catch (error) {
                                attributes[selectedAttr].size = 1;
                              }
                            }

                            setAttributes([...attributes]);
                          }}
                          autoFocus={false}
                          disabled={disableSize}
                        />
                      </div>
                      {validateAttributeType(selectedAttr)}
                    </div>
                  </div>
                )}

                <datalist id="attribute-types">
                  <option value="string <size>" />
                  <option value="integer" />
                  <option value="integer long" />
                  <option value="real" />
                  <option value="real double" />
                  <option value="float" />
                  <option value="float double" />
                  <option value="boolean" />
                  <option value="vector string <size> []" />
                  <option value="vector integer []" />
                  <option value="vector integer long []" />
                  <option value="vector real []" />
                  <option value="vector real double []" />
                  <option value="vector float []" />
                  <option value="vector float double []" />
                  <option value="vector boolean []" />
                  {
                    Object.values(enums).map(enm => (
                      <option key={enm.enumName} value={enm.enumName} />
                    ))
                  }
                </datalist>

                {
                  selectedEnum !== undefined &&
                  <datalist id="default-values">
                    {
                      selectedEnum.values.map(value => (
                        <option key={value[0]} value={value[0]} />
                      ))
                    }
                  </datalist>
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
              <button type="submit">Finish</button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
};
