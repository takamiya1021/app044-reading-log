"use client";

import { db } from "@/lib/db";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // 全データを取得
            const books = await db.books.toArray();
            const notes = await db.notes.toArray();
            const chatSessions = await db.chatSessions.toArray();

            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                data: {
                    books,
                    notes,
                    chatSessions,
                },
            };

            // JSONファイルとしてダウンロード
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reading-log-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert("データのエクスポートが完了しました！");
            setIsOpen(false);
        } catch (error) {
            console.error("Export error:", error);
            alert("エクスポートに失敗しました。");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.data || !importData.version) {
                throw new Error("無効なバックアップファイルです。");
            }

            // 確認ダイアログ
            const confirmed = confirm(
                "インポートすると、既存のデータに追加されます。続けますか？\n（重複するIDのデータは上書きされます）"
            );

            if (!confirmed) {
                setIsImporting(false);
                return;
            }

            // データをインポート
            const { books, notes, chatSessions } = importData.data;

            if (books && books.length > 0) {
                await db.books.bulkPut(books);
            }
            if (notes && notes.length > 0) {
                // typeフィールドがない古いデータに対して自動設定
                const notesWithType = notes.map((note: any) => {
                    if (!note.type) {
                        // aiGeneratedImageがあるか、contentが「視覚的印象：」で始まる場合はvisualization
                        if (note.aiGeneratedImage || note.content?.startsWith('視覚的印象：')) {
                            return { ...note, type: 'visualization' };
                        } else {
                            return { ...note, type: 'note' };
                        }
                    }
                    return note;
                });
                await db.notes.bulkPut(notesWithType);
            }
            if (chatSessions && chatSessions.length > 0) {
                await db.chatSessions.bulkPut(chatSessions);
            }

            alert(
                `インポート完了！\n本: ${books?.length || 0}件\nメモ: ${notes?.length || 0}件\nチャット: ${chatSessions?.length || 0}件`
            );

            // ページをリロードしてデータを反映
            window.location.reload();
        } catch (error) {
            console.error("Import error:", error);
            alert("インポートに失敗しました。ファイルを確認してください。");
        } finally {
            setIsImporting(false);
            // ファイル入力をリセット
            event.target.value = "";
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-300 hover:text-amber-100 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                aria-label="設定"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 border border-white/10 focus:outline-none z-50 overflow-hidden"
                    >
                        <div className="py-1">
                            <div className="px-4 py-2 border-b border-white/10">
                                <h3 className="text-sm font-semibold text-gray-300">設定</h3>
                            </div>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowApiKeyModal(true);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-2 border-b border-white/5"
                            >
                                <span>🔑 APIキー設定</span>
                            </button>

                            <div className="px-4 py-2 border-b border-white/10 bg-black/20">
                                <h3 className="text-xs font-semibold text-gray-400">データ管理</h3>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-2"
                            >
                                <span>{isExporting ? "⏳ エクスポート中..." : "📥 エクスポート"}</span>
                            </button>

                            <label className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center space-x-2">
                                <span>{isImporting ? "⏳ インポート中..." : "📤 インポート"}</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    disabled={isImporting}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
        </div>
    );
}
