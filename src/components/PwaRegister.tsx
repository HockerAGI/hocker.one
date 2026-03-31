"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").then(() => {
        // Telemetría táctica para auditorías del Director
        console.log(
          "%c[NOVA SYSTEM] %cTejido PWA de Hocker ONE sincronizado. Soberanía táctica operativa.",
          "color: #0ea5e9; font-weight: 900; font-size: 11px;",
          "color: #10b981; font-weight: 600; font-size: 11px;"
        );
      }).catch((error) => {
        console.warn("[NOVA SYSTEM] Interferencia en el tejido PWA:", error);
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
