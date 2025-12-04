# App 044: Reading Log App - Implementation Plan

## Goal Description
Create a "Book Reading Log" application with a "Quiet Study" atmosphere, featuring local-first data storage, AI chat for book discussions, and PWA capabilities.

## User Review Required
> [!IMPORTANT]
> **AI Models**: Using `gemini-1.5-flash` for text and `imagen-3.0-generate-001` (or equivalent) for image generation.
> **PWA Strategy**: Strict force update enabled (`skipWaiting`, `clientsClaim`).
> **Data**: All data stored locally using IndexedDB (Dexie.js).

## Proposed Changes

### 1. Project Configuration & Assets
#### [NEW] [background.png](file:///home/ustar-wsl-2-2/.gemini/antigravity/brain/86e85f43-1842-44f4-8cdb-7e6436f3ccd2/quiet_study_background_1764727696658.png)
- Add the generated "Quiet Study" background image to `public/`.

#### [MODIFY] [package.json](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/package.json)
- Install dependencies: `dexie`, `dexie-react-hooks`, `@google/generative-ai`, `next-pwa` (or `@ducanh2912/next-pwa`), `framer-motion` (for animations).

#### [MODIFY] [next.config.ts](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/next.config.ts)
- Configure PWA settings.

### 2. Core Architecture (Local DB)
#### [NEW] [lib/db.ts](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/lib/db.ts)
- Define Dexie schema for `books`, `notes`, `chatSessions`.

### 3. UI Implementation ("Quiet Study" Theme)
#### [MODIFY] [app/globals.css](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/app/globals.css)
- Add custom fonts (Serif) and glassmorphism utilities.

#### [MODIFY] [app/layout.tsx](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/app/layout.tsx)
- Implement the fixed background wrapper.

### 4. Features
#### [NEW] [components/BookList.tsx](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/components/BookList.tsx)
- Grid view of books with covers.

#### [NEW] [components/ChatInterface.tsx](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/components/ChatInterface.tsx)
- Chat UI for discussing books with Gemini.

#### [x] [app/actions/ai.ts](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/app/actions/ai.ts)
- [x] Server actions for `generateText` (Chat) and `generateImage` (Impressions).
- [ ] Add `findAuthor` action using Gemini 2.5 Flash.

#### [MODIFY] [app/books/new/page.tsx](file:///home/ustar-wsl-2-2/projects/100apps/app044-reading-log/app/books/new/page.tsx)
- [ ] Add "Find Author" button or auto-trigger on blur.
- [ ] Integrate with `findAuthor` action.

## Verification Plan
### Automated Tests
- `npm run build`: Verify build success with PWA config.
- `npm run lint`: Check for code quality.

### Manual Verification
- **PWA**: Install app, go offline, verify access. Update app, verify immediate refresh.
- **AI**: Chat with a book, verify responses. Generate an image, verify display.
- **DB**: Add a book, refresh page, verify persistence.
