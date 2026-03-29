"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        // Mensaje de telemetría premium para desarrolladores/auditores
        console.log(
          "%c[HOCKER ONE] %cTejido PWA sincronizado y operativo.",
          "color: #0ea5e9; font-weight: 900; font-size: 11px;",
          "color: #10b981; font-weight: 600; font-size: 11px;"
        );
      }).catch((error) => {
        console.warn("[HOCKER ONE] Error en el registro del tejido PWA:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
