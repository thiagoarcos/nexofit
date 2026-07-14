# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

NEXO FIT is a personal habits/gym/diet tracker PWA, built for one user's iPhone (installed via Safari "Add to Home Screen"). React 18 + Vite, no backend — all state lives in `localStorage`. Deployed to GitHub Pages.

- Dev server: `npm run dev` (serves at `http://localhost:5173/nexofit/`, note the base path)
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint` (ESLint 9, flat config in `eslint.config.js`). No test suite or formatter configured.

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically on every push to `main` — no manual deploy step, no PR workflow, commit directly to main.

**Critical gotcha:** `vite.config.js` hardcodes `BASE = "/nexofit/"`, used as both the Vite `base` and the PWA manifest `scope`/`start_url`. This must match the GitHub repo name exactly, or the deployed app loads blank. Only change it if the repo is ever renamed.

## Architecture

- `src/App.jsx` is a single ~2200-line file containing the entire app: date/utility helpers, gym analysis logic (`analyzeLift`), all UI components (`Card`, `PinGate`, etc.), and the main `App` component. Keep it as one file — don't split it into separate component modules.
- `src/main.jsx` is just the React root bootstrap.
- All persistent state is in `localStorage` (keys: `nexofit-state-v4` with fallback reads from older `v3/v2/v1`, `nexofit-pin-hash-v1`, `nexofit-unlocked`, `nexofit-install-hidden`). No database, no API calls, no env vars.
- The app has a 4-digit PIN lock screen (`PinGate`): PIN is SHA-256 hashed and stored in `localStorage`, 3 failed attempts triggers a full local data reset.
- Gym → **Rutina** (weekday-recurring `state.workouts`) and Gym → **Programa** (`state.program`, a variable-length array of weeks → days → exercises with per-set weight/reps/RIR and auto tonnage via `tonnage()`) are two independent systems — don't conflate them. Programa's week/day counts are dynamic (not hardcoded to 5/7), since importing a `.xlsx` routine can produce any shape.
- `.xlsx` routine import (`parseRoutineWorkbook` in `App.jsx`) expects the coach's spreadsheet format: sheets matched by `/semana/i`, each with `Día N` header rows followed by a label row, then exercise rows (col B=name, C=intensity, D=rest, then 6 groups of 3 columns for peso/reps/rir starting at col E). The `xlsx` (SheetJS) package is dynamically `import()`ed only inside that function so it doesn't bloat the main PWA bundle — keep it that way.

## Conventions

- UI copy is in Spanish — keep new user-facing text in Spanish to match the existing app.
- No lockfile is committed; CI runs `npm install` (not `npm ci`).
