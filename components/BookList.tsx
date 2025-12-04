"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import Link from "next/link";
import { motion } from "framer-motion";

export default function BookList() {
  const books = useLiveQuery(() => db.books.toArray());

  if (!books) return <div className="text-center p-4">Loading...</div>;

  if (books.length === 0) {
    return (
      <div className="text-center p-8 glass-panel rounded-lg">
        <p className="text-xl mb-4">まだ本がありません。</p>
        <Link
          href="/books/new"
          className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-md transition-colors inline-block"
        >
          最初の本を追加
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-lg flex flex-col h-full"
        >
          <Link href={`/books/${book.id}`} className="flex-grow">
            <h3 className="text-xl font-bold mb-2 font-serif text-amber-50">{book.title}</h3>
            <p className="text-gray-300 mb-2">{book.author}</p>
            <div className="text-sm text-gray-400 mb-4">
              ステータス: <span className="capitalize text-amber-200">{book.status.replace(/_/g, " ")}</span>
            </div>
            {book.coverUrl && (
               <div className="w-full h-48 bg-gray-800 mb-4 rounded overflow-hidden">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
               </div>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
