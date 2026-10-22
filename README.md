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

  [🌐 **Explore Live Application**](https://getresumeiq.onrender.com) • [✨ **Features**](#-key-features) • [🏗️ **Architecture**](#-architecture) • [🚀 **Getting Started**](#-getting-started) • [👨‍💻 **Lead Architect**](#-lead-architect)

</div>

---

## 💡 About ResumeIQ

Over **75% of resumes** are filtered out by automated Applicant Tracking Systems (ATS) before a human recruiter ever sees them. Generic resume checkers only count buzzwords.

**ResumeIQ** is an enterprise-grade AI career copilot that audits resumes through the lens of modern ATS parsers (Workday, Greenhouse, Lever, Taleo) and simulates executive recruiters. Powered by **Google Gemini 2.5 Flash** and a serverless **Neon PostgreSQL** cloud backend, ResumeIQ provides mathematical precision, deep semantic matching, single-column parsing diagnostics, and instant actionable bullet rewrites.

---

## ✨ Key Features

### 1. ⚡ Dual-Score ATS Engine & Knockout Radar
- **ATS Compatibility Score (0–100%)**: Detects parsing errors, missing sections, complex tables, unreadable headers, and contact details.
- **Job Description Keyword Match (0–100%)**: Semantic NLP analysis comparing resume skills against target job postings.
- **Knockout Radar**: Pinpoints high-risk criteria triggering immediate ATS automated disqualification with color-coded risk alerts (`CLEARED`, `CAUTION`, `HIGH RISK`).

### 2. ✍️ AI Bullet Optimizer & Smart Keyword Injector (Google X-Y-Z Certified)
- **Real-Time Passive Verb & Metric Analyzer**: Instantly flags passive starters (*"worked on"*, *"responsible for"*) and missing numerical impact.
- **Google X-Y-Z Certified STAR Rewriter**: Generates 3 executive variants (*Accomplished [X] measured by [Y] by doing [Z]*):
  - 📈 **Metric & Impact Focused**: Amplifies numbers, scale, throughput, and business ROI.
  - ⚙️ **Technical Depth & Architecture**: Maximizes relevant tech-stack keyword density and system rigor.
  - 👥 **Leadership & Ownership**: Highlights cross-functional leadership, velocity, and delivery.
- **⚡ Smart Keyword Injector**: Select your missing ATS skills (e.g. *Docker, Kubernetes, AWS*) to synthesize authentic, production-grade experience bullets weaving them in naturally without keyword stuffing.

### 3. 🔍 ATS "X-Ray" Robot Parser Simulator ("What the Machine Sees")
- **Robot Plain-Text Terminal View**: Direct terminal emulation showing the exact unadorned plain text ingested by Workday, Taleo, and Greenhouse.
- **Candidate Contact Entity Verification**: Verifies whether candidate Name, Email, Phone, and LinkedIn/GitHub profiles were successfully extracted or lost in headers/graphics.
- **7-Point Parsed Section Matrix**: Checks standard section boundaries (*Contact, Summary, Experience, Skills, Education, Projects, Certifications*).
- **Layout & Flattening Risk Diagnostics**: Identifies multi-column text scrambling, table flattening, and non-standard font glyphs.
- **1-Click Text Copy & `.txt` Export**: Export clean parsed text for external tool testing.

### 4. 📝 1-Click Tailored Cover Letter & InMail Outreach Suite
- **1-Click Formatted Business Letter Print / Save as PDF**: Instant browser print engine integration generating formatted executive business letters.
- **Dedicated `.txt` Cover Letter Exporter**: Download pure tailored cover letter text in 1 click.
- **Live Recruiter Readability & Word Count Meter**: Dynamic badge monitoring optimal 250–350 word 1-page length.
- **1-Tap Company Quick-Pill Presets**: Fast pre-fills for industry leaders (*Google, Microsoft, Amazon, Meta, Stripe, Netflix, YC Startup*).
- **Multi-Persona Cold Outreach**:
  - Direct Engineering Manager / Lead Pitch
  - Warm Alumni & Peer Referral Request
  - Corporate Technical Recruiter InMail
  - Post-Application Day 5 Follow-Up
  - LinkedIn Connection Note (<300 character live limit counter)

### 5. 🎯 AI Interview Question Predictor & Verified Readiness Credential
- **Targeted Screening Predictor**: Predicts top 4 interview questions based on candidate's exact resume skill gaps with STAR Coaching Tips.
- **Voice & STAR Mock Simulator Integration**: 1-click launch into the interactive voice/audio simulator with speech recognition and AI evaluation.
- **Official ATS Readiness Credential Modal**:
  - Dynamic Verification ID (e.g. `RIQ-89241`) with SHA-256 hash security.
  - **1-Click LinkedIn Announcement Post Draft**: Pre-formatted viral post highlighting verified scores.
  - **GitHub README Markdown Badge**: Embed verified ATS badges into your GitHub profile.
  - **HTML Portfolio Badge**: Embeddable responsive badges for developer portfolios.
  - **Printable Landscape Official Certificate**: Print or save high-resolution A4 landscape credentials.

### 6. 📈 Version Lineage Diff & Progression Tracking
- Track multiple revisions of your resume with parent-root version lineage.
- Interactive side-by-side version progression charts, score deltas, and keyword resolution tracking between drafts.

### 7. 🛡️ Reverse Interview Defense Matrix & Google X-Y-Z Engine (Step 1)
- **Deep Bullet-Level Defensibility Audit**: Evaluates every work experience and project claim through the lens of Principal Staff Architects and Hiring Bar Raisers.
- **Risk Distribution & Vulnerability Alerts**: Flags high-stakes architectural statements (*HIGH*, *MEDIUM*, *LOW* risk) that lack technical proof and risk severe interview failure.
- **Realistic Technical Grilling Questions**: Generates exact, uncompromising interview questions (scale bottlenecks, failure modes, network partitions, SLA guarantees) with tactical preparation cheat sheets.
- **Google X-Y-Z Formula Compliance**: Analyzes *Accomplished [X] as measured by [Y], by doing [Z]*, identifies corporate fluff words, and delivers 1-click structured rewrites.

### 8. 🏢 Adversarial Multi-ATS Simulator Engine (Workday, Taleo, Greenhouse, Lever - Step 3)
- **Workday ATS Parser Emulation**: Audits table-flattening bugs, multi-column transposition hazards, and header/footer text stripping risks across Google, Amazon, Walmart, and Salesforce pipelines.
- **Oracle Taleo Engine Emulation**: Detects non-standard date tokens that cause Taleo to calculate 0 months of tenure, along with strict stem keyword matching.
- **Greenhouse & Lever Talent Acquisition**: Evaluates candidate scorecard density, recruiter fast-scan digests, social profile indexing (GitHub, LinkedIn), and auto-generated candidate tags.
- **Comparative Multi-System Scorecard**: Side-by-side clearance rates identifying the Safest ATS Platform vs Most Vulnerable ATS Platform with emulated machine terminal output previews.

### 9. 👁️ Recruiter 6-Second Attention Heatmap & Eye-Tracking Saliency (Step 4)
- **Predictive F-Pattern Visual Saliency**: Accurately simulates the exact 6-second eye-tracking trajectory of executive recruiters based on Ladders & Nielsen Norman eye-tracking science.
- **Interactive Document Canvas**: Renders dynamic glowing heatmaps (Hot-Red $\to$ Amber $\to$ Green $\to$ Blind Spot) directly over the candidate's document layout.
- **Real-Time 6-Second Gaze Path Animation**: Interactive simulation button where a glowing gaze cursor glides across the resume in real-time, displaying the recruiter's internal monologue second-by-second.
- **Recruiter Blind Spot Diagnostics**: Flags high-impact metrics buried below the F-scan line (where over 82% of recruiters miss them) with instant re-ordering directives.

### 10. 🛡️ GitHub Proof-of-Work Verification Engine (Step 5)
- **Claimed Skill vs. Codebase Audit**: Deeply scans candidate GitHub repositories, extracting actual commit activity, dependency declarations (`package.json`, `requirements.txt`, `go.mod`), and production architectures.
- **Automated Proof-of-Work (PoW) Scoring**: Cross-references resume skill claims against committed lines of code, test coverage, and architectural maturity (`GOLD_STANDARD`, `SILVER_STANDARD`, `EMERGING_PROOF`).
- **Production Architecture Signals**: Detects containerization (Docker, Kubernetes), automated CI/CD pipelines, unit/integration testing suites, and microservice topologies.
- **Verifiable Credential & Embeddable Badges**: Provides a tamper-proof verification code (`RIQ-POW-XXXXXX`), GitHub README markdown badges, and HTML portfolio widgets to eliminate candidate impostor syndrome and prove authentic expertise.

---

## 🎨 Design System & Responsiveness

- **Obsidian Dark & Clean Light Modes**: Automatic system preference detection with zero flash of unstyled content (`localStorage` pre-paint script).
- **Google 4-Color Prismatic Glow**: Subtle accents inspired by Google’s signature primary spectrum (`#4285F4`, `#EA4335`, `#FBBC05`, `#34A853`).
- **Glassmorphic Depth**: Frosted backdrop filters, fluid micro-interactions powered by `Framer Motion`, and accessible contrast ratios.
- **🖥️ Executive Cockpit UI Architecture**: Engineered for laptops, desktop monitors, and ultrawide displays to eliminate endless vertical scrolling. Features a collapsible JD banner (reclaiming 200px+ above the fold), a 5-action responsive suite strip, and instant sub-view switching (`📊 ATS Diagnostics & Gaps` | `🎯 Recruiter Readiness & STAR` | `🏢 Company ATS Simulators`).
- **100% Fluid Responsive**: Pixel-perfect layout with 44px+ touch targets from compact mobile smartphones (320px) to 4K desktop displays.

---

## 🏗️ Architecture

ResumeIQ is organized as an enterprise-grade monorepo:

```
ResumeIQ/
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProofOfWorkModal.tsx       # GitHub proof-of-work codebase auditor & badge generator
│   │   │   ├── RecruiterHeatmapModal.tsx  # 6-second eye-tracking heatmap & gaze simulator
│   │   │   ├── InterviewDefenseCard.tsx   # Google XYZ auditor & reverse interview grilling matrix
│   │   │   ├── CompanySimulator.tsx       # Big-4 ATS parser engine (Workday/Taleo/Greenhouse/Lever)
│   │   │   ├── AtsXRayModal.tsx           # Machine vision terminal & entity extractor
│   │   │   ├── AtsReadinessBadgeModal.tsx # Verified credential, badges & LinkedIn share
│   │   │   ├── BulletOptimizer.tsx        # STAR rewriter & smart keyword injector
│   │   │   ├── ApplicationKit.tsx         # Cover letter PDF generator & InMail suite
│   │   │   ├── MockInterviewSimulator.tsx # Voice recognition & STAR interview coach
│   │   │   ├── InterviewReadinessCard.tsx # Recruiter probability & predicted questions
│   │   │   ├── VersionCompare.tsx         # Version diffing & score progression
│   │   │   ├── KnockoutRadar.tsx          # Automated ATS disqualifier screen
│   │   │   └── Dashboard.tsx              # Executive workspace hub
│   │   ├── context/              # Auth & Theme context providers
│   │   ├── services/             # Type-safe API client (relative endpoints, zero-CORS)
│   │   └── App.tsx               # Root routing and application state
│   ├── public/                   # PWA icons, Google rainbow brand assets
│   └── vite.config.ts            # Vite bundler configuration + Dev Proxy
│
├── backend/                      # Node.js + Express 4 REST API
│   ├── src/
│   │   ├── config/               # Database pool, env schema (Zod), Winston logger
│   │   ├── controllers/          # Request handlers (resumes, analyses, optimizer, etc.)
│   │   ├── db/migrations/        # Idempotent PostgreSQL DDL migrations
│   │   ├── middleware/           # Rate limiting, AES auth guards, Multer memory storage
│   │   ├── repositories/         # Parameterized SQL query layers
│   │   ├── services/             # Gemini 2.5 LLM, PDF parser, Interview Defense, Multi-ATS, Heatmap Saliency, Proof-of-Work
│   │   └── server.js             # Production entry point serving static bundle
│
├── render.yaml                   # Automated Render Blueprint specification
└── LICENSE                       # Official MIT License
```

---

## 🔐 Security & Privacy

- **Field-Level Encryption at Rest**: Sensitive resume text is encrypted with **AES-256-GCM** using Node.js `crypto`.
- **Cloud-Native Database Persistence**: Avatars and candidate records store Base64/buffer payloads directly in PostgreSQL (Neon), surviving PaaS container restarts.
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
