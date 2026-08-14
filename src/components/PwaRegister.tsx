"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform?: string;
  }>;
};

const UPDATE_TOAST_ID = "hocker-pwa-update-available";
const ACTIVATED_TOAST_ID = "hocker-pwa-update-activated";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let installPrompt: BeforeInstallPromptEvent | null = null;
    let idleId: number | undefined;
    let registration: ServiceWorkerRegistration | null = null;
    let onUpdateFound: (() => void) | null = null;
    const workerStateCleanups: Array<() => void> = [];

    const requestUpdateActivation = (reg: ServiceWorkerRegistration) => {
      const waiting = reg.waiting;
      if (!waiting) return;

      waiting.postMessage({ type: "HOCKER_ACTIVATE_UPDATE" });
      toast.dismiss(UPDATE_TOAST_ID);
    };

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

      toast("Nueva versión disponible", {
        id: UPDATE_TOAST_ID,
        description: "Hocker ONE no interrumpirá tu trabajo. Activa la actualización cuando sea seguro hacerlo.",
        duration: Infinity,
        action: {
          label: "Activar",
          onClick: () => requestUpdateActivation(reg),
        },
      });
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

      toast("Actualización activada", {
        id: ACTIVATED_TOAST_ID,
        description: "Recarga cuando hayas terminado la acción actual para usar la versión nueva.",
        duration: Infinity,
        action: {
          label: "Recargar",
          onClick: () => window.location.assign(window.location.href),
        },
      });
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
      toast.dismiss(UPDATE_TOAST_ID);
      installPrompt = null;
      registration = null;
    };
  }, []);

  return null;
}
