# InterviewAI – Technical Interview Platform

AI-powered technical interview platform built with React, Node.js, Socket.io, Prisma, and Claude AI.

---

## Project Structure

```
interviewai/
├── client/     → React + Vite + Tailwind frontend
└── server/     → Node.js + Express + Socket.io backend
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key (get one at console.anthropic.com)
- Judge0 API key from RapidAPI (for code execution)

---

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (see below)
npx prisma migrate dev --name init
npm run dev
```

**server/.env values:**
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/interviewai"
JWT_SECRET="any-long-random-string"
ANTHROPIC_API_KEY="sk-ant-..."
JUDGE0_API_KEY="your-rapidapi-key"
CLIENT_URL="http://localhost:5173"
PORT=3001
```

**Getting Judge0 API key (free):**
1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Sign up and subscribe to the free tier
3. Copy your RapidAPI key

---

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs at: http://localhost:5173
Backend runs at: http://localhost:3001

---

## Features Built

### ✅ Authentication
- Register / Login with JWT
- Role-based (Candidate / Interviewer)
- Protected routes

### ✅ Interview Sessions
- Create sessions with language selection
- Start / End interview flow
- Session history

### ✅ AI Chat (Claude)
- Streaming real-time responses
- Full conversation history saved to DB
- Technical question generation
- AI code review and scoring

### ✅ Code Editor
- Monaco Editor (VS Code engine)
- Multi-language support
- Real-time code sync via WebSocket
- Code execution via Judge0

### ✅ Analytics Dashboard
- Stats overview
- Score history charts
- Session table

### ✅ WebSocket (Socket.io)
- Real-time session events
- Code sync between participants
- Reconnection handling

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get profile |
| POST | /api/sessions | Create session |
| GET | /api/sessions | List my sessions |
| GET | /api/sessions/:id | Get session detail |
| PATCH | /api/sessions/:id/start | Start session |
| PATCH | /api/sessions/:id/end | End session |
| POST | /api/chat/message | Send chat (streaming) |
| GET | /api/chat/challenge | Get AI coding challenge |
| POST | /api/chat/review | AI code review |
| POST | /api/code/execute | Execute code |
| GET | /api/code/languages | List languages |
| GET | /api/analytics/dashboard | Dashboard stats |

---

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Connect GitHub to Vercel, set root as /client
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Railway auto-detects Node.js
```

### Database → Railway PostgreSQL or Supabase (free)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| HTTP Client | Axios |
| WebSocket | Socket.io |
| Backend | Node.js, Express |
| AI | Anthropic Claude API |
| Code Execution | Judge0 API |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Realtime | Socket.io |
