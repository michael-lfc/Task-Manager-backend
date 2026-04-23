# ✦ Aurum — Project Intelligence Platform

> A sophisticated full-stack project and task management platform built with the MERN stack and TypeScript. Aurum provides teams with real-time collaboration, Kanban task management, analytics, and WebSocket-powered notifications.

---

## 🌐 Live API

```
https://task-manager-backend-dbdx.onrender.com
```

**Health Check:**
```
GET https://task-manager-backend-dbdx.onrender.com/health
```

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22 |
| Framework | Express 5.2.1 |
| Language | TypeScript 5.9 |
| Database | MongoDB Atlas + Mongoose 9 |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod |
| Password Hashing | bcryptjs |
| Real-time | WebSocket (Socket.io) |
| Logging | Winston |
| Dev Server | tsx watch |
| Build | tsc |

---

## 📁 Project Structure

```
backend/
├── .env.example
├── package.json
├── tsconfig.json
├── render.yaml
│
└── src/
    ├── server.ts
    │
    ├── config/
    │   └── db.ts                      # MongoDB connection
    │
    ├── models/
    │   ├── User.ts                    # User schema + bcrypt hooks
    │   ├── Project.ts                 # Project schema + virtuals
    │   ├── Task.ts                    # Task schema + comment sub-docs
    │   └── Notification.ts            # Notification schema
    │
    ├── validators/
    │   ├── auth.validator.ts          # Zod schemas for auth
    │   ├── project.validator.ts       # Zod schemas for projects
    │   └── task.validator.ts          # Zod schemas for tasks
    │
    ├── services/
    │   ├── authService.ts             # Auth business logic
    │   ├── projectService.ts          # Project business logic
    │   ├── taskService.ts             # Task business logic
    │   ├── analyticsService.ts        # Aggregation pipelines
    │   └── notificationService.ts     # Notification engine
    │
    ├── controllers/
    │   ├── authController.ts
    │   ├── projectController.ts
    │   ├── taskController.ts
    │   ├── analyticsController.ts
    │   └── notificationController.ts
    │
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── project.routes.ts
    │   ├── task.routes.ts
    │   ├── analytics.routes.ts
    │   ├── notification.routes.ts
    │   └── index.ts
    │
    ├── middleware/
    │   ├── auth.ts                    # JWT protect + restrictTo
    │   ├── errorHandler.ts            # Global error handler
    │   └── validate.ts                # Zod validation middleware
    │
    ├── types/
    │   ├── express.d.ts               # Express.Request augmentation
    │   ├── index.ts                   # Shared TS types and DTOs
    │   └── notification.types.ts      # Notification type definitions
    │
    └── utils/
        ├── appError.ts                # AppError class + asyncHandler
        ├── jwt.ts                     # signToken + verifyToken
        └── logger.ts                  # Winston logger
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- MongoDB Atlas account
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aurum-backend.git
cd aurum-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/aurum?retryWrites=true&w=majority
JWT_SECRET=generate_with_node_crypto_randomBytes_32
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

Generate a secure `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Protected | Get current user profile |
| PATCH | `/auth/me` | Protected | Update current user profile |

**Register:**
```json
POST /api/v1/auth/register
{
  "name":     "Michael Agwogie",
  "email":    "michael@example.com",
  "password": "password123"
}
```

**Login:**
```json
POST /api/v1/auth/login
{
  "email":    "michael@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user":  { "name": "Michael Adeyemi", "email": "...", "role": "member" },
    "token": "eyJhbGci..."
  }
}
```

---

### Projects

All project routes require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | Get all your projects (paginated) |
| POST | `/projects` | Create a new project |
| GET | `/projects/:id` | Get single project |
| PATCH | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/members/:memberId` | Add member to project |
| DELETE | `/projects/:id/members/:memberId` | Remove member from project |

**Create Project:**
```json
POST /api/v1/projects
{
  "title":       "TalentFlow LMS",
  "description": "Unified learning management platform",
  "priority":    "high",
  "color":       "#c9a84c",
  "status":      "active",
  "dueDate":     "2025-06-01T00:00:00.000Z"
}
```

**Query Parameters for GET /projects:**
```
?page=1&limit=10&sort=-createdAt&search=talentflow
```

---

### Tasks

All task routes require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a new task |
| GET | `/tasks/project/:projectId` | Get all tasks for a project |
| GET | `/tasks/:id` | Get single task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| PATCH | `/tasks/:id/reorder` | Drag and drop reorder |
| POST | `/tasks/:id/comments` | Add a comment |
| DELETE | `/tasks/:id/comments/:commentId` | Delete a comment |

**Create Task:**
```json
POST /api/v1/tasks
{
  "title":           "Build auth middleware",
  "project":         "64f1a2b3c4d5e6f7a8b9c0d1",
  "priority":        "high",
  "status":          "todo",
  "estimatedHours":  4,
  "dueDate":         "2025-02-01T00:00:00.000Z"
}
```

**Reorder Task (Kanban drag and drop):**
```json
PATCH /api/v1/tasks/:id/reorder
{
  "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "status":    "in-progress",
  "position":  2
}
```

---

### Analytics

All analytics routes require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Summary stats + weekly chart data |
| GET | `/analytics/projects` | Per project breakdown with task counts |
| GET | `/analytics/team` | Team member performance metrics |
| GET | `/analytics/tasks` | Task breakdown by status and priority |

---

### Notifications

All notification routes require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Get all notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete a notification |

---

## 🔌 WebSocket Events

Connect with:
```js
const socket = io('https://aurum-backend.onrender.com', {
  auth: { token: 'your_jwt_token' }
})
```

### Events the Client Listens To

| Event | Payload | Description |
|---|---|---|
| `notification:new` | `{ notification }` | New notification received |
| `task:updated` | `{ task }` | A task was updated |
| `task:created` | `{ task }` | A new task was created |
| `project:updated` | `{ project }` | A project was updated |

### Events the Client Emits

| Event | Payload | Description |
|---|---|---|
| `join:project` | `{ projectId }` | Join a project room |
| `leave:project` | `{ projectId }` | Leave a project room |

---

## 🛡️ Security

- **JWT Authentication** — all protected routes require a valid Bearer token
- **Password Hashing** — bcryptjs with 12 salt rounds
- **Helmet** — secure HTTP headers
- **CORS** — restricted to `CLIENT_URL`
- **NoSQL Sanitization** — strips `$` and `.` from request bodies
- **Custom Rate Limiting** — 100 requests per 15 minutes per IP
- **Zod Validation** — all request bodies validated before hitting services
- **Role-based Access** — `admin`, `member`, `viewer` roles enforced at route level

---

## 🗃️ Data Models

### User
```
name, email, password (hashed), avatar, role, isActive, lastSeen
```

### Project
```
title, description, status, priority, color, owner, members[],
tags[], dueDate, progress (0-100), budget, spent
```
**Virtuals:** `budgetUtilization`, `isOverdue`

### Task
```
title, description, status, priority, project, assignee, reporter,
tags[], dueDate, estimatedHours, loggedHours, comments[], position
```
**Virtuals:** `isOverdue`, `commentCount`

### Notification
```
recipient, sender, type, title, message, read, link, metadata
```

---

## ⚙️ Architecture

```
Request
   ↓
Express Router          → matches route, runs middleware
   ↓
Zod Validator           → validates req.body / params
   ↓
Auth Middleware          → verifies JWT, attaches req.user
   ↓
Controller              → extracts req data, calls service
   ↓
Service                 → business logic, DB queries, error throwing
   ↓
Mongoose Model          → talks to MongoDB Atlas
   ↓
Response                → consistent { status, data } shape
```

**Error Flow:**
```
Service throws AppError
   ↓
asyncHandler catches → next(err)
   ↓
Global errorHandler
   ↓
Development: full stack trace
Production:  clean message only
```

---

## 🧪 Testing with Thunder Client

Import this collection to test all endpoints:

1. Register a user → copy the token
2. Add token to Auth header: `Bearer <token>`
3. Create a project → copy the `_id`
4. Create tasks using the project `_id`
5. Test analytics endpoints

---

## 🚢 Deployment

Deployed on **Render** with auto-deploy on push to `main`.

### Re-deploy Manually
```bash
git add .
git commit -m "feat: your change"
git push origin main
# Render detects push and redeploys automatically
```

### Environment Variables on Render
Set these in Render Dashboard → Environment:
```
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
NODE_ENV
PORT
```

---

## 📜 Scripts

```bash
npm run dev      # tsx watch — development with hot reload
npm run build    # tsc — compile TypeScript to dist/
npm start        # node dist/server.js — production
```

---

## 👤 Author

**Michael Agwogie**
Backend Developer · Trueminds Innovation (TS Academy, Phoenix Cohort)

---

## 📄 License

MIT
