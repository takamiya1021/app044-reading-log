"use client";

import { useState, useRef, useEffect } from "react";
import { generateChatResponse, generateImageFromImpression } from "@/app/actions/ai";
import { db, ChatSession } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { generateUUID } from "@/lib/utils";

interface ChatInterfaceProps {
  bookId: string;
  bookTitle: string;
}

// タイムアウト付きPromiseラッパー
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`タイムアウト（${timeoutMs / 1000}秒）`)), timeoutMs)
    ),
  ]);
}

export default function ChatInterface({ bookId, bookTitle }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visualResult, setVisualResult] = useState<{ image?: string; prompt?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookStatus, setBookStatus] = useState("");
  const [bookNotes, setBookNotes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 可視化ギャラリー用
  const visualizations = useLiveQuery(
    async () => {
      const notes = await db.notes.where("bookId").equals(bookId).and(note => note.type === 'visualization').toArray();

      // 手動でソート（createdAtを確実にDateに変換してから比較）
      notes.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return timeA - timeB; // 昇順（古い→新しい）
      });

      console.log("=== Visualizations Debug ===");
      notes.forEach((note, idx) => {
        const timestamp = note.createdAt instanceof Date ? note.createdAt.toISOString() : new Date(note.createdAt).toISOString();
        console.log(`${idx}: ${note.id.substring(0, 8)}... - ${timestamp}`);
      });
      return notes;
    },
    [bookId]
  );

  // Get book metadata and notes
  useEffect(() => {
    const fetchBookData = async () => {
      const book = await db.books.get(bookId);
      if (book) {
        setBookAuthor(book.author);
        const statusMap: Record<string, string> = {
          'want_to_read': '読みたい',
          'reading': '読書中',
          'completed': '読了'
        };
        setBookStatus(statusMap[book.status] || book.status);
      }

      const notes = await db.notes.where("bookId").equals(bookId).toArray();
      setBookNotes(notes.map(n => n.content));
    };
    fetchBookData();
  }, [bookId]);

  // Read the session reactively
  const session = useLiveQuery(
    () => db.chatSessions.where("bookId").equals(bookId).first(),
    [bookId]
  );

  // Create session if it doesn't exist
  useEffect(() => {
    const initSession = async () => {
      const existing = await db.chatSessions.where("bookId").equals(bookId).first();
      if (!existing) {
        const newSession: ChatSession = {
          id: generateUUID(),
          bookId,
          messages: [{
            role: "model",
            content: `こんにちは！この本について語り合いましょう： "${bookTitle}". ここまでの感想はいかがですか？`,
            timestamp: new Date()
          }],
          updatedAt: new Date()
        };
        await db.chatSessions.add(newSession);
      }
    };

    initSession();
  }, [bookId, bookTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, visualResult, errorMessage]);

  const buildContextMessage = () => {
    let context = `この会話は「${bookTitle}」（著者: ${bookAuthor || "不明"}）についてです。`;
    if (bookStatus) context += `\n現在のステータス: ${bookStatus}`;
    if (bookNotes.length > 0) {
      context += `\n\nユーザーのメモ:\n${bookNotes.join("\n")}`;
    }
    return { role: "user" as const, parts: context };
  };

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    const userMsg = input;
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    const updatedMessages = [
      ...session.messages,
      { role: "user" as const, content: userMsg, timestamp: new Date() }
    ];

    await db.chatSessions.update(session.id, {
      messages: updatedMessages,
      updatedAt: new Date()
    });

    try {
      const historyForAPI = [
        buildContextMessage(),
        ...updatedMessages
          .filter(m => !(m.role === "model" && m.content.includes("こんにちは！この本について語り合いましょう")))
          .map(m => ({ role: m.role, parts: m.content }))
      ];

      const result = await withTimeout(generateChatResponse(historyForAPI, userMsg), 60000);

      if (result.text) {
        await db.chatSessions.update(session.id, {
          messages: [
            ...updatedMessages,
            { role: "model" as const, content: result.text, timestamp: new Date() }
          ],
          updatedAt: new Date()
        });
      } else {
        console.error(result.error);
        setErrorMessage(result.error || "エラーが発生しました");
      }
    } catch (error: any) {
      console.error("チャットエラー:", error);
      setErrorMessage(error.message || "予期しないエラーが発生しました");
    }

    setIsLoading(false);
  };

  const handleVisualize = async () => {
    console.log("可視化ボタンがクリックされました");
    if (!session) {
      console.error("セッションが見つかりません");
      setErrorMessage("セッションが見つかりません");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    console.log("ローディング開始");
    
    try {
      const historyForAPI = [
        buildContextMessage(),
        ...session.messages
          .filter(m => !(m.role === "model" && m.content.includes("こんにちは！この本について語り合いましょう")))
          .map(m => ({ role: m.role, parts: m.content }))
      ];
      
      console.log("画像生成API呼び出し中...");
      const result = await withTimeout(generateImageFromImpression(bookTitle, historyForAPI), 120000);
      console.log("API結果:", result);
      
      if (result.image) {
        setVisualResult({ image: result.image, prompt: result.prompt });
        const newImageTimestamp = new Date();
        const newId = generateUUID();
        await db.notes.add({
            id: newId,
            bookId,
            content: result.prompt,
            type: 'visualization',
            createdAt: newImageTimestamp,
            aiGeneratedImage: result.image
        });
        console.log("画像生成成功");
        console.log(`新しい画像: ${newId.substring(0, 8)}... - ${newImageTimestamp.toISOString()}`);

        // 全ての可視化画像を取得してタイムスタンプを表示
        const allViz = await db.notes.where("bookId").equals(bookId).and(note => note.type === 'visualization').sortBy('createdAt');
        console.log("=== 保存後の全画像一覧 ===");
        allViz.forEach((note, idx) => {
          const timestamp = note.createdAt instanceof Date ? note.createdAt.toISOString() : new Date(note.createdAt).toISOString();
          console.log(`${idx}: ${note.id.substring(0, 8)}... - ${timestamp}`);
        });
      } else {
          console.error("画像生成エラー:", result.error);
          setErrorMessage(result.error || "画像生成に失敗しました");
      }
    } catch (error: any) {
      console.error("可視化エラー:", error);
      if (error.message?.includes('タイムアウト')) {
        setErrorMessage("画像生成がタイムアウトしました。サーバーが混雑している可能性があります。しばらく待ってから再試行してください。");
      } else {
        setErrorMessage(error.message || "予期しないエラーが発生しました");
      }
    }
    
    setIsLoading(false);
    console.log("ローディング終了");
  };

  const handleDeleteVisualization = async (noteId: string) => {
    if (confirm("この可視化画像を削除しますか？")) {
      await db.notes.delete(noteId);
    }
  };

  if (!session) return <div className="p-4 text-gray-400">チャットを読み込み中...</div>;

  const canSend = !isLoading && input.trim().length > 0;

  // チャットメッセージと画像を時系列順に統合
  const allItems = [
    ...session.messages.map((msg, idx) => ({
      type: 'message' as const,
      data: msg,
      timestamp: msg.timestamp,
      key: `msg-${idx}`
    })),
    ...(visualizations || []).map(viz => ({
      type: 'visualization' as const,
      data: viz,
      timestamp: viz.createdAt,
      key: `viz-${viz.id}`
    }))
  ].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  return (
      <div className="flex flex-col h-[600px] glass-panel rounded-lg overflow-hidden relative">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {allItems.map((item) => {
          if (item.type === 'message') {
            const msg = item.data;
            return (
              <div
                key={item.key}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-amber-800/80 text-white rounded-br-none"
                      : "bg-black/40 text-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          } else {
            // visualization
            const viz = item.data;
            return (
              <div key={item.key} className="flex justify-center my-4">
                <div className="bg-black/60 border border-amber-500/50 p-4 rounded-lg max-w-[90%] w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-amber-400 font-bold">生成されたイメージ</h4>
                    <button
                      onClick={() => handleDeleteVisualization(viz.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      削除
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 italic mb-4">{viz.content}</p>
                  {viz.aiGeneratedImage && (
                    <div className="w-full rounded overflow-hidden">
                      <img src={viz.aiGeneratedImage} alt="Generated Impression" className="w-full h-auto" />
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}

        {errorMessage && (
          <div className="flex justify-center my-4">
            <div className="bg-red-900/50 border border-red-500/50 p-4 rounded-lg max-w-[90%]">
              <h4 className="text-red-400 font-bold mb-2">エラー</h4>
              <p className="text-sm text-gray-300">{errorMessage}</p>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-black/40 p-4 rounded-lg rounded-bl-none flex items-center space-x-3">
               <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
               <div className="flex items-center space-x-1">
                 <span className="text-gray-300">AIが思考中</span>
                 <span className="flex space-x-1">
                   <span className="animate-bounce">.</span>
                   <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                   <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                 </span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-black/20 border-t border-white/10 relative z-10" style={{ pointerEvents: 'auto' }}>
        <div className="flex space-x-2">
          <button
            onClick={handleVisualize}
            disabled={isLoading}
            type="button"
            className="px-3 py-2 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-500/30 text-indigo-200 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="可視化"
            style={{ pointerEvents: 'auto' }}
          >
            🎨 可視化
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="感想を入力..."
            className="flex-grow p-2 bg-black/30 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-white"
            disabled={isLoading}
            style={{ pointerEvents: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            type="button"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
