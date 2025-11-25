# ClarAI

ClarAI is a Vite-powered React application that showcases multimodal capabilities powered by Google's Gemini models. It features:

- Multi-session chat with quick vs. deep-thinking modes
- Vision analysis for uploaded images
- Imagen-based creative image generation
- Local demo authentication with OTP reset and Google sign-in placeholder

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` by default.

### Environment Variables

Create a `.env` (or `.env.local`) file in the project root with:

```
VITE_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Restart the dev server after changing env vars.

## Production Build

```bash
npm run build
npm run preview
```

Deploy the contents of the `dist/` folder (e.g., via Vercel or Netlify). Make sure to set the same environment variables in your hosting platform.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                                Client (Vite + React)                   │
│                                                                        │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────┐          │
│  │ modules/    │   │ services/gemini │   │ context/Auth...  │          │
│  │ Chat/Vision │──▶│ Google GenAI    │──▶│ Local auth store │          │
│  └─────────────┘   └─────────────────┘   └──────────────────┘          │
│         │                 │                         │                  │
│         │                 │                         │                  │
│         ▼                 ▼                         ▼                  │
│  components/ UI   services/firebase (placeholder)   localStorage       │
└────────────────────────────────────────────────────────────────────────┘

Backends / APIs:
- Google Gemini (text, vision, imagen) via `@google/genai`
- Google Identity (planned) via `@react-oauth/google`

Data Flow:
1. User authenticates (local demo store → future: Google OAuth + backend).
2. UI state stored in React Context + localStorage per user session.
3. Chat / Vision / Imagine modules call `services/gemini`.
4. Responses rendered in components; chat history persisted per session.
```

### Key Directories

- `app.tsx`: Shell layout, module routing, auth gating.
- `components/`: Chat modules, auth form, shared UI widgets.
- `context/AuthContext.tsx`: Local demo auth (password, OTP) and future Google hook-in.
- `services/`: External APIs (`gemini.ts`) and placeholders for future backend calls.
- `types.ts`: Shared enums (modules) and data structures (chat sessions, messages).

## Notes

This project currently uses a local demo auth store. Before going public:

1. Replace it with a real identity provider (Firebase/Supabase/Auth0).
2. Move chat history and user data to a secure backend.
3. Proxy Gemini requests server-side to avoid exposing API keys.


