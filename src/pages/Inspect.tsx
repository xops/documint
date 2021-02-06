import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { Classes } from "@blueprintjs/core";
import useDarkMode from "use-dark-mode";
import { Mosaic, MosaicBranch, MosaicWindow, DEFAULT_CONTROLS_WITHOUT_CREATION } from "react-mosaic-component";
import DocID from "@ceramicnetwork/docid";
import CustomEditor from '../components/CustomEditor';
import { DocState, DoctypeUtils, Doctype } from '@ceramicnetwork/common';
import { Button, List, ListItem, ListItemText, Typography, Tooltip } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit"
import { useParams, useHistory } from "react-router-dom";
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

const stateToJSON = (state: DocState | undefined) => {
  if (!state) {
    return;
  }
  return DoctypeUtils.serializeState(state);
}
const Inspect: React.FC<IProps> = (props) => {
  const { documentID } = useParams();
  const history = useHistory();

  const darkMode = useDarkMode();
  const [currentDocument, setCurrentDocument] = useState<Doctype | undefined>();
  const [currentSchema, setCurrentSchema] = useState<any | undefined>();
  const [currentCommits, setCurrentCommits] = useState<Record<string, any>[] | undefined>();
  const [selectedCommit, setSelectedCommit] = useState<any>();
  const [documentEditor, setDocumentEditor] = useState<any>();
  const [schemaEditor, setSchemaEditor] = useState<any>();
  const [dirtyJSON, setDirtyJSON] = useState();
  const [mosaicValue, setMosaicValue] = useState<any>();
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
    const d = await window.ceramic?.loadDocument(newDocID);
    if (d) {
      setCurrentDocument(d);
      console.log("setting doc", documentEditor);
      if (documentEditor) {
        console.log("setting doc ", d.state.content)
        documentEditor.setValue(JSON.stringify(d.state.content, null, 4));
      }
      if (d.state.metadata.schema) {
        const r = await window.ceramic?.loadDocument(d.state.metadata.schema);
        if (r) {
          setCurrentSchema(r.state.content);
        } else {
          setCurrentSchema(undefined);
        }
      } else {
        setCurrentSchema(undefined);
      }
    }
    setDirtyJSON(undefined);
  };

  const handleSave = async () => {
    const confirm = window.confirm("Are you sure you want to save?");

    if (!window.did) {
      return;
    }

    if (!confirm) {
      return;
    }

    if (!documentID) {
      try {
        const newDocument = await window.ceramic?.createDocument("tile", {
          content: JSON.parse(dirtyJSON || ""),
          metadata: {
            controllers: [window.did.id],
            family: "doc family"
          }
        })
        if (newDocument) {
          setDirtyJSON(undefined);
          history.push("/" + newDocument.id.toString())
        }
      } catch (e) {
        alert(e.message);
      }
      return;
    }

    if (props.authenticated && currentDocument && typeof dirtyJSON === "string") {
      try {
        await currentDocument.change({ content: JSON.parse(dirtyJSON || "") })
        setDirtyJSON(undefined);
        loadDocument(documentID);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const ELEMENT_MAP: { [viewId: string]: (id: string | number, path: MosaicBranch[]) => JSX.Element } = {
    schema: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={`Schema ${currentDocument?.metadata.schema}`} >
        <CustomEditor
          editorDidMount={(editor: any) => {
            setSchemaEditor(editor)
          }}
          value={(currentSchema && JSON.stringify(currentSchema, null, 4)) || ""}
        />
      </MosaicWindow>
    ),
    document: (id, path) => (
      <MosaicWindow<ViewId> path={path} title={"Document"} toolbarControls={[
        dirtyJSON !== JSON.stringify(currentDocument?.state.content, null, 4) &&
          dirtyJSON && props.authenticated &&
          (!documentID || (window.did && currentDocument?.state.metadata.controllers.includes(window.did?.id)))
          ? <Button variant="contained" color="secondary" style={{ height: "30px" }} onClick={handleSave}>Save</Button>
          : undefined,
        (!documentID || (window.did && currentDocument?.state.metadata.controllers.includes(window.did?.id))) ? <Tooltip title="Document Editable"><EditIcon fontSize="small" style={{ color: "#a7b6c2", marginTop: "4px", marginRight: "7px", marginLeft: "15px" }} /></Tooltip> : undefined,
        ...DEFAULT_CONTROLS_WITHOUT_CREATION
      ]}>
        <CustomEditor
          value={(currentDocument && JSON.stringify(currentDocument.state.content, null, 4))}
          editorDidMount={(editor: any) => {
            setDocumentEditor(editor)
          }}
          schema={currentSchema}
          onChange={(value: any) => {
            setDirtyJSON(value);
          }}
          editorOptions={{
            readOnly: false
          }}
        />
      </MosaicWindow>
    ),
    state: (id, path) => {
      return (
        <MosaicWindow<ViewId> path={path} title={"State"}>
          <CustomEditor
            value={JSON.stringify(stateToJSON(currentDocument?.state), null, 4) || ""}
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
      <MosaicWindow<ViewId> path={path} title={"Versions"}>
        <List style={{ height: "100%", overflow: "auto" }}>
          {currentCommits && currentCommits.slice().reverse().map((commit, index) => (
            <ListItem button selected={selectedCommit ? (commit.cid === selectedCommit) : (index === 0)} onClick={() => handleVersionChange(commit.cid, index)}>
              <ListItemText>
                <Typography color="secondary" style={{ fontSize: "11px" }}>
                  {commit.cid} {index === 0 ? "(latest)" : null}
                </Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List>
      </MosaicWindow>
    )
  };

  const loadDocument = async (docid: string) => { //eslint-disable-line
    if (!docid || docid === "") {
      setCurrentSchema(undefined);
      setCurrentDocument(undefined);
      setCurrentCommits(undefined);
      setDirtyJSON(undefined);
      return;
    }
    try {
      const d = await window.ceramic?.loadDocument(docid);
      if (!d) {
        alert("no document found");
        return;
      }
      setCurrentDocument(d);
      if (documentEditor) {
        console.log("setting doc ", d.state.content)
        documentEditor.setValue(JSON.stringify(d.state.content, null, 4));
      }
      if (d.metadata.schema) {
        const r = await window.ceramic?.loadDocument(d.metadata.schema);
        if (r) {
          setCurrentSchema(r.state.content);
        } else {
          setCurrentSchema(undefined);
        }
      } else {
        setCurrentSchema(undefined);
      }
      if (d.state.log.length > 0) {
        const l = await window.ceramic?.loadDocumentCommits(docid);
        setCurrentCommits(l);
      }
    } catch (e) {
      //
    }
  };

  useEffect(() => {
    if (window.ceramic) {
      loadDocument(documentID);
    }
  }, [documentID]); //eslint-disable-line

  useEffect(() => {
    if (schemaEditor) {
      schemaEditor.setValue(currentSchema ? JSON.stringify(currentSchema, null, 4) : "")
    }
  }, [currentSchema, schemaEditor]);
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
            second: "schema",
          },
          second: "commits"
        },
        splitPercentage: 70,
      }}
    />
  );
};

export default Inspect;
