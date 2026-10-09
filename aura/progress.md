# Project Progress Log

## Project: E-Commerce Site MVP
**Stack:** Node.js, Express, MongoDB (Mongoose), Vanilla HTML5/CSS3/JavaScript
**Date Started:** 2026-10-08

---

## 2026-10-08 — Project Initialization & Architecture Setup

**Request**
- Build a basic e-commerce site with product listings, shopping cart, product details page, order processing, user registration/login, powered by Express.js (Node.js), MongoDB, and Vanilla HTML/CSS/JS frontend.

**Changes**
- `progress.md` — Initialized persistent work log as per AGENTS.md workflow.

**Decisions**
- Structured into modular layers: `src/models`, `src/controllers`, `src/routes`, `src/middleware`, `src/config`, `public/`.
- Employ `bcryptjs` and `jsonwebtoken` for secure password hashing and stateless token authentication.
- Provide automatic fallback to `mongodb-memory-server` if `MONGODB_URI` is not accessible, allowing instant out-of-the-box development and testing while fully supporting standard external MongoDB instances.
- Build a polished, responsive Vanilla CSS & JavaScript frontend featuring catalog browsing, search/filter, product modal/details, slide-in cart drawer, checkout modal with order processing, user login/registration modal, order history, and toast feedback.

**Verification**
- Initial repository inspection — PASS.

**Remaining**
- Backend models, API routes, controllers, auth middleware, and seeding.
- Automated API test suite.
- Frontend UI components, styles, state management, and API integration.
- End-to-end verification.

## 2026-10-08 — Removing Generated Dependencies From Git History

**Request**
- Resolve GitHub rejecting the initial push because a generated MongoDB binary under `node_modules` exceeded the file-size limit.

**Changes**
- `.gitignore` — Added rules for `node_modules/`, macOS metadata, and environment files.
- Git index — Removed tracked `node_modules/` and `.DS_Store` from the amended initial commit while preserving the local dependency installation.

**Decisions**
- Kept `package.json` and `package-lock.json` tracked so dependencies can be restored with `npm install`.

**Verification**
- Tracked `node_modules` files — PASS; 0.
- Tracked blobs over 100 MB — PASS; none.
- `npm test` — PASS; 18 tests passed.
- `git push -u origin main` — PASS; branch created and tracking `origin/main`.

**Remaining**
- None.
