<div align="center">

  <img src="frontend/public/logo-icon.png" alt="ResumeIQ Logo" width="100" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(66, 133, 244, 0.3);" />

  # ResumeIQ ⚡
  ### *Intelligent ATS & Career Copilot Platform*

  **Know exactly why your resume gets rejected by ATS software — and exactly how to fix it.**

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-getresumeiq.onrender.com-34A853?style=for-the-badge&logo=render&logoColor=white)](https://getresumeiq.onrender.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-4285F4?style=for-the-badge)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
  [![Google Gemini](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20Flash-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

  <br />

  [🌐 **Explore Live Application**](https://getresumeiq.onrender.com) • [✨ **Features**](#-key-features) • [🏗️ **Architecture**](#-architecture) • [🚀 **Getting Started**](#-getting-started) • [👨‍💻 **Author**](#-lead-architect)

</div>

---

## 💡 About ResumeIQ

Over **75% of resumes** are filtered out by automated Applicant Tracking Systems (ATS) before a human recruiter ever sees them. Generic resume checkers only count buzzwords.

**ResumeIQ** is an enterprise-grade AI career copilot that audits resumes through the lens of modern ATS parsers (Workday, Greenhouse, Lever, Taleo) and simulates executive recruiters. Powered by **Google Gemini 2.5 Flash** and a serverless **Neon PostgreSQL** backend, ResumeIQ provides mathematical precision, deep semantic matching, and instant actionable bullet rewrites.

---

## ✨ Key Features

### 1. ⚡ Dual-Score ATS Engine
- **ATS Compatibility Score (0–100%)**: Detects parsing errors, missing sections, complex tables, unreadable headers, and contact details.
- **Job Description Keyword Match (0–100%)**: Semantic NLP analysis comparing resume skills against the target job requirements.
- **Categorized Breakdown**: Granular scoring across *Impact*, *Keywords*, *Readability*, and *Formatting*.

### 2. 🎯 Knockout Radar
- Pinpoints high-risk criteria that trigger immediate ATS automated rejection (e.g., missing required degrees, certification gaps, residency mismatches).
- Color-coded risk status (`CLEARED`, `CAUTION`, `HIGH RISK`) with detailed mitigation steps.

### 3. ✍️ AI Bullet Optimizer
- Rewrites resume bullet points using proven executive frameworks (Google XYZ formula: *Accomplished [X], as measured by [Y], by doing [Z]*).
- Generates 3 tailored variants for each bullet:
  - 📈 **Metric-Focused**: Amplifies numbers, scale, and revenue impact.
  - 🛠️ **Technical Depth**: Maximizes relevant tech-stack keyword density.
  - 👑 **Leadership & Ownership**: Highlights cross-functional leadership and initiative.

### 4. 🎭 Multi-Persona Hiring Simulator
- Evaluates resumes through 3 realistic recruiter viewpoints:
  - **The 6-Second HR Screener**: First-impression scan for titles and keywords.
  - **The Technical Lead**: In-depth architecture, code quality, and engineering rigor.
  - **The Hiring Manager**: Business impact, scalability, and cultural fit.

### 5. 🎙️ AI Mock Interview Simulator
- Generates custom behavioral and technical interview questions based directly on the candidate's resume vulnerabilities.
- Evaluates user responses in real-time, providing constructive coaching and model answers.

### 6. 💼 Application Kit Generator
- One-click tailored **Cover Letter**, **LinkedIn Connection Pitch**, **Hiring Manager InMail**, and **Alumni Referral Note** matched to any target company.

### 7. 📈 Version Comparison & Score Progression
- Track multiple revisions of your resume.
- Interactive version timeline highlighting score progression and keyword diffs between drafts.

---

## 🎨 Design System

- **Obsidian Dark & Clean Light Modes**: Automatic system preference detection with zero flash of unstyled content (`localStorage` pre-paint script).
- **Google 4-Color Prismatic Glow**: Subtle accents inspired by Google’s primary spectrum (`#4285F4`, `#EA4335`, `#FBBC05`, `#34A853`).
- **Glassmorphic Depth**: Frosted backdrop filters, micro-interactions powered by `Framer Motion`, and accessible contrast ratios.
- **100% Fluid Responsive**: Pixel-perfect layout from ultra-compact smartphones (320px) to 4K desktop displays.

---

## 🏗️ Architecture

ResumeIQ is organized as an enterprise-grade monorepo:

```
ResumeIQ/
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Modular UI widgets (KnockoutRadar, BulletOptimizer, etc.)
│   │   ├── context/              # Auth & Theme context providers
│   │   ├── services/             # Dynamic API client (relative endpoints for zero-CORS)
│   │   └── App.tsx               # Root routing and application state
│   ├── public/                   # PWA icons, Google rainbow brand assets
│   └── vite.config.ts            # Vite bundler configuration + Dev Proxy
│
├── backend/                      # Node.js + Express 4 REST API
│   ├── src/
│   │   ├── config/               # Database pool, env schema (Zod), Winston logger
│   │   ├── controllers/          # Request handlers with async error wrappers
│   │   ├── db/migrations/        # Idempotent PostgreSQL DDL migrations
│   │   ├── middleware/           # Rate limiting, AES auth guards, Multer upload
│   │   ├── repositories/         # Parameterized SQL query layers
│   │   ├── services/             # Gemini 2.5 LLM, PDF parser, Keyword matcher
│   │   └── server.js             # Production entry point serving static bundle
│
├── render.yaml                   # Automated Render Blueprint specification
└── LICENSE                       # Official MIT License
```

---

## 🔐 Security & Privacy

- **Field-Level Encryption at Rest**: Sensitive user data is encrypted with **AES-256-GCM** using `crypto`.
- **Stateless Authentication**: Signed **JWT (JSON Web Tokens)** with secure HTTP-only cookie support.
- **Password Security**: Strong hashing with **Bcrypt** (12 salt rounds).
- **Hardened Edge**: Rate limiting via `express-rate-limit`, secure HTTP response headers with `helmet`, and dynamic origin CORS reflection.
- **Input Validation**: Strict schema enforcement using `zod`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.18.0
- **PostgreSQL** database (Local or [Neon.tech](https://neon.tech))
- **Google Gemini API Key** ([Get free key here](https://aistudio.google.com/))

### 1. Clone the repository
```bash
git clone https://github.com/AxeyTech/ResumeIQ.git
cd ResumeIQ
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment variables
Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PGSSL=true

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-byte-base64-encryption-key

# AI Engine
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Email Verification (Optional)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 4. Run database migrations
```bash
npm run migrate
```

### 5. Build and launch
```bash
# Build frontend
npm run build

# Start production server
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🌐 Production Deployment

ResumeIQ is pre-configured for automated **1-Click Continuous Deployment** on [Render](https://render.com) via `render.yaml`:

- **Platform:** Render Web Service (Node.js)
- **Region:** Singapore (`ap-southeast-1`)
- **Cloud Database:** Serverless PostgreSQL on [Neon.tech](https://neon.tech)
- **Live Production URL:** **[https://getresumeiq.onrender.com](https://getresumeiq.onrender.com)**

---

## 👨‍💻 Lead Architect

<div align="center">

  ### **Akshay Sharma**
  *Lead Architect & Full-Stack Engineer*

  [![GitHub](https://img.shields.io/badge/GitHub-AxeyTech-181717?style=flat-square&logo=github)](https://github.com/AxeyTech)
  [![Website](https://img.shields.io/badge/Live%20Product-GetResumeIQ-4285F4?style=flat-square&logo=google-chrome&logoColor=white)](https://getresumeiq.onrender.com)

</div>

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
Copyright (c) 2026 Akshay Sharma (AxeyTech)
```

<div align="center">
  <sub>Built with ❤️ for job seekers who deserve better odds.</sub>
</div>
