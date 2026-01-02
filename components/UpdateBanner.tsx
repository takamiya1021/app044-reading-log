"use client";

import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

export function UpdateBanner() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-gradient-to-r from-amber-900/95 to-amber-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-amber-700/50 p-4">
        <div className="flex items-start gap-3">
          {/* アイコン */}
          <div className="flex-shrink-0 w-10 h-10 bg-amber-600/30 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>

          {/* テキスト */}
          <div className="flex-1 min-w-0">
            <h3 className="text-amber-100 font-medium text-sm">
              アプリが更新されました
            </h3>
            <p className="text-amber-200/70 text-xs mt-1">
              新しいバージョンが利用可能です。更新ボタンを押して最新版をお楽しみください。
            </p>
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={dismissUpdate}
            className="flex-shrink-0 text-amber-300/60 hover:text-amber-300 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ボタン */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={applyUpdate}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            今すぐ更新
          </button>
          <button
            onClick={dismissUpdate}
            className="px-4 py-2 text-amber-300/80 hover:text-amber-300 text-sm transition-colors"
          >
            後で
          </button>
        </div>
      </div>
    </div>
  );
}
