"use client";

import React from "react";

export default function AppNav() {
  const linkStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#0b1b3a",
    background: "#ffffff",
    border: "1px solid #e6eefc"
  };

  return (
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <a href="/dashboard" style={linkStyle}>Dashboard</a>
      <a href="/chat" style={linkStyle}>Chat NOVA</a>
      <a href="/commands" style={linkStyle}>Commands</a>
      <a href="/nodes" style={linkStyle}>Nodes</a>
      <a href="/agis" style={linkStyle}>AGIs</a>
      <a href="/supply" style={linkStyle}>Supply</a>
      <a href="/governance" style={linkStyle}>Governance</a>
    </nav>
  );
}