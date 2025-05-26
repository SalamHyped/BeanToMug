import React from "react";

export default function CenteredLayout({ children }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      flexDirection: "column",
      
     
     
    }}>
      {children}
    </div>
  );
}