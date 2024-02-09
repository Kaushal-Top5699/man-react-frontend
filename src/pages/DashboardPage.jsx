import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Authenticated } from "../components/Authenticated";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { EntitiesCreationDialog } from "./DashboardComponents/EntitiesCreationDialog";
import { QueryCreationDialog } from "./DashboardComponents/QueryCreationDialog";

import {
  createEntities as createEntitiesApi,
  updateEntities as updateEntitiesApi,
  listDirectory,
  createDirectory,
  deleteFile as deleteFileApi,
  getFileContent,
  navigateToChildDir as navigateToChildDirApi,
  navigateToParentDir as navigateToParentDirApi,
  getAllStreams,
  getAllEnums,
  logout,
} from "../services/Api_v1";

import { informativeToast, errorToast } from "../utils/Toasts";

import { Types } from "../constants/actionTypes";

import ScreenTutorial from "../assets/imgs/screen_tutorial.png";
import TrashIcon from "../assets/svgs/trash.svg";
import BackArrow from "../assets/svgs/left-arrow.svg";
import CloseIcon from "../assets/svgs/close.svg";

import "reactflow/dist/style.css";
import "./Dashboard.scss";

const DirectoryTile = ({
  dispatch,
  navigateToChildDirCallback,
  refreshDirListCallback,
  dir,
  isSelected = false,
}) => {
  const deleteDialogRef = useRef(null);

  function displayDeleteDialog(e) {
    e.preventDefault();
    e.stopPropagation();

    deleteDialogRef.current.showModal();
  }
  function closeDeleteDialog(e) {
    e.preventDefault();
    e.stopPropagation();

    deleteDialogRef.current.close();
  }

  async function deleteFile(e) {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (await deleteFileApi(dispatch, dir.dir)) {
        informativeToast(`File "${dir.dir}" deleted`);
        refreshDirListCallback();
      }
    } catch (error) {
      errorToast(error.message);
    } finally {
      deleteDialogRef.current.close();
    }
  }

  return (
    <div
      key={dir.dir}
      className={`dir ${isSelected && "selected"}`}
      onClick={() => navigateToChildDirCallback(dir)}
      onKeyDown={() => navigateToChildDirCallback(dir)}>
      <span className="dir-name">{dir.is_file ? dir.dir : `+ ${dir.dir}`}</span>
      {
        dir.is_file &&
        <>
          <img
            src={TrashIcon}
            alt="Delete file"
            className="delete-icon"
            onClick={displayDeleteDialog}
            onKeyDown={displayDeleteDialog}
          />
          <dialog
            ref={deleteDialogRef}
            className="delete-file-dialog"
          >
            <div className="body">
              <span className="title">Warning</span>
              <span className="caption">Are you sure you wish to delete the file <strong>{dir.dir}</strong>? This action cannot be undone.</span>
              <div className="actions">
                <button onClick={closeDeleteDialog}>
                  Cancel
                </button>
                <button onClick={deleteFile}>
                  Delete
                </button>
              </div>
            </div>
          </dialog>
        </>
      }
    </div>
  );
};

export const DashboardPage = () => {
  const navigateTo = useNavigate();

  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [queryParams, setQueryParams] = useSearchParams();

  const helpDialogRef = useRef(null);
  const folderCreateInputRef = useRef(null);
  const entitiesCreationDialogRef = useRef(null);
  const queryCreationDialogRef = useRef(null);
  const queryVisualizationDialogRef = useRef(null);

  const ecdPropsRef = useRef({});
  const qcdPropsRef = useRef({});
  const qvdPropsRef = useRef({});

  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [file, setFile] = useState(null);
  const [cwd, setCwd] = useState("");
  const [dirList, setDirList] = useState(null);

  const canVisualize =
    selectedFile !== null &&
    file !== null &&
    dirList[selectedFile].dir === file.filename &&
    (
      file.filename.endsWith(".qry") ||
      file.filename.endsWith(".str") ||
      file.filename.endsWith(".enum")
    );

  useEffect(() => {
    if (helpDialogRef.current === null) return;

    if (showHelpDialog)
      helpDialogRef.current.showModal();
    else
      helpDialogRef.current.close();
  }, [showHelpDialog]);

  useEffect(() => {
    // `file`
    if (queryParams.has("file") && dirList !== null) {
      const fileName = queryParams.get("file");
      const index = dirList.findIndex(dir => dir.dir === fileName);
      if (index !== -1) {
        setSelectedFile(index);
        displayFileContent(index);
      }
    }
  }, [queryParams, dirList]);

  useEffect(() => {
    refreshDirList();
  }, [cwd]);

  useEffect(() => {
    if (file?.alert_message)
      informativeToast(file.alert_message);
  }, [file]);

  async function logOut() {
    try {
      await logout(dispatch);

      dispatch({ type: Types.auth.LOGOUT });
    } catch (error) {
      errorToast(error.message ?? "Failed to logout");
    }
  }

  function refreshDirList() {
    // setIsLoading(true); // TODO: Uncomment later

    setSelectedFile(null);
    listDirectory(dispatch).then((data) => {
      setDirList(data.list);
      setCwd(data.cwd);
      setIsLoading(false);
    }).catch(error => {
      setIsLoading(false);
      errorToast(error.message);
    });
  }

  async function navigateToParentDir() {
    queryParams.delete("file");
    setQueryParams(queryParams);

    try {
      const cwd = await navigateToParentDirApi(dispatch);
      if (cwd)
        setCwd(cwd);
    } catch (error) {
      errorToast(error.message ?? "Failed to navigate to parent directory");
    } finally {
      setSelectedFile(null);
    }
  }
  async function navigateToChildDir(dir, i) {
    if (dir.is_file)
      setSelectedFile(i);
    else {
      queryParams.delete("file");
      setQueryParams(queryParams);

      try {
        const cwd = await navigateToChildDirApi(dispatch, dir.dir);
        if (cwd)
          setCwd(cwd);
      } catch (error) {
        errorToast(error.message ?? "Failed to navigate to directory");
      }
    }
  }

  async function displayFileContent(selectedFile) {
    if (selectedFile === null) return;

    const dir = dirList[selectedFile];
    try {
      const fileContent = await getFileContent(dispatch, dir.dir);
      if (fileContent !== null)
        setFile(fileContent);
    } catch (error) {
      errorToast(error.message ?? "Failed to load file content");
    }
  }
  async function displayGenerateEntityEnumDialog(e) {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const streams = await getAllStreams(dispatch);
      const enums = await getAllEnums(dispatch);

      ecdPropsRef.current.streams = streams;
      ecdPropsRef.current.enums = enums;
      ecdPropsRef.current.commitCallback = createEntities;

      entitiesCreationDialogRef.current.showModal();
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      return;
    } finally {
      setIsLoading(false);
    }
  }
  async function displayGenerateQueryDialog(e) {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const streams = await getAllStreams(dispatch);
      const enums = await getAllEnums(dispatch);

      qcdPropsRef.current.streams = streams;
      qcdPropsRef.current.enums = enums;
      qcdPropsRef.current.init();

      queryCreationDialogRef.current.showModal();
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      return;
    } finally {
      setIsLoading(false);
    }
  }

  function onVisualizeClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (file === null) return;

    if (file.filename.endsWith(".str"))
      return displayVisualizeStreamDialog();
    else if (file.filename.endsWith(".enum"))
      return displayVisualizeEnumDialog();
    else if (file.filename.endsWith(".qry"))
      return displayVisualizeQueryDialog();
  }
  async function displayVisualizeStreamDialog() {
    setIsLoading(true);
    try {
      const allStreams = await getAllStreams(dispatch);
      const allEnums = await getAllEnums(dispatch);

      const parsedJson = JSON.parse(file.file_content);

      const node = {
        id: String(Date.now()),
        type: "streamNode",
        position: {
          x: 100,
          y: 100,
        },
        data: {
          json: {
            ...parsedJson,
          },
          streamName: parsedJson.streamName,
          attributes: parsedJson.fields.map(({ name, type }) => ({
            name,
            type,
          })),
        },
      };

      ecdPropsRef.current.nodeType = "streamNode";
      ecdPropsRef.current.streams = allStreams;
      ecdPropsRef.current.enums = allEnums;
      ecdPropsRef.current.streamNode = node;
      ecdPropsRef.current.commitCallback = updateEntities;
      ecdPropsRef.current.init();

      entitiesCreationDialogRef.current.showModal();
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }
  async function displayVisualizeEnumDialog() {
    setIsLoading(true);
    try {
      const allStreams = await getAllStreams(dispatch);
      const allEnums = await getAllEnums(dispatch);

      const parsedJson = JSON.parse(file.file_content);

      const node = {
        id: String(Date.now()),
        type: "enumNode",
        position: {
          x: 100,
          y: 100,
        },
        data: {
          json: {
            ...parsedJson,
          },
          enumName: parsedJson.enumName,
          values: parsedJson.values.map(value => ({ id: Date.now(), data: value[0] })),
        },
      };

      ecdPropsRef.current.nodeType = "enumNode";
      ecdPropsRef.current.streams = allStreams;
      ecdPropsRef.current.enums = allEnums;
      ecdPropsRef.current.enumNode = node;
      ecdPropsRef.current.commitCallback = updateEntities;
      ecdPropsRef.current.init();

      entitiesCreationDialogRef.current.showModal();
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  async function displayVisualizeQueryDialog() {
    if (selectedFile === null || !canVisualize) return;

    setIsLoading(true);
    try {
      // Load latest streams and enums first
      const streams = await getAllStreams(dispatch);
      const enums = await getAllEnums(dispatch);
      qvdPropsRef.current.streams = streams;
      qvdPropsRef.current.enums = enums;

      // Parse file content
      const json = JSON.parse(file.file_content);
      const nodes = json.nodes;
      const edges = json.edges;
      qvdPropsRef.current.initialNodes = nodes;
      qvdPropsRef.current.initialEdges = edges;

      // Set query name
      qvdPropsRef.current.queryName = json.queryName;
      qvdPropsRef.current.queryNameReadOnly = true;

      qvdPropsRef.current.init();

      queryVisualizationDialogRef.current.showModal();
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      return;
    } finally {
      setIsLoading(false);
    }
  }

  function createFolder(folderName) {
    createDirectory(dispatch, folderName)
      .then((success) => {
        if (success) {
          folderCreateInputRef.current.value = "";

          // Refresh the dir list
          refreshDirList();
        }
      })
      .catch(error => {
        errorToast(error.message ?? "Failed to create a new folder");
      });
  }

  async function createEntities(nodes, ENTITY_TYPE_KIND_MAP) {
    try {
      const entitiesMap = {};
      for (const node of nodes()) {
        const kind = ENTITY_TYPE_KIND_MAP[node.type];
        if (!kind) continue;

        if (!(kind in entitiesMap))
          entitiesMap[kind] = [];
        entitiesMap[kind].push(node.data.json);
      }
      const entities = Object.keys(entitiesMap)
        .map(entityKind => ({
          kind: entityKind,
          children: entitiesMap[entityKind],
        }));

      const result = await createEntitiesApi(dispatch, entities);
      if (result) {
        informativeToast("Entity(s) created successfully");

        refreshDirList();
        entitiesCreationDialogRef.current.close();
      } else
        errorToast("Failed to create Entity(s)");
    } catch (error) {
      errorToast(error.message ?? "Failed to create Entity(s)");
    }
  }
  async function updateEntities(nodes, ENTITY_TYPE_KIND_MAP) {
    try {
      const entitiesMap = {};
      for (const node of nodes()) {
        const kind = ENTITY_TYPE_KIND_MAP[node.type];
        if (!kind) continue;

        if (!(kind in entitiesMap))
          entitiesMap[kind] = [];
        entitiesMap[kind].push(node.data.json);
      }
      const entities = Object.keys(entitiesMap)
        .map(entityKind => ({
          kind: entityKind,
          children: entitiesMap[entityKind],
        }));

      const result = await updateEntitiesApi(dispatch, entities);
      if (result) {
        informativeToast("Entity(s) updated successfully");

        refreshDirList();
        entitiesCreationDialogRef.current.close();
      } else
        errorToast("Failed to update Entity(s)");
    } catch (error) {
      errorToast(error.message ?? "Failed to update Entity(s)");
    }
  }

  async function createQuery(queryName, nodes, edges) {
    try {
      const result = await createEntitiesApi(
        dispatch,
        [
          {
            kind: "query",
            children: [
              {
                queryName,
                nodes: [
                  ...nodes.map(node => ({
                    ...node,
                    width: undefined,
                    height: undefined,
                    selected: undefined,
                    positionAbsolute: undefined,
                    dragging: undefined,
                    data: {
                      ...node.data.json,
                    },
                  })),
                ],
                edges: [
                  ...edges,
                ]
              },
            ],
          },
        ],
      );
      if (result) {
        informativeToast("Query created successfully");

        refreshDirList();
        queryCreationDialogRef.current.close();
      } else
        errorToast("Failed to create Query");
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      return;
    }
  }
  async function updateQuery(queryName, nodes, edges) {
    try {
      const result = await updateEntitiesApi(
        dispatch,
        [
          {
            kind: "query",
            children: [
              {
                queryName,
                nodes: [
                  ...nodes.map(node => ({
                    ...node,
                    width: undefined,
                    height: undefined,
                    selected: undefined,
                    positionAbsolute: undefined,
                    dragging: undefined,
                    data: {
                      ...node.data.json,
                    },
                  })),
                ],
                edges: [
                  ...edges,
                ]
              },
            ],
          },
        ],
      );
      if (result) {
        informativeToast("Query updated successfully");

        refreshDirList();
        queryVisualizationDialogRef.current.close();
      } else
        errorToast("Failed to update Query");
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
      return;
    }
  }

  return (
    <Authenticated>
      <div className="dashboard_page">
        <LoadingOverlay isVisible={isLoading} />

        <Header />

        <div className="body">
          <div className="left-panel-controls">
            <div className="directories">
              <button
                className="help-button"
                onClick={() => setShowHelpDialog(!showHelpDialog)}
              >
                HELP
              </button>
              <dialog
                ref={helpDialogRef}
                className="help-image-dialog"
              >
                <img
                  className="close-icon"
                  src={CloseIcon}
                  alt="Close dialog"
                  onClick={() => setShowHelpDialog(false)}
                  onKeyDown={() => setShowHelpDialog(false)}
                />
                <img
                  className="help-image"
                  src={ScreenTutorial}
                  alt="Help"
                />
              </dialog>

              <div className="info">
                <span>
                  <strong>User:</strong> {auth.user?.username ?? "Not logged in"}
                </span>
                <span>
                  <strong>Current Path:</strong> {cwd}
                </span>
              </div>

              <div className="add-dir-field">
                <input ref={folderCreateInputRef} type="text" placeholder="Enter New Folder Name" />

                <button onClick={() => createFolder(folderCreateInputRef.current.value)}>Create</button>
              </div>

              <div className="dir-list">
                <div
                  className="dir"
                  onClick={navigateToParentDir}
                  onKeyDown={navigateToParentDir}
                >
                  <img
                    src={BackArrow}
                    alt="Go back"
                    height="15px"
                  />
                </div>
                {(dirList ?? []).map((dir, i) => (
                  <DirectoryTile
                    key={dir.dir}
                    dir={dir}
                    navigateToChildDirCallback={dir => navigateToChildDir(dir, i)}
                    refreshDirListCallback={refreshDirList}
                    dispatch={dispatch}
                    isSelected={selectedFile === i}
                  />
                ))}
              </div>
            </div>

            <div className="description-panel">
              <div className="info">
                <span>
                  <strong>Description Panel for the above listing</strong>
                </span>
                <span>Pre-loaded Applications</span>
              </div>
            </div>
          </div>

          <div className="right-panel-controls">
            <div className="action-buttons">
              <button
                disabled={selectedFile === null}
                onClick={e => {
                  queryParams.set("file", dirList[selectedFile].dir);
                  setQueryParams(queryParams);
                }}
              >
                Display File
              </button>

              <button onClick={displayGenerateEntityEnumDialog}>
                Generate Stream/Enum
              </button>
              <EntitiesCreationDialog
                ecdRef={entitiesCreationDialogRef}
                ecdPropsRef={ecdPropsRef}
                dispatch={dispatch}
                directoryRefreshCallback={() => {
                  // Refresh the dir list
                  refreshDirList();
                }}
              />

              <button onClick={displayGenerateQueryDialog}>Generate Query</button>
              <QueryCreationDialog
                key="qcd-1"
                createQuery={createQuery}
                qcdRef={queryCreationDialogRef}
                qcdPropsRef={qcdPropsRef}
              />

              <button
                disabled={!canVisualize}
                onClick={onVisualizeClick}
              >
                Visualize
              </button>
              <QueryCreationDialog
                key="qcd-2"
                createQuery={updateQuery}
                qcdRef={queryVisualizationDialogRef}
                qcdPropsRef={qvdPropsRef}
              />

              <button onClick={logOut}>Logout</button>

              <button onClick={() => navigateTo("/profile")}>Profile</button>
            </div>

            <div className="content-area">
              {
                file !== null &&
                <div dangerouslySetInnerHTML={{ __html: `<pre>${file.file_content}</pre>` }}></div>
              }
            </div>

            <div className="log-area">
              <div className="info">
                <span>
                  <strong>File Meta-Information Panel</strong>
                </span>
                {
                  file !== null &&
                  <div dangerouslySetInnerHTML={{ __html: file.log }}></div>
                }
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </Authenticated>
  );
};
