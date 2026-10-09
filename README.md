# CodeAlpha Tasks

CodeAlpha Tasks is a workspace containing three full-stack web application projects built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript. Each project is an independent MVP with its own source code, dependencies, environment configuration, API, and test suite.

## Projects at a Glance

| Project | Overview | Default port |
| --- | --- | ---: |
| [AURA Store](./aura) | Full-stack e-commerce platform with products, carts, checkout, orders, authentication, and admin controls. | `3000` |
| [BLEM](./BLEM) | Mini social media platform with profiles, posts, feeds, likes, comments, follows, and creator discovery. | `5050` |
| [CrewBoard](./crewboard) | Collaborative project board for teams with projects, members, tasks, comments, assignments, and workflow columns. | `3000` |

## Shared Technology

- **Runtime:** Node.js
- **Backend:** Express.js
- **Database:** MongoDB with Mongoose
- **Frontend:** Vanilla HTML5, CSS3, and modern JavaScript
- **Authentication:** JWT-based authentication
- **Testing:** Node.js native test runner and Supertest
- **Development style:** Layered MVC/service-oriented application structure

The projects are intentionally kept as separate applications. Install dependencies and run commands from the project directory you want to work on.

## Project Introductions

### AURA Store

AURA Store is a production-oriented e-commerce MVP for browsing and purchasing products. It includes:

- Product search, category filtering, sorting, pagination, and product details
- Persistent shopping cart management
- Secure checkout with server-side price and inventory validation
- Order history and fulfillment status tracking
- Customer and admin roles protected by JWT authentication
- MongoDB or an automatic in-memory MongoDB fallback for development and tests

See the [AURA Store README](./aura/README.md) for the complete API reference, project structure, demo accounts, environment variables, and test instructions.

### BLEM

BLEM is a mini social media MVP focused on creator profiles and lightweight social interaction. It includes:

- User registration, login, profiles, and profile editing
- Post publishing with author-controlled deletion
- Home and explore feeds
- Like/unlike interactions and comments
- Follow/unfollow relationships and creator search
- A glassmorphic dark-themed vanilla JavaScript interface
- Security middleware, validation, and centralized API error handling

See the [BLEM README](./BLEM/README.md) for its API routes, architecture, environment setup, and test coverage.

### CrewBoard

CrewBoard is a collaborative project management MVP for small teams. It includes:

- User accounts and secure cookie-based JWT sessions
- Project creation, membership management, and owner permissions
- Fixed workflow columns: To Do, In Progress, and Done
- Task creation, editing, deletion, priorities, due dates, and assignments
- Task comments with authorship-based edit and delete permissions
- API validation and access checks for projects, tasks, members, and comments

See the [CrewBoard README](./crewboard/README.md) for setup details, API routes, MVP behavior, and current scope.

## Getting Started

Choose one project and enter its directory:

```bash
cd aura
# or: cd BLEM
# or: cd crewboard
```

Install dependencies:

```bash
npm install
```

Configure environment variables as described in that project's README. The projects generally use MongoDB connection settings and a JWT secret. A local MongoDB service or MongoDB Atlas connection may be required depending on the project.

Start the selected application:

```bash
npm start
```

For development with automatic server restarts:

```bash
npm run dev
```

Then open the local URL shown in the project's README. Because AURA Store and CrewBoard both default to port `3000`, run only one of them at a time unless you change the port configuration.

## Running Tests

Run tests from the selected project directory:

```bash
npm test
```

Each project maintains its own test configuration and test suite. Refer to the project README for the specific behaviors covered.

## Workspace Structure

```text
codealpha_tasks/
├── README.md       # Workspace overview
├── aura/           # AURA Store e-commerce application
├── BLEM/           # BLEM social media application
└── crewboard/      # CrewBoard collaboration application
```

## Development Notes

- Do not share environment files or secrets between projects unless explicitly intended.
- Keep project-specific dependency installation and scripts scoped to the relevant folder.
- Use strong, unique JWT secrets outside local development.
- Do not commit `.env` files or other credentials.
