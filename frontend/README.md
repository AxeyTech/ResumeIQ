# ResumeIQ — Web Frontend

An intelligent resume review product — score your resume the way an ATS
does, then get specific, actionable fixes. Built as a Vite + React +
TypeScript app with a Google-palette-driven, glassmorphic, dark-mode-ready
design system.

## Design system

- **Palette:** the full Google brand palette (`#4285F4` blue, `#EA4335` red,
  `#FBBC05` yellow, `#34A853` green) as gradient accents and neon glows,
  over a clean light canvas or a deep luxurious near-black dark mode.
- **Type:** Fraunces (display headlines), Lora (body), Poppins (UI labels),
  JetBrains Mono (scores and data readouts).
- **Effects:** glassmorphism panels, animated aurora gradient background
  with scroll parallax, neon glow on hover/focus, gradient text and
  buttons, and a signature animated ATS Score Ring used throughout.
- **Dark mode:** a real theme system (persisted, respects OS preference on
  first visit) with a circular "reveal" transition driven by the browser's
  View Transition API, gracefully falling back to an instant switch in
  browsers that don't support it (or when `prefers-reduced-motion` is set).

## Getting started

Requires [Node.js](https://nodejs.org) 18 or later.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command           | Description                              |
|--------------------|-------------------------------------------|
| `npm run dev`      | Start the local dev server with hot reload |
| `npm run build`    | Type-check and build for production        |
| `npm run preview`  | Preview the production build locally       |
| `npm run lint`     | Run ESLint                                 |

## Project structure

```
src/
  components/
    Navbar.tsx              Sticky glass nav — Sign In / Begin + theme toggle
    ThemeToggle.tsx           Icon + text morphing dark-mode toggle
    AuroraBackground.tsx      Animated gradient-mesh background w/ parallax
    Hero.tsx                  Hero section with staggered entrance animation
    ScoreRing.tsx              Signature animated score-ring (Google gradient)
    TrustStrip.tsx             Methodology / trust strip
    HowItWorks.tsx             Three-step process section
    Features.tsx               Feature grid, each card its own Google color
    DashboardPreview.tsx       Interactive product dashboard mockup
    UploadDemo.tsx             Working drag-and-drop demo flow
    AuthPage.tsx               Full-screen Sign In / Begin (create account) flow
    FinalCTA.tsx               Closing call-to-action
    Footer.tsx                 Footer
  context/
    ThemeContext.tsx           Theme state, persistence, transition logic
  App.tsx                     Assembles all sections + auth overlay routing
  index.css                   Tailwind layers + design tokens/utilities
  main.tsx                    React entry point

```

## Notes

- This build is a polished front-end/demo layer only — `UploadDemo` and
  `AuthPage` simulate their flows on the client so the product feels
  complete to try. Wiring them to a real backend means pointing them at
  the REST API described in the ResumeIQ System Design Document (Node.js +
  Express + the Google Gemini API for NLP/ML).
- Motion respects `prefers-reduced-motion` throughout, including the
  dark-mode transition.
- All interactive elements have visible keyboard focus states.
- The dark-mode circular reveal uses `document.startViewTransition`
  (Chrome/Edge/Opera). Other browsers still get full dark mode — just
  with a simple cross-fade instead of the circular wipe.

