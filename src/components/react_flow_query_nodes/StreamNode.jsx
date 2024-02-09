import { useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";

import RemoveNodeIcon from "../../assets/svgs/remove.svg";
import CloseIcon from "../../assets/svgs/dismiss.svg";

import "./StreamNode.scss";

export const StreamNode = ({ data }) => {
  const dialogRef = useRef(null);

  const [showDismiss, setShowDismiss] = useState(false);
  const [selectedStream, setSelectedStream] = useState(data.selectedStream);

  useEffect(() => {
    if (selectedStream !== "-none-") {
      data.stream = data.allStreams().find(stream => stream.streamName === selectedStream);
      data.json = {
        stream: data.stream.streamName,
      };
    } else {
      data.stream = undefined;
      delete data.json;
    }
  }, [selectedStream]);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (selectedStream !== "-none-") {
      data.stream = data.allStreams().find(stream => stream.streamName === selectedStream);
      data.json = {
        stream: data.stream.streamName,
      };
    } else {
      data.stream = undefined;
      delete data.json;
    }

    dialogRef.current.showModal();
  }

  function nodeRemove(e) {
    e.preventDefault();
    e.stopPropagation();

    if ("onNodeRemove" in data)
      data.onNodeRemove();
  }

  function selectStream(e) {
    e.preventDefault();
    e.stopPropagation();

    if ("onDone" in data)
      data.onDone();

    dialogRef.current.close();
  }

  function dialogReset(e) {
    e.preventDefault();
    e.stopPropagation();

    setSelectedStream(data.stream?.streamName ?? "-none-");
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isValidConnection={c => {
          const source = c.source;
          if (source === null) return false;

          const sourceNode = data.nodes().find(node => node.id === source);
          if (!sourceNode) return false;

          return sourceNode.type === "selectNode";
        }}
        style={{ width: "10px", height: "10px", zIndex: "100" }}
      />
      <div
        className="query-stream-node"
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
        <span>Stream</span>
        {
          selectedStream !== "-none-" &&
          <span className="stream-name">{selectedStream}</span>
        }
      </div>
      <dialog
        ref={dialogRef}
        className="qsn-dialog"
        onClose={dialogReset}
      >
        <div className="qsn-body">
          <div className="head">
            <span className="title">Select a Stream</span>
            <img
              src={CloseIcon}
              alt="Close dialog"
              onClick={() => dialogRef.current.close()}
              onKeyDown={() => dialogRef.current.close()}
            />
          </div>
          <select
            className="dropdown"
            value={selectedStream}
            onChange={e => setSelectedStream(e.target.value)}
          >
            <option value="-none-">Select</option>
            {
              data.allStreams().map(stream => (
                <option key={stream.streamName} value={stream.streamName}>{stream.streamName}</option>
              ))
            }
          </select>
          <button disabled={selectedStream === "-none-"} onClick={selectStream}>Continue</button>
        </div>
      </dialog>
    </>
  );
};
