"use client";

import { useEffect } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform?: string;
  }>;
};

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let installPrompt: BeforeInstallPromptEvent | null = null;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt = event as BeforeInstallPromptEvent;

      window.dispatchEvent(
        new CustomEvent("hocker:pwa-installable", {
          detail: {
            canInstall: true,
            platforms: installPrompt.platforms ?? [],
          },
        }),
      );
    };

    const onAppInstalled = () => {
      window.dispatchEvent(
        new CustomEvent("hocker:pwa-installed", {
          detail: { installed: true },
        }),
      );
      installPrompt = null;
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        window.dispatchEvent(
          new CustomEvent("hocker:pwa-registered", {
            detail: { scope: reg.scope },
          }),
        );

        if (process.env.NODE_ENV === "development") {
          console.info("[PWA] Service Worker registrado:", reg.scope);
        }
      } catch (error) {
        console.error("[PWA] Error registrando SW:", error);
        window.dispatchEvent(
          new CustomEvent("hocker:pwa-error", {
            detail: { error: error instanceof Error ? error.message : String(error) },
          }),
        );
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    void register();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
      installPrompt = null;
    };
  }, []);

  return null;
}