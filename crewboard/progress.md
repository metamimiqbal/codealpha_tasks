## 2026-10-08 — CrewBoard MVP

**Request**
- Build the CrewBoard collaborative project management MVP with a vanilla JS frontend, Express/Mongoose API, cookie JWT authentication, authorization, and setup documentation.

**Changes**
- `src/` — added Express app/server, MongoDB connection, User/Project/ProjectMember/Task/Comment models, auth and validation middleware, API routes/controllers, and project cleanup/authorization services.
- `public/` — added responsive login/register, project list, board, task detail/comments, member management, and profile screens.
- `package.json`, `package-lock.json`, `.env.example`, `README.md` — added dependencies, configuration template, and setup/API documentation.
- `test/models.test.js` — added schema and index checks.

**Decisions**
- JWTs use HttpOnly, SameSite=Lax cookies; secure cookies are enabled in production.
- Socket.IO and notifications remain outside this MVP until the core app is exercised end-to-end.

**Verification**
- `npm install` — PASS; dependencies installed, npm reported 0 vulnerabilities.
- `npm test` — PASS; 4 schema/index tests.
- `node --check` on server, app, routes, controllers, and browser JS — PASS.
- MongoDB-backed runtime/API flow — NOT RUN; a local MongoDB service was not confirmed available.

**Remaining**
- Start MongoDB, configure `.env`, and manually exercise authentication, project membership, task CRUD, and comments end-to-end.

## 2026-10-08 — CrewBoard security and HTTP verification follow-up

**Request**
- Continue the CrewBoard work and finish the available verification.

**Changes**
- `src/services/taskUpdates.js`, `src/controllers/tasks.js` — restrict task edits to validated editable fields so request data cannot change project membership or task provenance.
- `public/styles.css` — corrected button font declaration so the intended frontend typography applies.
- `test/app.test.js`, `test/models.test.js` — cover static serving, unauthenticated API responses, and protected task fields.

**Decisions**
- Kept the existing MongoDB-backed design; no local MongoDB server or Docker runtime is installed in this environment.

**Verification**
- `npm test` — PASS; 6 tests, including a loopback HTTP smoke test.
- `node --check` for task controller, task update service, and browser JavaScript — PASS.

**Remaining**
- MongoDB-backed sign-up, project, member, task, and comment flows still need end-to-end verification in an environment with MongoDB.

## 2026-10-08 — Task completion checkbox

**Request**
- Let members mark an in-progress task complete directly from the board, and remove Done from task creation status choices.

**Changes**
- `public/app.js` — added a board-card completion checkbox that updates task status to Done; add-task offers only To Do and In Progress, while edit-task uses a completion checkbox.
- `public/styles.css` — styled the completion control.
- `test/models.test.js` — confirmed Done remains a valid task status.

**Decisions**
- The existing server-side task update endpoint handles the status change, preserving membership authorization and validation.

**Verification**
- `npm test` — PASS; 7 tests.
- `node --check public/app.js` and `node --check src/controllers/tasks.js` — PASS.

**Remaining**
- MongoDB-backed end-to-end verification remains pending as recorded above.

## 2026-10-08 — Attempted local runtime startup

**Request**
- Run the CrewBoard program locally.

**Changes**
- None.

**Verification**
- `npm start` with temporary development environment values — FAIL; MongoDB connection refused at `127.0.0.1:27017`.
- Homebrew service check — MongoDB is not installed or registered as a service.

**Remaining**
- Start or install MongoDB, then rerun `npm start`.

## 2026-10-08 — Started local runtime

**Request**
- Check whether MongoDB is installed and run CrewBoard.

**Changes**
- None.

**Verification**
- MongoDB system/Homebrew installation — NOT FOUND.
- Existing local MongoDB process on `127.0.0.1:55064` — AVAILABLE; used without modifying its process.
- `npm start` with `MONGODB_URI=mongodb://127.0.0.1:55064/crewboard` — PASS; listening on port 3000.
- `curl http://127.0.0.1:3000/` — PASS; returned CrewBoard HTML.
- `curl http://127.0.0.1:3000/api/auth/me` — PASS; returned expected `401 Unauthorized` while signed out.

**Remaining**
- Install/configure a dedicated MongoDB service if the current temporary local MongoDB instance is stopped.

## 2026-10-08 — Sequential task status actions

**Request**
- Make To Do tasks startable into In Progress, and make only In Progress tasks completable from the board, with accessible status colors.

**Changes**
- `public/app.js` — To Do cards now offer Start task, In Progress cards offer Mark done, and Done cards show a completion indicator.
- `public/styles.css` — added separate amber, blue, and green status treatments with keyboard focus styling.

**Decisions**
- Kept status transitions on the existing authenticated task update endpoint.
- Status foreground/background contrast ratios are 7.08:1 or higher, exceeding WCAG AA for normal text.

**Verification**
- `npm test` — PASS; 7 tests.
- `node --check public/app.js` and `node --check src/controllers/tasks.js` — PASS.
- WCAG contrast calculation for status colors — PASS; To Do 7.88:1, hover 7.08:1, In Progress 7.61:1, Done 7.15:1.

**Remaining**
- MongoDB-backed UI flow verification was unavailable because the runtime MongoDB service was not reachable during this turn.

## 2026-10-08 — Undo task completion

**Request**
- Allow a task in Done to be unchecked and returned to active work.

**Changes**
- `public/app.js` — Done cards now have an Undo done checkbox; unchecking updates the task back to In Progress.
- `public/styles.css` — styled the checked undo control with the Done status colors.

**Decisions**
- Undo returns to In Progress because that is the only board state from which tasks can be completed.

**Verification**
- `npm test` — PASS; 7 tests.
- `node --check public/app.js` and `node --check src/controllers/tasks.js` — PASS.

**Remaining**
- None for the requested UI change.
