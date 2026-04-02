"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (process.env.NODE_ENV === "development") {
          console.info("[PWA] Service Worker registrado:", reg.scope);
        }
      } catch (error) {
        console.error("[PWA] Error registrando SW:", error);
      }
    };

    void register();
  }, []);

  return null;
}