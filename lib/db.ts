import Dexie, { type Table } from 'dexie';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string; // Base64 or Blob URL
  status: 'want_to_read' | 'reading' | 'completed';
  progress: {
    current: number;
    total: number;
    unit: 'page' | 'percent';
  };
  rating?: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  type: 'note' | 'visualization'; // ユーザーメモ or AI可視化
  createdAt: Date;
  aiGeneratedImage?: string;
}

export interface ChatSession {
  id: string;
  bookId: string;
  messages: {
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
  }[];
  updatedAt: Date;
}

export class ReadingLogDatabase extends Dexie {
  books!: Table<Book>;
  notes!: Table<Note>;
  chatSessions!: Table<ChatSession>;

  constructor() {
    super('ReadingLogDB');
    this.version(1).stores({
      books: 'id, status, addedAt, updatedAt',
      notes: 'id, bookId, createdAt',
      chatSessions: 'id, bookId, updatedAt'
    });

    // バージョン2: typeフィールドを追加
    this.version(2).stores({
      books: 'id, status, addedAt, updatedAt',
      notes: 'id, bookId, type, createdAt',
      chatSessions: 'id, bookId, updatedAt'
    }).upgrade(async tx => {
      // 既存のnotesに type: 'note' を設定（マイグレーション）
      const notes = await tx.table('notes').toArray();
      for (const note of notes) {
        if (!note.type) {
          await tx.table('notes').update(note.id, {
            type: note.content?.startsWith('視覚的印象：') ? 'visualization' : 'note'
          });
        }
      }
    });
  }
}

export const db = new ReadingLogDatabase();
