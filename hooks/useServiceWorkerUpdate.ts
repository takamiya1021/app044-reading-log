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

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      // waiting状態のService Workerがあれば更新可能
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        // 既にwaiting状態のワーカーがいる場合
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // 新しいService Workerがインストールされた時
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // installed状態になり、かつ既存のコントローラーがある場合は更新
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });

        // 定期的に更新をチェック（1時間ごと）
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    // controllerchangeイベントでページをリロード
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    registerServiceWorker();
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
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
