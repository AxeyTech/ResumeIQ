# ResumeIQ Backend

Node.js + Express + PostgreSQL API implementing the ResumeIQ SRS v1.0 —
authentication (email/password + Google OAuth), resume upload & parsing,
job-description keyword gap analysis, ATS compatibility checking,
improvement reports, and version tracking, with the Google Gemini API doing
the NLP/ML heavy lifting.

Architecture follows the ResumeIQ System Design Document: a Repository
layer for data access, a Facade (`AnalysisOrchestrator`) coordinating the
scoring services, and pluggable NLP strategies (Gemini first, rule-based
fallback) so the system still works end-to-end without an API key.

## 1. Prerequisites

- Node.js 18.18+ (native `fetch`, `crypto.randomUUID`)
- PostgreSQL 14+
- `pg_dump` on PATH (ships with PostgreSQL) — only needed for the backup job

## 2. Setup

```bash
npm install
cp .env.example .env
```

Then edit `.env`:

```bash
# Generate a JWT secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Generate the field-level encryption key (must be exactly 32 bytes, base64):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Create the database:

```bash
createdb resumeiq
# or: psql -c "CREATE DATABASE resumeiq;"
```

Run migrations:

```bash
npm run migrate            # apply all pending migrations
npm run migrate:status     # see what's applied
npm run migrate:down       # roll back the most recent migration
```

Start the dev server:

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default (see "Why port 3000"
below).

## 3. Google OAuth setup ("Continue with Google")

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create an **OAuth 2.0 Client ID** (type: Web application).
2. **Authorized JavaScript origins:** `http://localhost:3000`
3. **Authorized redirect URIs:** `http://localhost:3000/auth/google/callback`
4. Copy the Client ID and Client Secret into `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

### Why the backend runs on port 3000

The redirect URI Google calls back to **must be served by this backend**,
because only the backend holds the client secret needed to exchange the
authorization code for tokens. That's why `PORT=3000` matches the origin/
redirect URI you configure in Google Cloud Console. The frontend (Vite) runs
on its own port (`5173` by default) and is *not* part of the OAuth redirect
chain — set `FRONTEND_URL` in `.env` to wherever it runs.

### The flow

1. Frontend's "Continue with Google" button links (or redirects) to
   `GET http://localhost:3000/auth/google`.
2. This backend redirects to Google's consent screen.
3. Google redirects back to `GET /auth/google/callback?code=...`.
4. The backend exchanges the code, creates/links the user, issues a JWT, and
   redirects the browser to `${FRONTEND_URL}/auth/callback#token=<jwt>`.
5. The frontend reads the token from the URL fragment (never sent to any
   server as part of a URL) and stores it for subsequent `Authorization:
   Bearer <token>` requests.

If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are left unset, `/auth/google`
returns a clear 503 rather than crashing — email/password auth keeps
working normally.

## 4. Google Gemini API setup

Get a key from [Google AI Studio](https://aistudio.google.com/apikey), then:

```
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
```

Every Gemini call (keyword extraction, keyword matching, recommendation
generation) is wrapped so that **if the key is missing or the call fails for
any reason, the system automatically falls back to rule-based logic**
instead of failing the request. You can develop and test the entire API
without a Gemini key — scores and reports will just be less semantically
aware.

## 5. API overview

All endpoints except `/health`, `/auth/register`, `/auth/login`, and
`/auth/google*` require `Authorization: Bearer <jwt>`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness + dependency check |
| POST | `/auth/register` | FR-6.1 |
| POST | `/auth/login` | FR-6.1 |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth redirect target |
| GET | `/auth/me` | Current user profile |
| DELETE | `/auth/account` | FR-6.3 — permanent deletion |
| POST | `/api/v1/resumes` | SF-1 — upload + parse (multipart field `resume`) |
| GET | `/api/v1/resumes` | FR-6.2 — list (latest version per lineage) |
| GET | `/api/v1/resumes/:id` | Get one |
| PATCH | `/api/v1/resumes/:id` | FR-6.2 — rename |
| DELETE | `/api/v1/resumes/:id` | FR-6.2 — delete |
| GET | `/api/v1/resumes/:id/versions` | FR-5.3 — up to 10 most recent versions |
| GET | `/api/v1/resumes/:id/versions/compare` | FR-5.2 — score timeline |
| POST | `/api/v1/resumes/:id/job-description` | SF-2 — attach/replace JD |
| GET | `/api/v1/resumes/:id/job-description` | Get attached JD |
| POST | `/api/v1/resumes/:id/analyze` | SF-2 + SF-3 — run scoring |
| GET | `/api/v1/analyses/:id` | Get analysis + delta vs. previous version |
| GET | `/api/v1/analyses/:id/report` | SF-4 — recommendations |
| GET | `/api/v1/analyses/:id/report.pdf` | SF-4 — PDF export |

To submit a new version of an existing resume, upload again with a
`parentResumeId` multipart field pointing at the previous version's id.

## 6. Non-functional requirements — what's implemented

| Requirement | Implementation |
|---|---|
| NFR-P1 (≤15s for ≤5 pages) | Parsing + scoring run synchronously within one request; Gemini calls have a 12s timeout with fallback |
| NFR-P2 (200 concurrent users) | Stateless JWT auth (horizontally scalable), connection-pooled Postgres, `express-rate-limit` |
| NFR-S1 (24h backups) | `src/jobs/backup.job.js` — `node-cron` schedule (`BACKUP_CRON`) shells out to `pg_dump`; `npm run backup` for a manual run |
| NFR-S2 (graceful failure) | Every controller uses `asyncHandler` + centralized `errorHandler`; failed resume parses keep the original upload and mark `status: 'failed'` for retry |
| NFR-S3 (graceful degradation) | `src/middleware/rateLimiter.js` — a bounded concurrency queue in front of `/analyze`; returns 503 with a clear message once the queue itself is full, instead of the process falling over |
| NFR-SE1 (TLS 1.2+) | Enforced at the reverse proxy in production (see below); HSTS + HTTP→HTTPS redirect when `NODE_ENV=production` |
| NFR-SE2 (encryption at rest) | Resume text is encrypted with AES-256-GCM (`src/utils/encryption.js`) before being stored; enable Postgres/disk encryption at the infrastructure level for full coverage |
| NFR-SE3 (password hashing) | `bcryptjs`, configurable cost factor (`BCRYPT_SALT_ROUNDS`) |
| NFR-SE4 (RBAC) | `role` column (`user`/`admin`) + `requireRole()` middleware |
| NFR-SE5 (malicious file validation) | MIME allow-list + magic-byte signature check (`src/middleware/upload.js`) before any file reaches the parser |

**Production TLS note:** this process itself speaks plain HTTP. In
production, put it behind a TLS-terminating reverse proxy or load balancer
(nginx, Caddy, or your cloud provider's LB) — that's where the actual
TLS 1.2+ certificate lives, per the deployment view in the SDD.

## 7. Database schema

See `src/db/migrations/`. Five tables, matching the SDD's ER diagram:
`users`, `resumes` (with `parent_resume_id`/`root_resume_id` for version
lineage), `job_descriptions`, `analyses`, `reports`. Every table has an
`updated_at` column kept current by a shared trigger.

## 8. Project structure

```
src/
  server.js                 Entry point — HTTP server, backup scheduler, graceful shutdown
  app.js                    Express app: security headers, CORS, rate limiting, routes
  config/                   env validation, logger, DB pool
  db/
    migrations/             Numbered .sql files, each with -- UP / -- DOWN sections
    migrate.js               Minimal migration runner (up/down/status)
  routes/                   Express routers — thin, just wiring
  controllers/               Request/response handling, calls services
  services/                  Business logic
    auth.service.js
    googleOAuth.service.js
    resumeParser.service.js    SF-1: PDF/DOCX text + section extraction
    keywordMatcher.service.js  SF-2: Gemini-first, rule-based fallback
    atsChecker.service.js      SF-3: formatting/structure scoring
    reportGenerator.service.js SF-4: recommendations + PDF export
    analysisOrchestrator.service.js  Facade coordinating the above
  repositories/               Data access layer (Repository pattern, per SDD)
  middleware/                 auth, upload validation, error handling, rate limiting
  jobs/backup.job.js          Scheduled pg_dump
  utils/                      apiError, jwt, password hashing, AES encryption, validators
```

## 9. Error handling & logging

Every error response has the shape `{ "error": { "code", "message", "details"? } }`.
`ApiError` (`src/utils/apiError.js`) is the single source of truth for
status codes; anything else thrown is treated as a bug and logged with a
full stack trace, but the client only ever sees a generic message in
production. Logs go to the console and to `logs/combined.log` /
`logs/error.log` via Winston.

## 10. What's out of scope here (see SRS Appendix C)

OCR for scanned resumes, multi-language support, and the specific
third-party identity providers beyond Google are explicitly deferred in the
SRS's own TBD list, and are not implemented here either.
