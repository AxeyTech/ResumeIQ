# ResumeIQ — Full Stack

This archive contains the complete ResumeIQ website: the React frontend and
the Node.js/Express/PostgreSQL backend, as two independent projects in one
place.

```
resumeiq-fullstack/
  frontend/     Vite + React + TypeScript site (npm run dev → localhost:5173)
  backend/      Express + PostgreSQL API (npm run dev → localhost:3000)
```

Each has its own `package.json`, `README.md`, and `.env`/`.env.example` —
they are two separate Node projects that run side by side, not a single
combined install. Run each one's setup independently:

## Quick start

**1. Backend first** (the frontend's "Continue with Google" and live
analysis flow need it running):

```bash
cd backend
npm install
cp .env.example .env    # fill in DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY,
                         # and optionally GOOGLE_CLIENT_ID/SECRET + GEMINI_API_KEY
npm run migrate
npm run dev              # → http://localhost:3000
```

**2. Frontend, in a second terminal:**

```bash
cd frontend
npm install
npm run dev               # → http://localhost:5173
```

Full details — including the Google OAuth Cloud Console configuration, the
Gemini API key, every API endpoint, the database schema, and how each
non-functional requirement from the SRS is implemented — are in
`backend/README.md` and `frontend/README.md` respectively.

## Wiring them together

The frontend currently simulates its upload/analysis/auth flows on the
client so it's fully explorable standalone. To connect it to the real
backend, point its API calls at `http://localhost:3000` (see
`backend/README.md` → "API overview" for the full endpoint list) and have
it store the JWT returned by `/auth/login`, `/auth/register`, or the Google
OAuth callback for use as `Authorization: Bearer <token>` on subsequent
requests.
