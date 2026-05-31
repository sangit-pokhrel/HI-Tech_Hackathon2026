# Nagarik Credits Fast MongoDB Backend Template

A high-performance, developer-friendly backend template powered by **Bun**, featuring **Elysia.js** (the fastest Bun web framework) and **MongoDB** connected via **Mongoose**. 

All endpoints are fully open (no authentication required) to support fast fintech prototype iterations.

## Tech Stack
* **Runtime**: [Bun](https://bun.sh)
* **Web Framework**: [Elysia.js](https://elysiajs.com)
* **Database & ODM**: [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com)
* **API Documentation**: `@elysiajs/swagger` (OpenAPI specification)
* **Middleware**: `@elysiajs/cors`

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` into a new `.env` file and set your `MONGODB_URI`:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Start Development Server
```bash
bun run dev
```
The server will boot at `http://localhost:3000`.

### 4. Interactive Swagger Documentation
Open your browser and navigate to:
```
http://localhost:3000/swagger
```
Here, you can test and explore all the endpoints interactively.

---

## Directory Structure
```
backend/
└── src/
    ├── db/
    │   ├── db.ts          # MongoDB client connection wrapper
    │   └── schema.ts      # Mongoose Schemas (Merchant, Customer, Transaction, UtilityPayment, WalletActivity)
    ├── controllers/
    │   ├── merchant.controller.ts  # CRUD logical handlers for Merchants
    │   └── customer.controller.ts  # CRUD logical handlers for Customers
    ├── routes/
    │   ├── merchant.routes.ts      # Merchant endpoint routers
    │   └── customer.routes.ts      # Customer endpoint routers
    └── index.ts           # Main entry point (middleware, Swagger config)
```

---

## Open API Endpoints Reference

### Merchants API (`/api/merchants`)
* `POST /api/merchants` - Create a new merchant profile.
* `GET /api/merchants` - Fetch all merchants.
* `GET /api/merchants/:id` - Fetch specific merchant details by ID.
* `PUT /api/merchants/:id` - Update specific merchant details by ID.
* `DELETE /api/merchants/:id` - Remove merchant by ID.

### Customers API (`/api/customers`)
* `POST /api/customers` - Create a new customer profile.
* `GET /api/customers` - Fetch all customers.
* `GET /api/customers/:id` - Fetch specific customer details by ID.
* `PUT /api/customers/:id` - Update customer by ID.
* `DELETE /api/customers/:id` - Remove customer by ID.
