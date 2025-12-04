"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, Book } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import { useState } from "react";
import { generateUUID } from "@/lib/utils";

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const book = useLiveQuery(() => db.books.get(id), [id]);
  const notes = useLiveQuery(() => db.notes.where("bookId").equals(id).toArray(), [id]);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  if (!book) return <div className="p-8 text-center">読み込み中...</div>;

  const handleDelete = async () => {
    if (confirm("本当にこの本を削除しますか？")) {
      await db.books.delete(id);
      await db.chatSessions.where("bookId").equals(id).delete();
      await db.notes.where("bookId").equals(id).delete();
      router.push("/");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await db.notes.add({
      id: generateUUID(),
      bookId: id,
      content: newNote,
      type: 'note',
      createdAt: new Date(),
    });
    setNewNote("");
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim()) return;
    await db.notes.update(noteId, { content: editingContent });
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("このメモを削除しますか？")) {
      await db.notes.delete(noteId);
    }
  };

  const startEditing = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          ← 戻る
        </button>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-300">
          本を削除
        </button>
      </div>

      <div className="glass-panel p-6 rounded-lg">
        <h1 className="text-3xl font-bold font-serif mb-2 text-amber-100">{book.title}</h1>
        <p className="text-xl text-gray-300 mb-4">{book.author}</p>
        
        <div className="flex space-x-4 border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 px-4 ${activeTab === 'details' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-gray-400'}`}
          >
            詳細・メモ
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2 px-4 ${activeTab === 'chat' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-gray-400'}`}
          >
            AIと語る
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-6">
            {/* Progress & ステータス */}
            <div>
              <h3 className="text-lg font-bold mb-2">ステータス</h3>
              <div className="flex space-x-2">
                 {[
                   { value: 'want_to_read', label: '読みたい' },
                   { value: 'reading', label: '読書中' },
                   { value: 'completed', label: '読了' }
                 ].map(s => (
                   <button
                     key={s.value}
                     onClick={() => db.books.update(id, { status: s.value as Book['status'] })}
                     className={`px-3 py-1 rounded ${book.status === s.value ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                   >
                     {s.label}
                   </button>
                 ))}
              </div>
            </div>

            {/* メモ Section */}
            <div>
              <h3 className="text-lg font-bold mb-2">メモ</h3>

              {/* 新規メモ追加 */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="新しいメモを入力..."
                  className="w-full p-3 bg-black/30 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-white resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  className="mt-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
                >
                  メモを追加
                </button>
              </div>

              {/* メモ一覧 */}
              <div className="space-y-3">
                {notes && notes.filter(note => note.type === 'note').length > 0 ? (
                  notes.filter(note => note.type === 'note').map((note) => (
                    <div key={note.id} className="p-4 bg-black/30 border border-gray-600 rounded">
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 bg-black/50 border border-gray-700 rounded focus:border-amber-500 focus:outline-none text-white resize-none"
                            rows={3}
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleEditNote(note.id)}
                              className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-200 whitespace-pre-wrap mb-2">{note.content}</p>

                          {/* AI生成画像がある場合は表示 */}
                          {note.aiGeneratedImage && (
                            <div className="mt-3 mb-3 rounded overflow-hidden border border-amber-500/30">
                              <img
                                src={note.aiGeneratedImage}
                                alt="AI生成画像"
                                className="w-full h-auto"
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleString('ja-JP')}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditing(note.id, note.content)}
                                className="text-amber-400 hover:text-amber-300 text-sm"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic">まだメモがありません</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ChatInterface bookId={id} bookTitle={book.title} />
        )}
      </div>
    </div>
  );
}
