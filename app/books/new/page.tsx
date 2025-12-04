"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { findAuthor } from "@/app/actions/ai";
import { generateUUID } from "@/lib/utils";

export default function NewBook() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"want_to_read" | "reading" | "completed">("want_to_read");
  const [isSearchingAuthor, setIsSearchingAuthor] = useState(false);

  const handleTitleBlur = async () => {
    if (title && !author) {
      setIsSearchingAuthor(true);
      const detectedAuthor = await findAuthor(title);
      if (detectedAuthor) {
        setAuthor(detectedAuthor);
      }
      setIsSearchingAuthor(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.books.add({
      id: generateUUID(),
      title,
      author,
      status,
      progress: {
        current: 0,
        total: 0,
        unit: 'page'
      },
      addedAt: new Date(),
      updatedAt: new Date(),
    });
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 font-serif text-amber-100">新しい本を追加</h1>
      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-8 rounded-lg">
        <div>
          <label className="block mb-2 text-gray-300">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full p-3 bg-black/30 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-white"
            placeholder="本のタイトルを入力"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-gray-300">
            著者
            {isSearchingAuthor && <span className="text-amber-400 text-sm ml-2 animate-pulse">検索中...</span>}
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-3 bg-black/30 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-white"
            placeholder="著者名を入力"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-gray-300">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full p-3 bg-black/30 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-white"
          >
            <option value="want_to_read">読みたい</option>
            <option value="reading">読書中</option>
            <option value="completed">読了</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            戻る
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
          >
            本を追加
          </button>
        </div>
      </form>
    </div>
  );
}
