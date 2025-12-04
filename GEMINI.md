# App 044: Reading Log - Project Rules

## AI Configuration
- **Text Model**: `gemini-2.5-flash`
  - Use for: Chat, Summary, Recommendations.
- **Image Model**: `gemini-3-pro-image-preview`
  - Use for: "Visualize Impressions" feature.

## Design System
- **Theme**: "Quiet Study" (静かな書斎)
- **Key Assets**: `public/background.png` (Fixed background)
- **UI Style**: Glassmorphism, Serif fonts for headings.

## PWA Configuration
- **Update Strategy**: Force Update (Strict)
  - `skipWaiting: true`
  - `clientsClaim: true`
  - `cleanupOutdatedCaches: true`

## Data Persistence
- **Strategy**: Local-First
- **Storage**: IndexedDB (via `Dexie.js`)
- **No External DB**: Do not introduce server-side databases.
