"use client";

import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

// Check for SW updates every 60 seconds.
// Safari on iOS can miss the initial update check, especially in standalone PWA mode.
const UPDATE_CHECK_INTERVAL_MS = 60_000;

interface UseServiceWorkerReturn {
  updateAvailable: boolean;
  applyUpdate: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;

    navigator.serviceWorker
      .register("/sw.js", {
        // Bypass browser HTTP cache when checking for SW updates.
        // Critical for Safari/iOS which aggressively caches sw.js.
        updateViaCache: "none",
      })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });

        // Periodically check for updates — Safari may miss the first check
        intervalId = setInterval(() => {
          registration.update().catch(() => {
            // Silently ignore update check failures (offline, etc.)
          });
        }, UPDATE_CHECK_INTERVAL_MS);
      })
      .catch((error) => {
        logger.error("Service worker registration failed:", error);
      });

    // Also listen for the controlling SW changing (e.g. after skipWaiting)
    // to auto-reload so the user always gets the fresh version.
    let refreshing = false;
    const onControllerChange = (): void => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    return () => {
      if (intervalId) clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  const applyUpdate = (): void => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.waiting?.postMessage("skipWaiting");
      // The controllerchange listener above handles the reload
    });
  };

  return { updateAvailable, applyUpdate };
}
