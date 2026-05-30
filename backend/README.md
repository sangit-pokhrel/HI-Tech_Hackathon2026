# Bun Super Fast MongoDB Backend Template

A high-performance, developer-friendly backend template powered by **Bun**, featuring **Elysia.js** (the fastest Bun web framework) and **MongoDB** connected via **Mongoose**. 

This template has **no authentication gates**, leaving all API CRUD operations fully open.

## Tech Stack
* **Runtime**: [Bun](https://bun.sh)
* **Web Framework**: [Elysia.js](https://elysiajs.com)
* **Database & ODM**: [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com)
* **API Documentation**: `@elysiajs/swagger` (OpenAPI specification)
* **Middleware**: `@elysiajs/cors`

## Quick Start

### 1. Pre-requisites
Ensure you have **MongoDB** running locally on your system, standard URI `mongodb://127.0.0.1:27017/nagarikcredits`.

### 2. Install Dependencies
```bash
bun install
```

### 3. Configure Environment Variables
Copy `.env.example` into a new `.env` file:
```bash
cp .env.example .env
```

### 4. Start Development Server
```bash
bun run dev
```

The server will boot at `http://localhost:3000`.

### 5. Interactive Swagger Documentation
Open your browser and navigate to:
```
http://localhost:3000/swagger
```
Here, you can test and explore all the endpoints interactively.

---

## Directory Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── db.ts          # MongoDB client connection wrapper
│   │   └── schema.ts      # Mongoose User schema definition
│   ├── routes/
│   │   └── user.routes.ts # Open CRUD endpoints
│   └── index.ts           # Main entry point (middleware, Swagger config)
├── tsconfig.json          # TypeScript config optimized for Bun
└── package.json           # Scripts and dependencies
```

---

## Available NPM Scripts
* `bun run dev` - Starts the development server with hot-reloading active.
* `bun run build` - Compiles the TypeScript application into Bun-target production bundle under `dist/`.

---

## Open API Documentation Reference

All routes are fully open with **no authentication or headers** required.

### Users CRUD Endpoints

#### `POST /users`
Creates a new user profile.
* **Body Schema**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 28,
    "bio": "Developer"
  }
  ```

#### `GET /users`
Retrieves a list of all users, sorted by creation date (newest first).
* **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6a195aecfe7fe43f1c2681e1",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "age": 28,
        "bio": "Developer",
        "createdAt": "2026-05-29T09:00:00.000Z",
        "updatedAt": "2026-05-29T09:00:00.000Z"
      }
    ]
  }
  ```

#### `GET /users/:id`
Retrieves user details by MongoDB Document ID.

#### `PUT /users/:id`
Updates fields on a user profile. Supports partial updates.
* **Body Schema**:
  ```json
  {
    "bio": "Lead Developer",
    "age": 29
  }
  ```

#### `DELETE /users/:id`
Permanently removes the user profile.
