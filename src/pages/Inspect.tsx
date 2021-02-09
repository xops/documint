import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { Classes } from "@blueprintjs/core";
import useDarkMode from "use-dark-mode";
import { Mosaic, MosaicBranch, MosaicWindow, DEFAULT_CONTROLS_WITHOUT_CREATION } from "react-mosaic-component";
import DocID from "@ceramicnetwork/docid";
import CustomEditor from '../components/CustomEditor';
import { DocState, DoctypeUtils, Doctype } from '@ceramicnetwork/common';
import { InputBase, Button, List, ListItem, ListItemText, Typography, Tooltip, CircularProgress } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit"
import { useParams, useHistory } from "react-router-dom";
import useInterval from "use-interval";
import StatusPill from "../components/StatusPill";
import { grey, green, yellow, red } from "@material-ui/core/colors";
export type ViewId = "schema" | "document" | "state" | "commits" | "new";

interface IProps {
  authenticated: boolean;
}

const commitsToJSON = (commits: any[]) => {
  return commits.map((commit) => {
    return {
      cid: commit.cid,
      value: DoctypeUtils.serializeCommit(commit.value)
    }
  });
}

const anchorStatusMap: Record<string, string> = {
  0: "NOT_REQUESTED",
  1: "PENDING",
  2: "PROCESSING",
  3: "ANCHORED",
  4: "FAILED"
}
const anchorStatusMapToColor: Record<string, string> = {
  "NOT_REQUESTED": grey[500],
  "PENDING": yellow[800],
  "PROCESSING": yellow[900],
  "ANCHORED": green[500],
  "FAILED": red[500]
}

const stateToJSON = (state: DocState | undefined) => {
  if (!state) {
    return;
  }
  const serialized = DoctypeUtils.serializeState(state);
  serialized.anchorStatus = anchorStatusMap[serialized.anchorStatus] || serialized.anchorStatus;
  return serialized
}
const Inspect: React.FC<IProps> = (props) => {
  const { documentID } = useParams();
  const history = useHistory();

  const darkMode = useDarkMode();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<Doctype | undefined>();
  const [currentDocumentStateJSON, setCurrentDocumentStateJSON] = useState<any>();
  const [currentSchema, setCurrentSchema] = useState<any | undefined>();
  const [currentSchemaDocID, setCurrentSchemaDocID] = useState<DocID | undefined>();
  const [currentCommits, setCurrentCommits] = useState<Record<string, any>[] | undefined>();
  const [selectedSchemaCommit, setSelectedSchemaCommit] = useState<any | undefined>();
  const [selectedCommit, setSelectedCommit] = useState<any>();
  const [documentEditor, setDocumentEditor] = useState<any>();
  const [schemaEditor, setSchemaEditor] = useState<any>();
  const [dirtyJSON, setDirtyJSON] = useState();
  const [mosaicValue, setMosaicValue] = useState<any>();

  const handleSchemaDocIDChange = async (val: string) => {
    const schemaDocID = val.replace("ceramic://", "");
    if (val === "") { return; }

    const d = await window.ceramic?.loadDocument(schemaDocID);
    if (d) {
      setCurrentSchemaDocID(d.id.baseID);
      setSelectedSchemaCommit(d.state.log[d.state.log.length - 1]);
      setCurrentSchema(d);
    }
  };

  const handleVersionChange = async (commitCID: string, index: number) => {
    const docID = DocID.fromString(documentID);
    let newDocID;

    if (index === 0) {
      newDocID = docID;
      setSelectedCommit(undefined);
    } else {
      newDocID = DocID.fromOther(docID, commitCID);
      setSelectedCommit(commitCID);
    }
    setLoading(true)
    const d = await window.ceramic?.loadDocument(newDocID);
    if (d) {
      setDirtyJSON(undefined);
      setCurrentDocument(d);
      if (documentEditor) {
        documentEditor.setValue(JSON.stringify(d.state.next?.content || d.state.content, null, 4));
      }
      if (d.state.metadata.schema) {
        handleSchemaDocIDChange(d.state.metadata.schema);
      } else {
        setCurrentSchema(undefined);
      }
    }
    setLoading(false)
  };

  const handleSchemaCommitChange = async (commit: any) => {
    setSelectedSchemaCommit(commit);
  };

  const handleSave = async () => {
    const confirm = window.confirm("Are you sure you want to save?");

    if (!window.did) {
      return;
    }

    if (!confirm) {
      return;
    }

    let schemaDocIDLockedToCommit;
    if (currentSchemaDocID) {
      console.log("string commit id" + selectedSchemaCommit, currentSchemaDocID);
      schemaDocIDLockedToCommit = DocID.fromOther(currentSchemaDocID, selectedSchemaCommit.cid.toString()).toString();
      console.log(schemaDocIDLockedToCommit);
    }

    setLoading(true)
    if (!documentID) {
      try {
        const newDocument = await window.ceramic?.createDocument("tile", {
          content: JSON.parse(dirtyJSON || ""),
          metadata: {
            schema: schemaDocIDLockedToCommit,
            controllers: [window.did.id],
          }
        })
        if (newDocument) {
          setDirtyJSON(undefined);
          history.push("/" + newDocument.id.toString())
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
        alert(e.message);
      }
      return;
    }

    if (props.authenticated && currentDocument) {
      try {
        const update: { [k: string]: any } = {};

        if (dirtyJSON) {
          setDirtyJSON(undefined);
          update.content = JSON.parse(dirtyJSON || "");
        }

        if (currentDocument.metadata.schema !== schemaDocIDLockedToCommit) {
          update.metadata = {
            schema: schemaDocIDLockedToCommit
          };
        }

        await currentDocument.change(update)

        loadDocument(documentID);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const shouldShowSave = () => {
    const isAuthenticated = props.authenticated;
    if (!isAuthenticated) { return false; }

    const isController = window.did && currentDocumentStateJSON?.metadata.controllers.includes(window.did?.id);
    const documentIsNew = !documentID;

    const canEdit = isController || documentIsNew;

    if (!canEdit) { return false; }
    /* const currentDoc = currentDocument.state.content;
     * const currentDocNext = currentDocument */
    const docHasChanged = dirtyJSON && dirtyJSON !== JSON.stringify(currentDocumentStateJSON?.next?.content || currentDocumentStateJSON?.content, null, 4);
    if (docHasChanged) { return true; }

    if (!currentSchema) { return false; }
    const currentDocSchema = currentDocument?.metadata?.schema;
    if (currentDocSchema && currentSchemaDocID) {
      const currentDocSchemaDocID = DocID.fromString(currentDocSchema);

      const currentSchemaDocIDLockedToCommit = DocID.fromOther(currentSchemaDocID, selectedSchemaCommit.cid.toString());

      console.log('should show save::' + currentDocSchemaDocID + " vs " + currentSchemaDocIDLockedToCommit);
      if (currentDocSchemaDocID.equals(currentSchemaDocIDLockedToCommit) === false) {
        return true;
      }
    }

    /* const docHasSchema = currentDocumentStateJSON?.metadata.schema;
     * if (!docHasSchema && currentSchemaDocID) {
     *   return 
     * }

     * if (docHasSchema) {
     *   currentSchemaDocID !== currentDocumentStateJSON?.metadata.schema.replace("ceramic://");
     * }

     * const schemaChanged = currentSchemaDocID !== currentDocumentStateJSON?.metadata.schema.replace("ceramic://");
     * console.log(schemaChanged);
     * debugger; // eslint-disable-line */
  };

  const isSelectedCommit = (commit: any, selected: any): boolean => {
    console.log(commit, selected);
    if (!selected || !commit.cid) {
      return false;
    }
    return commit.cid === selected.cid;
  };

  const ELEMENT_MAP: { [viewId: string]: (id: string | number, path: MosaicBranch[]) => JSX.Element } = {
    schema: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={`Schema`} >
        <CustomEditor
          editorDidMount={(editor: any) => {
            setSchemaEditor(editor)
          }}
          value={(currentSchema && currentSchema.state && currentSchema.state.content && JSON.stringify(currentSchema.state.content, null, 4)) || ""} 
        />
      </MosaicWindow>
    ),
    document: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={"Document"} toolbarControls={[
        shouldShowSave() && <Button variant="contained" color="secondary" style={{ height: "30px", marginRight: "10px" }} onClick={handleSave}>Save</Button>,
        loading && <CircularProgress size="20" style={{ marginTop: "5px", marginRight: "10px" }} variant="indeterminate"></CircularProgress>,
        currentDocumentStateJSON && currentDocumentStateJSON.next && <StatusPill title="The 'next' property will contain the latest updates of the document before the've been anchored.">NEXT</StatusPill>,
        currentDocumentStateJSON && <StatusPill title="Anchor Status" style={{ background: anchorStatusMapToColor[currentDocumentStateJSON.anchorStatus] }}>{currentDocumentStateJSON.anchorStatus}</StatusPill>,
        (!documentID || (window.did && currentDocumentStateJSON?.metadata.controllers.includes(window.did?.id))) ? <Tooltip title="Document Editable"><EditIcon fontSize="small" style={{ color: "#a7b6c2", marginTop: "4px", marginRight: "7px", marginLeft: "15px" }} /></Tooltip> : undefined,
        ...DEFAULT_CONTROLS_WITHOUT_CREATION
      ]}>
        <CustomEditor
          value={(currentDocumentStateJSON && JSON.stringify(currentDocumentStateJSON?.next?.content || currentDocumentStateJSON.content, null, 4))}
          editorDidMount={(editor: any) => {
            setDocumentEditor(editor)
          }}
          schema={currentSchema?.state?.content}
          onChange={(value: any) => {
            setDirtyJSON(value);
          }}
          editorOptions={{
            readOnly: (props.authenticated && (!documentID || (window.did && currentDocumentStateJSON?.metadata.controllers.includes(window.did?.id)))) ? false : true
          }}
        />
      </MosaicWindow>
    ),
    state: (id, path) => {
      return (
        <MosaicWindow<ViewId> path={path} title={"State"}>
          <CustomEditor
            value={JSON.stringify(currentDocumentStateJSON, null, 4) || ""}
          />
        </MosaicWindow>
      )
    },
    commits: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={"Commits"}>
        <CustomEditor
          value={(currentCommits && JSON.stringify(commitsToJSON(currentCommits), null, 4)) || ""}
        />
      </MosaicWindow>
    ),
    versions: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={"Commit History"}>
        <List style={{ height: "100%", overflow: "auto" }}>
          {currentCommits && currentCommits.slice().reverse().map((commit, index) => (
            <ListItem button selected={isSelectedCommit(commit, selectedCommit)} onClick={() => handleVersionChange(commit.cid, index)}>
              <ListItemText>
                <Typography color="secondary" style={{ fontSize: "11px" }}>
                  {commit.cid} {index === 0 ? "(latest)" : null}
                </Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List>
      </MosaicWindow>
    ),
    schemaPicker: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={"Schema Picker"}>
        <InputBase placeholder="Enter Document ID" value={currentSchemaDocID} style={{paddingLeft: "5px"}} fullWidth onChange={(ev) => handleSchemaDocIDChange(ev.target.value)}></InputBase>
        <List style={{ height: "100%", overflow: "auto" }}>
          {currentSchema && currentSchema.state && currentSchema.state.log.slice().reverse().map((commit: any, index: any) => (
            <ListItem button selected={isSelectedCommit(commit, selectedSchemaCommit)} onClick={() => handleSchemaCommitChange(commit)}>
              <ListItemText>
                <Typography color="secondary" style={{ fontSize: "11px" }}>
                  {commit.cid.toString()} {index === 0 ? "(latest)" : null}
                </Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List>
      </MosaicWindow>
    )
  };

  const updateCommitList = async (docID: string, selectLatest = false) => {
    const l = await window.ceramic?.loadDocumentCommits(docID);
    if (l) {
      if (!selectedCommit || selectLatest) {
        setSelectedCommit(l[l.length - 1]);
      }
      setCurrentCommits(l);
    } else {
      setCurrentCommits([]);
      setSelectedCommit(undefined);
    }
  };

  const loadDocument = async (docid: string, populateCurrentCommits: boolean = true) => { //eslint-disable-line
    if (!docid || docid === "") {
      setCurrentSchema(undefined);
      setCurrentDocument(undefined);
      setCurrentCommits(undefined);
      setDirtyJSON(undefined);
      return;
    }
    try {
      setLoading(true);
      const d = await window.ceramic?.loadDocument(docid);
      if (!d) {
        alert("no document found");
        return;
      }
      setCurrentDocument(d);
      if (documentEditor && documentEditor.getValue() !== JSON.stringify(d.state.next?.content || d.state.content, null, 4)) {
        documentEditor.setValue(JSON.stringify(d.state.next?.content || d.state.content, null, 4));
      }

      const schema = d.metadata.schema;
      if (schema) {
        await handleSchemaDocIDChange(schema);
      } else {
        setCurrentSchema(undefined);
      }

      if (populateCurrentCommits) {
        await updateCommitList(docid, true);
      }

      setLoading(false);
    } catch (e) {
      setLoading(false);
      //
    }
  };

  useEffect(() => {
    if (currentDocument && currentDocument.state) {
      setCurrentDocumentStateJSON(stateToJSON(currentDocument.state))
    }
  }, [currentDocument]); //eslint-disable-line

  useEffect(() => {
    if (window.ceramic) {
      loadDocument(documentID);
    }
  }, [documentID]); //eslint-disable-line

  useEffect(() => {
    if (currentSchema === undefined || currentSchema.state === undefined || currentSchema.state.content === undefined) { return; }
    const schemaContentStr = JSON.stringify(currentSchema.state.content, null, 4);
    if (schemaEditor && schemaEditor.getValue() !== schemaContentStr) {
      schemaEditor.setValue(schemaContentStr);
    }
  }, [currentSchema, schemaEditor]);

  useInterval(async () => {
    if (!window.ceramic) {
      return;
    }

    if (currentDocument === undefined || currentDocument.state === undefined) { return; }

    const l = await window.ceramic?.loadDocumentCommits(documentID);
    const currentLogs = currentDocument?.state?.log.map((log) => log.cid.toString());

    const hasNew = l.reduce((newL, log) => {
      if (currentLogs.indexOf(log.cid.toString()) === -1) {
        return true;
      }
      return newL;
    }, false);

    if (hasNew) {
      await updateCommitList(documentID);
    }

    /* if ((!dirtyJSON || dirtyJSON === JSON.stringify(currentDocumentStateJSON?.next?.content || currentDocumentStateJSON?.content, null, 4)) &&
     *   (!currentCommits || !selectedCommit || (currentCommits && selectedCommit === currentCommits.slice().reverse()[0]?.cid))
     * ) {
     *   loadDocument(documentID, false);
     * } */
  }, 10000);

  return (
    <Mosaic<string>
      className={classNames("mosaic-blueprint-theme", darkMode.value ? Classes.DARK : undefined)}
      renderTile={(id, path) => {
        return ELEMENT_MAP[id](id, path)
      }}
      onChange={(v) => {
        if (v) {
          setMosaicValue(v)
        }
      }}
      value={mosaicValue}
      initialValue={mosaicValue || {
        direction: "row",
        first: "document",
        second: {
          direction: "column",
          splitPercentage: 80,
          first: {
            direction: "column",
            splitPercentage: 80,
            first: {
              direction: "column",
              first: "versions",
              second: "state",
              splitPercentage: 20
            },
            second: {
              direction: "column",
              splitPercentage: 50,
              first: "schemaPicker",
              second: "schema"
            },
          },
          second: "commits"
        },
        splitPercentage: 70,
      }}
    />
  );
};

export default Inspect;
