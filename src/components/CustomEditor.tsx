import React, { useEffect, useState } from "react";
import { addDiagnostics } from "@etclabscore/monaco-add-json-schema-diagnostics";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor";

interface IProps {
  value?: string;
  defaultValue?: string;
  onChange?: any;
  schema?: any;
  editorDidMount?: any;
  editorOptions?: any;
  readOnly?: boolean;
}

const CustomEditor: React.FC<IProps> = (props) => {
  const [editor, setEditor] = useState<any>();
  useEffect(() => {
    if (editor !== undefined) {
      const modelUriString = `inmemory://json-${Math.random()}.json`;
      const modelUri = monaco.Uri.parse(modelUriString);
      try {
        const model = monaco.editor.createModel(props.value || "", "json", modelUri);
        editor.setModel(model);
        if (modelUri) {
          addDiagnostics(modelUri.toString(), props.schema || true, monaco);
        }
      } catch (e) {
        // do nothing
      }
    }
  }, [props.schema, editor, props.value]);

  return (
    <MonacoEditor
      height="100%"
      defaultValue={props.value || ""}
      onChange={props.onChange}
      editorDidMount={(editor: any, monaco: any) => {
        setEditor(editor);
        if (props.editorDidMount) {
          props.editorDidMount(editor, monaco)
        }
      }}
      language="json"
      options={{
        scrollbar: {
          // Render vertical arrows. Defaults to false.
          verticalHasArrows: true,
          // Render horizontal arrows. Defaults to false.
          horizontalHasArrows: true,
          // Render vertical scrollbar.
          // Accepted values: 'auto', 'visible', 'hidden'.
          // Defaults to 'auto'
          vertical: "visible",
          // Render horizontal scrollbar.
          // Accepted values: 'auto', 'visible', 'hidden'.
          // Defaults to 'auto'
          horizontal: "visible",
          verticalScrollbarSize: 17,
          horizontalScrollbarSize: 17,
          arrowSize: 30,
          useShadows: false,
        },
        minimap: {
          enabled: false,
        },
        automaticLayout: true,
        showFoldingControls: "always",
        peekWidgetDefaultFocus: "editor",
        scrollBeyondLastLine: false,
        lineNumbers: "off",
        fixedOverflowWidgets: true,
        ...props.editorOptions
      }}
    />
  );
};

export default CustomEditor;
