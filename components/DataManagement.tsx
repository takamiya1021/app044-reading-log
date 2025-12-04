"use client";

import { db } from "@/lib/db";
import { useState } from "react";

export default function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
    <div className="flex space-x-3">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-50 border border-indigo-600 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? "エクスポート中..." : "📥 データをエクスポート"}
      </button>

      <label className="px-4 py-2 bg-green-800/80 hover:bg-green-700 text-green-50 border border-green-600 rounded-md transition-all cursor-pointer inline-flex items-center">
        {isImporting ? "インポート中..." : "📤 データをインポート"}
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={isImporting}
          className="hidden"
        />
      </label>
    </div>
  );
}
