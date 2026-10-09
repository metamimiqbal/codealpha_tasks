# CrewBoard

CrewBoard is a small collaborative project board for teams. It uses static HTML/CSS/vanilla JavaScript, an Express JSON API, and MongoDB through Mongoose.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer (local service or hosted connection string)

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long, random `JWT_SECRET`.
2. Start MongoDB locally, or use a MongoDB Atlas connection string.
3. Run `npm install`.
4. Run `npm start` and open <http://localhost:3000>.

Use `npm run dev` during development for automatic server restarts. The API and static frontend are served by the same process. No frontend build step is needed.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `MONGODB_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | Secret used to sign session JWTs (required) |
| `NODE_ENV` | Set to `production` to enable Secure session cookies |

## API overview

All routes are under `/api`. Success responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "message": "..." } }`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Account and session management |
| GET | `/auth/me` | Current signed-in user |
| PUT | `/users/me` | Update own name, email, or bio |
| GET, POST | `/projects` | List memberships or create a project |
| GET, DELETE | `/projects/:projectId` | View board or (owner only) delete project |
| POST | `/projects/:projectId/members` | Owner adds a registered user by email |
| DELETE | `/projects/:projectId/members/:userId` | Owner removes member and clears their assignments |
| POST | `/projects/:projectId/tasks` | Create task |
| PUT, DELETE | `/tasks/:taskId` | Update or delete task |
| GET, POST | `/tasks/:taskId/comments` | List or add comments |
| PUT, DELETE | `/tasks/:taskId/comments/:commentId` | Edit or delete own comment |

Sessions are JWTs in HttpOnly, SameSite=Lax cookies, so browser JavaScript cannot read the token. Passwords are hashed with bcrypt. Project membership, owner actions, task access, valid assignees, and comment authorship are checked by the API. Data validation is applied on write endpoints.

## MVP behavior

- Project columns are fixed: To Do, In Progress, and Done.
- Tasks have low/medium/high priority, optional due dates, and at most one project-member assignee.
- Project deletion removes its memberships, tasks, and comments. Removing a member clears their assignments but keeps their user record, so existing comment authors remain valid.

## Scope

Real-time sockets and notifications are intentionally omitted until the core MVP is exercised end-to-end. This MVP also omits attachments, custom columns, labels, email notifications, and activity feeds.
