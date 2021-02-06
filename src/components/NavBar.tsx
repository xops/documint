import React from "react";
import { AppBar, Button, Grid, IconButton, InputBase, Paper, Toolbar, Tooltip, Typography, Avatar } from "@material-ui/core";
import type { ImageMetadata } from '@ceramicstudio/idx-constants'

import Brightness3Icon from "@material-ui/icons/Brightness3";
import WbSunnyIcon from "@material-ui/icons/WbSunny";
import { grey } from "@material-ui/core/colors";
import { formatDID } from "../utils";
const IPFS_PREFIX = 'ipfs://'

export function toImageSrc(image: ImageMetadata): string {
  return image.src.replace(IPFS_PREFIX, process.env.REACT_APP_IPFS_URL || "");
}

interface IProps {
  authenticated: boolean;
  onDarkModeToggle: () => void;
  darkMode: boolean;
  onClick: () => void;
  inputText?: string;
  profile: any;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NavBar: React.FC<IProps> = (props) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Grid alignItems="center" container>
          <Grid item sm={2} direction="row" container>
            <Grid>
              <img src="https://developers.ceramic.network/images/ceramic-no-shadow.png" alt="ceramic" height="24" />
            </Grid>
            <Grid>
              <Typography style={{ flexGrow: 1, color: "#fff", marginLeft: "10px" }}>
                Ceramic Playground
               </Typography>
            </Grid>
          </Grid>
          <Grid container justify="center" alignItems="center" item xs={7} >
            <Paper style={{
              background: "rgba(0, 0, 0, 0.1)",
              padding: "0px 10px 0px 10px",
              width: "100%",
            }} elevation={0}>
              <InputBase inputProps={{ spellCheck: false }} value={props.inputText} style={{ width: "100%", color: grey[300] }} placeholder="Enter a Document ID" onChange={props.onInputChange} />
            </Paper>
          </Grid>
          <Grid item xs={3} container justify="flex-end" alignItems="center">
            {!props.authenticated && <Button color="inherit" onClick={props.onClick} variant="outlined">Connect</Button>}
            {props.authenticated && <Button startIcon={props.profile && props.profile.image && props.profile.image.original && <Avatar src={toImageSrc(props.profile.image.original)}/>} variant="outlined" target="_blank" href="https://self-id.vercel.app/">{(props.profile && props.profile.name) || (window.idx && formatDID(window.idx.id))}{props.profile && props.profile.emoji}</Button>}
            <Tooltip title="Toggle Dark Mode">
              <IconButton onClick={props.onDarkModeToggle}>
                {props.darkMode ? <Brightness3Icon /> : <WbSunnyIcon />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
