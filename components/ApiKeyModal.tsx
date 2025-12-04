"use client";

import { useState, useEffect } from "react";

export default function ApiKeyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [imageModel, setImageModel] = useState<"nano-banana" | "pro-banana">("nano-banana");

  useEffect(() => {
    console.log("ApiKeyModal mounted");
    // Check for existing key in cookies
    const match = document.cookie.match(new RegExp("(^| )gemini_api_key=([^;]+)"));
    if (match) {
      setSavedKey(match[2]);
      setApiKey(match[2]);
    }
    // Check for existing image model preference
    const modelMatch = document.cookie.match(new RegExp("(^| )image_model=([^;]+)"));
    if (modelMatch) {
      setImageModel(modelMatch[2] as "nano-banana" | "pro-banana");
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    // Save to cookie (expires in 365 days)
    document.cookie = `gemini_api_key=${apiKey}; path=/; max-age=31536000; SameSite=Strict`;
    document.cookie = `image_model=${imageModel}; path=/; max-age=31536000; SameSite=Strict`;
    setSavedKey(apiKey);
    setIsOpen(false);
    window.location.reload(); // Reload to ensure server actions pick it up immediately
  };

  const handleDelete = () => {
    document.cookie = "gemini_api_key=; path=/; max-age=0";
    setSavedKey("");
    setApiKey("");
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <>
      {/* Trigger Button (Fixed to top-right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[9999] p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-lg transition-all border border-white/20 flex items-center justify-center cursor-pointer"
        title="APIキー設定"
        style={{ pointerEvents: 'auto' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        <span className="sr-only">API Key</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/30 p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-amber-100 mb-4 font-serif">Gemini APIキー設定</h2>
            <p className="text-gray-400 text-sm mb-2">
              AI機能を使用するには、Google Gemini APIキーを入力してください。
              キーはブラウザにローカル保存されます（Cookie）。
            </p>
            <p className="text-sm mb-4">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                → Google AI StudioでAPIキーを取得
              </a>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">APIキー</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-2 bg-black/50 border border-gray-700 rounded focus:border-amber-500 focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">画像生成モデル</label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value as "nano-banana" | "pro-banana")}
                  className="w-full p-2 bg-black/50 border border-gray-700 rounded focus:border-amber-500 focus:outline-none text-white"
                >
                  <option value="nano-banana">Nano Banana（速い、軽量）</option>
                  <option value="pro-banana">Pro Banana（高品質、遅い）</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pro Bananaは混雑時にタイムアウトする可能性があります
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                {savedKey ? (
                  <button
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 text-sm underline"
                  >
                    キーを削除
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
