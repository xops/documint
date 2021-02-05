import React, { useEffect, useState } from 'react'
import { authenticate } from '../app'
import { MuiThemeProvider, CssBaseline } from "@material-ui/core"; //tslint:disable-line
import NavBar from '../components/NavBar';
import { lightTheme, darkTheme } from "../themes/theme";
import useDarkMode from "use-dark-mode";
import "react-mosaic-component/react-mosaic-component.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as monaco from "monaco-editor";
import Inspect from '../pages/Inspect';

const MyApp: React.FC = () => {
  const darkMode = useDarkMode();
  const theme = darkMode.value ? darkTheme : lightTheme;
  const [authenticated, setAuthenticated] = useState(false);
  const [documentIDInput, setDocumentIDInput] = useState("k2t6wyfsu4pfzma1qzqy74wd3ujyuqjp25x7pzgw3dgljyz33cih2672nk3tdu");

  // const [profile, setProfile] = useState<any>();

  const handleClick = () => {
    authenticate().then(async (did: string) => {
      setAuthenticated(true);
      // if (window.idx) {
      //   const profile = await window.idx.get("basicProfile", did);
      //   setProfile(profile);
      // }
      // console.log(window.idx);
    }).catch((e) => {
      console.log("error", e);
    });
  }

  const setDocumentId = (docId: string) => {
    setDocumentIDInput(docId);
  }

  useEffect(() => {
    monaco.editor.setTheme(darkMode.value ? "vs-dark" : "vs");
  }, [darkMode.value])

  return (
    <div >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <NavBar
          authenticated={authenticated}
          onClick={handleClick}
          onDarkModeToggle={darkMode.toggle}
          darkMode={darkMode.value}
          inputText={documentIDInput}
          onInputChange={(event) => setDocumentIDInput(event.target.value)}
        />
        <Inspect documentID={documentIDInput} authenticated={authenticated} setDocumentId={setDocumentId}/>
      </MuiThemeProvider>
    </div>
  )
}

export default MyApp
