# BLEM — Mini Social Media MVP

BLEM is a modern, modular, production-ready mini social media web application built with **Express.js (Node.js)**, **MongoDB + Mongoose**, and a high-performance **Vanilla Web Stack (HTML5, Modern CSS, ES6+ JavaScript)**.

---

## 🌟 Key Features

- **Authentication & Security**:
  - User registration & login with secure password hashing (`bcryptjs`).
  - Stateless JSON Web Token (`jsonwebtoken`) authentication with Bearer token header authorization.
  - One-click demo login option (`Alex Rivera` / `alex@blem.social`) for testing without filling out forms.
- **User Profiles**:
  - Public profile pages (`/api/users/profile/:username`) displaying display name, avatar, bio, follower count, following count, and post count.
  - Interactive profile editing (display name, bio, avatar).
- **Post Publishing & Timeline**:
  - Create posts with real-time character counter (max 500 characters).
  - Chronological user timeline of posts.
  - Authors can permanently delete their own posts (with cascade cleanup of comments).
- **Social Interactions**:
  - **Like/Unlike**: Real-time heart animation with toggle state and likes counter.
  - **Comments**: Threaded conversations with author information, timestamps, and author deletion rights.
  - **Follow/Unfollow**: Asymmetric social graph with atomic followers/following synchronization and live stats.
- **Feeds**:
  - **Home Feed**: Personalized stream consisting of posts from followed users and the user's own posts.
  - **Global Explore Feed**: Live stream of all public posts across the platform.
  - Automatic fallback to explore feed for new accounts with 0 follows so the screen is never blank.
- **Creator Discovery**:
  - Real-time debounced search bar for finding creators by username or name.
  - "Suggested Creators" sidebar widget with instant 1-click follow/unfollow.
- **Design & UX**:
  - Glassmorphic dark theme with refined contrast tokens, radial glow accents, smooth micro-interactions, and accessible native `<dialog>` modals.

---

## 🏗️ Architecture & Best Practices

The codebase is structured using a strict **Layered MVC / Service Architecture**:

```
social-media/
├── src/
│   ├── app.js               # Express application configuration, middleware & SPA routing
│   ├── server.js            # Server entrypoint with graceful shutdown & port binding
│   ├── config/
│   │   ├── env.js           # Centralized environment variable validation
│   │   ├── db.js            # Mongoose connection manager with in-memory fallback
│   │   └── seed.js          # Demo data seeder for users, posts, comments & follows
│   ├── models/
│   │   ├── User.js          # User schema with pre-save password hash & validation
│   │   ├── Post.js          # Post schema with compound indexes & likes
│   │   └── Comment.js       # Comment schema with post indexes & cascade tracking
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication & optionalAuth middleware
│   │   ├── validate.js      # Input payload validators & ObjectId checkers
│   │   ├── errorHandler.js  # Centralized error handler normalizing Mongoose & API errors
│   │   └── notFound.js      # 404 Route handler
│   ├── utils/
│   │   ├── apiError.js      # Custom ApiError class with HTTP status factories
│   │   ├── apiResponse.js   # Standardized { success, statusCode, message, data } builder
│   │   ├── asyncHandler.js  # Async route wrapper for exception forwarding
│   │   └── jwt.js           # Token signing and verification helpers
│   ├── services/
│   │   ├── authService.js   # Authentication business logic
│   │   ├── userService.js   # Profile and follow/unfollow graph logic
│   │   ├── postService.js   # Post creation, likes toggle, and feed aggregation
│   │   └── commentService.js# Comment creation, counts, and authorization logic
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   └── commentController.js
│   └── routes/
│       ├── index.js         # Master API router with healthcheck
│       ├── authRoutes.js    # /api/auth
│       ├── userRoutes.js    # /api/users
│       ├── postRoutes.js    # /api/posts
│       └── commentRoutes.js # /api/comments
├── public/                  # Frontend Single Page App
│   ├── index.html           # Semantic HTML5 layout & accessible dialogs
│   ├── css/
│   │   └── styles.css       # Glassmorphism design tokens & responsive CSS
│   └── js/
│       ├── api.js           # REST API client adapter
│       ├── state.js         # Reactive state container with subscriber events
│       ├── ui.js            # HTML sanitization & DOM component renderer
│       └── app.js           # Application event router & lifecycle controller
└── tests/                   # Automated Integration Test Suite (Node.js Test Runner)
    ├── helpers/
    │   └── testDb.js        # In-memory MongoDB lifecycle helper
    ├── auth.test.js         # 8 tests (Register, Login, Me, Token Auth)
    ├── users.test.js        # 8 tests (Profile, Edit, Follow, Unfollow, Search)
    ├── posts.test.js        # 8 tests (Create, ID, Delete, Like/Unlike, User Timeline)
    ├── comments.test.js     # 5 tests (Add, List, Count Increment, Delete)
    └── feed.test.js         # 3 tests (Personalized Home Feed, Explore, Fallback)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **MongoDB**: (Optional) Standard MongoDB connection or automatic built-in in-memory fallback for local development.

### 2. Installation
```bash
git clone <repo-url>
cd social-media
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/blem
JWT_SECRET=super_secret_blem_jwt_token_key_change_in_production_123456
JWT_EXPIRES_IN=7d
```
*(Note: Port 5050 is selected to prevent port conflicts with macOS AirPlay Receiver on port 5000).*

### 4. Running the Application
```bash
# Start in development mode (with automatic demo data seeding)
npm run dev

# Or start in production mode
npm start
```
Then visit: **http://localhost:5050** in your web browser.

---

## 🧪 Running Automated Tests

BLEM includes **32 comprehensive integration tests** using Node's native test runner (`node:test`, `node:assert/strict`) and `supertest`:

```bash
npm test
```

### Test Coverage Highlights:
- **Authentication**: Registration validation, duplicate rejection, password hashing, login verification, token authorization.
- **Profiles & Social Graph**: Profile inspection, updating profile info, atomic follow/unfollow updates, self-follow prevention.
- **Posts & Likes**: Content length validation, post deletion author checks, toggle like increment/decrement logic.
- **Comments**: Associating comments with posts, incrementing/decrementing cached count, comment deletion authorization.
- **Feed Algorithm**: Ensuring personalized home feed filters only followed authors and self, explore feed contains all public posts.

---

## 📡 RESTful API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login with username/email & password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer Token |

### Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/profile/:username` | Get public profile by username | Optional |
| `PATCH` | `/api/users/profile` | Update own name, bio, avatar | Bearer Token |
| `POST` | `/api/users/:id/follow` | Follow a user | Bearer Token |
| `DELETE` | `/api/users/:id/follow` | Unfollow a user | Bearer Token |
| `GET` | `/api/users/search?q=:query` | Search creators | Optional |

### Posts (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/posts` | Create a new post (max 500 chars) | Bearer Token |
| `GET` | `/api/posts/feed?type=home\|explore` | Get personalized or global feed | Optional |
| `GET` | `/api/posts/user/:userId` | Get timeline of a user | Optional |
| `GET` | `/api/posts/:id` | Get single post details | Optional |
| `DELETE` | `/api/posts/:id` | Delete post (author only) | Bearer Token |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike | Bearer Token |

### Comments (`/api/comments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/comments/post/:postId` | Add comment to post | Bearer Token |
| `GET` | `/api/comments/post/:postId` | Get all comments for a post | Optional |
| `DELETE` | `/api/comments/:id` | Delete comment (author only) | Bearer Token |

---

## 🔒 Security Practices

1. **Password Hashing**: Passwords are encrypted with salt rounds via `bcryptjs` in a Mongoose pre-save lifecycle hook.
2. **Data Sanitization**: Mongoose schemas enforce types, trim strings, and strip passwords from JSON output. Client renders all text using HTML escaping to eliminate XSS risks.
3. **HTTP Security Headers**: Configured with `helmet` and `cors`.
4. **Centralized Error Handling**: Database and runtime errors are trapped in `errorHandler.js` without leaking internal stack traces in production.
