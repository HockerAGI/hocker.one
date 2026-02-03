import React from "react";
import PwaRegister from "@/components/PwaRegister";

export const metadata = {
  title: "HOCKER ONE",
  description: "Control Plane del ecosistema HOCKER"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1e5eff" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          background: "#f7f9fc",
          color: "#0b1b3a"
        }}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}