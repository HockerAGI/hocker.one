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
    let idleId: number | undefined;
    let registration: ServiceWorkerRegistration | null = null;
    let onUpdateFound: (() => void) | null = null;
    const workerStateCleanups: Array<() => void> = [];

    const emitUpdateAvailable = (
      reg: ServiceWorkerRegistration,
      worker: ServiceWorker | null = reg.waiting,
    ) => {
      window.dispatchEvent(
        new CustomEvent("hocker:pwa-update-available", {
          detail: {
            scope: reg.scope,
            waiting: Boolean(reg.waiting),
            state: worker?.state ?? reg.waiting?.state ?? "installed",
          },
        }),
      );
    };

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

    const onControllerChange = () => {
      window.dispatchEvent(
        new CustomEvent("hocker:pwa-controller-changed", {
          detail: { controlled: Boolean(navigator.serviceWorker.controller) },
        }),
      );
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        registration = reg;

        window.dispatchEvent(
          new CustomEvent("hocker:pwa-registered", {
            detail: { scope: reg.scope },
          }),
        );

        // A waiting worker means a newer version is already downloaded. Do not
        // activate/reload automatically: an Owner may be reviewing an action.
        if (reg.waiting && navigator.serviceWorker.controller) {
          emitUpdateAvailable(reg, reg.waiting);
        }

        onUpdateFound = () => {
          const installing = reg.installing;
          if (!installing) return;

          const onStateChange = () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              emitUpdateAvailable(reg, installing);
            }
          };

          installing.addEventListener("statechange", onStateChange);
          workerStateCleanups.push(() => installing.removeEventListener("statechange", onStateChange));
        };
        reg.addEventListener("updatefound", onUpdateFound);

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
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Defer SW registration to idle time so it never competes with first paint.
    const startRegister = () => void register();
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(startRegister);
    } else {
      idleId = window.setTimeout(startRegister, 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (registration && onUpdateFound) {
        registration.removeEventListener("updatefound", onUpdateFound);
      }
      for (const cleanup of workerStateCleanups) cleanup();
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
      installPrompt = null;
      registration = null;
    };
  }, []);

  return null;
}
