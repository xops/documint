import React from "react";
import { yellow } from "@material-ui/core/colors";
import { Typography, Tooltip } from "@material-ui/core";


interface IProps {
  style?: React.CSSProperties
  title: string;
}

const StatusPill: React.FC<IProps> = (props) => {
  return (
    <Tooltip title={props.title} style={{ textAlign: "center" }}>
      <span title={props.title} style={{ margin: "2px", borderRadius: "3px", height: "26px", marginRight: "5px", background: yellow[900], ...props.style }}>
        <Typography style={{ padding: "2px", paddingRight: "5px", paddingLeft: "5px" }}>
          {props.children}
        </Typography>
      </span>
    </Tooltip>
  );
};

export default StatusPill;
