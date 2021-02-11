import { createMuiTheme } from "@material-ui/core/styles";
import grey from "@material-ui/core/colors/grey";

export const lightTheme = createMuiTheme({
  props: {
    MuiAppBar: {
    },
    MuiCard: {
      elevation: 0,
    },
  },
  overrides: {
    MuiToolbar: {
      root: {
        background: "#fff",
      },
    },
    MuiTypography: {
      root: {
        color: grey[900]
      },
      colorTextSecondary: {
      },
      colorTextPrimary: {
      }
    },
  },
  palette: {
    secondary: {
      main: "#ff3600",
    },
    background: {
      default: "#fff",
    },
  },
});

export const darkTheme = createMuiTheme({
  props: {
    MuiAppBar: {
    },
    MuiCard: {
      elevation: 0,
    },
  },
  palette: {
    type: "dark",
    text: {
      secondary: grey[500]
    },
    secondary: {
      main: "#ffb08a",
    },
    background: {
      default: grey[900],
      paper: grey[800],
    },
  },
  overrides: {
    MuiToolbar: {
      root: {
        background: "#293742",
      },
    },
    MuiTable: {
      root: {
      },
    },
    MuiTypography: {
      root: {
      },
    },
  },
});
const theme = {
  darkTheme,
  lightTheme,
}

export default theme;
