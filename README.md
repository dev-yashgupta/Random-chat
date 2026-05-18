# Random-chat

A real-time anonymous chat app — text and video. No registration required.

## Project Structure

```
random-chat/
├── client/          # React frontend (Vite + TypeScript + Tailwind v4)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React context (global state)
│   │   ├── hooks/        # useSocket hook
│   │   ├── services/     # socketService, webrtcService
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helpers
│   ├── vite.config.ts    # Dev proxy → server:3001
│   └── package.json
├── server/          # Express + Socket.IO backend (TypeScript)
│   ├── src/
│   │   ├── database/     # Supabase client
│   │   ├── middleware/   # Auth, rate limiting, validation
│   │   ├── routes/       # REST API routes
│   │   ├── services/     # Matchmaking, sessions, reports
│   │   └── types/        # TypeScript types
│   └── package.json
├── .env             # Root env file (loaded by server)
├── Dockerfile       # Multi-stage production build
└── package.json     # Root scripts
```

## Getting Started

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

The only required values for local dev (without a database) are none — the server runs in in-memory mode automatically when Supabase credentials are absent.

To enable persistence, add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run in development

```bash
npm run dev
```

This starts:
- **Server** on `http://localhost:3001` (Express + Socket.IO, hot-reload via tsx)
- **Client** on `http://localhost:5173` (Vite dev server, proxies `/api` and `/socket.io` to server)

### 4. Build for production

```bash
npm run build   # builds client/dist + server/dist
npm start       # starts server which serves client/dist as static files
```

In production, everything runs from a single process on a single port.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite 7 |
| Backend | Node.js, Express, Socket.IO, TypeScript |
| Real-time | Socket.IO (WebSocket) |
| Video | WebRTC (peer-to-peer) |
| Database | Supabase (PostgreSQL) — optional |
| Build | Vite (client), tsc (server) |

## Features

- **Text chat** — real-time messaging with a random stranger
- **Video chat** — WebRTC peer-to-peer video/audio
- **Matchmaking** — queue-based random pairing
- **Next partner** — skip to a new conversation instantly
- **Report system** — flag inappropriate behaviour
- **Admin dashboard** — `GET /api/admin/dashboard` (Bearer token auth)
- **No-database mode** — runs fully in-memory when Supabase is not configured

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Public stats |
| POST | `/api/reports` | Submit a report |
| GET | `/api/admin/dashboard` | Admin dashboard (auth required) |

## Deployment

### Docker (recommended)

```bash
docker build -t random-chat .
docker run -p 3001:3001 --env-file .env random-chat
```

### Railway / Render / Fly.io

Set `NODE_ENV=production` and the Supabase env vars. The build command is `npm run build` and the start command is `node server/dist/index.js`.

### Vercel (client only)

Deploy `client/` as a static Vite app. Set `VITE_WS_URL` to your server URL.
