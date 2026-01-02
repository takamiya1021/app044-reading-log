"use client";

import { useState, useEffect, useCallback } from "react";

interface UseServiceWorkerUpdateReturn {
  // 更新が利用可能かどうか
  updateAvailable: boolean;
  // 更新を適用する関数
  applyUpdate: () => void;
  // 更新通知を閉じる関数
  dismissUpdate: () => void;
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Service Workerがサポートされていない場合は何もしない
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        // 登録済みのService Workerを取得
        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          console.log("[SW] No service worker registered yet");
          return;
        }

        console.log("[SW] Service worker found, checking for updates...");

        // 既にwaiting状態のワーカーがいる場合
        if (registration.waiting) {
          console.log("[SW] Update already waiting");
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
          return;
        }

        // 更新をチェック
        await registration.update();
        console.log("[SW] Update check completed");

        // 更新チェック後にwaiting状態になったか確認
        if (registration.waiting) {
          console.log("[SW] New update found after check");
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
          return;
        }

        // 新しいService Workerがインストールされた時
        registration.addEventListener("updatefound", () => {
          console.log("[SW] Update found event fired");
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log("[SW] New worker state:", newWorker.state);
              // installed状態になり、かつ既存のコントローラーがある場合は更新
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[SW] New version installed, showing update banner");
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });

        // 定期的に更新をチェック（5分ごと）
        const intervalId = setInterval(async () => {
          console.log("[SW] Periodic update check");
          try {
            await registration.update();
            if (registration.waiting) {
              setWaitingWorker(registration.waiting);
              setUpdateAvailable(true);
            }
          } catch (error) {
            console.error("[SW] Periodic update check failed:", error);
          }
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
      } catch (error) {
        console.error("[SW] Service Worker check failed:", error);
      }
    };

    // controllerchangeイベントでページをリロード
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        console.log("[SW] Controller changed, reloading...");
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // 少し遅延させてからチェック（Service Worker登録完了を待つ）
    const timeoutId = setTimeout(checkForUpdates, 1000);

    return () => {
      clearTimeout(timeoutId);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      console.log("[SW] Applying update...");
      // waiting状態のService WorkerにskipWaitingを送信
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    applyUpdate,
    dismissUpdate,
  };
}
