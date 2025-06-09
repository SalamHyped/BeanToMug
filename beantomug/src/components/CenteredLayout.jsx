import React from "react";
import classes from './CenteredLayout.module.css';

export default function CenteredLayout({ children }) {
  return (
    <div className={classes.container}>
      {children}
    </div>
  );
}