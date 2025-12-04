# Technical Design: Book Reading Log App (App 044)

## 1. Architecture Overview
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS for "Quiet Study" theme.
- **State Management**: React Context + `idb` (IndexedDB wrapper) or `zustand` with persistence for robust local storage.
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`).

## 2. AI Configuration
- **Text Model**: `gemini-2.5-flash`
    - Used for: Chat, Summary, Recommendations.
- **Image Model**: `gemini-3-pro-image-preview`
    - Used for: "Visualize Impressions" feature.
- **Implementation**:
    - Server Actions to handle API requests securely (hiding API keys if needed, though local-first apps might allow user keys). *Decision: Use Server Actions with env vars for the main deployment.*

## 3. PWA Strategy
- **Library**: `next-pwa` or `serwist`.
- **Configuration**:
    ```javascript
    // next.config.js / PWA config
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    reloadOnOnline: false,
    ```
- **Goal**: Prevent "stale app" issues by forcing immediate activation of new service workers.

## 4. Data Model (Local DB)
Using `Dexie.js` or raw `IndexedDB` for better query capability than LocalStorage.

```typescript
interface Book {
  id: string; // UUID
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

interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: Date;
  aiGeneratedImage?: string; // URL/Base64 of visualized impression
}

interface ChatSession {
  id: string;
  bookId: string;
  messages: {
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
  }[];
}
```

## 5. UI/UX Design
- **Background**: Fixed, high-quality "Quiet Study" image.
- **Layout**:
    - Central container with semi-transparent background (Glassmorphism).
    - Gold/Warm accents to match the "Study" vibe.
    - Serif fonts for book titles (e.g., Playfair Display).
