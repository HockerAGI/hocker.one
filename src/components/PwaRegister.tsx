"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let alive = true;
    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (!alive) return;

        try {
          await registration.update();
        } catch {
          // Sin ruido para el usuario
        }

        if (process.env.NODE_ENV === "development") {
          console.info("[PWA] Service Worker registrado:", registration.scope);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[PWA] Error registrando SW:", error);
        }
      }
    };

    const onOnline = () => {
      void registration?.update();
    };

    window.addEventListener("online", onOnline);
    void register();

    return () => {
      alive = false;
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}