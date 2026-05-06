# WeatherFit Reliability Test Plan

## Purpose
This document defines the manual reliability checks for WeatherFit before release/demo updates. It is designed to catch regressions in authentication, wardrobe persistence, recommendations, and session behavior.

## Scope
- Frontend reliability (`React` + `Vite`)
- Backend API reliability (`FastAPI`)
- Database persistence (`PostgreSQL`)
- Core user journeys (auth, item CRUD, recommendation flow)

## Out of Scope
- Load testing / stress testing
- Formal security penetration testing
- Cross-browser matrix beyond the primary browser used for demo/release

## Test Environment
- OS: macOS (record exact version in report)
- Browser: Chrome (record version in report)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`
- Database: Local PostgreSQL

## Preconditions
1. Backend is running and healthy:
   - `GET /api/health` returns success.
2. Frontend is running locally.
3. Required environment variables are set:
   - Frontend: `VITE_OPENWEATHER_API_KEY` (and optional `VITE_GOOGLE_CLIENT_ID`)
   - Backend: `DATABASE_URL`, `JWT_SECRET` (and optional `GOOGLE_CLIENT_ID`)
4. Database migrations are up to date (`alembic upgrade head`).

## Severity Levels
- `P0` (Blocker): Core flow unusable (crash, blank screen, login impossible, CRUD broken).
- `P1` (High): Core functionality degraded/wrong results but app still runs.
- `P2` (Medium/Low): Non-blocking bugs, UX polish issues, warnings.

## Test Cases

### A) Health and Boot
- App loads without blank screen.
- Browser console has no blocking runtime errors.
- `GET /api/health` returns success.

### B) Email Authentication
- Register with valid credentials succeeds.
- Login succeeds.
- User/profile state updates in navbar.
- Refresh keeps session (`/api/auth/me` works with stored token).

### C) Google Authentication (if configured)
- Google sign-in button renders.
- Google sign-in succeeds without origin/auth errors.
- Session persists on refresh.

### D) Wardrobe Item CRUD
- Add item manually.
- Added item appears in UI immediately.
- Refresh retains item (DB persistence).
- Delete item succeeds and remains deleted after refresh.

### E) Duplicate Protection
- Trigger preload once.
- Trigger preload again.
- No duplicate entries are shown/saved.

### F) Recommendation Flow
- Set city and activity context.
- Fetch weather and generate recommendation.
- Recommendation renders correctly.
- Refresh keeps expected persisted state (for example city).

### G) Session Transitions
- Sign-out confirmation appears.
- Sign-out clears authenticated state.
- Re-login does not show stale previous-session UI state.

## Exit Criteria
- No open `P0` issues.
- All core user journeys pass (`Auth`, `CRUD`, `Recommendation`).
- Any remaining `P1/P2` issues are documented with owner + next action.

## Evidence to Capture
- Screenshots:
  - Auth success
  - Item add/delete
  - Recommendation output
  - Any failure state
- Logs:
  - Browser console errors (if any)
  - Backend error traces (if any)

## Reporting
For each test run, create a dated report in:

- `docs/testing/reliability-report-YYYY-MM-DD.md`

Include tested commit hash, pass/fail summary, discovered issues, and evidence links.
