"use client";

import { useState, useEffect } from "react";
import BookList from "@/components/BookList";
import SettingsMenu from "@/components/SettingsMenu";
import ApiKeyModal from "@/components/ApiKeyModal";
import Link from "next/link";

export default function Home() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check for existing API key in cookies
    const match = document.cookie.match(new RegExp("(^| )gemini_api_key=([^;]+)"));
    const keyExists = match && match[2].trim() !== "";
    setHasApiKey(!!keyExists);
  }, []);

  return (
    <div className="space-y-8">
      {/* API Key warning banner (shown only when modal is closed and no key exists) */}
      {!hasApiKey && !isApiKeyModalOpen && (
        <div className="glass-panel p-4 rounded-lg border-2 border-amber-500/50 bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-100 font-semibold">APIキーが未設定です</p>
                <p className="text-gray-300 text-sm">AI機能を使用するには、Gemini APIキーの設定が必要です。</p>
              </div>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-md transition-all"
            >
              APIキーを設定
            </button>
          </div>
        </div>
      )}

      <header className="glass-panel p-6 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif text-amber-100">読書ログ</h1>
            <p className="text-gray-300">あなたのための読書記録</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/books/new"
              className="px-4 py-2 bg-amber-800/80 hover:bg-amber-700 text-amber-50 border border-amber-600 rounded-md transition-all"
            >
              + 本を追加
            </Link>
            <SettingsMenu />
          </div>
        </div>
      </header>

      <BookList />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          // Re-check API key status after modal closes
          const match = document.cookie.match(new RegExp("(^| )gemini_api_key=([^;]+)"));
          setHasApiKey(!!(match && match[2].trim() !== ""));
        }}
      />
    </div>
  );
}
