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
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
const MyApp: React.FC = () => {
  const darkMode = useDarkMode();
  const theme = darkMode.value ? darkTheme : lightTheme;
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [profile, setProfile] = useState<any>();

  const handleClick = () => {
    setConnecting(true);
    authenticate().then(async (did: string) => {
      setConnecting(false);
      setAuthenticated(true);
      if (window.idx) {
        const profile = await window.idx.get("basicProfile", did);
        setProfile(profile);
      }
    }).catch((e) => {
      setConnecting(false);
      console.log("error", e);
    });
  }

  useEffect(() => {
    monaco.editor.setTheme(darkMode.value ? "vs-dark" : "vs");
  }, [darkMode.value])

  return (
    <Router>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Switch>
          <Route path="/:documentID">
            <NavBar
              authenticated={authenticated}
              connecting={connecting}
              onClick={handleClick}
              onDarkModeToggle={darkMode.toggle}
              darkMode={darkMode.value}
              profile={profile}
            />
            <Inspect authenticated={authenticated} />
          </Route>
          <Route path="/">
            <NavBar
              connecting={connecting}
              authenticated={authenticated}
              onClick={handleClick}
              onDarkModeToggle={darkMode.toggle}
              darkMode={darkMode.value}
              profile={profile}
            />
            <Inspect authenticated={authenticated} />
          </Route>
        </Switch>
      </MuiThemeProvider>
    </Router>
  )
}

export default MyApp
